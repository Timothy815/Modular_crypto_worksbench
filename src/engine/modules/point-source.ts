import type { ModuleDef } from '../types';
import { createAffineEcPointSignal, normalizeEcCurveParams, validatePointSourceParamsStatic } from './ec-point';

export const PointSource: ModuleDef = {
  id: 'PointSource',
  name: 'Point Source',
  inputs: [],
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
    x: {
      key: 'x',
      label: 'Point X',
      kind: 'number',
      defaultValue: 5,
      required: true,
      description: 'Affine x-coordinate in the field range 0..p-1.',
    },
    y: {
      key: 'y',
      label: 'Point Y',
      kind: 'number',
      defaultValue: 6,
      required: true,
      description: 'Affine y-coordinate in the field range 0..p-1.',
    },
  },
  evaluate: (_inputs, params) => {
    const validationMessage = validatePointSourceParamsStatic(
      { p: params.p, a: params.a, b: params.b, x: params.x, y: params.y },
      'PointSource',
    );
    if (validationMessage) {
      throw new Error(validationMessage);
    }
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointSource');
    return {
      out: createAffineEcPointSignal(BigInt(params.x as number), BigInt(params.y as number), curve.curve),
    };
  },
};
