import { describe, expect, it } from 'vitest';

import { deriveConnectionLegibilityState } from './wire-legibility';

describe('deriveConnectionLegibilityState', () => {
  const connection = {
    from: { moduleId: 'source', port: 'out' },
    to: { moduleId: 'sink', port: 'in' },
  };

  it('highlights only the selected wire when a wire is selected', () => {
    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 2,
        selectedConnectionIndex: 2,
        focusedModuleId: 'source',
        traceFocusedModuleId: 'sink',
      }),
    ).toEqual({
      selected: true,
      emphasized: true,
      traceEmphasized: false,
      dimmed: false,
    });

    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 1,
        selectedConnectionIndex: 2,
        focusedModuleId: 'source',
        traceFocusedModuleId: 'sink',
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
      traceEmphasized: false,
      dimmed: true,
    });
  });

  it('emphasizes one-hop incoming and outgoing wires for a focused node', () => {
    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 0,
        selectedConnectionIndex: null,
        focusedModuleId: 'source',
        traceFocusedModuleId: 'sink',
      }),
    ).toEqual({
      selected: false,
      emphasized: true,
      traceEmphasized: false,
      dimmed: false,
    });

    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 0,
        selectedConnectionIndex: null,
        focusedModuleId: 'other',
        traceFocusedModuleId: null,
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
      traceEmphasized: false,
      dimmed: true,
    });
  });

  it('adds softer trace emphasis when only the active trace node is in scope', () => {
    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 0,
        selectedConnectionIndex: null,
        focusedModuleId: null,
        traceFocusedModuleId: 'sink',
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
      traceEmphasized: true,
      dimmed: false,
    });

    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 0,
        selectedConnectionIndex: null,
        focusedModuleId: null,
        traceFocusedModuleId: 'other',
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
      traceEmphasized: false,
      dimmed: true,
    });
  });

  it('leaves wires neutral when nothing is focused', () => {
    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 0,
        selectedConnectionIndex: null,
        focusedModuleId: null,
        traceFocusedModuleId: null,
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
      traceEmphasized: false,
      dimmed: false,
    });
  });
});
