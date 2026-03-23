import type { TickSliceableModuleDef } from '../types';

export function validateAsciiSourceValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return 'AsciiSource requires a text string';
  }

  for (const char of value) {
    if (char.charCodeAt(0) > 0x7f) {
      return 'AsciiSource accepts only 7-bit ASCII characters';
    }
  }

  return null;
}

function normalizeAscii(value: unknown): string {
  const validationMessage = validateAsciiSourceValue(value);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return typeof value === 'string' ? value : '';
}

function charToBits(char: string): number[] {
  const code = char.charCodeAt(0);
  return [7, 6, 5, 4, 3, 2, 1, 0].map((shift) => (code >> shift) & 1);
}

export const AsciiSource: TickSliceableModuleDef = {
  id: 'AsciiSource',
  name: 'ASCII Source',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'ASCII Text',
      kind: 'string',
      defaultValue: 'A',
      required: true,
      description: 'ASCII text such as A, HELLO, or TEST',
    },
  },
  evaluate: (_inputs, params) => {
    const value = normalizeAscii(params.value);
    return {
      out: { type: 'bits', value: value.split('').flatMap(charToBits) },
    };
  },
  tickSlice: (params, tick) => {
    const value = normalizeAscii(params.value);
    return {
      ...params,
      value: value[tick] ?? '',
    };
  },
  tickLength: (params) => normalizeAscii(params.value).length,
};
