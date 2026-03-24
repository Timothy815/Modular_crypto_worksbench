import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export function validateBitSplitParam(
  key: string,
  value: unknown,
): string | null {
  if (key !== 'leftWidth') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return 'BitSplit leftWidth must be a positive integer.';
  }

  return null;
}

export const BitSplit: ModuleDef = {
  id: 'BitSplit',
  name: 'Bit Split',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [
    { name: 'left', type: 'bits' },
    { name: 'right', type: 'bits' },
  ],
  paramSchema: {
    leftWidth: {
      key: 'leftWidth',
      label: 'Left Width',
      kind: 'number',
      defaultValue: 8,
      required: true,
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'BitSplit');

    const leftWidth =
      typeof params.leftWidth === 'number' && Number.isInteger(params.leftWidth) && params.leftWidth >= 1
        ? params.leftWidth
        : 8;

    if (leftWidth > bits.length) {
      throw new Error(
        `BitSplit leftWidth (${leftWidth}) exceeds input length (${bits.length})`,
      );
    }

    return {
      left: { type: 'bits', value: bits.slice(0, leftWidth) },
      right: { type: 'bits', value: bits.slice(leftWidth) },
    };
  },
};
