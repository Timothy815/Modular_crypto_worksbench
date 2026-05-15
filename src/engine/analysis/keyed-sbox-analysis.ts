import { computeSBoxAnalysis, type SBoxAnalysis } from './sbox-analysis';

export const KEYED_SBOX_BASELINE_TABLE = [12, 5, 6, 11, 9, 0, 10, 13, 3, 14, 15, 8, 4, 7, 1, 2] as const;
export const KEYED_SBOX_VARIANT_01_TABLE = [5, 12, 6, 11, 9, 0, 10, 13, 3, 14, 15, 8, 4, 7, 1, 2] as const;
export const KEYED_SBOX_VARIANT_10_TABLE = [5, 6, 11, 12, 9, 0, 10, 13, 3, 14, 15, 8, 4, 7, 1, 2] as const;
export const KEYED_SBOX_VARIANT_11_TABLE = [12, 5, 6, 11, 9, 0, 10, 13, 3, 0, 15, 8, 4, 7, 1, 2] as const;

export type KeyedSBoxVariantKey = '00' | '01' | '10' | '11';

export interface KeyedSBoxVariantDefinition {
  keyBits: KeyedSBoxVariantKey;
  label: string;
  table: readonly number[];
  isValidPermutation: boolean;
  explanation: string;
}

export interface KeyedSBoxAnalysis {
  keyBits: KeyedSBoxVariantKey;
  keyLabel: string;
  baselineTable: readonly number[];
  selectedTable: readonly number[];
  selectedTableCsv: string;
  selectedVariant: KeyedSBoxVariantDefinition;
  repeatedValues: number[];
  missingValues: number[];
  baselineExampleOutputs: { input: string; output: string }[];
  selectedExampleOutputs: { input: string; output: string }[];
  sboxAnalysis: SBoxAnalysis;
}

export const KEYED_SBOX_VARIANTS: Record<KeyedSBoxVariantKey, KeyedSBoxVariantDefinition> = {
  '00': {
    keyBits: '00',
    label: 'Baseline',
    table: KEYED_SBOX_BASELINE_TABLE,
    isValidPermutation: true,
    explanation: 'Leaves the shipped PRESENT-style 4-bit permutation unchanged.',
  },
  '01': {
    keyBits: '01',
    label: 'Swap Positions 0 And 1',
    table: KEYED_SBOX_VARIANT_01_TABLE,
    isValidPermutation: true,
    explanation: 'Swaps output positions 0 and 1 while keeping a valid 4-bit permutation.',
  },
  '10': {
    keyBits: '10',
    label: 'Rotate First Row Left',
    table: KEYED_SBOX_VARIANT_10_TABLE,
    isValidPermutation: true,
    explanation: 'Rotates the first visible 4x4 row one step left while keeping a valid 4-bit permutation.',
  },
  '11': {
    keyBits: '11',
    label: 'Overwrite Position 9',
    table: KEYED_SBOX_VARIANT_11_TABLE,
    isValidPermutation: false,
    explanation: 'Overwrites output position 9 with the value from position 5, duplicating 0 and removing 14.',
  },
};

function normalizeKeyBits(value: unknown): KeyedSBoxVariantKey {
  if (typeof value === 'string' && value.length === 2 && /^[01]{2}$/.test(value)) {
    return value as KeyedSBoxVariantKey;
  }

  if (Array.isArray(value) && value.length === 2 && value.every((bit) => bit === 0 || bit === 1)) {
    return `${value[0]}${value[1]}` as KeyedSBoxVariantKey;
  }

  throw new Error('KeyedSBox4 expects a visible 2-bit key.');
}

function toHexNibble(value: number): string {
  return value.toString(16).toUpperCase();
}

function collectRepeatedValues(table: readonly number[]) {
  const counts = new Map<number, number>();
  for (const value of table) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort((left, right) => left - right);
}

function collectMissingValues(table: readonly number[]) {
  const seen = new Set(table);
  return Array.from({ length: 16 }, (_, index) => index).filter((value) => !seen.has(value));
}

function getExampleOutputs(table: readonly number[]) {
  return [
    { input: '0x0', output: `0x${toHexNibble(table[0])}` },
    { input: '0x1', output: `0x${toHexNibble(table[1])}` },
    { input: '0x7', output: `0x${toHexNibble(table[7])}` },
  ];
}

export function getKeyedSBoxVariantTable(keyBits: unknown): readonly number[] {
  return KEYED_SBOX_VARIANTS[normalizeKeyBits(keyBits)].table;
}

export function computeKeyedSBoxAnalysis(params: { keyBits: unknown }): KeyedSBoxAnalysis {
  const keyBits = normalizeKeyBits(params.keyBits);
  const selectedVariant = KEYED_SBOX_VARIANTS[keyBits];
  const selectedTable = [...selectedVariant.table];
  const repeatedValues = collectRepeatedValues(selectedTable);
  const missingValues = collectMissingValues(selectedTable);

  return {
    keyBits,
    keyLabel: selectedVariant.label,
    baselineTable: KEYED_SBOX_BASELINE_TABLE,
    selectedTable,
    selectedTableCsv: selectedTable.join(','),
    selectedVariant,
    repeatedValues,
    missingValues,
    baselineExampleOutputs: getExampleOutputs(KEYED_SBOX_BASELINE_TABLE),
    selectedExampleOutputs: getExampleOutputs(selectedTable),
    sboxAnalysis: computeSBoxAnalysis(selectedTable, 4, 4),
  };
}
