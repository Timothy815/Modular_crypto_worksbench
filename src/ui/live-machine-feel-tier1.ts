import type {
  ExecutionResult,
  ModuleRegistry,
  Project,
  ValidationIssue,
} from '../engine/types';

export type CanvasModuleErrorKind =
  | 'missing-input'
  | 'type-mismatch'
  | 'upstream-failure'
  | 'invalid-parameter';

export interface CanvasModuleErrorState {
  kind: CanvasModuleErrorKind;
  label: string;
  detail: string;
  portSummary?: string;
}

export interface PendingSnapAnchor {
  key: string;
  x: number;
  y: number;
}

export interface PendingSnapResolution {
  hoveredTargetKey: string | null;
  snapTargetKey: string | null;
  rejectedTargetKey: string | null;
}

interface ResolvePendingSnapTargetArgs {
  pointer: { x: number; y: number };
  currentSnapTargetKey: string | null;
  candidateAnchors: PendingSnapAnchor[];
  targetValidityByKey: Record<string, boolean>;
}

interface SignalChipPointerEventLike {
  preventDefault(): void;
  stopPropagation(): void;
  clientX: number;
  clientY: number;
}

const SNAP_RADIUS_PX = 20;
const SNAP_HYSTERESIS_RADIUS_PX = 24;

const PARAM_VALIDATION_CODES = new Set<ValidationIssue['code']>([
  'missing-required-param',
  'unknown-param',
  'invalid-param-type',
  'invalid-param-option',
  'invalid-wiring',
  'invalid-bypass',
]);

const TYPE_MISMATCH_CODES = new Set<ValidationIssue['code']>([
  'signal-type-mismatch',
  'signal-kind-mismatch',
  'signal-width-mismatch',
]);

function formatPortSummary(
  project: Project,
  registry: ModuleRegistry,
  issue: ValidationIssue,
): string | undefined {
  const connection = issue.connection;
  if (!connection) {
    return undefined;
  }

  const targetModuleInstance = project.modules.find(
    (moduleInstance) => moduleInstance.id === connection.to.moduleId,
  );
  const sourceModuleInstance = project.modules.find(
    (moduleInstance) => moduleInstance.id === connection.from.moduleId,
  );
  if (!targetModuleInstance || !sourceModuleInstance) {
    return undefined;
  }

  const targetDef = registry[targetModuleInstance.defId];
  const sourceDef = registry[sourceModuleInstance.defId];
  if (!targetDef || !sourceDef) {
    return undefined;
  }

  const targetPort = targetDef.inputs.find((port) => port.name === connection.to.port);
  const sourcePort = sourceDef.outputs.find((port) => port.name === connection.from.port);
  if (!targetPort || !sourcePort) {
    return undefined;
  }

  if (issue.code === 'signal-kind-mismatch') {
    const targetKind = targetPort.kind;
    const sourceKind = sourcePort.kind;
    if (!targetKind || !sourceKind) {
      return undefined;
    }

    return `Port "${connection.to.port}": expects ${targetKind} ${targetPort.type}, got ${sourceKind}`;
  }

  return `Port "${connection.to.port}": expects ${targetPort.type}, got ${sourcePort.type}`;
}

export function deriveCanvasModuleErrorStateById(
  project: Project,
  registry: ModuleRegistry,
  validationIssues: ValidationIssue[],
  execution: ExecutionResult | null,
): Record<string, CanvasModuleErrorState> {
  const incomingConnectionByInputKey = new Map(
    project.connections.map((connection) => [
      `${connection.to.moduleId}:${connection.to.port}`,
      connection,
    ]),
  );
  const validationIssuesByModuleId = new Map<string, ValidationIssue[]>();
  const mismatchIssueByTargetModuleId = new Map<string, ValidationIssue>();

  for (const issue of validationIssues) {
    if (issue.moduleId) {
      const issues = validationIssuesByModuleId.get(issue.moduleId) ?? [];
      issues.push(issue);
      validationIssuesByModuleId.set(issue.moduleId, issues);
    }

    if (issue.connection && TYPE_MISMATCH_CODES.has(issue.code)) {
      mismatchIssueByTargetModuleId.set(issue.connection.to.moduleId, issue);
    }
  }

  const nextStates: Record<string, CanvasModuleErrorState> = {};

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      continue;
    }

    const paramIssues = (validationIssuesByModuleId.get(moduleInstance.id) ?? []).filter((issue) =>
      PARAM_VALIDATION_CODES.has(issue.code),
    );
    if (paramIssues.length > 0) {
      nextStates[moduleInstance.id] = {
        kind: 'invalid-parameter',
        label: 'Invalid parameter',
        detail: paramIssues[0]?.message ?? 'One or more parameters are invalid.',
      };
      continue;
    }

    const mismatchIssue = mismatchIssueByTargetModuleId.get(moduleInstance.id);
    if (mismatchIssue) {
      nextStates[moduleInstance.id] = {
        kind: 'type-mismatch',
        label: 'Type mismatch',
        detail: mismatchIssue.message,
        portSummary: formatPortSummary(project, registry, mismatchIssue),
      };
      continue;
    }

    const missingInputs = def.inputs
      .filter((port) => !incomingConnectionByInputKey.has(`${moduleInstance.id}:${port.name}`))
      .map((port) => port.name);
    if (missingInputs.length > 0) {
      nextStates[moduleInstance.id] = {
        kind: 'missing-input',
        label: 'Missing input',
        detail:
          missingInputs.length === 1
            ? `Input ${missingInputs[0]} is not connected.`
            : `Inputs ${missingInputs.join(', ')} are not connected.`,
      };
    }
  }

  for (let index = 0; index < project.modules.length; index += 1) {
    let changed = false;

    for (const moduleInstance of project.modules) {
      if (nextStates[moduleInstance.id]) {
        continue;
      }

      const def = registry[moduleInstance.defId];
      if (!def || def.outputs.length === 0) {
        continue;
      }

      const executionOutputs = execution?.outputsByModuleId[moduleInstance.id] ?? null;
      const missingAnyOutput = executionOutputs
        ? def.outputs.some((port) => executionOutputs[port.name] == null)
        : true;
      if (!missingAnyOutput) {
        continue;
      }

      const brokenUpstreamModules = def.inputs
        .map((port) =>
          incomingConnectionByInputKey.get(`${moduleInstance.id}:${port.name}`)?.from.moduleId ?? null,
        )
        .filter((upstreamModuleId): upstreamModuleId is string => upstreamModuleId !== null)
        .filter((upstreamModuleId) => nextStates[upstreamModuleId] !== undefined);

      if (brokenUpstreamModules.length === 0 && execution === null) {
        continue;
      }

      nextStates[moduleInstance.id] = {
        kind: 'upstream-failure',
        label: 'Upstream failure',
        detail:
          brokenUpstreamModules.length > 0
            ? `Upstream failure from ${brokenUpstreamModules.join(', ')}.`
            : 'This module produced no output in the current run.',
      };
      changed = true;
    }

    if (!changed) {
      break;
    }
  }

  for (const moduleInstance of project.modules) {
    if (nextStates[moduleInstance.id]) {
      continue;
    }

    const def = registry[moduleInstance.defId];
    if (!def || def.outputs.length === 0 || execution === null) {
      continue;
    }

    const executionOutputs = execution.outputsByModuleId[moduleInstance.id] ?? null;
    const missingAnyOutput = !executionOutputs
      || def.outputs.some((port) => executionOutputs[port.name] == null);
    if (!missingAnyOutput) {
      continue;
    }

    nextStates[moduleInstance.id] = {
      kind: 'upstream-failure',
      label: 'Upstream failure',
      detail: 'This module produced no output in the current run.',
    };
  }

  return nextStates;
}

export function resolvePendingSnapTarget({
  pointer,
  currentSnapTargetKey,
  candidateAnchors,
  targetValidityByKey,
}: ResolvePendingSnapTargetArgs): PendingSnapResolution {
  const distances = candidateAnchors.map((anchor) => ({
    key: anchor.key,
    distance: Math.hypot(pointer.x - anchor.x, pointer.y - anchor.y),
  }));

  if (currentSnapTargetKey) {
    const currentDistance = distances.find((entry) => entry.key === currentSnapTargetKey);
    if (currentDistance && currentDistance.distance <= SNAP_HYSTERESIS_RADIUS_PX) {
      return {
        hoveredTargetKey: currentSnapTargetKey,
        snapTargetKey: currentSnapTargetKey,
        rejectedTargetKey: null,
      };
    }
  }

  const compatibleWithinSnap = distances
    .filter((entry) => targetValidityByKey[entry.key] === true && entry.distance <= SNAP_RADIUS_PX)
    .sort((left, right) => left.distance - right.distance);

  if (compatibleWithinSnap.length === 1) {
    return {
      hoveredTargetKey: compatibleWithinSnap[0]?.key ?? null,
      snapTargetKey: compatibleWithinSnap[0]?.key ?? null,
      rejectedTargetKey: null,
    };
  }

  const incompatibleWithinSnap = distances
    .filter((entry) => targetValidityByKey[entry.key] === false && entry.distance <= SNAP_RADIUS_PX)
    .sort((left, right) => left.distance - right.distance);

  return {
    hoveredTargetKey: null,
    snapTargetKey: null,
    rejectedTargetKey: compatibleWithinSnap.length === 0 ? incompatibleWithinSnap[0]?.key ?? null : null,
  };
}

export function handleSignalChipPointerDown(
  event: SignalChipPointerEventLike,
  startConnectionFromOutput: (
    moduleId: string,
    portName: string,
    clientX: number,
    clientY: number,
  ) => void,
  moduleId: string,
  portName: string,
) {
  event.preventDefault();
  event.stopPropagation();
  startConnectionFromOutput(moduleId, portName, event.clientX, event.clientY);
}
