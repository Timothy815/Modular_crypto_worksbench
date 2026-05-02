import type { ModuleDef } from '../types';
import { expectFieldElementSignal, multiplicativeInverse, normalizePrimeFieldModulus } from './prime-field';

export const FieldInverse: ModuleDef = {
  id: 'FieldInverse',
  name: 'Field Inverse',
  inputs: [{ name: 'in', type: 'integer' }],
  outputs: [{ name: 'out', type: 'integer' }],
  paramSchema: {
    modulus: {
      key: 'modulus',
      label: 'Prime Modulus p',
      kind: 'number',
      defaultValue: 5,
      required: true,
      description: 'Prime modulus p. The input must already be a field element in the range 0..p-1.',
    },
  },
  evaluate: (inputs, params) => {
    const modulus = normalizePrimeFieldModulus(params.modulus, 'FieldInverse');
    const input = expectFieldElementSignal(inputs.in, modulus, 'FieldInverse', 'input');

    if (input.value === 0n) {
      throw new Error(`FieldInverse is undefined for 0 modulo ${modulus.toString(10)}`);
    }

    return {
      out: {
        type: 'integer',
        value: multiplicativeInverse(input.value, modulus).toString(10),
      },
    };
  },
};
