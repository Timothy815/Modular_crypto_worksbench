import type { Connection } from '../engine/types';

export interface ConnectionLegibilityState {
  selected: boolean;
  emphasized: boolean;
  traceEmphasized: boolean;
  dimmed: boolean;
}

interface DeriveConnectionLegibilityStateArgs {
  connection: Connection;
  connectionIndex: number;
  selectedConnectionIndex: number | null;
  focusedModuleId: string | null;
  traceFocusedModuleId: string | null;
}

export function deriveConnectionLegibilityState({
  connection,
  connectionIndex,
  selectedConnectionIndex,
  focusedModuleId,
  traceFocusedModuleId,
}: DeriveConnectionLegibilityStateArgs): ConnectionLegibilityState {
  if (selectedConnectionIndex !== null) {
    return {
      selected: selectedConnectionIndex === connectionIndex,
      emphasized: selectedConnectionIndex === connectionIndex,
      traceEmphasized: false,
      dimmed: selectedConnectionIndex !== connectionIndex,
    };
  }

  const isFocusedImmediateNeighbor = focusedModuleId
    ? connection.from.moduleId === focusedModuleId || connection.to.moduleId === focusedModuleId
    : false;
  const isTraceImmediateNeighbor = traceFocusedModuleId
    ? connection.from.moduleId === traceFocusedModuleId ||
      connection.to.moduleId === traceFocusedModuleId
    : false;

  if (focusedModuleId) {
    const hasAnyImmediateContext = isFocusedImmediateNeighbor || isTraceImmediateNeighbor;

    return {
      selected: false,
      emphasized: isFocusedImmediateNeighbor,
      traceEmphasized: !isFocusedImmediateNeighbor && isTraceImmediateNeighbor,
      dimmed: !hasAnyImmediateContext,
    };
  }

  if (traceFocusedModuleId) {
    return {
      selected: false,
      emphasized: false,
      traceEmphasized: isTraceImmediateNeighbor,
      dimmed: !isTraceImmediateNeighbor,
    };
  }

  return {
    selected: false,
    emphasized: false,
    traceEmphasized: false,
    dimmed: false,
  };
}
