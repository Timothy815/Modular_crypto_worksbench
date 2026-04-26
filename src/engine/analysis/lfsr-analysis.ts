const MAX_COMPUTE_DEGREE = 22;

export interface LFSRAnalysis {
  degree: number;
  tapCount: number;
  taps: number[];
  maxPeriod: number;
  period: number | null;
  isPrimitive: boolean | null;
  allZerosSeed: boolean;
  isExact: boolean;
}

function parseTaps(value: unknown): number[] | null {
  if (typeof value !== 'string') return null;
  const parts = value.split(',').map((s) => parseInt(s.trim(), 10));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (new Set(parts).size !== parts.length) return null;
  return parts;
}

export function computeLFSRAnalysis(
  seed: number[],
  tapsParam: unknown,
): LFSRAnalysis {
  const degree = seed.length;
  const allZerosSeed = seed.every((b) => b === 0);
  const taps = parseTaps(tapsParam) ?? [];
  const maxPeriod = degree <= 30 ? (1 << degree) - 1 : 2 ** degree - 1;

  if (allZerosSeed || degree > MAX_COMPUTE_DEGREE || taps.length === 0) {
    return {
      degree,
      tapCount: taps.length,
      taps,
      maxPeriod,
      period: null,
      isPrimitive: null,
      allZerosSeed,
      isExact: false,
    };
  }

  // Simulate until initial state recurs
  const initial = [...seed];
  let register = [...seed];
  let period = 0;

  for (let step = 0; step < maxPeriod; step++) {
    // feedback = XOR of tapped positions
    let feedback = 0;
    for (const tap of taps) {
      if (tap < register.length) feedback ^= register[tap];
    }
    register = [feedback, ...register.slice(0, -1)];
    period++;
    if (register.every((bit, i) => bit === initial[i])) break;
  }

  return {
    degree,
    tapCount: taps.length,
    taps,
    maxPeriod,
    period,
    isPrimitive: period === maxPeriod,
    allZerosSeed: false,
    isExact: true,
  };
}

export function getLFSRAnalysisFromParams(params: {
  seed?: unknown;
  taps?: unknown;
}): LFSRAnalysis | null {
  try {
    const seed = params.seed;
    if (!Array.isArray(seed) || seed.length === 0) return null;
    if (!seed.every((b) => b === 0 || b === 1)) return null;
    return computeLFSRAnalysis(seed as number[], params.taps);
  } catch {
    return null;
  }
}
