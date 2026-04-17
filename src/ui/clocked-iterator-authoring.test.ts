import { describe, expect, it } from 'vitest';

import type { ClockedIteratorDef } from '../engine/composites';
import { V1_REGISTRY } from '../engine/modules';
import type { ModuleDef, ModuleRegistry } from '../engine/types';
import {
  createClockedIteratorDefinition,
  isEligibleClockedIteratorBodyDefinition,
} from './clocked-iterator-authoring';

const PASS_BITS: ModuleDef = {
  id: 'PassBits',
  name: 'Pass Bits',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
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

const MISMATCHED_TYPES: ModuleDef = {
  id: 'MismatchedTypes',
  name: 'Mismatched Types',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  evaluate: () => ({ out: { type: 'symbol', value: '' } }),
};

const BASE_REGISTRY: ModuleRegistry = {
  ...V1_REGISTRY,
  PassBits: PASS_BITS,
  BadPorts: BAD_PORTS,
  MismatchedTypes: MISMATCHED_TYPES,
};

describe('isEligibleClockedIteratorBodyDefinition', () => {
  it('accepts a primitive with in/out bits ports', () => {
    expect(isEligibleClockedIteratorBodyDefinition(PASS_BITS)).toBe(true);
  });

  it('rejects a body with non-standard port names', () => {
    expect(isEligibleClockedIteratorBodyDefinition(BAD_PORTS)).toBe(false);
  });

  it('rejects a body with mismatched input/output types', () => {
    expect(isEligibleClockedIteratorBodyDefinition(MISMATCHED_TYPES)).toBe(false);
  });

  it('rejects a structural iterator as body', () => {
    const iterDef = BASE_REGISTRY['ByteRoundIterator'];
    if (!iterDef) return;
    expect(isEligibleClockedIteratorBodyDefinition(iterDef)).toBe(false);
  });

  it('rejects a clocked iterator as body', () => {
    const clockedDef = BASE_REGISTRY['ClockedByteRoundIterator'];
    if (!clockedDef) return;
    expect(isEligibleClockedIteratorBodyDefinition(clockedDef)).toBe(false);
  });
});

describe('createClockedIteratorDefinition', () => {
  it('creates a valid clocked iterator with halt policy', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'My Clocked Iterator',
      id: 'MyClockedIterator',
      roundDefId: 'PassBits',
      roundCount: 4,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(true);
    expect(result.entry).toBeDefined();
    const def = result.entry!.definition as ClockedIteratorDef;
    expect(def.kind).toBe('clocked-iterator');
    expect(def.roundCount).toBe(4);
    expect(def.endPolicy).toBe('halt');
    expect(def.roundDefId).toBe('PassBits');
    expect(def.inputs.some((p) => p.name === 'clock')).toBe(true);
    expect(def.inputs.some((p) => p.name === 'in')).toBe(true);
    expect(def.outputs[0]?.name).toBe('out');
  });

  it('creates a valid clocked iterator with wrap policy', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'My Wrap Iterator',
      id: 'MyWrapIterator',
      roundDefId: 'PassBits',
      roundCount: 3,
      endPolicy: 'wrap',
    });
    expect(result.ok).toBe(true);
    const def = result.entry!.definition as ClockedIteratorDef;
    expect(def.endPolicy).toBe('wrap');
  });

  it('rejects an empty name', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: '  ',
      id: 'MyId',
      roundDefId: 'PassBits',
      roundCount: 2,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/name/i);
  });

  it('rejects an empty id', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'Valid Name',
      id: '  ',
      roundDefId: 'PassBits',
      roundCount: 2,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/id/i);
  });

  it('rejects an id that starts with a number', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'Valid Name',
      id: '1InvalidId',
      roundDefId: 'PassBits',
      roundCount: 2,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a duplicate id', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'Pass Bits Again',
      id: 'PassBits',
      roundDefId: 'PassBits',
      roundCount: 2,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already exists/i);
  });

  it('rejects zero round count', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'My Iterator',
      id: 'MyIterator',
      roundDefId: 'PassBits',
      roundCount: 0,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/positive integer/i);
  });

  it('rejects negative round count', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'My Iterator',
      id: 'MyIterator',
      roundDefId: 'PassBits',
      roundCount: -1,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a body with wrong port names', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'My Iterator',
      id: 'MyIterator',
      roundDefId: 'BadPorts',
      roundCount: 2,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/in.*out/i);
  });

  it('rejects a nested clocked iterator as body', () => {
    const clockedDef = BASE_REGISTRY['ClockedByteRoundIterator'];
    if (!clockedDef) return;
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'Nested',
      id: 'NestedClocked',
      roundDefId: 'ClockedByteRoundIterator',
      roundCount: 2,
      endPolicy: 'halt',
    });
    expect(result.ok).toBe(false);
  });

  it('marks the entry source as user', () => {
    const result = createClockedIteratorDefinition({
      registry: BASE_REGISTRY,
      name: 'User Iterator',
      id: 'UserIterator',
      roundDefId: 'PassBits',
      roundCount: 5,
      endPolicy: 'wrap',
    });
    expect(result.ok).toBe(true);
    expect(result.entry!.source).toBe('user');
  });
});
