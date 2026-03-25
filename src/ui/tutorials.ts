import type { LearningSequenceMeta } from './learning-sequence';

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  focusModuleId?: string;
  targetStepIndex?: number;
}

export interface GuidedTutorial extends LearningSequenceMeta {
  version?: 1;
  id: string;
  title: string;
  group?: string;
  summary: string;
  projectId: string;
  steps: TutorialStep[];
}

export function clampTutorialStepIndex(
  tutorial: GuidedTutorial | null,
  stepIndex: number | null,
): number {
  if (!tutorial || tutorial.steps.length === 0) {
    return 0;
  }

  if (stepIndex === null || !Number.isFinite(stepIndex)) {
    return 0;
  }

  return Math.min(Math.max(0, Math.trunc(stepIndex)), tutorial.steps.length - 1);
}

export function getTutorialStep(
  tutorial: GuidedTutorial | null,
  stepIndex: number | null,
): TutorialStep | null {
  if (!tutorial || tutorial.steps.length === 0) {
    return null;
  }

  return tutorial.steps[clampTutorialStepIndex(tutorial, stepIndex)] ?? null;
}
