import type { ReactNode } from 'react';

import type { ExecutionResult, ExecutionTraceEntry, ModuleInstance } from '../../engine/types';
import type { TutorialStep } from '../tutorials';
import {
  formatIteratorRoundLabel,
  getDisplayTraceModuleId,
  getIteratorRoundPath,
} from '../inspector-analysis';
import { formatSignalCompact } from '../formatters';

interface CollapsedAnalyzeSections {
  tick: boolean;
  selectedIssues: boolean;
  graphIssues: boolean;
  traceList: boolean;
  pinned: boolean;
  tutorial: boolean;
  transformation: boolean;
  sboxProperties: boolean;
  permutationProperties: boolean;
  lfsrProperties: boolean;
  plugboardProperties: boolean;
  reflectorProperties: boolean;
  modulusProperties: boolean;
}

function InspectorSection({
  label,
  collapsible = false,
  collapsed = false,
  onToggle,
  children,
}: {
  label: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`analysis-section${collapsed ? ' analysis-section-collapsed' : ''}`}>
      <div className="analysis-section-head">
        <span className="meta-label">{label}</span>
        {collapsible ? (
          <button
            type="button"
            className="collapse-toggle-button analysis-section-toggle"
            aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
            title={collapsed ? `Expand ${label}` : `Collapse ${label}`}
            onClick={onToggle}
          >
            {collapsed ? '+' : '\u2212'}
          </button>
        ) : null}
      </div>
      {!collapsed ? children : null}
    </section>
  );
}

interface InspectorAnalyzeViewProps {
  execution: ExecutionResult | null;
  moduleInstance: ModuleInstance | null;
  isTickedMode: boolean;
  currentTick: number;
  tickCount: number;
  tickedParamsByModule: Record<string, Record<string, unknown>[]> | null;
  tickHistoryByModule: Record<string, string[]> | null;
  collapsedAnalyzeSections: CollapsedAnalyzeSections;
  toggleAnalyzeSection: (key: keyof CollapsedAnalyzeSections) => void;
  canUseNestedStepper: boolean;
  effectiveStepperMode: 'top-level' | 'nested';
  effectiveNestedStepIndex: number | null;
  traceEntries: ExecutionTraceEntry[];
  steppedAnalysisEntry: ExecutionTraceEntry | null;
  steppedTrace: ExecutionTraceEntry | null;
  stepIndex: number | null;
  setRequestedStepperMode: (mode: 'top-level' | 'nested') => void;
  setRequestedNestedStepIndex: (next: number | null) => void;
  onStepChange: (nextIndex: number | null) => void;
  probedModuleIds: string[];
  onClearProbes: () => void;
  onToggleProbe: (moduleId: string) => void;
  tutorialStep: TutorialStep | null;
  tutorialTraceIndex: number | null;
}

export function InspectorAnalyzeView({
  execution,
  moduleInstance,
  isTickedMode,
  currentTick,
  tickCount,
  tickedParamsByModule,
  tickHistoryByModule,
  collapsedAnalyzeSections,
  toggleAnalyzeSection,
  canUseNestedStepper,
  effectiveStepperMode,
  effectiveNestedStepIndex,
  traceEntries,
  steppedAnalysisEntry,
  steppedTrace,
  stepIndex,
  setRequestedStepperMode,
  setRequestedNestedStepIndex,
  onStepChange,
  probedModuleIds,
  onClearProbes,
  onToggleProbe,
  tutorialStep,
  tutorialTraceIndex,
}: InspectorAnalyzeViewProps) {
  return (
    <>
      {isTickedMode && tickCount > 0 && moduleInstance ? (
        <InspectorSection
          label="Tick"
          collapsible
          collapsed={collapsedAnalyzeSections.tick}
          onToggle={() => toggleAnalyzeSection('tick')}
        >
          <p className="tick-state-summary">
            Tick <strong>{currentTick + 1}</strong> of <strong>{tickCount}</strong>
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
                    <span className="tick-param-value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
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
                        start + index === currentTick ? 'tick-history-chip active' : 'tick-history-chip'
                      }
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </>
            );
          })() : null}
        </InspectorSection>
      ) : null}

      {execution && execution.trace.length > 0 ? (
        <InspectorSection label="Stepper">
          <div className="stepper-head">
            <div className="stepper-controls">
              {canUseNestedStepper ? (
                <div className="trace-mode-toggle">
                  <button
                    type="button"
                    className={effectiveStepperMode === 'top-level' ? 'trace-mode-button active' : 'trace-mode-button'}
                    onClick={() => setRequestedStepperMode('top-level')}
                  >
                    Top-Level
                  </button>
                  <button
                    type="button"
                    className={effectiveStepperMode === 'nested' ? 'trace-mode-button active' : 'trace-mode-button'}
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
                        effectiveNestedStepIndex === null ? 0 : Math.max(0, effectiveNestedStepIndex - 1),
                      );
                      return;
                    }
                    onStepChange(stepIndex === null ? 0 : Math.max(0, stepIndex - 1));
                  }}
                  title="Previous step ([)"
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
                    onStepChange(stepIndex === null ? 0 : Math.min(execution.trace.length - 1, stepIndex + 1));
                  }}
                  title="Next step (])"
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
                  disabled={effectiveStepperMode === 'nested' ? effectiveNestedStepIndex === null : stepIndex === null}
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
            <span className="meta-label">Step</span>
            {effectiveStepperMode === 'nested' ? (
              steppedAnalysisEntry ? (
                <>
                  <p className="selected-trace-order">
                    Nested step {effectiveNestedStepIndex! + 1} of {traceEntries.length}
                  </p>
                  <p>
                    Module: <strong>{getDisplayTraceModuleId(steppedAnalysisEntry)}</strong> ({steppedAnalysisEntry.defId})
                  </p>
                  {getIteratorRoundPath(steppedAnalysisEntry) ? (
                    <p>
                      Round:{' '}
                      <strong>{formatIteratorRoundLabel(getIteratorRoundPath(steppedAnalysisEntry) ?? '')}</strong>
                    </p>
                  ) : null}
                  <p>
                    Inputs:{' '}
                    {Object.entries(steppedAnalysisEntry.inputs)
                      .map(([, signal]) => formatSignalCompact(signal))
                      .join(' | ') || 'none'}
                  </p>
                  <p>
                    Outputs:{' '}
                    {Object.entries(steppedAnalysisEntry.outputs)
                      .map(([, signal]) => formatSignalCompact(signal))
                      .join(' | ') || 'none'}
                  </p>
                </>
              ) : (
                <p className="empty-state">
                  Start stepping to walk the visible nested analysis trace one internal module at a time.
                </p>
              )
            ) : steppedTrace ? (
              <>
                <p className="selected-trace-order">
                  Step {stepIndex! + 1} of {execution.trace.length}
                </p>
                <p>
                  Module: <strong>{steppedTrace.moduleId}</strong> ({steppedTrace.defId})
                </p>
                <p>
                  Inputs:{' '}
                  {Object.entries(steppedTrace.inputs)
                    .map(([, signal]) => formatSignalCompact(signal))
                    .join(' | ') || 'none'}
                </p>
                <p>
                  Outputs:{' '}
                  {Object.entries(steppedTrace.outputs)
                    .map(([, signal]) => formatSignalCompact(signal))
                    .join(' | ') || 'none'}
                </p>
              </>
            ) : (
              <p className="empty-state">Start stepping to walk the execution order one module at a time.</p>
            )}
          </div>
        </InspectorSection>
      ) : null}

      {probedModuleIds.length > 0 ? (
        <InspectorSection
          label="Pinned"
          collapsible
          collapsed={collapsedAnalyzeSections.pinned}
          onToggle={() => toggleAnalyzeSection('pinned')}
        >
          <div className="probe-head">
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
                        In:{' '}
                        {Object.entries(probeTrace.inputs)
                          .map(([, signal]) => formatSignalCompact(signal))
                          .join(' | ') || 'none'}
                      </p>
                      <p>
                        Out:{' '}
                        {Object.entries(probeTrace.outputs)
                          .map(([, signal]) => formatSignalCompact(signal))
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
        </InspectorSection>
      ) : null}

      {tutorialStep ? (
        <InspectorSection
          label="Tutorial"
          collapsible
          collapsed={collapsedAnalyzeSections.tutorial}
          onToggle={() => toggleAnalyzeSection('tutorial')}
        >
          <div className="tutorial-analysis-card">
            <strong>{tutorialStep.title}</strong>
            <p>{tutorialStep.body}</p>
            {tutorialStep.focusModuleId ? (
              <p className="tutorial-analysis-target">
                Focus: <strong>{tutorialStep.focusModuleId}</strong>
                {tutorialTraceIndex ? ` • Trace step ${tutorialTraceIndex}` : ''}
              </p>
            ) : (
              <p className="tutorial-analysis-target">
                This step explains the machine at a higher level instead of a single module.
              </p>
            )}
          </div>
        </InspectorSection>
      ) : null}
    </>
  );
}
