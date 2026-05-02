import type { ModuleDef } from '../types';
import { expectPointOnCurveSignal, normalizeEcCurveParams } from './ec-point';

export const PointOnCurve: ModuleDef = {
  id: 'PointOnCurve',
  name: 'Point On Curve',
  inputs: [{ name: 'in', type: 'ec-point' }],
  outputs: [{ name: 'out', type: 'bits' }],
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
  },
  evaluate: (inputs, params) => {
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointOnCurve');
    expectPointOnCurveSignal(inputs.in, curve, 'PointOnCurve', 'input');
    return {
      out: { type: 'bits', value: [1] },
    };
  },
};
