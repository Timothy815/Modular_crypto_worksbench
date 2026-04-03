import { useMemo, useRef, useState } from 'react';
import type { GuidedChallenge, ChallengeEvaluation } from '../challenges';
import {
  compareLearningItems,
  getFirstLearningItemInGroup,
  getLearningGroupLabel,
  getLearningStageLabel,
  getRecommendedAfterTargets,
  getRecommendedNextItem,
  getSortedLearningGroups,
  inferLearningStage,
  isCoreLearningItem,
} from '../learning-sequence';
import type { Project } from '../../engine/types';

interface ChallengePanelProps {
  challenges: GuidedChallenge[];
  selectedChallengeId: string;
  evaluation: ChallengeEvaluation | null;
  currentProject: Project;
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
  currentProject,
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
  const sortedChallenges = useMemo(() => [...challenges].sort(compareLearningItems), [challenges]);
  const challengeGroups = useMemo(
    () => getSortedLearningGroups(challenges),
    [challenges],
  );
  const challengeCountByGroup = useMemo(
    () =>
      Object.fromEntries(
        challengeGroups.map((group) => [
          group,
          challenges.filter((challenge) => (challenge.group ?? 'Other') === group).length,
        ]),
      ),
    [challengeGroups, challenges],
  );
  const availableHints = selectedChallenge?.hints ?? [];
  const revealedHintCount =
    hintState.challengeId === selectedChallengeId ? hintState.count : 0;
  const activeGroup = selectedChallenge?.group ?? 'Other';
  const isCollisionChallenge =
    selectedChallenge?.success.kind === 'output-match-target-with-module-difference';
  const isHashCollisionChallenge =
    isCollisionChallenge && (selectedChallenge?.group ?? '') === 'Hash Foundations';
  const guidedModuleIds = isCollisionChallenge
    ? selectedChallenge?.success.moduleIds ?? []
    : [];
  const guidedComparisonRows = selectedChallenge
    ? guidedModuleIds
        .map((moduleId) => {
          const targetModule =
            selectedChallenge.targetProject.modules.find((moduleInstance) => moduleInstance.id === moduleId) ??
            null;
          const currentModule =
            currentProject.modules.find((moduleInstance) => moduleInstance.id === moduleId) ?? null;

          if (!targetModule || !currentModule) {
            return null;
          }

          return {
            moduleId,
            label: formatGuidedModuleLabel(moduleId),
            targetValue: formatParamsForDisplay(targetModule.params),
            currentValue: formatParamsForDisplay(currentModule.params),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
    : [];
  const internalDivergenceSignals = evaluation?.analysisDivergence
    ? formatDivergenceSignals(evaluation.analysisDivergence)
    : null;

  const visibleChallenges = sortedChallenges.filter(
    (challenge) => (challenge.group ?? 'Other') === activeGroup,
  );
  const selectedStage = selectedChallenge ? inferLearningStage(selectedChallenge) : null;
  const recommendedNext = selectedChallenge
    ? getRecommendedNextItem(sortedChallenges, selectedChallenge.id)
    : null;
  const recommendedAfterTargets = selectedChallenge
    ? getRecommendedAfterTargets(sortedChallenges, selectedChallenge)
    : [];

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

      <div className="content-filter-row">
        <label className="param-field">
          <span>Group</span>
          <select
            value={activeGroup}
            onChange={(event) => {
              const nextGroup = event.target.value;
              const nextChallenge = getFirstLearningItemInGroup(challenges, nextGroup);
              if (nextChallenge && nextChallenge.id !== selectedChallengeId) {
                onSelectChallenge(nextChallenge.id);
              }
            }}
          >
            {challengeGroups.map((group) => (
              <option key={group} value={group}>
                {getLearningGroupLabel(group, challengeCountByGroup[group])}
              </option>
            ))}
          </select>
        </label>

        <label className="param-field">
          <span>Active Challenge</span>
          <select
            value={selectedChallengeId}
            onChange={(event) => onSelectChallenge(event.target.value)}
          >
            {visibleChallenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {formatDifficultyBadge(challenge.difficulty)}{challenge.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedChallenge ? (
        <>
          <div className="content-selector-card">
            <p className="comparison-copy">{selectedChallenge.prompt}</p>
            <div className="content-selector-meta">
              {selectedStage ? (
                <span className="content-status-chip">{getLearningStageLabel(selectedStage)}</span>
              ) : null}
              <span className="content-status-chip">
                <strong>{activeGroup}</strong>
              </span>
              <span className="content-status-chip">
                {isCoreLearningItem(selectedChallenge) ? 'Core Path' : 'Optional'}
              </span>
              {selectedChallenge.difficulty ? (
                <span className="content-status-chip">
                  <strong>{formatDifficultyLabel(selectedChallenge.difficulty)}</strong>
                </span>
              ) : null}
            </div>
            <p className="comparison-copy">Reset returns to the seeded starting machine.</p>
            {recommendedNext ? (
              <div className="comparison-copy project-recommended-next">
                <span>Recommended next:</span>
                <div className="project-recommended-next-list">
                  <button
                    type="button"
                    className="project-recommended-next-button"
                    onClick={() => onSelectChallenge(recommendedNext.id)}
                  >
                    {recommendedNext.title}
                  </button>
                </div>
              </div>
            ) : null}
            {recommendedAfterTargets.length > 0 ? (
              <div className="comparison-copy project-recommended-next">
                <span>Best after:</span>
                <div className="project-recommended-next-list">
                  {recommendedAfterTargets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      className="project-recommended-next-button"
                      onClick={() => onSelectChallenge(target.id)}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="comparison-actions">
            <button
              type="button"
              className="mini-action-button"
              onClick={onLoadChallengeStart}
            >
              Reset Challenge
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onExportChallenge}
            >
              Export
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
              Capture As Challenge
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={() => importInputRef.current?.click()}
            >
              Import
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
                {revealedHintCount === 0 ? 'Reveal Hint' : 'Next Hint'}
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
                      {isCollisionChallenge
                        ? 'Challenge solved. You found a different message with the same digest.'
                        : 'Challenge solved. Your machine matches the target behavior.'}
                    </div>
                  ) : null}
                  <p className="comparison-copy">
                    Status:{' '}
                    <strong>
                      {evaluation.status === 'success'
                        ? isCollisionChallenge
                          ? 'Collision found'
                          : 'Matched target'
                        : evaluation.status === 'failure'
                          ? evaluation.reason === 'matched-target-but-input-not-different'
                            ? 'Digest matched, but input is unchanged'
                            : 'Not yet matched'
                          : 'Blocked'}
                    </strong>
                  </p>
                  {evaluation.comparison ? (
                    <p className="comparison-copy">
                      {isCollisionChallenge ? 'Target digest' : 'Target output'}{' '}
                      <strong>{evaluation.comparison.baselineOutput.formatted}</strong> vs current{' '}
                      {isCollisionChallenge ? 'digest' : 'output'}{' '}
                      <strong>{evaluation.comparison.variantOutput.formatted}</strong>.
                    </p>
                  ) : null}
                  {evaluation.status === 'failure' ? (
                    <p className="comparison-copy">
                      {evaluation.reason === 'matched-target-but-input-not-different'
                        ? 'The digest already matches the target, but the message is still the original seeded input. Change at least one guided input module and keep the digest the same.'
                        : 'Keep iterating on the current machine, or reset the attempt to restart from the seeded challenge state.'}
                    </p>
                  ) : null}
                  {evaluation.comparison?.firstDivergence ? (
                    <p className="comparison-copy">
                      First divergence at{' '}
                      <strong>
                        {evaluation.comparison.firstDivergence.tickIndex !== undefined
                          ? `tick ${evaluation.comparison.firstDivergence.tickIndex + 1}`
                          : `step ${evaluation.comparison.firstDivergence.stepIndex + 1}`}
                      </strong>{' '}
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
                      {isCollisionChallenge
                        ? 'The digest matches the target even though the guided message input changed.'
                        : 'No divergence detected against the target behavior.'}
                    </p>
                  ) : null}
                  {evaluation.status === 'success' && isHashCollisionChallenge ? (
                    <p className="comparison-copy">
                      Next step: keep the same two messages in view, then open <strong>Analyze</strong>{' '}
                      to inspect where their internal paths diverge and open <strong>Modern
                      Cryptanalysis</strong> to compare how those differences spread before the digest
                      becomes the same again.
                    </p>
                  ) : null}
                  {evaluation.status === 'success' &&
                  isHashCollisionChallenge &&
                  evaluation.analysisDivergence ? (
                    <div className="challenge-guided-compare">
                      <span className="meta-label">Internal Divergence</span>
                      <p className="comparison-copy">
                        First internal divergence appears at{' '}
                        <strong>step {evaluation.analysisDivergence.stepIndex + 1}</strong> on{' '}
                        <strong>
                          {evaluation.analysisDivergence.variant?.moduleId ??
                            evaluation.analysisDivergence.baseline?.moduleId ??
                            'unknown'}
                        </strong>{' '}
                        by changing <strong>{formatDivergenceReasonLabel(evaluation.analysisDivergence.reason)}</strong>.
                      </p>
                      {internalDivergenceSignals ? (
                        <div className="challenge-guided-values">
                          <div className="challenge-guided-card-analysis">
                            <span className="meta-label">Original Path</span>
                            <code>{internalDivergenceSignals.baseline}</code>
                          </div>
                          <div className="challenge-guided-card-analysis">
                            <span className="meta-label">Colliding Path</span>
                            <code>{internalDivergenceSignals.variant}</code>
                          </div>
                        </div>
                      ) : null}
                      <p className="transformation-summary">
                        <span className="workspace-mode-hint">
                          * Identification skips guided source modules to focus on the first
                          functional divergence within the machine structure.
                        </span>
                      </p>
                    </div>
                  ) : null}
                  {isHashCollisionChallenge && guidedComparisonRows.length > 0 ? (
                    <div className="challenge-guided-compare">
                      <span className="meta-label">Message Comparison</span>
                      {guidedComparisonRows.map((row) => (
                        <div key={row.moduleId} className="challenge-guided-row">
                          <strong>{row.label}</strong>
                          <div className="challenge-guided-values">
                            <div className="challenge-guided-card">
                              <span className="meta-label">Original</span>
                              <code>{row.targetValue}</code>
                            </div>
                            <div className="challenge-guided-card">
                              <span className="meta-label">Current</span>
                              <code>{row.currentValue}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

function formatGuidedModuleLabel(moduleId: string) {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatParamsForDisplay(params: Record<string, unknown>) {
  const entries = Object.entries(params);
  if (entries.length === 0) {
    return 'n/a';
  }

  return entries
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join(' | ');
}

function formatDifficultyBadge(
  difficulty: GuidedChallenge['difficulty'],
) {
  if (!difficulty) {
    return '';
  }

  return `[${formatDifficultyLabel(difficulty)}] `;
}

function formatDifficultyLabel(
  difficulty: NonNullable<GuidedChallenge['difficulty']>,
) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function formatDivergenceReasonLabel(reason: NonNullable<ChallengeEvaluation['analysisDivergence']>['reason']) {
  if (reason === 'inputs') {
    return 'input signal';
  }

  if (reason === 'outputs') {
    return 'output signal';
  }

  if (reason === 'def-id') {
    return 'module type';
  }

  if (reason === 'module-id') {
    return 'module identity';
  }

  return 'trace length';
}

function formatDivergenceSignals(
  divergence: NonNullable<ChallengeEvaluation['analysisDivergence']>,
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
    baseline: formatSignalForDisplay(baselineSignal),
    variant: formatSignalForDisplay(variantSignal),
  };
}

function formatSignalForDisplay(
  signal: { type: 'symbol'; value: string } | { type: 'bits'; value: number[] } | undefined,
) {
  if (!signal) {
    return 'n/a';
  }

  return signal.type === 'symbol' ? signal.value : `[${signal.value.join(', ')}]`;
}
