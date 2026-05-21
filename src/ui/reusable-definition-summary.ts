import {
  isClockedIteratorDefinition,
  isCompositeDefinition,
  isIteratorDefinition,
  type CompositeLibraryEntry,
} from '../engine/composites';
import type { ModuleDefinition, ModuleRegistry, PortDef } from '../engine/types';

export function formatReusablePortCounts(definition: ModuleDefinition) {
  return `${definition.inputs.length} in / ${definition.outputs.length} out`;
}

export function formatReusableInterfaceSummary(definition: ModuleDefinition) {
  return `Inputs: ${formatPorts(definition.inputs)} · Outputs: ${formatPorts(definition.outputs)}`;
}

export function getReusableOriginLabel(entry: Pick<CompositeLibraryEntry, 'source'>) {
  return entry.source === 'built-in' ? 'Built-in architecture' : 'Your reusable';
}

export function formatReusableStructuralSummary(
  definition: ModuleDefinition,
  registry: ModuleRegistry,
) {
  if (isCompositeDefinition(definition)) {
    const moduleCount = definition.project.modules.length;
    return `${moduleCount} internal module${moduleCount === 1 ? '' : 's'}`;
  }

  if (isIteratorDefinition(definition)) {
    const roundName = registry[definition.roundDefId]?.name ?? definition.roundDefId;
    return `${definition.iterationCount}-round body: ${roundName}`;
  }

  if (isClockedIteratorDefinition(definition)) {
    const roundName = registry[definition.roundDefId]?.name ?? definition.roundDefId;
    return `${definition.roundCount}-step ${definition.endPolicy} body: ${roundName}`;
  }

  return '';
}

function formatPorts(ports: PortDef[]) {
  if (ports.length === 0) {
    return 'none';
  }

  return ports.map((port) => `${port.name}:${port.type}`).join(', ');
}
