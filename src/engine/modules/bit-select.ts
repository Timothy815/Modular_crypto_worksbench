import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export function parseBitSelectOrder(value: unknown): number[] {
  if (typeof value !== 'string') {
    throw new Error('BitSelect requires a comma-separated index list');
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    throw new Error('BitSelect order cannot be empty');
  }

  const order = parts.map((part) => Number(part));
  if (order.some((entry) => !Number.isInteger(entry) || entry < 0)) {
    throw new Error('BitSelect order must contain only non-negative integers');
  }

  return order;
}

export function validateBitSelectOrderParam(value: unknown): string | null {
  try {
    parseBitSelectOrder(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'BitSelect order is invalid.';
  }
}

export const BitSelect: ModuleDef = {
  id: 'BitSelect',
  name: 'Bit Select',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    order: {
      key: 'order',
      label: 'Selection Order',
      kind: 'string',
      defaultValue: '0,2,4,6',
      required: true,
      description:
        'Comma-separated list of input bit indices to select, in output order. Each index may appear at most once. Output width equals the number of listed indices.',
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
    const bits = expectBitsSignal(inputs.in, 'BitSelect');
    const order = parseBitSelectOrder(params.order);

    const seen = new Set<number>();
    for (const index of order) {
      if (index >= bits.length) {
        throw new Error(
          `BitSelect index ${index} is out of range for input width ${bits.length}`,
        );
      }
      if (seen.has(index)) {
        throw new Error(`BitSelect index ${index} appears more than once in the selection order`);
      }
      seen.add(index);
    }

    return {
      out: {
        type: 'bits',
        value: order.map((index) => bits[index]),
      },
    };
  },
};
