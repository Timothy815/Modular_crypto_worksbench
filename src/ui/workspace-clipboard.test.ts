import { describe, expect, it } from 'vitest';

import type { Project } from '../engine/types';
import {
  buildWorkspaceClipboardSnapshot,
  duplicateWorkspaceSelection,
  pasteWorkspaceClipboardSnapshot,
} from './workspace-clipboard';

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
