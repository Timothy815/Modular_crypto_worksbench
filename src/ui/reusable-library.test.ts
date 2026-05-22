import { describe, expect, it } from 'vitest';

import type { CompositeDef, CompositeLibraryEntry, IteratorDef } from '../engine/composites';
import { createUserOwnedReusableDuplicate, renameReusableDisplayName } from './reusable-library';

const compositeEntry: CompositeLibraryEntry = {
  id: 'RoundPair',
  name: 'Round Pair',
  source: 'user',
  version: 1,
  definition: {
    id: 'RoundPair',
    name: 'Round Pair',
    kind: 'composite',
    version: 1,
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    project: {
      modules: [{ id: 'inner', defId: 'PassBits', params: {} }],
      connections: [],
    },
    inputBindings: [],
    outputBindings: [],
  } satisfies CompositeDef,
};

const iteratorEntry: CompositeLibraryEntry = {
  id: 'ByteRoundIterator',
  name: 'Byte Round Iterator',
  source: 'built-in',
  version: 1,
  definition: {
    id: 'ByteRoundIterator',
    name: 'Byte Round Iterator',
    kind: 'iterator',
    version: 1,
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    roundDefId: 'PassBits',
    iterationCount: 3,
  } satisfies IteratorDef,
};

describe('reusable-library helpers', () => {
  it('renames display name without mutating stable id or boundary shape', () => {
    const renamed = renameReusableDisplayName(compositeEntry, 'Round Pair Variant');

    expect(renamed.id).toBe('RoundPair');
    expect(renamed.name).toBe('Round Pair Variant');
    expect(renamed.definition.id).toBe('RoundPair');
    expect(renamed.definition.name).toBe('Round Pair Variant');
    expect(renamed.definition.inputs).toEqual(compositeEntry.definition.inputs);
    expect(renamed.definition.outputs).toEqual(compositeEntry.definition.outputs);
  });

  it('duplicates a reusable into a distinct user-authored definition', () => {
    const duplicate = createUserOwnedReusableDuplicate(iteratorEntry, [compositeEntry, iteratorEntry]);

    expect(duplicate.source).toBe('user');
    expect(duplicate.id).not.toBe(iteratorEntry.id);
    expect(duplicate.definition.id).toBe(duplicate.id);
    expect(duplicate.name).toContain('Custom');
    expect(duplicate.definition.inputs).toEqual(iteratorEntry.definition.inputs);
    expect(duplicate.definition.outputs).toEqual(iteratorEntry.definition.outputs);
  });
});
