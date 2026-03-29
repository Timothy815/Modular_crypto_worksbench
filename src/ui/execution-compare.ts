import type {
  ExecutionResult,
  ExecutionTraceEntry,
  Signal,
  TickedExecutionResult,
} from '../engine/types';
import { isOutputSinkDefId } from '../engine/output-sinks';

export interface ComparedSignal {
  raw: Signal | null;
  formatted: string;
}

export interface TraceDivergence {
  stepIndex: number;
  tickIndex?: number;
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
  return findFirstEntryDivergence(baseline.trace, variant.trace);
}

export function findFirstAnalysisTraceDivergence(
  baseline: ExecutionResult,
  variant: ExecutionResult,
  ignoredModuleIds: string[] = [],
): TraceDivergence | null {
  return findFirstEntryDivergence(
    baseline.analysisTrace,
    variant.analysisTrace,
    new Set(ignoredModuleIds),
  );
}

export function compareTickedExecutionResults(
  baseline: TickedExecutionResult,
  variant: TickedExecutionResult,
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

export function collectTickedOutput(result: TickedExecutionResult): string {
  return result.ticks
    .map((tick) => {
      const outputModule = tick.trace.find((entry) => isOutputSinkDefId(entry.defId));
      const signal = outputModule?.outputs.out ?? outputModule?.inputs.in ?? null;

      if (!signal) {
        return '';
      }

      return signal.type === 'symbol' ? signal.value : signal.value.join('');
    })
    .join('');
}

export function findFirstTickedDivergence(
  baseline: TickedExecutionResult,
  variant: TickedExecutionResult,
): TraceDivergence | null {
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

function findFirstEntryDivergence(
  baselineEntries: ExecutionTraceEntry[],
  variantEntries: ExecutionTraceEntry[],
  ignoredModuleIds: Set<string> = new Set(),
): TraceDivergence | null {
  const maxLength = Math.max(baselineEntries.length, variantEntries.length);

  for (let stepIndex = 0; stepIndex < maxLength; stepIndex += 1) {
    const baselineEntry = baselineEntries[stepIndex] ?? null;
    const variantEntry = variantEntries[stepIndex] ?? null;

    if (!baselineEntry || !variantEntry) {
      return {
        stepIndex,
        baseline: baselineEntry,
        variant: variantEntry,
        reason: 'trace-length',
      };
    }

    if (
      baselineEntry.moduleId === variantEntry.moduleId &&
      ignoredModuleIds.has(baselineEntry.moduleId)
    ) {
      continue;
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

function getOutputTraceEntry(result: ExecutionResult | null): ExecutionTraceEntry | null {
  if (!result) {
    return null;
  }

  return result.trace.find((entry) => isOutputSinkDefId(entry.defId)) ?? result.trace.at(-1) ?? null;
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
