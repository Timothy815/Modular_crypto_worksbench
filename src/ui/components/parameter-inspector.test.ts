import { describe, expect, it } from 'vitest';

import type { CompositeDef, IteratorDef } from '../../engine/composites';
import { BitShifter } from '../../engine/modules/bit-shifter';
import type { ModuleRegistry, Project } from '../../engine/types';
import { resolveTraceModuleInstance } from '../transformation-resolver';

describe('resolveTraceModuleInstance', () => {
  it('resolves modules inside iterator round traces', () => {
    const roundComposite: CompositeDef = {
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

    const iterator: IteratorDef = {
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
});
