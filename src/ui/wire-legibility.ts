import type { Connection } from '../engine/types';

export interface ConnectionLegibilityState {
  selected: boolean;
  emphasized: boolean;
  dimmed: boolean;
}

interface DeriveConnectionLegibilityStateArgs {
  connection: Connection;
  connectionIndex: number;
  selectedConnectionIndex: number | null;
  focusedModuleId: string | null;
}

export function deriveConnectionLegibilityState({
  connection,
  connectionIndex,
  selectedConnectionIndex,
  focusedModuleId,
}: DeriveConnectionLegibilityStateArgs): ConnectionLegibilityState {
  if (selectedConnectionIndex !== null) {
    return {
      selected: selectedConnectionIndex === connectionIndex,
      emphasized: selectedConnectionIndex === connectionIndex,
      dimmed: selectedConnectionIndex !== connectionIndex,
    };
  }

  if (focusedModuleId) {
    const isImmediateNeighbor =
      connection.from.moduleId === focusedModuleId || connection.to.moduleId === focusedModuleId;

    return {
      selected: false,
      emphasized: isImmediateNeighbor,
      dimmed: !isImmediateNeighbor,
    };
  }

  return {
    selected: false,
    emphasized: false,
    dimmed: false,
  };
}
