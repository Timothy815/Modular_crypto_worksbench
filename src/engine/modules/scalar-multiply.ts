import type { ModuleDef } from '../types';
import { parseUnsignedIntegerString } from './integer-signal';
import { expectPointOnCurveSignal, normalizeEcCurveParams, scalarMultiplyPoint } from './ec-point';

export const ScalarMultiply: ModuleDef = {
  id: 'ScalarMultiply',
  name: 'Scalar Multiply',
  inputs: [
    { name: 'scalar', type: 'integer' },
    { name: 'point', type: 'ec-point' },
  ],
  outputs: [{ name: 'out', type: 'ec-point' }],
  paramSchema: {
    p: {
      key: 'p',
      label: 'Prime Modulus p',
      kind: 'number',
      defaultValue: 17,
      required: true,
      description: 'Prime modulus for the visible pedagogical curve.',
    },
    a: {
      key: 'a',
      label: 'Curve Parameter a',
      kind: 'number',
      defaultValue: 2,
      required: true,
      description: 'Short Weierstrass curve parameter a, reduced into 0..p-1.',
    },
    b: {
      key: 'b',
      label: 'Curve Parameter b',
      kind: 'number',
      defaultValue: 3,
      required: true,
      description: 'Short Weierstrass curve parameter b, reduced into 0..p-1.',
    },
  },
  evaluate: (inputs, params) => {
    if (inputs.scalar.type !== 'integer') {
      throw new Error('ScalarMultiply expects "scalar" to be an integer signal.');
    }
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'ScalarMultiply');
    const scalar = parseUnsignedIntegerString(inputs.scalar.value, 'ScalarMultiply');
    const point = expectPointOnCurveSignal(inputs.point, curve, 'ScalarMultiply', 'point input');

    return {
      out: scalarMultiplyPoint(scalar, point, curve),
    };
  },
};
