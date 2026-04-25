import {
  isCompositeDefinition,
  type ClockedIteratorDef,
  type CompositeDef,
  type CompositeLibraryEntry,
  type ConditionalDef,
  type IteratorDef,
  type MultiConditionalDef,
} from '../engine/composites';
import type { Project } from '../engine/types';
import type { DemoProject } from './demo-projects';
import type { GuidedChallenge } from './challenges';
import type { GuidedTutorial } from './tutorials';
import type { VerificationCase } from './verification-workflow';
import { STARTER_COMPOSITE_LIBRARY } from './starter-composites';
import { STARTER_CHALLENGES } from './starter-challenges';
import { STARTER_TUTORIALS } from './starter-tutorials';
import { generateAiToolkitDocument, getAiToolkitFileName } from './ai-toolkit';
import type { UiState } from './store';
import { clonePortOrder } from './port-ordering';
import type {
  ComparisonBaselineDocument,
  CompositeLibraryDocument,
  PersistedWorkspaceDocument,
  SavedAnalysisCase,
  UserWorkspaceMetadata,
  WorkbenchAnnotation,
  WorkbenchGuideRail,
  WorkbenchGroupBox,
  WorkbenchStageLabel,
  WorkbenchDocument,
  WorkspaceVersionDocument,
} from './workbench-document';

const STORAGE_KEY = 'mcw:workspace:v1';
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();
const STARTER_CHALLENGE_GROUP_BY_ID = Object.fromEntries(
  STARTER_CHALLENGES.map((challenge) => [challenge.id, challenge.group]),
);
const STARTER_TUTORIAL_GROUP_BY_ID = Object.fromEntries(
  STARTER_TUTORIALS.map((tutorial) => [tutorial.id, tutorial.group]),
);

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

function cloneStageLabels(stageLabels: WorkbenchStageLabel[]): WorkbenchStageLabel[] {
  return stageLabels.map((stageLabel) => ({ ...stageLabel }));
}

function cloneGroupBoxes(groupBoxes: WorkbenchGroupBox[]): WorkbenchGroupBox[] {
  return groupBoxes.map((groupBox) => ({ ...groupBox }));
}

function cloneGuideRails(guideRails: WorkbenchGuideRail[]): WorkbenchGuideRail[] {
  return guideRails.map((guideRail) => ({ ...guideRail }));
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
    group: challenge.group ?? STARTER_CHALLENGE_GROUP_BY_ID[challenge.id],
    difficulty: challenge.difficulty,
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
    group: tutorial.group ?? STARTER_TUTORIAL_GROUP_BY_ID[tutorial.id],
    steps: tutorial.steps.map((step) => ({ ...step })),
  };
}

function cloneVerificationCase(verificationCase: VerificationCase): VerificationCase {
  return { ...verificationCase };
}

function cloneSavedAnalysisCase(savedCase: SavedAnalysisCase): SavedAnalysisCase {
  return {
    ...savedCase,
    state:
      savedCase.mode === 'classical'
        ? {
            ...savedCase.state,
            selectedShiftsByColumnKey: { ...savedCase.state.selectedShiftsByColumnKey },
          }
        : { ...savedCase.state },
  } as SavedAnalysisCase;
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
    };
  }

  return {
    ...entry,
    source,
    definition: { ...entry.definition },
  };
}

function cloneUserWorkspaceMetadata(
  workspace: UserWorkspaceMetadata,
): UserWorkspaceMetadata {
  return { ...workspace };
}

function cloneWorkspaceDocument(document: WorkbenchDocument): WorkbenchDocument {
  return {
    version: 1,
    project: cloneProject(document.project),
    ui: {
      layout: Object.fromEntries(
        Object.entries(document.ui.layout).map(([moduleId, position]) => [
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
      ),
      annotations: cloneAnnotations(document.ui.annotations),
      stageLabels: cloneStageLabels(document.ui.stageLabels ?? []),
      groupBoxes: cloneGroupBoxes(document.ui.groupBoxes ?? []),
      guideRails: cloneGuideRails(document.ui.guideRails ?? []),
      showFurniture: document.ui.showFurniture ?? true,
      showOverviewNavigator: document.ui.showOverviewNavigator ?? false,
      showGrid: document.ui.showGrid ?? false,
      snapToGrid: document.ui.snapToGrid ?? false,
      snapToGuides: document.ui.snapToGuides ?? false,
      layoutDirection: document.ui.layoutDirection ?? 'horizontal',
      routingMode: document.ui.routingMode ?? 'curved',
      wireColorMode: document.ui.wireColorMode ?? 'domain',
      connectionLayout: Object.fromEntries(
          Object.entries(document.ui.connectionLayout ?? {}).map(([connectionKey, layout]) => [
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
  };
}

function cloneWorkspaceVersion(
  version: WorkspaceVersionDocument,
): WorkspaceVersionDocument {
  return {
    id: version.id,
    name: version.name,
    savedAt: version.savedAt,
    tickedMode: version.tickedMode,
    document: cloneWorkspaceDocument(version.document),
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
      ),
      annotations: [],
      stageLabels: [],
      groupBoxes: [],
      guideRails: [],
      showFurniture: true,
      showOverviewNavigator: false,
      showGrid: false,
      snapToGrid: false,
      snapToGuides: false,
      layoutDirection: 'horizontal',
      routingMode: 'curved',
      wireColorMode: 'domain',
      connectionLayout: {},
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

export function buildPersistedWorkspace(
  state: UiState,
  verificationCasesByProjectId: Record<string, VerificationCase[]> = {},
): PersistedWorkspaceDocument {
  return {
    version: 1,
    activeProjectId: state.activeProjectId,
    defaultWorkspaceMode: state.defaultWorkspaceMode,
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
                ([moduleId, position]) => [
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
                ],
              ),
            ),
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
            connectionLayout: Object.fromEntries(
              Object.entries(state.connectionLayoutByProject[projectId] ?? {}).map(
                ([connectionKey, layout]) => [
                  connectionKey,
                  {
                    ...(layout.orthogonalBend
                      ? { orthogonalBend: { ...layout.orthogonalBend } }
                      : {}),
                    ...(layout.orthogonalAnchors
                      ? {
                          orthogonalAnchors: layout.orthogonalAnchors.map((anchor) => ({ ...anchor })),
                        }
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
    tutorialNotesVisibleByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.tutorialNotesVisibleByProject[projectId] ?? true,
      ]),
    ),
    workspaceModeByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.workspaceModeByProject[projectId] ?? 'guide',
      ]),
    ),
    cryptanalysisModeByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.cryptanalysisModeByProject[projectId] ?? 'classical',
      ]),
    ),
    cryptanalysisInputByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.cryptanalysisInputByProject[projectId] ?? '',
      ]),
    ),
    modernAnalysisBaselineByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.modernAnalysisBaselineByProject[projectId] ?? '',
      ]),
    ),
    modernAnalysisFlipBitByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.modernAnalysisFlipBitByProject[projectId] ?? 0,
      ]),
    ),
    modernAnalysisSourceIdByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.modernAnalysisSourceIdByProject[projectId] ?? null,
      ]),
    ),
    modernAnalysisSinkIdByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.modernAnalysisSinkIdByProject[projectId] ?? null,
      ]),
    ),
    randomnessAnalysisSinkIdByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.randomnessAnalysisSinkIdByProject[projectId] ?? null,
      ]),
    ),
    classicalSelectedPeriodByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.classicalSelectedPeriodByProject[projectId] ?? 1,
      ]),
    ),
    classicalSelectedColumnIndexByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.classicalSelectedColumnIndexByProject[projectId] ?? 0,
      ]),
    ),
    classicalSelectedShiftsByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        { ...(state.classicalSelectedShiftsByProject[projectId] ?? {}) },
      ]),
    ),
    savedAnalysisCasesByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        (state.savedAnalysisCasesByProject[projectId] ?? []).map(cloneSavedAnalysisCase),
      ]),
    ),
    tickedModeByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.tickedModeByProject[projectId] ?? false,
      ]),
    ),
    currentTickByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.currentTickByProject[projectId] ?? 0,
      ]),
    ),
    tickPlaybackSpeedMsByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        state.tickPlaybackSpeedMsByProject[projectId] ?? 500,
      ]),
    ),
    workspaceVersionsByProjectId: Object.fromEntries(
      Object.keys(state.projectStates).map((projectId) => [
        projectId,
        (state.workspaceVersionsByProject[projectId] ?? []).map(cloneWorkspaceVersion),
      ]),
    ),
    challengeLibrary: state.challengeLibrary.map(cloneChallenge),
    tutorialLibrary: state.tutorialLibrary.map(cloneTutorial),
    compositeLibrary: {
      version: 1,
      entries: state.compositeLibrary.map(cloneReusableEntry),
    },
    userWorkspaceLibrary: state.userWorkspaceLibrary.map(cloneUserWorkspaceMetadata),
    verificationCasesByProjectId: Object.fromEntries(
      Object.entries(verificationCasesByProjectId).map(([projectId, cases]) => [
        projectId,
        cases.map(cloneVerificationCase),
      ]),
    ),
  };
}

export function saveWorkspaceToStorage(
  state: UiState,
  verificationCasesByProjectId: Record<string, VerificationCase[]> = {},
  storage: Storage = window.localStorage,
): void {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(buildPersistedWorkspace(state, verificationCasesByProjectId)),
  );
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
      !isCompositeLibraryDocument(parsed.compositeLibrary) ||
      !(
        parsed.workspaceVersionsByProjectId === undefined ||
        (typeof parsed.workspaceVersionsByProjectId === 'object' &&
          parsed.workspaceVersionsByProjectId !== null &&
          Object.values(parsed.workspaceVersionsByProjectId).every(
            (versions) =>
              Array.isArray(versions) &&
              versions.every(isWorkspaceVersionDocument),
          ))
      ) ||
      !(
        parsed.userWorkspaceLibrary === undefined ||
        (Array.isArray(parsed.userWorkspaceLibrary) &&
          parsed.userWorkspaceLibrary.every(isUserWorkspaceMetadata))
      ) ||
      !(
        parsed.verificationCasesByProjectId === undefined ||
        (typeof parsed.verificationCasesByProjectId === 'object' &&
          parsed.verificationCasesByProjectId !== null &&
          Object.values(parsed.verificationCasesByProjectId).every(
            (cases) =>
              Array.isArray(cases) &&
              cases.every(isVerificationCaseDocument),
          ))
      )
    ) {
      return null;
    }

    const allowedProjectIds = new Set([
      ...projects.map((project) => project.id),
      ...(parsed.userWorkspaceLibrary ?? []).map((workspace) => workspace.id),
    ]);
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
      defaultWorkspaceMode:
        parsed.defaultWorkspaceMode === 'build' ||
        parsed.defaultWorkspaceMode === 'guide' ||
        parsed.defaultWorkspaceMode === 'cryptanalysis'
          ? parsed.defaultWorkspaceMode
          : 'guide',
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
      tutorialNotesVisibleByProjectId: Object.fromEntries(
        Object.entries(parsed.tutorialNotesVisibleByProjectId ?? {}).filter(
          ([projectId, visible]) =>
            allowedProjectIds.has(projectId) && typeof visible === 'boolean',
        ),
      ),
      workspaceModeByProjectId: Object.fromEntries(
        Object.entries(parsed.workspaceModeByProjectId ?? {}).filter(
          ([projectId, mode]) =>
            allowedProjectIds.has(projectId) &&
            (mode === 'build' || mode === 'guide' || mode === 'cryptanalysis'),
        ),
      ),
      cryptanalysisModeByProjectId: Object.fromEntries(
        Object.entries(parsed.cryptanalysisModeByProjectId ?? {}).filter(
          ([projectId, mode]) =>
            allowedProjectIds.has(projectId) &&
            (mode === 'classical' || mode === 'modern'),
        ),
      ),
      cryptanalysisInputByProjectId: Object.fromEntries(
        Object.entries(parsed.cryptanalysisInputByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) && typeof value === 'string',
        ),
      ),
      modernAnalysisBaselineByProjectId: Object.fromEntries(
        Object.entries(parsed.modernAnalysisBaselineByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) && typeof value === 'string',
        ),
      ),
      modernAnalysisFlipBitByProjectId: Object.fromEntries(
        Object.entries(parsed.modernAnalysisFlipBitByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            typeof value === 'number' &&
            Number.isFinite(value),
        ),
      ),
      modernAnalysisSourceIdByProjectId: Object.fromEntries(
        Object.entries(parsed.modernAnalysisSourceIdByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            (value === null || typeof value === 'string'),
        ),
      ),
      modernAnalysisSinkIdByProjectId: Object.fromEntries(
        Object.entries(parsed.modernAnalysisSinkIdByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            (value === null || typeof value === 'string'),
        ),
      ),
      randomnessAnalysisSinkIdByProjectId: Object.fromEntries(
        Object.entries(parsed.randomnessAnalysisSinkIdByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            (value === null || typeof value === 'string'),
        ),
      ),
      classicalSelectedPeriodByProjectId: Object.fromEntries(
        Object.entries(parsed.classicalSelectedPeriodByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            typeof value === 'number' &&
            Number.isFinite(value),
        ),
      ),
      classicalSelectedColumnIndexByProjectId: Object.fromEntries(
        Object.entries(parsed.classicalSelectedColumnIndexByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            typeof value === 'number' &&
            Number.isFinite(value),
        ),
      ),
      classicalSelectedShiftsByProjectId: Object.fromEntries(
        Object.entries(parsed.classicalSelectedShiftsByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            value !== null &&
            typeof value === 'object' &&
            Object.values(value).every(
              (shift) => typeof shift === 'number' && Number.isFinite(shift),
            ),
        ),
      ),
      savedAnalysisCasesByProjectId: Object.fromEntries(
        Object.entries(parsed.savedAnalysisCasesByProjectId ?? {}).filter(
          ([projectId, value]) =>
            allowedProjectIds.has(projectId) &&
            Array.isArray(value) &&
            value.every(isSavedAnalysisCaseDocument),
        ),
      ),
      tickedModeByProjectId: Object.fromEntries(
        Object.entries(parsed.tickedModeByProjectId ?? {}).filter(
          ([projectId, enabled]) =>
            allowedProjectIds.has(projectId) && typeof enabled === 'boolean',
        ),
      ),
      currentTickByProjectId: Object.fromEntries(
        Object.entries(parsed.currentTickByProjectId ?? {}).filter(
          ([projectId, tick]) =>
            allowedProjectIds.has(projectId) &&
            typeof tick === 'number' &&
            Number.isFinite(tick),
        ),
      ),
      tickPlaybackSpeedMsByProjectId: Object.fromEntries(
        Object.entries(parsed.tickPlaybackSpeedMsByProjectId ?? {}).filter(
          ([projectId, speedMs]) =>
            allowedProjectIds.has(projectId) &&
            typeof speedMs === 'number' &&
            Number.isFinite(speedMs),
        ),
      ),
      workspaceVersionsByProjectId: Object.fromEntries(
        Object.entries(parsed.workspaceVersionsByProjectId ?? {}).filter(
          ([projectId, versions]) =>
            allowedProjectIds.has(projectId) &&
            Array.isArray(versions) &&
            versions.every(isWorkspaceVersionDocument),
        ).map(([projectId, versions]) => [
          projectId,
          versions.map(cloneWorkspaceVersion),
        ]),
      ),
      challengeLibrary: parsed.challengeLibrary.map(cloneChallenge),
      tutorialLibrary: parsed.tutorialLibrary.map(cloneTutorial),
      userWorkspaceLibrary: (parsed.userWorkspaceLibrary ?? []).map(
        cloneUserWorkspaceMetadata,
      ),
      verificationCasesByProjectId: Object.fromEntries(
        Object.entries(parsed.verificationCasesByProjectId ?? {}).filter(
          ([projectId, cases]) =>
            allowedProjectIds.has(projectId) &&
            Array.isArray(cases) &&
            cases.every(isVerificationCaseDocument),
        ).map(([projectId, cases]) => [projectId, cases.map(cloneVerificationCase)]),
      ),
    };
  } catch {
    return null;
  }
}

function isUserWorkspaceMetadata(value: unknown): value is UserWorkspaceMetadata {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const workspace = value as Partial<UserWorkspaceMetadata>;
  return (
    typeof workspace.id === 'string' &&
    typeof workspace.name === 'string' &&
    (workspace.group === undefined || typeof workspace.group === 'string') &&
    typeof workspace.summary === 'string' &&
    typeof workspace.pipeline === 'string' &&
    (workspace.defaultTickedMode === undefined ||
      typeof workspace.defaultTickedMode === 'boolean')
  );
}

function isWorkspaceVersionDocument(value: unknown): value is WorkspaceVersionDocument {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const version = value as Partial<WorkspaceVersionDocument>;
  return (
    typeof version.id === 'string' &&
    typeof version.name === 'string' &&
    typeof version.savedAt === 'string' &&
    typeof version.tickedMode === 'boolean' &&
    isWorkbenchDocument(version.document)
  );
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

export function downloadPythonDocument(fileName: string, source: string): void {
  const blob = new Blob([source], {
    type: 'text/x-python',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadAiToolkitDocument(): void {
  const blob = new Blob([generateAiToolkitDocument()], {
    type: 'text/markdown;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = getAiToolkitFileName();
  anchor.click();
  URL.revokeObjectURL(url);
}

interface FlatArchiveEntry {
  fileName: string;
  contents: string;
}

function writeUint16LE(buffer: Uint8Array, offset: number, value: number) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  view.setUint16(offset, value, true);
}

function writeUint32LE(buffer: Uint8Array, offset: number, value: number) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  view.setUint32(offset, value, true);
}

function buildCrc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toBlobArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function buildFlatZipArchive(
  entries: FlatArchiveEntry[],
): Blob {
  const encoder = new TextEncoder();
  const localFileParts: Uint8Array[] = [];
  const centralDirectoryParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileNameBytes = encoder.encode(entry.fileName);
    const contentBytes = encoder.encode(entry.contents);
    const crc32 = buildCrc32(contentBytes);

    const localHeader = new Uint8Array(30 + fileNameBytes.length);
    writeUint32LE(localHeader, 0, 0x04034b50);
    writeUint16LE(localHeader, 4, 20);
    writeUint16LE(localHeader, 6, 0);
    writeUint16LE(localHeader, 8, 0);
    writeUint16LE(localHeader, 10, 0);
    writeUint16LE(localHeader, 12, 0);
    writeUint32LE(localHeader, 14, crc32);
    writeUint32LE(localHeader, 18, contentBytes.length);
    writeUint32LE(localHeader, 22, contentBytes.length);
    writeUint16LE(localHeader, 26, fileNameBytes.length);
    writeUint16LE(localHeader, 28, 0);
    localHeader.set(fileNameBytes, 30);

    localFileParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    writeUint32LE(centralHeader, 0, 0x02014b50);
    writeUint16LE(centralHeader, 4, 20);
    writeUint16LE(centralHeader, 6, 20);
    writeUint16LE(centralHeader, 8, 0);
    writeUint16LE(centralHeader, 10, 0);
    writeUint16LE(centralHeader, 12, 0);
    writeUint16LE(centralHeader, 14, 0);
    writeUint32LE(centralHeader, 16, crc32);
    writeUint32LE(centralHeader, 20, contentBytes.length);
    writeUint32LE(centralHeader, 24, contentBytes.length);
    writeUint16LE(centralHeader, 28, fileNameBytes.length);
    writeUint16LE(centralHeader, 30, 0);
    writeUint16LE(centralHeader, 32, 0);
    writeUint16LE(centralHeader, 34, 0);
    writeUint16LE(centralHeader, 36, 0);
    writeUint32LE(centralHeader, 38, 0);
    writeUint32LE(centralHeader, 42, offset);
    centralHeader.set(fileNameBytes, 46);

    centralDirectoryParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectorySize = centralDirectoryParts.reduce(
    (total, part) => total + part.length,
    0,
  );
  const endOfCentralDirectory = new Uint8Array(22);
  writeUint32LE(endOfCentralDirectory, 0, 0x06054b50);
  writeUint16LE(endOfCentralDirectory, 4, 0);
  writeUint16LE(endOfCentralDirectory, 6, 0);
  writeUint16LE(endOfCentralDirectory, 8, entries.length);
  writeUint16LE(endOfCentralDirectory, 10, entries.length);
  writeUint32LE(endOfCentralDirectory, 12, centralDirectorySize);
  writeUint32LE(endOfCentralDirectory, 16, offset);
  writeUint16LE(endOfCentralDirectory, 20, 0);

  return new Blob(
    [
      ...localFileParts.map(toBlobArrayBuffer),
      ...centralDirectoryParts.map(toBlobArrayBuffer),
      toBlobArrayBuffer(endOfCentralDirectory),
    ],
    { type: 'application/zip' },
  );
}

export function downloadPythonExportBundle(
  workspaceName: string,
  files: {
    runtimeFileName: string;
    runtimeSource: string;
    workspaceFileName: string;
    workspaceSource: string;
    parityFileName: string;
    paritySource: string;
  },
): void {
  const archiveStem = workspaceName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workspace';
  const archiveName = `${archiveStem}_python_export.zip`;
  const archiveBlob = buildFlatZipArchive([
    { fileName: files.runtimeFileName, contents: files.runtimeSource },
    { fileName: files.workspaceFileName, contents: files.workspaceSource },
    { fileName: files.parityFileName, contents: files.paritySource },
  ]);
  const url = URL.createObjectURL(archiveBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = archiveName;
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

export function parseGuidedTutorialDocument(rawValue: string): GuidedTutorial | null {
  try {
    const parsed = JSON.parse(rawValue);
    return isGuidedTutorialDocument(parsed) ? cloneTutorial(parsed) : null;
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
    Array.isArray(candidate.ui.annotations) &&
    candidate.ui.annotations.every(
      (annotation) =>
        typeof annotation === 'object' &&
        annotation !== null &&
        typeof annotation.id === 'string' &&
        typeof annotation.x === 'number' &&
        typeof annotation.y === 'number' &&
        typeof annotation.text === 'string',
    ) &&
    (candidate.ui.stageLabels === undefined ||
      (Array.isArray(candidate.ui.stageLabels) &&
        candidate.ui.stageLabels.every(
          (stageLabel) =>
            typeof stageLabel === 'object' &&
            stageLabel !== null &&
            typeof stageLabel.id === 'string' &&
            typeof stageLabel.x === 'number' &&
            typeof stageLabel.y === 'number' &&
            typeof stageLabel.text === 'string',
        ))) &&
    (candidate.ui.groupBoxes === undefined ||
      (Array.isArray(candidate.ui.groupBoxes) &&
        candidate.ui.groupBoxes.every(
          (groupBox) =>
            typeof groupBox === 'object' &&
            groupBox !== null &&
            typeof groupBox.id === 'string' &&
            typeof groupBox.x === 'number' &&
            typeof groupBox.y === 'number' &&
            typeof groupBox.width === 'number' &&
            typeof groupBox.height === 'number' &&
            typeof groupBox.title === 'string' &&
            (groupBox.variant === undefined ||
              groupBox.variant === 'neutral' ||
              groupBox.variant === 'stage' ||
              groupBox.variant === 'feedback' ||
              groupBox.variant === 'emphasis')))) &&
    (candidate.ui.guideRails === undefined ||
      (Array.isArray(candidate.ui.guideRails) &&
        candidate.ui.guideRails.every(
          (guideRail) =>
            typeof guideRail === 'object' &&
            guideRail !== null &&
            typeof guideRail.id === 'string' &&
            (guideRail.axis === 'horizontal' || guideRail.axis === 'vertical') &&
            typeof guideRail.position === 'number' &&
            Number.isFinite(guideRail.position) &&
            typeof guideRail.title === 'string',
        ))) &&
    (candidate.ui.showFurniture === undefined || typeof candidate.ui.showFurniture === 'boolean') &&
    (candidate.ui.showOverviewNavigator === undefined ||
      typeof candidate.ui.showOverviewNavigator === 'boolean') &&
    (candidate.ui.showGrid === undefined || typeof candidate.ui.showGrid === 'boolean') &&
    (candidate.ui.snapToGrid === undefined || typeof candidate.ui.snapToGrid === 'boolean') &&
    (candidate.ui.snapToGuides === undefined || typeof candidate.ui.snapToGuides === 'boolean') &&
    (candidate.ui.layoutDirection === undefined ||
      candidate.ui.layoutDirection === 'horizontal' ||
      candidate.ui.layoutDirection === 'vertical') &&
    (candidate.ui.routingMode === undefined ||
      candidate.ui.routingMode === 'curved' ||
      candidate.ui.routingMode === 'orthogonal') &&
    (candidate.ui.wireColorMode === undefined ||
      candidate.ui.wireColorMode === 'domain' ||
      candidate.ui.wireColorMode === 'neutral' ||
      candidate.ui.wireColorMode === 'high-contrast') &&
    isConnectionLayoutMap(candidate.ui.connectionLayout)
  );
}

function isConnectionLayoutMap(value: unknown) {
  return (
    value === undefined ||
    (typeof value === 'object' &&
      value !== null &&
      Object.values(value).every((layout) => {
        if (typeof layout !== 'object' || layout === null) {
          return false;
        }

        const bend = (layout as { orthogonalBend?: { axis?: unknown; value?: unknown } })
          .orthogonalBend;
        const anchors = (layout as { orthogonalAnchors?: Array<{ x?: unknown; y?: unknown }> })
          .orthogonalAnchors;
        const lanePreference = (layout as { orthogonalLanePreference?: unknown })
          .orthogonalLanePreference;
        const colorOverride = (layout as { colorOverride?: unknown }).colorOverride;
        return (
          (bend === undefined ||
            ((bend.axis === 'x' || bend.axis === 'y') && typeof bend.value === 'number')) &&
          (anchors === undefined ||
            (Array.isArray(anchors) &&
              anchors.length <= 4 &&
              anchors.every(
                (anchor) =>
                  typeof anchor === 'object' &&
                  anchor !== null &&
                  typeof anchor.x === 'number' &&
                  Number.isFinite(anchor.x) &&
                  typeof anchor.y === 'number' &&
                  Number.isFinite(anchor.y),
              ))) &&
          (lanePreference === undefined ||
            lanePreference === 'negative' ||
            lanePreference === 'positive') &&
          (colorOverride === undefined ||
            colorOverride === 'red' ||
            colorOverride === 'orange' ||
            colorOverride === 'gold' ||
            colorOverride === 'green' ||
            colorOverride === 'teal' ||
            colorOverride === 'blue' ||
            colorOverride === 'violet' ||
            colorOverride === 'rose')
        );
      }))
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
    (candidate.projectId === undefined || typeof candidate.projectId === 'string') &&
    (candidate.group === undefined || typeof candidate.group === 'string') &&
    (candidate.difficulty === undefined ||
      candidate.difficulty === 'beginner' ||
      candidate.difficulty === 'intermediate' ||
      candidate.difficulty === 'expert') &&
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
    (candidate.success.kind === 'output-match-target' ||
      (candidate.success.kind === 'output-match-target-with-module-difference' &&
        Array.isArray(candidate.success.moduleIds) &&
        candidate.success.moduleIds.every((moduleId) => typeof moduleId === 'string'))) &&
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
    (candidate.group === undefined || typeof candidate.group === 'string') &&
    typeof candidate.summary === 'string' &&
    typeof candidate.projectId === 'string' &&
    (candidate.preferredWorkspaceMode === undefined ||
      candidate.preferredWorkspaceMode === 'build' ||
      candidate.preferredWorkspaceMode === 'guide' ||
      candidate.preferredWorkspaceMode === 'cryptanalysis') &&
    (candidate.preferredCryptanalysisMode === undefined ||
      candidate.preferredCryptanalysisMode === 'classical' ||
      candidate.preferredCryptanalysisMode === 'modern' ||
      candidate.preferredCryptanalysisMode === 'randomness' ||
      candidate.preferredCryptanalysisMode === 'key-schedule') &&
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

function isVerificationCaseDocument(value: unknown): value is VerificationCase {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as VerificationCase;
  return (
    typeof candidate.id === 'string' &&
    (candidate.mode === 'stateless' || candidate.mode === 'ticked') &&
    typeof candidate.sourceModuleId === 'string' &&
    typeof candidate.sourceDefId === 'string' &&
    typeof candidate.sourceLabel === 'string' &&
    (candidate.targetSinkModuleId === undefined || typeof candidate.targetSinkModuleId === 'string') &&
    (candidate.targetSinkLabel === undefined || typeof candidate.targetSinkLabel === 'string') &&
    typeof candidate.inputValue === 'string' &&
    typeof candidate.expectedOutput === 'string' &&
    (candidate.tickCount === undefined ||
      (typeof candidate.tickCount === 'number' &&
        Number.isInteger(candidate.tickCount) &&
        candidate.tickCount > 0))
  );
}

function isSavedAnalysisCaseDocument(value: unknown): value is SavedAnalysisCase {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SavedAnalysisCase;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.projectId !== 'string'
  ) {
    return false;
  }

  if (candidate.mode === 'modern') {
    return (
      candidate.state !== null &&
      typeof candidate.state === 'object' &&
      (candidate.state.sourceModuleId === null || typeof candidate.state.sourceModuleId === 'string') &&
      (candidate.state.sinkModuleId === null || typeof candidate.state.sinkModuleId === 'string') &&
      typeof candidate.state.baselineInput === 'string' &&
      typeof candidate.state.flipBit === 'number' &&
      Number.isFinite(candidate.state.flipBit)
    );
  }

  if (candidate.mode === 'randomness') {
    return (
      candidate.state !== null &&
      typeof candidate.state === 'object' &&
      (candidate.state.sinkModuleId === null || typeof candidate.state.sinkModuleId === 'string')
    );
  }

  if (candidate.mode === 'classical') {
    return (
      candidate.state !== null &&
      typeof candidate.state === 'object' &&
      typeof candidate.state.ciphertext === 'string' &&
      typeof candidate.state.selectedPeriod === 'number' &&
      Number.isFinite(candidate.state.selectedPeriod) &&
      typeof candidate.state.selectedColumnIndex === 'number' &&
      Number.isFinite(candidate.state.selectedColumnIndex) &&
      candidate.state.selectedShiftsByColumnKey !== null &&
      typeof candidate.state.selectedShiftsByColumnKey === 'object' &&
      Object.values(candidate.state.selectedShiftsByColumnKey).every(
        (shift) => typeof shift === 'number' && Number.isFinite(shift),
      )
    );
  }

  return false;
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
    (candidate.source === undefined ||
      candidate.source === 'built-in' ||
      candidate.source === 'user') &&
    (isCompositeDef(candidate.definition) || isIteratorDef(candidate.definition) || isClockedIteratorDef(candidate.definition) || isConditionalDef(candidate.definition) || isMultiConditionalDef(candidate.definition))
  );
}

function isMultiConditionalDef(value: unknown): value is MultiConditionalDef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as MultiConditionalDef;
  return (
    candidate.kind === 'multi-conditional' &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'number' &&
    Array.isArray(candidate.inputs) &&
    Array.isArray(candidate.outputs) &&
    typeof candidate.paramSchema === 'object' &&
    candidate.paramSchema !== null &&
    Array.isArray(candidate.branchDefIds) &&
    candidate.branchDefIds.every((id: unknown) => typeof id === 'string')
  );
}

function isConditionalDef(value: unknown): value is ConditionalDef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as ConditionalDef;
  return (
    candidate.kind === 'conditional' &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'number' &&
    Array.isArray(candidate.inputs) &&
    Array.isArray(candidate.outputs) &&
    typeof candidate.paramSchema === 'object' &&
    candidate.paramSchema !== null &&
    typeof candidate.thenDefId === 'string' &&
    typeof candidate.elseDefId === 'string'
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

function isIteratorDef(value: unknown): value is IteratorDef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as IteratorDef;
  return (
    candidate.kind === 'iterator' &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'number' &&
    Array.isArray(candidate.inputs) &&
    Array.isArray(candidate.outputs) &&
    typeof candidate.paramSchema === 'object' &&
    candidate.paramSchema !== null &&
    typeof candidate.roundDefId === 'string' &&
    typeof candidate.iterationCount === 'number'
  );
}

function isClockedIteratorDef(value: unknown): value is ClockedIteratorDef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as ClockedIteratorDef;
  return (
    candidate.kind === 'clocked-iterator' &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'number' &&
    Array.isArray(candidate.inputs) &&
    Array.isArray(candidate.outputs) &&
    typeof candidate.paramSchema === 'object' &&
    candidate.paramSchema !== null &&
    typeof candidate.roundDefId === 'string' &&
    typeof candidate.roundCount === 'number' &&
    (candidate.endPolicy === 'halt' || candidate.endPolicy === 'wrap')
  );
}
