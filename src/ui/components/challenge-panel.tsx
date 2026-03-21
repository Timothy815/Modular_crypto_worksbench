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
          <p className="comparison-copy">
            Resetting loads the seeded starting machine for this challenge and replaces the current
            workbench attempt.
          </p>

          <div className="comparison-actions">
            <button
              type="button"
              className="mini-action-button"
              onClick={onLoadChallengeStart}
            >
              Reset Challenge Progress
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
                  {evaluation.status === 'failure' ? (
                    <p className="comparison-copy">
                      Keep iterating on the current machine, or reset the attempt to restart from
                      the seeded challenge state.
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
                    <>
                      <p className="comparison-copy">
                        Fix validation issues before the challenge can be checked.
                      </p>
                      <div className="comparison-issue-list">
                        {evaluation.currentIssues.slice(0, 3).map((issue, index) => (
                          <p key={`${issue.code}-${issue.moduleId ?? 'global'}-${index}`} className="field-error">
                            {formatIssueLead(issue)}{issue.message}
                          </p>
                        ))}
                        {evaluation.currentIssues.length > 3 ? (
                          <p className="comparison-copy">
                            + {evaluation.currentIssues.length - 3} more issue(s) in the current graph.
                          </p>
                        ) : null}
                      </div>
                    </>
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

function formatIssueLead(issue: ChallengeEvaluation['currentIssues'][number]) {
  if (issue.moduleId) {
    return `${issue.moduleId}: `;
  }

  if (issue.connection) {
    return `${issue.connection.from.moduleId} -> ${issue.connection.to.moduleId}: `;
  }

  return '';
}
