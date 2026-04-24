import type { Connection, ModuleInstance, Project } from '../engine/types';
import type { WorkbenchPosition } from './workbench-document';
import { cloneLayout } from './workspace-state-support';

export interface WorkspaceClipboardSnapshot {
  modules: ModuleInstance[];
  connections: Connection[];
  relativeLayout: Record<string, WorkbenchPosition>;
}

const DEFAULT_PASTE_GAP_X = 180;
const DEFAULT_DUPLICATE_GAP_X = 220;

function cloneModuleInstance(moduleInstance: ModuleInstance): ModuleInstance {
  return {
    ...moduleInstance,
    params: { ...moduleInstance.params },
  };
}

function cloneConnection(connection: Connection): Connection {
  return {
    from: { ...connection.from },
    to: { ...connection.to },
  };
}

function createPastedModuleId(project: Project, defId: string) {
  const prefix = defId.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  let index = 1;
  let candidate = `${prefix}-${index}`;

  while (project.modules.some((moduleInstance) => moduleInstance.id === candidate)) {
    index += 1;
    candidate = `${prefix}-${index}`;
  }

  return candidate;
}

function getPasteAnchor(layout: Record<string, WorkbenchPosition>) {
  const positions = Object.values(layout);
  if (positions.length === 0) {
    return { x: 48, y: 48 };
  }

  return {
    x: Math.max(...positions.map((position) => position.x)) + DEFAULT_PASTE_GAP_X,
    y: 48,
  };
}

function getSelectionAnchor({
  layout,
  selectedModuleIds,
}: {
  layout: Record<string, WorkbenchPosition>;
  selectedModuleIds: string[];
}) {
  const selectedPositions = selectedModuleIds
    .map((moduleId) => layout[moduleId])
    .filter((position): position is WorkbenchPosition => Boolean(position));

  if (selectedPositions.length === 0) {
    return { x: 48, y: 48 };
  }

  return {
    x: Math.max(...selectedPositions.map((position) => position.x)) + DEFAULT_DUPLICATE_GAP_X,
    y: Math.min(...selectedPositions.map((position) => position.y)),
  };
}

export function buildWorkspaceClipboardSnapshot({
  project,
  layout,
  selectedModuleIds,
}: {
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  selectedModuleIds: string[];
}) {
  if (selectedModuleIds.length === 0) {
    return null;
  }

  const allowedModuleIds = new Set(selectedModuleIds);
  const selectedModules = project.modules.filter((moduleInstance) =>
    allowedModuleIds.has(moduleInstance.id),
  );
  if (selectedModules.length === 0) {
    return null;
  }

  const selectedLayoutEntries = cloneLayout(
    Object.fromEntries(
      selectedModules.map((moduleInstance) => [
        moduleInstance.id,
        layout[moduleInstance.id] ?? { x: 0, y: 0 },
      ]),
    ),
  );
  const positions = Object.values(selectedLayoutEntries);
  const minX = Math.min(...positions.map((position) => position.x));
  const minY = Math.min(...positions.map((position) => position.y));

  return {
    modules: selectedModules.map(cloneModuleInstance),
    connections: project.connections
      .filter(
        (connection) =>
          allowedModuleIds.has(connection.from.moduleId) &&
          allowedModuleIds.has(connection.to.moduleId),
      )
      .map(cloneConnection),
    relativeLayout: Object.fromEntries(
      Object.entries(selectedLayoutEntries).map(([moduleId, position]) => [
        moduleId,
        {
          x: position.x - minX,
          y: position.y - minY,
          ...(position.orientation ? { orientation: position.orientation } : {}),
          ...(position.portLayoutPreset ? { portLayoutPreset: position.portLayoutPreset } : {}),
          ...(position.inputOrder ? { inputOrder: [...position.inputOrder] } : {}),
          ...(position.outputOrder ? { outputOrder: [...position.outputOrder] } : {}),
          ...(position.inputPortSides ? { inputPortSides: { ...position.inputPortSides } } : {}),
          ...(position.outputPortSides
            ? { outputPortSides: { ...position.outputPortSides } }
            : {}),
        },
      ]),
    ),
  } satisfies WorkspaceClipboardSnapshot;
}

export function pasteWorkspaceClipboardSnapshot({
  targetProject,
  targetLayout,
  snapshot,
  anchor = getPasteAnchor(targetLayout),
}: {
  targetProject: Project;
  targetLayout: Record<string, WorkbenchPosition>;
  snapshot: WorkspaceClipboardSnapshot;
  anchor?: { x: number; y: number };
}) {
  const nextProject: Project = {
    modules: targetProject.modules.map(cloneModuleInstance),
    connections: targetProject.connections.map(cloneConnection),
  };
  const nextLayout = { ...targetLayout };
  const idMap = new Map<string, string>();

  for (const sourceModule of snapshot.modules) {
    const nextModuleId = createPastedModuleId(nextProject, sourceModule.defId);
    idMap.set(sourceModule.id, nextModuleId);
    nextProject.modules.push({
      ...cloneModuleInstance(sourceModule),
      id: nextModuleId,
    });
    const relativePosition = snapshot.relativeLayout[sourceModule.id] ?? { x: 0, y: 0 };
    nextLayout[nextModuleId] = {
      x: anchor.x + relativePosition.x,
      y: anchor.y + relativePosition.y,
      ...(relativePosition.orientation ? { orientation: relativePosition.orientation } : {}),
      ...(relativePosition.portLayoutPreset
        ? { portLayoutPreset: relativePosition.portLayoutPreset }
        : {}),
      ...(relativePosition.inputOrder ? { inputOrder: [...relativePosition.inputOrder] } : {}),
      ...(relativePosition.outputOrder ? { outputOrder: [...relativePosition.outputOrder] } : {}),
      ...(relativePosition.inputPortSides
        ? { inputPortSides: { ...relativePosition.inputPortSides } }
        : {}),
      ...(relativePosition.outputPortSides
        ? { outputPortSides: { ...relativePosition.outputPortSides } }
        : {}),
    };
  }

  for (const connection of snapshot.connections) {
    const remappedFromModuleId = idMap.get(connection.from.moduleId);
    const remappedToModuleId = idMap.get(connection.to.moduleId);
    if (!remappedFromModuleId || !remappedToModuleId) {
      continue;
    }

    nextProject.connections.push({
      from: { moduleId: remappedFromModuleId, port: connection.from.port },
      to: { moduleId: remappedToModuleId, port: connection.to.port },
    });
  }

  return {
    project: nextProject,
    layout: nextLayout,
    pastedModuleIds: snapshot.modules
      .map((moduleInstance) => idMap.get(moduleInstance.id))
      .filter((moduleId): moduleId is string => Boolean(moduleId)),
  };
}

export function duplicateWorkspaceSelection({
  project,
  layout,
  selectedModuleIds,
}: {
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  selectedModuleIds: string[];
}) {
  const snapshot = buildWorkspaceClipboardSnapshot({
    project,
    layout,
    selectedModuleIds,
  });

  if (!snapshot) {
    return null;
  }

  return pasteWorkspaceClipboardSnapshot({
    targetProject: project,
    targetLayout: layout,
    snapshot,
    anchor: getSelectionAnchor({
      layout,
      selectedModuleIds,
    }),
  });
}
