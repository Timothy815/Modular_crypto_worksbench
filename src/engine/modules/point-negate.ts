import type { ModuleDef } from '../types';
import { expectPointOnCurveSignal, negatePoint, normalizeEcCurveParams } from './ec-point';

export const PointNegate: ModuleDef = {
  id: 'PointNegate',
  name: 'Point Negate',
  inputs: [{ name: 'in', type: 'ec-point' }],
  outputs: [{ name: 'out', type: 'ec-point' }],
  paramSchema: {
    p: {
      key: 'p',
      label: 'Prime Modulus p',
      kind: 'number',
      defaultValue: 17,
      required: true,
    },
    a: {
      key: 'a',
      label: 'Curve Parameter a',
      kind: 'number',
      defaultValue: 2,
      required: true,
    },
    b: {
      key: 'b',
      label: 'Curve Parameter b',
      kind: 'number',
      defaultValue: 3,
      required: true,
    },
  },
  evaluate: (inputs, params) => {
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointNegate');
    const point = expectPointOnCurveSignal(inputs.in, curve, 'PointNegate', 'input');
    return {
      out: negatePoint(point, curve),
    };
  },
};
