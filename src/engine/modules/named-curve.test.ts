import { describe, expect, it } from 'vitest';
import { NAMED_CURVE_REGISTRY, NamedCurveBasePoint } from './named-curve';
import { V1_REGISTRY } from './index';
import { executeProject } from '../executor';
import type { Project } from '../types';

describe('NAMED_CURVE_REGISTRY', () => {
  for (const [curveName, entry] of Object.entries(NAMED_CURVE_REGISTRY)) {
    describe(`${curveName} parameters`, () => {
      it('satisfies the curve equation Gy² ≡ Gx³ + a·Gx + b (mod p)', () => {
        const p  = BigInt(`0x${entry.p}`);
        const a  = BigInt(`0x${entry.a}`);
        const b  = BigInt(`0x${entry.b}`);
        const gx = BigInt(`0x${entry.gx}`);
        const gy = BigInt(`0x${entry.gy}`);

        const lhs = (gy * gy) % p;
        const rhs = ((gx * gx * gx + a * gx + b) % p + p) % p;
        expect(lhs).toBe(rhs);
      });

      it('has a field prime with bit 255 set (approximately 256-bit security)', () => {
        const p = BigInt(`0x${entry.p}`);
        expect(p >> 255n).toBe(1n);
      });
    });
  }
});

describe('NamedCurveBasePoint', () => {
  it('outputs the secp256k1 generator point and subgroup order', () => {
    const result = NamedCurveBasePoint.evaluate({}, { curve: 'secp256k1' });

    expect(result.point.type).toBe('ec-point');
    if (result.point.type !== 'ec-point') throw new Error('unreachable');

    const val = result.point.value;
    expect(val.kind).toBe('affine');
    if (val.kind !== 'affine') throw new Error('unreachable');

    const entry = NAMED_CURVE_REGISTRY['secp256k1'];
    expect(val.curve.p).toBe(BigInt(`0x${entry.p}`));
    expect(val.curve.a).toBe(BigInt(`0x${entry.a}`));
    expect(val.curve.b).toBe(BigInt(`0x${entry.b}`));
    expect(val.x).toBe(BigInt(`0x${entry.gx}`).toString(10));
    expect(val.y).toBe(BigInt(`0x${entry.gy}`).toString(10));

    expect(result.order.type).toBe('integer');
    if (result.order.type !== 'integer') throw new Error('unreachable');
    expect(result.order.value).toBe(BigInt(`0x${entry.n}`).toString(10));
  });

  it('outputs the P-256 generator point and subgroup order', () => {
    const result = NamedCurveBasePoint.evaluate({}, { curve: 'P-256' });

    expect(result.point.type).toBe('ec-point');
    if (result.point.type !== 'ec-point') throw new Error('unreachable');

    const val = result.point.value;
    expect(val.kind).toBe('affine');
    if (val.kind !== 'affine') throw new Error('unreachable');

    const entry = NAMED_CURVE_REGISTRY['P-256'];
    expect(val.curve.p).toBe(BigInt(`0x${entry.p}`));
    expect(val.x).toBe(BigInt(`0x${entry.gx}`).toString(10));

    expect(result.order.type).toBe('integer');
    if (result.order.type !== 'integer') throw new Error('unreachable');
    expect(result.order.value).toBe(BigInt(`0x${entry.n}`).toString(10));
  });

  it('throws on an unknown curve name', () => {
    expect(() => NamedCurveBasePoint.evaluate({}, { curve: 'not-a-curve' })).toThrow(
      /unknown curve/i,
    );
  });
});

describe('NamedCurveBasePoint in executeProject', () => {
  it('feeds into PointOnCurve and confirms G is on secp256k1', () => {
    const entry = NAMED_CURVE_REGISTRY['secp256k1'];
    const project: Project = {
      modules: [
        { id: 'g', defId: 'NamedCurveBasePoint', params: { curve: 'secp256k1' } },
        {
          id: 'check',
          defId: 'PointOnCurve',
          params: { p: entry.p, a: entry.a, b: entry.b },
        },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'g', port: 'point' }, to: { moduleId: 'check', port: 'in' } },
        { from: { moduleId: 'check', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    };

    const result = executeProject(project, V1_REGISTRY);
    expect(result.outputsByModuleId['check']?.['out']).toEqual({ type: 'bits', value: [1] });
  });

  it('performs 3G scalar multiplication on secp256k1 without error', () => {
    const entry = NAMED_CURVE_REGISTRY['secp256k1'];
    const project: Project = {
      modules: [
        { id: 'g', defId: 'NamedCurveBasePoint', params: { curve: 'secp256k1' } },
        { id: 'scalar-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 0, 0, 1, 1] } },
        { id: 'scalar', defId: 'BitsToInteger', params: {} },
        {
          id: 'smul',
          defId: 'ScalarMultiply',
          params: { p: entry.p, a: entry.a, b: entry.b },
        },
      ],
      connections: [
        { from: { moduleId: 'scalar-bits', port: 'out' }, to: { moduleId: 'scalar', port: 'in' } },
        { from: { moduleId: 'scalar', port: 'out' }, to: { moduleId: 'smul', port: 'scalar' } },
        { from: { moduleId: 'g', port: 'point' }, to: { moduleId: 'smul', port: 'point' } },
      ],
    };

    const result = executeProject(project, V1_REGISTRY);
    const out = result.outputsByModuleId['smul']?.['out'];
    expect(out?.type).toBe('ec-point');
    if (out?.type !== 'ec-point') throw new Error('unreachable');
    expect(out.value.kind).toBe('affine');
  });

  it('secp256k1 shared secret is equal for both ECDH parties', () => {
    const entry = NAMED_CURVE_REGISTRY['secp256k1'];
    const p = entry.p;
    const a = entry.a;
    const b = entry.b;

    const project: Project = {
      modules: [
        { id: 'g', defId: 'NamedCurveBasePoint', params: { curve: 'secp256k1' } },
        { id: 'alice-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 0, 0, 1, 1] } }, // 3
        { id: 'alice-scalar', defId: 'BitsToInteger', params: {} },
        { id: 'alice-pub', defId: 'ScalarMultiply', params: { p, a, b } },
        { id: 'bob-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 0, 1, 0, 1] } }, // 5
        { id: 'bob-scalar', defId: 'BitsToInteger', params: {} },
        { id: 'bob-pub', defId: 'ScalarMultiply', params: { p, a, b } },
        { id: 'alice-shared', defId: 'ScalarMultiply', params: { p, a, b } },
        { id: 'bob-shared', defId: 'ScalarMultiply', params: { p, a, b } },
        { id: 'verify', defId: 'PointEquals', params: { p, a, b } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'alice-bits', port: 'out' }, to: { moduleId: 'alice-scalar', port: 'in' } },
        { from: { moduleId: 'alice-scalar', port: 'out' }, to: { moduleId: 'alice-pub', port: 'scalar' } },
        { from: { moduleId: 'g', port: 'point' }, to: { moduleId: 'alice-pub', port: 'point' } },
        { from: { moduleId: 'bob-bits', port: 'out' }, to: { moduleId: 'bob-scalar', port: 'in' } },
        { from: { moduleId: 'bob-scalar', port: 'out' }, to: { moduleId: 'bob-pub', port: 'scalar' } },
        { from: { moduleId: 'g', port: 'point' }, to: { moduleId: 'bob-pub', port: 'point' } },
        { from: { moduleId: 'alice-scalar', port: 'out' }, to: { moduleId: 'alice-shared', port: 'scalar' } },
        { from: { moduleId: 'bob-pub', port: 'out' }, to: { moduleId: 'alice-shared', port: 'point' } },
        { from: { moduleId: 'bob-scalar', port: 'out' }, to: { moduleId: 'bob-shared', port: 'scalar' } },
        { from: { moduleId: 'alice-pub', port: 'out' }, to: { moduleId: 'bob-shared', port: 'point' } },
        { from: { moduleId: 'alice-shared', port: 'out' }, to: { moduleId: 'verify', port: 'a' } },
        { from: { moduleId: 'bob-shared', port: 'out' }, to: { moduleId: 'verify', port: 'b' } },
        { from: { moduleId: 'verify', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    };

    const result = executeProject(project, V1_REGISTRY);
    // PointEquals must emit 1 — Alice and Bob derive the same shared point
    expect(result.outputsByModuleId['verify']?.['out']).toEqual({ type: 'bits', value: [1] });
  });
});
