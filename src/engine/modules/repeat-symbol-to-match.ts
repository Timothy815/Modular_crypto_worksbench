import type { ModuleDef } from '../types';

function repeatSymbolsToMatch(symbol: string, reference: string): string {
  const symbols = Array.from(symbol);
  const targetLength = Array.from(reference).length;

  if (targetLength === 0) {
    return '';
  }

  if (symbols.length === 0) {
    throw new Error('RepeatSymbolToMatch requires a non-empty input sequence to repeat');
  }

  return Array.from({ length: targetLength }, (_, index) => symbols[index % symbols.length]).join('');
}

export const RepeatSymbolToMatch: ModuleDef = {
  id: 'RepeatSymbolToMatch',
  name: 'Repeat Symbol To Match',
  inputs: [
    { name: 'in', type: 'symbol', kind: 'sequence' },
    { name: 'reference', type: 'symbol', kind: 'sequence' },
  ],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const inputSignal = inputs.in;
    const referenceSignal = inputs.reference;

    if (inputSignal.type !== 'symbol') {
      throw new Error('RepeatSymbolToMatch expects a symbol signal');
    }

    if (referenceSignal.type !== 'symbol') {
      throw new Error('RepeatSymbolToMatch expects a symbol sequence reference');
    }

    return {
      out: {
        type: 'symbol',
        value: repeatSymbolsToMatch(inputSignal.value, referenceSignal.value),
      },
    };
  },
};
