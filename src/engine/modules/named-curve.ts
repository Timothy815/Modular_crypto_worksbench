import type { ModuleDef } from '../types';

export interface NamedCurveEntry {
  readonly p: string;
  readonly a: string;
  readonly b: string;
  readonly gx: string;
  readonly gy: string;
  readonly n: string;
  readonly label: string;
}

/**
 * Authoritative named curve registry.
 * Values sourced from SEC 2 (secp256k1) and NIST FIPS 186-5 (P-256).
 * All field values stored as uppercase hex strings without 0x prefix.
 */
export const NAMED_CURVE_REGISTRY: Record<string, NamedCurveEntry> = {
  secp256k1: {
    label: 'secp256k1 (Bitcoin / most ECC pedagogy)',
    p:  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F',
    a:  '0',
    b:  '7',
    gx: '79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798',
    gy: '483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8',
    n:  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141',
  },
  'P-256': {
    label: 'P-256 (NIST / most widely deployed)',
    p:  'FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF',
    a:  'FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC',
    b:  '5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B',
    gx: '6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296',
    gy: '4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5',
    n:  'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551',
  },
};

/** IDs of ECC primitive modules that carry explicit p/a/b params. */
export const ECC_CURVE_PARAM_MODULE_IDS = new Set([
  'PointSource',
  'PointOnCurve',
  'PointNegate',
  'PointAdd',
  'PointDouble',
  'PointOrder',
  'PointEquals',
  'ScalarMultiply',
  'ChallengeCombine',
]);

export const NamedCurveBasePoint: ModuleDef = {
  id: 'NamedCurveBasePoint',
  name: 'Named Curve Base Point',
  inputs: [],
  outputs: [
    { name: 'point', type: 'ec-point' },
    { name: 'order', type: 'integer' },
  ],
  paramSchema: {
    curve: {
      key: 'curve',
      label: 'Curve',
      kind: 'select',
      defaultValue: 'secp256k1',
      required: true,
      description: 'Standard elliptic curve. Outputs the generator point G and subgroup order n.',
      options: Object.entries(NAMED_CURVE_REGISTRY).map(([value, entry]) => ({
        value,
        label: entry.label,
      })),
    },
  },
  evaluate: (_inputs, params) => {
    const curveName = String(params.curve ?? 'secp256k1');
    const entry = NAMED_CURVE_REGISTRY[curveName];
    if (!entry) {
      throw new Error(`NamedCurveBasePoint: unknown curve "${curveName}"`);
    }

    const p  = BigInt(`0x${entry.p}`);
    const a  = BigInt(`0x${entry.a}`);
    const b  = BigInt(`0x${entry.b}`);
    const gx = BigInt(`0x${entry.gx}`);
    const gy = BigInt(`0x${entry.gy}`);
    const n  = BigInt(`0x${entry.n}`);

    return {
      point: {
        type: 'ec-point' as const,
        value: {
          kind: 'affine' as const,
          curve: { p, a, b },
          x: gx.toString(10),
          y: gy.toString(10),
        },
      },
      order: {
        type: 'integer' as const,
        value: n.toString(10),
      },
    };
  },
};
