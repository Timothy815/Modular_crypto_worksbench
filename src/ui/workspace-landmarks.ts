import type { ModuleRegistry, Project } from '../engine/types';
import { getModuleCategory } from './module-categories';
import { getModuleLibrarySectionId } from './module-library';

export const LARGE_WORKSPACE_MODULE_THRESHOLD = 18;

export interface WorkspaceLandmark {
  moduleId: string;
  defId: string;
  label: string;
}

export interface WorkspaceLandmarkGroups {
  context: WorkspaceLandmark[];
  sources: WorkspaceLandmark[];
  outputs: WorkspaceLandmark[];
}

export function isLargeWorkspace(project: Project): boolean {
  return project.modules.length >= LARGE_WORKSPACE_MODULE_THRESHOLD;
}

export function deriveWorkspaceLandmarks(
  project: Project,
  registry: ModuleRegistry,
  layout: Record<string, { x: number; y: number }>,
): WorkspaceLandmarkGroups {
  const context: WorkspaceLandmark[] = [];
  const sources: WorkspaceLandmark[] = [];
  const outputs: WorkspaceLandmark[] = [];

  const sortedModules = [...project.modules].sort((left, right) => {
    const leftPosition = layout[left.id] ?? { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };
    const rightPosition = layout[right.id] ?? { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };

    if (leftPosition.x !== rightPosition.x) {
      return leftPosition.x - rightPosition.x;
    }

    if (leftPosition.y !== rightPosition.y) {
      return leftPosition.y - rightPosition.y;
    }

    return left.id.localeCompare(right.id);
  });

  for (const moduleInstance of sortedModules) {
    const definition = registry[moduleInstance.defId];
    if (!definition) {
      continue;
    }

    const landmark: WorkspaceLandmark = {
      moduleId: moduleInstance.id,
      defId: moduleInstance.defId,
      label: moduleInstance.id,
    };

    const category = getModuleCategory(definition);
    if (category === 'sink') {
      outputs.push(landmark);
      continue;
    }

    if (category !== 'source') {
      continue;
    }

    if (getModuleLibrarySectionId(definition) === 'protocol-context') {
      context.push(landmark);
      continue;
    }

    sources.push(landmark);
  }

  return { context, sources, outputs };
}
