import { describe, expect, it } from 'vitest';

import type { CompositeDef, IteratorDef } from './composites';
import type { ModuleRegistry } from './types';
import { validateCompositeDef, validateIteratorDef } from './validation';

const registry: ModuleRegistry = {
  Source: {
    id: 'Source',
    name: 'Source',
    inputs: [],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: () => ({ out: { type: 'symbol', value: 'A' } }),
  },
  Loop: {
    id: 'Loop',
    name: 'Loop',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
  Sink: {
    id: 'Sink',
    name: 'Sink',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [],
    paramSchema: {},
    evaluate: () => ({}),
  },
};

describe('validateCompositeDef', () => {
  it('accepts a structurally valid composite definition', () => {
    const composite: CompositeDef = {
      id: 'SimpleChain',
      name: 'Simple Chain',
      kind: 'composite',
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [
          { id: 'loop-1', defId: 'Loop', params: {} },
        ],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'loop-1', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'loop-1', internalPort: 'out' },
      ],
    };

    const result = validateCompositeDef(composite, registry);

    expect(result.ok).toBe(true);
  });

  it('rejects unknown internal binding targets', () => {
    const composite: CompositeDef = {
      id: 'BrokenBinding',
      name: 'Broken Binding',
      kind: 'composite',
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [{ id: 'loop-1', defId: 'Loop', params: {} }],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'missing', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'loop-1', internalPort: 'out' },
      ],
    };

    const result = validateCompositeDef(composite, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-composite-binding')).toBe(true);
  });

  it('rejects duplicate external bindings', () => {
    const composite: CompositeDef = {
      id: 'DuplicateBinding',
      name: 'Duplicate Binding',
      kind: 'composite',
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [{ id: 'loop-1', defId: 'Loop', params: {} }],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'loop-1', internalPort: 'in' },
        { externalPort: 'in', internalModuleId: 'loop-1', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'loop-1', internalPort: 'out' },
      ],
    };

    const result = validateCompositeDef(composite, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-composite-binding')).toBe(true);
  });

  it('rejects mismatched binding types', () => {
    const composite: CompositeDef = {
      id: 'TypeMismatch',
      name: 'Type Mismatch',
      kind: 'composite',
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [{ id: 'loop-1', defId: 'Loop', params: {} }],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'loop-1', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'loop-1', internalPort: 'out' },
      ],
    };

    const result = validateCompositeDef(composite, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'signal-type-mismatch')).toBe(true);
  });

  it('rejects invalid internal graphs', () => {
    const composite: CompositeDef = {
      id: 'CyclicComposite',
      name: 'Cyclic Composite',
      kind: 'composite',
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [
          { id: 'a', defId: 'Loop', params: {} },
          { id: 'b', defId: 'Loop', params: {} },
        ],
        connections: [
          { from: { moduleId: 'a', port: 'out' }, to: { moduleId: 'b', port: 'in' } },
          { from: { moduleId: 'b', port: 'out' }, to: { moduleId: 'a', port: 'in' } },
        ],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'a', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'b', internalPort: 'out' },
      ],
    };

    const result = validateCompositeDef(composite, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'cycle-detected')).toBe(true);
  });
});

describe('validateIteratorDef', () => {
  it('accepts a structurally valid iterator definition', () => {
    const roundComposite: CompositeDef = {
      id: 'RoundComposite',
      name: 'Round Composite',
      kind: 'composite',
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [{ id: 'loop-1', defId: 'Loop', params: {} }],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'loop-1', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'loop-1', internalPort: 'out' },
      ],
    };
    const iterator: IteratorDef = {
      id: 'RoundIterator',
      name: 'Round Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      roundDefId: 'RoundComposite',
      iterationCount: 2,
    };

    const result = validateIteratorDef(iterator, {
      ...registry,
      RoundComposite: roundComposite,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects iterators with unknown round definitions', () => {
    const iterator: IteratorDef = {
      id: 'MissingRoundIterator',
      name: 'Missing Round Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      roundDefId: 'MissingRound',
      iterationCount: 2,
    };

    const result = validateIteratorDef(iterator, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'unknown-module-def')).toBe(true);
  });
});
