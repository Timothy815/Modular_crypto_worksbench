import { describe, expect, it } from 'vitest';
import { Clock } from './clock';
import { isTickSliceable } from '../types';
import { deriveTickCount, executeTickedProject } from '../executor';
import type { ModuleRegistry, Project } from '../types';

describe('Clock module', () => {
  describe('evaluate (full stream)', () => {
    it('emits all-1 stream with period=1, offset=0', () => {
      const result = Clock.evaluate({}, { period: 1, offset: 0, length: 5 });
      expect(result.pulse).toEqual({ type: 'bits', value: [1, 1, 1, 1, 1] });
    });

    it('emits pulse every 2 ticks', () => {
      const result = Clock.evaluate({}, { period: 2, offset: 0, length: 6 });
      expect(result.pulse).toEqual({ type: 'bits', value: [1, 0, 1, 0, 1, 0] });
    });

    it('emits pulse every 3 ticks', () => {
      const result = Clock.evaluate({}, { period: 3, offset: 0, length: 7 });
      expect(result.pulse).toEqual({ type: 'bits', value: [1, 0, 0, 1, 0, 0, 1] });
    });

    it('respects offset', () => {
      const result = Clock.evaluate({}, { period: 2, offset: 1, length: 6 });
      // tick 0: (0-1) < 0 → 0
      // tick 1: (1-1) = 0, 0%2=0 → 1
      // tick 2: (2-1) = 1, 1%2=1 → 0
      // tick 3: (3-1) = 2, 2%2=0 → 1
      // tick 4: (4-1) = 3, 3%2=1 → 0
      // tick 5: (5-1) = 4, 4%2=0 → 1
      expect(result.pulse).toEqual({ type: 'bits', value: [0, 1, 0, 1, 0, 1] });
    });

    it('emits empty stream with length=0', () => {
      const result = Clock.evaluate({}, { period: 1, offset: 0, length: 0 });
      expect(result.pulse).toEqual({ type: 'bits', value: [] });
    });

    it('clamps period to minimum 1', () => {
      const result = Clock.evaluate({}, { period: 0, offset: 0, length: 3 });
      expect(result.pulse).toEqual({ type: 'bits', value: [1, 1, 1] });
    });

    it('clamps negative offset to 0', () => {
      const result = Clock.evaluate({}, { period: 1, offset: -5, length: 3 });
      expect(result.pulse).toEqual({ type: 'bits', value: [1, 1, 1] });
    });
  });

  describe('tick slicing', () => {
    it('is tick-sliceable', () => {
      expect(isTickSliceable(Clock)).toBe(true);
    });

    it('tickLength returns the length param', () => {
      expect(Clock.tickLength({ period: 1, offset: 0, length: 10 })).toBe(10);
      expect(Clock.tickLength({ period: 1, offset: 0, length: 0 })).toBe(0);
    });

    it('tickSlice produces correct single-tick pulse for period=1', () => {
      for (let tick = 0; tick < 5; tick++) {
        const slicedParams = Clock.tickSlice({ period: 1, offset: 0, length: 5 }, tick);
        const result = Clock.evaluate({}, slicedParams);
        expect(result.pulse).toEqual({ type: 'bits', value: [1] });
      }
    });

    it('tickSlice produces correct single-tick pulse for period=2', () => {
      const expected = [1, 0, 1, 0, 1, 0];
      for (let tick = 0; tick < 6; tick++) {
        const slicedParams = Clock.tickSlice({ period: 2, offset: 0, length: 6 }, tick);
        const result = Clock.evaluate({}, slicedParams);
        expect(result.pulse).toEqual({ type: 'bits', value: [expected[tick]] });
      }
    });

    it('tickSlice produces correct single-tick pulse with offset', () => {
      const expected = [0, 1, 0, 1, 0, 1];
      for (let tick = 0; tick < 6; tick++) {
        const slicedParams = Clock.tickSlice({ period: 2, offset: 1, length: 6 }, tick);
        const result = Clock.evaluate({}, slicedParams);
        expect(result.pulse).toEqual({ type: 'bits', value: [expected[tick]] });
      }
    });

    it('tickSlice beyond length produces empty stream', () => {
      const slicedParams = Clock.tickSlice({ period: 1, offset: 0, length: 3 }, 5);
      const result = Clock.evaluate({}, slicedParams);
      expect(result.pulse).toEqual({ type: 'bits', value: [] });
    });

    it('full-stream and per-tick outputs are equivalent', () => {
      const params = { period: 3, offset: 1, length: 10 };
      const fullResult = Clock.evaluate({}, params);
      const fullStream = (fullResult.pulse as { type: 'bits'; value: number[] }).value;

      const perTick: number[] = [];
      for (let tick = 0; tick < 10; tick++) {
        const slicedParams = Clock.tickSlice(params, tick);
        const result = Clock.evaluate({}, slicedParams);
        const bits = (result.pulse as { type: 'bits'; value: number[] }).value;
        perTick.push(...bits);
      }

      expect(perTick).toEqual(fullStream);
    });
  });

  describe('integration with ticked executor', () => {
    it('Clock participates in deriveTickCount', () => {
      const registry: ModuleRegistry = { Clock };
      const project: Project = {
        modules: [
          { id: 'clk', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        ],
        connections: [],
      };
      expect(deriveTickCount(project, registry)).toBe(5);
    });

    it('Clock feeds XOR per-tick in a ticked pipeline', async () => {
      const { XOR } = await import('./xor');
      const { BitSource } = await import('./bit-source');

      const registry: ModuleRegistry = { Clock, XOR, BitSource };
      const project: Project = {
        modules: [
          { id: 'clk', defId: 'Clock', params: { period: 2, offset: 0, length: 4 } },
          { id: 'key', defId: 'BitSource', params: { stream: [1, 1, 1, 1] } },
          { id: 'xor', defId: 'XOR', params: {} },
        ],
        connections: [
          { from: { moduleId: 'clk', port: 'pulse' }, to: { moduleId: 'xor', port: 'a' } },
          { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        ],
      };

      const result = executeTickedProject(project, registry, 4);
      expect(result.ticks).toHaveLength(4);

      // Clock: period=2 → [1,0,1,0]
      // Key:   per tick → [1],[1],[1],[1]
      // XOR:   1^1=0, 0^1=1, 1^1=0, 0^1=1
      const outputs = result.ticks.map(
        (tick) => (tick.outputsByModuleId['xor']?.out as { type: 'bits'; value: number[] }).value,
      );
      expect(outputs).toEqual([[0], [1], [0], [1]]);
    });
  });
});
