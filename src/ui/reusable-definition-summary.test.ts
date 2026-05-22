import { describe, expect, it } from 'vitest';

import type { ClockedIteratorDef, CompositeDef, CompositeLibraryEntry, IteratorDef } from '../engine/composites';
import type { ModuleRegistry } from '../engine/types';
import {
  formatReusableInterfaceSummary,
  formatReusablePortCounts,
  formatReusableStructuralSummary,
  getReusableOriginLabel,
} from './reusable-definition-summary';

const registry: ModuleRegistry = {
  ByteRound: {
    id: 'ByteRound',
    name: 'Byte Round',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    evaluate: () => ({ out: { type: 'bits', value: [1] } }),
  },
};

const compositeDef: CompositeDef = {
  id: 'RoundPair',
  name: 'Round Pair',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [
      { id: 'round-1', defId: 'ByteRound', params: {} },
      { id: 'round-2', defId: 'ByteRound', params: {} },
    ],
    connections: [],
  },
  inputBindings: [],
  outputBindings: [],
};

const iteratorDef: IteratorDef = {
  id: 'ByteRoundIterator',
  name: 'Byte Round Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  roundDefId: 'ByteRound',
  iterationCount: 3,
};

const clockedIteratorDef: ClockedIteratorDef = {
  id: 'ClockedByteRoundIterator',
  name: 'Clocked Byte Round Iterator',
  kind: 'clocked-iterator',
  version: 1,
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'clock', type: 'bits', kind: 'scalar' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  roundDefId: 'ByteRound',
  roundCount: 4,
  endPolicy: 'halt',
};

describe('reusable definition summaries', () => {
  it('formats composite summaries with internal module count', () => {
    expect(formatReusablePortCounts(compositeDef)).toBe('1 in / 1 out');
    expect(formatReusableStructuralSummary(compositeDef, registry)).toBe('2 internal modules');
    expect(formatReusableInterfaceSummary(compositeDef)).toBe('Inputs: in:bits · Outputs: out:bits');
  });

  it('formats iterator summaries with resolved body name', () => {
    expect(formatReusableStructuralSummary(iteratorDef, registry)).toBe('3-round body: Byte Round');
  });

  it('formats clocked iterator summaries with step count and end policy', () => {
    expect(formatReusableStructuralSummary(clockedIteratorDef, registry)).toBe('4-step halt body: Byte Round');
  });

  it('distinguishes built-in, workspace, and personal reusable origins', () => {
    const builtInEntry: Pick<CompositeLibraryEntry, 'source' | 'scope' | 'workspaceId'> = { source: 'built-in' };
    const workspaceEntry: Pick<CompositeLibraryEntry, 'source' | 'scope' | 'workspaceId'> = {
      source: 'user',
      scope: 'workspace',
      workspaceId: 'workspace-a',
    };
    const personalEntry: Pick<CompositeLibraryEntry, 'source' | 'scope' | 'workspaceId'> = {
      source: 'user',
      scope: 'personal',
    };

    expect(getReusableOriginLabel(builtInEntry)).toBe('Built-in architecture');
    expect(getReusableOriginLabel(workspaceEntry, 'workspace-a')).toBe('This workspace');
    expect(getReusableOriginLabel(personalEntry, 'workspace-a')).toBe('Personal library');
  });
});
