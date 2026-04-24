import type { Connection, ModuleInstance, ModuleRegistry, PortDef, Project } from '../engine/types';
import type { WorkbenchPosition } from './workbench-document';
import { cloneLayout } from './workspace-state-support';

export interface WorkspaceClipboardSnapshot {
  modules: ModuleInstance[];
  connections: Connection[];
  relativeLayout: Record<string, WorkbenchPosition>;
}

export interface WorkspaceClipboardPasteResult {
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  pastedModuleIds: string[];
  sourceToPastedModuleId: Record<string, string>;
}

export interface RepeatedWorkspaceSelectionResult extends WorkspaceClipboardPasteResult {
  repeatedConnections: Connection[];
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
}): WorkspaceClipboardPasteResult {
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
    sourceToPastedModuleId: Object.fromEntries(idMap.entries()),
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

interface BoundaryPortCandidate {
  moduleId: string;
  portName: string;
  type: PortDef['type'];
  kind: PortDef['kind'];
  sortY: number;
  sortX: number;
  sortIndex: number;
}

function collectRepeatBoundaryOutputs({
  project,
  layout,
  selectedModuleIds,
  registry,
}: {
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  selectedModuleIds: string[];
  registry: ModuleRegistry;
}): BoundaryPortCandidate[] {
  const selectedModuleIdSet = new Set(selectedModuleIds);

  return selectedModuleIds
    .flatMap((moduleId) => {
      const moduleInstance = project.modules.find((candidate) => candidate.id === moduleId);
      const moduleDef = moduleInstance ? registry[moduleInstance.defId] : null;
      if (!moduleInstance || !moduleDef) {
        return [];
      }

      const modulePosition = layout[moduleId] ?? { x: 0, y: 0 };
      return moduleDef.outputs.flatMap((portDef, portIndex) => {
        const matchingConnections = project.connections.filter(
          (connection) =>
            connection.from.moduleId === moduleId && connection.from.port === portDef.name,
        );
        const hasInternalTarget = matchingConnections.some((connection) =>
          selectedModuleIdSet.has(connection.to.moduleId),
        );
        const hasExternalTarget = matchingConnections.some(
          (connection) => !selectedModuleIdSet.has(connection.to.moduleId),
        );
        if (!hasExternalTarget && hasInternalTarget) {
          return [];
        }
        return [
          {
            moduleId,
            portName: portDef.name,
            type: portDef.type,
            kind: portDef.kind,
            sortY: modulePosition.y,
            sortX: modulePosition.x,
            sortIndex: portIndex,
          } satisfies BoundaryPortCandidate,
        ];
      });
    })
    .sort(compareBoundaryPortCandidates);
}

function collectRepeatBoundaryInputs({
  project,
  layout,
  selectedModuleIds,
  registry,
}: {
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  selectedModuleIds: string[];
  registry: ModuleRegistry;
}): BoundaryPortCandidate[] {
  const selectedModuleIdSet = new Set(selectedModuleIds);

  return selectedModuleIds
    .flatMap((moduleId) => {
      const moduleInstance = project.modules.find((candidate) => candidate.id === moduleId);
      const moduleDef = moduleInstance ? registry[moduleInstance.defId] : null;
      if (!moduleInstance || !moduleDef) {
        return [];
      }

      const modulePosition = layout[moduleId] ?? { x: 0, y: 0 };
      return moduleDef.inputs.flatMap((portDef, portIndex) => {
        const matchingConnections = project.connections.filter(
          (connection) => connection.to.moduleId === moduleId && connection.to.port === portDef.name,
        );
        const hasInternalSource = matchingConnections.some((connection) =>
          selectedModuleIdSet.has(connection.from.moduleId),
        );
        const hasExternalSource = matchingConnections.some(
          (connection) => !selectedModuleIdSet.has(connection.from.moduleId),
        );
        if (!hasExternalSource && hasInternalSource) {
          return [];
        }
        return [
          {
            moduleId,
            portName: portDef.name,
            type: portDef.type,
            kind: portDef.kind,
            sortY: modulePosition.y,
            sortX: modulePosition.x,
            sortIndex: portIndex,
          } satisfies BoundaryPortCandidate,
        ];
      });
    })
    .sort(compareBoundaryPortCandidates);
}

function compareBoundaryPortCandidates(
  left: BoundaryPortCandidate,
  right: BoundaryPortCandidate,
): number {
  return (
    left.sortY - right.sortY ||
    left.sortX - right.sortX ||
    left.sortIndex - right.sortIndex ||
    left.moduleId.localeCompare(right.moduleId) ||
    left.portName.localeCompare(right.portName)
  );
}

export function repeatWorkspaceSelectionToRight({
  project,
  layout,
  selectedModuleIds,
  registry,
}: {
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  selectedModuleIds: string[];
  registry: ModuleRegistry;
}): RepeatedWorkspaceSelectionResult | null {
  const duplicated = duplicateWorkspaceSelection({
    project,
    layout,
    selectedModuleIds,
  });
  if (!duplicated) {
    return null;
  }

  const sourceBoundaryOutputs = collectRepeatBoundaryOutputs({
    project,
    layout,
    selectedModuleIds,
    registry,
  });
  const duplicatedBoundaryInputs = collectRepeatBoundaryInputs({
    project,
    layout,
    selectedModuleIds,
    registry,
  })
    .map((candidate) => {
      const duplicatedModuleId = duplicated.sourceToPastedModuleId[candidate.moduleId];
      if (!duplicatedModuleId) {
        return null;
      }
      return {
        ...candidate,
        moduleId: duplicatedModuleId,
      } satisfies BoundaryPortCandidate;
    })
    .filter((candidate): candidate is BoundaryPortCandidate => candidate !== null);

  const unmatchedInputs = [...duplicatedBoundaryInputs];
  const repeatedConnections: Connection[] = [];

  for (const outputCandidate of sourceBoundaryOutputs) {
    const matchingInputIndex = unmatchedInputs.findIndex(
      (inputCandidate) =>
        inputCandidate.type === outputCandidate.type &&
        (inputCandidate.kind ?? 'scalar') === (outputCandidate.kind ?? 'scalar'),
    );
    if (matchingInputIndex < 0) {
      continue;
    }

    const [matchedInput] = unmatchedInputs.splice(matchingInputIndex, 1);
    repeatedConnections.push({
      from: { moduleId: outputCandidate.moduleId, port: outputCandidate.portName },
      to: { moduleId: matchedInput.moduleId, port: matchedInput.portName },
    });
  }

  if (repeatedConnections.length === 0) {
    return {
      ...duplicated,
      repeatedConnections: [],
    };
  }

  return {
    ...duplicated,
    project: {
      ...duplicated.project,
      connections: [...duplicated.project.connections, ...repeatedConnections.map(cloneConnection)],
    },
    repeatedConnections,
  };
}
