import type { CompositeLayoutPosition } from '../engine/composites';
import type { Project } from '../engine/types';
import type {
  AutosaveSnapshotDocument,
  ComparisonBaselineDocument,
  WorkbenchAnnotation,
  WorkbenchConnectionLayout,
  WorkbenchDocument,
  WorkbenchGuideRail,
  WorkbenchGroupBox,
  WorkbenchLayoutDirection,
  WorkbenchPosition,
  WorkbenchRoutingMode,
  WorkspaceSavedViewRegion,
  WorkbenchWireColorMode,
  WorkbenchStageLabel,
  WorkspaceVersionDocument,
} from './workbench-document';
import { cloneProject } from './project-clone';
import { clonePortOrder } from './port-ordering';
import { buildEmbeddedCompositeLibraryForProject } from './workspace-document-reusables';
import type { CompositeLibraryEntry } from '../engine/composites';
import { cloneWorkspaceSavedViewRegions } from './workspace-navigation';

export interface WorkspaceHistorySnapshot {
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  annotations: WorkbenchAnnotation[];
  stageLabels: WorkbenchStageLabel[];
  groupBoxes: WorkbenchGroupBox[];
  guideRails: WorkbenchGuideRail[];
  showFurniture: boolean;
  showOverviewNavigator: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  layoutDirection: WorkbenchLayoutDirection;
  routingMode: WorkbenchRoutingMode;
  wireColorMode: WorkbenchWireColorMode;
  connectionLayout: Record<string, WorkbenchConnectionLayout>;
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
  stageLabelsByProject: Record<string, WorkbenchStageLabel[]>;
  groupBoxesByProject: Record<string, WorkbenchGroupBox[]>;
  guideRailsByProject: Record<string, WorkbenchGuideRail[]>;
  showFurnitureByProject: Record<string, boolean>;
  showOverviewNavigatorByProject: Record<string, boolean>;
  savedViewRegionsByProject: Record<string, WorkspaceSavedViewRegion[]>;
  showGridByProject: Record<string, boolean>;
  snapToGridByProject: Record<string, boolean>;
  snapToGuidesByProject: Record<string, boolean>;
  layoutDirectionByProject: Record<string, WorkbenchLayoutDirection>;
  routingModeByProject: Record<string, WorkbenchRoutingMode>;
  wireColorModeByProject: Record<string, WorkbenchWireColorMode>;
  connectionLayoutByProject: Record<string, Record<string, WorkbenchConnectionLayout>>;
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
  compositeLibrary: CompositeLibraryEntry[];
}

export function cloneAnnotations(annotations: WorkbenchAnnotation[]): WorkbenchAnnotation[] {
  return annotations.map((annotation) => ({ ...annotation }));
}

export function cloneStageLabels(stageLabels: WorkbenchStageLabel[]): WorkbenchStageLabel[] {
  return stageLabels.map((stageLabel) => ({ ...stageLabel }));
}

export function cloneGroupBoxes(groupBoxes: WorkbenchGroupBox[]): WorkbenchGroupBox[] {
  return groupBoxes.map((groupBox) => ({ ...groupBox }));
}

export function cloneGuideRails(guideRails: WorkbenchGuideRail[]): WorkbenchGuideRail[] {
  return guideRails.map((guideRail) => ({ ...guideRail }));
}

export function cloneLayout<TPosition extends CompositeLayoutPosition | WorkbenchPosition>(
  layout: Record<string, TPosition>,
): Record<string, TPosition> {
  return Object.fromEntries(
    Object.entries(layout).map(([moduleId, position]) => [
      moduleId,
      {
        ...position,
        ...('inputOrder' in position && Array.isArray(position.inputOrder)
          ? { inputOrder: clonePortOrder(position.inputOrder) }
          : {}),
        ...('outputOrder' in position && Array.isArray(position.outputOrder)
          ? { outputOrder: clonePortOrder(position.outputOrder) }
          : {}),
        ...('inputPortSides' in position && position.inputPortSides
          ? { inputPortSides: { ...position.inputPortSides } }
          : {}),
        ...('outputPortSides' in position && position.outputPortSides
          ? { outputPortSides: { ...position.outputPortSides } }
          : {}),
      },
    ]),
  ) as Record<string, TPosition>;
}

export function createEmptyWorkspaceHistoryState(): WorkspaceHistoryState {
  return {
    past: [],
    future: [],
  };
}

function cloneConnectionLayout(
  connectionLayout: Record<string, WorkbenchConnectionLayout>,
): Record<string, WorkbenchConnectionLayout> {
  return Object.fromEntries(
    Object.entries(connectionLayout).map(([connectionKey, layout]) => [
      connectionKey,
      {
        ...(layout.orthogonalBend
          ? {
              orthogonalBend: { ...layout.orthogonalBend },
            }
          : {}),
        ...(layout.orthogonalAnchors
          ? {
              orthogonalAnchors: layout.orthogonalAnchors.map((anchor) => ({ ...anchor })),
            }
          : {}),
        ...(layout.orthogonalLanePreference
          ? {
              orthogonalLanePreference: layout.orthogonalLanePreference,
            }
          : {}),
        ...(layout.colorOverride
          ? {
              colorOverride: layout.colorOverride,
            }
          : {}),
      },
    ]),
  );
}

export function cloneWorkspaceHistorySnapshot(
  snapshot: WorkspaceHistorySnapshot,
): WorkspaceHistorySnapshot {
  return {
    project: cloneProject(snapshot.project),
    layout: cloneLayout(snapshot.layout),
    annotations: cloneAnnotations(snapshot.annotations),
    stageLabels: cloneStageLabels(snapshot.stageLabels),
    groupBoxes: cloneGroupBoxes(snapshot.groupBoxes),
    guideRails: cloneGuideRails(snapshot.guideRails),
    showFurniture: snapshot.showFurniture,
    showOverviewNavigator: snapshot.showOverviewNavigator,
    showGrid: snapshot.showGrid,
    snapToGrid: snapshot.snapToGrid,
    snapToGuides: snapshot.snapToGuides,
    layoutDirection: snapshot.layoutDirection,
    routingMode: snapshot.routingMode,
    wireColorMode: snapshot.wireColorMode,
    connectionLayout: cloneConnectionLayout(snapshot.connectionLayout),
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
    stageLabels: cloneStageLabels(state.stageLabelsByProject[projectId] ?? []),
    groupBoxes: cloneGroupBoxes(state.groupBoxesByProject[projectId] ?? []),
    guideRails: cloneGuideRails(state.guideRailsByProject[projectId] ?? []),
    showFurniture: state.showFurnitureByProject[projectId] ?? true,
    showOverviewNavigator: state.showOverviewNavigatorByProject[projectId] ?? false,
    showGrid: state.showGridByProject[projectId] ?? false,
    snapToGrid: state.snapToGridByProject[projectId] ?? false,
    snapToGuides: state.snapToGuidesByProject[projectId] ?? false,
    layoutDirection: state.layoutDirectionByProject[projectId] ?? 'horizontal',
    routingMode: state.routingModeByProject[projectId] ?? 'curved',
    wireColorMode: state.wireColorModeByProject[projectId] ?? 'domain',
    connectionLayout: cloneConnectionLayout(state.connectionLayoutByProject[projectId] ?? {}),
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
    stageLabelsByProject: {
      ...state.stageLabelsByProject,
      [projectId]: cloneStageLabels(snapshot.stageLabels),
    },
    groupBoxesByProject: {
      ...state.groupBoxesByProject,
      [projectId]: cloneGroupBoxes(snapshot.groupBoxes),
    },
    guideRailsByProject: {
      ...state.guideRailsByProject,
      [projectId]: cloneGuideRails(snapshot.guideRails),
    },
    showFurnitureByProject: {
      ...state.showFurnitureByProject,
      [projectId]: snapshot.showFurniture,
    },
    showOverviewNavigatorByProject: {
      ...state.showOverviewNavigatorByProject,
      [projectId]: snapshot.showOverviewNavigator,
    },
    savedViewRegionsByProject: {
      ...state.savedViewRegionsByProject,
      [projectId]: cloneWorkspaceSavedViewRegions(
        state.savedViewRegionsByProject[projectId] ?? [],
      ),
    },
    showGridByProject: {
      ...state.showGridByProject,
      [projectId]: snapshot.showGrid,
    },
    snapToGridByProject: {
      ...state.snapToGridByProject,
      [projectId]: snapshot.snapToGrid,
    },
    snapToGuidesByProject: {
      ...state.snapToGuidesByProject,
      [projectId]: snapshot.snapToGuides,
    },
    layoutDirectionByProject: {
      ...state.layoutDirectionByProject,
      [projectId]: snapshot.layoutDirection,
    },
    routingModeByProject: {
      ...state.routingModeByProject,
      [projectId]: snapshot.routingMode,
    },
    wireColorModeByProject: {
      ...state.wireColorModeByProject,
      [projectId]: snapshot.wireColorMode,
    },
    connectionLayoutByProject: {
      ...state.connectionLayoutByProject,
      [projectId]: cloneConnectionLayout(snapshot.connectionLayout),
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
  const document = buildWorkbenchDocument(state, projectId);
  if (!document) {
    return null;
  }

  return {
    id: details.versionId,
    name: details.name,
    savedAt: details.savedAt,
    tickedMode: state.tickedModeByProject[projectId] ?? false,
    document,
  };
}

export function buildWorkbenchDocument<State extends WorkspaceVersionHostState>(
  state: State,
  projectId: string,
): WorkbenchDocument | null {
  const project = state.projectStates[projectId];
  const layout = state.layoutByProject[projectId];
  if (!project || !layout) {
    return null;
  }

  return {
    version: 1,
    project: cloneProject(project),
    ...(buildEmbeddedCompositeLibraryForProject(project, state.compositeLibrary)
      ? {
          embeddedCompositeLibrary: buildEmbeddedCompositeLibraryForProject(
            project,
            state.compositeLibrary,
          ),
        }
      : {}),
    ui: {
      layout: cloneLayout(layout),
      annotations: cloneAnnotations(state.annotationsByProject[projectId] ?? []),
      stageLabels: cloneStageLabels(state.stageLabelsByProject[projectId] ?? []),
      groupBoxes: cloneGroupBoxes(state.groupBoxesByProject[projectId] ?? []),
      guideRails: cloneGuideRails(state.guideRailsByProject[projectId] ?? []),
      showFurniture: state.showFurnitureByProject[projectId] ?? true,
      showOverviewNavigator: state.showOverviewNavigatorByProject[projectId] ?? false,
      savedViewRegions: cloneWorkspaceSavedViewRegions(
        state.savedViewRegionsByProject[projectId] ?? [],
      ),
      showGrid: state.showGridByProject[projectId] ?? false,
      snapToGrid: state.snapToGridByProject[projectId] ?? false,
      snapToGuides: state.snapToGuidesByProject[projectId] ?? false,
      layoutDirection: state.layoutDirectionByProject[projectId] ?? 'horizontal',
      routingMode: state.routingModeByProject[projectId] ?? 'curved',
      wireColorMode: state.wireColorModeByProject[projectId] ?? 'domain',
      connectionLayout: cloneConnectionLayout(state.connectionLayoutByProject[projectId] ?? {}),
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

  return applyRestoreWorkbenchDocument(state, projectId, version.document, {
    comparisonBaseline: null,
    tickedMode: version.tickedMode,
  });
}

export function applyRestoreWorkbenchDocument<State extends WorkspaceVersionHostState>(
  state: State,
  projectId: string,
  document: WorkbenchDocument,
  options?: {
    comparisonBaseline?: ComparisonBaselineDocument | null;
    tickedMode?: boolean;
  },
): State {
  const nextDrafts = Object.fromEntries(
    Object.entries(state.paramDrafts).filter(([key]) => !key.startsWith(`${projectId}:`)),
  );

  return {
    ...state,
    projectStates: {
      ...state.projectStates,
      [projectId]: cloneProject(document.project),
    },
    layoutByProject: {
      ...state.layoutByProject,
      [projectId]: cloneLayout(document.ui.layout),
    },
    annotationsByProject: {
      ...state.annotationsByProject,
      [projectId]: cloneAnnotations(document.ui.annotations),
    },
    stageLabelsByProject: {
      ...state.stageLabelsByProject,
      [projectId]: cloneStageLabels(document.ui.stageLabels ?? []),
    },
    groupBoxesByProject: {
      ...state.groupBoxesByProject,
      [projectId]: cloneGroupBoxes(document.ui.groupBoxes ?? []),
    },
    guideRailsByProject: {
      ...state.guideRailsByProject,
      [projectId]: cloneGuideRails(document.ui.guideRails ?? []),
    },
    showFurnitureByProject: {
      ...state.showFurnitureByProject,
      [projectId]: document.ui.showFurniture ?? true,
    },
    showOverviewNavigatorByProject: {
      ...state.showOverviewNavigatorByProject,
      [projectId]: document.ui.showOverviewNavigator ?? false,
    },
    savedViewRegionsByProject: {
      ...state.savedViewRegionsByProject,
      [projectId]: cloneWorkspaceSavedViewRegions(document.ui.savedViewRegions ?? []),
    },
    showGridByProject: {
      ...state.showGridByProject,
      [projectId]: document.ui.showGrid ?? false,
    },
    snapToGridByProject: {
      ...state.snapToGridByProject,
      [projectId]: document.ui.snapToGrid ?? false,
    },
    snapToGuidesByProject: {
      ...state.snapToGuidesByProject,
      [projectId]: document.ui.snapToGuides ?? false,
    },
    layoutDirectionByProject: {
      ...state.layoutDirectionByProject,
      [projectId]: document.ui.layoutDirection ?? 'horizontal',
    },
    routingModeByProject: {
      ...state.routingModeByProject,
      [projectId]: document.ui.routingMode ?? 'curved',
    },
    wireColorModeByProject: {
      ...state.wireColorModeByProject,
      [projectId]: document.ui.wireColorMode ?? 'domain',
    },
    connectionLayoutByProject: {
      ...state.connectionLayoutByProject,
      [projectId]: cloneConnectionLayout(document.ui.connectionLayout ?? {}),
    },
    comparisonBaselinesByProject: {
      ...state.comparisonBaselinesByProject,
      [projectId]: options?.comparisonBaseline ?? null,
    },
    selectedModuleIdByProject: {
      ...state.selectedModuleIdByProject,
      [projectId]: document.project.modules[0]?.id ?? null,
    },
    selectedModuleIdsByProject: {
      ...state.selectedModuleIdsByProject,
      [projectId]: document.project.modules[0]?.id ? [document.project.modules[0].id] : [],
    },
    probedModuleIdsByProject: {
      ...state.probedModuleIdsByProject,
      [projectId]: [],
    },
    tickedModeByProject: {
      ...state.tickedModeByProject,
      [projectId]: options?.tickedMode ?? (state.tickedModeByProject[projectId] ?? false),
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

export function applyRestoreAutosaveSnapshot<State extends WorkspaceVersionHostState>(
  state: State,
  snapshot: AutosaveSnapshotDocument,
): State {
  return applyRestoreWorkbenchDocument(state, snapshot.projectId, snapshot.document, {
    comparisonBaseline: null,
    tickedMode: snapshot.tickedMode,
  });
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
