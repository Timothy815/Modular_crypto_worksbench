import type { ModuleDef } from '../types';
import { expectBitsSignal, normalizePositiveInteger } from './bit-word';

export function validateRepeatBitsToLengthParam(fieldKey: string, value: unknown): string | null {
  if (fieldKey !== 'targetLength') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return 'RepeatBitsToLength target length must be a positive integer.';
  }

  return null;
}

function repeatBits(bits: number[], targetLength: number): number[] {
  if (bits.length === 0) {
    throw new Error('RepeatBitsToLength cannot repeat an empty bit sequence');
  }

  return Array.from({ length: targetLength }, (_, index) => bits[index % bits.length]);
}

export const RepeatBitsToLength: ModuleDef = {
  id: 'RepeatBitsToLength',
  name: 'Repeat Bits To Length',
  inputs: [{ name: 'in', type: 'bits', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
    targetLength: {
      key: 'targetLength',
      label: 'Target Length',
      kind: 'number',
      defaultValue: 16,
      required: true,
      description: 'Repeat the input bit pattern until this many output bits are produced.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'RepeatBitsToLength');
    const targetLength = normalizePositiveInteger(
      params.targetLength,
      'RepeatBitsToLength',
      'targetLength',
    );

    return {
      out: {
        type: 'bits',
        value: repeatBits(bits, targetLength),
      },
    };
  },
};
