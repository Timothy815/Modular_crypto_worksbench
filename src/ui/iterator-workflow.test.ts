import { describe, expect, it } from 'vitest';

import type { IteratorDef } from '../engine/composites';
import { getIteratorRoundSummary } from './iterator-workflow';

const TEST_ITERATOR: IteratorDef = {
  id: 'ByteRoundIterator',
  name: 'Byte Round Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  roundDefId: 'ByteRoundComposite',
  iterationCount: 3,
};

describe('getIteratorRoundSummary', () => {
  it('uses the definition default when no instance override exists', () => {
    expect(getIteratorRoundSummary(TEST_ITERATOR, {})).toEqual({
      defaultRounds: 3,
      resolvedRounds: 3,
      hasInstanceOverride: false,
    });
  });

  it('uses a valid positive integer instance override when present', () => {
    expect(getIteratorRoundSummary(TEST_ITERATOR, { iterationCount: 5 })).toEqual({
      defaultRounds: 3,
      resolvedRounds: 5,
      hasInstanceOverride: true,
    });
  });

  it('ignores invalid overrides and falls back to the definition default', () => {
    expect(getIteratorRoundSummary(TEST_ITERATOR, { iterationCount: 0 })).toEqual({
      defaultRounds: 3,
      resolvedRounds: 3,
      hasInstanceOverride: false,
    });
    expect(getIteratorRoundSummary(TEST_ITERATOR, { iterationCount: 2.5 })).toEqual({
      defaultRounds: 3,
      resolvedRounds: 3,
      hasInstanceOverride: false,
    });
  });
});
