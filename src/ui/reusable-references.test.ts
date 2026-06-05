import { describe, expect, it } from 'vitest';

import type {
  CompositeDef,
  CompositeLibraryEntry,
  ConditionalDef,
  IteratorDef,
} from '../engine/composites';
import { buildReusableReferenceSummary } from './reusable-references';

const workspaceRound: CompositeDef = {
  id: 'WorkspaceRound',
  name: 'Workspace Round',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'pass', defId: 'PassBits', params: {} }],
    connections: [],
  },
  inputBindings: [],
  outputBindings: [],
};

const wrapperComposite: CompositeDef = {
  id: 'WrapperComposite',
  name: 'Wrapper Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'round', defId: 'WorkspaceRound', params: {} }],
    connections: [],
  },
  inputBindings: [],
  outputBindings: [],
};

const iterator: IteratorDef = {
  id: 'PersonalIterator',
  name: 'Personal Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  roundDefId: 'WorkspaceRound',
  iterationCount: 3,
};

const conditional: ConditionalDef = {
  id: 'BuiltInConditional',
  name: 'Built-In Conditional',
  kind: 'conditional',
  version: 1,
  inputs: [{ name: 'control', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  thenDefId: 'WorkspaceRound',
  elseDefId: 'WrapperComposite',
};

const library: CompositeLibraryEntry[] = [
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
    id: 'WrapperComposite',
    name: 'Wrapper Composite',
    version: 1,
    source: 'user',
    scope: 'workspace',
    workspaceId: 'workspace-a',
    definition: wrapperComposite,
  },
  {
    id: 'PersonalIterator',
    name: 'Personal Iterator',
    version: 1,
    source: 'user',
    scope: 'personal',
    definition: iterator,
  },
  {
    id: 'BuiltInConditional',
    name: 'Built-In Conditional',
    version: 1,
    source: 'built-in',
    definition: conditional,
  },
];

const savedProjects = [
  {
    id: 'workspace-a',
    name: 'Workspace A',
    project: {
      modules: [
        { id: 'round-1', defId: 'WorkspaceRound', params: {} },
        { id: 'round-2', defId: 'WorkspaceRound', params: {} },
      ],
      connections: [],
    },
  },
  {
    id: 'workspace-b',
    name: 'Workspace B',
    project: {
      modules: [{ id: 'wrapper-1', defId: 'WrapperComposite', params: {} }],
      connections: [],
    },
  },
];

describe('buildReusableReferenceSummary', () => {
  it('reports no references for an unused reusable', () => {
    const summary = buildReusableReferenceSummary('BuiltInConditional', library, savedProjects, 'workspace-a');

    expect(summary.placedCount).toBe(0);
    expect(summary.definitionReferenceCount).toBe(0);
    expect(summary.compactSummary).toBe('No saved-local references');
    expect(summary.deleteBlockReason).toBeNull();
  });

  it('counts placed module instances separately from reusable-definition references', () => {
    const summary = buildReusableReferenceSummary('WorkspaceRound', library, savedProjects, 'workspace-a');

    expect(summary.placedCount).toBe(2);
    expect(summary.placedReferences).toEqual([
      {
        projectId: 'workspace-a',
        projectName: 'Workspace A',
        count: 2,
        targetModuleId: 'round-1',
        jumpDisabledReason: null,
      },
    ]);
    expect(summary.definitionReferenceCount).toBe(3);
    expect(summary.definitionReferences.map((reference) => reference.id)).toEqual([
      'WrapperComposite',
      'PersonalIterator',
      'BuiltInConditional',
    ]);
    expect(summary.compactSummary).toBe('Placed 2 times in saved local work · Referenced by 3 reusables');
    expect(summary.deleteBlockReason).toContain('placed in saved local work and referenced');
  });

  it('classifies referring reusable scope as workspace, personal, and built-in', () => {
    const summary = buildReusableReferenceSummary('WorkspaceRound', library, savedProjects, 'workspace-a');

    expect(summary.definitionReferences).toEqual([
      {
        id: 'WrapperComposite',
        name: 'Wrapper Composite',
        scope: 'workspace',
        scopeLabel: 'This Workspace',
        kind: 'composite',
        jumpDisabledReason: null,
      },
      {
        id: 'PersonalIterator',
        name: 'Personal Iterator',
        scope: 'personal',
        scopeLabel: 'Personal Library',
        kind: 'iterator',
        jumpDisabledReason: 'Edit not yet available for this reusable kind.',
      },
      {
        id: 'BuiltInConditional',
        name: 'Built-In Conditional',
        scope: 'built-in',
        scopeLabel: 'Built-In',
        kind: 'conditional',
        jumpDisabledReason: 'Edit not yet available for this reusable kind.',
      },
    ]);
  });

  it('blocks delete when a reusable-definition reference exists without placed instances', () => {
    const summary = buildReusableReferenceSummary('WrapperComposite', library, savedProjects.slice(0, 1), 'workspace-a');

    expect(summary.placedCount).toBe(0);
    expect(summary.definitionReferenceCount).toBe(1);
    expect(summary.deleteBlockReason).toBe(
      'Delete unavailable while another reusable references this reusable.',
    );
  });
});
