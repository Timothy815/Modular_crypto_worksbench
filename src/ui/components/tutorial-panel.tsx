import type { GuidedTutorial, TutorialStep } from '../tutorials';

interface TutorialPanelProps {
  tutorials: GuidedTutorial[];
  selectedTutorialId: string;
  currentProjectId: string;
  stepIndex: number;
  activeStep: TutorialStep | null;
  onSelectTutorial: (tutorialId: string) => void;
  onSetStep: (stepIndex: number) => void;
  onSwitchProject: (projectId: string) => void;
  onFocusStepModule: (moduleId: string) => void;
}

export function TutorialPanel({
  tutorials,
  selectedTutorialId,
  currentProjectId,
  stepIndex,
  activeStep,
  onSelectTutorial,
  onSetStep,
  onSwitchProject,
  onFocusStepModule,
}: TutorialPanelProps) {
  const selectedTutorial =
    tutorials.find((tutorial) => tutorial.id === selectedTutorialId) ?? null;

  if (!selectedTutorial) {
    return null;
  }

  const isTutorialProjectActive = selectedTutorial.projectId === currentProjectId;

  return (
    <section className="panel comparison-panel tutorial-panel">
      <div className="panel-head">
        <p className="panel-label">Guided Tutorial</p>
        <h2>Tutorial Walkthrough</h2>
      </div>

      <label className="param-field">
        <span>Active Tutorial</span>
        <select
          value={selectedTutorialId}
          onChange={(event) => onSelectTutorial(event.target.value)}
        >
          {tutorials.map((tutorial) => (
            <option key={tutorial.id} value={tutorial.id}>
              {tutorial.title}
            </option>
          ))}
        </select>
      </label>

      <p className="comparison-copy">{selectedTutorial.summary}</p>
      <p className="comparison-copy">
        Designed for <strong>{selectedTutorial.projectId}</strong>.
      </p>

      <div className="comparison-actions">
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
          disabled={stepIndex >= selectedTutorial.steps.length - 1}
          onClick={() => onSetStep(Math.min(selectedTutorial.steps.length - 1, stepIndex + 1))}
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
      </div>

      <div className="comparison-grid">
        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Step {stepIndex + 1}</span>
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
      </div>
    </section>
  );
}
