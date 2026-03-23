import { describe, expect, it } from 'vitest';

import type { CompositeDef, IteratorDef } from './composites';
import { executeProject } from './executor';
import type { ModuleRegistry, Project } from './types';

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
  SymbolSink: {
    id: 'SymbolSink',
    name: 'SymbolSink',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [],
    paramSchema: {},
    evaluate: () => ({}),
  },
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
  paramSchema: {},
  roundDefId: 'KeyedBitsRoundComposite',
  iterationCount: 2,
  roundKeyWidth: 2,
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
  [keyedBitsRoundComposite.id]: keyedBitsRoundComposite,
  [keyedBitsIterator.id]: keyedBitsIterator,
};

describe('executeProject', () => {
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
});
