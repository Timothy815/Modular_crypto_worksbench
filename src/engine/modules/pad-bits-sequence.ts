import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

type SequenceSide = 'left' | 'right';
type PadBit = '0' | '1';

function normalizeTargetLength(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('PadBitsSequence requires "targetLength" to be a non-negative integer');
  }

  return value;
}

function normalizeSide(value: unknown): SequenceSide {
  if (value === 'left' || value === 'right') {
    return value;
  }

  throw new Error('PadBitsSequence requires "side" to be left or right');
}

function normalizePadBit(value: unknown): PadBit {
  if (value === '0' || value === '1') {
    return value;
  }

  throw new Error('PadBitsSequence requires "padBit" to be 0 or 1');
}

export function validatePadBitsSequenceParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'targetLength':
        normalizeTargetLength(value);
        return null;
      case 'side':
        normalizeSide(value);
        return null;
      case 'padBit':
        normalizePadBit(value);
        return null;
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'PadBitsSequence parameter is invalid.';
  }
}

export const PadBitsSequence: ModuleDef = {
  id: 'PadBitsSequence',
  name: 'Pad Bits Sequence',
  inputs: [{ name: 'in', type: 'bits', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
    targetLength: {
      key: 'targetLength',
      label: 'Target Length',
      kind: 'number',
      defaultValue: 8,
      required: true,
      description: 'Pad the visible bit sequence until it reaches this length.',
    },
    side: {
      key: 'side',
      label: 'Pad Side',
      kind: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
      required: true,
      description: 'Choose which side receives the explicit padding bits.',
    },
    padBit: {
      key: 'padBit',
      label: 'Pad Bit',
      kind: 'select',
      defaultValue: '0',
      options: [
        { label: '0', value: '0' },
        { label: '1', value: '1' },
      ],
      required: true,
      description: 'Choose the explicit bit value used for padding.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'PadBitsSequence');
    const targetLength = normalizeTargetLength(params.targetLength);
    const side = normalizeSide(params.side);
    const padBit = normalizePadBit(params.padBit);

    if (bits.length >= targetLength) {
      return { out: { type: 'bits', value: [...bits] } };
    }

    const padCount = targetLength - bits.length;
    const padding = Array.from({ length: padCount }, () => (padBit === '1' ? 1 : 0));

    return {
      out: {
        type: 'bits',
        value: side === 'left' ? [...padding, ...bits] : [...bits, ...padding],
      },
    };
  },
};
