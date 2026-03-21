import type { GuidedChallenge, ChallengeEvaluation } from '../challenges';

interface ChallengePanelProps {
  challenges: GuidedChallenge[];
  selectedChallengeId: string;
  evaluation: ChallengeEvaluation | null;
  onSelectChallenge: (challengeId: string) => void;
  onLoadChallengeStart: () => void;
}

export function ChallengePanel({
  challenges,
  selectedChallengeId,
  evaluation,
  onSelectChallenge,
  onLoadChallengeStart,
}: ChallengePanelProps) {
  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ?? null;

  return (
    <section className="panel comparison-panel">
      <div className="panel-head">
        <p className="panel-label">Guided Challenge</p>
        <h2>Challenge Mode</h2>
      </div>

      <label className="param-field">
        <span>Active Challenge</span>
        <select
          value={selectedChallengeId}
          onChange={(event) => onSelectChallenge(event.target.value)}
        >
          {challenges.map((challenge) => (
            <option key={challenge.id} value={challenge.id}>
              {challenge.title}
            </option>
          ))}
        </select>
      </label>

      {selectedChallenge ? (
        <>
          <p className="comparison-copy">{selectedChallenge.prompt}</p>

          <div className="comparison-actions">
            <button
              type="button"
              className="mini-action-button"
              onClick={onLoadChallengeStart}
            >
              Reset Workbench To Challenge Start
            </button>
          </div>

          <div className="comparison-grid">
            <div className="comparison-card comparison-card-wide">
              <span className="meta-label">Challenge Status</span>
              {evaluation ? (
                <>
                  <p className="comparison-copy">
                    Status:{' '}
                    <strong>
                      {evaluation.status === 'success'
                        ? 'Matched target'
                        : evaluation.status === 'failure'
                          ? 'Not yet matched'
                          : 'Blocked'}
                    </strong>
                  </p>
                  {evaluation.comparison ? (
                    <p className="comparison-copy">
                      Target output <strong>{evaluation.comparison.baselineOutput.formatted}</strong>{' '}
                      vs current output <strong>{evaluation.comparison.variantOutput.formatted}</strong>.
                    </p>
                  ) : null}
                  {evaluation.comparison?.firstDivergence ? (
                    <p className="comparison-copy">
                      First divergence at step{' '}
                      <strong>{evaluation.comparison.firstDivergence.stepIndex + 1}</strong>{' '}
                      on{' '}
                      <strong>
                        {evaluation.comparison.firstDivergence.variant?.moduleId ??
                          evaluation.comparison.firstDivergence.baseline?.moduleId ??
                          'unknown'}
                      </strong>
                      .
                    </p>
                  ) : evaluation.status === 'success' ? (
                    <p className="comparison-copy">
                      No divergence detected against the target behavior.
                    </p>
                  ) : null}
                  {evaluation.status === 'blocked' ? (
                    <p className="comparison-copy">
                      Fix validation issues before the challenge can be checked.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="comparison-copy">
                  Load a challenge and compare the current machine against its target behavior.
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
