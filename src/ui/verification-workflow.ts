import { executeProject, executeTickedProject } from '../engine/executor';
import { isOutputSinkDefId } from '../engine/output-sinks';
import type { ExecutionResult, ModuleRegistry, Project } from '../engine/types';
import { validateProject } from '../engine/validation';
import {
  compareExecutionResults,
  compareTickedExecutionResults,
  type TraceDivergence,
} from './execution-compare';
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
  mode: 'stateless' | 'ticked';
  sourceModuleId: string;
  sourceDefId: string;
  sourceLabel: string;
  targetSinkModuleId?: string;
  targetSinkLabel?: string;
  inputValue: string;
  expectedOutput: string;
  tickCount?: number;
}

export interface VerificationCaseResult {
  caseId: string;
  mode: 'stateless' | 'ticked';
  sourceLabel: string;
  inputValue: string;
  expectedOutput: string;
  baselineOutput: string;
  actualOutput: string;
  passed: boolean;
  divergence: TraceDivergence | null;
  error: string | null;
  tickCount?: number;
  targetSinkLabel?: string;
}

export interface VerificationImportPreview {
  cases: VerificationCase[];
  errors: string[];
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
  const normalizedInputValue = normalizeVerificationSourceInput(sourceOption.defId, inputValue);
  const referenceProject = applyVerificationSourceValue(
    baselineProject,
    sourceOption.moduleId,
    normalizedInputValue,
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
    const targetSink = resolveVerificationTargetSink(referenceExecution);
    return {
      case: {
        id: createVerificationCaseId(),
        mode: 'stateless',
        sourceModuleId: sourceOption.moduleId,
        sourceDefId: sourceOption.defId,
        sourceLabel: sourceOption.label,
        targetSinkModuleId: targetSink?.moduleId,
        targetSinkLabel: targetSink?.label,
        inputValue: normalizedInputValue,
        expectedOutput:
          compareExecutionResults(
            referenceExecution,
            referenceExecution,
            targetSink?.moduleId,
          ).baselineOutput.formatted,
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

export function createTickedVerificationCaseFromBaseline(args: {
  baselineProject: Project;
  registry: ModuleRegistry;
  sourceOption: VerificationSourceOption;
  inputValue: string;
  tickCount: number;
}): { case: VerificationCase; error: null } | { case: null; error: string } {
  const { baselineProject, registry, sourceOption, inputValue, tickCount } = args;
  if (!Number.isInteger(tickCount) || tickCount <= 0) {
    return {
      case: null,
      error: 'Tick count must be a positive integer.',
    };
  }

  const normalizedInputValue = normalizeVerificationSourceInput(sourceOption.defId, inputValue);
  const referenceProject = applyVerificationSourceValue(
    baselineProject,
    sourceOption.moduleId,
    normalizedInputValue,
  );
  const validation = validateProject(referenceProject, registry);

  if (!validation.ok) {
    return {
      case: null,
      error: 'The captured baseline cannot run this verification case.',
    };
  }

  try {
    const referenceExecution = executeTickedProject(referenceProject, registry, tickCount);
    const targetSink = resolveVerificationTargetSink(referenceExecution.ticks[0] ?? null);
    return {
      case: {
        id: createVerificationCaseId(),
        mode: 'ticked',
        sourceModuleId: sourceOption.moduleId,
        sourceDefId: sourceOption.defId,
        sourceLabel: sourceOption.label,
        targetSinkModuleId: targetSink?.moduleId,
        targetSinkLabel: targetSink?.label,
        inputValue: normalizedInputValue,
        expectedOutput: compareTickedExecutionResults(
          referenceExecution,
          referenceExecution,
          targetSink?.moduleId,
        ).baselineOutput.formatted,
        tickCount,
      },
      error: null,
    };
  } catch (error) {
    return {
      case: null,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to build a temporal verification case from the captured baseline.',
    };
  }
}

export function evaluateVerificationCases(args: {
  baselineProject: Project | null;
  currentProject: Project;
  registry: ModuleRegistry;
  cases: VerificationCase[];
}): VerificationCaseResult[] {
  const { baselineProject, currentProject, registry, cases } = args;

  return cases.map((verificationCase) => {
    const variantProject = applyVerificationSourceValue(
      currentProject,
      verificationCase.sourceModuleId,
      verificationCase.inputValue,
    );
    const variantValidation = validateProject(variantProject, registry);

    if (!variantValidation.ok) {
      return {
        caseId: verificationCase.id,
        mode: verificationCase.mode,
        sourceLabel: verificationCase.sourceLabel,
        inputValue: verificationCase.inputValue,
        expectedOutput: verificationCase.expectedOutput,
        baselineOutput: 'blocked',
        actualOutput: 'blocked',
        passed: false,
        divergence: null,
        error: 'Current workspace is not valid for this verification case.',
        tickCount: verificationCase.tickCount,
        targetSinkLabel: verificationCase.targetSinkLabel,
      };
    }

    try {
      const currentOutput =
        verificationCase.mode === 'ticked'
          ? compareTickedVerificationCase(
              variantProject,
              variantProject,
              registry,
              verificationCase.tickCount ?? 0,
              verificationCase.targetSinkModuleId,
            ).variantOutput.formatted
          : compareStatelessVerificationCase(
              variantProject,
              variantProject,
              registry,
              verificationCase.targetSinkModuleId,
            ).variantOutput.formatted;
      let baselineOutput = verificationCase.expectedOutput;
      let divergence: TraceDivergence | null = null;

      if (baselineProject) {
        const referenceProject = applyVerificationSourceValue(
          baselineProject,
          verificationCase.sourceModuleId,
          verificationCase.inputValue,
        );
        const referenceValidation = validateProject(referenceProject, registry);

        if (!referenceValidation.ok) {
          return {
            caseId: verificationCase.id,
            mode: verificationCase.mode,
            sourceLabel: verificationCase.sourceLabel,
            inputValue: verificationCase.inputValue,
            expectedOutput: verificationCase.expectedOutput,
            baselineOutput: 'blocked',
            actualOutput: 'blocked',
            passed: false,
            divergence: null,
            error: 'Captured baseline is no longer valid for this verification case.',
            tickCount: verificationCase.tickCount,
            targetSinkLabel: verificationCase.targetSinkLabel,
          };
        }

        const comparison =
          verificationCase.mode === 'ticked'
            ? compareTickedVerificationCase(
                referenceProject,
                variantProject,
                registry,
                verificationCase.tickCount ?? 0,
                verificationCase.targetSinkModuleId,
              )
            : compareStatelessVerificationCase(
                referenceProject,
                variantProject,
                registry,
                verificationCase.targetSinkModuleId,
              );
        baselineOutput = comparison.baselineOutput.formatted;
        if (
          baselineOutput === verificationCase.expectedOutput &&
          currentOutput !== verificationCase.expectedOutput
        ) {
          divergence = comparison.firstDivergence;
        }
      }

      const passed = currentOutput === verificationCase.expectedOutput;

      return {
        caseId: verificationCase.id,
        mode: verificationCase.mode,
        sourceLabel: verificationCase.sourceLabel,
        inputValue: verificationCase.inputValue,
        expectedOutput: verificationCase.expectedOutput,
        baselineOutput,
        actualOutput: currentOutput,
        passed,
        divergence: passed ? null : divergence,
        error: null,
        tickCount: verificationCase.tickCount,
        targetSinkLabel: verificationCase.targetSinkLabel,
      };
    } catch (error) {
      return {
        caseId: verificationCase.id,
        mode: verificationCase.mode,
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
        tickCount: verificationCase.tickCount,
        targetSinkLabel: verificationCase.targetSinkLabel,
      };
    }
  });
}

export function importVerificationCasesFromText(args: {
  baselineProject: Project | null;
  currentProject: Project;
  registry: ModuleRegistry;
  sourceOption: VerificationSourceOption;
  rawText: string;
  mode: 'stateless' | 'ticked';
  tickCount?: number | null;
}): VerificationImportPreview {
  const {
    baselineProject,
    currentProject,
    registry,
    sourceOption,
    rawText,
    mode,
    tickCount = null,
  } = args;
  const cases: VerificationCase[] = [];
  const errors: string[] = [];
  const lines = rawText.split(/\r?\n/);
  const normalizedTickCount =
    mode === 'ticked'
      ? Number.isInteger(tickCount) && (tickCount ?? 0) > 0
        ? tickCount ?? null
        : null
      : null;

  if (mode === 'ticked' && normalizedTickCount === null) {
    return {
      cases: [],
      errors: ['Tick count must be a positive integer for temporal vector import.'],
    };
  }

  lines.forEach((rawLine, index) => {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const withoutComment = trimmedLine.split('#')[0]?.trim() ?? '';
    const parsed = parseImportedVectorLine(withoutComment);
    if (!parsed) {
      errors.push(`Line ${index + 1}: expected "input -> output" or another supported delimiter.`);
      return;
    }

    const createdCase =
      mode === 'ticked'
        ? createImportedTickedVerificationCase({
            baselineProject,
            currentProject,
            registry,
            sourceOption,
            inputValue: parsed.inputValue,
            expectedOutput: parsed.expectedOutput,
            tickCount: normalizedTickCount ?? 0,
          })
        : createImportedVerificationCase({
            baselineProject,
            currentProject,
            registry,
            sourceOption,
            inputValue: parsed.inputValue,
            expectedOutput: parsed.expectedOutput,
          });
    if (!createdCase.case) {
      errors.push(`Line ${index + 1}: ${createdCase.error}`);
      return;
    }

    cases.push(createdCase.case);
  });

  return { cases, errors };
}

function compareStatelessVerificationCase(
  referenceProject: Project,
  variantProject: Project,
  registry: ModuleRegistry,
  targetSinkModuleId?: string,
) {
  const referenceExecution = executeProject(referenceProject, registry);
  const variantExecution = executeProject(variantProject, registry);
  return compareExecutionResults(referenceExecution, variantExecution, targetSinkModuleId);
}

function compareTickedVerificationCase(
  referenceProject: Project,
  variantProject: Project,
  registry: ModuleRegistry,
  tickCount: number,
  targetSinkModuleId?: string,
) {
  if (!Number.isInteger(tickCount) || tickCount <= 0) {
    throw new Error('Tick count must be a positive integer.');
  }

  const referenceExecution = executeTickedProject(referenceProject, registry, tickCount);
  const variantExecution = executeTickedProject(variantProject, registry, tickCount);
  return compareTickedExecutionResults(
    referenceExecution,
    variantExecution,
    targetSinkModuleId,
  );
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

function createImportedVerificationCase(args: {
  baselineProject: Project | null;
  currentProject: Project;
  registry: ModuleRegistry;
  sourceOption: VerificationSourceOption;
  inputValue: string;
  expectedOutput: string;
}): { case: VerificationCase; error: null } | { case: null; error: string } {
  const {
    baselineProject,
    currentProject,
    registry,
    sourceOption,
    inputValue,
    expectedOutput,
  } = args;
  const normalizedInputValue = normalizeVerificationSourceInput(sourceOption.defId, inputValue);
  const referenceProject = applyVerificationSourceValue(
    baselineProject ?? currentProject,
    sourceOption.moduleId,
    normalizedInputValue,
  );
  const validation = validateProject(referenceProject, registry);
  if (!validation.ok) {
    return {
      case: null,
      error: 'This workspace cannot run the imported case with the chosen source/input.',
    };
  }

  try {
    const execution = executeProject(referenceProject, registry);
    const targetSink = resolveVerificationTargetSink(execution);
    return {
      case: {
        id: createVerificationCaseId(),
        mode: 'stateless',
        sourceModuleId: sourceOption.moduleId,
        sourceDefId: sourceOption.defId,
        sourceLabel: sourceOption.label,
        targetSinkModuleId: targetSink?.moduleId,
        targetSinkLabel: targetSink?.label,
        inputValue: normalizedInputValue,
        expectedOutput: normalizeVerificationExpectedOutput(expectedOutput),
      },
      error: null,
    };
  } catch (error) {
    return {
      case: null,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create an imported verification case.',
    };
  }
}

function createImportedTickedVerificationCase(args: {
  baselineProject: Project | null;
  currentProject: Project;
  registry: ModuleRegistry;
  sourceOption: VerificationSourceOption;
  inputValue: string;
  expectedOutput: string;
  tickCount: number;
}): { case: VerificationCase; error: null } | { case: null; error: string } {
  const {
    baselineProject,
    currentProject,
    registry,
    sourceOption,
    inputValue,
    expectedOutput,
    tickCount,
  } = args;
  if (!Number.isInteger(tickCount) || tickCount <= 0) {
    return {
      case: null,
      error: 'Tick count must be a positive integer.',
    };
  }

  const normalizedInputValue = normalizeVerificationSourceInput(sourceOption.defId, inputValue);
  const referenceProject = applyVerificationSourceValue(
    baselineProject ?? currentProject,
    sourceOption.moduleId,
    normalizedInputValue,
  );
  const validation = validateProject(referenceProject, registry);
  if (!validation.ok) {
    return {
      case: null,
      error: 'This workspace cannot run the imported temporal case with the chosen source/input.',
    };
  }

  try {
    const execution = executeTickedProject(referenceProject, registry, tickCount);
    const targetSink = resolveVerificationTargetSink(execution.ticks[0] ?? null);
    return {
      case: {
        id: createVerificationCaseId(),
        mode: 'ticked',
        sourceModuleId: sourceOption.moduleId,
        sourceDefId: sourceOption.defId,
        sourceLabel: sourceOption.label,
        targetSinkModuleId: targetSink?.moduleId,
        targetSinkLabel: targetSink?.label,
        inputValue: normalizedInputValue,
        expectedOutput: normalizeVerificationExpectedOutput(expectedOutput),
        tickCount,
      },
      error: null,
    };
  } catch (error) {
    return {
      case: null,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create an imported temporal verification case.',
    };
  }
}

function parseImportedVectorLine(
  line: string,
): { inputValue: string; expectedOutput: string } | null {
  const separators = ['->', '\t', ':', ','];
  for (const separator of separators) {
    const separatorIndex = line.indexOf(separator);
    if (separatorIndex <= 0) {
      continue;
    }
    const inputValue = line.slice(0, separatorIndex).trim();
    const expectedOutput = line.slice(separatorIndex + separator.length).trim();
    if (!inputValue || !expectedOutput) {
      return null;
    }
    return { inputValue, expectedOutput };
  }
  return null;
}

function normalizeVerificationSourceInput(defId: string, inputValue: string) {
  const trimmed = inputValue.trim();
  if (defId !== 'HexSource') {
    return trimmed;
  }

  return trimmed.replace(/^0x/i, '').replace(/\s+/g, '').toUpperCase();
}

function normalizeVerificationExpectedOutput(value: string) {
  return value.trim();
}

function resolveVerificationTargetSink(result: ExecutionResult | null) {
  if (!result) {
    return null;
  }

  const targetEntry = result.trace.find((entry) => {
    const outputSignal = entry.outputs.out ?? entry.inputs.in ?? null;
    return isOutputSinkDefId(entry.defId) && outputSignal !== null;
  });
  if (!targetEntry) {
    return null;
  }

  return {
    moduleId: targetEntry.moduleId,
    label: `${targetEntry.moduleId} (${targetEntry.defId})`,
  };
}

function createVerificationCaseId() {
  return `verification-${Math.random().toString(36).slice(2, 10)}`;
}
