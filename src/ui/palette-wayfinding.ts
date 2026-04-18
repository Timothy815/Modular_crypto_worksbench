import type { ModuleDefinition, PortKind, SignalType } from '../engine/types';
import { getModuleChainsAfter, getModuleRole, type ModuleWorkflowRole } from './module-role-language';

export interface PaletteHoveredInputPortHint {
  moduleId: string;
  defId?: string;
  port: string;
  type: SignalType;
  kind: PortKind;
}

export interface PaletteWayfindingContext {
  pendingConnectionSourceType?: string | null;
  hoveredInputPort?: PaletteHoveredInputPortHint | null;
}

function getRoleBias(role: ModuleWorkflowRole) {
  switch (role) {
    case 'Source':
      return 180;
    case 'Bridge':
      return 120;
    case 'Operator':
      return 50;
    case 'Collector':
    case 'Sink':
      return -40;
    case 'Mismatch Helper':
      return 20;
    default:
      return 0;
  }
}

export function getPaletteContextRank(
  definition: ModuleDefinition,
  context: PaletteWayfindingContext,
) {
  let score = 0;

  if (
    context.pendingConnectionSourceType &&
    definition.inputs.some((port) => port.type === context.pendingConnectionSourceType)
  ) {
    score += 800;
  }

  if (
    context.hoveredInputPort &&
    definition.outputs.some(
      (port) =>
        port.type === context.hoveredInputPort!.type &&
        (port.kind ?? 'scalar') === context.hoveredInputPort!.kind,
    )
  ) {
    score += 700;
    score += getRoleBias(getModuleRole(definition));

    if (
      context.hoveredInputPort.defId &&
      getModuleChainsAfter(definition).includes(context.hoveredInputPort.defId)
    ) {
      score += 260;
    }
  }

  return score;
}
