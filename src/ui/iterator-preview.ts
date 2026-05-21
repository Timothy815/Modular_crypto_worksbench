import type { ModuleDefinition, ModuleRegistry, SignalType } from '../engine/types';
import { isEligibleClockedIteratorBodyDefinition } from './clocked-iterator-authoring';
import { isEligibleIteratorBodyDefinition } from './iterator-authoring';

export interface ReusableInterfacePreview {
  ok: boolean;
  bodyName: string | null;
  inputs: Array<{ name: string; type: SignalType }>;
  outputs: Array<{ name: string; type: SignalType }>;
  structuralSummary: string;
  error?: string;
}

export function previewIteratorDefinition(
  registry: ModuleRegistry,
  roundDefId: string,
  iterationCount: number,
): ReusableInterfacePreview {
  const definition = registry[roundDefId];
  if (!definition) {
    return {
      ok: false,
      bodyName: null,
      inputs: [],
      outputs: [],
      structuralSummary: '',
      error: 'Choose a repeated body.',
    };
  }

  return buildPreview(definition, isEligibleIteratorBodyDefinition(definition), `${iterationCount}-round body`);
}

export function previewClockedIteratorDefinition(
  registry: ModuleRegistry,
  roundDefId: string,
  roundCount: number,
  endPolicy: 'halt' | 'wrap',
): ReusableInterfacePreview {
  const definition = registry[roundDefId];
  if (!definition) {
    return {
      ok: false,
      bodyName: null,
      inputs: [],
      outputs: [],
      structuralSummary: '',
      error: 'Choose a round body.',
    };
  }

  return buildPreview(
    definition,
    isEligibleClockedIteratorBodyDefinition(definition),
    `${roundCount}-step ${endPolicy} body`,
    true,
  );
}

function buildPreview(
  definition: ModuleDefinition,
  eligible: boolean,
  structuralLabel: string,
  includeClockInput = false,
): ReusableInterfacePreview {
  const baseInputs =
    definition.inputs.length > 0
      ? definition.inputs.map((port) => ({ name: port.name, type: port.type }))
      : [];
  const outputs =
    definition.outputs.length > 0
      ? definition.outputs.map((port) => ({ name: port.name, type: port.type }))
      : [];

  const inputs = includeClockInput
    ? [...baseInputs, { name: 'clock', type: 'bits' as SignalType }]
    : baseInputs;

  return {
    ok: eligible,
    bodyName: definition.name,
    inputs,
    outputs,
    structuralSummary: `${structuralLabel}: ${definition.name}`,
    error: eligible
      ? undefined
      : 'Chosen body must expose exactly one input named "in" and one output named "out" with matching signal shape.',
  };
}
