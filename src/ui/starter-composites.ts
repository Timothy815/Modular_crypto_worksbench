import type { CompositeLibraryEntry } from '../engine/composites';

export const STARTER_COMPOSITE_LIBRARY: CompositeLibraryEntry[] = [
  {
    id: 'FeistelRoundComposite',
    name: 'Feistel Round',
    version: 1,
    definition: {
      id: 'FeistelRoundComposite',
      name: 'Feistel Round',
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
          { id: 'left', defId: 'Permutation', params: { order: '0,1,2,3' } },
          { id: 'right', defId: 'Permutation', params: { order: '4,5,6,7' } },
          { id: 'f-shift', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } },
          { id: 'f-mix', defId: 'XOR', params: {} },
          { id: 'new-right', defId: 'XOR', params: {} },
          { id: 'join', defId: 'BitJoin', params: {} },
        ],
        connections: [
          { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'f-shift', port: 'in' } },
          { from: { moduleId: 'f-shift', port: 'out' }, to: { moduleId: 'f-mix', port: 'a' } },
          { from: { moduleId: 'f-mix', port: 'out' }, to: { moduleId: 'new-right', port: 'b' } },
          { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'new-right', port: 'a' } },
          { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'join', port: 'a' } },
          { from: { moduleId: 'new-right', port: 'out' }, to: { moduleId: 'join', port: 'b' } },
        ],
      },
      inputBindings: [
        { externalPort: 'in', internalModuleId: 'left', internalPort: 'in' },
        { externalPort: 'in', internalModuleId: 'right', internalPort: 'in' },
        { externalPort: 'key', internalModuleId: 'f-mix', internalPort: 'b' },
      ],
      outputBindings: [
        { externalPort: 'out', internalModuleId: 'join', internalPort: 'out' },
      ],
    },
  },
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
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Round Count',
          kind: 'number',
          defaultValue: 2,
          description: 'How many times to auto-unroll the repeated round chain.',
        },
      },
      roundDefId: 'ByteRoundComposite',
      iterationCount: 2,
    },
  },
  {
    id: 'KeyedByteRoundIterator',
    name: 'Keyed Byte Round Iterator',
    version: 1,
    definition: {
      id: 'KeyedByteRoundIterator',
      name: 'Keyed Byte Round Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [
        { name: 'in', type: 'bits' },
        { name: 'key', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Round Count',
          kind: 'number',
          defaultValue: 2,
          description: 'How many keyed rounds to auto-unroll from the incoming key bus.',
        },
      },
      roundDefId: 'KeyedByteRoundComposite',
      iterationCount: 2,
      roundKeyWidth: 8,
    },
  },
  {
    id: 'FeistelRoundIterator',
    name: 'Feistel Round Iterator',
    version: 1,
    definition: {
      id: 'FeistelRoundIterator',
      name: 'Feistel Round Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [
        { name: 'in', type: 'bits' },
        { name: 'key', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Round Count',
          kind: 'number',
          defaultValue: 2,
          description: 'How many Feistel rounds to auto-unroll from the incoming key bus.',
        },
      },
      roundDefId: 'FeistelRoundComposite',
      iterationCount: 2,
      roundKeyWidth: 4,
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
