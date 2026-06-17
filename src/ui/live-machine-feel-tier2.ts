import type { ModuleDefinition, Project, SignalType } from '../engine/types';
import type { CanvasModuleErrorState } from './live-machine-feel-tier1';
import type { WorkbenchConnectionLayout } from './workbench-document';

export interface FirstBrokenModuleArgs {
  project: Project;
  executionOrder: string[] | null;
  canvasModuleErrorStateById: Record<string, CanvasModuleErrorState>;
}

export interface SpliceEligiblePorts {
  inputPortName: string;
  outputPortName: string;
}

export interface SplitSpliceConnectionLayout {
  sourceLayout: WorkbenchConnectionLayout | null;
  targetLayout: WorkbenchConnectionLayout | null;
}

const CONTROL_PORT_NAMES = new Set(['clock', 'control', 'reset', 'select']);

function isControlPortName(portName: string) {
  return CONTROL_PORT_NAMES.has(portName.toLowerCase());
}

function compactConnectionLayout(
  layout: Partial<WorkbenchConnectionLayout>,
): WorkbenchConnectionLayout | null {
  const nextLayout: WorkbenchConnectionLayout = {};

  if (layout.orthogonalBend) {
    nextLayout.orthogonalBend = { ...layout.orthogonalBend };
  }
  if (layout.orthogonalAnchors && layout.orthogonalAnchors.length > 0) {
    nextLayout.orthogonalAnchors = layout.orthogonalAnchors.map((anchor) => ({ ...anchor }));
  }
  if (layout.orthogonalLanePreference) {
    nextLayout.orthogonalLanePreference = layout.orthogonalLanePreference;
  }
  if (layout.colorOverride) {
    nextLayout.colorOverride = layout.colorOverride;
  }

  return Object.keys(nextLayout).length > 0 ? nextLayout : null;
}

export function deriveFirstBrokenModuleId({
  project,
  executionOrder,
  canvasModuleErrorStateById,
}: FirstBrokenModuleArgs): string | null {
  const orderedModuleIds =
    executionOrder && executionOrder.length > 0
      ? executionOrder
      : project.modules.map((moduleInstance) => moduleInstance.id);

  for (const moduleId of orderedModuleIds) {
    if (canvasModuleErrorStateById[moduleId]) {
      return moduleId;
    }
  }

  return null;
}

export function getSpliceEligiblePorts(
  moduleDef: ModuleDefinition,
  wireType: SignalType,
): SpliceEligiblePorts | null {
  const dataInputs = moduleDef.inputs.filter((port) => !isControlPortName(port.name));
  const dataOutputs = moduleDef.outputs.filter((port) => !isControlPortName(port.name));

  const matchingInputs = dataInputs.filter((port) => port.type === wireType);
  const matchingOutputs = dataOutputs.filter((port) => port.type === wireType);
  if (matchingInputs.length < 1 || matchingOutputs.length !== 1) {
    return null;
  }

  const nonMatchingInputs = dataInputs.filter((port) => port.type !== wireType);
  if (nonMatchingInputs.length > 0) {
    return null;
  }

  return {
    inputPortName: matchingInputs[0].name,
    outputPortName: matchingOutputs[0].name,
  };
}

export function splitConnectionLayoutForSplice(
  currentLayout: WorkbenchConnectionLayout | null | undefined,
  anchorInsertIndex: number | null,
): SplitSpliceConnectionLayout {
  if (!currentLayout) {
    return {
      sourceLayout: null,
      targetLayout: null,
    };
  }

  const sharedLayout = {
    orthogonalLanePreference: currentLayout.orthogonalLanePreference,
    colorOverride: currentLayout.colorOverride,
  };

  if (currentLayout.orthogonalAnchors && currentLayout.orthogonalAnchors.length > 0) {
    const splitIndex = Math.max(
      0,
      Math.min(anchorInsertIndex ?? currentLayout.orthogonalAnchors.length, currentLayout.orthogonalAnchors.length),
    );
    return {
      sourceLayout: compactConnectionLayout({
        ...sharedLayout,
        orthogonalAnchors: currentLayout.orthogonalAnchors.slice(0, splitIndex),
      }),
      targetLayout: compactConnectionLayout({
        ...sharedLayout,
        orthogonalAnchors: currentLayout.orthogonalAnchors.slice(splitIndex),
      }),
    };
  }

  if (currentLayout.orthogonalBend) {
    return {
      sourceLayout: compactConnectionLayout({
        ...sharedLayout,
        orthogonalBend: currentLayout.orthogonalBend,
      }),
      targetLayout: compactConnectionLayout({
        ...sharedLayout,
        orthogonalBend: currentLayout.orthogonalBend,
      }),
    };
  }

  return {
    sourceLayout: compactConnectionLayout(sharedLayout),
    targetLayout: compactConnectionLayout(sharedLayout),
  };
}
