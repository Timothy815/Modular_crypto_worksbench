import type { ModuleDefinition, ModuleInstance, ModuleParams, ModuleRegistry, Project } from '../engine/types';

export function resolveTraceModuleInstance(
  traceModuleId: string,
  project: Project,
  registry: ModuleRegistry,
): { instance: ModuleInstance; definition: ModuleDefinition } | null {
  const parts = traceModuleId.split('/');
  let currentProject: Project = project;
  let currentInstance: ModuleInstance | null = null;
  let currentDefinition: ModuleDefinition | null = null;

  for (const part of parts) {
    currentInstance = currentProject.modules.find((module) => module.id === part) ?? null;
    if (!currentInstance) {
      return null;
    }

    currentDefinition = registry[currentInstance.defId] ?? null;
    if (!currentDefinition) {
      return null;
    }

    if ('kind' in currentDefinition && currentDefinition.kind === 'composite') {
      currentProject = currentDefinition.project;
      continue;
    }

    if ('kind' in currentDefinition && currentDefinition.kind === 'iterator') {
      currentProject = buildIteratorResolutionProject(currentDefinition, currentInstance.params);
      continue;
    }
  }

  if (!currentInstance || !currentDefinition) {
    return null;
  }

  return { instance: currentInstance, definition: currentDefinition };
}

function buildIteratorResolutionProject(
  iteratorDefinition: Extract<ModuleDefinition, { kind: 'iterator' }>,
  params: ModuleParams,
): Project {
  const iterationOverride = params.iterationCount;
  const iterationCount =
    typeof iterationOverride === 'number' &&
    Number.isInteger(iterationOverride) &&
    iterationOverride > 0
      ? iterationOverride
      : iteratorDefinition.iterationCount;

  return {
    modules: Array.from({ length: iterationCount }, (_, index) => ({
      id: `round-${index + 1}`,
      defId: iteratorDefinition.roundDefId,
      params: {},
    })),
    connections: Array.from({ length: Math.max(0, iterationCount - 1) }, (_, index) => ({
      from: { moduleId: `round-${index + 1}`, port: 'out' },
      to: { moduleId: `round-${index + 2}`, port: 'in' },
    })),
  };
}
