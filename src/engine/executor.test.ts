import { describe, expect, it } from 'vitest';

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
});
