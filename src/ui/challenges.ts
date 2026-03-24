import { deriveTickCount, executeProject, executeTickedProject } from '../engine/executor';
import { isStatefulModule, type ModuleRegistry, type Project, type ValidationIssue } from '../engine/types';
import { validateProject } from '../engine/validation';
import type { ExecutionComparison } from './execution-compare';
import { compareExecutionResults } from './execution-compare';
import type { ExecutionResult, ExecutionTraceEntry } from '../engine/types';
import type { WorkbenchPosition } from './workbench-document';

export interface GuidedChallenge {
  version?: 1;
  id: string;
  title: string;
  projectId?: string;
  group?: string;
  difficulty?: 'beginner' | 'intermediate' | 'expert';
  prompt: string;
  startingProject: Project;
  startingLayout?: Record<string, WorkbenchPosition>;
  targetProject: Project;
  success: ChallengeSuccessCondition;
  hints?: string[];
}

export interface ChallengeSuccessCondition {
  kind: 'output-match-target' | 'output-match-target-with-module-difference';
  moduleIds?: string[];
}

export interface ChallengeEvaluation {
  status: 'success' | 'failure' | 'blocked';
  reason:
    | 'matched-target'
    | 'diverged-from-target'
    | 'matched-target-but-input-not-different'
    | 'current-project-invalid'
    | 'target-project-invalid'
    | 'current-project-runtime-error'
    | 'target-project-runtime-error';
  comparison: ExecutionComparison | null;
  currentIssues: ValidationIssue[];
  targetIssues: ValidationIssue[];
  currentRuntimeError: string | null;
  targetRuntimeError: string | null;
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
      currentRuntimeError: null,
      targetRuntimeError: null,
    };
  }

  if (!targetValidation.ok) {
    return {
      status: 'blocked',
      reason: 'target-project-invalid',
      comparison: null,
      currentIssues: currentValidation.issues,
      targetIssues: targetValidation.issues,
      currentRuntimeError: null,
      targetRuntimeError: null,
    };
  }

  const currentTickCount = deriveTickCount(currentProject, registry);
  const targetTickCount = deriveTickCount(challenge.targetProject, registry);
  const useTickedComparison =
    hasExplicitTimeBehavior(currentProject, registry) ||
    hasExplicitTimeBehavior(challenge.targetProject, registry);

  let currentExecution;
  let currentTickedExecution;
  try {
    if (useTickedComparison) {
      currentTickedExecution = executeTickedProject(
        currentProject,
        registry,
        currentTickCount ?? 0,
      );
    } else {
      currentExecution = executeProject(currentProject, registry);
    }
  } catch (error) {
    return {
      status: 'blocked',
      reason: 'current-project-runtime-error',
      comparison: null,
      currentIssues: currentValidation.issues,
      targetIssues: targetValidation.issues,
      currentRuntimeError: error instanceof Error ? error.message : 'Current project execution failed.',
      targetRuntimeError: null,
    };
  }

  let targetExecution;
  let targetTickedExecution;
  try {
    if (useTickedComparison) {
      targetTickedExecution = executeTickedProject(
        challenge.targetProject,
        registry,
        targetTickCount ?? 0,
      );
    } else {
      targetExecution = executeProject(challenge.targetProject, registry);
    }
  } catch (error) {
    return {
      status: 'blocked',
      reason: 'target-project-runtime-error',
      comparison: null,
      currentIssues: currentValidation.issues,
      targetIssues: targetValidation.issues,
      currentRuntimeError: null,
      targetRuntimeError: error instanceof Error ? error.message : 'Target project execution failed.',
    };
  }

  const comparison = useTickedComparison
    ? compareTickedChallengeResults(
        targetTickedExecution ?? executeTickedProject(challenge.targetProject, registry, 0),
        currentTickedExecution ?? executeTickedProject(currentProject, registry, 0),
      )
    : compareExecutionResults(targetExecution!, currentExecution!);
  const matched =
    challenge.success.kind === 'output-match-target'
      ? comparison.outputsMatch
      : challenge.success.kind === 'output-match-target-with-module-difference'
        ? comparison.outputsMatch &&
          hasModuleDifference(
            currentProject,
            challenge.targetProject,
            challenge.success.moduleIds ?? [],
          )
        : false;

  const reason =
    challenge.success.kind === 'output-match-target-with-module-difference' &&
    comparison.outputsMatch &&
    !hasModuleDifference(
      currentProject,
      challenge.targetProject,
      challenge.success.moduleIds ?? [],
    )
      ? 'matched-target-but-input-not-different'
      : matched
        ? 'matched-target'
        : 'diverged-from-target';

  return {
    status: matched ? 'success' : 'failure',
    reason,
    comparison,
    currentIssues: currentValidation.issues,
    targetIssues: targetValidation.issues,
    currentRuntimeError: null,
    targetRuntimeError: null,
  };
}

function hasModuleDifference(
  currentProject: Project,
  targetProject: Project,
  moduleIds: string[],
): boolean {
  return moduleIds.some((moduleId) => {
    const currentModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === moduleId);
    const targetModule = targetProject.modules.find((moduleInstance) => moduleInstance.id === moduleId);

    if (!currentModule || !targetModule) {
      return false;
    }

    return JSON.stringify(currentModule.params) !== JSON.stringify(targetModule.params);
  });
}

function compareTickedChallengeResults(
  baseline: ReturnType<typeof executeTickedProject>,
  variant: ReturnType<typeof executeTickedProject>,
): ExecutionComparison {
  const baselineOutput = collectTickedOutput(baseline);
  const variantOutput = collectTickedOutput(variant);
  const firstDivergence = findFirstTickedDivergence(baseline, variant);

  return {
    baselineOutput: {
      raw: { type: 'symbol', value: baselineOutput },
      formatted: baselineOutput || 'n/a',
    },
    variantOutput: {
      raw: { type: 'symbol', value: variantOutput },
      formatted: variantOutput || 'n/a',
    },
    outputsMatch: baselineOutput === variantOutput,
    firstDivergence,
  };
}

function collectTickedOutput(result: ReturnType<typeof executeTickedProject>): string {
  return result.ticks
    .map((tick) => {
      const outputModule = tick.trace.find(
        (entry) => entry.defId === 'Output' || entry.defId === 'BitOutput',
      );
      const signal =
        outputModule?.outputs.out ??
        outputModule?.inputs.in ??
        null;

      if (!signal) {
        return '';
      }

      return signal.type === 'symbol' ? signal.value : signal.value.join('');
    })
    .join('');
}

function hasExplicitTimeBehavior(project: Project, registry: ModuleRegistry): boolean {
  return project.modules.some((moduleInstance) => {
    const def = registry[moduleInstance.defId];
    if (!def) {
      return false;
    }

    return def.id === 'Clock' || isStatefulModule(def);
  });
}

function findFirstTickedDivergence(
  baseline: ReturnType<typeof executeTickedProject>,
  variant: ReturnType<typeof executeTickedProject>,
): ExecutionComparison['firstDivergence'] {
  const maxTicks = Math.max(baseline.ticks.length, variant.ticks.length);

  for (let tickIndex = 0; tickIndex < maxTicks; tickIndex += 1) {
    const baselineTick = baseline.ticks[tickIndex] ?? null;
    const variantTick = variant.ticks[tickIndex] ?? null;

    if (!baselineTick || !variantTick) {
      return {
        stepIndex: tickIndex,
        tickIndex,
        baseline: getOutputTraceEntry(baselineTick),
        variant: getOutputTraceEntry(variantTick),
        reason: 'trace-length',
      };
    }

    const perTickComparison = compareExecutionResults(baselineTick, variantTick);
    if (!perTickComparison.outputsMatch) {
      if (perTickComparison.firstDivergence) {
        return {
          ...perTickComparison.firstDivergence,
          tickIndex,
        };
      }

      return {
        stepIndex: tickIndex,
        tickIndex,
        baseline: getOutputTraceEntry(baselineTick),
        variant: getOutputTraceEntry(variantTick),
        reason: 'outputs',
      };
    }
  }

  return null;
}

function getOutputTraceEntry(result: ExecutionResult | null): ExecutionTraceEntry | null {
  if (!result) {
    return null;
  }

  return (
    result.trace.find((entry) => entry.defId === 'Output' || entry.defId === 'BitOutput') ??
    result.trace.at(-1) ??
    null
  );
}
