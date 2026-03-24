import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export function validateBitPadParam(
  key: string,
  value: unknown,
): string | null {
  if (key !== 'targetWidth') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return 'BitPad targetWidth must be a positive integer.';
  }

  return null;
}

export const BitPad: ModuleDef = {
  id: 'BitPad',
  name: 'Bit Pad',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    targetWidth: {
      key: 'targetWidth',
      label: 'Target Width',
      kind: 'number',
      defaultValue: 8,
      required: true,
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
      required: false,
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
      required: false,
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'BitPad');

    const targetWidth =
      typeof params.targetWidth === 'number' &&
      Number.isInteger(params.targetWidth) &&
      params.targetWidth >= 1
        ? params.targetWidth
        : bits.length;

    if (bits.length >= targetWidth) {
      return { out: { type: 'bits', value: [...bits] } };
    }

    const padCount = targetWidth - bits.length;
    const padBitValue = params.padBit === '1' ? 1 : 0;
    const padding = Array.from({ length: padCount }, () => padBitValue);

    const side = params.side === 'left' ? 'left' : 'right';

    return {
      out: {
        type: 'bits',
        value: side === 'left' ? [...padding, ...bits] : [...bits, ...padding],
      },
    };
  },
};
