import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import type { ModuleDef, ModuleRegistry } from '../engine/types';
import { createIteratorDefinition, isEligibleIteratorBodyDefinition } from './iterator-authoring';

const PASS_BITS: ModuleDef = {
  id: 'PassBits',
  name: 'Pass Bits',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => ({ out: inputs.in }),
};

const PARAMETRIZED_SHIFT_BODY: ModuleDef = {
  id: 'ParameterizedShiftBody',
  name: 'Parameterized Shift Body',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    amount: {
      key: 'amount',
      label: 'Amount',
      kind: 'number',
      defaultValue: 1,
    },
    mode: {
      key: 'mode',
      label: 'Mode',
      kind: 'select',
      defaultValue: 'rotate-left',
      options: [
        { label: 'Rotate Left', value: 'rotate-left' },
        { label: 'Rotate Right', value: 'rotate-right' },
        { label: 'Left Shift', value: 'left' },
        { label: 'Right Shift', value: 'right' },
      ],
    },
  },
  evaluate: (inputs) => ({ out: inputs.in }),
};

const BAD_PORTS: ModuleDef = {
  id: 'BadPorts',
  name: 'Bad Ports',
  inputs: [{ name: 'data', type: 'bits' }],
  outputs: [{ name: 'result', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => ({ result: inputs.data }),
};

const EXTRA_INPUT: ModuleDef = {
  id: 'ExtraInput',
  name: 'Extra Input',
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'control', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => ({ out: inputs.in }),
};

const NESTED_ITERATOR = {
  id: 'NestedBody',
  name: 'Nested Body',
  kind: 'iterator' as const,
  version: 1,
  inputs: [{ name: 'in', type: 'bits' as const }],
  outputs: [{ name: 'out', type: 'bits' as const }],
  paramSchema: {
    iterationCount: {
      key: 'iterationCount',
      label: 'Round Count',
      kind: 'number' as const,
      defaultValue: 2,
    },
  },
  roundDefId: 'PassBits',
  iterationCount: 2,
};

describe('iterator authoring', () => {
  it('accepts bodies with exactly in/out and matching shape', () => {
    expect(isEligibleIteratorBodyDefinition(PASS_BITS)).toBe(true);
  });

  it('rejects bodies whose ports are not named in/out', () => {
    expect(isEligibleIteratorBodyDefinition(BAD_PORTS)).toBe(false);
  });

  it('creates a keyless iterator definition with per-instance iterationCount override schema', () => {
    const registry: ModuleRegistry = {
      ...V1_REGISTRY,
      PassBits: PASS_BITS,
    };

    const result = createIteratorDefinition({
      registry,
      name: 'My Iterator',
      id: 'MyIterator',
      roundDefId: 'PassBits',
      iterationCount: 3,
    });

    expect(result.ok).toBe(true);
    expect(result.entry?.definition.kind).toBe('iterator');
    if (!result.entry || result.entry.definition.kind !== 'iterator') {
      return;
    }
    expect(result.entry.definition.inputs).toEqual([{ name: 'in', type: 'bits' }]);
    expect(result.entry.definition.outputs).toEqual([{ name: 'out', type: 'bits' }]);
    expect(result.entry.definition.iterationCount).toBe(3);
    expect(result.entry.definition.roundDefId).toBe('PassBits');
    expect(result.entry.definition.paramSchema.iterationCount?.defaultValue).toBe(3);
  });

  it('inherits the body param schema so authored iterators can configure repeated rounds', () => {
    const registry: ModuleRegistry = {
      ...V1_REGISTRY,
      ParameterizedShiftBody: PARAMETRIZED_SHIFT_BODY,
    };

    const result = createIteratorDefinition({
      registry,
      name: 'Shift Iterator',
      id: 'ShiftIterator',
      roundDefId: 'ParameterizedShiftBody',
      iterationCount: 2,
    });

    expect(result.ok).toBe(true);
    if (!result.entry || result.entry.definition.kind !== 'iterator') {
      return;
    }

    expect(result.entry.definition.paramSchema.amount?.defaultValue).toBe(1);
    expect(result.entry.definition.paramSchema.mode?.defaultValue).toBe('rotate-left');
    expect(result.entry.definition.paramSchema.iterationCount?.defaultValue).toBe(2);
  });

  it('rejects bodies whose param schema already uses iterationCount', () => {
    const registry: ModuleRegistry = {
      ...V1_REGISTRY,
      ConflictingBody: {
        ...PASS_BITS,
        id: 'ConflictingBody',
        name: 'Conflicting Body',
        paramSchema: {
          iterationCount: {
            key: 'iterationCount',
            label: 'Conflicting Iteration Count',
            kind: 'number',
            defaultValue: 1,
          },
        },
      },
    };

    const result = createIteratorDefinition({
      registry,
      name: 'Conflicting Iterator',
      id: 'ConflictingIterator',
      roundDefId: 'ConflictingBody',
      iterationCount: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('may not declare a param named "iterationCount"');
  });

  it('rejects nested iterator bodies', () => {
    const registry: ModuleRegistry = {
      ...V1_REGISTRY,
      PassBits: PASS_BITS,
      NestedBody: NESTED_ITERATOR,
    };

    const result = createIteratorDefinition({
      registry,
      name: 'Nested',
      id: 'NestedIterator',
      roundDefId: 'NestedBody',
      iterationCount: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('cannot currently repeat other Iterators');
  });

  it('rejects bodies with additional external control inputs', () => {
    const registry: ModuleRegistry = {
      ...V1_REGISTRY,
      ExtraInput: EXTRA_INPUT,
    };

    const result = createIteratorDefinition({
      registry,
      name: 'Extra Input Iterator',
      id: 'ExtraInputIterator',
      roundDefId: 'ExtraInput',
      iterationCount: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('exactly one input named "in"');
  });
});
