import type { ModuleDef } from '../types';

function parsePermutationOrder(value: unknown): number[] {
  if (typeof value !== 'string') {
    throw new Error('Permutation requires a comma-separated index list');
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    throw new Error('Permutation order cannot be empty');
  }

  const order = parts.map((part) => Number(part));
  if (order.some((entry) => !Number.isInteger(entry) || entry < 0)) {
    throw new Error('Permutation order must contain only non-negative integers');
  }

  return order;
}

export const Permutation: ModuleDef = {
  id: 'Permutation',
  name: 'Permutation',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    order: {
      key: 'order',
      label: 'Permutation Order',
      kind: 'string',
      defaultValue: '0,1,2,3,4',
      required: true,
      description: 'Comma-separated destination order, e.g. 2,0,4,1,3',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('Permutation expects a bits signal');
    }

    const order = parsePermutationOrder(params.order);
    if (order.length !== signal.value.length) {
      throw new Error('Permutation order length must match input width');
    }

    const unique = new Set(order);
    if (unique.size !== order.length) {
      throw new Error('Permutation order must not repeat indexes');
    }

    if (order.some((entry) => entry >= signal.value.length)) {
      throw new Error('Permutation order index is out of range for the input width');
    }

    return {
      out: {
        type: 'bits',
        value: order.map((index) => signal.value[index]),
      },
    };
  },
};
