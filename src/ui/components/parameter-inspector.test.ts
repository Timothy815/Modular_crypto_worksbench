import { describe, expect, it } from 'vitest';

import type { CompositeDef, IteratorDef } from '../../engine/composites';
import { BitShifter } from '../../engine/modules/bit-shifter';
import type { ModuleRegistry, Project } from '../../engine/types';
import { resolveTraceModuleInstance } from '../transformation-resolver';

function createRoundComposite(): CompositeDef {
  return {
    id: 'RoundComposite',
    name: 'Round Composite',
    version: 1,
    kind: 'composite',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    project: {
      modules: [
        {
          id: 'shift-1',
          defId: 'BitShifter',
          params: { amount: 1, mode: 'rotate-left' },
        },
      ],
      connections: [],
    },
    layout: {},
    inputBindings: [{ externalPort: 'in', internalModuleId: 'shift-1', internalPort: 'in' }],
    outputBindings: [{ externalPort: 'out', internalModuleId: 'shift-1', internalPort: 'out' }],
  };
}

function createIterator(): IteratorDef {
  return {
    id: 'RoundIterator',
    name: 'Round Iterator',
    version: 1,
    kind: 'iterator',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    iterationCount: 3,
    roundDefId: 'RoundComposite',
  };
}

describe('resolveTraceModuleInstance', () => {
  it('resolves a top-level module directly', () => {
    const registry: ModuleRegistry = {
      BitShifter,
    };

    const project: Project = {
      modules: [{ id: 'shift-1', defId: 'BitShifter', params: { amount: 2, mode: 'left' } }],
      connections: [],
    };

    const resolved = resolveTraceModuleInstance('shift-1', project, registry);

    expect(resolved?.instance.id).toBe('shift-1');
    expect(resolved?.definition.id).toBe('BitShifter');
  });

  it('resolves modules inside composite traces', () => {
    const roundComposite = createRoundComposite();
    const registry: ModuleRegistry = {
      BitShifter,
      RoundComposite: roundComposite,
    };

    const project: Project = {
      modules: [{ id: 'comp-1', defId: 'RoundComposite', params: {} }],
      connections: [],
    };

    const resolved = resolveTraceModuleInstance('comp-1/shift-1', project, registry);

    expect(resolved?.instance.id).toBe('shift-1');
    expect(resolved?.definition.id).toBe('BitShifter');
  });

  it('resolves modules inside iterator round traces', () => {
    const roundComposite = createRoundComposite();
    const iterator = createIterator();
    const registry: ModuleRegistry = {
      BitShifter,
      RoundComposite: roundComposite,
      RoundIterator: iterator,
    };

    const project: Project = {
      modules: [{ id: 'iter-1', defId: 'RoundIterator', params: {} }],
      connections: [],
    };

    const resolved = resolveTraceModuleInstance('iter-1/round-2/shift-1', project, registry);

    expect(resolved?.instance.id).toBe('shift-1');
    expect(resolved?.definition.id).toBe('BitShifter');
  });

  it('respects iterator round-count overrides on the instance', () => {
    const roundComposite = createRoundComposite();
    const iterator = createIterator();
    const registry: ModuleRegistry = {
      BitShifter,
      RoundComposite: roundComposite,
      RoundIterator: iterator,
    };

    const project: Project = {
      modules: [{ id: 'iter-1', defId: 'RoundIterator', params: { iterationCount: 5 } }],
      connections: [],
    };

    const resolved = resolveTraceModuleInstance('iter-1/round-5/shift-1', project, registry);

    expect(resolved?.instance.id).toBe('shift-1');
    expect(resolved?.definition.id).toBe('BitShifter');
  });

  it('returns null when a nested module cannot be resolved', () => {
    const roundComposite = createRoundComposite();
    const registry: ModuleRegistry = {
      BitShifter,
      RoundComposite: roundComposite,
    };

    const project: Project = {
      modules: [{ id: 'comp-1', defId: 'RoundComposite', params: {} }],
      connections: [],
    };

    const resolved = resolveTraceModuleInstance('comp-1/missing-shift', project, registry);

    expect(resolved).toBeNull();
  });
});
