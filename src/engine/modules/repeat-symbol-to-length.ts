import type { ModuleDef } from '../types';

export function validateRepeatSymbolToLengthParam(
  fieldKey: string,
  value: unknown,
): string | null {
  if (fieldKey !== 'targetLength') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return 'RepeatSymbolToLength target length must be a positive integer.';
  }

  return null;
}

function normalizePositiveInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    throw new Error('RepeatSymbolToLength requires "targetLength" to be a positive integer');
  }

  return value;
}

function repeatSymbols(symbols: string[], targetLength: number): string[] {
  if (symbols.length === 0) {
    throw new Error('RepeatSymbolToLength cannot repeat an empty symbol sequence');
  }

  return Array.from({ length: targetLength }, (_, index) => symbols[index % symbols.length]);
}

export const RepeatSymbolToLength: ModuleDef = {
  id: 'RepeatSymbolToLength',
  name: 'Repeat Symbol To Length',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    targetLength: {
      key: 'targetLength',
      label: 'Target Length',
      kind: 'number',
      defaultValue: 8,
      required: true,
      description: 'Repeat the input symbol sequence until this many output symbols are produced.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('RepeatSymbolToLength expects a symbol signal');
    }

    const targetLength = normalizePositiveInteger(params.targetLength);
    const symbols = Array.from(signal.value);

    return {
      out: {
        type: 'symbol',
        value: repeatSymbols(symbols, targetLength).join(''),
      },
    };
  },
};
