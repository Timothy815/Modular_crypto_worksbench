import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import './App.css';
import { isCompositeDefinition, type CompositeLibraryEntry } from './engine/composites';
import { V1_REGISTRY } from './engine/modules';
import type { ExecutionResult, ExecutionTraceEntry, Project, TickedExecutionResult } from './engine/types';
import { deriveTickCount, executeTickedProject } from './engine/executor';
import { isOutputSinkDefId } from './engine/output-sinks';
import { validateCompositeDef, validateProject } from './engine/validation';
import {
  createCompositeFromSelection,
  previewCompositeSelection,
  replaceSelectionWithComposite,
  unzipCompositeInstance,
} from './ui/composite-authoring';
import { evaluateChallengeAttempt } from './ui/challenges';
import { createChallengeCaptureDraft, createChallengeIdCandidate } from './ui/challenge-capture';
import { PrimitivePalette } from './ui/components/primitive-palette';
import { LearningDock } from './ui/components/learning-dock';
import { WorkbenchPanel } from './ui/components/workbench-panel';
import { demoProjects, runDemoProject } from './ui/demo-projects';
import { compareExecutionResults } from './ui/execution-compare';
import { clampTutorialStepIndex, getTutorialStep } from './ui/tutorials';
import {
  downloadDocument,
  downloadPythonDocument,
  downloadCompositeLibraryDocument,
  downloadGuidedChallengeDocument,
  loadWorkspaceFromStorage,
  parseGuidedChallengeDocument,
  parseCompositeLibraryDocument,
  parseWorkbenchDocument,
  saveWorkspaceToStorage,
} from './ui/persistence';
import { cloneProject } from './ui/project-clone';
import {
  DETACHED_PANEL_CHANNEL_NAME,
  DETACHED_PANEL_HOST_QUERY_KEY,
  DETACHED_PANEL_QUERY_KEY,
  DETACHED_PANEL_WINDOW_QUERY_KEY,
  type DetachedInspectorSnapshot,
  type DetachedLearningSnapshot,
  type DetachedPanelKind,
  type DetachedPanelMessage,
  type DetachedPanelStateSnapshot,
  type DetachedPaletteSnapshot,
  createDetachedPanelUrl,
  createDetachedPanelWindowName,
  isDetachedPanelKind,
} from './ui/multi-window';
import {
  createInitialUiState,
  getEffectiveRegistry,
  getDraftValue,
  getSelectedModuleId,
  getSelectedModuleIds,
  uiReducer,
} from './ui/store';
import {
  buildWorkspaceClipboardSnapshot,
  pasteWorkspaceClipboardSnapshot,
  type WorkspaceClipboardSnapshot,
} from './ui/workspace-clipboard';
import { getPrimitiveMicroDemo } from './ui/primitive-micro-demos';

const MIN_LEFT_DOCK_WIDTH = 220;
const MAX_LEFT_DOCK_WIDTH = 520;
const MIN_RIGHT_DOCK_WIDTH = 280;
const MAX_RIGHT_DOCK_WIDTH = 680;

const CryptanalysisPanel = lazy(() =>
  import('./ui/components/cryptanalysis-panel').then((module) => ({
    default: module.CryptanalysisPanel,
  })),
);
const DetachedPanelWindow = lazy(() =>
  import('./ui/components/detached-panel-window').then((module) => ({
    default: module.DetachedPanelWindow,
  })),
);
const ParameterInspector = lazy(() =>
  import('./ui/components/parameter-inspector').then((module) => ({
    default: module.ParameterInspector,
  })),
);

function clampDockWidth(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function slugifyWorkspaceName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createUniqueWorkspaceId(name: string, usedIds: Set<string>) {
  const base = slugifyWorkspaceName(name) || 'workspace';
  let nextId = base;
  let index = 2;
  while (usedIds.has(nextId)) {
    nextId = `${base}-${index}`;
    index += 1;
  }
  return nextId;
}

function createDuplicateWorkspaceName(sourceName: string, existingNames: Set<string>) {
  const baseName = `${sourceName} Copy`;
  let candidate = baseName;
  let suffix = 2;

  while (existingNames.has(candidate)) {
    candidate = `${baseName} ${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function createWorkspaceVersionId(projectId: string, timestamp: string) {
  return `${projectId}-version-${timestamp.replace(/[^0-9]/g, '')}`;
}

function createWorkspaceNameFromBase(baseName: string, existingNames: Set<string>) {
  let candidate = baseName;
  let suffix = 2;

  while (existingNames.has(candidate)) {
    candidate = `${baseName} ${suffix}`;
    suffix += 1;
  }

  return candidate;
}

interface ParameterClipboardState {
  sourceModuleId: string;
  sourceDefId: string;
  params: Record<string, unknown>;
  paramKeys: string[];
}

function describeWorkspacePipeline(project: Project) {
  return project.modules.length > 0
    ? project.modules.map((moduleInstance) => moduleInstance.defId).join(' -> ')
    : 'Blank canvas';
}

function LazyPanelFallback({
  label = 'Loading',
  title = 'Preparing panel…',
}: {
  label?: string;
  title?: string;
}) {
  return (
    <section className="panel comparison-panel">
      <div className="panel-head">
        <p className="panel-label">{label}</p>
        <h2>{title}</h2>
      </div>
    </section>
  );
}

function getDetachedPanelConfig() {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const kind = url.searchParams.get(DETACHED_PANEL_QUERY_KEY);
  const hostId = url.searchParams.get(DETACHED_PANEL_HOST_QUERY_KEY);
  const panelWindowId = url.searchParams.get(DETACHED_PANEL_WINDOW_QUERY_KEY);

  if (!isDetachedPanelKind(kind) || !hostId || !panelWindowId) {
    return null;
  }

  return { kind, hostId, panelWindowId };
}

function createWindowSessionId() {
  return `window-${Math.random().toString(36).slice(2, 10)}`;
}

function App() {
  const detachedPanelConfig = getDetachedPanelConfig();
  if (detachedPanelConfig) {
    return (
      <Suspense fallback={<LazyPanelFallback label="Window" title="Preparing detached panel…" />}>
        <DetachedPanelWindow
          channelName={DETACHED_PANEL_CHANNEL_NAME}
          hostId={detachedPanelConfig.hostId}
          panelWindowId={detachedPanelConfig.panelWindowId}
          kind={detachedPanelConfig.kind}
        />
      </Suspense>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const [headerResourceAction, setHeaderResourceAction] = useState('');
  const [headerWorkspaceAction, setHeaderWorkspaceAction] = useState('');
  const [learningPanelTab, setLearningPanelTab] = useState<'tutorial' | 'challenge'>('tutorial');
  const [leftDockWidth, setLeftDockWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 320;
    }

    const rawValue = window.localStorage.getItem('mcw:left-dock-width');
    const parsedValue = rawValue ? Number(rawValue) : NaN;
    return Number.isFinite(parsedValue)
      ? clampDockWidth(parsedValue, MIN_LEFT_DOCK_WIDTH, MAX_LEFT_DOCK_WIDTH)
      : 320;
  });
  const [rightDockWidth, setRightDockWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 360;
    }

    const rawValue = window.localStorage.getItem('mcw:right-dock-width');
    const parsedValue = rawValue ? Number(rawValue) : NaN;
    return Number.isFinite(parsedValue)
      ? clampDockWidth(parsedValue, MIN_RIGHT_DOCK_WIDTH, MAX_RIGHT_DOCK_WIDTH)
      : 360;
  });
  const [dockResizeState, setDockResizeState] = useState<{
    side: 'left' | 'right';
    originX: number;
    originWidth: number;
  } | null>(null);
  const [challengeCaptureShouldExport, setChallengeCaptureShouldExport] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.localStorage.getItem('mcw:challenge-export') !== 'false';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedTheme = window.localStorage.getItem('mcw:theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
  const [parameterClipboard, setParameterClipboard] = useState<ParameterClipboardState | null>(null);
  const hostWindowIdRef = useRef(createWindowSessionId());
  const detachedPanelWindowsRef = useRef<Partial<Record<DetachedPanelKind, Window | null>>>({});
  const [detachedPanels, setDetachedPanels] = useState<Record<DetachedPanelKind, boolean>>({
    palette: false,
    inspector: false,
    learning: false,
  });
  const [state, dispatch] = useReducer(
    uiReducer,
    demoProjects,
    (projects) => {
      if (typeof window === 'undefined') {
        return createInitialUiState(projects);
      }

      const persistedWorkspace = loadWorkspaceFromStorage(projects);
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
      if (!persistedWorkspace) {
        return initialState;
      }

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
        compositeLibrary:
          persistedWorkspace.compositeLibrary.entries.length > 0
            ? persistedWorkspace.compositeLibrary.entries
            : initialState.compositeLibrary,
        userWorkspaceLibrary: persistedWorkspace.userWorkspaceLibrary ?? [],
        showPalette: persistedWorkspace.showPalette,
        showInspector: persistedWorkspace.showInspector,
        projectStates: Object.fromEntries(
          allProjects.map((project) => [
            project.id,
            restoredProjectStates[project.id],
          ]),
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
        isTickPlaybackActiveByProject: Object.fromEntries(
          allProjects.map((project) => [project.id, false]),
        ),
        tickPlaybackSpeedMsByProject: Object.fromEntries(
          allProjects.map((project) => [
            project.id,
            persistedWorkspace.tickPlaybackSpeedMsByProjectId?.[project.id] ??
              initialState.tickPlaybackSpeedMsByProject[project.id] ??
              500,
          ]),
        ),
        selectedModuleIdByProject: Object.fromEntries(
          allProjects.map((project) => [
            project.id,
            restoredProjectStates[project.id]?.modules[0]?.id ?? null,
          ]),
        ),
        selectedModuleIdsByProject: Object.fromEntries(
          allProjects.map((project) => [
            project.id,
            restoredProjectStates[project.id]?.modules[0]?.id
              ? [restoredProjectStates[project.id].modules[0].id]
              : [],
          ]),
        ),
        workspaceVersionsByProject: Object.fromEntries(
          allProjects.map((project) => [
            project.id,
            persistedWorkspace.workspaceVersionsByProjectId?.[project.id] ?? [],
          ]),
        ),
      };
    },
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [isCompositeDialogOpen, setIsCompositeDialogOpen] = useState(false);
  const [compositeName, setCompositeName] = useState('');
  const [compositeId, setCompositeId] = useState('');
  const [compositeDialogError, setCompositeDialogError] = useState<string | null>(null);
  const [excludedCompositeBoundaryPortKeys, setExcludedCompositeBoundaryPortKeys] = useState<string[]>([]);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isChallengeResetConfirmOpen, setIsChallengeResetConfirmOpen] = useState(false);
  const [isChallengeCaptureOpen, setIsChallengeCaptureOpen] = useState(false);
  const [challengeCaptureTitle, setChallengeCaptureTitle] = useState('');
  const [challengeCaptureId, setChallengeCaptureId] = useState('');
  const [challengeCapturePrompt, setChallengeCapturePrompt] = useState('');
  const [challengeCaptureHints, setChallengeCaptureHints] = useState('');
  const [challengeCaptureError, setChallengeCaptureError] = useState<string | null>(null);
  const [challengeCaptureDifficulty, setChallengeCaptureDifficulty] =
    useState<'beginner' | 'intermediate' | 'expert'>('beginner');
  const [replaceSelectionAfterCreate, setReplaceSelectionAfterCreate] = useState(true);
  const [hoveredTraceModuleId, setHoveredTraceModuleId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [activeAnalysisTraceEntry, setActiveAnalysisTraceEntry] =
    useState<ExecutionTraceEntry | null>(null);
  const [paletteViewMode, setPaletteViewMode] = useState<'compact' | 'expanded'>('expanded');
  const [workspaceClipboardSnapshot, setWorkspaceClipboardSnapshot] =
    useState<WorkspaceClipboardSnapshot | null>(null);
  const [requestedWorkspaceFocusModuleId, setRequestedWorkspaceFocusModuleId] =
    useState<string | null>(null);

  const availableProjects = useMemo(
    () => [
      ...demoProjects,
      ...state.userWorkspaceLibrary.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        group: workspace.group ?? 'My Workspaces',
        summary: workspace.summary,
        pipeline: workspace.pipeline,
        defaultTickedMode: workspace.defaultTickedMode,
        project: state.projectStates[workspace.id] ?? { modules: [], connections: [] },
        layout: state.layoutByProject[workspace.id] ?? {},
      })),
    ],
    [state.layoutByProject, state.projectStates, state.userWorkspaceLibrary],
  );
  const activeProjectDefinition =
    availableProjects.find((project) => project.id === state.activeProjectId) ??
    availableProjects[0];
  const effectiveRegistry = getEffectiveRegistry(V1_REGISTRY, state.compositeLibrary);
  const baseProjectState =
    state.projectStates[activeProjectDefinition.id] ?? activeProjectDefinition.project;
  const baseLayout =
    state.layoutByProject[activeProjectDefinition.id] ?? activeProjectDefinition.layout;
  const baseAnnotations =
    state.annotationsByProject[activeProjectDefinition.id] ?? [];
  const activeCompositeEntry = state.compositeEditor
    ? state.compositeLibrary.find((entry) => entry.id === state.compositeEditor?.entryId) ?? null
    : null;
  const activeProjectState = state.compositeEditor?.project ?? baseProjectState;
  const activeLayout = state.compositeEditor?.layout ?? baseLayout;
  const activeAnnotations = state.compositeEditor ? [] : baseAnnotations;
  const effectiveSelectedModuleId = state.compositeEditor
    ? state.compositeEditor.selectedModuleId
    : getSelectedModuleId(state, activeProjectDefinition.id, activeProjectState);
  const effectiveSelectedModuleIds = state.compositeEditor
    ? state.compositeEditor.selectedModuleIds
    : getSelectedModuleIds(state, activeProjectDefinition.id, activeProjectState);
  const selectedModule =
    activeProjectState.modules.find(
      (moduleInstance) => moduleInstance.id === effectiveSelectedModuleId,
    ) ?? null;
  const selectedModuleDef = selectedModule
    ? (effectiveRegistry[selectedModule.defId] ?? null)
    : null;
  const selectedModuleParamKeys = useMemo(
    () =>
      selectedModuleDef
        ? Object.values(selectedModuleDef.paramSchema).map((field) => field.key)
        : [],
    [selectedModuleDef],
  );
  const compositeUsageCountById = Object.values(state.projectStates).reduce<Record<string, number>>(
    (counts, project) => {
      for (const moduleInstance of project.modules) {
        if (!state.compositeLibrary.some((entry) => entry.id === moduleInstance.defId)) {
          continue;
        }

        counts[moduleInstance.defId] = (counts[moduleInstance.defId] ?? 0) + 1;
      }

      return counts;
    },
    {},
  );
  const builtInReusableIds = state.compositeLibrary
    .filter((entry) => entry.source === 'built-in')
    .map((entry) => entry.id);

  const isTickedMode = !state.compositeEditor && (state.tickedModeByProject[activeProjectDefinition.id] ?? false);
  const currentTick = state.currentTickByProject[activeProjectDefinition.id] ?? 0;
  const isTickPlaybackActive =
    state.isTickPlaybackActiveByProject[activeProjectDefinition.id] ?? false;
  const tickPlaybackSpeedMs =
    state.tickPlaybackSpeedMsByProject[activeProjectDefinition.id] ?? 500;
  const activeWorkspaceHistory =
    state.workspaceHistoryByProject[activeProjectDefinition.id] ?? { past: [], future: [] };
  const activeWorkspaceVersions =
    state.workspaceVersionsByProject[activeProjectDefinition.id] ?? [];
  const canUndoWorkspaceHistory = !state.compositeEditor && activeWorkspaceHistory.past.length > 0;
  const canRedoWorkspaceHistory = !state.compositeEditor && activeWorkspaceHistory.future.length > 0;
  const compositeSelectionPreview = useMemo(
    () =>
      previewCompositeSelection({
        project: activeProjectState,
        registry: effectiveRegistry,
        selectedModuleIds: effectiveSelectedModuleIds,
        excludedBoundaryPortKeys: excludedCompositeBoundaryPortKeys,
      }),
    [activeProjectState, effectiveRegistry, effectiveSelectedModuleIds, excludedCompositeBoundaryPortKeys],
  );

  let execution: ExecutionResult | null = null;
  let executionError: string | null = null;
  let tickedExecution: TickedExecutionResult | null = null;
  let tickCount: number | null = null;
  const validationResult = validateProject(activeProjectState, effectiveRegistry);
  const validationIssues = validationResult.issues;

  if (validationResult.ok) {
    try {
      if (isTickedMode) {
        tickCount = deriveTickCount(activeProjectState, effectiveRegistry);
        if (tickCount !== null && tickCount > 0) {
          tickedExecution = executeTickedProject(activeProjectState, effectiveRegistry, tickCount);
          const effectiveTick = Math.min(currentTick, tickCount - 1);
          execution = tickedExecution.ticks[effectiveTick] ?? null;
        } else {
          execution = runDemoProject(activeProjectState, effectiveRegistry);
        }
      } else {
        execution = runDemoProject(activeProjectState, effectiveRegistry);
      }
    } catch (error) {
      executionError = error instanceof Error ? error.message : 'Execution failed.';
    }
  } else {
    executionError = 'Execution is blocked until the graph is valid.';
  }

  const effectiveTickCount = tickCount ?? 0;
  const effectiveCurrentTick = tickedExecution
    ? Math.min(currentTick, effectiveTickCount - 1)
    : 0;
  const tickHistoryByModule = tickedExecution
    ? Object.fromEntries(
        activeProjectState.modules.map((moduleInstance) => {
          const moduleDef = effectiveRegistry[moduleInstance.defId];
          const primaryPort = moduleDef?.outputs[0]?.name;
          if (!primaryPort) {
            return [moduleInstance.id, []];
          }

          const history = tickedExecution.ticks.map((tick) =>
            formatTickSignal(tick.outputsByModuleId[moduleInstance.id]?.[primaryPort]),
          );
          return [moduleInstance.id, history];
        }),
      )
    : null;
  const collectedOutput = tickedExecution
    ? tickedExecution.ticks
        .map((tick) => {
          const outputModule = activeProjectState.modules.find(
            (m) => isOutputSinkDefId(m.defId),
          );
          if (!outputModule) return '';
          const outputTraceEntry = tick.trace.find(
            (entry) => entry.moduleId === outputModule.id,
          );
          const signal =
            tick.outputsByModuleId[outputModule.id]?.out ??
            outputTraceEntry?.inputs.in ??
            null;
          if (!signal) return '';
          return signal.type === 'symbol' ? signal.value : signal.value.join('');
        })
        .join('')
    : null;

  useEffect(() => {
    if (!isTickedMode || !tickedExecution) {
      return;
    }

    if (currentTick !== effectiveCurrentTick) {
      dispatch({
        type: 'setCurrentTick',
        projectId: activeProjectDefinition.id,
        tick: effectiveCurrentTick,
      });
    }
  }, [
    activeProjectDefinition.id,
    currentTick,
    effectiveCurrentTick,
    isTickedMode,
    tickedExecution,
  ]);

  useEffect(() => {
    if (
      !isTickedMode ||
      !tickedExecution ||
      effectiveTickCount <= 1 ||
      !isTickPlaybackActive
    ) {
      return;
    }

    if (effectiveCurrentTick >= effectiveTickCount - 1) {
      dispatch({
        type: 'setTickPlaybackActive',
        projectId: activeProjectDefinition.id,
        active: false,
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({
        type: 'setCurrentTick',
        projectId: activeProjectDefinition.id,
        tick: effectiveCurrentTick + 1,
      });
      dispatch({
        type: 'setTickPlaybackActive',
        projectId: activeProjectDefinition.id,
        active: true,
      });
    }, tickPlaybackSpeedMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeProjectDefinition.id,
    effectiveCurrentTick,
    effectiveTickCount,
    isTickPlaybackActive,
    isTickedMode,
    tickPlaybackSpeedMs,
    tickedExecution,
  ]);

  const effectiveStepIndex =
    stepIndex !== null && execution && execution.trace.length > 0
      ? Math.min(Math.max(0, stepIndex), execution.trace.length - 1)
      : null;
  const steppedModuleId =
    effectiveStepIndex !== null && execution
      ? execution.trace[effectiveStepIndex]?.moduleId ?? null
      : null;
  const activeAnalysisOwnerModuleId = activeAnalysisTraceEntry
    ? activeAnalysisTraceEntry.moduleId.split('/')[0] ?? activeAnalysisTraceEntry.moduleId
    : null;
  const comparisonBaseline = state.comparisonBaselinesByProject[activeProjectDefinition.id] ?? null;
  const baselineValidation = comparisonBaseline
    ? validateProject(comparisonBaseline.project, effectiveRegistry)
    : null;
  let baselineExecution: ExecutionResult | null = null;
  let baselineExecutionError: string | null = null;
  if (comparisonBaseline && baselineValidation?.ok) {
    try {
      baselineExecution = runDemoProject(comparisonBaseline.project, effectiveRegistry);
    } catch (error) {
      baselineExecutionError = error instanceof Error ? error.message : 'Baseline execution failed.';
    }
  } else if (comparisonBaseline && baselineValidation && !baselineValidation.ok) {
    baselineExecutionError = 'Baseline is no longer valid against the current registry.';
  }
  const executionComparison =
    baselineExecution && execution
      ? compareExecutionResults(baselineExecution, execution)
      : null;
  const divergenceModuleId =
    executionComparison?.firstDivergence?.variant?.moduleId ??
    executionComparison?.firstDivergence?.baseline?.moduleId ??
    null;
  const baselineSelectedModule = comparisonBaseline && selectedModule
    ? comparisonBaseline.project.modules.find((moduleInstance) => moduleInstance.id === selectedModule.id) ?? null
    : null;
  const activeChallengeId = state.activeChallengeIdByProject[activeProjectDefinition.id] ?? null;
  const challengeSelectedForProject =
    activeChallengeId !== null
      ? state.challengeLibrary.find(
          (challenge) =>
            challenge.id === activeChallengeId &&
            (challenge.projectId === undefined || challenge.projectId === activeProjectDefinition.id),
        ) ?? null
      : null;
  const selectedChallenge =
    challengeSelectedForProject ??
    state.challengeLibrary.find((candidate) => candidate.projectId === activeProjectDefinition.id) ??
    state.challengeLibrary[0] ??
    null;
  const selectedChallengeProjectId = selectedChallenge?.projectId ?? activeProjectDefinition.id;
  const selectedChallengeProjectDefinition =
    availableProjects.find((project) => project.id === selectedChallengeProjectId) ??
    activeProjectDefinition;
  const challengeEvaluation =
    !state.compositeEditor && selectedChallenge
      ? evaluateChallengeAttempt(selectedChallenge, activeProjectState, effectiveRegistry)
      : null;
  const selectedTutorial =
    state.tutorialLibrary.find(
      (tutorial) =>
        tutorial.id ===
        (state.activeTutorialIdByProject[activeProjectDefinition.id] ??
          state.tutorialLibrary[0]?.id ??
          null),
    ) ??
    state.tutorialLibrary[0] ??
    null;
  const tutorialStepIndex = clampTutorialStepIndex(
    selectedTutorial,
    state.activeTutorialStepByProject[activeProjectDefinition.id] ?? 0,
  );
  const selectedTutorialStep = getTutorialStep(selectedTutorial, tutorialStepIndex);
  const workspaceMode = state.workspaceModeByProject[activeProjectDefinition.id] ?? 'guide';
  const hasChallengePanel = workspaceMode !== 'cryptanalysis' && Boolean(selectedChallenge);
  const hasTutorialPanel = workspaceMode !== 'cryptanalysis' && Boolean(selectedTutorial);
  const activeLearningPanelTab =
    learningPanelTab === 'challenge'
      ? hasChallengePanel
        ? 'challenge'
        : 'tutorial'
      : hasTutorialPanel
        ? 'tutorial'
        : 'challenge';
  const tutorialNotesVisible =
    state.tutorialNotesVisibleByProject[activeProjectDefinition.id] ?? true;
  const canCaptureChallenge =
    !state.compositeEditor &&
    comparisonBaseline !== null &&
    baselineValidation?.ok === true &&
    baselineExecutionError === null;
  const activeTutorialStep =
    workspaceMode === 'guide' &&
    tutorialNotesVisible &&
    !state.compositeEditor &&
    selectedTutorial?.projectId === activeProjectDefinition.id
      ? selectedTutorialStep
      : null;
  const detachedPaletteSnapshot = useMemo<DetachedPaletteSnapshot>(
    () => ({
      theme,
      paletteViewMode,
      compositeLibrary: state.compositeLibrary,
      compositeUsageCountById,
      builtInReusableIds,
    }),
    [builtInReusableIds, compositeUsageCountById, paletteViewMode, state.compositeLibrary, theme],
  );
  const detachedInspectorSnapshot = useMemo<DetachedInspectorSnapshot>(
    () => ({
      theme,
      projectId: activeProjectDefinition.id,
      execution,
      executionError,
      validationIssues,
      stepIndex: effectiveStepIndex,
      project: activeProjectState,
      tutorialStep: activeTutorialStep,
      projectName: activeProjectDefinition.name,
      comparisonBaseline,
      executionComparison,
      baselineOutput: baselineExecution ? executionComparison?.baselineOutput.formatted ?? 'n/a' : 'blocked',
      variantOutput: execution ? executionComparison?.variantOutput.formatted ?? 'n/a' : 'blocked',
      baselineExecutionError,
      baselineModuleId: baselineSelectedModule?.id ?? null,
      selectedModuleId: selectedModule?.id ?? null,
      selectedModuleIds: effectiveSelectedModuleIds,
      parameterClipboard,
      paramDrafts: state.compositeEditor
        ? { ...state.compositeEditor.paramDrafts }
        : Object.fromEntries(
            Object.entries(state.paramDrafts)
              .filter(([key]) => key.startsWith(`${activeProjectDefinition.id}:`))
              .map(([key, value]) => [key.slice(activeProjectDefinition.id.length + 1), value]),
          ),
      compositeLibrary: state.compositeLibrary,
      probedModuleIds: state.probedModuleIdsByProject[activeProjectDefinition.id] ?? [],
      isTickedMode,
      currentTick: effectiveCurrentTick,
      tickCount: effectiveTickCount,
      tickedParamsByModule: tickedExecution?.paramsByModuleByTick ?? null,
      tickHistoryByModule,
      collectedOutput,
      activeAnalysisTraceEntry,
      requestedWorkspaceFocusModuleId,
      canRenameModuleIds: !state.compositeEditor,
    }),
    [
      activeAnalysisTraceEntry,
      activeProjectDefinition.id,
      activeProjectDefinition.name,
      activeProjectState,
      activeTutorialStep,
      baselineExecution,
      baselineExecutionError,
      baselineSelectedModule,
      collectedOutput,
      comparisonBaseline,
      effectiveCurrentTick,
      effectiveSelectedModuleIds,
      effectiveStepIndex,
      effectiveTickCount,
      execution,
      executionComparison,
      executionError,
      isTickedMode,
      parameterClipboard,
      requestedWorkspaceFocusModuleId,
      selectedModule,
      state.compositeEditor,
      state.compositeLibrary,
      state.paramDrafts,
      state.probedModuleIdsByProject,
      theme,
      tickHistoryByModule,
      tickedExecution,
      validationIssues,
    ],
  );
  const completedTutorialIds = useMemo(
    () => state.completedTutorialsByProject[activeProjectDefinition.id] ?? [],
    [activeProjectDefinition.id, state.completedTutorialsByProject],
  );
  const isTutorialCompleted = selectedTutorial
    ? completedTutorialIds.includes(selectedTutorial.id)
    : false;
  const detachedLearningSnapshot = useMemo<DetachedLearningSnapshot>(
    () => ({
      theme,
      learningPanelTab: activeLearningPanelTab,
      hasTutorialPanel,
      hasChallengePanel,
      tutorials: state.tutorialLibrary,
      challenges: state.challengeLibrary,
      selectedTutorialId: selectedTutorial?.id ?? null,
      selectedChallengeId: selectedChallenge?.id ?? null,
      currentProjectId: activeProjectDefinition.id,
      currentProject: activeProjectState,
      tutorialStepIndex,
      selectedTutorialStep,
      completedTutorialIds,
      isTutorialCompleted,
      workspaceMode,
      tutorialNotesVisible,
      challengeEvaluation,
      canCaptureChallenge,
    }),
    [
      activeLearningPanelTab,
      activeProjectDefinition.id,
      activeProjectState,
      canCaptureChallenge,
      challengeEvaluation,
      completedTutorialIds,
      hasChallengePanel,
      hasTutorialPanel,
      isTutorialCompleted,
      selectedChallenge,
      selectedTutorial,
      selectedTutorialStep,
      state.challengeLibrary,
      state.tutorialLibrary,
      theme,
      tutorialNotesVisible,
      tutorialStepIndex,
      workspaceMode,
    ],
  );
  const syncTutorialStepFromTrace = useCallback(
    (nextIndex: number | null) => {
      setStepIndex(nextIndex);

      if (
        nextIndex === null ||
        workspaceMode !== 'guide' ||
        !selectedTutorial ||
        state.compositeEditor ||
        selectedTutorial.projectId !== activeProjectDefinition.id ||
        !execution
      ) {
        return;
      }

      const nextTrace = execution.trace[nextIndex] ?? null;
      if (!nextTrace) {
        return;
      }

      const tutorialStepMatchIndex = selectedTutorial.steps.findIndex(
        (step) =>
          step.targetStepIndex === nextIndex ||
          (step.focusModuleId !== undefined && step.focusModuleId === nextTrace.moduleId),
      );
      if (tutorialStepMatchIndex >= 0 && tutorialStepMatchIndex !== tutorialStepIndex) {
        dispatch({
          type: 'setTutorialStep',
          projectId: activeProjectDefinition.id,
          stepIndex: tutorialStepMatchIndex,
        });
      }
    },
    [
      activeProjectDefinition.id,
      execution,
      selectedTutorial,
      state.compositeEditor,
      tutorialStepIndex,
      workspaceMode,
    ],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveWorkspaceToStorage(state);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('mcw:theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      'mcw:challenge-export',
      challengeCaptureShouldExport ? 'true' : 'false',
    );
  }, [challengeCaptureShouldExport]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('mcw:left-dock-width', String(leftDockWidth));
  }, [leftDockWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('mcw:right-dock-width', String(rightDockWidth));
  }, [rightDockWidth]);

  useEffect(() => {
    if (!dockResizeState || typeof window === 'undefined') {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (dockResizeState.side === 'left') {
        const nextWidth = dockResizeState.originWidth + (event.clientX - dockResizeState.originX);
        setLeftDockWidth(clampDockWidth(nextWidth, MIN_LEFT_DOCK_WIDTH, MAX_LEFT_DOCK_WIDTH));
      } else {
        const nextWidth = dockResizeState.originWidth - (event.clientX - dockResizeState.originX);
        setRightDockWidth(clampDockWidth(nextWidth, MIN_RIGHT_DOCK_WIDTH, MAX_RIGHT_DOCK_WIDTH));
      }
    };

    const handlePointerUp = () => {
      setDockResizeState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    document.body.classList.add('dock-resizing');

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.classList.remove('dock-resizing');
    };
  }, [dockResizeState]);

  function handleCreateBlankWorkspace() {
    const proposedName = window.prompt('Blank workspace name:', 'New Workspace');
    const name = proposedName?.trim();
    if (!name) {
      return;
    }
    const workspaceId = createUniqueWorkspaceId(
      name,
      new Set(availableProjects.map((project) => project.id)),
    );
    dispatch({
      type: 'createBlankWorkspace',
      workspaceId,
      name,
      summary: 'A blank personal workspace for building from scratch.',
      pipeline: 'Blank canvas',
    });
  }

  function handleSaveCurrentWorkspace() {
    const existingWorkspace = state.userWorkspaceLibrary.find(
      (workspace) => workspace.id === activeProjectDefinition.id,
    );
    const proposedName = window.prompt(
      'Save workspace as:',
      existingWorkspace?.name ?? `${activeProjectDefinition.name} Copy`,
    );
    const name = proposedName?.trim();
    if (!name) {
      return;
    }
    const usedIds = new Set(availableProjects.map((project) => project.id));
    if (existingWorkspace) {
      usedIds.delete(existingWorkspace.id);
    }
    const workspaceId = existingWorkspace?.id ?? createUniqueWorkspaceId(name, usedIds);
    dispatch({
      type: 'saveWorkspaceAs',
      sourceProjectId: activeProjectDefinition.id,
      workspaceId,
      name,
      summary:
        existingWorkspace?.summary ??
        `A personal workspace built from ${activeProjectDefinition.name}.`,
      pipeline: describeWorkspacePipeline(activeProjectState),
      defaultTickedMode: state.tickedModeByProject[activeProjectDefinition.id] ?? false,
    });
  }

  function handleDuplicateCurrentWorkspace() {
    const existingNames = new Set(
      state.userWorkspaceLibrary.map((workspace) => workspace.name),
    );
    const sourceName =
      state.userWorkspaceLibrary.find((workspace) => workspace.id === activeProjectDefinition.id)?.name ??
      activeProjectDefinition.name;
    const suggestedName = createDuplicateWorkspaceName(sourceName, existingNames);
    const proposedName = window.prompt('Duplicate workspace as:', suggestedName);
    const name = proposedName?.trim();
    if (!name) {
      return;
    }

    const workspaceId = createUniqueWorkspaceId(
      name,
      new Set(availableProjects.map((project) => project.id)),
    );
    dispatch({
      type: 'saveWorkspaceAs',
      sourceProjectId: activeProjectDefinition.id,
      workspaceId,
      name,
      summary: `A duplicated workspace based on ${sourceName}.`,
      pipeline: describeWorkspacePipeline(activeProjectState),
      defaultTickedMode: state.tickedModeByProject[activeProjectDefinition.id] ?? false,
    });
  }

  const handleOpenPrimitiveMicroDemo = useCallback(
    (defId: string) => {
      if (state.compositeEditor) {
        window.alert('Primitive micro demos are unavailable while editing a reusable composite.');
        return;
      }

      const microDemo = getPrimitiveMicroDemo(defId);
      if (!microDemo) {
        return;
      }

      const existingWorkspaceNames = new Set(
        state.userWorkspaceLibrary.map((workspace) => workspace.name),
      );
      const workspaceName = createWorkspaceNameFromBase(microDemo.name, existingWorkspaceNames);
      const workspaceId = createUniqueWorkspaceId(
        workspaceName,
        new Set(availableProjects.map((project) => project.id)),
      );

      dispatch({
        type: 'createBlankWorkspace',
        workspaceId,
        name: workspaceName,
        summary: microDemo.summary,
        pipeline: microDemo.pipeline,
      });
      dispatch({
        type: 'loadDocument',
        projectId: workspaceId,
        document: microDemo.document,
      });
      dispatch({
        type: 'setTickedMode',
        projectId: workspaceId,
        enabled: microDemo.defaultTickedMode ?? false,
      });
      setImportError(null);
    },
    [availableProjects, state.compositeEditor, state.userWorkspaceLibrary],
  );

  function handleCopySelectedCluster() {
    if (state.compositeEditor) {
      return;
    }

    const snapshot = buildWorkspaceClipboardSnapshot({
      project: activeProjectState,
      layout: activeLayout,
      selectedModuleIds: effectiveSelectedModuleIds,
    });
    if (!snapshot) {
      window.alert('Select one or more modules before copying.');
      return;
    }

    setWorkspaceClipboardSnapshot(snapshot);
    setImportError(null);
  }

  function handlePasteSelectedCluster() {
    if (state.compositeEditor) {
      return;
    }

    if (!workspaceClipboardSnapshot) {
      window.alert('Copy a module cluster before pasting.');
      return;
    }

    const pasted = pasteWorkspaceClipboardSnapshot({
      targetProject: activeProjectState,
      targetLayout: activeLayout,
      snapshot: workspaceClipboardSnapshot,
    });

    dispatch({
      type: 'loadDocument',
      projectId: activeProjectDefinition.id,
      document: {
        version: 1,
        project: pasted.project,
        ui: {
          layout: pasted.layout,
          annotations: activeAnnotations,
        },
      },
    });
    setImportError(null);

    const [firstModuleId, ...restModuleIds] = pasted.pastedModuleIds;
    if (firstModuleId) {
      dispatch({
        type: 'selectModule',
        projectId: activeProjectDefinition.id,
        moduleId: firstModuleId,
      });
      for (const selectedModuleId of restModuleIds) {
        dispatch({
          type: 'selectModule',
          projectId: activeProjectDefinition.id,
          moduleId: selectedModuleId,
          additive: true,
        });
      }
    }
  }

  function handleDuplicateSelectedCluster() {
    if (state.compositeEditor) {
      return;
    }

    if (effectiveSelectedModuleIds.length === 0) {
      window.alert('Select one or more modules before duplicating.');
      return;
    }

    dispatch({
      type: 'duplicateSelectedCluster',
      projectId: activeProjectDefinition.id,
    });
    setImportError(null);
  }

  function handleDeleteCurrentWorkspace() {
    const existingWorkspace = state.userWorkspaceLibrary.find(
      (workspace) => workspace.id === activeProjectDefinition.id,
    );
    if (!existingWorkspace) {
      return;
    }
    const shouldDelete = window.confirm(
      `Delete workspace "${existingWorkspace.name}"? This removes its saved copy from your personal workspace library.`,
    );
    if (!shouldDelete) {
      return;
    }
    dispatch({
      type: 'removeWorkspace',
      workspaceId: existingWorkspace.id,
      fallbackProjectId: demoProjects[0]?.id ?? '',
    });
  }

  function handleDeleteSelectedCluster() {
    if (state.compositeEditor) {
      return;
    }

    if (effectiveSelectedModuleIds.length === 0) {
      window.alert('Select one or more modules before deleting.');
      return;
    }

    dispatch({
      type: 'deleteSelectedCluster',
      projectId: activeProjectDefinition.id,
    });
    setImportError(null);
  }

  function handleUndoWorkspaceHistory() {
    if (state.compositeEditor || !canUndoWorkspaceHistory) {
      return;
    }

    dispatch({
      type: 'undoWorkspaceHistory',
      projectId: activeProjectDefinition.id,
    });
    setImportError(null);
  }

  function handleRedoWorkspaceHistory() {
    if (state.compositeEditor || !canRedoWorkspaceHistory) {
      return;
    }

    dispatch({
      type: 'redoWorkspaceHistory',
      projectId: activeProjectDefinition.id,
    });
    setImportError(null);
  }

  function handleSaveWorkspaceVersion() {
    if (state.compositeEditor) {
      return;
    }

    const proposedName = window.prompt(
      'Save version as:',
      `${activeProjectDefinition.name} Checkpoint ${activeWorkspaceVersions.length + 1}`,
    );
    const name = proposedName?.trim();
    if (!name) {
      return;
    }

    const savedAt = new Date().toISOString();
    dispatch({
      type: 'saveWorkspaceVersion',
      projectId: activeProjectDefinition.id,
      versionId: createWorkspaceVersionId(activeProjectDefinition.id, savedAt),
      name,
      savedAt,
    });
    setImportError(null);
  }

  function handleRestoreWorkspaceVersion(versionId: string) {
    if (state.compositeEditor) {
      return;
    }

    const version = activeWorkspaceVersions.find((entry) => entry.id === versionId);
    if (!version) {
      return;
    }

    const shouldRestore = window.confirm(
      `Restore version "${version.name}"? This replaces the current live workspace state.`,
    );
    if (!shouldRestore) {
      return;
    }

    dispatch({
      type: 'restoreWorkspaceVersion',
      projectId: activeProjectDefinition.id,
      versionId,
    });
    setImportError(null);
  }

  const handleUnzipComposite = useCallback(
    (moduleId: string) => {
      if (!selectedModule || selectedModule.id !== moduleId) {
        return;
      }
      const compositeEntry = state.compositeLibrary.find(
        (entry) => entry.id === selectedModule.defId,
      );
      if (!compositeEntry) {
        return;
      }

      const unzipped = unzipCompositeInstance({
        project: activeProjectState,
        layout: activeLayout,
        entry: compositeEntry,
        moduleId,
        moduleParams: selectedModule.params,
      });

      if (!unzipped.ok || !unzipped.project || !unzipped.layout) {
        setImportError(unzipped.error ?? 'Unable to unzip the selected composite.');
        return;
      }

      dispatch({
        type: 'loadDocument',
        projectId: activeProjectDefinition.id,
        document: {
          version: 1,
          project: unzipped.project,
          ui: {
            layout: unzipped.layout,
            annotations: state.compositeEditor
              ? []
              : state.annotationsByProject[activeProjectDefinition.id] ?? [],
          },
        },
      });
      setImportError(null);

      const [firstModuleId, ...restModuleIds] = unzipped.selectedModuleIds ?? [];
      if (firstModuleId) {
        dispatch({
          type: 'selectModule',
          projectId: activeProjectDefinition.id,
          moduleId: firstModuleId,
        });
        for (const selectedModuleId of restModuleIds) {
          dispatch({
            type: 'selectModule',
            projectId: activeProjectDefinition.id,
            moduleId: selectedModuleId,
            additive: true,
          });
        }
      }
    },
    [
      activeLayout,
      activeProjectDefinition.id,
      activeProjectState,
      selectedModule,
      state.annotationsByProject,
      state.compositeEditor,
      state.compositeLibrary,
    ],
  );

  function openDetachedPanel(kind: DetachedPanelKind) {
    if (typeof window === 'undefined') {
      return;
    }

    const panelWindowId = createWindowSessionId();
    const detachedWindow = window.open(
      createDetachedPanelUrl(
        window.location.href,
        kind,
        hostWindowIdRef.current,
        panelWindowId,
      ),
      createDetachedPanelWindowName(kind, panelWindowId),
      'popup=yes,width=520,height=980,resizable=yes,scrollbars=yes',
    );

    if (!detachedWindow) {
      setImportError(`Unable to open the ${kind} window.`);
      return;
    }

    detachedPanelWindowsRef.current[kind] = detachedWindow;
    setDetachedPanels((current) => ({ ...current, [kind]: true }));
  }

  function returnDetachedPanelToMain(kind: DetachedPanelKind) {
    detachedPanelWindowsRef.current[kind]?.close();
    detachedPanelWindowsRef.current[kind] = null;
    setDetachedPanels((current) => ({ ...current, [kind]: false }));
  }

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(DETACHED_PANEL_CHANNEL_NAME);

    const postSnapshot = (kind: DetachedPanelKind, panelWindowId: string) => {
      const snapshot: DetachedPanelStateSnapshot = {
        hostId: hostWindowIdRef.current,
        panelWindowId,
        kind,
        payload:
          kind === 'palette'
            ? detachedPaletteSnapshot
            : kind === 'inspector'
              ? detachedInspectorSnapshot
              : detachedLearningSnapshot,
      };
      const message: DetachedPanelMessage = {
        type: 'snapshot',
        snapshot,
      };
      channel.postMessage(message);
    };

    const handleMessage = (event: MessageEvent<DetachedPanelMessage>) => {
      const message = event.data;

      if ('hostId' in message && message.hostId !== hostWindowIdRef.current) {
        return;
      }

      if (message.type === 'requestSnapshot') {
        postSnapshot(message.kind, message.panelWindowId);
        return;
      }

      if (message.type === 'dispatchAction') {
        dispatch(message.action);
        return;
      }

      if (message.type === 'command') {
        switch (message.command.type) {
          case 'togglePaletteViewMode':
            setPaletteViewMode((currentMode) =>
              currentMode === 'expanded' ? 'compact' : 'expanded',
            );
            return;
          case 'addModule': {
            const moduleDef = effectiveRegistry[message.command.defId] ?? null;
            if (!moduleDef) {
              return;
            }
            dispatch({
              type: 'addModule',
              projectId: activeProjectDefinition.id,
              moduleDef,
            });
            return;
          }
          case 'openComposite':
            dispatch({
              type: 'openCompositeEditor',
              entryId: message.command.defId,
            });
            return;
          case 'duplicateReusable': {
            const { defId } = message.command;
            const entry = state.compositeLibrary.find(
              (candidate) => candidate.id === defId,
            );
            if (!entry) {
              return;
            }
            const nextEntry = createUserOwnedReusableDuplicate(entry, state.compositeLibrary);
            dispatch({ type: 'addCompositeToLibrary', entry: nextEntry });
            if (isCompositeDefinition(nextEntry.definition)) {
              dispatch({ type: 'openCompositeEditor', entryId: nextEntry.id });
            }
            return;
          }
          case 'openPrimitiveMicroDemo':
            handleOpenPrimitiveMicroDemo(message.command.defId);
            return;
          case 'exportCompositeLibrary':
            downloadCompositeLibraryDocument({
              version: 1,
              entries: state.compositeLibrary,
            });
            return;
          case 'removeComposite':
            dispatch({
              type: 'removeCompositeFromLibrary',
              compositeId: message.command.defId,
            });
            return;
          case 'copyParams':
            if (!selectedModule || !selectedModuleDef || selectedModule.id !== message.command.moduleId) {
              return;
            }
            setParameterClipboard({
              sourceModuleId: selectedModule.id,
              sourceDefId: selectedModuleDef.id,
              params: Object.fromEntries(
                selectedModuleParamKeys.map((key) => [
                  key,
                  selectedModule.params[key] ?? selectedModuleDef.paramSchema[key]?.defaultValue,
                ]),
              ),
              paramKeys: selectedModuleParamKeys,
            });
            return;
          case 'applyCopiedParams':
            dispatch({
              type: 'applyCopiedParams',
              projectId: activeProjectDefinition.id,
              sourceModuleId: message.command.sourceModuleId,
              sourceDefId: message.command.sourceDefId,
              targetModuleIds: message.command.targetModuleIds,
              params: message.command.params,
              paramKeys: message.command.paramKeys,
            });
            return;
          case 'deleteModule':
            if (
              state.compositeEditor &&
              activeCompositeEntry &&
              isCompositeBoundaryModule(activeCompositeEntry, message.command.moduleId)
            ) {
              dispatch({
                type: 'setCompositeEditorSaveError',
                message:
                  'This module is bound to an exposed composite port. Boundary editing will come in a later slice.',
              });
              return;
            }
            dispatch({
              type: 'removeModule',
              projectId: activeProjectDefinition.id,
              moduleId: message.command.moduleId,
            });
            return;
          case 'traceHover':
            setHoveredTraceModuleId(message.command.moduleId);
            return;
          case 'stepChange':
            syncTutorialStepFromTrace(message.command.nextIndex);
            return;
          case 'activeAnalysisTraceChange':
            setActiveAnalysisTraceEntry(message.command.entry);
            return;
          case 'requestFocusModule':
            setRequestedWorkspaceFocusModuleId(message.command.moduleId);
            return;
          case 'captureBaseline':
            dispatch({
              type: 'captureComparisonBaseline',
              projectId: activeProjectDefinition.id,
              capturedAt: new Date().toISOString(),
            });
            return;
          case 'clearBaseline':
            dispatch({
              type: 'clearComparisonBaseline',
              projectId: activeProjectDefinition.id,
            });
            return;
          case 'unzipComposite':
            handleUnzipComposite(message.command.moduleId);
            return;
          case 'setLearningTab':
            setLearningPanelTab(message.command.tab);
            return;
          case 'selectChallenge': {
            const { challengeId } = message.command;
            const nextChallenge =
              state.challengeLibrary.find((challenge) => challenge.id === challengeId) ??
              null;
            const challengeProjectId = nextChallenge?.projectId ?? activeProjectDefinition.id;
            setLearningPanelTab('challenge');
            if (challengeProjectId !== activeProjectDefinition.id) {
              dispatch({ type: 'switchProject', projectId: challengeProjectId });
            }
            dispatch({
              type: 'selectChallenge',
              projectId: challengeProjectId,
              challengeId,
            });
            return;
          }
          case 'loadChallengeStart':
            setLearningPanelTab('challenge');
            setIsChallengeResetConfirmOpen(true);
            return;
          case 'exportChallenge':
            if (selectedChallenge) {
              downloadGuidedChallengeDocument(selectedChallenge);
            }
            return;
          case 'importChallengeRaw': {
            const challengeDocument = parseGuidedChallengeDocument(message.command.rawValue);
            if (!challengeDocument) {
              setImportError('The selected file is not a valid MCW guided challenge document.');
              return;
            }
            dispatch({ type: 'upsertChallenge', challenge: challengeDocument });
            const challengeProjectId = challengeDocument.projectId ?? activeProjectDefinition.id;
            setLearningPanelTab('challenge');
            if (challengeProjectId !== activeProjectDefinition.id) {
              dispatch({ type: 'switchProject', projectId: challengeProjectId });
            }
            dispatch({
              type: 'selectChallenge',
              projectId: challengeProjectId,
              challengeId: challengeDocument.id,
            });
            setImportError(null);
            return;
          }
          case 'captureChallenge':
            setLearningPanelTab('challenge');
            {
              const draft = createChallengeCaptureDraft(
                activeProjectDefinition.id,
                activeProjectDefinition.name,
              );
              setChallengeCaptureTitle(draft.title);
              setChallengeCaptureId(draft.id);
              setChallengeCaptureDifficulty(draft.difficulty);
              setChallengeCapturePrompt(draft.prompt);
              setChallengeCaptureHints(draft.hints);
              setChallengeCaptureShouldExport(true);
              setChallengeCaptureError(null);
              setIsChallengeCaptureOpen(true);
            }
            return;
          case 'selectTutorial': {
            const { tutorialId } = message.command;
            const nextTutorial =
              state.tutorialLibrary.find((tutorial) => tutorial.id === tutorialId) ?? null;
            setLearningPanelTab('tutorial');
            setStepIndex(nextTutorial?.steps[0]?.targetStepIndex ?? null);
            dispatch({
              type: 'selectTutorial',
              projectId: activeProjectDefinition.id,
              tutorialId,
            });
            return;
          }
          case 'setTutorialStep':
            setStepIndex(selectedTutorial?.steps[message.command.stepIndex]?.targetStepIndex ?? null);
            dispatch({
              type: 'setTutorialStep',
              projectId: activeProjectDefinition.id,
              stepIndex: message.command.stepIndex,
            });
            return;
          case 'switchProject':
            dispatch({ type: 'switchProject', projectId: message.command.projectId });
            return;
          case 'setWorkspaceMode':
            dispatch({
              type: 'setWorkspaceMode',
              projectId: activeProjectDefinition.id,
              mode: message.command.mode,
            });
            return;
          case 'setTutorialNotesVisible':
            dispatch({
              type: 'setTutorialNotesVisible',
              projectId: activeProjectDefinition.id,
              visible: message.command.visible,
            });
            return;
          case 'focusStepModule':
            setRequestedWorkspaceFocusModuleId(message.command.moduleId);
            return;
          case 'resetTutorialProgress':
            if (selectedTutorial) {
              dispatch({
                type: 'resetTutorialProgress',
                projectId: activeProjectDefinition.id,
              });
            }
            return;
        }
      }

      if (message.type === 'panelClosed') {
        detachedPanelWindowsRef.current[message.kind] = null;
        setDetachedPanels((current) => ({ ...current, [message.kind]: false }));
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [
    activeCompositeEntry,
    activeProjectDefinition.id,
    activeProjectDefinition.name,
    detachedInspectorSnapshot,
    detachedLearningSnapshot,
    detachedPaletteSnapshot,
    effectiveRegistry,
    handleOpenPrimitiveMicroDemo,
    handleUnzipComposite,
    selectedChallenge,
    selectedModule,
    selectedModuleDef,
    selectedModuleParamKeys,
    selectedTutorial,
    state.compositeEditor,
    state.challengeLibrary,
    state.compositeLibrary,
    state.tutorialLibrary,
    syncTutorialStepFromTrace,
  ]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(DETACHED_PANEL_CHANNEL_NAME);
    if (detachedPanels.palette) {
      const paletteWindow = detachedPanelWindowsRef.current.palette;
      const paletteWindowId = paletteWindow?.name.split('mcw-palette-')[1] ?? createWindowSessionId();
      channel.postMessage({
        type: 'snapshot',
        snapshot: {
          hostId: hostWindowIdRef.current,
          panelWindowId: paletteWindowId,
          kind: 'palette',
          payload: detachedPaletteSnapshot,
        },
      } satisfies DetachedPanelMessage);
    }
    if (detachedPanels.inspector) {
      const inspectorWindow = detachedPanelWindowsRef.current.inspector;
      const inspectorWindowId =
        inspectorWindow?.name.split('mcw-inspector-')[1] ?? createWindowSessionId();
      channel.postMessage({
        type: 'snapshot',
        snapshot: {
          hostId: hostWindowIdRef.current,
          panelWindowId: inspectorWindowId,
          kind: 'inspector',
          payload: detachedInspectorSnapshot,
        },
      } satisfies DetachedPanelMessage);
    }
    if (detachedPanels.learning) {
      const learningWindow = detachedPanelWindowsRef.current.learning;
      const learningWindowId = learningWindow?.name.split('mcw-learning-')[1] ?? createWindowSessionId();
      channel.postMessage({
        type: 'snapshot',
        snapshot: {
          hostId: hostWindowIdRef.current,
          panelWindowId: learningWindowId,
          kind: 'learning',
          payload: detachedLearningSnapshot,
        },
      } satisfies DetachedPanelMessage);
    }
    channel.close();
  }, [detachedInspectorSnapshot, detachedLearningSnapshot, detachedPaletteSnapshot, detachedPanels]);

  const showPaletteInMain = state.showPalette && !detachedPanels.palette;
  const showInspectorInMain = state.showInspector && !detachedPanels.inspector;
  const showLearningInMain = !detachedPanels.learning;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-copy">
          <p className="eyebrow">Modular Cryptography Workbench</p>
          <h1>Build, analyze, break, and teach cryptographic machines.</h1>
          <p className="lede">
            A visual workbench for explicit cryptography across symbols, bits, composites,
            challenges, and guided tutorials.
          </p>
        </div>

        <nav className="app-header-nav" aria-label="Workbench controls">
          <label className="header-menu-select">
            <span className="meta-label">Start Mode</span>
            <select
              value={state.defaultWorkspaceMode}
              disabled={Boolean(state.compositeEditor)}
              onChange={(event) =>
                dispatch({
                  type: 'setDefaultWorkspaceMode',
                  mode: event.target.value as 'build' | 'guide' | 'cryptanalysis',
                })
              }
            >
              <option value="build">Build</option>
              <option value="guide">Guide</option>
              <option value="cryptanalysis">Cryptanalysis</option>
            </select>
          </label>
          <label className="header-menu-select">
            <span className="meta-label">Mode</span>
            <select
              value={workspaceMode}
              disabled={Boolean(state.compositeEditor)}
              onChange={(event) =>
                dispatch({
                  type: 'setWorkspaceMode',
                  projectId: activeProjectDefinition.id,
                  mode: event.target.value as 'build' | 'guide' | 'cryptanalysis',
                })
              }
            >
              <option value="build">Build</option>
              <option value="guide">Guide</option>
              <option value="cryptanalysis">Cryptanalysis</option>
            </select>
          </label>
          <label className="header-menu-select">
            <span className="meta-label">Resources</span>
            <select
              value={headerResourceAction}
              onChange={(event) => {
                const value = event.target.value;
                setHeaderResourceAction('');
                if (value === 'notes') {
                  window.location.href = './UI-KICKOFF.md';
                } else if (value === 'repo') {
                  window.open(
                    'https://github.com/Timothy815/Modular_crypto_worksbench',
                    '_blank',
                    'noopener,noreferrer',
                  );
                } else if (value === 'cipher-museum') {
                  window.open(
                    'https://timothy815.github.io/cipher-museum/#/',
                    '_blank',
                    'noopener,noreferrer',
                  );
                }
              }}
            >
              <option value="">Open…</option>
              <option value="notes">Notes</option>
              <option value="repo">Repository</option>
              <option value="cipher-museum">Cipher Museum</option>
            </select>
          </label>
          <label className="header-menu-select">
            <span className="meta-label">Workspace</span>
            <select
              value={headerWorkspaceAction}
              onChange={(event) => {
                const value = event.target.value;
                setHeaderWorkspaceAction('');
                if (value === 'toggle-theme') {
                  setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
                } else if (value === 'toggle-palette') {
                  dispatch({ type: 'togglePalette' });
                } else if (value === 'toggle-palette-view') {
                  setPaletteViewMode((currentMode) =>
                    currentMode === 'expanded' ? 'compact' : 'expanded',
                  );
                } else if (value === 'toggle-inspector') {
                  dispatch({ type: 'toggleInspector' });
                } else if (value === 'open-palette-window') {
                  openDetachedPanel('palette');
                } else if (value === 'return-palette-window') {
                  returnDetachedPanelToMain('palette');
                } else if (value === 'open-inspector-window') {
                  openDetachedPanel('inspector');
                } else if (value === 'return-inspector-window') {
                  returnDetachedPanelToMain('inspector');
                } else if (value === 'open-learning-window') {
                  openDetachedPanel('learning');
                } else if (value === 'return-learning-window') {
                  returnDetachedPanelToMain('learning');
                } else if (value === 'toggle-step-notes') {
                  dispatch({
                    type: 'setTutorialNotesVisible',
                    projectId: activeProjectDefinition.id,
                    visible: !tutorialNotesVisible,
                  });
                } else if (value === 'new-blank-workspace') {
                  handleCreateBlankWorkspace();
                } else if (value === 'duplicate-current-workspace') {
                  handleDuplicateCurrentWorkspace();
                } else if (value === 'copy-selected-cluster') {
                  handleCopySelectedCluster();
                } else if (value === 'paste-selected-cluster') {
                  handlePasteSelectedCluster();
                } else if (value === 'duplicate-selected-cluster') {
                  handleDuplicateSelectedCluster();
                } else if (value === 'delete-selected-cluster') {
                  handleDeleteSelectedCluster();
                } else if (value === 'arrange-selected-stage-row') {
                  dispatch({
                    type: 'arrangeSelectedModules',
                    projectId: activeProjectDefinition.id,
                    mode: 'stage-row',
                  });
                } else if (value === 'stack-selected-stage-column') {
                  dispatch({
                    type: 'arrangeSelectedModules',
                    projectId: activeProjectDefinition.id,
                    mode: 'stage-column',
                  });
                } else if (value === 'undo-workspace-history') {
                  handleUndoWorkspaceHistory();
                } else if (value === 'redo-workspace-history') {
                  handleRedoWorkspaceHistory();
                } else if (value === 'save-current-workspace') {
                  handleSaveCurrentWorkspace();
                } else if (value === 'save-workspace-version') {
                  handleSaveWorkspaceVersion();
                } else if (value === 'delete-current-workspace') {
                  handleDeleteCurrentWorkspace();
                }
              }}
            >
              <option value="">Actions…</option>
              <option value="new-blank-workspace">New Blank Workspace</option>
              <option value="duplicate-current-workspace">Duplicate Workspace</option>
              <option value="undo-workspace-history" disabled={!canUndoWorkspaceHistory}>
                Undo
              </option>
              <option value="redo-workspace-history" disabled={!canRedoWorkspaceHistory}>
                Redo
              </option>
              <option value="duplicate-selected-cluster">Duplicate Selected Cluster</option>
              <option value="delete-selected-cluster">Delete Selected Cluster</option>
              <option value="arrange-selected-stage-row">Arrange Selected Stage Row</option>
              <option value="stack-selected-stage-column">Stack Selected Stage Column</option>
              <option value="copy-selected-cluster">Copy Selected Cluster</option>
              <option value="paste-selected-cluster">Paste Selected Cluster</option>
              <option value="save-current-workspace">Save Current Workspace</option>
              <option value="save-workspace-version">Save Version</option>
              {state.userWorkspaceLibrary.some(
                (workspace) => workspace.id === activeProjectDefinition.id,
              ) ? (
                <option value="delete-current-workspace">Delete Workspace</option>
              ) : null}
              <option value="toggle-theme">
                {theme === 'dark' ? 'Switch To Light' : 'Switch To Dark'}
              </option>
              <option value="toggle-palette">
                {state.showPalette ? 'Hide Tools' : 'Show Tools'}
              </option>
              <option value={detachedPanels.palette ? 'return-palette-window' : 'open-palette-window'}>
                {detachedPanels.palette ? 'Return Tools To Main Window' : 'Open Tools In Window'}
              </option>
              {state.showPalette ? (
                <option value="toggle-palette-view">
                  {paletteViewMode === 'expanded' ? 'Compact Tools' : 'Expand Tools'}
                </option>
              ) : null}
              <option value="toggle-inspector">
                {state.showInspector ? 'Hide Inspector' : 'Show Inspector'}
              </option>
              <option
                value={detachedPanels.inspector ? 'return-inspector-window' : 'open-inspector-window'}
              >
                {detachedPanels.inspector
                  ? 'Return Inspector To Main Window'
                  : 'Open Inspector In Window'}
              </option>
              <option
                value={detachedPanels.learning ? 'return-learning-window' : 'open-learning-window'}
              >
                {detachedPanels.learning
                  ? 'Return Learning To Main Window'
                  : 'Open Learning In Window'}
              </option>
              <option value="toggle-step-notes">
                {tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
              </option>
            </select>
          </label>
        </nav>
      </header>

      <section
        className="workbench-shell"
        style={
          {
            '--left-dock-width': `${leftDockWidth}px`,
            '--right-dock-width': `${rightDockWidth}px`,
          } as CSSProperties
        }
      >
        <div
          className={
            'workbench-stage' +
            (showPaletteInMain ? ' workbench-stage-has-left' : '') +
            (showInspectorInMain ? ' workbench-stage-has-right' : '') +
            (showPaletteInMain && paletteViewMode === 'compact' ? ' workbench-stage-tools-compact' : '')
          }
        >
          <WorkbenchPanel
            key={`${state.compositeEditor ? 'composite' : 'workspace'}:${activeProjectDefinition.id}`}
            activeProject={activeProjectDefinition}
            title={activeCompositeEntry ? `${activeCompositeEntry.name} Internals` : undefined}
            summary={
              activeCompositeEntry
                ? 'Editing the internal graph of a reusable composite. Boundary ports stay fixed in this first editing slice.'
                : undefined
            }
            pipelineLabel={
              activeCompositeEntry
                ? `${activeCompositeEntry.definition.inputs.length} in -> reusable composite -> ${activeCompositeEntry.definition.outputs.length} out`
                : undefined
            }
            activeProjectState={activeProjectState}
            layout={activeLayout}
            annotations={activeAnnotations}
            execution={execution}
            executionError={executionError}
            validationIssues={validationIssues}
            registry={effectiveRegistry}
            selectedModuleId={effectiveSelectedModuleId}
            selectedModuleIds={effectiveSelectedModuleIds}
            hoveredTraceModuleId={hoveredTraceModuleId}
            steppedModuleId={steppedModuleId}
            activeAnalysisTraceEntry={activeAnalysisTraceEntry}
            activeAnalysisOwnerModuleId={activeAnalysisOwnerModuleId}
            divergenceModuleId={divergenceModuleId}
            tutorialStep={activeTutorialStep}
            tutorialTitle={selectedTutorial?.projectId === activeProjectDefinition.id ? selectedTutorial.title : null}
            tutorialStepIndex={tutorialStepIndex}
            tutorialStepCount={selectedTutorial?.projectId === activeProjectDefinition.id ? selectedTutorial.steps.length : 0}
            showTutorialToggle={Boolean(selectedTutorial?.projectId === activeProjectDefinition.id)}
            tutorialNotesVisible={tutorialNotesVisible}
            challengeSolved={challengeEvaluation?.status === 'success'}
            probedModuleIds={state.probedModuleIdsByProject[activeProjectDefinition.id] ?? []}
            isTickedMode={isTickedMode}
            tickCount={effectiveTickCount}
            currentTick={effectiveCurrentTick}
            collectedOutput={collectedOutput}
            tickedParamsByModule={tickedExecution?.paramsByModuleByTick ?? null}
            tickHistoryByModule={tickHistoryByModule}
            onSetTickedMode={(enabled) =>
              dispatch({
                type: 'setTickedMode',
                projectId: activeProjectDefinition.id,
                enabled,
              })
            }
            onSetCurrentTick={(tick) =>
              dispatch({
                type: 'setCurrentTick',
                projectId: activeProjectDefinition.id,
                tick,
              })
            }
            isTickPlaybackActive={isTickPlaybackActive}
            tickPlaybackSpeedMs={tickPlaybackSpeedMs}
            onSetTickPlaybackActive={(active) =>
              dispatch({
                type: 'setTickPlaybackActive',
                projectId: activeProjectDefinition.id,
                active,
              })
            }
            onSetTickPlaybackSpeed={(speedMs) =>
              dispatch({
                type: 'setTickPlaybackSpeed',
                projectId: activeProjectDefinition.id,
                speedMs,
              })
            }
            onToggleProbe={(moduleId) =>
              dispatch({
                type: 'toggleProbe',
                projectId: activeProjectDefinition.id,
                moduleId,
              })
            }
            onMoveModule={(moduleId, x, y) =>
              dispatch({
                type: 'moveModule',
                projectId: activeProjectDefinition.id,
                moduleId,
                x,
                y,
              })
            }
            onMoveModules={(positions) =>
              dispatch({
                type: 'moveModules',
                projectId: activeProjectDefinition.id,
                positions,
              })
            }
            onAddAnnotation={() =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'addAnnotation',
                    projectId: activeProjectDefinition.id,
                  })
            }
            onMoveAnnotation={(annotationId, x, y) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'moveAnnotation',
                    projectId: activeProjectDefinition.id,
                    annotationId,
                    x,
                    y,
                  })
            }
            onUpdateAnnotationText={(annotationId, text) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'updateAnnotationText',
                    projectId: activeProjectDefinition.id,
                    annotationId,
                    text,
                  })
            }
            onRemoveAnnotation={(annotationId) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'removeAnnotation',
                    projectId: activeProjectDefinition.id,
                    annotationId,
                  })
            }
            onSelectModule={(moduleId, additive) =>
              dispatch({
                type: 'selectModule',
                projectId: activeProjectDefinition.id,
                moduleId,
                additive,
              })
            }
            onSelectModules={(moduleIds, additive) =>
              dispatch({
                type: 'selectModules',
                projectId: activeProjectDefinition.id,
                moduleIds,
                additive,
              })
            }
            onRequestCreateComposite={() => {
              setCompositeName('');
              setCompositeId('');
              setCompositeDialogError(null);
              setExcludedCompositeBoundaryPortKeys([]);
              setReplaceSelectionAfterCreate(!state.compositeEditor);
              setIsCompositeDialogOpen(true);
            }}
            onRequestDuplicateSelection={handleDuplicateSelectedCluster}
            onRequestDeleteSelection={handleDeleteSelectedCluster}
            onRequestUndo={handleUndoWorkspaceHistory}
            onRequestRedo={handleRedoWorkspaceHistory}
            canUndo={canUndoWorkspaceHistory}
            canRedo={canRedoWorkspaceHistory}
            workspaceVersions={activeWorkspaceVersions}
            onRequestSaveVersion={handleSaveWorkspaceVersion}
            onRequestRestoreVersion={handleRestoreWorkspaceVersion}
            requestedFocusModuleId={requestedWorkspaceFocusModuleId}
            onWorkspaceFocusHandled={() => setRequestedWorkspaceFocusModuleId(null)}
            onAddConnection={(fromModuleId, fromPort, toModuleId, toPort) =>
              dispatch({
                type: 'addConnection',
                projectId: activeProjectDefinition.id,
                fromModuleId,
                fromPort,
                toModuleId,
                toPort,
              })
            }
            onReplaceConnection={(
              removeConnectionIndices,
              fromModuleId,
              fromPort,
              toModuleId,
              toPort,
            ) =>
              dispatch({
                type: 'replaceConnection',
                projectId: activeProjectDefinition.id,
                removeConnectionIndices,
                fromModuleId,
                fromPort,
                toModuleId,
                toPort,
              })
            }
            onRemoveConnection={(connectionIndex) =>
              dispatch({
                type: 'removeConnection',
                projectId: activeProjectDefinition.id,
                connectionIndex,
              })
            }
            onExportDocument={() => {
              downloadDocument(activeProjectDefinition.id, {
                version: 1,
                project: activeProjectState,
                ui: {
                  layout: activeLayout,
                  annotations: state.compositeEditor
                    ? []
                    : state.annotationsByProject[activeProjectDefinition.id] ?? [],
                },
              });
              setImportError(null);
            }}
            onExportPython={async () => {
              const exportValidation = validateProject(activeProjectState, effectiveRegistry);
              if (!exportValidation.ok) {
                setImportError(exportValidation.issues.map((issue) => issue.message).join('\n'));
                return;
              }

              const {
                formatPythonExportCompatibilityIssues,
                generatePythonExportFiles,
                getPythonExportCompatibility,
              } = await import('./engine/codegen/python');

              const compatibility = getPythonExportCompatibility(
                activeProjectState,
                effectiveRegistry,
              );
              if (!compatibility.ok) {
                setImportError(formatPythonExportCompatibilityIssues(compatibility.issues));
                return;
              }

              try {
                const pythonExport = generatePythonExportFiles(
                  activeProjectState,
                  effectiveRegistry,
                  activeProjectDefinition.name,
                );
                downloadPythonDocument(
                  pythonExport.runtimeFileName,
                  pythonExport.runtimeSource,
                );
                downloadPythonDocument(
                  pythonExport.workspaceFileName,
                  pythonExport.workspaceSource,
                );
                setImportError(null);
              } catch (error) {
                setImportError(
                  error instanceof Error ? error.message : 'Python export failed.',
                );
              }
            }}
            onImportDocument={async (file) => {
              const rawValue = await file.text();
              const workbenchDocument = parseWorkbenchDocument(rawValue);
              if (workbenchDocument) {
                dispatch({
                  type: 'loadDocument',
                  projectId: activeProjectDefinition.id,
                  document: workbenchDocument,
                });
                setImportError(null);
                return;
              }

              const libraryDocument = parseCompositeLibraryDocument(rawValue);
              if (libraryDocument) {
                dispatch({
                  type: 'loadCompositeLibrary',
                  document: libraryDocument,
                });
                setImportError(null);
                return;
              }

              setImportError('The selected file is not a valid MCW workbench or composite library document.');
            }}
            onTidyLayout={() =>
              dispatch({
                type: 'tidyLayout',
                projectId: activeProjectDefinition.id,
              })
            }
            onSwitchProject={(projectId) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'switchProject',
                    projectId,
                  })
            }
            onSetTutorialStep={(stepValue) => {
              setStepIndex(selectedTutorial?.steps[stepValue]?.targetStepIndex ?? null);
              dispatch({
                type: 'setTutorialStep',
                projectId: activeProjectDefinition.id,
                stepIndex: stepValue,
              });
            }}
            onSetTutorialNotesVisible={(visible) =>
              dispatch({
                type: 'setTutorialNotesVisible',
                projectId: activeProjectDefinition.id,
                visible,
              })
            }
            projects={state.compositeEditor ? [activeProjectDefinition] : availableProjects}
            isCompositeEditor={Boolean(state.compositeEditor)}
          />
          {importError ? <p className="import-error-banner">{importError}</p> : null}
          {state.compositeEditor && activeCompositeEntry ? (
            <div className="composite-editor-toolbar">
              <div>
                <span className="meta-label">Editing Composite</span>
                <strong>{activeCompositeEntry.name}</strong>
                <p className="composite-editor-subtitle">{activeCompositeEntry.id}</p>
                {state.compositeEditor.saveError ? (
                  <p className="field-error">{state.compositeEditor.saveError}</p>
                ) : null}
              </div>
              <div className="composite-editor-actions">
                <button
                  type="button"
                  className="secondary-dialog-button"
                  onClick={() => {
                    if (!state.compositeEditor) {
                      return;
                    }

                    const hasUnsavedChanges =
                      JSON.stringify(state.compositeEditor.project) !==
                        JSON.stringify(state.compositeEditor.originalProject) ||
                      JSON.stringify(state.compositeEditor.layout) !==
                        JSON.stringify(state.compositeEditor.originalLayout);

                    if (hasUnsavedChanges) {
                      setIsCloseConfirmOpen(true);
                      return;
                    }

                    dispatch({ type: 'closeCompositeEditor' });
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="primary-dialog-button"
                  onClick={() => {
                    if (
                      !activeCompositeEntry ||
                      !state.compositeEditor ||
                      !isCompositeDefinition(activeCompositeEntry.definition)
                    ) {
                      return;
                    }

                    const nextDefinition = {
                      ...activeCompositeEntry.definition,
                      project: cloneProject(state.compositeEditor.project),
                      layout: { ...state.compositeEditor.layout },
                    };
                    const nextEntry: CompositeLibraryEntry = {
                      ...activeCompositeEntry,
                      definition: nextDefinition,
                    };
                    const validation = validateCompositeDef(nextDefinition, effectiveRegistry);
                    if (!validation.ok) {
                      dispatch({
                        type: 'setCompositeEditorSaveError',
                        message: validation.issues[0]?.message ?? 'Composite is invalid.',
                      });
                      return;
                    }

                    dispatch({
                      type: 'updateCompositeInLibrary',
                      entry: nextEntry,
                    });
                    setIsCloseConfirmOpen(false);
                    dispatch({ type: 'closeCompositeEditor' });
                  }}
                >
                  Save Composite
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {showPaletteInMain ? (
          <div
            className={paletteViewMode === 'compact' ? 'workbench-dock workbench-dock-left workbench-dock-compact' : 'workbench-dock workbench-dock-left'}
          >
            <PrimitivePalette
              registry={effectiveRegistry}
              viewMode={paletteViewMode}
              onToggleViewMode={() =>
                setPaletteViewMode((currentMode) =>
                  currentMode === 'expanded' ? 'compact' : 'expanded',
                )
              }
              compositeUsageCountById={compositeUsageCountById}
              builtInReusableIds={builtInReusableIds}
              onAddModule={(defId) => {
                const moduleDef = effectiveRegistry[defId] ?? null;
                if (!moduleDef) {
                  return;
                }

                dispatch({
                  type: 'addModule',
                  projectId: activeProjectDefinition.id,
                  moduleDef,
                });
              }}
              onExportCompositeLibrary={() =>
                downloadCompositeLibraryDocument({
                  version: 1,
                  entries: state.compositeLibrary,
                })
              }
              onOpenComposite={(defId) => {
                dispatch({
                  type: 'openCompositeEditor',
                  entryId: defId,
                });
              }}
              onDuplicateReusable={(defId) => {
                const entry = state.compositeLibrary.find((candidate) => candidate.id === defId);
                if (!entry) {
                  return;
                }

                const nextEntry = createUserOwnedReusableDuplicate(
                  entry,
                  state.compositeLibrary,
                );

                dispatch({
                  type: 'addCompositeToLibrary',
                  entry: nextEntry,
                });

                if (isCompositeDefinition(nextEntry.definition)) {
                  dispatch({
                    type: 'openCompositeEditor',
                    entryId: nextEntry.id,
                  });
                }
              }}
              onOpenPrimitiveMicroDemo={handleOpenPrimitiveMicroDemo}
              onRemoveComposite={(defId) =>
                dispatch({
                  type: 'removeCompositeFromLibrary',
                  compositeId: defId,
                })
              }
            />
            <button
              type="button"
              className="dock-resize-handle dock-resize-handle-right"
              aria-label="Resize tool palette"
              title="Drag to resize tool palette"
              onPointerDown={(event) => {
                event.preventDefault();
                setDockResizeState({
                  side: 'left',
                  originX: event.clientX,
                  originWidth: leftDockWidth,
                });
              }}
            />
          </div>
        ) : null}
        {showInspectorInMain ? (
          <div className="workbench-dock workbench-dock-right">
            <Suspense fallback={<LazyPanelFallback label="Analyze" title="Loading inspector…" />}>
              <ParameterInspector
                execution={execution}
                registry={effectiveRegistry}
                executionError={executionError}
                validationIssues={validationIssues}
                stepIndex={effectiveStepIndex}
                project={activeProjectState}
                tutorialStep={activeTutorialStep}
                projectName={activeProjectDefinition.name}
                comparisonBaseline={comparisonBaseline}
                executionComparison={executionComparison}
                baselineOutput={
                  baselineExecution
                    ? executionComparison?.baselineOutput.formatted ?? 'n/a'
                    : 'blocked'
                }
                variantOutput={
                  execution
                    ? executionComparison?.variantOutput.formatted ?? 'n/a'
                    : 'blocked'
                }
                baselineExecutionError={baselineExecutionError}
                moduleDef={selectedModuleDef}
                moduleInstance={selectedModule}
                selectedModuleIds={effectiveSelectedModuleIds}
                parameterClipboard={parameterClipboard}
                getParamDraft={(moduleId, key) =>
                  getDraftValue(state, activeProjectDefinition.id, moduleId, key)
                }
                baselineModuleInstance={baselineSelectedModule}
                onCopyParams={(moduleId) => {
                  if (!selectedModule || !selectedModuleDef || selectedModule.id !== moduleId) {
                    return;
                  }

                  setParameterClipboard({
                    sourceModuleId: selectedModule.id,
                    sourceDefId: selectedModuleDef.id,
                    params: Object.fromEntries(
                      selectedModuleParamKeys.map((key) => [
                        key,
                        selectedModule.params[key] ?? selectedModuleDef.paramSchema[key]?.defaultValue,
                      ]),
                    ),
                    paramKeys: selectedModuleParamKeys,
                  });
                }}
                onApplyCopiedParams={(sourceModuleId, sourceDefId, targetModuleIds, params, paramKeys) =>
                  dispatch({
                    type: 'applyCopiedParams',
                    projectId: activeProjectDefinition.id,
                    sourceModuleId,
                    sourceDefId,
                    targetModuleIds,
                    params,
                    paramKeys,
                  })
                }
                onParamDraftChange={(moduleId, key, rawValue) =>
                  dispatch({
                    type: 'setParamDraft',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                    key,
                    rawValue,
                  })
                }
                onParamChange={(moduleId, key, value) =>
                  dispatch({
                    type: 'updateParam',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                    key,
                    value,
                  })
                }
                onSetModuleBypass={(moduleId, bypass) =>
                  dispatch({
                    type: 'setModuleBypass',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                    bypass,
                  })
                }
                onRenameModuleInstance={(moduleId, nextModuleId) =>
                  dispatch({
                    type: 'renameModuleInstance',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                    nextModuleId,
                  })
                }
                onDeleteModule={(moduleId) =>
                  state.compositeEditor && activeCompositeEntry && isCompositeBoundaryModule(activeCompositeEntry, moduleId)
                    ? dispatch({
                        type: 'setCompositeEditorSaveError',
                        message:
                          'This module is bound to an exposed composite port. Boundary editing will come in a later slice.',
                      })
                    : dispatch({
                        type: 'removeModule',
                        projectId: activeProjectDefinition.id,
                        moduleId,
                      })
                }
                canRenameModuleIds={!state.compositeEditor}
                onUnzipComposite={(moduleId) => handleUnzipComposite(moduleId)}
                onSelectIssueTarget={(moduleId) =>
                  dispatch({
                    type: 'selectModule',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                  })
                }
                onTraceHover={setHoveredTraceModuleId}
                onStepChange={syncTutorialStepFromTrace}
                onActiveAnalysisTraceChange={setActiveAnalysisTraceEntry}
                onRequestFocusModule={setRequestedWorkspaceFocusModuleId}
                onCaptureBaseline={() =>
                  dispatch({
                    type: 'captureComparisonBaseline',
                    projectId: activeProjectDefinition.id,
                    capturedAt: new Date().toISOString(),
                  })
                }
                onClearBaseline={() =>
                  dispatch({
                    type: 'clearComparisonBaseline',
                    projectId: activeProjectDefinition.id,
                  })
                }
                probedModuleIds={state.probedModuleIdsByProject[activeProjectDefinition.id] ?? []}
                isTickedMode={isTickedMode}
                currentTick={effectiveCurrentTick}
                tickCount={effectiveTickCount}
                tickedParamsByModule={tickedExecution?.paramsByModuleByTick ?? null}
                tickHistoryByModule={tickHistoryByModule}
                collectedOutput={collectedOutput}
                onToggleProbe={(moduleId) =>
                  dispatch({
                    type: 'toggleProbe',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                  })
                }
                onClearProbes={() =>
                  dispatch({
                    type: 'clearProbes',
                    projectId: activeProjectDefinition.id,
                  })
                }
              />
            </Suspense>
            <button
              type="button"
              className="dock-resize-handle dock-resize-handle-left"
              aria-label="Resize inspector"
              title="Drag to resize inspector"
              onPointerDown={(event) => {
                event.preventDefault();
                setDockResizeState({
                  side: 'right',
                  originX: event.clientX,
                  originWidth: rightDockWidth,
                });
              }}
            />
          </div>
        ) : null}
      </section>

      {!state.compositeEditor ? (
        <>
          {workspaceMode === 'cryptanalysis' ? (
            <Suspense
              fallback={<LazyPanelFallback label="Cryptanalysis" title="Loading analysis workspace…" />}
            >
              <CryptanalysisPanel
                projectName={activeProjectDefinition.name}
                project={activeProjectState}
                registry={effectiveRegistry}
                execution={execution}
                ciphertext={state.cryptanalysisInputByProject[activeProjectDefinition.id] ?? ''}
                cryptanalysisMode={state.cryptanalysisModeByProject[activeProjectDefinition.id] ?? 'classical'}
                modernBaseline={state.modernAnalysisBaselineByProject[activeProjectDefinition.id] ?? ''}
                modernFlipBit={state.modernAnalysisFlipBitByProject[activeProjectDefinition.id] ?? 0}
                workspaceMode={workspaceMode}
                tutorial={selectedTutorial?.projectId === activeProjectDefinition.id ? selectedTutorial : null}
                tutorialStep={
                  tutorialNotesVisible && selectedTutorial?.projectId === activeProjectDefinition.id
                    ? selectedTutorialStep
                    : null
                }
                tutorialStepIndex={tutorialStepIndex}
                tutorialNotesVisible={tutorialNotesVisible}
                onSetWorkspaceMode={(mode) =>
                  dispatch({
                    type: 'setWorkspaceMode',
                    projectId: activeProjectDefinition.id,
                    mode,
                  })
                }
                onSetCryptanalysisMode={(mode) =>
                  dispatch({
                    type: 'setCryptanalysisMode',
                    projectId: activeProjectDefinition.id,
                    mode,
                  })
                }
                onSetTutorialNotesVisible={(visible) =>
                  dispatch({
                    type: 'setTutorialNotesVisible',
                    projectId: activeProjectDefinition.id,
                    visible,
                  })
                }
                onCiphertextChange={(value) =>
                  dispatch({
                    type: 'setCryptanalysisInput',
                    projectId: activeProjectDefinition.id,
                    value,
                  })
                }
                onModernBaselineChange={(value) =>
                  dispatch({
                    type: 'setModernAnalysisBaseline',
                    projectId: activeProjectDefinition.id,
                    value,
                  })
                }
                onModernFlipBitChange={(value) =>
                  dispatch({
                    type: 'setModernAnalysisFlipBit',
                    projectId: activeProjectDefinition.id,
                    value,
                  })
                }
                onSetTutorialStep={(stepValue) => {
                  setStepIndex(selectedTutorial?.steps[stepValue]?.targetStepIndex ?? null);
                  dispatch({
                    type: 'setTutorialStep',
                    projectId: activeProjectDefinition.id,
                    stepIndex: stepValue,
                  });
                }}
                onFocusTutorialModule={(moduleId) =>
                  dispatch({
                    type: 'selectModule',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                  })
                }
              />
            </Suspense>
          ) : showLearningInMain ? (
            <LearningDock
              hasTutorialPanel={hasTutorialPanel}
              hasChallengePanel={hasChallengePanel}
              activeLearningPanelTab={activeLearningPanelTab}
              onSetLearningPanelTab={setLearningPanelTab}
              selectedChallenge={selectedChallenge}
              challenges={state.challengeLibrary}
              challengeEvaluation={challengeEvaluation}
              currentProject={activeProjectState}
              canCaptureChallenge={canCaptureChallenge}
              onSelectChallenge={(challengeId) => {
                const nextChallenge =
                  state.challengeLibrary.find((challenge) => challenge.id === challengeId) ?? null;
                const challengeProjectId = nextChallenge?.projectId ?? activeProjectDefinition.id;
                setLearningPanelTab('challenge');
                if (challengeProjectId !== activeProjectDefinition.id) {
                  dispatch({
                    type: 'switchProject',
                    projectId: challengeProjectId,
                  });
                }
                dispatch({
                  type: 'selectChallenge',
                  projectId: challengeProjectId,
                  challengeId,
                });
              }}
              onLoadChallengeStart={() => {
                setLearningPanelTab('challenge');
                setIsChallengeResetConfirmOpen(true);
              }}
              onExportChallenge={() => {
                if (selectedChallenge) {
                  downloadGuidedChallengeDocument(selectedChallenge);
                }
              }}
              onImportChallenge={async (file) => {
                const rawValue = await file.text();
                const challengeDocument = parseGuidedChallengeDocument(rawValue);
                if (!challengeDocument) {
                  setImportError('The selected file is not a valid MCW guided challenge document.');
                  return;
                }

                dispatch({
                  type: 'upsertChallenge',
                  challenge: challengeDocument,
                });
                const challengeProjectId = challengeDocument.projectId ?? activeProjectDefinition.id;
                setLearningPanelTab('challenge');
                if (challengeProjectId !== activeProjectDefinition.id) {
                  dispatch({
                    type: 'switchProject',
                    projectId: challengeProjectId,
                  });
                }
                dispatch({
                  type: 'selectChallenge',
                  projectId: challengeProjectId,
                  challengeId: challengeDocument.id,
                });
                setImportError(null);
              }}
              onCaptureChallenge={() => {
                setLearningPanelTab('challenge');
                const draft = createChallengeCaptureDraft(
                  activeProjectDefinition.id,
                  activeProjectDefinition.name,
                );
                setChallengeCaptureTitle(draft.title);
                setChallengeCaptureId(draft.id);
                setChallengeCaptureDifficulty(draft.difficulty);
                setChallengeCapturePrompt(draft.prompt);
                setChallengeCaptureHints(draft.hints);
                setChallengeCaptureShouldExport(true);
                setChallengeCaptureError(null);
                setIsChallengeCaptureOpen(true);
              }}
              selectedTutorial={selectedTutorial}
              tutorials={state.tutorialLibrary}
              currentProjectId={activeProjectDefinition.id}
              tutorialStepIndex={tutorialStepIndex}
              selectedTutorialStep={selectedTutorialStep}
              completedTutorialIds={completedTutorialIds}
              isTutorialCompleted={isTutorialCompleted}
              workspaceMode={workspaceMode}
              tutorialNotesVisible={tutorialNotesVisible}
              onSetWorkspaceMode={(mode) =>
                dispatch({
                  type: 'setWorkspaceMode',
                  projectId: activeProjectDefinition.id,
                  mode,
                })
              }
              onSetTutorialNotesVisible={(visible) =>
                dispatch({
                  type: 'setTutorialNotesVisible',
                  projectId: activeProjectDefinition.id,
                  visible,
                })
              }
              onSelectTutorial={(tutorialId) => {
                const nextTutorial =
                  state.tutorialLibrary.find((tutorial) => tutorial.id === tutorialId) ?? null;
                setLearningPanelTab('tutorial');
                setStepIndex(nextTutorial?.steps[0]?.targetStepIndex ?? null);
                dispatch({
                  type: 'selectTutorial',
                  projectId: activeProjectDefinition.id,
                  tutorialId,
                });
              }}
              onSetTutorialStep={(stepValue) => {
                setStepIndex(selectedTutorial?.steps[stepValue]?.targetStepIndex ?? null);
                dispatch({
                  type: 'setTutorialStep',
                  projectId: activeProjectDefinition.id,
                  stepIndex: stepValue,
                });
              }}
              onSwitchProject={(projectId) =>
                dispatch({
                  type: 'switchProject',
                  projectId,
                })
              }
              onFocusStepModule={(moduleId) =>
                dispatch({
                  type: 'selectModule',
                  projectId: activeProjectDefinition.id,
                  moduleId,
                })
              }
              onResetTutorialProgress={() =>
                dispatch({
                  type: 'resetTutorialProgress',
                  projectId: activeProjectDefinition.id,
                })
              }
            />
          ) : null}

        </>
      ) : null}

      {isCompositeDialogOpen ? (
        <div
          className="dialog-backdrop"
          onClick={() => {
            setIsCompositeDialogOpen(false);
            setCompositeDialogError(null);
            setExcludedCompositeBoundaryPortKeys([]);
          }}
        >
          <div
            className="dialog-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="panel-label">Composite Authoring</p>
            <h2>Create Reusable Composite</h2>
            <p className="dialog-copy">
              Capture the current selection as a reusable composite module. The
              selection stays in the workbench; this first version just adds the
              new composite to the library.
            </p>

            <p className="dialog-selection-summary">
              Selected modules: <strong>{effectiveSelectedModuleIds.length}</strong>
            </p>
            <div className="dialog-composite-preview">
              <span className="meta-label">Captured Structure</span>
              <p className="dialog-composite-preview-copy">
                {compositeSelectionPreview.moduleCount} module
                {compositeSelectionPreview.moduleCount === 1 ? '' : 's'} and{' '}
                {compositeSelectionPreview.internalConnectionCount} internal connection
                {compositeSelectionPreview.internalConnectionCount === 1 ? '' : 's'} will be
                captured.
              </p>
              {compositeSelectionPreview.error ? (
                <p className="field-error">{compositeSelectionPreview.error}</p>
              ) : null}
              <div className="selected-ports dialog-selected-ports">
                <div className="port-group">
                  <span className="meta-label">Inputs</span>
                  {compositeSelectionPreview.inputCandidates.length === 0 ? (
                    <p className="empty-state">No input boundary ports</p>
                  ) : (
                    <ul className="port-list">
                      {compositeSelectionPreview.inputCandidates.map((port) => (
                        <li key={port.key}>
                          <label className="checkbox-field port-toggle-field">
                            <input
                              type="checkbox"
                              checked={port.included}
                              onChange={(event) => {
                                setExcludedCompositeBoundaryPortKeys((currentKeys) => {
                                  if (event.target.checked) {
                                    return currentKeys.filter((key) => key !== port.key);
                                  }
                                  if (currentKeys.includes(port.key)) {
                                    return currentKeys;
                                  }
                                  return [...currentKeys, port.key];
                                });
                              }}
                            />
                            <span>
                              <strong>{port.name}</strong> <em>{port.internalModuleId}.{port.internalPort}</em>
                            </span>
                          </label>
                          <span>{port.type}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="port-group">
                  <span className="meta-label">Outputs</span>
                  {compositeSelectionPreview.outputCandidates.length === 0 ? (
                    <p className="empty-state">No output boundary ports</p>
                  ) : (
                    <ul className="port-list">
                      {compositeSelectionPreview.outputCandidates.map((port) => (
                        <li key={port.key}>
                          <label className="checkbox-field port-toggle-field">
                            <input
                              type="checkbox"
                              checked={port.included}
                              onChange={(event) => {
                                setExcludedCompositeBoundaryPortKeys((currentKeys) => {
                                  if (event.target.checked) {
                                    return currentKeys.filter((key) => key !== port.key);
                                  }
                                  if (currentKeys.includes(port.key)) {
                                    return currentKeys;
                                  }
                                  return [...currentKeys, port.key];
                                });
                              }}
                            />
                            <span>
                              <strong>{port.name}</strong> <em>{port.internalModuleId}.{port.internalPort}</em>
                            </span>
                          </label>
                          <span>{port.type}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <label className="param-field">
              <span>Display Name</span>
              <input
                type="text"
                value={compositeName}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setCompositeName(nextName);
                  if (!compositeId) {
                    setCompositeId(createCompositeIdCandidate(nextName));
                  }
                }}
                placeholder="Round Trip Bridge"
              />
            </label>

            <label className="param-field">
              <span>Stable Id</span>
              <input
                type="text"
                value={compositeId}
                onChange={(event) => setCompositeId(event.target.value)}
                placeholder="RoundTripBridge"
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={replaceSelectionAfterCreate}
                disabled={Boolean(state.compositeEditor)}
                onChange={(event) => setReplaceSelectionAfterCreate(event.target.checked)}
              />
              <span>
                Replace the current selection with the new composite
                {state.compositeEditor
                  ? ' (disabled while editing a composite)'
                  : ''}
              </span>
            </label>

            {compositeDialogError ? (
              <p className="field-error">{compositeDialogError}</p>
            ) : null}

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-dialog-button"
                onClick={() => {
                  setIsCompositeDialogOpen(false);
                  setCompositeDialogError(null);
                  setExcludedCompositeBoundaryPortKeys([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-dialog-button"
                onClick={() => {
                  const result = createCompositeFromSelection({
                    project: activeProjectState,
                    registry: effectiveRegistry,
                    name: compositeName,
                    id: compositeId,
                    selectedModuleIds: effectiveSelectedModuleIds,
                    excludedBoundaryPortKeys: excludedCompositeBoundaryPortKeys,
                  });

                  if (!result.ok || !result.entry) {
                    setCompositeDialogError(result.error ?? 'Unable to create composite.');
                    return;
                  }

                  dispatch({
                    type: 'addCompositeToLibrary',
                    entry: result.entry,
                  });

                  if (replaceSelectionAfterCreate && !state.compositeEditor) {
                    const replacement = replaceSelectionWithComposite({
                      project: activeProjectState,
                      layout: activeLayout,
                      entry: result.entry,
                      selectedModuleIds: effectiveSelectedModuleIds,
                    });

                    if (!replacement.ok || !replacement.project || !replacement.layout) {
                      setCompositeDialogError(
                        replacement.error ?? 'Composite was created, but replacement failed.',
                      );
                      return;
                    }

                    dispatch({
                      type: 'loadDocument',
                      projectId: activeProjectDefinition.id,
                      document: {
                        version: 1,
                        project: replacement.project,
                        ui: {
                          layout: replacement.layout,
                          annotations: state.annotationsByProject[activeProjectDefinition.id] ?? [],
                        },
                      },
                    });
                  }

                  setIsCompositeDialogOpen(false);
                  setCompositeDialogError(null);
                  setExcludedCompositeBoundaryPortKeys([]);
                }}
              >
                Create Composite
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCloseConfirmOpen ? (
        <div
          className="dialog-backdrop"
          onClick={() => setIsCloseConfirmOpen(false)}
        >
          <div
            className="dialog-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="panel-label">Unsaved Changes</p>
            <h2>Discard Composite Edits?</h2>
            <p className="dialog-copy">
              You have unsaved changes inside this composite. Closing now will
              discard those edits.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-dialog-button"
                onClick={() => setIsCloseConfirmOpen(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="primary-dialog-button"
                onClick={() => {
                  setIsCloseConfirmOpen(false);
                  dispatch({ type: 'closeCompositeEditor' });
                }}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isChallengeResetConfirmOpen && selectedChallenge ? (
        <div
          className="dialog-backdrop"
          onClick={() => setIsChallengeResetConfirmOpen(false)}
        >
          <div
            className="dialog-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="panel-label">Challenge Reset</p>
            <h2>Reset Attempt?</h2>
            <p className="dialog-copy">
              This will load <strong>{selectedChallenge.title}</strong> into the current workbench
              and replace the graph for <strong>{selectedChallengeProjectDefinition.name}</strong>.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-dialog-button"
                onClick={() => setIsChallengeResetConfirmOpen(false)}
              >
                Keep Current Attempt
              </button>
              <button
                type="button"
                className="primary-dialog-button"
                onClick={() => {
                  if (selectedChallengeProjectId !== activeProjectDefinition.id) {
                    dispatch({
                      type: 'switchProject',
                      projectId: selectedChallengeProjectId,
                    });
                  }
                  dispatch({
                    type: 'loadDocument',
                    projectId: selectedChallengeProjectId,
                    document: {
                      version: 1,
                      project: cloneProject(selectedChallenge.startingProject),
                      ui: {
                        layout:
                          selectedChallenge.startingLayout ?? selectedChallengeProjectDefinition.layout,
                        annotations: [],
                      },
                    },
                  });
                  setIsChallengeResetConfirmOpen(false);
                }}
              >
                Reset Challenge
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isChallengeCaptureOpen && comparisonBaseline ? (
        <div
          className="dialog-backdrop"
          onClick={() => {
            setIsChallengeCaptureOpen(false);
            setChallengeCaptureError(null);
          }}
        >
          <div
            className="dialog-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="panel-label">Challenge Authoring</p>
            <h2>Capture Current Graph As Challenge</h2>
            <p className="dialog-copy">
              This uses the current graph as the student starting machine and the captured compare
              baseline as the target behavior.
            </p>

            <p className="dialog-selection-summary">
              Start: <strong>{activeProjectDefinition.name}</strong> current graph
              <br />
              Target: captured compare baseline
            </p>

            <label className="param-field">
              <span>Challenge Title</span>
              <input
                type="text"
                value={challengeCaptureTitle}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setChallengeCaptureTitle(nextTitle);
                  if (!challengeCaptureId) {
                    setChallengeCaptureId(createChallengeIdCandidate(nextTitle));
                  }
                }}
                placeholder="Sequential Heart Repair"
              />
            </label>

            <label className="param-field">
              <span>Stable Id</span>
              <input
                type="text"
                value={challengeCaptureId}
                onChange={(event) => setChallengeCaptureId(event.target.value)}
                placeholder="sequential-heart-repair"
              />
            </label>

            <label className="param-field">
              <span>Student Prompt</span>
              <textarea
                value={challengeCapturePrompt}
                onChange={(event) => setChallengeCapturePrompt(event.target.value)}
                rows={4}
                placeholder="Describe what students should repair or discover."
              />
            </label>

            <label className="param-field">
              <span>Difficulty</span>
              <select
                value={challengeCaptureDifficulty}
                onChange={(event) =>
                  setChallengeCaptureDifficulty(
                    event.target.value as 'beginner' | 'intermediate' | 'expert',
                  )
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </label>

            <label className="param-field">
              <span>Hints (one per line)</span>
              <textarea
                value={challengeCaptureHints}
                onChange={(event) => setChallengeCaptureHints(event.target.value)}
                rows={4}
                placeholder="The clock period matters.\nInspect the LFSR seed after each pulse."
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={challengeCaptureShouldExport}
                onChange={(event) => setChallengeCaptureShouldExport(event.target.checked)}
              />
              <span>Download a `.challenge.json` immediately after capture</span>
            </label>

            {challengeCaptureError ? (
              <p className="field-error">{challengeCaptureError}</p>
            ) : null}

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-dialog-button"
                onClick={() => {
                  setIsChallengeCaptureOpen(false);
                  setChallengeCaptureError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-dialog-button"
                onClick={() => {
                  const trimmedTitle = challengeCaptureTitle.trim();
                  const trimmedId = challengeCaptureId.trim();
                  const trimmedPrompt = challengeCapturePrompt.trim();

                  if (!trimmedTitle || !trimmedId || !trimmedPrompt) {
                    setChallengeCaptureError('Title, stable id, and prompt are required.');
                    return;
                  }

                  const authoredChallenge = {
                    version: 1 as const,
                    id: trimmedId,
                    title: trimmedTitle,
                    projectId: activeProjectDefinition.id,
                    difficulty: challengeCaptureDifficulty,
                    prompt: trimmedPrompt,
                    startingProject: cloneProject(activeProjectState),
                    startingLayout: cloneLayout(activeLayout),
                    targetProject: cloneProject(comparisonBaseline.project),
                    success: {
                      kind: 'output-match-target' as const,
                    },
                    hints: challengeCaptureHints
                      .split('\n')
                      .map((line) => line.trim())
                      .filter((line) => line.length > 0),
                  };

                  dispatch({
                    type: 'upsertChallenge',
                    challenge: authoredChallenge,
                  });
                  setLearningPanelTab('challenge');
                  dispatch({
                    type: 'selectChallenge',
                    projectId: activeProjectDefinition.id,
                    challengeId: authoredChallenge.id,
                  });
                  if (challengeCaptureShouldExport) {
                    downloadGuidedChallengeDocument(authoredChallenge);
                  }
                  setIsChallengeCaptureOpen(false);
                  setChallengeCaptureError(null);
                }}
              >
                Capture Challenge
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function formatTickSignal(
  signal:
    | ExecutionResult['outputsByModuleId'][string][string]
    | undefined,
): string {
  if (!signal) {
    return '--';
  }

  if (signal.type === 'symbol') {
    return signal.value.length > 0 ? signal.value : '--';
  }

  return signal.value.length > 0 ? signal.value.join('') : '--';
}

export default App;

function createCompositeIdCandidate(name: string) {
  const stripped = name.replace(/[^A-Za-z0-9]+/g, ' ').trim();
  if (!stripped) {
    return '';
  }

  const words = stripped.split(/\s+/);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function cloneLayout<T extends Record<string, { x: number; y: number }>>(layout: T): T {
  return Object.fromEntries(
    Object.entries(layout).map(([moduleId, position]) => [moduleId, { ...position }]),
  ) as T;
}

function isCompositeBoundaryModule(entry: CompositeLibraryEntry, moduleId: string) {
  if (!isCompositeDefinition(entry.definition)) {
    return false;
  }
  return (
    entry.definition.inputBindings.some((binding) => binding.internalModuleId === moduleId) ||
    entry.definition.outputBindings.some((binding) => binding.internalModuleId === moduleId)
  );
}

function createUserOwnedReusableDuplicate(
  entry: CompositeLibraryEntry,
  library: CompositeLibraryEntry[],
): CompositeLibraryEntry {
  const nextId = createDuplicateReusableId(entry.id, new Set(library.map((candidate) => candidate.id)));
  const nextName = createDuplicateReusableName(
    entry.name,
    new Set(library.map((candidate) => candidate.name)),
  );

  if (isCompositeDefinition(entry.definition)) {
    return {
      ...entry,
      id: nextId,
      name: nextName,
      source: 'user',
      definition: {
        ...entry.definition,
        id: nextId,
        name: nextName,
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
    id: nextId,
    name: nextName,
    source: 'user',
    definition: {
      ...entry.definition,
      id: nextId,
      name: nextName,
    },
  };
}

function createDuplicateReusableId(sourceId: string, existingIds: Set<string>) {
  const baseId = `${sourceId}Custom`;
  let candidate = baseId;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${baseId}${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function createDuplicateReusableName(sourceName: string, existingNames: Set<string>) {
  const baseName = `${sourceName} Custom`;
  let candidate = baseName;
  let suffix = 2;

  while (existingNames.has(candidate)) {
    candidate = `${baseName} ${suffix}`;
    suffix += 1;
  }

  return candidate;
}
