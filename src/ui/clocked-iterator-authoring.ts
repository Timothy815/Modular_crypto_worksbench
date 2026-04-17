import {
  isClockedIteratorDefinition,
  isIteratorDefinition,
  type ClockedIteratorDef,
  type CompositeLibraryEntry,
} from '../engine/composites';
import type { ModuleDefinition, ModuleRegistry } from '../engine/types';
import { validateClockedIteratorDef } from '../engine/validation';

interface CreateClockedIteratorDefinitionArgs {
  registry: ModuleRegistry;
  name: string;
  id: string;
  roundDefId: string;
  roundCount: number;
  endPolicy: 'halt' | 'wrap';
}

export interface CreateClockedIteratorDefinitionResult {
  ok: boolean;
  entry?: CompositeLibraryEntry;
  error?: string;
}

export function isEligibleClockedIteratorBodyDefinition(definition: ModuleDefinition): boolean {
  if (isIteratorDefinition(definition) || isClockedIteratorDefinition(definition)) {
    return false;
  }

  if (definition.inputs.length !== 1 || definition.outputs.length !== 1) {
    return false;
  }

  const input = definition.inputs[0];
  const output = definition.outputs[0];
  if (!input || !output) {
    return false;
  }

  return (
    input.name === 'in' &&
    output.name === 'out' &&
    input.type === output.type &&
    (input.kind ?? null) === (output.kind ?? null)
  );
}

export function createClockedIteratorDefinition({
  registry,
  name,
  id,
  roundDefId,
  roundCount,
  endPolicy,
}: CreateClockedIteratorDefinitionArgs): CreateClockedIteratorDefinitionResult {
  const trimmedName = name.trim();
  const trimmedId = id.trim();

  if (!trimmedName) {
    return { ok: false, error: 'Clocked iterator name is required.' };
  }

  if (!trimmedId) {
    return { ok: false, error: 'Clocked iterator id is required.' };
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmedId)) {
    return {
      ok: false,
      error: 'Id must start with a letter and use only letters, numbers, underscores, or hyphens.',
    };
  }

  if (registry[trimmedId]) {
    return {
      ok: false,
      error: `A module definition named "${trimmedId}" already exists.`,
    };
  }

  const roundDefinition = registry[roundDefId];
  if (!roundDefinition) {
    return { ok: false, error: 'Choose a round body.' };
  }

  if (isIteratorDefinition(roundDefinition) || isClockedIteratorDefinition(roundDefinition)) {
    return {
      ok: false,
      error: 'Clocked iterators cannot use iterator bodies. Choose a Primitive, Composite, or Conditional instead.',
    };
  }

  if (!isEligibleClockedIteratorBodyDefinition(roundDefinition)) {
    return {
      ok: false,
      error: 'Round bodies must expose exactly one input named "in" and one output named "out" with matching signal shape.',
    };
  }

  if (!Number.isInteger(roundCount) || roundCount < 1) {
    return { ok: false, error: 'Round count must be a positive integer.' };
  }

  if (endPolicy !== 'halt' && endPolicy !== 'wrap') {
    return { ok: false, error: 'End policy must be "halt" or "wrap".' };
  }

  const definition: ClockedIteratorDef = {
    id: trimmedId,
    name: trimmedName,
    kind: 'clocked-iterator',
    version: 1,
    inputs: [
      roundDefinition.inputs[0]!,
      { name: 'clock', type: 'bits', kind: 'scalar' },
    ],
    outputs: [roundDefinition.outputs[0]!],
    paramSchema: { ...roundDefinition.paramSchema },
    roundDefId,
    roundCount,
    endPolicy,
  };

  const validation = validateClockedIteratorDef(definition, {
    ...registry,
    [trimmedId]: definition,
  });
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.issues[0]?.message ?? 'Clocked iterator definition is invalid.',
    };
  }

  return {
    ok: true,
    entry: {
      id: trimmedId,
      name: trimmedName,
      version: 1,
      source: 'user',
      definition,
    },
  };
}
