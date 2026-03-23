import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

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
import { parseSBoxTable } from '../../engine/modules/s-box';

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
          <button
            type="button"
            className="delete-module-button"
            onClick={() => onDeleteModule(moduleInstance.id)}
          >
            Delete Module
          </button>

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

type TransformationView =
  | RoutingTransformationView
  | XorTransformationView
  | LookupTransformationView;

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
  if (entry.defId === 'SBox') {
    return getSBoxTransformation(entry, project, registry);
  }
  return null;
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
