import type { ModuleDef, ModuleInstance, Project } from '../engine/types';
import type { DemoProject } from './demo-projects';

export interface UiState {
  activeProjectId: string;
  projectStates: Record<string, Project>;
  layoutByProject: Record<string, Record<string, { x: number; y: number }>>;
  selectedModuleIdByProject: Record<string, string | null>;
  paramDrafts: Record<string, string>;
  showPalette: boolean;
  showInspector: boolean;
}

export type UiAction =
  | { type: 'switchProject'; projectId: string }
  | { type: 'selectModule'; projectId: string; moduleId: string }
  | { type: 'moveModule'; projectId: string; moduleId: string; x: number; y: number }
  | { type: 'addModule'; projectId: string; moduleDef: ModuleDef }
  | { type: 'removeModule'; projectId: string; moduleId: string }
  | { type: 'updateParam'; projectId: string; moduleId: string; key: string; value: unknown }
  | { type: 'setParamDraft'; projectId: string; moduleId: string; key: string; rawValue: string }
  | { type: 'clearParamDraft'; projectId: string; moduleId: string; key: string }
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

function buildDefaultParams(moduleDef: ModuleDef) {
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
    selectedModuleIdByProject: Object.fromEntries(
      projects.map((project) => [project.id, project.project.modules[0]?.id ?? null]),
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
      return {
        ...state,
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: action.moduleId,
        },
      };
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

      const maxX = Math.max(24, ...Object.values(currentLayout).map((position) => position.x));
      const maxY = Math.max(24, ...Object.values(currentLayout).map((position) => position.y));

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
              x: maxX + 180,
              y: maxY + 40,
            },
          },
        },
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: nextModuleId,
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
        selectedModuleIdByProject: {
          ...state.selectedModuleIdByProject,
          [action.projectId]: nextProject.modules[0]?.id ?? null,
        },
        paramDrafts: nextDrafts,
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

export function getDraftValue(
  state: UiState,
  projectId: string,
  moduleId: string,
  key: string,
): string | undefined {
  return state.paramDrafts[getDraftKey(projectId, moduleId, key)];
}
