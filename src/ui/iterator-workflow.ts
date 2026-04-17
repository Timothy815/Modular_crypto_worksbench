import type { IteratorDef } from '../engine/composites';
import type { ModuleParams } from '../engine/types';

export interface IteratorRoundSummary {
  defaultRounds: number;
  resolvedRounds: number;
  hasInstanceOverride: boolean;
}

export function getIteratorRoundSummary(
  definition: IteratorDef,
  params: ModuleParams,
): IteratorRoundSummary {
  const override = params.iterationCount;
  const hasValidOverride =
    typeof override === 'number' &&
    Number.isInteger(override) &&
    override > 0;

  return {
    defaultRounds: definition.iterationCount,
    resolvedRounds: hasValidOverride ? override : definition.iterationCount,
    hasInstanceOverride: hasValidOverride,
  };
}
