import { describe, expect, it } from 'vitest';

import type { Project } from '../engine/types';
import {
  buildWorkspaceClipboardSnapshot,
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
});
