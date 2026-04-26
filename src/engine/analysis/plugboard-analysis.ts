export interface PlugboardAnalysis {
  alphabetSize: number;
  fixedPoints: number;
  pairCount: number;
  pairs: Array<[string, string]>;
}

export interface ReflectorAnalysis {
  alphabetSize: number;
  pairCount: number;
  pairs: Array<[string, string]>;
  isValidInvolution: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function computePlugboardAnalysis(wiring: string[]): PlugboardAnalysis {
  const n = wiring.length;
  const alphabet = ALPHABET.slice(0, n);
  let fixedPoints = 0;
  const pairs: Array<[string, string]> = [];
  const seen = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (seen.has(i)) continue;
    const j = alphabet.indexOf(wiring[i]);
    if (j === i) {
      fixedPoints++;
      seen.add(i);
    } else if (j > i) {
      pairs.push([alphabet[i], alphabet[j]]);
      seen.add(i);
      seen.add(j);
    }
  }

  return {
    alphabetSize: n,
    fixedPoints,
    pairCount: pairs.length,
    pairs,
  };
}

export function computeReflectorAnalysis(wiring: string[]): ReflectorAnalysis {
  const n = wiring.length;
  const alphabet = ALPHABET.slice(0, n);
  const pairs: Array<[string, string]> = [];
  const seen = new Set<number>();
  let isValidInvolution = true;

  for (let i = 0; i < n; i++) {
    if (seen.has(i)) continue;
    const j = alphabet.indexOf(wiring[i]);
    if (j === i) {
      isValidInvolution = false;
      seen.add(i);
    } else if (j >= 0) {
      if (alphabet.indexOf(wiring[j]) !== i) isValidInvolution = false;
      pairs.push([alphabet[i], alphabet[j]]);
      seen.add(i);
      seen.add(j);
    }
  }

  return {
    alphabetSize: n,
    pairCount: pairs.length,
    pairs,
    isValidInvolution,
  };
}

export function getPlugboardAnalysisFromParams(params: { wiring?: unknown }): PlugboardAnalysis | null {
  try {
    const wiring = params.wiring;
    if (!Array.isArray(wiring) || wiring.length === 0) return null;
    if (!wiring.every((c) => typeof c === 'string' && c.length === 1)) return null;
    return computePlugboardAnalysis(wiring as string[]);
  } catch {
    return null;
  }
}

export function getReflectorAnalysisFromParams(params: { wiring?: unknown }): ReflectorAnalysis | null {
  try {
    const wiring = params.wiring;
    if (!Array.isArray(wiring) || wiring.length === 0) return null;
    if (!wiring.every((c) => typeof c === 'string' && c.length === 1)) return null;
    return computeReflectorAnalysis(wiring as string[]);
  } catch {
    return null;
  }
}
