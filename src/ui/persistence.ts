import type { CompositeDef, CompositeLibraryEntry } from '../engine/composites';
import type { Project } from '../engine/types';
import type { DemoProject } from './demo-projects';
import type { GuidedChallenge } from './challenges';
import type { GuidedTutorial } from './tutorials';
import type { UiState } from './store';
import type {
  ComparisonBaselineDocument,
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

function cloneComparisonBaseline(
  baseline: ComparisonBaselineDocument | null,
): ComparisonBaselineDocument | null {
  return baseline
    ? {
        project: cloneProject(baseline.project),
        capturedAt: baseline.capturedAt,
      }
    : null;
}

function cloneChallenge(challenge: GuidedChallenge): GuidedChallenge {
  return {
    ...challenge,
    version: 1,
    startingProject: cloneProject(challenge.startingProject),
    startingLayout: challenge.startingLayout
      ? Object.fromEntries(
          Object.entries(challenge.startingLayout).map(([moduleId, position]) => [
            moduleId,
            { ...position },
          ]),
        )
      : undefined,
    targetProject: cloneProject(challenge.targetProject),
    hints: challenge.hints ? [...challenge.hints] : undefined,
  };
}

function cloneTutorial(tutorial: GuidedTutorial): GuidedTutorial {
  return {
    ...tutorial,
    version: 1,
    steps: tutorial.steps.map((step) => ({ ...step })),
  };
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
    comparisonBaselinesByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        cloneComparisonBaseline(state.comparisonBaselinesByProject[projectId]),
      ]),
    ),
    activeChallengeIdByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.activeChallengeIdByProject[projectId] ?? null,
      ]),
    ),
    activeTutorialIdByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.activeTutorialIdByProject[projectId] ?? null,
      ]),
    ),
    activeTutorialStepByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.activeTutorialStepByProject[projectId] ?? 0,
      ]),
    ),
    completedTutorialsByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.completedTutorialsByProject[projectId] ?? [],
      ]),
    ),
    challengeLibrary: state.challengeLibrary.map(cloneChallenge),
    tutorialLibrary: state.tutorialLibrary.map(cloneTutorial),
    compositeLibrary: {
      version: 1,
      entries: state.compositeLibrary.map((entry) => ({
        ...entry,
        definition: {
          ...entry.definition,
          project: cloneProject(entry.definition.project),
          layout: entry.definition.layout
            ? Object.fromEntries(
                Object.entries(entry.definition.layout).map(([moduleId, position]) => [
                  moduleId,
                  { ...position },
                ]),
              )
            : undefined,
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
      typeof parsed.comparisonBaselinesByProjectId !== 'object' ||
      parsed.comparisonBaselinesByProjectId === null ||
      typeof parsed.activeChallengeIdByProjectId !== 'object' ||
      parsed.activeChallengeIdByProjectId === null ||
      typeof parsed.activeTutorialIdByProjectId !== 'object' ||
      parsed.activeTutorialIdByProjectId === null ||
      typeof parsed.activeTutorialStepByProjectId !== 'object' ||
      parsed.activeTutorialStepByProjectId === null ||
      !Array.isArray(parsed.challengeLibrary) ||
      !parsed.challengeLibrary.every(isGuidedChallengeDocument) ||
      !Array.isArray(parsed.tutorialLibrary) ||
      !parsed.tutorialLibrary.every(isGuidedTutorialDocument) ||
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
      comparisonBaselinesByProjectId: Object.fromEntries(
        Object.entries(parsed.comparisonBaselinesByProjectId).filter(
          ([projectId, baseline]) =>
            allowedProjectIds.has(projectId) &&
            (baseline === null || isComparisonBaselineDocument(baseline)),
        ),
      ),
      activeChallengeIdByProjectId: Object.fromEntries(
        Object.entries(parsed.activeChallengeIdByProjectId).filter(
          ([projectId, challengeId]) =>
            allowedProjectIds.has(projectId) &&
            (challengeId === null || typeof challengeId === 'string'),
        ),
      ),
      activeTutorialIdByProjectId: Object.fromEntries(
        Object.entries(parsed.activeTutorialIdByProjectId).filter(
          ([projectId, tutorialId]) =>
            allowedProjectIds.has(projectId) &&
            (tutorialId === null || typeof tutorialId === 'string'),
        ),
      ),
      activeTutorialStepByProjectId: Object.fromEntries(
        Object.entries(parsed.activeTutorialStepByProjectId).filter(
          ([projectId, stepIndex]) =>
            allowedProjectIds.has(projectId) &&
            typeof stepIndex === 'number' &&
            Number.isFinite(stepIndex),
        ),
      ),
      completedTutorialsByProjectId: Object.fromEntries(
        Object.entries(parsed.completedTutorialsByProjectId ?? {}).filter(
          ([projectId, ids]) =>
            allowedProjectIds.has(projectId) &&
            Array.isArray(ids) &&
            ids.every((id) => typeof id === 'string'),
        ),
      ),
      challengeLibrary: parsed.challengeLibrary.map(cloneChallenge),
      tutorialLibrary: parsed.tutorialLibrary.map(cloneTutorial),
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

export function parseGuidedChallengeDocument(rawValue: string): GuidedChallenge | null {
  try {
    const parsed = JSON.parse(rawValue);
    return isGuidedChallengeDocument(parsed) ? cloneChallenge(parsed) : null;
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

export function downloadGuidedChallengeDocument(challenge: GuidedChallenge): void {
  const blob = new Blob([JSON.stringify(cloneChallenge(challenge), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${challenge.id}.challenge.json`;
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

function isComparisonBaselineDocument(value: unknown): value is ComparisonBaselineDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as ComparisonBaselineDocument;
  return (
    typeof candidate.capturedAt === 'string' &&
    typeof candidate.project === 'object' &&
    candidate.project !== null &&
    Array.isArray(candidate.project.modules) &&
    Array.isArray(candidate.project.connections)
  );
}

function isGuidedChallengeDocument(value: unknown): value is GuidedChallenge {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as GuidedChallenge;
  return (
    (candidate.version === undefined || candidate.version === 1) &&
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.prompt === 'string' &&
    typeof candidate.startingProject === 'object' &&
    candidate.startingProject !== null &&
    Array.isArray(candidate.startingProject.modules) &&
    Array.isArray(candidate.startingProject.connections) &&
    (candidate.startingLayout === undefined ||
      (typeof candidate.startingLayout === 'object' && candidate.startingLayout !== null)) &&
    typeof candidate.targetProject === 'object' &&
    candidate.targetProject !== null &&
    Array.isArray(candidate.targetProject.modules) &&
    Array.isArray(candidate.targetProject.connections) &&
    typeof candidate.success === 'object' &&
    candidate.success !== null &&
    candidate.success.kind === 'output-match-target' &&
    (candidate.hints === undefined ||
      (Array.isArray(candidate.hints) && candidate.hints.every((hint) => typeof hint === 'string')))
  );
}

function isGuidedTutorialDocument(value: unknown): value is GuidedTutorial {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as GuidedTutorial;
  return (
    (candidate.version === undefined || candidate.version === 1) &&
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.projectId === 'string' &&
    Array.isArray(candidate.steps) &&
    candidate.steps.every(
      (step) =>
        typeof step.id === 'string' &&
        typeof step.title === 'string' &&
        typeof step.body === 'string' &&
        (step.focusModuleId === undefined || typeof step.focusModuleId === 'string'),
    )
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
    (candidate.layout === undefined ||
      (typeof candidate.layout === 'object' &&
        candidate.layout !== null &&
        Object.values(candidate.layout).every(
          (position) =>
            typeof position === 'object' &&
            position !== null &&
            typeof position.x === 'number' &&
            typeof position.y === 'number',
        ))) &&
    Array.isArray(candidate.inputBindings) &&
    Array.isArray(candidate.outputBindings)
  );
}
