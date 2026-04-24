import { describe, expect, it } from 'vitest';

import type { ModuleDef, ModuleRegistry, Project } from '../engine/types';
import {
  buildWorkspaceClipboardSnapshot,
  duplicateWorkspaceSelection,
  pasteWorkspaceClipboardSnapshot,
  repeatWorkspaceSelectionToRight,
} from './workspace-clipboard';

const PASS_THROUGH_BITS_DEF: ModuleDef = {
  id: 'PassBits',
  name: 'Pass Bits',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => ({ out: inputs.in ?? { type: 'bits', value: [] } }),
};

const TEST_REPEAT_REGISTRY: ModuleRegistry = {
  PassBits: PASS_THROUGH_BITS_DEF,
  Input: {
    ...PASS_THROUGH_BITS_DEF,
    id: 'Input',
    name: 'Input',
    inputs: [],
  },
  Output: {
    ...PASS_THROUGH_BITS_DEF,
    id: 'Output',
    name: 'Output',
    outputs: [],
  },
};

describe('buildWorkspaceClipboardSnapshot', () => {
  it('captures only selected modules, internal connections, and relative layout', () => {
    const project: Project = {
      modules: [
        { id: 'left', defId: 'XOR', params: {} },
        { id: 'middle', defId: 'BitShifter', params: { amount: 1 } },
        { id: 'right', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'middle', port: 'in' } },
        { from: { moduleId: 'middle', port: 'out' }, to: { moduleId: 'right', port: 'in' } },
      ],
    };

    const snapshot = buildWorkspaceClipboardSnapshot({
      project,
      layout: {
        left: { x: 120, y: 200 },
        middle: { x: 280, y: 240 },
        right: { x: 440, y: 240 },
      },
      selectedModuleIds: ['left', 'middle'],
    });

    expect(snapshot?.modules.map((moduleInstance) => moduleInstance.id)).toEqual([
      'left',
      'middle',
    ]);
    expect(snapshot?.connections).toEqual([
      { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'middle', port: 'in' } },
    ]);
    expect(snapshot?.relativeLayout).toEqual({
      left: { x: 0, y: 0 },
      middle: { x: 160, y: 40 },
    });
  });

  it('preserves node orientation in relative layout snapshots', () => {
    const snapshot = buildWorkspaceClipboardSnapshot({
      project: {
        modules: [{ id: 'left', defId: 'XOR', params: {} }],
        connections: [],
      },
      layout: {
        left: { x: 120, y: 200, orientation: 'south' },
      },
      selectedModuleIds: ['left'],
    });

    expect(snapshot?.relativeLayout.left).toEqual({ x: 0, y: 0, orientation: 'south' });
  });

  it('preserves custom port placement metadata in relative layout snapshots', () => {
    const snapshot = buildWorkspaceClipboardSnapshot({
      project: {
        modules: [{ id: 'left', defId: 'XOR', params: {} }],
        connections: [],
      },
      layout: {
        left: {
          x: 120,
          y: 200,
          orientation: 'south',
          portLayoutPreset: 'vertical',
          inputOrder: ['b', 'a'],
          outputOrder: ['sum', 'carry'],
          inputPortSides: { a: 'top', b: 'left' },
          outputPortSides: { sum: 'right', carry: 'bottom' },
        },
      },
      selectedModuleIds: ['left'],
    });

    expect(snapshot?.relativeLayout.left).toEqual({
      x: 0,
      y: 0,
      orientation: 'south',
      portLayoutPreset: 'vertical',
      inputOrder: ['b', 'a'],
      outputOrder: ['sum', 'carry'],
      inputPortSides: { a: 'top', b: 'left' },
      outputPortSides: { sum: 'right', carry: 'bottom' },
    });
  });
});

describe('pasteWorkspaceClipboardSnapshot', () => {
  it('remaps IDs and preserves internal topology on paste', () => {
    const snapshot = buildWorkspaceClipboardSnapshot({
      project: {
        modules: [
          { id: 'left', defId: 'XOR', params: { mode: 'xor' } },
          { id: 'middle', defId: 'BitShifter', params: { amount: 1 } },
        ],
        connections: [
          { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'middle', port: 'in' } },
        ],
      },
      layout: {
        left: { x: 100, y: 100 },
        middle: { x: 260, y: 140 },
      },
      selectedModuleIds: ['left', 'middle'],
    });

    if (!snapshot) {
      throw new Error('Expected clipboard snapshot.');
    }

    const pasted = pasteWorkspaceClipboardSnapshot({
      targetProject: {
        modules: [{ id: 'xor-1', defId: 'XOR', params: {} }],
        connections: [],
      },
      targetLayout: {
        'xor-1': { x: 80, y: 60 },
      },
      snapshot,
    });

    expect(pasted.pastedModuleIds).toEqual(['xor-2', 'bitshifter-1']);
    expect(pasted.project.modules.map((moduleInstance) => moduleInstance.id)).toEqual([
      'xor-1',
      'xor-2',
      'bitshifter-1',
    ]);
    expect(pasted.project.connections).toEqual([
      { from: { moduleId: 'xor-2', port: 'out' }, to: { moduleId: 'bitshifter-1', port: 'in' } },
    ]);
    expect(pasted.layout['xor-2']).toEqual({ x: 260, y: 48 });
    expect(pasted.layout['bitshifter-1']).toEqual({ x: 420, y: 88 });
  });

  it('uses an explicit anchor when provided', () => {
    const snapshot = buildWorkspaceClipboardSnapshot({
      project: {
        modules: [{ id: 'left', defId: 'XOR', params: {} }],
        connections: [],
      },
      layout: {
        left: { x: 100, y: 100 },
      },
      selectedModuleIds: ['left'],
    });

    if (!snapshot) {
      throw new Error('Expected clipboard snapshot.');
    }

    const pasted = pasteWorkspaceClipboardSnapshot({
      targetProject: {
        modules: [],
        connections: [],
      },
      targetLayout: {},
      snapshot,
      anchor: { x: 640, y: 180 },
    });

    expect(pasted.layout['xor-1']).toEqual({ x: 640, y: 180 });
  });

  it('preserves node orientation on paste', () => {
    const snapshot = buildWorkspaceClipboardSnapshot({
      project: {
        modules: [{ id: 'left', defId: 'XOR', params: {} }],
        connections: [],
      },
      layout: {
        left: { x: 100, y: 100, orientation: 'north' },
      },
      selectedModuleIds: ['left'],
    });

    if (!snapshot) {
      throw new Error('Expected clipboard snapshot.');
    }

    const pasted = pasteWorkspaceClipboardSnapshot({
      targetProject: { modules: [], connections: [] },
      targetLayout: {},
      snapshot,
      anchor: { x: 200, y: 140 },
    });

    expect(pasted.layout['xor-1']).toEqual({ x: 200, y: 140, orientation: 'north' });
  });

  it('preserves custom port placement metadata on paste', () => {
    const snapshot = buildWorkspaceClipboardSnapshot({
      project: {
        modules: [{ id: 'left', defId: 'XOR', params: {} }],
        connections: [],
      },
      layout: {
        left: {
          x: 100,
          y: 100,
          orientation: 'north',
          portLayoutPreset: 'vertical',
          inputOrder: ['b', 'a'],
          outputOrder: ['sum', 'carry'],
          inputPortSides: { a: 'top', b: 'left' },
          outputPortSides: { sum: 'right', carry: 'bottom' },
        },
      },
      selectedModuleIds: ['left'],
    });

    if (!snapshot) {
      throw new Error('Expected clipboard snapshot.');
    }

    const pasted = pasteWorkspaceClipboardSnapshot({
      targetProject: { modules: [], connections: [] },
      targetLayout: {},
      snapshot,
      anchor: { x: 200, y: 140 },
    });

    expect(pasted.layout['xor-1']).toEqual({
      x: 200,
      y: 140,
      orientation: 'north',
      portLayoutPreset: 'vertical',
      inputOrder: ['b', 'a'],
      outputOrder: ['sum', 'carry'],
      inputPortSides: { a: 'top', b: 'left' },
      outputPortSides: { sum: 'right', carry: 'bottom' },
    });
  });
});

describe('duplicateWorkspaceSelection', () => {
  it('duplicates a selected cluster to the right with preserved internal topology', () => {
    const duplicated = duplicateWorkspaceSelection({
      project: {
        modules: [
          { id: 'round-1-left', defId: 'XOR', params: { mode: 'xor' } },
          { id: 'round-1-right', defId: 'BitShifter', params: { amount: 2 } },
          { id: 'out', defId: 'Output', params: {} },
        ],
        connections: [
          {
            from: { moduleId: 'round-1-left', port: 'out' },
            to: { moduleId: 'round-1-right', port: 'in' },
          },
          {
            from: { moduleId: 'round-1-right', port: 'out' },
            to: { moduleId: 'out', port: 'in' },
          },
        ],
      },
      layout: {
        'round-1-left': { x: 120, y: 160 },
        'round-1-right': { x: 320, y: 220 },
        out: { x: 560, y: 220 },
      },
      selectedModuleIds: ['round-1-left', 'round-1-right'],
    });

    if (!duplicated) {
      throw new Error('Expected duplicated selection.');
    }

    expect(duplicated.pastedModuleIds).toEqual(['xor-1', 'bitshifter-1']);
    expect(duplicated.project.connections).toEqual([
      {
        from: { moduleId: 'round-1-left', port: 'out' },
        to: { moduleId: 'round-1-right', port: 'in' },
      },
      {
        from: { moduleId: 'round-1-right', port: 'out' },
        to: { moduleId: 'out', port: 'in' },
      },
      {
        from: { moduleId: 'xor-1', port: 'out' },
        to: { moduleId: 'bitshifter-1', port: 'in' },
      },
    ]);
    expect(duplicated.layout['xor-1']).toEqual({ x: 540, y: 160 });
    expect(duplicated.layout['bitshifter-1']).toEqual({ x: 740, y: 220 });
  });
});

describe('repeatWorkspaceSelectionToRight', () => {
  it('duplicates a repeated lane cluster and bridges source outputs into duplicate inputs by lane order', () => {
    const repeated = repeatWorkspaceSelectionToRight({
      project: {
        modules: [
          { id: 'src-a', defId: 'Input', params: {} },
          { id: 'lane-a-left', defId: 'PassBits', params: {} },
          { id: 'lane-a-right', defId: 'PassBits', params: {} },
          { id: 'dst-a', defId: 'Output', params: {} },
          { id: 'src-b', defId: 'Input', params: {} },
          { id: 'lane-b-left', defId: 'PassBits', params: {} },
          { id: 'lane-b-right', defId: 'PassBits', params: {} },
          { id: 'dst-b', defId: 'Output', params: {} },
        ],
        connections: [
          { from: { moduleId: 'src-a', port: 'out' }, to: { moduleId: 'lane-a-left', port: 'in' } },
          { from: { moduleId: 'lane-a-left', port: 'out' }, to: { moduleId: 'lane-a-right', port: 'in' } },
          { from: { moduleId: 'lane-a-right', port: 'out' }, to: { moduleId: 'dst-a', port: 'in' } },
          { from: { moduleId: 'src-b', port: 'out' }, to: { moduleId: 'lane-b-left', port: 'in' } },
          { from: { moduleId: 'lane-b-left', port: 'out' }, to: { moduleId: 'lane-b-right', port: 'in' } },
          { from: { moduleId: 'lane-b-right', port: 'out' }, to: { moduleId: 'dst-b', port: 'in' } },
        ],
      },
      layout: {
        'src-a': { x: 40, y: 120 },
        'lane-a-left': { x: 140, y: 120 },
        'lane-a-right': { x: 300, y: 120 },
        'dst-a': { x: 480, y: 120 },
        'src-b': { x: 40, y: 260 },
        'lane-b-left': { x: 140, y: 260 },
        'lane-b-right': { x: 300, y: 260 },
        'dst-b': { x: 480, y: 260 },
      },
      selectedModuleIds: ['lane-a-left', 'lane-a-right', 'lane-b-left', 'lane-b-right'],
      registry: TEST_REPEAT_REGISTRY,
    });

    if (!repeated) {
      throw new Error('Expected repeated selection.');
    }

    expect(repeated.pastedModuleIds).toEqual([
      'passbits-1',
      'passbits-2',
      'passbits-3',
      'passbits-4',
    ]);
    expect(repeated.repeatedConnections).toEqual([
      { from: { moduleId: 'lane-a-right', port: 'out' }, to: { moduleId: 'passbits-1', port: 'in' } },
      { from: { moduleId: 'lane-b-right', port: 'out' }, to: { moduleId: 'passbits-3', port: 'in' } },
    ]);
    expect(repeated.project.connections).toEqual([
      { from: { moduleId: 'src-a', port: 'out' }, to: { moduleId: 'lane-a-left', port: 'in' } },
      { from: { moduleId: 'lane-a-left', port: 'out' }, to: { moduleId: 'lane-a-right', port: 'in' } },
      { from: { moduleId: 'lane-a-right', port: 'out' }, to: { moduleId: 'dst-a', port: 'in' } },
      { from: { moduleId: 'src-b', port: 'out' }, to: { moduleId: 'lane-b-left', port: 'in' } },
      { from: { moduleId: 'lane-b-left', port: 'out' }, to: { moduleId: 'lane-b-right', port: 'in' } },
      { from: { moduleId: 'lane-b-right', port: 'out' }, to: { moduleId: 'dst-b', port: 'in' } },
      { from: { moduleId: 'passbits-1', port: 'out' }, to: { moduleId: 'passbits-2', port: 'in' } },
      { from: { moduleId: 'passbits-3', port: 'out' }, to: { moduleId: 'passbits-4', port: 'in' } },
      { from: { moduleId: 'lane-a-right', port: 'out' }, to: { moduleId: 'passbits-1', port: 'in' } },
      { from: { moduleId: 'lane-b-right', port: 'out' }, to: { moduleId: 'passbits-3', port: 'in' } },
    ]);
  });
});
