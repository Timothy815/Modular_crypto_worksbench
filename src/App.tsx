import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';

import './App.css';
import { isCompositeDefinition, type CompositeLibraryEntry } from './engine/composites';
import { V1_REGISTRY } from './engine/modules';
import type { ExecutionResult, ExecutionTraceEntry, TickedExecutionResult } from './engine/types';
import { isOutputSinkDefId } from './engine/output-sinks';
import { validateCompositeDef, validateProject } from './engine/validation';
import {
  createCompositeFromSelection,
  previewCompositeSelection,
  replaceSelectionWithComposite,
  unzipCompositeInstance,
} from './ui/composite-authoring';
import { evaluateChallengeAttempt } from './ui/challenges';
import { createChallengeIdCandidate } from './ui/challenge-capture';
import {
  clampDockWidth,
  getDetachedPanelConfig,
  getInstructorPilotConfig,
  getUserManualConfig,
} from './ui/app-shell-support';
import { LazyPanelFallback } from './ui/components/lazy-panel-fallback';
import { WorkbenchPanel } from './ui/components/workbench-panel';
import { demoProjects, getDefaultDemoProject, runDemoProject } from './ui/demo-projects';
import { compareExecutionResults } from './ui/execution-compare';
import { createInstructorPilotUrl } from './ui/instructor-pilot-url';
import { createUserManualUrl } from './ui/manual-url';
import {
  addVerificationCasesToProject,
  applyLearningPanelTabSelection,
  applyChallengeSelectionPlan,
  applyTutorialSelectionPlan,
  buildChallengeSelectionPlan,
  buildTutorialSelectionPlan,
  clearVerificationCasesForProject,
  createChallengeCaptureDialogState,
  createVerificationCaseForProject,
  removeVerificationCaseFromProject,
  type LearningPanelTab,
} from './ui/learning-orchestration';
import { evaluateVerificationCases, getVerificationSourceOptions, type VerificationCase } from './ui/verification-workflow';
import { clampTutorialStepIndex, getTutorialStep } from './ui/tutorials';
import {
  downloadDocument,
  downloadAiToolkitDocument,
  downloadCompositeLibraryDocument,
  downloadGuidedChallengeDocument,
  parseGuidedChallengeDocument,
  saveWorkspaceToStorage,
} from './ui/persistence';
import { cloneProject } from './ui/project-clone';
import {
  broadcastDetachedSnapshots,
  connectDetachedPanelChannel,
  createWindowSessionId,
  moveDetachedPanelToExistingWindow as moveDetachedPanelToExistingWindowHelper,
  openDetachedPanelInNewWindow as openDetachedPanelInNewWindowHelper,
  returnDetachedPanelToMain as returnDetachedPanelToMainHelper,
} from './ui/detached-window-orchestration';
import {
  DETACHED_PANEL_CHANNEL_NAME,
  formatDetachedPanelKindLabel,
  formatDetachedPanelWindowLabel,
  type DetachedInspectorSnapshot,
  type DetachedLearningSnapshot,
  type DetachedPanelKind,
  type DetachedPaletteSnapshot,
  type DetachedPanelPayloadByKind,
  type DetachedPanelWindowGroup,
  isDetachedPanelKindActive,
} from './ui/multi-window';
import {
  getEffectiveRegistry,
  getDraftValue,
  getSelectedModuleId,
  getSelectedModuleIds,
  uiReducer,
} from './ui/store';
import { resolveWorkspaceExecution } from './ui/workspace-execution';
import type { WorkspaceMode } from './ui/workspace-mode';
import {
  createUniqueWorkspaceId,
  createWorkspaceNameFromBase,
  describeWorkspacePipeline,
  hydrateInitialUiState,
  loadInitialVerificationCasesByProject,
} from './ui/workspace-artifacts';
import { getPrimitiveMicroDemo } from './ui/primitive-micro-demos';
import { getPipelineMicroDemo } from './ui/pipeline-micro-demos';
import { buildCompositeInstanceDrilldownContext } from './ui/composite-instance-drilldown';
import { computeAutoWireConnections, type AutoWireMode } from './ui/autowire-selection';

const MIN_LEFT_DOCK_WIDTH = 220;
const MAX_LEFT_DOCK_WIDTH = 520;
const MIN_RIGHT_DOCK_WIDTH = 280;
const MAX_RIGHT_DOCK_WIDTH = 680;

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
const ManualWindow = lazy(() =>
  import('./ui/components/manual-window').then((module) => ({
    default: module.ManualWindow,
  })),
);
const PrimitivePalette = lazy(() =>
  import('./ui/components/primitive-palette').then((module) => ({
    default: module.PrimitivePalette,
  })),
);
const LearningDock = lazy(() =>
  import('./ui/components/learning-dock').then((module) => ({
    default: module.LearningDock,
  })),
);
const InstructorPilotWindow = lazy(() =>
  import('./ui/components/instructor-pilot-window').then((module) => ({
    default: module.InstructorPilotWindow,
  })),
);

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

interface ParameterClipboardState {
  sourceModuleId: string;
  sourceDefId: string;
  params: Record<string, unknown>;
  paramKeys: string[];
}

interface CompositeDrilldownState {
  parentProjectId: string;
  instanceId: string;
  selectedModuleId: string | null;
  selectedModuleIds: string[];
  hoveredTraceModuleId: string | null;
  stepIndex: number | null;
  activeAnalysisTraceEntry: ExecutionTraceEntry | null;
  requestedFocusModuleId: string | null;
}

function App() {
  const userManualConfig = getUserManualConfig();
  if (userManualConfig) {
    return (
      <Suspense fallback={<LazyPanelFallback label="Manual" title="Preparing user manual…" />}>
        <ManualWindow initialTheme={userManualConfig.theme} />
      </Suspense>
    );
  }

  const instructorPilotConfig = getInstructorPilotConfig();
  if (instructorPilotConfig) {
    return (
      <Suspense fallback={<LazyPanelFallback label="Pilot" title="Preparing instructor pilot pack…" />}>
        <InstructorPilotWindow initialTheme={instructorPilotConfig.theme} />
      </Suspense>
    );
  }

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
  const defaultDemoProject = getDefaultDemoProject(demoProjects);
  const [headerResourceAction, setHeaderResourceAction] = useState('');
  const [headerWorkspaceAction, setHeaderWorkspaceAction] = useState('');
  const [headerWindowAction, setHeaderWindowAction] = useState('');
  const [learningPanelTab, setLearningPanelTab] = useState<LearningPanelTab>('quickstart');
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
  const [leftDockCollapsed, setLeftDockCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('mcw:left-dock-collapsed') === 'true';
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
  const [rightDockCollapsed, setRightDockCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('mcw:right-dock-collapsed') === 'true';
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
  const detachedPanelWindowsRef = useRef<Record<string, Window | null>>({});
  const [detachedPanelGroups, setDetachedPanelGroups] = useState<DetachedPanelWindowGroup[]>([]);
  const [state, dispatch] = useReducer(
    uiReducer,
    demoProjects,
    hydrateInitialUiState,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [isCompositeDialogOpen, setIsCompositeDialogOpen] = useState(false);
  const [compositeName, setCompositeName] = useState('');
  const [compositeId, setCompositeId] = useState('');
  const [compositeDialogError, setCompositeDialogError] = useState<string | null>(null);
  const [excludedCompositeBoundaryPortKeys, setExcludedCompositeBoundaryPortKeys] = useState<string[]>([]);
  const [compositePortNameOverrides, setCompositePortNameOverrides] = useState<Record<string, string>>({});
  const [compositePurpose, setCompositePurpose] = useState('');
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
  const [verificationCasesByProject, setVerificationCasesByProject] = useState<
    Record<string, VerificationCase[]>
  >(() => loadInitialVerificationCasesByProject(demoProjects));
  const [replaceSelectionAfterCreate, setReplaceSelectionAfterCreate] = useState(true);
  const [hoveredTraceModuleId, setHoveredTraceModuleId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [activeAnalysisTraceEntry, setActiveAnalysisTraceEntry] =
    useState<ExecutionTraceEntry | null>(null);
  const [paletteViewMode, setPaletteViewMode] = useState<'compact' | 'expanded'>('expanded');
  const [requestedWorkspaceFocusModuleId, setRequestedWorkspaceFocusModuleId] =
    useState<string | null>(null);
  const [compositeDrilldown, setCompositeDrilldown] = useState<CompositeDrilldownState | null>(null);

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
  const activeLayoutDirection =
    state.layoutDirectionByProject[activeProjectDefinition.id] ?? 'horizontal';
  const activeRoutingMode =
    state.routingModeByProject[activeProjectDefinition.id] ?? 'curved';
  const activeWireColorMode =
    state.wireColorModeByProject[activeProjectDefinition.id] ?? 'domain';
  const activeConnectionLayout = useMemo(
    () => state.connectionLayoutByProject[activeProjectDefinition.id] ?? {},
    [activeProjectDefinition.id, state.connectionLayoutByProject],
  );
  const baseAnnotations = useMemo(
    () => state.annotationsByProject[activeProjectDefinition.id] ?? [],
    [activeProjectDefinition.id, state.annotationsByProject],
  );
  const activeGroupBoxes = useMemo(
    () => state.groupBoxesByProject[activeProjectDefinition.id] ?? [],
    [activeProjectDefinition.id, state.groupBoxesByProject],
  );
  const activeGuideRails = useMemo(
    () => state.guideRailsByProject[activeProjectDefinition.id] ?? [],
    [activeProjectDefinition.id, state.guideRailsByProject],
  );
  const activeShowFurniture = state.showFurnitureByProject[activeProjectDefinition.id] ?? true;
  const activeShowOverviewNavigator =
    state.showOverviewNavigatorByProject[activeProjectDefinition.id] ?? false;
  const activeShowGrid = state.showGridByProject[activeProjectDefinition.id] ?? false;
  const activeSnapToGrid = state.snapToGridByProject[activeProjectDefinition.id] ?? false;
  const activeSnapToGuides = state.snapToGuidesByProject[activeProjectDefinition.id] ?? false;
  const activeCompositeEntry = state.compositeEditor
    ? state.compositeLibrary.find((entry) => entry.id === state.compositeEditor?.entryId) ?? null
    : null;
  const activeProjectState = state.compositeEditor?.project ?? baseProjectState;
  const activeLayout = state.compositeEditor?.layout ?? baseLayout;
  const activeAnnotations = useMemo(
    () => (state.compositeEditor ? [] : baseAnnotations),
    [baseAnnotations, state.compositeEditor],
  );
  const activeStageLabels = useMemo(
    () => (state.compositeEditor ? [] : state.stageLabelsByProject[activeProjectDefinition.id] ?? []),
    [activeProjectDefinition.id, state.compositeEditor, state.stageLabelsByProject],
  );
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
  const selectedModulePosition = selectedModule ? activeLayout[selectedModule.id] ?? null : null;
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
  const effectivePortNameOverrides = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(compositePortNameOverrides)) {
      const trimmed = value.trim();
      if (trimmed) result[key] = trimmed;
    }
    return result;
  }, [compositePortNameOverrides]);

  const compositeSelectionPreview = useMemo(
    () =>
      previewCompositeSelection({
        project: activeProjectState,
        registry: effectiveRegistry,
        selectedModuleIds: effectiveSelectedModuleIds,
        excludedBoundaryPortKeys: excludedCompositeBoundaryPortKeys,
        portNameOverrides: effectivePortNameOverrides,
      }),
    [activeProjectState, effectiveRegistry, effectiveSelectedModuleIds, excludedCompositeBoundaryPortKeys, effectivePortNameOverrides],
  );

  let execution: ExecutionResult | null = null;
  let executionError: string | null = null;
  let tickedExecution: TickedExecutionResult | null = null;
  let tickCount: number | null = null;
  const validationResult = validateProject(activeProjectState, effectiveRegistry);
  const validationIssues = validationResult.issues;
  const workspaceExecution = resolveWorkspaceExecution(
    activeProjectState,
    effectiveRegistry,
    isTickedMode,
    currentTick,
  );
  execution = workspaceExecution.execution;
  executionError = workspaceExecution.executionError;
  tickedExecution = workspaceExecution.tickedExecution;
  tickCount = workspaceExecution.tickCount;
  const primaryOutputModuleId = workspaceExecution.primaryOutputModuleId;

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
          const outputModule = primaryOutputModuleId
            ? activeProjectState.modules.find((m) => m.id === primaryOutputModuleId) ?? null
            : activeProjectState.modules.find((m) => isOutputSinkDefId(m.defId)) ?? null;
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

  const activeCompositeDrilldownInstance =
    compositeDrilldown?.parentProjectId === activeProjectDefinition.id
      ? baseProjectState.modules.find((moduleInstance) => moduleInstance.id === compositeDrilldown.instanceId) ?? null
      : null;
  const activeCompositeDrilldownDefinition =
    activeCompositeDrilldownInstance
      ? effectiveRegistry[activeCompositeDrilldownInstance.defId]
      : null;
  const compositeDrilldownContext =
    compositeDrilldown &&
    activeCompositeDrilldownInstance &&
    activeCompositeDrilldownDefinition &&
    isCompositeDefinition(activeCompositeDrilldownDefinition)
      ? buildCompositeInstanceDrilldownContext(
          activeCompositeDrilldownDefinition,
          activeCompositeDrilldownInstance.params,
          execution,
          activeCompositeDrilldownInstance.id,
        )
      : null;
  const compositeDrilldownSelectedModule =
    compositeDrilldownContext && compositeDrilldown
      ? compositeDrilldownContext.project.modules.find(
          (moduleInstance) => moduleInstance.id === compositeDrilldown.selectedModuleId,
        ) ?? null
      : null;
  const compositeDrilldownSelectedModuleDef =
    compositeDrilldownSelectedModule
      ? effectiveRegistry[compositeDrilldownSelectedModule.defId] ?? null
      : null;
  const isCompositeDrilldownActive = Boolean(compositeDrilldown && compositeDrilldownContext);
  const compositeDrilldownTitle =
    isCompositeDrilldownActive && activeCompositeDrilldownInstance && activeCompositeDrilldownDefinition
      ? `${activeCompositeDrilldownInstance.id} (${activeCompositeDrilldownDefinition.name})`
      : undefined;
  const compositeDrilldownValidationIssues = compositeDrilldownContext
    ? validateProject(compositeDrilldownContext.project, effectiveRegistry).issues
    : [];
  const compositeDrilldownExecutionError =
    isCompositeDrilldownActive && !compositeDrilldownContext?.execution
      ? 'Instance trace is unavailable until the parent workspace runs successfully.'
      : null;
  const compositeDrilldownSteppedModuleId =
    compositeDrilldown &&
    compositeDrilldown.stepIndex !== null &&
    compositeDrilldownContext?.execution
      ? compositeDrilldownContext.execution.trace[
          Math.min(
            Math.max(0, compositeDrilldown.stepIndex),
            Math.max(0, compositeDrilldownContext.execution.trace.length - 1),
          )
        ]?.moduleId ?? null
      : null;

  useEffect(() => {
    if (!compositeDrilldown) {
      return;
    }

    if (
      compositeDrilldown.parentProjectId !== activeProjectDefinition.id ||
      !activeCompositeDrilldownInstance ||
      !activeCompositeDrilldownDefinition ||
      !isCompositeDefinition(activeCompositeDrilldownDefinition)
    ) {
      setCompositeDrilldown(null);
    }
  }, [
    activeCompositeDrilldownDefinition,
    activeCompositeDrilldownInstance,
    activeProjectDefinition.id,
    compositeDrilldown,
  ]);

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
  const verificationSourceOptions = useMemo(
    () => getVerificationSourceOptions(activeProjectState, effectiveRegistry),
    [activeProjectState, effectiveRegistry],
  );
  const verificationCases = useMemo(
    () => verificationCasesByProject[activeProjectDefinition.id] ?? [],
    [activeProjectDefinition.id, verificationCasesByProject],
  );
  const verificationResults = useMemo(
    () =>
      comparisonBaseline
        ? evaluateVerificationCases({
            baselineProject: comparisonBaseline.project,
            currentProject: activeProjectState,
            registry: effectiveRegistry,
            cases: verificationCases,
          })
        : [],
    [
      activeProjectState,
      comparisonBaseline,
      effectiveRegistry,
      verificationCases,
    ],
  );
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
  const hasChallengePanel = Boolean(selectedChallenge);
  const hasTutorialPanel = Boolean(selectedTutorial);
  const hasCryptanalysisPanel = true;
  const activeLearningPanelTab = (() => {
    if (learningPanelTab === 'quickstart') {
      return 'quickstart';
    }
    if (learningPanelTab === 'challenge') {
      return hasChallengePanel
        ? 'challenge'
        : hasTutorialPanel
          ? 'tutorial'
          : 'cryptanalysis';
    }
    if (learningPanelTab === 'tutorial') {
      return hasTutorialPanel
        ? 'tutorial'
        : hasChallengePanel
          ? 'challenge'
          : 'cryptanalysis';
    }
    return hasCryptanalysisPanel
      ? 'cryptanalysis'
      : hasTutorialPanel
        ? 'tutorial'
        : 'challenge';
  })();
  const tutorialNotesVisible =
    state.tutorialNotesVisibleByProject[activeProjectDefinition.id] ?? true;
  const canCaptureChallenge =
    !state.compositeEditor &&
    comparisonBaseline !== null &&
    baselineValidation?.ok === true &&
    baselineExecutionError === null;
  const handleCaptureBaseline = useCallback(() => {
    dispatch({
      type: 'captureComparisonBaseline',
      projectId: activeProjectDefinition.id,
      capturedAt: new Date().toISOString(),
    });
    setVerificationCasesByProject((current) => ({
      ...current,
      [activeProjectDefinition.id]: [],
    }));
  }, [activeProjectDefinition.id]);
  const handleClearBaseline = useCallback(() => {
    dispatch({
      type: 'clearComparisonBaseline',
      projectId: activeProjectDefinition.id,
    });
    setVerificationCasesByProject((current) => ({
      ...current,
      [activeProjectDefinition.id]: [],
    }));
  }, [activeProjectDefinition.id]);
  const handleOpenUserManual = useCallback(() => {
    window.open(
      createUserManualUrl(theme),
      'mcw-user-manual',
      'noopener,noreferrer,width=1320,height=900',
    );
  }, [theme]);
  const handleOpenTutorialPath = useCallback(
    (projectId: string, tutorialId: string) => {
      applyTutorialSelectionPlan({
        plan: buildTutorialSelectionPlan({
          activeProjectId: activeProjectDefinition.id,
          workspaceMode,
          projectId,
          tutorialId,
          tutorials: state.tutorialLibrary,
        }),
        activeProjectId: activeProjectDefinition.id,
        dispatch,
        setLearningPanelTab,
        setStepIndex,
      });
    },
    [activeProjectDefinition.id, state.tutorialLibrary, workspaceMode],
  );
  const handleOpenCompositeInstanceDrilldown = useCallback(
    (moduleId: string) => {
      if (state.compositeEditor || compositeDrilldown) {
        return;
      }

      const moduleInstance = baseProjectState.modules.find((candidate) => candidate.id === moduleId);
      if (!moduleInstance) {
        return;
      }

      const definition = effectiveRegistry[moduleInstance.defId];
      if (!definition || !isCompositeDefinition(definition)) {
        return;
      }

      setCompositeDrilldown({
        parentProjectId: activeProjectDefinition.id,
        instanceId: moduleId,
        selectedModuleId: null,
        selectedModuleIds: [],
        hoveredTraceModuleId: null,
        stepIndex: null,
        activeAnalysisTraceEntry: null,
        requestedFocusModuleId: null,
      });
    },
    [
      activeProjectDefinition.id,
      baseProjectState.modules,
      compositeDrilldown,
      effectiveRegistry,
      state.compositeEditor,
    ],
  );
  const handleAddVerificationCase = useCallback(
    (sourceModuleId: string, inputValue: string, tickCount: number | null = null) => {
      let nextError: string | null = null;
      setVerificationCasesByProject((current) => {
        const result = createVerificationCaseForProject({
          comparisonBaseline,
          verificationSourceOptions,
          registry: effectiveRegistry,
          sourceModuleId,
          inputValue,
          projectId: activeProjectDefinition.id,
          casesByProject: current,
          isTickedMode,
          tickCount,
        });
        nextError = result.error;
        return result.nextCasesByProject;
      });
      return nextError;
    },
    [
      activeProjectDefinition.id,
      comparisonBaseline,
      effectiveRegistry,
      verificationSourceOptions,
      isTickedMode,
    ],
  );
  const handleRemoveVerificationCase = useCallback(
    (caseId: string) => {
      setVerificationCasesByProject((current) =>
        removeVerificationCaseFromProject(current, activeProjectDefinition.id, caseId),
      );
    },
    [activeProjectDefinition.id],
  );
  const handleClearVerificationCases = useCallback(() => {
    setVerificationCasesByProject((current) =>
      clearVerificationCasesForProject(current, activeProjectDefinition.id),
    );
  }, [activeProjectDefinition.id]);
  const handleImportVerificationCases = useCallback(
    (cases: VerificationCase[]) => {
      if (cases.length === 0) {
        return;
      }

      setVerificationCasesByProject((current) =>
        addVerificationCasesToProject(current, activeProjectDefinition.id, cases),
      );
    },
    [activeProjectDefinition.id],
  );
  const handleExportShareableLabPack = useCallback(async () => {
    const selectedProjectTutorial =
      selectedTutorial?.projectId === activeProjectDefinition.id ? selectedTutorial : undefined;
    const selectedProjectChallenge =
      selectedChallenge?.projectId === activeProjectDefinition.id ? selectedChallenge : undefined;
    const fileNameStem =
      activeProjectDefinition.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || activeProjectDefinition.id;

    const [{ downloadShareableLabPack }, { buildShareableLabPack }] = await Promise.all([
      import('./ui/shareable-lab-pack-persistence'),
      import('./ui/workspace-artifact-actions'),
    ]);
    downloadShareableLabPack(
      fileNameStem,
      buildShareableLabPack({
        activeProjectId: activeProjectDefinition.id,
        projectName: activeProjectDefinition.name,
        projectSummary: activeProjectDefinition.summary,
        project: activeProjectState,
        layout: activeLayout,
        annotations: activeAnnotations,
        stageLabels: activeStageLabels,
        groupBoxes: activeGroupBoxes,
        guideRails: activeGuideRails,
        showFurniture: activeShowFurniture,
        showOverviewNavigator: activeShowOverviewNavigator,
        showGrid: activeShowGrid,
        snapToGrid: activeSnapToGrid,
        snapToGuides: activeSnapToGuides,
        layoutDirection: activeLayoutDirection,
        routingMode: activeRoutingMode,
        wireColorMode: activeWireColorMode,
        connectionLayout: activeConnectionLayout,
        comparisonBaseline,
        verificationCases,
        tutorial: selectedProjectTutorial,
        challenge: selectedProjectChallenge,
      }),
    );
    setImportError(null);
  }, [
    activeAnnotations,
    activeStageLabels,
    activeGroupBoxes,
    activeGuideRails,
    activeShowFurniture,
    activeShowOverviewNavigator,
    activeShowGrid,
    activeSnapToGrid,
    activeSnapToGuides,
    activeLayout,
    activeLayoutDirection,
    activeRoutingMode,
    activeWireColorMode,
    activeConnectionLayout,
    activeProjectDefinition.id,
    activeProjectDefinition.name,
    activeProjectDefinition.summary,
    activeProjectState,
    comparisonBaseline,
    selectedChallenge,
    selectedTutorial,
    verificationCases,
  ]);
  const handleImportShareableLabPack = useCallback(
    async (file: File) => {
      const { parseShareableLabPack } = await import('./ui/shareable-lab-pack-persistence');
      const rawValue = await file.text();
      const pack = parseShareableLabPack(rawValue);
      if (!pack) {
        setImportError('The selected file is not a valid MCW shareable lab pack.');
        return;
      }

      const validation = validateProject(pack.workspace.project, effectiveRegistry);
      if (!validation.ok) {
        setImportError(
          `The imported lab pack is not valid in this build: ${validation.issues
            .map((issue) => issue.message)
            .join(' ')}`,
        );
        return;
      }

      const { prepareImportedLabPack } = await import('./ui/workspace-artifact-actions');
      const plan = prepareImportedLabPack({
        pack,
        availableProjects,
        tutorialLibrary: state.tutorialLibrary,
        challengeLibrary: state.challengeLibrary,
      });

      dispatch({
        type: 'createBlankWorkspace',
        workspaceId: plan.workspaceId,
        name: plan.workspaceName,
        summary: plan.workspaceSummary,
        pipeline: plan.workspacePipeline,
        group: 'Imported Lab Packs',
      });
      dispatch({
        type: 'loadDocument',
        projectId: plan.workspaceId,
        document: plan.document,
      });
      dispatch({
        type: 'setComparisonBaseline',
        projectId: plan.workspaceId,
        baseline: plan.comparisonBaseline,
      });
      setVerificationCasesByProject((current) => ({
        ...current,
        [plan.workspaceId]: plan.verificationCases,
      }));

      if (plan.tutorial) {
        dispatch({
          type: 'upsertTutorial',
          tutorial: {
            ...plan.tutorial.tutorial,
            id: plan.tutorial.tutorialId,
          },
        });
        dispatch({
          type: 'selectTutorial',
          projectId: plan.workspaceId,
          tutorialId: plan.tutorial.tutorialId,
        });
      }

      if (plan.challenge) {
        dispatch({
          type: 'upsertChallenge',
          challenge: {
            ...plan.challenge.challenge,
            id: plan.challenge.challengeId,
          },
        });
        dispatch({
          type: 'selectChallenge',
          projectId: plan.workspaceId,
          challengeId: plan.challenge.challengeId,
        });
      }

      dispatch({
        type: 'switchProject',
        projectId: plan.workspaceId,
      });
      setLearningPanelTab(plan.learningPanelTab);
      setImportError(null);
    },
    [availableProjects, effectiveRegistry, state.challengeLibrary, state.tutorialLibrary],
  );
  const handleSelectChallenge = useCallback(
    (challengeId: string) => {
      applyChallengeSelectionPlan({
        plan: buildChallengeSelectionPlan({
          activeProjectId: activeProjectDefinition.id,
          workspaceMode,
          challengeId,
          challenges: state.challengeLibrary,
        }),
        activeProjectId: activeProjectDefinition.id,
        dispatch,
        setLearningPanelTab,
      });
    },
    [activeProjectDefinition.id, state.challengeLibrary, workspaceMode],
  );
  const handleLoadChallengeStart = useCallback(() => {
    setLearningPanelTab('challenge');
    if (workspaceMode === 'cryptanalysis') {
      dispatch({
        type: 'setWorkspaceMode',
        projectId: activeProjectDefinition.id,
        mode: 'guide',
      });
    }
    setIsChallengeResetConfirmOpen(true);
  }, [activeProjectDefinition.id, workspaceMode]);
  const handleCaptureChallenge = useCallback(() => {
    setLearningPanelTab('challenge');
    if (workspaceMode === 'cryptanalysis') {
      dispatch({
        type: 'setWorkspaceMode',
        projectId: activeProjectDefinition.id,
        mode: 'guide',
      });
    }
    const draft = createChallengeCaptureDialogState(
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
  }, [activeProjectDefinition.id, activeProjectDefinition.name, workspaceMode]);
  const handleImportChallengeRaw = useCallback(
    (rawValue: string) => {
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
      if (challengeProjectId !== activeProjectDefinition.id) {
        dispatch({
          type: 'switchProject',
          projectId: challengeProjectId,
        });
      }
      if (workspaceMode === 'cryptanalysis' && challengeProjectId === activeProjectDefinition.id) {
        dispatch({
          type: 'setWorkspaceMode',
          projectId: activeProjectDefinition.id,
          mode: 'guide',
        });
      }
      setLearningPanelTab('challenge');
      dispatch({
        type: 'selectChallenge',
        projectId: challengeProjectId,
        challengeId: challengeDocument.id,
      });
      setImportError(null);
    },
    [activeProjectDefinition.id, workspaceMode],
  );
  const handleSelectTutorial = useCallback(
    (tutorialId: string, projectId = activeProjectDefinition.id) => {
      applyTutorialSelectionPlan({
        plan: buildTutorialSelectionPlan({
          activeProjectId: activeProjectDefinition.id,
          workspaceMode,
          projectId,
          tutorialId,
          tutorials: state.tutorialLibrary,
        }),
        activeProjectId: activeProjectDefinition.id,
        dispatch,
        setLearningPanelTab,
        setStepIndex,
      });
    },
    [activeProjectDefinition.id, state.tutorialLibrary, workspaceMode],
  );
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
      verificationSourceOptions,
      verificationCases,
      verificationResults,
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
      verificationCases,
      verificationResults,
      verificationSourceOptions,
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
      hasCryptanalysisPanel,
      tutorials: state.tutorialLibrary,
      challenges: state.challengeLibrary,
      selectedTutorialId: selectedTutorial?.id ?? null,
      selectedChallengeId: selectedChallenge?.id ?? null,
      currentProjectId: activeProjectDefinition.id,
      projectName: activeProjectDefinition.name,
      currentProject: activeProjectState,
      execution,
      tutorialStepIndex,
      selectedTutorialStep,
      completedTutorialIds,
      isTutorialCompleted,
      workspaceMode,
      tutorialNotesVisible,
      challengeEvaluation,
      canCaptureChallenge,
      ciphertext: state.cryptanalysisInputByProject[activeProjectDefinition.id] ?? '',
      cryptanalysisMode: state.cryptanalysisModeByProject[activeProjectDefinition.id] ?? 'classical',
      modernBaseline: state.modernAnalysisBaselineByProject[activeProjectDefinition.id] ?? '',
      modernFlipBit: state.modernAnalysisFlipBitByProject[activeProjectDefinition.id] ?? 0,
      isTickedMode,
      tickedExecution,
    }),
    [
      activeLearningPanelTab,
      activeProjectDefinition.id,
      activeProjectDefinition.name,
      activeProjectState,
      canCaptureChallenge,
      challengeEvaluation,
      completedTutorialIds,
      hasChallengePanel,
      hasCryptanalysisPanel,
      hasTutorialPanel,
      isTutorialCompleted,
      execution,
      selectedChallenge,
      selectedTutorial,
      selectedTutorialStep,
      state.challengeLibrary,
      state.cryptanalysisInputByProject,
      state.cryptanalysisModeByProject,
      state.modernAnalysisBaselineByProject,
      state.modernAnalysisFlipBitByProject,
      tickedExecution,
      state.tutorialLibrary,
      theme,
      tutorialNotesVisible,
      tutorialStepIndex,
      isTickedMode,
      workspaceMode,
    ],
  );
  const detachedPayloadByKind = useMemo<DetachedPanelPayloadByKind>(
    () => ({
      palette: detachedPaletteSnapshot,
      inspector: detachedInspectorSnapshot,
      learning: detachedLearningSnapshot,
    }),
    [detachedInspectorSnapshot, detachedLearningSnapshot, detachedPaletteSnapshot],
  );
  const detachedPanelWindowIdByKind = useMemo(
    () =>
      Object.fromEntries(
        detachedPanelGroups.flatMap((group) =>
          group.tabs.map((kind) => [kind, group.panelWindowId] as const),
        ),
      ) as Partial<Record<DetachedPanelKind, string>>,
    [detachedPanelGroups],
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
      saveWorkspaceToStorage(state, verificationCasesByProject);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state, verificationCasesByProject]);

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

    window.localStorage.setItem('mcw:left-dock-collapsed', leftDockCollapsed ? 'true' : 'false');
  }, [leftDockCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('mcw:right-dock-width', String(rightDockWidth));
  }, [rightDockWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('mcw:right-dock-collapsed', rightDockCollapsed ? 'true' : 'false');
  }, [rightDockCollapsed]);

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

  const handleOpenPipelineMicroDemo = useCallback(
    (pipelineId: string) => {
      if (state.compositeEditor) {
        window.alert('Pipeline micro demos are unavailable while editing a reusable composite.');
        return;
      }

      const pipelineMicroDemo = getPipelineMicroDemo(pipelineId);
      if (!pipelineMicroDemo) {
        return;
      }

      const existingWorkspaceNames = new Set(
        state.userWorkspaceLibrary.map((workspace) => workspace.name),
      );
      const workspaceName = createWorkspaceNameFromBase(pipelineMicroDemo.name, existingWorkspaceNames);
      const workspaceId = createUniqueWorkspaceId(
        workspaceName,
        new Set(availableProjects.map((project) => project.id)),
      );

      dispatch({
        type: 'createBlankWorkspace',
        workspaceId,
        name: workspaceName,
        summary: pipelineMicroDemo.summary,
        pipeline: pipelineMicroDemo.pipeline,
      });
      dispatch({
        type: 'loadDocument',
        projectId: workspaceId,
        document: pipelineMicroDemo.document,
      });
      dispatch({
        type: 'setTickedMode',
        projectId: workspaceId,
        enabled: pipelineMicroDemo.defaultTickedMode ?? false,
      });
      setImportError(null);
    },
    [availableProjects, state.compositeEditor, state.userWorkspaceLibrary],
  );

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

  function handleDuplicateSingleModule(moduleId: string) {
    if (state.compositeEditor) {
      return;
    }

    dispatch({
      type: 'selectModules',
      projectId: activeProjectDefinition.id,
      moduleIds: [moduleId],
    });
    dispatch({
      type: 'duplicateSelectedCluster',
      projectId: activeProjectDefinition.id,
    });
    setImportError(null);
  }

  function handleAutoWireSelection(mode: AutoWireMode) {
    if (!activeProjectDefinition) {
      return;
    }
    const project =
      state.compositeEditor?.project ?? state.projectStates[activeProjectDefinition.id];
    const layout = state.layoutByProject[activeProjectDefinition.id] ?? {};
    const selectedModuleIds =
      state.selectedModuleIdsByProject[activeProjectDefinition.id] ?? [];
    if (!project || selectedModuleIds.length < 2) {
      return;
    }
    const connections = computeAutoWireConnections(
      project,
      effectiveRegistry,
      selectedModuleIds,
      layout,
      mode,
    );
    if (connections.length === 0) {
      return;
    }
    dispatch({
      type: 'autoWireSelection',
      projectId: activeProjectDefinition.id,
      connections,
    });
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
      fallbackProjectId: defaultDemoProject?.id ?? '',
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
            groupBoxes: state.compositeEditor
              ? []
              : state.groupBoxesByProject[activeProjectDefinition.id] ?? [],
            guideRails: state.compositeEditor
              ? []
              : state.guideRailsByProject[activeProjectDefinition.id] ?? [],
            showFurniture: state.compositeEditor
              ? true
              : state.showFurnitureByProject[activeProjectDefinition.id] ?? true,
            showOverviewNavigator: state.compositeEditor
              ? false
              : state.showOverviewNavigatorByProject[activeProjectDefinition.id] ?? false,
            layoutDirection: activeLayoutDirection,
            routingMode: activeRoutingMode,
            wireColorMode: activeWireColorMode,
            connectionLayout: activeConnectionLayout,
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
      activeLayoutDirection,
      activeRoutingMode,
      activeWireColorMode,
      activeConnectionLayout,
      activeProjectDefinition.id,
      activeProjectState,
      selectedModule,
      state.annotationsByProject,
      state.compositeEditor,
      state.compositeLibrary,
      state.guideRailsByProject,
      state.groupBoxesByProject,
      state.showFurnitureByProject,
      state.showOverviewNavigatorByProject,
    ],
  );

  const openDetachedPanelInNewWindow = useCallback((kind: DetachedPanelKind) => {
    openDetachedPanelInNewWindowHelper({
      kind,
      currentHref: window.location.href,
      hostWindowId: hostWindowIdRef.current,
      groups: detachedPanelGroups,
      detachedWindowsRef: detachedPanelWindowsRef,
      setGroups: setDetachedPanelGroups,
      setError: setImportError,
    });
  }, [detachedPanelGroups]);

  const openDetachedPanelInExistingWindow = useCallback(
    (kind: DetachedPanelKind, panelWindowId: string) => {
      moveDetachedPanelToExistingWindowHelper({
      kind,
      panelWindowId,
      groups: detachedPanelGroups,
      detachedWindowsRef: detachedPanelWindowsRef,
      setGroups: setDetachedPanelGroups,
    });
    },
    [detachedPanelGroups],
  );

  const returnDetachedPanelToMain = useCallback((kind: DetachedPanelKind) => {
    returnDetachedPanelToMainHelper({
      kind,
      groups: detachedPanelGroups,
      detachedWindowsRef: detachedPanelWindowsRef,
      setGroups: setDetachedPanelGroups,
    });
  }, [detachedPanelGroups]);

  const detachedCommandHandlers = useMemo(
    () => ({
      dispatch,
      togglePaletteViewMode: () =>
        setPaletteViewMode((currentMode) => (currentMode === 'expanded' ? 'compact' : 'expanded')),
      addModuleByDefId: (defId: string) => {
        const moduleDef = effectiveRegistry[defId] ?? null;
        if (!moduleDef) {
          return null;
        }
        dispatch({
          type: 'addModule',
          projectId: activeProjectDefinition.id,
          moduleDef,
        });
        return moduleDef;
      },
      openComposite: (defId: string) =>
        dispatch({
          type: 'openCompositeEditor',
          entryId: defId,
        }),
      duplicateReusable: (defId: string) => {
        const entry = state.compositeLibrary.find((candidate) => candidate.id === defId);
        if (!entry) {
          return;
        }
        const nextEntry = createUserOwnedReusableDuplicate(entry, state.compositeLibrary);
        dispatch({ type: 'addCompositeToLibrary', entry: nextEntry });
        if (isCompositeDefinition(nextEntry.definition)) {
          dispatch({ type: 'openCompositeEditor', entryId: nextEntry.id });
        }
      },
      openPrimitiveMicroDemo: handleOpenPrimitiveMicroDemo,
      openPipelineMicroDemo: handleOpenPipelineMicroDemo,
      exportCompositeLibrary: () =>
        downloadCompositeLibraryDocument({
          version: 1,
          entries: state.compositeLibrary,
        }),
      removeComposite: (defId: string) =>
        dispatch({
          type: 'removeCompositeFromLibrary',
          compositeId: defId,
        }),
      copyParams: (moduleId: string) => {
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
      },
      applyCopiedParams: (
        sourceModuleId: string,
        sourceDefId: string,
        targetModuleIds: string[],
        params: Record<string, unknown>,
        paramKeys: string[],
      ) =>
        dispatch({
          type: 'applyCopiedParams',
          projectId: activeProjectDefinition.id,
          sourceModuleId,
          sourceDefId,
          targetModuleIds,
          params,
          paramKeys,
        }),
      deleteModule: (moduleId: string) => {
        if (
          state.compositeEditor &&
          activeCompositeEntry &&
          isCompositeBoundaryModule(activeCompositeEntry, moduleId)
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
          moduleId,
        });
      },
      setTraceHover: setHoveredTraceModuleId,
      setStepChange: syncTutorialStepFromTrace,
      setActiveAnalysisTraceChange: setActiveAnalysisTraceEntry,
      requestFocusModule: setRequestedWorkspaceFocusModuleId,
      captureBaseline: handleCaptureBaseline,
      clearBaseline: handleClearBaseline,
      addVerificationCase: (
        sourceModuleId: string,
        inputValue: string,
        tickCount: number | null,
      ) => {
        handleAddVerificationCase(sourceModuleId, inputValue, tickCount);
      },
      removeVerificationCase: handleRemoveVerificationCase,
      clearVerificationCases: handleClearVerificationCases,
      importVerificationCases: handleImportVerificationCases,
      unzipComposite: handleUnzipComposite,
      setLearningTab: (tab: LearningPanelTab) =>
        applyLearningPanelTabSelection({
          tab,
          activeProjectId: activeProjectDefinition.id,
          workspaceMode,
          dispatch,
          setLearningPanelTab,
        }),
      selectChallenge: handleSelectChallenge,
      loadChallengeStart: handleLoadChallengeStart,
      exportChallenge: () => {
        if (selectedChallenge) {
          downloadGuidedChallengeDocument(selectedChallenge);
        }
      },
      importChallengeRaw: handleImportChallengeRaw,
      captureChallenge: handleCaptureChallenge,
      setCryptanalysisMode: (mode: 'classical' | 'modern' | 'randomness') =>
        dispatch({
          type: 'setCryptanalysisMode',
          projectId: activeProjectDefinition.id,
          mode,
        }),
      setCryptanalysisInput: (value: string) =>
        dispatch({
          type: 'setCryptanalysisInput',
          projectId: activeProjectDefinition.id,
          value,
        }),
      setModernAnalysisBaseline: (value: string) =>
        dispatch({
          type: 'setModernAnalysisBaseline',
          projectId: activeProjectDefinition.id,
          value,
        }),
      setModernAnalysisFlipBit: (value: number) =>
        dispatch({
          type: 'setModernAnalysisFlipBit',
          projectId: activeProjectDefinition.id,
          value,
        }),
      selectTutorial: handleSelectTutorial,
      setTutorialStep: (stepIndex: number) => {
        setStepIndex(selectedTutorial?.steps[stepIndex]?.targetStepIndex ?? null);
        dispatch({
          type: 'setTutorialStep',
          projectId: activeProjectDefinition.id,
          stepIndex,
        });
      },
      switchProject: (projectId: string) =>
        dispatch({
          type: 'switchProject',
          projectId,
        }),
      setWorkspaceMode: (mode: WorkspaceMode) =>
        dispatch({
          type: 'setWorkspaceMode',
          projectId: activeProjectDefinition.id,
          mode,
        }),
      setTutorialNotesVisible: (visible: boolean) =>
        dispatch({
          type: 'setTutorialNotesVisible',
          projectId: activeProjectDefinition.id,
          visible,
        }),
      focusStepModule: (moduleId: string) => setRequestedWorkspaceFocusModuleId(moduleId),
      resetTutorialProgress: () => {
        if (selectedTutorial) {
          dispatch({
            type: 'resetTutorialProgress',
            projectId: activeProjectDefinition.id,
          });
        }
      },
      setGroups: setDetachedPanelGroups,
      returnDetachedTabToMain: returnDetachedPanelToMain,
      detachedWindowsRef: detachedPanelWindowsRef,
    }),
    [
      activeCompositeEntry,
      activeProjectDefinition.id,
      dispatch,
      effectiveRegistry,
      handleAddVerificationCase,
      handleCaptureBaseline,
      handleCaptureChallenge,
      handleClearBaseline,
      handleClearVerificationCases,
      handleImportChallengeRaw,
      handleImportVerificationCases,
      handleLoadChallengeStart,
      handleOpenPipelineMicroDemo,
      handleOpenPrimitiveMicroDemo,
      handleRemoveVerificationCase,
      handleSelectChallenge,
      handleSelectTutorial,
      handleUnzipComposite,
      returnDetachedPanelToMain,
      selectedChallenge,
      selectedModule,
      selectedModuleDef,
      selectedModuleParamKeys,
      selectedTutorial,
      state.compositeEditor,
      state.compositeLibrary,
      syncTutorialStepFromTrace,
      workspaceMode,
    ],
  );

  useEffect(() => {
    return connectDetachedPanelChannel({
      channelName: DETACHED_PANEL_CHANNEL_NAME,
      hostWindowId: hostWindowIdRef.current,
      groups: detachedPanelGroups,
      payloadByKind: detachedPayloadByKind,
      commandHandlers: detachedCommandHandlers,
    });
  }, [detachedCommandHandlers, detachedPanelGroups, detachedPayloadByKind]);

  useEffect(() => {
    broadcastDetachedSnapshots({
      channelName: DETACHED_PANEL_CHANNEL_NAME,
      hostWindowId: hostWindowIdRef.current,
      groups: detachedPanelGroups,
      payloadByKind: detachedPayloadByKind,
    });
  }, [detachedPanelGroups, detachedPayloadByKind]);

  const showPaletteInMain = state.showPalette && !isDetachedPanelKindActive(detachedPanelGroups, 'palette');
  const showInspectorInMain =
    state.showInspector && !isDetachedPanelKindActive(detachedPanelGroups, 'inspector');
  const showLearningInMain = !isDetachedPanelKindActive(detachedPanelGroups, 'learning');
  const detachedWindowTargets = useMemo(
    () =>
      detachedPanelGroups.map((group) => ({
        panelWindowId: group.panelWindowId,
        label: formatDetachedPanelWindowLabel(detachedPanelGroups, group),
        tabs: group.tabs,
        presentationMode: group.presentationMode,
      })),
    [detachedPanelGroups],
  );

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
                } else if (value === 'user-manual') {
                  window.open(
                    createUserManualUrl(theme),
                    'mcw-user-manual',
                    'noopener,noreferrer,width=1320,height=900',
                  );
                } else if (value === 'instructor-pilot-pack') {
                  window.open(
                    createInstructorPilotUrl(theme),
                    'mcw-instructor-pilot-pack',
                    'noopener,noreferrer,width=1320,height=900',
                  );
                } else if (value === 'ai-toolkit') {
                  downloadAiToolkitDocument();
                }
              }}
            >
              <option value="">Open…</option>
              <option value="ai-toolkit">AI Toolkit</option>
              <option value="instructor-pilot-pack">Instructor Pilot Pack</option>
              <option value="user-manual">User Manual</option>
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
                if (value === 'new-blank-workspace') {
                  handleCreateBlankWorkspace();
                } else if (value === 'duplicate-current-workspace') {
                  handleDuplicateCurrentWorkspace();
                } else if (value === 'save-current-workspace') {
                  handleSaveCurrentWorkspace();
                } else if (value === 'save-workspace-version') {
                  handleSaveWorkspaceVersion();
                } else if (value === 'delete-current-workspace') {
                  handleDeleteCurrentWorkspace();
                }
              }}
            >
              <option value="">Manage…</option>
              <option value="new-blank-workspace">New Blank Workspace</option>
              <option value="duplicate-current-workspace">Duplicate Workspace</option>
              <option value="save-current-workspace">Save Current Workspace</option>
              <option value="save-workspace-version">Save Version</option>
              {state.userWorkspaceLibrary.some(
                (workspace) => workspace.id === activeProjectDefinition.id,
              ) ? (
                <option value="delete-current-workspace">Delete Workspace</option>
              ) : null}
            </select>
          </label>
          <label className="header-menu-select">
            <span className="meta-label">Windows</span>
            <select
              value={headerWindowAction}
              onChange={(event) => {
                const value = event.target.value;
                setHeaderWindowAction('');
                if (!value) {
                  return;
                }

                if (value.startsWith('new:')) {
                  openDetachedPanelInNewWindow(value.slice(4) as DetachedPanelKind);
                  return;
                }

                if (value.startsWith('return:')) {
                  returnDetachedPanelToMain(value.slice(7) as DetachedPanelKind);
                  return;
                }

                if (value.startsWith('move:')) {
                  const [, kind, panelWindowId] = value.split(':');
                  if (kind && panelWindowId) {
                    openDetachedPanelInExistingWindow(kind as DetachedPanelKind, panelWindowId);
                  }
                }
              }}
            >
              <option value="">Manage…</option>
              {(['palette', 'inspector', 'learning'] as DetachedPanelKind[]).map((kind) => {
                const currentWindowId = detachedPanelWindowIdByKind[kind] ?? null;
                const kindLabel = formatDetachedPanelKindLabel(kind);
                const moveTargets = detachedWindowTargets.filter(
                  (target) => target.panelWindowId !== currentWindowId && !target.tabs.includes(kind),
                );

                return (
                  <optgroup key={kind} label={kindLabel}>
                    <option value={`new:${kind}`}>Open {kindLabel} In New Window</option>
                    {currentWindowId ? (
                      <option value={`return:${kind}`}>Return {kindLabel} To Main</option>
                    ) : null}
                    {moveTargets.map((target) => (
                      <option
                        key={`${kind}:${target.panelWindowId}`}
                        value={`move:${kind}:${target.panelWindowId}`}
                      >
                        {currentWindowId ? 'Move' : 'Add'} {kindLabel} To {target.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
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
            (showPaletteInMain && !leftDockCollapsed ? ' workbench-stage-has-left' : '') +
            (showInspectorInMain && !rightDockCollapsed ? ' workbench-stage-has-right' : '') +
            (showPaletteInMain && !leftDockCollapsed && paletteViewMode === 'compact'
              ? ' workbench-stage-tools-compact'
              : '')
          }
        >
          <WorkbenchPanel
            key={`${state.compositeEditor ? 'composite' : isCompositeDrilldownActive ? 'drilldown' : 'workspace'}:${activeProjectDefinition.id}:${compositeDrilldown?.instanceId ?? 'root'}`}
            activeProject={activeProjectDefinition}
            title={
              state.compositeEditor
                ? activeCompositeEntry
                  ? `${activeCompositeEntry.name} Internals`
                  : undefined
                : isCompositeDrilldownActive
                  ? compositeDrilldownTitle
                  : undefined
            }
            summary={
              state.compositeEditor && activeCompositeEntry
                ? 'Editing the internal graph of a reusable composite. Boundary ports stay fixed in this first editing slice.'
                : isCompositeDrilldownActive
                  ? 'Read-only drill-down into one placed composite instance. Inspect signals, trace, and forwarded parameters without mutating the shared definition.'
                  : undefined
            }
            pipelineLabel={
              state.compositeEditor && activeCompositeEntry
                ? `${activeCompositeEntry.definition.inputs.length} in -> reusable composite -> ${activeCompositeEntry.definition.outputs.length} out`
                : isCompositeDrilldownActive && activeCompositeDrilldownDefinition && isCompositeDefinition(activeCompositeDrilldownDefinition)
                  ? `${activeCompositeDrilldownDefinition.inputs.length} in -> instance drill-down -> ${activeCompositeDrilldownDefinition.outputs.length} out`
                  : undefined
            }
            activeProjectState={compositeDrilldownContext?.project ?? activeProjectState}
            theme={theme}
            layout={compositeDrilldownContext?.layout ?? activeLayout}
            layoutDirection={activeLayoutDirection}
            routingMode={activeRoutingMode}
            wireColorMode={activeWireColorMode}
            connectionLayout={
              isCompositeDrilldownActive
                ? {}
                : activeConnectionLayout
            }
            annotations={isCompositeDrilldownActive ? [] : activeAnnotations}
            stageLabels={isCompositeDrilldownActive ? [] : activeStageLabels}
            groupBoxes={isCompositeDrilldownActive ? [] : activeGroupBoxes}
            guideRails={isCompositeDrilldownActive ? [] : activeGuideRails}
            showFurniture={isCompositeDrilldownActive ? true : activeShowFurniture}
            showOverviewNavigator={isCompositeDrilldownActive ? false : activeShowOverviewNavigator}
            showGrid={isCompositeDrilldownActive ? false : activeShowGrid}
            snapToGrid={isCompositeDrilldownActive ? false : activeSnapToGrid}
            snapToGuides={isCompositeDrilldownActive ? false : activeSnapToGuides}
            execution={compositeDrilldownContext?.execution ?? execution}
            executionError={isCompositeDrilldownActive ? compositeDrilldownExecutionError : executionError}
            validationIssues={isCompositeDrilldownActive ? compositeDrilldownValidationIssues : validationIssues}
            registry={effectiveRegistry}
            selectedModuleId={compositeDrilldown?.selectedModuleId ?? effectiveSelectedModuleId}
            selectedModuleIds={compositeDrilldown?.selectedModuleIds ?? effectiveSelectedModuleIds}
            hoveredTraceModuleId={compositeDrilldown?.hoveredTraceModuleId ?? hoveredTraceModuleId}
            steppedModuleId={isCompositeDrilldownActive ? compositeDrilldownSteppedModuleId : steppedModuleId}
            activeAnalysisTraceEntry={compositeDrilldown?.activeAnalysisTraceEntry ?? activeAnalysisTraceEntry}
            activeAnalysisOwnerModuleId={
              compositeDrilldown?.activeAnalysisTraceEntry
                ? compositeDrilldown.activeAnalysisTraceEntry.moduleId.split('/')[0] ??
                  compositeDrilldown.activeAnalysisTraceEntry.moduleId
                : activeAnalysisOwnerModuleId
            }
            divergenceModuleId={isCompositeDrilldownActive ? null : divergenceModuleId}
            tutorialStep={activeTutorialStep}
            tutorialTitle={selectedTutorial?.projectId === activeProjectDefinition.id ? selectedTutorial.title : null}
            tutorialStepIndex={tutorialStepIndex}
            tutorialStepCount={selectedTutorial?.projectId === activeProjectDefinition.id ? selectedTutorial.steps.length : 0}
            showTutorialToggle={Boolean(selectedTutorial?.projectId === activeProjectDefinition.id)}
            tutorialNotesVisible={tutorialNotesVisible}
            challengeSolved={challengeEvaluation?.status === 'success'}
            isObservationMode={isCompositeDrilldownActive}
            probedModuleIds={isCompositeDrilldownActive ? [] : state.probedModuleIdsByProject[activeProjectDefinition.id] ?? []}
            isTickedMode={isTickedMode}
            showTickControls={!isCompositeDrilldownActive}
            tickCount={effectiveTickCount}
            currentTick={effectiveCurrentTick}
            collectedOutput={isCompositeDrilldownActive ? null : collectedOutput}
            tickedParamsByModule={isCompositeDrilldownActive ? null : tickedExecution?.paramsByModuleByTick ?? null}
            tickHistoryByModule={isCompositeDrilldownActive ? null : tickHistoryByModule}
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
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'toggleProbe',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                  })
            }
            onMoveModule={(moduleId, x, y) =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'moveModule',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                    x,
                    y,
                  })
            }
            onMoveModules={(positions) =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'moveModules',
                    projectId: activeProjectDefinition.id,
                    positions,
                  })
            }
            onAddAnnotation={() =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'addAnnotation',
                    projectId: activeProjectDefinition.id,
                  })
            }
            onAddStageLabel={() =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'addStageLabel',
                    projectId: activeProjectDefinition.id,
                  })
            }
            onAddGroupBox={() =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'addGroupBox',
                    projectId: activeProjectDefinition.id,
                  })
            }
            onAddGroupBoxFromSelection={() =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'addGroupBoxFromSelection',
                    projectId: activeProjectDefinition.id,
                  })
            }
            onAddGuideRail={(axis) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'addGuideRail',
                    projectId: activeProjectDefinition.id,
                    axis,
                  })
            }
            onMoveGuideRail={(guideRailId, position) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'moveGuideRail',
                    projectId: activeProjectDefinition.id,
                    guideRailId,
                    position,
                  })
            }
            onUpdateGuideRailTitle={(guideRailId, title) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'updateGuideRailTitle',
                    projectId: activeProjectDefinition.id,
                    guideRailId,
                    title,
                  })
            }
            onRemoveGuideRail={(guideRailId) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'removeGuideRail',
                    projectId: activeProjectDefinition.id,
                    guideRailId,
                  })
            }
            onMoveGroupBox={(groupBoxId, x, y) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'moveGroupBox',
                    projectId: activeProjectDefinition.id,
                    groupBoxId,
                    x,
                    y,
                  })
            }
            onResizeGroupBox={(groupBoxId, width, height) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'resizeGroupBox',
                    projectId: activeProjectDefinition.id,
                    groupBoxId,
                    width,
                    height,
                  })
            }
            onUpdateGroupBoxTitle={(groupBoxId, title) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'updateGroupBoxTitle',
                    projectId: activeProjectDefinition.id,
                    groupBoxId,
                    title,
                  })
            }
            onSetGroupBoxVariant={(groupBoxId, variant) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setGroupBoxVariant',
                    projectId: activeProjectDefinition.id,
                    groupBoxId,
                    variant,
                  })
            }
            onRemoveGroupBox={(groupBoxId) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'removeGroupBox',
                    projectId: activeProjectDefinition.id,
                    groupBoxId,
                  })
            }
            onSetOverviewNavigatorVisible={(visible) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setOverviewNavigatorVisible',
                    projectId: activeProjectDefinition.id,
                    visible,
                  })
            }
            onSetFurnitureVisible={(visible) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setFurnitureVisible',
                    projectId: activeProjectDefinition.id,
                    visible,
                  })
            }
            onSetGridVisible={(visible) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setGridVisible',
                    projectId: activeProjectDefinition.id,
                    visible,
                  })
            }
            onSetSnapToGrid={(enabled) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setSnapToGrid',
                    projectId: activeProjectDefinition.id,
                    enabled,
                  })
            }
            onSetSnapToGuides={(enabled) =>
              state.compositeEditor || isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setSnapToGuides',
                    projectId: activeProjectDefinition.id,
                    enabled,
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
            onMoveStageLabel={(stageLabelId, x, y) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'moveStageLabel',
                    projectId: activeProjectDefinition.id,
                    stageLabelId,
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
            onUpdateStageLabelText={(stageLabelId, text) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'updateStageLabelText',
                    projectId: activeProjectDefinition.id,
                    stageLabelId,
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
            onRemoveStageLabel={(stageLabelId) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'removeStageLabel',
                    projectId: activeProjectDefinition.id,
                    stageLabelId,
                  })
            }
            onSelectModule={(moduleId, additive) =>
              isCompositeDrilldownActive
                ? setCompositeDrilldown((current) =>
                    current
                      ? {
                          ...current,
                          selectedModuleId: additive
                            ? current.selectedModuleId ?? moduleId
                            : moduleId,
                          selectedModuleIds: additive
                            ? Array.from(new Set([...current.selectedModuleIds, moduleId]))
                            : [moduleId],
                        }
                      : current,
                  )
                : dispatch({
                    type: 'selectModule',
                    projectId: activeProjectDefinition.id,
                    moduleId,
                    additive,
                  })
            }
            onSelectModules={(moduleIds, additive) =>
              isCompositeDrilldownActive
                ? setCompositeDrilldown((current) =>
                    current
                      ? {
                          ...current,
                          selectedModuleId: moduleIds[0] ?? null,
                          selectedModuleIds: additive
                            ? Array.from(new Set([...current.selectedModuleIds, ...moduleIds]))
                            : moduleIds,
                        }
                      : current,
                  )
                : dispatch({
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
            onRequestAutoWire={handleAutoWireSelection}
            onRequestDuplicateSelection={isCompositeDrilldownActive ? () => undefined : handleDuplicateSelectedCluster}
            onRequestDeleteSelection={isCompositeDrilldownActive ? () => undefined : handleDeleteSelectedCluster}
            onRequestUndo={handleUndoWorkspaceHistory}
            onRequestRedo={handleRedoWorkspaceHistory}
            onToggleTheme={() =>
              setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
            }
            canUndo={isCompositeDrilldownActive ? false : canUndoWorkspaceHistory}
            canRedo={isCompositeDrilldownActive ? false : canRedoWorkspaceHistory}
            workspaceVersions={isCompositeDrilldownActive ? [] : activeWorkspaceVersions}
            onRequestSaveVersion={handleSaveWorkspaceVersion}
            onRequestArrangeSelection={(mode) =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'arrangeSelectedModules',
                    projectId: activeProjectDefinition.id,
                    mode,
                  })
            }
            onRequestRestoreVersion={handleRestoreWorkspaceVersion}
            requestedFocusModuleId={
              isCompositeDrilldownActive
                ? compositeDrilldown?.requestedFocusModuleId ?? null
                : requestedWorkspaceFocusModuleId
            }
            onWorkspaceFocusHandled={() =>
              isCompositeDrilldownActive
                ? setCompositeDrilldown((current) =>
                    current
                      ? {
                          ...current,
                          requestedFocusModuleId: null,
                        }
                      : current,
                  )
                : setRequestedWorkspaceFocusModuleId(null)
            }
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
            onSetConnectionOrthogonalBend={(connectionKey, axis, value) =>
              dispatch({
                type: 'setConnectionOrthogonalBend',
                projectId: activeProjectDefinition.id,
                connectionKey,
                axis,
                value,
              })
            }
            onSetConnectionOrthogonalAnchors={(connectionKey, anchors) =>
              dispatch({
                type: 'setConnectionOrthogonalAnchors',
                projectId: activeProjectDefinition.id,
                connectionKey,
                anchors,
              })
            }
            onRemoveConnectionOrthogonalAnchor={(connectionKey, anchorIndex) =>
              dispatch({
                type: 'removeConnectionOrthogonalAnchor',
                projectId: activeProjectDefinition.id,
                connectionKey,
                anchorIndex,
              })
            }
            onClearConnectionOrthogonalBend={(connectionKey) =>
              dispatch({
                type: 'clearConnectionOrthogonalBend',
                projectId: activeProjectDefinition.id,
                connectionKey,
              })
            }
            onClearConnectionOrthogonalPathEdits={(connectionKey) =>
              dispatch({
                type: 'clearConnectionOrthogonalPathEdits',
                projectId: activeProjectDefinition.id,
                connectionKey,
              })
            }
            onSetConnectionLanePreference={(connectionKey, preference) =>
              dispatch({
                type: 'setConnectionLanePreference',
                projectId: activeProjectDefinition.id,
                connectionKey,
                preference,
              })
            }
            onClearConnectionLanePreference={(connectionKey) =>
              dispatch({
                type: 'clearConnectionLanePreference',
                projectId: activeProjectDefinition.id,
                connectionKey,
              })
            }
            onSetConnectionColorOverride={(connectionKey, color) =>
              dispatch({
                type: 'setConnectionColorOverride',
                projectId: activeProjectDefinition.id,
                connectionKey,
                color,
              })
            }
            onClearConnectionColorOverride={(connectionKey) =>
              dispatch({
                type: 'clearConnectionColorOverride',
                projectId: activeProjectDefinition.id,
                connectionKey,
              })
            }
            onExportDocument={() => {
              if (isCompositeDrilldownActive) {
                return;
              }
              downloadDocument(activeProjectDefinition.id, {
                version: 1,
                project: activeProjectState,
                ui: {
                  layout: activeLayout,
                  annotations: state.compositeEditor
                    ? []
                    : state.annotationsByProject[activeProjectDefinition.id] ?? [],
                  groupBoxes: state.compositeEditor
                    ? []
                    : state.groupBoxesByProject[activeProjectDefinition.id] ?? [],
                  guideRails: state.compositeEditor
                    ? []
                    : state.guideRailsByProject[activeProjectDefinition.id] ?? [],
                  showFurniture: state.compositeEditor
                    ? true
                    : state.showFurnitureByProject[activeProjectDefinition.id] ?? true,
                  showOverviewNavigator: state.compositeEditor
                    ? false
                    : state.showOverviewNavigatorByProject[activeProjectDefinition.id] ?? false,
                  showGrid: state.compositeEditor
                    ? false
                    : state.showGridByProject[activeProjectDefinition.id] ?? false,
                  snapToGrid: state.compositeEditor
                    ? false
                    : state.snapToGridByProject[activeProjectDefinition.id] ?? false,
                  snapToGuides: state.compositeEditor
                    ? false
                    : state.snapToGuidesByProject[activeProjectDefinition.id] ?? false,
                  layoutDirection: activeLayoutDirection,
                  routingMode: activeRoutingMode,
                  wireColorMode: activeWireColorMode,
                  connectionLayout: activeConnectionLayout,
                },
              });
              setImportError(null);
            }}
            onExportLabPack={isCompositeDrilldownActive ? () => undefined : handleExportShareableLabPack}
            onExportPython={async () => {
              if (isCompositeDrilldownActive) {
                return;
              }
              const { exportPythonWorkspaceBundle } = await import('./ui/workspace-artifact-actions');
              const error = await exportPythonWorkspaceBundle({
                project: activeProjectState,
                registry: effectiveRegistry,
                projectName: activeProjectDefinition.name,
                verificationCases,
              });
              setImportError(error);
            }}
            onImportDocument={async (file) => {
              if (isCompositeDrilldownActive) {
                return;
              }
              const rawValue = await file.text();
              const { parseWorkspaceArtifact } = await import('./ui/workspace-artifact-actions');
              const artifact = parseWorkspaceArtifact(rawValue);
              if (artifact?.kind === 'workbench') {
                dispatch({
                  type: 'loadDocument',
                  projectId: activeProjectDefinition.id,
                  document: artifact.document,
                });
                setImportError(null);
                return;
              }

              if (artifact?.kind === 'composite-library') {
                dispatch({
                  type: 'loadCompositeLibrary',
                  document: artifact.document,
                });
                setImportError(null);
                return;
              }

              setImportError('The selected file is not a valid MCW workbench or composite library document.');
            }}
            onImportLabPack={isCompositeDrilldownActive ? async () => undefined : handleImportShareableLabPack}
            onTidyLayout={() =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'tidyLayout',
                    projectId: activeProjectDefinition.id,
                  })
            }
            onTidySelection={() =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'tidySelectedModules',
                    projectId: activeProjectDefinition.id,
                  })
            }
            onSetLayoutDirection={(direction) =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setLayoutDirection',
                    projectId: activeProjectDefinition.id,
                    direction,
                  })
            }
            onSetRoutingMode={(mode) =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setRoutingMode',
                    projectId: activeProjectDefinition.id,
                    mode,
                  })
            }
            onSetWireColorMode={(mode) =>
              isCompositeDrilldownActive
                ? undefined
                : dispatch({
                    type: 'setWireColorMode',
                    projectId: activeProjectDefinition.id,
                    mode,
                  })
            }
            onSwitchProject={(projectId) =>
              state.compositeEditor || isCompositeDrilldownActive
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
            projects={state.compositeEditor || isCompositeDrilldownActive ? [activeProjectDefinition] : availableProjects}
            isCompositeEditor={Boolean(state.compositeEditor)}
          />
          {importError ? <p className="import-error-banner">{importError}</p> : null}
          {isCompositeDrilldownActive && activeCompositeDrilldownInstance && activeCompositeDrilldownDefinition ? (
            <div className="composite-editor-toolbar">
              <div>
                <span className="meta-label">Instance Drill-down</span>
                <strong>
                  {activeProjectDefinition.name} &gt; {activeCompositeDrilldownInstance.id} ({activeCompositeDrilldownDefinition.name})
                </strong>
                <p className="composite-editor-subtitle">Read-only view of one placed composite instance</p>
                {compositeDrilldownContext?.forwardedParamValues.length ? (
                  <p className="comparison-copy">
                    Forwarded params:{' '}
                    <strong>
                      {compositeDrilldownContext.forwardedParamValues
                        .map((binding) => `${binding.externalParam} -> ${binding.internalModuleId}.${binding.internalParamKey} = ${String(binding.value)}`)
                        .join(' | ')}
                    </strong>
                  </p>
                ) : null}
              </div>
              <div className="composite-editor-actions">
                <button
                  type="button"
                  className="secondary-dialog-button"
                  onClick={() => setCompositeDrilldown(null)}
                >
                  Back to Workspace
                </button>
                <button
                  type="button"
                  className="primary-dialog-button"
                  onClick={() => {
                    setCompositeDrilldown(null);
                    dispatch({
                      type: 'openCompositeEditor',
                      entryId: activeCompositeDrilldownDefinition.id,
                    });
                  }}
                >
                  Edit Shared Definition
                </button>
              </div>
            </div>
          ) : null}
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
        {showPaletteInMain && leftDockCollapsed && !isCompositeDrilldownActive ? (
          <div className="workbench-dock-toggle workbench-dock-toggle-left">
            <button
              type="button"
              className="collapse-toggle-button"
              aria-label="Expand tool palette"
              title="Expand tool palette"
              onClick={() => setLeftDockCollapsed(false)}
            >
              +
            </button>
          </div>
        ) : null}
        {showPaletteInMain && !leftDockCollapsed && !isCompositeDrilldownActive ? (
          <div
            className={paletteViewMode === 'compact' ? 'workbench-dock workbench-dock-left workbench-dock-compact' : 'workbench-dock workbench-dock-left'}
          >
            <button
              type="button"
              className="collapse-toggle-button workbench-dock-toggle-button workbench-dock-toggle-button-left"
              aria-label="Collapse tool palette"
              title="Collapse tool palette"
              onClick={() => setLeftDockCollapsed(true)}
            >
              −
            </button>
            <Suspense fallback={<LazyPanelFallback label="Tools" title="Loading palette…" />}>
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
            </Suspense>
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
        {showInspectorInMain && rightDockCollapsed ? (
          <div className="workbench-dock-toggle workbench-dock-toggle-right">
            <button
              type="button"
              className="collapse-toggle-button"
              aria-label="Expand inspector"
              title="Expand inspector"
              onClick={() => setRightDockCollapsed(false)}
            >
              +
            </button>
          </div>
        ) : null}
        {showInspectorInMain && !rightDockCollapsed ? (
          <div className="workbench-dock workbench-dock-right">
            <button
              type="button"
              className="collapse-toggle-button workbench-dock-toggle-button workbench-dock-toggle-button-right"
              aria-label="Collapse inspector"
              title="Collapse inspector"
              onClick={() => setRightDockCollapsed(true)}
            >
              −
            </button>
            <Suspense fallback={<LazyPanelFallback label="Analyze" title="Loading inspector…" />}>
              <ParameterInspector
                execution={compositeDrilldownContext?.execution ?? execution}
                registry={effectiveRegistry}
                executionError={isCompositeDrilldownActive ? compositeDrilldownExecutionError : executionError}
                validationIssues={isCompositeDrilldownActive ? compositeDrilldownValidationIssues : validationIssues}
                stepIndex={isCompositeDrilldownActive ? compositeDrilldown?.stepIndex ?? null : effectiveStepIndex}
                project={compositeDrilldownContext?.project ?? activeProjectState}
                tutorialStep={isCompositeDrilldownActive ? null : activeTutorialStep}
                projectName={isCompositeDrilldownActive ? compositeDrilldownTitle ?? activeProjectDefinition.name : activeProjectDefinition.name}
                comparisonBaseline={isCompositeDrilldownActive ? null : comparisonBaseline}
                executionComparison={isCompositeDrilldownActive ? null : executionComparison}
                baselineOutput={
                  isCompositeDrilldownActive
                    ? 'n/a'
                    : baselineExecution
                    ? executionComparison?.baselineOutput.formatted ?? 'n/a'
                    : 'blocked'
                }
                variantOutput={
                  isCompositeDrilldownActive
                    ? compositeDrilldownContext?.execution
                      ? 'n/a'
                      : 'blocked'
                    : execution
                    ? executionComparison?.variantOutput.formatted ?? 'n/a'
                    : 'blocked'
                }
                verificationSourceOptions={isCompositeDrilldownActive ? [] : verificationSourceOptions}
                verificationCases={isCompositeDrilldownActive ? [] : verificationCases}
                verificationResults={isCompositeDrilldownActive ? [] : verificationResults}
                baselineExecutionError={isCompositeDrilldownActive ? null : baselineExecutionError}
                moduleDef={compositeDrilldownSelectedModuleDef ?? selectedModuleDef}
                moduleInstance={compositeDrilldownSelectedModule ?? selectedModule}
                modulePosition={isCompositeDrilldownActive ? null : selectedModulePosition}
                layoutDirection={activeLayoutDirection}
                selectedModuleIds={compositeDrilldown?.selectedModuleIds ?? effectiveSelectedModuleIds}
                parameterClipboard={parameterClipboard}
                getParamDraft={(moduleId, key) =>
                  isCompositeDrilldownActive
                    ? undefined
                    : getDraftValue(state, activeProjectDefinition.id, moduleId, key)
                }
                baselineModuleInstance={isCompositeDrilldownActive ? null : baselineSelectedModule}
                onCopyParams={(moduleId) => {
                  if (isCompositeDrilldownActive) {
                    return;
                  }
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
                  isCompositeDrilldownActive
                    ? undefined
                    : dispatch({
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
                  isCompositeDrilldownActive
                    ? undefined
                    : dispatch({
                        type: 'setParamDraft',
                        projectId: activeProjectDefinition.id,
                        moduleId,
                        key,
                        rawValue,
                      })
                }
                onParamChange={(moduleId, key, value) =>
                  isCompositeDrilldownActive
                    ? undefined
                    : dispatch({
                        type: 'updateParam',
                        projectId: activeProjectDefinition.id,
                        moduleId,
                        key,
                        value,
                      })
                }
                onSetModuleBypass={(moduleId, bypass) =>
                  isCompositeDrilldownActive
                    ? undefined
                    : dispatch({
                        type: 'setModuleBypass',
                        projectId: activeProjectDefinition.id,
                        moduleId,
                        bypass,
                      })
                }
                onRotateModuleClockwise={
                  isCompositeDrilldownActive || state.compositeEditor
                    ? undefined
                    : (moduleId) =>
                        dispatch({
                          type: 'rotateModuleClockwise',
                          projectId: activeProjectDefinition.id,
                          moduleId,
                        })
                }
                onSetModulePortLayoutPreset={
                  isCompositeDrilldownActive || state.compositeEditor
                    ? undefined
                    : (moduleId, preset) =>
                        dispatch({
                          type: 'setModulePortLayoutPreset',
                          projectId: activeProjectDefinition.id,
                          moduleId,
                          preset,
                        })
                }
                onMoveModulePortOrder={
                  isCompositeDrilldownActive || state.compositeEditor
                    ? undefined
                    : (moduleId, direction, portName, delta) =>
                        dispatch({
                          type: 'moveModulePortOrder',
                          projectId: activeProjectDefinition.id,
                          moduleId,
                          direction,
                          portName,
                          delta,
                        })
                }
                onSetModulePortSide={
                  isCompositeDrilldownActive || state.compositeEditor
                    ? undefined
                    : (moduleId, direction, portName, side) =>
                        dispatch({
                          type: 'setModulePortSide',
                          projectId: activeProjectDefinition.id,
                          moduleId,
                          direction,
                          portName,
                          side,
                        })
                }
                onDuplicateModule={
                  isCompositeDrilldownActive || state.compositeEditor
                    ? undefined
                    : handleDuplicateSingleModule
                }
                onRenameModuleInstance={(moduleId, nextModuleId) =>
                  isCompositeDrilldownActive
                    ? undefined
                    : dispatch({
                        type: 'renameModuleInstance',
                        projectId: activeProjectDefinition.id,
                        moduleId,
                        nextModuleId,
                      })
                }
                onDeleteModule={(moduleId) =>
                  isCompositeDrilldownActive
                    ? undefined
                    : state.compositeEditor && activeCompositeEntry && isCompositeBoundaryModule(activeCompositeEntry, moduleId)
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
                canRenameModuleIds={!state.compositeEditor && !isCompositeDrilldownActive}
                onUnzipComposite={isCompositeDrilldownActive ? undefined : (moduleId) => handleUnzipComposite(moduleId)}
                onOpenCompositeInstanceDrilldown={
                  isCompositeDrilldownActive || state.compositeEditor
                    ? undefined
                    : handleOpenCompositeInstanceDrilldown
                }
                onOpenCompositeDefinition={(definitionId) =>
                  {
                    setCompositeDrilldown(null);
                    dispatch({
                      type: 'openCompositeEditor',
                      entryId: definitionId,
                    });
                  }
                }
                isReadOnlyMode={isCompositeDrilldownActive}
                onSelectIssueTarget={(moduleId) =>
                  isCompositeDrilldownActive
                    ? setCompositeDrilldown((current) =>
                        current
                          ? {
                              ...current,
                              selectedModuleId: moduleId,
                              selectedModuleIds: [moduleId],
                            }
                          : current,
                      )
                    : dispatch({
                        type: 'selectModule',
                        projectId: activeProjectDefinition.id,
                        moduleId,
                      })
                }
                onTraceHover={(moduleId) =>
                  isCompositeDrilldownActive
                    ? setCompositeDrilldown((current) =>
                        current
                          ? {
                              ...current,
                              hoveredTraceModuleId: moduleId,
                            }
                          : current,
                      )
                    : setHoveredTraceModuleId(moduleId)
                }
                onStepChange={(nextIndex) =>
                  isCompositeDrilldownActive
                    ? setCompositeDrilldown((current) =>
                        current
                          ? {
                              ...current,
                              stepIndex: nextIndex,
                            }
                          : current,
                      )
                    : syncTutorialStepFromTrace(nextIndex)
                }
                onActiveAnalysisTraceChange={(entry) =>
                  isCompositeDrilldownActive
                    ? setCompositeDrilldown((current) =>
                        current
                          ? {
                              ...current,
                              activeAnalysisTraceEntry: entry,
                            }
                          : current,
                      )
                    : setActiveAnalysisTraceEntry(entry)
                }
                onRequestFocusModule={(moduleId) =>
                  isCompositeDrilldownActive
                    ? setCompositeDrilldown((current) =>
                        current
                          ? {
                              ...current,
                              requestedFocusModuleId: moduleId,
                            }
                          : current,
                      )
                    : setRequestedWorkspaceFocusModuleId(moduleId)
                }
                onCaptureBaseline={handleCaptureBaseline}
                onClearBaseline={handleClearBaseline}
                onAddVerificationCase={handleAddVerificationCase}
                onImportVerificationCases={handleImportVerificationCases}
                onRemoveVerificationCase={handleRemoveVerificationCase}
                onClearVerificationCases={handleClearVerificationCases}
                probedModuleIds={isCompositeDrilldownActive ? [] : state.probedModuleIdsByProject[activeProjectDefinition.id] ?? []}
                isTickedMode={isTickedMode}
                currentTick={effectiveCurrentTick}
                tickCount={effectiveTickCount}
                tickedParamsByModule={isCompositeDrilldownActive ? null : tickedExecution?.paramsByModuleByTick ?? null}
                tickHistoryByModule={isCompositeDrilldownActive ? null : tickHistoryByModule}
                collectedOutput={isCompositeDrilldownActive ? null : collectedOutput}
                onToggleProbe={(moduleId) =>
                  isCompositeDrilldownActive
                    ? undefined
                    : dispatch({
                        type: 'toggleProbe',
                        projectId: activeProjectDefinition.id,
                        moduleId,
                      })
                }
                onClearProbes={() =>
                  isCompositeDrilldownActive
                    ? undefined
                    : dispatch({
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

      {!state.compositeEditor && !isCompositeDrilldownActive ? (
        <>
          {showLearningInMain ? (
            <Suspense fallback={<LazyPanelFallback label="Learn" title="Loading learning dock…" />}>
              <LearningDock
                hasTutorialPanel={hasTutorialPanel}
                hasChallengePanel={hasChallengePanel}
                hasCryptanalysisPanel={hasCryptanalysisPanel}
                activeLearningPanelTab={activeLearningPanelTab}
                onSetLearningPanelTab={(tab) =>
                  applyLearningPanelTabSelection({
                    tab,
                    activeProjectId: activeProjectDefinition.id,
                    workspaceMode,
                    dispatch,
                    setLearningPanelTab,
                  })
                }
                selectedChallenge={selectedChallenge}
                challenges={state.challengeLibrary}
                challengeEvaluation={challengeEvaluation}
                currentProject={activeProjectState}
                projectName={activeProjectDefinition.name}
                registry={effectiveRegistry}
                execution={execution}
                isTickedMode={isTickedMode}
                tickedExecution={tickedExecution}
                canCaptureChallenge={canCaptureChallenge}
                ciphertext={state.cryptanalysisInputByProject[activeProjectDefinition.id] ?? ''}
                cryptanalysisMode={state.cryptanalysisModeByProject[activeProjectDefinition.id] ?? 'classical'}
                modernBaseline={state.modernAnalysisBaselineByProject[activeProjectDefinition.id] ?? ''}
                modernFlipBit={state.modernAnalysisFlipBitByProject[activeProjectDefinition.id] ?? 0}
                onSelectChallenge={(challengeId) => {
                  handleSelectChallenge(challengeId);
                }}
                onLoadChallengeStart={handleLoadChallengeStart}
                onExportChallenge={() => {
                  if (selectedChallenge) {
                    downloadGuidedChallengeDocument(selectedChallenge);
                  }
                }}
                onImportChallenge={async (file) => {
                  const rawValue = await file.text();
                  handleImportChallengeRaw(rawValue);
                }}
                onCaptureChallenge={handleCaptureChallenge}
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
                onSelectTutorial={(tutorialId) => handleSelectTutorial(tutorialId)}
                onOpenTutorialPath={handleOpenTutorialPath}
                onOpenPipelineMicroDemo={handleOpenPipelineMicroDemo}
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
                onOpenManual={handleOpenUserManual}
              />
            </Suspense>
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
            setCompositePortNameOverrides({});
            setCompositePurpose('');
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
                            <span className="port-name-field">
                              <input
                                type="text"
                                className="port-name-input"
                                value={compositePortNameOverrides[port.key] ?? ''}
                                placeholder={port.name}
                                onChange={(event) => {
                                  const val = event.target.value;
                                  setCompositePortNameOverrides((prev) => ({ ...prev, [port.key]: val }));
                                }}
                              />
                              <span className="port-source-hint">{port.internalPort}</span>
                            </span>
                          </label>
                          <span className="port-type-badge">{port.type}</span>
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
                            <span className="port-name-field">
                              <input
                                type="text"
                                className="port-name-input"
                                value={compositePortNameOverrides[port.key] ?? ''}
                                placeholder={port.name}
                                onChange={(event) => {
                                  const val = event.target.value;
                                  setCompositePortNameOverrides((prev) => ({ ...prev, [port.key]: val }));
                                }}
                              />
                              <span className="port-source-hint">{port.internalPort}</span>
                            </span>
                          </label>
                          <span className="port-type-badge">{port.type}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {(compositeSelectionPreview.inputCandidates.some((p) => p.included) ||
                compositeSelectionPreview.outputCandidates.some((p) => p.included)) && (
                <div className="composite-shape-preview">
                  <span className="meta-label">Node Preview</span>
                  <div className="shape-preview-node">
                    <div className="shape-preview-ports shape-preview-inputs">
                      {compositeSelectionPreview.inputCandidates
                        .filter((p) => p.included)
                        .map((port) => (
                          <div key={port.key} className="shape-preview-port">
                            <div className="shape-preview-dot" />
                            <span className="shape-preview-label">{port.name}</span>
                          </div>
                        ))}
                    </div>
                    <div className="shape-preview-center">
                      <span className="shape-preview-name">{compositeName || 'New Composite'}</span>
                    </div>
                    <div className="shape-preview-ports shape-preview-outputs">
                      {compositeSelectionPreview.outputCandidates
                        .filter((p) => p.included)
                        .map((port) => (
                          <div key={port.key} className="shape-preview-port shape-preview-port-right">
                            <span className="shape-preview-label">{port.name}</span>
                            <div className="shape-preview-dot" />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
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

            <label className="param-field">
              <span>Description</span>
              <textarea
                className="composite-purpose-textarea"
                value={compositePurpose}
                onChange={(event) => setCompositePurpose(event.target.value)}
                placeholder="Describe what this composite does, what it's for, and how to use it. This appears in the ? info panel on the palette card."
                rows={3}
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
                  setCompositePortNameOverrides({});
                  setCompositePurpose('');
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
                    portNameOverrides: effectivePortNameOverrides,
                    purpose: compositePurpose,
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
                          stageLabels: state.stageLabelsByProject[activeProjectDefinition.id] ?? [],
                          groupBoxes: state.groupBoxesByProject[activeProjectDefinition.id] ?? [],
                          guideRails: state.guideRailsByProject[activeProjectDefinition.id] ?? [],
                          showFurniture:
                            state.showFurnitureByProject[activeProjectDefinition.id] ?? true,
                          showOverviewNavigator:
                            state.showOverviewNavigatorByProject[activeProjectDefinition.id] ?? false,
                          showGrid:
                            state.showGridByProject[activeProjectDefinition.id] ?? false,
                          snapToGrid:
                            state.snapToGridByProject[activeProjectDefinition.id] ?? false,
                          snapToGuides:
                            state.snapToGuidesByProject[activeProjectDefinition.id] ?? false,
                          layoutDirection: activeLayoutDirection,
                          routingMode: activeRoutingMode,
                          wireColorMode: activeWireColorMode,
                          connectionLayout: activeConnectionLayout,
                        },
                      },
                    });
                  }

                  setIsCompositeDialogOpen(false);
                  setCompositeDialogError(null);
                  setExcludedCompositeBoundaryPortKeys([]);
                  setCompositePortNameOverrides({});
                  setCompositePurpose('');
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
                        stageLabels: [],
                        groupBoxes: [],
                        guideRails: [],
                        showFurniture:
                          state.showFurnitureByProject[selectedChallengeProjectId] ?? true,
                        showOverviewNavigator:
                          state.showOverviewNavigatorByProject[selectedChallengeProjectId] ?? false,
                        showGrid:
                          state.showGridByProject[selectedChallengeProjectId] ?? false,
                        snapToGrid:
                          state.snapToGridByProject[selectedChallengeProjectId] ?? false,
                        snapToGuides:
                          state.snapToGuidesByProject[selectedChallengeProjectId] ?? false,
                        layoutDirection:
                          state.layoutDirectionByProject[selectedChallengeProjectId] ??
                          'horizontal',
                        routingMode:
                          state.routingModeByProject[selectedChallengeProjectId] ?? 'curved',
                        wireColorMode:
                          state.wireColorModeByProject[selectedChallengeProjectId] ?? 'domain',
                        connectionLayout:
                          state.connectionLayoutByProject[selectedChallengeProjectId] ?? {},
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
