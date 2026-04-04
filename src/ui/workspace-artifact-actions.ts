import { validateProject } from '../engine/validation';
import type { ModuleRegistry, Project } from '../engine/types';
import type { GuidedChallenge } from './challenges';
import type { DemoProject } from './demo-projects';
import type { GuidedTutorial } from './tutorials';
import type { VerificationCase } from './verification-workflow';
import { isLargeWorkspace } from './workspace-landmarks';
import { cloneProject } from './project-clone';
import {
  downloadPythonExportBundle,
  parseCompositeLibraryDocument,
  parseWorkbenchDocument,
} from './persistence';
import type {
  ComparisonBaselineDocument,
  CompositeLibraryDocument,
  ShareableLabPack,
  WorkbenchAnnotation,
  WorkbenchDocument,
  WorkbenchGuideRail,
  WorkbenchGroupBox,
  WorkbenchPosition,
  WorkbenchStageLabel,
} from './workbench-document';
import {
  createUniqueImportedLearningId,
  createUniqueWorkspaceId,
  createWorkspaceNameFromBase,
  describeWorkspacePipeline,
} from './workspace-artifacts';

function cloneLayout(layout: Record<string, WorkbenchPosition>) {
  return Object.fromEntries(
    Object.entries(layout).map(([moduleId, position]) => [moduleId, { ...position }]),
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

export type WorkspaceArtifactParseResult =
  | {
      kind: 'workbench';
      document: WorkbenchDocument;
    }
  | {
      kind: 'composite-library';
      document: CompositeLibraryDocument;
    };

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
      orthogonalLanePreference?: 'negative' | 'positive';
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
        showOverviewNavigator,
        showGrid,
        snapToGrid,
        snapToGuides,
        layoutDirection,
        routingMode,
        wireColorMode,
        connectionLayout: Object.fromEntries(
          Object.entries(connectionLayout).map(([connectionKey, layoutValue]) => [
            connectionKey,
            {
              ...(layoutValue.orthogonalBend
                ? { orthogonalBend: { ...layoutValue.orthogonalBend } }
                : {}),
              ...(layoutValue.orthogonalLanePreference
                ? { orthogonalLanePreference: layoutValue.orthogonalLanePreference }
                : {}),
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
            ([connectionKey, layoutValue]) => [
              connectionKey,
              {
                ...(layoutValue.orthogonalBend
                  ? { orthogonalBend: { ...layoutValue.orthogonalBend } }
                  : {}),
                ...(layoutValue.orthogonalLanePreference
                  ? { orthogonalLanePreference: layoutValue.orthogonalLanePreference }
                  : {}),
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
