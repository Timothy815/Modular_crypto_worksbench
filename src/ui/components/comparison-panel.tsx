import type { ComparisonBaselineDocument } from '../workbench-document';
import type { ExecutionComparison } from '../execution-compare';
import { analyzeSymbolSignal } from '../cryptanalysis';
import type {
  VerificationCase,
  VerificationCaseResult,
  VerificationSourceOption,
} from '../verification-workflow';
import { useState } from 'react';

interface ComparisonPanelProps {
  projectName: string;
  baseline: ComparisonBaselineDocument | null;
  baselineOutput: string;
  variantOutput: string;
  baselineError: string | null;
  variantError: string | null;
  comparison: ExecutionComparison | null;
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
  onRemoveVerificationCase: (caseId: string) => void;
  onClearVerificationCases: () => void;
  embedded?: boolean;
}

export function ComparisonPanel({
  projectName,
  baseline,
  baselineOutput,
  variantOutput,
  baselineError,
  variantError,
  comparison,
  isTickedMode,
  verificationSourceOptions,
  verificationCases,
  verificationResults,
  onCaptureBaseline,
  onClearBaseline,
  onAddVerificationCase,
  onRemoveVerificationCase,
  onClearVerificationCases,
  embedded = false,
}: ComparisonPanelProps) {
  const [verificationSourceModuleId, setVerificationSourceModuleId] = useState(
    verificationSourceOptions[0]?.moduleId ?? '',
  );
  const [verificationInputValue, setVerificationInputValue] = useState('');
  const [verificationTickCount, setVerificationTickCount] = useState('4');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const selectedVerificationSourceModuleId = verificationSourceOptions.some(
    (option) => option.moduleId === verificationSourceModuleId,
  )
    ? verificationSourceModuleId
    : verificationSourceOptions[0]?.moduleId ?? '';

  const divergentSignals = comparison?.firstDivergence
    ? getDivergentSignals(comparison.firstDivergence)
    : null;
  const baselineAnalysis = analyzeSymbolSignal(comparison?.baselineOutput.raw ?? null);
  const variantAnalysis = analyzeSymbolSignal(comparison?.variantOutput.raw ?? null);
  const content = (
    <>
      {!embedded ? (
        <div className="panel-head">
          <p className="panel-label">Break Workflow</p>
          <h2>Baseline vs Variant</h2>
        </div>
      ) : null}
      <div className="comparison-actions">
        <button
          type="button"
          className="mini-action-button"
          onClick={onCaptureBaseline}
        >
          {baseline ? 'Recapture Baseline' : 'Capture Baseline'}
        </button>
        {baseline ? (
          <button
            type="button"
            className="mini-action-button"
            onClick={onClearBaseline}
          >
            Clear Baseline
          </button>
        ) : null}
      </div>

      {baseline ? (
        <div className="comparison-grid">
          <div className="comparison-card">
            <span className="meta-label">Baseline</span>
            <strong>{projectName}</strong>
            <p className="comparison-copy">
              Captured snapshot from the active workbench.
            </p>
            <p className="comparison-copy mono-line">
              {new Date(baseline.capturedAt).toLocaleString()}
            </p>
            <p className="comparison-copy">
              Output: <strong>{baselineError ?? baselineOutput}</strong>
            </p>
          </div>
          <div className="comparison-card">
            <span className="meta-label">Variant</span>
            <strong>Live Workbench</strong>
            <p className="comparison-copy">
              Current editable graph and parameters.
            </p>
            <p className="comparison-copy">
              Output: <strong>{variantError ?? variantOutput}</strong>
            </p>
          </div>
          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Comparison Summary</span>
            {comparison ? (
              <>
                <p className="comparison-copy">
                  Final outputs{' '}
                  <strong>
                    {comparison.outputsMatch ? 'match' : 'diverge'}
                  </strong>
                  .
                </p>
                {comparison.firstDivergence ? (
                  <>
                    <p className="comparison-copy">
                      First divergence at{' '}
                      <strong>
                        {comparison.firstDivergence.tickIndex !== undefined
                          ? `tick ${comparison.firstDivergence.tickIndex + 1}`
                          : `step ${comparison.firstDivergence.stepIndex + 1}`}
                      </strong>
                      :{' '}
                      <strong>
                        {comparison.firstDivergence.variant?.moduleId ??
                          comparison.firstDivergence.baseline?.moduleId ??
                          'unknown'}
                      </strong>{' '}
                      ({comparison.firstDivergence.reason}).
                    </p>
                    {divergentSignals ? (
                      <div className="comparison-diff-row">
                        <div className="comparison-diff-card">
                          <span className="meta-label">Baseline Signal</span>
                          <strong>{divergentSignals.baseline}</strong>
                        </div>
                        <div className="comparison-diff-card">
                          <span className="meta-label">Variant Signal</span>
                          <strong>{divergentSignals.variant}</strong>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="comparison-copy">
                    No trace divergence detected across the current execution.
                  </p>
                )}
              </>
            ) : (
              <p className="comparison-copy">
                Capture a baseline, then mutate the live workbench to compare outputs and the
                first divergent trace step.
              </p>
            )}
          </div>
          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Verification Station</span>
            <p className="comparison-copy">
              Verified means this workspace matches the chosen reference behavior. It does not mean
              the machine is secure or certified.
            </p>
            {!baseline ? (
              <p className="comparison-copy">
                Capture a baseline first. Verification cases are generated from that reference so
                failures can point to a first trace divergence.
              </p>
            ) : verificationSourceOptions.length === 0 ? (
              <p className="comparison-copy">
                This workspace has no supported verification source yet. V1 supports Text, ASCII,
                Baudot, and Hex source modules.
              </p>
            ) : (
              <>
                <div className="verification-case-form">
                  <label className="verification-field">
                    <span className="meta-label">Input Source</span>
                    <select
                      value={selectedVerificationSourceModuleId}
                      onChange={(event) => setVerificationSourceModuleId(event.target.value)}
                    >
                      {verificationSourceOptions.map((option) => (
                        <option key={option.moduleId} value={option.moduleId}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="verification-field">
                    <span className="meta-label">Input Value</span>
                    <input
                      type="text"
                      value={verificationInputValue}
                      onChange={(event) => setVerificationInputValue(event.target.value)}
                      placeholder="Enter a reference input"
                    />
                  </label>
                  {isTickedMode ? (
                    <label className="verification-field">
                      <span className="meta-label">Tick Count</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={verificationTickCount}
                        onChange={(event) => setVerificationTickCount(event.target.value)}
                        placeholder="4"
                      />
                    </label>
                  ) : null}
                  <div className="comparison-actions verification-actions">
                    <button
                      type="button"
                      className="mini-action-button"
                      onClick={() => {
                        const requestedTickCount = isTickedMode
                          ? Number.parseInt(verificationTickCount, 10)
                          : null;
                        const message = onAddVerificationCase(
                          selectedVerificationSourceModuleId,
                          verificationInputValue,
                          requestedTickCount,
                        );
                        setVerificationError(message);
                        if (!message) {
                          setVerificationInputValue('');
                        }
                      }}
                    >
                      Add Verification Case
                    </button>
                    {verificationCases.length > 0 ? (
                      <button
                        type="button"
                        className="mini-action-button"
                        onClick={() => {
                          onClearVerificationCases();
                          setVerificationError(null);
                        }}
                      >
                        Clear Cases
                      </button>
                    ) : null}
                  </div>
                </div>
                {verificationError ? (
                  <p className="comparison-copy verification-error">{verificationError}</p>
                ) : null}
                {verificationCases.length > 0 ? (
                  <div className="verification-case-list">
                    {verificationResults.map((result) => {
                      const caseDefinition = verificationCases.find(
                        (entry) => entry.id === result.caseId,
                      );
                      return (
                        <div
                          key={result.caseId}
                          className={`comparison-diff-card verification-result-card ${
                            result.passed
                              ? 'verification-result-pass'
                              : 'verification-result-fail'
                          }`}
                        >
                          <div className="verification-result-head">
                            <div>
                              <span className="meta-label">{result.sourceLabel}</span>
                              <strong>{result.passed ? 'PASS' : 'FAIL'}</strong>
                            </div>
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => onRemoveVerificationCase(result.caseId)}
                            >
                              Remove
                            </button>
                          </div>
                          <p className="comparison-copy">
                            Input: <strong>{result.inputValue || '∅'}</strong>
                          </p>
                          {result.tickCount ? (
                            <p className="comparison-copy">
                              Tick Count: <strong>{result.tickCount}</strong>
                            </p>
                          ) : null}
                          <p className="comparison-copy">
                            Expected: <strong>{caseDefinition?.expectedOutput ?? result.expectedOutput}</strong>
                          </p>
                          <p className="comparison-copy">
                            Actual: <strong>{result.actualOutput}</strong>
                          </p>
                          {!result.passed ? (
                            <>
                              {result.error ? (
                                <p className="comparison-copy verification-error">
                                  {result.error}
                                </p>
                              ) : result.divergence ? (
                                <p className="comparison-copy">
                                  First divergence at{' '}
                                  <strong>
                                    {result.divergence.tickIndex !== undefined
                                      ? `tick ${result.divergence.tickIndex + 1}`
                                      : `step ${result.divergence.stepIndex + 1}`}
                                  </strong>
                                  :{' '}
                                  <strong>
                                    {result.divergence.variant?.moduleId ??
                                      result.divergence.baseline?.moduleId ??
                                      'unknown'}
                                  </strong>{' '}
                                  ({result.divergence.reason}).
                                </p>
                              ) : (
                                <p className="comparison-copy">
                                  Output diverged from the reference without a trace-local
                                  divergence.
                                </p>
                              )}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="comparison-copy">
                    Add a case to check the current workspace against the captured reference
                    behavior.
                  </p>
                )}
              </>
            )}
          </div>
          {baselineAnalysis && variantAnalysis ? (
            <div className="comparison-card comparison-card-wide">
              <span className="meta-label">Text Analysis</span>
              <div className="comparison-diff-row">
                <div className="comparison-diff-card">
                  <span className="meta-label">Baseline Stats</span>
                  <strong>{baselineAnalysis.letterCount} letters</strong>
                  <p className="comparison-copy">
                    IOC:{' '}
                    <strong>
                      {baselineAnalysis.indexOfCoincidence !== null
                        ? baselineAnalysis.indexOfCoincidence.toFixed(3)
                        : 'n/a'}
                    </strong>
                  </p>
                  <p className="comparison-copy">
                    Top letters:{' '}
                    <strong>{formatTopLetters(baselineAnalysis.topLetters)}</strong>
                  </p>
                  <p className="comparison-copy">
                    Top bigrams:{' '}
                    <strong>{formatTopNGrams(baselineAnalysis.topBigrams)}</strong>
                  </p>
                  <p className="comparison-copy">
                    Top trigrams:{' '}
                    <strong>{formatTopNGrams(baselineAnalysis.topTrigrams)}</strong>
                  </p>
                </div>
                <div className="comparison-diff-card">
                  <span className="meta-label">Variant Stats</span>
                  <strong>{variantAnalysis.letterCount} letters</strong>
                  <p className="comparison-copy">
                    IOC:{' '}
                    <strong>
                      {variantAnalysis.indexOfCoincidence !== null
                        ? variantAnalysis.indexOfCoincidence.toFixed(3)
                        : 'n/a'}
                    </strong>
                  </p>
                  <p className="comparison-copy">
                    Top letters:{' '}
                    <strong>{formatTopLetters(variantAnalysis.topLetters)}</strong>
                  </p>
                  <p className="comparison-copy">
                    Top bigrams:{' '}
                    <strong>{formatTopNGrams(variantAnalysis.topBigrams)}</strong>
                  </p>
                  <p className="comparison-copy">
                    Top trigrams:{' '}
                    <strong>{formatTopNGrams(variantAnalysis.topTrigrams)}</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="comparison-copy">
          Capture the current workbench as a baseline, then mutate the live graph to compare
          outputs and first-divergence behavior.
        </p>
      )}
    </>
  );

  if (embedded) {
    return <>{content}</>;
  }

  return <section className="panel comparison-panel">{content}</section>;
}

function formatTopLetters(
  entries: { letter: string; count: number; share: number }[],
) {
  if (entries.length === 0) {
    return 'n/a';
  }

  return entries
    .map((entry) => `${entry.letter}:${entry.count} (${Math.round(entry.share * 100)}%)`)
    .join(', ');
}

function formatTopNGrams(
  entries: { gram: string; count: number; share: number }[],
) {
  if (entries.length === 0) {
    return 'n/a';
  }

  return entries
    .map((entry) => `${entry.gram}:${entry.count} (${Math.round(entry.share * 100)}%)`)
    .join(', ');
}

function getDivergentSignals(
  divergence: NonNullable<ExecutionComparison['firstDivergence']>,
) {
  const baselineEntry = divergence.baseline;
  const variantEntry = divergence.variant;
  if (!baselineEntry || !variantEntry) {
    return null;
  }

  const baselineSignal =
    divergence.reason === 'inputs'
      ? Object.values(baselineEntry.inputs)[0]
      : Object.values(baselineEntry.outputs)[0];
  const variantSignal =
    divergence.reason === 'inputs'
      ? Object.values(variantEntry.inputs)[0]
      : Object.values(variantEntry.outputs)[0];

  return {
    baseline: formatSignalForCompare(baselineSignal),
    variant: formatSignalForCompare(variantSignal),
  };
}

function formatSignalForCompare(signal: { type: 'symbol'; value: string } | { type: 'bits'; value: number[] } | undefined) {
  if (!signal) {
    return 'n/a';
  }

  return signal.type === 'symbol'
    ? signal.value
    : `[${signal.value.join(', ')}]`;
}
