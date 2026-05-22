import { describe, expect, it } from 'vitest';

import type { CompositeDef, CompositeLibraryEntry, IteratorDef } from '../engine/composites';
import {
  createPersonalReusablePromotionCopy,
  createUserOwnedReusableDuplicate,
  createWorkspaceScopedReusableEntry,
  renameReusableDisplayName,
} from './reusable-library';

const compositeEntry: CompositeLibraryEntry = {
  id: 'RoundPair',
  name: 'Round Pair',
  source: 'user',
  scope: 'workspace',
  workspaceId: 'workspace-a',
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
    const duplicate = createUserOwnedReusableDuplicate(
      iteratorEntry,
      [compositeEntry, iteratorEntry],
      'workspace-a',
    );

    expect(duplicate.source).toBe('user');
    expect(duplicate.scope).toBe('workspace');
    expect(duplicate.workspaceId).toBe('workspace-a');
    expect(duplicate.id).not.toBe(iteratorEntry.id);
    expect(duplicate.definition.id).toBe(duplicate.id);
    expect(duplicate.name).toContain('Custom');
    expect(duplicate.definition.inputs).toEqual(iteratorEntry.definition.inputs);
    expect(duplicate.definition.outputs).toEqual(iteratorEntry.definition.outputs);
  });

  it('marks new authored reusables as workspace-scoped by default', () => {
    const scoped = createWorkspaceScopedReusableEntry(iteratorEntry, 'workspace-a');

    expect(scoped.source).toBe('user');
    expect(scoped.scope).toBe('workspace');
    expect(scoped.workspaceId).toBe('workspace-a');
  });

  it('promotes a workspace reusable into an independent personal-library copy', () => {
    const promotion = createPersonalReusablePromotionCopy(compositeEntry, [compositeEntry]);

    expect(promotion.hadConflict).toBe(false);
    expect(promotion.entry.id).toBe(compositeEntry.id);
    expect(promotion.entry.scope).toBe('personal');
    expect(promotion.entry.workspaceId).toBeUndefined();
    expect(promotion.entry.definition.id).toBe(compositeEntry.definition.id);
    expect(compositeEntry.scope).toBe('workspace');
    expect(compositeEntry.workspaceId).toBe('workspace-a');
  });
});
