import { validateProject } from '../engine/validation';
import type { ModuleRegistry, Project } from '../engine/types';
import type { GuidedChallenge } from './challenges';
import type { DemoProject } from './demo-projects';
import type { GuidedTutorial } from './tutorials';
import { createInitialUiState, type UiState } from './store';
import type { VerificationCase } from './verification-workflow';
import { isLargeWorkspace } from './workspace-landmarks';
import { cloneProject } from './project-clone';
import {
  downloadPythonExportBundle,
  loadWorkspaceFromStorage,
  parseCompositeLibraryDocument,
  parseWorkbenchDocument,
} from './persistence';
import { isBuiltInCompositeLibraryEntry } from '../engine/composites';
import type {
  ComparisonBaselineDocument,
  CompositeLibraryDocument,
  ShareableLabPack,
  WorkbenchAnnotation,
  WorkbenchDocument,
  WorkspaceFileBinding,
  WorkbenchGuideRail,
  WorkbenchGroupBox,
  WorkbenchPosition,
  WorkspaceSavedViewRegion,
  WorkbenchStageLabel,
} from './workbench-document';
import { clonePortOrder } from './port-ordering';
import { cloneWorkspaceSavedViewRegions } from './workspace-navigation';

export function slugifyWorkspaceName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createUniqueWorkspaceId(name: string, usedIds: Set<string>) {
  const base = slugifyWorkspaceName(name) || 'workspace';
  let nextId = base;
  let index = 2;
  while (usedIds.has(nextId)) {
    nextId = `${base}-${index}`;
    index += 1;
  }
  return nextId;
}

export function createWorkspaceNameFromBase(baseName: string, existingNames: Set<string>) {
  let candidate = baseName;
  let suffix = 2;

  while (existingNames.has(candidate)) {
    candidate = `${baseName} ${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function createUniqueImportedLearningId(baseId: string, usedIds: Set<string>) {
  const sanitizedBase =
    baseId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'imported-item';
  let candidate = sanitizedBase;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${sanitizedBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function describeWorkspacePipeline(project: Project) {
  return project.modules.length > 0
    ? project.modules.map((moduleInstance) => moduleInstance.defId).join(' -> ')
    : 'Blank canvas';
}

function cloneLayout(layout: Record<string, WorkbenchPosition>) {
  return Object.fromEntries(
    Object.entries(layout).map(([moduleId, position]) => [
      moduleId,
      {
        ...position,
        ...(Array.isArray(position.inputOrder) ? { inputOrder: clonePortOrder(position.inputOrder) } : {}),
        ...(Array.isArray(position.outputOrder) ? { outputOrder: clonePortOrder(position.outputOrder) } : {}),
        ...(position.inputPortSides ? { inputPortSides: { ...position.inputPortSides } } : {}),
        ...(position.outputPortSides ? { outputPortSides: { ...position.outputPortSides } } : {}),
      },
    ]),
  );
}

function cloneAnnotations(annotations: WorkbenchAnnotation[]) {
  return annotations.map((annotation) => ({ ...annotation }));
}

function cloneStageLabels(stageLabels: WorkbenchStageLabel[]) {
  return stageLabels.map((stageLabel) => ({ ...stageLabel }));
}

function cloneGroupBoxes(groupBoxes: WorkbenchGroupBox[]) {
  return groupBoxes.map((groupBox) => ({ ...groupBox }));
}

function cloneGuideRails(guideRails: WorkbenchGuideRail[]) {
  return guideRails.map((guideRail) => ({ ...guideRail }));
}

function cloneSavedViewRegions(regions: WorkspaceSavedViewRegion[]) {
  return cloneWorkspaceSavedViewRegions(regions);
}

function cloneComparisonBaseline(
  baseline: ComparisonBaselineDocument | null | undefined,
): ComparisonBaselineDocument | null | undefined {
  if (baseline === undefined) {
    return undefined;
  }

  return baseline
    ? {
        capturedAt: baseline.capturedAt,
        project: cloneProject(baseline.project),
      }
      : null;
}

function cloneWorkspaceFileBinding(
  binding: WorkspaceFileBinding | null | undefined,
): WorkspaceFileBinding | null {
  if (!binding) {
    return null;
  }

  return {
    fileName: binding.fileName,
    status: 'needs-reconfirm',
  };
}

export type WorkspaceArtifactParseResult =
  | {
      kind: 'workbench';
      document: WorkbenchDocument;
    }
  | {
      kind: 'composite-library';
      document: CompositeLibraryDocument;
    };

export function buildHydratedUiState(
  projects: DemoProject[],
  persistedWorkspace: ReturnType<typeof loadWorkspaceFromStorage>,
): UiState {
  if (!persistedWorkspace) {
    return createInitialUiState(projects);
  }

  const userWorkspaceProjects = (persistedWorkspace?.userWorkspaceLibrary ?? []).map(
    (workspace) => ({
      id: workspace.id,
      name: workspace.name,
      group: workspace.group ?? 'My Workspaces',
      summary: workspace.summary,
      pipeline: workspace.pipeline,
      defaultTickedMode: workspace.defaultTickedMode,
      project:
        persistedWorkspace?.documentsByProjectId[workspace.id]?.project ?? {
          modules: [],
          connections: [],
        },
      layout: persistedWorkspace?.documentsByProjectId[workspace.id]?.ui.layout ?? {},
    }),
  );
  const allProjects = [...projects, ...userWorkspaceProjects];
  const initialState = createInitialUiState(allProjects);
  const restoredProjectStates = Object.fromEntries(
    allProjects.map((project) => [
      project.id,
      persistedWorkspace.documentsByProjectId[project.id]?.project ?? initialState.projectStates[project.id],
    ]),
  );

  return {
    ...initialState,
    activeProjectId: persistedWorkspace.activeProjectId,
    defaultWorkspaceMode: persistedWorkspace.defaultWorkspaceMode ?? initialState.defaultWorkspaceMode,
    challengeLibrary:
      persistedWorkspace.challengeLibrary.length > 0
        ? persistedWorkspace.challengeLibrary
        : initialState.challengeLibrary,
    tutorialLibrary:
      persistedWorkspace.tutorialLibrary.length > 0
        ? persistedWorkspace.tutorialLibrary
        : initialState.tutorialLibrary,
    compositeLibrary: [
      // Always use fresh built-in composites so new additions are never missing
      ...initialState.compositeLibrary,
      // Preserve user-authored composites from persisted state
      ...persistedWorkspace.compositeLibrary.entries.filter(
        (entry) => !isBuiltInCompositeLibraryEntry(entry),
      ),
    ],
    userWorkspaceLibrary: persistedWorkspace.userWorkspaceLibrary ?? [],
    showPalette: persistedWorkspace.showPalette,
    showInspector: persistedWorkspace.showInspector,
    projectStates: Object.fromEntries(
      allProjects.map((project) => [project.id, restoredProjectStates[project.id]]),
    ),
    layoutByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.layout ?? initialState.layoutByProject[project.id],
      ]),
    ),
    annotationsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.annotations ?? initialState.annotationsByProject[project.id],
      ]),
    ),
    stageLabelsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.stageLabels ??
          initialState.stageLabelsByProject[project.id],
      ]),
    ),
    groupBoxesByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.groupBoxes ?? initialState.groupBoxesByProject[project.id],
      ]),
    ),
    guideRailsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.guideRails ??
          initialState.guideRailsByProject[project.id],
      ]),
    ),
    showFurnitureByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.showFurniture ??
          initialState.showFurnitureByProject[project.id],
      ]),
    ),
    showOverviewNavigatorByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.showOverviewNavigator ??
          initialState.showOverviewNavigatorByProject[project.id],
      ]),
    ),
    savedViewRegionsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        cloneSavedViewRegions(
          persistedWorkspace.documentsByProjectId[project.id]?.ui.savedViewRegions ??
            initialState.savedViewRegionsByProject[project.id] ??
            [],
        ),
      ]),
    ),
    showGridByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.showGrid ??
          initialState.showGridByProject[project.id],
      ]),
    ),
    snapToGridByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.snapToGrid ??
          initialState.snapToGridByProject[project.id],
      ]),
    ),
    snapToGuidesByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.snapToGuides ??
          initialState.snapToGuidesByProject[project.id],
      ]),
    ),
    layoutDirectionByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.layoutDirection ?? 'horizontal',
      ]),
    ),
    routingModeByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.routingMode ?? 'curved',
      ]),
    ),
    wireColorModeByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.wireColorMode ?? 'domain',
      ]),
    ),
    connectionLayoutByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.documentsByProjectId[project.id]?.ui.connectionLayout ?? {},
      ]),
    ),
    comparisonBaselinesByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.comparisonBaselinesByProjectId[project.id] ?? null,
      ]),
    ),
    activeChallengeIdByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.activeChallengeIdByProjectId[project.id] ??
          initialState.activeChallengeIdByProject[project.id] ??
          null,
      ]),
    ),
    activeTutorialIdByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.activeTutorialIdByProjectId[project.id] ??
          initialState.activeTutorialIdByProject[project.id] ??
          null,
      ]),
    ),
    activeTutorialStepByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.activeTutorialStepByProjectId[project.id] ??
          initialState.activeTutorialStepByProject[project.id] ??
          0,
      ]),
    ),
    completedTutorialsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.completedTutorialsByProjectId[project.id] ??
          initialState.completedTutorialsByProject[project.id] ??
          [],
      ]),
    ),
    tutorialNotesVisibleByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.tutorialNotesVisibleByProjectId?.[project.id] ??
          initialState.tutorialNotesVisibleByProject[project.id] ??
          true,
      ]),
    ),
    workspaceModeByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.workspaceModeByProjectId?.[project.id] ??
          initialState.workspaceModeByProject[project.id] ??
          'guide',
      ]),
    ),
    cryptanalysisModeByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.cryptanalysisModeByProjectId?.[project.id] ??
          initialState.cryptanalysisModeByProject[project.id] ??
          'classical',
      ]),
    ),
    cryptanalysisInputByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.cryptanalysisInputByProjectId?.[project.id] ??
          initialState.cryptanalysisInputByProject[project.id] ??
          '',
      ]),
    ),
    modernAnalysisBaselineByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.modernAnalysisBaselineByProjectId?.[project.id] ??
          initialState.modernAnalysisBaselineByProject[project.id] ??
          '',
      ]),
    ),
    modernAnalysisFlipBitByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.modernAnalysisFlipBitByProjectId?.[project.id] ??
          initialState.modernAnalysisFlipBitByProject[project.id] ??
          0,
      ]),
    ),
    modernAnalysisSourceIdByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.modernAnalysisSourceIdByProjectId?.[project.id] ??
          initialState.modernAnalysisSourceIdByProject[project.id] ??
          null,
      ]),
    ),
    modernAnalysisSinkIdByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.modernAnalysisSinkIdByProjectId?.[project.id] ??
          initialState.modernAnalysisSinkIdByProject[project.id] ??
          null,
      ]),
    ),
    randomnessAnalysisSinkIdByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.randomnessAnalysisSinkIdByProjectId?.[project.id] ??
          initialState.randomnessAnalysisSinkIdByProject[project.id] ??
          null,
      ]),
    ),
    classicalSelectedPeriodByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.classicalSelectedPeriodByProjectId?.[project.id] ??
          initialState.classicalSelectedPeriodByProject[project.id] ??
          1,
      ]),
    ),
    classicalSelectedColumnIndexByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.classicalSelectedColumnIndexByProjectId?.[project.id] ??
          initialState.classicalSelectedColumnIndexByProject[project.id] ??
          0,
      ]),
    ),
    classicalSelectedShiftsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.classicalSelectedShiftsByProjectId?.[project.id] ??
          initialState.classicalSelectedShiftsByProject[project.id] ??
          {},
      ]),
    ),
    savedAnalysisCasesByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.savedAnalysisCasesByProjectId?.[project.id] ??
          initialState.savedAnalysisCasesByProject[project.id] ??
          [],
      ]),
    ),
    tickedModeByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.tickedModeByProjectId?.[project.id] ??
          initialState.tickedModeByProject[project.id] ??
          false,
      ]),
    ),
    currentTickByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.currentTickByProjectId?.[project.id] ??
          initialState.currentTickByProject[project.id] ??
          0,
      ]),
    ),
    isTickPlaybackActiveByProject: Object.fromEntries(allProjects.map((project) => [project.id, false])),
    tickPlaybackSpeedMsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.tickPlaybackSpeedMsByProjectId?.[project.id] ??
          initialState.tickPlaybackSpeedMsByProject[project.id] ??
          500,
      ]),
    ),
    selectedModuleIdByProject: Object.fromEntries(
      allProjects.map((project) => [project.id, restoredProjectStates[project.id]?.modules[0]?.id ?? null]),
    ),
    selectedModuleIdsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        restoredProjectStates[project.id]?.modules[0]?.id ? [restoredProjectStates[project.id].modules[0].id] : [],
      ]),
    ),
    workspaceVersionsByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.workspaceVersionsByProjectId?.[project.id] ?? [],
      ]),
    ),
    exportStatusByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        persistedWorkspace.exportStatusByProjectId?.[project.id] ?? {
          lastExportedAt: null,
          exportedFingerprint: null,
        },
      ]),
    ),
    fileBindingByProject: Object.fromEntries(
      allProjects.map((project) => [
        project.id,
        cloneWorkspaceFileBinding(persistedWorkspace.fileBindingByProjectId?.[project.id]),
      ]),
    ),
  };
}

export function hydrateInitialUiState(projects: DemoProject[]): UiState {
  if (typeof window === 'undefined') {
    return createInitialUiState(projects);
  }

  return buildHydratedUiState(projects, loadWorkspaceFromStorage(projects));
}

export function loadInitialVerificationCasesByProject(projects: DemoProject[]) {
  if (typeof window === 'undefined') {
    return {};
  }

  return loadWorkspaceFromStorage(projects)?.verificationCasesByProjectId ?? {};
}

export function parseWorkspaceArtifact(rawValue: string): WorkspaceArtifactParseResult | null {
  const workbenchDocument = parseWorkbenchDocument(rawValue);
  if (workbenchDocument) {
    return {
      kind: 'workbench',
      document: workbenchDocument,
    };
  }

  const libraryDocument = parseCompositeLibraryDocument(rawValue);
  if (libraryDocument) {
    return {
      kind: 'composite-library',
      document: libraryDocument,
    };
  }

  return null;
}

export interface BuildShareableLabPackArgs {
  activeProjectId: string;
  projectName: string;
  projectSummary: string;
  project: Project;
  layout: Record<string, { x: number; y: number }>;
  annotations: WorkbenchAnnotation[];
  stageLabels?: WorkbenchStageLabel[];
  groupBoxes?: WorkbenchGroupBox[];
  guideRails?: WorkbenchGuideRail[];
  showFurniture?: boolean;
  showOverviewNavigator?: boolean;
  showGrid?: boolean;
  snapToGrid?: boolean;
  snapToGuides?: boolean;
  layoutDirection: 'horizontal' | 'vertical';
  routingMode: 'curved' | 'orthogonal';
  wireColorMode?: 'domain' | 'neutral' | 'high-contrast';
  connectionLayout?: Record<
    string,
    {
      orthogonalBend?: { axis: 'x' | 'y'; value: number };
      orthogonalAnchors?: Array<{ x: number; y: number }>;
      orthogonalLanePreference?: 'negative' | 'positive';
      colorOverride?: 'red' | 'orange' | 'gold' | 'green' | 'teal' | 'blue' | 'violet' | 'rose';
    }
  >;
  comparisonBaseline: ComparisonBaselineDocument | null;
  verificationCases: VerificationCase[];
  tutorial?: GuidedTutorial;
  challenge?: GuidedChallenge;
}

export function buildShareableLabPack({
  activeProjectId,
  projectName,
  projectSummary,
  project,
  layout,
  annotations,
  stageLabels = [],
  groupBoxes = [],
  guideRails = [],
  showFurniture = true,
  showOverviewNavigator = false,
  showGrid = false,
  snapToGrid = false,
  snapToGuides = false,
  layoutDirection,
  routingMode,
  wireColorMode = 'domain',
  connectionLayout = {},
  comparisonBaseline,
  verificationCases,
  tutorial,
  challenge,
}: BuildShareableLabPackArgs): ShareableLabPack {
  return {
    version: 1,
    kind: 'mcw-shareable-lab-pack',
    metadata: {
      id: activeProjectId,
      title: projectName,
      summary: projectSummary,
      source: 'MCW Shareable Lab Pack',
      exportedAt: new Date().toISOString(),
    },
    workspace: {
      version: 1,
      project: cloneProject(project),
      ui: {
        layout: cloneLayout(layout),
        annotations: cloneAnnotations(annotations),
        stageLabels: cloneStageLabels(stageLabels),
        groupBoxes: cloneGroupBoxes(groupBoxes),
        guideRails: cloneGuideRails(guideRails),
        showFurniture,
        showOverviewNavigator,
        showGrid,
        snapToGrid,
        snapToGuides,
        layoutDirection,
        routingMode,
        wireColorMode,
        connectionLayout: Object.fromEntries(
          Object.entries(connectionLayout).map(([connectionKey, layout]) => [
            connectionKey,
            {
              ...(layout.orthogonalBend ? { orthogonalBend: { ...layout.orthogonalBend } } : {}),
              ...(layout.orthogonalAnchors
                ? { orthogonalAnchors: layout.orthogonalAnchors.map((anchor) => ({ ...anchor })) }
                : {}),
              ...(layout.orthogonalLanePreference
                ? { orthogonalLanePreference: layout.orthogonalLanePreference }
                : {}),
              ...(layout.colorOverride ? { colorOverride: layout.colorOverride } : {}),
            },
          ]),
        ),
      },
    },
    comparisonBaseline: cloneComparisonBaseline(comparisonBaseline),
    verificationCases: verificationCases.map((verificationCase) => ({ ...verificationCase })),
    tutorial: tutorial
      ? {
          ...tutorial,
          steps: tutorial.steps.map((step) => ({ ...step })),
        }
      : undefined,
    challenge: challenge
      ? {
          ...challenge,
          startingProject: cloneProject(challenge.startingProject),
          startingLayout: challenge.startingLayout ? cloneLayout(challenge.startingLayout) : undefined,
          targetProject: cloneProject(challenge.targetProject),
          hints: challenge.hints ? [...challenge.hints] : undefined,
        }
      : undefined,
  };
}

export interface ImportedTutorialPlan {
  tutorialId: string;
  tutorial: GuidedTutorial;
}

export interface ImportedChallengePlan {
  challengeId: string;
  challenge: GuidedChallenge;
}

export interface ImportedLabPackPlan {
  workspaceId: string;
  workspaceName: string;
  workspaceSummary: string;
  workspacePipeline: string;
  document: WorkbenchDocument;
  comparisonBaseline: ComparisonBaselineDocument | null;
  verificationCases: VerificationCase[];
  tutorial?: ImportedTutorialPlan;
  challenge?: ImportedChallengePlan;
  learningPanelTab: 'quickstart' | 'tutorial' | 'challenge';
}

export interface PrepareImportedLabPackArgs {
  pack: ShareableLabPack;
  availableProjects: Pick<DemoProject, 'id' | 'name'>[];
  tutorialLibrary: Pick<GuidedTutorial, 'id'>[];
  challengeLibrary: Pick<GuidedChallenge, 'id'>[];
}

export function prepareImportedLabPack({
  pack,
  availableProjects,
  tutorialLibrary,
  challengeLibrary,
}: PrepareImportedLabPackArgs): ImportedLabPackPlan {
  const existingNames = new Set(availableProjects.map((project) => project.name));
  const workspaceName = createWorkspaceNameFromBase(pack.metadata.title, existingNames);
  const workspaceId = createUniqueWorkspaceId(
    workspaceName,
    new Set(availableProjects.map((project) => project.id)),
  );
  const workspaceSummary = pack.metadata.summary || 'Imported shareable lab pack.';
  const workspacePipeline = describeWorkspacePipeline(pack.workspace.project);

  const tutorial = pack.tutorial
    ? {
        tutorialId: createUniqueImportedLearningId(
          pack.tutorial.id,
          new Set(tutorialLibrary.map((entry) => entry.id)),
        ),
        tutorial: {
          ...pack.tutorial,
          projectId: workspaceId,
          steps: pack.tutorial.steps.map((step) => ({ ...step })),
        },
      }
    : undefined;

  const challenge = pack.challenge
    ? {
        challengeId: createUniqueImportedLearningId(
          pack.challenge.id,
          new Set(challengeLibrary.map((entry) => entry.id)),
        ),
        challenge: {
          ...pack.challenge,
          projectId: workspaceId,
          startingProject: cloneProject(pack.challenge.startingProject),
          startingLayout: pack.challenge.startingLayout ? cloneLayout(pack.challenge.startingLayout) : undefined,
          targetProject: cloneProject(pack.challenge.targetProject),
          hints: pack.challenge.hints ? [...pack.challenge.hints] : undefined,
        },
      }
    : undefined;

  return {
    workspaceId,
    workspaceName,
    workspaceSummary,
    workspacePipeline,
    document: {
      version: 1,
      project: cloneProject(pack.workspace.project),
      ui: {
        layout: cloneLayout(pack.workspace.ui.layout),
        annotations: cloneAnnotations(pack.workspace.ui.annotations),
        stageLabels: cloneStageLabels(pack.workspace.ui.stageLabels ?? []),
        groupBoxes: cloneGroupBoxes(pack.workspace.ui.groupBoxes ?? []),
        guideRails: cloneGuideRails(pack.workspace.ui.guideRails ?? []),
        showFurniture: pack.workspace.ui.showFurniture ?? true,
        showOverviewNavigator:
          pack.workspace.ui.showOverviewNavigator ?? isLargeWorkspace(pack.workspace.project),
        showGrid: pack.workspace.ui.showGrid ?? false,
        snapToGrid: pack.workspace.ui.snapToGrid ?? false,
        snapToGuides: pack.workspace.ui.snapToGuides ?? false,
        layoutDirection: pack.workspace.ui.layoutDirection ?? 'horizontal',
        routingMode: pack.workspace.ui.routingMode ?? 'curved',
        wireColorMode: pack.workspace.ui.wireColorMode ?? 'domain',
        connectionLayout: Object.fromEntries(
          Object.entries(pack.workspace.ui.connectionLayout ?? {}).map(
            ([connectionKey, layout]) => [
              connectionKey,
              {
                ...(layout.orthogonalBend ? { orthogonalBend: { ...layout.orthogonalBend } } : {}),
                ...(layout.orthogonalAnchors
                  ? { orthogonalAnchors: layout.orthogonalAnchors.map((anchor) => ({ ...anchor })) }
                  : {}),
                ...(layout.orthogonalLanePreference
                  ? { orthogonalLanePreference: layout.orthogonalLanePreference }
                  : {}),
                ...(layout.colorOverride ? { colorOverride: layout.colorOverride } : {}),
              },
            ],
          ),
        ),
      },
    },
    comparisonBaseline: cloneComparisonBaseline(pack.comparisonBaseline) ?? null,
    verificationCases: (pack.verificationCases ?? []).map((verificationCase) => ({
      ...verificationCase,
    })),
    tutorial,
    challenge,
    learningPanelTab: challenge ? 'challenge' : tutorial ? 'tutorial' : 'quickstart',
  };
}

export interface ExportPythonWorkspaceBundleArgs {
  project: Project;
  registry: ModuleRegistry;
  projectName: string;
  verificationCases: VerificationCase[];
}

export async function exportPythonWorkspaceBundle({
  project,
  registry,
  projectName,
  verificationCases,
}: ExportPythonWorkspaceBundleArgs): Promise<string | null> {
  const exportValidation = validateProject(project, registry);
  if (!exportValidation.ok) {
    return exportValidation.issues.map((issue) => issue.message).join('\n');
  }

  const {
    formatPythonExportCompatibilityIssues,
    generatePythonExportFiles,
    getPythonExportCompatibility,
  } = await import('../engine/codegen/python');

  const compatibility = getPythonExportCompatibility(project, registry);
  if (!compatibility.ok) {
    return formatPythonExportCompatibilityIssues(compatibility.issues);
  }

  try {
    const pythonExport = generatePythonExportFiles(
      project,
      registry,
      projectName,
      verificationCases,
    );
    downloadPythonExportBundle(projectName, pythonExport);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Python export failed.';
  }
}
