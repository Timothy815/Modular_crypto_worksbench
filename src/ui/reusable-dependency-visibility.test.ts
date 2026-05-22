import { describe, expect, it } from 'vitest';

import type {
  CompositeDef,
  CompositeLibraryEntry,
  IteratorDef,
} from '../engine/composites';
import { getReusableDependencyVisibility } from './reusable-dependency-visibility';

const primitiveOnlyComposite: CompositeDef = {
  id: 'PrimitiveOnly',
  name: 'Primitive Only',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'pass-1', defId: 'PassBits', params: {} }],
    connections: [],
  },
  inputBindings: [],
  outputBindings: [],
};

const workspaceRound: CompositeDef = {
  id: 'WorkspaceRound',
  name: 'Workspace Round',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'pass-2', defId: 'PassBits', params: {} }],
    connections: [],
  },
  inputBindings: [],
  outputBindings: [],
};

const personalRound: CompositeDef = {
  id: 'PersonalRound',
  name: 'Personal Round',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'pass-3', defId: 'PassBits', params: {} }],
    connections: [],
  },
  inputBindings: [],
  outputBindings: [],
};

const workspaceDependentIterator: IteratorDef = {
  id: 'WorkspaceIterator',
  name: 'Workspace Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  roundDefId: 'WorkspaceRound',
  iterationCount: 4,
};

const mixedComposite: CompositeDef = {
  id: 'MixedComposite',
  name: 'Mixed Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [
      { id: 'a', defId: 'WorkspaceRound', params: {} },
      { id: 'b', defId: 'PersonalRound', params: {} },
    ],
    connections: [],
  },
  inputBindings: [],
  outputBindings: [],
};

const library: CompositeLibraryEntry[] = [
  {
    id: 'PrimitiveOnly',
    name: 'Primitive Only',
    version: 1,
    source: 'user',
    scope: 'workspace',
    workspaceId: 'workspace-a',
    definition: primitiveOnlyComposite,
  },
  {
    id: 'WorkspaceRound',
    name: 'Workspace Round',
    version: 1,
    source: 'user',
    scope: 'workspace',
    workspaceId: 'workspace-a',
    definition: workspaceRound,
  },
  {
    id: 'PersonalRound',
    name: 'Personal Round',
    version: 1,
    source: 'user',
    scope: 'personal',
    definition: personalRound,
  },
  {
    id: 'WorkspaceIterator',
    name: 'Workspace Iterator',
    version: 1,
    source: 'user',
    scope: 'workspace',
    workspaceId: 'workspace-a',
    definition: workspaceDependentIterator,
  },
  {
    id: 'MixedComposite',
    name: 'Mixed Composite',
    version: 1,
    source: 'user',
    scope: 'workspace',
    workspaceId: 'workspace-a',
    definition: mixedComposite,
  },
];

describe('getReusableDependencyVisibility', () => {
  it('reports built-ins only when no immediate reusable dependencies exist', () => {
    const visibility = getReusableDependencyVisibility(library[0], library, 'workspace-a');

    expect(visibility.summary).toBe('Depends on built-ins only');
    expect(visibility.hasWorkspaceLocalDependencies).toBe(false);
    expect(visibility.promotionWarning).toBeNull();
    expect(visibility.immediateDependencies).toEqual([]);
  });

  it('classifies workspace-local immediate dependencies', () => {
    const visibility = getReusableDependencyVisibility(library[3], library, 'workspace-a');

    expect(visibility.summary).toBe('Depends on 1 workspace reusable');
    expect(visibility.hasWorkspaceLocalDependencies).toBe(true);
    expect(visibility.immediateDependencies).toEqual([
      {
        id: 'WorkspaceRound',
        name: 'Workspace Round',
        scope: 'workspace',
        scopeLabel: 'This Workspace',
      },
    ]);
    expect(visibility.promotionWarning).toContain('does not promote its workspace-local dependencies');
  });

  it('reports mixed dependency scopes correctly', () => {
    const visibility = getReusableDependencyVisibility(library[4], library, 'workspace-a');

    expect(visibility.summary).toBe(
      'Depends on 1 workspace reusable and 1 personal-library reusable',
    );
    expect(visibility.workspaceCount).toBe(1);
    expect(visibility.personalCount).toBe(1);
  });
});
