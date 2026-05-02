import type { ModuleDef } from '../types';
import { expectScalarSignalInRange, formatScalarOrderResult, normalizeScalarOrder } from './scalar-order';

export const ScalarLinearCombine: ModuleDef = {
  id: 'ScalarLinearCombine',
  name: 'Scalar Linear Combine',
  inputs: [
    { name: 'nonce', type: 'integer' },
    { name: 'challenge', type: 'integer' },
    { name: 'private', type: 'integer' },
  ],
  outputs: [{ name: 'out', type: 'integer' }],
  paramSchema: {
    n: {
      key: 'n',
      label: 'Subgroup Order n',
      kind: 'number',
      defaultValue: 11,
      required: true,
      description: 'Visible scalar-order modulus for response arithmetic.',
    },
  },
  evaluate: (inputs, params) => {
    const order = normalizeScalarOrder(params.n, 'ScalarLinearCombine');
    const nonce = expectScalarSignalInRange(inputs.nonce, order, 'ScalarLinearCombine', 'nonce input');
    const challenge = expectScalarSignalInRange(inputs.challenge, order, 'ScalarLinearCombine', 'challenge input');
    const privateScalar = expectScalarSignalInRange(inputs.private, order, 'ScalarLinearCombine', 'private input');

    const result = nonce.value + challenge.value * privateScalar.value;

    return {
      out: {
        type: 'integer',
        value: formatScalarOrderResult(result, order),
      },
    };
  },
};
