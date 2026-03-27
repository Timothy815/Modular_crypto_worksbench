import type { CompositeLibraryEntry } from '../engine/composites';
import type { ExecutionResult, ExecutionTraceEntry, Project, ValidationIssue } from '../engine/types';
import type { UiAction } from './store';
import type { TutorialStep } from './tutorials';
import type { GuidedTutorial } from './tutorials';
import type { GuidedChallenge, ChallengeEvaluation } from './challenges';
import type { ComparisonBaselineDocument } from './workbench-document';
import type { ExecutionComparison } from './execution-compare';
import type { WorkbenchAnnotation } from './workbench-document';
import type { WorkspaceMode } from './workspace-mode';

export type DetachedPanelKind = 'palette' | 'inspector' | 'learning';
export type ThemeMode = 'light' | 'dark';

export const DETACHED_PANEL_CHANNEL_NAME = 'mcw-detached-panel-v1';
export const DETACHED_PANEL_QUERY_KEY = 'detachedPanel';
export const DETACHED_PANEL_HOST_QUERY_KEY = 'hostId';
export const DETACHED_PANEL_WINDOW_QUERY_KEY = 'panelWindowId';

export interface DetachedPaletteSnapshot {
  theme: ThemeMode;
  paletteViewMode: 'compact' | 'expanded';
  compositeLibrary: CompositeLibraryEntry[];
  compositeUsageCountById: Record<string, number>;
  builtInReusableIds: string[];
}

export interface DetachedInspectorSnapshot {
  theme: ThemeMode;
  projectId: string;
  execution: ExecutionResult | null;
  executionError: string | null;
  validationIssues: ValidationIssue[];
  stepIndex: number | null;
  project: Project;
  tutorialStep: TutorialStep | null;
  projectName: string;
  comparisonBaseline: ComparisonBaselineDocument | null;
  executionComparison: ExecutionComparison | null;
  baselineOutput: string;
  variantOutput: string;
  baselineExecutionError: string | null;
  baselineModuleId: string | null;
  selectedModuleId: string | null;
  selectedModuleIds: string[];
  parameterClipboard: {
    sourceModuleId: string;
    sourceDefId: string;
    params: Record<string, unknown>;
    paramKeys: string[];
  } | null;
  paramDrafts: Record<string, string>;
  compositeLibrary: CompositeLibraryEntry[];
  probedModuleIds: string[];
  isTickedMode: boolean;
  currentTick: number;
  tickCount: number;
  tickedParamsByModule: Record<string, Record<string, unknown>[]> | null;
  tickHistoryByModule: Record<string, string[]> | null;
  collectedOutput: string | null;
  activeAnalysisTraceEntry: ExecutionTraceEntry | null;
  requestedWorkspaceFocusModuleId: string | null;
  canRenameModuleIds: boolean;
}

export interface DetachedLearningSnapshot {
  theme: ThemeMode;
  learningPanelTab: 'tutorial' | 'challenge';
  hasTutorialPanel: boolean;
  hasChallengePanel: boolean;
  tutorials: GuidedTutorial[];
  challenges: GuidedChallenge[];
  selectedTutorialId: string | null;
  selectedChallengeId: string | null;
  currentProjectId: string;
  currentProject: Project;
  tutorialStepIndex: number;
  selectedTutorialStep: TutorialStep | null;
  completedTutorialIds: string[];
  isTutorialCompleted: boolean;
  workspaceMode: WorkspaceMode;
  tutorialNotesVisible: boolean;
  challengeEvaluation: ChallengeEvaluation | null;
  canCaptureChallenge: boolean;
}

export interface DetachedPanelStateSnapshot {
  hostId: string;
  panelWindowId: string;
  kind: DetachedPanelKind;
  payload: DetachedPaletteSnapshot | DetachedInspectorSnapshot | DetachedLearningSnapshot;
}

export type DetachedPanelCommand =
  | { type: 'togglePaletteViewMode' }
  | { type: 'addModule'; defId: string }
  | { type: 'openComposite'; defId: string }
  | { type: 'duplicateReusable'; defId: string }
  | { type: 'openPrimitiveMicroDemo'; defId: string }
  | { type: 'exportCompositeLibrary' }
  | { type: 'removeComposite'; defId: string }
  | { type: 'copyParams'; moduleId: string }
  | {
      type: 'applyCopiedParams';
      sourceModuleId: string;
      sourceDefId: string;
      targetModuleIds: string[];
      params: Record<string, unknown>;
      paramKeys: string[];
    }
  | { type: 'deleteModule'; moduleId: string }
  | { type: 'traceHover'; moduleId: string | null }
  | { type: 'stepChange'; nextIndex: number | null }
  | { type: 'activeAnalysisTraceChange'; entry: ExecutionTraceEntry | null }
  | { type: 'requestFocusModule'; moduleId: string }
  | { type: 'captureBaseline' }
  | { type: 'clearBaseline' }
  | { type: 'unzipComposite'; moduleId: string }
  | { type: 'setLearningTab'; tab: 'tutorial' | 'challenge' }
  | { type: 'selectChallenge'; challengeId: string }
  | { type: 'loadChallengeStart' }
  | { type: 'exportChallenge' }
  | { type: 'importChallengeRaw'; rawValue: string }
  | { type: 'captureChallenge' }
  | { type: 'selectTutorial'; tutorialId: string }
  | { type: 'setTutorialStep'; stepIndex: number }
  | { type: 'switchProject'; projectId: string }
  | { type: 'setWorkspaceMode'; mode: WorkspaceMode }
  | { type: 'setTutorialNotesVisible'; visible: boolean }
  | { type: 'focusStepModule'; moduleId: string }
  | { type: 'resetTutorialProgress' };

export type DetachedPanelMessage =
  | {
      type: 'requestSnapshot';
      hostId: string;
      panelWindowId: string;
      kind: DetachedPanelKind;
    }
  | {
      type: 'snapshot';
      snapshot: DetachedPanelStateSnapshot;
    }
  | {
      type: 'dispatchAction';
      hostId: string;
      panelWindowId: string;
      action: UiAction;
    }
  | {
      type: 'command';
      hostId: string;
      panelWindowId: string;
      kind: DetachedPanelKind;
      command: DetachedPanelCommand;
    }
  | {
      type: 'panelClosed';
      hostId: string;
      panelWindowId: string;
      kind: DetachedPanelKind;
    };

export function isDetachedPanelKind(value: string | null): value is DetachedPanelKind {
  return value === 'palette' || value === 'inspector' || value === 'learning';
}

export function createDetachedPanelUrl(
  currentHref: string,
  kind: DetachedPanelKind,
  hostId: string,
  panelWindowId: string,
) {
  const url = new URL(currentHref);
  url.searchParams.set(DETACHED_PANEL_QUERY_KEY, kind);
  url.searchParams.set(DETACHED_PANEL_HOST_QUERY_KEY, hostId);
  url.searchParams.set(DETACHED_PANEL_WINDOW_QUERY_KEY, panelWindowId);
  return url.toString();
}

export function createDetachedPanelWindowName(kind: DetachedPanelKind, panelWindowId: string) {
  return `mcw-${kind}-${panelWindowId}`;
}

export function cloneAnnotations(annotations: WorkbenchAnnotation[]) {
  return annotations.map((annotation) => ({ ...annotation }));
}
