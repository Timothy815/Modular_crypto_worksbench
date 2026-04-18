import {
  deriveTickCount,
  executeProject,
  executeTickedProject,
  ProjectValidationError,
} from '../engine/executor';
import { isOutputSinkDefId } from '../engine/output-sinks';
import type {
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleRegistry,
  Project,
  TickedExecutionResult,
} from '../engine/types';
import { validateProject } from '../engine/validation';

interface SinkProjectSlice {
  sinkModuleId: string;
  project: Project;
}

export interface WorkspaceExecutionResolution {
  execution: ExecutionResult | null;
  executionError: string | null;
  tickedExecution: TickedExecutionResult | null;
  tickCount: number | null;
  primaryOutputModuleId: string | null;
}

function hasSinkExecution(execution: ExecutionResult | null, sinkModuleId: string) {
  if (!execution) {
    return false;
  }

  return (
    execution.trace.some((entry) => entry.moduleId === sinkModuleId) ||
    execution.outputsByModuleId[sinkModuleId] !== undefined
  );
}

function buildReverseConnections(project: Project): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();

  for (const module of project.modules) {
    reverse.set(module.id, new Set());
  }

  for (const connection of project.connections) {
    const parents = reverse.get(connection.to.moduleId);
    if (parents) {
      parents.add(connection.from.moduleId);
    }
  }

  return reverse;
}

function buildSinkProjectSlice(project: Project, sinkModuleId: string): Project {
  const reverse = buildReverseConnections(project);
  const reachableModuleIds = new Set<string>();
  const stack = [sinkModuleId];

  while (stack.length > 0) {
    const moduleId = stack.pop();
    if (!moduleId || reachableModuleIds.has(moduleId)) {
      continue;
    }

    reachableModuleIds.add(moduleId);
    for (const parentId of reverse.get(moduleId) ?? []) {
      stack.push(parentId);
    }
  }

  return {
    modules: project.modules.filter((module) => reachableModuleIds.has(module.id)),
    connections: project.connections.filter(
      (connection) =>
        reachableModuleIds.has(connection.from.moduleId) &&
        reachableModuleIds.has(connection.to.moduleId),
    ),
  };
}

function getSinkProjectSlices(project: Project): SinkProjectSlice[] {
  return project.modules
    .filter((module) => isOutputSinkDefId(module.defId))
    .map((module) => ({
      sinkModuleId: module.id,
      project: buildSinkProjectSlice(project, module.id),
    }));
}

function mergeTraceEntries(entries: ExecutionTraceEntry[]): ExecutionTraceEntry[] {
  const seen = new Set<string>();
  const merged: ExecutionTraceEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.moduleId}:${entry.depth ?? 0}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(entry);
  }

  return merged;
}

function mergeExecutionResults(results: ExecutionResult[]): ExecutionResult {
  const order = Array.from(
    new Set(results.flatMap((result) => result.order)),
  );
  const outputsByModuleId = Object.assign({}, ...results.map((result) => result.outputsByModuleId));

  return {
    order,
    outputsByModuleId,
    trace: mergeTraceEntries(results.flatMap((result) => result.trace)),
    analysisTrace: mergeTraceEntries(results.flatMap((result) => result.analysisTrace)),
  };
}

function mergeTickedExecutionResults(results: TickedExecutionResult[]): TickedExecutionResult {
  const tickLength = results[0]?.ticks.length ?? 0;
  const ticks = Array.from({ length: tickLength }, (_, tickIndex) =>
    mergeExecutionResults(results.map((result) => result.ticks[tickIndex]).filter(Boolean)),
  );
  const paramsByModuleByTick = Object.assign({}, ...results.map((result) => result.paramsByModuleByTick));

  return {
    ticks,
    paramsByModuleByTick,
  };
}

function getSinkSignal(execution: ExecutionResult, sinkModuleId: string) {
  const traceEntry = execution.trace.find((entry) => entry.moduleId === sinkModuleId);
  return execution.outputsByModuleId[sinkModuleId]?.out ?? traceEntry?.inputs.in ?? null;
}

function getPreferredOutputModuleId(
  project: Project,
  preferredModuleIds: string[],
  execution: ExecutionResult | null,
) {
  if (preferredModuleIds.length === 0) {
    return null;
  }

  const sinkSlices = getSinkProjectSlices(project);
  if (sinkSlices.length === 0) {
    return null;
  }

  for (const preferredModuleId of preferredModuleIds) {
    const directSink = sinkSlices.find((slice) => slice.sinkModuleId === preferredModuleId);
    if (directSink && hasSinkExecution(execution, directSink.sinkModuleId)) {
      return directSink.sinkModuleId;
    }

    const matchingSlices = sinkSlices.filter((slice) =>
      slice.project.modules.some((module) => module.id === preferredModuleId),
    );
    if (matchingSlices.length === 1 && hasSinkExecution(execution, matchingSlices[0].sinkModuleId)) {
      return matchingSlices[0].sinkModuleId;
    }
  }

  return null;
}

function getPrimaryOutputModuleId(
  project: Project,
  execution: ExecutionResult | null,
  preferredModuleIds: string[] = [],
): string | null {
  const sinkModules = project.modules.filter((module) => isOutputSinkDefId(module.defId));
  if (sinkModules.length === 0) {
    return null;
  }

  const preferredOutputModuleId = getPreferredOutputModuleId(project, preferredModuleIds, execution);
  if (preferredOutputModuleId) {
    return preferredOutputModuleId;
  }

  if (execution) {
    const signaledSink = sinkModules.find((module) => getSinkSignal(execution, module.id));
    if (signaledSink) {
      return signaledSink.id;
    }
  }

  return sinkModules[0]?.id ?? null;
}

function resolveFullProjectExecution(
  project: Project,
  registry: ModuleRegistry,
  isTickedMode: boolean,
  currentTick: number,
  preferredModuleIds: string[],
): WorkspaceExecutionResolution {
  const validation = validateProject(project, registry);
  if (!validation.ok) {
    return {
      execution: null,
      executionError: 'Execution is blocked until the graph is valid.',
      tickedExecution: null,
      tickCount: null,
      primaryOutputModuleId: null,
    };
  }

  try {
    if (isTickedMode) {
      const tickCount = deriveTickCount(project, registry);
      if (tickCount !== null && tickCount > 0) {
        const tickedExecution = executeTickedProject(project, registry, tickCount);
        return {
          execution: tickedExecution.ticks[Math.min(currentTick, tickCount - 1)] ?? null,
          executionError: null,
          tickedExecution,
          tickCount,
          primaryOutputModuleId: getPrimaryOutputModuleId(
            project,
            tickedExecution.ticks[Math.min(currentTick, tickCount - 1)] ?? null,
            preferredModuleIds,
          ),
        };
      }
    }

    const execution = executeProject(project, registry);
    return {
      execution,
      executionError: null,
      tickedExecution: null,
      tickCount: null,
      primaryOutputModuleId: getPrimaryOutputModuleId(project, execution, preferredModuleIds),
    };
  } catch (error) {
    return {
      execution: null,
      executionError: error instanceof Error ? error.message : 'Execution failed.',
      tickedExecution: null,
      tickCount: null,
      primaryOutputModuleId: null,
    };
  }
}

export function resolveWorkspaceExecution(
  project: Project,
  registry: ModuleRegistry,
  isTickedMode: boolean,
  currentTick: number,
  preferredModuleIds: string[] = [],
): WorkspaceExecutionResolution {
  const sinkSlices = getSinkProjectSlices(project);

  if (sinkSlices.length === 0) {
    return resolveFullProjectExecution(project, registry, isTickedMode, currentTick, preferredModuleIds);
  }

  const validSlices = sinkSlices.filter((slice) => validateProject(slice.project, registry).ok);
  if (validSlices.length === 0) {
    return resolveFullProjectExecution(project, registry, isTickedMode, currentTick, preferredModuleIds);
  }

  try {
    if (isTickedMode) {
      const tickCounts = validSlices
        .map((slice) => deriveTickCount(slice.project, registry))
        .filter((count): count is number => count !== null && count > 0);

      if (tickCounts.length > 0) {
        const tickCount = Math.min(...tickCounts);
        const tickedResults = validSlices.map((slice) =>
          executeTickedProject(slice.project, registry, tickCount),
        );
        const tickedExecution = mergeTickedExecutionResults(tickedResults);
        const execution = tickedExecution.ticks[Math.min(currentTick, tickCount - 1)] ?? null;

        return {
          execution,
          executionError: null,
          tickedExecution,
          tickCount,
          primaryOutputModuleId: getPrimaryOutputModuleId(project, execution, preferredModuleIds),
        };
      }
    }

    const execution = mergeExecutionResults(validSlices.map((slice) => executeProject(slice.project, registry)));
    return {
      execution,
      executionError: null,
      tickedExecution: null,
      tickCount: null,
      primaryOutputModuleId: getPrimaryOutputModuleId(project, execution, preferredModuleIds),
    };
  } catch (error) {
    if (error instanceof ProjectValidationError) {
      return resolveFullProjectExecution(project, registry, isTickedMode, currentTick, preferredModuleIds);
    }

    return {
      execution: null,
      executionError: error instanceof Error ? error.message : 'Execution failed.',
      tickedExecution: null,
      tickCount: null,
      primaryOutputModuleId: null,
    };
  }
}
