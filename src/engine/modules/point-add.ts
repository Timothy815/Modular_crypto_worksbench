import type { ModuleDef } from '../types';
import { addPoints, expectPointOnCurveSignal, normalizeEcCurveParams } from './ec-point';

export const PointAdd: ModuleDef = {
  id: 'PointAdd',
  name: 'Point Add',
  inputs: [
    { name: 'a', type: 'ec-point' },
    { name: 'b', type: 'ec-point' },
  ],
  outputs: [{ name: 'out', type: 'ec-point' }],
  paramSchema: {
    p: {
      key: 'p',
      label: 'Prime Modulus p',
      kind: 'bigint-hex',
      defaultValue: '11',
      required: true,
    },
    a: {
      key: 'a',
      label: 'Curve Parameter a',
      kind: 'bigint-hex',
      defaultValue: '2',
      required: true,
    },
    b: {
      key: 'b',
      label: 'Curve Parameter b',
      kind: 'bigint-hex',
      defaultValue: '3',
      required: true,
    },
  },
  evaluate: (inputs, params) => {
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointAdd');
    const left = expectPointOnCurveSignal(inputs.a, curve, 'PointAdd', 'input a');
    const right = expectPointOnCurveSignal(inputs.b, curve, 'PointAdd', 'input b');
    return {
      out: addPoints(left, right, curve),
    };
  },
};
