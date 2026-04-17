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
  usesClockAsInput,
} from './types';
import { validateProject } from './validation';
import {
  isClockedIteratorDefinition,
  isConditionalDefinition,
  isCompositeDefinition,
  isIteratorDefinition,
  isMultiConditionalDefinition,
  type ClockedIteratorDef,
  type CompositeDef,
  type ConditionalDef,
  type IteratorDef,
  type MultiConditionalDef,
} from './composites';
import { evaluateBypass, isBypassEligibleDefinition } from './bypass';

const CLOCK_PORT = 'clock';
const CLOCKED_ITERATOR_STEP_KEY = '__clockedIteratorCurrentStep';
const CLOCKED_ITERATOR_HALTED_KEY = '__clockedIteratorHalted';
const CLOCKED_ITERATOR_ACCUMULATED_KEY = '__clockedIteratorAccumulated';
const ROTOR_LINK_PARAM = 'linkedRotorId';
const ROTOR_SHARED_PARAM_KEYS = ['wiring', 'position', 'ringOffset', 'notches'] as const;

interface EvaluatedDefinitionResult {
  outputs: ModuleOutputs;
  hoistedTrace: ExecutionTraceEntry[];
}

interface ClockedIteratorRuntimeSnapshot {
  currentStep: number;
  halted: boolean;
  accumulated: ModuleInputs['in'];
}

interface TickedRuntimeState {
  paramsByModuleId: Record<string, ModuleParams>;
  compositeStateByModuleId: Record<string, TickedRuntimeState | undefined>;
  iteratorStateByModuleId: Record<string, TickedRuntimeState | undefined>;
  clockedIteratorStateByModuleId: Record<string, ModuleParams | undefined>;
  conditionalStateByModuleId: Record<
    string,
    { thenState: TickedRuntimeState; elseState: TickedRuntimeState } | undefined
  >;
  multiConditionalStateByModuleId: Record<string, TickedRuntimeState[] | undefined>;
}

const CONDITIONAL_SELECT_PORT = 'select';
const CONDITIONAL_THEN_BRANCH = 'then';
const CONDITIONAL_ELSE_BRANCH = 'else';

function getLinkedRotorId(params: ModuleParams): string | null {
  const linkedRotorId = params[ROTOR_LINK_PARAM];
  if (typeof linkedRotorId !== 'string') {
    return null;
  }

  const trimmed = linkedRotorId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveLinkedRotorParams(
  def: ModuleDefinition | undefined,
  params: ModuleParams,
  resolveParamsByModuleId: (moduleId: string) => ModuleParams | undefined,
): ModuleParams {
  if (!def || def.id !== 'RotorReverse') {
    return { ...params };
  }

  const linkedRotorId = getLinkedRotorId(params);
  if (!linkedRotorId) {
    return { ...params };
  }

  const linkedParams = resolveParamsByModuleId(linkedRotorId);
  if (!linkedParams) {
    return { ...params };
  }

  const nextParams: ModuleParams = { ...params };
  for (const key of ROTOR_SHARED_PARAM_KEYS) {
    const value = linkedParams[key];
    nextParams[key] = Array.isArray(value) ? [...value] : value;
  }

  return nextParams;
}

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectValidationError';
  }
}

function buildTopologicalOrder(project: Project, registry: ModuleRegistry): string[] {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const moduleInstance of project.modules) {
    adjacency.set(moduleInstance.id, []);
    indegree.set(moduleInstance.id, 0);
  }

  for (const connection of project.connections) {
    const targetInstance = project.modules.find((moduleInstance) => moduleInstance.id === connection.to.moduleId);
    const targetDef = targetInstance ? registry[targetInstance.defId] : null;
    if (
      connection.to.port === CLOCK_PORT &&
      targetDef &&
      isStatefulModule(targetDef) &&
      !usesClockAsInput(targetDef)
    ) {
      continue;
    }

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
  registry: ModuleRegistry,
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

    const targetInstance = project.modules.find((moduleInstance) => moduleInstance.id === connection.to.moduleId);
    const targetDef = targetInstance ? registry[targetInstance.defId] : null;
    if (
      connection.to.port === CLOCK_PORT &&
      targetDef &&
      isStatefulModule(targetDef) &&
      !usesClockAsInput(targetDef)
    ) {
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

  const order = buildTopologicalOrder(project, registry);
  const outputsByModuleId: Record<string, ModuleOutputs> = {};
  const trace: ExecutionTraceEntry[] = [];
  const analysisTrace: ExecutionTraceEntry[] = [];
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

    const inputs = collectInputs(moduleId, project, registry, outputsByModuleId, inputOverrides);
    const effectiveParams = resolveLinkedRotorParams(
      def,
      moduleInstance.params,
      (linkedModuleId) => instancesById.get(linkedModuleId)?.params,
    );
    const traceEntry: ExecutionTraceEntry = {
      moduleId,
      defId: def.id,
      inputs,
      outputs: {},
      scopeModuleId: moduleId,
      depth: 0,
    };
    const { outputs, hoistedTrace } = evaluateDefinition(
      moduleId,
      def,
      inputs,
      effectiveParams,
      registry,
      Boolean(moduleInstance.bypass),
    );
    traceEntry.outputs = outputs;

    outputsByModuleId[moduleId] = outputs;
    trace.push(traceEntry);
    analysisTrace.push(traceEntry, ...hoistedTrace);
  }

  return {
    order,
    outputsByModuleId,
    trace,
    analysisTrace,
  };
}

function evaluateDefinition(
  moduleId: string,
  def: ModuleDefinition,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
  bypass = false,
): EvaluatedDefinitionResult {
  if (bypass && isBypassEligibleDefinition(def)) {
    return {
      outputs: evaluateBypass(def, inputs),
      hoistedTrace: [],
    };
  }

  if (isCompositeDefinition(def)) {
    return evaluateComposite(moduleId, def, inputs, params, registry);
  }
  if (isIteratorDefinition(def)) {
    return evaluateIterator(moduleId, def, inputs, params, registry);
  }
  if (isClockedIteratorDefinition(def)) {
    return evaluateClockedIterator(moduleId, def, inputs, params, registry);
  }
  if (isConditionalDefinition(def)) {
    return evaluateConditional(moduleId, def, inputs, params, registry);
  }
  if (isMultiConditionalDefinition(def)) {
    return evaluateMultiConditional(moduleId, def, inputs, params, registry);
  }

  return {
    outputs: def.evaluate(inputs, params),
    hoistedTrace: [],
  };
}

function hoistTraceEntries(
  trace: ExecutionTraceEntry[],
  parentModuleId: string,
): ExecutionTraceEntry[] {
  return trace.map((entry) => ({
    ...entry,
    moduleId: `${parentModuleId}/${entry.moduleId}`,
    scopeModuleId: parentModuleId,
    depth: (entry.depth ?? 0) + 1,
  }));
}

function evaluateComposite(
  moduleId: string,
  def: CompositeDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
): EvaluatedDefinitionResult {
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

  const internalResult = executeProject(
    applyForwardedCompositeParams(def, params),
    registry,
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

  return {
    outputs,
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function applyForwardedCompositeParams(
  def: CompositeDef,
  params: ModuleParams,
): Project {
  if (!def.forwardedParams?.length) {
    return def.project;
  }

  const forwardedByModuleId = new Map<string, Record<string, unknown>>();
  for (const binding of def.forwardedParams) {
    const value = params[binding.externalParam];
    if (value === undefined) {
      continue;
    }

    forwardedByModuleId.set(binding.internalModuleId, {
      ...(forwardedByModuleId.get(binding.internalModuleId) ?? {}),
      [binding.internalParamKey]: value,
    });
  }

  if (forwardedByModuleId.size === 0) {
    return def.project;
  }

  return {
    modules: def.project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: forwardedByModuleId.has(moduleInstance.id)
        ? {
            ...moduleInstance.params,
            ...forwardedByModuleId.get(moduleInstance.id),
          }
        : moduleInstance.params,
    })),
    connections: def.project.connections,
  };
}

function getResolvedIterationCount(
  def: IteratorDef,
  params: ModuleParams,
): number {
  const override = params.iterationCount;
  if (typeof override === 'number' && Number.isInteger(override) && override > 0) {
    return override;
  }

  return def.iterationCount;
}

function buildIteratorProject(def: IteratorDef, params: ModuleParams = {}): Project {
  const iterationCount = getResolvedIterationCount(def, params);
  const roundParams = Object.fromEntries(
    Object.entries(def.paramSchema)
      .filter(([key]) => key !== 'iterationCount')
      .map(([key, field]) => [key, params[key] ?? field.defaultValue]),
  );
  const modules = Array.from({ length: iterationCount }, (_, index) => ({
    id: `round-${index + 1}`,
    defId: def.roundDefId,
    params: roundParams,
  }));
  const connections = Array.from({ length: Math.max(0, modules.length - 1) }, (_, index) => ({
    from: { moduleId: modules[index].id, port: 'out' },
    to: { moduleId: modules[index + 1].id, port: 'in' },
  }));

  return {
    modules,
    connections,
  };
}

function buildIteratorInputOverrides(
  def: IteratorDef,
  params: ModuleParams,
  iteratorProject: Project,
  inputs: ModuleInputs,
): Record<string, ModuleInputs> {
  const firstRoundId = iteratorProject.modules[0]?.id;
  if (!firstRoundId) {
    throw new ProjectValidationError(`Iterator "${def.id}" has no rounds to execute.`);
  }

  const inputOverrides: Record<string, ModuleInputs> = {
    [firstRoundId]: { in: inputs.in },
  };

  if (def.roundKeyWidth === undefined) {
    return inputOverrides;
  }

  const keySignal = inputs.key;
  if (!keySignal || keySignal.type !== 'bits') {
    throw new ProjectValidationError(`Iterator "${def.id}" requires a bits key bus on input "key".`);
  }

  const resolvedIterationCount = getResolvedIterationCount(def, params);
  const expectedBits = resolvedIterationCount * def.roundKeyWidth;
  if (keySignal.value.length !== expectedBits) {
    throw new ProjectValidationError(
      `Iterator "${def.id}" requires a key bus of exactly ${expectedBits} bits (${resolvedIterationCount} x ${def.roundKeyWidth}).`,
    );
  }

  for (let index = 0; index < iteratorProject.modules.length; index += 1) {
    const moduleId = iteratorProject.modules[index]?.id;
    if (!moduleId) {
      continue;
    }
    const start = index * def.roundKeyWidth;
    const end = start + def.roundKeyWidth;
    inputOverrides[moduleId] = {
      ...(inputOverrides[moduleId] ?? {}),
      key: { type: 'bits', value: keySignal.value.slice(start, end) },
    };
  }

  return inputOverrides;
}

function evaluateIterator(
  moduleId: string,
  def: IteratorDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
): EvaluatedDefinitionResult {
  const iteratorProject = buildIteratorProject(def, params);
  const firstRoundId = iteratorProject.modules[0]?.id;
  const lastRoundId = iteratorProject.modules.at(-1)?.id;

  if (!firstRoundId || !lastRoundId) {
    throw new ProjectValidationError(`Iterator "${def.id}" has no rounds to execute.`);
  }

  const internalResult = executeProject(
    iteratorProject,
    registry,
    buildIteratorInputOverrides(def, params, iteratorProject, inputs),
  );
  const signal = internalResult.outputsByModuleId[lastRoundId]?.out;
  if (!signal) {
    throw new ProjectValidationError(`Iterator "${def.id}" could not resolve its final round output.`);
  }

  return {
    outputs: { out: signal },
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function cloneSignal(signal: ModuleInputs['in']): ModuleInputs['in'] {
  return signal.type === 'bits'
    ? { type: 'bits', value: [...signal.value] }
    : { type: 'symbol', value: signal.value };
}

function createClockedIteratorRuntimeParams(seed: ModuleInputs['in']): ModuleParams {
  return {
    [CLOCKED_ITERATOR_STEP_KEY]: 0,
    [CLOCKED_ITERATOR_HALTED_KEY]: false,
    [CLOCKED_ITERATOR_ACCUMULATED_KEY]: cloneSignal(seed),
  };
}

function readClockedIteratorRuntimeParams(
  params: ModuleParams | undefined,
  seed: ModuleInputs['in'],
): ClockedIteratorRuntimeSnapshot {
  const currentStep = typeof params?.[CLOCKED_ITERATOR_STEP_KEY] === 'number'
    ? Math.max(0, Math.trunc(params[CLOCKED_ITERATOR_STEP_KEY] as number))
    : 0;
  const halted = params?.[CLOCKED_ITERATOR_HALTED_KEY] === true;
  const accumulatedParam = params?.[CLOCKED_ITERATOR_ACCUMULATED_KEY];
  const accumulated =
    accumulatedParam &&
    typeof accumulatedParam === 'object' &&
    'type' in accumulatedParam &&
    'value' in accumulatedParam
      ? cloneSignal(accumulatedParam as ModuleInputs['in'])
      : cloneSignal(seed);

  return { currentStep, halted, accumulated };
}

function evaluateClockedIteratorRound(
  _moduleId: string,
  def: ClockedIteratorDef,
  input: ModuleInputs['in'],
  registry: ModuleRegistry,
  roundParams: ModuleParams,
): EvaluatedDefinitionResult {
  const roundDef = registry[def.roundDefId];
  if (!roundDef) {
    throw new ProjectValidationError(
      `Clocked iterator "${def.id}" references unknown round definition "${def.roundDefId}".`,
    );
  }

  return evaluateDefinition(
    'round',
    roundDef,
    { in: input },
    roundParams,
    registry,
    false,
  );
}

function evaluateClockedIterator(
  _moduleId: string,
  def: ClockedIteratorDef,
  inputs: ModuleInputs,
  _params: ModuleParams,
  _registry: ModuleRegistry,
): EvaluatedDefinitionResult {
  const seed = inputs.in;
  if (!seed) {
    throw new ProjectValidationError(`Clocked iterator "${def.id}" is missing input "in".`);
  }

  return {
    outputs: { out: cloneSignal(seed) },
    hoistedTrace: [],
  };
}

function getConditionalBranchLabelAndDefId(
  def: ConditionalDef,
  inputs: ModuleInputs,
): { branchLabel: 'then' | 'else'; selectedDefId: string } {
  const select = inputs[CONDITIONAL_SELECT_PORT];
  if (!select || select.type !== 'bits' || select.value.length !== 1) {
    throw new ProjectValidationError('Conditional select must be exactly one bit.');
  }

  if (select.value[0] === 1) {
    return { branchLabel: CONDITIONAL_THEN_BRANCH, selectedDefId: def.thenDefId };
  }

  if (select.value[0] === 0) {
    return { branchLabel: CONDITIONAL_ELSE_BRANCH, selectedDefId: def.elseDefId };
  }

  throw new ProjectValidationError('Conditional select must be exactly one bit.');
}

function buildConditionalBranchProject(
  branchLabel: string,
  defId: string,
  params: ModuleParams,
): Project {
  return {
    modules: [{ id: branchLabel, defId, params }],
    connections: [],
  };
}

function stripConditionalSelectInput(inputs: ModuleInputs): ModuleInputs {
  const forwardedInputs: ModuleInputs = {};
  for (const [portName, signal] of Object.entries(inputs)) {
    if (portName === CONDITIONAL_SELECT_PORT) {
      continue;
    }

    forwardedInputs[portName] = signal;
  }

  return forwardedInputs;
}

function evaluateConditional(
  moduleId: string,
  def: ConditionalDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
): EvaluatedDefinitionResult {
  const { branchLabel, selectedDefId } = getConditionalBranchLabelAndDefId(def, inputs);
  const internalResult = executeProject(
    buildConditionalBranchProject(branchLabel, selectedDefId, params),
    registry,
    { [branchLabel]: stripConditionalSelectInput(inputs) },
  );
  const outputs = internalResult.outputsByModuleId[branchLabel];
  if (!outputs) {
    throw new ProjectValidationError(
      `Conditional "${def.id}" could not resolve ${branchLabel} branch outputs.`,
    );
  }

  return {
    outputs,
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function getMultiConditionalBranchIndex(
  def: MultiConditionalDef,
  inputs: ModuleInputs,
): number {
  const select = inputs[CONDITIONAL_SELECT_PORT];
  if (!select || select.type !== 'bits') {
    throw new ProjectValidationError('MultiConditional select must be a bits signal.');
  }
  const branchCount = def.branchDefIds.length;
  const requiredWidth = branchCount <= 2 ? 1 : branchCount <= 4 ? 2 : 3;
  if (select.value.length !== requiredWidth) {
    throw new ProjectValidationError(
      `MultiConditional select must be ${requiredWidth} bit(s) for ${branchCount} branches.`,
    );
  }
  const index = select.value.reduce((acc, bit, i) => acc + (bit << (select.value.length - 1 - i)), 0);
  return Math.min(index, branchCount - 1);
}

function evaluateMultiConditional(
  moduleId: string,
  def: MultiConditionalDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
): EvaluatedDefinitionResult {
  const branchIndex = getMultiConditionalBranchIndex(def, inputs);
  const selectedDefId = def.branchDefIds[branchIndex];
  if (!selectedDefId) {
    throw new ProjectValidationError(`MultiConditional "${def.id}" has no branch at index ${branchIndex}.`);
  }
  const branchLabel = `branch${branchIndex}`;
  const internalResult = executeProject(
    buildConditionalBranchProject(branchLabel, selectedDefId, params),
    registry,
    { [branchLabel]: stripConditionalSelectInput(inputs) },
  );
  const outputs = internalResult.outputsByModuleId[branchLabel];
  if (!outputs) {
    throw new ProjectValidationError(
      `MultiConditional "${def.id}" could not resolve branch ${branchIndex} outputs.`,
    );
  }
  return {
    outputs,
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function createTickedRuntimeState(
  project: Project,
  registry: ModuleRegistry,
): TickedRuntimeState {
  const paramsByModuleId: Record<string, ModuleParams> = {};
  const compositeStateByModuleId: Record<string, TickedRuntimeState | undefined> = {};
  const iteratorStateByModuleId: Record<string, TickedRuntimeState | undefined> = {};
  const clockedIteratorStateByModuleId: Record<string, ModuleParams | undefined> = {};
  const conditionalStateByModuleId: Record<
    string,
    { thenState: TickedRuntimeState; elseState: TickedRuntimeState } | undefined
  > = {};
  const multiConditionalStateByModuleId: Record<string, TickedRuntimeState[] | undefined> = {};

  for (const moduleInstance of project.modules) {
    paramsByModuleId[moduleInstance.id] = { ...moduleInstance.params };
    const def = registry[moduleInstance.defId];
    compositeStateByModuleId[moduleInstance.id] =
      def && isCompositeDefinition(def)
        ? createTickedRuntimeState(
            applyForwardedCompositeParams(def, moduleInstance.params),
            registry,
          )
        : undefined;
    iteratorStateByModuleId[moduleInstance.id] =
      def && isIteratorDefinition(def)
        ? createTickedRuntimeState(buildIteratorProject(def, moduleInstance.params), registry)
        : undefined;
    clockedIteratorStateByModuleId[moduleInstance.id] = undefined;
    conditionalStateByModuleId[moduleInstance.id] =
      def && isConditionalDefinition(def)
        ? {
            thenState: createTickedRuntimeState(
              buildConditionalBranchProject(
                CONDITIONAL_THEN_BRANCH,
                def.thenDefId,
                moduleInstance.params,
              ),
              registry,
            ),
            elseState: createTickedRuntimeState(
              buildConditionalBranchProject(
                CONDITIONAL_ELSE_BRANCH,
                def.elseDefId,
                moduleInstance.params,
              ),
              registry,
            ),
          }
        : undefined;
    multiConditionalStateByModuleId[moduleInstance.id] =
      def && isMultiConditionalDefinition(def)
        ? def.branchDefIds.map((branchDefId, i) =>
            createTickedRuntimeState(
              buildConditionalBranchProject(`branch${i}`, branchDefId, moduleInstance.params),
              registry,
            ),
          )
        : undefined;
  }

  return {
    paramsByModuleId,
    compositeStateByModuleId,
    iteratorStateByModuleId,
    clockedIteratorStateByModuleId,
    conditionalStateByModuleId,
    multiConditionalStateByModuleId,
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
  const order = buildTopologicalOrder(project, registry);
  const outputsByModuleId: Record<string, ModuleOutputs> = {};
  const inputsByModuleId: Record<string, ModuleInputs> = {};
  const trace: ExecutionTraceEntry[] = [];
  const analysisTrace: ExecutionTraceEntry[] = [];
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

    const inputs = collectInputs(moduleId, project, registry, outputsByModuleId, inputOverrides);
    inputsByModuleId[moduleId] = inputs;
    const currentParams = runtimeState.paramsByModuleId[moduleId] ?? {};
    const effectiveParams = resolveLinkedRotorParams(
      def,
      currentParams,
      (linkedModuleId) => runtimeState.paramsByModuleId[linkedModuleId],
    );
    const traceEntry: ExecutionTraceEntry = {
      moduleId,
      defId: def.id,
      inputs,
      outputs: {},
      scopeModuleId: moduleId,
      depth: 0,
    };
    const { outputs, hoistedTrace } = isCompositeDefinition(def)
      ? executeTickedComposite(
          moduleId,
          def,
          inputs,
          currentParams,
          registry,
          tick,
          runtimeState.compositeStateByModuleId[moduleId],
        )
      : isIteratorDefinition(def)
        ? executeTickedIterator(
            moduleId,
            def,
            inputs,
            currentParams,
            registry,
            tick,
            runtimeState.iteratorStateByModuleId[moduleId],
        )
      : isClockedIteratorDefinition(def)
        ? executeTickedClockedIterator(
            moduleId,
            def,
            inputs,
            currentParams,
            registry,
            runtimeState.clockedIteratorStateByModuleId,
          )
      : isConditionalDefinition(def)
        ? executeTickedConditional(
            moduleId,
            def,
            inputs,
            currentParams,
            registry,
            tick,
            runtimeState.conditionalStateByModuleId[moduleId],
          )
      : isMultiConditionalDefinition(def)
        ? executeTickedMultiConditional(
            moduleId,
            def,
            inputs,
            currentParams,
            registry,
            tick,
            runtimeState.multiConditionalStateByModuleId[moduleId],
          )
      : {
          outputs:
            moduleInstance.bypass && isBypassEligibleDefinition(def)
              ? evaluateBypass(def, inputs)
              : def.evaluate(
                  inputs,
                  isTickSliceable(def) ? def.tickSlice(effectiveParams, tick) : effectiveParams,
                ),
          hoistedTrace: [],
        };
    traceEntry.outputs = outputs;

    outputsByModuleId[moduleId] = outputs;
    trace.push(traceEntry);
    analysisTrace.push(traceEntry, ...hoistedTrace);
  }

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (def && isStatefulModule(def)) {
      if (def.id === 'RotorReverse' && getLinkedRotorId(runtimeState.paramsByModuleId[moduleInstance.id] ?? {})) {
        continue;
      }
      const clockPulse = getClockPulse(
        moduleInstance.id,
        project,
        outputsByModuleId,
      );
      if (clockPulse === null || clockPulse === true) {
        runtimeState.paramsByModuleId[moduleInstance.id] = def.advance(
          runtimeState.paramsByModuleId[moduleInstance.id],
          tick,
          inputsByModuleId[moduleInstance.id],
        );
      }
    }
  }

  return {
    order,
    outputsByModuleId,
    trace,
    analysisTrace,
  };
}

function executeTickedComposite(
  moduleId: string,
  def: CompositeDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
  tick: number,
  runtimeState?: TickedRuntimeState,
): EvaluatedDefinitionResult {
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

  const internalProject = applyForwardedCompositeParams(def, params);
  const internalResult = executeTickedGraph(
    internalProject,
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

  return {
    outputs,
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function executeTickedConditional(
  moduleId: string,
  def: ConditionalDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
  tick: number,
  runtimeState?: { thenState: TickedRuntimeState; elseState: TickedRuntimeState },
): EvaluatedDefinitionResult {
  if (!runtimeState) {
    throw new ProjectValidationError(`Conditional "${def.id}" is missing ticked runtime state.`);
  }

  const { branchLabel, selectedDefId } = getConditionalBranchLabelAndDefId(def, inputs);
  const internalResult = executeTickedGraph(
    buildConditionalBranchProject(branchLabel, selectedDefId, params),
    registry,
    tick,
    branchLabel === CONDITIONAL_THEN_BRANCH ? runtimeState.thenState : runtimeState.elseState,
    { [branchLabel]: stripConditionalSelectInput(inputs) },
  );
  const outputs = internalResult.outputsByModuleId[branchLabel];
  if (!outputs) {
    throw new ProjectValidationError(
      `Conditional "${def.id}" could not resolve ${branchLabel} branch outputs.`,
    );
  }

  return {
    outputs,
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function executeTickedMultiConditional(
  moduleId: string,
  def: MultiConditionalDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
  tick: number,
  branchStates?: TickedRuntimeState[],
): EvaluatedDefinitionResult {
  if (!branchStates || branchStates.length !== def.branchDefIds.length) {
    throw new ProjectValidationError(`MultiConditional "${def.id}" is missing ticked runtime state.`);
  }
  const branchIndex = getMultiConditionalBranchIndex(def, inputs);
  const selectedDefId = def.branchDefIds[branchIndex];
  if (!selectedDefId) {
    throw new ProjectValidationError(`MultiConditional "${def.id}" has no branch at index ${branchIndex}.`);
  }
  const branchLabel = `branch${branchIndex}`;
  const internalResult = executeTickedGraph(
    buildConditionalBranchProject(branchLabel, selectedDefId, params),
    registry,
    tick,
    branchStates[branchIndex],
    { [branchLabel]: stripConditionalSelectInput(inputs) },
  );
  const outputs = internalResult.outputsByModuleId[branchLabel];
  if (!outputs) {
    throw new ProjectValidationError(
      `MultiConditional "${def.id}" could not resolve branch ${branchIndex} outputs.`,
    );
  }
  return {
    outputs,
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function executeTickedIterator(
  moduleId: string,
  def: IteratorDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
  tick: number,
  runtimeState?: TickedRuntimeState,
): EvaluatedDefinitionResult {
  if (!runtimeState) {
    throw new ProjectValidationError(`Iterator "${def.id}" is missing ticked runtime state.`);
  }

  const iteratorProject = buildIteratorProject(def, params);
  const firstRoundId = iteratorProject.modules[0]?.id;
  const lastRoundId = iteratorProject.modules.at(-1)?.id;
  if (!firstRoundId || !lastRoundId) {
    throw new ProjectValidationError(`Iterator "${def.id}" has no rounds to execute.`);
  }

  const internalResult = executeTickedGraph(
    iteratorProject,
    registry,
    tick,
    runtimeState,
    buildIteratorInputOverrides(def, params, iteratorProject, inputs),
  );
  const signal = internalResult.outputsByModuleId[lastRoundId]?.out;
  if (!signal) {
    throw new ProjectValidationError(`Iterator "${def.id}" could not resolve its final round output.`);
  }

  return {
    outputs: { out: signal },
    hoistedTrace: hoistTraceEntries(internalResult.analysisTrace, moduleId),
  };
}

function executeTickedClockedIterator(
  moduleId: string,
  def: ClockedIteratorDef,
  inputs: ModuleInputs,
  params: ModuleParams,
  registry: ModuleRegistry,
  runtimeParamsByModuleId: Record<string, ModuleParams | undefined>,
): EvaluatedDefinitionResult {
  const seed = inputs.in;
  if (!seed) {
    throw new ProjectValidationError(`Clocked iterator "${def.id}" is missing input "in".`);
  }

  const runtimeParams = readClockedIteratorRuntimeParams(runtimeParamsByModuleId[moduleId], seed);
  const outputs: ModuleOutputs = {
    out: cloneSignal(runtimeParams.accumulated),
  };

  const clockSignal = inputs.clock;
  const activePulse = Boolean(clockSignal && isActivePulse(clockSignal));

  if (!activePulse) {
    runtimeParamsByModuleId[moduleId] = {
      [CLOCKED_ITERATOR_STEP_KEY]: runtimeParams.currentStep,
      [CLOCKED_ITERATOR_HALTED_KEY]: runtimeParams.halted,
      [CLOCKED_ITERATOR_ACCUMULATED_KEY]: cloneSignal(runtimeParams.accumulated),
    };
    return { outputs, hoistedTrace: [] };
  }

  if (runtimeParams.currentStep >= def.roundCount) {
    runtimeParamsByModuleId[moduleId] =
      def.endPolicy === 'wrap'
        ? createClockedIteratorRuntimeParams(seed)
        : {
            [CLOCKED_ITERATOR_STEP_KEY]: runtimeParams.currentStep,
            [CLOCKED_ITERATOR_HALTED_KEY]: true,
            [CLOCKED_ITERATOR_ACCUMULATED_KEY]: cloneSignal(runtimeParams.accumulated),
          };
    return { outputs, hoistedTrace: [] };
  }

  const roundParams = Object.fromEntries(
    Object.entries(def.paramSchema).map(([key, field]) => [key, params[key] ?? field.defaultValue]),
  );
  const roundResult = evaluateClockedIteratorRound(moduleId, def, runtimeParams.accumulated, registry, roundParams);
  const nextStep = runtimeParams.currentStep + 1;
  runtimeParamsByModuleId[moduleId] = {
    [CLOCKED_ITERATOR_STEP_KEY]: nextStep,
    [CLOCKED_ITERATOR_HALTED_KEY]: def.endPolicy === 'halt' && nextStep >= def.roundCount,
    [CLOCKED_ITERATOR_ACCUMULATED_KEY]: cloneSignal(roundResult.outputs.out),
  };

  return {
    outputs,
    hoistedTrace: [],
  };
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
      const def = registry[moduleInstance.defId];
      const currentParams = runtimeState.paramsByModuleId[moduleInstance.id];
      const clockedIteratorParams = runtimeState.clockedIteratorStateByModuleId[moduleInstance.id];
      paramsByModuleByTick[moduleInstance.id].push({
        ...resolveLinkedRotorParams(
          def,
          currentParams,
          (linkedModuleId) => runtimeState.paramsByModuleId[linkedModuleId],
        ),
        ...(def && isClockedIteratorDefinition(def) ? { ...clockedIteratorParams } : {}),
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
