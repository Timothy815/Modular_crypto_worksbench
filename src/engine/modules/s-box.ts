import type { ModuleDef } from '../types';

function inferSBoxWidth(entryCount: number): number {
  const width = Math.log2(entryCount);
  if (!Number.isInteger(width) || width < 1) {
    throw new Error('SBox table length must be a power of two');
  }

  return width;
}

export function parseSBoxTable(value: unknown): number[] {
  if (typeof value !== 'string') {
    throw new Error('SBox table must be a comma-separated value list');
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const width = inferSBoxWidth(parts.length);
  const maxEntry = (1 << width) - 1;

  const entries = parts.map((part) => Number(part));
  if (entries.some((entry) => !Number.isInteger(entry) || entry < 0 || entry > maxEntry)) {
    throw new Error(`SBox entries must be integers between 0 and ${maxEntry}`);
  }

  if (new Set(entries).size !== entries.length) {
    throw new Error('SBox table must be a permutation with no duplicates');
  }

  return entries;
}

export function validateSBoxTableParam(value: unknown): string | null {
  try {
    parseSBoxTable(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'SBox table is invalid.';
  }
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
    table: {
      key: 'table',
      label: 'Substitution Table',
      kind: 'string',
      defaultValue: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7',
      required: true,
      description: 'Comma-separated permutation table. 16 entries = 4-bit S-Box, 256 entries = 8-bit S-Box.',
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

    const table = parseSBoxTable(params.table);
    const width = inferSBoxWidth(table.length);

    if (signal.value.length % width !== 0) {
      throw new Error(`SBox input width must be a multiple of ${width} bits`);
    }

    const output: number[] = [];

    for (let index = 0; index < signal.value.length; index += width) {
      const chunk = signal.value.slice(index, index + width);
      const substituted = table[bitsToNumber(chunk)];
      output.push(...numberToBits(substituted, width));
    }

    return {
      out: {
        type: 'bits',
        value: output,
      },
    };
  },
};
