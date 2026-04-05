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

// Mirrors real MCW port naming: outputs named 'out', inputs named 'a'/'b'/'in'
const registry = makeRegistry([
  { id: 'xor', inputs: [{ name: 'a', type: 'bits' }, { name: 'b', type: 'bits' }], outputs: [{ name: 'out', type: 'bits' }] },
  { id: 'and', inputs: [{ name: 'a', type: 'bits' }, { name: 'b', type: 'bits' }], outputs: [{ name: 'out', type: 'bits' }] },
  { id: 'sink', inputs: [{ name: 'in', type: 'bits' }], outputs: [] },
  { id: 'source', inputs: [], outputs: [{ name: 'out', type: 'bits' }] },
  { id: 'sym-pass', inputs: [{ name: 'in', type: 'symbol' }], outputs: [{ name: 'out', type: 'symbol' }] },
  // Module with port names that match (for matching-ports tests)
  { id: 'named', inputs: [{ name: 'out', type: 'bits' }], outputs: [{ name: 'out', type: 'bits' }] },
]);

describe('computeAutoWireConnections — general', () => {
  it('returns empty when fewer than 2 modules selected', () => {
    const project = makeProject([{ id: 'm1', defId: 'xor' }]);
    const result = computeAutoWireConnections(project, registry, ['m1'], {}, 'left-to-right');
    expect(result).toEqual([]);
  });

  it('does not overwrite an existing input connection', () => {
    const project = makeProject(
      [{ id: 'xor1', defId: 'xor' }, { id: 'sink1', defId: 'sink' }],
      [{ fromModuleId: 'xor1', fromPort: 'out', toModuleId: 'sink1', toPort: 'in' }],
    );
    const result = computeAutoWireConnections(
      project, registry, ['xor1', 'sink1'],
      { xor1: { x: 0, y: 0 }, sink1: { x: 200, y: 0 } },
      'left-to-right',
    );
    expect(result).toHaveLength(0);
  });
});

describe('computeAutoWireConnections — left-to-right (positional)', () => {
  it('connects XOR.out → sink.in by position even though names differ', () => {
    const project = makeProject([{ id: 'xor1', defId: 'xor' }, { id: 'sink1', defId: 'sink' }]);
    const layout = { xor1: { x: 100, y: 0 }, sink1: { x: 300, y: 0 } };
    const result = computeAutoWireConnections(project, registry, ['xor1', 'sink1'], layout, 'left-to-right');
    expect(result).toEqual([{ fromModuleId: 'xor1', fromPort: 'out', toModuleId: 'sink1', toPort: 'in' }]);
  });

  it('connects in x-sorted order, not selection order', () => {
    const project = makeProject([
      { id: 'xor1', defId: 'xor' },
      { id: 'sink1', defId: 'sink' },
    ]);
    // sink1 is on the left, xor1 on the right — no valid pair since xor has no inputs named 'in'
    // and sink has no outputs, so nothing should connect
    const layout = { xor1: { x: 300, y: 0 }, sink1: { x: 100, y: 0 } };
    const result = computeAutoWireConnections(project, registry, ['xor1', 'sink1'], layout, 'left-to-right');
    // sink1 is left, xor1 is right: sink1 has no outputs → nothing connects
    expect(result).toHaveLength(0);
  });

  it('only connects adjacent pairs in sorted order, not all pairs', () => {
    // Three modules: src → xor → sink
    const project = makeProject([
      { id: 'src1', defId: 'source' },
      { id: 'xor1', defId: 'xor' },
      { id: 'sink1', defId: 'sink' },
    ]);
    const layout = {
      src1: { x: 0, y: 0 },
      xor1: { x: 200, y: 0 },
      sink1: { x: 400, y: 0 },
    };
    const result = computeAutoWireConnections(
      project, registry, ['src1', 'xor1', 'sink1'], layout, 'left-to-right',
    );
    // src→xor: src.out → xor.a (first available bits input)
    // xor→sink: xor.out → sink.in
    expect(result).toContainEqual({ fromModuleId: 'src1', fromPort: 'out', toModuleId: 'xor1', toPort: 'a' });
    expect(result).toContainEqual({ fromModuleId: 'xor1', fromPort: 'out', toModuleId: 'sink1', toPort: 'in' });
    // src should NOT connect directly to sink (not adjacent)
    expect(result.some((c) => c.fromModuleId === 'src1' && c.toModuleId === 'sink1')).toBe(false);
  });

  it('does not connect across mismatched signal types', () => {
    const project = makeProject([
      { id: 'sym1', defId: 'sym-pass' },
      { id: 'sink1', defId: 'sink' },
    ]);
    // sym-pass outputs symbol, sink inputs bits — no compatible connection
    const layout = { sym1: { x: 0, y: 0 }, sink1: { x: 200, y: 0 } };
    const result = computeAutoWireConnections(project, registry, ['sym1', 'sink1'], layout, 'left-to-right');
    expect(result).toHaveLength(0);
  });
});

describe('computeAutoWireConnections — top-to-bottom (positional)', () => {
  it('connects upper module output to lower module input by y position', () => {
    const project = makeProject([{ id: 'xor1', defId: 'xor' }, { id: 'sink1', defId: 'sink' }]);
    const layout = { xor1: { x: 0, y: 50 }, sink1: { x: 0, y: 250 } };
    const result = computeAutoWireConnections(project, registry, ['xor1', 'sink1'], layout, 'top-to-bottom');
    expect(result).toEqual([{ fromModuleId: 'xor1', fromPort: 'out', toModuleId: 'sink1', toPort: 'in' }]);
  });
});

describe('computeAutoWireConnections — matching-ports (name-based)', () => {
  it('connects when output and input share exact name and type', () => {
    // 'named' module: output 'out':bits, input 'out':bits (unusual but explicit)
    const project = makeProject([{ id: 'n1', defId: 'named' }, { id: 'n2', defId: 'named' }]);
    const result = computeAutoWireConnections(project, registry, ['n1', 'n2'], {}, 'matching-ports');
    // n1.out → n2.out (input named 'out')
    expect(result).toContainEqual({ fromModuleId: 'n1', fromPort: 'out', toModuleId: 'n2', toPort: 'out' });
  });

  it('does not connect xor.out to sink.in because names differ', () => {
    const project = makeProject([{ id: 'xor1', defId: 'xor' }, { id: 'sink1', defId: 'sink' }]);
    // xor output is 'out', sink input is 'in' — names don't match
    const result = computeAutoWireConnections(project, registry, ['xor1', 'sink1'], {}, 'matching-ports');
    expect(result).toHaveLength(0);
  });

  it('does not assign the same input port to two sources', () => {
    const reg = makeRegistry([
      { id: 'src', inputs: [], outputs: [{ name: 'out', type: 'bits' }] },
      { id: 'snk', inputs: [{ name: 'out', type: 'bits' }], outputs: [] },
    ]);
    const project = makeProject([
      { id: 'src1', defId: 'src' },
      { id: 'src2', defId: 'src' },
      { id: 'snk1', defId: 'snk' },
    ]);
    const result = computeAutoWireConnections(project, reg, ['src1', 'src2', 'snk1'], {}, 'matching-ports');
    const toSnk = result.filter((c) => c.toModuleId === 'snk1' && c.toPort === 'out');
    expect(toSnk).toHaveLength(1);
  });
});
