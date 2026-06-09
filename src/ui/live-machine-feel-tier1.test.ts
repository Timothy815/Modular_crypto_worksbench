import { describe, expect, it, vi } from 'vitest';

import type { ModuleRegistry, Project, ValidationIssue } from '../engine/types';
import {
  deriveCanvasModuleErrorStateById,
  handleSignalChipPointerDown,
  resolvePendingSnapTarget,
} from './live-machine-feel-tier1';

const registry: ModuleRegistry = {
  SourceBits: {
    id: 'SourceBits',
    name: 'Source Bits',
    inputs: [],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    evaluate: () => ({ out: { type: 'bits', value: [1] } }),
  },
  PassBits: {
    id: 'PassBits',
    name: 'Pass Bits',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
  BitsSink: {
    id: 'BitsSink',
    name: 'Bits Sink',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [],
    paramSchema: {},
    evaluate: () => ({}),
  },
  SymbolSink: {
    id: 'SymbolSink',
    name: 'Symbol Sink',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [],
    paramSchema: {},
    evaluate: () => ({}),
  },
};

describe('deriveCanvasModuleErrorStateById', () => {
  it('classifies invalid parameters, missing inputs, type mismatches, and upstream failures', () => {
    const project: Project = {
      modules: [
        { id: 'src', defId: 'SourceBits', params: {} },
        { id: 'mid', defId: 'PassBits', params: {} },
        { id: 'sink', defId: 'BitsSink', params: {} },
        { id: 'typed', defId: 'SymbolSink', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'mid', port: 'in' },
        },
        {
          from: { moduleId: 'mid', port: 'out' },
          to: { moduleId: 'sink', port: 'in' },
        },
        {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'typed', port: 'in' },
        },
      ],
    };

    const validationIssues: ValidationIssue[] = [
      {
        code: 'invalid-param-type',
        message: 'SourceBits.value must be hex.',
        moduleId: 'src',
      },
      {
        code: 'signal-type-mismatch',
        message: 'src.out bits cannot connect to typed.in symbol.',
        connection: {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'typed', port: 'in' },
        },
      },
    ];

    const errorStateById = deriveCanvasModuleErrorStateById(project, registry, validationIssues, null);

    expect(errorStateById.src?.kind).toBe('invalid-parameter');
    expect(errorStateById.mid?.kind).toBe('upstream-failure');
    expect(errorStateById.sink).toBeUndefined();
    expect(errorStateById.typed?.kind).toBe('type-mismatch');
    expect(errorStateById.typed?.portSummary).toBe('Port "in": expects symbol, got bits');
  });

  it('treats unconnected required inputs as missing-input failures', () => {
    const project: Project = {
      modules: [{ id: 'mid', defId: 'PassBits', params: {} }],
      connections: [],
    };

    const errorStateById = deriveCanvasModuleErrorStateById(project, registry, [], null);

    expect(errorStateById.mid).toEqual({
      kind: 'missing-input',
      label: 'Missing input',
      detail: 'Input in is not connected.',
    });
  });

  it('leaves portSummary undefined when mismatch port lookup fails', () => {
    const project: Project = {
      modules: [
        { id: 'src', defId: 'MissingSourceDef', params: {} },
        { id: 'typed', defId: 'SymbolSink', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'typed', port: 'in' },
        },
      ],
    };

    const validationIssues: ValidationIssue[] = [
      {
        code: 'signal-type-mismatch',
        message: 'src.out bits cannot connect to typed.in symbol.',
        connection: {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'typed', port: 'in' },
        },
      },
    ];

    const errorStateById = deriveCanvasModuleErrorStateById(project, registry, validationIssues, null);

    expect(errorStateById.typed?.kind).toBe('type-mismatch');
    expect(errorStateById.typed?.detail).toBe('src.out bits cannot connect to typed.in symbol.');
    expect(errorStateById.typed?.portSummary).toBeUndefined();
  });

  it('leaves portSummary undefined for width mismatches', () => {
    const project: Project = {
      modules: [
        { id: 'src', defId: 'SourceBits', params: {} },
        { id: 'mid', defId: 'PassBits', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'mid', port: 'in' },
        },
      ],
    };

    const validationIssues: ValidationIssue[] = [
      {
        code: 'signal-width-mismatch',
        message: 'src.out width 4 cannot connect to mid.in width 8.',
        connection: {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'mid', port: 'in' },
        },
      },
    ];

    const errorStateById = deriveCanvasModuleErrorStateById(project, registry, validationIssues, null);

    expect(errorStateById.mid?.kind).toBe('type-mismatch');
    expect(errorStateById.mid?.detail).toBe('src.out width 4 cannot connect to mid.in width 8.');
    expect(errorStateById.mid?.portSummary).toBeUndefined();
  });

  it('falls back to output-missing failures during an execution run', () => {
    const project: Project = {
      modules: [
        { id: 'src', defId: 'SourceBits', params: {} },
        { id: 'mid', defId: 'PassBits', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'src', port: 'out' },
          to: { moduleId: 'mid', port: 'in' },
        },
      ],
    };

    const errorStateById = deriveCanvasModuleErrorStateById(
      project,
      registry,
      [],
      {
        order: ['src', 'mid'],
        outputsByModuleId: {
          src: { out: { type: 'bits', value: [1] } },
        },
        trace: [],
        analysisTrace: [],
      },
    );

    expect(errorStateById.mid?.kind).toBe('upstream-failure');
    expect(errorStateById.mid?.detail).toContain('produced no output');
  });
});

describe('resolvePendingSnapTarget', () => {
  it('snaps to one compatible target within the snap radius', () => {
    const result = resolvePendingSnapTarget({
      pointer: { x: 10, y: 10 },
      currentSnapTargetKey: null,
      candidateAnchors: [
        { key: 'a:in', x: 18, y: 10 },
        { key: 'b:in', x: 80, y: 80 },
      ],
      targetValidityByKey: {
        'a:in': true,
        'b:in': false,
      },
    });

    expect(result.snapTargetKey).toBe('a:in');
    expect(result.hoveredTargetKey).toBe('a:in');
    expect(result.rejectedTargetKey).toBeNull();
  });

  it('disables snap when two compatible targets are both within radius', () => {
    const result = resolvePendingSnapTarget({
      pointer: { x: 10, y: 10 },
      currentSnapTargetKey: null,
      candidateAnchors: [
        { key: 'a:in', x: 24, y: 10 },
        { key: 'b:in', x: 10, y: 24 },
      ],
      targetValidityByKey: {
        'a:in': true,
        'b:in': true,
      },
    });

    expect(result.snapTargetKey).toBeNull();
    expect(result.hoveredTargetKey).toBeNull();
  });

  it('keeps an existing snap target until the hysteresis radius is exceeded', () => {
    const result = resolvePendingSnapTarget({
      pointer: { x: 23, y: 0 },
      currentSnapTargetKey: 'a:in',
      candidateAnchors: [
        { key: 'a:in', x: 0, y: 0 },
        { key: 'b:in', x: 18, y: 0 },
      ],
      targetValidityByKey: {
        'a:in': true,
        'b:in': true,
      },
    });

    expect(result.snapTargetKey).toBe('a:in');
  });

  it('shows a rejection target when only incompatible ports are nearby', () => {
    const result = resolvePendingSnapTarget({
      pointer: { x: 10, y: 10 },
      currentSnapTargetKey: null,
      candidateAnchors: [{ key: 'bad:in', x: 18, y: 10 }],
      targetValidityByKey: { 'bad:in': false },
    });

    expect(result.snapTargetKey).toBeNull();
    expect(result.rejectedTargetKey).toBe('bad:in');
  });
});

describe('handleSignalChipPointerDown', () => {
  it('stops propagation and starts a connection drag from the chip', () => {
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const startConnectionFromOutput = vi.fn();

    handleSignalChipPointerDown(
      {
        preventDefault,
        stopPropagation,
        clientX: 50,
        clientY: 60,
      },
      startConnectionFromOutput,
      'module-1',
      'out',
    );

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(startConnectionFromOutput).toHaveBeenCalledWith('module-1', 'out', 50, 60);
  });
});
