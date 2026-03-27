import { describe, expect, it } from 'vitest';

import type { ModuleDefinition, ModuleInstance, Project } from '../engine/types';
import { buildParameterComparisonSummary } from './parameter-comparison';

const TEST_DEF: ModuleDefinition = {
  id: 'TestDef',
  name: 'TestDef',
  inputs: [],
  outputs: [],
  paramSchema: {
    rounds: {
      key: 'rounds',
      label: 'Rounds',
      kind: 'number',
      defaultValue: 4,
    },
    seed: {
      key: 'seed',
      label: 'Seed',
      kind: 'bits',
      defaultValue: [1, 0, 1, 0],
    },
  },
  evaluate: () => ({}),
};

function buildModule(id: string, params: ModuleInstance['params'] = {}): ModuleInstance {
  return {
    id,
    defId: TEST_DEF.id,
    params,
  };
}

function buildProject(modules: ModuleInstance[]): Project {
  return {
    modules,
    connections: [],
  };
}

describe('buildParameterComparisonSummary', () => {
  it('returns null when there are no additional selected modules', () => {
    const anchor = buildModule('round-1', { rounds: 8 });
    const summary = buildParameterComparisonSummary({
      project: buildProject([anchor]),
      moduleDef: TEST_DEF,
      moduleInstance: anchor,
      selectedModuleIds: ['round-1'],
    });

    expect(summary).toBeNull();
  });

  it('compares only same-definition selected siblings and marks divergent fields', () => {
    const anchor = buildModule('round-1', { rounds: 8, seed: [1, 0, 1, 0] });
    const aligned = buildModule('round-2', { rounds: 8, seed: [1, 0, 1, 0] });
    const divergent = buildModule('round-3', { rounds: 8, seed: [0, 0, 1, 0] });
    const incompatible: ModuleInstance = {
      id: 'source-1',
      defId: 'HexSource',
      params: { value: 'aa' },
    };

    const summary = buildParameterComparisonSummary({
      project: buildProject([anchor, aligned, divergent, incompatible]),
      moduleDef: TEST_DEF,
      moduleInstance: anchor,
      selectedModuleIds: ['round-1', 'round-2', 'round-3', 'source-1'],
    });

    expect(summary).not.toBeNull();
    expect(summary?.siblingModuleIds).toEqual(['round-2', 'round-3']);
    expect(summary?.incompatibleSelectedCount).toBe(1);
    expect(summary?.alignedFieldCount).toBe(1);
    expect(summary?.divergentFieldCount).toBe(1);
    expect(summary?.fieldsByKey.rounds).toMatchObject({
      status: 'aligned',
      alignedSiblingCount: 2,
      divergentSiblingCount: 0,
    });
    expect(summary?.fieldsByKey.seed).toMatchObject({
      status: 'divergent',
      alignedSiblingCount: 1,
      divergentSiblingCount: 1,
    });
  });

  it('returns an empty field summary when only incompatible modules are selected', () => {
    const anchor = buildModule('round-1', { rounds: 8 });
    const incompatible: ModuleInstance = {
      id: 'source-1',
      defId: 'HexSource',
      params: { value: 'aa' },
    };

    const summary = buildParameterComparisonSummary({
      project: buildProject([anchor, incompatible]),
      moduleDef: TEST_DEF,
      moduleInstance: anchor,
      selectedModuleIds: ['round-1', 'source-1'],
    });

    expect(summary).toEqual({
      siblingModuleIds: [],
      incompatibleSelectedCount: 1,
      alignedFieldCount: 0,
      divergentFieldCount: 0,
      fieldsByKey: {},
    });
  });
});
