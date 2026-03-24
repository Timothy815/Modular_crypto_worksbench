import { describe, expect, it } from 'vitest';

import type { ModuleRegistry, Project } from '../engine/types';
import { isCompositeDefinition } from '../engine/composites';
import {
  createCompositeFromSelection,
  replaceSelectionWithComposite,
  unzipCompositeInstance,
} from './composite-authoring';

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
  ShiftBits: {
    id: 'ShiftBits',
    name: 'Shift Bits',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {
      amount: {
        key: 'amount',
        label: 'Amount',
        kind: 'number',
        defaultValue: 1,
      },
    },
    evaluate: (_inputs, params) => ({
      out: { type: 'bits', value: [Number(params.amount ?? 1)] },
    }),
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
    expect(result.entry && isCompositeDefinition(result.entry.definition)).toBe(true);
    if (!result.entry || !isCompositeDefinition(result.entry.definition)) {
      throw new Error('Expected a composite definition.');
    }
    expect(result.entry?.definition.inputs).toEqual([
      { name: 'encode_in', type: 'symbol' },
    ]);
    expect(result.entry?.definition.outputs).toEqual([
      { name: 'decode_out', type: 'symbol' },
    ]);
    expect(result.entry.definition.project.modules).toHaveLength(2);
    expect(result.entry.definition.project.connections).toHaveLength(1);
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

  it('replaces a selection with multiple incoming and outgoing boundary connections', () => {
    const expandedProject: Project = {
      modules: [
        { id: 'text-a', defId: 'TextInput', params: { value: 'A' } },
        { id: 'text-b', defId: 'TextInput', params: { value: 'B' } },
        { id: 'encode-a', defId: 'SymbolToBits', params: {} },
        { id: 'encode-b', defId: 'SymbolToBits', params: {} },
        { id: 'decode-a', defId: 'BitsToSymbol', params: {} },
        { id: 'decode-b', defId: 'BitsToSymbol', params: {} },
        { id: 'output-a', defId: 'Output', params: {} },
        { id: 'output-b', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-a', port: 'out' }, to: { moduleId: 'encode-a', port: 'in' } },
        { from: { moduleId: 'text-b', port: 'out' }, to: { moduleId: 'encode-b', port: 'in' } },
        { from: { moduleId: 'encode-a', port: 'out' }, to: { moduleId: 'decode-a', port: 'in' } },
        { from: { moduleId: 'encode-b', port: 'out' }, to: { moduleId: 'decode-b', port: 'in' } },
        { from: { moduleId: 'decode-a', port: 'out' }, to: { moduleId: 'output-a', port: 'in' } },
        { from: { moduleId: 'decode-b', port: 'out' }, to: { moduleId: 'output-b', port: 'in' } },
      ],
    };

    const compositeResult = createCompositeFromSelection({
      project: expandedProject,
      registry,
      name: 'Dual Round Trip',
      id: 'DualRoundTrip',
      selectedModuleIds: ['encode-a', 'encode-b', 'decode-a', 'decode-b'],
    });

    expect(compositeResult.ok).toBe(true);

    const replacement = replaceSelectionWithComposite({
      project: expandedProject,
      layout: {
        'text-a': { x: 24, y: 40 },
        'text-b': { x: 24, y: 180 },
        'encode-a': { x: 180, y: 40 },
        'encode-b': { x: 180, y: 180 },
        'decode-a': { x: 336, y: 40 },
        'decode-b': { x: 336, y: 180 },
        'output-a': { x: 492, y: 40 },
        'output-b': { x: 492, y: 180 },
      },
      entry: compositeResult.entry!,
      selectedModuleIds: ['encode-a', 'encode-b', 'decode-a', 'decode-b'],
    });

    expect(replacement.ok).toBe(true);
    expect(replacement.project?.connections).toEqual([
      {
        from: { moduleId: 'text-a', port: 'out' },
        to: { moduleId: 'dualroundtrip-1', port: 'encode_a_in' },
      },
      {
        from: { moduleId: 'text-b', port: 'out' },
        to: { moduleId: 'dualroundtrip-1', port: 'encode_b_in' },
      },
      {
        from: { moduleId: 'dualroundtrip-1', port: 'decode_a_out' },
        to: { moduleId: 'output-a', port: 'in' },
      },
      {
        from: { moduleId: 'dualroundtrip-1', port: 'decode_b_out' },
        to: { moduleId: 'output-b', port: 'in' },
      },
    ]);
  });

  it('unzips a composite instance back into workspace modules without touching the library entry', () => {
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

    const unzipped = unzipCompositeInstance({
      project: replacement.project!,
      layout: replacement.layout!,
      entry: compositeResult.entry!,
      moduleId: replacement.compositeInstanceId!,
    });

    expect(unzipped.ok).toBe(true);
    expect(unzipped.project?.modules.map((moduleInstance) => moduleInstance.id)).toEqual([
      'text',
      'output',
      'roundtripbridge-1-encode',
      'roundtripbridge-1-decode',
    ]);
    expect(unzipped.project?.connections).toEqual([
      {
        from: { moduleId: 'roundtripbridge-1-encode', port: 'out' },
        to: { moduleId: 'roundtripbridge-1-decode', port: 'in' },
      },
      {
        from: { moduleId: 'text', port: 'out' },
        to: { moduleId: 'roundtripbridge-1-encode', port: 'in' },
      },
      {
        from: { moduleId: 'roundtripbridge-1-decode', port: 'out' },
        to: { moduleId: 'output', port: 'in' },
      },
    ]);
    expect(compositeResult.entry?.id).toBe('RoundTripBridge');
    expect(unzipped.selectedModuleIds).toEqual([
      'roundtripbridge-1-encode',
      'roundtripbridge-1-decode',
    ]);
  });

  it('applies forwarded composite params into unzipped internal modules', () => {
    const forwardedEntry = {
      id: 'ForwardedShiftComposite',
      name: 'Forwarded Shift Composite',
      version: 1,
      source: 'user' as const,
      definition: {
        id: 'ForwardedShiftComposite',
        name: 'Forwarded Shift Composite',
        kind: 'composite' as const,
        version: 1,
        inputs: [{ name: 'in', type: 'bits' as const }],
        outputs: [{ name: 'out', type: 'bits' as const }],
        paramSchema: {
          amount: {
            key: 'amount',
            label: 'Amount',
            kind: 'number' as const,
            defaultValue: 1,
          },
        },
        project: {
          modules: [{ id: 'shift-1', defId: 'ShiftBits', params: { amount: 1 } }],
          connections: [],
        },
        layout: {
          'shift-1': { x: 120, y: 80 },
        },
        inputBindings: [{ externalPort: 'in', internalModuleId: 'shift-1', internalPort: 'in' }],
        outputBindings: [{ externalPort: 'out', internalModuleId: 'shift-1', internalPort: 'out' }],
        forwardedParams: [
          { externalParam: 'amount', internalModuleId: 'shift-1', internalParamKey: 'amount' },
        ],
      },
    };

    const forwardedProject: Project = {
      modules: [
        { id: 'composite-1', defId: 'ForwardedShiftComposite', params: { amount: 5 } },
      ],
      connections: [],
    };

    const unzipped = unzipCompositeInstance({
      project: forwardedProject,
      layout: {
        'composite-1': { x: 320, y: 200 },
      },
      entry: forwardedEntry,
      moduleId: 'composite-1',
      moduleParams: { amount: 5 },
    });

    expect(unzipped.ok).toBe(true);
    expect(unzipped.project?.modules).toEqual([
      { id: 'composite-1-shift-1', defId: 'ShiftBits', params: { amount: 5 } },
    ]);
    expect(unzipped.selectedModuleIds).toEqual(['composite-1-shift-1']);
  });
});
