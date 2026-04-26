import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export function parseBitExpandOrder(value: unknown): number[] {
  if (typeof value !== 'string') {
    throw new Error('BitExpand requires a comma-separated index list');
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    throw new Error('BitExpand order cannot be empty');
  }

  const order = parts.map((part) => Number(part));
  if (order.some((entry) => !Number.isInteger(entry) || entry < 0)) {
    throw new Error('BitExpand order must contain only non-negative integers');
  }

  return order;
}

export function validateBitExpandOrderParam(value: unknown): string | null {
  try {
    parseBitExpandOrder(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'BitExpand order is invalid.';
  }
}

export const BitExpand: ModuleDef = {
  id: 'BitExpand',
  name: 'Bit Expand',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    order: {
      key: 'order',
      label: 'Expansion Order',
      kind: 'string',
      defaultValue: '0,1,2,3,0,1',
      required: true,
      description:
        'Comma-separated list of input bit indices to map to each output position, in order. Duplicate indices are allowed — a repeated index copies that input bit to multiple output positions. Output width equals the number of listed indices.',
    },
    inputWidth: {
      key: 'inputWidth',
      label: 'Input Width Hint',
      kind: 'number',
      defaultValue: null,
      required: false,
      description:
        'Optional: declare the expected input width so the wire editor can render before a live connection arrives. Not used during evaluation.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'BitExpand');
    const order = parseBitExpandOrder(params.order);

    for (const index of order) {
      if (index >= bits.length) {
        throw new Error(
          `BitExpand index ${index} is out of range for input width ${bits.length}`,
        );
      }
    }

    return {
      out: {
        type: 'bits',
        value: order.map((index) => bits[index]),
      },
    };
  },
};
