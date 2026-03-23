import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  Connection,
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleDefinition,
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

interface ParameterInspectorProps {
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
  const steppedTrace = stepIndex !== null ? execution?.trace[stepIndex] ?? null : null;
  const tutorialTraceEntry = tutorialStep?.focusModuleId
    ? execution?.trace.find((entry) => entry.moduleId === tutorialStep.focusModuleId) ?? null
    : null;
  const tutorialTraceIndex = tutorialTraceEntry
    ? (execution?.trace.findIndex((entry) => entry.moduleId === tutorialTraceEntry.moduleId) ?? -1) + 1
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
            <div className="stepper-actions">
              <button
                type="button"
                className="trace-mode-button"
                disabled={stepIndex === null || stepIndex <= 0}
                onClick={() => onStepChange(stepIndex === null ? 0 : Math.max(0, stepIndex - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="trace-mode-button"
                onClick={() =>
                  onStepChange(
                    stepIndex === null
                      ? 0
                      : Math.min(execution.trace.length - 1, stepIndex + 1),
                  )
                }
              >
                {stepIndex === null ? 'Start' : 'Next'}
              </button>
              <button
                type="button"
                className="trace-mode-button"
                disabled={stepIndex === null}
                onClick={() => onStepChange(null)}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="selected-trace">
            <span className="meta-label">Current Step</span>
            {steppedTrace ? (
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

                if (field.kind === 'boolean') {
                  return (
                    <label key={field.key} className="param-field">
                      <span>{field.label}</span>
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
                      <span>{field.label}</span>
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
                      <span>{field.label}</span>
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
                      <span>{field.label}</span>
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
                    <span>{field.label}</span>
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
              topLevelModuleId === steppedTrace?.moduleId
                ? entry.moduleId === tutorialStep?.focusModuleId
                  ? `trace-card${isNested ? ' trace-card-nested' : ''} trace-card-stepped trace-card-tutorial`
                  : `trace-card${isNested ? ' trace-card-nested' : ''} trace-card-stepped`
                : entry.moduleId === tutorialStep?.focusModuleId
                ? `trace-card${isNested ? ' trace-card-nested' : ''} trace-card-tutorial`
                : topLevelModuleId === moduleInstance?.id
                ? `trace-card${isNested ? ' trace-card-nested' : ''} trace-card-active`
                : `trace-card${isNested ? ' trace-card-nested' : ''}`
            }
            style={{ marginLeft: `${Math.max(0, (entry.depth ?? 0) * 14)}px` }}
            onMouseEnter={() => onTraceHover(topLevelModuleId)}
            onMouseLeave={() => onTraceHover(null)}
            onClick={() =>
              onStepChange(topLevelIndex >= 0 ? topLevelIndex : null)
            }
          >
            <div className="trace-head">
              <div className="trace-head-labels">
                <strong>{getDisplayTraceModuleId(entry)}</strong>
                {isNested ? (
                  <span className="trace-nested-chip">Inside {topLevelModuleId}</span>
                ) : null}
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
