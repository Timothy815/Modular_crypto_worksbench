import type { CSSProperties } from 'react';

import type { ModuleDefinition } from '../../engine/types';
import {
  CANVAS_NODE_HEIGHT,
  CANVAS_NODE_WIDTH,
} from '../canvas-selection';
import {
  getNodeOrientation,
  getPortSideForModulePort,
  isVerticalPortSide,
  type PortSide,
} from '../node-orientation';
import { getOrderedPorts } from '../port-ordering';
import { WORKBENCH_GRID_SIZE } from '../store';
import type { WorkbenchPosition } from '../workbench-document';

// ---- Node sizing ----

const NODE_WIDTH = CANVAS_NODE_WIDTH;
const NODE_HEIGHT = CANVAS_NODE_HEIGHT;
const PORT_GAP = 18;
const PORT_START_Y = 38;

export type NodeSizeClass = 'compact' | 'standard' | 'roomy';

export interface NodeSizeConfig {
  width: number;
  height: number;
  portStartY: number;
  portGap: number;
}

export const NODE_SIZE_CONFIGS: Record<NodeSizeClass, NodeSizeConfig> = {
  compact: { width: 120, height: 90, portStartY: 28, portGap: 18 },
  standard: { width: NODE_WIDTH, height: NODE_HEIGHT, portStartY: PORT_START_Y, portGap: PORT_GAP },
  roomy: { width: 172, height: 150, portStartY: 44, portGap: 20 },
};

export function getNodeSizeClass(totalPorts: number): NodeSizeClass {
  if (totalPorts <= 1) return 'compact';
  if (totalPorts >= 5) return 'roomy';
  return 'standard';
}

// ---- Canvas constants ----

export const PENDING_TARGET_HIT_HALF_WIDTH = 22;
export const PENDING_TARGET_HIT_HALF_HEIGHT = 16;
export const ANCHOR_INSERTION_HIT_TOLERANCE = 18;
export const DEFAULT_CANVAS_VIEWPORT_HEIGHT = 520;
export const MIN_CANVAS_VIEWPORT_HEIGHT = 360;
export const MAX_CANVAS_VIEWPORT_HEIGHT = 1200;
export const MIN_GROUP_BOX_WIDTH = 180;
export const MIN_GROUP_BOX_HEIGHT = 120;
export const MINIMAP_WIDTH = 220;
export const MINIMAP_HEIGHT = 152;
export const MINIMAP_PADDING = 10;

// ---- Grid snapping ----

export function snapCoordinateToGrid(value: number) {
  return Math.max(16, Math.round(value / WORKBENCH_GRID_SIZE) * WORKBENCH_GRID_SIZE);
}

export function snapPointToGrid(position: { x: number; y: number }) {
  return {
    x: snapCoordinateToGrid(position.x),
    y: snapCoordinateToGrid(position.y),
  };
}

// ---- Hit testing ----

export function isPointerNearPortAnchor(
  pointer: { x: number; y: number },
  anchor: { x: number; y: number },
  side: PortSide,
) {
  if (isVerticalPortSide(side)) {
    return (
      Math.abs(pointer.x - anchor.x) <= PENDING_TARGET_HIT_HALF_WIDTH &&
      Math.abs(pointer.y - anchor.y) <= PENDING_TARGET_HIT_HALF_HEIGHT
    );
  }

  return (
    Math.abs(pointer.x - anchor.x) <= PENDING_TARGET_HIT_HALF_HEIGHT &&
    Math.abs(pointer.y - anchor.y) <= PENDING_TARGET_HIT_HALF_WIDTH
  );
}

// ---- Port anchor layout ----

export function getPortAnchorStyle(
  side: PortSide,
  portIndex: number,
  config: NodeSizeConfig = NODE_SIZE_CONFIGS.standard,
): CSSProperties {
  const offset = config.portStartY + portIndex * config.portGap;
  if (side === 'top' || side === 'bottom') {
    return { left: `${offset}px` };
  }
  return { top: `${offset}px` };
}

// ---- SVG path generation ----

export function getConnectionPath(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetAnchor: { x: number; y: number },
  targetSide: PortSide,
) {
  const horizontal = !isVerticalPortSide(sourceSide) && !isVerticalPortSide(targetSide);
  const primaryDistance = horizontal
    ? Math.abs(targetAnchor.x - sourceAnchor.x)
    : Math.abs(targetAnchor.y - sourceAnchor.y);
  const bend = Math.max(56, primaryDistance * 0.42);

  const sourceControl = horizontal
    ? {
        x: sourceSide === 'right' ? sourceAnchor.x + bend : sourceAnchor.x - bend,
        y: sourceAnchor.y,
      }
    : {
        x: sourceAnchor.x,
        y: sourceSide === 'bottom' ? sourceAnchor.y + bend : sourceAnchor.y - bend,
      };

  const targetControl = horizontal
    ? {
        x: targetSide === 'left' ? targetAnchor.x - bend : targetAnchor.x + bend,
        y: targetAnchor.y,
      }
    : {
        x: targetAnchor.x,
        y: targetSide === 'top' ? targetAnchor.y - bend : targetAnchor.y + bend,
      };

  return `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceControl.x} ${sourceControl.y}, ${targetControl.x} ${targetControl.y}, ${targetAnchor.x} ${targetAnchor.y}`;
}

export function getPendingConnectionPath(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetPoint: { x: number; y: number },
) {
  const primaryDistance = isVerticalPortSide(sourceSide)
    ? Math.abs(targetPoint.y - sourceAnchor.y)
    : Math.abs(targetPoint.x - sourceAnchor.x);
  const bend = Math.max(56, primaryDistance * 0.42);

  const sourceControl = isVerticalPortSide(sourceSide)
    ? {
        x: sourceAnchor.x,
        y: sourceSide === 'bottom' ? sourceAnchor.y + bend : sourceAnchor.y - bend,
      }
    : {
        x: sourceSide === 'right' ? sourceAnchor.x + bend : sourceAnchor.x - bend,
        y: sourceAnchor.y,
      };

  const targetControl = isVerticalPortSide(sourceSide)
    ? { x: targetPoint.x, y: targetPoint.y + (targetPoint.y >= sourceAnchor.y ? -bend : bend) }
    : { x: targetPoint.x + (targetPoint.x >= sourceAnchor.x ? -bend : bend), y: targetPoint.y };

  return `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceControl.x} ${sourceControl.y}, ${targetControl.x} ${targetControl.y}, ${targetPoint.x} ${targetPoint.y}`;
}

export function getOrthogonalConnectionVisualOffset(
  sourceSide: PortSide,
  sourceIndex: number,
  targetIndex: number,
) {
  const laneSlot = ((sourceIndex * 3 + targetIndex) % 3) - 1;
  const magnitude = laneSlot * 0.8;

  if (magnitude === 0) {
    return null;
  }

  return sourceSide === 'left' || sourceSide === 'right'
    ? { x: 0, y: magnitude }
    : { x: magnitude, y: 0 };
}

export function getNearestPointOnOrthogonalSegment(
  point: { x: number; y: number },
  segment: { start: { x: number; y: number }; end: { x: number; y: number } },
) {
  if (segment.start.x === segment.end.x) {
    const minY = Math.min(segment.start.y, segment.end.y);
    const maxY = Math.max(segment.start.y, segment.end.y);
    const y = Math.max(minY, Math.min(maxY, point.y));
    return {
      x: segment.start.x,
      y,
      distance: Math.abs(point.x - segment.start.x),
    };
  }

  const minX = Math.min(segment.start.x, segment.end.x);
  const maxX = Math.max(segment.start.x, segment.end.x);
  const x = Math.max(minX, Math.min(maxX, point.x));
  return {
    x,
    y: segment.start.y,
    distance: Math.abs(point.y - segment.start.y),
  };
}

// ---- Port placement ----

export function getOrderedModulePorts(
  definition: ModuleDefinition,
  position: WorkbenchPosition | undefined,
  direction: 'input' | 'output',
) {
  return getOrderedPorts(
    direction === 'input' ? definition.inputs : definition.outputs,
    direction === 'input' ? position?.inputOrder : position?.outputOrder,
  );
}

export function buildSidePortGroups(
  inputPorts: Array<{ name: string; type: string }>,
  outputPorts: Array<{ name: string; type: string }>,
  position: WorkbenchPosition | undefined,
  orientation: ReturnType<typeof getNodeOrientation>,
) {
  const grouped: Record<
    PortSide,
    {
      inputs: Array<{ name: string; type: string }>;
      outputs: Array<{ name: string; type: string }>;
    }
  > = {
    left: { inputs: [], outputs: [] },
    right: { inputs: [], outputs: [] },
    top: { inputs: [], outputs: [] },
    bottom: { inputs: [], outputs: [] },
  };

  inputPorts.forEach((port) => {
    const side = getPortSideForModulePort(position, orientation, 'in', port.name);
    grouped[side].inputs.push({ ...port });
  });

  outputPorts.forEach((port) => {
    const side = getPortSideForModulePort(position, orientation, 'out', port.name);
    grouped[side].outputs.push({ ...port });
  });

  return grouped;
}

export function getPortPlacementForModulePort(
  inputPorts: Array<{ name: string; type: string }>,
  outputPorts: Array<{ name: string; type: string }>,
  position: WorkbenchPosition | undefined,
  orientation: ReturnType<typeof getNodeOrientation>,
  direction: 'in' | 'out',
  portName: string,
) {
  const grouped = buildSidePortGroups(inputPorts, outputPorts, position, orientation);
  const side = getPortSideForModulePort(position, orientation, direction, portName);
  const sideGroup = grouped[side];
  const sidePorts = direction === 'in' ? sideGroup.inputs : sideGroup.outputs;
  const portIndex = sidePorts.findIndex((port) => port.name === portName);
  if (portIndex === -1) {
    return { side, sideIndex: 0 };
  }

  const opposingCount = direction === 'in' ? 0 : sideGroup.inputs.length;
  const gapOffset = direction === 'out' && sideGroup.inputs.length > 0 ? 1 : 0;
  return {
    side,
    sideIndex: opposingCount + gapOffset + portIndex,
  };
}

// ---- Inline param formatting ----

export interface InlineEditableParamSpec {
  paramKey: string;
  label: string;
}

export const INLINE_EDITABLE_PARAM_SPECS: Record<string, InlineEditableParamSpec> = {
  BitSource: { paramKey: 'stream', label: 'Bits' },
  KeyInput: { paramKey: 'value', label: 'Key' },
  IV: { paramKey: 'value', label: 'IV' },
  Nonce: { paramKey: 'value', label: 'Nonce' },
  Salt: { paramKey: 'value', label: 'Salt' },
  BitShifter: { paramKey: 'amount', label: 'Shift' },
  Counter: { paramKey: 'value', label: 'Count' },
};

export function formatInlineEditableValue(value: unknown, fieldKind: string) {
  if (fieldKind === 'bits' && Array.isArray(value)) {
    const compact = (value as number[]).join('');
    return compact.length > 20 ? `${compact.slice(0, 20)}…` : compact;
  }

  const text = String(value ?? '');
  return text.length > 24 ? `${text.slice(0, 24)}…` : text;
}
