import type {
  WorkbenchLayoutDirection,
  WorkbenchNodeOrientation,
  WorkbenchPortLayoutPreset,
  WorkbenchPortSide,
  WorkbenchPosition,
} from './workbench-document';

export type PortSide = WorkbenchPortSide;

export function getDefaultNodeOrientation(
  layoutDirection: WorkbenchLayoutDirection,
): WorkbenchNodeOrientation {
  return layoutDirection === 'vertical' ? 'south' : 'east';
}

export function getNodeOrientation(
  orientation: WorkbenchNodeOrientation | undefined,
  layoutDirection: WorkbenchLayoutDirection,
): WorkbenchNodeOrientation {
  return orientation ?? getDefaultNodeOrientation(layoutDirection);
}

export function getNextNodeOrientationClockwise(
  orientation: WorkbenchNodeOrientation,
): WorkbenchNodeOrientation {
  switch (orientation) {
    case 'east':
      return 'south';
    case 'south':
      return 'west';
    case 'west':
      return 'north';
    case 'north':
      return 'east';
  }
}

export function getPortSideForOrientation(
  orientation: WorkbenchNodeOrientation,
  direction: 'in' | 'out',
): PortSide {
  if (direction === 'in') {
    switch (orientation) {
      case 'east':
        return 'left';
      case 'south':
        return 'top';
      case 'west':
        return 'right';
      case 'north':
        return 'bottom';
    }
  }

  switch (orientation) {
    case 'east':
      return 'right';
    case 'south':
      return 'bottom';
    case 'west':
      return 'left';
    case 'north':
      return 'top';
  }
}

export function getPortSideForNodePresentation(
  orientation: WorkbenchNodeOrientation,
  direction: 'in' | 'out',
  preset?: WorkbenchPortLayoutPreset,
): PortSide {
  if (preset === 'horizontal') {
    return direction === 'in' ? 'left' : 'right';
  }

  if (preset === 'vertical') {
    return direction === 'in' ? 'top' : 'bottom';
  }

  return getPortSideForOrientation(orientation, direction);
}

export function getPortSideForModulePort(
  position: WorkbenchPosition | undefined,
  orientation: WorkbenchNodeOrientation,
  direction: 'in' | 'out',
  portName: string,
): PortSide {
  const explicitSide =
    direction === 'in'
      ? position?.inputPortSides?.[portName]
      : position?.outputPortSides?.[portName];

  if (explicitSide) {
    return explicitSide;
  }

  return getPortSideForNodePresentation(orientation, direction, position?.portLayoutPreset);
}

export function isVerticalPortSide(side: PortSide) {
  return side === 'top' || side === 'bottom';
}
