import type { ModuleDef } from '../types';

export interface SBoxShape {
  inputWidth: number;
  outputWidth: number;
  entryCount: number;
  maxEntry: number;
  requiresPermutation: boolean;
}

const SUPPORTED_SBOX_SHAPES: readonly SBoxShape[] = [
  { inputWidth: 4, outputWidth: 4, entryCount: 16, maxEntry: 15, requiresPermutation: true },
  { inputWidth: 6, outputWidth: 4, entryCount: 64, maxEntry: 15, requiresPermutation: false },
  { inputWidth: 8, outputWidth: 8, entryCount: 256, maxEntry: 255, requiresPermutation: true },
] as const;

function inferSquareSBoxShape(entryCount: number): SBoxShape {
  const width = Math.log2(entryCount);
  if (!Number.isInteger(width) || width < 1) {
    throw new Error('SBox table length must be a power of two');
  }

  return {
    inputWidth: width,
    outputWidth: width,
    entryCount,
    maxEntry: (1 << width) - 1,
    requiresPermutation: true,
  };
}

function parseSBoxWidthParam(value: unknown, key: 'inputBits' | 'outputBits'): number | null {
  if (value === undefined) {
    return null;
  }

  const normalized =
    typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error(`SBox ${key} must be a positive integer`);
  }

  return normalized;
}

export function getSBoxShape(params: {
  table?: unknown;
  inputBits?: unknown;
  outputBits?: unknown;
}): SBoxShape {
  const inputWidth = parseSBoxWidthParam(params.inputBits, 'inputBits');
  const outputWidth = parseSBoxWidthParam(params.outputBits, 'outputBits');

  if (inputWidth === null && outputWidth === null) {
    if (typeof params.table !== 'string') {
      throw new Error('SBox table must be a comma-separated value list');
    }

    const entryCount = params.table
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0).length;

    return inferSquareSBoxShape(entryCount);
  }

  if (inputWidth === null || outputWidth === null) {
    throw new Error('SBox inputBits and outputBits must both be set together');
  }

  const shape = SUPPORTED_SBOX_SHAPES.find(
    (candidate) =>
      candidate.inputWidth === inputWidth && candidate.outputWidth === outputWidth,
  );
  if (!shape) {
    throw new Error('SBox only supports 4->4, 6->4, and 8->8 tables');
  }

  return shape;
}

export function parseSBoxTable(
  value: unknown,
  options?: {
    inputBits?: unknown;
    outputBits?: unknown;
  },
): number[] {
  if (typeof value !== 'string') {
    throw new Error('SBox table must be a comma-separated value list');
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const shape = getSBoxShape({
    table: value,
    inputBits: options?.inputBits,
    outputBits: options?.outputBits,
  });

  if (parts.length !== shape.entryCount) {
    throw new Error(`SBox table must contain exactly ${shape.entryCount} entries for ${shape.inputWidth}->${shape.outputWidth}`);
  }

  const entries = parts.map((part) => Number(part));
  if (entries.some((entry) => !Number.isInteger(entry) || entry < 0 || entry > shape.maxEntry)) {
    throw new Error(`SBox entries must be integers between 0 and ${shape.maxEntry}`);
  }

  if (shape.requiresPermutation && new Set(entries).size !== entries.length) {
    throw new Error('SBox table must be a permutation with no duplicates');
  }

  return entries;
}

export function validateSBoxParams(params: {
  table?: unknown;
  inputBits?: unknown;
  outputBits?: unknown;
}): string | null {
  try {
    parseSBoxTable(params.table, params);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'SBox table is invalid.';
  }
}

export function validateSBoxTableParam(value: unknown): string | null {
  return validateSBoxParams({ table: value });
}

export function serializeSBoxTable(table: number[]): string {
  return table.join(',');
}

export function buildIdentitySBoxTable(entryCount: number): number[] {
  inferSquareSBoxShape(entryCount);
  return Array.from({ length: entryCount }, (_, index) => index);
}

export function buildReverseSBoxTable(entryCount: number): number[] {
  return [...buildIdentitySBoxTable(entryCount)].reverse();
}

export function swapSBoxEntry(table: number[], index: number, nextValue: number): number[] {
  if (index < 0 || index >= table.length) {
    return [...table];
  }

  if (!Number.isInteger(nextValue) || nextValue < 0 || nextValue >= table.length) {
    return [...table];
  }

  const nextIndex = table.indexOf(nextValue);
  if (nextIndex < 0 || nextIndex === index) {
    return [...table];
  }

  const currentValue = table[index];
  const nextTable = [...table];
  nextTable[index] = nextValue;
  nextTable[nextIndex] = currentValue;
  return nextTable;
}

export function swapSBoxEntriesByIndex(table: number[], firstIndex: number, secondIndex: number): number[] {
  if (
    firstIndex < 0 ||
    secondIndex < 0 ||
    firstIndex >= table.length ||
    secondIndex >= table.length ||
    firstIndex === secondIndex
  ) {
    return [...table];
  }

  const nextTable = [...table];
  [nextTable[firstIndex], nextTable[secondIndex]] = [nextTable[secondIndex], nextTable[firstIndex]];
  return nextTable;
}

export function setSBoxEntry(table: number[], index: number, nextValue: number, maxEntry: number): number[] {
  if (
    index < 0 ||
    index >= table.length ||
    !Number.isInteger(nextValue) ||
    nextValue < 0 ||
    nextValue > maxEntry
  ) {
    return [...table];
  }

  const nextTable = [...table];
  nextTable[index] = nextValue;
  return nextTable;
}

function bitsToNumber(bits: number[]): number {
  return bits.reduce((value, bit) => (value << 1) | bit, 0);
}

function numberToBits(value: number, width: number): number[] {
  const bits: number[] = [];
  for (let index = width - 1; index >= 0; index -= 1) {
    bits.push((value >> index) & 1);
  }
  return bits;
}

export const SBox: ModuleDef = {
  id: 'SBox',
  name: 'S-Box',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    inputBits: {
      key: 'inputBits',
      label: 'Input Width',
      kind: 'select',
      defaultValue: '4',
      hidden: true,
      options: [
        { label: '4 bits', value: '4' },
        { label: '6 bits', value: '6' },
        { label: '8 bits', value: '8' },
      ],
      description: 'How many input bits each substitution chunk consumes.',
    },
    outputBits: {
      key: 'outputBits',
      label: 'Output Width',
      kind: 'select',
      defaultValue: '4',
      hidden: true,
      options: [
        { label: '4 bits', value: '4' },
        { label: '8 bits', value: '8' },
      ],
      description: 'How many output bits each substituted chunk emits.',
    },
    table: {
      key: 'table',
      label: 'Substitution Table',
      kind: 'string',
      defaultValue: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7',
      required: true,
      description: 'Comma-separated table. 4->4 uses 16 permutation entries, 6->4 uses 64 entries, and 8->8 uses 256 permutation entries.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('SBox expects a bits signal');
    }

    if (signal.value.length === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const shape = getSBoxShape(params);
    const table = parseSBoxTable(params.table, params);

    if (signal.value.length % shape.inputWidth !== 0) {
      throw new Error(`SBox input width must be a multiple of ${shape.inputWidth} bits`);
    }

    const output: number[] = [];

    for (let index = 0; index < signal.value.length; index += shape.inputWidth) {
      const chunk = signal.value.slice(index, index + shape.inputWidth);
      const substituted = table[bitsToNumber(chunk)];
      output.push(...numberToBits(substituted, shape.outputWidth));
    }

    return {
      out: {
        type: 'bits',
        value: output,
      },
    };
  },
};
