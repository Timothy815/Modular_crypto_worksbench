import type { ModuleDef } from '../types';

export function validateSymbolWindowParam(key: string, value: unknown): string | null {
  if (key === 'start') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      return 'SymbolWindow start must be a non-negative integer.';
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
      return 'SymbolWindow width must be a positive integer.';
    }

    return null;
  }

  return null;
}

export const SymbolWindow: ModuleDef = {
  id: 'SymbolWindow',
  name: 'Symbol Window',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    start: {
      key: 'start',
      label: 'Start',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Zero-based starting position of the visible symbol window.',
    },
    width: {
      key: 'width',
      label: 'Width',
      kind: 'number',
      defaultValue: 2,
      required: true,
      description: 'Number of symbols to extract from the visible message.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('SymbolWindow expects a symbol signal');
    }

    const symbols = Array.from(signal.value);
    const start =
      typeof params.start === 'number' && Number.isInteger(params.start) && params.start >= 0
        ? params.start
        : 0;
    const width =
      typeof params.width === 'number' && Number.isInteger(params.width) && params.width >= 1
        ? params.width
        : symbols.length;

    if (start + width > symbols.length) {
      throw new Error(
        `SymbolWindow range (${start}-${start + width - 1}) exceeds input length (${symbols.length})`,
      );
    }

    return {
      out: {
        type: 'symbol',
        value: symbols.slice(start, start + width).join(''),
      },
    };
  },
};
