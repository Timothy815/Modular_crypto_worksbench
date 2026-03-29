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

export interface DetachedPanelPayloadByKind {
  palette: DetachedPaletteSnapshot;
  inspector: DetachedInspectorSnapshot;
  learning: DetachedLearningSnapshot;
}

export interface DetachedPanelStateSnapshot {
  hostId: string;
  panelWindowId: string;
  tabs: DetachedPanelKind[];
  activeKind: DetachedPanelKind;
  presentationMode: 'tabs' | 'combined' | 'split';
  splitLeftKind: DetachedPanelKind | null;
  splitRightKind: DetachedPanelKind | null;
  splitRatio: number;
  payloadByKind: Partial<DetachedPanelPayloadByKind>;
}

export interface DetachedPanelWindowGroup {
  panelWindowId: string;
  tabs: DetachedPanelKind[];
  activeKind: DetachedPanelKind;
  presentationMode: 'tabs' | 'combined' | 'split';
  splitLeftKind: DetachedPanelKind | null;
  splitRightKind: DetachedPanelKind | null;
  splitRatio: number;
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
  | { type: 'resetTutorialProgress' }
  | { type: 'setActiveDetachedTab'; kind: DetachedPanelKind }
  | { type: 'returnDetachedTabToMain'; kind: DetachedPanelKind }
  | { type: 'setDetachedPresentationMode'; presentationMode: 'tabs' | 'combined' | 'split' }
  | { type: 'moveDetachedPaneEarlier'; kind: DetachedPanelKind }
  | { type: 'moveDetachedPaneLater'; kind: DetachedPanelKind }
  | { type: 'setDetachedSplitSide'; side: 'left' | 'right'; kind: DetachedPanelKind }
  | { type: 'swapDetachedSplitSides' }
  | { type: 'setDetachedSplitRatio'; ratio: number };

export type DetachedPanelMessage =
  | {
      type: 'requestSnapshot';
      hostId: string;
      panelWindowId: string;
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
    };

export function isDetachedPanelKind(value: string | null): value is DetachedPanelKind {
  return value === 'palette' || value === 'inspector' || value === 'learning';
}

export function createDetachedPanelUrl(
  currentHref: string,
  initialKind: DetachedPanelKind,
  hostId: string,
  panelWindowId: string,
) {
  const url = new URL(currentHref);
  url.searchParams.set(DETACHED_PANEL_QUERY_KEY, initialKind);
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

export function getDetachedPanelGroupByKind(
  groups: DetachedPanelWindowGroup[],
  kind: DetachedPanelKind,
) {
  return groups.find((group) => group.tabs.includes(kind)) ?? null;
}

export function isDetachedPanelKindActive(
  groups: DetachedPanelWindowGroup[],
  kind: DetachedPanelKind,
) {
  return getDetachedPanelGroupByKind(groups, kind) !== null;
}

export function createDetachedPanelGroup(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
  kind: DetachedPanelKind,
): DetachedPanelWindowGroup[] {
  const withoutKind = removeDetachedPanelKind(groups, kind);
  return [
    ...withoutKind,
    {
      panelWindowId,
      tabs: [kind],
      activeKind: kind,
      presentationMode: 'tabs',
      splitLeftKind: kind,
      splitRightKind: kind,
      splitRatio: 0.5,
    },
  ];
}

export function clampDetachedSplitRatio(ratio: number) {
  return Math.min(0.7, Math.max(0.3, ratio));
}

function getDefaultDetachedSplitPair(tabs: DetachedPanelKind[]) {
  const [left = null, right = left] = tabs;
  return { left, right };
}

function normalizeDetachedSplitPair(
  tabs: DetachedPanelKind[],
  leftKind: DetachedPanelKind | null,
  rightKind: DetachedPanelKind | null,
) {
  const availableTabs = tabs.filter((tab) => tab === leftKind || tab === rightKind);
  if (availableTabs.length === 2) {
    return {
      splitLeftKind: availableTabs[0],
      splitRightKind: availableTabs[1],
    };
  }

  const fallbackPair = getDefaultDetachedSplitPair(tabs);
  return {
    splitLeftKind: availableTabs[0] ?? fallbackPair.left,
    splitRightKind:
      availableTabs[1] ??
      tabs.find((tab) => tab !== (availableTabs[0] ?? fallbackPair.left)) ??
      availableTabs[0] ??
      fallbackPair.right,
  };
}

export function moveDetachedPanelKindToGroup(
  groups: DetachedPanelWindowGroup[],
  kind: DetachedPanelKind,
  targetPanelWindowId: string,
): DetachedPanelWindowGroup[] {
  const withoutKind = removeDetachedPanelKind(groups, kind);
  let didAttach = false;
  const nextGroups = withoutKind.map((group) => {
    if (group.panelWindowId !== targetPanelWindowId) {
      return group;
    }

    didAttach = true;
    if (group.tabs.includes(kind)) {
      return { ...group, activeKind: kind };
    }

    const nextTabs = [...group.tabs, kind];
    return {
      ...group,
      tabs: nextTabs,
      activeKind: kind,
      presentationMode: group.presentationMode,
      ...normalizeDetachedSplitPair(nextTabs, group.splitLeftKind, group.splitRightKind),
      splitRatio: clampDetachedSplitRatio(group.splitRatio),
    };
  });

  if (didAttach) {
    return nextGroups;
  }

  return [
    ...nextGroups,
    {
      panelWindowId: targetPanelWindowId,
      tabs: [kind],
      activeKind: kind,
      presentationMode: 'tabs',
      splitLeftKind: kind,
      splitRightKind: kind,
      splitRatio: 0.5,
    },
  ];
}

export function setDetachedPanelGroupActiveKind(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
  kind: DetachedPanelKind,
): DetachedPanelWindowGroup[] {
  return groups.map((group) =>
    group.panelWindowId === panelWindowId && group.tabs.includes(kind)
      ? { ...group, activeKind: kind }
      : group,
  );
}

export function removeDetachedPanelKind(
  groups: DetachedPanelWindowGroup[],
  kind: DetachedPanelKind,
): DetachedPanelWindowGroup[] {
  return groups.flatMap((group) => {
    if (!group.tabs.includes(kind)) {
      return [group];
    }

    const nextTabs = group.tabs.filter((tab) => tab !== kind);
    if (nextTabs.length === 0) {
      return [];
    }

    return [
      {
        ...group,
        tabs: nextTabs,
        activeKind:
          group.activeKind === kind
            ? nextTabs[nextTabs.length - 1]
            : group.activeKind,
        ...normalizeDetachedSplitPair(nextTabs, group.splitLeftKind, group.splitRightKind),
      },
    ];
  });
}

export function removeDetachedPanelGroup(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
): DetachedPanelWindowGroup[] {
  return groups.filter((group) => group.panelWindowId !== panelWindowId);
}

export function setDetachedPanelGroupPresentationMode(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
  presentationMode: 'tabs' | 'combined' | 'split',
): DetachedPanelWindowGroup[] {
  return groups.map((group) => {
    if (group.panelWindowId !== panelWindowId) {
      return group;
    }

    if (presentationMode !== 'split') {
      return { ...group, presentationMode };
    }

    const pair = normalizeDetachedSplitPair(group.tabs, group.splitLeftKind, group.splitRightKind);
    return {
      ...group,
      presentationMode,
      splitLeftKind: pair.splitLeftKind,
      splitRightKind: pair.splitRightKind,
      splitRatio: clampDetachedSplitRatio(group.splitRatio),
    };
  });
}

export function moveDetachedPanelKindEarlier(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
  kind: DetachedPanelKind,
): DetachedPanelWindowGroup[] {
  return groups.map((group) => {
    if (group.panelWindowId !== panelWindowId) {
      return group;
    }

    const index = group.tabs.indexOf(kind);
    if (index <= 0) {
      return group;
    }

    const nextTabs = [...group.tabs];
    [nextTabs[index - 1], nextTabs[index]] = [nextTabs[index], nextTabs[index - 1]];
    return {
      ...group,
      tabs: nextTabs,
      ...normalizeDetachedSplitPair(nextTabs, group.splitLeftKind, group.splitRightKind),
    };
  });
}

export function moveDetachedPanelKindLater(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
  kind: DetachedPanelKind,
): DetachedPanelWindowGroup[] {
  return groups.map((group) => {
    if (group.panelWindowId !== panelWindowId) {
      return group;
    }

    const index = group.tabs.indexOf(kind);
    if (index < 0 || index >= group.tabs.length - 1) {
      return group;
    }

    const nextTabs = [...group.tabs];
    [nextTabs[index], nextTabs[index + 1]] = [nextTabs[index + 1], nextTabs[index]];
    return {
      ...group,
      tabs: nextTabs,
      ...normalizeDetachedSplitPair(nextTabs, group.splitLeftKind, group.splitRightKind),
    };
  });
}

export function setDetachedPanelGroupSplitSide(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
  side: 'left' | 'right',
  kind: DetachedPanelKind,
): DetachedPanelWindowGroup[] {
  return groups.map((group) => {
    if (group.panelWindowId !== panelWindowId || !group.tabs.includes(kind)) {
      return group;
    }

    const nextLeftKind = side === 'left' ? kind : group.splitLeftKind;
    const nextRightKind = side === 'right' ? kind : group.splitRightKind;
    const pair = normalizeDetachedSplitPair(group.tabs, nextLeftKind, nextRightKind);
    return {
      ...group,
      splitLeftKind: pair.splitLeftKind,
      splitRightKind: pair.splitRightKind,
      activeKind: kind,
    };
  });
}

export function swapDetachedPanelGroupSplitSides(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
): DetachedPanelWindowGroup[] {
  return groups.map((group) => {
    if (group.panelWindowId !== panelWindowId) {
      return group;
    }

    return {
      ...group,
      splitLeftKind: group.splitRightKind,
      splitRightKind: group.splitLeftKind,
    };
  });
}

export function setDetachedPanelGroupSplitRatio(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
  ratio: number,
): DetachedPanelWindowGroup[] {
  return groups.map((group) =>
    group.panelWindowId === panelWindowId
      ? { ...group, splitRatio: clampDetachedSplitRatio(ratio) }
      : group,
  );
}

export function getDetachedPanelKindsByWindowId(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
) {
  return groups.find((group) => group.panelWindowId === panelWindowId)?.tabs ?? [];
}

export function formatDetachedPanelKindLabel(kind: DetachedPanelKind) {
  switch (kind) {
    case 'palette':
      return 'Tools';
    case 'inspector':
      return 'Inspector';
    case 'learning':
      return 'Learning';
  }
}

export function getDetachedPanelGroupOrdinal(
  groups: DetachedPanelWindowGroup[],
  panelWindowId: string,
) {
  const index = groups.findIndex((group) => group.panelWindowId === panelWindowId);
  return index >= 0 ? index + 1 : null;
}

export function formatDetachedPanelTabList(kinds: DetachedPanelKind[]) {
  return kinds.map((kind) => formatDetachedPanelKindLabel(kind)).join(' + ');
}

export function formatDetachedPanelGroupLabel(group: DetachedPanelWindowGroup) {
  return formatDetachedPanelTabList(group.tabs);
}

export function formatDetachedPanelWindowLabel(
  groups: DetachedPanelWindowGroup[],
  group: DetachedPanelWindowGroup,
) {
  const ordinal = getDetachedPanelGroupOrdinal(groups, group.panelWindowId);
  const prefix = ordinal === null ? 'Window' : `Window ${ordinal}`;
  return `${prefix} (${formatDetachedPanelGroupLabel(group)})`;
}

export function formatDetachedPanelDocumentTitle(
  tabs: DetachedPanelKind[],
  activeKind: DetachedPanelKind,
  presentationMode: 'tabs' | 'combined' | 'split',
  splitLeftKind: DetachedPanelKind | null = null,
  splitRightKind: DetachedPanelKind | null = null,
) {
  if (presentationMode === 'combined') {
    return `Combined (${formatDetachedPanelTabList(tabs)}) — MCW`;
  }

  if (presentationMode === 'split') {
    const pair = normalizeDetachedSplitPair(tabs, splitLeftKind, splitRightKind);
    return `Split (${formatDetachedPanelKindLabel(pair.splitLeftKind ?? activeKind)} + ${formatDetachedPanelKindLabel(pair.splitRightKind ?? activeKind)}) — MCW`;
  }

  const activeLabel = formatDetachedPanelKindLabel(activeKind);
  if (tabs.length <= 1) {
    return `${activeLabel} — MCW`;
  }

  return `${activeLabel} — ${formatDetachedPanelTabList(tabs)} — MCW`;
}
