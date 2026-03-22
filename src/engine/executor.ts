import {
  type ExecutionResult,
  type ExecutionTraceEntry,
  type ModuleDefinition,
  type ModuleInputs,
  type ModuleOutputs,
  type ModuleParams,
  type ModuleRegistry,
  type Project,
  type TickedExecutionResult,
  isStatefulModule,
} from './types';
import { validateProject } from './validation';
import { isCompositeDefinition, type CompositeDef } from './composites';

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectValidationError';
  }
}

function buildTopologicalOrder(project: Project): string[] {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const moduleInstance of project.modules) {
    adjacency.set(moduleInstance.id, []);
    indegree.set(moduleInstance.id, 0);
  }

  for (const connection of project.connections) {
    adjacency.get(connection.from.moduleId)?.push(connection.to.moduleId);
    indegree.set(
      connection.to.moduleId,
      (indegree.get(connection.to.moduleId) ?? 0) + 1,
    );
  }

  const ready = project.modules
    .map((moduleInstance) => moduleInstance.id)
    .filter((moduleId) => (indegree.get(moduleId) ?? 0) === 0);
  const order: string[] = [];

  while (ready.length > 0) {
    const moduleId = ready.shift();
    if (!moduleId) {
      continue;
    }

    order.push(moduleId);

    for (const neighbor of adjacency.get(moduleId) ?? []) {
      const nextDegree = (indegree.get(neighbor) ?? 0) - 1;
      indegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        ready.push(neighbor);
      }
    }
  }

  if (order.length !== project.modules.length) {
    throw new ProjectValidationError('Cannot build execution order for a cyclic project graph.');
  }

  return order;
}

function collectInputs(
  moduleId: string,
  project: Project,
  outputsByModuleId: Record<string, ModuleOutputs>,
  inputOverrides?: Record<string, ModuleInputs>,
): ModuleInputs {
  const inputs: ModuleInputs = {
    ...(inputOverrides?.[moduleId] ?? {}),
  };

  for (const connection of project.connections) {
    if (connection.to.moduleId !== moduleId) {
      continue;
    }

    const upstreamOutputs = outputsByModuleId[connection.from.moduleId];
    const signal = upstreamOutputs?.[connection.from.port];

    if (!signal) {
      throw new ProjectValidationError(
        `Missing upstream signal for "${connection.from.moduleId}.${connection.from.port}" while evaluating "${moduleId}.${connection.to.port}".`,
      );
    }

    inputs[connection.to.port] = signal;
  }

  return inputs;
}

export function executeProject(
  project: Project,
  registry: ModuleRegistry,
  inputOverrides?: Record<string, ModuleInputs>,
): ExecutionResult {
  const validation = validateProject(project, registry);

  if (!validation.ok) {
    const message = validation.issues.map((issue) => issue.message).join('\n');
    throw new ProjectValidationError(message);
  }

  const order = buildTopologicalOrder(project);
  const outputsByModuleId: Record<string, ModuleOutputs> = {};
  const trace: ExecutionTraceEntry[] = [];
  const instancesById = new Map(project.modules.map((moduleInstance) => [moduleInstance.id, moduleInstance]));

  for (const moduleId of order) {
    const moduleInstance = instancesById.get(moduleId);
    if (!moduleInstance) {
      throw new ProjectValidationError(`Execution referenced unknown module instance "${moduleId}".`);
    }

    const def = registry[moduleInstance.defId];
    if (!def) {
      throw new ProjectValidationError(
        `Execution referenced unknown module definition "${moduleInstance.defId}".`,
      );
    }

    const inputs = collectInputs(moduleId, project, outputsByModuleId, inputOverrides);
    const outputs = evaluateDefinition(def, inputs, moduleInstance.params, registry);

    outputsByModuleId[moduleId] = outputs;
    trace.push({
      moduleId,
      defId: def.id,
      inputs,
      outputs,
    });
  }

  return {
    order,
    outputsByModuleId,
    trace,
  };
}

function evaluateDefinition(
  def: ModuleDefinition,
  inputs: ModuleInputs,
  params: Record<string, unknown>,
  registry: ModuleRegistry,
): ModuleOutputs {
  if (isCompositeDefinition(def)) {
    return evaluateComposite(def, inputs, registry);
  }

  return def.evaluate(inputs, params);
}

function evaluateComposite(
  def: CompositeDef,
  inputs: ModuleInputs,
  registry: ModuleRegistry,
): ModuleOutputs {
  const inputOverrides: Record<string, ModuleInputs> = {};

  for (const binding of def.inputBindings) {
    const signal = inputs[binding.externalPort];
    if (!signal) {
      throw new ProjectValidationError(
        `Composite "${def.id}" is missing external input "${binding.externalPort}".`,
      );
    }

    inputOverrides[binding.internalModuleId] = {
      ...(inputOverrides[binding.internalModuleId] ?? {}),
      [binding.internalPort]: signal,
    };
  }

  const internalResult = executeProject(def.project, registry, inputOverrides);
  const outputs: ModuleOutputs = {};

  for (const binding of def.outputBindings) {
    const moduleOutputs = internalResult.outputsByModuleId[binding.internalModuleId];
    const signal = moduleOutputs?.[binding.internalPort];

    if (!signal) {
      throw new ProjectValidationError(
        `Composite "${def.id}" could not resolve internal output "${binding.internalModuleId}.${binding.internalPort}".`,
      );
    }

    outputs[binding.externalPort] = signal;
  }

  return outputs;
}

export function executeTickedProject(
  project: Project,
  registry: ModuleRegistry,
  tickCount: number,
  inputOverridesByTick?: Record<string, ModuleInputs>[],
): TickedExecutionResult {
  const validation = validateProject(project, registry);
  if (!validation.ok) {
    const message = validation.issues.map((issue) => issue.message).join('\n');
    throw new ProjectValidationError(message);
  }

  const ticks: ExecutionResult[] = [];
  const paramsByModuleByTick: Record<string, ModuleParams[]> = {};

  // Initialize per-module param snapshots from instance params
  const currentParams: Record<string, ModuleParams> = {};
  for (const moduleInstance of project.modules) {
    currentParams[moduleInstance.id] = { ...moduleInstance.params };
    paramsByModuleByTick[moduleInstance.id] = [];
  }

  for (let tick = 0; tick < tickCount; tick++) {
    // Snapshot current params for tracing
    for (const moduleInstance of project.modules) {
      paramsByModuleByTick[moduleInstance.id].push({ ...currentParams[moduleInstance.id] });
    }

    // Build a project with current-tick params
    const tickProject: Project = {
      modules: project.modules.map((moduleInstance) => ({
        ...moduleInstance,
        params: { ...currentParams[moduleInstance.id] },
      })),
      connections: project.connections,
    };

    const tickOverrides = inputOverridesByTick?.[tick];
    const tickResult = executeProject(tickProject, registry, tickOverrides);
    ticks.push(tickResult);

    // Advance stateful modules for the next tick
    for (const moduleInstance of project.modules) {
      const def = registry[moduleInstance.defId];
      if (def && isStatefulModule(def)) {
        currentParams[moduleInstance.id] = def.advance(
          currentParams[moduleInstance.id],
          tick,
        );
      }
    }
  }

  return { ticks, paramsByModuleByTick };
}
