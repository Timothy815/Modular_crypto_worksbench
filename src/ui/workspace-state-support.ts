import type { CompositeLayoutPosition } from '../engine/composites';
import type { Project } from '../engine/types';
import type {
  ComparisonBaselineDocument,
  WorkbenchAnnotation,
  WorkspaceVersionDocument,
} from './workbench-document';
import { cloneProject } from './project-clone';

export interface WorkspaceHistorySnapshot {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
  annotations: WorkbenchAnnotation[];
  selectedModuleIds: string[];
  probedModuleIds: string[];
  paramDrafts: Record<string, string>;
  currentTick: number;
  isTickPlaybackActive: boolean;
}

export interface WorkspaceHistoryState {
  past: WorkspaceHistorySnapshot[];
  future: WorkspaceHistorySnapshot[];
}

interface WorkspaceSnapshotState {
  projectStates: Record<string, Project>;
  layoutByProject: Record<string, Record<string, CompositeLayoutPosition>>;
  annotationsByProject: Record<string, WorkbenchAnnotation[]>;
  selectedModuleIdByProject: Record<string, string | null>;
  selectedModuleIdsByProject: Record<string, string[]>;
  probedModuleIdsByProject: Record<string, string[]>;
  currentTickByProject: Record<string, number>;
  isTickPlaybackActiveByProject: Record<string, boolean>;
  paramDrafts: Record<string, string>;
}

interface WorkspaceHistoryHostState extends WorkspaceSnapshotState {
  workspaceHistoryByProject: Record<string, WorkspaceHistoryState>;
}

interface WorkspaceVersionHostState extends WorkspaceSnapshotState {
  workspaceVersionsByProject: Record<string, WorkspaceVersionDocument[]>;
  comparisonBaselinesByProject: Record<string, ComparisonBaselineDocument | null>;
  tickedModeByProject: Record<string, boolean>;
}

export function cloneAnnotations(annotations: WorkbenchAnnotation[]): WorkbenchAnnotation[] {
  return annotations.map((annotation) => ({ ...annotation }));
}

export function cloneLayout(
  layout: Record<string, CompositeLayoutPosition>,
): Record<string, CompositeLayoutPosition> {
  return Object.fromEntries(
    Object.entries(layout).map(([moduleId, position]) => [moduleId, { ...position }]),
  );
}

export function createEmptyWorkspaceHistoryState(): WorkspaceHistoryState {
  return {
    past: [],
    future: [],
  };
}

export function cloneWorkspaceHistorySnapshot(
  snapshot: WorkspaceHistorySnapshot,
): WorkspaceHistorySnapshot {
  return {
    project: cloneProject(snapshot.project),
    layout: cloneLayout(snapshot.layout),
    annotations: cloneAnnotations(snapshot.annotations),
    selectedModuleIds: [...snapshot.selectedModuleIds],
    probedModuleIds: [...snapshot.probedModuleIds],
    paramDrafts: { ...snapshot.paramDrafts },
    currentTick: snapshot.currentTick,
    isTickPlaybackActive: snapshot.isTickPlaybackActive,
  };
}

export function buildWorkspaceHistorySnapshot<State extends WorkspaceSnapshotState>(
  state: State,
  projectId: string,
): WorkspaceHistorySnapshot | null {
  const project = state.projectStates[projectId];
  const layout = state.layoutByProject[projectId];
  if (!project || !layout) {
    return null;
  }

  return {
    project: cloneProject(project),
    layout: cloneLayout(layout),
    annotations: cloneAnnotations(state.annotationsByProject[projectId] ?? []),
    selectedModuleIds: [...(state.selectedModuleIdsByProject[projectId] ?? [])],
    probedModuleIds: [...(state.probedModuleIdsByProject[projectId] ?? [])],
    paramDrafts: Object.fromEntries(
      Object.entries(state.paramDrafts)
        .filter(([key]) => key.startsWith(`${projectId}:`))
        .map(([key, value]) => [key, value]),
    ),
    currentTick: state.currentTickByProject[projectId] ?? 0,
    isTickPlaybackActive: state.isTickPlaybackActiveByProject[projectId] ?? false,
  };
}

export function applyWorkspaceHistorySnapshot<State extends WorkspaceSnapshotState>(
  state: State,
  projectId: string,
  snapshot: WorkspaceHistorySnapshot,
): State {
  return {
    ...state,
    projectStates: {
      ...state.projectStates,
      [projectId]: cloneProject(snapshot.project),
    },
    layoutByProject: {
      ...state.layoutByProject,
      [projectId]: cloneLayout(snapshot.layout),
    },
    annotationsByProject: {
      ...state.annotationsByProject,
      [projectId]: cloneAnnotations(snapshot.annotations),
    },
    selectedModuleIdByProject: {
      ...state.selectedModuleIdByProject,
      [projectId]: snapshot.selectedModuleIds[0] ?? null,
    },
    selectedModuleIdsByProject: {
      ...state.selectedModuleIdsByProject,
      [projectId]: [...snapshot.selectedModuleIds],
    },
    probedModuleIdsByProject: {
      ...state.probedModuleIdsByProject,
      [projectId]: [...snapshot.probedModuleIds],
    },
    currentTickByProject: {
      ...state.currentTickByProject,
      [projectId]: snapshot.currentTick,
    },
    isTickPlaybackActiveByProject: {
      ...state.isTickPlaybackActiveByProject,
      [projectId]: snapshot.isTickPlaybackActive,
    },
    paramDrafts: {
      ...Object.fromEntries(
        Object.entries(state.paramDrafts).filter(([key]) => !key.startsWith(`${projectId}:`)),
      ),
      ...snapshot.paramDrafts,
    },
  };
}

export function buildWorkspaceVersionDocument<State extends WorkspaceVersionHostState>(
  state: State,
  projectId: string,
  details: { versionId: string; name: string; savedAt: string },
): WorkspaceVersionDocument | null {
  const project = state.projectStates[projectId];
  const layout = state.layoutByProject[projectId];
  if (!project || !layout) {
    return null;
  }

  return {
    id: details.versionId,
    name: details.name,
    savedAt: details.savedAt,
    tickedMode: state.tickedModeByProject[projectId] ?? false,
    document: {
      version: 1,
      project: cloneProject(project),
      ui: {
        layout: cloneLayout(layout),
        annotations: cloneAnnotations(state.annotationsByProject[projectId] ?? []),
      },
    },
  };
}

export function applyUndoWorkspaceHistory<State extends WorkspaceHistoryHostState>(
  state: State,
  projectId: string,
  historyLimit: number,
): State {
  const history = state.workspaceHistoryByProject[projectId];
  const previousSnapshot = history?.past.at(-1);
  const currentSnapshot = buildWorkspaceHistorySnapshot(state, projectId);
  if (!history || !previousSnapshot || !currentSnapshot) {
    return state;
  }

  const restoredState = applyWorkspaceHistorySnapshot(state, projectId, previousSnapshot);

  return {
    ...restoredState,
    workspaceHistoryByProject: {
      ...restoredState.workspaceHistoryByProject,
      [projectId]: {
        past: history.past.slice(0, -1).map(cloneWorkspaceHistorySnapshot),
        future: [
          cloneWorkspaceHistorySnapshot(currentSnapshot),
          ...history.future.map(cloneWorkspaceHistorySnapshot),
        ].slice(0, historyLimit),
      },
    },
  };
}

export function applyRedoWorkspaceHistory<State extends WorkspaceHistoryHostState>(
  state: State,
  projectId: string,
  historyLimit: number,
): State {
  const history = state.workspaceHistoryByProject[projectId];
  const nextSnapshot = history?.future[0];
  const currentSnapshot = buildWorkspaceHistorySnapshot(state, projectId);
  if (!history || !nextSnapshot || !currentSnapshot) {
    return state;
  }

  const restoredState = applyWorkspaceHistorySnapshot(state, projectId, nextSnapshot);

  return {
    ...restoredState,
    workspaceHistoryByProject: {
      ...restoredState.workspaceHistoryByProject,
      [projectId]: {
        past: [
          ...history.past.map(cloneWorkspaceHistorySnapshot),
          cloneWorkspaceHistorySnapshot(currentSnapshot),
        ].slice(-historyLimit),
        future: history.future.slice(1).map(cloneWorkspaceHistorySnapshot),
      },
    },
  };
}

export function applySaveWorkspaceVersion<State extends WorkspaceVersionHostState>(
  state: State,
  projectId: string,
  details: { versionId: string; name: string; savedAt: string },
): State {
  const nextVersion = buildWorkspaceVersionDocument(state, projectId, details);
  if (!nextVersion) {
    return state;
  }

  return {
    ...state,
    workspaceVersionsByProject: {
      ...state.workspaceVersionsByProject,
      [projectId]: [
        ...(state.workspaceVersionsByProject[projectId] ?? []).filter(
          (version) => version.id !== details.versionId,
        ),
        nextVersion,
      ],
    },
  };
}

export function applyRestoreWorkspaceVersion<State extends WorkspaceVersionHostState>(
  state: State,
  projectId: string,
  versionId: string,
): State {
  const version = (state.workspaceVersionsByProject[projectId] ?? []).find(
    (candidate) => candidate.id === versionId,
  );
  if (!version) {
    return state;
  }

  const nextDrafts = Object.fromEntries(
    Object.entries(state.paramDrafts).filter(([key]) => !key.startsWith(`${projectId}:`)),
  );

  return {
    ...state,
    projectStates: {
      ...state.projectStates,
      [projectId]: cloneProject(version.document.project),
    },
    layoutByProject: {
      ...state.layoutByProject,
      [projectId]: cloneLayout(version.document.ui.layout),
    },
    annotationsByProject: {
      ...state.annotationsByProject,
      [projectId]: cloneAnnotations(version.document.ui.annotations),
    },
    comparisonBaselinesByProject: {
      ...state.comparisonBaselinesByProject,
      [projectId]: null,
    },
    selectedModuleIdByProject: {
      ...state.selectedModuleIdByProject,
      [projectId]: version.document.project.modules[0]?.id ?? null,
    },
    selectedModuleIdsByProject: {
      ...state.selectedModuleIdsByProject,
      [projectId]: version.document.project.modules[0]?.id
        ? [version.document.project.modules[0].id]
        : [],
    },
    probedModuleIdsByProject: {
      ...state.probedModuleIdsByProject,
      [projectId]: [],
    },
    tickedModeByProject: {
      ...state.tickedModeByProject,
      [projectId]: version.tickedMode,
    },
    currentTickByProject: {
      ...state.currentTickByProject,
      [projectId]: 0,
    },
    isTickPlaybackActiveByProject: {
      ...state.isTickPlaybackActiveByProject,
      [projectId]: false,
    },
    paramDrafts: nextDrafts,
  };
}

export function recordWorkspaceHistoryTransition<State extends WorkspaceHistoryHostState>(
  state: State,
  projectId: string,
  beforeSnapshot: WorkspaceHistorySnapshot,
  historyLimit: number,
): State {
  const nextHistory =
    state.workspaceHistoryByProject[projectId] ?? createEmptyWorkspaceHistoryState();

  return {
    ...state,
    workspaceHistoryByProject: {
      ...state.workspaceHistoryByProject,
      [projectId]: {
        past: [
          ...nextHistory.past.map(cloneWorkspaceHistorySnapshot),
          cloneWorkspaceHistorySnapshot(beforeSnapshot),
        ].slice(-historyLimit),
        future: [],
      },
    },
  };
}
