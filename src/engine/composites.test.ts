import { describe, expect, it } from 'vitest';

import type { CompositeDef, ConditionalDef, IteratorDef } from './composites';
import type { ModuleRegistry } from './types';
import { validateCompositeDef, validateConditionalDef, validateIteratorDef, validateProject } from './validation';

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

  it('accepts a composite with a valid forwarded parameter', () => {
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
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Round Count',
          kind: 'number',
          defaultValue: 2,
        },
      },
      roundDefId: 'RoundComposite',
      iterationCount: 2,
    };
    const composite: CompositeDef = {
      id: 'ForwardedComposite',
      name: 'Forwarded Composite',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {
        rounds: {
          key: 'rounds',
          label: 'Rounds',
          kind: 'number',
          defaultValue: 2,
        },
      },
      project: {
        modules: [{ id: 'iterator-1', defId: 'RoundIterator', params: {} }],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'iterator-1', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'iterator-1', internalPort: 'out' },
      ],
      forwardedParams: [
        {
          externalParam: 'rounds',
          internalModuleId: 'iterator-1',
          internalParamKey: 'iterationCount',
        },
      ],
    };

    const result = validateCompositeDef(composite, {
      ...registry,
      RoundComposite: roundComposite,
      RoundIterator: iterator,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects a forwarded parameter targeting a missing internal param', () => {
    const composite: CompositeDef = {
      id: 'BrokenForwarding',
      name: 'Broken Forwarding',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {
        rounds: {
          key: 'rounds',
          label: 'Rounds',
          kind: 'number',
          defaultValue: 2,
        },
      },
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
      forwardedParams: [
        {
          externalParam: 'rounds',
          internalModuleId: 'loop-1',
          internalParamKey: 'iterationCount',
        },
      ],
    };

    const result = validateCompositeDef(composite, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-composite-binding')).toBe(true);
  });

  it('rejects a forwarded parameter with a kind mismatch', () => {
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
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Round Count',
          kind: 'number',
          defaultValue: 2,
        },
      },
      roundDefId: 'RoundComposite',
      iterationCount: 2,
    };
    const composite: CompositeDef = {
      id: 'KindMismatchForwarding',
      name: 'Kind Mismatch Forwarding',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {
        rounds: {
          key: 'rounds',
          label: 'Rounds',
          kind: 'string',
          defaultValue: '2',
        },
      },
      project: {
        modules: [{ id: 'iterator-1', defId: 'RoundIterator', params: {} }],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'iterator-1', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'iterator-1', internalPort: 'out' },
      ],
      forwardedParams: [
        {
          externalParam: 'rounds',
          internalModuleId: 'iterator-1',
          internalParamKey: 'iterationCount',
        },
      ],
    };

    const result = validateCompositeDef(composite, {
      ...registry,
      RoundComposite: roundComposite,
      RoundIterator: iterator,
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-composite-binding')).toBe(true);
  });

  it('rejects a forwarded value that fails the target param validator', () => {
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
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Round Count',
          kind: 'number',
          defaultValue: 2,
        },
      },
      roundDefId: 'RoundComposite',
      iterationCount: 2,
    };
    const composite: CompositeDef = {
      id: 'InvalidForwardedValue',
      name: 'Invalid Forwarded Value',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {
        rounds: {
          key: 'rounds',
          label: 'Rounds',
          kind: 'number',
          defaultValue: 2,
        },
      },
      project: {
        modules: [{ id: 'iterator-1', defId: 'RoundIterator', params: {} }],
        connections: [],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'iterator-1', internalPort: 'in' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'iterator-1', internalPort: 'out' },
      ],
      forwardedParams: [
        {
          externalParam: 'rounds',
          internalModuleId: 'iterator-1',
          internalParamKey: 'iterationCount',
        },
      ],
    };

    const result = validateCompositeDef(composite, {
      ...registry,
      RoundComposite: roundComposite,
      RoundIterator: iterator,
    });

    expect(result.ok).toBe(true);

    const projectResult = validateProject(
      {
        modules: [
          {
            id: 'forwarded',
            defId: 'InvalidForwardedValue',
            params: { rounds: 0 },
          },
        ],
        connections: [],
      },
      {
        ...registry,
        RoundComposite: roundComposite,
        RoundIterator: iterator,
        InvalidForwardedValue: composite,
      },
    );

    expect(projectResult.ok).toBe(false);
    expect(projectResult.issues.some((issue) => issue.moduleId === 'forwarded')).toBe(true);
  });
});

describe('validateConditionalDef', () => {
  it('accepts a structurally valid conditional definition', () => {
    const conditional: ConditionalDef = {
      id: 'SymbolConditional',
      name: 'Symbol Conditional',
      kind: 'conditional',
      version: 1,
      inputs: [
        { name: 'select', type: 'bits', kind: 'scalar' },
        { name: 'in', type: 'symbol' },
      ],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      thenDefId: 'Loop',
      elseDefId: 'SinkPassthrough',
    };

    const result = validateConditionalDef(conditional, {
      ...registry,
      SinkPassthrough: {
        id: 'SinkPassthrough',
        name: 'Sink Passthrough',
        inputs: [{ name: 'in', type: 'symbol' }],
        outputs: [{ name: 'out', type: 'symbol' }],
        paramSchema: {},
        evaluate: (inputs) => ({ out: inputs.in }),
      },
    });

    expect(result.ok).toBe(true);
  });

  it('rejects a conditional with a non-bits select port', () => {
    const conditional: ConditionalDef = {
      id: 'BrokenConditional',
      name: 'Broken Conditional',
      kind: 'conditional',
      version: 1,
      inputs: [
        { name: 'select', type: 'symbol', kind: 'scalar' },
        { name: 'in', type: 'symbol' },
      ],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      thenDefId: 'Loop',
      elseDefId: 'Loop',
    };

    const result = validateConditionalDef(conditional, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'signal-type-mismatch')).toBe(true);
  });

  it('rejects branch interface mismatches', () => {
    const conditional: ConditionalDef = {
      id: 'MismatchedConditional',
      name: 'Mismatched Conditional',
      kind: 'conditional',
      version: 1,
      inputs: [
        { name: 'select', type: 'bits', kind: 'scalar' },
        { name: 'in', type: 'symbol' },
      ],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      thenDefId: 'Loop',
      elseDefId: 'Source',
    };

    const result = validateConditionalDef(conditional, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-composite-binding')).toBe(true);
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

  it('accepts a keyed iterator definition with a fixed-width key bus', () => {
    const keyedRoundComposite: CompositeDef = {
      id: 'KeyedRoundComposite',
      name: 'Keyed Round Composite',
      kind: 'composite',
      inputs: [
        { name: 'in', type: 'bits' },
        { name: 'key', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [],
        connections: [],
      },
      inputBindings: [],
      outputBindings: [],
    };
    const iterator: IteratorDef = {
      id: 'KeyedRoundIterator',
      name: 'Keyed Round Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [
        { name: 'in', type: 'bits' },
        { name: 'key', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      roundDefId: 'KeyedRoundComposite',
      iterationCount: 2,
      roundKeyWidth: 8,
    };

    const result = validateIteratorDef(iterator, {
      ...registry,
      KeyedRoundComposite: keyedRoundComposite,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects keyed iterators whose round shape does not expose a key port', () => {
    const roundComposite: CompositeDef = {
      id: 'RoundComposite',
      name: 'Round Composite',
      kind: 'composite',
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      version: 1,
      project: {
        modules: [],
        connections: [],
      },
      inputBindings: [],
      outputBindings: [],
    };
    const iterator: IteratorDef = {
      id: 'BrokenKeyedIterator',
      name: 'Broken Keyed Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [
        { name: 'in', type: 'bits' },
        { name: 'key', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      roundDefId: 'RoundComposite',
      iterationCount: 2,
      roundKeyWidth: 8,
    };

    const result = validateIteratorDef(iterator, {
      ...registry,
      RoundComposite: roundComposite,
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-composite-binding')).toBe(true);
  });
});
