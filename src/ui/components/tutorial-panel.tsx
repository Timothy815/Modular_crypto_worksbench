import { useMemo } from 'react';

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
    () => [...new Set(tutorials.map((tutorial) => tutorial.group ?? 'Other'))],
    [tutorials],
  );
  const selectedTutorial =
    tutorials.find((tutorial) => tutorial.id === selectedTutorialId) ?? null;

  if (!selectedTutorial) {
    return null;
  }

  const activeGroup = selectedTutorial.group ?? 'Other';
  const visibleTutorials = tutorials.filter(
    (tutorial) => (tutorial.group ?? 'Other') === activeGroup,
  );

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
          <button
            type="button"
            role="radio"
            aria-checked={workspaceMode === 'cryptanalysis'}
            className={workspaceMode === 'cryptanalysis' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
            onClick={() => onSetWorkspaceMode('cryptanalysis')}
          >
            Cryptanalysis
          </button>
        </div>
        <p className="tutorial-progress-summary">
          {completedCount} of {tutorials.length} completed
          {workspaceMode === 'build' ? (
            <span className="workspace-mode-hint"> — canvas overlays paused</span>
          ) : workspaceMode === 'cryptanalysis' ? (
            <span className="workspace-mode-hint"> — analysis workspace active</span>
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
              const nextTutorial = tutorials.find(
                (tutorial) => (tutorial.group ?? 'Other') === nextGroup,
              );
              if (nextTutorial && nextTutorial.id !== selectedTutorialId) {
                onSelectTutorial(nextTutorial.id);
              }
            }}
          >
            {tutorialGroups.map((group) => (
              <option key={group} value={group}>
                {group}
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
            Project: <strong>{selectedTutorial.projectId}</strong>
          </span>
          {isCompleted ? (
            <span className="content-status-chip tutorial-completed-chip">Completed</span>
          ) : (
            <span className="content-status-chip tutorial-in-progress-chip">
              Step {stepIndex + 1} of {totalSteps}
            </span>
          )}
        </div>
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
            Open Tutorial Project
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
                  Step target: <strong>{activeStep.focusModuleId}</strong>
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
