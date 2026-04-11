import type { Signal } from '../../engine/types';
import type { ModuleRegistry, Project } from '../../engine/types';
import type { ComparisonBaselineDocument } from '../workbench-document';
import type { ExecutionComparison } from '../execution-compare';
import type {
  SinkRepresentation,
  SinkRepresentationOption,
} from '../sink-representations';
import type {
  VerificationCase,
  VerificationCaseResult,
  VerificationSourceOption,
} from '../verification-workflow';
import { formatSignal } from '../formatters';
import { ComparisonPanel } from './comparison-panel';

export interface OutputSummaryItem {
  moduleId: string;
  signal: Signal | undefined;
  representationOptions: SinkRepresentationOption[];
  effectiveRepresentation: SinkRepresentation;
  effectiveRepresentationOption: SinkRepresentationOption | null;
}

interface InspectorOutputSummaryProps {
  isOutputSummaryCollapsed: boolean;
  setIsOutputSummaryCollapsed: (updater: (current: boolean) => boolean) => void;
  hasCollectedOutput: boolean;
  showCollectedOutput: boolean;
  setShowCollectedOutput: (updater: (current: boolean) => boolean) => void;
  collectedOutput: string | null;
  validationIssuesCount: number;
  executionTraceCount: number;
  executionPresent: boolean;
  isTickedMode: boolean;
  outputSummaries: OutputSummaryItem[];
  activeOutputSummary: OutputSummaryItem | null;
  setActiveOutputSummaryModuleId: (moduleId: string) => void;
  setSinkRepresentationsByModuleId: (
    updater: (
      current: Record<string, SinkRepresentation>,
    ) => Record<string, SinkRepresentation>,
  ) => void;
  tickHistoryByModule: Record<string, string[]> | null;
}

export function InspectorOutputSummary({
  isOutputSummaryCollapsed,
  setIsOutputSummaryCollapsed,
  hasCollectedOutput,
  showCollectedOutput,
  setShowCollectedOutput,
  collectedOutput,
  validationIssuesCount,
  executionTraceCount,
  executionPresent,
  isTickedMode,
  outputSummaries,
  activeOutputSummary,
  setActiveOutputSummaryModuleId,
  setSinkRepresentationsByModuleId,
  tickHistoryByModule,
}: InspectorOutputSummaryProps) {
  return (
    <div className={`trace-summary inspector-output-summary${isOutputSummaryCollapsed ? ' collapsed' : ''}`}>
      <div className="inspector-output-summary-head">
        <span className="meta-label">
          {isOutputSummaryCollapsed ? 'Output' : isTickedMode ? 'Output Summary' : 'Outputs'}
        </span>
        <div className="inspector-output-actions">
          {hasCollectedOutput && !isOutputSummaryCollapsed ? (
            <button
              type="button"
              className="inspector-output-action"
              onClick={() => setShowCollectedOutput((current) => !current)}
            >
              {showCollectedOutput ? 'Hide collected' : 'Show collected'}
            </button>
          ) : null}
          <button
            type="button"
            className="collapse-toggle-button"
            aria-label={isOutputSummaryCollapsed ? 'Expand output summary' : 'Collapse output summary'}
            title={isOutputSummaryCollapsed ? 'Expand output summary' : 'Collapse output summary'}
            onClick={() => setIsOutputSummaryCollapsed((current) => !current)}
          >
            {isOutputSummaryCollapsed ? '+' : '\u2212'}
          </button>
        </div>
      </div>
      {!isOutputSummaryCollapsed ? (
        <p className="trace-summary-subtitle">
          {validationIssuesCount > 0
            ? `${validationIssuesCount} validation issue${validationIssuesCount === 1 ? '' : 's'} blocking run`
            : executionPresent
              ? `${executionTraceCount} module${executionTraceCount === 1 ? '' : 's'} executed`
              : 'Fix validation issues to run'}
        </p>
      ) : null}
      {!isOutputSummaryCollapsed && showCollectedOutput && hasCollectedOutput && outputSummaries.length <= 1 ? (
        <p className="trace-summary-subtitle">
          Collected so far: <strong>{collectedOutput}</strong>
        </p>
      ) : null}
      {outputSummaries.length > 1 && !isOutputSummaryCollapsed ? (
        <div className="inspector-output-switcher">
          {outputSummaries.map((summary) => (
            <button
              key={`output-summary-switch-${summary.moduleId}`}
              type="button"
              className={`inspector-output-switch${activeOutputSummary?.moduleId === summary.moduleId ? ' active' : ''}`}
              onClick={() => setActiveOutputSummaryModuleId(summary.moduleId)}
            >
              {summary.moduleId}
            </button>
          ))}
        </div>
      ) : null}
      {isOutputSummaryCollapsed && activeOutputSummary ? (
        <div className="inspector-output-collapsed-line">
          {outputSummaries.length > 1 ? (
            <span className="meta-label">{activeOutputSummary.moduleId}</span>
          ) : null}
          <code>
            {activeOutputSummary.effectiveRepresentationOption?.value ??
              (activeOutputSummary.signal ? formatSignal(activeOutputSummary.signal) : '')}
          </code>
        </div>
      ) : null}
      {!isOutputSummaryCollapsed && activeOutputSummary ? (
        <div className="inspector-output-list">
          <div key={`output-summary-${activeOutputSummary.moduleId}`} className="inspector-output-card">
            <div className="inspector-output-card-head">
              <strong>{activeOutputSummary.moduleId}</strong>
              {outputSummaries.length > 1 ? (
                <span className="content-status-chip">
                  Sink{' '}
                  {outputSummaries.findIndex((summary) => summary.moduleId === activeOutputSummary.moduleId) + 1} /{' '}
                  {outputSummaries.length}
                </span>
              ) : null}
            </div>
            <code>{activeOutputSummary.signal ? formatSignal(activeOutputSummary.signal) : ''}</code>
            {activeOutputSummary.effectiveRepresentationOption ? (
              <div className="sink-representation">
                <span className="meta-label">View As</span>
                <div className="sink-rep-tabs">
                  {activeOutputSummary.representationOptions.map((option) => (
                    <button
                      key={`output-summary-${activeOutputSummary.moduleId}-${option.id}`}
                      type="button"
                      className={`sink-rep-tab${activeOutputSummary.effectiveRepresentation === option.id ? ' active' : ''}${!option.available ? ' unavailable' : ''}`}
                      onClick={() =>
                        option.available &&
                        setSinkRepresentationsByModuleId((current) => ({
                          ...current,
                          [activeOutputSummary.moduleId]: option.id,
                        }))
                      }
                      disabled={!option.available}
                      title={option.reason ?? option.label}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="sink-rep-value">
                  <code>{activeOutputSummary.effectiveRepresentationOption.value}</code>
                </div>
              </div>
            ) : null}
            {isTickedMode && tickHistoryByModule?.[activeOutputSummary.moduleId]?.length ? (
              <p className="sink-rep-note">
                {tickHistoryByModule[activeOutputSummary.moduleId].length} tick sample
                {tickHistoryByModule[activeOutputSummary.moduleId].length === 1 ? '' : 's'} for this sink.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface InspectorCompareViewProps {
  projectName: string;
  comparisonBaseline: ComparisonBaselineDocument | null;
  baselineOutput: string;
  variantOutput: string;
  baselineExecutionError: string | null;
  executionError: string | null;
  executionComparison: ExecutionComparison | null;
  project: Project;
  registry: ModuleRegistry;
  isTickedMode: boolean;
  verificationSourceOptions: VerificationSourceOption[];
  verificationCases: VerificationCase[];
  verificationResults: VerificationCaseResult[];
  onCaptureBaseline: () => void;
  onClearBaseline: () => void;
  onAddVerificationCase: (
    sourceModuleId: string,
    inputValue: string,
    tickCount?: number | null,
  ) => string | null;
  onImportVerificationCases: (cases: VerificationCase[]) => void;
  onRemoveVerificationCase: (caseId: string) => void;
  onClearVerificationCases: () => void;
}

export function InspectorCompareView({
  projectName,
  comparisonBaseline,
  baselineOutput,
  variantOutput,
  baselineExecutionError,
  executionError,
  executionComparison,
  project,
  registry,
  isTickedMode,
  verificationSourceOptions,
  verificationCases,
  verificationResults,
  onCaptureBaseline,
  onClearBaseline,
  onAddVerificationCase,
  onImportVerificationCases,
  onRemoveVerificationCase,
  onClearVerificationCases,
}: InspectorCompareViewProps) {
  return (
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
        project={project}
        registry={registry}
        onCaptureBaseline={onCaptureBaseline}
        onClearBaseline={onClearBaseline}
        isTickedMode={isTickedMode}
        verificationSourceOptions={verificationSourceOptions}
        verificationCases={verificationCases}
        verificationResults={verificationResults}
        onAddVerificationCase={onAddVerificationCase}
        onImportVerificationCases={onImportVerificationCases}
        onRemoveVerificationCase={onRemoveVerificationCase}
        onClearVerificationCases={onClearVerificationCases}
      />
    </section>
  );
}
