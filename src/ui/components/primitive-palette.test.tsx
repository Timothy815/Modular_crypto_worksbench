import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { CompositeDef, CompositeLibraryEntry, IteratorDef } from '../../engine/composites';
import type { ModuleRegistry } from '../../engine/types';
import { PrimitivePalette } from './primitive-palette';

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
      { id: 'round-1', defId: 'PassBits', params: {} },
      { id: 'round-2', defId: 'PassBits', params: {} },
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
  roundDefId: 'PassBits',
  iterationCount: 3,
};

const personalCompositeDef: CompositeDef = {
  ...compositeDef,
  id: 'PersonalRound',
  name: 'Personal Round',
  project: {
    modules: [{ id: 'round-pair-ref', defId: 'RoundPair', params: {} }],
    connections: [],
  },
};

const compositeLibrary: CompositeLibraryEntry[] = [
  {
    id: 'RoundPair',
    name: 'Round Pair',
    version: 1,
    source: 'user',
    scope: 'workspace',
    workspaceId: 'workspace-a',
    definition: compositeDef,
  },
  {
    id: 'ByteRoundIterator',
    name: 'Byte Round Iterator',
    version: 1,
    source: 'built-in',
    definition: iteratorDef,
  },
  {
    id: 'PersonalRound',
    name: 'Personal Round',
    version: 1,
    source: 'user',
    scope: 'personal',
    personalTags: ['AES', 'Classroom'],
    definition: personalCompositeDef,
  },
];

const registry: ModuleRegistry = {
  PassBits: {
    id: 'PassBits',
    name: 'Pass Bits',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
  RoundPair: compositeDef,
  ByteRoundIterator: iteratorDef,
  PersonalRound: personalCompositeDef,
};

const reusableReferenceProjects = [
  {
    id: 'workspace-a',
    name: 'Workspace A',
    project: {
      modules: [{ id: 'round-pair-1', defId: 'RoundPair', params: {} }],
      connections: [],
    },
  },
];

describe('PrimitivePalette reusable summaries', () => {
  it('renders stronger structural and origin summaries for reusables', () => {
    const markup = renderToStaticMarkup(
      <PrimitivePalette
        registry={registry}
        activeWorkspaceId="workspace-a"
        compositeLibrary={compositeLibrary}
        viewMode="expanded"
        initialActiveTab="composites"
        onToggleViewMode={() => undefined}
        onAddModule={() => undefined}
        onInsertStarterChain={() => undefined}
        onOpenComposite={() => undefined}
        onEditClockedIterator={() => undefined}
        onDuplicateReusable={() => undefined}
        onRenameReusable={() => undefined}
        onUpdateReusableTags={() => undefined}
        onPromoteReusable={() => undefined}
        onOpenPrimitiveMicroDemo={() => undefined}
        onExportCompositeLibrary={() => undefined}
        onRemoveComposite={() => undefined}
        compositeUsageCountById={{ RoundPair: 1 }}
        reusableReferenceProjects={reusableReferenceProjects}
        builtInReusableIds={['ByteRoundIterator']}
      />,
    );

    expect(markup).toContain('2 internal modules');
    expect(markup).toContain('3-round body: Pass Bits');
    expect(markup).toContain('This workspace');
    expect(markup).toContain('Built-in architecture');
    expect(markup).toContain('Inputs: in:bits · Outputs: out:bits');
    expect(markup).toContain('Placed 1 time in saved local work · Referenced by 1 reusable');
    expect(markup).toContain('Delete unavailable while this reusable is placed in saved local work and referenced by another reusable.');
  });

  it('renders authored-library guidance in the composites view', () => {
    const markup = renderToStaticMarkup(
      <PrimitivePalette
        registry={registry}
        activeWorkspaceId="workspace-a"
        compositeLibrary={compositeLibrary}
        viewMode="expanded"
        initialActiveTab="composites"
        onToggleViewMode={() => undefined}
        onAddModule={() => undefined}
        onInsertStarterChain={() => undefined}
        onOpenComposite={() => undefined}
        onEditClockedIterator={() => undefined}
        onDuplicateReusable={() => undefined}
        onRenameReusable={() => undefined}
        onUpdateReusableTags={() => undefined}
        onPromoteReusable={() => undefined}
        onOpenPrimitiveMicroDemo={() => undefined}
        onExportCompositeLibrary={() => undefined}
        onRemoveComposite={() => undefined}
        compositeUsageCountById={{ RoundPair: 1 }}
        reusableReferenceProjects={reusableReferenceProjects}
        builtInReusableIds={['ByteRoundIterator']}
      />,
    );

    expect(markup).toContain('Reusable Library');
    expect(markup).toContain('All Reusables');
    expect(markup).toContain('This Workspace');
    expect(markup).toContain('Personal Library');
    expect(markup).toContain('Built-In');
    expect(markup).toContain('Dependency scope shows what a reusable still relies on.');
    expect(markup).toContain('Personal Tags');
    expect(markup).toContain('All Tags');
    expect(markup).toContain('AES');
    expect(markup).toContain('Classroom');
  });

  it('blocks delete when reusable-definition references exist without placed usage', () => {
    const markup = renderToStaticMarkup(
      <PrimitivePalette
        registry={registry}
        activeWorkspaceId="workspace-a"
        compositeLibrary={compositeLibrary}
        viewMode="expanded"
        initialActiveTab="composites"
        onToggleViewMode={() => undefined}
        onAddModule={() => undefined}
        onInsertStarterChain={() => undefined}
        onOpenComposite={() => undefined}
        onEditClockedIterator={() => undefined}
        onDuplicateReusable={() => undefined}
        onRenameReusable={() => undefined}
        onUpdateReusableTags={() => undefined}
        onPromoteReusable={() => undefined}
        onOpenPrimitiveMicroDemo={() => undefined}
        onExportCompositeLibrary={() => undefined}
        onRemoveComposite={() => undefined}
        compositeUsageCountById={{}}
        reusableReferenceProjects={[]}
        builtInReusableIds={['ByteRoundIterator']}
      />,
    );

    expect(markup).toContain('Referenced by 1 reusable');
    expect(markup).toContain('Delete unavailable while another reusable references this reusable.');
    expect(markup).toContain('disabled=""');
  });
});
