import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { CompositeDef, IteratorDef } from '../../engine/composites';
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
};

describe('PrimitivePalette reusable summaries', () => {
  it('renders stronger structural and origin summaries for reusables', () => {
    const markup = renderToStaticMarkup(
      <PrimitivePalette
        registry={registry}
        viewMode="expanded"
        onToggleViewMode={() => undefined}
        onAddModule={() => undefined}
        onInsertStarterChain={() => undefined}
        onOpenComposite={() => undefined}
        onEditClockedIterator={() => undefined}
        onDuplicateReusable={() => undefined}
        onOpenPrimitiveMicroDemo={() => undefined}
        onExportCompositeLibrary={() => undefined}
        onRemoveComposite={() => undefined}
        compositeUsageCountById={{ RoundPair: 1 }}
        builtInReusableIds={['ByteRoundIterator']}
      />,
    );

    expect(markup).toContain('2 internal modules');
    expect(markup).toContain('3-round body: Pass Bits');
    expect(markup).toContain('Your reusable');
    expect(markup).toContain('Built-in architecture');
    expect(markup).toContain('Inputs: in:bits · Outputs: out:bits');
  });
});
