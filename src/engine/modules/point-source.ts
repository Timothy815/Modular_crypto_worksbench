import type { ModuleDef } from '../types';
import { normalizeBigIntHexParam } from './bigint-param';
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
      kind: 'bigint-hex',
      defaultValue: '11',
      required: true,
      description: 'Prime modulus for the curve (hex). For secp256k1 use FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F.',
    },
    a: {
      key: 'a',
      label: 'Curve Parameter a',
      kind: 'bigint-hex',
      defaultValue: '2',
      required: true,
      description: 'Short Weierstrass curve parameter a (hex), reduced into 0..p-1.',
    },
    b: {
      key: 'b',
      label: 'Curve Parameter b',
      kind: 'bigint-hex',
      defaultValue: '3',
      required: true,
      description: 'Short Weierstrass curve parameter b (hex), reduced into 0..p-1.',
    },
    x: {
      key: 'x',
      label: 'Point X',
      kind: 'bigint-hex',
      defaultValue: '5',
      required: true,
      description: 'Affine x-coordinate (hex) in the field range 0..p-1.',
    },
    y: {
      key: 'y',
      label: 'Point Y',
      kind: 'bigint-hex',
      defaultValue: '6',
      required: true,
      description: 'Affine y-coordinate (hex) in the field range 0..p-1.',
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
    const x = normalizeBigIntHexParam(params.x, 'PointSource', 'x');
    const y = normalizeBigIntHexParam(params.y, 'PointSource', 'y');
    return {
      out: createAffineEcPointSignal(x, y, curve.curve),
    };
  },
};
