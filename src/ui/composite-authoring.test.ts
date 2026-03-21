import { describe, expect, it } from 'vitest';

import type { ModuleRegistry, Project } from '../engine/types';
import { createCompositeFromSelection } from './composite-authoring';

const registry: ModuleRegistry = {
  TextInput: {
    id: 'TextInput',
    name: 'Text Input',
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
  SymbolToBits: {
    id: 'SymbolToBits',
    name: 'Symbol To Bits',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    evaluate: () => ({ out: { type: 'bits', value: [1, 0, 1, 0, 1] } }),
  },
  BitsToSymbol: {
    id: 'BitsToSymbol',
    name: 'Bits To Symbol',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: () => ({ out: { type: 'symbol', value: 'A' } }),
  },
  Output: {
    id: 'Output',
    name: 'Output',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [],
    paramSchema: {},
    evaluate: () => ({}),
  },
};

const project: Project = {
  modules: [
    { id: 'text', defId: 'TextInput', params: { value: 'M' } },
    { id: 'encode', defId: 'SymbolToBits', params: {} },
    { id: 'decode', defId: 'BitsToSymbol', params: {} },
    { id: 'output', defId: 'Output', params: {} },
  ],
  connections: [
    { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
    { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
    { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
  ],
};

describe('createCompositeFromSelection', () => {
  it('captures a selected subgraph into a reusable composite definition', () => {
    const result = createCompositeFromSelection({
      project,
      registry,
      name: 'Round Trip Bridge',
      id: 'RoundTripBridge',
      selectedModuleIds: ['encode', 'decode'],
    });

    expect(result.ok).toBe(true);
    expect(result.entry?.definition.inputs).toEqual([
      { name: 'encode_in', type: 'symbol' },
    ]);
    expect(result.entry?.definition.outputs).toEqual([
      { name: 'decode_out', type: 'symbol' },
    ]);
    expect(result.entry?.definition.project.modules).toHaveLength(2);
    expect(result.entry?.definition.project.connections).toHaveLength(1);
  });

  it('rejects a selection with no external boundary', () => {
    const isolatedProject: Project = {
      modules: [{ id: 'encode', defId: 'SymbolToBits', params: {} }],
      connections: [],
    };

    const result = createCompositeFromSelection({
      project: isolatedProject,
      registry,
      name: 'Isolated',
      id: 'Isolated',
      selectedModuleIds: ['encode'],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('boundary port');
  });
});
