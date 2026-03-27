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
      }),
    ).toEqual({
      selected: true,
      emphasized: true,
      dimmed: false,
    });

    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 1,
        selectedConnectionIndex: 2,
        focusedModuleId: 'source',
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
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
      }),
    ).toEqual({
      selected: false,
      emphasized: true,
      dimmed: false,
    });

    expect(
      deriveConnectionLegibilityState({
        connection,
        connectionIndex: 0,
        selectedConnectionIndex: null,
        focusedModuleId: 'other',
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
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
      }),
    ).toEqual({
      selected: false,
      emphasized: false,
      dimmed: false,
    });
  });
});
