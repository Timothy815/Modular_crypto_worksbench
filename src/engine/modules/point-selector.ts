import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';
import { expectPointOnCurveSignal, normalizeEcCurveParams } from './ec-point';

export const PointSelector: ModuleDef = {
  id: 'PointSelector',
  name: 'Point Selector',
  inputs: [
    { name: 'select', type: 'bits' },
    { name: 'keep', type: 'ec-point' },
    { name: 'take', type: 'ec-point' },
  ],
  outputs: [{ name: 'out', type: 'ec-point' }],
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
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'PointSelector');
    const selectBits = expectBitsSignal(inputs.select, 'PointSelector');
    if (selectBits.length !== 1) {
      throw new Error('PointSelector expects a 1-bit select signal.');
    }

    const keep = expectPointOnCurveSignal(inputs.keep, curve, 'PointSelector', 'keep input');
    const take = expectPointOnCurveSignal(inputs.take, curve, 'PointSelector', 'take input');
    const selected = selectBits[0] === 0 ? keep : take;

    return {
      out:
        selected.kind === 'infinity'
          ? { type: 'ec-point', value: { kind: 'infinity', curve: selected.curve } }
          : {
              type: 'ec-point',
              value: { kind: 'affine', curve: selected.curve, x: selected.xDecimal, y: selected.yDecimal },
            },
    };
  },
};
