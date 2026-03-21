import { describe, expect, it } from 'vitest';

import type { ModuleRegistry, Project } from '../engine/types';
import { createCompositeFromSelection, replaceSelectionWithComposite } from './composite-authoring';

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

  it('replaces a selected subgraph with a composite instance and rewires the graph', () => {
    const compositeResult = createCompositeFromSelection({
      project,
      registry,
      name: 'Round Trip Bridge',
      id: 'RoundTripBridge',
      selectedModuleIds: ['encode', 'decode'],
    });

    expect(compositeResult.ok).toBe(true);

    const replacement = replaceSelectionWithComposite({
      project,
      layout: {
        text: { x: 24, y: 40 },
        encode: { x: 180, y: 40 },
        decode: { x: 336, y: 40 },
        output: { x: 492, y: 40 },
      },
      entry: compositeResult.entry!,
      selectedModuleIds: ['encode', 'decode'],
    });

    expect(replacement.ok).toBe(true);
    expect(replacement.project?.modules.map((moduleInstance) => moduleInstance.defId)).toEqual([
      'TextInput',
      'Output',
      'RoundTripBridge',
    ]);
    expect(replacement.project?.connections).toEqual([
      {
        from: { moduleId: 'text', port: 'out' },
        to: { moduleId: 'roundtripbridge-1', port: 'encode_in' },
      },
      {
        from: { moduleId: 'roundtripbridge-1', port: 'decode_out' },
        to: { moduleId: 'output', port: 'in' },
      },
    ]);
    expect(replacement.layout?.['roundtripbridge-1']).toEqual({ x: 258, y: 40 });
  });
});
