import type { ExecutionResult, ExecutionTraceEntry, Signal } from '../engine/types';

export interface ComparedSignal {
  raw: Signal | null;
  formatted: string;
}

export interface TraceDivergence {
  stepIndex: number;
  baseline: ExecutionTraceEntry | null;
  variant: ExecutionTraceEntry | null;
  reason: 'module-id' | 'def-id' | 'inputs' | 'outputs' | 'trace-length';
}

export interface ExecutionComparison {
  baselineOutput: ComparedSignal;
  variantOutput: ComparedSignal;
  outputsMatch: boolean;
  firstDivergence: TraceDivergence | null;
}

export function compareExecutionResults(
  baseline: ExecutionResult,
  variant: ExecutionResult,
): ExecutionComparison {
  const baselineOutput = getTerminalSignal(baseline);
  const variantOutput = getTerminalSignal(variant);

  return {
    baselineOutput,
    variantOutput,
    outputsMatch: areSignalsEqual(baselineOutput.raw, variantOutput.raw),
    firstDivergence: findFirstTraceDivergence(baseline, variant),
  };
}

export function findFirstTraceDivergence(
  baseline: ExecutionResult,
  variant: ExecutionResult,
): TraceDivergence | null {
  const maxLength = Math.max(baseline.trace.length, variant.trace.length);

  for (let stepIndex = 0; stepIndex < maxLength; stepIndex += 1) {
    const baselineEntry = baseline.trace[stepIndex] ?? null;
    const variantEntry = variant.trace[stepIndex] ?? null;

    if (!baselineEntry || !variantEntry) {
      return {
        stepIndex,
        baseline: baselineEntry,
        variant: variantEntry,
        reason: 'trace-length',
      };
    }

    if (baselineEntry.moduleId !== variantEntry.moduleId) {
      return {
        stepIndex,
        baseline: baselineEntry,
        variant: variantEntry,
        reason: 'module-id',
      };
    }

    if (baselineEntry.defId !== variantEntry.defId) {
      return {
        stepIndex,
        baseline: baselineEntry,
        variant: variantEntry,
        reason: 'def-id',
      };
    }

    if (!areRecordSignalsEqual(baselineEntry.inputs, variantEntry.inputs)) {
      return {
        stepIndex,
        baseline: baselineEntry,
        variant: variantEntry,
        reason: 'inputs',
      };
    }

    if (!areRecordSignalsEqual(baselineEntry.outputs, variantEntry.outputs)) {
      return {
        stepIndex,
        baseline: baselineEntry,
        variant: variantEntry,
        reason: 'outputs',
      };
    }
  }

  return null;
}

function getTerminalSignal(result: ExecutionResult): ComparedSignal {
  const terminalTrace = result.trace.at(-1);
  const terminalInput = terminalTrace?.inputs.in;
  const terminalOutput =
    terminalTrace && Object.values(terminalTrace.outputs)[0]
      ? Object.values(terminalTrace.outputs)[0]
      : null;
  const signal = terminalOutput ?? terminalInput ?? null;

  return {
    raw: signal,
    formatted: formatComparedSignal(signal),
  };
}

function areRecordSignalsEqual(
  left: Record<string, Signal>,
  right: Record<string, Signal>,
) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (!areSignalsEqual(left[key] ?? null, right[key] ?? null)) {
      return false;
    }
  }

  return true;
}

function areSignalsEqual(left: Signal | null, right: Signal | null) {
  if (left === null || right === null) {
    return left === right;
  }

  if (left.type !== right.type) {
    return false;
  }

  if (left.type === 'symbol') {
    return left.value === right.value;
  }

  return left.value.length === right.value.length && left.value.every((value, index) => value === right.value[index]);
}

function formatComparedSignal(signal: Signal | null) {
  if (!signal) {
    return 'n/a';
  }

  return signal.type === 'symbol'
    ? signal.value
    : `[${signal.value.join(', ')}]`;
}
