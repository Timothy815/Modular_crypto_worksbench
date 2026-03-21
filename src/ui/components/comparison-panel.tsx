import type { ComparisonBaselineDocument } from '../workbench-document';
import type { ExecutionComparison } from '../execution-compare';

interface ComparisonPanelProps {
  projectName: string;
  baseline: ComparisonBaselineDocument | null;
  baselineOutput: string;
  variantOutput: string;
  baselineError: string | null;
  variantError: string | null;
  comparison: ExecutionComparison | null;
  onCaptureBaseline: () => void;
  onClearBaseline: () => void;
}

export function ComparisonPanel({
  projectName,
  baseline,
  baselineOutput,
  variantOutput,
  baselineError,
  variantError,
  comparison,
  onCaptureBaseline,
  onClearBaseline,
}: ComparisonPanelProps) {
  const divergentSignals = comparison?.firstDivergence
    ? getDivergentSignals(comparison.firstDivergence)
    : null;

  return (
    <section className="panel comparison-panel">
      <div className="panel-head">
        <p className="panel-label">Break Workflow</p>
        <h2>Baseline vs Variant</h2>
      </div>
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
                      First divergence at step{' '}
                      <strong>{comparison.firstDivergence.stepIndex + 1}</strong>:{' '}
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
        </div>
      ) : (
        <p className="comparison-copy">
          Capture the current workbench as a baseline, then mutate the live graph to compare
          outputs and first-divergence behavior.
        </p>
      )}
    </section>
  );
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
