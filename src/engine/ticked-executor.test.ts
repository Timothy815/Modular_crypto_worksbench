import { describe, expect, it } from 'vitest';

import { deriveTickCount, executeTickedProject } from './executor';
import type { ClockedIteratorDef, CompositeDef, ConditionalDef, IteratorDef } from './composites';
import type {
  ModuleInputs,
  ModuleRegistry,
  Project,
  StatefulModuleDef,
} from './types';
import { isStatefulModule, isTickSliceable } from './types';
import { Rotor } from './modules/rotor';
import { RotorReverse } from './modules/rotor-reverse';
import { TextInput } from './modules/text-input';
import { BitSource } from './modules/bit-source';
import { BitSequenceInput } from './modules/bit-sequence-input';
import { BitsSequenceToTicked } from './modules/bits-sequence-to-ticked';
import { NOT } from './modules/not';
import { Reflector } from './modules/reflector';
import { Clock } from './modules/clock';
import { Output } from './modules/output';
import { TickedSymbolsToSequence } from './modules/ticked-symbols-to-sequence';
import { TickedBitsToSequence } from './modules/ticked-bits-to-sequence';

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

const PassThroughComposite: CompositeDef = {
  id: 'PassThroughComposite',
  name: 'Pass Through Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'pass-1', defId: 'PassThrough', params: {} }],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'pass-1', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'pass-1', internalPort: 'out' }],
};

const PassThroughIterator: IteratorDef = {
  id: 'PassThroughIterator',
  name: 'Pass Through Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  roundDefId: 'PassThroughComposite',
  iterationCount: 2,
};

const RotateLeftWord = {
  id: 'RotateLeftWord',
  name: 'Rotate Left Word',
  inputs: [{ name: 'in', type: 'bits' as const }],
  outputs: [{ name: 'out', type: 'bits' as const }],
  paramSchema: {},
  evaluate: (inputs: ModuleInputs) => {
    const bits = inputs.in.value as number[];
    return {
      out: {
        type: 'bits' as const,
        value: bits.length === 0 ? [] : [...bits.slice(1), bits[0]],
      },
    };
  },
};

const ClockedRotateIteratorHalt: ClockedIteratorDef = {
  id: 'ClockedRotateIteratorHalt',
  name: 'Clocked Rotate Iterator Halt',
  kind: 'clocked-iterator',
  version: 1,
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'clock', type: 'bits', kind: 'scalar' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  roundDefId: 'RotateLeftWord',
  roundCount: 3,
  endPolicy: 'halt',
};

const ClockedRotateIteratorWrap: ClockedIteratorDef = {
  ...ClockedRotateIteratorHalt,
  id: 'ClockedRotateIteratorWrap',
  name: 'Clocked Rotate Iterator Wrap',
  endPolicy: 'wrap',
};

const ForwardedRotorComposite: CompositeDef = {
  id: 'ForwardedRotorComposite',
  name: 'Forwarded Rotor Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    startPosition: {
      key: 'startPosition',
      label: 'Start Position',
      kind: 'number',
      defaultValue: 0,
    },
  },
  project: {
    modules: [
      {
        id: 'rotor-1',
        defId: 'Rotor',
        params: {
          wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
          position: 0,
        },
      },
    ],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'rotor-1', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'rotor-1', internalPort: 'out' }],
  forwardedParams: [
    {
      externalParam: 'startPosition',
      internalModuleId: 'rotor-1',
      internalParamKey: 'position',
    },
  ],
};

const StatefulSuffix: StatefulModuleDef = {
  id: 'StatefulSuffix',
  name: 'Stateful Suffix',
  inputs: [{ name: 'in', type: 'symbol', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  paramSchema: {
    suffix: {
      key: 'suffix',
      label: 'Suffix',
      kind: 'string',
      defaultValue: 'A',
    },
  },
  evaluate: (inputs, params) => ({
    out: { type: 'symbol', value: `${inputs.in.value}${params.suffix as string}` },
  }),
  advance: (params) => ({
    ...params,
    suffix: String.fromCharCode(String(params.suffix ?? 'A').charCodeAt(0) + 1),
  }),
};

const StatefulThenComposite: CompositeDef = {
  id: 'StatefulThenComposite',
  name: 'Stateful Then Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  paramSchema: {
    suffix: {
      key: 'suffix',
      label: 'Suffix',
      kind: 'string',
      defaultValue: 'A',
    },
  },
  project: {
    modules: [{ id: 'suffix', defId: 'StatefulSuffix', params: { suffix: 'A' } }],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'suffix', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'suffix', internalPort: 'out' }],
  forwardedParams: [
    { externalParam: 'suffix', internalModuleId: 'suffix', internalParamKey: 'suffix' },
  ],
};

const StatefulElseComposite: CompositeDef = {
  id: 'StatefulElseComposite',
  name: 'Stateful Else Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  paramSchema: {
    suffix: {
      key: 'suffix',
      label: 'Suffix',
      kind: 'string',
      defaultValue: 'a',
    },
  },
  project: {
    modules: [{ id: 'suffix', defId: 'StatefulSuffix', params: { suffix: 'a' } }],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'suffix', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'suffix', internalPort: 'out' }],
  forwardedParams: [
    { externalParam: 'suffix', internalModuleId: 'suffix', internalParamKey: 'suffix' },
  ],
};

const StatefulConditional: ConditionalDef = {
  id: 'StatefulConditional',
  name: 'Stateful Conditional',
  kind: 'conditional',
  version: 1,
  inputs: [
    { name: 'select', type: 'bits', kind: 'scalar' },
    { name: 'in', type: 'symbol', kind: 'scalar' },
  ],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  paramSchema: {
    suffix: {
      key: 'suffix',
      label: 'Suffix',
      kind: 'string',
      defaultValue: 'A',
    },
  },
  thenDefId: 'StatefulThenComposite',
  elseDefId: 'StatefulElseComposite',
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
    PassThroughComposite,
    PassThroughIterator,
    RotateLeftWord,
    ClockedRotateIteratorHalt,
    ClockedRotateIteratorWrap,
    StatefulSuffix,
    StatefulThenComposite,
    StatefulElseComposite,
    StatefulConditional,
    ForwardedRotorComposite,
    Rotor,
    RotorReverse,
    TextInput,
    BitSource,
    BitSequenceInput,
    BitsSequenceToTicked,
    NOT,
    TickedSymbolsToSequence,
    TickedBitsToSequence,
    Reflector,
    Clock,
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

  it('preserves inactive conditional branch state across ticks', () => {
    const tickToggleSource = {
      id: 'TickToggleSource',
      name: 'Tick Toggle Source',
      inputs: [],
      outputs: [{ name: 'out', type: 'bits' as const, kind: 'scalar' as const }],
      paramSchema: {},
      tickSlice: (_params: Record<string, unknown>, tick: number) => ({ value: [tick % 2] }),
      tickLength: () => 3,
      evaluate: (_inputs: ModuleInputs, params: Record<string, unknown>) => ({
        out: { type: 'bits' as const, value: params.value as number[] },
      }),
    };

    const tickTextSource = {
      id: 'TickTextSource',
      name: 'Tick Text Source',
      inputs: [],
      outputs: [{ name: 'out', type: 'symbol' as const, kind: 'scalar' as const }],
      paramSchema: {},
      tickSlice: (_params: Record<string, unknown>, tick: number) => ({ value: `T${tick}` }),
      tickLength: () => 3,
      evaluate: (_inputs: ModuleInputs, params: Record<string, unknown>) => ({
        out: { type: 'symbol' as const, value: params.value as string },
      }),
    };

    const project: Project = {
      modules: [
        { id: 'input', defId: 'TickTextSource', params: {} },
        { id: 'select', defId: 'TickToggleSource', params: {} },
        { id: 'conditional', defId: 'StatefulConditional', params: { suffix: 'A' } },
      ],
      connections: [
        { from: { moduleId: 'input', port: 'out' }, to: { moduleId: 'conditional', port: 'in' } },
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'conditional', port: 'select' } },
      ],
    };

    const result = executeTickedProject(
      project,
      {
        ...registry,
        TickToggleSource: tickToggleSource,
        TickTextSource: tickTextSource,
      },
      3,
    );

    expect(result.ticks[0]?.outputsByModuleId.conditional.out).toEqual({ type: 'symbol', value: 'T0A' });
    expect(result.ticks[1]?.outputsByModuleId.conditional.out).toEqual({ type: 'symbol', value: 'T1A' });
    expect(result.ticks[2]?.outputsByModuleId.conditional.out).toEqual({ type: 'symbol', value: 'T2B' });
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

  it('collects scalar text output into a visible symbol sequence', () => {
    const project: Project = {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'KEY' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 3 } },
        { id: 'collector', defId: 'TickedSymbolsToSequence', params: { collected: '', count: 0 } },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'collector', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collector', port: 'clock' } },
      ],
    };

    const result = executeTickedProject(project, registry, 3);

    expect(result.ticks[0].outputsByModuleId.collector.out).toEqual({ type: 'symbol', value: 'K' });
    expect(result.ticks[1].outputsByModuleId.collector.out).toEqual({ type: 'symbol', value: 'KE' });
    expect(result.ticks[2].outputsByModuleId.collector.out).toEqual({ type: 'symbol', value: 'KEY' });
    expect(result.paramsByModuleByTick.collector).toEqual([
      { collected: '', count: 0 },
      { collected: 'K', count: 1 },
      { collected: 'KE', count: 2 },
    ]);
  });

  it('collects scalar bit words into a visible bit sequence', () => {
    const project: Project = {
      modules: [
        { id: 'bits', defId: 'BitSource', params: { stream: [1, 0, 1] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 3 } },
        { id: 'collector', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
      ],
      connections: [
        { from: { moduleId: 'bits', port: 'out' }, to: { moduleId: 'collector', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collector', port: 'clock' } },
      ],
    };

    const result = executeTickedProject(project, registry, 3);

    expect(result.ticks[0].outputsByModuleId.collector.out).toEqual({ type: 'bits', value: [1] });
    expect(result.ticks[1].outputsByModuleId.collector.out).toEqual({ type: 'bits', value: [1, 0] });
    expect(result.ticks[2].outputsByModuleId.collector.out).toEqual({ type: 'bits', value: [1, 0, 1] });
    expect(result.paramsByModuleByTick.collector).toEqual([
      { collected: [], count: 0 },
      { collected: [1], count: 1 },
      { collected: [1, 0], count: 2 },
    ]);
  });

  it('segments fixed-width words across ticks, processes them, and reassembles them in order', () => {
    const project: Project = {
      modules: [
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 1] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 2 } },
        {
          id: 'segment',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: false, remainderMode: 'error' },
        },
        { id: 'invert', defId: 'NOT', params: {} },
        { id: 'collector', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'segment', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'segment', port: 'clock' } },
        { from: { moduleId: 'segment', port: 'out' }, to: { moduleId: 'invert', port: 'in' } },
        { from: { moduleId: 'invert', port: 'out' }, to: { moduleId: 'collector', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collector', port: 'clock' } },
      ],
    };

    const result = executeTickedProject(project, registry, 2);

    expect(result.ticks[0].outputsByModuleId.segment.out).toEqual({ type: 'bits', value: [1, 0, 1, 1] });
    expect(result.ticks[1].outputsByModuleId.segment.out).toEqual({ type: 'bits', value: [0, 0, 1, 1] });
    expect(result.ticks[0].outputsByModuleId.collector.out).toEqual({ type: 'bits', value: [0, 1, 0, 0] });
    expect(result.ticks[1].outputsByModuleId.collector.out).toEqual({
      type: 'bits',
      value: [0, 1, 0, 0, 1, 1, 0, 0],
    });
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

  it('hoists nested analysis trace for iterator execution while preserving top-level trace', () => {
    const project: Project = {
      modules: [{ id: 'iter1', defId: 'PassThroughIterator', params: {} }],
      connections: [],
    };

    const overrides: Record<string, ModuleInputs>[] = [
      { iter1: { in: { type: 'symbol', value: 'A' } } },
    ];

    const result = executeTickedProject(project, registry, 1, overrides);

    expect(result.ticks[0].trace.map((entry) => entry.moduleId)).toEqual(['iter1']);
    expect(result.ticks[0].analysisTrace.map((entry) => entry.moduleId)).toEqual([
      'iter1',
      'iter1/round-1',
      'iter1/round-1/pass-1',
      'iter1/round-2',
      'iter1/round-2/pass-1',
    ]);
  });

  it('holds seed output at step 0 and advances clocked iterators one round per pulse', () => {
    const project: Project = {
      modules: [
        { id: 'iter', defId: 'ClockedRotateIteratorHalt', params: {} },
        { id: 'source', defId: 'BitSequenceInput', params: { stream: [1, 0, 0, 0] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'iter', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'iter', port: 'clock' } },
      ],
    };

    const result = executeTickedProject(project, registry, 5);

    expect(result.ticks.map((tick) => tick.outputsByModuleId.iter.out)).toEqual([
      { type: 'bits', value: [1, 0, 0, 0] },
      { type: 'bits', value: [0, 0, 0, 1] },
      { type: 'bits', value: [0, 0, 1, 0] },
      { type: 'bits', value: [0, 1, 0, 0] },
      { type: 'bits', value: [0, 1, 0, 0] },
    ]);
    expect(result.paramsByModuleByTick.iter.map((params) => params.__clockedIteratorCurrentStep)).toEqual([undefined, 1, 2, 3, 3]);
    expect(result.paramsByModuleByTick.iter.map((params) => params.__clockedIteratorHalted)).toEqual([undefined, false, false, true, true]);
  });

  it('wraps clocked iterators back to the seed state on the next pulse after the last round', () => {
    const project: Project = {
      modules: [
        { id: 'iter', defId: 'ClockedRotateIteratorWrap', params: {} },
        { id: 'source', defId: 'BitSequenceInput', params: { stream: [1, 0, 0, 0] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'iter', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'iter', port: 'clock' } },
      ],
    };

    const result = executeTickedProject(project, registry, 6);

    expect(result.ticks.map((tick) => tick.outputsByModuleId.iter.out)).toEqual([
      { type: 'bits', value: [1, 0, 0, 0] },
      { type: 'bits', value: [0, 0, 0, 1] },
      { type: 'bits', value: [0, 0, 1, 0] },
      { type: 'bits', value: [0, 1, 0, 0] },
      { type: 'bits', value: [1, 0, 0, 0] },
      { type: 'bits', value: [0, 0, 0, 1] },
    ]);
    expect(result.paramsByModuleByTick.iter.map((params) => params.__clockedIteratorCurrentStep)).toEqual([undefined, 1, 2, 3, 0, 1]);
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

    it('initializes forwarded stateful params before tick 0', () => {
      const project: Project = {
        modules: [
          {
            id: 'forwarded-rotor',
            defId: 'ForwardedRotorComposite',
            params: { startPosition: 5 },
          },
        ],
        connections: [],
      };

      const overrides: Record<string, ModuleInputs>[] = [
        { 'forwarded-rotor': { in: { type: 'symbol', value: 'A' } } },
        { 'forwarded-rotor': { in: { type: 'symbol', value: 'A' } } },
      ];

      const result = executeTickedProject(project, registry, 2, overrides);

      expect(
        result.paramsByModuleByTick['forwarded-rotor'][0].startPosition,
      ).toBe(5);
      expect(
        result.ticks[0].analysisTrace.find((entry) => entry.moduleId === 'forwarded-rotor/rotor-1')?.outputs.out.value,
      ).toBe('B');
      expect(
        result.ticks[1].analysisTrace.find((entry) => entry.moduleId === 'forwarded-rotor/rotor-1')?.outputs.out.value,
      ).toBe('X');
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

    it('keeps linked RotorReverse synchronized without independent stepping', () => {
      const reflectorWiring = 'YRUHQSLDPXNGOKMIEBFZCWVJAT'.split('');
      const project: Project = {
        modules: [
          { id: 'text', defId: 'TextInput', params: { value: 'AAA' } },
          { id: 'rotor-fwd', defId: 'Rotor', params: { wiring: enigmaWiring, position: 0 } },
          {
            id: 'rotor-rev',
            defId: 'RotorReverse',
            params: {
              linkedRotorId: 'rotor-fwd',
              wiring: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
              position: 19,
            },
          },
          { id: 'reflector', defId: 'Reflector', params: { wiring: reflectorWiring } },
          { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 3 } },
        ],
        connections: [
          { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
          { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
          { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'rotor-fwd', port: 'clock' } },
          { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'rotor-rev', port: 'clock' } },
        ],
      };

      const result = executeTickedProject(project, registry, 3);

      expect(result.paramsByModuleByTick['rotor-fwd'].map((params) => params.position)).toEqual([0, 1, 2]);
      expect(result.paramsByModuleByTick['rotor-rev'].map((params) => params.position)).toEqual([0, 1, 2]);
    });
  });
});

describe('isTickSliceable', () => {
  it('returns true for TextInput', () => {
    expect(isTickSliceable(TextInput)).toBe(true);
  });

  it('returns true for BitSource', () => {
    expect(isTickSliceable(BitSource)).toBe(true);
  });

  it('returns false for Rotor (stateful but not sliceable)', () => {
    expect(isTickSliceable(Rotor)).toBe(false);
  });

  it('returns false for plain modules', () => {
    expect(isTickSliceable(PassThrough)).toBe(false);
  });
});

describe('tickSlice — TextInput', () => {
  it('slices one character per tick', () => {
    const params = { value: 'HELLO' };
    expect(TextInput.tickSlice(params, 0)).toEqual({ value: 'H' });
    expect(TextInput.tickSlice(params, 1)).toEqual({ value: 'E' });
    expect(TextInput.tickSlice(params, 4)).toEqual({ value: 'O' });
  });

  it('returns empty string when tick exceeds length', () => {
    const params = { value: 'AB' };
    expect(TextInput.tickSlice(params, 2)).toEqual({ value: '' });
    expect(TextInput.tickSlice(params, 99)).toEqual({ value: '' });
  });

  it('reports correct tickLength', () => {
    expect(TextInput.tickLength({ value: 'HELLO' })).toBe(5);
    expect(TextInput.tickLength({ value: '' })).toBe(0);
    expect(TextInput.tickLength({ value: 'A' })).toBe(1);
  });
});

describe('tickSlice — BitSource', () => {
  it('slices one bit per tick', () => {
    const params = { stream: [1, 0, 1, 1, 0] };
    expect(BitSource.tickSlice(params, 0)).toEqual({ stream: [1] });
    expect(BitSource.tickSlice(params, 1)).toEqual({ stream: [0] });
    expect(BitSource.tickSlice(params, 4)).toEqual({ stream: [0] });
  });

  it('returns empty array when tick exceeds length', () => {
    const params = { stream: [1, 0] };
    expect(BitSource.tickSlice(params, 2)).toEqual({ stream: [] });
  });

  it('reports correct tickLength', () => {
    expect(BitSource.tickLength({ stream: [1, 0, 1] })).toBe(3);
    expect(BitSource.tickLength({ stream: [] })).toBe(0);
  });
});

describe('deriveTickCount', () => {
  const sliceRegistry: ModuleRegistry = {
    TextInput,
    BitSource,
    Rotor,
    PassThrough,
  };

  it('derives tick count from a single TextInput', () => {
    const project: Project = {
      modules: [{ id: 'src', defId: 'TextInput', params: { value: 'HELLO' } }],
      connections: [],
    };
    expect(deriveTickCount(project, sliceRegistry)).toBe(5);
  });

  it('derives tick count from a single BitSource', () => {
    const project: Project = {
      modules: [{ id: 'bits', defId: 'BitSource', params: { stream: [1, 0, 1] } }],
      connections: [],
    };
    expect(deriveTickCount(project, sliceRegistry)).toBe(3);
  });

  it('takes the minimum when multiple sources differ', () => {
    const project: Project = {
      modules: [
        { id: 'src1', defId: 'TextInput', params: { value: 'HELLO' } },
        { id: 'src2', defId: 'TextInput', params: { value: 'AB' } },
      ],
      connections: [],
    };
    expect(deriveTickCount(project, sliceRegistry)).toBe(2);
  });

  it('returns null when no sliceable sources exist', () => {
    const project: Project = {
      modules: [{ id: 'r1', defId: 'Rotor', params: { wiring: ALPHABET.split(''), position: 0 } }],
      connections: [],
    };
    expect(deriveTickCount(project, sliceRegistry)).toBeNull();
  });
});

describe('source slicing integration', () => {
  const sliceRegistry: ModuleRegistry = {
    TextInput,
    BitSource,
    Rotor,
    Reflector,
    Output,
    PassThrough,
  };

  it('TextInput auto-slices in ticked execution', () => {
    const project: Project = {
      modules: [
        { id: 'src', defId: 'TextInput', params: { value: 'ABC' } },
        { id: 'sink', defId: 'PassThrough', params: {} },
      ],
      connections: [
        { from: { moduleId: 'src', port: 'out' }, to: { moduleId: 'sink', port: 'in' } },
      ],
    };

    const result = executeTickedProject(project, sliceRegistry, 3);

    const outputs = result.ticks.map(
      (tick) => tick.outputsByModuleId.sink.out.value,
    );
    expect(outputs).toEqual(['A', 'B', 'C']);
  });

  it('BitSource auto-slices in ticked execution', () => {
    const project: Project = {
      modules: [
        { id: 'bits', defId: 'BitSource', params: { stream: [1, 0, 1] } },
      ],
      connections: [],
    };

    const result = executeTickedProject(project, sliceRegistry, 3);

    const outputs = result.ticks.map(
      (tick) => tick.outputsByModuleId.bits.out.value,
    );
    expect(outputs).toEqual([[1], [0], [1]]);
  });

  it('handles tickCount exceeding source length — empty slices', () => {
    const project: Project = {
      modules: [
        { id: 'src', defId: 'TextInput', params: { value: 'AB' } },
        { id: 'sink', defId: 'PassThrough', params: {} },
      ],
      connections: [
        { from: { moduleId: 'src', port: 'out' }, to: { moduleId: 'sink', port: 'in' } },
      ],
    };

    // 4 ticks for a 2-character source — ticks 2 and 3 get empty string
    const result = executeTickedProject(project, sliceRegistry, 4);
    const outputs = result.ticks.map(
      (tick) => tick.outputsByModuleId.sink.out.value,
    );
    expect(outputs).toEqual(['A', 'B', '', '']);
  });

  it('inputOverridesByTick provides inputs for unconnected ports', () => {
    // PassThrough has no connected input — override provides it
    const project: Project = {
      modules: [
        { id: 'sink', defId: 'PassThrough', params: {} },
      ],
      connections: [],
    };

    const overrides: Record<string, ModuleInputs>[] = [
      { sink: { in: { type: 'symbol', value: 'X' } } },
      { sink: { in: { type: 'symbol', value: 'Y' } } },
      { sink: { in: { type: 'symbol', value: 'Z' } } },
    ];

    const result = executeTickedProject(project, sliceRegistry, 3, overrides);
    const outputs = result.ticks.map(
      (tick) => tick.outputsByModuleId.sink.out.value,
    );
    expect(outputs).toEqual(['X', 'Y', 'Z']);
  });

  describe('Enigma-style pipeline with source slicing', () => {
    const enigmaWiring = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split('');
    const reflectorWiring = 'ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('');

    it('encrypts HELLO character by character with rotor stepping', () => {
      const project: Project = {
        modules: [
          { id: 'input', defId: 'TextInput', params: { value: 'HELLO' } },
          { id: 'rotor', defId: 'Rotor', params: { wiring: enigmaWiring, position: 0 } },
          { id: 'reflector', defId: 'Reflector', params: { wiring: reflectorWiring } },
          { id: 'output', defId: 'Output', params: {} },
        ],
        connections: [
          { from: { moduleId: 'input', port: 'out' }, to: { moduleId: 'rotor', port: 'in' } },
          { from: { moduleId: 'rotor', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
          { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
        ],
      };

      const tickCount = deriveTickCount(project, sliceRegistry);
      expect(tickCount).toBe(5);

      const result = executeTickedProject(project, sliceRegistry, tickCount!);

      // Verify 5 ticks executed
      expect(result.ticks).toHaveLength(5);

      // Verify rotor position advanced: 0, 1, 2, 3, 4
      expect(
        result.paramsByModuleByTick.rotor.map((p) => p.position),
      ).toEqual([0, 1, 2, 3, 4]);

      // Verify each tick processed one character
      const inputChars = result.ticks.map(
        (tick) => tick.trace.find((e) => e.moduleId === 'input')?.outputs.out.value,
      );
      expect(inputChars).toEqual(['H', 'E', 'L', 'L', 'O']);

      // Verify output received different symbols due to rotor stepping
      const outputChars = result.ticks.map(
        (tick) => tick.trace.find((e) => e.moduleId === 'output')?.inputs.in.value,
      );
      expect(outputChars).toHaveLength(5);
      // Each character is defined (not undefined)
      expect(outputChars.every((c) => typeof c === 'string' && c.length === 1)).toBe(true);

      // The two L's at ticks 2 and 3 should encrypt differently
      // because the rotor position differs
      expect(outputChars[2]).not.toBe(outputChars[3]);
    });

    it('produces deterministic output across runs', () => {
      const project: Project = {
        modules: [
          { id: 'input', defId: 'TextInput', params: { value: 'HELLO' } },
          { id: 'rotor', defId: 'Rotor', params: { wiring: enigmaWiring, position: 0 } },
          { id: 'reflector', defId: 'Reflector', params: { wiring: reflectorWiring } },
          { id: 'output', defId: 'Output', params: {} },
        ],
        connections: [
          { from: { moduleId: 'input', port: 'out' }, to: { moduleId: 'rotor', port: 'in' } },
          { from: { moduleId: 'rotor', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
          { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
        ],
      };

      const run1 = executeTickedProject(project, sliceRegistry, 5);
      const run2 = executeTickedProject(project, sliceRegistry, 5);

      const outputs1 = run1.ticks.map(
        (tick) => tick.trace.find((e) => e.moduleId === 'output')?.inputs.in.value,
      );
      const outputs2 = run2.ticks.map(
        (tick) => tick.trace.find((e) => e.moduleId === 'output')?.inputs.in.value,
      );

      expect(outputs1).toEqual(outputs2);
    });
  });
});
