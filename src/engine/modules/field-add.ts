import type { ModuleDef } from '../types';
import { expectFieldElementSignal, formatFieldResult, normalizePrimeFieldModulus } from './prime-field';

export const FieldAdd: ModuleDef = {
  id: 'FieldAdd',
  name: 'Field Add',
  inputs: [
    { name: 'a', type: 'integer' },
    { name: 'b', type: 'integer' },
  ],
  outputs: [{ name: 'out', type: 'integer' }],
  paramSchema: {
    modulus: {
      key: 'modulus',
      label: 'Prime Modulus p',
      kind: 'number',
      defaultValue: 5,
      required: true,
      description: 'Prime modulus p. Inputs must already be field elements in the range 0..p-1.',
    },
  },
  evaluate: (inputs, params) => {
    const modulus = normalizePrimeFieldModulus(params.modulus, 'FieldAdd');
    const a = expectFieldElementSignal(inputs.a, modulus, 'FieldAdd', 'input a');
    const b = expectFieldElementSignal(inputs.b, modulus, 'FieldAdd', 'input b');

    return {
      out: {
        type: 'integer',
        value: formatFieldResult(a.value + b.value, modulus),
      },
    };
  },
};
