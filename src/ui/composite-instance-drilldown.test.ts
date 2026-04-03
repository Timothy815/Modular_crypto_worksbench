import { describe, expect, it } from 'vitest';

import type { CompositeDef } from '../engine/composites';
import type { ExecutionResult } from '../engine/types';
import {
  buildCompositeInstanceDrilldownContext,
  buildCompositeInstanceExecution,
  localizeCompositeInstanceTrace,
  resolveCompositeInstanceProject,
} from './composite-instance-drilldown';

const TEST_COMPOSITE: CompositeDef = {
  id: 'TestComposite',
  name: 'Test Composite',
  kind: 'composite',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    mask: {
      key: 'mask',
      label: 'Mask',
      kind: 'string',
      defaultValue: '1111',
    },
  },
  project: {
    modules: [
      { id: 'inner-source', defId: 'BitsSource', params: { value: '0000' } },
      { id: 'inner-mask', defId: 'XorBits', params: { mask: '0000' } },
    ],
    connections: [],
  },
  layout: {
    'inner-source': { x: 24, y: 24 },
    'inner-mask': { x: 180, y: 24 },
  },
  inputBindings: [],
  outputBindings: [],
  forwardedParams: [
    {
      externalParam: 'mask',
      internalModuleId: 'inner-mask',
      internalParamKey: 'mask',
    },
  ],
  version: 1,
};

const TEST_EXECUTION: ExecutionResult = {
  order: ['outer'],
  outputsByModuleId: {
    outer: { out: { type: 'bits', value: [1, 0, 1, 0] } },
  },
  trace: [
    {
      moduleId: 'outer',
      defId: 'TestComposite',
      inputs: {},
      outputs: { out: { type: 'bits', value: [1, 0, 1, 0] } },
      scopeModuleId: 'outer',
      depth: 0,
    },
  ],
  analysisTrace: [
    {
      moduleId: 'outer',
      defId: 'TestComposite',
      inputs: {},
      outputs: { out: { type: 'bits', value: [1, 0, 1, 0] } },
      scopeModuleId: 'outer',
      depth: 0,
    },
    {
      moduleId: 'outer/inner-source',
      defId: 'BitsSource',
      inputs: {},
      outputs: { out: { type: 'bits', value: [0, 0, 0, 0] } },
      scopeModuleId: 'outer',
      depth: 1,
    },
    {
      moduleId: 'outer/inner-mask',
      defId: 'XorBits',
      inputs: { in: { type: 'bits', value: [0, 0, 0, 0] } },
      outputs: { out: { type: 'bits', value: [1, 0, 1, 0] } },
      scopeModuleId: 'outer',
      depth: 1,
    },
    {
      moduleId: 'other/inner-source',
      defId: 'BitsSource',
      inputs: {},
      outputs: { out: { type: 'bits', value: [1, 1, 1, 1] } },
      scopeModuleId: 'other',
      depth: 1,
    },
  ],
};

describe('resolveCompositeInstanceProject', () => {
  it('applies forwarded params to the internal project copy', () => {
    const resolved = resolveCompositeInstanceProject(TEST_COMPOSITE, { mask: '1010' });

    expect(resolved.modules.find((module) => module.id === 'inner-mask')?.params.mask).toBe('1010');
    expect(TEST_COMPOSITE.project.modules.find((module) => module.id === 'inner-mask')?.params.mask).toBe(
      '0000',
    );
  });
});

describe('localizeCompositeInstanceTrace', () => {
  it('filters to one instance and strips the outer prefix', () => {
    expect(localizeCompositeInstanceTrace(TEST_EXECUTION.analysisTrace, 'outer')).toEqual([
      {
        moduleId: 'inner-source',
        defId: 'BitsSource',
        inputs: {},
        outputs: { out: { type: 'bits', value: [0, 0, 0, 0] } },
        scopeModuleId: undefined,
        depth: 0,
      },
      {
        moduleId: 'inner-mask',
        defId: 'XorBits',
        inputs: { in: { type: 'bits', value: [0, 0, 0, 0] } },
        outputs: { out: { type: 'bits', value: [1, 0, 1, 0] } },
        scopeModuleId: undefined,
        depth: 0,
      },
    ]);
  });
});

describe('buildCompositeInstanceExecution', () => {
  it('builds a localized execution result for the selected instance', () => {
    const localized = buildCompositeInstanceExecution(TEST_EXECUTION, 'outer');

    expect(localized).not.toBeNull();
    expect(localized?.order).toEqual(['inner-source', 'inner-mask']);
    expect(localized?.trace).toHaveLength(2);
    expect(localized?.outputsByModuleId['inner-mask']?.out).toEqual({
      type: 'bits',
      value: [1, 0, 1, 0],
    });
  });
});

describe('buildCompositeInstanceDrilldownContext', () => {
  it('combines resolved project, localized execution, and forwarded param values', () => {
    const context = buildCompositeInstanceDrilldownContext(
      TEST_COMPOSITE,
      { mask: '1010' },
      TEST_EXECUTION,
      'outer',
    );

    expect(context.project.modules.find((module) => module.id === 'inner-mask')?.params.mask).toBe(
      '1010',
    );
    expect(context.execution?.trace).toHaveLength(2);
    expect(context.forwardedParamValues).toEqual([
      {
        externalParam: 'mask',
        internalModuleId: 'inner-mask',
        internalParamKey: 'mask',
        value: '1010',
      },
    ]);
  });

  it('retidies missing or stacked layouts into a readable default view', () => {
    const stackedContext = buildCompositeInstanceDrilldownContext(
      {
        ...TEST_COMPOSITE,
        layout: {
          'inner-source': { x: 0, y: 0 },
          'inner-mask': { x: 0, y: 0 },
        },
      },
      { mask: '1010' },
      TEST_EXECUTION,
      'outer',
    );

    expect(stackedContext.layout['inner-source']).not.toEqual(stackedContext.layout['inner-mask']);
    expect(stackedContext.layout['inner-source']).not.toEqual({ x: 0, y: 0 });
    expect(stackedContext.layout['inner-mask']).not.toEqual({ x: 0, y: 0 });
  });
});
