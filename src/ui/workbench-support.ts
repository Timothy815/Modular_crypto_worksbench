import type { ExecutionResult, ExecutionTraceEntry, ValidationIssue } from '../engine/types';
import type { TargetPortState } from './connection-authoring';
import type { PortSide } from './node-orientation';
import type {
  WorkbenchConnectionLayout,
  WorkbenchGuideRail,
  WorkbenchGroupBox,
  WorkbenchPosition,
  WorkbenchStageLabel,
} from './workbench-document';

const ORTHOGONAL_STEP_BACK_PX = 20;
const ORTHOGONAL_LANE_OFFSET_PX = 6;
const ORTHOGONAL_LANE_PREFERENCE_OFFSET_PX = 48;
const ORTHOGONAL_CORNER_RADIUS_PX = 8;
const ORTHOGONAL_BEND_NO_OP_EPSILON_PX = 2;
const GUIDE_SNAP_THRESHOLD_PX = 30;
const DRAG_ALIGNMENT_GUIDE_THRESHOLD_PX = 16;

export interface OrthogonalEditableSegment {
  index: number;
  insertIndex: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface OrthogonalAnchorHandle {
  index: number;
  x: number;
  y: number;
}

export interface DragAlignmentGuide {
  axis: 'x' | 'y';
  position: number;
  kind: 'module' | 'guide-rail' | 'stage-label' | 'group-box';
}

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

export function snapModulePositionToGuideRails(
  position: { x: number; y: number },
  guideRails: WorkbenchGuideRail[],
  stageLabels: WorkbenchStageLabel[],
  groupBoxes: WorkbenchGroupBox[],
  nodeWidth: number,
  nodeHeight: number,
) {
  const nextPosition = { ...position };
  const xOffsets = [0, nodeWidth / 2, nodeWidth];
  const yOffsets = [0, nodeHeight / 2, nodeHeight];

  let bestX: { distance: number; snappedX: number } | null = null;
  let bestY: { distance: number; snappedY: number } | null = null;

  for (const guideRail of guideRails) {
    if (guideRail.axis === 'vertical') {
      for (const offset of xOffsets) {
        const candidateEdge = position.x + offset;
        const distance = Math.abs(candidateEdge - guideRail.position);
        if (!bestX || distance < bestX.distance) {
          bestX = {
            distance,
            snappedX: guideRail.position - offset,
          };
        }
      }
      continue;
    }

    for (const offset of yOffsets) {
      const candidateEdge = position.y + offset;
      const distance = Math.abs(candidateEdge - guideRail.position);
      if (!bestY || distance < bestY.distance) {
        bestY = {
          distance,
          snappedY: guideRail.position - offset,
        };
      }
    }
  }

  for (const stageLabel of stageLabels) {
    for (const offset of xOffsets) {
      const distance = Math.abs(position.x + offset - stageLabel.x);
      if (!bestX || distance < bestX.distance) {
        bestX = {
          distance,
          snappedX: stageLabel.x - offset,
        };
      }
    }

    for (const offset of yOffsets) {
      const distance = Math.abs(position.y + offset - stageLabel.y);
      if (!bestY || distance < bestY.distance) {
        bestY = {
          distance,
          snappedY: stageLabel.y - offset,
        };
      }
    }
  }

  for (const groupBox of groupBoxes) {
    const candidateXPositions = [
      groupBox.x,
      groupBox.x + groupBox.width / 2,
      groupBox.x + groupBox.width,
    ];
    const candidateYPositions = [
      groupBox.y,
      groupBox.y + groupBox.height / 2,
      groupBox.y + groupBox.height,
    ];

    for (const candidateX of candidateXPositions) {
      for (const offset of xOffsets) {
        const distance = Math.abs(position.x + offset - candidateX);
        if (!bestX || distance < bestX.distance) {
          bestX = {
            distance,
            snappedX: candidateX - offset,
          };
        }
      }
    }

    for (const candidateY of candidateYPositions) {
      for (const offset of yOffsets) {
        const distance = Math.abs(position.y + offset - candidateY);
        if (!bestY || distance < bestY.distance) {
          bestY = {
            distance,
            snappedY: candidateY - offset,
          };
        }
      }
    }
  }

  if (bestX && bestX.distance <= GUIDE_SNAP_THRESHOLD_PX) {
    nextPosition.x = Math.max(16, bestX.snappedX);
  }

  if (bestY && bestY.distance <= GUIDE_SNAP_THRESHOLD_PX) {
    nextPosition.y = Math.max(16, bestY.snappedY);
  }

  return nextPosition;
}

export function getModuleDragAlignmentGuides(
  position: { x: number; y: number },
  draggedModuleIds: string[],
  layout: Record<string, WorkbenchPosition>,
  guideRails: WorkbenchGuideRail[],
  stageLabels: WorkbenchStageLabel[],
  groupBoxes: WorkbenchGroupBox[],
  nodeWidth: number,
  nodeHeight: number,
) {
  const xOffsets = [0, nodeWidth / 2, nodeWidth];
  const yOffsets = [0, nodeHeight / 2, nodeHeight];
  const draggedIds = new Set(draggedModuleIds);

  let bestX:
    | {
        distance: number;
        position: number;
        kind: 'module' | 'guide-rail' | 'stage-label' | 'group-box';
      }
    | null = null;
  let bestY:
    | {
        distance: number;
        position: number;
        kind: 'module' | 'guide-rail' | 'stage-label' | 'group-box';
      }
    | null = null;

  for (const guideRail of guideRails) {
    if (guideRail.axis === 'vertical') {
      for (const offset of xOffsets) {
        const distance = Math.abs(position.x + offset - guideRail.position);
        if (!bestX || distance < bestX.distance) {
          bestX = { distance, position: guideRail.position, kind: 'guide-rail' };
        }
      }
    } else {
      for (const offset of yOffsets) {
        const distance = Math.abs(position.y + offset - guideRail.position);
        if (!bestY || distance < bestY.distance) {
          bestY = { distance, position: guideRail.position, kind: 'guide-rail' };
        }
      }
    }
  }

  for (const stageLabel of stageLabels) {
    for (const offset of xOffsets) {
      const distance = Math.abs(position.x + offset - stageLabel.x);
      if (!bestX || distance < bestX.distance) {
        bestX = { distance, position: stageLabel.x, kind: 'stage-label' };
      }
    }

    for (const offset of yOffsets) {
      const distance = Math.abs(position.y + offset - stageLabel.y);
      if (!bestY || distance < bestY.distance) {
        bestY = { distance, position: stageLabel.y, kind: 'stage-label' };
      }
    }
  }

  for (const groupBox of groupBoxes) {
    const candidateXPositions = [
      groupBox.x,
      groupBox.x + groupBox.width / 2,
      groupBox.x + groupBox.width,
    ];
    const candidateYPositions = [
      groupBox.y,
      groupBox.y + groupBox.height / 2,
      groupBox.y + groupBox.height,
    ];

    for (const candidateX of candidateXPositions) {
      for (const offset of xOffsets) {
        const distance = Math.abs(position.x + offset - candidateX);
        if (!bestX || distance < bestX.distance) {
          bestX = { distance, position: candidateX, kind: 'group-box' };
        }
      }
    }

    for (const candidateY of candidateYPositions) {
      for (const offset of yOffsets) {
        const distance = Math.abs(position.y + offset - candidateY);
        if (!bestY || distance < bestY.distance) {
          bestY = { distance, position: candidateY, kind: 'group-box' };
        }
      }
    }
  }

  for (const [moduleId, modulePosition] of Object.entries(layout)) {
    if (draggedIds.has(moduleId)) {
      continue;
    }

    for (const offset of xOffsets) {
      const distance = Math.abs(position.x + offset - (modulePosition.x + offset));
      if (!bestX || distance < bestX.distance) {
        bestX = { distance, position: modulePosition.x + offset, kind: 'module' };
      }
    }

    for (const offset of yOffsets) {
      const distance = Math.abs(position.y + offset - (modulePosition.y + offset));
      if (!bestY || distance < bestY.distance) {
        bestY = { distance, position: modulePosition.y + offset, kind: 'module' };
      }
    }
  }

  const guides: DragAlignmentGuide[] = [];

  if (bestX && bestX.distance <= DRAG_ALIGNMENT_GUIDE_THRESHOLD_PX) {
    guides.push({ axis: 'x', position: bestX.position, kind: bestX.kind });
  }

  if (bestY && bestY.distance <= DRAG_ALIGNMENT_GUIDE_THRESHOLD_PX) {
    guides.push({ axis: 'y', position: bestY.position, kind: bestY.kind });
  }

  return guides;
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

function getLanePreferenceOffset(
  lanePreference: WorkbenchConnectionLayout['orthogonalLanePreference'] | undefined,
) {
  if (lanePreference === 'negative') {
    return -ORTHOGONAL_LANE_PREFERENCE_OFFSET_PX;
  }
  if (lanePreference === 'positive') {
    return ORTHOGONAL_LANE_PREFERENCE_OFFSET_PX;
  }
  return 0;
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

function appendOrthogonalSegment(
  points: Array<{ x: number; y: number }>,
  end: { x: number; y: number },
  preferredAxis: 'x' | 'y',
) {
  const current = points.at(-1);
  if (!current) {
    points.push(end);
    return;
  }

  if (current.x === end.x && current.y === end.y) {
    return;
  }

  if (current.x === end.x || current.y === end.y) {
    points.push(end);
    return;
  }

  const previous = points.length >= 2 ? points[points.length - 2] : null;
  let elbow: { x: number; y: number };

  if (previous) {
    const previousAxis = previous.x === current.x ? 'y' : 'x';
    elbow =
      previousAxis === 'x'
        ? { x: current.x, y: end.y }
        : { x: end.x, y: current.y };
  } else {
    elbow =
      preferredAxis === 'x'
        ? { x: end.x, y: current.y }
        : { x: current.x, y: end.y };
  }

  if (elbow.x !== current.x || elbow.y !== current.y) {
    points.push(elbow);
  }
  points.push(end);
}

function getOrthogonalChainPoints(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetAnchor: { x: number; y: number },
  targetSide: PortSide,
  sourceIndex: number,
  targetIndex: number,
  connectionLayout?: WorkbenchConnectionLayout | null,
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
  const anchorPoints =
    connectionLayout?.orthogonalAnchors?.map((anchor) => ({ x: anchor.x, y: anchor.y })) ?? [];

  if (anchorPoints.length === 0) {
    if (sourceExit.x === targetEntry.x || sourceExit.y === targetEntry.y) {
      return {
        points: [sourceAnchor, sourceExit, targetEntry, targetAnchor],
        bendHandle: null,
        anchorHandles: [] as OrthogonalAnchorHandle[],
        editableSegments: [
          {
            index: 0,
            insertIndex: 0,
            start: sourceExit,
            end: targetEntry,
          },
        ] as OrthogonalEditableSegment[],
      };
    }

    if (sourceSide === 'left' || sourceSide === 'right') {
      const autoValue =
        (sourceExit.x + targetEntry.x) / 2
        + laneOffset
        + getLanePreferenceOffset(connectionLayout?.orthogonalLanePreference);
      const bendValue =
        connectionLayout?.orthogonalBend?.axis === 'x' &&
        Number.isFinite(connectionLayout.orthogonalBend.value)
          ? connectionLayout.orthogonalBend.value
          : autoValue;
      return {
        points: [
          sourceAnchor,
          sourceExit,
          { x: bendValue, y: sourceExit.y },
          { x: bendValue, y: targetEntry.y },
          targetEntry,
          targetAnchor,
        ],
        bendHandle: {
          axis: 'x' as const,
          value: bendValue,
          autoValue,
          x: bendValue,
          y: (sourceExit.y + targetEntry.y) / 2,
        },
        anchorHandles: [] as OrthogonalAnchorHandle[],
        editableSegments: [
          {
            index: 0,
            insertIndex: 0,
            start: sourceExit,
            end: { x: bendValue, y: sourceExit.y },
          },
          {
            index: 1,
            insertIndex: 0,
            start: { x: bendValue, y: sourceExit.y },
            end: { x: bendValue, y: targetEntry.y },
          },
          {
            index: 2,
            insertIndex: 0,
            start: { x: bendValue, y: targetEntry.y },
            end: targetEntry,
          },
        ] as OrthogonalEditableSegment[],
      };
    }

    const autoValue =
      (sourceExit.y + targetEntry.y) / 2
      + laneOffset
      + getLanePreferenceOffset(connectionLayout?.orthogonalLanePreference);
    const bendValue =
      connectionLayout?.orthogonalBend?.axis === 'y' &&
      Number.isFinite(connectionLayout.orthogonalBend.value)
        ? connectionLayout.orthogonalBend.value
        : autoValue;
    return {
      points: [
        sourceAnchor,
        sourceExit,
        { x: sourceExit.x, y: bendValue },
        { x: targetEntry.x, y: bendValue },
        targetEntry,
        targetAnchor,
      ],
      bendHandle: {
        axis: 'y' as const,
        value: bendValue,
        autoValue,
        x: (sourceExit.x + targetEntry.x) / 2,
        y: bendValue,
      },
      anchorHandles: [] as OrthogonalAnchorHandle[],
      editableSegments: [
        {
          index: 0,
          insertIndex: 0,
          start: sourceExit,
          end: { x: sourceExit.x, y: bendValue },
        },
        {
          index: 1,
          insertIndex: 0,
          start: { x: sourceExit.x, y: bendValue },
          end: { x: targetEntry.x, y: bendValue },
        },
        {
          index: 2,
          insertIndex: 0,
          start: { x: targetEntry.x, y: bendValue },
          end: targetEntry,
        },
      ] as OrthogonalEditableSegment[],
    };
  }

  const points = [sourceAnchor, sourceExit];
  for (const anchor of anchorPoints) {
    appendOrthogonalSegment(points, anchor, sourceSide === 'left' || sourceSide === 'right' ? 'x' : 'y');
  }
  appendOrthogonalSegment(
    points,
    targetEntry,
    sourceSide === 'left' || sourceSide === 'right' ? 'x' : 'y',
  );
  points.push(targetAnchor);

  const editableSegments: OrthogonalEditableSegment[] = [];
  let insertIndex = 0;
  for (let index = 1; index < points.length - 2; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (start.x === end.x || start.y === end.y) {
      editableSegments.push({
        index: editableSegments.length,
        insertIndex,
        start,
        end,
      });
    }
    if (anchorPoints.some((anchor) => anchor.x === end.x && anchor.y === end.y)) {
      insertIndex += 1;
    }
  }

  return {
    points,
    bendHandle: null,
    anchorHandles: anchorPoints.map((anchor, index) => ({
      index,
      x: anchor.x,
      y: anchor.y,
    })),
    editableSegments,
  };
}

export function getOrthogonalPath(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetAnchor: { x: number; y: number },
  targetSide: PortSide,
  sourceIndex: number,
  targetIndex: number,
) {
  return getOrthogonalPathData(
    sourceAnchor,
    sourceSide,
    targetAnchor,
    targetSide,
    sourceIndex,
    targetIndex,
  ).path;
}

export function getOrthogonalPathData(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetAnchor: { x: number; y: number },
  targetSide: PortSide,
  sourceIndex: number,
  targetIndex: number,
  connectionLayout?: WorkbenchConnectionLayout | null,
) {
  const chain = getOrthogonalChainPoints(
    sourceAnchor,
    sourceSide,
    targetAnchor,
    targetSide,
    sourceIndex,
    targetIndex,
    connectionLayout,
  );

  return {
    path: buildRoundedOrthogonalPath(chain.points),
    points: chain.points,
    bendHandle: chain.bendHandle,
    anchorHandles: chain.anchorHandles,
    editableSegments: chain.editableSegments,
  };
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

export function shouldClearOrthogonalBendOverride(
  bendHandle: { autoValue: number; value: number } | null,
) {
  return !bendHandle || Math.abs(bendHandle.value - bendHandle.autoValue) < ORTHOGONAL_BEND_NO_OP_EPSILON_PX;
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
