import type { ModuleDef } from '../types';
import { expectPointOnCurveSignal, normalizeEcCurveParams } from './ec-point';
import { parseUnsignedIntegerString } from './integer-signal';
import { formatScalarOrderResult, normalizeScalarOrder } from './scalar-order';

export const ChallengeCombine: ModuleDef = {
  id: 'ChallengeCombine',
  name: 'Challenge Combine',
  inputs: [
    { name: 'commitment', type: 'ec-point' },
    { name: 'publicKey', type: 'ec-point' },
    { name: 'message', type: 'integer' },
  ],
  outputs: [{ name: 'out', type: 'integer' }],
  paramSchema: {
    p: {
      key: 'p',
      label: 'Prime Modulus p',
      kind: 'bigint-hex',
      defaultValue: '11',
      required: true,
      description: 'Prime modulus for the receiving curve context.',
    },
    a: {
      key: 'a',
      label: 'Curve Parameter a',
      kind: 'bigint-hex',
      defaultValue: '2',
      required: true,
      description: 'Short Weierstrass curve parameter a.',
    },
    b: {
      key: 'b',
      label: 'Curve Parameter b',
      kind: 'bigint-hex',
      defaultValue: '3',
      required: true,
      description: 'Short Weierstrass curve parameter b.',
    },
    n: {
      key: 'n',
      label: 'Subgroup Order n',
      kind: 'bigint-hex',
      defaultValue: 'B',
      required: true,
      description: 'Visible scalar-order modulus for the pedagogical challenge stage.',
    },
  },
  evaluate: (inputs, params) => {
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'ChallengeCombine');
    const order = normalizeScalarOrder(params.n, 'ChallengeCombine');
    const commitment = expectPointOnCurveSignal(inputs.commitment, curve, 'ChallengeCombine', 'commitment input');
    const publicKey = expectPointOnCurveSignal(inputs.publicKey, curve, 'ChallengeCombine', 'public-key input');

    if (commitment.kind === 'infinity') {
      throw new Error('ChallengeCombine expects the commitment input to be an affine point on the declared curve.');
    }
    if (publicKey.kind === 'infinity') {
      throw new Error('ChallengeCombine expects the public-key input to be an affine point on the declared curve.');
    }
    if (inputs.message.type !== 'integer') {
      throw new Error('ChallengeCombine expects "message" to be an integer signal.');
    }

    const message = parseUnsignedIntegerString(inputs.message.value, 'ChallengeCombine');
    const combined = commitment.x + commitment.y + publicKey.x + publicKey.y + message;

    return {
      out: {
        type: 'integer',
        value: formatScalarOrderResult(combined, order),
      },
    };
  },
};
