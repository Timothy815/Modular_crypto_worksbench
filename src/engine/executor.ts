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
  isTickSliceable,
} from './types';
import { validateProject } from './validation';
import { isCompositeDefinition, type CompositeDef } from './composites';

interface TickedRuntimeState {
  paramsByModuleId: Record<string, ModuleParams>;
  compositeStateByModuleId: Record<string, TickedRuntimeState | undefined>;
}

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

function createTickedRuntimeState(
  project: Project,
  registry: ModuleRegistry,
): TickedRuntimeState {
  const paramsByModuleId: Record<string, ModuleParams> = {};
  const compositeStateByModuleId: Record<string, TickedRuntimeState | undefined> = {};

  for (const moduleInstance of project.modules) {
    paramsByModuleId[moduleInstance.id] = { ...moduleInstance.params };
    const def = registry[moduleInstance.defId];
    compositeStateByModuleId[moduleInstance.id] =
      def && isCompositeDefinition(def)
        ? createTickedRuntimeState(def.project, registry)
        : undefined;
  }

  return {
    paramsByModuleId,
    compositeStateByModuleId,
  };
}

/**
 * Derive tick count from tick-sliceable source modules. Returns the
 * minimum source length, or null if no sliceable sources exist.
 */
export function deriveTickCount(
  project: Project,
  registry: ModuleRegistry,
): number | null {
  let minLength: number | null = null;
  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (def && isTickSliceable(def)) {
      const length = def.tickLength(moduleInstance.params);
      if (minLength === null || length < minLength) {
        minLength = length;
      }
    }
  }
  return minLength;
}

/**
 * Reserved input port name for conditional advance.
 * When a stateful module has this port connected, the executor only
 * calls `advance` when the incoming signal is an active pulse.
 */
const CLOCK_PORT = 'clock';

/**
 * A pulse is active when the signal is exactly `[1]` — a single high
 * bit. Any other shape (`[0]`, `[]`, multi-bit, non-bits) is inactive.
 */
function isActivePulse(signal: { type: string; value: unknown }): boolean {
  if (signal.type !== 'bits') return false;
  const bits = signal.value as number[];
  return bits.length === 1 && bits[0] === 1;
}

/**
 * Check if a module's 'clock' input port is connected and, if so,
 * whether it received an active pulse [1] this tick.
 *
 * Returns:
 * - null: no clock input is connected (caller should use default advance)
 * - true: clock is connected and pulsed [1]
 * - false: clock is connected but did not pulse
 */
function getClockPulse(
  moduleId: string,
  project: Project,
  outputsByModuleId: Record<string, ModuleOutputs>,
): boolean | null {
  const clockConnection = project.connections.find(
    (c) => c.to.moduleId === moduleId && c.to.port === CLOCK_PORT,
  );
  if (!clockConnection) return null;

  const upstreamOutputs = outputsByModuleId[clockConnection.from.moduleId];
  const signal = upstreamOutputs?.[clockConnection.from.port];
  if (!signal) return false;

  return isActivePulse(signal);
}

function executeTickedGraph(
  project: Project,
  registry: ModuleRegistry,
  tick: number,
  runtimeState: TickedRuntimeState,
  inputOverrides?: Record<string, ModuleInputs>,
): ExecutionResult {
  const order = buildTopologicalOrder(project);
  const outputsByModuleId: Record<string, ModuleOutputs> = {};
  const trace: ExecutionTraceEntry[] = [];
  const instancesById = new Map(
    project.modules.map((moduleInstance) => [moduleInstance.id, moduleInstance]),
  );

  for (const moduleId of order) {
    const moduleInstance = instancesById.get(moduleId);
    if (!moduleInstance) {
      throw new ProjectValidationError(
        `Execution referenced unknown module instance "${moduleId}".`,
      );
    }

    const def = registry[moduleInstance.defId];
    if (!def) {
      throw new ProjectValidationError(
        `Execution referenced unknown module definition "${moduleInstance.defId}".`,
      );
    }

    const inputs = collectInputs(moduleId, project, outputsByModuleId, inputOverrides);
    const currentParams = runtimeState.paramsByModuleId[moduleId] ?? {};
    const outputs = isCompositeDefinition(def)
      ? executeTickedComposite(
          def,
          inputs,
          registry,
          tick,
          runtimeState.compositeStateByModuleId[moduleId],
        )
      : def.evaluate(
          inputs,
          isTickSliceable(def) ? def.tickSlice(currentParams, tick) : { ...currentParams },
        );

    outputsByModuleId[moduleId] = outputs;
    trace.push({
      moduleId,
      defId: def.id,
      inputs,
      outputs,
    });
  }

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (def && isStatefulModule(def)) {
      const clockPulse = getClockPulse(
        moduleInstance.id,
        project,
        outputsByModuleId,
      );
      if (clockPulse === null || clockPulse === true) {
        runtimeState.paramsByModuleId[moduleInstance.id] = def.advance(
          runtimeState.paramsByModuleId[moduleInstance.id],
          tick,
        );
      }
    }
  }

  return {
    order,
    outputsByModuleId,
    trace,
  };
}

function executeTickedComposite(
  def: CompositeDef,
  inputs: ModuleInputs,
  registry: ModuleRegistry,
  tick: number,
  runtimeState?: TickedRuntimeState,
): ModuleOutputs {
  if (!runtimeState) {
    throw new ProjectValidationError(
      `Composite "${def.id}" is missing ticked runtime state.`,
    );
  }

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

  const internalResult = executeTickedGraph(
    def.project,
    registry,
    tick,
    runtimeState,
    inputOverrides,
  );
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
  // Validate once — graph structure does not change between ticks
  const validation = validateProject(project, registry);
  if (!validation.ok) {
    const message = validation.issues.map((issue) => issue.message).join('\n');
    throw new ProjectValidationError(message);
  }

  const ticks: ExecutionResult[] = [];
  const paramsByModuleByTick: Record<string, ModuleParams[]> = {};
  const runtimeState = createTickedRuntimeState(project, registry);

  for (const moduleInstance of project.modules) {
    paramsByModuleByTick[moduleInstance.id] = [];
  }

  for (let tick = 0; tick < tickCount; tick++) {
    for (const moduleInstance of project.modules) {
      paramsByModuleByTick[moduleInstance.id].push({
        ...runtimeState.paramsByModuleId[moduleInstance.id],
      });
    }

    ticks.push(
      executeTickedGraph(
        project,
        registry,
        tick,
        runtimeState,
        inputOverridesByTick?.[tick],
      ),
    );
  }

  return { ticks, paramsByModuleByTick };
}
