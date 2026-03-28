import {
  isCompositeDefinition,
  isBuiltInCompositeLibraryEntry,
  type CompositeLibraryEntry,
  type CompositeLayoutPosition,
} from '../engine/composites';
import type { ModuleDefinition, ModuleInstance, ModuleRegistry, Project } from '../engine/types';
import type { GuidedChallenge } from './challenges';
import type { CryptanalysisMode } from './cryptanalysis-mode';
import type { GuidedTutorial } from './tutorials';
import type { DemoProject } from './demo-projects';
import type { WorkspaceMode } from './workspace-mode';
import { STARTER_COMPOSITE_LIBRARY } from './starter-composites';
import { STARTER_CHALLENGES } from './starter-challenges';
import { STARTER_TUTORIALS } from './starter-tutorials';
import type {
  ComparisonBaselineDocument,
  CompositeLibraryDocument,
  UserWorkspaceMetadata,
  WorkbenchAnnotation,
  WorkbenchDocument,
  WorkspaceVersionDocument,
} from './workbench-document';
import {
  getModuleInstanceIdValidationError,
  normalizeModuleInstanceIdCandidate,
} from './module-instance-id';
import { cloneProject } from './project-clone';
import {
  applyRedoWorkspaceHistory,
  applyRestoreWorkspaceVersion,
  applySaveWorkspaceVersion,
  applyUndoWorkspaceHistory,
  buildWorkspaceHistorySnapshot,
  cloneAnnotations,
  cloneLayout,
  createEmptyWorkspaceHistoryState,
  recordWorkspaceHistoryTransition,
  type WorkspaceHistoryState,
} from './workspace-state-support';
import { duplicateWorkspaceSelection } from './workspace-clipboard';

export interface UiState {
  activeProjectId: string;
  defaultWorkspaceMode: WorkspaceMode;
  challengeLibrary: GuidedChallenge[];
  tutorialLibrary: GuidedTutorial[];
  compositeLibrary: CompositeLibraryEntry[];
  userWorkspaceLibrary: UserWorkspaceMetadata[];
  compositeEditor: CompositeEditorState | null;
  projectStates: Record<string, Project>;
  layoutByProject: Record<string, Record<string, { x: number; y: number }>>;
  annotationsByProject: Record<string, WorkbenchAnnotation[]>;
  comparisonBaselinesByProject: Record<string, ComparisonBaselineDocument | null>;
  activeChallengeIdByProject: Record<string, string | null>;
  activeTutorialIdByProject: Record<string, string | null>;
  activeTutorialStepByProject: Record<string, number>;
  completedTutorialsByProject: Record<string, string[]>;
  tutorialNotesVisibleByProject: Record<string, boolean>;
  probedModuleIdsByProject: Record<string, string[]>;
  workspaceModeByProject: Record<string, WorkspaceMode>;
  cryptanalysisModeByProject: Record<string, CryptanalysisMode>;
  cryptanalysisInputByProject: Record<string, string>;
  modernAnalysisBaselineByProject: Record<string, string>;
  modernAnalysisFlipBitByProject: Record<string, number>;
  tickedModeByProject: Record<string, boolean>;
  currentTickByProject: Record<string, number>;
  isTickPlaybackActiveByProject: Record<string, boolean>;
  tickPlaybackSpeedMsByProject: Record<string, number>;
  selectedModuleIdByProject: Record<string, string | null>;
  selectedModuleIdsByProject: Record<string, string[]>;
  workspaceHistoryByProject: Record<string, WorkspaceHistoryState>;
  workspaceVersionsByProject: Record<string, WorkspaceVersionDocument[]>;
  paramDrafts: Record<string, string>;
  showPalette: boolean;
  showInspector: boolean;
}

export interface CompositeEditorState {
  entryId: string;
  project: Project;
  layout: Record<string, CompositeLayoutPosition>;
  originalProject: Project;
  originalLayout: Record<string, CompositeLayoutPosition>;
  selectedModuleId: string | null;
  selectedModuleIds: string[];
  paramDrafts: Record<string, string>;
  saveError: string | null;
}

export type UiAction =
  | { type: 'switchProject'; projectId: string }
  | {
      type: 'createBlankWorkspace';
      workspaceId: string;
      name: string;
      summary: string;
      pipeline: string;
    }
  | {
      type: 'saveWorkspaceAs';
      sourceProjectId: string;
      workspaceId: string;
      name: string;
      summary: string;
      pipeline: string;
      defaultTickedMode?: boolean;
    }
  | { type: 'removeWorkspace'; workspaceId: string; fallbackProjectId: string }
  | { type: 'selectModule'; projectId: string; moduleId: string; additive?: boolean }
  | { type: 'selectModules'; projectId: string; moduleIds: string[]; additive?: boolean }
  | { type: 'moveModule'; projectId: string; moduleId: string; x: number; y: number }
  | {
      type: 'moveModules';
      projectId: string;
      positions: Record<string, { x: number; y: number }>;
    }
  | { type: 'tidyLayout'; projectId: string }
  | {
      type: 'arrangeSelectedModules';
      projectId: string;
      mode: 'stage-row' | 'stage-column';
    }
  | { type: 'addAnnotation'; projectId: string }
  | { type: 'moveAnnotation'; projectId: string; annotationId: string; x: number; y: number }
  | { type: 'updateAnnotationText'; projectId: string; annotationId: string; text: string }
  | { type: 'removeAnnotation'; projectId: string; annotationId: string }
  | { type: 'addModule'; projectId: string; moduleDef: ModuleDefinition }
  | {
      type: 'renameModuleInstance';
      projectId: string;
      moduleId: string;
      nextModuleId: string;
    }
  | { type: 'duplicateSelectedCluster'; projectId: string }
  | { type: 'deleteSelectedCluster'; projectId: string }
  | { type: 'removeModule'; projectId: string; moduleId: string }
  | {
      type: 'addConnection';
      projectId: string;
      fromModuleId: string;
      fromPort: string;
      toModuleId: string;
      toPort: string;
    }
  | { type: 'removeConnection'; projectId: string; connectionIndex: number }
  | {
      type: 'replaceConnection';
      projectId: string;
      removeConnectionIndices: number[];
      fromModuleId: string;
      fromPort: string;
      toModuleId: string;
      toPort: string;
    }
  | {
      type: 'applyCopiedParams';
      projectId: string;
      sourceModuleId: string;
      sourceDefId: string;
      targetModuleIds: string[];
      params: Record<string, unknown>;
      paramKeys: string[];
    }
  | { type: 'updateParam'; projectId: string; moduleId: string; key: string; value: unknown }
  | { type: 'setModuleBypass'; projectId: string; moduleId: string; bypass: boolean }
  | { type: 'setParamDraft'; projectId: string; moduleId: string; key: string; rawValue: string }
  | { type: 'clearParamDraft'; projectId: string; moduleId: string; key: string }
  | { type: 'loadDocument'; projectId: string; document: WorkbenchDocument }
  | { type: 'selectChallenge'; projectId: string; challengeId: string | null }
  | { type: 'upsertChallenge'; challenge: GuidedChallenge }
  | { type: 'selectTutorial'; projectId: string; tutorialId: string | null }
  | { type: 'setTutorialStep'; projectId: string; stepIndex: number }
  | { type: 'completeTutorial'; projectId: string; tutorialId: string }
  | { type: 'resetTutorialProgress'; projectId: string }
  | { type: 'setTutorialNotesVisible'; projectId: string; visible: boolean }
  | { type: 'toggleProbe'; projectId: string; moduleId: string }
  | { type: 'clearProbes'; projectId: string }
  | { type: 'setDefaultWorkspaceMode'; mode: WorkspaceMode }
  | { type: 'setWorkspaceMode'; projectId: string; mode: WorkspaceMode }
  | { type: 'setCryptanalysisMode'; projectId: string; mode: CryptanalysisMode }
  | { type: 'setCryptanalysisInput'; projectId: string; value: string }
  | { type: 'setModernAnalysisBaseline'; projectId: string; value: string }
  | { type: 'setModernAnalysisFlipBit'; projectId: string; value: number }
  | { type: 'setTickedMode'; projectId: string; enabled: boolean }
  | { type: 'setCurrentTick'; projectId: string; tick: number }
  | { type: 'setTickPlaybackActive'; projectId: string; active: boolean }
  | { type: 'setTickPlaybackSpeed'; projectId: string; speedMs: number }
  | { type: 'captureComparisonBaseline'; projectId: string; capturedAt: string }
  | { type: 'clearComparisonBaseline'; projectId: string }
  | { type: 'loadCompositeLibrary'; document: CompositeLibraryDocument }
  | { type: 'addCompositeToLibrary'; entry: CompositeLibraryEntry }
  | { type: 'updateCompositeInLibrary'; entry: CompositeLibraryEntry }
  | { type: 'openCompositeEditor'; entryId: string }
  | { type: 'closeCompositeEditor' }
  | { type: 'setCompositeEditorSaveError'; message: string | null }
  | { type: 'removeCompositeFromLibrary'; compositeId: string }
  | { type: 'togglePalette' }
  | { type: 'toggleInspector' }
  | { type: 'undoWorkspaceHistory'; projectId: string }
  | { type: 'redoWorkspaceHistory'; projectId: string }
  | { type: 'saveWorkspaceVersion'; projectId: string; versionId: string; name: string; savedAt: string }
  | { type: 'restoreWorkspaceVersion'; projectId: string; versionId: string };

function getDraftKey(projectId: string, moduleId: string, key: string): string {
  return `${projectId}:${moduleId}:${key}`;
}

function buildDefaultParams(moduleDef: ModuleDefinition) {
  return Object.fromEntries(
    Object.values(moduleDef.paramSchema).map((field) => [field.key, field.defaultValue]),
  );
}

function createModuleId(project: Project, defId: string) {
  const prefix = defId.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  let index = 1;
  let candidate = `${prefix}-${index}`;

  while (project.modules.some((moduleInstance) => moduleInstance.id === candidate)) {
    index += 1;
    candidate = `${prefix}-${index}`;
  }

  return candidate;
}

function createAnnotationId(annotations: WorkbenchAnnotation[]) {
  let index = annotations.length + 1;
  let candidate = `note-${index}`;

  while (annotations.some((annotation) => annotation.id === candidate)) {
    index += 1;
    candidate = `note-${index}`;
  }

  return candidate;
}

function renameDraftKeys(
  drafts: Record<string, string>,
  projectId: string,
  moduleId: string,
  nextModuleId: string,
) {
  return Object.fromEntries(
    Object.entries(drafts).map(([key, value]) => {
      const prefix = `${projectId}:${moduleId}:`;
      if (!key.startsWith(prefix)) {
        return [key, value];
      }

      return [`${projectId}:${nextModuleId}:${key.slice(prefix.length)}`, value];
    }),
  );
}

function renameModuleReferencesInProject(
  project: Project,
  moduleId: string,
  nextModuleId: string,
): Project {
  return {
    modules: project.modules.map((moduleInstance) => {
      const nextParams =
        moduleInstance.params.linkedRotorId === moduleId
          ? {
              ...moduleInstance.params,
              linkedRotorId: nextModuleId,
            }
          : { ...moduleInstance.params };

      return moduleInstance.id === moduleId
        ? { ...moduleInstance, id: nextModuleId, params: nextParams }
        : { ...moduleInstance, params: nextParams };
    }),
    connections: project.connections.map((connection) => ({
      from: {
        ...connection.from,
        moduleId: connection.from.moduleId === moduleId ? nextModuleId : connection.from.moduleId,
      },
      to: {
        ...connection.to,
        moduleId: connection.to.moduleId === moduleId ? nextModuleId : connection.to.moduleId,
      },
    })),
  };
}

function renameModuleLayoutEntry(
  layout: Record<string, { x: number; y: number }>,
  moduleId: string,
  nextModuleId: string,
) {
  if (!(moduleId in layout)) {
    return layout;
  }

  const nextLayout = { ...layout, [nextModuleId]: layout[moduleId] };
  delete nextLayout[moduleId];
  return nextLayout;
}

function renameModuleSelection(selectedIds: string[], moduleId: string, nextModuleId: string) {
  return selectedIds.map((id) => (id === moduleId ? nextModuleId : id));
}

function updateModule(
  project: Project,
  moduleId: string,
  updater: (moduleInstance: ModuleInstance) => ModuleInstance,
): Project {
  return {
    ...cloneProject(project),
    modules: project.modules.map((moduleInstance) =>
      moduleInstance.id === moduleId ? updater(moduleInstance) : moduleInstance,
    ),
  };
}

const WORKSPACE_HISTORY_LIMIT = 40;
const AUTHORING_HISTORY_ACTIONS = new Set<UiAction['type']>([
  'addAnnotation',
  'moveAnnotation',
  'updateAnnotationText',
  'removeAnnotation',
  'addModule',
  'renameModuleInstance',
  'duplicateSelectedCluster',
  'deleteSelectedCluster',
  'removeModule',
  'addConnection',
  'removeConnection',
  'replaceConnection',
  'applyCopiedParams',
  'updateParam',
  'setModuleBypass',
  'loadDocument',
  'moveModule',
  'moveModules',
  'tidyLayout',
  'arrangeSelectedModules',
  'restoreWorkspaceVersion',
]);

const STAGE_ROW_GAP = 244;
const STAGE_COLUMN_GAP = 148;

function arrangeSelectedLayoutPositions(
  layout: Record<string, { x: number; y: number }>,
  selectedModuleIds: string[],
  anchorModuleId: string | null,
  mode: 'stage-row' | 'stage-column',
) {
  if (selectedModuleIds.length < 2) {
    return layout;
  }

  const anchorId =
    (anchorModuleId && selectedModuleIds.includes(anchorModuleId) ? anchorModuleId : null)
    ?? selectedModuleIds[0]
    ?? null;
  if (!anchorId) {
    return layout;
  }

  const anchorPosition = layout[anchorId];
  if (!anchorPosition) {
    return layout;
  }

  const sortableIds = selectedModuleIds.filter((moduleId) => layout[moduleId]);
  if (sortableIds.length < 2) {
    return layout;
  }

  const orderedIds = [...sortableIds].sort((leftId, rightId) => {
    const leftPosition = layout[leftId] ?? { x: 0, y: 0 };
    const rightPosition = layout[rightId] ?? { x: 0, y: 0 };

    if (mode === 'stage-row') {
      if (leftPosition.x !== rightPosition.x) {
        return leftPosition.x - rightPosition.x;
      }
      if (leftPosition.y !== rightPosition.y) {
        return leftPosition.y - rightPosition.y;
      }
    } else {
      if (leftPosition.y !== rightPosition.y) {
        return leftPosition.y - rightPosition.y;
      }
      if (leftPosition.x !== rightPosition.x) {
        return leftPosition.x - rightPosition.x;
      }
    }

    return leftId.localeCompare(rightId);
  });

  const anchorIndex = orderedIds.indexOf(anchorId);
  if (anchorIndex === -1) {
    return layout;
  }

  const nextLayout = { ...layout };
  for (const [index, moduleId] of orderedIds.entries()) {
    const offset = index - anchorIndex;
    nextLayout[moduleId] =
      mode === 'stage-row'
        ? {
            x: anchorPosition.x + offset * STAGE_ROW_GAP,
            y: anchorPosition.y,
          }
        : {
            x: anchorPosition.x,
            y: anchorPosition.y + offset * STAGE_COLUMN_GAP,
          };
  }

  return nextLayout;
}

function getHistoryProjectId(action: UiAction): string | null {
  if ('projectId' in action && typeof action.projectId === 'string') {
    return action.projectId;
  }

  return null;
}

export function createInitialUiState(projects: DemoProject[]): UiState {
  const defaultChallengeId = STARTER_CHALLENGES[0]?.id ?? null;
  const defaultTutorialByProject = Object.fromEntries(
    projects.map((project) => [
      project.id,
      STARTER_TUTORIALS.find((tutorial) => tutorial.projectId === project.id)?.id ??
        STARTER_TUTORIALS[0]?.id ??
        null,
    ]),
  );
  return {
    activeProjectId: projects[0]?.id ?? '',
    defaultWorkspaceMode: 'guide',
    challengeLibrary: STARTER_CHALLENGES.map((challenge) => ({
      ...challenge,
      startingProject: cloneProject(challenge.startingProject),
      startingLayout: challenge.startingLayout ? cloneLayout(challenge.startingLayout) : undefined,
      targetProject: cloneProject(challenge.targetProject),
      hints: challenge.hints ? [...challenge.hints] : undefined,
    })),
    tutorialLibrary: STARTER_TUTORIALS.map((tutorial) => ({
      ...tutorial,
      steps: tutorial.steps.map((step) => ({ ...step })),
    })),
    compositeLibrary: STARTER_COMPOSITE_LIBRARY.map(cloneReusableEntry),
    userWorkspaceLibrary: [],
    compositeEditor: null,
    projectStates: Object.fromEntries(
      projects.map((project) => [project.id, cloneProject(project.project)]),
    ),
    layoutByProject: Object.fromEntries(
      projects.map((project) => [
        project.id,
        Object.fromEntries(
          Object.entries(project.layout).map(([moduleId, position]) => [
            moduleId,
            { ...position },
          ]),
        ),
      ]),
    ),
    annotationsByProject: Object.fromEntries(
      projects.map((project) => [project.id, []]),
    ),
    comparisonBaselinesByProject: Object.fromEntries(
      projects.map((project) => [project.id, null]),
    ),
    activeChallengeIdByProject: Object.fromEntries(
      projects.map((project) => [
        project.id,
        STARTER_CHALLENGES.find((challenge) => challenge.projectId === project.id)?.id ??
          defaultChallengeId,
      ]),
    ),
    activeTutorialIdByProject: Object.fromEntries(
      projects.map((project) => [project.id, defaultTutorialByProject[project.id] ?? null]),
    ),
    activeTutorialStepByProject: Object.fromEntries(
      projects.map((project) => [project.id, 0]),
    ),
    completedTutorialsByProject: Object.fromEntries(
      projects.map((project) => [project.id, []]),
    ),
    tutorialNotesVisibleByProject: Object.fromEntries(
      projects.map((project) => [project.id, true]),
    ),
    probedModuleIdsByProject: Object.fromEntries(
      projects.map((project) => [project.id, []]),
    ),
    workspaceModeByProject: Object.fromEntries(
      projects.map((project) => [project.id, 'guide' as const]),
    ),
    cryptanalysisModeByProject: Object.fromEntries(
      projects.map((project) => [project.id, 'classical' as const]),
    ),
    cryptanalysisInputByProject: Object.fromEntries(
      projects.map((project) => [project.id, '']),
    ),
    modernAnalysisBaselineByProject: Object.fromEntries(
      projects.map((project) => [project.id, '']),
    ),
    modernAnalysisFlipBitByProject: Object.fromEntries(
      projects.map((project) => [project.id, 0]),
    ),
    tickedModeByProject: Object.fromEntries(
      projects.map((project) => [project.id, project.defaultTickedMode ?? false]),
    ),
    currentTickByProject: Object.fromEntries(
      projects.map((project) => [project.id, 0]),
    ),
    isTickPlaybackActiveByProject: Object.fromEntries(
      projects.map((project) => [project.id, false]),
    ),
    tickPlaybackSpeedMsByProject: Object.fromEntries(
      projects.map((project) => [project.id, 500]),
    ),
    selectedModuleIdByProject: Object.fromEntries(
      projects.map((project) => [project.id, project.project.modules[0]?.id ?? null]),
    ),
    selectedModuleIdsByProject: Object.fromEntries(
      projects.map((project) => [
        project.id,
        project.project.modules[0]?.id ? [project.project.modules[0].id] : [],
      ]),
    ),
    workspaceHistoryByProject: Object.fromEntries(
      projects.map((project) => [project.id, createEmptyWorkspaceHistoryState()]),
    ),
    workspaceVersionsByProject: Object.fromEntries(
      projects.map((project) => [project.id, []]),
    ),
    paramDrafts: {},
    showPalette: true,
    showInspector: true,
  };
}

function cloneReusableEntry(entry: CompositeLibraryEntry): CompositeLibraryEntry {
  const starterEntry = STARTER_COMPOSITE_LIBRARY.find((candidate) => candidate.id === entry.id);
  const source = entry.source ?? starterEntry?.source ?? 'user';
  if (isCompositeDefinition(entry.definition)) {
    return {
      ...entry,
      source,
      definition: {
        ...entry.definition,
        project: cloneProject(entry.definition.project),
        layout: entry.definition.layout
          ? cloneLayout(entry.definition.layout)
          : undefined,
        inputBindings: entry.definition.inputBindings.map((binding) => ({ ...binding })),
        outputBindings: entry.definition.outputBindings.map((binding) => ({ ...binding })),
      },
    };
  }

  return {
    ...entry,
    source,
    definition: { ...entry.definition },
  };
}

function reduceUiStateCore(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'switchProject':
      return {
        ...state,
        activeProjectId: action.projectId,
      };
    case 'createBlankWorkspace': {
      return {
        ...state,
        activeProjectId: action.workspaceId,
        userWorkspaceLibrary: [
          ...state.userWorkspaceLibrary.filter((workspace) => workspace.id !== action.workspaceId),
          {
            id: action.workspaceId,
            name: action.name,
            group: 'My Workspaces',
            summary: action.summary,
            pipeline: action.pipeline,
            defaultTickedMode: false,
          },
        ],
        projectStates: {
          ...state.projectStates,
          [action.workspaceId]: {
            modules: [],
            connections: [],
          },
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.workspaceId]: {},
        },
        annotationsByProject: {
          ...state.annotationsByProject,
          [action.workspaceId]: [],
        },
        comparisonBaselinesByProject: {
          ...state.comparisonBaselinesByProject,
          [action.workspaceId]: null,
        },
        activeChallengeIdByProject: {
          ...state.activeChallengeIdByProject,
          [action.workspaceId]: null,
        },
        activeTutorialIdByProject: {
          ...state.activeTutorialIdByProject,
          [action.workspaceId]: null,
        },
        activeTutorialStepByProject: {
          ...state.activeTutorialStepByProject,
          [action.workspaceId]: 0,
        },
        completedTutorialsByProject: {
          ...state.completedTutorialsByProject,
          [action.workspaceId]: [],
        },
        tutorialNotesVisibleByProject: {
          ...state.tutorialNotesVisibleByProject,
          [action.workspaceId]: true,
        },
        probedModuleIdsByProject: {
          ...state.probedModuleIdsByProject,
          [action.workspaceId]: [],
        },
        workspaceModeByProject: {
          ...state.workspaceModeByProject,
          [action.workspaceId]: 'build',
        },
        cryptanalysisModeByProject: {
          ...state.cryptanalysisModeByProject,
          [action.workspaceId]: 'classical',
        },
        cryptanalysisInputByProject: {
          ...state.cryptanalysisInputByProject,
          [action.workspaceId]: '',
        },
        modernAnalysisBaselineByProject: {
          ...state.modernAnalysisBaselineByProject,
          [action.workspaceId]: '',
        },
        modernAnalysisFlipBitByProject: {
          ...state.modernAnalysisFlipBitByProject,
          [action.workspaceId]: 0,
        },
        tickedModeByProject: {
          ...state.tickedModeByProject,
          [action.workspaceId]: false,
        },
        currentTickByProject: {
          ...state.currentTickByProject,
          [action.workspaceId]: 0,
        },
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.workspaceId]: false,
        },
        tickPlaybackSpeedMsByProject: {
          ...state.tickPlaybackSpeedMsByProject,
          [action.workspaceId]: 500,
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.workspaceId]: null,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.workspaceId]: [],
        },
        workspaceHistoryByProject: {
          ...state.workspaceHistoryByProject,
          [action.workspaceId]: createEmptyWorkspaceHistoryState(),
        },
        workspaceVersionsByProject: {
          ...state.workspaceVersionsByProject,
          [action.workspaceId]: [],
        },
      };
    }
    case 'saveWorkspaceAs': {
      const sourceProject = state.projectStates[action.sourceProjectId];
      const sourceLayout = state.layoutByProject[action.sourceProjectId];
      const sourceAnnotations = state.annotationsByProject[action.sourceProjectId] ?? [];
      if (!sourceProject || !sourceLayout) {
        return state;
      }
      const selectedModuleId = sourceProject.modules[0]?.id ?? null;
      return {
        ...state,
        activeProjectId: action.workspaceId,
        userWorkspaceLibrary: [
          ...state.userWorkspaceLibrary.filter((workspace) => workspace.id !== action.workspaceId),
          {
            id: action.workspaceId,
            name: action.name,
            group: 'My Workspaces',
            summary: action.summary,
            pipeline: action.pipeline,
            defaultTickedMode: action.defaultTickedMode ?? false,
          },
        ],
        projectStates: {
          ...state.projectStates,
          [action.workspaceId]: cloneProject(sourceProject),
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.workspaceId]: cloneLayout(sourceLayout),
        },
        annotationsByProject: {
          ...state.annotationsByProject,
          [action.workspaceId]: cloneAnnotations(sourceAnnotations),
        },
        comparisonBaselinesByProject: {
          ...state.comparisonBaselinesByProject,
          [action.workspaceId]: null,
        },
        activeChallengeIdByProject: {
          ...state.activeChallengeIdByProject,
          [action.workspaceId]: null,
        },
        activeTutorialIdByProject: {
          ...state.activeTutorialIdByProject,
          [action.workspaceId]: null,
        },
        activeTutorialStepByProject: {
          ...state.activeTutorialStepByProject,
          [action.workspaceId]: 0,
        },
        completedTutorialsByProject: {
          ...state.completedTutorialsByProject,
          [action.workspaceId]: [],
        },
        tutorialNotesVisibleByProject: {
          ...state.tutorialNotesVisibleByProject,
          [action.workspaceId]: true,
        },
        probedModuleIdsByProject: {
          ...state.probedModuleIdsByProject,
          [action.workspaceId]: [],
        },
        workspaceModeByProject: {
          ...state.workspaceModeByProject,
          [action.workspaceId]:
            state.workspaceModeByProject[action.sourceProjectId] ?? state.defaultWorkspaceMode,
        },
        cryptanalysisModeByProject: {
          ...state.cryptanalysisModeByProject,
          [action.workspaceId]: 'classical',
        },
        cryptanalysisInputByProject: {
          ...state.cryptanalysisInputByProject,
          [action.workspaceId]: '',
        },
        modernAnalysisBaselineByProject: {
          ...state.modernAnalysisBaselineByProject,
          [action.workspaceId]: '',
        },
        modernAnalysisFlipBitByProject: {
          ...state.modernAnalysisFlipBitByProject,
          [action.workspaceId]: 0,
        },
        tickedModeByProject: {
          ...state.tickedModeByProject,
          [action.workspaceId]: action.defaultTickedMode ?? false,
        },
        currentTickByProject: {
          ...state.currentTickByProject,
          [action.workspaceId]: 0,
        },
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.workspaceId]: false,
        },
        tickPlaybackSpeedMsByProject: {
          ...state.tickPlaybackSpeedMsByProject,
          [action.workspaceId]: 500,
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.workspaceId]: selectedModuleId,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.workspaceId]: selectedModuleId ? [selectedModuleId] : [],
        },
        workspaceHistoryByProject: {
          ...state.workspaceHistoryByProject,
          [action.workspaceId]: createEmptyWorkspaceHistoryState(),
        },
        workspaceVersionsByProject: {
          ...state.workspaceVersionsByProject,
          [action.workspaceId]: [],
        },
      };
    }
    case 'removeWorkspace': {
      if (!state.userWorkspaceLibrary.some((workspace) => workspace.id === action.workspaceId)) {
        return state;
      }

      const nextState: UiState = {
        ...state,
        activeProjectId:
          state.activeProjectId === action.workspaceId
            ? action.fallbackProjectId
            : state.activeProjectId,
        userWorkspaceLibrary: state.userWorkspaceLibrary.filter(
          (workspace) => workspace.id !== action.workspaceId,
        ),
        projectStates: removeProjectEntry(state.projectStates, action.workspaceId),
        layoutByProject: removeProjectEntry(state.layoutByProject, action.workspaceId),
        annotationsByProject: removeProjectEntry(state.annotationsByProject, action.workspaceId),
        comparisonBaselinesByProject: removeProjectEntry(
          state.comparisonBaselinesByProject,
          action.workspaceId,
        ),
        activeChallengeIdByProject: removeProjectEntry(
          state.activeChallengeIdByProject,
          action.workspaceId,
        ),
        activeTutorialIdByProject: removeProjectEntry(
          state.activeTutorialIdByProject,
          action.workspaceId,
        ),
        activeTutorialStepByProject: removeProjectEntry(
          state.activeTutorialStepByProject,
          action.workspaceId,
        ),
        completedTutorialsByProject: removeProjectEntry(
          state.completedTutorialsByProject,
          action.workspaceId,
        ),
        tutorialNotesVisibleByProject: removeProjectEntry(
          state.tutorialNotesVisibleByProject,
          action.workspaceId,
        ),
        probedModuleIdsByProject: removeProjectEntry(
          state.probedModuleIdsByProject,
          action.workspaceId,
        ),
        workspaceModeByProject: removeProjectEntry(
          state.workspaceModeByProject,
          action.workspaceId,
        ),
        cryptanalysisModeByProject: removeProjectEntry(
          state.cryptanalysisModeByProject,
          action.workspaceId,
        ),
        cryptanalysisInputByProject: removeProjectEntry(
          state.cryptanalysisInputByProject,
          action.workspaceId,
        ),
        modernAnalysisBaselineByProject: removeProjectEntry(
          state.modernAnalysisBaselineByProject,
          action.workspaceId,
        ),
        modernAnalysisFlipBitByProject: removeProjectEntry(
          state.modernAnalysisFlipBitByProject,
          action.workspaceId,
        ),
        tickedModeByProject: removeProjectEntry(state.tickedModeByProject, action.workspaceId),
        currentTickByProject: removeProjectEntry(
          state.currentTickByProject,
          action.workspaceId,
        ),
        isTickPlaybackActiveByProject: removeProjectEntry(
          state.isTickPlaybackActiveByProject,
          action.workspaceId,
        ),
        tickPlaybackSpeedMsByProject: removeProjectEntry(
          state.tickPlaybackSpeedMsByProject,
          action.workspaceId,
        ),
        selectedModuleIdByProject: removeProjectEntry(
          state.selectedModuleIdByProject,
          action.workspaceId,
        ),
        selectedModuleIdsByProject: removeProjectEntry(
          state.selectedModuleIdsByProject,
          action.workspaceId,
        ),
        workspaceHistoryByProject: removeProjectEntry(
          state.workspaceHistoryByProject,
          action.workspaceId,
        ),
        workspaceVersionsByProject: removeProjectEntry(
          state.workspaceVersionsByProject,
          action.workspaceId,
        ),
        paramDrafts: Object.fromEntries(
          Object.entries(state.paramDrafts).filter(
            ([key]) => !key.startsWith(`${action.workspaceId}:`),
          ),
        ),
      };

      return nextState;
    }
    case 'selectModule':
      return state.compositeEditor
        ? {
            ...state,
            compositeEditor: applyCompositeEditorSelection(
              state.compositeEditor,
              action.moduleId,
              action.additive ?? false,
            ),
          }
        : applyModuleSelection(
            state,
            action.projectId,
            action.moduleId,
            action.additive ?? false,
          );
    case 'selectModules':
      return state.compositeEditor
        ? {
            ...state,
            compositeEditor: applyCompositeEditorMultiSelection(
              state.compositeEditor,
              action.moduleIds,
              action.additive ?? false,
            ),
          }
        : applyModuleMultiSelection(
            state,
            action.projectId,
            action.moduleIds,
            action.additive ?? false,
          );
    case 'moveModule': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: {
            ...state.compositeEditor,
            layout: {
              ...state.compositeEditor.layout,
              [action.moduleId]: {
                x: action.x,
                y: action.y,
              },
            },
          },
        };
      }

      const currentLayout = state.layoutByProject[action.projectId];
      if (!currentLayout) {
        return state;
      }

      return {
        ...state,
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: {
            ...currentLayout,
            [action.moduleId]: {
              x: action.x,
              y: action.y,
            },
          },
        },
      };
    }
    case 'moveModules': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: {
            ...state.compositeEditor,
            layout: {
              ...state.compositeEditor.layout,
              ...action.positions,
            },
          },
        };
      }

      const currentLayout = state.layoutByProject[action.projectId];
      if (!currentLayout) {
        return state;
      }

      return {
        ...state,
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: {
            ...currentLayout,
            ...action.positions,
          },
        },
      };
    }
    case 'tidyLayout': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: {
            ...state.compositeEditor,
            layout: createTidiedLayout(
              state.compositeEditor.project,
              state.compositeEditor.layout,
            ),
          },
        };
      }

      const currentProject = state.projectStates[action.projectId];
      const currentLayout = state.layoutByProject[action.projectId];
      if (!currentProject || !currentLayout) {
        return state;
      }

      return {
        ...state,
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: createTidiedLayout(currentProject, currentLayout),
        },
      };
    }
    case 'arrangeSelectedModules': {
      if (state.compositeEditor) {
        const nextLayout = arrangeSelectedLayoutPositions(
          state.compositeEditor.layout,
          state.compositeEditor.selectedModuleIds,
          state.compositeEditor.selectedModuleId,
          action.mode,
        );

        if (nextLayout === state.compositeEditor.layout) {
          return state;
        }

        return {
          ...state,
          compositeEditor: {
            ...state.compositeEditor,
            layout: nextLayout,
          },
        };
      }

      const currentLayout = state.layoutByProject[action.projectId];
      const selectedModuleIds = state.selectedModuleIdsByProject[action.projectId] ?? [];
      const selectedModuleId = state.selectedModuleIdByProject[action.projectId] ?? null;
      if (!currentLayout || selectedModuleIds.length < 2) {
        return state;
      }

      const nextLayout = arrangeSelectedLayoutPositions(
        currentLayout,
        selectedModuleIds,
        selectedModuleId,
        action.mode,
      );

      if (nextLayout === currentLayout) {
        return state;
      }

      return {
        ...state,
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: nextLayout,
        },
      };
    }
    case 'addAnnotation': {
      const currentAnnotations = state.annotationsByProject[action.projectId] ?? [];
      const nextAnnotationId = createAnnotationId(currentAnnotations);

      return {
        ...state,
        annotationsByProject: {
          ...state.annotationsByProject,
          [action.projectId]: [
            ...currentAnnotations,
            {
              id: nextAnnotationId,
              x: 72,
              y: 72,
              text: 'Add note...',
            },
          ],
        },
      };
    }
    case 'moveAnnotation': {
      const currentAnnotations = state.annotationsByProject[action.projectId];
      if (!currentAnnotations) {
        return state;
      }

      return {
        ...state,
        annotationsByProject: {
          ...state.annotationsByProject,
          [action.projectId]: currentAnnotations.map((annotation) =>
            annotation.id === action.annotationId
              ? { ...annotation, x: action.x, y: action.y }
              : annotation,
          ),
        },
      };
    }
    case 'updateAnnotationText': {
      const currentAnnotations = state.annotationsByProject[action.projectId];
      if (!currentAnnotations) {
        return state;
      }

      return {
        ...state,
        annotationsByProject: {
          ...state.annotationsByProject,
          [action.projectId]: currentAnnotations.map((annotation) =>
            annotation.id === action.annotationId
              ? { ...annotation, text: action.text }
              : annotation,
          ),
        },
      };
    }
    case 'removeAnnotation': {
      const currentAnnotations = state.annotationsByProject[action.projectId];
      if (!currentAnnotations) {
        return state;
      }

      return {
        ...state,
        annotationsByProject: {
          ...state.annotationsByProject,
          [action.projectId]: currentAnnotations.filter(
            (annotation) => annotation.id !== action.annotationId,
          ),
        },
      };
    }
    case 'addModule': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: addModuleToCompositeEditor(state.compositeEditor, action.moduleDef),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      const currentLayout = state.layoutByProject[action.projectId];
      if (!currentProject || !currentLayout) {
        return state;
      }

      const nextModuleId = createModuleId(currentProject, action.moduleDef.id);
      const nextProject = cloneProject(currentProject);
      nextProject.modules = [
        ...nextProject.modules,
        {
          id: nextModuleId,
          defId: action.moduleDef.id,
          params: buildDefaultParams(action.moduleDef),
        },
      ];

      const positions = Object.values(currentLayout);
      const occupiedSet = new Set(positions.map((p) => `${p.x},${p.y}`));
      let newX = 40;
      let newY = 40;

      while (occupiedSet.has(`${newX},${newY}`)) {
        newX += 160;
        if (newX > 700) {
          newX = 40;
          newY += 100;
        }
      }

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: {
            ...currentLayout,
            [nextModuleId]: {
              x: newX,
              y: newY,
            },
          },
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: nextModuleId,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.projectId]: [nextModuleId],
        },
      };
    }
    case 'renameModuleInstance': {
      if (state.compositeEditor) {
        return state;
      }

      const currentProject = state.projectStates[action.projectId];
      const currentLayout = state.layoutByProject[action.projectId];
      if (!currentProject || !currentLayout) {
        return state;
      }

      const nextModuleId = normalizeModuleInstanceIdCandidate(action.nextModuleId);
      if (nextModuleId === action.moduleId) {
        return state;
      }

      if (!currentProject.modules.some((moduleInstance) => moduleInstance.id === action.moduleId)) {
        return state;
      }

      const validationError = getModuleInstanceIdValidationError(
        nextModuleId,
        currentProject.modules.map((moduleInstance) => moduleInstance.id),
        action.moduleId,
      );
      if (validationError) {
        return state;
      }

      const nextProject = renameModuleReferencesInProject(
        currentProject,
        action.moduleId,
        nextModuleId,
      );
      const nextLayout = renameModuleLayoutEntry(currentLayout, action.moduleId, nextModuleId);
      const nextSelectedModuleId =
        state.selectedModuleIdByProject[action.projectId] === action.moduleId
          ? nextModuleId
          : state.selectedModuleIdByProject[action.projectId] ?? null;

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: nextLayout,
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: nextSelectedModuleId,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.projectId]: renameModuleSelection(
            state.selectedModuleIdsByProject[action.projectId] ?? [],
            action.moduleId,
            nextModuleId,
          ),
        },
        probedModuleIdsByProject: {
          ...state.probedModuleIdsByProject,
          [action.projectId]: renameModuleSelection(
            state.probedModuleIdsByProject[action.projectId] ?? [],
            action.moduleId,
            nextModuleId,
          ),
        },
        paramDrafts: renameDraftKeys(
          state.paramDrafts,
          action.projectId,
          action.moduleId,
          nextModuleId,
        ),
      };
    }
    case 'duplicateSelectedCluster': {
      if (state.compositeEditor) {
        return state;
      }

      const currentProject = state.projectStates[action.projectId];
      const currentLayout = state.layoutByProject[action.projectId];
      const selectedModuleIds = state.selectedModuleIdsByProject[action.projectId] ?? [];
      if (!currentProject || !currentLayout || selectedModuleIds.length === 0) {
        return state;
      }

      const duplicated = duplicateWorkspaceSelection({
        project: currentProject,
        layout: currentLayout,
        selectedModuleIds,
      });
      if (!duplicated) {
        return state;
      }

      const [selectedModuleId] = duplicated.pastedModuleIds;

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: duplicated.project,
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: duplicated.layout,
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: selectedModuleId ?? null,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.projectId]: duplicated.pastedModuleIds,
        },
        currentTickByProject: {
          ...state.currentTickByProject,
          [action.projectId]: 0,
        },
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.projectId]: false,
        },
      };
    }
    case 'deleteSelectedCluster': {
      if (state.compositeEditor) {
        return state;
      }

      const currentProject = state.projectStates[action.projectId];
      const currentLayout = state.layoutByProject[action.projectId];
      const selectedModuleIds = state.selectedModuleIdsByProject[action.projectId] ?? [];
      if (!currentProject || !currentLayout || selectedModuleIds.length === 0) {
        return state;
      }

      const selectedSet = new Set(selectedModuleIds);
      const nextProject: Project = {
        modules: currentProject.modules
          .filter((moduleInstance) => !selectedSet.has(moduleInstance.id))
          .map((moduleInstance) => ({
            ...moduleInstance,
            params: { ...moduleInstance.params },
          })),
        connections: currentProject.connections
          .filter(
            (connection) =>
              !selectedSet.has(connection.from.moduleId) && !selectedSet.has(connection.to.moduleId),
          )
          .map((connection) => ({
            from: { ...connection.from },
            to: { ...connection.to },
          })),
      };
      const nextLayout = Object.fromEntries(
        Object.entries(currentLayout).filter(([moduleId]) => !selectedSet.has(moduleId)),
      );
      const nextSelectedModuleId = nextProject.modules[0]?.id ?? null;
      const nextDrafts = Object.fromEntries(
        Object.entries(state.paramDrafts).filter(([key]) => {
          return !selectedModuleIds.some((moduleId) => key.startsWith(`${action.projectId}:${moduleId}:`));
        }),
      );

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: nextLayout,
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: nextSelectedModuleId,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.projectId]: nextSelectedModuleId ? [nextSelectedModuleId] : [],
        },
        probedModuleIdsByProject: {
          ...state.probedModuleIdsByProject,
          [action.projectId]: (state.probedModuleIdsByProject[action.projectId] ?? []).filter(
            (moduleId) => !selectedSet.has(moduleId),
          ),
        },
        currentTickByProject: {
          ...state.currentTickByProject,
          [action.projectId]: 0,
        },
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.projectId]: false,
        },
        paramDrafts: nextDrafts,
      };
    }
    case 'removeModule': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: removeModuleFromCompositeEditor(state.compositeEditor, action.moduleId),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      const currentLayout = state.layoutByProject[action.projectId];
      if (!currentProject || !currentLayout) {
        return state;
      }

      const nextProject = cloneProject(currentProject);
      nextProject.modules = nextProject.modules.filter(
        (moduleInstance) => moduleInstance.id !== action.moduleId,
      );
      nextProject.connections = nextProject.connections.filter(
        (connection) =>
          connection.from.moduleId !== action.moduleId &&
          connection.to.moduleId !== action.moduleId,
      );

      const nextLayout = { ...currentLayout };
      delete nextLayout[action.moduleId];

      const nextDrafts = Object.fromEntries(
        Object.entries(state.paramDrafts).filter(
          ([key]) => !key.startsWith(`${action.projectId}:${action.moduleId}:`),
        ),
      );

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: nextLayout,
        },
        annotationsByProject: state.annotationsByProject,
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: nextProject.modules[0]?.id ?? null,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.projectId]: nextProject.modules[0]?.id ? [nextProject.modules[0].id] : [],
        },
        probedModuleIdsByProject: {
          ...state.probedModuleIdsByProject,
          [action.projectId]: (state.probedModuleIdsByProject[action.projectId] ?? []).filter(
            (id) => id !== action.moduleId,
          ),
        },
        paramDrafts: nextDrafts,
      };
    }
    case 'addConnection': {
      if (state.compositeEditor) {
        const activeCompositeEntry = state.compositeLibrary.find(
          (entry) => entry.id === state.compositeEditor?.entryId,
        );
        if (
          activeCompositeEntry &&
          connectionTouchesProtectedBoundaryPort(activeCompositeEntry, action)
        ) {
          return {
            ...state,
            compositeEditor: {
              ...state.compositeEditor,
              saveError:
                'This connection touches an exposed composite boundary port. Boundary editing will come in a later slice.',
            },
          };
        }

        return {
          ...state,
          compositeEditor: addConnectionToCompositeEditor(state.compositeEditor, action),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      if (!currentProject) {
        return state;
      }

      const alreadyExists = currentProject.connections.some(
        (c) =>
          c.from.moduleId === action.fromModuleId &&
          c.from.port === action.fromPort &&
          c.to.moduleId === action.toModuleId &&
          c.to.port === action.toPort,
      );
      if (alreadyExists) {
        return state;
      }

      const nextProject = cloneProject(currentProject);
      nextProject.connections = [
        ...nextProject.connections,
        {
          from: { moduleId: action.fromModuleId, port: action.fromPort },
          to: { moduleId: action.toModuleId, port: action.toPort },
        },
      ];

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
      };
    }
    case 'removeConnection': {
      if (state.compositeEditor) {
        const activeCompositeEntry = state.compositeLibrary.find(
          (entry) => entry.id === state.compositeEditor?.entryId,
        );
        if (
          activeCompositeEntry &&
          connectionIndexTouchesProtectedBoundaryPort(
            activeCompositeEntry,
            state.compositeEditor.project,
            action.connectionIndex,
          )
        ) {
          return {
            ...state,
            compositeEditor: {
              ...state.compositeEditor,
              saveError:
                'This connection is part of the exposed composite boundary. Boundary editing will come in a later slice.',
            },
          };
        }

        return {
          ...state,
          compositeEditor: removeConnectionFromCompositeEditor(
            state.compositeEditor,
            action.connectionIndex,
          ),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      if (!currentProject) {
        return state;
      }

      const nextProject = cloneProject(currentProject);
      nextProject.connections = nextProject.connections.filter(
        (_, i) => i !== action.connectionIndex,
      );

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
      };
    }
    case 'replaceConnection': {
      if (state.compositeEditor) {
        const activeCompositeEntry = state.compositeLibrary.find(
          (entry) => entry.id === state.compositeEditor?.entryId,
        );
        if (
          activeCompositeEntry &&
          replacementTouchesProtectedBoundaryPort(activeCompositeEntry, state.compositeEditor.project, action)
        ) {
          return {
            ...state,
            compositeEditor: {
              ...state.compositeEditor,
              saveError:
                'This rewire touches the exposed composite boundary. Boundary editing will come in a later slice.',
            },
          };
        }

        return {
          ...state,
          compositeEditor: replaceConnectionInCompositeEditor(state.compositeEditor, action),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      if (!currentProject) {
        return state;
      }

      const uniqueRemovals = [...new Set(action.removeConnectionIndices)].sort((a, b) => a - b);
      const nextConnections = currentProject.connections.filter(
        (_, index) => !uniqueRemovals.includes(index),
      );
      const alreadyExists = nextConnections.some(
        (connection) =>
          connection.from.moduleId === action.fromModuleId &&
          connection.from.port === action.fromPort &&
          connection.to.moduleId === action.toModuleId &&
          connection.to.port === action.toPort,
      );
      if (alreadyExists) {
        return state;
      }

      const nextProject = cloneProject(currentProject);
      nextProject.connections = [
        ...nextConnections,
        {
          from: { moduleId: action.fromModuleId, port: action.fromPort },
          to: { moduleId: action.toModuleId, port: action.toPort },
        },
      ];

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
      };
    }
    case 'applyCopiedParams': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: applyCopiedParamsToCompositeEditor(state.compositeEditor, action),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      if (!currentProject || action.paramKeys.length === 0) {
        return state;
      }

      const targetSet = new Set(action.targetModuleIds);
      let changed = false;
      const nextProject = cloneProject(currentProject);
      nextProject.modules = nextProject.modules.map((moduleInstance) => {
        if (
          moduleInstance.id === action.sourceModuleId ||
          !targetSet.has(moduleInstance.id) ||
          moduleInstance.defId !== action.sourceDefId
        ) {
          return moduleInstance;
        }

        changed = true;
        return {
          ...moduleInstance,
          params: {
            ...moduleInstance.params,
            ...Object.fromEntries(
              action.paramKeys.map((key) => [key, action.params[key]]),
            ),
          },
        };
      });

      if (!changed) {
        return state;
      }

      const nextDrafts = { ...state.paramDrafts };
      for (const moduleId of action.targetModuleIds) {
        for (const key of action.paramKeys) {
          delete nextDrafts[getDraftKey(action.projectId, moduleId, key)];
        }
      }

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
        paramDrafts: nextDrafts,
      };
    }
    case 'updateParam': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: updateCompositeEditorParam(
            state.compositeEditor,
            action.moduleId,
            action.key,
            action.value,
          ),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      if (!currentProject) {
        return state;
      }

      const nextProject = updateModule(currentProject, action.moduleId, (moduleInstance) => ({
        ...moduleInstance,
        params: {
          ...moduleInstance.params,
          [action.key]: action.value,
        },
      }));

      const nextDrafts = { ...state.paramDrafts };
      delete nextDrafts[getDraftKey(action.projectId, action.moduleId, action.key)];

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
        paramDrafts: nextDrafts,
      };
    }
    case 'setModuleBypass': {
      if (state.compositeEditor) {
        return {
          ...state,
          compositeEditor: updateCompositeEditorBypass(
            state.compositeEditor,
            action.moduleId,
            action.bypass,
          ),
        };
      }

      const currentProject = state.projectStates[action.projectId];
      if (!currentProject) {
        return state;
      }

      const nextProject = updateModule(currentProject, action.moduleId, (moduleInstance) => ({
        ...moduleInstance,
        bypass: action.bypass,
      }));

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
      };
    }
    case 'setParamDraft':
      return state.compositeEditor
        ? {
            ...state,
            compositeEditor: {
              ...state.compositeEditor,
              paramDrafts: {
                ...state.compositeEditor.paramDrafts,
                [`${action.moduleId}:${action.key}`]: action.rawValue,
              },
            },
          }
        : {
            ...state,
            paramDrafts: {
              ...state.paramDrafts,
              [getDraftKey(action.projectId, action.moduleId, action.key)]: action.rawValue,
            },
          };
    case 'clearParamDraft': {
      if (state.compositeEditor) {
        const nextDrafts = { ...state.compositeEditor.paramDrafts };
        delete nextDrafts[`${action.moduleId}:${action.key}`];
        return {
          ...state,
          compositeEditor: {
            ...state.compositeEditor,
            paramDrafts: nextDrafts,
          },
        };
      }

      const nextDrafts = { ...state.paramDrafts };
      delete nextDrafts[getDraftKey(action.projectId, action.moduleId, action.key)];
      return {
        ...state,
        paramDrafts: nextDrafts,
      };
    }
    case 'loadDocument': {
      const nextProject = cloneProject(action.document.project);
      const nextLayout = Object.fromEntries(
        Object.entries(action.document.ui.layout).map(([moduleId, position]) => [
          moduleId,
          { ...position },
        ]),
      );
      const nextAnnotations = action.document.ui.annotations.map((annotation) => ({
        ...annotation,
      }));
      const nextDrafts = Object.fromEntries(
        Object.entries(state.paramDrafts).filter(
          ([key]) => !key.startsWith(`${action.projectId}:`),
        ),
      );

      return {
        ...state,
        projectStates: {
          ...state.projectStates,
          [action.projectId]: nextProject,
        },
        layoutByProject: {
          ...state.layoutByProject,
          [action.projectId]: nextLayout,
        },
        annotationsByProject: {
          ...state.annotationsByProject,
          [action.projectId]: nextAnnotations,
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: nextProject.modules[0]?.id ?? null,
        },
        selectedModuleIdsByProject: {
          ...state.selectedModuleIdsByProject,
          [action.projectId]: nextProject.modules[0]?.id ? [nextProject.modules[0].id] : [],
        },
        currentTickByProject: {
          ...state.currentTickByProject,
          [action.projectId]: 0,
        },
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.projectId]: false,
        },
        paramDrafts: nextDrafts,
      };
    }
    case 'selectChallenge':
      return {
        ...state,
        activeChallengeIdByProject: {
          ...state.activeChallengeIdByProject,
          [action.projectId]: action.challengeId,
        },
      };
    case 'upsertChallenge': {
      const existing = state.challengeLibrary.some((challenge) => challenge.id === action.challenge.id);
      const nextChallenge = {
        ...action.challenge,
        difficulty: action.challenge.difficulty,
        startingProject: cloneProject(action.challenge.startingProject),
        startingLayout: action.challenge.startingLayout
          ? cloneLayout(action.challenge.startingLayout)
          : undefined,
        targetProject: cloneProject(action.challenge.targetProject),
        hints: action.challenge.hints ? [...action.challenge.hints] : undefined,
      };
      return {
        ...state,
        challengeLibrary: existing
          ? state.challengeLibrary.map((challenge) =>
              challenge.id === nextChallenge.id ? nextChallenge : challenge,
            )
          : [...state.challengeLibrary, nextChallenge],
      };
    }
    case 'captureComparisonBaseline': {
      const sourceProject = state.compositeEditor
        ? state.compositeEditor.project
        : state.projectStates[action.projectId];
      if (!sourceProject) {
        return state;
      }

      return {
        ...state,
        comparisonBaselinesByProject: {
          ...state.comparisonBaselinesByProject,
          [action.projectId]: {
            project: cloneProject(sourceProject),
            capturedAt: action.capturedAt,
          },
        },
      };
    }
    case 'selectTutorial':
      return {
        ...state,
        activeTutorialIdByProject: {
          ...state.activeTutorialIdByProject,
          [action.projectId]: action.tutorialId,
        },
        activeTutorialStepByProject: {
          ...state.activeTutorialStepByProject,
          [action.projectId]: 0,
        },
      };
    case 'setTutorialStep': {
      const clampedStep = Math.max(0, Math.trunc(action.stepIndex));
      const tutorialId = state.activeTutorialIdByProject[action.projectId] ?? null;
      const tutorial = tutorialId
        ? state.tutorialLibrary.find((t) => t.id === tutorialId) ?? null
        : null;
      const alreadyCompleted = (
        state.completedTutorialsByProject[action.projectId] ?? []
      ).includes(tutorialId ?? '');
      const isFinalStep =
        tutorial !== null &&
        tutorial.steps.length > 0 &&
        clampedStep >= tutorial.steps.length - 1;

      const nextCompleted =
        isFinalStep && !alreadyCompleted && tutorialId
          ? {
              completedTutorialsByProject: {
                ...state.completedTutorialsByProject,
                [action.projectId]: [
                  ...(state.completedTutorialsByProject[action.projectId] ?? []),
                  tutorialId,
                ],
              },
            }
          : {};

      return {
        ...state,
        activeTutorialStepByProject: {
          ...state.activeTutorialStepByProject,
          [action.projectId]: clampedStep,
        },
        ...nextCompleted,
      };
    }
    case 'completeTutorial': {
      const existing = state.completedTutorialsByProject[action.projectId] ?? [];
      if (existing.includes(action.tutorialId)) {
        return state;
      }

      return {
        ...state,
        completedTutorialsByProject: {
          ...state.completedTutorialsByProject,
          [action.projectId]: [...existing, action.tutorialId],
        },
      };
    }
    case 'resetTutorialProgress':
      return {
        ...state,
        completedTutorialsByProject: {
          ...state.completedTutorialsByProject,
          [action.projectId]: [],
        },
        activeTutorialStepByProject: {
          ...state.activeTutorialStepByProject,
          [action.projectId]: 0,
        },
      };
    case 'setTutorialNotesVisible':
      return {
        ...state,
        tutorialNotesVisibleByProject: {
          ...state.tutorialNotesVisibleByProject,
          [action.projectId]: action.visible,
        },
      };
    case 'toggleProbe': {
      const probed = state.probedModuleIdsByProject[action.projectId] ?? [];
      const isProbed = probed.includes(action.moduleId);
      return {
        ...state,
        probedModuleIdsByProject: {
          ...state.probedModuleIdsByProject,
          [action.projectId]: isProbed
            ? probed.filter((id) => id !== action.moduleId)
            : [...probed, action.moduleId],
        },
      };
    }
    case 'clearProbes':
      return {
        ...state,
        probedModuleIdsByProject: {
          ...state.probedModuleIdsByProject,
          [action.projectId]: [],
        },
      };
    case 'setDefaultWorkspaceMode':
      return {
        ...state,
        defaultWorkspaceMode: action.mode,
        workspaceModeByProject: Object.fromEntries(
          Object.keys(state.projectStates).map((projectId) => [projectId, action.mode]),
        ),
      };
    case 'setWorkspaceMode':
      return {
        ...state,
        workspaceModeByProject: {
          ...state.workspaceModeByProject,
          [action.projectId]: action.mode,
        },
      };
    case 'setCryptanalysisMode':
      return {
        ...state,
        cryptanalysisModeByProject: {
          ...state.cryptanalysisModeByProject,
          [action.projectId]: action.mode,
        },
      };
    case 'setCryptanalysisInput':
      return {
        ...state,
        cryptanalysisInputByProject: {
          ...state.cryptanalysisInputByProject,
          [action.projectId]: action.value,
        },
      };
    case 'setModernAnalysisBaseline':
      return {
        ...state,
        modernAnalysisBaselineByProject: {
          ...state.modernAnalysisBaselineByProject,
          [action.projectId]: action.value,
        },
      };
    case 'setModernAnalysisFlipBit':
      return {
        ...state,
        modernAnalysisFlipBitByProject: {
          ...state.modernAnalysisFlipBitByProject,
          [action.projectId]: Math.max(0, Math.trunc(action.value)),
        },
      };
    case 'setTickedMode':
      return {
        ...state,
        tickedModeByProject: {
          ...state.tickedModeByProject,
          [action.projectId]: action.enabled,
        },
        currentTickByProject: {
          ...state.currentTickByProject,
          [action.projectId]: 0,
        },
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.projectId]: false,
        },
      };
    case 'setCurrentTick':
      return {
        ...state,
        currentTickByProject: {
          ...state.currentTickByProject,
          [action.projectId]: Math.max(0, Math.trunc(action.tick)),
        },
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.projectId]: false,
        },
      };
    case 'setTickPlaybackActive':
      return {
        ...state,
        isTickPlaybackActiveByProject: {
          ...state.isTickPlaybackActiveByProject,
          [action.projectId]: action.active,
        },
      };
    case 'setTickPlaybackSpeed':
      return {
        ...state,
        tickPlaybackSpeedMsByProject: {
          ...state.tickPlaybackSpeedMsByProject,
          [action.projectId]: Math.min(1500, Math.max(100, Math.trunc(action.speedMs))),
        },
      };
    case 'clearComparisonBaseline':
      return {
        ...state,
        comparisonBaselinesByProject: {
          ...state.comparisonBaselinesByProject,
          [action.projectId]: null,
        },
      };
    case 'loadCompositeLibrary':
      return {
        ...state,
        compositeLibrary: [
          ...state.compositeLibrary.filter((entry) => isBuiltInCompositeLibraryEntry(entry)),
          ...action.document.entries
            .map(cloneReusableEntry)
            .filter((entry) => !isBuiltInCompositeLibraryEntry(entry)),
        ],
      };
    case 'addCompositeToLibrary':
      return {
        ...state,
        compositeLibrary: [...state.compositeLibrary, action.entry],
      };
    case 'updateCompositeInLibrary':
      return {
        ...state,
        compositeLibrary: state.compositeLibrary.map((entry) =>
          entry.id === action.entry.id ? action.entry : entry,
        ),
      };
    case 'openCompositeEditor': {
      const entry = state.compositeLibrary.find((candidate) => candidate.id === action.entryId);
      if (!entry || !isCompositeDefinition(entry.definition) || isBuiltInCompositeLibraryEntry(entry)) {
        return state;
      }

      return {
        ...state,
        compositeEditor: {
          entryId: entry.id,
          project: cloneProject(entry.definition.project),
          layout: entry.definition.layout
            ? cloneLayout(entry.definition.layout)
            : createAutoLayout(entry.definition.project),
          originalProject: cloneProject(entry.definition.project),
          originalLayout: entry.definition.layout
            ? cloneLayout(entry.definition.layout)
            : createAutoLayout(entry.definition.project),
          selectedModuleId: entry.definition.project.modules[0]?.id ?? null,
          selectedModuleIds: entry.definition.project.modules[0]?.id
            ? [entry.definition.project.modules[0].id]
            : [],
          paramDrafts: {},
          saveError: null,
        },
      };
    }
    case 'closeCompositeEditor':
      return {
        ...state,
        compositeEditor: null,
      };
    case 'setCompositeEditorSaveError':
      return state.compositeEditor
        ? {
            ...state,
            compositeEditor: {
              ...state.compositeEditor,
              saveError: action.message,
            },
          }
        : state;
    case 'removeCompositeFromLibrary':
      if (
        state.compositeLibrary.some(
          (entry) => entry.id === action.compositeId && isBuiltInCompositeLibraryEntry(entry),
        )
      ) {
        return state;
      }
      return {
        ...state,
        compositeLibrary: state.compositeLibrary.filter((entry) => entry.id !== action.compositeId),
        compositeEditor:
          state.compositeEditor?.entryId === action.compositeId ? null : state.compositeEditor,
      };
    case 'undoWorkspaceHistory': {
      return applyUndoWorkspaceHistory(
        state,
        action.projectId,
        WORKSPACE_HISTORY_LIMIT,
      );
    }
    case 'redoWorkspaceHistory': {
      return applyRedoWorkspaceHistory(
        state,
        action.projectId,
        WORKSPACE_HISTORY_LIMIT,
      );
    }
    case 'saveWorkspaceVersion': {
      return applySaveWorkspaceVersion(state, action.projectId, {
        versionId: action.versionId,
        name: action.name,
        savedAt: action.savedAt,
      });
    }
    case 'restoreWorkspaceVersion':
      return applyRestoreWorkspaceVersion(state, action.projectId, action.versionId);
    case 'togglePalette':
      return {
        ...state,
        showPalette: !state.showPalette,
      };
    case 'toggleInspector':
      return {
        ...state,
        showInspector: !state.showInspector,
      };
    default:
      return state;
  }
}

export function uiReducer(state: UiState, action: UiAction): UiState {
  const projectId = getHistoryProjectId(action);

  if (
    !projectId ||
    !AUTHORING_HISTORY_ACTIONS.has(action.type) ||
    state.compositeEditor
  ) {
    return reduceUiStateCore(state, action);
  }

  const beforeSnapshot = buildWorkspaceHistorySnapshot(state, projectId);
  const nextState = reduceUiStateCore(state, action);
  if (nextState === state || !beforeSnapshot) {
    return nextState;
  }

  return recordWorkspaceHistoryTransition(
    nextState,
    projectId,
    beforeSnapshot,
    WORKSPACE_HISTORY_LIMIT,
  );
}

export function getSelectedModuleId(state: UiState, projectId: string, project: Project): string | null {
  if (state.compositeEditor) {
    return project.modules.some(
      (moduleInstance) => moduleInstance.id === state.compositeEditor?.selectedModuleId,
    )
      ? state.compositeEditor.selectedModuleId
      : (project.modules[0]?.id ?? null);
  }

  const selectedModuleId = state.selectedModuleIdByProject[projectId];
  return project.modules.some((moduleInstance) => moduleInstance.id === selectedModuleId)
    ? selectedModuleId
    : (project.modules[0]?.id ?? null);
}

export function getSelectedModuleIds(state: UiState, projectId: string, project: Project): string[] {
  if (state.compositeEditor) {
    const allowed = new Set(project.modules.map((moduleInstance) => moduleInstance.id));
    const filtered = state.compositeEditor.selectedModuleIds.filter((moduleId) => allowed.has(moduleId));
    return filtered.length > 0 ? filtered : (project.modules[0]?.id ? [project.modules[0].id] : []);
  }

  const allowed = new Set(project.modules.map((moduleInstance) => moduleInstance.id));
  const selectedModuleIds = state.selectedModuleIdsByProject[projectId] ?? [];
  const filtered = selectedModuleIds.filter((moduleId) => allowed.has(moduleId));

  if (filtered.length > 0) {
    return filtered;
  }

  return project.modules[0]?.id ? [project.modules[0].id] : [];
}

export function getDraftValue(
  state: UiState,
  projectId: string,
  moduleId: string,
  key: string,
): string | undefined {
  if (state.compositeEditor) {
    return state.compositeEditor.paramDrafts[`${moduleId}:${key}`];
  }

  return state.paramDrafts[getDraftKey(projectId, moduleId, key)];
}

export function getEffectiveRegistry(
  primitiveRegistry: ModuleRegistry,
  compositeLibrary: CompositeLibraryEntry[],
) {
  return {
    ...primitiveRegistry,
    ...Object.fromEntries(
      compositeLibrary.map((entry) => [entry.id, entry.definition]),
    ),
  };
}

function applyModuleSelection(
  state: UiState,
  projectId: string,
  moduleId: string,
  additive: boolean,
): UiState {
  const currentSelection = state.selectedModuleIdsByProject[projectId] ?? [];

  if (!additive) {
    return {
      ...state,
      selectedModuleIdByProject: {
        ...state.selectedModuleIdByProject,
        [projectId]: moduleId,
      },
      selectedModuleIdsByProject: {
        ...state.selectedModuleIdsByProject,
        [projectId]: [moduleId],
      },
    };
  }

  const isAlreadySelected = currentSelection.includes(moduleId);
  const nextSelection = isAlreadySelected
    ? currentSelection.filter((selectedId) => selectedId !== moduleId)
    : [...currentSelection, moduleId];

  return {
    ...state,
    selectedModuleIdByProject: {
      ...state.selectedModuleIdByProject,
      [projectId]:
        nextSelection[nextSelection.length - 1] ??
        state.selectedModuleIdByProject[projectId] ??
        null,
    },
    selectedModuleIdsByProject: {
      ...state.selectedModuleIdsByProject,
      [projectId]: nextSelection,
    },
  };
}

function applyModuleMultiSelection(
  state: UiState,
  projectId: string,
  moduleIds: string[],
  additive: boolean,
): UiState {
  const normalizedModuleIds = Array.from(new Set(moduleIds));

  if (!additive) {
    return {
      ...state,
      selectedModuleIdByProject: {
        ...state.selectedModuleIdByProject,
        [projectId]: normalizedModuleIds[0] ?? null,
      },
      selectedModuleIdsByProject: {
        ...state.selectedModuleIdsByProject,
        [projectId]: normalizedModuleIds,
      },
    };
  }

  const currentSelection = state.selectedModuleIdsByProject[projectId] ?? [];
  const nextSelection = Array.from(new Set([...currentSelection, ...normalizedModuleIds]));

  return {
    ...state,
    selectedModuleIdByProject: {
      ...state.selectedModuleIdByProject,
      [projectId]:
        normalizedModuleIds[0] ??
        state.selectedModuleIdByProject[projectId] ??
        null,
    },
    selectedModuleIdsByProject: {
      ...state.selectedModuleIdsByProject,
      [projectId]: nextSelection,
    },
  };
}

function removeProjectEntry<T>(
  record: Record<string, T>,
  projectId: string,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([candidateProjectId]) => candidateProjectId !== projectId),
  );
}

function createAutoLayout(project: Project): Record<string, CompositeLayoutPosition> {
  return Object.fromEntries(
    project.modules.map((moduleInstance, index) => [
      moduleInstance.id,
      {
        x: 48 + (index % 4) * 188,
        y: 72 + Math.floor(index / 4) * 120,
      },
    ]),
  );
}

function createTidiedLayout(
  project: Project,
  currentLayout: Record<string, CompositeLayoutPosition>,
): Record<string, CompositeLayoutPosition> {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  const layerByModuleId = new Map<string, number>();

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

  const positionSort = (leftId: string, rightId: string) => {
    const leftPosition = currentLayout[leftId] ?? { x: 0, y: 0 };
    const rightPosition = currentLayout[rightId] ?? { x: 0, y: 0 };
    if (leftPosition.x !== rightPosition.x) {
      return leftPosition.x - rightPosition.x;
    }
    if (leftPosition.y !== rightPosition.y) {
      return leftPosition.y - rightPosition.y;
    }
    return leftId.localeCompare(rightId);
  };

  const queue = project.modules
    .map((moduleInstance) => moduleInstance.id)
    .filter((moduleId) => (indegree.get(moduleId) ?? 0) === 0)
    .sort(positionSort);
  const processed = new Set<string>();

  while (queue.length > 0) {
    const moduleId = queue.shift();
    if (!moduleId || processed.has(moduleId)) {
      continue;
    }
    processed.add(moduleId);

    for (const targetModuleId of adjacency.get(moduleId) ?? []) {
      layerByModuleId.set(
        targetModuleId,
        Math.max(
          layerByModuleId.get(targetModuleId) ?? 0,
          (layerByModuleId.get(moduleId) ?? 0) + 1,
        ),
      );
      const nextIndegree = (indegree.get(targetModuleId) ?? 0) - 1;
      indegree.set(targetModuleId, nextIndegree);
      if (nextIndegree === 0) {
        queue.push(targetModuleId);
        queue.sort(positionSort);
      }
    }
  }

  const remainingModuleIds = project.modules
    .map((moduleInstance) => moduleInstance.id)
    .filter((moduleId) => !processed.has(moduleId))
    .sort(positionSort);

  for (const moduleId of remainingModuleIds) {
    const inboundLayers = project.connections
      .filter((connection) => connection.to.moduleId === moduleId)
      .map((connection) => (layerByModuleId.get(connection.from.moduleId) ?? 0) + 1);
    layerByModuleId.set(moduleId, inboundLayers.length > 0 ? Math.max(...inboundLayers) : 0);
  }

  const modulesByLayer = new Map<number, string[]>();
  for (const moduleInstance of project.modules) {
    const layer = layerByModuleId.get(moduleInstance.id) ?? 0;
    modulesByLayer.set(layer, [...(modulesByLayer.get(layer) ?? []), moduleInstance.id]);
  }

  const columnXStart = 48;
  const rowYStart = 72;
  const columnGap = 244;
  const rowGap = 148;

  return Object.fromEntries(
    [...modulesByLayer.entries()]
      .sort(([leftLayer], [rightLayer]) => leftLayer - rightLayer)
      .flatMap(([layer, moduleIds]) =>
        moduleIds
          .sort((leftId, rightId) => {
            const leftPosition = currentLayout[leftId] ?? { x: 0, y: 0 };
            const rightPosition = currentLayout[rightId] ?? { x: 0, y: 0 };
            if (leftPosition.y !== rightPosition.y) {
              return leftPosition.y - rightPosition.y;
            }
            if (leftPosition.x !== rightPosition.x) {
              return leftPosition.x - rightPosition.x;
            }
            return leftId.localeCompare(rightId);
          })
          .map((moduleId, rowIndex) => [
            moduleId,
            {
              x: columnXStart + layer * columnGap,
              y: rowYStart + rowIndex * rowGap,
            },
          ]),
      ),
  );
}

function applyCompositeEditorSelection(
  editor: CompositeEditorState,
  moduleId: string,
  additive: boolean,
): CompositeEditorState {
  if (!additive) {
    return {
      ...editor,
      selectedModuleId: moduleId,
      selectedModuleIds: [moduleId],
      saveError: null,
    };
  }

  const isSelected = editor.selectedModuleIds.includes(moduleId);
  const nextSelectedModuleIds = isSelected
    ? editor.selectedModuleIds.filter((selectedId) => selectedId !== moduleId)
    : [...editor.selectedModuleIds, moduleId];

  return {
    ...editor,
    selectedModuleId:
      nextSelectedModuleIds[nextSelectedModuleIds.length - 1] ?? editor.selectedModuleId,
    selectedModuleIds: nextSelectedModuleIds,
    saveError: null,
  };
}

function applyCompositeEditorMultiSelection(
  editor: CompositeEditorState,
  moduleIds: string[],
  additive: boolean,
): CompositeEditorState {
  const normalizedModuleIds = Array.from(new Set(moduleIds));

  if (!additive) {
    return {
      ...editor,
      selectedModuleId: normalizedModuleIds[0] ?? null,
      selectedModuleIds: normalizedModuleIds,
    };
  }

  const nextSelectedModuleIds = Array.from(
    new Set([...editor.selectedModuleIds, ...normalizedModuleIds]),
  );

  return {
    ...editor,
    selectedModuleId: normalizedModuleIds[0] ?? editor.selectedModuleId,
    selectedModuleIds: nextSelectedModuleIds,
  };
}

function addModuleToCompositeEditor(
  editor: CompositeEditorState,
  moduleDef: ModuleDefinition,
): CompositeEditorState {
  const nextModuleId = createModuleId(editor.project, moduleDef.id);
  const positions = Object.values(editor.layout);
  const occupied = new Set(positions.map((position) => `${position.x},${position.y}`));
  let x = 40;
  let y = 40;

  while (occupied.has(`${x},${y}`)) {
    x += 160;
    if (x > 700) {
      x = 40;
      y += 100;
    }
  }

  return {
    ...editor,
    project: {
      ...cloneProject(editor.project),
      modules: [
        ...editor.project.modules,
        {
          id: nextModuleId,
          defId: moduleDef.id,
          params: buildDefaultParams(moduleDef),
        },
      ],
    },
    layout: {
      ...editor.layout,
      [nextModuleId]: { x, y },
    },
    selectedModuleId: nextModuleId,
    selectedModuleIds: [nextModuleId],
    saveError: null,
  };
}

function removeModuleFromCompositeEditor(
  editor: CompositeEditorState,
  moduleId: string,
): CompositeEditorState {
  const nextProject = cloneProject(editor.project);
  nextProject.modules = nextProject.modules.filter((moduleInstance) => moduleInstance.id !== moduleId);
  nextProject.connections = nextProject.connections.filter(
    (connection) =>
      connection.from.moduleId !== moduleId && connection.to.moduleId !== moduleId,
  );
  const nextLayout = { ...editor.layout };
  delete nextLayout[moduleId];

  return {
    ...editor,
    project: nextProject,
    layout: nextLayout,
    selectedModuleId: nextProject.modules[0]?.id ?? null,
    selectedModuleIds: nextProject.modules[0]?.id ? [nextProject.modules[0].id] : [],
    paramDrafts: Object.fromEntries(
      Object.entries(editor.paramDrafts).filter(([key]) => !key.startsWith(`${moduleId}:`)),
    ),
    saveError: null,
  };
}

function addConnectionToCompositeEditor(
  editor: CompositeEditorState,
  action: Extract<UiAction, { type: 'addConnection' }>,
): CompositeEditorState {
  const alreadyExists = editor.project.connections.some(
    (connection) =>
      connection.from.moduleId === action.fromModuleId &&
      connection.from.port === action.fromPort &&
      connection.to.moduleId === action.toModuleId &&
      connection.to.port === action.toPort,
  );
  if (alreadyExists) {
    return editor;
  }

  return {
    ...editor,
    project: {
      ...cloneProject(editor.project),
      connections: [
        ...editor.project.connections,
        {
          from: { moduleId: action.fromModuleId, port: action.fromPort },
          to: { moduleId: action.toModuleId, port: action.toPort },
        },
      ],
    },
    saveError: null,
  };
}

function removeConnectionFromCompositeEditor(
  editor: CompositeEditorState,
  connectionIndex: number,
): CompositeEditorState {
  return {
    ...editor,
    project: {
      ...cloneProject(editor.project),
      connections: editor.project.connections.filter((_, index) => index !== connectionIndex),
    },
    saveError: null,
  };
}

function replaceConnectionInCompositeEditor(
  editor: CompositeEditorState,
  action: Extract<UiAction, { type: 'replaceConnection' }>,
): CompositeEditorState {
  const uniqueRemovals = [...new Set(action.removeConnectionIndices)].sort((a, b) => a - b);
  const nextConnections = editor.project.connections.filter(
    (_, index) => !uniqueRemovals.includes(index),
  );
  const alreadyExists = nextConnections.some(
    (connection) =>
      connection.from.moduleId === action.fromModuleId &&
      connection.from.port === action.fromPort &&
      connection.to.moduleId === action.toModuleId &&
      connection.to.port === action.toPort,
  );
  if (alreadyExists) {
    return editor;
  }

  return {
    ...editor,
    project: {
      ...cloneProject(editor.project),
      connections: [
        ...nextConnections,
        {
          from: { moduleId: action.fromModuleId, port: action.fromPort },
          to: { moduleId: action.toModuleId, port: action.toPort },
        },
      ],
    },
    saveError: null,
  };
}

function applyCopiedParamsToCompositeEditor(
  editor: CompositeEditorState,
  action: Extract<UiAction, { type: 'applyCopiedParams' }>,
): CompositeEditorState {
  if (action.paramKeys.length === 0) {
    return editor;
  }

  const targetSet = new Set(action.targetModuleIds);
  let changed = false;
  const nextProject = cloneProject(editor.project);
  nextProject.modules = nextProject.modules.map((moduleInstance) => {
    if (
      moduleInstance.id === action.sourceModuleId ||
      !targetSet.has(moduleInstance.id) ||
      moduleInstance.defId !== action.sourceDefId
    ) {
      return moduleInstance;
    }

    changed = true;
    return {
      ...moduleInstance,
      params: {
        ...moduleInstance.params,
        ...Object.fromEntries(action.paramKeys.map((key) => [key, action.params[key]])),
      },
    };
  });

  if (!changed) {
    return editor;
  }

  const nextDrafts = { ...editor.paramDrafts };
  for (const moduleId of action.targetModuleIds) {
    for (const key of action.paramKeys) {
      delete nextDrafts[`${moduleId}:${key}`];
    }
  }

  return {
    ...editor,
    project: nextProject,
    paramDrafts: nextDrafts,
    saveError: null,
  };
}

function updateCompositeEditorParam(
  editor: CompositeEditorState,
  moduleId: string,
  key: string,
  value: unknown,
): CompositeEditorState {
  return {
    ...editor,
    project: updateModule(editor.project, moduleId, (moduleInstance) => ({
      ...moduleInstance,
      params: {
        ...moduleInstance.params,
        [key]: value,
      },
    })),
    paramDrafts: omitDraftKey(editor.paramDrafts, `${moduleId}:${key}`),
    saveError: null,
  };
}

function updateCompositeEditorBypass(
  editor: CompositeEditorState,
  moduleId: string,
  bypass: boolean,
): CompositeEditorState {
  return {
    ...editor,
    project: updateModule(editor.project, moduleId, (moduleInstance) => ({
      ...moduleInstance,
      bypass,
    })),
    saveError: null,
  };
}

function omitDraftKey(drafts: Record<string, string>, key: string) {
  const nextDrafts = { ...drafts };
  delete nextDrafts[key];
  return nextDrafts;
}

function connectionTouchesProtectedBoundaryPort(
  entry: CompositeLibraryEntry,
  action: {
    fromModuleId: string;
    fromPort: string;
    toModuleId: string;
    toPort: string;
  },
) {
  if (!isCompositeDefinition(entry.definition)) {
    return false;
  }
  return (
    entry.definition.inputBindings.some(
      (binding) =>
        binding.internalModuleId === action.toModuleId &&
        binding.internalPort === action.toPort,
    ) ||
    entry.definition.outputBindings.some(
      (binding) =>
        binding.internalModuleId === action.fromModuleId &&
        binding.internalPort === action.fromPort,
    )
  );
}

function connectionIndexTouchesProtectedBoundaryPort(
  entry: CompositeLibraryEntry,
  project: Project,
  connectionIndex: number,
) {
  if (!isCompositeDefinition(entry.definition)) {
    return false;
  }
  const connection = project.connections[connectionIndex];
  if (!connection) {
    return false;
  }

  return (
    entry.definition.inputBindings.some(
      (binding) =>
        binding.internalModuleId === connection.to.moduleId &&
        binding.internalPort === connection.to.port,
    ) ||
    entry.definition.outputBindings.some(
      (binding) =>
        binding.internalModuleId === connection.from.moduleId &&
        binding.internalPort === connection.from.port,
    )
  );
}

function replacementTouchesProtectedBoundaryPort(
  entry: CompositeLibraryEntry,
  project: Project,
  action: Extract<UiAction, { type: 'replaceConnection' }>,
) {
  return (
    connectionTouchesProtectedBoundaryPort(entry, action) ||
    action.removeConnectionIndices.some((connectionIndex) =>
      connectionIndexTouchesProtectedBoundaryPort(entry, project, connectionIndex),
    )
  );
}
