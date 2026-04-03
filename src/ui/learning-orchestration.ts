import type { Dispatch, SetStateAction } from 'react';

import type { ModuleRegistry } from '../engine/types';
import type { GuidedChallenge } from './challenges';
import { createChallengeCaptureDraft } from './challenge-capture';
import type { GuidedTutorial } from './tutorials';
import type { UiAction } from './store';
import type { WorkspaceMode } from './workspace-mode';
import {
  createTickedVerificationCaseFromBaseline,
  createVerificationCaseFromBaseline,
  type VerificationCase,
  type VerificationSourceOption,
} from './verification-workflow';
import type { ComparisonBaselineDocument } from './workbench-document';

export type LearningPanelTab = 'quickstart' | 'tutorial' | 'challenge' | 'cryptanalysis';

export interface TutorialSelectionPlan {
  panelTab: 'tutorial';
  projectId: string;
  tutorialId: string;
  targetStepIndex: number | null;
  needsGuideMode: boolean;
  shouldSwitchProject: boolean;
}

export interface ChallengeSelectionPlan {
  panelTab: 'challenge';
  projectId: string;
  challengeId: string;
  needsGuideMode: boolean;
  shouldSwitchProject: boolean;
}

export interface ChallengeCaptureDialogState {
  title: string;
  id: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  prompt: string;
  hints: string;
}

export function buildTutorialSelectionPlan(args: {
  activeProjectId: string;
  workspaceMode: WorkspaceMode;
  projectId: string;
  tutorialId: string;
  tutorials: GuidedTutorial[];
}): TutorialSelectionPlan {
  const nextTutorial = args.tutorials.find((tutorial) => tutorial.id === args.tutorialId) ?? null;
  return {
    panelTab: 'tutorial',
    projectId: args.projectId,
    tutorialId: args.tutorialId,
    targetStepIndex: nextTutorial?.steps[0]?.targetStepIndex ?? null,
    needsGuideMode:
      args.workspaceMode === 'cryptanalysis' && args.projectId === args.activeProjectId,
    shouldSwitchProject: args.projectId !== args.activeProjectId,
  };
}

export function buildChallengeSelectionPlan(args: {
  activeProjectId: string;
  workspaceMode: WorkspaceMode;
  challengeId: string;
  challenges: GuidedChallenge[];
}): ChallengeSelectionPlan {
  const nextChallenge = args.challenges.find((challenge) => challenge.id === args.challengeId) ?? null;
  const projectId = nextChallenge?.projectId ?? args.activeProjectId;
  return {
    panelTab: 'challenge',
    projectId,
    challengeId: args.challengeId,
    needsGuideMode:
      args.workspaceMode === 'cryptanalysis' && projectId === args.activeProjectId,
    shouldSwitchProject: projectId !== args.activeProjectId,
  };
}

export function applyTutorialSelectionPlan(args: {
  plan: TutorialSelectionPlan;
  activeProjectId: string;
  dispatch: Dispatch<UiAction>;
  setLearningPanelTab: Dispatch<SetStateAction<LearningPanelTab>>;
  setStepIndex: Dispatch<SetStateAction<number | null>>;
}) {
  const { plan, activeProjectId, dispatch, setLearningPanelTab, setStepIndex } = args;
  setLearningPanelTab(plan.panelTab);
  if (plan.needsGuideMode) {
    dispatch({
      type: 'setWorkspaceMode',
      projectId: activeProjectId,
      mode: 'guide',
    });
  }
  if (plan.shouldSwitchProject) {
    dispatch({
      type: 'switchProject',
      projectId: plan.projectId,
    });
  }
  setStepIndex(plan.targetStepIndex);
  dispatch({
    type: 'selectTutorial',
    projectId: plan.projectId,
    tutorialId: plan.tutorialId,
  });
}

export function applyChallengeSelectionPlan(args: {
  plan: ChallengeSelectionPlan;
  activeProjectId: string;
  dispatch: Dispatch<UiAction>;
  setLearningPanelTab: Dispatch<SetStateAction<LearningPanelTab>>;
}) {
  const { plan, activeProjectId, dispatch, setLearningPanelTab } = args;
  setLearningPanelTab(plan.panelTab);
  if (plan.needsGuideMode) {
    dispatch({
      type: 'setWorkspaceMode',
      projectId: activeProjectId,
      mode: 'guide',
    });
  }
  if (plan.shouldSwitchProject) {
    dispatch({
      type: 'switchProject',
      projectId: plan.projectId,
    });
  }
  dispatch({
    type: 'selectChallenge',
    projectId: plan.projectId,
    challengeId: plan.challengeId,
  });
}

export function createChallengeCaptureDialogState(projectId: string, projectName: string) {
  const draft = createChallengeCaptureDraft(projectId, projectName);
  return {
    title: draft.title,
    id: draft.id,
    difficulty: draft.difficulty,
    prompt: draft.prompt,
    hints: draft.hints,
  } satisfies ChallengeCaptureDialogState;
}

export function addVerificationCasesToProject(
  current: Record<string, VerificationCase[]>,
  projectId: string,
  cases: VerificationCase[],
) {
  if (cases.length === 0) {
    return current;
  }

  return {
    ...current,
    [projectId]: [...(current[projectId] ?? []), ...cases],
  };
}

export function removeVerificationCaseFromProject(
  current: Record<string, VerificationCase[]>,
  projectId: string,
  caseId: string,
) {
  return {
    ...current,
    [projectId]: (current[projectId] ?? []).filter((entry) => entry.id !== caseId),
  };
}

export function clearVerificationCasesForProject(
  current: Record<string, VerificationCase[]>,
  projectId: string,
) {
  return {
    ...current,
    [projectId]: [],
  };
}

export function createVerificationCaseForProject(args: {
  comparisonBaseline: ComparisonBaselineDocument | null;
  verificationSourceOptions: VerificationSourceOption[];
  registry: ModuleRegistry;
  sourceModuleId: string;
  inputValue: string;
  projectId: string;
  casesByProject: Record<string, VerificationCase[]>;
  isTickedMode: boolean;
  tickCount?: number | null;
}): { nextCasesByProject: Record<string, VerificationCase[]>; error: string | null } {
  const {
    comparisonBaseline,
    verificationSourceOptions,
    registry,
    sourceModuleId,
    inputValue,
    projectId,
    casesByProject,
    isTickedMode,
    tickCount = null,
  } = args;

  if (!comparisonBaseline) {
    return {
      nextCasesByProject: casesByProject,
      error: 'Capture a baseline before adding verification cases.',
    };
  }

  const sourceOption =
    verificationSourceOptions.find((option) => option.moduleId === sourceModuleId) ?? null;
  if (!sourceOption) {
    return {
      nextCasesByProject: casesByProject,
      error: 'Choose a supported source module for verification.',
    };
  }

  const nextCase = isTickedMode
    ? createTickedVerificationCaseFromBaseline({
        baselineProject: comparisonBaseline.project,
        registry,
        sourceOption,
        inputValue,
        tickCount: tickCount ?? 0,
      })
    : createVerificationCaseFromBaseline({
        baselineProject: comparisonBaseline.project,
        registry,
        sourceOption,
        inputValue,
      });
  if (!nextCase.case) {
    return {
      nextCasesByProject: casesByProject,
      error: nextCase.error,
    };
  }

  return {
    nextCasesByProject: addVerificationCasesToProject(casesByProject, projectId, [nextCase.case]),
    error: null,
  };
}
