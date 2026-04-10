import type { StatefulModuleDef } from '../types';
import { expectBitsSignal, normalizePositiveInteger } from './bit-word';

type RemainderMode = 'pad' | 'truncate' | 'error';

function normalizeNonNegativeInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`BitsSequenceToTicked requires "${fieldName}" to be a non-negative integer`);
  }

  return value;
}

function normalizeRemainderMode(value: unknown): RemainderMode {
  if (value === 'pad' || value === 'truncate' || value === 'error') {
    return value;
  }

  throw new Error('BitsSequenceToTicked requires "remainderMode" to be pad, truncate, or error');
}

export function validateBitsSequenceToTickedParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'index':
        normalizeNonNegativeInteger(value, 'index');
        return null;
      case 'wordWidth':
        normalizePositiveInteger(value, 'BitsSequenceToTicked', 'wordWidth');
        return null;
      case 'wrap':
        return typeof value === 'boolean' ? null : 'BitsSequenceToTicked requires "wrap" to be a boolean';
      case 'remainderMode':
        normalizeRemainderMode(value);
        return null;
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'BitsSequenceToTicked parameter is invalid.';
  }
}

function buildWords(bits: number[], wordWidth: number, remainderMode: RemainderMode): number[][] {
  if (bits.length === 0) {
    return [];
  }

  const words: number[][] = [];
  const fullWordCount = Math.floor(bits.length / wordWidth);
  for (let index = 0; index < fullWordCount; index += 1) {
    const start = index * wordWidth;
    words.push(bits.slice(start, start + wordWidth));
  }

  const remainder = bits.length % wordWidth;
  if (remainder === 0) {
    return words;
  }

  const tail = bits.slice(bits.length - remainder);
  switch (remainderMode) {
    case 'truncate':
      return words;
    case 'pad':
      words.push([...tail, ...Array.from({ length: wordWidth - remainder }, () => 0)]);
      return words;
    case 'error':
    default:
      throw new Error(
        `BitsSequenceToTicked cannot emit ${bits.length} bits as ${wordWidth}-bit words without an explicit remainder policy`,
      );
  }
}

export const BitsSequenceToTicked: StatefulModuleDef = {
  id: 'BitsSequenceToTicked',
  name: 'Bits Sequence To Ticked',
  inputs: [
    { name: 'in', type: 'bits', kind: 'sequence' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits', kind: 'scalar' }],
  liveStateDisplay: {
    key: 'index',
    label: 'step',
  },
  paramSchema: {
    index: {
      key: 'index',
      label: 'Index',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Current emitted word index.',
    },
    wordWidth: {
      key: 'wordWidth',
      label: 'Word Width',
      kind: 'number',
      defaultValue: 8,
      required: true,
      description: 'Fixed bit width of each emitted scalar word.',
    },
    wrap: {
      key: 'wrap',
      label: 'Wrap',
      kind: 'boolean',
      defaultValue: true,
      required: true,
      description: 'Wrap back to the first word when the tick count exceeds the sequence length.',
    },
    remainderMode: {
      key: 'remainderMode',
      label: 'Remainder',
      kind: 'select',
      defaultValue: 'error',
      required: true,
      options: [
        { label: 'Error', value: 'error' },
        { label: 'Pad', value: 'pad' },
        { label: 'Truncate', value: 'truncate' },
      ],
      description: 'How to handle trailing bits that do not fill a complete output word.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'BitsSequenceToTicked');
    const wordWidth = normalizePositiveInteger(params.wordWidth, 'BitsSequenceToTicked', 'wordWidth');
    const index = normalizeNonNegativeInteger(params.index, 'index');
    const wrap = params.wrap !== false;
    const remainderMode = normalizeRemainderMode(params.remainderMode);
    const words = buildWords(bits, wordWidth, remainderMode);

    if (words.length === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const resolvedIndex = wrap ? index % words.length : index;
    const value = resolvedIndex < words.length ? words[resolvedIndex] ?? [] : [];
    return {
      out: { type: 'bits', value },
    };
  },
  advance: (params) => ({
    ...params,
    index: normalizeNonNegativeInteger(params.index, 'index') + 1,
  }),
};
