import { useEffect, useReducer, useState } from 'react';

import './App.css';
import { isCompositeDefinition, type CompositeLibraryEntry } from './engine/composites';
import { V1_REGISTRY } from './engine/modules';
import type { ExecutionResult, ExecutionTraceEntry, TickedExecutionResult } from './engine/types';
import { deriveTickCount, executeTickedProject } from './engine/executor';
import { validateCompositeDef, validateProject } from './engine/validation';
import {
  createCompositeFromSelection,
  replaceSelectionWithComposite,
} from './ui/composite-authoring';
import { evaluateChallengeAttempt } from './ui/challenges';
import { ChallengePanel } from './ui/components/challenge-panel';
import { ParameterInspector } from './ui/components/parameter-inspector';
import { PrimitivePalette } from './ui/components/primitive-palette';
import { TutorialPanel } from './ui/components/tutorial-panel';
import { WorkbenchPanel } from './ui/components/workbench-panel';
import { demoProjects, runDemoProject } from './ui/demo-projects';
import { compareExecutionResults } from './ui/execution-compare';
import { clampTutorialStepIndex, getTutorialStep } from './ui/tutorials';
import {
  downloadDocument,
  downloadCompositeLibraryDocument,
  downloadGuidedChallengeDocument,
  loadWorkspaceFromStorage,
  parseGuidedChallengeDocument,
  parseCompositeLibraryDocument,
  parseWorkbenchDocument,
  saveWorkspaceToStorage,
} from './ui/persistence';
import {
  cloneProject,
  createInitialUiState,
  getEffectiveRegistry,
  getDraftValue,
  getSelectedModuleId,
  getSelectedModuleIds,
  uiReducer,
} from './ui/store';

function App() {
  const [headerResourceAction, setHeaderResourceAction] = useState('');
  const [headerWorkspaceAction, setHeaderWorkspaceAction] = useState('');
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
  const [state, dispatch] = useReducer(
    uiReducer,
    demoProjects,
    (projects) => {
      const initialState = createInitialUiState(projects);
      if (typeof window === 'undefined') {
        return initialState;
      }

      const persistedWorkspace = loadWorkspaceFromStorage(projects);
      if (!persistedWorkspace) {
        return initialState;
      }

      const restoredProjectStates = Object.fromEntries(
        projects.map((project) => [
          project.id,
          persistedWorkspace.documentsByProjectId[project.id]?.project ?? initialState.projectStates[project.id],
        ]),
      );

      return {
        ...initialState,
        activeProjectId: persistedWorkspace.activeProjectId,
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
        showPalette: persistedWorkspace.showPalette,
        showInspector: persistedWorkspace.showInspector,
        projectStates: Object.fromEntries(
          projects.map((project) => [
            project.id,
            restoredProjectStates[project.id],
          ]),
        ),
        layoutByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.documentsByProjectId[project.id]?.ui.layout ?? initialState.layoutByProject[project.id],
          ]),
        ),
        annotationsByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.documentsByProjectId[project.id]?.ui.annotations ?? initialState.annotationsByProject[project.id],
          ]),
        ),
        comparisonBaselinesByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.comparisonBaselinesByProjectId[project.id] ?? null,
          ]),
        ),
        activeChallengeIdByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.activeChallengeIdByProjectId[project.id] ??
              initialState.activeChallengeIdByProject[project.id] ??
              null,
          ]),
        ),
        activeTutorialIdByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.activeTutorialIdByProjectId[project.id] ??
              initialState.activeTutorialIdByProject[project.id] ??
              null,
          ]),
        ),
        activeTutorialStepByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.activeTutorialStepByProjectId[project.id] ??
              initialState.activeTutorialStepByProject[project.id] ??
              0,
          ]),
        ),
        completedTutorialsByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.completedTutorialsByProjectId[project.id] ??
              initialState.completedTutorialsByProject[project.id] ??
              [],
          ]),
        ),
        workspaceModeByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.workspaceModeByProjectId?.[project.id] ??
              initialState.workspaceModeByProject[project.id] ??
              'guide',
          ]),
        ),
        tickedModeByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.tickedModeByProjectId?.[project.id] ??
              initialState.tickedModeByProject[project.id] ??
              false,
          ]),
        ),
        currentTickByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.currentTickByProjectId?.[project.id] ??
              initialState.currentTickByProject[project.id] ??
              0,
          ]),
        ),
        isTickPlaybackActiveByProject: Object.fromEntries(
          projects.map((project) => [project.id, false]),
        ),
        tickPlaybackSpeedMsByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.tickPlaybackSpeedMsByProjectId?.[project.id] ??
              initialState.tickPlaybackSpeedMsByProject[project.id] ??
              500,
          ]),
        ),
        selectedModuleIdByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            restoredProjectStates[project.id]?.modules[0]?.id ?? null,
          ]),
        ),
        selectedModuleIdsByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            restoredProjectStates[project.id]?.modules[0]?.id
              ? [restoredProjectStates[project.id].modules[0].id]
              : [],
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

  const activeProjectDefinition =
    demoProjects.find((project) => project.id === state.activeProjectId) ?? demoProjects[0];
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

  const isTickedMode = !state.compositeEditor && (state.tickedModeByProject[activeProjectDefinition.id] ?? false);
  const currentTick = state.currentTickByProject[activeProjectDefinition.id] ?? 0;
  const isTickPlaybackActive =
    state.isTickPlaybackActiveByProject[activeProjectDefinition.id] ?? false;
  const tickPlaybackSpeedMs =
    state.tickPlaybackSpeedMsByProject[activeProjectDefinition.id] ?? 500;

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
            (m) => m.defId === 'Output' || m.defId === 'BitOutput',
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
  const selectedChallenge =
    state.challengeLibrary.find(
      (challenge) =>
        challenge.id ===
        (state.activeChallengeIdByProject[activeProjectDefinition.id] ??
          state.challengeLibrary[0]?.id ??
          null),
    ) ??
    state.challengeLibrary[0] ??
    null;
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
  const canCaptureChallenge =
    !state.compositeEditor &&
    comparisonBaseline !== null &&
    baselineValidation?.ok === true &&
    baselineExecutionError === null;
  const activeTutorialStep =
    workspaceMode === 'guide' && !state.compositeEditor && selectedTutorial?.projectId === activeProjectDefinition.id
      ? selectedTutorialStep
      : null;
  const completedTutorialIds =
    state.completedTutorialsByProject[activeProjectDefinition.id] ?? [];
  const isTutorialCompleted = selectedTutorial
    ? completedTutorialIds.includes(selectedTutorial.id)
    : false;
  const syncTutorialStepFromTrace = (nextIndex: number | null) => {
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
  };

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
                }
              }}
            >
              <option value="">Open…</option>
              <option value="notes">Notes</option>
              <option value="repo">Repository</option>
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
                }
              }}
            >
              <option value="">Actions…</option>
              <option value="toggle-theme">
                {theme === 'dark' ? 'Switch To Light' : 'Switch To Dark'}
              </option>
              <option value="toggle-palette">
                {state.showPalette ? 'Hide Tools' : 'Show Tools'}
              </option>
              {state.showPalette ? (
                <option value="toggle-palette-view">
                  {paletteViewMode === 'expanded' ? 'Compact Tools' : 'Expand Tools'}
                </option>
              ) : null}
              <option value="toggle-inspector">
                {state.showInspector ? 'Hide Inspector' : 'Show Inspector'}
              </option>
            </select>
          </label>
        </nav>
      </header>

      <section className="workbench-shell">
        <div
          className={
            'workbench-stage' +
            (state.showPalette ? ' workbench-stage-has-left' : '') +
            (state.showInspector ? ' workbench-stage-has-right' : '') +
            (state.showPalette && paletteViewMode === 'compact' ? ' workbench-stage-tools-compact' : '')
          }
        >
          <WorkbenchPanel
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
            onRequestCreateComposite={() => {
              setCompositeName('');
              setCompositeId('');
              setCompositeDialogError(null);
              setReplaceSelectionAfterCreate(!state.compositeEditor);
              setIsCompositeDialogOpen(true);
            }}
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
            onSwitchProject={(projectId) =>
              state.compositeEditor
                ? undefined
                : dispatch({
                    type: 'switchProject',
                    projectId,
                  })
            }
            projects={state.compositeEditor ? [activeProjectDefinition] : demoProjects}
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
        {state.showPalette ? (
          <div className={paletteViewMode === 'compact' ? 'workbench-dock workbench-dock-left workbench-dock-compact' : 'workbench-dock workbench-dock-left'}>
            <PrimitivePalette
              registry={effectiveRegistry}
              viewMode={paletteViewMode}
              onToggleViewMode={() =>
                setPaletteViewMode((currentMode) =>
                  currentMode === 'expanded' ? 'compact' : 'expanded',
                )
              }
              compositeUsageCountById={compositeUsageCountById}
              builtInReusableIds={state.compositeLibrary
                .filter((entry) => entry.source === 'built-in')
                .map((entry) => entry.id)}
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
              onRemoveComposite={(defId) =>
                dispatch({
                  type: 'removeCompositeFromLibrary',
                  compositeId: defId,
                })
              }
            />
          </div>
        ) : null}
        {state.showInspector ? (
          <div className="workbench-dock workbench-dock-right">
            <ParameterInspector
              execution={execution}
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
              getParamDraft={(moduleId, key) =>
                getDraftValue(state, activeProjectDefinition.id, moduleId, key)
              }
              baselineModuleInstance={baselineSelectedModule}
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
          </div>
        ) : null}
      </section>

      {!state.compositeEditor ? (
        <>
          {selectedChallenge ? (
            <ChallengePanel
              challenges={state.challengeLibrary}
              selectedChallengeId={selectedChallenge.id}
              evaluation={challengeEvaluation}
              canCaptureChallenge={canCaptureChallenge}
              onSelectChallenge={(challengeId) =>
                dispatch({
                  type: 'selectChallenge',
                  projectId: activeProjectDefinition.id,
                  challengeId,
                })
              }
              onLoadChallengeStart={() => setIsChallengeResetConfirmOpen(true)}
              onExportChallenge={() => downloadGuidedChallengeDocument(selectedChallenge)}
              onCaptureChallenge={() => {
                const defaultTitle = `${activeProjectDefinition.name} Guided Lab`;
                setChallengeCaptureTitle(defaultTitle);
                setChallengeCaptureId(createChallengeIdCandidate(defaultTitle));
                if (activeProjectDefinition.id === 'sequential') {
                  setChallengeCaptureDifficulty('intermediate');
                  setChallengeCapturePrompt(
                    `Repair or complete the ${activeProjectDefinition.name} machine until its running output stream matches the captured reference behavior.`,
                  );
                  setChallengeCaptureHints(
                    'The clock period controls when the machine advances.\nUse the tick bar and probes to find the first wrong moment.',
                  );
                } else {
                  setChallengeCaptureDifficulty('beginner');
                  setChallengeCapturePrompt(
                    `Repair or complete the ${activeProjectDefinition.name} machine until its output matches the captured reference behavior.`,
                  );
                  setChallengeCaptureHints('');
                }
                setChallengeCaptureShouldExport(true);
                setChallengeCaptureError(null);
                setIsChallengeCaptureOpen(true);
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
                dispatch({
                  type: 'selectChallenge',
                  projectId: activeProjectDefinition.id,
                  challengeId: challengeDocument.id,
                });
                setImportError(null);
              }}
            />
          ) : null}

          {selectedTutorial ? (
            <TutorialPanel
              tutorials={state.tutorialLibrary}
              selectedTutorialId={selectedTutorial.id}
              currentProjectId={activeProjectDefinition.id}
              stepIndex={tutorialStepIndex}
              activeStep={selectedTutorialStep}
              completedTutorialIds={completedTutorialIds}
              isCompleted={isTutorialCompleted}
              workspaceMode={workspaceMode}
              onSetWorkspaceMode={(mode) =>
                dispatch({
                  type: 'setWorkspaceMode',
                  projectId: activeProjectDefinition.id,
                  mode,
                })
              }
              onSelectTutorial={(tutorialId) =>
                {
                  const nextTutorial =
                    state.tutorialLibrary.find((tutorial) => tutorial.id === tutorialId) ?? null;
                  setStepIndex(nextTutorial?.steps[0]?.targetStepIndex ?? null);
                  dispatch({
                    type: 'selectTutorial',
                    projectId: activeProjectDefinition.id,
                    tutorialId,
                  });
                }
              }
              onSetStep={(stepValue) => {
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
              onResetProgress={() =>
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
              and replace the active graph for <strong>{activeProjectDefinition.name}</strong>.
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
                  dispatch({
                    type: 'loadDocument',
                    projectId: activeProjectDefinition.id,
                    document: {
                      version: 1,
                      project: cloneProject(selectedChallenge.startingProject),
                      ui: {
                        layout: selectedChallenge.startingLayout ?? activeProjectDefinition.layout,
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

function createChallengeIdCandidate(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
