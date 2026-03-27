import type { ExecutionResult, ExecutionTraceEntry, ValidationIssue } from '../engine/types';
import type { TargetPortState } from './connection-authoring';

export function getAnchorPosition(
  x: number,
  y: number,
  side: 'left' | 'right',
  portIndex: number,
  nodeWidth: number,
  portStartY: number,
  portGap: number,
) {
  return {
    x: side === 'left' ? x : x + nodeWidth,
    y: y + portStartY + portIndex * portGap,
  };
}

export function formatVersionTimestamp(savedAt: string) {
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime()) ? savedAt : date.toLocaleString();
}

export function buildIncomingConnectionIndexByInputKey(
  connections: Array<{
    to: { moduleId: string; port: string };
  }>,
) {
  return Object.fromEntries(
    connections.map((connection, index) => [`${connection.to.moduleId}:${connection.to.port}`, index]),
  ) as Record<string, number>;
}

export function buildModuleIssueCountById(validationIssues: ValidationIssue[]) {
  const counts: Record<string, number> = {};

  for (const issue of validationIssues) {
    if (issue.moduleId) {
      counts[issue.moduleId] = (counts[issue.moduleId] ?? 0) + 1;
    }
    if (issue.connection) {
      counts[issue.connection.from.moduleId] = (counts[issue.connection.from.moduleId] ?? 0) + 1;
      counts[issue.connection.to.moduleId] = (counts[issue.connection.to.moduleId] ?? 0) + 1;
    }
  }

  return counts;
}

export function buildExecutionSignalByModuleId(execution: ExecutionResult | null) {
  if (!execution) {
    return {};
  }

  return Object.fromEntries(
    execution.trace.map((entry) => {
      const primaryOutput = Object.values(entry.outputs)[0] ?? null;
      return [entry.moduleId, primaryOutput ?? entry.inputs.in ?? null];
    }),
  ) as Record<string, ExecutionResult['trace'][number]['inputs'][string] | null>;
}

export function buildActiveAnalysisSignalByModuleId(
  activeAnalysisTraceEntry: ExecutionTraceEntry | null,
  activeAnalysisOwnerModuleId: string | null,
) {
  if (!activeAnalysisTraceEntry || !activeAnalysisOwnerModuleId) {
    return {};
  }

  const primaryOutput = Object.values(activeAnalysisTraceEntry.outputs)[0] ?? null;
  const signal = primaryOutput ?? activeAnalysisTraceEntry.inputs.in ?? null;
  if (!signal) {
    return {};
  }

  return {
    [activeAnalysisOwnerModuleId]: signal,
  } as Record<string, ExecutionTraceEntry['inputs'][string] | null>;
}

export function getInputAnchorClassName(
  pendingConnection: {
    fromModuleId: string;
    fromPort: string;
    fromAnchor: { x: number; y: number };
    mouseX: number;
    mouseY: number;
    excludedConnectionIndex: number | null;
  } | null,
  targetState: TargetPortState | undefined,
  hasIncomingConnection: boolean,
) {
  if (!pendingConnection) {
    return hasIncomingConnection
      ? 'graph-port-anchor graph-port-anchor-in graph-port-anchor-occupied'
      : 'graph-port-anchor graph-port-anchor-in';
  }

  if (targetState?.valid) {
    return targetState.mode === 'replace'
      ? 'graph-port-anchor graph-port-anchor-in graph-port-droppable graph-port-replace'
      : 'graph-port-anchor graph-port-anchor-in graph-port-droppable graph-port-valid';
  }

  return 'graph-port-anchor graph-port-anchor-in graph-port-droppable graph-port-invalid';
}
