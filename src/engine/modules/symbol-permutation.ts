import type { ModuleDef } from '../types';
import { parsePermutationOrder } from './permutation';

function validatePermutationIsBijective(order: number[]): string | null {
  if (order.length === 0) {
    return 'Symbol permutation order cannot be empty';
  }

  const unique = new Set(order);
  if (unique.size !== order.length) {
    return 'Symbol permutation order must use each input index exactly once';
  }

  const maxIndex = order.length - 1;
  if (order.some((entry) => entry > maxIndex)) {
    return `Symbol permutation order must stay within 0-${maxIndex}`;
  }

  return null;
}

export function validateSymbolPermutationOrderParam(value: unknown): string | null {
  try {
    const order = parsePermutationOrder(value);
    return validatePermutationIsBijective(order);
  } catch (error) {
    return error instanceof Error ? error.message : 'Symbol permutation order is invalid.';
  }
}

export const SymbolPermutation: ModuleDef = {
  id: 'SymbolPermutation',
  name: 'Symbol Permutation',
  inputs: [{ name: 'in', type: 'symbol', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {
    order: {
      key: 'order',
      label: 'Symbol Order',
      kind: 'string',
      defaultValue: '0,1,2,3',
      required: true,
      description: 'Comma-separated output order, e.g. 2,0,3,1',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('SymbolPermutation expects a symbol signal');
    }

    const order = parsePermutationOrder(params.order);
    const orderMessage = validatePermutationIsBijective(order);
    if (orderMessage) {
      throw new Error(orderMessage);
    }

    const symbols = Array.from(signal.value);
    if (symbols.length !== order.length) {
      throw new Error(
        `SymbolPermutation order length (${order.length}) must match the input symbol length (${symbols.length})`,
      );
    }

    return {
      out: {
        type: 'symbol',
        value: order.map((index) => symbols[index]).join(''),
      },
    };
  },
};
