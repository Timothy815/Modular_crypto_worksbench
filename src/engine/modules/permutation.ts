import type { ModuleDef } from '../types';

export function parsePermutationOrder(value: unknown): number[] {
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

export function validatePermutationOrderParam(value: unknown): string | null {
  try {
    parsePermutationOrder(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Permutation order is invalid.';
  }
}

export function serializePermutationOrder(order: number[]): string {
  return order.join(',');
}

export function buildIdentityPermutationOrder(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

export function buildReversePermutationOrder(length: number): number[] {
  return Array.from({ length }, (_, index) => length - 1 - index);
}

export function rotatePermutationOrder(
  order: number[],
  direction: 'left' | 'right',
  amount = 1,
): number[] {
  if (order.length === 0) {
    return [];
  }

  const normalizedAmount = ((amount % order.length) + order.length) % order.length;
  if (normalizedAmount === 0) {
    return [...order];
  }

  if (direction === 'left') {
    return [...order.slice(normalizedAmount), ...order.slice(0, normalizedAmount)];
  }

  return [
    ...order.slice(order.length - normalizedAmount),
    ...order.slice(0, order.length - normalizedAmount),
  ];
}

export function buildInversePermutationOrder(order: number[]): number[] {
  const inverse = new Array<number>(order.length);

  for (let outputIndex = 0; outputIndex < order.length; outputIndex += 1) {
    const inputIndex = order[outputIndex];
    if (
      !Number.isInteger(inputIndex) ||
      inputIndex < 0 ||
      inputIndex >= order.length ||
      inverse[inputIndex] !== undefined
    ) {
      throw new Error('Permutation order must be a one-to-one mapping to build its inverse');
    }
    inverse[inputIndex] = outputIndex;
  }

  return inverse;
}

export function swapPermutationOrderPositions(order: number[], leftIndex: number, rightIndex: number): number[] {
  if (
    leftIndex < 0 ||
    rightIndex < 0 ||
    leftIndex >= order.length ||
    rightIndex >= order.length ||
    leftIndex === rightIndex
  ) {
    return [...order];
  }

  const nextOrder = [...order];
  const leftValue = nextOrder[leftIndex];
  nextOrder[leftIndex] = nextOrder[rightIndex];
  nextOrder[rightIndex] = leftValue;
  return nextOrder;
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
