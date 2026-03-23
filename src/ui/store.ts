import {
  isCompositeDefinition,
  type CompositeLibraryEntry,
  type CompositeLayoutPosition,
} from '../engine/composites';
import type { ModuleDefinition, ModuleInstance, ModuleRegistry, Project } from '../engine/types';
import type { GuidedChallenge } from './challenges';
import type { GuidedTutorial } from './tutorials';
import type { DemoProject } from './demo-projects';
import { STARTER_COMPOSITE_LIBRARY } from './starter-composites';
import { STARTER_CHALLENGES } from './starter-challenges';
import { STARTER_TUTORIALS } from './starter-tutorials';
import type {
  ComparisonBaselineDocument,
  CompositeLibraryDocument,
  WorkbenchAnnotation,
  WorkbenchDocument,
} from './workbench-document';

export interface UiState {
  activeProjectId: string;
  challengeLibrary: GuidedChallenge[];
  tutorialLibrary: GuidedTutorial[];
  compositeLibrary: CompositeLibraryEntry[];
  compositeEditor: CompositeEditorState | null;
  projectStates: Record<string, Project>;
  layoutByProject: Record<string, Record<string, { x: number; y: number }>>;
  annotationsByProject: Record<string, WorkbenchAnnotation[]>;
  comparisonBaselinesByProject: Record<string, ComparisonBaselineDocument | null>;
  activeChallengeIdByProject: Record<string, string | null>;
  activeTutorialIdByProject: Record<string, string | null>;
  activeTutorialStepByProject: Record<string, number>;
  completedTutorialsByProject: Record<string, string[]>;
  probedModuleIdsByProject: Record<string, string[]>;
  workspaceModeByProject: Record<string, 'build' | 'guide'>;
  tickedModeByProject: Record<string, boolean>;
  currentTickByProject: Record<string, number>;
  isTickPlaybackActiveByProject: Record<string, boolean>;
  tickPlaybackSpeedMsByProject: Record<string, number>;
  selectedModuleIdByProject: Record<string, string | null>;
  selectedModuleIdsByProject: Record<string, string[]>;
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
  | { type: 'selectModule'; projectId: string; moduleId: string; additive?: boolean }
  | { type: 'moveModule'; projectId: string; moduleId: string; x: number; y: number }
  | { type: 'addAnnotation'; projectId: string }
  | { type: 'moveAnnotation'; projectId: string; annotationId: string; x: number; y: number }
  | { type: 'updateAnnotationText'; projectId: string; annotationId: string; text: string }
  | { type: 'removeAnnotation'; projectId: string; annotationId: string }
  | { type: 'addModule'; projectId: string; moduleDef: ModuleDefinition }
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
  | { type: 'updateParam'; projectId: string; moduleId: string; key: string; value: unknown }
  | { type: 'setParamDraft'; projectId: string; moduleId: string; key: string; rawValue: string }
  | { type: 'clearParamDraft'; projectId: string; moduleId: string; key: string }
  | { type: 'loadDocument'; projectId: string; document: WorkbenchDocument }
  | { type: 'selectChallenge'; projectId: string; challengeId: string | null }
  | { type: 'upsertChallenge'; challenge: GuidedChallenge }
  | { type: 'selectTutorial'; projectId: string; tutorialId: string | null }
  | { type: 'setTutorialStep'; projectId: string; stepIndex: number }
  | { type: 'completeTutorial'; projectId: string; tutorialId: string }
  | { type: 'resetTutorialProgress'; projectId: string }
  | { type: 'toggleProbe'; projectId: string; moduleId: string }
  | { type: 'clearProbes'; projectId: string }
  | { type: 'setWorkspaceMode'; projectId: string; mode: 'build' | 'guide' }
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
  | { type: 'toggleInspector' };

export function cloneProject(project: Project): Project {
  return {
    modules: project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    })),
    connections: project.connections.map((connection) => ({
      from: { ...connection.from },
      to: { ...connection.to },
    })),
  };
}

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
      projects.map((project) => [project.id, defaultChallengeId]),
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
    probedModuleIdsByProject: Object.fromEntries(
      projects.map((project) => [project.id, []]),
    ),
    workspaceModeByProject: Object.fromEntries(
      projects.map((project) => [project.id, 'guide' as const]),
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
    paramDrafts: {},
    showPalette: true,
    showInspector: true,
  };
}

function cloneReusableEntry(entry: CompositeLibraryEntry): CompositeLibraryEntry {
  if (isCompositeDefinition(entry.definition)) {
    return {
      ...entry,
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
    definition: { ...entry.definition },
  };
}

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'switchProject':
      return {
        ...state,
        activeProjectId: action.projectId,
      };
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
    case 'setWorkspaceMode':
      return {
        ...state,
        workspaceModeByProject: {
          ...state.workspaceModeByProject,
          [action.projectId]: action.mode,
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
        compositeLibrary: action.document.entries.map(cloneReusableEntry),
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
      if (!entry || !isCompositeDefinition(entry.definition)) {
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
      return {
        ...state,
        compositeLibrary: state.compositeLibrary.filter((entry) => entry.id !== action.compositeId),
        compositeEditor:
          state.compositeEditor?.entryId === action.compositeId ? null : state.compositeEditor,
      };
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

function cloneLayout(
  layout: Record<string, CompositeLayoutPosition>,
): Record<string, CompositeLayoutPosition> {
  return Object.fromEntries(
    Object.entries(layout).map(([moduleId, position]) => [moduleId, { ...position }]),
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

function omitDraftKey(drafts: Record<string, string>, key: string) {
  const nextDrafts = { ...drafts };
  delete nextDrafts[key];
  return nextDrafts;
}

function connectionTouchesProtectedBoundaryPort(
  entry: CompositeLibraryEntry,
  action: Extract<UiAction, { type: 'addConnection' }>,
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
