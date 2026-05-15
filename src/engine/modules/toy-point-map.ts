import type { ModuleDef } from '../types';
import { normalizeBigIntHexParam } from './bigint-param';
import { createAffineEcPointSignal, normalizeEcCurveParams, scalarMultiplyPoint } from './ec-point';
import { computeToyPointMapAnalysis } from '../analysis/toy-point-map-analysis';

export const ToyPointMap: ModuleDef = {
  id: 'ToyPointMap',
  name: 'Toy Point Map',
  inputs: [],
  outputs: [
    { name: 'selectedPoint', type: 'ec-point' },
    { name: 'walk3', type: 'ec-point' },
  ],
  paramSchema: {
    p: {
      key: 'p',
      label: 'Prime Modulus p',
      kind: 'bigint-hex',
      defaultValue: '11',
      required: true,
      description: 'Prime modulus for the bounded toy curve. V1 is intentionally limited to small readable finite-field maps.',
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
    selectedX: {
      key: 'selectedX',
      label: 'Selected Point X',
      kind: 'bigint-hex',
      defaultValue: '5',
      required: true,
      description: 'Affine x-coordinate for the highlighted toy-curve point.',
    },
    selectedY: {
      key: 'selectedY',
      label: 'Selected Point Y',
      kind: 'bigint-hex',
      defaultValue: '6',
      required: true,
      description: 'Affine y-coordinate for the highlighted toy-curve point.',
    },
    walkLength: {
      key: 'walkLength',
      label: 'Walk Length',
      kind: 'number',
      defaultValue: 5,
      required: true,
      description: 'Number of visible multiples to highlight on the toy curve map (1-8 in V1).',
    },
  },
  evaluate: (_inputs, params) => {
    const analysis = computeToyPointMapAnalysis({
      p: params.p,
      a: params.a,
      b: params.b,
      selectedX: params.selectedX,
      selectedY: params.selectedY,
      walkLength: params.walkLength,
    });
    const selected = analysis.walkEntries[0];
    const walk3 = analysis.walkEntries.find((entry) => entry.scalar === 3);
    if (!selected || selected.point.kind !== 'affine') {
      throw new Error('ToyPointMap requires one valid affine selected point.');
    }
    if (!walk3) {
      throw new Error('ToyPointMap requires a visible third multiple for the bounded walk.');
    }
    const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'ToyPointMap');
    const selectedX = normalizeBigIntHexParam(params.selectedX, 'ToyPointMap', 'selectedX');
    const selectedY = normalizeBigIntHexParam(params.selectedY, 'ToyPointMap', 'selectedY');
    const selectedPoint = createAffineEcPointSignal(selectedX, selectedY, curve.curve);
    const walk3Point = scalarMultiplyPoint(
      3n,
      {
        kind: 'affine',
        curve: curve.curve,
        xDecimal: selectedX.toString(10),
        yDecimal: selectedY.toString(10),
        x: selectedX,
        y: selectedY,
      },
      curve,
    );

    return {
      selectedPoint,
      walk3: walk3Point,
    };
  },
};
