import { lazy, Suspense } from 'react';

import type { ChallengeEvaluation, GuidedChallenge } from '../challenges';
import type { ExecutionResult, ModuleRegistry, Project, TickedExecutionResult } from '../../engine/types';
import type { CryptanalysisMode } from '../cryptanalysis-mode';
import type { LearningPanelTab } from '../learning-orchestration';
import type { GuidedTutorial, TutorialStep } from '../tutorials';
import type { WorkspaceMode } from '../workspace-mode';
import type { SavedAnalysisCase } from '../workbench-document';

const ChallengePanel = lazy(() =>
  import('./challenge-panel').then((module) => ({ default: module.ChallengePanel })),
);
const QuickStartPanel = lazy(() =>
  import('./quick-start-panel').then((module) => ({ default: module.QuickStartPanel })),
);
const DemoAtlasPanel = lazy(() =>
  import('./demo-atlas-panel').then((module) => ({ default: module.DemoAtlasPanel })),
);
const TutorialPanel = lazy(() =>
  import('./tutorial-panel').then((module) => ({ default: module.TutorialPanel })),
);
const CryptanalysisPanel = lazy(() =>
  import('./cryptanalysis-panel').then((module) => ({ default: module.CryptanalysisPanel })),
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
  hasCryptanalysisPanel: boolean;
  activeLearningPanelTab: LearningPanelTab;
  onSetLearningPanelTab: (tab: LearningPanelTab) => void;
  selectedChallenge: GuidedChallenge | null;
  challenges: GuidedChallenge[];
  challengeEvaluation: ChallengeEvaluation | null;
  currentProject: Project;
  projectName: string;
  registry: ModuleRegistry;
  execution: ExecutionResult | null;
  isTickedMode: boolean;
  tickedExecution: TickedExecutionResult | null;
  canCaptureChallenge: boolean;
  ciphertext: string;
  cryptanalysisMode: CryptanalysisMode;
  modernBaseline: string;
  modernFlipBit: number;
  modernSourceId: string | null;
  modernSinkId: string | null;
  randomnessSinkId: string | null;
  classicalSelectedPeriod: number;
  classicalSelectedColumnIndex: number;
  classicalSelectedShiftsByColumnKey: Record<string, number>;
  savedAnalysisCases: SavedAnalysisCase[];
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
  onSetCryptanalysisMode: (mode: CryptanalysisMode) => void;
  onSetTutorialNotesVisible: (visible: boolean) => void;
  onCiphertextChange: (value: string) => void;
  onModernBaselineChange: (value: string) => void;
  onModernFlipBitChange: (value: number) => void;
  onModernSourceIdChange: (value: string | null) => void;
  onModernSinkIdChange: (value: string | null) => void;
  onRandomnessSinkIdChange: (value: string | null) => void;
  onClassicalSelectedPeriodChange: (value: number) => void;
  onClassicalSelectedColumnIndexChange: (value: number) => void;
  onClassicalSelectedShiftChange: (key: string, value: number) => void;
  onSaveAnalysisCase: (name: string) => void;
  onUpdateAnalysisCase: (caseId: string) => void;
  onRenameAnalysisCase: (caseId: string, name: string) => void;
  onDeleteAnalysisCase: (caseId: string) => void;
  onLoadAnalysisCase: (savedCase: SavedAnalysisCase) => void;
  onSelectTutorial: (tutorialId: string) => void;
  onOpenTutorialPath: (projectId: string, tutorialId: string) => void;
  onOpenPipelineMicroDemo: (pipelineId: string) => void;
  onSetTutorialStep: (stepIndex: number) => void;
  onSwitchProject: (projectId: string) => void;
  onFocusStepModule: (moduleId: string) => void;
  onResetTutorialProgress: () => void;
  onOpenManual: () => void;
}

export function LearningDock({
  hasTutorialPanel,
  hasChallengePanel,
  hasCryptanalysisPanel,
  activeLearningPanelTab,
  onSetLearningPanelTab,
  selectedChallenge,
  challenges,
  challengeEvaluation,
  currentProject,
  projectName,
  registry,
  execution,
  isTickedMode,
  tickedExecution,
  canCaptureChallenge,
  ciphertext,
  cryptanalysisMode,
  modernBaseline,
  modernFlipBit,
  modernSourceId,
  modernSinkId,
  randomnessSinkId,
  classicalSelectedPeriod,
  classicalSelectedColumnIndex,
  classicalSelectedShiftsByColumnKey,
  savedAnalysisCases,
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
  onSetCryptanalysisMode,
  onSetTutorialNotesVisible,
  onCiphertextChange,
  onModernBaselineChange,
  onModernFlipBitChange,
  onModernSourceIdChange,
  onModernSinkIdChange,
  onRandomnessSinkIdChange,
  onClassicalSelectedPeriodChange,
  onClassicalSelectedColumnIndexChange,
  onClassicalSelectedShiftChange,
  onSaveAnalysisCase,
  onUpdateAnalysisCase,
  onRenameAnalysisCase,
  onDeleteAnalysisCase,
  onLoadAnalysisCase,
  onSelectTutorial,
  onOpenTutorialPath,
  onOpenPipelineMicroDemo,
  onSetTutorialStep,
  onSwitchProject,
  onFocusStepModule,
  onResetTutorialProgress,
  onOpenManual,
}: LearningDockProps) {
  if (!hasChallengePanel && !hasTutorialPanel && !hasCryptanalysisPanel) {
    return null;
  }

  return (
    <section className="learning-dock">
      <div className="learning-dock-tabs" role="tablist" aria-label="Learning panel">
        <button
          type="button"
          role="tab"
          aria-selected={activeLearningPanelTab === 'quickstart'}
          className={
            activeLearningPanelTab === 'quickstart'
              ? 'learning-dock-tab active'
              : 'learning-dock-tab'
          }
          onClick={() => onSetLearningPanelTab('quickstart')}
        >
          Quick Start
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeLearningPanelTab === 'atlas'}
          className={
            activeLearningPanelTab === 'atlas'
              ? 'learning-dock-tab active'
              : 'learning-dock-tab'
          }
          onClick={() => onSetLearningPanelTab('atlas')}
        >
          Atlas
        </button>
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
            <span>Tutorial</span>
            <kbd className="learning-dock-tab-shortcut" aria-hidden="true">
              G
            </kbd>
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
            <span>Challenge</span>
            <kbd className="learning-dock-tab-shortcut" aria-hidden="true">
              C
            </kbd>
          </button>
        ) : null}
        {hasCryptanalysisPanel ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeLearningPanelTab === 'cryptanalysis'}
            className={
              activeLearningPanelTab === 'cryptanalysis'
                ? 'learning-dock-tab active'
                : 'learning-dock-tab'
            }
            onClick={() => onSetLearningPanelTab('cryptanalysis')}
          >
            <span>Cryptanalysis</span>
            <kbd className="learning-dock-tab-shortcut" aria-hidden="true">
              A
            </kbd>
          </button>
        ) : null}
      </div>

      {activeLearningPanelTab === 'quickstart' ? (
        <Suspense fallback={<LazyPanelFallback label="Quick Start" title="Preparing onboarding…" />}>
          <QuickStartPanel
            currentProjectId={currentProjectId}
            selectedTutorialId={selectedTutorial?.id ?? null}
            selectedChallengeId={selectedChallenge?.id ?? null}
            starterChallengeSolved={selectedChallenge?.id === 'repair-bridge-key' && challengeEvaluation?.status === 'success'}
            onOpenProject={onSwitchProject}
            onOpenTutorialPath={onOpenTutorialPath}
            onOpenPipelineMicroDemo={onOpenPipelineMicroDemo}
            onOpenChallenge={onSelectChallenge}
            onOpenManual={onOpenManual}
            onOpenCryptanalysis={() => {
              onSetWorkspaceMode('cryptanalysis');
              onSetLearningPanelTab('cryptanalysis');
            }}
          />
        </Suspense>
      ) : null}

      {activeLearningPanelTab === 'atlas' ? (
        <Suspense fallback={<LazyPanelFallback label="Atlas" title="Loading demo atlas…" />}>
          <DemoAtlasPanel
            currentProjectId={currentProjectId}
            onOpenProject={onSwitchProject}
            onOpenPipelineMicroDemo={onOpenPipelineMicroDemo}
          />
        </Suspense>
      ) : null}

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

      {activeLearningPanelTab === 'cryptanalysis' ? (
        <Suspense
          fallback={<LazyPanelFallback label="Cryptanalysis" title="Loading analysis workspace…" />}
        >
          <CryptanalysisPanel
            projectName={projectName}
            project={currentProject}
            registry={registry}
            execution={execution}
            isTickedMode={isTickedMode}
            tickedExecution={tickedExecution}
            ciphertext={ciphertext}
            cryptanalysisMode={cryptanalysisMode}
            modernBaseline={modernBaseline}
            modernFlipBit={modernFlipBit}
            modernSourceId={modernSourceId}
            modernSinkId={modernSinkId}
            randomnessSinkId={randomnessSinkId}
            classicalSelectedPeriod={classicalSelectedPeriod}
            classicalSelectedColumnIndex={classicalSelectedColumnIndex}
            classicalSelectedShiftsByColumnKey={classicalSelectedShiftsByColumnKey}
            savedAnalysisCases={savedAnalysisCases}
            workspaceMode={workspaceMode}
            tutorial={selectedTutorial?.projectId === currentProjectId ? selectedTutorial : null}
            tutorialStep={
              tutorialNotesVisible && selectedTutorial?.projectId === currentProjectId
                ? selectedTutorialStep
                : null
            }
            tutorialStepIndex={tutorialStepIndex}
            tutorialNotesVisible={tutorialNotesVisible}
            onSetWorkspaceMode={onSetWorkspaceMode}
            onSetCryptanalysisMode={onSetCryptanalysisMode}
            onSetTutorialNotesVisible={onSetTutorialNotesVisible}
            onCiphertextChange={onCiphertextChange}
            onModernBaselineChange={onModernBaselineChange}
            onModernFlipBitChange={onModernFlipBitChange}
            onModernSourceIdChange={onModernSourceIdChange}
            onModernSinkIdChange={onModernSinkIdChange}
            onRandomnessSinkIdChange={onRandomnessSinkIdChange}
            onClassicalSelectedPeriodChange={onClassicalSelectedPeriodChange}
            onClassicalSelectedColumnIndexChange={onClassicalSelectedColumnIndexChange}
            onClassicalSelectedShiftChange={onClassicalSelectedShiftChange}
            onSaveAnalysisCase={onSaveAnalysisCase}
            onUpdateAnalysisCase={onUpdateAnalysisCase}
            onRenameAnalysisCase={onRenameAnalysisCase}
            onDeleteAnalysisCase={onDeleteAnalysisCase}
            onLoadAnalysisCase={onLoadAnalysisCase}
            onSetTutorialStep={onSetTutorialStep}
            onFocusTutorialModule={onFocusStepModule}
            onOpenTutorialPath={onOpenTutorialPath}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
