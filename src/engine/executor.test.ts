import { describe, expect, it } from 'vitest';

import type { CompositeDef, IteratorDef } from './composites';
import { executeProject } from './executor';
import type { ModuleRegistry, Project } from './types';
import { BitShifter } from './modules/bit-shifter';

const registry: ModuleRegistry = {
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
  SymbolEcho: {
    id: 'SymbolEcho',
    name: 'SymbolEcho',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
  BranchSink: {
    id: 'BranchSink',
    name: 'BranchSink',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
  BitsEcho: {
    id: 'BitsEcho',
    name: 'BitsEcho',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
  [BitShifter.id]: BitShifter,
  SymbolSink: {
    id: 'SymbolSink',
    name: 'SymbolSink',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [],
    paramSchema: {},
    evaluate: () => ({}),
  },
};

const bitsEchoComposite: CompositeDef = {
  id: 'BitsEchoComposite',
  name: 'Bits Echo Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'echo-1', defId: 'BitsEcho', params: {} }],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'echo-1', internalPort: 'in' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'echo-1', internalPort: 'out' },
  ],
};

const bitsEchoIterator: IteratorDef = {
  id: 'BitsEchoIterator',
  name: 'Bits Echo Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    iterationCount: {
      key: 'iterationCount',
      label: 'Round Count',
      kind: 'number',
      defaultValue: 2,
    },
  },
  roundDefId: 'BitsEchoComposite',
  iterationCount: 2,
};

const symbolEchoComposite: CompositeDef = {
  id: 'SymbolEchoComposite',
  name: 'Symbol Echo Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'echo-1', defId: 'SymbolEcho', params: {} }],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'echo-1', internalPort: 'in' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'echo-1', internalPort: 'out' },
  ],
};

const symbolEchoIterator: IteratorDef = {
  id: 'SymbolEchoIterator',
  name: 'Symbol Echo Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  roundDefId: 'SymbolEchoComposite',
  iterationCount: 2,
};

const keyedBitsRoundComposite: CompositeDef = {
  id: 'KeyedBitsRoundComposite',
  name: 'Keyed Bits Round Composite',
  kind: 'composite',
  version: 1,
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'key', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'xor-1', defId: 'XorBits', params: {} }],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'xor-1', internalPort: 'a' },
    { externalPort: 'key', internalModuleId: 'xor-1', internalPort: 'b' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'xor-1', internalPort: 'out' },
  ],
};

const keyedBitsIterator: IteratorDef = {
  id: 'KeyedBitsIterator',
  name: 'Keyed Bits Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'key', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    iterationCount: {
      key: 'iterationCount',
      label: 'Round Count',
      kind: 'number',
      defaultValue: 2,
    },
  },
  roundDefId: 'KeyedBitsRoundComposite',
  iterationCount: 2,
  roundKeyWidth: 2,
};

const forwardedRoundsComposite: CompositeDef = {
  id: 'ForwardedRoundsComposite',
  name: 'Forwarded Rounds Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    digestRounds: {
      key: 'digestRounds',
      label: 'Digest Rounds',
      kind: 'number',
      defaultValue: 2,
    },
  },
  project: {
    modules: [
      {
        id: 'iterator-1',
        defId: 'BitsEchoIterator',
        params: {},
      },
    ],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'iterator-1', internalPort: 'in' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'iterator-1', internalPort: 'out' },
  ],
  forwardedParams: [
    {
      externalParam: 'digestRounds',
      internalModuleId: 'iterator-1',
      internalParamKey: 'iterationCount',
    },
  ],
};

const permutationComposite: CompositeDef = {
  id: 'PermutationComposite',
  name: 'Permutation Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [
      {
        id: 'permute-1',
        defId: 'PermutationBits',
        params: { order: '2,0,3,1' },
      },
    ],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'permute-1', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'permute-1', internalPort: 'out' }],
};

const registryWithComposite: ModuleRegistry = {
  ...registry,
  XorBits: {
    id: 'XorBits',
    name: 'Xor Bits',
    inputs: [
      { name: 'a', type: 'bits' },
      { name: 'b', type: 'bits' },
    ],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    evaluate: (inputs) => {
      if (inputs.a.type !== 'bits' || inputs.b.type !== 'bits') {
        throw new Error('XorBits expects bits signals.');
      }

      const aBits = inputs.a.value;
      const bBits = inputs.b.value;

      return {
        out: {
          type: 'bits',
          value: aBits.map((bit, index) => bit ^ (bBits[index] ?? 0)),
        },
      };
    },
  },
  [symbolEchoComposite.id]: symbolEchoComposite,
  [symbolEchoIterator.id]: symbolEchoIterator,
  [bitsEchoComposite.id]: bitsEchoComposite,
  [bitsEchoIterator.id]: bitsEchoIterator,
  [keyedBitsRoundComposite.id]: keyedBitsRoundComposite,
  [keyedBitsIterator.id]: keyedBitsIterator,
  [forwardedRoundsComposite.id]: forwardedRoundsComposite,
  PermutationBits: {
    id: 'PermutationBits',
    name: 'Permutation Bits',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {
      order: {
        key: 'order',
        label: 'Order',
        kind: 'string',
        defaultValue: '0,1,2,3',
      },
    },
    evaluate: (inputs, params) => {
      if (inputs.in.type !== 'bits') {
        throw new Error('PermutationBits expects a bits signal.');
      }

      let order: number[];
      if (Array.isArray(params.order)) {
        order = params.order.map((value) => Number(value));
      } else {
        order = String(params.order ?? '')
          .split(',')
          .map((part) => Number(part.trim()));
      }
      const permuted: number[] = [];
      for (const index of order) {
        permuted.push(inputs.in.value[index] ?? 0);
      }

      return {
        out: {
          type: 'bits' as const,
          value: permuted,
        },
      };
    },
  },
  [permutationComposite.id]: permutationComposite,
};

describe('executeProject', () => {
  it('evaluates a forwarded composite parameter without mutating the iterator definition', () => {
    const oneRoundProject: Project = {
      modules: [
        {
          id: 'source',
          defId: 'ForwardedRoundsComposite',
          params: { digestRounds: 1 },
        },
      ],
      connections: [],
    };

    const oneRoundResult = executeProject(
      oneRoundProject,
      registryWithComposite,
      {
        source: {
          in: { type: 'bits', value: [1, 1] },
        },
      },
    );

    expect(oneRoundResult.outputsByModuleId.source.out).toEqual({
      type: 'bits',
      value: [1, 1],
    });
    expect(
      oneRoundResult.analysisTrace.some((entry) => entry.moduleId === 'source/iterator-1/round-1'),
    ).toBe(true);
    expect(
      oneRoundResult.analysisTrace.some((entry) => entry.moduleId === 'source/iterator-1/round-2'),
    ).toBe(false);

    const twoRoundResult = executeProject(
      {
        modules: [
          {
            id: 'source',
            defId: 'ForwardedRoundsComposite',
            params: { digestRounds: 2 },
          },
        ],
        connections: [],
      },
      registryWithComposite,
      {
        source: {
          in: { type: 'bits', value: [1, 1] },
        },
      },
    );

    expect(twoRoundResult.outputsByModuleId.source.out).toEqual({
      type: 'bits',
      value: [1, 1],
    });
    expect(
      twoRoundResult.analysisTrace.some((entry) => entry.moduleId === 'source/iterator-1/round-2'),
    ).toBe(true);
    expect(bitsEchoIterator.iterationCount).toBe(2);
  });

  it('executes a valid graph in topological order', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'TextSource', params: { value: 'Q' } },
        { id: 'echo', defId: 'SymbolEcho', params: {} },
        { id: 'sink', defId: 'SymbolSink', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'source', port: 'out' },
          to: { moduleId: 'echo', port: 'in' },
        },
        {
          from: { moduleId: 'echo', port: 'out' },
          to: { moduleId: 'sink', port: 'in' },
        },
      ],
    };

    const result = executeProject(project, registry);

    expect(result.order).toEqual(['source', 'echo', 'sink']);
    expect(result.outputsByModuleId.source.out).toEqual({ type: 'symbol', value: 'Q' });
    expect(result.outputsByModuleId.echo.out).toEqual({ type: 'symbol', value: 'Q' });
    expect(result.trace).toHaveLength(3);
  });

  it('evaluates a branched graph without recomputing upstream modules', () => {
    let sourceEvaluations = 0;

    const branchingRegistry: ModuleRegistry = {
      ...registry,
      TextSource: {
        ...registry.TextSource,
        evaluate: (_inputs, params) => {
          sourceEvaluations += 1;
          return {
            out: { type: 'symbol', value: String(params.value ?? 'A') },
          };
        },
      },
    };

    const project: Project = {
      modules: [
        { id: 'source', defId: 'TextSource', params: { value: 'M' } },
        { id: 'left', defId: 'BranchSink', params: {} },
        { id: 'right', defId: 'BranchSink', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'source', port: 'out' },
          to: { moduleId: 'left', port: 'in' },
        },
        {
          from: { moduleId: 'source', port: 'out' },
          to: { moduleId: 'right', port: 'in' },
        },
      ],
    };

    const result = executeProject(project, branchingRegistry);

    expect(sourceEvaluations).toBe(1);
    expect(result.outputsByModuleId.left.out).toEqual({ type: 'symbol', value: 'M' });
    expect(result.outputsByModuleId.right.out).toEqual({ type: 'symbol', value: 'M' });
  });

  it('executes a composite module instance like a primitive', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'TextSource', params: { value: 'Z' } },
        { id: 'composite', defId: 'SymbolEchoComposite', params: {} },
        { id: 'sink', defId: 'SymbolSink', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'source', port: 'out' },
          to: { moduleId: 'composite', port: 'in' },
        },
        {
          from: { moduleId: 'composite', port: 'out' },
          to: { moduleId: 'sink', port: 'in' },
        },
      ],
    };

    const result = executeProject(project, registryWithComposite);

    expect(result.outputsByModuleId.composite.out).toEqual({
      type: 'symbol',
      value: 'Z',
    });
    expect(result.order).toEqual(['source', 'composite', 'sink']);
    expect(result.trace.map((entry) => entry.moduleId)).toEqual(['source', 'composite', 'sink']);
    expect(result.analysisTrace.map((entry) => entry.moduleId)).toEqual([
      'source',
      'composite',
      'composite/echo-1',
      'sink',
    ]);
  });

  it('executes an iterator module instance like a bounded repeated chain', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'TextSource', params: { value: 'Z' } },
        { id: 'iterator', defId: 'SymbolEchoIterator', params: {} },
        { id: 'sink', defId: 'SymbolSink', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'source', port: 'out' },
          to: { moduleId: 'iterator', port: 'in' },
        },
        {
          from: { moduleId: 'iterator', port: 'out' },
          to: { moduleId: 'sink', port: 'in' },
        },
      ],
    };

    const result = executeProject(project, registryWithComposite);

    expect(result.outputsByModuleId.iterator.out).toEqual({
      type: 'symbol',
      value: 'Z',
    });
    expect(result.order).toEqual(['source', 'iterator', 'sink']);
    expect(result.trace.map((entry) => entry.moduleId)).toEqual(['source', 'iterator', 'sink']);
    expect(result.analysisTrace.map((entry) => entry.moduleId)).toEqual([
      'source',
      'iterator',
      'iterator/round-1',
      'iterator/round-1/echo-1',
      'iterator/round-2',
      'iterator/round-2/echo-1',
      'sink',
    ]);
  });

  it('distributes a fixed-width key bus across keyed iterator rounds', () => {
    const project: Project = {
      modules: [
        { id: 'iterator', defId: 'KeyedBitsIterator', params: {} },
      ],
      connections: [],
    };

    const result = executeProject(project, registryWithComposite, {
      iterator: {
        in: { type: 'bits', value: [1, 0] },
        key: { type: 'bits', value: [1, 1, 0, 1] },
      },
    });

    expect(result.outputsByModuleId.iterator.out).toEqual({
      type: 'bits',
      value: [0, 0],
    });
    expect(
      result.analysisTrace.find((entry) => entry.moduleId === 'iterator/round-1')?.inputs.key,
    ).toEqual({ type: 'bits', value: [1, 1] });
    expect(
      result.analysisTrace.find((entry) => entry.moduleId === 'iterator/round-2')?.inputs.key,
    ).toEqual({ type: 'bits', value: [0, 1] });
  });

  it('allows an iterator instance to override its round count', () => {
    const project: Project = {
      modules: [
        { id: 'iterator', defId: 'KeyedBitsIterator', params: { iterationCount: 3 } },
      ],
      connections: [],
    };

    const result = executeProject(project, registryWithComposite, {
      iterator: {
        in: { type: 'bits', value: [1, 0] },
        key: { type: 'bits', value: [1, 1, 0, 1, 1, 0] },
      },
    });

    expect(result.analysisTrace.map((entry) => entry.moduleId)).toEqual([
      'iterator',
      'iterator/round-1',
      'iterator/round-1/xor-1',
      'iterator/round-2',
      'iterator/round-2/xor-1',
      'iterator/round-3',
      'iterator/round-3/xor-1',
    ]);
  });

  it('preserves nested permutation inputs and outputs in hoisted analysis trace entries', () => {
    const project: Project = {
      modules: [{ id: 'permute', defId: 'PermutationComposite', params: {} }],
      connections: [],
    };

    const result = executeProject(project, registryWithComposite, {
      permute: {
        in: { type: 'bits', value: [1, 0, 1, 1] },
      },
    });

    const nestedEntry = result.analysisTrace.find((entry) => entry.moduleId === 'permute/permute-1');

    expect(nestedEntry).toBeTruthy();
    expect(nestedEntry?.defId).toBe('PermutationBits');
    expect(nestedEntry?.inputs.in).toEqual({ type: 'bits', value: [1, 0, 1, 1] });
    expect(nestedEntry?.outputs.out).toEqual({ type: 'bits', value: [1, 1, 1, 0] });
    expect(nestedEntry?.scopeModuleId).toBe('permute');
    expect(nestedEntry?.depth).toBe(1);
  });

  it('passes an eligible module input straight through when bypass is enabled', () => {
    const project: Project = {
      modules: [
        {
          id: 'shift',
          defId: 'BitShifter',
          params: { amount: 2, mode: 'rotate-left' },
          bypass: true,
        },
      ],
      connections: [],
    };

    const result = executeProject(project, registry, {
      shift: {
        in: { type: 'bits', value: [1, 0, 1, 1] },
      },
    });

    expect(result.outputsByModuleId.shift.out).toEqual({
      type: 'bits',
      value: [1, 0, 1, 1],
    });
  });
});
