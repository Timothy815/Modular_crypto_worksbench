import {
  formatSignalKindMismatchMessage,
  formatSignalTypeMismatchMessage,
} from '../engine/connection-mismatch-message';
import { validateProject } from '../engine/validation';
import type { ModuleRegistry, Project } from '../engine/types';

export interface TargetPortState {
  valid: boolean;
  reason: string | null;
  mode: 'new' | 'replace' | 'blocked';
  replaceConnectionIndex: number | null;
}

export function findIncomingConnectionIndex(
  project: Project,
  moduleId: string,
  portName: string,
): number {
  return project.connections.findIndex(
    (connection) =>
      connection.to.moduleId === moduleId && connection.to.port === portName,
  );
}

export function getTargetPortState(
  project: Project,
  registry: ModuleRegistry,
  fromModuleId: string,
  fromPort: string,
  toModuleId: string,
  toPort: string,
  excludedConnectionIndex: number | null = null,
): TargetPortState {
  if (fromModuleId === toModuleId) {
    return {
      valid: false,
      reason: 'A module cannot connect directly to its own input.',
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  const sourceInstance = project.modules.find((moduleInstance) => moduleInstance.id === fromModuleId);
  const targetInstance = project.modules.find((moduleInstance) => moduleInstance.id === toModuleId);
  if (!sourceInstance || !targetInstance) {
    return {
      valid: false,
      reason: 'Connection references a missing module.',
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  const sourceDef = registry[sourceInstance.defId];
  const targetDef = registry[targetInstance.defId];
  if (!sourceDef || !targetDef) {
    return {
      valid: false,
      reason: 'Connection references a missing module definition.',
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  const sourcePortDef = sourceDef.outputs.find((port) => port.name === fromPort);
  const targetPortDef = targetDef.inputs.find((port) => port.name === toPort);
  if (!sourcePortDef || !targetPortDef) {
    return {
      valid: false,
      reason: 'Connection references an unknown port.',
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  if (sourcePortDef.type !== targetPortDef.type) {
    return {
      valid: false,
      reason: formatSignalTypeMismatchMessage(
        `${fromModuleId}.${fromPort}`,
        `${toModuleId}.${toPort}`,
        sourcePortDef.type,
        targetPortDef.type,
      ),
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  const sourceKind = sourcePortDef.kind ?? null;
  const targetKind = targetPortDef.kind ?? null;
  if (sourceKind && targetKind && sourceKind !== targetKind) {
    return {
      valid: false,
      reason: formatSignalKindMismatchMessage(
        `${fromModuleId}.${fromPort}`,
        `${toModuleId}.${toPort}`,
        sourcePortDef.type,
        sourceKind,
        targetKind,
      ),
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  const remainingConnections = project.connections.filter(
    (_, index) => index !== excludedConnectionIndex,
  );

  if (
    remainingConnections.some(
      (connection) =>
        connection.from.moduleId === fromModuleId &&
        connection.from.port === fromPort &&
        connection.to.moduleId === toModuleId &&
        connection.to.port === toPort,
    )
  ) {
    return {
      valid: false,
      reason: 'That connection already exists.',
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  const replaceConnectionIndex = project.connections.findIndex(
    (connection, index) =>
      index !== excludedConnectionIndex &&
      connection.to.moduleId === toModuleId &&
      connection.to.port === toPort,
  );

  const candidateProject: Project = {
    modules: project.modules,
    connections: [
      ...project.connections.filter(
        (_, index) => index !== excludedConnectionIndex && index !== replaceConnectionIndex,
      ),
      {
        from: { moduleId: fromModuleId, port: fromPort },
        to: { moduleId: toModuleId, port: toPort },
      },
    ],
  };
  const validation = validateProject(candidateProject, registry);
  if (validation.issues.some((issue) => issue.code === 'cycle-detected')) {
    return {
      valid: false,
      reason: 'That connection would introduce a cycle.',
      mode: 'blocked',
      replaceConnectionIndex: null,
    };
  }

  return {
    valid: true,
    reason:
      replaceConnectionIndex >= 0
        ? 'Drop to replace the existing input connection.'
        : null,
    mode: replaceConnectionIndex >= 0 ? 'replace' : 'new',
    replaceConnectionIndex: replaceConnectionIndex >= 0 ? replaceConnectionIndex : null,
  };
}
