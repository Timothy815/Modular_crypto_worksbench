import type { ModuleDef } from '../types';

function sanitizeHex(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('HexToAscii expects a hex string');
  }

  const normalized = value.trim().replace(/\s+/g, '').toUpperCase();
  if (normalized.length === 0) {
    return '';
  }

  if (!/^[0-9A-F]+$/.test(normalized)) {
    throw new Error('HexToAscii accepts only hexadecimal characters 0-9 and A-F');
  }

  return normalized;
}

function hexByteToChar(byte: string): string {
  const value = Number.parseInt(byte, 16);
  if (value > 0x7f) {
    throw new Error('HexToAscii can only decode 7-bit ASCII byte values (00-7F)');
  }

  return String.fromCharCode(value);
}

export const HexToAscii: ModuleDef = {
  id: 'HexToAscii',
  name: 'Hex → ASCII',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('HexToAscii expects a symbol signal');
    }

    const hex = sanitizeHex(signal.value);
    if (hex.length % 2 !== 0) {
      throw new Error('HexToAscii expects an even number of hex digits');
    }

    const chars = [];
    for (let index = 0; index < hex.length; index += 2) {
      chars.push(hexByteToChar(hex.slice(index, index + 2)));
    }

    return {
      out: { type: 'symbol', value: chars.join('') },
    };
  },
};
