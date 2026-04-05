import { describe, expect, it } from 'vitest';

import type { ModuleDefinition, ModuleRegistry, Project } from '../engine/types';
import { computeAutoWireConnections } from './autowire-selection';

function makeRegistry(
  defs: Array<{
    id: string;
    inputs: Array<{ name: string; type: 'bits' | 'symbol' }>;
    outputs: Array<{ name: string; type: 'bits' | 'symbol' }>;
  }>,
): ModuleRegistry {
  const registry: ModuleRegistry = {};
  for (const def of defs) {
    registry[def.id] = {
      id: def.id,
      name: def.id,
      inputs: def.inputs,
      outputs: def.outputs,
      paramSchema: {},
      evaluate: () => ({}),
    } as unknown as ModuleDefinition;
  }
  return registry;
}

function makeProject(
  modules: Array<{ id: string; defId: string }>,
  connections: Array<{ fromModuleId: string; fromPort: string; toModuleId: string; toPort: string }> = [],
): Project {
  return {
    modules: modules.map((m) => ({ id: m.id, defId: m.defId, params: {} })),
    connections: connections.map((c) => ({
      from: { moduleId: c.fromModuleId, port: c.fromPort },
      to: { moduleId: c.toModuleId, port: c.toPort },
    })),
  };
}

const registry = makeRegistry([
  { id: 'xor', inputs: [{ name: 'a', type: 'bits' }, { name: 'b', type: 'bits' }], outputs: [{ name: 'out', type: 'bits' }] },
  { id: 'and', inputs: [{ name: 'a', type: 'bits' }, { name: 'b', type: 'bits' }], outputs: [{ name: 'out', type: 'bits' }] },
  { id: 'sink', inputs: [{ name: 'out', type: 'bits' }], outputs: [] },
  { id: 'source', inputs: [], outputs: [{ name: 'out', type: 'bits' }] },
  { id: 'sym', inputs: [{ name: 'text', type: 'symbol' }], outputs: [{ name: 'text', type: 'symbol' }] },
]);

describe('computeAutoWireConnections', () => {
  it('returns empty when fewer than 2 modules selected', () => {
    const project = makeProject([{ id: 'm1', defId: 'xor' }]);
    const result = computeAutoWireConnections(project, registry, ['m1'], {}, 'matching-ports');
    expect(result).toEqual([]);
  });

  it('matching-ports: connects output to input with same name', () => {
    const project = makeProject([
      { id: 'xor1', defId: 'xor' },
      { id: 'sink1', defId: 'sink' },
    ]);
    const result = computeAutoWireConnections(
      project,
      registry,
      ['xor1', 'sink1'],
      {},
      'matching-ports',
    );
    expect(result).toEqual([{ fromModuleId: 'xor1', fromPort: 'out', toModuleId: 'sink1', toPort: 'out' }]);
  });

  it('matching-ports: does not connect mismatched signal types', () => {
    const project = makeProject([
      { id: 's1', defId: 'sym' },
      { id: 'sink1', defId: 'sink' },
    ]);
    // sym outputs 'text':symbol, sink inputs 'out':bits — different names, no match
    const result = computeAutoWireConnections(
      project,
      registry,
      ['s1', 'sink1'],
      {},
      'matching-ports',
    );
    expect(result).toHaveLength(0);
  });

  it('matching-ports: does not overwrite an existing input connection', () => {
    const project = makeProject(
      [{ id: 'xor1', defId: 'xor' }, { id: 'sink1', defId: 'sink' }],
      [{ fromModuleId: 'xor1', fromPort: 'out', toModuleId: 'sink1', toPort: 'out' }],
    );
    const result = computeAutoWireConnections(
      project,
      registry,
      ['xor1', 'sink1'],
      {},
      'matching-ports',
    );
    expect(result).toHaveLength(0);
  });

  it('left-to-right: connects adjacent modules sorted by x position', () => {
    const project = makeProject([
      { id: 'xor1', defId: 'xor' },
      { id: 'sink1', defId: 'sink' },
      { id: 'xor2', defId: 'xor' },
    ]);
    const layout = {
      xor1: { x: 100, y: 0 },
      xor2: { x: 200, y: 0 },
      sink1: { x: 300, y: 0 },
    };
    const result = computeAutoWireConnections(
      project,
      registry,
      ['xor1', 'sink1', 'xor2'],
      layout,
      'left-to-right',
    );
    // xor1(out) → xor2(?) — xor2 has no 'out' input, but has 'a'/'b', no match
    // xor2(out) → sink1(out) — match
    expect(result).toEqual([
      { fromModuleId: 'xor2', fromPort: 'out', toModuleId: 'sink1', toPort: 'out' },
    ]);
  });

  it('top-to-bottom: connects adjacent modules sorted by y position', () => {
    const project = makeProject([
      { id: 'xor1', defId: 'xor' },
      { id: 'sink1', defId: 'sink' },
    ]);
    const layout = {
      xor1: { x: 0, y: 50 },
      sink1: { x: 0, y: 200 },
    };
    const result = computeAutoWireConnections(
      project,
      registry,
      ['xor1', 'sink1'],
      layout,
      'top-to-bottom',
    );
    expect(result).toEqual([
      { fromModuleId: 'xor1', fromPort: 'out', toModuleId: 'sink1', toPort: 'out' },
    ]);
  });

  it('does not assign the same input port twice', () => {
    // Two sources both have 'out' — only the first ordered pair should win
    const reg = makeRegistry([
      { id: 'src', inputs: [], outputs: [{ name: 'out', type: 'bits' }] },
      { id: 'snk', inputs: [{ name: 'out', type: 'bits' }], outputs: [] },
    ]);
    const project = makeProject([
      { id: 'src1', defId: 'src' },
      { id: 'src2', defId: 'src' },
      { id: 'snk1', defId: 'snk' },
    ]);
    const result = computeAutoWireConnections(
      project,
      reg,
      ['src1', 'src2', 'snk1'],
      {},
      'matching-ports',
    );
    // snk1's 'out' input should only be connected once
    const toSnk = result.filter((c) => c.toModuleId === 'snk1' && c.toPort === 'out');
    expect(toSnk).toHaveLength(1);
  });
});
