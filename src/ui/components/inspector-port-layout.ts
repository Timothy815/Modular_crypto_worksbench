import { useMemo, useState } from 'react';

import { getBypassIneligibilityReason, isBypassEligibleDefinition } from '../../engine/bypass';
import type { ModuleDefinition } from '../../engine/types';
import { getNodeOrientation } from '../node-orientation';
import { getPortSideForModulePort } from '../node-orientation';
import { getOrderedPorts } from '../port-ordering';
import type {
  WorkbenchLayoutDirection,
  WorkbenchPortLayoutPreset,
  WorkbenchPortSide,
  WorkbenchPosition,
} from '../workbench-document';
import { PORT_SIDE_ORDER } from './inspector-controls';

export interface InspectorPortLayout {
  orderedInputPorts: ReturnType<typeof getOrderedPorts>;
  orderedOutputPorts: ReturnType<typeof getOrderedPorts>;
  activePortLayoutPreset: WorkbenchPortLayoutPreset | null;
  draggingPortSide: { direction: 'input' | 'output'; portName: string } | null;
  setDraggingPortSide: (
    value: { direction: 'input' | 'output'; portName: string } | null,
  ) => void;
  inputPortsBySide: Record<WorkbenchPortSide, ReturnType<typeof getOrderedPorts>>;
  outputPortsBySide: Record<WorkbenchPortSide, ReturnType<typeof getOrderedPorts>>;
  explicitInputPortSides: Record<string, WorkbenchPortSide>;
  explicitOutputPortSides: Record<string, WorkbenchPortSide>;
  canBypassSelectedModule: boolean;
  bypassIneligibilityReason: string | null;
}

/**
 * Computes port ordering, side assignments, drag state, and bypass eligibility
 * for the selected module in the Inspector.
 */
export function useInspectorPortLayout(
  moduleDef: ModuleDefinition | null,
  modulePosition: WorkbenchPosition | null | undefined,
  layoutDirection: WorkbenchLayoutDirection,
): InspectorPortLayout {
  const [draggingPortSide, setDraggingPortSide] = useState<{
    direction: 'input' | 'output';
    portName: string;
  } | null>(null);

  const orderedInputPorts = useMemo(
    () => (moduleDef ? getOrderedPorts(moduleDef.inputs, modulePosition?.inputOrder) : []),
    [moduleDef, modulePosition],
  );
  const orderedOutputPorts = useMemo(
    () => (moduleDef ? getOrderedPorts(moduleDef.outputs, modulePosition?.outputOrder) : []),
    [moduleDef, modulePosition],
  );

  const activePortLayoutPreset = modulePosition?.portLayoutPreset ?? null;
  const activeNodeOrientation = getNodeOrientation(modulePosition?.orientation, layoutDirection);

  const inputPortsBySide = useMemo(
    () =>
      Object.fromEntries(
        PORT_SIDE_ORDER.map((side) => [
          side,
          orderedInputPorts.filter(
            (port) =>
              getPortSideForModulePort(
                modulePosition ?? undefined,
                activeNodeOrientation,
                'in',
                port.name,
              ) === side,
          ),
        ]),
      ) as Record<WorkbenchPortSide, typeof orderedInputPorts>,
    [activeNodeOrientation, modulePosition, orderedInputPorts],
  );

  const outputPortsBySide = useMemo(
    () =>
      Object.fromEntries(
        PORT_SIDE_ORDER.map((side) => [
          side,
          orderedOutputPorts.filter(
            (port) =>
              getPortSideForModulePort(
                modulePosition ?? undefined,
                activeNodeOrientation,
                'out',
                port.name,
              ) === side,
          ),
        ]),
      ) as Record<WorkbenchPortSide, typeof orderedOutputPorts>,
    [activeNodeOrientation, modulePosition, orderedOutputPorts],
  );

  const explicitInputPortSides = modulePosition?.inputPortSides ?? {};
  const explicitOutputPortSides = modulePosition?.outputPortSides ?? {};

  const canBypassSelectedModule = moduleDef ? isBypassEligibleDefinition(moduleDef) : false;
  const bypassIneligibilityReason =
    moduleDef && !canBypassSelectedModule ? getBypassIneligibilityReason(moduleDef) : null;

  return {
    orderedInputPorts,
    orderedOutputPorts,
    activePortLayoutPreset,
    draggingPortSide,
    setDraggingPortSide,
    inputPortsBySide,
    outputPortsBySide,
    explicitInputPortSides,
    explicitOutputPortSides,
    canBypassSelectedModule,
    bypassIneligibilityReason,
  };
}
