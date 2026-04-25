export interface DDTResult {
  inputBits: number;
  outputBits: number;
  maxUniformity: number;
  maxIdealUniformity: number;
  fullMatrix: number[][] | null;
  thumbnail: number[][] | null;
  histogram: Record<number, number>;
}

export interface LATResult {
  inputBits: number;
  outputBits: number;
  nonlinearity: number;
  maxTheoreticalNonlinearity: number;
  componentNonlinearity: number[];
}

export interface BitDependencyResult {
  inputBits: number;
  outputBits: number;
  matrix: number[][];
  sacDeviation: number;
}

export interface AlgebraicDegreeResult {
  degree: number;
  maxTheoreticalDegree: number;
}

export interface SBoxAnalysis {
  inputBits: number;
  outputBits: number;
  isBijective: boolean;
  fixedPoints: number;
  ddt: DDTResult;
  lat: LATResult;
  bitDependency: BitDependencyResult;
  algebraicDegree: AlgebraicDegreeResult;
}

export interface SBoxReference {
  name: string;
  inputBits: number;
  outputBits: number;
  nonlinearity: number;
  maxDifferentialUniformity: number;
  algebraicDegree: number;
  fixedPoints: number;
}

export const KNOWN_SBOX_REFERENCES: readonly SBoxReference[] = [
  { name: 'PRESENT', inputBits: 4, outputBits: 4, nonlinearity: 4, maxDifferentialUniformity: 4, algebraicDegree: 3, fixedPoints: 0 },
  { name: 'AES', inputBits: 8, outputBits: 8, nonlinearity: 112, maxDifferentialUniformity: 4, algebraicDegree: 7, fixedPoints: 0 },
];

function popcountParity(x: number): number {
  let n = x;
  let parity = 0;
  while (n !== 0) {
    parity ^= n & 1;
    n >>>= 1;
  }
  return parity;
}

function popcount(x: number): number {
  let n = x;
  let count = 0;
  while (n !== 0) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
}

function idealMaxUniformity(inputBits: number, outputBits: number): number {
  if (inputBits === outputBits) {
    return inputBits <= 4 ? 2 : 4;
  }
  return 1 << (inputBits - outputBits);
}

const DDT_THUMBNAIL_SIZE = 16;

export function computeDDT(table: number[], inputBits: number, outputBits: number): DDTResult {
  const inCount = 1 << inputBits;
  const outCount = 1 << outputBits;
  const showFullMatrix = inputBits <= 5;
  const fullMatrix: number[][] | null = showFullMatrix ? [] : null;
  const histogram: Record<number, number> = {};
  let maxUniformity = 0;

  // For 8-bit tables, accumulate thumbnail (16x16 max-blocks of 256x256 DDT)
  const showThumbnail = !showFullMatrix && inCount >= DDT_THUMBNAIL_SIZE && outCount >= DDT_THUMBNAIL_SIZE;
  const thumbRowStep = showThumbnail ? Math.floor((inCount - 1) / DDT_THUMBNAIL_SIZE) : 0;
  const thumbColStep = showThumbnail ? Math.floor(outCount / DDT_THUMBNAIL_SIZE) : 0;
  const thumbnail: number[][] | null = showThumbnail
    ? Array.from({ length: DDT_THUMBNAIL_SIZE }, () => new Array<number>(DDT_THUMBNAIL_SIZE).fill(0))
    : null;

  for (let deltaIn = 1; deltaIn < inCount; deltaIn++) {
    const row = new Array<number>(outCount).fill(0);
    for (let x = 0; x < inCount; x++) {
      const deltaOut = table[x] ^ table[x ^ deltaIn];
      row[deltaOut]++;
    }
    if (showFullMatrix) {
      fullMatrix!.push(row);
    }
    if (showThumbnail && thumbRowStep > 0) {
      const thumbRow = Math.min(Math.floor((deltaIn - 1) / thumbRowStep), DDT_THUMBNAIL_SIZE - 1);
      for (let deltaOut = 0; deltaOut < outCount; deltaOut++) {
        if (row[deltaOut] > 0) {
          const thumbCol = Math.min(Math.floor(deltaOut / thumbColStep), DDT_THUMBNAIL_SIZE - 1);
          if (row[deltaOut] > thumbnail![thumbRow][thumbCol]) {
            thumbnail![thumbRow][thumbCol] = row[deltaOut];
          }
        }
      }
    }
    for (const value of row) {
      if (value > 0) {
        if (value > maxUniformity) maxUniformity = value;
        histogram[value] = (histogram[value] ?? 0) + 1;
      }
    }
  }

  return {
    inputBits,
    outputBits,
    maxUniformity,
    maxIdealUniformity: idealMaxUniformity(inputBits, outputBits),
    fullMatrix,
    thumbnail,
    histogram,
  };
}

export function computeLAT(table: number[], inputBits: number, outputBits: number): LATResult {
  const inCount = 1 << inputBits;
  const outCount = 1 << outputBits;

  let maxTheoreticalNonlinearity: number;
  if (inputBits === 4) {
    maxTheoreticalNonlinearity = 4;
  } else if (inputBits === 8) {
    maxTheoreticalNonlinearity = 112;
  } else {
    maxTheoreticalNonlinearity = (inCount >> 1) - (1 << (Math.floor(inputBits / 2) - 1));
  }

  let maxAbsWHT = 0;
  // Track per single-bit coordinate function nonlinearity (b = 1<<j)
  const componentNonlinearity = new Array<number>(outputBits).fill(0);

  for (let b = 1; b < outCount; b++) {
    const wht = new Array<number>(inCount);
    for (let x = 0; x < inCount; x++) {
      wht[x] = popcountParity(b & table[x]) === 0 ? 1 : -1;
    }

    let step = 1;
    while (step < inCount) {
      for (let i = 0; i < inCount; i += step * 2) {
        for (let j = i; j < i + step; j++) {
          const u = wht[j];
          const v = wht[j + step];
          wht[j] = u + v;
          wht[j + step] = u - v;
        }
      }
      step *= 2;
    }

    let localMaxAbs = 0;
    for (const val of wht) {
      const abs = Math.abs(val);
      if (abs > localMaxAbs) localMaxAbs = abs;
      if (abs > maxAbsWHT) maxAbsWHT = abs;
    }

    // Record nonlinearity for single-bit coordinate functions
    if (popcount(b) === 1) {
      const bit = Math.log2(b);
      if (Number.isInteger(bit) && bit < outputBits) {
        componentNonlinearity[bit] = (inCount >> 1) - (localMaxAbs >> 1);
      }
    }
  }

  return {
    inputBits,
    outputBits,
    nonlinearity: (inCount >> 1) - (maxAbsWHT >> 1),
    maxTheoreticalNonlinearity,
    componentNonlinearity,
  };
}

export function computeBitDependency(table: number[], inputBits: number, outputBits: number): BitDependencyResult {
  const inCount = 1 << inputBits;
  const matrix: number[][] = Array.from({ length: inputBits }, () => new Array<number>(outputBits).fill(0));

  for (let i = 0; i < inputBits; i++) {
    const flipMask = 1 << (inputBits - 1 - i);
    for (let x = 0; x < inCount; x++) {
      const xorOut = table[x] ^ table[x ^ flipMask];
      for (let j = 0; j < outputBits; j++) {
        if ((xorOut >> (outputBits - 1 - j)) & 1) {
          matrix[i][j]++;
        }
      }
    }
    for (let j = 0; j < outputBits; j++) {
      matrix[i][j] /= inCount;
    }
  }

  let sacDeviation = 0;
  for (const row of matrix) {
    for (const prob of row) {
      const dev = Math.abs(prob - 0.5);
      if (dev > sacDeviation) sacDeviation = dev;
    }
  }

  return { inputBits, outputBits, matrix, sacDeviation };
}

export function computeAlgebraicDegree(table: number[], inputBits: number, outputBits: number): AlgebraicDegreeResult {
  const inCount = 1 << inputBits;
  const outCount = 1 << outputBits;
  const maxTheoreticalDegree = inputBits - 1;
  let degree = 0;

  for (let b = 1; b < outCount; b++) {
    // Build truth table of component function f_b
    const anf = new Array<number>(inCount);
    for (let x = 0; x < inCount; x++) {
      anf[x] = popcountParity(b & table[x]);
    }

    // Möbius transform (in-place ANF)
    for (let i = 0; i < inputBits; i++) {
      const step = 1 << i;
      for (let x = 0; x < inCount; x++) {
        if (x & step) {
          anf[x] ^= anf[x ^ step];
        }
      }
    }

    // Find highest-weight monomial with nonzero coefficient
    for (let x = 1; x < inCount; x++) {
      if (anf[x] === 1) {
        const weight = popcount(x);
        if (weight > degree) degree = weight;
      }
    }

    if (degree === maxTheoreticalDegree) break;
  }

  return { degree, maxTheoreticalDegree };
}

export function countFixedPoints(table: number[]): number {
  let count = 0;
  for (let i = 0; i < table.length; i++) {
    if (table[i] === i) count++;
  }
  return count;
}

export function computeSBoxAnalysis(table: number[], inputBits: number, outputBits: number): SBoxAnalysis {
  const isBijective = inputBits === outputBits && new Set(table).size === table.length;

  return {
    inputBits,
    outputBits,
    isBijective,
    fixedPoints: countFixedPoints(table),
    ddt: computeDDT(table, inputBits, outputBits),
    lat: computeLAT(table, inputBits, outputBits),
    bitDependency: computeBitDependency(table, inputBits, outputBits),
    algebraicDegree: computeAlgebraicDegree(table, inputBits, outputBits),
  };
}
