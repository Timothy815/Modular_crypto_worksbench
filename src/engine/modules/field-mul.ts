import type { ModuleDef } from '../types';
import { expectFieldElementSignal, formatFieldResult, normalizePrimeFieldModulus } from './prime-field';

export const FieldMul: ModuleDef = {
  id: 'FieldMul',
  name: 'Field Mul',
  inputs: [
    { name: 'a', type: 'integer' },
    { name: 'b', type: 'integer' },
  ],
  outputs: [{ name: 'out', type: 'integer' }],
  paramSchema: {
    modulus: {
      key: 'modulus',
      label: 'Prime Modulus p',
      kind: 'bigint-hex',
      defaultValue: '5',
      required: true,
      description: 'Prime modulus p. Inputs must already be field elements in the range 0..p-1.',
    },
  },
  evaluate: (inputs, params) => {
    const modulus = normalizePrimeFieldModulus(params.modulus, 'FieldMul');
    const a = expectFieldElementSignal(inputs.a, modulus, 'FieldMul', 'input a');
    const b = expectFieldElementSignal(inputs.b, modulus, 'FieldMul', 'input b');

    return {
      out: {
        type: 'integer',
        value: formatFieldResult(a.value * b.value, modulus),
      },
    };
  },
};
