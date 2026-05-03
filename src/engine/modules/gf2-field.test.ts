import { describe, it, expect } from 'vitest';
import { gf2Mul, gf2Inv, GF2Mul, GF2Inv, AES_POLY } from './gf2-field';
import { executeProject } from '../executor';
import type { Project } from '../types';
import { V1_REGISTRY } from './index';

// AES polynomial
const AES = AES_POLY; // 0x11B

describe('gf2Mul', () => {
  it('0x57 × 0x83 = 0xC1 (AES spec example)', () => {
    expect(gf2Mul(0x57, 0x83, AES)).toBe(0xC1);
  });

  it('0x02 × 0x02 = 0x04', () => {
    expect(gf2Mul(0x02, 0x02, AES)).toBe(0x04);
  });

  it('0xFF × 0x01 = 0xFF (identity)', () => {
    expect(gf2Mul(0xFF, 0x01, AES)).toBe(0xFF);
  });

  it('0x01 × any = any (identity)', () => {
    for (const x of [0x00, 0x01, 0x57, 0x83, 0xFF]) {
      expect(gf2Mul(0x01, x, AES)).toBe(x);
    }
  });

  it('0x00 × any = 0 (zero absorption)', () => {
    for (const x of [0x01, 0x57, 0x83, 0xFF]) {
      expect(gf2Mul(0x00, x, AES)).toBe(0);
    }
  });

  it('0x80 × 0x02 triggers polynomial reduction to 0x1B', () => {
    // 0x80 << 1 = 0x100, which is > 0xFF, so XOR with 0x11B & 0xFF = 0x1B
    expect(gf2Mul(0x80, 0x02, AES)).toBe(0x1B);
  });

  it('is commutative', () => {
    for (const [a, b] of [[0x57, 0x83], [0x02, 0x80], [0x3A, 0xC4]] as [number, number][]) {
      expect(gf2Mul(a, b, AES)).toBe(gf2Mul(b, a, AES));
    }
  });

  it('result is always a single byte', () => {
    for (let a = 0; a < 256; a += 17) {
      for (let b = 0; b < 256; b += 19) {
        const r = gf2Mul(a, b, AES);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(0xFF);
      }
    }
  });
});

describe('gf2Inv', () => {
  it('gf2Inv(0) = 0 by convention', () => {
    expect(gf2Inv(0, AES)).toBe(0);
  });

  it('gf2Inv(1) = 1 (self-inverse)', () => {
    expect(gf2Inv(1, AES)).toBe(1);
  });

  it('inverse property: a × gf2Inv(a) = 1 for all nonzero a', () => {
    for (let a = 1; a < 256; a++) {
      const inv = gf2Inv(a, AES);
      expect(gf2Mul(a, inv, AES)).toBe(1);
    }
  });

  it('double inverse: gf2Inv(gf2Inv(a)) = a for all nonzero a', () => {
    for (let a = 1; a < 256; a++) {
      expect(gf2Inv(gf2Inv(a, AES), AES)).toBe(a);
    }
  });

  it('AES known value: gf2Inv(0x35) produces a field inverse', () => {
    const inv = gf2Inv(0x35, AES);
    expect(gf2Mul(0x35, inv, AES)).toBe(1);
  });
});

function makeBits(byte: number): number[] {
  const bits: number[] = [];
  for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  return bits;
}

function readBits(bits: number[]): number {
  let val = 0;
  for (const b of bits) val = (val << 1) | (b & 1);
  return val & 0xFF;
}

describe('GF2Mul module', () => {
  it('evaluates 0x57 × 0x83 = 0xC1 via module evaluate()', () => {
    const inputs = {
      a: { type: 'bits' as const, value: makeBits(0x57) },
      b: { type: 'bits' as const, value: makeBits(0x83) },
    };
    const result = GF2Mul.evaluate(inputs, { poly: '11B' });
    expect(result.out.type).toBe('bits');
    if (result.out.type === 'bits') {
      expect(readBits(result.out.value)).toBe(0xC1);
    }
  });

  it('throws on non-8-bit input a', () => {
    const inputs = {
      a: { type: 'bits' as const, value: [0, 1, 0] },
      b: { type: 'bits' as const, value: makeBits(0x02) },
    };
    expect(() => GF2Mul.evaluate(inputs, { poly: '11B' })).toThrow();
  });

  it('throws on non-8-bit input b', () => {
    const inputs = {
      a: { type: 'bits' as const, value: makeBits(0x02) },
      b: { type: 'bits' as const, value: [1] },
    };
    expect(() => GF2Mul.evaluate(inputs, { poly: '11B' })).toThrow();
  });

  it('throws on out-of-range poly', () => {
    const inputs = {
      a: { type: 'bits' as const, value: makeBits(0x57) },
      b: { type: 'bits' as const, value: makeBits(0x83) },
    };
    expect(() => GF2Mul.evaluate(inputs, { poly: '0FF' })).toThrow();
  });
});

describe('GF2Inv module', () => {
  it('evaluates inverse via module evaluate()', () => {
    const aVal = 0x35;
    const inputs = {
      in: { type: 'bits' as const, value: makeBits(aVal) },
    };
    const result = GF2Inv.evaluate(inputs, { poly: '11B' });
    expect(result.out.type).toBe('bits');
    if (result.out.type === 'bits') {
      const inv = readBits(result.out.value);
      expect(gf2Mul(aVal, inv, AES)).toBe(1);
    }
  });

  it('returns 0 for 0 input', () => {
    const inputs = {
      in: { type: 'bits' as const, value: makeBits(0) },
    };
    const result = GF2Inv.evaluate(inputs, { poly: '11B' });
    if (result.out.type === 'bits') {
      expect(readBits(result.out.value)).toBe(0);
    }
  });

  it('throws on non-8-bit input', () => {
    const inputs = {
      in: { type: 'bits' as const, value: [0, 1] },
    };
    expect(() => GF2Inv.evaluate(inputs, { poly: '11B' })).toThrow();
  });
});

describe('GF2Mul executeProject integration', () => {
  it('produces correct output in a simple project', () => {
    const project: Project = {
      modules: [
        { id: 'src-a', defId: 'HexSource', params: { value: '57' } },
        { id: 'src-b', defId: 'HexSource', params: { value: '83' } },
        { id: 'mul', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'src-a', port: 'out' }, to: { moduleId: 'mul', port: 'a' } },
        { from: { moduleId: 'src-b', port: 'out' }, to: { moduleId: 'mul', port: 'b' } },
        { from: { moduleId: 'mul', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    };
    const result = executeProject(project, V1_REGISTRY);
    const outputSignal = result.outputsByModuleId['mul']?.['out'];
    expect(outputSignal?.type).toBe('bits');
    if (outputSignal?.type === 'bits') {
      expect(readBits(outputSignal.value)).toBe(0xC1);
    }
  });
});

describe('GF2Inv executeProject integration', () => {
  it('produces a valid inverse in a simple project', () => {
    const aVal = 0x57;
    const project: Project = {
      modules: [
        { id: 'src', defId: 'HexSource', params: { value: '57' } },
        { id: 'inv', defId: 'GF2Inv', params: { poly: '11B' } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'src', port: 'out' }, to: { moduleId: 'inv', port: 'in' } },
        { from: { moduleId: 'inv', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    };
    const result = executeProject(project, V1_REGISTRY);
    const outputSignal = result.outputsByModuleId['inv']?.['out'];
    expect(outputSignal?.type).toBe('bits');
    if (outputSignal?.type === 'bits') {
      const inv = readBits(outputSignal.value);
      expect(gf2Mul(aVal, inv, AES)).toBe(1);
    }
  });
});
