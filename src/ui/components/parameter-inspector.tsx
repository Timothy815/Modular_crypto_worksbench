import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { isCompositeDefinition } from '../../engine/composites';
import type {
  Connection,
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleDefinition,
  ModuleRegistry,
  ModuleInstance,
  Project,
  ValidationIssue,
} from '../../engine/types';
import { BitsEditor } from './editors/bits-editor';
import { WiringEditor } from './editors/wiring-editor';
import { formatParamValue, formatSignal, parseParamValue } from '../formatters';
import type { TutorialStep } from '../tutorials';
import { ComparisonPanel } from './comparison-panel';
import type { ComparisonBaselineDocument } from '../workbench-document';
import type { ExecutionComparison } from '../execution-compare';
import { resolveTraceModuleInstance } from '../transformation-resolver';
import {
  buildIdentityPermutationOrder,
  buildReversePermutationOrder,
  serializePermutationOrder,
  swapPermutationOrderPositions,
} from '../../engine/modules/permutation';
import {
  buildIdentityPlugboardWiring,
  pairPlugboardLetters,
  parsePlugboardWiring,
  serializePlugboardWiring,
  unpairPlugboardLetter,
} from '../../engine/modules/plugboard';
import {
  pairReflectorLetters,
  parseReflectorWiring,
  serializeReflectorWiring,
} from '../../engine/modules/reflector';
import {
  serializeRotorWiring,
  swapRotorWiringTargets,
} from '../../engine/modules/rotor';
import {
  buildIdentitySBoxTable,
  buildReverseSBoxTable,
  parseSBoxTable,
  serializeSBoxTable,
  swapSBoxEntry,
} from '../../engine/modules/s-box';

interface ParameterInspectorProps {
  execution: ExecutionResult | null;
  registry: ModuleRegistry;
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
  baselineModuleInstance: ModuleInstance | null;
  moduleDef: ModuleDefinition | null;
  moduleInstance: ModuleInstance | null;
  getParamDraft: (moduleId: string, key: string) => string | undefined;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
  onDeleteModule: (moduleId: string) => void;
  onUnzipComposite?: (moduleId: string) => void;
  onSelectIssueTarget: (moduleId: string) => void;
  onTraceHover: (moduleId: string | null) => void;
  onStepChange: (nextIndex: number | null) => void;
  onActiveAnalysisTraceChange?: (entry: ExecutionTraceEntry | null) => void;
  onCaptureBaseline: () => void;
  onClearBaseline: () => void;
  probedModuleIds: string[];
  isTickedMode?: boolean;
  currentTick?: number;
  tickCount?: number;
  tickedParamsByModule?: Record<string, Record<string, unknown>[]> | null;
  tickHistoryByModule?: Record<string, string[]> | null;
  onToggleProbe: (moduleId: string) => void;
  onClearProbes: () => void;
}

export function ParameterInspector({
  execution,
  registry,
  executionError,
  validationIssues,
  stepIndex,
  project,
  tutorialStep,
  projectName,
  comparisonBaseline,
  executionComparison,
  baselineOutput,
  variantOutput,
  baselineExecutionError,
  baselineModuleInstance,
  moduleDef,
  moduleInstance,
  getParamDraft,
  onParamDraftChange,
  onParamChange,
  onDeleteModule,
  onUnzipComposite,
  onSelectIssueTarget,
  onTraceHover,
  onStepChange,
  onActiveAnalysisTraceChange,
  onCaptureBaseline,
  onClearBaseline,
  probedModuleIds,
  isTickedMode = false,
  currentTick = 0,
  tickCount = 0,
  tickedParamsByModule = null,
  tickHistoryByModule = null,
  onToggleProbe,
  onClearProbes,
}: ParameterInspectorProps) {
  const [traceMode, setTraceMode] = useState<'focused' | 'upstream' | 'downstream' | 'full'>('focused');
  const [inspectorTab, setInspectorTab] = useState<'configure' | 'analyze' | 'compare'>('configure');
  const [focusedRoundPath, setFocusedRoundPath] = useState<string>('all');
  const [requestedStepperMode, setRequestedStepperMode] = useState<'top-level' | 'nested'>('top-level');
  const [requestedNestedStepIndex, setRequestedNestedStepIndex] = useState<number | null>(null);
  const [requestedLookupChunkIndex, setRequestedLookupChunkIndex] = useState(0);
  const [draggedPermutationInputIndex, setDraggedPermutationInputIndex] = useState<number | null>(null);
  const [draggedRotorInputIndex, setDraggedRotorInputIndex] = useState<number | null>(null);
  const [selectedPlugboardLetter, setSelectedPlugboardLetter] = useState<string | null>(null);
  const [selectedReflectorLetter, setSelectedReflectorLetter] = useState<string | null>(null);
  const [requestedSBoxEditIndex, setRequestedSBoxEditIndex] = useState(0);
  const permutationInputLaneRef = useRef<HTMLDivElement | null>(null);
  const permutationOutputLaneRef = useRef<HTMLDivElement | null>(null);
  const permutationInputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const permutationOutputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rotorInputLaneRef = useRef<HTMLDivElement | null>(null);
  const rotorOutputLaneRef = useRef<HTMLDivElement | null>(null);
  const rotorInputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rotorOutputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [permutationWireLayout, setPermutationWireLayout] = useState<{
    height: number;
    inputYs: number[];
    outputYs: number[];
  } | null>(null);
  const [rotorWireLayout, setRotorWireLayout] = useState<{
    height: number;
    inputYs: number[];
    outputYs: number[];
  } | null>(null);
  const analysisTrace = useMemo(
    () => execution?.analysisTrace ?? execution?.trace ?? [],
    [execution],
  );
  const tutorialTraceRef = useRef<HTMLLIElement | null>(null);
  const outputTrace = execution?.trace.at(-1);
  const selectedTrace = execution?.trace.find(
    (entry) => entry.moduleId === moduleInstance?.id,
  );
  const selectedTraceOrder = selectedTrace
    ? (execution?.order.findIndex((moduleId) => moduleId === selectedTrace.moduleId) ?? -1) + 1
    : null;
  const selectedIssues = moduleInstance
    ? validationIssues.filter((issue) => getIssueTargetModuleId(issue) === moduleInstance.id)
    : [];
  const globalIssues = moduleInstance
    ? validationIssues.filter((issue) => !selectedIssues.includes(issue))
    : validationIssues;
  const groupedSelectedIssues = groupIssuesByTarget(selectedIssues);
  const groupedGlobalIssues = groupIssuesByTarget(globalIssues);
  const effectiveTraceMode = selectedTrace ? traceMode : 'full';
  const roundFocusOptions = useMemo(
    () =>
      moduleDef && 'kind' in moduleDef && moduleDef.kind === 'iterator' && moduleInstance
        ? getIteratorRoundOptions(analysisTrace, moduleInstance.id)
        : [],
    [analysisTrace, moduleDef, moduleInstance],
  );
  const effectiveFocusedRoundPath =
    focusedRoundPath !== 'all' && roundFocusOptions.some((option) => option.path === focusedRoundPath)
      ? focusedRoundPath
      : 'all';
  const traceEntries = getTraceEntries({
    execution,
    project,
    selectedModuleId: moduleInstance?.id ?? null,
    traceMode: effectiveTraceMode,
    focusedRoundPath: effectiveFocusedRoundPath,
  });
  const canUseNestedStepper =
    Boolean(moduleDef && 'kind' in moduleDef && moduleDef.kind === 'iterator' && moduleInstance) &&
    traceEntries.some((entry) => entry.moduleId.startsWith(`${moduleInstance?.id}/`));
  const effectiveStepperMode = canUseNestedStepper ? requestedStepperMode : 'top-level';
  const steppedTrace = stepIndex !== null ? execution?.trace[stepIndex] ?? null : null;
  const steppedAnalysisEntry =
    effectiveStepperMode === 'nested' && requestedNestedStepIndex !== null
      ? traceEntries[
          requestedNestedStepIndex >= 0 && requestedNestedStepIndex < traceEntries.length
            ? requestedNestedStepIndex
            : Math.max(0, traceEntries.length - 1)
        ] ?? null
      : null;
  const effectiveNestedStepIndex =
    effectiveStepperMode === 'nested' && requestedNestedStepIndex !== null
      ? requestedNestedStepIndex >= 0 && requestedNestedStepIndex < traceEntries.length
        ? requestedNestedStepIndex
        : traceEntries.length > 0
          ? traceEntries.length - 1
          : null
      : null;
  const tutorialTraceEntry = tutorialStep?.focusModuleId
    ? execution?.trace.find((entry) => entry.moduleId === tutorialStep.focusModuleId) ?? null
    : null;
  const tutorialTraceIndex = tutorialTraceEntry
    ? (execution?.trace.findIndex((entry) => entry.moduleId === tutorialTraceEntry.moduleId) ?? -1) + 1
    : null;
  const activeTransformationEntry =
    inspectorTab === 'analyze'
      ? effectiveStepperMode === 'nested'
        ? steppedAnalysisEntry
        : selectedTrace
      : null;
  const transformationView = activeTransformationEntry
    ? getTransformationView(activeTransformationEntry, project, registry)
    : null;
  const effectiveLookupChunkIndex =
    transformationView?.kind === 'lookup'
      ? transformationView.chunks[
          requestedLookupChunkIndex >= 0 &&
          requestedLookupChunkIndex < transformationView.chunks.length
            ? requestedLookupChunkIndex
            : 0
        ]?.index ?? 0
      : 0;
  const activeLookupChunk =
    transformationView?.kind === 'lookup'
      ? transformationView.chunks.find((chunk) => chunk.index === effectiveLookupChunkIndex) ?? null
      : null;
  const editableSelectedPermutationOrder = useMemo(() => {
    if (moduleDef?.id !== 'Permutation' || !moduleInstance) {
      return null;
    }

    const field = moduleDef.paramSchema.order;
    return getEditablePermutationOrder(
      moduleInstance.params.order ?? field?.defaultValue ?? '',
    );
  }, [moduleDef, moduleInstance]);
  const editableSelectedRotorWiring = useMemo(() => {
    if (moduleDef?.id !== 'Rotor' || !moduleInstance) {
      return null;
    }

    const field = moduleDef.paramSchema.wiring;
    return getEditableRotorWiring(
      moduleInstance.params.wiring ?? field?.defaultValue ?? '',
    );
  }, [moduleDef, moduleInstance]);
  const editableSelectedPermutationOrderKey = editableSelectedPermutationOrder?.join(',') ?? '';
  const editableSelectedRotorWiringKey = editableSelectedRotorWiring?.join(',') ?? '';

  useLayoutEffect(() => {
    if (!editableSelectedPermutationOrder) {
      return;
    }

    const measure = () => {
      const layout = measureWireLayout(
        permutationInputLaneRef.current,
        permutationOutputLaneRef.current,
        permutationInputRefs.current,
        permutationOutputRefs.current,
      );
      setPermutationWireLayout(layout);
    };

    const frameId = window.requestAnimationFrame(measure);

    const observer =
      typeof ResizeObserver !== 'undefined' &&
      permutationInputLaneRef.current &&
      permutationOutputLaneRef.current
        ? new ResizeObserver(() => measure())
        : null;

    if (observer && permutationInputLaneRef.current && permutationOutputLaneRef.current) {
      observer.observe(permutationInputLaneRef.current);
      observer.observe(permutationOutputLaneRef.current);
    }

    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editableSelectedPermutationOrder, editableSelectedPermutationOrderKey]);

  useLayoutEffect(() => {
    if (!editableSelectedRotorWiring) {
      return;
    }

    const measure = () => {
      const layout = measureWireLayout(
        rotorInputLaneRef.current,
        rotorOutputLaneRef.current,
        rotorInputRefs.current,
        rotorOutputRefs.current,
      );
      setRotorWireLayout(layout);
    };

    const frameId = window.requestAnimationFrame(measure);

    const observer =
      typeof ResizeObserver !== 'undefined' &&
      rotorInputLaneRef.current &&
      rotorOutputLaneRef.current
        ? new ResizeObserver(() => measure())
        : null;

    if (observer && rotorInputLaneRef.current && rotorOutputLaneRef.current) {
      observer.observe(rotorInputLaneRef.current);
      observer.observe(rotorOutputLaneRef.current);
    }

    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editableSelectedRotorWiring, editableSelectedRotorWiringKey]);

  useEffect(() => {
    if (inspectorTab !== 'analyze' || !tutorialTraceRef.current) {
      return;
    }

    tutorialTraceRef.current.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [inspectorTab, tutorialStep?.id, tutorialTraceEntry?.moduleId]);

  useEffect(() => {
    if (!onActiveAnalysisTraceChange) {
      return;
    }

    if (inspectorTab !== 'analyze' || !execution) {
      onActiveAnalysisTraceChange(null);
      return;
    }

    onActiveAnalysisTraceChange(
      effectiveStepperMode === 'nested' ? steppedAnalysisEntry : steppedTrace,
    );
  }, [
    execution,
    inspectorTab,
    onActiveAnalysisTraceChange,
    effectiveStepperMode,
    steppedAnalysisEntry,
    steppedTrace,
  ]);

  return (
    <aside className="panel inspector-panel">
      <div className="panel-head">
        <p className="panel-label">Inspector</p>
        <h2>Selection + Trace</h2>
      </div>

      <label className="inspector-section-select">
        <span className="meta-label">Section</span>
        <select
          value={inspectorTab}
          onChange={(event) =>
            setInspectorTab(event.target.value as 'configure' | 'analyze' | 'compare')
          }
        >
          <option value="configure">Configure</option>
          <option value="analyze">Analyze</option>
          <option value="compare">Compare</option>
        </select>
      </label>

      <div className="trace-summary">
        <span className="meta-label">Final Input To Output</span>
        <strong>{formatSignal(outputTrace?.inputs.in)}</strong>
        <p className="trace-summary-subtitle">
          {validationIssues.length > 0
            ? `${validationIssues.length} validation issue${validationIssues.length === 1 ? '' : 's'} blocking execution`
            : execution
              ? `${execution.trace.length} module${execution.trace.length === 1 ? '' : 's'} executed`
              : 'Execution is waiting for a valid graph'}
        </p>
      </div>

      {inspectorTab === 'analyze' && isTickedMode && tickCount > 0 && moduleInstance ? (
        <section className="analysis-section tick-state-section">
          <span className="meta-label">Tick State</span>
          <p className="tick-state-summary">
            Viewing tick <strong>{currentTick + 1}</strong> of <strong>{tickCount}</strong>
          </p>
          {tickedParamsByModule?.[moduleInstance.id] ? (() => {
            const tickParams = tickedParamsByModule[moduleInstance.id]?.[currentTick];
            if (!tickParams) return null;
            const entries = Object.entries(tickParams);
            if (entries.length === 0) return null;
            return (
              <ul className="tick-param-list">
                {entries.map(([key, value]) => (
                  <li key={key} className="tick-param-entry">
                    <span className="tick-param-key">{key}</span>
                    <span className="tick-param-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </li>
                ))}
              </ul>
            );
          })() : null}
          {tickHistoryByModule?.[moduleInstance.id]?.length ? (() => {
            const history = tickHistoryByModule[moduleInstance.id];
            const start = Math.max(0, currentTick - 4);
            const visibleHistory = history.slice(start, currentTick + 1);
            if (visibleHistory.length <= 1) {
              return null;
            }

            return (
              <>
                <p className="tick-history-summary">Recent output history</p>
                <div className="tick-history-row">
                  {visibleHistory.map((value, index) => (
                    <span
                      key={`${moduleInstance.id}-inspector-history-${start + index}`}
                      className={
                        start + index === currentTick
                          ? 'tick-history-chip active'
                          : 'tick-history-chip'
                      }
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </>
            );
          })() : null}
        </section>
      ) : null}

     {inspectorTab === 'analyze' && execution && execution.trace.length > 0 ? (
        <section className="analysis-section">
          <div className="stepper-head">
            <span className="meta-label">Step-Through</span>
            <div className="stepper-controls">
              {canUseNestedStepper ? (
                <div className="trace-mode-toggle">
                  <button
                    type="button"
                    className={
                      effectiveStepperMode === 'top-level'
                        ? 'trace-mode-button active'
                        : 'trace-mode-button'
                    }
                    onClick={() => setRequestedStepperMode('top-level')}
                  >
                    Top-Level
                  </button>
                  <button
                    type="button"
                    className={
                      effectiveStepperMode === 'nested'
                        ? 'trace-mode-button active'
                        : 'trace-mode-button'
                    }
                    onClick={() => setRequestedStepperMode('nested')}
                  >
                    Nested
                  </button>
                </div>
              ) : null}
              <div className="stepper-actions">
              <button
                type="button"
                className="trace-mode-button"
                disabled={
                  effectiveStepperMode === 'nested'
                    ? effectiveNestedStepIndex === null || effectiveNestedStepIndex <= 0
                    : stepIndex === null || stepIndex <= 0
                }
                onClick={() => {
                  if (effectiveStepperMode === 'nested') {
                    setRequestedNestedStepIndex(
                      effectiveNestedStepIndex === null
                        ? 0
                        : Math.max(0, effectiveNestedStepIndex - 1),
                    );
                    return;
                  }

                  onStepChange(stepIndex === null ? 0 : Math.max(0, stepIndex - 1));
                }}
              >
                Prev
              </button>
              <button
                type="button"
                className="trace-mode-button"
                onClick={() => {
                  if (effectiveStepperMode === 'nested') {
                    setRequestedNestedStepIndex(
                      effectiveNestedStepIndex === null
                        ? 0
                        : Math.min(traceEntries.length - 1, effectiveNestedStepIndex + 1),
                    );
                    return;
                  }

                  onStepChange(
                    stepIndex === null
                      ? 0
                      : Math.min(execution.trace.length - 1, stepIndex + 1),
                  );
                }}
              >
                {effectiveStepperMode === 'nested'
                  ? effectiveNestedStepIndex === null
                    ? 'Start'
                    : 'Next'
                  : stepIndex === null
                    ? 'Start'
                    : 'Next'}
              </button>
              <button
                type="button"
                className="trace-mode-button"
                disabled={
                  effectiveStepperMode === 'nested'
                    ? effectiveNestedStepIndex === null
                    : stepIndex === null
                }
                onClick={() => {
                  if (effectiveStepperMode === 'nested') {
                    setRequestedNestedStepIndex(null);
                    return;
                  }

                  onStepChange(null);
                }}
              >
                Reset
              </button>
              </div>
            </div>
          </div>

          <div className="selected-trace">
            <span className="meta-label">Current Step</span>
            {effectiveStepperMode === 'nested' ? (
              steppedAnalysisEntry ? (
                <>
                  <p className="selected-trace-order">
                    Nested step {effectiveNestedStepIndex! + 1} of {traceEntries.length}
                  </p>
                  <p>
                    module: <strong>{getDisplayTraceModuleId(steppedAnalysisEntry)}</strong> (
                    {steppedAnalysisEntry.defId})
                  </p>
                  {getIteratorRoundPath(steppedAnalysisEntry) ? (
                    <p>
                      round:{' '}
                      <strong>
                        {formatIteratorRoundLabel(getIteratorRoundPath(steppedAnalysisEntry) ?? '')}
                      </strong>
                    </p>
                  ) : null}
                  <p>
                    inputs:{' '}
                    {Object.entries(steppedAnalysisEntry.inputs)
                      .map(([, signal]) => formatSignal(signal))
                      .join(' | ') || 'none'}
                  </p>
                  <p>
                    outputs:{' '}
                    {Object.entries(steppedAnalysisEntry.outputs)
                      .map(([, signal]) => formatSignal(signal))
                      .join(' | ') || 'none'}
                  </p>
                </>
              ) : (
                <p className="empty-state">
                  Start stepping to walk the visible nested analysis trace one internal module at a
                  time.
                </p>
              )
            ) : steppedTrace ? (
              <>
                <p className="selected-trace-order">
                 Step {stepIndex! + 1} of {execution.trace.length}
                </p>
                <p>
                  module: <strong>{steppedTrace.moduleId}</strong> ({steppedTrace.defId})
                </p>
                <p>
                  inputs:{' '}
                  {Object.entries(steppedTrace.inputs)
                    .map(([, signal]) => formatSignal(signal))
                    .join(' | ') || 'none'}
                </p>
                <p>
                  outputs:{' '}
                  {Object.entries(steppedTrace.outputs)
                    .map(([, signal]) => formatSignal(signal))
                    .join(' | ') || 'none'}
                </p>
              </>
            ) : (
              <p className="empty-state">
               Start stepping to walk the execution order one module at a time.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && probedModuleIds.length > 0 ? (
        <section className="analysis-section probe-section">
          <div className="probe-head">
            <span className="meta-label">Pinned Signals</span>
            <button
              type="button"
              className="trace-mode-button"
              aria-label="Clear all signal probes"
              onClick={onClearProbes}
            >
              Clear All
            </button>
          </div>
          <ul className="probe-list">
            {probedModuleIds.map((probedId) => {
              const probeTrace: ExecutionTraceEntry | undefined = execution?.trace.find(
                (entry) => entry.moduleId === probedId,
              );
              return (
                <li key={probedId} className="probe-card">
                  <div className="probe-card-head">
                    <strong>{probedId}</strong>
                    <button
                      type="button"
                      className="probe-unpin-button"
                      aria-label={`Unpin signal probe for ${probedId}`}
                      title="Unpin"
                      onClick={() => onToggleProbe(probedId)}
                    >
                      {'\u2715'}
                    </button>
                  </div>
                  {probeTrace ? (
                    <>
                      <p>
                        in:{' '}
                        {Object.entries(probeTrace.inputs)
                          .map(([, signal]) => formatSignal(signal))
                          .join(' | ') || 'none'}
                      </p>
                      <p>
                        out:{' '}
                        {Object.entries(probeTrace.outputs)
                          .map(([, signal]) => formatSignal(signal))
                          .join(' | ') || 'none'}
                      </p>
                    </>
                  ) : (
                    <p className="empty-state">Not in current execution</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && tutorialStep ? (
        <section className="analysis-section tutorial-analysis-section">
          <span className="meta-label">Tutorial Focus</span>
          <div className="tutorial-analysis-card">
            <strong>{tutorialStep.title}</strong>
            <p>{tutorialStep.body}</p>
            {tutorialStep.focusModuleId ? (
              <p className="tutorial-analysis-target">
                Focus module: <strong>{tutorialStep.focusModuleId}</strong>
                {tutorialTraceIndex ? ` • Trace step ${tutorialTraceIndex}` : ''}
              </p>
            ) : (
              <p className="tutorial-analysis-target">
                This step explains the machine at a higher level instead of a single module.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && transformationView ? (
        <section className="analysis-section transformation-section">
          <span className="meta-label">Transformation</span>
          <div className="transformation-card">
            <div className="transformation-card-head">
              <strong>{transformationView.title}</strong>
              <span>
                {getDisplayTraceModuleId(transformationView.entry)} ({transformationView.entry.defId})
              </span>
            </div>
            <p className="transformation-copy">
              {transformationView.copy}
            </p>
            {transformationView.kind === 'routing' ? (
              <>
                {transformationView.configLabel && transformationView.configValue ? (
                  <div className="transformation-order">
                    <span className="meta-label">{transformationView.configLabel}</span>
                    <code>{transformationView.configValue}</code>
                  </div>
                ) : null}
                <div className="transformation-routing-head">
                  <span className="meta-label">Input</span>
                  <span className="meta-label">{transformationView.middleLabel}</span>
                  <span className="meta-label">Output</span>
                </div>
                <div className="transformation-routing">
                  <div className="transformation-lane">
                    <div className="transformation-lane-cells">
                      {transformationView.inputLane.map((row) => (
                        <div key={`input-${row.inputIndex}`} className="transformation-lane-cell">
                          <span className="transformation-index">{row.inputIndex}</span>
                          <strong>{row.inputBit}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className="transformation-wire-canvas"
                    aria-hidden="true"
                    style={{ height: `${transformationView.svgHeight}px` }}
                  >
                    <svg
                      viewBox={`0 0 220 ${transformationView.svgHeight}`}
                      preserveAspectRatio="none"
                    >
                      {transformationView.rows.map((row) =>
                        row.kind === 'line' ? (
                          <line
                            key={`wire-${row.inputIndex}-${row.outputIndex}`}
                            x1="18"
                            y1={row.inputY}
                            x2="202"
                            y2={row.outputY}
                            stroke={row.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.92"
                          />
                        ) : (
                          <g key={`fill-${row.outputIndex}`}>
                            <line
                              x1="18"
                              y1={row.outputY}
                              x2="202"
                              y2={row.outputY}
                              stroke={row.color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray="7 6"
                              opacity="0.88"
                            />
                            <text
                              x="110"
                              y={row.outputY - 6}
                              textAnchor="middle"
                              className="transformation-wire-label"
                            >
                              0-fill
                            </text>
                          </g>
                        ),
                      )}
                    </svg>
                  </div>
                  <div className="transformation-lane transformation-output-lane">
                    <div className="transformation-lane-cells">
                      {transformationView.outputLane.map((row) => (
                        <div
                          key={`output-${row.outputIndex}`}
                          className={
                            row.kind === 'fill'
                              ? 'transformation-lane-cell transformation-output-cell transformation-output-fill'
                              : 'transformation-lane-cell transformation-output-cell'
                          }
                        >
                          <span className="transformation-index">{row.outputIndex}</span>
                          <strong>{row.outputBit}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : transformationView.kind === 'xor' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>same {'->'} 0, different {'->'} 1</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input A</span>
                    <span className="meta-label">Input B</span>
                    <span className="meta-label">Compare</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`xor-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.aBit}</span>
                      <span className="xor-grid-bit">{row.bBit}</span>
                      <span
                        className={
                          row.resultBit === 1
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {row.explanation}
                      </span>
                      <span
                        className={
                          row.resultBit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {row.resultBit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'compare' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.ruleLabel}</span>
                  <code>{transformationView.ruleValue}</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Unsigned Words</span>
                  <code>
                    A = {transformationView.leftValue} · B = {transformationView.rightValue} · out = {transformationView.outputBit}
                  </code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input A</span>
                    <span className="meta-label">Input B</span>
                    <span className="meta-label">Compare</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`compare-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.aBit}</span>
                      <span className="xor-grid-bit">{row.bBit}</span>
                      <span
                        className={
                          row.explanation === 'different'
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {row.explanation}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'gate' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Control</span>
                  <code>
                    {transformationView.controlValue.join('') || '[]'} {'->'} {transformationView.active ? 'open' : 'closed'}
                  </code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Gate</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`gate-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.inputBit}</span>
                      <span
                        className={
                          transformationView.active
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {transformationView.active ? 'pass' : 'block'}
                      </span>
                      <span
                        className={
                          row.outputBit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {row.outputBit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'split' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Split Point</span>
                  <code>leftWidth = {transformationView.leftWidth}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Block</span>
                  </div>
                  {transformationView.inputBits.map((bit, index) => (
                    <div key={`split-${index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{index}</span>
                      <span
                        className={
                          index < transformationView.leftWidth
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {bit}
                      </span>
                      <span
                        className={
                          index < transformationView.leftWidth
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {index < transformationView.leftWidth ? 'left' : 'right'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'pad' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Target Width</span>
                  <code>{transformationView.targetWidth} bits</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Pad</span>
                  <code>{transformationView.padCount} × {transformationView.padBit} on {transformationView.side}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Output</span>
                    <span className="meta-label">Source</span>
                  </div>
                  {transformationView.outputBits.map((bit, index) => {
                    const isPad = transformationView.side === 'left'
                      ? index < transformationView.padCount
                      : index >= transformationView.inputBits.length;
                    return (
                      <div key={`pad-${index}`} className="xor-grid-row">
                        <span className="xor-grid-index">{index}</span>
                        <span
                          className={
                            isPad
                              ? 'xor-grid-bit'
                              : 'xor-grid-bit xor-grid-bit-active'
                          }
                        >
                          {bit}
                        </span>
                        <span
                          className={
                            isPad
                              ? 'xor-grid-compare'
                              : 'xor-grid-compare xor-grid-compare-different'
                          }
                        >
                          {isPad ? 'pad' : 'original'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Chunk Width</span>
                  <code>{transformationView.chunkWidth} bits</code>
                </div>
                {transformationView.chunks.length > 1 ? (
                  <div className="sbox-chunk-selector">
                    {transformationView.chunks.map((chunk) => (
                      <button
                        key={`sbox-chunk-${chunk.index}`}
                        type="button"
                        className={
                          chunk.index === effectiveLookupChunkIndex
                            ? 'sbox-chunk-chip active'
                            : 'sbox-chunk-chip'
                        }
                        onClick={() => setRequestedLookupChunkIndex(chunk.index)}
                      >
                        Chunk {chunk.index + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
                {activeLookupChunk ? (
                  <div className="sbox-view">
                    <div
                      className="sbox-table-wrap"
                      style={{ gridTemplateColumns: `56px repeat(${transformationView.gridColumns}, minmax(0, 1fr))` }}
                    >
                      <span className="sbox-table-corner" />
                      {Array.from({ length: transformationView.gridColumns }, (_, columnIndex) => (
                        <span
                          key={`sbox-col-${columnIndex}`}
                          className={
                            transformationView.usesHexGrid &&
                            columnIndex === activeLookupChunk.inputValue % transformationView.gridColumns
                              ? 'sbox-table-header active'
                              : 'sbox-table-header'
                          }
                        >
                          {formatSBoxAxisLabel(columnIndex, transformationView.gridColumns)}
                        </span>
                      ))}
                      {transformationView.table.map((value, index) => (
                        <Fragment key={`sbox-cell-wrap-${index}`}>
                          {index % transformationView.gridColumns === 0 ? (
                            <span
                              className={
                                transformationView.usesHexGrid &&
                                Math.floor(index / transformationView.gridColumns) ===
                                  Math.floor(activeLookupChunk.inputValue / transformationView.gridColumns)
                                  ? 'sbox-table-header sbox-table-row-header active'
                                  : 'sbox-table-header sbox-table-row-header'
                              }
                            >
                              {formatSBoxAxisLabel(
                                Math.floor(index / transformationView.gridColumns),
                                transformationView.gridColumns,
                              )}
                            </span>
                          ) : null}
                          <div
                            key={`sbox-cell-${index}`}
                            className={
                              index === activeLookupChunk.inputValue
                                ? 'sbox-table-cell active'
                                : transformationView.usesHexGrid &&
                                    (Math.floor(index / transformationView.gridColumns) ===
                                      Math.floor(activeLookupChunk.inputValue / transformationView.gridColumns) ||
                                      index % transformationView.gridColumns ===
                                        activeLookupChunk.inputValue % transformationView.gridColumns)
                                  ? 'sbox-table-cell context'
                                : 'sbox-table-cell'
                            }
                            title={`table[${index}] = ${value}`}
                          >
                            <strong className="sbox-table-value">{formatSBoxAxisLabel(value, transformationView.gridColumns)}</strong>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div className="sbox-lookup-banner">
                      <span className="meta-label">Active Lookup</span>
                      <strong className="sbox-lookup-index">
                        {transformationView.usesHexGrid
                          ? `table[0x${formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.chunkWidth)}] = 0x${formatSBoxHexValue(activeLookupChunk.outputValue, transformationView.chunkWidth)}`
                          : `table[${activeLookupChunk.inputValue}] = ${activeLookupChunk.outputValue}`}
                      </strong>
                      {transformationView.usesHexGrid ? (
                        <p className="comparison-copy">
                          Hex <strong>{formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.chunkWidth)}</strong> means row{' '}
                          <strong>{formatSBoxAxisLabel(Math.floor(activeLookupChunk.inputValue / transformationView.gridColumns), transformationView.gridColumns)}</strong>{' '}
                          and column{' '}
                          <strong>{formatSBoxAxisLabel(activeLookupChunk.inputValue % transformationView.gridColumns, transformationView.gridColumns)}</strong>.
                        </p>
                      ) : null}
                    </div>
                    <div className="sbox-detail-row">
                      <div className="sbox-detail-chip">
                        <span className="meta-label">Input Chunk</span>
                        <strong className="sbox-bits">{activeLookupChunk.inputBits.join('')}</strong>
                        <span className="sbox-detail-metric">
                          {transformationView.usesHexGrid
                            ? `hex ${formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.chunkWidth)} · decimal ${activeLookupChunk.inputValue}`
                            : `decimal ${activeLookupChunk.inputValue}`}
                        </span>
                      </div>
                      <div className="sbox-detail-chip">
                        <span className="meta-label">Output Chunk</span>
                        <strong className="sbox-bits">{activeLookupChunk.outputBits.join('')}</strong>
                        <span className="sbox-detail-metric">
                          {transformationView.usesHexGrid
                            ? `hex ${formatSBoxHexValue(activeLookupChunk.outputValue, transformationView.chunkWidth)} · decimal ${activeLookupChunk.outputValue}`
                            : `decimal ${activeLookupChunk.outputValue}`}
                        </span>
                      </div>
                    </div>
                    <div className="sbox-chunk-grid">
                      {transformationView.chunks.map((chunk) => (
                        <button
                          key={`sbox-summary-${chunk.index}`}
                          type="button"
                          className={
                            chunk.index === effectiveLookupChunkIndex
                              ? 'sbox-chunk-summary active'
                              : 'sbox-chunk-summary'
                          }
                          onClick={() => setRequestedLookupChunkIndex(chunk.index)}
                        >
                          <span className="meta-label">Chunk {chunk.index + 1}</span>
                          <p className="comparison-copy">
                            {chunk.inputBits.join('')} ({chunk.inputValue}) {'->'} {chunk.outputBits.join('')} ({chunk.outputValue})
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
            <p className="transformation-summary">
              {transformationView.kind === 'lookup' && activeLookupChunk
                ? `Input chunk ${activeLookupChunk.inputBits.join('')} is index ${activeLookupChunk.inputValue}. The substitution table maps ${activeLookupChunk.inputValue} to ${activeLookupChunk.outputValue}, so the output chunk becomes ${activeLookupChunk.outputBits.join('')}.`
                : transformationView.summary}
            </p>
          </div>
        </section>
      ) : null}

      {moduleDef && moduleInstance && inspectorTab === 'configure' ? (
        <section className="inspector-section">
          <span className="meta-label">Selected Module</span>
          <strong className="selected-module-name">{moduleInstance.id}</strong>
          <p className="selected-module-type">{moduleDef.id}</p>
          {'kind' in moduleDef ? (
            moduleDef.kind === 'composite' ? (
              <p className="selected-module-kind">Composite definition</p>
            ) : moduleDef.kind === 'iterator' ? (
              <p className="selected-module-kind">
                Iterator definition
                {typeof moduleDef.roundKeyWidth === 'number'
                  ? ` • ${moduleDef.roundKeyWidth}-bit round keys`
                  : ''}
              </p>
            ) : null
          ) : null}
          <div className="selected-module-actions">
            {isCompositeDefinition(moduleDef) && onUnzipComposite ? (
              <button
                type="button"
                className="primitive-add-button"
                onClick={() => onUnzipComposite(moduleInstance.id)}
              >
                Unzip Composite
              </button>
            ) : null}
            <button
              type="button"
              className="delete-module-button"
              onClick={() => onDeleteModule(moduleInstance.id)}
            >
              Delete Module
            </button>
          </div>

          <div className="param-list">
            {Object.values(moduleDef.paramSchema).length === 0 ? (
              <p className="empty-state">This module has no configurable parameters.</p>
            ) : (
              Object.values(moduleDef.paramSchema).map((field) => {
                const value =
                  moduleInstance.params[field.key] ?? field.defaultValue;
                const baselineValue =
                  baselineModuleInstance?.params[field.key] ?? field.defaultValue;
                const draftValue = getParamDraft(moduleInstance.id, field.key);
                const renderedValue =
                  draftValue ?? formatParamValue(value, field);
                const parsedDraft =
                  draftValue !== undefined ? parseParamValue(draftValue, field) : null;
                const fieldError = parsedDraft && !parsedDraft.ok ? parsedDraft.error : null;
                const isForwardedParam =
                  isCompositeDefinition(moduleDef) &&
                  (moduleDef.forwardedParams ?? []).some(
                    (binding) => binding.externalParam === field.key,
                  );

                if (field.kind === 'boolean') {
                  return (
                    <label key={field.key} className="param-field">
                      <span>
                        {field.label}
                        {isForwardedParam ? (
                          <span className="forwarded-param-chip">Forwarded</span>
                        ) : null}
                      </span>
                      {!areParamValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.checked)
                        }
                      />
                    </label>
                  );
                }

                if (field.kind === 'select') {
                  return (
                    <label key={field.key} className="param-field">
                      <span>
                        {field.label}
                        {isForwardedParam ? (
                          <span className="forwarded-param-chip">Forwarded</span>
                        ) : null}
                      </span>
                      {!areParamValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <select
                        value={String(value)}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.value)
                        }
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.kind === 'bits') {
                  return (
                    <label key={field.key} className="param-field">
                      <span>
                        {field.label}
                        {isForwardedParam ? (
                          <span className="forwarded-param-chip">Forwarded</span>
                        ) : null}
                      </span>
                      {!areParamValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <BitsEditor
                        field={field}
                        value={value}
                        renderedValue={renderedValue}
                        moduleId={moduleInstance.id}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                if (field.kind === 'wiring') {
                  const isRotorWiringField =
                    moduleDef.id === 'Rotor' && field.key === 'wiring';
                  const isPlugboardWiringField =
                    moduleDef.id === 'Plugboard' && field.key === 'wiring';
                  const isReflectorWiringField =
                    moduleDef.id === 'Reflector' && field.key === 'wiring';

                  if (isRotorWiringField) {
                    const rotorWiring = getEditableRotorWiring(value);
                    const baselineRotorWiring = getEditableRotorWiring(baselineValue);
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    const rotorSvgHeight =
                      rotorWireLayout?.height ??
                      (rotorWiring
                        ? rotorWiring.length * PERMUTATION_EDITOR_PORT_HEIGHT +
                          Math.max(0, rotorWiring.length - 1) * PERMUTATION_EDITOR_PORT_GAP
                        : 0);

                    return (
                      <label key={field.key} className="param-field">
                        <span>
                          {field.label}
                          {isForwardedParam ? (
                            <span className="forwarded-param-chip">Forwarded</span>
                          ) : null}
                        </span>
                        {baselineRotorWiring && !areParamValuesEqual(value, baselineValue) ? (
                          <span className="baseline-chip">
                            Baseline: {serializeRotorWiring(baselineRotorWiring)}
                          </span>
                        ) : null}
                        {rotorWiring ? (
                          <div className="permutation-editor">
                            <div className="permutation-editor-meta">
                              <span className="content-status-chip">
                                Drag an input wire onto an output letter to replug the rotor wiring
                              </span>
                              <span className="content-status-chip">
                                Position stays separate from the authored wiring
                              </span>
                            </div>
                            <div className="permutation-wire-editor">
                              <div className="permutation-wire-lane" ref={rotorInputLaneRef}>
                                <span className="meta-label permutation-wire-lane-label">Input</span>
                                {alphabet.map((letter, inputIndex) => (
                                  <button
                                    key={`rotor-input-${letter}`}
                                    type="button"
                                    ref={(node) => {
                                      rotorInputRefs.current[inputIndex] = node;
                                    }}
                                    draggable
                                    className={
                                      draggedRotorInputIndex === inputIndex
                                        ? 'permutation-port permutation-port-input active'
                                        : 'permutation-port permutation-port-input'
                                    }
                                    onDragStart={() => setDraggedRotorInputIndex(inputIndex)}
                                    onDragEnd={() => setDraggedRotorInputIndex(null)}
                                  >
                                    <strong className="permutation-slot-value">{letter}</strong>
                                  </button>
                                ))}
                              </div>
                              <div
                                className="permutation-wire-canvas"
                                aria-hidden="true"
                                style={{ height: `${rotorSvgHeight}px` }}
                              >
                                <svg
                                  viewBox={`0 0 220 ${rotorSvgHeight}`}
                                  preserveAspectRatio="none"
                                >
                                  {rotorWiring.map((targetLetter, inputIndex) => {
                                    const y1 =
                                      rotorWireLayout?.inputYs[inputIndex] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        inputIndex *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const y2 =
                                      rotorWireLayout?.outputYs[alphabet.indexOf(targetLetter)] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        alphabet.indexOf(targetLetter) *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const color = getPermutationWireColor(inputIndex);

                                    return (
                                      <g key={`rotor-wire-${inputIndex}`}>
                                        <line
                                          x1="18"
                                          y1={y1}
                                          x2="202"
                                          y2={y2}
                                          stroke={color}
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          opacity="0.92"
                                        />
                                        <circle cx="18" cy={y1} r="4" fill={color} opacity="0.98" />
                                        <circle cx="202" cy={y2} r="4" fill={color} opacity="0.98" />
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>
                              <div className="permutation-wire-lane" ref={rotorOutputLaneRef}>
                                <span className="meta-label permutation-wire-lane-label">Output</span>
                                {alphabet.map((outputLetter) => {
                                  const sourceInputIndex = rotorWiring.findIndex(
                                    (entry) => entry === outputLetter,
                                  );

                                  return (
                                    <button
                                      key={`rotor-output-${outputLetter}`}
                                      type="button"
                                      ref={(node) => {
                                        rotorOutputRefs.current[alphabet.indexOf(outputLetter)] = node;
                                      }}
                                      className="permutation-port permutation-port-output"
                                      onDragOver={(event) => event.preventDefault()}
                                      onDrop={(event) => {
                                        event.preventDefault();
                                        if (draggedRotorInputIndex === null) {
                                          return;
                                        }

                                        const nextWiring = swapRotorWiringTargets(
                                          rotorWiring,
                                          draggedRotorInputIndex,
                                          sourceInputIndex,
                                        );
                                        const serialized = serializeRotorWiring(nextWiring);
                                        setDraggedRotorInputIndex(null);
                                        onParamDraftChange(moduleInstance.id, field.key, serialized);
                                        onParamChange(moduleInstance.id, field.key, nextWiring);
                                      }}
                                    >
                                      <strong className="permutation-slot-value">{outputLetter}</strong>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <label className="param-field permutation-editor-raw">
                              <span>Raw Wiring</span>
                              <textarea
                                value={renderedValue}
                                onChange={(event) => {
                                  const rawValue = event.target.value;
                                  onParamDraftChange(moduleInstance.id, field.key, rawValue);
                                  const parsed = parseParamValue(rawValue, field);
                                  if (parsed.ok) {
                                    onParamChange(moduleInstance.id, field.key, parsed.value);
                                  }
                                }}
                              />
                              {fieldError ? <p className="field-error">{fieldError}</p> : null}
                            </label>
                          </div>
                        ) : (
                          <>
                            <WiringEditor
                              field={field}
                              value={value}
                              renderedValue={renderedValue}
                              moduleId={moduleInstance.id}
                              onParamDraftChange={onParamDraftChange}
                              onParamChange={onParamChange}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </>
                        )}
                      </label>
                    );
                  }

                  if (isPlugboardWiringField) {
                    const plugboardWiring = getEditablePlugboardWiring(value);
                    const baselinePlugboardWiring = getEditablePlugboardWiring(baselineValue);
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    const plugboardPairStyles = plugboardWiring
                      ? buildPairStyles(plugboardWiring, { includeSelfPairs: false })
                      : {};
                    const activePlugboardPairs = plugboardWiring
                      ? alphabet.filter((letter, index) => plugboardWiring[index] !== letter).length / 2
                      : 0;
                    const canUnpairSelectedPlugboardLetter =
                      plugboardWiring &&
                      selectedPlugboardLetter &&
                      plugboardWiring[alphabet.indexOf(selectedPlugboardLetter)] !== selectedPlugboardLetter;

                    return (
                      <label key={field.key} className="param-field">
                        <span>
                          {field.label}
                          {isForwardedParam ? (
                            <span className="forwarded-param-chip">Forwarded</span>
                          ) : null}
                        </span>
                        {baselinePlugboardWiring && !areParamValuesEqual(value, baselineValue) ? (
                          <span className="baseline-chip">
                            Baseline: {serializePlugboardWiring(baselinePlugboardWiring)}
                          </span>
                        ) : null}
                        {plugboardWiring ? (
                          <div className="reflector-editor">
                            <div className="reflector-editor-meta">
                              <span className="content-status-chip">
                                Click one letter, then another, to pair them. Unpaired letters pass straight through.
                              </span>
                              <span className="content-status-chip">
                                Active pairs: {activePlugboardPairs}
                              </span>
                              <span className="content-status-chip">
                                Selected: {selectedPlugboardLetter ?? 'none'}
                              </span>
                            </div>
                            <div className="permutation-editor-actions">
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() => {
                                  const nextWiring = buildIdentityPlugboardWiring();
                                  const serialized = serializePlugboardWiring(nextWiring);
                                  setSelectedPlugboardLetter(null);
                                  onParamDraftChange(moduleInstance.id, field.key, serialized);
                                  onParamChange(moduleInstance.id, field.key, nextWiring);
                                }}
                              >
                                Reset To Identity
                              </button>
                              <button
                                type="button"
                                className="mini-action-button"
                                disabled={!canUnpairSelectedPlugboardLetter}
                                onClick={() => {
                                  if (!selectedPlugboardLetter) {
                                    return;
                                  }

                                  const nextWiring = unpairPlugboardLetter(
                                    plugboardWiring,
                                    selectedPlugboardLetter,
                                  );
                                  const serialized = serializePlugboardWiring(nextWiring);
                                  setSelectedPlugboardLetter(null);
                                  onParamDraftChange(moduleInstance.id, field.key, serialized);
                                  onParamChange(moduleInstance.id, field.key, nextWiring);
                                }}
                              >
                                Unpair Selected
                              </button>
                            </div>
                            <div className="reflector-editor-grid">
                              {alphabet.map((letter, index) => {
                                const partner = plugboardWiring[index];
                                const pairKey =
                                  partner === letter ? null : getPairKey(letter, partner);

                                return (
                                  <button
                                    key={`plugboard-socket-${letter}`}
                                    type="button"
                                    style={pairKey ? plugboardPairStyles[pairKey] : undefined}
                                    className={
                                      selectedPlugboardLetter === letter
                                        ? 'reflector-socket active'
                                        : partner === letter
                                          ? 'reflector-socket reflector-socket-self'
                                          : 'reflector-socket'
                                    }
                                    onClick={() => {
                                      if (selectedPlugboardLetter === null) {
                                        setSelectedPlugboardLetter(letter);
                                        return;
                                      }

                                      if (selectedPlugboardLetter === letter) {
                                        setSelectedPlugboardLetter(null);
                                        return;
                                      }

                                      const nextWiring = pairPlugboardLetters(
                                        plugboardWiring,
                                        selectedPlugboardLetter,
                                        letter,
                                      );
                                      const serialized = serializePlugboardWiring(nextWiring);
                                      setSelectedPlugboardLetter(null);
                                      onParamDraftChange(moduleInstance.id, field.key, serialized);
                                      onParamChange(moduleInstance.id, field.key, nextWiring);
                                    }}
                                  >
                                    <span className="meta-label">Socket</span>
                                    <strong className="reflector-socket-letter">{letter}</strong>
                                    {partner === letter ? (
                                      <>
                                        <span className="reflector-socket-chip reflector-socket-chip-self">
                                          Pass Through
                                        </span>
                                        <span className="reflector-socket-pair">
                                          Unpaired <strong>{letter}</strong> remains itself
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="reflector-socket-chip">
                                          {getPairKey(letter, partner).replace('-', ' ↔ ')}
                                        </span>
                                        <span className="reflector-socket-pair">
                                          Paired with <strong>{partner}</strong>
                                        </span>
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <label className="param-field reflector-editor-raw">
                              <span>Raw Wiring</span>
                              <textarea
                                value={renderedValue}
                                onChange={(event) => {
                                  const rawValue = event.target.value;
                                  onParamDraftChange(moduleInstance.id, field.key, rawValue);
                                  const parsed = parseParamValue(rawValue, field);
                                  if (parsed.ok) {
                                    onParamChange(moduleInstance.id, field.key, parsed.value);
                                  }
                                }}
                              />
                              {fieldError ? <p className="field-error">{fieldError}</p> : null}
                            </label>
                          </div>
                        ) : (
                          <>
                            <WiringEditor
                              field={field}
                              value={value}
                              renderedValue={renderedValue}
                              moduleId={moduleInstance.id}
                              onParamDraftChange={onParamDraftChange}
                              onParamChange={onParamChange}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </>
                        )}
                      </label>
                    );
                  }

                  if (isReflectorWiringField) {
                    const reflectorWiring = getEditableReflectorWiring(value);
                    const baselineReflectorWiring = getEditableReflectorWiring(baselineValue);
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    const reflectorPairStyles = reflectorWiring
                      ? buildPairStyles(reflectorWiring)
                      : {};

                    return (
                      <label key={field.key} className="param-field">
                        <span>
                          {field.label}
                          {isForwardedParam ? (
                            <span className="forwarded-param-chip">Forwarded</span>
                          ) : null}
                        </span>
                        {baselineReflectorWiring && !areParamValuesEqual(value, baselineValue) ? (
                          <span className="baseline-chip">
                            Baseline: {serializeReflectorWiring(baselineReflectorWiring)}
                          </span>
                        ) : null}
                        {reflectorWiring ? (
                          <div className="reflector-editor">
                            <div className="reflector-editor-meta">
                              <span className="content-status-chip">
                                Click one letter, then another, to re-pair the sockets
                              </span>
                              <span className="content-status-chip">
                                Selected: {selectedReflectorLetter ?? 'none'}
                              </span>
                            </div>
                            <div className="reflector-editor-grid">
                              {alphabet.map((letter, index) => (
                                <button
                                  key={`reflector-socket-${letter}`}
                                  type="button"
                                  style={reflectorPairStyles[getPairKey(letter, reflectorWiring[index])]}
                                  className={
                                    selectedReflectorLetter === letter
                                      ? 'reflector-socket active'
                                      : 'reflector-socket'
                                  }
                                  onClick={() => {
                                    if (selectedReflectorLetter === null) {
                                      setSelectedReflectorLetter(letter);
                                      return;
                                    }

                                    if (selectedReflectorLetter === letter) {
                                      setSelectedReflectorLetter(null);
                                      return;
                                    }

                                    const nextWiring = pairReflectorLetters(
                                      reflectorWiring,
                                      selectedReflectorLetter,
                                      letter,
                                    );
                                    const serialized = serializeReflectorWiring(nextWiring);
                                    setSelectedReflectorLetter(null);
                                    onParamDraftChange(moduleInstance.id, field.key, serialized);
                                    onParamChange(moduleInstance.id, field.key, nextWiring);
                                  }}
                                >
                                  <span className="meta-label">Socket</span>
                                  <strong className="reflector-socket-letter">{letter}</strong>
                                  <span className="reflector-socket-chip">
                                    {getPairKey(letter, reflectorWiring[index]).replace('-', ' ↔ ')}
                                  </span>
                                  <span className="reflector-socket-pair">
                                    Paired with <strong>{reflectorWiring[index]}</strong>
                                  </span>
                                </button>
                              ))}
                            </div>
                            <label className="param-field reflector-editor-raw">
                              <span>Raw Wiring</span>
                              <textarea
                                value={renderedValue}
                                onChange={(event) => {
                                  const rawValue = event.target.value;
                                  onParamDraftChange(moduleInstance.id, field.key, rawValue);
                                  const parsed = parseParamValue(rawValue, field);
                                  if (parsed.ok) {
                                    onParamChange(moduleInstance.id, field.key, parsed.value);
                                  }
                                }}
                              />
                              {fieldError ? <p className="field-error">{fieldError}</p> : null}
                            </label>
                          </div>
                        ) : (
                          <>
                            <WiringEditor
                              field={field}
                              value={value}
                              renderedValue={renderedValue}
                              moduleId={moduleInstance.id}
                              onParamDraftChange={onParamDraftChange}
                              onParamChange={onParamChange}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </>
                        )}
                      </label>
                    );
                  }

                  return (
                    <label key={field.key} className="param-field">
                      <span>
                        {field.label}
                        {isForwardedParam ? (
                          <span className="forwarded-param-chip">Forwarded</span>
                        ) : null}
                      </span>
                      {!areParamValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <WiringEditor
                        field={field}
                        value={value}
                        renderedValue={renderedValue}
                        moduleId={moduleInstance.id}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                const isSBoxTableField =
                  moduleDef.id === 'SBox' &&
                  field.key === 'table' &&
                  field.kind === 'string';

                if (isSBoxTableField) {
                  const editableTable = getEditableSBoxTable(value);
                  const baselineTable = getEditableSBoxTable(baselineValue);
                  const selectedEntryIndex =
                    editableTable && editableTable.length > 0
                      ? Math.min(Math.max(0, requestedSBoxEditIndex), editableTable.length - 1)
                      : 0;
                  const selectedEntryValue = editableTable?.[selectedEntryIndex] ?? 0;
                  const usesHexGrid = editableTable?.length === 256;
                  const gridColumns = editableTable ? Math.min(16, Math.max(1, Math.sqrt(editableTable.length))) : 4;

                  return (
                    <label key={field.key} className="param-field">
                      <span>
                        {field.label}
                        {isForwardedParam ? (
                          <span className="forwarded-param-chip">Forwarded</span>
                        ) : null}
                      </span>
                      {baselineTable && !areParamValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {baselineTable.length} entries
                        </span>
                      ) : null}
                      {editableTable ? (
                        <div className="sbox-editor">
                          <div className="sbox-editor-actions">
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => {
                                const nextValue = serializeSBoxTable(buildIdentitySBoxTable(editableTable.length));
                                onParamDraftChange(moduleInstance.id, field.key, nextValue);
                                onParamChange(moduleInstance.id, field.key, nextValue);
                              }}
                            >
                              Reset To Identity
                            </button>
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => {
                                const nextValue = serializeSBoxTable(buildReverseSBoxTable(editableTable.length));
                                onParamDraftChange(moduleInstance.id, field.key, nextValue);
                                onParamChange(moduleInstance.id, field.key, nextValue);
                              }}
                            >
                              Reset To Reverse
                            </button>
                          </div>
                          <div className="sbox-editor-meta">
                            <span className="content-status-chip">{editableTable.length} entries</span>
                            <span className="content-status-chip">
                              Safe edit mode swaps entries so the table stays a valid permutation
                            </span>
                          </div>
                          <div
                            className="sbox-editor-grid"
                            style={{ gridTemplateColumns: `56px repeat(${gridColumns}, minmax(0, 1fr))` }}
                          >
                            <span className="sbox-table-corner" />
                            {Array.from({ length: gridColumns }, (_, columnIndex) => (
                              <span key={`sbox-editor-col-${columnIndex}`} className="sbox-table-header">
                                {formatSBoxAxisLabel(columnIndex, gridColumns)}
                              </span>
                            ))}
                            {editableTable.map((entryValue, index) => (
                              <Fragment key={`sbox-editor-cell-wrap-${index}`}>
                                {index % gridColumns === 0 ? (
                                  <span className="sbox-table-header sbox-table-row-header">
                                    {formatSBoxAxisLabel(Math.floor(index / gridColumns), gridColumns)}
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  className={
                                    index === selectedEntryIndex
                                      ? 'sbox-table-cell active sbox-editor-cell'
                                      : 'sbox-table-cell sbox-editor-cell'
                                  }
                                  onClick={() => setRequestedSBoxEditIndex(index)}
                                  title={`table[${index}] = ${entryValue}`}
                                >
                                  <strong className="sbox-table-value">
                                    {formatSBoxAxisLabel(entryValue, gridColumns)}
                                  </strong>
                                </button>
                              </Fragment>
                            ))}
                          </div>
                          <div className="sbox-editor-detail">
                            <div className="sbox-detail-chip">
                              <span className="meta-label">Selected Entry</span>
                              <strong className="sbox-bits">
                                {usesHexGrid
                                  ? `table[0x${formatSBoxHexValue(selectedEntryIndex, 8)}]`
                                  : `table[${selectedEntryIndex}]`}
                              </strong>
                              <span className="sbox-detail-metric">
                                {usesHexGrid
                                  ? `current output 0x${formatSBoxHexValue(selectedEntryValue, 8)} · decimal ${selectedEntryValue}`
                                  : `current output ${selectedEntryValue}`}
                              </span>
                            </div>
                            <label className="param-field sbox-editor-select">
                              <span>Swap selected entry with value</span>
                              <select
                                value={String(selectedEntryValue)}
                                onChange={(event) => {
                                  const nextEntryValue = Number(event.target.value);
                                  const nextTable = swapSBoxEntry(
                                    editableTable,
                                    selectedEntryIndex,
                                    nextEntryValue,
                                  );
                                  const serialized = serializeSBoxTable(nextTable);
                                  onParamDraftChange(moduleInstance.id, field.key, serialized);
                                  onParamChange(moduleInstance.id, field.key, serialized);
                                }}
                              >
                                {editableTable.map((_, optionValue) => (
                                  <option key={`sbox-editor-option-${optionValue}`} value={optionValue}>
                                    {usesHexGrid
                                      ? `0x${formatSBoxHexValue(optionValue, 8)} · ${optionValue}`
                                      : optionValue}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <label className="param-field sbox-editor-raw">
                            <span>Raw CSV Table</span>
                            <textarea
                              value={renderedValue}
                              onChange={(event) => {
                                const rawValue = event.target.value;
                                onParamDraftChange(moduleInstance.id, field.key, rawValue);
                                const parsed = parseParamValue(rawValue, field);
                                if (parsed.ok) {
                                  onParamChange(moduleInstance.id, field.key, parsed.value);
                                }
                              }}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </label>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={renderedValue}
                            onChange={(event) => {
                              const rawValue = event.target.value;
                              onParamDraftChange(moduleInstance.id, field.key, rawValue);
                              const parsed = parseParamValue(rawValue, field);
                              if (parsed.ok) {
                                onParamChange(moduleInstance.id, field.key, parsed.value);
                              }
                            }}
                          />
                          <p className="field-error">
                            {fieldError ?? 'S-Box editor is unavailable until the table parses again.'}
                          </p>
                        </>
                      )}
                    </label>
                  );
                }

                const isPermutationOrderField =
                  moduleDef.id === 'Permutation' &&
                  field.key === 'order' &&
                  field.kind === 'string';

                if (isPermutationOrderField) {
                  const editableOrder = getEditablePermutationOrder(value);
                  const baselineOrder = getEditablePermutationOrder(baselineValue);
                  const canUseVisualPermutationEditor =
                    editableOrder ? isSimplePermutationOrder(editableOrder) : false;
                  const permutationSvgHeight =
                    permutationWireLayout?.height ??
                    (editableOrder && canUseVisualPermutationEditor
                      ? editableOrder.length * PERMUTATION_EDITOR_PORT_HEIGHT +
                        Math.max(0, editableOrder.length - 1) * PERMUTATION_EDITOR_PORT_GAP
                      : 0);

                  return (
                    <label key={field.key} className="param-field">
                      <span>
                        {field.label}
                        {isForwardedParam ? (
                          <span className="forwarded-param-chip">Forwarded</span>
                        ) : null}
                      </span>
                      {baselineOrder && !areParamValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {serializePermutationOrder(baselineOrder)}
                        </span>
                      ) : null}
                      {editableOrder ? (
                        <div className="permutation-editor">
                          <div className="permutation-editor-actions">
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => {
                                const nextValue = serializePermutationOrder(
                                  buildIdentityPermutationOrder(editableOrder.length),
                                );
                                onParamDraftChange(moduleInstance.id, field.key, nextValue);
                                onParamChange(moduleInstance.id, field.key, nextValue);
                              }}
                            >
                              Reset To Identity
                            </button>
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => {
                                const nextValue = serializePermutationOrder(
                                  buildReversePermutationOrder(editableOrder.length),
                                );
                                onParamDraftChange(moduleInstance.id, field.key, nextValue);
                                onParamChange(moduleInstance.id, field.key, nextValue);
                              }}
                            >
                              Reset To Reverse
                            </button>
                          </div>
                          <div className="permutation-editor-meta">
                            <span className="content-status-chip">{editableOrder.length} output slots</span>
                            <span className="content-status-chip">
                              {canUseVisualPermutationEditor
                                ? 'Drag an input wire onto an output slot to replug the routing'
                                : 'Raw CSV remains available for non-bijective or repeated routing patterns'}
                            </span>
                          </div>
                          {canUseVisualPermutationEditor ? (
                            <div className="permutation-wire-editor">
                              <div className="permutation-wire-lane" ref={permutationInputLaneRef}>
                                {editableOrder.map((_, inputIndex) => (
                                  <button
                                    key={`perm-input-${inputIndex}`}
                                    type="button"
                                    ref={(node) => {
                                      permutationInputRefs.current[inputIndex] = node;
                                    }}
                                    draggable
                                    className={
                                      draggedPermutationInputIndex === inputIndex
                                        ? 'permutation-port permutation-port-input active'
                                        : 'permutation-port permutation-port-input'
                                    }
                                    onDragStart={() => setDraggedPermutationInputIndex(inputIndex)}
                                    onDragEnd={() => setDraggedPermutationInputIndex(null)}
                                  >
                                    <span className="meta-label">Input</span>
                                    <strong className="permutation-slot-value">{inputIndex}</strong>
                                  </button>
                                ))}
                              </div>
                              <div
                                className="permutation-wire-canvas"
                                aria-hidden="true"
                                style={{ height: `${permutationSvgHeight}px` }}
                              >
                                <svg
                                  viewBox={`0 0 220 ${permutationSvgHeight}`}
                                  preserveAspectRatio="none"
                                >
                                  {editableOrder.map((inputIndex, outputIndex) => {
                                    const y1 =
                                      permutationWireLayout?.inputYs[inputIndex] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        inputIndex *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const y2 =
                                      permutationWireLayout?.outputYs[outputIndex] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        outputIndex *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const color = getPermutationWireColor(inputIndex);

                                    return (
                                      <g key={`perm-wire-${outputIndex}`}>
                                        <line
                                          x1="18"
                                          y1={y1}
                                          x2="202"
                                          y2={y2}
                                          stroke={color}
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          opacity="0.92"
                                        />
                                        <circle cx="18" cy={y1} r="4" fill={color} opacity="0.98" />
                                        <circle cx="202" cy={y2} r="4" fill={color} opacity="0.98" />
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>
                              <div className="permutation-wire-lane" ref={permutationOutputLaneRef}>
                                {editableOrder.map((inputIndex, outputIndex) => (
                                  <button
                                    key={`perm-output-${outputIndex}`}
                                    type="button"
                                    ref={(node) => {
                                      permutationOutputRefs.current[outputIndex] = node;
                                    }}
                                    className="permutation-port permutation-port-output"
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      if (draggedPermutationInputIndex === null) {
                                        return;
                                      }

                                      const sourceOutputIndex = editableOrder.findIndex(
                                        (entry) => entry === draggedPermutationInputIndex,
                                      );
                                      if (sourceOutputIndex < 0) {
                                        setDraggedPermutationInputIndex(null);
                                        return;
                                      }

                                      const nextOrder = swapPermutationOrderPositions(
                                        editableOrder,
                                        sourceOutputIndex,
                                        outputIndex,
                                      );
                                      const serialized = serializePermutationOrder(nextOrder);
                                      setDraggedPermutationInputIndex(null);
                                      onParamDraftChange(moduleInstance.id, field.key, serialized);
                                      onParamChange(moduleInstance.id, field.key, serialized);
                                    }}
                                  >
                                    <span className="meta-label">Output {outputIndex}</span>
                                    <strong className="permutation-slot-value">Input {inputIndex}</strong>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          <label className="param-field permutation-editor-raw">
                            <span>Raw CSV Order</span>
                            <textarea
                              value={renderedValue}
                              onChange={(event) => {
                                const rawValue = event.target.value;
                                onParamDraftChange(moduleInstance.id, field.key, rawValue);
                                const parsed = parseParamValue(rawValue, field);
                                if (parsed.ok) {
                                  onParamChange(moduleInstance.id, field.key, parsed.value);
                                }
                              }}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </label>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={renderedValue}
                            onChange={(event) => {
                              const rawValue = event.target.value;
                              onParamDraftChange(moduleInstance.id, field.key, rawValue);
                              const parsed = parseParamValue(rawValue, field);
                              if (parsed.ok) {
                                onParamChange(moduleInstance.id, field.key, parsed.value);
                              }
                            }}
                          />
                          <p className="field-error">
                            {fieldError ?? 'Permutation editor is unavailable until the order parses again.'}
                          </p>
                        </>
                      )}
                    </label>
                  );
                }

                const isHexSourceValueField =
                  moduleDef.id === 'HexSource' &&
                  field.key === 'value' &&
                  field.kind === 'string';

                return (
                  <label key={field.key} className="param-field">
                    <span>
                      {field.label}
                      {isForwardedParam ? (
                        <span className="forwarded-param-chip">Forwarded</span>
                      ) : null}
                    </span>
                    {!areParamValuesEqual(value, baselineValue) ? (
                      <span className="baseline-chip">
                        Baseline: {formatParamValue(baselineValue, field)}
                      </span>
                    ) : null}
                    <input
                      type={field.kind === 'number' ? 'number' : 'text'}
                      value={renderedValue}
                      onChange={(event) => {
                        const rawValue = event.target.value;
                        onParamDraftChange(moduleInstance.id, field.key, rawValue);
                        const parsed = parseParamValue(rawValue, field);
                        if (parsed.ok) {
                          onParamChange(moduleInstance.id, field.key, parsed.value);
                        }
                      }}
                    />
                    {isHexSourceValueField ? (
                      <div className="param-stepper-row">
                        <button
                          type="button"
                          className="mini-action-button"
                          disabled={Boolean(fieldError)}
                          onClick={() => {
                            const nextValue = stepHexString(String(value ?? field.defaultValue ?? ''), -1);
                            onParamDraftChange(moduleInstance.id, field.key, nextValue);
                            onParamChange(moduleInstance.id, field.key, nextValue);
                          }}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="mini-action-button"
                          disabled={Boolean(fieldError)}
                          onClick={() => {
                            const nextValue = stepHexString(String(value ?? field.defaultValue ?? ''), 1);
                            onParamDraftChange(moduleInstance.id, field.key, nextValue);
                            onParamChange(moduleInstance.id, field.key, nextValue);
                          }}
                        >
                          +1
                        </button>
                      </div>
                    ) : null}
                    {fieldError ? <p className="field-error">{fieldError}</p> : null}
                  </label>
                );
              })
            )}
          </div>

          <div className="selected-ports">
            <div className="port-group">
              <span className="meta-label">Inputs</span>
              {moduleDef.inputs.length === 0 ? (
                <p className="empty-state">No input ports</p>
              ) : (
                <ul className="port-list">
                  {moduleDef.inputs.map((port) => (
                    <li key={port.name}>
                      <strong>{port.name}</strong>
                      <span>{port.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="port-group">
              <span className="meta-label">Outputs</span>
              {moduleDef.outputs.length === 0 ? (
                <p className="empty-state">No output ports</p>
              ) : (
                <ul className="port-list">
                  {moduleDef.outputs.map((port) => (
                    <li key={port.name}>
                      <strong>{port.name}</strong>
                      <span>{port.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </section>
      ) : (
        inspectorTab === 'configure' ? (
          <p className="empty-state">Select a module to inspect and edit its parameters.</p>
        ) : null
      )}

      {inspectorTab === 'analyze' && selectedIssues.length > 0 ? (
        <section className="analysis-section">
          <span className="meta-label">Selected Issues</span>
          <ul className="issue-list">
            {groupedSelectedIssues.map((group, index) => (
              <li
                key={`${group.targetModuleId ?? 'global'}-${index}`}
                className={group.targetModuleId ? 'issue-card issue-card-actionable' : 'issue-card'}
                onClick={() => {
                  if (group.targetModuleId) {
                    onSelectIssueTarget(group.targetModuleId);
                  }
                }}
              >
                <strong>{group.title}</strong>
                {group.targetModuleId ? (
                  <span className="issue-target-chip">{group.targetModuleId}</span>
                ) : null}
                <p>{group.messages.join(' ')}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && executionError ? (
        <p className={validationIssues.length > 0 ? 'inspector-warning' : 'inspector-runtime-error'}>
          {validationIssues.length > 0
            ? 'Current edits make the graph invalid. Resolve the issues below to restore execution.'
            : `Execution failed even though the graph is valid. ${executionError}`}
        </p>
     ) : inspectorTab === 'analyze' && selectedTrace ? (
        <div className="selected-trace">
          <span className="meta-label">Selected Trace</span>
          <p className="selected-trace-order">
            Step {selectedTraceOrder ?? '?'} of{' '}
            {analysisTrace.length}
          </p>
          <p>
            inputs:{' '}
            {Object.entries(selectedTrace.inputs)
              .map(([, signal]) => formatSignal(signal))
              .join(' | ') || 'none'}
          </p>
          <p>
            outputs:{' '}
            {Object.entries(selectedTrace.outputs)
              .map(([, signal]) => formatSignal(signal))
              .join(' | ') || 'none'}
          </p>
        </div>
      ) : null}

      {inspectorTab === 'analyze' && globalIssues.length > 0 ? (
        <section className="analysis-section">
          <span className="meta-label">Graph Issues</span>
          <ul className="issue-list">
            {groupedGlobalIssues.map((group, index) => (
              <li
                key={`${group.targetModuleId ?? 'global'}-${index}`}
                className={group.targetModuleId ? 'issue-card issue-card-actionable' : 'issue-card'}
                onClick={() => {
                  if (group.targetModuleId) {
                    onSelectIssueTarget(group.targetModuleId);
                  }
                }}
              >
                <strong>{group.title}</strong>
                {group.targetModuleId ? (
                  <span className="issue-target-chip">{group.targetModuleId}</span>
                ) : null}
                <p>{group.messages.join(' ')}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inspectorTab === 'analyze' ? (
      <div className="trace-toolbar">
        <span className="meta-label">Execution Trace</span>
        <div className="trace-toolbar-controls">
          {roundFocusOptions.length > 0 ? (
            <label className="trace-round-select">
              <span className="meta-label">Focus Round</span>
              <select
                value={effectiveFocusedRoundPath}
                onChange={(event) => setFocusedRoundPath(event.target.value)}
              >
                <option value="all">All Rounds</option>
                {roundFocusOptions.map((option) => (
                  <option key={option.path} value={option.path}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="trace-mode-toggle">
          <button
            type="button"
            className={effectiveTraceMode === 'focused' ? 'trace-mode-button active' : 'trace-mode-button'}
            disabled={!selectedTrace}
            onClick={() => setTraceMode('focused')}
          >
            Focused
          </button>
          <button
            type="button"
            className={effectiveTraceMode === 'full' ? 'trace-mode-button active' : 'trace-mode-button'}
            onClick={() => setTraceMode('full')}
          >
            Full
          </button>
          <button
            type="button"
            className={effectiveTraceMode === 'upstream' ? 'trace-mode-button active' : 'trace-mode-button'}
            disabled={!selectedTrace}
            onClick={() => setTraceMode('upstream')}
          >
            Upstream
          </button>
          <button
            type="button"
            className={effectiveTraceMode === 'downstream' ? 'trace-mode-button active' : 'trace-mode-button'}
            disabled={!selectedTrace}
            onClick={() => setTraceMode('downstream')}
          >
            Downstream
          </button>
          </div>
        </div>
      </div>
      ) : null}

      {inspectorTab === 'analyze' ? (
      <ol className="trace-list">
        {traceEntries.map((entry, analysisIndex) => {
          const isNested = (entry.depth ?? 0) > 0;
          const topLevelModuleId = getTopLevelTraceModuleId(entry);
          const nestedPath = getNestedTracePath(entry);
          const roundPath = getIteratorRoundPath(entry);
          const previousRoundPath =
            analysisIndex > 0 ? getIteratorRoundPath(traceEntries[analysisIndex - 1]) : null;
          const isRoundBoundary = roundPath !== null && roundPath !== previousRoundPath;
          const traceIndex = analysisTrace.findIndex(
            (traceEntry) => traceEntry.moduleId === entry.moduleId,
          );
          const topLevelIndex = execution?.trace.findIndex(
            (traceEntry) => traceEntry.moduleId === topLevelModuleId,
          ) ?? -1;

          return (
          <li
            key={entry.moduleId}
            ref={entry.moduleId === tutorialStep?.focusModuleId ? tutorialTraceRef : null}
            className={
              effectiveStepperMode === 'nested' && steppedAnalysisEntry?.moduleId === entry.moduleId
                ? entry.moduleId === tutorialStep?.focusModuleId
                  ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped trace-card-tutorial`
                  : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped`
                : topLevelModuleId === steppedTrace?.moduleId
                ? entry.moduleId === tutorialStep?.focusModuleId
                  ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped trace-card-tutorial`
                  : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped`
                : entry.moduleId === tutorialStep?.focusModuleId
                ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-tutorial`
                : topLevelModuleId === moduleInstance?.id
                ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-active`
                : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''}`
            }
            style={{ marginLeft: `${Math.max(0, (entry.depth ?? 0) * 14)}px` }}
            onMouseEnter={() => onTraceHover(topLevelModuleId)}
            onMouseLeave={() => onTraceHover(null)}
            onClick={() =>
              effectiveStepperMode === 'nested'
                ? setRequestedNestedStepIndex(analysisIndex)
                : onStepChange(topLevelIndex >= 0 ? topLevelIndex : null)
            }
          >
            <div className="trace-head">
              <div className="trace-head-labels">
                <strong>{getDisplayTraceModuleId(entry)}</strong>
                <div className="trace-chip-row">
                  {isNested ? (
                    <span className="trace-nested-chip">Inside {topLevelModuleId}</span>
                  ) : null}
                  {roundPath ? (
                    <span className="trace-round-chip">{formatIteratorRoundLabel(roundPath)}</span>
                  ) : null}
                </div>
              </div>
              <span>
                #{traceIndex >= 0 ? traceIndex + 1 : analysisIndex + 1} {entry.defId}
              </span>
            </div>
            {nestedPath ? <p className="trace-nested-path">{nestedPath}</p> : null}
            <p>
              inputs:{' '}
              {Object.entries(entry.inputs)
                .map(([, signal]) => formatSignal(signal))
                .join(' | ') || 'none'}
            </p>
            <p>
              outputs:{' '}
              {Object.entries(entry.outputs)
                .map(([, signal]) => formatSignal(signal))
                .join(' | ') || 'none'}
            </p>
          </li>
          );
        })}
      </ol>
      ) : null}

      {inspectorTab === 'compare' ? (
        <section className="analysis-section">
          <ComparisonPanel
            embedded
            projectName={projectName}
            baseline={comparisonBaseline}
            baselineOutput={baselineOutput}
            variantOutput={variantOutput}
            baselineError={baselineExecutionError}
            variantError={executionError}
            comparison={executionComparison}
            onCaptureBaseline={onCaptureBaseline}
            onClearBaseline={onClearBaseline}
          />
        </section>
      ) : null}
    </aside>
  );
}

interface RoutingTransformationRow {
  inputIndex: number;
  inputBit: number;
  outputIndex: number;
  outputBit: number;
  inputY: number;
  outputY: number;
  color: string;
  kind: 'line' | 'fill';
}

interface XorTransformationRow {
  index: number;
  aBit: number;
  bBit: number;
  resultBit: number;
  explanation: 'same' | 'different';
}

interface RoutingTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'routing';
  title: string;
  copy: string;
  configLabel: string | null;
  configValue: string | null;
  middleLabel: string;
  rows: RoutingTransformationRow[];
  inputLane: RoutingTransformationRow[];
  outputLane: RoutingTransformationRow[];
  svgHeight: number;
  summary: string;
}

interface XorTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'xor';
  title: string;
  copy: string;
  rows: XorTransformationRow[];
  summary: string;
}

interface CompareTransformationRow {
  index: number;
  aBit: number;
  bBit: number;
  explanation: 'same' | 'different';
}

interface CompareTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'compare';
  title: string;
  copy: string;
  ruleLabel: string;
  ruleValue: string;
  leftValue: number;
  rightValue: number;
  outputBit: number;
  rows: CompareTransformationRow[];
  summary: string;
}

interface GateTransformationRow {
  index: number;
  inputBit: number;
  outputBit: number;
}

interface GateTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'gate';
  title: string;
  copy: string;
  controlValue: number[];
  active: boolean;
  rows: GateTransformationRow[];
  summary: string;
}

interface LookupTransformationChunk {
  index: number;
  inputBits: number[];
  inputValue: number;
  outputValue: number;
  outputBits: number[];
}

interface LookupTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'lookup';
  title: string;
  copy: string;
  chunkWidth: number;
  gridColumns: number;
  table: number[];
  usesHexGrid: boolean;
  activeRowIndex: number | null;
  activeColumnIndex: number | null;
  chunks: LookupTransformationChunk[];
  summary: string;
}

interface SplitTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'split';
  title: string;
  copy: string;
  inputBits: number[];
  leftWidth: number;
  leftBits: number[];
  rightBits: number[];
  summary: string;
}

interface PadTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'pad';
  title: string;
  copy: string;
  inputBits: number[];
  outputBits: number[];
  targetWidth: number;
  side: string;
  padBit: number;
  padCount: number;
  summary: string;
}

type TransformationView =
  | RoutingTransformationView
  | XorTransformationView
  | CompareTransformationView
  | GateTransformationView
  | LookupTransformationView
  | SplitTransformationView
  | PadTransformationView;

const PERMUTATION_EDITOR_PORT_HEIGHT = 52;
const PERMUTATION_EDITOR_PORT_GAP = 10;
const PERMUTATION_EDITOR_HEADER_OFFSET = 22;

function measureWireLayout(
  inputLane: HTMLDivElement | null,
  outputLane: HTMLDivElement | null,
  inputButtons: Array<HTMLButtonElement | null>,
  outputButtons: Array<HTMLButtonElement | null>,
): { height: number; inputYs: number[]; outputYs: number[] } | null {
  if (!inputLane || !outputLane) {
    return null;
  }

  const inputLaneRect = inputLane.getBoundingClientRect();
  const outputLaneRect = outputLane.getBoundingClientRect();
  const inputYs = inputButtons
    .map((button) =>
      button
        ? button.getBoundingClientRect().top - inputLaneRect.top + button.getBoundingClientRect().height / 2
        : null,
    )
    .filter((value): value is number => value !== null);
  const outputYs = outputButtons
    .map((button) =>
      button
        ? button.getBoundingClientRect().top - outputLaneRect.top + button.getBoundingClientRect().height / 2
        : null,
    )
    .filter((value): value is number => value !== null);

  if (inputYs.length === 0 || outputYs.length === 0) {
    return null;
  }

  return {
    height: Math.max(inputLaneRect.height, outputLaneRect.height),
    inputYs,
    outputYs,
  };
}

function getTransformationView(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): TransformationView | null {
  if (entry.defId === 'Permutation' || entry.defId === 'PermutationBits') {
    return getPermutationTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitShifter') {
    return getBitShifterTransformation(entry, project, registry);
  }
  if (entry.defId === 'XOR') {
    return getXorTransformation(entry);
  }
  if (entry.defId === 'Equals' || entry.defId === 'AtLeast') {
    return getCompareTransformation(entry);
  }
  if (entry.defId === 'Gate') {
    return getGateTransformation(entry);
  }
  if (entry.defId === 'SBox') {
    return getSBoxTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitSplit') {
    return getSplitTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitPad') {
    return getPadTransformation(entry, project, registry);
  }
  return null;
}

function stepHexString(value: string, delta: -1 | 1): string {
  const normalized = value.trim().replace(/\s+/g, '').toUpperCase();
  const width = Math.max(2, normalized.length || 0);
  const modulus = 16 ** width;
  const currentValue =
    normalized.length === 0 ? 0 : Number.parseInt(normalized, 16);

  if (!Number.isFinite(currentValue)) {
    return '00';
  }

  const nextValue = (currentValue + delta + modulus) % modulus;
  return nextValue.toString(16).toUpperCase().padStart(width, '0');
}

function getPermutationTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const orderValue = resolved.instance.params.order;
  const order = parsePermutationOrder(orderValue);
  const inputSignal = entry.inputs.in;
  const outputSignal = entry.outputs.out;
  if (inputSignal?.type !== 'bits' || outputSignal?.type !== 'bits') {
    return null;
  }

  const rows = order.map((sourceIndex, outputIndex) => ({
    inputIndex: sourceIndex,
    inputBit: inputSignal.value[sourceIndex] ?? 0,
    outputIndex,
    outputBit: outputSignal.value[outputIndex] ?? 0,
    kind: 'line' as const,
  }));
  const inputLane = [...rows].sort((left, right) => left.inputIndex - right.inputIndex);
  const outputLane = [...rows].sort((left, right) => left.outputIndex - right.outputIndex);
  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(laneHeight, rows.length * laneHeight + Math.max(0, rows.length - 1) * laneGap);
  const rowsWithPositions = rows.map((row) => ({
    ...row,
    inputY: laneOffset + inputLane.findIndex((candidate) => candidate.inputIndex === row.inputIndex) * laneStep,
    outputY:
      laneOffset + outputLane.findIndex((candidate) => candidate.outputIndex === row.outputIndex) * laneStep,
    color: getPermutationWireColor(row.inputIndex),
  }));

  const inputLaneRows = [...rowsWithPositions].sort((left, right) => left.inputIndex - right.inputIndex);
  const outputLaneRows = [...rowsWithPositions].sort((left, right) => left.outputIndex - right.outputIndex);

  return {
    entry,
    kind: 'routing',
    title: 'Permutation Mapping',
    copy: 'This permutation reorders bit positions without changing the bit values themselves.',
    configLabel: 'Order',
    configValue: order.join(', '),
    middleLabel: 'Route',
    rows: rowsWithPositions,
    inputLane: inputLaneRows,
    outputLane: outputLaneRows,
    svgHeight,
    summary:
      rows.length === 0
        ? 'This permutation has no visible positions to remap.'
        : `Output position 0 reads input position ${rows[0]?.inputIndex}. Each wire shows where one input position lands in the output.`,
  };
}

function getBitShifterTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const amountValue = resolved.instance.params.amount;
  const modeValue = resolved.instance.params.mode;
  const amount =
    typeof amountValue === 'number' && Number.isFinite(amountValue)
      ? Math.max(0, Math.trunc(amountValue))
      : 0;
  const mode =
    typeof modeValue === 'string' ? modeValue : 'left';
  const inputSignal = entry.inputs.in;
  const outputSignal = entry.outputs.out;
  if (inputSignal?.type !== 'bits' || outputSignal?.type !== 'bits') {
    return null;
  }

  const bitLength = Math.max(inputSignal.value.length, outputSignal.value.length);
  if (bitLength === 0) {
    return null;
  }

  const rows: RoutingTransformationRow[] = [];
  for (let outputIndex = 0; outputIndex < outputSignal.value.length; outputIndex += 1) {
    const sourceIndex = getBitShifterSourceIndex(outputIndex, inputSignal.value.length, amount, mode);
    rows.push({
      inputIndex: sourceIndex ?? outputIndex,
      inputBit: sourceIndex === null ? 0 : inputSignal.value[sourceIndex] ?? 0,
      outputIndex,
      outputBit: outputSignal.value[outputIndex] ?? 0,
      inputY: 0,
      outputY: 0,
      color: sourceIndex === null ? 'var(--muted)' : getPermutationWireColor(sourceIndex),
      kind: sourceIndex === null ? 'fill' : 'line',
    });
  }

  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(
    laneHeight,
    outputSignal.value.length * laneHeight + Math.max(0, outputSignal.value.length - 1) * laneGap,
  );

  const rowsWithPositions = rows.map((row) => ({
    ...row,
    inputY: row.kind === 'fill' ? laneOffset + row.outputIndex * laneStep : laneOffset + row.inputIndex * laneStep,
    outputY: laneOffset + row.outputIndex * laneStep,
  }));

  const inputLane = inputSignal.value.map((inputBit, inputIndex) => {
    const row = rowsWithPositions.find((candidate) => candidate.inputIndex === inputIndex && candidate.kind === 'line');
    return {
      inputIndex,
      inputBit,
      outputIndex: row?.outputIndex ?? inputIndex,
      outputBit: row?.outputBit ?? 0,
      inputY: laneOffset + inputIndex * laneStep,
      outputY: row?.outputY ?? laneOffset + inputIndex * laneStep,
      color: row?.color ?? getPermutationWireColor(inputIndex),
      kind: 'line' as const,
    };
  });
  const outputLane = [...rowsWithPositions].sort((left, right) => left.outputIndex - right.outputIndex);

  return {
    entry,
    kind: 'routing',
    title: 'Bit Shift Mapping',
    copy:
      mode === 'rotate-left' || mode === 'rotate-right'
        ? 'This shifter rotates positions, so bits wrap around instead of dropping off the edge.'
        : 'This shifter moves positions and fills the opened edge with zero bits.',
    configLabel: 'Mode / Amount',
    configValue: `${formatBitShifterMode(mode)} · ${amount}`,
    middleLabel: mode.startsWith('rotate') ? 'Wrap' : 'Shift',
    rows: rowsWithPositions,
    inputLane,
    outputLane,
    svgHeight,
    summary: getBitShifterSummary(mode, amount, rowsWithPositions),
  };
}

function getXorTransformation(entry: ExecutionTraceEntry): XorTransformationView | null {
  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const output = entry.outputs.out;
  if (inputA?.type !== 'bits' || inputB?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const length = Math.min(inputA.value.length, inputB.value.length, output.value.length);
  const rows: XorTransformationRow[] = [];
  for (let index = 0; index < length; index += 1) {
    const aBit = inputA.value[index] ?? 0;
    const bBit = inputB.value[index] ?? 0;
    const resultBit = output.value[index] ?? 0;
    rows.push({
      index,
      aBit,
      bBit,
      resultBit,
      explanation: aBit === bBit ? 'same' : 'different',
    });
  }

  const differentCount = rows.filter((row) => row.resultBit === 1).length;
  return {
    entry,
    kind: 'xor',
    title: 'Exclusive-Or Comparison',
    copy:
      'XOR compares two input bits at the same position. When exactly one input is 1, the output becomes 1. When both inputs match, the output becomes 0.',
    rows,
    summary:
      rows.length === 0
        ? 'This XOR has no overlapping bit positions to compare.'
        : `${differentCount} of ${rows.length} bit pair${rows.length === 1 ? '' : 's'} differ. XOR outputs 1 only where the two inputs disagree.`,
  };
}

function getCompareTransformation(entry: ExecutionTraceEntry): CompareTransformationView | null {
  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const output = entry.outputs.out;
  if (inputA?.type !== 'bits' || inputB?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const length = Math.min(inputA.value.length, inputB.value.length);
  const rows: CompareTransformationRow[] = [];
  for (let index = 0; index < length; index += 1) {
    const aBit = inputA.value[index] ?? 0;
    const bBit = inputB.value[index] ?? 0;
    rows.push({
      index,
      aBit,
      bBit,
      explanation: aBit === bBit ? 'same' : 'different',
    });
  }

  const leftValue = bitsToNumber(inputA.value);
  const rightValue = bitsToNumber(inputB.value);
  const outputBit = output.value[0] ?? 0;
  const isEquality = entry.defId === 'Equals';

  return {
    entry,
    kind: 'compare',
    title: isEquality ? 'Equality Comparison' : 'Threshold Comparison',
    copy: isEquality
      ? 'Equals checks whether two same-width bit words match exactly, then emits a one-bit control result.'
      : 'AtLeast reads both inputs as fixed-width unsigned words, then emits a one-bit control result when the left word has reached or exceeded the right one.',
    ruleLabel: 'Rule',
    ruleValue: isEquality ? 'A == B -> [1], else [0]' : 'A >= B -> [1], else [0]',
    leftValue,
    rightValue,
    outputBit,
    rows,
    summary: isEquality
      ? outputBit === 1
        ? `The two ${length}-bit words match exactly, so the control output is active.`
        : `At least one bit differs, so the equality control output stays inactive.`
      : outputBit === 1
        ? `${leftValue} has reached or exceeded ${rightValue}, so the threshold output is active.`
        : `${leftValue} is still below ${rightValue}, so the threshold output stays inactive.`,
  };
}

function getGateTransformation(entry: ExecutionTraceEntry): GateTransformationView | null {
  const input = entry.inputs.in;
  const control = entry.inputs.control;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || control?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const rows: GateTransformationRow[] = output.value.map((outputBit, index) => ({
    index,
    inputBit: input.value[index] ?? 0,
    outputBit,
  }));
  const active = control.value.length === 1 && control.value[0] === 1;

  return {
    entry,
    kind: 'gate',
    title: 'Pulse Gate',
    copy:
      'Gate lets a bit signal through only when the control input is the active pulse [1]. Otherwise it outputs a zero-filled word of the same width.',
    controlValue: control.value,
    active,
    rows,
    summary: active
      ? 'The control pulse is active, so the gate passes the incoming word through unchanged.'
      : 'The control pulse is inactive, so the gate blocks the word and emits zeros instead.',
  };
}

function getSBoxTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): LookupTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const inputSignal = entry.inputs.in;
  const outputSignal = entry.outputs.out;
  if (inputSignal?.type !== 'bits' || outputSignal?.type !== 'bits') {
    return null;
  }

  const table = parseSBoxTable(resolved.instance.params.table);
  const chunkWidth = inferLookupChunkWidth(table.length);
  if (chunkWidth < 1 || inputSignal.value.length % chunkWidth !== 0) {
    return null;
  }

  const chunks: LookupTransformationChunk[] = [];
  for (let start = 0; start < inputSignal.value.length; start += chunkWidth) {
    const inputBits = inputSignal.value.slice(start, start + chunkWidth);
    const outputBits = outputSignal.value.slice(start, start + chunkWidth);
    const inputValue = bitsToNumber(inputBits);
    const outputValue = bitsToNumber(outputBits);
    chunks.push({
      index: start / chunkWidth,
      inputBits,
      inputValue,
      outputValue,
      outputBits,
    });
  }

  const gridColumns = Math.sqrt(table.length);

  return {
    entry,
    kind: 'lookup',
    title: 'Substitution Lookup',
    copy:
      'SBox groups bits into fixed-width chunks, reads each chunk as a number, and substitutes it with the table value stored at that index.',
    chunkWidth,
    gridColumns: Number.isInteger(gridColumns) ? gridColumns : Math.min(table.length, 16),
    table,
    usesHexGrid: chunkWidth >= 8 && Number.isInteger(gridColumns) && gridColumns === 16,
    activeRowIndex:
      chunkWidth >= 8 && Number.isInteger(gridColumns) && gridColumns === 16 && chunks.length > 0
        ? Math.floor(chunks[0].inputValue / gridColumns)
        : null,
    activeColumnIndex:
      chunkWidth >= 8 && Number.isInteger(gridColumns) && gridColumns === 16 && chunks.length > 0
        ? chunks[0].inputValue % gridColumns
        : null,
    chunks,
    summary:
      chunks.length === 1
        ? 'This S-Box replaces one grouped value with another by table lookup.'
        : `This S-Box processes ${chunks.length} grouped chunks independently, using the same substitution table for each chunk.`,
  };
}

function getSplitTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): SplitTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const left = entry.outputs.left;
  const right = entry.outputs.right;
  if (input?.type !== 'bits' || left?.type !== 'bits' || right?.type !== 'bits') {
    return null;
  }

  const leftWidth = left.value.length;

  return {
    entry,
    kind: 'split',
    title: 'Block Split',
    copy:
      'BitSplit divides one bit vector into two sub-blocks at the configured left width. The first leftWidth bits become the left output, and the remaining bits become the right output.',
    inputBits: input.value,
    leftWidth,
    leftBits: left.value,
    rightBits: right.value,
    summary: `A ${input.value.length}-bit input was split into a ${leftWidth}-bit left block and a ${input.value.length - leftWidth}-bit right block.`,
  };
}

function getPadTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): PadTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const targetWidth = typeof resolved.instance.params.targetWidth === 'number'
    ? resolved.instance.params.targetWidth
    : output.value.length;
  const side = resolved.instance.params.side === 'left' ? 'left' : 'right';
  const padBit = resolved.instance.params.padBit === '1' ? 1 : 0;
  const padCount = Math.max(0, output.value.length - input.value.length);

  return {
    entry,
    kind: 'pad',
    title: 'Block Pad',
    copy:
      'BitPad extends a bit vector to a target width by appending or prepending a chosen pad bit. If the input already meets the target, it passes through unchanged.',
    inputBits: input.value,
    outputBits: output.value,
    targetWidth,
    side,
    padBit,
    padCount,
    summary: padCount > 0
      ? `${padCount} ${padBit === 0 ? 'zero' : 'one'} bit${padCount === 1 ? '' : 's'} ${side === 'left' ? 'prepended' : 'appended'} to reach ${output.value.length} bits.`
      : `Input already meets the target width (${output.value.length} bits), so no padding was added.`,
  };
}

function parsePermutationOrder(value: unknown): number[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isInteger(part) && part >= 0);
}

function getPermutationWireColor(index: number) {
  const hue = (index * 47) % 360;
  return `hsl(${hue} 72% 54%)`;
}

function getBitShifterSourceIndex(
  outputIndex: number,
  bitLength: number,
  amount: number,
  mode: string,
) {
  switch (mode) {
    case 'left':
      return outputIndex + amount < bitLength ? outputIndex + amount : null;
    case 'right':
      return outputIndex - amount >= 0 ? outputIndex - amount : null;
    case 'rotate-left':
      return bitLength === 0 ? null : (outputIndex + (amount % bitLength)) % bitLength;
    case 'rotate-right':
      if (bitLength === 0) {
        return null;
      }
      return (outputIndex - (amount % bitLength) + bitLength) % bitLength;
    default:
      return null;
  }
}

function formatBitShifterMode(mode: string) {
  switch (mode) {
    case 'left':
      return 'Shift Left';
    case 'right':
      return 'Shift Right';
    case 'rotate-left':
      return 'Rotate Left';
    case 'rotate-right':
      return 'Rotate Right';
    default:
      return mode;
  }
}

function getBitShifterSummary(mode: string, amount: number, rows: RoutingTransformationRow[]) {
  const fillCount = rows.filter((row) => row.kind === 'fill').length;
  if (mode === 'rotate-left' || mode === 'rotate-right') {
    return `Every output position pulls from another input position. A ${formatBitShifterMode(mode).toLowerCase()} by ${amount} wraps bits around the far edge instead of discarding them.`;
  }

  return fillCount === 0
    ? `This shift moves every visible bit by ${amount} position${amount === 1 ? '' : 's'} without opening a zero-filled edge.`
    : `${fillCount} output position${fillCount === 1 ? '' : 's'} are zero-filled because a plain ${formatBitShifterMode(mode).toLowerCase()} shift drops bits off one edge and opens space on the other.`;
}

function inferLookupChunkWidth(entryCount: number) {
  const width = Math.log2(entryCount);
  return Number.isInteger(width) && width > 0 ? width : 0;
}

function bitsToNumber(bits: number[]) {
  return bits.reduce((value, bit) => (value << 1) | bit, 0);
}

function formatSBoxAxisLabel(value: number, gridColumns: number) {
  return gridColumns >= 16 ? value.toString(16).toUpperCase() : String(value);
}

function formatSBoxHexValue(value: number, chunkWidth: number) {
  const digits = Math.max(1, Math.ceil(chunkWidth / 4));
  return value.toString(16).toUpperCase().padStart(digits, '0');
}

function getEditablePermutationOrder(value: unknown): number[] | null {
  try {
    return parsePermutationOrder(value);
  } catch {
    return null;
  }
}

function getEditableReflectorWiring(value: unknown): string[] | null {
  try {
    return parseReflectorWiring(value);
  } catch {
    return null;
  }
}

function getEditablePlugboardWiring(value: unknown): string[] | null {
  try {
    return parsePlugboardWiring(value);
  } catch {
    return null;
  }
}

function getEditableRotorWiring(value: unknown): string[] | null {
  return Array.isArray(value) &&
    value.length === 26 &&
    value.every((entry) => typeof entry === 'string' && /^[A-Z]$/.test(entry))
    ? (value as string[])
    : null;
}

function isSimplePermutationOrder(order: number[]) {
  if (order.length === 0) {
    return false;
  }

  const sorted = [...order].sort((left, right) => left - right);
  return sorted.every((value, index) => value === index);
}

const REFLECTOR_PAIR_PALETTE = [
  { accent: '#2F6FB3' },
  { accent: '#2C8C73' },
  { accent: '#B86A2F' },
  { accent: '#7A5CC7' },
  { accent: '#B24C6B' },
  { accent: '#5E8D3A' },
  { accent: '#C08A1B' },
  { accent: '#3C7E9E' },
  { accent: '#9B5D8C' },
  { accent: '#8F6B38' },
  { accent: '#4466C1' },
  { accent: '#A15434' },
  { accent: '#4E8A8C' },
];

function getPairKey(left: string, right: string) {
  return [left, right].sort().join('-');
}

function buildPairStyles(
  wiring: string[],
  options?: { includeSelfPairs?: boolean },
) {
  const includeSelfPairs = options?.includeSelfPairs ?? true;
  const uniquePairKeys = [
    ...new Set(
      wiring
        .map((target, index) => [String.fromCharCode(65 + index), target] as const)
        .filter(([source, target]) => includeSelfPairs || source !== target)
        .map(([source, target]) => getPairKey(source, target)),
    ),
  ];
  uniquePairKeys.sort();

  return Object.fromEntries(
    uniquePairKeys.map((pairKey, index) => {
      const palette = REFLECTOR_PAIR_PALETTE[index % REFLECTOR_PAIR_PALETTE.length];
      return [
        pairKey,
        ({
          '--reflector-pair-accent': palette.accent,
        } as CSSProperties),
      ];
    }),
  ) as Record<string, CSSProperties>;
}

function getEditableSBoxTable(value: unknown): number[] | null {
  try {
    return parseSBoxTable(value);
  } catch {
    return null;
  }
}

function humanizeIssueCode(code: ValidationIssue['code']) {
  return code
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function getIssueTargetModuleId(issue: ValidationIssue) {
  return issue.moduleId ?? issue.connection?.to.moduleId ?? issue.connection?.from.moduleId ?? null;
}

function getTraceEntries(args: {
  execution: ExecutionResult | null;
  project: Project;
  selectedModuleId: string | null;
  traceMode: 'focused' | 'upstream' | 'downstream' | 'full';
  focusedRoundPath: string;
}) {
  const { execution, project, selectedModuleId, traceMode, focusedRoundPath } = args;
  if (!execution) {
    return [];
  }

  const analysisTrace = execution.analysisTrace ?? execution.trace;
  const roundFilteredTrace =
    focusedRoundPath === 'all'
      ? analysisTrace
      : analysisTrace.filter((entry) => isEntryInsideRound(entry, focusedRoundPath));

  if (!selectedModuleId || traceMode === 'full') {
    return roundFilteredTrace;
  }

  if (traceMode === 'focused') {
    return roundFilteredTrace.filter(
      (entry) =>
        entry.moduleId === selectedModuleId ||
        entry.moduleId.startsWith(`${selectedModuleId}/`),
    );
  }

  const relatedModuleIds =
    traceMode === 'upstream'
      ? collectReachableModules(project.connections, selectedModuleId, 'upstream')
      : collectReachableModules(project.connections, selectedModuleId, 'downstream');

  relatedModuleIds.add(selectedModuleId);
  return roundFilteredTrace.filter((entry) =>
    [...relatedModuleIds].some(
      (moduleId) =>
        entry.moduleId === moduleId ||
        entry.moduleId.startsWith(`${moduleId}/`),
    ),
  );
}

function getIteratorRoundOptions(analysisTrace: ExecutionTraceEntry[], iteratorModuleId: string) {
  const seen = new Set<string>();
  const options: { path: string; label: string }[] = [];
  const prefix = `${iteratorModuleId}/round-`;

  for (const entry of analysisTrace) {
    if (!entry.moduleId.startsWith(prefix)) {
      continue;
    }

    const parts = entry.moduleId.split('/');
    const roundIndex = parts.findIndex((part) => /^round-\d+$/.test(part));
    const roundPart = roundIndex >= 0 ? parts[roundIndex] : null;
    if (!roundPart) {
      continue;
    }

    const path = parts.slice(0, roundIndex + 1).join('/');
    if (seen.has(path)) {
      continue;
    }

    seen.add(path);
    options.push({
      path,
      label: roundPart.replace('round-', 'Round '),
    });
  }

  return options.sort((left, right) => left.path.localeCompare(right.path, undefined, { numeric: true }));
}

function isEntryInsideRound(entry: ExecutionTraceEntry, focusedRoundPath: string) {
  return (
    entry.moduleId === focusedRoundPath ||
    entry.moduleId.startsWith(`${focusedRoundPath}/`)
  );
}

function getTopLevelTraceModuleId(entry: ExecutionTraceEntry) {
  return entry.moduleId.split('/')[0] ?? entry.moduleId;
}

function getDisplayTraceModuleId(entry: ExecutionTraceEntry) {
  const parts = entry.moduleId.split('/');
  return parts[parts.length - 1] ?? entry.moduleId;
}

function getNestedTracePath(entry: ExecutionTraceEntry) {
  const parts = entry.moduleId.split('/');
  if (parts.length <= 1) {
    return null;
  }

  return parts.slice(0, -1).join(' / ');
}

function getIteratorRoundPath(entry: ExecutionTraceEntry) {
  const parts = entry.moduleId.split('/');
  const roundIndex = parts.findIndex((part) => /^round-\d+$/.test(part));
  if (roundIndex < 0) {
    return null;
  }

  return parts.slice(0, roundIndex + 1).join('/');
}

function formatIteratorRoundLabel(roundPath: string) {
  const roundPart = roundPath.split('/').find((part) => /^round-\d+$/.test(part));
  return roundPart ? roundPart.replace('round-', 'Round ') : 'Round';
}

function collectReachableModules(
  connections: Connection[],
  originModuleId: string,
  direction: 'upstream' | 'downstream',
) {
  const visited = new Set<string>();
  const queue = [originModuleId];

  while (queue.length > 0) {
    const moduleId = queue.shift();
    if (!moduleId) {
      continue;
    }

    for (const connection of connections) {
      const nextModuleId =
        direction === 'upstream'
          ? connection.to.moduleId === moduleId
            ? connection.from.moduleId
            : null
          : connection.from.moduleId === moduleId
            ? connection.to.moduleId
            : null;

      if (!nextModuleId || visited.has(nextModuleId)) {
        continue;
      }

      visited.add(nextModuleId);
      queue.push(nextModuleId);
    }
  }

  return visited;
}

function groupIssuesByTarget(issues: ValidationIssue[]) {
  const groups = new Map<
    string,
    { targetModuleId: string | null; title: string; messages: string[] }
  >();

  for (const issue of issues) {
    const targetModuleId = getIssueTargetModuleId(issue);
    const key = `${targetModuleId ?? 'global'}:${issue.code}`;
    const existing = groups.get(key);
    if (existing) {
      if (!existing.messages.includes(issue.message)) {
        existing.messages.push(issue.message);
      }
      continue;
    }

    groups.set(key, {
      targetModuleId,
      title: humanizeIssueCode(issue.code),
      messages: [issue.message],
    });
  }

  return [...groups.values()];
}

function areParamValuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
