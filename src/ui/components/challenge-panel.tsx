import { useRef, useState } from 'react';
import type { GuidedChallenge, ChallengeEvaluation } from '../challenges';

interface ChallengePanelProps {
  challenges: GuidedChallenge[];
  selectedChallengeId: string;
  evaluation: ChallengeEvaluation | null;
  canCaptureChallenge: boolean;
  onSelectChallenge: (challengeId: string) => void;
  onLoadChallengeStart: () => void;
  onExportChallenge: () => void;
  onImportChallenge: (file: File) => void;
  onCaptureChallenge: () => void;
}

export function ChallengePanel({
  challenges,
  selectedChallengeId,
  evaluation,
  canCaptureChallenge,
  onSelectChallenge,
  onLoadChallengeStart,
  onExportChallenge,
  onImportChallenge,
  onCaptureChallenge,
}: ChallengePanelProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [hintState, setHintState] = useState<{
    challengeId: string | null;
    count: number;
  }>({
    challengeId: null,
    count: 0,
  });
  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ?? null;
  const availableHints = selectedChallenge?.hints ?? [];
  const revealedHintCount =
    hintState.challengeId === selectedChallengeId ? hintState.count : 0;

  return (
    <section
      className={
        evaluation?.status === 'success'
          ? 'panel comparison-panel challenge-panel-success'
          : 'panel comparison-panel'
      }
    >
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
            <button
              type="button"
              className="mini-action-button"
              onClick={onExportChallenge}
            >
              Export Challenge
            </button>
            <button
              type="button"
              className="mini-action-button"
              disabled={!canCaptureChallenge}
              onClick={onCaptureChallenge}
              title={
                canCaptureChallenge
                  ? 'Capture the current graph as a guided challenge using the compare baseline as the target.'
                  : 'Capture a compare baseline first, then adjust the graph you want students to start from.'
              }
            >
              Capture Current As Challenge
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={() => importInputRef.current?.click()}
            >
              Load Challenge File
            </button>
            {availableHints.length > 0 ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  setHintState((current) => ({
                    challengeId: selectedChallengeId,
                    count: Math.min(
                      (current.challengeId === selectedChallengeId ? current.count : 0) + 1,
                      availableHints.length,
                    ),
                  }))
                }
                disabled={revealedHintCount >= availableHints.length}
              >
                {revealedHintCount === 0 ? 'Need A Hint?' : 'Reveal Next Hint'}
              </button>
            ) : null}
            <input
              ref={importInputRef}
              type="file"
              accept=".json,.challenge.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                onImportChallenge(file);
                event.target.value = '';
              }}
            />
          </div>

          <div className="comparison-grid">
            <div className="comparison-card comparison-card-wide">
              <span className="meta-label">Challenge Status</span>
              {evaluation ? (
                <>
                  {evaluation.status === 'success' ? (
                    <div className="challenge-success-banner">
                      Challenge solved. Your machine matches the target behavior.
                    </div>
                  ) : null}
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
                      {evaluation.currentRuntimeError ? (
                        <p className="field-error">{evaluation.currentRuntimeError}</p>
                      ) : null}
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
                  {availableHints.length > 0 ? (
                    <p className="comparison-copy">
                      Hints available: <strong>{availableHints.length}</strong>
                    </p>
                  ) : null}
                  {!canCaptureChallenge ? (
                    <p className="comparison-copy">
                      To author a challenge, first capture a reference machine in <strong>Compare</strong>,
                      then return here and capture the current graph as the student starting point.
                    </p>
                  ) : null}
                  {revealedHintCount > 0 ? (
                    <div className="challenge-hints">
                      {availableHints.slice(0, revealedHintCount).map((hint, index) => (
                        <div key={`${selectedChallenge.id}-hint-${index}`} className="comparison-diff-card">
                          <span className="meta-label">Hint {index + 1}</span>
                          <p className="comparison-copy">{hint}</p>
                        </div>
                      ))}
                    </div>
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
