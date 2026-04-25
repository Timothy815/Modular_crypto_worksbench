export interface CycleResult {
  cycles: number[][];
  count: number;
  minLength: number;
  maxLength: number;
  avgLength: number;
  fixedPoints: number;
}

export interface DisplacementResult {
  displacements: number[];
  min: number;
  max: number;
  avg: number;
  histogram: Record<number, number>;
}

export interface BlockSpreadResult {
  blockSize: number;
  blockCount: number;
  spreadMatrix: number[][];
  branchNumber: number;
  branchNumberIsExact: boolean;
}

export interface PermutationAnalysis {
  length: number;
  cycles: CycleResult;
  displacement: DisplacementResult;
  blockSpread: BlockSpreadResult | null;
}

export function computeCycles(order: number[]): CycleResult {
  const n = order.length;
  const visited = new Uint8Array(n);
  const cycles: number[][] = [];

  for (let start = 0; start < n; start++) {
    if (visited[start]) continue;
    const cycle: number[] = [];
    let i = start;
    while (!visited[i]) {
      visited[i] = 1;
      cycle.push(i);
      i = order[i];
    }
    cycles.push(cycle);
  }

  const lengths = cycles.map((c) => c.length);
  const fixedPoints = lengths.filter((l) => l === 1).length;

  return {
    cycles,
    count: cycles.length,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    avgLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    fixedPoints,
  };
}

export function computeDisplacement(order: number[]): DisplacementResult {
  const n = order.length;
  // Build inverse: inv[i] = output position that input bit i goes to
  const inv = new Array<number>(n);
  for (let outputPos = 0; outputPos < n; outputPos++) {
    inv[order[outputPos]] = outputPos;
  }

  const displacements = inv.map((outputPos, inputPos) => Math.abs(outputPos - inputPos));
  const histogram: Record<number, number> = {};
  for (const d of displacements) {
    histogram[d] = (histogram[d] ?? 0) + 1;
  }

  return {
    displacements,
    min: Math.min(...displacements),
    max: Math.max(...displacements),
    avg: displacements.reduce((a, b) => a + b, 0) / n,
    histogram,
  };
}

const EXACT_BRANCH_BLOCK_LIMIT = 24;

export function computeBlockSpread(order: number[], blockSize: number): BlockSpreadResult {
  const n = order.length;
  if (blockSize < 1 || blockSize > n || n % blockSize !== 0) {
    throw new Error(`Block size ${blockSize} does not evenly divide permutation length ${n}`);
  }

  const blockCount = n / blockSize;
  // Build inverse: inv[inputPos] = outputPos
  const inv = new Array<number>(n);
  for (let outputPos = 0; outputPos < n; outputPos++) {
    inv[order[outputPos]] = outputPos;
  }

  // spreadMatrix[inBlock][outBlock] = number of bits from inBlock landing in outBlock
  const spreadMatrix: number[][] = Array.from({ length: blockCount }, () =>
    new Array<number>(blockCount).fill(0),
  );
  for (let inputPos = 0; inputPos < n; inputPos++) {
    const inBlock = Math.floor(inputPos / blockSize);
    const outBlock = Math.floor(inv[inputPos] / blockSize);
    spreadMatrix[inBlock][outBlock]++;
  }

  // Branch number: min over all nonempty subsets A of input blocks of (|A| + |output blocks activated by A|)
  // For each input block, which output blocks does it activate?
  const activatedByBlock: number[][] = Array.from({ length: blockCount }, (_, b) =>
    spreadMatrix[b].map((count, ob) => (count > 0 ? ob : -1)).filter((ob) => ob >= 0),
  );

  let branchNumber = Infinity;
  const branchNumberIsExact = blockCount <= EXACT_BRANCH_BLOCK_LIMIT;

  if (branchNumberIsExact) {
    // Enumerate all nonempty subsets
    const subsetCount = 1 << blockCount;
    for (let mask = 1; mask < subsetCount; mask++) {
      const activeIn = popcount(mask);
      const activeOutSet = new Set<number>();
      for (let b = 0; b < blockCount; b++) {
        if (mask & (1 << b)) {
          for (const ob of activatedByBlock[b]) {
            activeOutSet.add(ob);
          }
        }
      }
      const total = activeIn + activeOutSet.size;
      if (total < branchNumber) branchNumber = total;
    }
  } else {
    // Lower bound: minimum single-block activation
    for (let b = 0; b < blockCount; b++) {
      const total = 1 + activatedByBlock[b].length;
      if (total < branchNumber) branchNumber = total;
    }
  }

  return {
    blockSize,
    blockCount,
    spreadMatrix,
    branchNumber: branchNumber === Infinity ? 0 : branchNumber,
    branchNumberIsExact,
  };
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

export function computePermutationAnalysis(order: number[], blockSize?: number): PermutationAnalysis {
  const blockSpread =
    blockSize !== undefined && blockSize >= 1 && order.length % blockSize === 0
      ? computeBlockSpread(order, blockSize)
      : null;

  return {
    length: order.length,
    cycles: computeCycles(order),
    displacement: computeDisplacement(order),
    blockSpread,
  };
}
