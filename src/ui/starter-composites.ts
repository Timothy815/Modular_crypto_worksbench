import type { CompositeLibraryEntry } from '../engine/composites';

export const STARTER_COMPOSITE_LIBRARY: CompositeLibraryEntry[] = [
  {
    id: 'SymbolRoundTripComposite',
    name: 'Symbol Round Trip',
    version: 1,
    definition: {
      id: 'SymbolRoundTripComposite',
      name: 'Symbol Round Trip',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      project: {
        modules: [
          { id: 'encode', defId: 'SymbolToBits', params: {} },
          { id: 'decode', defId: 'BitsToSymbol', params: {} },
        ],
        connections: [
          {
            from: { moduleId: 'encode', port: 'out' },
            to: { moduleId: 'decode', port: 'in' },
          },
        ],
      },
      inputBindings: [
        {
          externalPort: 'in',
          internalModuleId: 'encode',
          internalPort: 'in',
        },
      ],
      outputBindings: [
        {
          externalPort: 'out',
          internalModuleId: 'decode',
          internalPort: 'out',
        },
      ],
    },
  },
];
