import { executeProject } from '../engine/executor';
import type { ModuleRegistry, Project } from '../engine/types';
import { validateProject } from '../engine/validation';
import { compareExecutionResults, type TraceDivergence } from './execution-compare';
import { cloneProject } from './project-clone';

const VERIFICATION_SOURCE_DEF_IDS = new Set([
  'TextInput',
  'AsciiSource',
  'BaudotSource',
  'HexSource',
]);

export interface VerificationSourceOption {
  moduleId: string;
  defId: string;
  label: string;
}

export interface VerificationCase {
  id: string;
  sourceModuleId: string;
  sourceDefId: string;
  sourceLabel: string;
  inputValue: string;
  expectedOutput: string;
}

export interface VerificationCaseResult {
  caseId: string;
  sourceLabel: string;
  inputValue: string;
  expectedOutput: string;
  baselineOutput: string;
  actualOutput: string;
  passed: boolean;
  divergence: TraceDivergence | null;
  error: string | null;
}

export function getVerificationSourceOptions(
  project: Project,
  registry: ModuleRegistry,
): VerificationSourceOption[] {
  return project.modules
    .filter((moduleInstance) => VERIFICATION_SOURCE_DEF_IDS.has(moduleInstance.defId))
    .map((moduleInstance) => ({
      moduleId: moduleInstance.id,
      defId: moduleInstance.defId,
      label: `${moduleInstance.id} (${registry[moduleInstance.defId]?.name ?? moduleInstance.defId})`,
    }));
}

export function createVerificationCaseFromBaseline(args: {
  baselineProject: Project;
  registry: ModuleRegistry;
  sourceOption: VerificationSourceOption;
  inputValue: string;
}): { case: VerificationCase; error: null } | { case: null; error: string } {
  const { baselineProject, registry, sourceOption, inputValue } = args;
  const referenceProject = applyVerificationSourceValue(
    baselineProject,
    sourceOption.moduleId,
    inputValue,
  );
  const validation = validateProject(referenceProject, registry);

  if (!validation.ok) {
    return {
      case: null,
      error: 'The captured baseline cannot run this verification case.',
    };
  }

  try {
    const referenceExecution = executeProject(referenceProject, registry);
    return {
      case: {
        id: createVerificationCaseId(),
        sourceModuleId: sourceOption.moduleId,
        sourceDefId: sourceOption.defId,
        sourceLabel: sourceOption.label,
        inputValue,
        expectedOutput:
          compareExecutionResults(referenceExecution, referenceExecution).baselineOutput.formatted,
      },
      error: null,
    };
  } catch (error) {
    return {
      case: null,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to build a verification case from the captured baseline.',
    };
  }
}

export function evaluateVerificationCases(args: {
  baselineProject: Project;
  currentProject: Project;
  registry: ModuleRegistry;
  cases: VerificationCase[];
}): VerificationCaseResult[] {
  const { baselineProject, currentProject, registry, cases } = args;

  return cases.map((verificationCase) => {
    const referenceProject = applyVerificationSourceValue(
      baselineProject,
      verificationCase.sourceModuleId,
      verificationCase.inputValue,
    );
    const variantProject = applyVerificationSourceValue(
      currentProject,
      verificationCase.sourceModuleId,
      verificationCase.inputValue,
    );
    const referenceValidation = validateProject(referenceProject, registry);
    const variantValidation = validateProject(variantProject, registry);

    if (!referenceValidation.ok) {
      return {
        caseId: verificationCase.id,
        sourceLabel: verificationCase.sourceLabel,
        inputValue: verificationCase.inputValue,
        expectedOutput: verificationCase.expectedOutput,
        baselineOutput: 'blocked',
        actualOutput: 'blocked',
        passed: false,
        divergence: null,
        error: 'Captured baseline is no longer valid for this verification case.',
      };
    }

    if (!variantValidation.ok) {
      return {
        caseId: verificationCase.id,
        sourceLabel: verificationCase.sourceLabel,
        inputValue: verificationCase.inputValue,
        expectedOutput: verificationCase.expectedOutput,
        baselineOutput: 'blocked',
        actualOutput: 'blocked',
        passed: false,
        divergence: null,
        error: 'Current workspace is not valid for this verification case.',
      };
    }

    try {
      const referenceExecution = executeProject(referenceProject, registry);
      const variantExecution = executeProject(variantProject, registry);
      const comparison = compareExecutionResults(referenceExecution, variantExecution);
      const actualOutput = comparison.variantOutput.formatted;
      const baselineOutput = comparison.baselineOutput.formatted;
      const passed = actualOutput === verificationCase.expectedOutput;

      return {
        caseId: verificationCase.id,
        sourceLabel: verificationCase.sourceLabel,
        inputValue: verificationCase.inputValue,
        expectedOutput: verificationCase.expectedOutput,
        baselineOutput,
        actualOutput,
        passed,
        divergence: passed ? null : comparison.firstDivergence,
        error: null,
      };
    } catch (error) {
      return {
        caseId: verificationCase.id,
        sourceLabel: verificationCase.sourceLabel,
        inputValue: verificationCase.inputValue,
        expectedOutput: verificationCase.expectedOutput,
        baselineOutput: 'blocked',
        actualOutput: 'blocked',
        passed: false,
        divergence: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to execute this verification case.',
      };
    }
  });
}

function applyVerificationSourceValue(
  project: Project,
  sourceModuleId: string,
  inputValue: string,
): Project {
  const nextProject = cloneProject(project);
  nextProject.modules = nextProject.modules.map((moduleInstance) =>
    moduleInstance.id === sourceModuleId
      ? {
          ...moduleInstance,
          params: {
            ...moduleInstance.params,
            value: inputValue,
          },
        }
      : moduleInstance,
  );
  return nextProject;
}

function createVerificationCaseId() {
  return `verification-${Math.random().toString(36).slice(2, 10)}`;
}
