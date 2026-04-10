import type { StatefulModuleDef } from '../types';
import { validateAsciiSourceValue } from './ascii-source';

function normalizeIndex(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('AsciiSequenceToTicked requires "index" to be a non-negative integer');
  }

  return value;
}

function normalizeAscii(value: unknown): string {
  const validationMessage = validateAsciiSourceValue(value);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return typeof value === 'string' ? value : '';
}

export function validateAsciiSequenceToTickedParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'index':
        normalizeIndex(value);
        return null;
      case 'wrap':
        return typeof value === 'boolean'
          ? null
          : 'AsciiSequenceToTicked requires "wrap" to be a boolean';
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'AsciiSequenceToTicked parameter is invalid.';
  }
}

export const AsciiSequenceToTicked: StatefulModuleDef = {
  id: 'AsciiSequenceToTicked',
  name: 'ASCII Sequence To Ticked',
  inputs: [
    { name: 'in', type: 'symbol', kind: 'sequence' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
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
      description: 'Current ASCII sequence index emitted at this tick.',
    },
    wrap: {
      key: 'wrap',
      label: 'Wrap',
      kind: 'boolean',
      defaultValue: true,
      required: true,
      description: 'Wrap back to the start of the sequence after the last ASCII character.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('AsciiSequenceToTicked expects an ASCII symbol sequence');
    }

    const sequence = normalizeAscii(signal.value);
    if (sequence.length === 0) {
      return { out: { type: 'symbol', value: '' } };
    }

    const index = normalizeIndex(params.index);
    const wrap = params.wrap !== false;
    const resolvedIndex = wrap ? index % sequence.length : index;
    const value = resolvedIndex < sequence.length ? sequence[resolvedIndex] ?? '' : '';

    return { out: { type: 'symbol', value } };
  },
  advance: (params) => ({
    ...params,
    index: normalizeIndex(params.index) + 1,
  }),
};
