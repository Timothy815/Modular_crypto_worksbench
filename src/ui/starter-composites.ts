import type { CompositeLibraryEntry } from '../engine/composites';

export const STARTER_COMPOSITE_LIBRARY: CompositeLibraryEntry[] = [
  {
    id: 'KeyedByteRoundComposite',
    name: 'Keyed Byte Round',
    version: 1,
    definition: {
      id: 'KeyedByteRoundComposite',
      name: 'Keyed Byte Round',
      kind: 'composite',
      version: 1,
      inputs: [
        { name: 'in', type: 'bits' },
        { name: 'key', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [
          {
            id: 'sbox',
            defId: 'SBox',
            params: {
              table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
            },
          },
          { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
          { id: 'add-key', defId: 'XOR', params: {} },
        ],
        connections: [
          {
            from: { moduleId: 'sbox', port: 'out' },
            to: { moduleId: 'permute', port: 'in' },
          },
          {
            from: { moduleId: 'permute', port: 'out' },
            to: { moduleId: 'add-key', port: 'a' },
          },
        ],
      },
      inputBindings: [
        {
          externalPort: 'in',
          internalModuleId: 'sbox',
          internalPort: 'in',
        },
        {
          externalPort: 'key',
          internalModuleId: 'add-key',
          internalPort: 'b',
        },
      ],
      outputBindings: [
        {
          externalPort: 'out',
          internalModuleId: 'add-key',
          internalPort: 'out',
        },
      ],
    },
  },
  {
    id: 'ByteRoundComposite',
    name: 'Byte Round',
    version: 1,
    definition: {
      id: 'ByteRoundComposite',
      name: 'Byte Round',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [
          {
            id: 'sbox',
            defId: 'SBox',
            params: {
              table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
            },
          },
          { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        ],
        connections: [
          {
            from: { moduleId: 'sbox', port: 'out' },
            to: { moduleId: 'permute', port: 'in' },
          },
        ],
      },
      inputBindings: [
        {
          externalPort: 'in',
          internalModuleId: 'sbox',
          internalPort: 'in',
        },
      ],
      outputBindings: [
        {
          externalPort: 'out',
          internalModuleId: 'permute',
          internalPort: 'out',
        },
      ],
    },
  },
  {
    id: 'IteratedByteRoundsComposite',
    name: 'Iterated Byte Rounds',
    version: 1,
    definition: {
      id: 'IteratedByteRoundsComposite',
      name: 'Iterated Byte Rounds',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [
          { id: 'round-1', defId: 'ByteRoundComposite', params: {} },
          { id: 'round-2', defId: 'ByteRoundComposite', params: {} },
        ],
        connections: [
          {
            from: { moduleId: 'round-1', port: 'out' },
            to: { moduleId: 'round-2', port: 'in' },
          },
        ],
      },
      inputBindings: [
        {
          externalPort: 'in',
          internalModuleId: 'round-1',
          internalPort: 'in',
        },
      ],
      outputBindings: [
        {
          externalPort: 'out',
          internalModuleId: 'round-2',
          internalPort: 'out',
        },
      ],
    },
  },
  {
    id: 'ByteRoundIterator',
    name: 'Byte Round Iterator',
    version: 1,
    definition: {
      id: 'ByteRoundIterator',
      name: 'Byte Round Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      roundDefId: 'ByteRoundComposite',
      iterationCount: 2,
    },
  },
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
