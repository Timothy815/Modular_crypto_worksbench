import { describe, expect, it } from 'vitest';

import { Permutation } from '../engine/modules/permutation';
import { isCompositePortHintEligible, shouldShowCompositePortHint } from './composite-port-hints';

const compositeDefinition = {
  id: 'RoundComposite',
  name: 'Round Composite',
  kind: 'composite' as const,
  version: 1,
  inputs: [{ name: 'leftIn', type: 'bits' as const }],
  outputs: [{ name: 'leftOut', type: 'bits' as const }],
  paramSchema: {},
  project: { modules: [], connections: [] },
  inputBindings: [],
  outputBindings: [],
};

describe('isCompositePortHintEligible', () => {
  it('accepts composite and iterator boundaries only', () => {
    expect(isCompositePortHintEligible(compositeDefinition)).toBe(true);
    expect(
      isCompositePortHintEligible({
        id: 'RoundIterator',
        name: 'Round Iterator',
        kind: 'iterator',
        version: 1,
        inputs: [{ name: 'in', type: 'bits' }],
        outputs: [{ name: 'out', type: 'bits' }],
        paramSchema: {},
        roundDefId: 'RoundComposite',
        iterationCount: 4,
      }),
    ).toBe(true);
    expect(isCompositePortHintEligible(Permutation)).toBe(false);
  });
});

describe('shouldShowCompositePortHint', () => {
  it('shows a hovered port hint for eligible composite boundaries', () => {
    expect(
      shouldShowCompositePortHint({
        definition: compositeDefinition,
        direction: 'out',
        pendingConnection: false,
        hoveredHintModuleId: null,
        hoveredPortHintKey: 'round-1:out:leftOut',
        moduleId: 'round-1',
        portName: 'leftOut',
      }),
    ).toBe(true);
  });

  it('suppresses hints while a connection is pending', () => {
    expect(
      shouldShowCompositePortHint({
        definition: compositeDefinition,
        direction: 'in',
        pendingConnection: true,
        hoveredHintModuleId: 'round-1',
        hoveredPortHintKey: null,
        moduleId: 'round-1',
        portName: 'leftIn',
      }),
    ).toBe(false);
    expect(
      shouldShowCompositePortHint({
        definition: compositeDefinition,
        direction: 'out',
        pendingConnection: true,
        hoveredHintModuleId: 'round-1',
        hoveredPortHintKey: null,
        moduleId: 'round-1',
        portName: 'leftOut',
      }),
    ).toBe(false);
  });

  it('stays quiet for non-composite primitives and off-target modules', () => {
    expect(
      shouldShowCompositePortHint({
        definition: Permutation,
        direction: 'in',
        pendingConnection: true,
        hoveredHintModuleId: 'perm-1',
        hoveredPortHintKey: null,
        moduleId: 'perm-1',
        portName: 'in',
      }),
    ).toBe(false);
    expect(
      shouldShowCompositePortHint({
        definition: compositeDefinition,
        direction: 'in',
        pendingConnection: true,
        hoveredHintModuleId: 'round-2',
        hoveredPortHintKey: null,
        moduleId: 'round-1',
        portName: 'leftIn',
      }),
    ).toBe(false);
  });
});
