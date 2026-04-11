import type { ModuleDef } from '../types';

type SequenceSide = 'left' | 'right';

function normalizeSide(value: unknown): SequenceSide {
  if (value === 'left' || value === 'right') {
    return value;
  }

  throw new Error('PadSymbolToMatch requires "side" to be left or right');
}

function normalizePadChar(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 1) {
    throw new Error('PadSymbolToMatch requires "padChar" to be exactly one character');
  }

  const codePoint = value.charCodeAt(0);
  if (codePoint < 0x20 || codePoint > 0x7E) {
    throw new Error('PadSymbolToMatch requires "padChar" to be one printable non-control ASCII character');
  }

  return value;
}

export function validatePadSymbolToMatchParam(fieldKey: string, value: unknown): string | null {
  try {
    if (fieldKey === 'side') {
      normalizeSide(value);
    }

    if (fieldKey === 'padChar') {
      normalizePadChar(value);
    }

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'PadSymbolToMatch parameter is invalid.';
  }
}

function padSymbolToMatch(symbol: string, reference: string, side: SequenceSide, padChar: string): string {
  const symbols = Array.from(symbol);
  const targetLength = Array.from(reference).length;

  if (symbols.length >= targetLength) {
    return symbol;
  }

  const padCount = targetLength - symbols.length;
  const padding = padChar.repeat(padCount);
  return side === 'left' ? `${padding}${symbol}` : `${symbol}${padding}`;
}

export const PadSymbolToMatch: ModuleDef = {
  id: 'PadSymbolToMatch',
  name: 'Pad Symbol To Match',
  inputs: [
    { name: 'in', type: 'symbol', kind: 'sequence' },
    { name: 'reference', type: 'symbol', kind: 'sequence' },
  ],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {
    side: {
      key: 'side',
      label: 'Pad Side',
      kind: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
      required: true,
      description: 'Choose which side receives the explicit padding characters.',
    },
    padChar: {
      key: 'padChar',
      label: 'Pad Character',
      kind: 'string',
      defaultValue: ' ',
      required: true,
      description: 'Choose the explicit printable ASCII character used for padding.',
    },
  },
  evaluate: (inputs, params) => {
    const inputSignal = inputs.in;
    const referenceSignal = inputs.reference;

    if (inputSignal.type !== 'symbol') {
      throw new Error('PadSymbolToMatch expects a symbol signal');
    }

    if (referenceSignal.type !== 'symbol') {
      throw new Error('PadSymbolToMatch expects a symbol sequence reference');
    }

    const side = normalizeSide(params.side);
    const padChar = normalizePadChar(params.padChar);

    return {
      out: {
        type: 'symbol',
        value: padSymbolToMatch(inputSignal.value, referenceSignal.value, side, padChar),
      },
    };
  },
};
