import type { ModuleDef } from '../types';

type SequenceSide = 'left' | 'right';

function normalizeSide(value: unknown): SequenceSide {
  if (value === 'left' || value === 'right') {
    return value;
  }

  throw new Error('TruncateSymbolToMatch requires "side" to be left or right');
}

export function validateTruncateSymbolToMatchParam(fieldKey: string, value: unknown): string | null {
  try {
    if (fieldKey === 'side') {
      normalizeSide(value);
    }

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'TruncateSymbolToMatch parameter is invalid.';
  }
}

function truncateSymbolsToMatch(symbol: string, reference: string, side: SequenceSide): string {
  const symbols = Array.from(symbol);
  const targetLength = Array.from(reference).length;

  if (symbols.length <= targetLength) {
    return symbol;
  }

  const truncated =
    side === 'left'
      ? symbols.slice(0, targetLength)
      : symbols.slice(symbols.length - targetLength);

  return truncated.join('');
}

export const TruncateSymbolToMatch: ModuleDef = {
  id: 'TruncateSymbolToMatch',
  name: 'Truncate Symbol To Match',
  inputs: [
    { name: 'in', type: 'symbol', kind: 'sequence' },
    { name: 'reference', type: 'symbol', kind: 'sequence' },
  ],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {
    side: {
      key: 'side',
      label: 'Preserve Side',
      kind: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      required: true,
      description: 'Choose whether truncation preserves the left or right side of the sequence.',
    },
  },
  evaluate: (inputs, params) => {
    const inputSignal = inputs.in;
    const referenceSignal = inputs.reference;

    if (inputSignal.type !== 'symbol') {
      throw new Error('TruncateSymbolToMatch expects a symbol signal');
    }

    if (referenceSignal.type !== 'symbol') {
      throw new Error('TruncateSymbolToMatch expects a symbol sequence reference');
    }

    const side = normalizeSide(params.side);

    return {
      out: {
        type: 'symbol',
        value: truncateSymbolsToMatch(inputSignal.value, referenceSignal.value, side),
      },
    };
  },
};
