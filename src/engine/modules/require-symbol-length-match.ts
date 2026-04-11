import type { ModuleDef } from '../types';
import { formatRequireLengthMatchMessage } from './require-length-match-message';

function countSymbols(symbol: string): number {
  return Array.from(symbol).length;
}

function requireSymbolLengthMatch(symbol: string, reference: string): string {
  const inputLength = countSymbols(symbol);
  const referenceLength = countSymbols(reference);

  if (inputLength !== referenceLength) {
    throw new Error(formatRequireLengthMatchMessage('RequireSymbolLengthMatch', inputLength, referenceLength, 'char'));
  }

  return symbol;
}

export const RequireSymbolLengthMatch: ModuleDef = {
  id: 'RequireSymbolLengthMatch',
  name: 'Require Symbol Length Match',
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
      throw new Error('RequireSymbolLengthMatch expects a symbol signal');
    }

    if (referenceSignal.type !== 'symbol') {
      throw new Error('RequireSymbolLengthMatch expects a symbol sequence reference');
    }

    return {
      out: {
        type: 'symbol',
        value: requireSymbolLengthMatch(inputSignal.value, referenceSignal.value),
      },
    };
  },
};
