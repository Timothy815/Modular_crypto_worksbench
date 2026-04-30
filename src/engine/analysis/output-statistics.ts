// Output statistics engine — pure computation, no UI or project dependencies.
// Called from the cryptanalysis panel after the sweep runner collects observations.

// ── Math helpers ──────────────────────────────────────────────────────────────

/**
 * erfc approximation (Abramowitz & Stegun 7.1.26).
 * Max error ≤ 1.5 × 10⁻⁷ — more than adequate for classroom p-values.
 */
function erfc(x: number): number {
  const t = 1.0 / (1.0 + 0.3275911 * Math.abs(x));
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const result = poly * Math.exp(-x * x);
  return x >= 0 ? result : 2.0 - result;
}

/**
 * Incomplete gamma function approximation for chi-squared p-value.
 * Uses the regularized upper incomplete gamma: P(chi2, df) = 1 - gammainc(df/2, chi2/2).
 * Series expansion — accurate for classroom-scale values (df ≤ 256).
 */
function chiSquaredPValue(chi2: number, df: number): number {
  if (chi2 <= 0 || df <= 0) return 1.0;
  // Use Wilson–Hilferty normal approximation for large df
  const k = df / 2;
  const x = chi2 / 2;
  // Log of incomplete gamma upper tail via continued fraction (Lentz)
  // For simplicity use the normal approximation which is accurate for df >= 5
  const z = Math.pow(x / k, 1 / 3) - (1 - 1 / (9 * k));
  const sigma = Math.sqrt(1 / (9 * k));
  if (sigma <= 0) return 0;
  return 0.5 * erfc(z / (sigma * Math.SQRT2));
}

function bitsToNatural(bits: number[]): number {
  if (bits.length > 30) {
    return bits
      .slice(0, 30)
      .reduce((acc, bit) => (acc << 1) | (bit ? 1 : 0), 0) >>> 0;
  }
  return bits.reduce((acc, bit) => (acc << 1) | (bit ? 1 : 0), 0) >>> 0;
}

/**
 * Flatten observations into a byte stream (8-bit chunks).
 * Used for wide outputs (>30 bits) where word-level analysis is not meaningful.
 * Each 128-bit observation yields 16 byte values; 128 observations → 2048 bytes.
 */
function extractByteStream(observations: number[][]): number[] {
  const bytes: number[] = [];
  for (const obs of observations) {
    for (let i = 0; i + 7 < obs.length; i += 8) {
      let byte = 0;
      for (let b = 0; b < 8; b++) byte = (byte << 1) | (obs[i + b] ?? 0);
      bytes.push(byte >>> 0);
    }
  }
  return bytes;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface BitBalanceStats {
  totalBits: number;
  onesFraction: number;
  perPositionFractions: number[];
  monobitPValue: number;
  sampleValid: boolean;
  validity: 'valid' | 'low-sample';
}

export interface ByteEntropyStats {
  /** Shannon entropy in bits per output unit (max = outputWidth for uniform). */
  shannonEntropy: number;
  /** Normalized: shannonEntropy / outputWidth. 1.0 = perfect uniform. */
  entropyFraction: number;
  uniqueValueCount: number;
  uniqueValueFraction: number;
  sampleValid: boolean;
  validity: 'valid' | 'low-sample';
}

export interface ByteFrequencyStats {
  bucketCount: number;
  /** naturalRange / bucketCount — how many distinct values map to one bucket. */
  bucketDivisor: number;
  bucketMode: 'full-range' | 'coarse';
  counts: number[];
  expectedCount: number;
  chiSquared: number;
  degreesOfFreedom: number;
  chiSquaredPValue: number;
  sampleValid: boolean;
  validity: 'valid' | 'coarse-buckets' | 'low-sample';
  maxDeviationBucket: number;
  maxDeviationFraction: number;
}

export interface CorrelationStats {
  /** gridSize × gridSize hit counts: grid[row][col] = count of (col, row) consecutive pairs. */
  scatterGrid: number[][];
  gridSize: number;
  /** naturalRange / gridSize — how many values map to one axis bucket. */
  bucketDivisor: number;
  serialCorrelationCoefficient: number;
  hasLinearStructure: boolean;
  valuePairs: number;
  sampleValid: boolean;
  validity: 'valid' | 'low-sample';
}

export interface RunsStats {
  totalBits: number;
  piOnes: number;
  prerequisitePasses: boolean;
  totalRuns: number;
  expectedRuns: number;
  runsTestPValue: number;
  /** Index 0 = runs of length 1, index 7 = runs of length 8+. */
  runLengthCounts: number[];
  expectedRunLengthCounts: number[];
  sampleValid: boolean;
  validity: 'valid' | 'low-sample' | 'prerequisite-failed';
}

export type ProfileLabel =
  | 'limited evidence'
  | 'near-uniform sample'
  | 'mixed sample'
  | 'visible structure'
  | 'strong structure';

export interface OutputStatistics {
  outputWidth: number;
  observationCount: number;
  sampleKind: 'exhaustive' | 'sampled' | 'bit-flip';
  keyDependencyConfirmed: boolean | null;
  /** True when outputWidth > 30: entropy/frequency/scatter operate at byte granularity. */
  isWideOutput: boolean;
  analysisUnitWidth: number;
  analysisUnitLabel: 'output value' | 'projected byte';
  bitBalance: BitBalanceStats;
  byteEntropy: ByteEntropyStats;
  byteFrequency: ByteFrequencyStats;
  correlation: CorrelationStats;
  runs: RunsStats;
  profileLabel: ProfileLabel;
}

// ── Bit balance ───────────────────────────────────────────────────────────────

export function computeBitBalance(
  allBits: number[],
  outputWidth: number,
  observations: number[][],
): BitBalanceStats {
  const totalBits = allBits.length;
  const ones = allBits.filter((b) => b === 1).length;
  const zeros = totalBits - ones;
  const onesFraction = totalBits > 0 ? ones / totalBits : 0;

  // Per-position fractions across observations
  const perPositionFractions: number[] = [];
  for (let pos = 0; pos < outputWidth; pos += 1) {
    const posOnes = observations.filter((obs) => obs[pos] === 1).length;
    perPositionFractions.push(observations.length > 0 ? posOnes / observations.length : 0);
  }

  // NIST SP 800-22 §2.1: s_obs = |ones - zeros| / sqrt(n), p = erfc(s_obs / sqrt(2))
  const monobitPValue =
    totalBits > 0 ? erfc(Math.abs(ones - zeros) / Math.sqrt(2 * totalBits)) : 0;

  return {
    totalBits,
    onesFraction,
    perPositionFractions,
    monobitPValue,
    sampleValid: totalBits >= 1000,
    validity: totalBits >= 1000 ? 'valid' : 'low-sample',
  };
}

// ── Entropy ───────────────────────────────────────────────────────────────────

export function computeByteEntropy(
  naturalValues: number[],
  outputWidth: number,
): ByteEntropyStats {
  const n = naturalValues.length;
  if (n === 0) {
    return {
      shannonEntropy: 0,
      entropyFraction: 0,
      uniqueValueCount: 0,
      uniqueValueFraction: 0,
      sampleValid: false,
      validity: 'low-sample',
    };
  }

  const counts = new Map<number, number>();
  for (const v of naturalValues) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / n;
    entropy -= p * Math.log2(p);
  }

  const naturalRange = Math.min(Math.pow(2, outputWidth), 65536);
  const uniqueValueCount = counts.size;

  return {
    shannonEntropy: entropy,
    entropyFraction: outputWidth > 0 ? entropy / outputWidth : 0,
    uniqueValueCount,
    uniqueValueFraction: naturalRange > 0 ? uniqueValueCount / naturalRange : 0,
    sampleValid: n >= 32,
    validity: n >= 32 ? 'valid' : 'low-sample',
  };
}

// ── Byte frequency ────────────────────────────────────────────────────────────

export function computeByteFrequency(
  naturalValues: number[],
  outputWidth: number,
): ByteFrequencyStats {
  const n = naturalValues.length;
  if (n === 0) {
    return {
      bucketCount: 16,
      bucketDivisor: 1,
      bucketMode: 'coarse',
      counts: new Array(16).fill(0),
      expectedCount: 0,
      chiSquared: 0,
      degreesOfFreedom: 15,
      chiSquaredPValue: 1,
      sampleValid: false,
      validity: 'low-sample',
      maxDeviationBucket: 0,
      maxDeviationFraction: 0,
    };
  }

  const naturalRange = Math.min(Math.pow(2, outputWidth), 65536);

  // Choose bucket count: use full range if small enough; else fall back to coarse buckets
  let bucketCount: number;
  let bucketDivisor: number;
  let bucketMode: 'full-range' | 'coarse';

  if (naturalRange <= 16) {
    // 4-bit or narrower: direct buckets
    bucketCount = naturalRange;
    bucketDivisor = 1;
    bucketMode = 'full-range';
  } else if (n / 256 >= 5 && naturalRange >= 256) {
    // Enough observations for 256 buckets
    bucketCount = 256;
    bucketDivisor = Math.ceil(naturalRange / 256);
    bucketMode = 'full-range';
  } else {
    // Fall back to 16 coarse buckets
    bucketCount = 16;
    bucketDivisor = Math.ceil(naturalRange / 16);
    bucketMode = 'coarse';
  }

  const counts = new Array<number>(bucketCount).fill(0);
  for (const v of naturalValues) {
    const bucket = Math.min(Math.floor(v / bucketDivisor), bucketCount - 1);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
  }

  const expectedCount = n / bucketCount;
  const sampleValid = expectedCount >= 5;

  let chiSquared = 0;
  let maxDeviationBucket = 0;
  let maxDeviation = 0;
  if (expectedCount > 0) {
    for (let i = 0; i < bucketCount; i += 1) {
      const diff = (counts[i] ?? 0) - expectedCount;
      chiSquared += (diff * diff) / expectedCount;
      const deviation = Math.abs(diff) / expectedCount;
      if (deviation > maxDeviation) {
        maxDeviation = deviation;
        maxDeviationBucket = i;
      }
    }
  }

  const df = bucketCount - 1;
  const pValue = sampleValid ? chiSquaredPValue(chiSquared, df) : 1;

  return {
    bucketCount,
    bucketDivisor,
    bucketMode,
    counts,
    expectedCount,
    chiSquared,
    degreesOfFreedom: df,
    chiSquaredPValue: pValue,
    sampleValid,
    validity: sampleValid ? (bucketMode === 'coarse' ? 'coarse-buckets' : 'valid') : 'low-sample',
    maxDeviationBucket,
    maxDeviationFraction: maxDeviation,
  };
}

// ── Correlation ───────────────────────────────────────────────────────────────

export function computeCorrelation(
  naturalValues: number[],
  outputWidth: number,
): CorrelationStats {
  const n = naturalValues.length;
  const pairs = n - 1;

  const naturalRange = Math.min(Math.pow(2, outputWidth), 65536);
  const gridSize = naturalRange <= 16 ? naturalRange : 16;
  const bucketDivisor = Math.ceil(naturalRange / gridSize);

  // Build scatter grid
  const scatterGrid: number[][] = Array.from({ length: gridSize }, () =>
    new Array<number>(gridSize).fill(0),
  );

  if (pairs >= 1) {
    for (let i = 0; i < pairs; i += 1) {
      const xVal = naturalValues[i] ?? 0;
      const yVal = naturalValues[i + 1] ?? 0;
      const col = Math.min(Math.floor(xVal / bucketDivisor), gridSize - 1);
      const row = Math.min(Math.floor(yVal / bucketDivisor), gridSize - 1);
      scatterGrid[row]![col] = (scatterGrid[row]![col] ?? 0) + 1;
    }
  }

  // Serial correlation coefficient (Pearson r on consecutive values)
  let scc = 0;
  if (pairs >= 2) {
    const xs = naturalValues.slice(0, pairs);
    const ys = naturalValues.slice(1, pairs + 1);
    const meanX = xs.reduce((s, x) => s + x, 0) / pairs;
    const meanY = ys.reduce((s, y) => s + y, 0) / pairs;
    let cov = 0;
    let varX = 0;
    let varY = 0;
    for (let i = 0; i < pairs; i += 1) {
      const dx = (xs[i] ?? 0) - meanX;
      const dy = (ys[i] ?? 0) - meanY;
      cov += dx * dy;
      varX += dx * dx;
      varY += dy * dy;
    }
    if (varX > 0 && varY > 0) {
      scc = cov / Math.sqrt(varX * varY);
    }
  }

  return {
    scatterGrid,
    gridSize,
    bucketDivisor,
    serialCorrelationCoefficient: scc,
    hasLinearStructure: Math.abs(scc) > 0.1,
    valuePairs: pairs,
    sampleValid: pairs >= 128,
    validity: pairs >= 128 ? 'valid' : 'low-sample',
  };
}

// ── Runs test ─────────────────────────────────────────────────────────────────

export function computeRunsUniformity(allBits: number[]): RunsStats {
  const n = allBits.length;
  if (n === 0) {
    return {
      totalBits: 0,
      piOnes: 0,
      prerequisitePasses: false,
      totalRuns: 0,
      expectedRuns: 0,
      runsTestPValue: 0,
      runLengthCounts: new Array(8).fill(0),
      expectedRunLengthCounts: new Array(8).fill(0),
      sampleValid: false,
      validity: 'low-sample',
    };
  }

  const ones = allBits.filter((b) => b === 1).length;
  const piOnes = ones / n;

  // NIST SP 800-22 §2.3 prerequisite: |pi - 0.5| < 2 / sqrt(n)
  const prerequisitePasses = Math.abs(piOnes - 0.5) < 2 / Math.sqrt(n);

  // Count total runs and run lengths
  let totalRuns = 1;
  const runLengthBuckets = new Array<number>(8).fill(0);
  let currentRunLength = 1;

  for (let i = 1; i < n; i += 1) {
    if (allBits[i] === allBits[i - 1]) {
      currentRunLength += 1;
    } else {
      const bucket = Math.min(currentRunLength - 1, 7);
      runLengthBuckets[bucket] = (runLengthBuckets[bucket] ?? 0) + 1;
      totalRuns += 1;
      currentRunLength = 1;
    }
  }
  // Final run
  const lastBucket = Math.min(currentRunLength - 1, 7);
  runLengthBuckets[lastBucket] = (runLengthBuckets[lastBucket] ?? 0) + 1;

  // Expected runs
  const expectedRuns = 2 * n * piOnes * (1 - piOnes);

  // NIST runs test p-value
  let runsTestPValue = 0;
  if (prerequisitePasses && expectedRuns > 0) {
    const numerator = Math.abs(totalRuns - expectedRuns);
    const denominator = 2 * Math.sqrt(2 * n) * piOnes * (1 - piOnes);
    if (denominator > 0) {
      runsTestPValue = erfc(numerator / denominator);
    }
  }

  // Expected run length counts under geometric distribution: E[runs of length k] ≈ n / 2^(k+1)
  const expectedRunLengthCounts = Array.from({ length: 8 }, (_, k) => {
    if (k < 7) {
      return n / Math.pow(2, k + 1);
    }
    // Length 8+: 1 - sum(1/2^k for k=1..7) = 1/128
    return n / 128;
  });

  return {
    totalBits: n,
    piOnes,
    prerequisitePasses,
    totalRuns,
    expectedRuns,
    runsTestPValue,
    runLengthCounts: runLengthBuckets,
    expectedRunLengthCounts,
    sampleValid: n >= 1000 && prerequisitePasses,
    validity: !prerequisitePasses ? 'prerequisite-failed' : n >= 1000 ? 'valid' : 'low-sample',
  };
}

// ── Profile label ─────────────────────────────────────────────────────────────

function deriveProfileLabel(
  keyDependencyConfirmed: boolean | null,
  bitBalance: BitBalanceStats,
  byteEntropy: ByteEntropyStats,
  byteFrequency: ByteFrequencyStats,
  correlation: CorrelationStats,
  runs: RunsStats,
): ProfileLabel {
  if (keyDependencyConfirmed === false) {
    return 'strong structure';
  }

  // Severity per test: 0=invalid, 1=pass, 2=mild, 3=structured, 4=highly-structured
  function balanceSeverity(): number {
    if (!bitBalance.sampleValid) return 0;
    const p = bitBalance.monobitPValue;
    if (p < 0.001) return 4;
    if (p < 0.01) return 3;
    if (p < 0.05) return 2;
    return 1;
  }

  function entropySeverity(): number {
    if (!byteEntropy.sampleValid) return 0;
    const f = byteEntropy.entropyFraction;
    if (f < 0.5) return 4;
    if (f < 0.7) return 3;
    if (f < 0.85) return 2;
    return 1;
  }

  function frequencySeverity(): number {
    if (!byteFrequency.sampleValid) return 0;
    const p = byteFrequency.chiSquaredPValue;
    if (p < 0.001) return 4;
    if (p < 0.01) return 3;
    if (p < 0.05) return 2;
    return 1;
  }

  function correlationSeverity(): number {
    if (!correlation.sampleValid) return 0;
    const r = Math.abs(correlation.serialCorrelationCoefficient);
    if (r > 0.5) return 4;
    if (r > 0.2) return 3;
    if (r > 0.1) return 2;
    return 1;
  }

  function runsSeverity(): number {
    if (!runs.sampleValid) return 0;
    const p = runs.runsTestPValue;
    if (p < 0.001) return 4;
    if (p < 0.01) return 3;
    if (p < 0.05) return 2;
    return 1;
  }

  const maxSeverity = Math.max(
    balanceSeverity(),
    entropySeverity(),
    frequencySeverity(),
    correlationSeverity(),
    runsSeverity(),
  );
  const validTestCount = [bitBalance.sampleValid, byteEntropy.sampleValid, byteFrequency.sampleValid, correlation.sampleValid, runs.sampleValid].filter(Boolean).length;

  if (validTestCount < 2) return 'limited evidence';

  if (maxSeverity >= 4) return 'strong structure';
  if (maxSeverity >= 3) return 'visible structure';
  if (maxSeverity >= 2) return 'mixed sample';
  return 'near-uniform sample';
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function computeOutputStatistics(
  observations: number[][],
  outputWidth: number,
  sampleKind: 'exhaustive' | 'sampled' | 'bit-flip',
  keyDependencyConfirmed: boolean | null,
): OutputStatistics {
  const allBits = observations.flat();
  const effectiveOutputWidth = outputWidth > 0 ? outputWidth : 1;

  // For wide outputs (>30 bits per word) the word-level integer representation overflows.
  // Instead we flatten each observation into its individual bytes (8-bit chunks) and run
  // entropy/frequency/correlation at byte granularity — exactly what the PRNG scatter
  // plots do. 128 bit-flip variants × 16 bytes = 2 048 byte values: enough for clear visuals.
  const isWide = effectiveOutputWidth > 30;
  const naturalValues = isWide
    ? extractByteStream(observations)
    : observations.map((obs) => bitsToNatural(obs));
  const analysisWidth = isWide ? 8 : effectiveOutputWidth;

  const bitBalance = computeBitBalance(allBits, effectiveOutputWidth, observations);
  const byteEntropy = computeByteEntropy(naturalValues, analysisWidth);
  const byteFrequency = computeByteFrequency(naturalValues, analysisWidth);
  const correlation = computeCorrelation(naturalValues, analysisWidth);
  const runs = computeRunsUniformity(allBits);

  const profileLabel = deriveProfileLabel(
    keyDependencyConfirmed,
    bitBalance,
    byteEntropy,
    byteFrequency,
    correlation,
    runs,
  );

  return {
    outputWidth: effectiveOutputWidth,
    observationCount: observations.length,
    sampleKind,
    keyDependencyConfirmed,
    isWideOutput: isWide,
    analysisUnitWidth: analysisWidth,
    analysisUnitLabel: isWide ? 'projected byte' : 'output value',
    bitBalance,
    byteEntropy,
    byteFrequency,
    correlation,
    runs,
    profileLabel,
  };
}

// ── Narrative summary ─────────────────────────────────────────────────────────

export function generateNarrativeSummary(
  stats: OutputStatistics,
): string {
  if (stats.keyDependencyConfirmed === false) {
    return (
      'The output does not change when the key changes. ' +
      'The statistical tests below describe the output distribution, but a cipher whose output ' +
      'is independent of the key provides no confidentiality regardless of how uniform the ' +
      'distribution appears. Check that the key module is connected to the cipher path.'
    );
  }

  // Collect failing test descriptions for the narrative
  const failures: string[] = [];

  if (stats.bitBalance.sampleValid && stats.bitBalance.monobitPValue < 0.05) {
    const pct = (stats.bitBalance.onesFraction * 100).toFixed(1);
    failures.push(
      `bit balance is skewed (${pct}% ones, monobit p=${stats.bitBalance.monobitPValue.toFixed(3)})`,
    );
  }

  if (stats.byteEntropy.sampleValid && stats.byteEntropy.entropyFraction < 0.85) {
    const bits = stats.byteEntropy.shannonEntropy.toFixed(2);
    const maxBits = stats.outputWidth.toFixed(0);
    failures.push(`entropy is ${bits} bits per output (below the ${maxBits}-bit maximum)`);
  }

  if (stats.byteFrequency.sampleValid && stats.byteFrequency.chiSquaredPValue < 0.05) {
    failures.push(
      `byte frequency distribution fails chi-squared (p=${stats.byteFrequency.chiSquaredPValue.toFixed(3)})`,
    );
  }

  if (stats.correlation.sampleValid && stats.correlation.hasLinearStructure) {
    const r = stats.correlation.serialCorrelationCoefficient.toFixed(3);
    failures.push(`consecutive outputs are linearly correlated (r=${r})`);
  }

  if (stats.runs.sampleValid && stats.runs.runsTestPValue < 0.05) {
    failures.push(
      `run lengths deviate from the expected geometric distribution (p=${stats.runs.runsTestPValue.toFixed(3)})`,
    );
  }

  const n = stats.observationCount;
  const kind = stats.sampleKind === 'exhaustive' ? `all ${n} possible inputs` : `${n} sampled inputs`;
  const keyNote =
    stats.keyDependencyConfirmed === true
      ? ' Key dependency was confirmed — the output changes with the key.'
      : '';
  const projectionNote = stats.isWideOutput
    ? ' Wide outputs were projected into byte-sized units for the frequency, entropy, and correlation sections, so those sections describe byte-level structure rather than the full output word as one symbol.'
    : '';

  if (failures.length === 0) {
    return (
      `Across ${kind}, this sample looks near-uniform on the tests that were valid enough to run.` +
      ' Byte frequencies are fairly flat, bit positions show no obvious strong bias, consecutive values ' +
      'do not show strong linear dependence, and observed run lengths are not obviously unusual.' +
      keyNote +
      projectionNote +
      ' This is descriptive evidence only. It does not prove cryptographic randomness, unpredictability, or cipher strength.'
    );
  }

  if (failures.length === 1) {
    return (
      `Across ${kind}, most valid measures look near-uniform, but one anomaly stands out: ` +
      `${failures[0]}. This pattern would be unusual for a truly random source and may indicate ` +
      'visible structure in the observed sample.' + keyNote + projectionNote +
      ' This is still not a security verdict.'
    );
  }

  const listed = failures.slice(0, -1).join('; ') + '; and ' + failures[failures.length - 1];
  return (
    `Across ${kind}, the output shows multiple statistical deviations: ${listed}. ` +
    'Together they suggest visible structure in this observed sample.' + keyNote + projectionNote +
    ' That is useful comparative evidence, not proof of attack practicality by itself.'
  );
}
