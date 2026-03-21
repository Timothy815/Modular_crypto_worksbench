import type { CompositeLibraryEntry } from '../engine/composites';
import type { ModuleDefinition, ModuleInstance, ModuleRegistry, Project } from '../engine/types';
import type { DemoProject } from './demo-projects';
import { STARTER_COMPOSITE_LIBRARY } from './starter-composites';
import type {
  CompositeLibraryDocument,
  WorkbenchAnnotation,
  WorkbenchDocument,
} from './workbench-document';

export interface UiState {
  activeProjectId: string;
  compositeLibrary: CompositeLibraryEntry[];
  projectStates: Record<string, Project>;
  layoutByProject: Record<string, Record<string, { x: number; y: number }>>;
  annotationsByProject: Record<string, WorkbenchAnnotation[]>;
  selectedModuleIdByProject: Record<string, string | null>;
  selectedModuleIdsByProject: Record<string, string[]>;
  paramDrafts: Record<string, string>;
  showPalette: boolean;
  showInspector: boolean;
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
  | { type: 'loadCompositeLibrary'; document: CompositeLibraryDocument }
  | { type: 'addCompositeToLibrary'; entry: CompositeLibraryEntry }
  | { type: 'removeCompositeFromLibrary'; compositeId: string }
  | { type: 'togglePalette' }
  | { type: 'toggleInspector' };

function cloneProject(project: Project): Project {
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
  return {
    activeProjectId: projects[0]?.id ?? '',
    compositeLibrary: STARTER_COMPOSITE_LIBRARY.map((entry) => ({
      ...entry,
      definition: {
        ...entry.definition,
        project: cloneProject(entry.definition.project),
        inputBindings: entry.definition.inputBindings.map((binding) => ({ ...binding })),
        outputBindings: entry.definition.outputBindings.map((binding) => ({ ...binding })),
      },
    })),
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

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'switchProject':
      return {
        ...state,
        activeProjectId: action.projectId,
      };
    case 'selectModule':
      return applyModuleSelection(
        state,
        action.projectId,
        action.moduleId,
        action.additive ?? false,
      );
    case 'moveModule': {
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
        paramDrafts: nextDrafts,
      };
    }
    case 'addConnection': {
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
      return {
        ...state,
        paramDrafts: {
          ...state.paramDrafts,
          [getDraftKey(action.projectId, action.moduleId, action.key)]: action.rawValue,
        },
      };
    case 'clearParamDraft': {
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
        paramDrafts: nextDrafts,
      };
    }
    case 'loadCompositeLibrary':
      return {
        ...state,
        compositeLibrary: action.document.entries.map((entry) => ({
          ...entry,
          definition: {
            ...entry.definition,
            project: cloneProject(entry.definition.project),
            inputBindings: entry.definition.inputBindings.map((binding) => ({ ...binding })),
            outputBindings: entry.definition.outputBindings.map((binding) => ({ ...binding })),
          },
        })),
      };
    case 'addCompositeToLibrary':
      return {
        ...state,
        compositeLibrary: [...state.compositeLibrary, action.entry],
      };
    case 'removeCompositeFromLibrary':
      return {
        ...state,
        compositeLibrary: state.compositeLibrary.filter((entry) => entry.id !== action.compositeId),
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
  const selectedModuleId = state.selectedModuleIdByProject[projectId];
  return project.modules.some((moduleInstance) => moduleInstance.id === selectedModuleId)
    ? selectedModuleId
    : (project.modules[0]?.id ?? null);
}

export function getSelectedModuleIds(state: UiState, projectId: string, project: Project): string[] {
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
