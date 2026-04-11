import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

type SequenceSide = 'left' | 'right';
type PadBit = '0' | '1';

function normalizeSide(value: unknown): SequenceSide {
  if (value === 'left' || value === 'right') {
    return value;
  }

  throw new Error('PadBitsToMatch requires "side" to be left or right');
}

function normalizePadBit(value: unknown): PadBit {
  if (value === '0' || value === '1') {
    return value;
  }

  throw new Error('PadBitsToMatch requires "padBit" to be 0 or 1');
}

export function validatePadBitsToMatchParam(fieldKey: string, value: unknown): string | null {
  try {
    if (fieldKey === 'side') {
      normalizeSide(value);
    }

    if (fieldKey === 'padBit') {
      normalizePadBit(value);
    }

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'PadBitsToMatch parameter is invalid.';
  }
}

function padBitsToMatch(bits: number[], reference: number[], side: SequenceSide, padBit: PadBit): number[] {
  const targetLength = reference.length;

  if (bits.length >= targetLength) {
    return [...bits];
  }

  const padCount = targetLength - bits.length;
  const padValue = padBit === '1' ? 1 : 0;
  const padding = Array.from({ length: padCount }, () => padValue);
  return side === 'left' ? [...padding, ...bits] : [...bits, ...padding];
}

export const PadBitsToMatch: ModuleDef = {
  id: 'PadBitsToMatch',
  name: 'Pad Bits To Match',
  inputs: [
    { name: 'in', type: 'bits', kind: 'sequence' },
    { name: 'reference', type: 'bits', kind: 'sequence' },
  ],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
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
    const bits = expectBitsSignal(inputs.in, 'PadBitsToMatch');
    const reference = expectBitsSignal(inputs.reference, 'PadBitsToMatch');
    const side = normalizeSide(params.side);
    const padBit = normalizePadBit(params.padBit);

    return {
      out: {
        type: 'bits',
        value: padBitsToMatch(bits, reference, side, padBit),
      },
    };
  },
};
