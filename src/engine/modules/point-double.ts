import type { ModuleDef } from '../types';
import { doublePoint, expectPointOnCurveSignal, normalizeEcCurveParams } from './ec-point';

export const PointDouble: ModuleDef = {
  id: 'PointDouble',
  name: 'Point Double',
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
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointDouble');
    const point = expectPointOnCurveSignal(inputs.in, curve, 'PointDouble', 'input');
    return {
      out: doublePoint(point, curve),
    };
  },
};
