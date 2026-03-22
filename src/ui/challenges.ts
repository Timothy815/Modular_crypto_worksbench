import { executeProject } from '../engine/executor';
import type { ModuleRegistry, Project, ValidationIssue } from '../engine/types';
import { validateProject } from '../engine/validation';
import type { ExecutionComparison } from './execution-compare';
import { compareExecutionResults } from './execution-compare';
import type { WorkbenchPosition } from './workbench-document';

export interface GuidedChallenge {
  version?: 1;
  id: string;
  title: string;
  prompt: string;
  startingProject: Project;
  startingLayout?: Record<string, WorkbenchPosition>;
  targetProject: Project;
  success: ChallengeSuccessCondition;
  hints?: string[];
}

export interface ChallengeSuccessCondition {
  kind: 'output-match-target';
}

export interface ChallengeEvaluation {
  status: 'success' | 'failure' | 'blocked';
  reason:
    | 'matched-target'
    | 'diverged-from-target'
    | 'current-project-invalid'
    | 'target-project-invalid';
  comparison: ExecutionComparison | null;
  currentIssues: ValidationIssue[];
  targetIssues: ValidationIssue[];
}

export function evaluateChallengeAttempt(
  challenge: GuidedChallenge,
  currentProject: Project,
  registry: ModuleRegistry,
): ChallengeEvaluation {
  const currentValidation = validateProject(currentProject, registry);
  const targetValidation = validateProject(challenge.targetProject, registry);

  if (!currentValidation.ok) {
    return {
      status: 'blocked',
      reason: 'current-project-invalid',
      comparison: null,
      currentIssues: currentValidation.issues,
      targetIssues: targetValidation.issues,
    };
  }

  if (!targetValidation.ok) {
    return {
      status: 'blocked',
      reason: 'target-project-invalid',
      comparison: null,
      currentIssues: currentValidation.issues,
      targetIssues: targetValidation.issues,
    };
  }

  const currentExecution = executeProject(currentProject, registry);
  const targetExecution = executeProject(challenge.targetProject, registry);
  const comparison = compareExecutionResults(targetExecution, currentExecution);
  const matched =
    challenge.success.kind === 'output-match-target'
      ? comparison.outputsMatch
      : false;

  return {
    status: matched ? 'success' : 'failure',
    reason: matched ? 'matched-target' : 'diverged-from-target',
    comparison,
    currentIssues: currentValidation.issues,
    targetIssues: targetValidation.issues,
  };
}
