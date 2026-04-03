import { useMemo } from 'react';

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
import type { WorkspaceMode } from '../workspace-mode';
import type { GuidedTutorial, TutorialStep } from '../tutorials';

interface TutorialPanelProps {
  tutorials: GuidedTutorial[];
  selectedTutorialId: string;
  currentProjectId: string;
  stepIndex: number;
  activeStep: TutorialStep | null;
  completedTutorialIds: string[];
  isCompleted: boolean;
  workspaceMode: WorkspaceMode;
  tutorialNotesVisible: boolean;
  onSetWorkspaceMode: (mode: WorkspaceMode) => void;
  onSetTutorialNotesVisible: (visible: boolean) => void;
  onSelectTutorial: (tutorialId: string) => void;
  onSetStep: (stepIndex: number) => void;
  onSwitchProject: (projectId: string) => void;
  onFocusStepModule: (moduleId: string) => void;
  onResetProgress: () => void;
}

export function TutorialPanel({
  tutorials,
  selectedTutorialId,
  currentProjectId,
  stepIndex,
  activeStep,
  completedTutorialIds,
  isCompleted,
  workspaceMode,
  tutorialNotesVisible,
  onSetWorkspaceMode,
  onSetTutorialNotesVisible,
  onSelectTutorial,
  onSetStep,
  onSwitchProject,
  onFocusStepModule,
  onResetProgress,
}: TutorialPanelProps) {
  const tutorialGroups = useMemo(
    () => getSortedLearningGroups(tutorials),
    [tutorials],
  );
  const tutorialCountByGroup = useMemo(
    () =>
      Object.fromEntries(
        tutorialGroups.map((group) => [
          group,
          tutorials.filter((tutorial) => (tutorial.group ?? 'Other') === group).length,
        ]),
      ),
    [tutorialGroups, tutorials],
  );
  const sortedTutorials = useMemo(() => [...tutorials].sort(compareLearningItems), [tutorials]);
  const selectedTutorial =
    tutorials.find((tutorial) => tutorial.id === selectedTutorialId) ?? null;

  if (!selectedTutorial) {
    return null;
  }

  const activeGroup = selectedTutorial.group ?? 'Other';
  const visibleTutorials = sortedTutorials.filter(
    (tutorial) => (tutorial.group ?? 'Other') === activeGroup,
  );
  const selectedStage = inferLearningStage(selectedTutorial);
  const recommendedNext = getRecommendedNextItem(sortedTutorials, selectedTutorial.id);
  const recommendedAfterTargets = getRecommendedAfterTargets(sortedTutorials, selectedTutorial);

  const isTutorialProjectActive = selectedTutorial.projectId === currentProjectId;
  const totalSteps = selectedTutorial.steps.length;
  const completedCount = tutorials.filter((tutorial) =>
    completedTutorialIds.includes(tutorial.id),
  ).length;

  return (
    <section className="panel comparison-panel tutorial-panel">
      <div className="panel-head">
        <p className="panel-label">Guided Tutorial</p>
        <h2>Tutorial Walkthrough</h2>
        <div className="workspace-mode-switch" role="radiogroup" aria-label="Workspace mode">
          <button
            type="button"
            role="radio"
            aria-checked={workspaceMode === 'build'}
            className={workspaceMode === 'build' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
            onClick={() => onSetWorkspaceMode('build')}
          >
            Build
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={workspaceMode === 'guide'}
            className={workspaceMode === 'guide' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
            onClick={() => onSetWorkspaceMode('guide')}
          >
            Guide
          </button>
        </div>
        <p className="tutorial-progress-summary">
          {completedCount} of {tutorials.length} completed
          {workspaceMode === 'build' ? (
            <span className="workspace-mode-hint"> — overlays off</span>
          ) : null}
        </p>
      </div>

      <div className="content-filter-row">
        <label className="param-field">
          <span>Group</span>
          <select
            value={activeGroup}
            onChange={(event) => {
              const nextGroup = event.target.value;
              const nextTutorial = getFirstLearningItemInGroup(tutorials, nextGroup);
              if (nextTutorial && nextTutorial.id !== selectedTutorialId) {
                onSelectTutorial(nextTutorial.id);
              }
            }}
          >
            {tutorialGroups.map((group) => (
              <option key={group} value={group}>
                {getLearningGroupLabel(group, tutorialCountByGroup[group])}
              </option>
            ))}
          </select>
        </label>

        <label className="param-field">
          <span>Active Tutorial</span>
          <select
            value={selectedTutorialId}
            onChange={(event) => onSelectTutorial(event.target.value)}
          >
            {visibleTutorials.map((tutorial) => (
              <option key={tutorial.id} value={tutorial.id}>
                {completedTutorialIds.includes(tutorial.id) ? '\u2713 ' : ''}{tutorial.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="content-selector-card">
        <p className="comparison-copy">{selectedTutorial.summary}</p>
        <div className="content-selector-meta">
          <span className="content-status-chip">
            {getLearningStageLabel(selectedStage)}
          </span>
          <span className="content-status-chip">
            <strong>{activeGroup}</strong>
          </span>
          <span className="content-status-chip">
            {isCoreLearningItem(selectedTutorial) ? 'Core Path' : 'Optional'}
          </span>
          <span className="content-status-chip">
            {isTutorialProjectActive ? 'Workspace Open' : 'Workspace Closed'}
          </span>
          {isCompleted ? (
            <span className="content-status-chip tutorial-completed-chip">Completed</span>
          ) : (
            <span className="content-status-chip tutorial-in-progress-chip">
              Step {stepIndex + 1} of {totalSteps}
            </span>
          )}
        </div>
        {recommendedNext ? (
          <div className="comparison-copy project-recommended-next">
            <span>Recommended next:</span>
            <div className="project-recommended-next-list">
              <button
                type="button"
                className="project-recommended-next-button"
                onClick={() => onSelectTutorial(recommendedNext.id)}
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
                  onClick={() => onSelectTutorial(target.id)}
                >
                  {target.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {isCompleted ? (
        <div className="tutorial-completed-banner">
          <strong>Tutorial complete</strong>
          <p>
            You have walked through all {totalSteps} steps.
            Try another tutorial, or revisit any step using the navigator below.
          </p>
        </div>
      ) : null}

      <div className="comparison-actions">
        <button
          type="button"
          className="mini-action-button"
          onClick={() => onSetTutorialNotesVisible(!tutorialNotesVisible)}
        >
          {tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
        </button>
        {!isTutorialProjectActive ? (
          <button
            type="button"
            className="mini-action-button"
            onClick={() => onSwitchProject(selectedTutorial.projectId)}
          >
            Open Workspace
          </button>
        ) : null}
        <button
          type="button"
          className="mini-action-button"
          disabled={stepIndex <= 0}
          onClick={() => onSetStep(Math.max(0, stepIndex - 1))}
        >
          Previous Step
        </button>
        <button
          type="button"
          className="mini-action-button"
          disabled={stepIndex >= totalSteps - 1}
          onClick={() => onSetStep(Math.min(totalSteps - 1, stepIndex + 1))}
        >
          Next Step
        </button>
        {activeStep?.focusModuleId && isTutorialProjectActive ? (
          <button
            type="button"
            className="mini-action-button"
            onClick={() => onFocusStepModule(activeStep.focusModuleId!)}
          >
            Focus Module
          </button>
        ) : null}
        {completedTutorialIds.length > 0 ? (
          <button
            type="button"
            className="mini-action-button"
            onClick={onResetProgress}
          >
            Reset Progress
          </button>
        ) : null}
      </div>

      <div className="comparison-grid">
        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Step {stepIndex + 1} of {totalSteps}</span>
          {activeStep ? (
            <>
              <strong>{activeStep.title}</strong>
              <p className="comparison-copy">{activeStep.body}</p>
              {activeStep.focusModuleId ? (
                <p className="comparison-copy">
                  Focus: <strong>{activeStep.focusModuleId}</strong>
                </p>
              ) : null}
            </>
          ) : (
            <p className="comparison-copy">This tutorial does not define any steps yet.</p>
          )}
        </div>
        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Step Navigator</span>
          <ol className="tutorial-step-list">
            {selectedTutorial.steps.map((step, index) => (
              <li key={step.id}>
                <button
                  type="button"
                  className={
                    index === stepIndex
                      ? 'tutorial-step-chip active'
                      : index < stepIndex || isCompleted
                        ? 'tutorial-step-chip visited'
                        : 'tutorial-step-chip'
                  }
                  onClick={() => onSetStep(index)}
                >
                  <span>
                    {index < stepIndex || isCompleted ? '\u2713 ' : ''}Step {index + 1}
                  </span>
                  <strong>{step.title}</strong>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
