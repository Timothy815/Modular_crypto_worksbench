import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export function validateBitWindowParam(key: string, value: unknown): string | null {
  if (key === 'start') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      return 'BitWindow start must be a non-negative integer.';
    }

    return null;
  }

  if (key === 'width') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      return 'BitWindow width must be a positive integer.';
    }

    return null;
  }

  return null;
}

export const BitWindow: ModuleDef = {
  id: 'BitWindow',
  name: 'Bit Window',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    start: {
      key: 'start',
      label: 'Start',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Zero-based starting position of the visible sub-key window.',
    },
    width: {
      key: 'width',
      label: 'Width',
      kind: 'number',
      defaultValue: 8,
      required: true,
      description: 'Number of bits to extract from the key bus.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'BitWindow');
    const start =
      typeof params.start === 'number' && Number.isInteger(params.start) && params.start >= 0
        ? params.start
        : 0;
    const width =
      typeof params.width === 'number' && Number.isInteger(params.width) && params.width >= 1
        ? params.width
        : bits.length;

    if (start + width > bits.length) {
      throw new Error(
        `BitWindow range (${start}-${start + width - 1}) exceeds input length (${bits.length})`,
      );
    }

    return {
      out: {
        type: 'bits',
        value: bits.slice(start, start + width),
      },
    };
  },
};
