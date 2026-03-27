import type { Connection, ModuleInstance, Project } from '../engine/types';
import type { WorkspaceVersionDocument } from './workbench-document';

export interface WorkspaceComparisonSummary {
  addedModules: ModuleInstance[];
  unchangedModules: ModuleInstance[];
  removedModules: ModuleInstance[];
  addedConnections: Connection[];
  unchangedConnections: Connection[];
  removedConnections: Connection[];
  currentModuleStatusById: Record<string, 'added' | 'unchanged'>;
  currentConnectionStatusByKey: Record<string, 'added' | 'unchanged'>;
}

export function compareWorkspaceToVersion(
  currentProject: Project,
  baselineVersion: WorkspaceVersionDocument,
): WorkspaceComparisonSummary {
  const baselineProject = baselineVersion.document.project;
  const baselineModuleKeySet = new Set(baselineProject.modules.map(getModuleComparisonKey));
  const currentModuleKeySet = new Set(currentProject.modules.map(getModuleComparisonKey));
  const baselineConnectionKeySet = new Set(
    baselineProject.connections.map(getConnectionComparisonKey),
  );
  const currentConnectionKeySet = new Set(
    currentProject.connections.map(getConnectionComparisonKey),
  );

  const addedModules = currentProject.modules.filter(
    (moduleInstance) => !baselineModuleKeySet.has(getModuleComparisonKey(moduleInstance)),
  );
  const unchangedModules = currentProject.modules.filter((moduleInstance) =>
    baselineModuleKeySet.has(getModuleComparisonKey(moduleInstance)),
  );
  const removedModules = baselineProject.modules.filter(
    (moduleInstance) => !currentModuleKeySet.has(getModuleComparisonKey(moduleInstance)),
  );

  const addedConnections = currentProject.connections.filter(
    (connection) => !baselineConnectionKeySet.has(getConnectionComparisonKey(connection)),
  );
  const unchangedConnections = currentProject.connections.filter((connection) =>
    baselineConnectionKeySet.has(getConnectionComparisonKey(connection)),
  );
  const removedConnections = baselineProject.connections.filter(
    (connection) => !currentConnectionKeySet.has(getConnectionComparisonKey(connection)),
  );

  return {
    addedModules,
    unchangedModules,
    removedModules,
    addedConnections,
    unchangedConnections,
    removedConnections,
    currentModuleStatusById: Object.fromEntries(
      currentProject.modules.map((moduleInstance) => [
        moduleInstance.id,
        baselineModuleKeySet.has(getModuleComparisonKey(moduleInstance)) ? 'unchanged' : 'added',
      ]),
    ),
    currentConnectionStatusByKey: Object.fromEntries(
      currentProject.connections.map((connection) => [
        getConnectionComparisonKey(connection),
        baselineConnectionKeySet.has(getConnectionComparisonKey(connection)) ? 'unchanged' : 'added',
      ]),
    ),
  };
}

export function getModuleComparisonKey(moduleInstance: ModuleInstance): string {
  return `${moduleInstance.id}:${moduleInstance.defId}`;
}

export function getConnectionComparisonKey(connection: Connection): string {
  return `${connection.from.moduleId}:${connection.from.port}->${connection.to.moduleId}:${connection.to.port}`;
}
