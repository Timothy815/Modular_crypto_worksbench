import { describe, expect, it } from 'vitest';

import { executeTickedProject } from './executor';
import type {
  ModuleInputs,
  ModuleRegistry,
  Project,
  StatefulModuleDef,
} from './types';
import { isStatefulModule } from './types';
import { Rotor } from './modules/rotor';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// A minimal stateful module for testing: shifts a symbol by an
// incrementing offset. Position advances by 1 each tick.
const ShiftModule: StatefulModuleDef = {
  id: 'ShiftModule',
  name: 'Shift Module',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    offset: {
      key: 'offset',
      label: 'Offset',
      kind: 'number',
      defaultValue: 0,
    },
  },
  evaluate: (inputs, params) => {
    const index = ALPHABET.indexOf(String(inputs.in.value).toUpperCase());
    const offset = (params.offset as number) ?? 0;
    const shifted = (index + offset) % 26;
    return { out: { type: 'symbol', value: ALPHABET[shifted] } };
  },
  advance: (params) => ({
    ...params,
    offset: (((params.offset as number) ?? 0) + 1) % 26,
  }),
};

// A stateless pass-through for comparison
const PassThrough = {
  id: 'PassThrough',
  name: 'Pass Through',
  inputs: [{ name: 'in', type: 'symbol' as const }],
  outputs: [{ name: 'out', type: 'symbol' as const }],
  paramSchema: {},
  evaluate: (inputs: ModuleInputs) => ({ out: inputs.in }),
};

describe('isStatefulModule', () => {
  it('returns true for modules with an advance function', () => {
    expect(isStatefulModule(ShiftModule)).toBe(true);
  });

  it('returns false for modules without advance', () => {
    expect(isStatefulModule(PassThrough)).toBe(false);
  });

  it('returns true for the Rotor module', () => {
    expect(isStatefulModule(Rotor)).toBe(true);
  });
});

describe('executeTickedProject', () => {
  const registry: ModuleRegistry = {
    ShiftModule,
    PassThrough,
    Rotor,
  };

  it('produces one ExecutionResult per tick', () => {
    const project: Project = {
      modules: [{ id: 'shift1', defId: 'ShiftModule', params: { offset: 0 } }],
      connections: [],
    };

    const overrides: Record<string, ModuleInputs>[] = [
      { shift1: { in: { type: 'symbol', value: 'A' } } },
      { shift1: { in: { type: 'symbol', value: 'A' } } },
      { shift1: { in: { type: 'symbol', value: 'A' } } },
    ];

    const result = executeTickedProject(project, registry, 3, overrides);
    expect(result.ticks).toHaveLength(3);
  });

  it('advances stateful module params between ticks', () => {
    const project: Project = {
      modules: [{ id: 'shift1', defId: 'ShiftModule', params: { offset: 0 } }],
      connections: [],
    };

    // Feed 'A' at every tick — output should shift by 0, 1, 2
    const overrides: Record<string, ModuleInputs>[] = [
      { shift1: { in: { type: 'symbol', value: 'A' } } },
      { shift1: { in: { type: 'symbol', value: 'A' } } },
      { shift1: { in: { type: 'symbol', value: 'A' } } },
    ];

    const result = executeTickedProject(project, registry, 3, overrides);

    // Tick 0: offset=0 → A+0 = A
    expect(result.ticks[0].outputsByModuleId.shift1.out).toEqual({
      type: 'symbol',
      value: 'A',
    });
    // Tick 1: offset=1 → A+1 = B
    expect(result.ticks[1].outputsByModuleId.shift1.out).toEqual({
      type: 'symbol',
      value: 'B',
    });
    // Tick 2: offset=2 → A+2 = C
    expect(result.ticks[2].outputsByModuleId.shift1.out).toEqual({
      type: 'symbol',
      value: 'C',
    });
  });

  it('records per-tick param snapshots for tracing', () => {
    const project: Project = {
      modules: [{ id: 'shift1', defId: 'ShiftModule', params: { offset: 0 } }],
      connections: [],
    };

    const overrides: Record<string, ModuleInputs>[] = [
      { shift1: { in: { type: 'symbol', value: 'A' } } },
      { shift1: { in: { type: 'symbol', value: 'A' } } },
      { shift1: { in: { type: 'symbol', value: 'A' } } },
    ];

    const result = executeTickedProject(project, registry, 3, overrides);

    expect(result.paramsByModuleByTick.shift1).toEqual([
      { offset: 0 },
      { offset: 1 },
      { offset: 2 },
    ]);
  });

  it('does not advance stateless modules', () => {
    const project: Project = {
      modules: [
        { id: 'pass1', defId: 'PassThrough', params: {} },
      ],
      connections: [],
    };

    const overrides: Record<string, ModuleInputs>[] = [
      { pass1: { in: { type: 'symbol', value: 'X' } } },
      { pass1: { in: { type: 'symbol', value: 'X' } } },
    ];

    const result = executeTickedProject(project, registry, 2, overrides);

    // Same output both ticks — no state change
    expect(result.ticks[0].outputsByModuleId.pass1.out).toEqual({
      type: 'symbol',
      value: 'X',
    });
    expect(result.ticks[1].outputsByModuleId.pass1.out).toEqual({
      type: 'symbol',
      value: 'X',
    });
  });

  it('single-tick execution matches standard executeProject', () => {
    const project: Project = {
      modules: [{ id: 'shift1', defId: 'ShiftModule', params: { offset: 3 } }],
      connections: [],
    };

    const overrides: Record<string, ModuleInputs>[] = [
      { shift1: { in: { type: 'symbol', value: 'A' } } },
    ];

    const result = executeTickedProject(project, registry, 1, overrides);

    // offset=3, A+3 = D — same as a single executeProject call
    expect(result.ticks[0].outputsByModuleId.shift1.out).toEqual({
      type: 'symbol',
      value: 'D',
    });
  });

  it('handles zero ticks gracefully', () => {
    const project: Project = {
      modules: [{ id: 'shift1', defId: 'ShiftModule', params: { offset: 0 } }],
      connections: [],
    };

    const result = executeTickedProject(project, registry, 0);
    expect(result.ticks).toHaveLength(0);
    expect(result.paramsByModuleByTick.shift1).toEqual([]);
  });

  describe('Rotor ticked execution', () => {
    // Non-linear wiring so position changes produce different outputs.
    // This is Enigma rotor I wiring: EKMFLGDQVZNTOWYHXUSPAIBRCJ
    const enigmaWiring = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split('');

    it('advances rotor position between ticks', () => {
      const project: Project = {
        modules: [
          {
            id: 'rotor1',
            defId: 'Rotor',
            params: { wiring: enigmaWiring, position: 0 },
          },
        ],
        connections: [],
      };

      // Feed 'A' at each tick — with shifted wiring and advancing
      // position, each tick should produce a different output
      const overrides: Record<string, ModuleInputs>[] = Array.from(
        { length: 5 },
        () => ({
          rotor1: { in: { type: 'symbol' as const, value: 'A' } },
        }),
      );

      const result = executeTickedProject(project, registry, 5, overrides);

      // Verify position advances: 0, 1, 2, 3, 4
      expect(result.paramsByModuleByTick.rotor1.map((p) => p.position)).toEqual([
        0, 1, 2, 3, 4,
      ]);

      // Each tick should produce a different symbol since position shifts
      const outputs = result.ticks.map(
        (tick) => tick.outputsByModuleId.rotor1.out.value,
      );
      // All outputs should be unique (different position = different mapping)
      expect(new Set(outputs).size).toBe(5);
    });

    it('wraps rotor position at 26', () => {
      const project: Project = {
        modules: [
          {
            id: 'rotor1',
            defId: 'Rotor',
            params: { wiring: enigmaWiring, position: 25 },
          },
        ],
        connections: [],
      };

      const overrides: Record<string, ModuleInputs>[] = [
        { rotor1: { in: { type: 'symbol', value: 'A' } } },
        { rotor1: { in: { type: 'symbol', value: 'A' } } },
      ];

      const result = executeTickedProject(project, registry, 2, overrides);

      // Position 25 at tick 0, wraps to 0 at tick 1
      expect(result.paramsByModuleByTick.rotor1[0].position).toBe(25);
      expect(result.paramsByModuleByTick.rotor1[1].position).toBe(0);
    });

    it('ticked rotor through a connected pipeline', () => {
      // TextSource → Rotor → PassThrough
      const testRegistry: ModuleRegistry = {
        ...registry,
        TextSource: {
          id: 'TextSource',
          name: 'TextSource',
          inputs: [],
          outputs: [{ name: 'out', type: 'symbol' }],
          paramSchema: {
            value: {
              key: 'value',
              label: 'Value',
              kind: 'string',
              defaultValue: 'A',
            },
          },
          evaluate: (_inputs, params) => ({
            out: { type: 'symbol', value: String(params.value ?? 'A') },
          }),
        },
      };

      const project: Project = {
        modules: [
          { id: 'src', defId: 'TextSource', params: { value: 'A' } },
          {
            id: 'rotor1',
            defId: 'Rotor',
            params: { wiring: enigmaWiring, position: 0 },
          },
          { id: 'sink', defId: 'PassThrough', params: {} },
        ],
        connections: [
          { from: { moduleId: 'src', port: 'out' }, to: { moduleId: 'rotor1', port: 'in' } },
          { from: { moduleId: 'rotor1', port: 'out' }, to: { moduleId: 'sink', port: 'in' } },
        ],
      };

      const result = executeTickedProject(project, testRegistry, 3);

      // Source emits 'A' every tick (not sliced yet — that's slice 2)
      // Rotor position advances: 0, 1, 2 with shifted wiring
      // Outputs should differ per tick
      const sinkOutputs = result.ticks.map(
        (tick) => tick.outputsByModuleId.sink.out.value,
      );
      expect(sinkOutputs).toHaveLength(3);
      expect(new Set(sinkOutputs).size).toBe(3);
    });
  });
});
