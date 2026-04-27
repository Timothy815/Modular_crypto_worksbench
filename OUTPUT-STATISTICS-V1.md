# Output Statistics Visualization V1

Status: Open
Last updated: 2026-04-27 (revised after Codex + Gemini technical review)

---

## The Story This Tells — And Its Honest Limits

A cipher's output can look statistically uniform without being cryptographically sound. This distinction is the central teaching tension this panel must hold without resolving it too quickly.

The panel answers one precise question: **does this workspace's output have the statistical shape of a random source, across the inputs tested?** That is a meaningful question. It is not the same as "is this cipher secure." The panel must make this distinction visible — not as a footnote, but as a structural feature of how the results are presented.

The most important classroom case: a Caesar cipher ($Y = X + K \bmod 256$) swept across all 256 possible inputs produces a perfectly uniform output — every byte appears exactly once. Bit balance, entropy, byte frequency, and runs all pass. The scatter plot reveals a diagonal line. This is the intended demonstration, not a failure of the tool. A student who sees five green sections and one anomalous scatter plot has learned something real: statistical uniformity is necessary but not sufficient, and a single structural test can expose what five frequency tests cannot.

**The panel's job is to make the gap between "looks uniform" and "is secure" visible, not to paper over it.**

---

## Narrative Arc (Revised Order)

Five chapters, ordered from most visually immediate to most statistically deep:

1. **Byte Frequency** — Is the 256-bucket bar chart flat?
2. **Bit Balance** — Are 0s and 1s equally distributed, per bit position?
3. **Shannon Entropy** — How much information does each output byte carry?
4. **Sequential Correlation** — Do consecutive output values look independent?
5. **Runs Uniformity** — Are runs of identical bits distributed as expected?

Ordering rationale: a student reads a bar chart before an erfc formula. Starting with the histogram builds immediate visual intuition; entropy then summarizes what the histogram just showed; correlation then asks a new question about *order*, not just frequency. This ordering mirrors how a working analyst reads output data, and it avoids front-loading the abstractest measure (entropy) before the student has a picture in mind.

---

## Permanent Panel Disclaimer

A non-dismissable note appears at the top of the panel at all times, before any results:

> **Statistics measure the *look* of randomness, not the strength of a secret.** A Caesar cipher, a simple substitution, and ChaCha20 can all produce a flat frequency distribution. Use these charts to understand what information the output reveals — not to certify that it reveals nothing.

This is not a warning label. It is framing. The goal is for students to read the disclaimer as an invitation: "what does this test actually catch, and what does it miss?"

---

## Problem Statement

MCW's analysis surface has the avalanche heatmap (diffusion quality per input flip) and the inspector transformation views (per-primitive DDT/LAT tables). What it lacks is a view of the cipher's **output as a whole**, observed across many inputs.

A learner building a toy Feistel round can see whether their S-boxes have good DDT properties, and whether their key mixing produces good diffusion on a single input. They cannot see: "across 256 possible inputs, does my cipher's output distribution look uniform?" That question requires aggregating many runs, not inspecting one.

This contract adds that aggregation-and-visualization layer, with the honest framing the cipher museum's bit-tests visualizations demonstrate: each chart tells one story, the story has a clear limit, and the limit is part of the lesson.

---

## Scope

V1 covers:

1. A **sample engine** that runs the project across N inputs and collects output values
2. A **statistics engine** that computes the five measures from the sample
3. A **key dependency check** (new, added after review) — the most important single correctness check
4. A **statistics panel** within the existing Cryptanalysis workspace
5. **Narrative callout text** per visualization that names what the test catches *and what it misses*
6. Integration with both **stateless** (sweep-mode) and **stateful** (tick-mode) projects

Out of scope for V1:
- NIST SP 800-22 formal test suite — requires 1M+ bits; MCW workspaces are small
- Symbol-domain analysis (IoC, frequency analysis) — lives in Compare panel
- Side-by-side comparison across multiple cipher configurations
- Mutual information, lag-k autocorrelation, overlapping template tests — follow-on

---

## Data Collection

### `buildOutputSample`

```
function buildOutputSample(
  project: Project,
  options: OutputSampleOptions
): OutputSample

interface OutputSampleOptions {
  mode: 'sweep' | 'tick';
  sweepSourceId?: string;          // explicitly named; or user selects via UI — no silent auto-detect
  sweepCount?: number;             // default: min(256, 2^inputWidth)
  tickCount?: number;              // default: 64 for tick mode
  outputModuleId: string;          // REQUIRED — user must select the output module explicitly
  analysisUnit: 'natural' | 'byte'; // see note below
}

interface OutputSample {
  mode: 'sweep' | 'tick';
  inputCount: number;
  naturalOutputWidth: number;      // bits per output observation (the actual output width)
  analysisUnit: 'natural' | 'byte'; // which unit the statistics will consume
  observations: number[][];        // inputCount × naturalOutputWidth bit arrays
  naturalValues: number[];         // inputCount scalar output values (if outputWidth <= 32)
  rawBytes: Uint8Array;            // observations packed into bytes, used only for byte-unit tests
  sampleKind: 'exhaustive' | 'sampled';  // 'exhaustive' when sweepCount == 2^inputWidth
  collectionError?: string;
}
```

**Analysis unit note:** Statistical tests operate on different representations:
- Monobit and Runs: consume the flat bit stream from all observations
- Byte Frequency, Entropy, Sequential Correlation scatter: consume `naturalValues` if `outputWidth <= 16`, otherwise `rawBytes`
- Mixing these units silently produces plausible-looking but wrong results

Each test declares which representation it consumes. The engine asserts that the requested representation is available for the declared `analysisUnit` before any test runs. Failing the assertion is a loud error, not a silent coercion.

**Output module selection:** No automatic detection of a "final" output module. In a Feistel network there may be debug sinks, round sinks, and final ciphertext sinks — no graph heuristic reliably distinguishes them. The UI must present a selector. The "Run Analysis" button is disabled until the user explicitly picks a sink.

A suggested default may be shown (sink with no downstream uses, deepest in the graph) but it is never applied silently.

**Error handling:**
- No output module selected → refuse with prompt
- Source or output not found → `collectionError: 'module-not-found'`
- Any individual run throws → skip, continue, report error count
- Fewer than 16 usable observations → `collectionError: 'insufficient-sample'`

---

## Key Dependency Check

This runs before the five statistical sections and is the most important single signal the panel produces.

```
interface KeyDependencyResult {
  keyModuleDetected: boolean;
  keyModuleId?: string;
  run1Output: number[];            // output with key variant A
  run2Output: number[];            // output with key variant B (random key, same plaintext)
  outputsMatch: boolean;           // true → key has no effect
  bitsChanged: number;
  bitsChangedFraction: number;
}
```

**Behavior:**
- Detect whether the project has a `BitSource`, `HexSource`, `IV`, `Nonce`, or `Salt` module not connected to the primary sweep source — treat the first such module as the key candidate
- Run the baseline input twice: once with the current key, once with a randomly-generated key of the same width
- Compare outputs

**If `outputsMatch === true`:**
Display a critical-severity banner before all other results:

> **The output does not change when the key changes.** This workspace behaves like a scrambler, not a cipher. Check that the key module is connected to the cipher path. The statistics below describe the output distribution, but a cipher whose output is independent of the key provides no security regardless of how uniform it looks.

**If no key module is detected:**
Display an info-severity note:

> No key source detected. Statistics below describe the output distribution for the plaintext sweep only. A cipher requires a key — without one, any structure in the output is exploitable.

**If key dependency is confirmed (outputs differ):**
Display a subtle confirmation: "Key dependency confirmed — output changes with key."

This check was identified in review as catching the most common classroom mistake (key wired incorrectly or not connected) before the student interprets uniformity as security.

---

## Statistics Engine

### Sample Validity Gates

Each test checks its own preconditions before computing. If preconditions are not met, the test shows a grey "Insufficient sample" badge rather than a result. It does not show a pass or fail.

| Test | Minimum to show result |
|---|---|
| Monobit | ≥ 1000 bits total |
| Runs | ≥ 1000 bits AND monobit prerequisite passes |
| Byte frequency (256 buckets) | ≥ 1280 bytes (expected count ≥ 5 per bucket) |
| Byte frequency (coarse, 16 buckets) | ≥ 80 bytes — used as fallback when 256-bucket gate fails |
| Entropy | ≥ 512 bytes for reliable estimate |
| Sequential correlation scatter | ≥ 128 adjacent pairs |

Below the minimum, the section renders with grey bars, the measured value still shown, and the label "Low sample — result indicative only."

### `computeOutputStatistics`

```
function computeOutputStatistics(sample: OutputSample): OutputStatistics

interface OutputStatistics {
  keyDependency: KeyDependencyResult;
  bitBalance: BitBalanceStats;
  byteEntropy: ByteEntropyStats;
  byteFrequency: ByteFrequencyStats;
  sequentialCorrelation: CorrelationStats;
  runsUniformity: RunsStats;
  profileLabel: 'uniform distribution' | 'near-uniform' | 'structured' | 'highly structured';
  // Note: no single numeric quality score — see §Quality Profile below
}
```

### `BitBalanceStats`

```
interface BitBalanceStats {
  totalBits: number;
  onesFraction: number;           // ones / totalBits (ideal: 0.5)
  perPositionFractions: number[]; // per output bit position
  monobitPValue: number;          // NIST SP 800-22 formula — see below
  sampleValid: boolean;           // totalBits >= 1000
}
```

**Exact monobit formula (corrected from first draft):**

```
S_n = ones - zeros               // signed sum over {+1, -1} representation
s_obs = abs(S_n) / sqrt(totalBits)
p = erfc(s_obs / sqrt(2))
  = erfc(abs(ones - zeros) / sqrt(2 * totalBits))
```

This is the exact NIST SP 800-22 Section 2.1 formula. The previous draft's `S = (ones - zeros) / sqrt(totalBits)` was correct in value but ambiguous in presentation.

### `ByteEntropyStats`

```
interface ByteEntropyStats {
  shannonEntropy: number;          // bits per byte (ideal: 8.0)
  entropyFraction: number;         // shannonEntropy / 8.0
  uniqueValueCount: number;        // distinct natural values seen
  uniqueValueFraction: number;     // / (2^naturalOutputWidth)
  sampleValid: boolean;            // rawBytes.length >= 512
  note: string;                    // e.g. "Near-maximum entropy. Compare: a Caesar cipher at N=256 also scores 8.0 bits/byte."
}
```

The `note` field is always populated with a contextual observation — not a pass/fail. The Caesar-at-N=256 note is one of the fixed examples shown when entropy is near-maximum on a small exhaustive sweep.

### `ByteFrequencyStats`

```
interface ByteFrequencyStats {
  bucketWidth: number;            // 1 for 256-bucket, 16 for coarse 16-bucket fallback
  bucketCount: number;            // 256 or 16
  counts: number[];               // per bucket
  expectedCount: number;          // totalValues / bucketCount
  chiSquared: number;
  degreesOfFreedom: number;       // bucketCount - 1
  chiSquaredPValue: number;       // approximate — valid only above sample gate
  sampleValid: boolean;
  maxDeviationBucket: number;
  maxDeviationFraction: number;   // |observed - expected| / expected
}
```

**Sample size gate:** 256-bucket test requires at least 1280 bytes (expected count ≥ 5 per bucket). Below this threshold, the engine automatically falls back to 16 coarse buckets (high nibble of each byte value), which require only 80 observations. The bucket width and count are reported so the student sees which mode ran.

### `CorrelationStats`

```
interface CorrelationStats {
  scatterPoints: [number, number][];   // (value[i], value[i+1]) pairs
  scatterUnit: 'natural' | 'byte';     // what the axes represent
  serialCorrelationCoefficient: number; // Pearson r, adjacent values
  hasVisibleLinearStructure: boolean;  // |r| > 0.10
  sampleValid: boolean;               // pairs >= 128
  testLabel: 'Adjacent-value linear correlation';  // always shown; not "serial test"
}
```

The scatter plot operates on `naturalValues` when `outputWidth <= 16`, and on packed bytes otherwise. The axis labels always show the actual unit and range (e.g., "Output value (0–15)" for a 4-bit cipher; "Byte value (0–255)" for an 8-bit cipher). Do not scatter packed nibble pairs labeled as bytes — that destroys the meaning.

Limitation copy shown below the scatter (always): "This scatter detects linear correlation between adjacent output values. A cipher where $Y_{i+1} = Y_i + 1$ will show a perfect diagonal; most ciphers with good round functions will show a cloud. This test does not detect nonlinear dependence or correlation at lag > 1."

### `RunsStats`

```
interface RunsStats {
  totalBits: number;
  piOnes: number;                  // ones / totalBits
  prerequisitePasses: boolean;     // abs(piOnes - 0.5) < 2 / sqrt(totalBits)
  totalRuns: number;
  expectedRuns: number;            // 2 * n * piOnes * (1 - piOnes)
  runsTestPValue: number;          // NIST SP 800-22 formula — see below
  runLengthCounts: number[];       // observed runs by length, index 0 = length 1
  expectedRunLengthCounts: number[]; // geometric: totalBits / 2^(k+1) for length k
  sampleValid: boolean;            // totalBits >= 1000 AND prerequisitePasses
}
```

**Exact runs test formula (NIST SP 800-22 Section 2.3):**

```
// Prerequisite check (must pass before computing V_n):
if abs(piOnes - 0.5) >= 2 / sqrt(n):
  → mark sampleValid = false, show "Prerequisite failed — monobit deviation too large for runs test"

// Total runs:
V_n = number of uninterrupted same-bit runs in the concatenated bit stream

// Test statistic:
numerator   = abs(V_n - 2 * n * piOnes * (1 - piOnes))
denominator = 2 * sqrt(2 * n) * piOnes * (1 - piOnes)
p = erfc(numerator / denominator)
```

---

## Visualization Specification

### Panel Location

New tab "Output Statistics" in the Cryptanalysis workspace, alongside the existing "Modern Analysis" tab.

### Header Strip

```
[Mode: Sweep / Tick]  [N observations]  [Output: <module name>]  [Analysis unit: natural / byte]

[Key Dependency: CONFIRMED / NOT DETECTED / CRITICAL — KEY HAS NO EFFECT]

[Run Analysis]  or  [Re-run]
```

Below the strip, always visible (non-dismissable):

> **Statistics measure the *look* of randomness, not the strength of a secret.** A Caesar cipher and ChaCha20 can both produce a flat frequency distribution at this sample size. Use these charts to understand what each test reveals — and what it misses.

---

### Section 1 — Byte Frequency

(Moved to first position per ordering recommendation)

**What it shows:**
- 256-bucket bar chart (or 16-bucket if sample is below gate) with reference line at expected count
- Bars colored by deviation: ±20% neutral, ±20–50% amber, >±50% red
- Chi-squared value and p-value
- Explicit label: "256-bucket test" or "Coarse 16-bucket test (sample too small for 256)"

**Teaching note (always shown):** "A bijective cipher — one where every input maps to a unique output — will always produce a perfectly flat distribution if you test every possible input. This test cannot distinguish a cipher from a lookup table that happens to be a permutation."

**Callout (no pass/fail badge — descriptive only):**
- Near-uniform: "Byte values appear roughly equally often. Note: this result is consistent with both strong ciphers and simple permutations."
- Structured: "Some byte values appear significantly more or less often than expected. This distribution would be unusual for a random source."

---

### Section 2 — Bit Balance

**What it shows:**
- Ones fraction as a large number with deviation from 50%
- Horizontal gauge 0–100% with 48–52% target band
- Per-position bar chart (one bar per output bit position, reference at 0.5)
- Monobit p-value — shown as a number with context, not a badge

**Teaching note (always shown):** "Bit balance measures whether individual bits, across many outputs, prefer 0 or 1. A stuck bit position often indicates a hardwired constant somewhere in the cipher path."

**Callout (descriptive):**
- Balanced: "Bits are approximately equally distributed. Individual positions show no strong bias."
- Imbalanced: "Bit position {N} is near {0/1} across {X}% of observations — this position carries almost no information."

---

### Section 3 — Shannon Entropy

**What it shows:**
- Horizontal gauge 0–8 bits/byte with labeled reference points:
  - 0: constant output
  - 3.5: English text
  - 6.0: classical cipher  
  - 7.9–8.0: strong cipher / random
- Observed value as gauge fill, color-coded by zone
- Unique value count / 2^outputWidth

**Teaching note (always shown):** "Entropy summarizes the byte frequency chart above. If every byte value appears equally often, entropy is exactly 8 bits/byte — but so does a Caesar cipher at N=256, because it maps every input to a unique output. High entropy is required for a good cipher. It is not sufficient."

---

### Section 4 — Sequential Correlation

**What it shows:**
- Density scatter: (value[i], value[i+1]) pairs, heat-mapped on a canvas
- Axes labeled with actual unit and range
- Serial correlation coefficient below the plot

**Teaching note (always shown):** "This is the test the other sections miss. A Caesar cipher ($Y = X + K$) scores perfect on frequency, balance, and entropy — but here, every point falls on a diagonal: $Y_{i+1}$ is always $Y_i + 1$. A cloud means consecutive outputs are not linearly related. A diagonal, grid, or band means they are."

**Callout:**
- Cloud (|r| < 0.05): "No linear relationship detected between consecutive outputs."
- Diagonal / structured (|r| > 0.10): "Consecutive outputs are linearly correlated (r = {X}). The scatter plot shows visible structure."

---

### Section 5 — Runs Uniformity

**What it shows:**
- Grouped bar chart: run lengths 1–8+ on X axis, observed count as bars
- Expected geometric distribution as overlaid dotted line
- Runs test p-value

**Teaching note (always shown):** "In a random bit stream, half of all runs have length 1, a quarter have length 2, an eighth have length 3, and so on. Deviations mean your cipher produces too many long runs (bits get 'stuck') or too few (bits flip too often)."

**Callout:**
- Matches reference: "Run lengths follow the expected geometric distribution."
- Deviates: "There are {too many / too few} runs of length {N}. The bit stream has predictable alternation or repetition patterns."

---

## Quality Profile (Replaces Single Score)

No single numeric quality score. The review found geometric mean too brittle: one low-entropy result on a tiny sample collapses the whole score in a misleading way, and a single number invites "what score did I get?" rather than "what does each section tell me?"

Instead, the panel shows a **profile label** derived from the worst-performing family:

```
profileLabel:
  All sections show no structure + key dependency confirmed
    → 'uniform distribution'
  One section shows mild structure OR low sample on one test
    → 'near-uniform'
  Any section shows significant structure
    → 'structured'
  Key has no effect OR any section shows strong structure
    → 'highly structured'
```

The profile label appears in the header strip, described as: "Output profile: {label}" — never "Security level" or "Cipher quality."

---

## Narrative Summary

Below all five sections, a single paragraph. The paragraph is always grounded by naming what tests found structure and what the structure means, not by declaring the cipher good or bad.

```
generateNarrativeSummary(stats: OutputStatistics): string
```

**Required language constraint:** The summary may never contain the phrases "this cipher is secure," "no patterns," "unbreakable," or "passed all tests." 

**Template examples:**

If all sections show no structure:
> "This workspace's output has the statistical shape of a uniform random source across the {N} inputs tested. Byte frequencies are flat, bit positions show no bias, consecutive values appear unrelated, and run lengths follow the expected distribution. This result is consistent with a strong cipher — and also with any bijective mapping tested exhaustively. The key dependency check [confirms / does not confirm] that the output changes with the key."

If sequential correlation is the only anomaly (Caesar-like):
> "Byte frequencies, bit balance, and entropy all appear near-uniform. However, consecutive output values show a strong linear relationship (r = {X}) — the scatter plot reveals the structure that the frequency tests miss. This pattern is consistent with a cipher that is a simple shift or permutation of its input, even if its individual output distribution looks flat."

If entropy is low:
> "Output entropy is {X} bits/byte — significantly below the 8-bit maximum. The byte frequency distribution shows that some output values appear far more often than others. This level of structure would make the output distinguishable from random data with relatively few observations."

If key has no effect:
> "The output does not change when the key changes. The statistical tests below describe the output distribution, but a cipher whose output is independent of the key provides no confidentiality regardless of how uniform the distribution appears. Check that the key module is connected to the cipher path."

---

## Integration

- Engine: `src/engine/analysis/output-statistics.ts`
  - Exports: `buildOutputSample`, `checkKeyDependency`, `computeOutputStatistics`, `generateNarrativeSummary`
- Panel: `src/ui/components/cryptanalysis-output-stats-panel.tsx`
- Tab: "Output Stats" in Cryptanalysis workspace

No engine function imports from UI files. The panel does not recompute on every module change — it requires an explicit "Run Analysis" action.

---

## Constants

```
MIN_MONOBIT_BITS = 1000
MIN_RUNS_BITS = 1000
MIN_BYTE_FREQUENCY_BYTES = 1280       // 256 buckets × 5 minimum expected
MIN_COARSE_FREQUENCY_BYTES = 80       // 16 coarse buckets × 5 minimum expected
MIN_SCATTER_PAIRS = 128
MIN_ENTROPY_BYTES = 512
DEFAULT_SWEEP_COUNT = 256
DEFAULT_TICK_COUNT = 64
MAX_SCATTER_POINTS = 2048
CORRELATION_STRUCTURE_THRESHOLD = 0.10
RUNS_PREREQUISITE_THRESHOLD = 2       // 2 / sqrt(n) — NIST SP 800-22
```

---

## What Changed From First Draft (Review Integration Notes)

| Issue raised | Change made |
|---|---|
| Monobit formula ambiguous | Exact NIST formula written out: `erfc(|ones-zeros| / sqrt(2n))` |
| Chi-squared invalid at N=256 | Sample size gate added; automatic fallback to 16 coarse buckets |
| Runs test formula missing | Exact NIST SP 800-22 Section 2.3 formula added with prerequisite check |
| Scatter should use natural values not packed bytes | `scatterUnit` field; scatter operates on `naturalValues` when outputWidth ≤ 16 |
| Auto output detection unreliable | Removed; `outputModuleId` is now required, UI shows selector |
| Geometric mean quality score too brittle | Replaced with profile label driven by worst-performing family |
| `passes: boolean` creates certification framing | Removed from all interfaces; no pass/fail badges |
| Narrative summary too celebratory | Language constraints added; prohibited phrases listed |
| `overallLabel: 'uniform'` reads as identity | Renamed to `'uniform distribution'` |
| Key dependency check missing | Added as pre-section with critical banner on failure |
| Section ordering wrong for students | Reordered: Frequency → Balance → Entropy → Correlation → Runs |
| Permanent disclaimer absent | Non-dismissable panel header copy added |
| Teaching notes absent | Each section now has a "what this test misses" teaching note |
| `sampleKind` assertion missing | Added to `OutputSample` interface; each test asserts compatible kind |
