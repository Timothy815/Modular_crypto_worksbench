import { lazy, Suspense } from 'react';

import type { ChallengeEvaluation, GuidedChallenge } from '../challenges';
import type { Project } from '../../engine/types';
import type { GuidedTutorial, TutorialStep } from '../tutorials';
import type { WorkspaceMode } from '../workspace-mode';

const ChallengePanel = lazy(() =>
  import('./challenge-panel').then((module) => ({ default: module.ChallengePanel })),
);
const TutorialPanel = lazy(() =>
  import('./tutorial-panel').then((module) => ({ default: module.TutorialPanel })),
);

function LazyPanelFallback({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <section className="panel comparison-panel">
      <div className="panel-head">
        <p className="panel-label">{label}</p>
        <h2>{title}</h2>
      </div>
    </section>
  );
}

interface LearningDockProps {
  hasTutorialPanel: boolean;
  hasChallengePanel: boolean;
  activeLearningPanelTab: 'tutorial' | 'challenge';
  onSetLearningPanelTab: (tab: 'tutorial' | 'challenge') => void;
  selectedChallenge: GuidedChallenge | null;
  challenges: GuidedChallenge[];
  challengeEvaluation: ChallengeEvaluation | null;
  currentProject: Project;
  canCaptureChallenge: boolean;
  onSelectChallenge: (challengeId: string) => void;
  onLoadChallengeStart: () => void;
  onExportChallenge: () => void;
  onImportChallenge: (file: File) => void;
  onCaptureChallenge: () => void;
  selectedTutorial: GuidedTutorial | null;
  tutorials: GuidedTutorial[];
  currentProjectId: string;
  tutorialStepIndex: number;
  selectedTutorialStep: TutorialStep | null;
  completedTutorialIds: string[];
  isTutorialCompleted: boolean;
  workspaceMode: WorkspaceMode;
  tutorialNotesVisible: boolean;
  onSetWorkspaceMode: (mode: WorkspaceMode) => void;
  onSetTutorialNotesVisible: (visible: boolean) => void;
  onSelectTutorial: (tutorialId: string) => void;
  onSetTutorialStep: (stepIndex: number) => void;
  onSwitchProject: (projectId: string) => void;
  onFocusStepModule: (moduleId: string) => void;
  onResetTutorialProgress: () => void;
}

export function LearningDock({
  hasTutorialPanel,
  hasChallengePanel,
  activeLearningPanelTab,
  onSetLearningPanelTab,
  selectedChallenge,
  challenges,
  challengeEvaluation,
  currentProject,
  canCaptureChallenge,
  onSelectChallenge,
  onLoadChallengeStart,
  onExportChallenge,
  onImportChallenge,
  onCaptureChallenge,
  selectedTutorial,
  tutorials,
  currentProjectId,
  tutorialStepIndex,
  selectedTutorialStep,
  completedTutorialIds,
  isTutorialCompleted,
  workspaceMode,
  tutorialNotesVisible,
  onSetWorkspaceMode,
  onSetTutorialNotesVisible,
  onSelectTutorial,
  onSetTutorialStep,
  onSwitchProject,
  onFocusStepModule,
  onResetTutorialProgress,
}: LearningDockProps) {
  if (!hasChallengePanel && !hasTutorialPanel) {
    return null;
  }

  return (
    <section className="learning-dock">
      <div className="learning-dock-tabs" role="tablist" aria-label="Learning panel">
        {hasTutorialPanel ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeLearningPanelTab === 'tutorial'}
            className={
              activeLearningPanelTab === 'tutorial'
                ? 'learning-dock-tab active'
                : 'learning-dock-tab'
            }
            onClick={() => onSetLearningPanelTab('tutorial')}
          >
            Tutorial
          </button>
        ) : null}
        {hasChallengePanel ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeLearningPanelTab === 'challenge'}
            className={
              activeLearningPanelTab === 'challenge'
                ? 'learning-dock-tab active'
                : 'learning-dock-tab'
            }
            onClick={() => onSetLearningPanelTab('challenge')}
          >
            Challenge
          </button>
        ) : null}
      </div>

      {activeLearningPanelTab === 'challenge' && selectedChallenge ? (
        <Suspense fallback={<LazyPanelFallback label="Challenge" title="Loading challenge…" />}>
          <ChallengePanel
            challenges={challenges}
            selectedChallengeId={selectedChallenge.id}
            evaluation={challengeEvaluation}
            currentProject={currentProject}
            canCaptureChallenge={canCaptureChallenge}
            onSelectChallenge={onSelectChallenge}
            onLoadChallengeStart={onLoadChallengeStart}
            onExportChallenge={onExportChallenge}
            onImportChallenge={onImportChallenge}
            onCaptureChallenge={onCaptureChallenge}
          />
        </Suspense>
      ) : null}

      {activeLearningPanelTab === 'tutorial' && selectedTutorial ? (
        <Suspense fallback={<LazyPanelFallback label="Tutorial" title="Loading tutorial…" />}>
          <TutorialPanel
            tutorials={tutorials}
            selectedTutorialId={selectedTutorial.id}
            currentProjectId={currentProjectId}
            stepIndex={tutorialStepIndex}
            activeStep={selectedTutorialStep}
            completedTutorialIds={completedTutorialIds}
            isCompleted={isTutorialCompleted}
            workspaceMode={workspaceMode}
            tutorialNotesVisible={tutorialNotesVisible}
            onSetWorkspaceMode={onSetWorkspaceMode}
            onSetTutorialNotesVisible={onSetTutorialNotesVisible}
            onSelectTutorial={onSelectTutorial}
            onSetStep={onSetTutorialStep}
            onSwitchProject={onSwitchProject}
            onFocusStepModule={onFocusStepModule}
            onResetProgress={onResetTutorialProgress}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
