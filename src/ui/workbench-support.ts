import type { ExecutionResult, ExecutionTraceEntry, ValidationIssue } from '../engine/types';
import type { TargetPortState } from './connection-authoring';
import type { PortSide } from './node-orientation';

const ORTHOGONAL_STEP_BACK_PX = 20;
const ORTHOGONAL_LANE_OFFSET_PX = 6;
const ORTHOGONAL_CORNER_RADIUS_PX = 8;

export function getAnchorPosition(
  x: number,
  y: number,
  side: PortSide,
  portIndex: number,
  nodeWidth: number,
  nodeHeight: number,
  portStartY: number,
  portGap: number,
) {
  if (side === 'top' || side === 'bottom') {
    return {
      x: x + portStartY + portIndex * portGap,
      y: side === 'top' ? y : y + nodeHeight,
    };
  }

  return {
    x: side === 'left' ? x : x + nodeWidth,
    y: y + portStartY + portIndex * portGap,
  };
}

function getSideVector(side: PortSide) {
  switch (side) {
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
    case 'top':
      return { x: 0, y: -1 };
    case 'bottom':
      return { x: 0, y: 1 };
  }
}

function getLaneOffset(sourceIndex: number, targetIndex: number) {
  const laneSeed = ((sourceIndex + 1) * 31 + (targetIndex + 1) * 17) % 5;
  return (laneSeed - 2) * ORTHOGONAL_LANE_OFFSET_PX;
}

function buildRoundedOrthogonalPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 3) {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  }

  const commands: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incomingDx = current.x - previous.x;
    const incomingDy = current.y - previous.y;
    const outgoingDx = next.x - current.x;
    const outgoingDy = next.y - current.y;

    if (
      (incomingDx === 0 && outgoingDx === 0) ||
      (incomingDy === 0 && outgoingDy === 0) ||
      (incomingDx === 0 && incomingDy === 0) ||
      (outgoingDx === 0 && outgoingDy === 0)
    ) {
      commands.push(`L ${current.x} ${current.y}`);
      continue;
    }

    const incomingLength = Math.abs(incomingDx) + Math.abs(incomingDy);
    const outgoingLength = Math.abs(outgoingDx) + Math.abs(outgoingDy);
    const radius = Math.min(
      ORTHOGONAL_CORNER_RADIUS_PX,
      incomingLength / 2,
      outgoingLength / 2,
    );

    const entry = {
      x: current.x - Math.sign(incomingDx) * radius,
      y: current.y - Math.sign(incomingDy) * radius,
    };
    const exit = {
      x: current.x + Math.sign(outgoingDx) * radius,
      y: current.y + Math.sign(outgoingDy) * radius,
    };

    commands.push(`L ${entry.x} ${entry.y}`);
    commands.push(`Q ${current.x} ${current.y} ${exit.x} ${exit.y}`);
  }

  const last = points.at(-1);
  if (last) {
    commands.push(`L ${last.x} ${last.y}`);
  }

  return commands.join(' ');
}

export function getOrthogonalPath(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetAnchor: { x: number; y: number },
  targetSide: PortSide,
  sourceIndex: number,
  targetIndex: number,
) {
  const sourceVector = getSideVector(sourceSide);
  const targetVector = getSideVector(targetSide);
  const laneOffset = getLaneOffset(sourceIndex, targetIndex);
  const sourceExit = {
    x: sourceAnchor.x + sourceVector.x * ORTHOGONAL_STEP_BACK_PX,
    y: sourceAnchor.y + sourceVector.y * ORTHOGONAL_STEP_BACK_PX,
  };
  const targetEntry = {
    x: targetAnchor.x + targetVector.x * ORTHOGONAL_STEP_BACK_PX,
    y: targetAnchor.y + targetVector.y * ORTHOGONAL_STEP_BACK_PX,
  };

  if (sourceExit.x === targetEntry.x || sourceExit.y === targetEntry.y) {
    return buildRoundedOrthogonalPath([sourceAnchor, sourceExit, targetEntry, targetAnchor]);
  }

  if (sourceSide === 'left' || sourceSide === 'right') {
    const elbowX = (sourceExit.x + targetEntry.x) / 2 + laneOffset;
    return buildRoundedOrthogonalPath([
      sourceAnchor,
      sourceExit,
      { x: elbowX, y: sourceExit.y },
      { x: elbowX, y: targetEntry.y },
      targetEntry,
      targetAnchor,
    ]);
  }

  const elbowY = (sourceExit.y + targetEntry.y) / 2 + laneOffset;
  return buildRoundedOrthogonalPath([
    sourceAnchor,
    sourceExit,
    { x: sourceExit.x, y: elbowY },
    { x: targetEntry.x, y: elbowY },
    targetEntry,
    targetAnchor,
  ]);
}

export function getOrthogonalPendingPath(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetPoint: { x: number; y: number },
) {
  const sourceVector = getSideVector(sourceSide);
  const sourceExit = {
    x: sourceAnchor.x + sourceVector.x * ORTHOGONAL_STEP_BACK_PX,
    y: sourceAnchor.y + sourceVector.y * ORTHOGONAL_STEP_BACK_PX,
  };

  if (sourceExit.x === targetPoint.x || sourceExit.y === targetPoint.y) {
    return buildRoundedOrthogonalPath([sourceAnchor, sourceExit, targetPoint]);
  }

  if (sourceSide === 'left' || sourceSide === 'right') {
    const elbowX = (sourceExit.x + targetPoint.x) / 2;
    return buildRoundedOrthogonalPath([
      sourceAnchor,
      sourceExit,
      { x: elbowX, y: sourceExit.y },
      { x: elbowX, y: targetPoint.y },
      targetPoint,
    ]);
  }

  const elbowY = (sourceExit.y + targetPoint.y) / 2;
  return buildRoundedOrthogonalPath([
    sourceAnchor,
    sourceExit,
    { x: sourceExit.x, y: elbowY },
    { x: targetPoint.x, y: elbowY },
    targetPoint,
  ]);
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
