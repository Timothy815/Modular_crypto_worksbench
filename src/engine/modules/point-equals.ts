import type { ModuleDef } from '../types';
import { expectPointOnCurveSignal, normalizeEcCurveParams } from './ec-point';

export const PointEquals: ModuleDef = {
  id: 'PointEquals',
  name: 'Point Equals',
  inputs: [
    { name: 'a', type: 'ec-point' },
    { name: 'b', type: 'ec-point' },
  ],
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
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointEquals');
    const left = expectPointOnCurveSignal(inputs.a, curve, 'PointEquals', 'input a');
    const right = expectPointOnCurveSignal(inputs.b, curve, 'PointEquals', 'input b');
    const pointsEqual =
      left.kind === right.kind &&
      (left.kind === 'infinity' || (left.kind === 'affine' && right.kind === 'affine' && left.x === right.x && left.y === right.y));
    return {
      out: { type: 'bits', value: [pointsEqual ? 1 : 0] },
    };
  },
};
