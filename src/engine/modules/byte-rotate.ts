import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export function validateByteRotateParam(key: string, value: unknown): string | null {
  if (key === 'amount') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      return 'ByteRotate amount must be a positive integer.';
    }

    return null;
  }

  if (key === 'direction') {
    return value === 'left' || value === 'right'
      ? null
      : 'ByteRotate direction must be "left" or "right".';
  }

  return null;
}

export const ByteRotate: ModuleDef = {
  id: 'ByteRotate',
  name: 'Byte Rotate',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    amount: {
      key: 'amount',
      label: 'Byte Amount',
      kind: 'number',
      defaultValue: 1,
      required: true,
      description: 'How many whole bytes to rotate by.',
    },
    direction: {
      key: 'direction',
      label: 'Direction',
      kind: 'select',
      defaultValue: 'left',
      required: true,
      options: [
        { label: 'Rotate Left', value: 'left' },
        { label: 'Rotate Right', value: 'right' },
      ],
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'ByteRotate');
    if (bits.length === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    if (bits.length % 8 !== 0) {
      throw new Error('ByteRotate expects an input width divisible by 8');
    }

    const amount =
      typeof params.amount === 'number' && Number.isInteger(params.amount) && params.amount >= 1
        ? params.amount
        : 1;
    const direction = params.direction === 'right' ? 'right' : 'left';

    const bytes: number[][] = [];
    for (let index = 0; index < bits.length; index += 8) {
      bytes.push(bits.slice(index, index + 8));
    }

    const offset = amount % bytes.length;
    if (offset === 0) {
      return { out: { type: 'bits', value: [...bits] } };
    }

    const rotated =
      direction === 'left'
        ? [...bytes.slice(offset), ...bytes.slice(0, offset)]
        : [...bytes.slice(bytes.length - offset), ...bytes.slice(0, bytes.length - offset)];

    return {
      out: {
        type: 'bits',
        value: rotated.flat(),
      },
    };
  },
};
