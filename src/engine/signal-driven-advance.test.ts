import { describe, expect, it } from 'vitest';
import { executeTickedProject } from './executor';
import type { CompositeDef } from './composites';
import type { ModuleRegistry, Project } from './types';
import { AtLeast } from './modules/at-least';
import { Counter } from './modules/counter';
import { Clock } from './modules/clock';
import { Demux } from './modules/demux';
import { Gate } from './modules/gate';
import { KeyInput } from './modules/key-input';
import { LFSR } from './modules/lfsr';
import { Rotor } from './modules/rotor';
import { OR } from './modules/or';
import { SymbolToBits } from './modules/symbol-to-bits';
import { TextInput } from './modules/text-input';
import { BitSource } from './modules/bit-source';
import { BitsToSymbol } from './modules/bits-to-symbol';
import { Output } from './modules/output';
import { XOR } from './modules/xor';
import { BitOutput } from './modules/bit-output';

const RotorDoubleStepControl: CompositeDef = {
  id: 'RotorDoubleStepControl',
  name: 'Rotor Double-Step Control',
  kind: 'composite',
  version: 1,
  inputs: [
    { name: 'pulse', type: 'bits' },
    { name: 'turnoverA', type: 'bits' },
    { name: 'turnoverB', type: 'bits' },
  ],
  outputs: [{ name: 'step', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [
      { id: 'turnover-vote', defId: 'OR', params: {} },
      { id: 'step-gate', defId: 'Gate', params: {} },
    ],
    connections: [
      {
        from: { moduleId: 'turnover-vote', port: 'out' },
        to: { moduleId: 'step-gate', port: 'control' },
      },
    ],
  },
  inputBindings: [
    { externalPort: 'pulse', internalModuleId: 'step-gate', internalPort: 'in' },
    { externalPort: 'turnoverA', internalModuleId: 'turnover-vote', internalPort: 'a' },
    { externalPort: 'turnoverB', internalModuleId: 'turnover-vote', internalPort: 'b' },
  ],
  outputBindings: [
    { externalPort: 'step', internalModuleId: 'step-gate', internalPort: 'out' },
  ],
};

const RotorControlBankRouter: CompositeDef = {
  id: 'RotorControlBankRouter',
  name: 'Rotor Control Bank Router',
  kind: 'composite',
  version: 1,
  inputs: [
    { name: 'pulse', type: 'bits' },
    { name: 'enable', type: 'bits' },
    { name: 'select', type: 'bits' },
  ],
  outputs: [
    { name: 'stepA', type: 'bits' },
    { name: 'stepB', type: 'bits' },
  ],
  paramSchema: {},
  project: {
    modules: [
      { id: 'enable-gate', defId: 'Gate', params: {} },
      { id: 'step-demux', defId: 'Demux', params: {} },
    ],
    connections: [
      {
        from: { moduleId: 'enable-gate', port: 'out' },
        to: { moduleId: 'step-demux', port: 'in' },
      },
    ],
  },
  inputBindings: [
    { externalPort: 'pulse', internalModuleId: 'enable-gate', internalPort: 'in' },
    { externalPort: 'enable', internalModuleId: 'enable-gate', internalPort: 'control' },
    { externalPort: 'select', internalModuleId: 'step-demux', internalPort: 'select' },
  ],
  outputBindings: [
    { externalPort: 'stepA', internalModuleId: 'step-demux', internalPort: 'a' },
    { externalPort: 'stepB', internalModuleId: 'step-demux', internalPort: 'b' },
  ],
};

describe('Signal-driven advance', () => {
  // LFSR advance trace with seed [1,0,0,1,1], taps "0,2":
  //   [1,0,0,1,1] → fb=1^0=1, pop 1, unshift 1 → [1,1,0,0,1]
  //   [1,1,0,0,1] → fb=1^0=1, pop 1, unshift 1 → [1,1,1,0,0]
  //   [1,1,1,0,0] → fb=1^1=0, pop 0, unshift 0 → [0,1,1,1,0]
  //   [0,1,1,1,0] → fb=0^1=1, pop 0, unshift 1 → [1,0,1,1,1]

  describe('Clock → LFSR: period-2 clock advances LFSR every other tick', () => {
    it('LFSR advances only on clock pulse ticks', () => {
      const registry: ModuleRegistry = { Clock, LFSR };

      const project: Project = {
        modules: [
          {
            id: 'clk',
            defId: 'Clock',
            params: { period: 2, offset: 0, length: 6 },
          },
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'clk', port: 'pulse' },
            to: { moduleId: 'lfsr', port: 'clock' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 6);
      expect(result.ticks).toHaveLength(6);

      const seeds = result.paramsByModuleByTick['lfsr'].map(
        (p) => p.seed as number[],
      );

      // Clock period=2 → pulses on ticks 0, 2, 4; silent on 1, 3, 5
      expect(seeds[0]).toEqual([1, 0, 0, 1, 1]);
      expect(seeds[1]).toEqual([1, 1, 0, 0, 1]); // advanced (tick 0 pulsed)
      expect(seeds[2]).toEqual([1, 1, 0, 0, 1]); // same (tick 1 silent)
      expect(seeds[3]).toEqual([1, 1, 1, 0, 0]); // advanced (tick 2 pulsed)
      expect(seeds[4]).toEqual([1, 1, 1, 0, 0]); // same (tick 3 silent)
      expect(seeds[5]).toEqual([0, 1, 1, 1, 0]); // advanced (tick 4 pulsed)
    });

    it('LFSR without clock connection advances every tick', () => {
      const registry: ModuleRegistry = { LFSR };

      const project: Project = {
        modules: [
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
        ],
        connections: [],
      };

      const result = executeTickedProject(project, registry, 4);
      const seeds = result.paramsByModuleByTick['lfsr'].map(
        (p) => p.seed as number[],
      );

      expect(seeds[0]).toEqual([1, 0, 0, 1, 1]);
      expect(seeds[1]).toEqual([1, 1, 0, 0, 1]);
      expect(seeds[2]).toEqual([1, 1, 1, 0, 0]);
      expect(seeds[3]).toEqual([0, 1, 1, 1, 0]);
    });
  });

  describe('Clock → Rotor: period-2 clock advances rotor every other tick', () => {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    it('rotor position changes only on clock pulse ticks', () => {
      const registry: ModuleRegistry = { Clock, Rotor, TextInput };

      const project: Project = {
        modules: [
          {
            id: 'clk',
            defId: 'Clock',
            params: { period: 2, offset: 0, length: 6 },
          },
          {
            id: 'txt',
            defId: 'TextInput',
            params: { value: 'AAAAAA' },
          },
          {
            id: 'rotor',
            defId: 'Rotor',
            params: { wiring: ALPHABET.split(''), position: 0 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'clk', port: 'pulse' },
            to: { moduleId: 'rotor', port: 'clock' },
          },
          {
            from: { moduleId: 'txt', port: 'out' },
            to: { moduleId: 'rotor', port: 'in' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 6);
      expect(result.ticks).toHaveLength(6);

      const positions = result.paramsByModuleByTick['rotor'].map(
        (p) => p.position as number,
      );

      expect(positions[0]).toBe(0);
      expect(positions[1]).toBe(1); // advanced (tick 0 pulsed)
      expect(positions[2]).toBe(1); // same (tick 1 silent)
      expect(positions[3]).toBe(2); // advanced (tick 2 pulsed)
      expect(positions[4]).toBe(2); // same (tick 3 silent)
      expect(positions[5]).toBe(3); // advanced (tick 4 pulsed)
    });

    it('uses explicit turnover wiring to produce the middle-rotor double-step pattern', () => {
      const registry: ModuleRegistry = {
        Clock,
        Gate,
        OR,
        Rotor,
        Output,
        RotorDoubleStepControl,
      };

      const project: Project = {
        modules: [
          { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
          {
            id: 'left',
            defId: 'Rotor',
            params: {
              wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
              position: 0,
              ringOffset: 2,
              notches: 'Q',
            },
          },
          {
            id: 'middle',
            defId: 'Rotor',
            params: {
              wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE'.split(''),
              position: 4,
              ringOffset: 0,
              notches: 'E',
            },
          },
          {
            id: 'right',
            defId: 'Rotor',
            params: {
              wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'.split(''),
              position: 15,
              ringOffset: 0,
              notches: 'Q',
            },
          },
          { id: 'middle-step-control', defId: 'RotorDoubleStepControl', params: {} },
          { id: 'left-gate', defId: 'Gate', params: {} },
          { id: 'out', defId: 'Output', params: {} },
        ],
        connections: [
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'right', port: 'clock' } },
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'middle-step-control', port: 'pulse' } },
          { from: { moduleId: 'right', port: 'turnover' }, to: { moduleId: 'middle-step-control', port: 'turnoverA' } },
          { from: { moduleId: 'middle', port: 'turnover' }, to: { moduleId: 'middle-step-control', port: 'turnoverB' } },
          { from: { moduleId: 'middle-step-control', port: 'step' }, to: { moduleId: 'middle', port: 'clock' } },
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'left-gate', port: 'in' } },
          { from: { moduleId: 'middle', port: 'turnover' }, to: { moduleId: 'left-gate', port: 'control' } },
          { from: { moduleId: 'left-gate', port: 'out' }, to: { moduleId: 'left', port: 'clock' } },
          { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'middle', port: 'in' } },
          { from: { moduleId: 'middle', port: 'out' }, to: { moduleId: 'left', port: 'in' } },
          { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
        ],
      };

      const overrides = Array.from({ length: 4 }, () => ({
        right: { in: { type: 'symbol' as const, value: 'A' } },
      }));

      const result = executeTickedProject(project, registry, 4, overrides);

      expect(result.paramsByModuleByTick.left.map((params) => params.position)).toEqual([0, 1, 1, 1]);
      expect(result.paramsByModuleByTick.middle.map((params) => params.position)).toEqual([4, 5, 6, 6]);
      expect(result.paramsByModuleByTick.right.map((params) => params.position)).toEqual([15, 16, 17, 18]);

      expect(result.ticks[0].outputsByModuleId.middle.turnover.value).toEqual([1]);
      expect(result.ticks[1].outputsByModuleId.right.turnover.value).toEqual([1]);
    });

    it('lets one visible rotor bank route step pulses into a separate driven bank', () => {
      const registry: ModuleRegistry = {
        Clock,
        Demux,
        Gate,
        Rotor,
        TextInput,
        Output,
        RotorControlBankRouter,
      };

      const project: Project = {
        modules: [
          { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
          { id: 'text', defId: 'TextInput', params: { value: 'AAAA' } },
          {
            id: 'control-enable',
            defId: 'Rotor',
            params: {
              wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'.split(''),
              position: 0,
              ringOffset: 0,
              notches: 'A,C',
            },
          },
          {
            id: 'control-select',
            defId: 'Rotor',
            params: {
              wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE'.split(''),
              position: 0,
              ringOffset: 0,
              notches: 'A',
            },
          },
          {
            id: 'driven-left',
            defId: 'Rotor',
            params: {
              wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
              position: 0,
              ringOffset: 0,
              notches: '',
            },
          },
          {
            id: 'driven-right',
            defId: 'Rotor',
            params: {
              wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'.split(''),
              position: 0,
              ringOffset: 0,
              notches: '',
            },
          },
          { id: 'control-router', defId: 'RotorControlBankRouter', params: {} },
          { id: 'out', defId: 'Output', params: {} },
        ],
        connections: [
          { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'control-enable', port: 'in' } },
          { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'control-select', port: 'in' } },
          { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'driven-right', port: 'in' } },
          { from: { moduleId: 'driven-right', port: 'out' }, to: { moduleId: 'driven-left', port: 'in' } },
          { from: { moduleId: 'driven-left', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-enable', port: 'clock' } },
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-select', port: 'clock' } },
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-router', port: 'pulse' } },
          { from: { moduleId: 'control-enable', port: 'turnover' }, to: { moduleId: 'control-router', port: 'enable' } },
          { from: { moduleId: 'control-select', port: 'turnover' }, to: { moduleId: 'control-router', port: 'select' } },
          { from: { moduleId: 'control-router', port: 'stepA' }, to: { moduleId: 'driven-left', port: 'clock' } },
          { from: { moduleId: 'control-router', port: 'stepB' }, to: { moduleId: 'driven-right', port: 'clock' } },
        ],
      };

      const result = executeTickedProject(project, registry, 4);

      expect(result.paramsByModuleByTick['control-enable'].map((params) => params.position)).toEqual([0, 1, 2, 3]);
      expect(result.paramsByModuleByTick['control-select'].map((params) => params.position)).toEqual([0, 1, 2, 3]);
      expect(result.paramsByModuleByTick['driven-right'].map((params) => params.position)).toEqual([0, 1, 1, 1]);
      expect(result.paramsByModuleByTick['driven-left'].map((params) => params.position)).toEqual([0, 0, 0, 1]);

      expect(result.ticks[0].outputsByModuleId['control-router'].stepA.value).toEqual([0]);
      expect(result.ticks[0].outputsByModuleId['control-router'].stepB.value).toEqual([1]);
      expect(result.ticks[2].outputsByModuleId['control-router'].stepA.value).toEqual([1]);
      expect(result.ticks[2].outputsByModuleId['control-router'].stepB.value).toEqual([0]);
    });

    it('rotor without clock advances every tick', () => {
      const registry: ModuleRegistry = { Rotor, TextInput };

      const project: Project = {
        modules: [
          {
            id: 'txt',
            defId: 'TextInput',
            params: { value: 'AAAA' },
          },
          {
            id: 'rotor',
            defId: 'Rotor',
            params: { wiring: ALPHABET.split(''), position: 0 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'txt', port: 'out' },
            to: { moduleId: 'rotor', port: 'in' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 4);
      const positions = result.paramsByModuleByTick['rotor'].map(
        (p) => p.position as number,
      );

      expect(positions[0]).toBe(0);
      expect(positions[1]).toBe(1);
      expect(positions[2]).toBe(2);
      expect(positions[3]).toBe(3);
    });
  });

  describe('clock offset delays first advance', () => {
    it('offset=2 means no pulse until tick 2', () => {
      const registry: ModuleRegistry = { Clock, LFSR };

      const project: Project = {
        modules: [
          {
            id: 'clk',
            defId: 'Clock',
            params: { period: 1, offset: 2, length: 5 },
          },
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'clk', port: 'pulse' },
            to: { moduleId: 'lfsr', port: 'clock' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 5);
      const seeds = result.paramsByModuleByTick['lfsr'].map(
        (p) => p.seed as number[],
      );

      // Clock offset=2, period=1 → pulses: [0,0,1,1,1]
      // Ticks 0,1: no pulse → no advance
      // Tick 2: pulse → advance after
      // Tick 3: pulse → advance after
      // Tick 4: pulse → advance after
      expect(seeds[0]).toEqual([1, 0, 0, 1, 1]); // initial
      expect(seeds[1]).toEqual([1, 0, 0, 1, 1]); // no advance (tick 0 silent)
      expect(seeds[2]).toEqual([1, 0, 0, 1, 1]); // no advance (tick 1 silent)
      expect(seeds[3]).toEqual([1, 1, 0, 0, 1]); // advanced (tick 2 pulsed)
      expect(seeds[4]).toEqual([1, 1, 1, 0, 0]); // advanced (tick 3 pulsed)
    });
  });

  describe('inactive pulse shapes produce no advance', () => {
    it('[0] signal does not trigger advance', () => {
      const registry: ModuleRegistry = { BitSource, LFSR };

      // BitSource emitting [0] per tick — connected to LFSR clock
      const project: Project = {
        modules: [
          {
            id: 'src',
            defId: 'BitSource',
            params: { stream: [0, 0, 0, 0] },
          },
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'src', port: 'out' },
            to: { moduleId: 'lfsr', port: 'clock' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 4);
      const seeds = result.paramsByModuleByTick['lfsr'].map(
        (p) => p.seed as number[],
      );

      // All ticks receive [0] → no advance ever
      for (const seed of seeds) {
        expect(seed).toEqual([1, 0, 0, 1, 1]);
      }
    });

    it('empty [] signal does not trigger advance', () => {
      const registry: ModuleRegistry = { BitSource, LFSR };

      // BitSource with empty stream → tickSlice produces [] per tick
      const project: Project = {
        modules: [
          {
            id: 'src',
            defId: 'BitSource',
            params: { stream: [] },
          },
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'src', port: 'out' },
            to: { moduleId: 'lfsr', port: 'clock' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 3);
      const seeds = result.paramsByModuleByTick['lfsr'].map(
        (p) => p.seed as number[],
      );

      for (const seed of seeds) {
        expect(seed).toEqual([1, 0, 0, 1, 1]);
      }
    });
  });

  describe('shared clock drives multiple stateful modules', () => {
    it('one clock advances both LFSR and Rotor on the same ticks', () => {
      const registry: ModuleRegistry = { Clock, LFSR, Rotor, TextInput };
      const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      const project: Project = {
        modules: [
          {
            id: 'clk',
            defId: 'Clock',
            params: { period: 2, offset: 0, length: 4 },
          },
          {
            id: 'txt',
            defId: 'TextInput',
            params: { value: 'AAAA' },
          },
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
          {
            id: 'rotor',
            defId: 'Rotor',
            params: { wiring: ALPHABET.split(''), position: 0 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'clk', port: 'pulse' },
            to: { moduleId: 'lfsr', port: 'clock' },
          },
          {
            from: { moduleId: 'clk', port: 'pulse' },
            to: { moduleId: 'rotor', port: 'clock' },
          },
          {
            from: { moduleId: 'txt', port: 'out' },
            to: { moduleId: 'rotor', port: 'in' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 4);

      const lfsrSeeds = result.paramsByModuleByTick['lfsr'].map(
        (p) => p.seed as number[],
      );
      const rotorPositions = result.paramsByModuleByTick['rotor'].map(
        (p) => p.position as number,
      );

      // Period=2 → pulse on ticks 0, 2; silent on 1, 3
      // Both modules should advance in lockstep
      expect(lfsrSeeds[0]).toEqual([1, 0, 0, 1, 1]); // initial
      expect(lfsrSeeds[1]).toEqual([1, 1, 0, 0, 1]); // advanced
      expect(lfsrSeeds[2]).toEqual([1, 1, 0, 0, 1]); // same
      expect(lfsrSeeds[3]).toEqual([1, 1, 1, 0, 0]); // advanced

      expect(rotorPositions[0]).toBe(0);
      expect(rotorPositions[1]).toBe(1); // advanced
      expect(rotorPositions[2]).toBe(1); // same
      expect(rotorPositions[3]).toBe(2); // advanced
    });
  });

  describe('counter-driven control', () => {
    it('a counter threshold can gate a later stateful machine', () => {
      const registry: ModuleRegistry = {
        Clock,
        Counter,
        KeyInput,
        SymbolToBits,
        AtLeast,
        Gate,
        LFSR,
      };

      const project: Project = {
        modules: [
          {
            id: 'clock',
            defId: 'Clock',
            params: { period: 1, offset: 0, length: 6 },
          },
          {
            id: 'counter',
            defId: 'Counter',
            params: { width: 5, value: 0, step: 1 },
          },
          {
            id: 'threshold',
            defId: 'KeyInput',
            params: { value: 'D' },
          },
          {
            id: 'threshold-bits',
            defId: 'SymbolToBits',
            params: {},
          },
          {
            id: 'atleast',
            defId: 'AtLeast',
            params: {},
          },
          {
            id: 'gate',
            defId: 'Gate',
            params: {},
          },
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
        ],
        connections: [
          {
            from: { moduleId: 'clock', port: 'pulse' },
            to: { moduleId: 'counter', port: 'clock' },
          },
          {
            from: { moduleId: 'counter', port: 'out' },
            to: { moduleId: 'atleast', port: 'a' },
          },
          {
            from: { moduleId: 'threshold', port: 'out' },
            to: { moduleId: 'threshold-bits', port: 'in' },
          },
          {
            from: { moduleId: 'threshold-bits', port: 'out' },
            to: { moduleId: 'atleast', port: 'b' },
          },
          {
            from: { moduleId: 'clock', port: 'pulse' },
            to: { moduleId: 'gate', port: 'in' },
          },
          {
            from: { moduleId: 'atleast', port: 'out' },
            to: { moduleId: 'gate', port: 'control' },
          },
          {
            from: { moduleId: 'gate', port: 'out' },
            to: { moduleId: 'lfsr', port: 'clock' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 6);

      const counters = result.ticks.map(
        (tick) => tick.outputsByModuleId.counter.out.value,
      );
      const gates = result.ticks.map(
        (tick) => tick.outputsByModuleId.gate.out.value,
      );
      const seeds = result.paramsByModuleByTick.lfsr.map(
        (params) => params.seed as number[],
      );

      expect(counters).toEqual([
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 1],
      ]);

      expect(gates).toEqual([
        [0],
        [0],
        [0],
        [1],
        [1],
        [1],
      ]);

      expect(seeds[0]).toEqual([1, 0, 0, 1, 1]);
      expect(seeds[1]).toEqual([1, 0, 0, 1, 1]);
      expect(seeds[2]).toEqual([1, 0, 0, 1, 1]);
      expect(seeds[3]).toEqual([1, 0, 0, 1, 1]);
      expect(seeds[4]).toEqual([1, 1, 0, 0, 1]);
      expect(seeds[5]).toEqual([1, 1, 1, 0, 0]);
    });
  });

  describe('stateful composites', () => {
    it('clocked stateful internals inside a composite match the unwrapped graph', () => {
      const symbolStreamComposite: CompositeDef = {
        id: 'SymbolStream',
        name: 'Symbol Stream',
        kind: 'composite',
        version: 1,
        inputs: [{ name: 'clock', type: 'bits' }],
        outputs: [{ name: 'out', type: 'symbol' }],
        paramSchema: {},
        project: {
          modules: [
            {
              id: 'lfsr',
              defId: 'LFSR',
              params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
            },
            {
              id: 'decode',
              defId: 'BitsToSymbol',
              params: {},
            },
          ],
          connections: [
            {
              from: { moduleId: 'lfsr', port: 'out' },
              to: { moduleId: 'decode', port: 'in' },
            },
          ],
        },
        inputBindings: [
          {
            externalPort: 'clock',
            internalModuleId: 'lfsr',
            internalPort: 'clock',
          },
        ],
        outputBindings: [
          {
            externalPort: 'out',
            internalModuleId: 'decode',
            internalPort: 'out',
          },
        ],
      };

      const registry: ModuleRegistry = {
        Clock,
        LFSR,
        BitsToSymbol,
        Output,
        [symbolStreamComposite.id]: symbolStreamComposite,
      };

      const wrappedProject: Project = {
        modules: [
          {
            id: 'clk',
            defId: 'Clock',
            params: { period: 1, offset: 0, length: 4 },
          },
          {
            id: 'stream',
            defId: 'SymbolStream',
            params: {},
          },
          {
            id: 'output',
            defId: 'Output',
            params: {},
          },
        ],
        connections: [
          {
            from: { moduleId: 'clk', port: 'pulse' },
            to: { moduleId: 'stream', port: 'clock' },
          },
          {
            from: { moduleId: 'stream', port: 'out' },
            to: { moduleId: 'output', port: 'in' },
          },
        ],
      };

      const unwrappedProject: Project = {
        modules: [
          {
            id: 'clk',
            defId: 'Clock',
            params: { period: 1, offset: 0, length: 4 },
          },
          {
            id: 'lfsr',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
          },
          {
            id: 'decode',
            defId: 'BitsToSymbol',
            params: {},
          },
          {
            id: 'output',
            defId: 'Output',
            params: {},
          },
        ],
        connections: [
          {
            from: { moduleId: 'clk', port: 'pulse' },
            to: { moduleId: 'lfsr', port: 'clock' },
          },
          {
            from: { moduleId: 'lfsr', port: 'out' },
            to: { moduleId: 'decode', port: 'in' },
          },
          {
            from: { moduleId: 'decode', port: 'out' },
            to: { moduleId: 'output', port: 'in' },
          },
        ],
      };

      const wrappedResult = executeTickedProject(wrappedProject, registry, 4);
      const unwrappedResult = executeTickedProject(unwrappedProject, registry, 4);

      const wrappedOutputs = wrappedResult.ticks.map(
        (tick) => tick.outputsByModuleId.stream.out,
      );
      const unwrappedOutputs = unwrappedResult.ticks.map(
        (tick) => tick.outputsByModuleId.decode.out,
      );

      expect(wrappedOutputs).toEqual(unwrappedOutputs);
    });
  });

  describe('dependent clocking', () => {
    it('one stateful module can gate another module via its bit output', () => {
      const registry: ModuleRegistry = { Clock, LFSR, BitSource, XOR, BitOutput };

      const project: Project = {
        modules: [
          {
            id: 'clock',
            defId: 'Clock',
            params: { period: 1, offset: 0, length: 6 },
          },
          {
            id: 'plain',
            defId: 'BitSource',
            params: { stream: [1, 0, 1, 1, 0, 0] },
          },
          {
            id: 'gate',
            defId: 'LFSR',
            params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 1 },
          },
          {
            id: 'data',
            defId: 'LFSR',
            params: { seed: [1, 1, 0, 1, 0], taps: '1,3', outputLength: 1 },
          },
          {
            id: 'xor',
            defId: 'XOR',
            params: {},
          },
          {
            id: 'output',
            defId: 'BitOutput',
            params: {},
          },
        ],
        connections: [
          {
            from: { moduleId: 'clock', port: 'pulse' },
            to: { moduleId: 'gate', port: 'clock' },
          },
          {
            from: { moduleId: 'gate', port: 'out' },
            to: { moduleId: 'data', port: 'clock' },
          },
          {
            from: { moduleId: 'plain', port: 'out' },
            to: { moduleId: 'xor', port: 'a' },
          },
          {
            from: { moduleId: 'data', port: 'out' },
            to: { moduleId: 'xor', port: 'b' },
          },
          {
            from: { moduleId: 'xor', port: 'out' },
            to: { moduleId: 'output', port: 'in' },
          },
        ],
      };

      const result = executeTickedProject(project, registry, 6);

      const gateBits = result.ticks.map((tick) => {
        const signal = tick.outputsByModuleId.gate.out;
        if (signal.type !== 'bits') {
          throw new Error('Expected gate output to stay in the bit domain.');
        }
        return signal.value[0];
      });
      const dataSeeds = result.paramsByModuleByTick.data.map((params) => params.seed as number[]);

      expect(gateBits).toEqual([1, 1, 0, 0, 1, 1]);
      expect(dataSeeds[0]).toEqual([1, 1, 0, 1, 0]);
      expect(dataSeeds[1]).toEqual([0, 1, 1, 0, 1]); // advanced on tick 0
      expect(dataSeeds[2]).toEqual([1, 0, 1, 1, 0]); // advanced on tick 1
      expect(dataSeeds[3]).toEqual([1, 0, 1, 1, 0]); // gate silent on tick 2
      expect(dataSeeds[4]).toEqual([1, 0, 1, 1, 0]); // gate silent on tick 3
      expect(dataSeeds[5]).toEqual([1, 1, 0, 1, 1]); // advanced on tick 4
    });
  });
});
