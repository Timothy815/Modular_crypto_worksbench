import type { ModuleDef } from '../types';

function normalizeAsciiChar(value: string): string {
  if (value.length !== 1) {
    throw new Error('AsciiCharToBits expects exactly one ASCII character');
  }

  if (value.charCodeAt(0) > 0x7f) {
    throw new Error('AsciiCharToBits accepts only 7-bit ASCII characters');
  }

  return value;
}

function charToBits(char: string): number[] {
  const code = char.charCodeAt(0);
  return [7, 6, 5, 4, 3, 2, 1, 0].map((shift) => (code >> shift) & 1);
}

export const AsciiCharToBits: ModuleDef = {
  id: 'AsciiCharToBits',
  name: 'ASCII Char → Bits',
  inputs: [{ name: 'in', type: 'symbol', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'scalar' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('AsciiCharToBits expects a symbol signal');
    }

    return {
      out: { type: 'bits', value: charToBits(normalizeAsciiChar(signal.value)) },
    };
  },
};
