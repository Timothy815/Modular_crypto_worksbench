import type { CompositeDef } from '../engine/composites';
import type { ExecutionResult, ExecutionTraceEntry, ModuleParams, Project } from '../engine/types';
import { cloneProject } from './project-clone';

export interface CompositeInstanceDrilldownContext {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
  execution: ExecutionResult | null;
  forwardedParamValues: Array<{
    externalParam: string;
    internalModuleId: string;
    internalParamKey: string;
    value: unknown;
  }>;
}

function createTidiedCompositeLayout(
  project: Project,
  currentLayout: Record<string, { x: number; y: number }>,
): Record<string, { x: number; y: number }> {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  const layerByModuleId = new Map<string, number>();

  for (const moduleInstance of project.modules) {
    adjacency.set(moduleInstance.id, []);
    indegree.set(moduleInstance.id, 0);
  }

  for (const connection of project.connections) {
    adjacency.get(connection.from.moduleId)?.push(connection.to.moduleId);
    indegree.set(connection.to.moduleId, (indegree.get(connection.to.moduleId) ?? 0) + 1);
  }

  const positionSort = (leftId: string, rightId: string) => {
    const leftPosition = currentLayout[leftId] ?? { x: 0, y: 0 };
    const rightPosition = currentLayout[rightId] ?? { x: 0, y: 0 };
    if (leftPosition.x !== rightPosition.x) {
      return leftPosition.x - rightPosition.x;
    }
    if (leftPosition.y !== rightPosition.y) {
      return leftPosition.y - rightPosition.y;
    }
    return leftId.localeCompare(rightId);
  };

  const queue = project.modules
    .map((moduleInstance) => moduleInstance.id)
    .filter((moduleId) => (indegree.get(moduleId) ?? 0) === 0)
    .sort(positionSort);
  const processed = new Set<string>();

  while (queue.length > 0) {
    const moduleId = queue.shift();
    if (!moduleId || processed.has(moduleId)) {
      continue;
    }

    processed.add(moduleId);
    for (const targetModuleId of adjacency.get(moduleId) ?? []) {
      layerByModuleId.set(
        targetModuleId,
        Math.max(
          layerByModuleId.get(targetModuleId) ?? 0,
          (layerByModuleId.get(moduleId) ?? 0) + 1,
        ),
      );
      const nextIndegree = (indegree.get(targetModuleId) ?? 0) - 1;
      indegree.set(targetModuleId, nextIndegree);
      if (nextIndegree === 0) {
        queue.push(targetModuleId);
        queue.sort(positionSort);
      }
    }
  }

  const remainingModuleIds = project.modules
    .map((moduleInstance) => moduleInstance.id)
    .filter((moduleId) => !processed.has(moduleId))
    .sort(positionSort);

  for (const moduleId of remainingModuleIds) {
    const inboundLayers = project.connections
      .filter((connection) => connection.to.moduleId === moduleId)
      .map((connection) => (layerByModuleId.get(connection.from.moduleId) ?? 0) + 1);
    layerByModuleId.set(moduleId, inboundLayers.length > 0 ? Math.max(...inboundLayers) : 0);
  }

  const modulesByLayer = new Map<number, string[]>();
  for (const moduleInstance of project.modules) {
    const layer = layerByModuleId.get(moduleInstance.id) ?? 0;
    modulesByLayer.set(layer, [...(modulesByLayer.get(layer) ?? []), moduleInstance.id]);
  }

  const columnXStart = 48;
  const rowYStart = 72;
  const columnGap = 244;
  const rowGap = 148;

  return Object.fromEntries(
    [...modulesByLayer.entries()]
      .sort(([leftLayer], [rightLayer]) => leftLayer - rightLayer)
      .flatMap(([layer, moduleIds]) =>
        moduleIds
          .sort((leftId, rightId) => {
            const leftPosition = currentLayout[leftId] ?? { x: 0, y: 0 };
            const rightPosition = currentLayout[rightId] ?? { x: 0, y: 0 };
            if (leftPosition.y !== rightPosition.y) {
              return leftPosition.y - rightPosition.y;
            }
            if (leftPosition.x !== rightPosition.x) {
              return leftPosition.x - rightPosition.x;
            }
            return leftId.localeCompare(rightId);
          })
          .map((moduleId, rowIndex) => [
            moduleId,
            {
              x: columnXStart + layer * columnGap,
              y: rowYStart + rowIndex * rowGap,
            },
          ]),
      ),
  );
}

function shouldRetidyCompositeLayout(
  project: Project,
  layout: Record<string, { x: number; y: number }>,
): boolean {
  if (project.modules.length === 0) {
    return false;
  }

  if (Object.keys(layout).length < project.modules.length) {
    return true;
  }

  const seenPositions = new Set<string>();
  for (const moduleInstance of project.modules) {
    const position = layout[moduleInstance.id];
    if (!position) {
      return true;
    }

    const key = `${position.x}:${position.y}`;
    if (seenPositions.has(key)) {
      return true;
    }
    seenPositions.add(key);
  }

  return false;
}

export function resolveCompositeInstanceProject(
  definition: CompositeDef,
  instanceParams: ModuleParams,
): Project {
  const project = cloneProject(definition.project);
  if (!definition.forwardedParams?.length) {
    return project;
  }

  const forwardedByModuleId = new Map<string, Record<string, unknown>>();
  for (const binding of definition.forwardedParams) {
    const value = instanceParams[binding.externalParam];
    if (value === undefined) {
      continue;
    }

    forwardedByModuleId.set(binding.internalModuleId, {
      ...(forwardedByModuleId.get(binding.internalModuleId) ?? {}),
      [binding.internalParamKey]: value,
    });
  }

  if (forwardedByModuleId.size === 0) {
    return project;
  }

  return {
    ...project,
    modules: project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: forwardedByModuleId.has(moduleInstance.id)
        ? {
            ...moduleInstance.params,
            ...forwardedByModuleId.get(moduleInstance.id),
          }
        : moduleInstance.params,
    })),
  };
}

export function localizeCompositeInstanceTrace(
  analysisTrace: ExecutionTraceEntry[],
  instanceId: string,
): ExecutionTraceEntry[] {
  const prefix = `${instanceId}/`;

  return analysisTrace
    .filter((entry) => entry.moduleId.startsWith(prefix))
    .map((entry) => ({
      ...entry,
      moduleId: entry.moduleId.slice(prefix.length),
      depth: Math.max(0, (entry.depth ?? 1) - 1),
      scopeModuleId: undefined,
    }));
}

export function buildCompositeInstanceExecution(
  execution: ExecutionResult | null,
  instanceId: string,
): ExecutionResult | null {
  if (!execution) {
    return null;
  }

  const localizedAnalysisTrace = localizeCompositeInstanceTrace(execution.analysisTrace, instanceId);
  if (localizedAnalysisTrace.length === 0) {
    return {
      order: [],
      outputsByModuleId: {},
      trace: [],
      analysisTrace: [],
    };
  }

  const localizedTrace = localizedAnalysisTrace.filter(
    (entry) => (entry.depth ?? 0) === 0 && !entry.moduleId.includes('/'),
  );

  return {
    order: localizedTrace.map((entry) => entry.moduleId),
    outputsByModuleId: Object.fromEntries(
      localizedTrace.map((entry) => [entry.moduleId, entry.outputs]),
    ),
    trace: localizedTrace,
    analysisTrace: localizedAnalysisTrace,
  };
}

export function buildCompositeInstanceDrilldownContext(
  definition: CompositeDef,
  instanceParams: ModuleParams,
  execution: ExecutionResult | null,
  instanceId: string,
): CompositeInstanceDrilldownContext {
  const project = resolveCompositeInstanceProject(definition, instanceParams);
  const baseLayout = definition.layout ?? {};

  return {
    project,
    layout: shouldRetidyCompositeLayout(project, baseLayout)
      ? createTidiedCompositeLayout(project, baseLayout)
      : baseLayout,
    execution: buildCompositeInstanceExecution(execution, instanceId),
    forwardedParamValues: (definition.forwardedParams ?? [])
      .map((binding) => ({
        externalParam: binding.externalParam,
        internalModuleId: binding.internalModuleId,
        internalParamKey: binding.internalParamKey,
        value: instanceParams[binding.externalParam],
      }))
      .filter((binding) => binding.value !== undefined),
  };
}
