import {
  isCompositeDefinition,
  isIteratorDefinition,
} from '../engine/composites';
import type { ModuleDefinition } from '../engine/types';

export function isCompositePortHintEligible(definition: ModuleDefinition | undefined | null) {
  if (!definition) {
    return false;
  }

  return isCompositeDefinition(definition) || isIteratorDefinition(definition);
}

export function shouldShowCompositePortHint({
  definition,
  direction,
  pendingConnection,
  hoveredHintModuleId,
  hoveredPortHintKey,
  moduleId,
  portName,
}: {
  definition: ModuleDefinition | undefined | null;
  direction: 'in' | 'out';
  pendingConnection: boolean;
  hoveredHintModuleId: string | null;
  hoveredPortHintKey: string | null;
  moduleId: string;
  portName: string;
}) {
  if (!isCompositePortHintEligible(definition)) {
    return false;
  }

  const portHintKey = `${moduleId}:${direction}:${portName}`;
  if (hoveredPortHintKey === portHintKey) {
    return true;
  }

  if (pendingConnection && direction === 'in' && hoveredHintModuleId === moduleId) {
    return true;
  }

  return false;
}
