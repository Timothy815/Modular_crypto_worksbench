import type { CompositeDef, CompositeLibraryEntry } from '../engine/composites';
import type { Project } from '../engine/types';
import type { DemoProject } from './demo-projects';
import type { UiState } from './store';
import type {
  CompositeLibraryDocument,
  PersistedWorkspaceDocument,
  WorkbenchAnnotation,
  WorkbenchDocument,
} from './workbench-document';

const STORAGE_KEY = 'mcw:workspace:v1';

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

function cloneAnnotations(annotations: WorkbenchAnnotation[]): WorkbenchAnnotation[] {
  return annotations.map((annotation) => ({ ...annotation }));
}

function buildDefaultDocument(project: DemoProject): WorkbenchDocument {
  return {
    version: 1,
    project: cloneProject(project.project),
    ui: {
      layout: Object.fromEntries(
        Object.entries(project.layout).map(([moduleId, position]) => [
          moduleId,
          { ...position },
        ]),
      ),
      annotations: [],
    },
  };
}

export function createDocumentMapFromDemos(
  projects: DemoProject[],
): Record<string, WorkbenchDocument> {
  return Object.fromEntries(
    projects.map((project) => [project.id, buildDefaultDocument(project)]),
  );
}

export function buildPersistedWorkspace(state: UiState): PersistedWorkspaceDocument {
  return {
    version: 1,
    activeProjectId: state.activeProjectId,
    showPalette: state.showPalette,
    showInspector: state.showInspector,
    documentsByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        {
          version: 1,
          project: cloneProject(state.projectStates[projectId]),
          ui: {
            layout: Object.fromEntries(
              Object.entries(state.layoutByProject[projectId] ?? {}).map(
                ([moduleId, position]) => [moduleId, { ...position }],
              ),
            ),
            annotations: cloneAnnotations(state.annotationsByProject[projectId] ?? []),
          },
        },
      ]),
    ),
    compositeLibrary: {
      version: 1,
      entries: state.compositeLibrary.map((entry) => ({
        ...entry,
        definition: {
          ...entry.definition,
          project: cloneProject(entry.definition.project),
          inputBindings: entry.definition.inputBindings.map((binding) => ({ ...binding })),
          outputBindings: entry.definition.outputBindings.map((binding) => ({ ...binding })),
        },
      })),
    },
  };
}

export function saveWorkspaceToStorage(
  state: UiState,
  storage: Storage = window.localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedWorkspace(state)));
}

export function loadWorkspaceFromStorage(
  projects: DemoProject[],
  storage: Storage = window.localStorage,
): PersistedWorkspaceDocument | null {
  const rawValue = storage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PersistedWorkspaceDocument;
    if (
      parsed.version !== 1 ||
      typeof parsed.activeProjectId !== 'string' ||
      typeof parsed.showPalette !== 'boolean' ||
      typeof parsed.showInspector !== 'boolean' ||
      typeof parsed.documentsByProjectId !== 'object' ||
      parsed.documentsByProjectId === null ||
      !isCompositeLibraryDocument(parsed.compositeLibrary)
    ) {
      return null;
    }

    const allowedProjectIds = new Set(projects.map((project) => project.id));
    const filteredDocuments = Object.fromEntries(
      Object.entries(parsed.documentsByProjectId).filter(([projectId, document]) =>
        allowedProjectIds.has(projectId) && isWorkbenchDocument(document),
      ),
    );

    return {
      ...parsed,
      activeProjectId: allowedProjectIds.has(parsed.activeProjectId)
        ? parsed.activeProjectId
        : projects[0]?.id ?? '',
      documentsByProjectId: filteredDocuments,
    };
  } catch {
    return null;
  }
}

export function downloadDocument(projectId: string, workbenchDocument: WorkbenchDocument): void {
  const blob = new Blob([JSON.stringify(workbenchDocument, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${projectId}.mcw.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseWorkbenchDocument(rawValue: string): WorkbenchDocument | null {
  try {
    const parsed = JSON.parse(rawValue);
    return isWorkbenchDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseCompositeLibraryDocument(
  rawValue: string,
): CompositeLibraryDocument | null {
  try {
    const parsed = JSON.parse(rawValue);
    return isCompositeLibraryDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function downloadCompositeLibraryDocument(
  libraryDocument: CompositeLibraryDocument,
): void {
  const blob = new Blob([JSON.stringify(libraryDocument, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'composite-library.mcw.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function isWorkbenchDocument(value: unknown): value is WorkbenchDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as WorkbenchDocument;
  return (
    candidate.version === 1 &&
    typeof candidate.project === 'object' &&
    candidate.project !== null &&
    Array.isArray(candidate.project.modules) &&
    Array.isArray(candidate.project.connections) &&
    typeof candidate.ui === 'object' &&
    candidate.ui !== null &&
    typeof candidate.ui.layout === 'object' &&
    candidate.ui.layout !== null &&
    Array.isArray(candidate.ui.annotations)
  );
}

function isCompositeLibraryDocument(value: unknown): value is CompositeLibraryDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as CompositeLibraryDocument;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every(isCompositeLibraryEntry)
  );
}

function isCompositeLibraryEntry(value: unknown): value is CompositeLibraryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as CompositeLibraryEntry;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'number' &&
    isCompositeDef(candidate.definition)
  );
}

function isCompositeDef(value: unknown): value is CompositeDef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as CompositeDef;
  return (
    candidate.kind === 'composite' &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'number' &&
    Array.isArray(candidate.inputs) &&
    Array.isArray(candidate.outputs) &&
    typeof candidate.paramSchema === 'object' &&
    candidate.paramSchema !== null &&
    typeof candidate.project === 'object' &&
    candidate.project !== null &&
    Array.isArray(candidate.project.modules) &&
    Array.isArray(candidate.project.connections) &&
    Array.isArray(candidate.inputBindings) &&
    Array.isArray(candidate.outputBindings)
  );
}
