import { describe, expect, it } from 'vitest';

import { compareWorkspaceToVersion } from './workspace-comparison';

describe('compareWorkspaceToVersion', () => {
  it('compares the current workspace against one saved version structurally', () => {
    const comparison = compareWorkspaceToVersion(
      {
        modules: [
          { id: 'a', defId: 'TextInput', params: {} },
          { id: 'b', defId: 'SymbolToBits', params: {} },
          { id: 'c', defId: 'BitsToSymbol', params: {} },
        ],
        connections: [
          { from: { moduleId: 'a', port: 'out' }, to: { moduleId: 'b', port: 'in' } },
          { from: { moduleId: 'b', port: 'out' }, to: { moduleId: 'c', port: 'in' } },
        ],
      },
      {
        id: 'baseline',
        name: 'Baseline',
        savedAt: '2026-03-27T12:00:00.000Z',
        tickedMode: false,
        document: {
          version: 1,
          project: {
            modules: [
              { id: 'a', defId: 'TextInput', params: {} },
              { id: 'b', defId: 'SymbolToBits', params: {} },
              { id: 'd', defId: 'Output', params: {} },
            ],
            connections: [
              { from: { moduleId: 'a', port: 'out' }, to: { moduleId: 'b', port: 'in' } },
              { from: { moduleId: 'b', port: 'out' }, to: { moduleId: 'd', port: 'in' } },
            ],
          },
          ui: {
            layout: {},
            annotations: [],
          },
        },
      },
    );

    expect(comparison.addedModules.map((moduleInstance) => moduleInstance.id)).toEqual(['c']);
    expect(comparison.unchangedModules.map((moduleInstance) => moduleInstance.id)).toEqual(['a', 'b']);
    expect(comparison.removedModules.map((moduleInstance) => moduleInstance.id)).toEqual(['d']);
    expect(comparison.addedConnections).toHaveLength(1);
    expect(comparison.unchangedConnections).toHaveLength(1);
    expect(comparison.removedConnections).toHaveLength(1);
    expect(comparison.currentModuleStatusById).toEqual({
      a: 'unchanged',
      b: 'unchanged',
      c: 'added',
    });
  });

  it('treats matching ids with different definitions as structural changes', () => {
    const comparison = compareWorkspaceToVersion(
      {
        modules: [{ id: 'control', defId: 'Counter', params: {} }],
        connections: [],
      },
      {
        id: 'baseline',
        name: 'Baseline',
        savedAt: '2026-03-27T12:00:00.000Z',
        tickedMode: false,
        document: {
          version: 1,
          project: {
            modules: [{ id: 'control', defId: 'Clock', params: {} }],
            connections: [],
          },
          ui: {
            layout: {},
            annotations: [],
          },
        },
      },
    );

    expect(comparison.addedModules.map((moduleInstance) => moduleInstance.defId)).toEqual(['Counter']);
    expect(comparison.removedModules.map((moduleInstance) => moduleInstance.defId)).toEqual(['Clock']);
  });
});
