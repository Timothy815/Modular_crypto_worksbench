import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export function validateBitUnpadParam(
  key: string,
  value: unknown,
): string | null {
  if (key !== 'originalWidth') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return 'BitUnpad originalWidth must be a positive integer.';
  }

  return null;
}

export const BitUnpad: ModuleDef = {
  id: 'BitUnpad',
  name: 'Bit Unpad',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    originalWidth: {
      key: 'originalWidth',
      label: 'Original Width',
      kind: 'number',
      defaultValue: 4,
      required: true,
      description: 'Width of the original unpadded signal in bits.',
    },
    side: {
      key: 'side',
      label: 'Strip Side',
      kind: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
      required: false,
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'BitUnpad');

    const originalWidth =
      typeof params.originalWidth === 'number' &&
      Number.isInteger(params.originalWidth) &&
      params.originalWidth >= 1
        ? params.originalWidth
        : bits.length;

    if (bits.length <= originalWidth) {
      return { out: { type: 'bits', value: [...bits] } };
    }

    const side = params.side === 'left' ? 'left' : 'right';

    return {
      out: {
        type: 'bits',
        value:
          side === 'left'
            ? bits.slice(bits.length - originalWidth)
            : bits.slice(0, originalWidth),
      },
    };
  },
};
