import {
  isConditionalDefinition,
  isIteratorDefinition,
  isMultiConditionalDefinition,
  type CompositeLibraryEntry,
  type IteratorDef,
} from '../engine/composites';
import type { ModuleDefinition, ModuleRegistry } from '../engine/types';
import { validateIteratorDef } from '../engine/validation';

interface CreateIteratorDefinitionArgs {
  registry: ModuleRegistry;
  name: string;
  id: string;
  roundDefId: string;
  iterationCount: number;
}

export interface CreateIteratorDefinitionResult {
  ok: boolean;
  entry?: CompositeLibraryEntry;
  error?: string;
}

export function isEligibleIteratorBodyDefinition(definition: ModuleDefinition): boolean {
  if (isIteratorDefinition(definition)) {
    return false;
  }

  const isStructured =
    isConditionalDefinition(definition) || isMultiConditionalDefinition(definition) || 'kind' in definition;

  if (!isStructured && typeof definition.evaluate !== 'function') {
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

export function createIteratorDefinition({
  registry,
  name,
  id,
  roundDefId,
  iterationCount,
}: CreateIteratorDefinitionArgs): CreateIteratorDefinitionResult {
  const trimmedName = name.trim();
  const trimmedId = id.trim();

  if (!trimmedName) {
    return { ok: false, error: 'Iterator name is required.' };
  }

  if (!trimmedId) {
    return { ok: false, error: 'Iterator id is required.' };
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmedId)) {
    return {
      ok: false,
      error: 'Iterator id must start with a letter and use only letters, numbers, underscores, or hyphens.',
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
    return { ok: false, error: 'Choose a round definition.' };
  }

  if (isIteratorDefinition(roundDefinition)) {
    return {
      ok: false,
      error: 'Iterators cannot currently repeat other Iterators. Choose a Primitive, Composite, or Conditional instead.',
    };
  }

  if (!isEligibleIteratorBodyDefinition(roundDefinition)) {
    return {
      ok: false,
      error: 'Iterator bodies must expose exactly one input named "in" and one output named "out" with matching signal shape.',
    };
  }

  if (!Number.isInteger(iterationCount) || iterationCount < 1) {
    return { ok: false, error: 'Iteration count must be a positive integer.' };
  }

  if ('iterationCount' in roundDefinition.paramSchema) {
    return {
      ok: false,
      error: 'Iterator bodies may not declare a param named "iterationCount" in V1.',
    };
  }

  const definition: IteratorDef = {
    id: trimmedId,
    name: trimmedName,
    kind: 'iterator',
    version: 1,
    inputs: [roundDefinition.inputs[0]],
    outputs: [roundDefinition.outputs[0]],
    paramSchema: {
      ...roundDefinition.paramSchema,
      iterationCount: {
        key: 'iterationCount',
        label: 'Round Count',
        kind: 'number',
        defaultValue: iterationCount,
        description: 'How many times to auto-unroll the repeated round chain.',
      },
    },
    roundDefId,
    iterationCount,
  };

  const validation = validateIteratorDef(definition, {
    ...registry,
    [trimmedId]: definition,
  });
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.issues[0]?.message ?? 'Iterator definition is invalid.',
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
