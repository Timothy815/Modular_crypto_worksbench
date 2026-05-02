import type { ModuleDef } from '../types';
import { expectPointOnCurveSignal, getPointOrder, normalizeEcCurveParams } from './ec-point';

export const PointOrder: ModuleDef = {
  id: 'PointOrder',
  name: 'Point Order',
  inputs: [{ name: 'point', type: 'ec-point' }],
  outputs: [{ name: 'out', type: 'integer' }],
  paramSchema: {
    p: {
      key: 'p',
      label: 'Prime Modulus p',
      kind: 'number',
      defaultValue: 17,
      required: true,
      description: 'Prime modulus for the receiving curve context.',
    },
    a: {
      key: 'a',
      label: 'Curve Parameter a',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Short Weierstrass curve parameter a.',
    },
    b: {
      key: 'b',
      label: 'Curve Parameter b',
      kind: 'number',
      defaultValue: 13,
      required: true,
      description: 'Short Weierstrass curve parameter b.',
    },
  },
  evaluate: (inputs, params) => {
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointOrder');
    const point = expectPointOnCurveSignal(inputs.point, curve, 'PointOrder', 'point input');

    return {
      out: {
        type: 'integer',
        value: getPointOrder(point, curve, { moduleName: 'PointOrder' }).toString(10),
      },
    };
  },
};
