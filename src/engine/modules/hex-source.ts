import type { TickSliceableModuleDef } from '../types';

export function validateHexSourceValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return 'HexSource requires a hex string';
  }

  const normalized = value.trim().replace(/\s+/g, '').toUpperCase();
  if (normalized.length === 0) {
    return null;
  }

  if (!/^[0-9A-F]+$/.test(normalized)) {
    return 'HexSource accepts only hexadecimal characters 0-9 and A-F';
  }

  return null;
}

export function sanitizeHex(value: unknown): string {
  const validationMessage = validateHexSourceValue(value);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, '').toUpperCase()
    : '';
}

export function hexToBits(value: string): number[] {
  return value.split('').flatMap((digit) => {
    const nibble = Number.parseInt(digit, 16);
    return [3, 2, 1, 0].map((shift) => (nibble >> shift) & 1);
  });
}

export const HexSource: TickSliceableModuleDef = {
  id: 'HexSource',
  name: 'Hex Source',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'Hex Value',
      kind: 'string',
      defaultValue: 'A3',
      required: true,
      description: 'Hexadecimal input such as A3, 0F, or DEADBEEF',
    },
  },
  evaluate: (_inputs, params) => {
    const value = sanitizeHex(params.value);
    return {
      out: { type: 'bits', value: hexToBits(value) },
    };
  },
  tickSlice: (params, tick) => {
    const value = sanitizeHex(params.value);
    const start = tick * 2;
    return {
      ...params,
      value: value.slice(start, start + 2),
    };
  },
  tickLength: (params) => Math.ceil(sanitizeHex(params.value).length / 2),
};
