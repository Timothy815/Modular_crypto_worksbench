import type { ModuleDef } from '../types';

function normalizeHexDigit(value: string): string {
  if (value.length !== 1) {
    throw new Error('HexDigitToBits expects exactly one hex digit');
  }

  const digit = value.toUpperCase();
  if (!/^[0-9A-F]$/.test(digit)) {
    throw new Error('HexDigitToBits accepts only hexadecimal characters 0-9 and A-F');
  }

  return digit;
}

function hexDigitToBits(value: string): number[] {
  const nibble = Number.parseInt(value, 16);
  return [3, 2, 1, 0].map((shift) => (nibble >> shift) & 1);
}

export const HexDigitToBits: ModuleDef = {
  id: 'HexDigitToBits',
  name: 'Hex Digit → Bits',
  inputs: [{ name: 'in', type: 'symbol', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'scalar' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('HexDigitToBits expects a symbol signal');
    }

    return {
      out: { type: 'bits', value: hexDigitToBits(normalizeHexDigit(signal.value)) },
    };
  },
};
