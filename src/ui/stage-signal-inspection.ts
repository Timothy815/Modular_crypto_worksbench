import { isOutputSinkDefId } from '../engine/output-sinks';
import type {
  ExecutionResult,
  ModuleDefinition,
  ModuleInstance,
  ModuleRegistry,
  Project,
  Signal,
} from '../engine/types';
import {
  formatBitsAs,
  getRepresentationAvailability,
  getUnavailableReason,
} from './sink-representations';

export interface StageSignalDisplay {
  representation: 'text' | 'bits' | 'bytes' | 'hex' | 'ascii';
  value: string;
  available: boolean;
  reason: string | null;
}

export interface StageSignalParent {
  moduleId: string;
  defId: string;
  defName: string;
  port: string;
  signal: Signal | null;
  display: StageSignalDisplay | null;
  isBypassed: boolean;
}

export interface StageSignalComparison {
  moduleId: string;
  defId: string;
  defName: string;
  port: string;
  status: 'changed' | 'unchanged';
  currentDisplay: StageSignalDisplay | null;
  previousDisplay: StageSignalDisplay | null;
}

export interface StageSignalInspection {
  signal: Signal | null;
  display: StageSignalDisplay | null;
  signalType: 'symbol' | 'bits' | null;
  signalLength: number | null;
  roleDetail: string;
  traceState: 'ready' | 'no-execution' | 'execution-error' | 'no-signal';
  traceMessage: string | null;
  parents: StageSignalParent[];
  comparison: StageSignalComparison | null;
  selectedPortName: string | null;
  selectedPortDirection: 'input' | 'output' | null;
}

export function serializeStageSignalForClipboard(
  signal: Signal | null,
  preference: 'display' | 'bits' = 'display',
) {
  if (!signal) {
    return null;
  }

  if (signal.type === 'symbol') {
    return signal.value;
  }

  if (preference === 'bits') {
    return signal.value.join('');
  }

  return formatGenericSignal(signal)?.value ?? signal.value.join('');
}

function getSignalLength(signal: Signal | null) {
  if (!signal) {
    return null;
  }
  return signal.type === 'bits' ? signal.value.length : signal.value.length;
}

function formatGenericSignal(signal: Signal | null): StageSignalDisplay | null {
  if (!signal) {
    return null;
  }

  if (signal.type === 'symbol') {
    return {
      representation: 'text',
      value: signal.value,
      available: true,
      reason: null,
    };
  }

  const availability = getRepresentationAvailability(signal.value);
  if (availability.hex) {
    return {
      representation: 'hex',
      value: formatBitsAs(signal.value, 'hex'),
      available: true,
      reason: null,
    };
  }
  if (availability.bytes) {
    return {
      representation: 'bytes',
      value: formatBitsAs(signal.value, 'bytes'),
      available: true,
      reason: null,
    };
  }
  return {
    representation: 'bits',
    value: formatBitsAs(signal.value, 'bits'),
    available: true,
    reason: getUnavailableReason('hex', signal.value, availability),
  };
}

function areSignalsEqual(left: Signal | null, right: Signal | null) {
  if (!left || !right || left.type !== right.type) {
    return false;
  }
  if (left.type === 'symbol') {
    return left.value === right.value;
  }
  if (left.value.length !== right.value.length) {
    return false;
  }
  return left.value.every((bit, index) => bit === right.value[index]);
}

function getCurrentSignal(
  moduleInstance: ModuleInstance,
  moduleDef: ModuleDefinition,
  execution: ExecutionResult,
): { signal: Signal | null; portName: string | null; direction: 'input' | 'output' | null } {
  const traceEntry = execution.trace.find((entry) => entry.moduleId === moduleInstance.id) ?? null;
  if (!traceEntry) {
    return { signal: null, portName: null, direction: null };
  }

  if (isOutputSinkDefId(moduleDef.id)) {
    const inputPort = moduleDef.inputs[0]?.name ?? 'in';
    return {
      signal: execution.outputsByModuleId[moduleInstance.id]?.out ?? traceEntry.inputs[inputPort] ?? null,
      portName: inputPort,
      direction: 'input',
    };
  }

  const outPort = moduleDef.outputs.find((port) => port.name === 'out') ?? moduleDef.outputs[0] ?? null;
  if (outPort) {
    return {
      signal: execution.outputsByModuleId[moduleInstance.id]?.[outPort.name] ?? traceEntry.outputs[outPort.name] ?? null,
      portName: outPort.name,
      direction: 'output',
    };
  }

  const inputPort = moduleDef.inputs[0]?.name ?? null;
  return {
    signal: inputPort ? traceEntry.inputs[inputPort] ?? null : null,
    portName: inputPort,
    direction: inputPort ? 'input' : null,
  };
}

export function buildStageSignalInspection(args: {
  execution: ExecutionResult | null;
  executionError: string | null;
  project: Project;
  registry: ModuleRegistry;
  moduleInstance: ModuleInstance | null;
  moduleDef: ModuleDefinition | null;
  roleDetail: string | null;
}) {
  const { execution, executionError, project, registry, moduleInstance, moduleDef, roleDetail } = args;

  if (!moduleInstance || !moduleDef) {
    return null;
  }

  if (!execution) {
    return {
      signal: null,
      display: null,
      signalType: null,
      signalLength: null,
      roleDetail: roleDetail ?? 'Selected stage',
      traceState: executionError ? 'execution-error' : 'no-execution',
      traceMessage: executionError
        ? 'This stage cannot be inspected yet because the current run failed validation or execution.'
        : 'Run the machine to inspect the current signal at this stage.',
      parents: [],
      comparison: null,
      selectedPortName: null,
      selectedPortDirection: null,
    } satisfies StageSignalInspection;
  }

  const current = getCurrentSignal(moduleInstance, moduleDef, execution);
  const directParents = project.connections.filter((connection) => connection.to.moduleId === moduleInstance.id);
  const parents = directParents.map((connection) => {
    const parentInstance = project.modules.find((candidate) => candidate.id === connection.from.moduleId) ?? null;
    const parentDef = parentInstance ? registry[parentInstance.defId] : null;
    const signal =
      execution.outputsByModuleId[connection.from.moduleId]?.[connection.from.port] ??
      execution.trace.find((entry) => entry.moduleId === connection.from.moduleId)?.outputs[connection.from.port] ??
      null;
    return {
      moduleId: connection.from.moduleId,
      defId: parentDef?.id ?? parentInstance?.defId ?? 'unknown',
      port: connection.from.port,
      signal,
      defName: parentDef?.name ?? parentInstance?.defId ?? 'Unknown Module',
      display: formatGenericSignal(signal),
      isBypassed: Boolean(parentInstance?.bypass),
    } satisfies StageSignalParent;
  });

  const comparison =
    parents.length === 1 &&
    current.signal &&
    parents[0]?.signal &&
    current.signal.type === parents[0].signal.type &&
    getSignalLength(current.signal) === getSignalLength(parents[0].signal)
      ? {
          moduleId: parents[0].moduleId,
          defId: parents[0].defId,
          defName: parents[0].defName,
          port: parents[0].port,
          status: areSignalsEqual(current.signal, parents[0].signal) ? 'unchanged' : 'changed',
          currentDisplay: formatGenericSignal(current.signal),
          previousDisplay: formatGenericSignal(parents[0].signal),
        } satisfies StageSignalComparison
      : null;

  return {
    signal: current.signal,
    display: formatGenericSignal(current.signal),
    signalType: current.signal?.type ?? null,
    signalLength: getSignalLength(current.signal),
    roleDetail: roleDetail ?? 'Selected stage',
    traceState: current.signal ? 'ready' : 'no-signal',
    traceMessage: current.signal ? null : 'This stage has no current signal to inspect in the active run.',
    parents,
    comparison,
    selectedPortName: current.portName,
    selectedPortDirection: current.direction,
  } satisfies StageSignalInspection;
}
