import type { CompositeLibraryEntry } from '../engine/composites';

export const STARTER_COMPOSITE_LIBRARY: CompositeLibraryEntry[] = [
  {
    id: 'RotorDoubleStepControl',
    name: 'Rotor Double-Step Control',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'RotorDoubleStepControl',
      name: 'Rotor Double-Step Control',
      kind: 'composite',
      version: 1,
      inputs: [
        { name: 'pulse', type: 'bits' },
        { name: 'turnoverA', type: 'bits' },
        { name: 'turnoverB', type: 'bits' },
      ],
      outputs: [{ name: 'step', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [
          { id: 'turnover-vote', defId: 'OR', params: {} },
          { id: 'step-gate', defId: 'Gate', params: {} },
        ],
        connections: [
          {
            from: { moduleId: 'turnover-vote', port: 'out' },
            to: { moduleId: 'step-gate', port: 'control' },
          },
        ],
      },
      inputBindings: [
        {
          externalPort: 'pulse',
          internalModuleId: 'step-gate',
          internalPort: 'in',
        },
        {
          externalPort: 'turnoverA',
          internalModuleId: 'turnover-vote',
          internalPort: 'a',
        },
        {
          externalPort: 'turnoverB',
          internalModuleId: 'turnover-vote',
          internalPort: 'b',
        },
      ],
      outputBindings: [
        {
          externalPort: 'step',
          internalModuleId: 'step-gate',
          internalPort: 'out',
        },
      ],
      layout: {
        'turnover-vote': { x: 48, y: 48 },
        'step-gate': { x: 256, y: 48 },
      },
    },
  },
  {
    id: 'RotorControlBankRouter',
    name: 'Rotor Control Bank Router',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'RotorControlBankRouter',
      name: 'Rotor Control Bank Router',
      kind: 'composite',
      version: 1,
      inputs: [
        { name: 'pulse', type: 'bits' },
        { name: 'enable', type: 'bits' },
        { name: 'select', type: 'bits' },
      ],
      outputs: [
        { name: 'stepA', type: 'bits' },
        { name: 'stepB', type: 'bits' },
      ],
      paramSchema: {},
      project: {
        modules: [
          { id: 'enable-gate', defId: 'Gate', params: {} },
          { id: 'step-demux', defId: 'Demux', params: {} },
        ],
        connections: [
          {
            from: { moduleId: 'enable-gate', port: 'out' },
            to: { moduleId: 'step-demux', port: 'in' },
          },
        ],
      },
      inputBindings: [
        {
          externalPort: 'pulse',
          internalModuleId: 'enable-gate',
          internalPort: 'in',
        },
        {
          externalPort: 'enable',
          internalModuleId: 'enable-gate',
          internalPort: 'control',
        },
        {
          externalPort: 'select',
          internalModuleId: 'step-demux',
          internalPort: 'select',
        },
      ],
      outputBindings: [
        {
          externalPort: 'stepA',
          internalModuleId: 'step-demux',
          internalPort: 'a',
        },
        {
          externalPort: 'stepB',
          internalModuleId: 'step-demux',
          internalPort: 'b',
        },
      ],
      layout: {
        'enable-gate': { x: 48, y: 48 },
        'step-demux': { x: 256, y: 48 },
      },
    },
  },
  {
    id: 'FeistelRoundComposite',
    name: 'Feistel Round',
    version: 1,
    source: 'built-in',
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
    source: 'built-in',
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
    source: 'built-in',
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
    source: 'built-in',
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
    source: 'built-in',
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
    id: 'ClockedByteRoundIterator',
    name: 'Clocked Byte Round Iterator',
    version: 1,
    source: 'built-in',
    definition: {
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
      roundDefId: 'ByteRoundComposite',
      roundCount: 3,
      endPolicy: 'halt',
    },
  },
  {
    id: 'HashDigestRoundComposite',
    name: 'Hash Digest Round',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'HashDigestRoundComposite',
      name: 'Hash Digest Round',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {
        rotateMode: {
          key: 'rotateMode',
          label: 'Rotate Mode',
          kind: 'select',
          defaultValue: 'rotate-left',
          options: [
            { label: 'Rotate Left', value: 'rotate-left' },
            { label: 'Rotate Right', value: 'rotate-right' },
            { label: 'Left Shift', value: 'left' },
            { label: 'Right Shift', value: 'right' },
          ],
          description: 'How the digest round rearranges the substituted byte before mixing in the constant.',
        },
      },
      project: {
        modules: [
          {
            id: 'sbox',
            defId: 'SBox',
            params: {
              table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
            },
          },
          { id: 'rotate', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } },
          { id: 'constant', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
          { id: 'mix', defId: 'XOR', params: {} },
        ],
        connections: [
          { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'rotate', port: 'in' } },
          { from: { moduleId: 'rotate', port: 'out' }, to: { moduleId: 'mix', port: 'a' } },
          { from: { moduleId: 'constant', port: 'out' }, to: { moduleId: 'mix', port: 'b' } },
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
          internalModuleId: 'mix',
          internalPort: 'out',
        },
      ],
      forwardedParams: [
        {
          externalParam: 'rotateMode',
          internalModuleId: 'rotate',
          internalParamKey: 'mode',
        },
      ],
    },
  },
  {
    id: 'HashDigestRoundIterator',
    name: 'Hash Digest Iterator',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'HashDigestRoundIterator',
      name: 'Hash Digest Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Round Count',
          kind: 'number',
          defaultValue: 4,
          description: 'How many digest rounds to apply after compression.',
        },
      },
      roundDefId: 'HashDigestRoundComposite',
      iterationCount: 4,
    },
  },
  {
    id: 'SpongeMixRoundComposite',
    name: 'Sponge Mix Round',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'SpongeMixRoundComposite',
      name: 'Sponge Mix Round',
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
          {
            id: 'permute',
            defId: 'Permutation',
            params: { order: '0,5,10,15,4,9,14,3,8,13,2,7,12,1,6,11' },
          },
          {
            id: 'constant',
            defId: 'BitSource',
            params: { stream: [1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1] },
          },
          { id: 'mix', defId: 'XOR', params: {} },
        ],
        connections: [
          { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
          { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'mix', port: 'a' } },
          { from: { moduleId: 'constant', port: 'out' }, to: { moduleId: 'mix', port: 'b' } },
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
          internalModuleId: 'mix',
          internalPort: 'out',
        },
      ],
    },
  },
  {
    id: 'SpongeMixRoundIterator',
    name: 'Sponge Mix Iterator',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'SpongeMixRoundIterator',
      name: 'Sponge Mix Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {
        iterationCount: {
          key: 'iterationCount',
          label: 'Mix Rounds',
          kind: 'number',
          defaultValue: 2,
          description: 'How many sponge-style state-mixing rounds to apply after each absorb or squeeze step.',
        },
      },
      roundDefId: 'SpongeMixRoundComposite',
      iterationCount: 2,
    },
  },
  {
    id: 'KeyedByteRoundIterator',
    name: 'Keyed Byte Round Iterator',
    version: 1,
    source: 'built-in',
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
    source: 'built-in',
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
  {
    id: 'ToyCompressionHashComposite',
    name: 'Toy Compression Hash',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'ToyCompressionHashComposite',
      name: 'Toy Compression Hash',
      kind: 'composite',
      version: 1,
      inputs: [
        { name: 'left', type: 'bits' },
        { name: 'right', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {
        digestRounds: {
          key: 'digestRounds',
          label: 'Digest Rounds',
          kind: 'number',
          defaultValue: 4,
          description: 'How many byte-scale rounds finish the compressed digest.',
        },
      },
      project: {
        modules: [
          { id: 'left-mix', defId: 'ByteRoundComposite', params: {} },
          { id: 'right-swap', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
          { id: 'right-mix', defId: 'ByteRoundComposite', params: {} },
          { id: 'compress', defId: 'XOR', params: {} },
          { id: 'digest-rounds', defId: 'HashDigestRoundIterator', params: { iterationCount: 4 } },
        ],
        connections: [
          { from: { moduleId: 'right-swap', port: 'out' }, to: { moduleId: 'right-mix', port: 'in' } },
          { from: { moduleId: 'left-mix', port: 'out' }, to: { moduleId: 'compress', port: 'a' } },
          { from: { moduleId: 'right-mix', port: 'out' }, to: { moduleId: 'compress', port: 'b' } },
          { from: { moduleId: 'compress', port: 'out' }, to: { moduleId: 'digest-rounds', port: 'in' } },
        ],
      },
      inputBindings: [
        {
          externalPort: 'left',
          internalPort: 'in',
          internalModuleId: 'left-mix',
        },
        {
          externalPort: 'right',
          internalPort: 'in',
          internalModuleId: 'right-swap',
        },
      ],
      outputBindings: [
        {
          externalPort: 'out',
          internalModuleId: 'digest-rounds',
          internalPort: 'out',
        },
      ],
      forwardedParams: [
        {
          externalParam: 'digestRounds',
          internalModuleId: 'digest-rounds',
          internalParamKey: 'iterationCount',
        },
      ],
    },
  },
  {
    id: 'ToySpongeHashComposite',
    name: 'Toy Sponge Hash',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'ToySpongeHashComposite',
      name: 'Toy Sponge Hash',
      kind: 'composite',
      version: 1,
      inputs: [
        { name: 'left', type: 'bits' },
        { name: 'right', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {
        absorbMixRounds: {
          key: 'absorbMixRounds',
          label: 'Absorb Mix Rounds',
          kind: 'number',
          defaultValue: 2,
          description: 'How many state-mixing rounds run after each absorb step.',
        },
        squeezeRounds: {
          key: 'squeezeRounds',
          label: 'Squeeze Rounds',
          kind: 'number',
          defaultValue: 1,
          description: 'How many final state-mixing rounds run before the digest byte is squeezed out.',
        },
      },
      project: {
        modules: [
          { id: 'iv', defId: 'BitSource', params: { stream: [1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0] } },
          { id: 'iv-rate', defId: 'Permutation', params: { order: '0,1,2,3,4,5,6,7' } },
          { id: 'iv-capacity', defId: 'Permutation', params: { order: '8,9,10,11,12,13,14,15' } },
          { id: 'absorb-left', defId: 'XOR', params: {} },
          { id: 'state-after-left', defId: 'BitJoin', params: {} },
          { id: 'mix-left', defId: 'SpongeMixRoundIterator', params: { iterationCount: 2 } },
          { id: 'left-rate', defId: 'Permutation', params: { order: '0,1,2,3,4,5,6,7' } },
          { id: 'left-capacity', defId: 'Permutation', params: { order: '8,9,10,11,12,13,14,15' } },
          { id: 'right-prepare', defId: 'HashDigestRoundComposite', params: { rotateMode: 'rotate-right' } },
          { id: 'absorb-right', defId: 'XOR', params: {} },
          { id: 'state-after-right', defId: 'BitJoin', params: {} },
          { id: 'mix-right', defId: 'SpongeMixRoundIterator', params: { iterationCount: 2 } },
          { id: 'squeeze', defId: 'SpongeMixRoundIterator', params: { iterationCount: 1 } },
          { id: 'squeeze-rate', defId: 'Permutation', params: { order: '0,1,2,3,4,5,6,7' } },
          { id: 'squeeze-capacity', defId: 'Permutation', params: { order: '8,9,10,11,12,13,14,15' } },
          { id: 'digest-fold', defId: 'XOR', params: {} },
          { id: 'digest-rounds', defId: 'HashDigestRoundIterator', params: { iterationCount: 1 } },
        ],
        connections: [
          { from: { moduleId: 'iv', port: 'out' }, to: { moduleId: 'iv-rate', port: 'in' } },
          { from: { moduleId: 'iv', port: 'out' }, to: { moduleId: 'iv-capacity', port: 'in' } },
          { from: { moduleId: 'iv-rate', port: 'out' }, to: { moduleId: 'absorb-left', port: 'b' } },
          { from: { moduleId: 'absorb-left', port: 'out' }, to: { moduleId: 'state-after-left', port: 'a' } },
          { from: { moduleId: 'iv-capacity', port: 'out' }, to: { moduleId: 'state-after-left', port: 'b' } },
          { from: { moduleId: 'state-after-left', port: 'out' }, to: { moduleId: 'mix-left', port: 'in' } },
          { from: { moduleId: 'mix-left', port: 'out' }, to: { moduleId: 'left-rate', port: 'in' } },
          { from: { moduleId: 'mix-left', port: 'out' }, to: { moduleId: 'left-capacity', port: 'in' } },
          { from: { moduleId: 'right-prepare', port: 'out' }, to: { moduleId: 'absorb-right', port: 'a' } },
          { from: { moduleId: 'left-rate', port: 'out' }, to: { moduleId: 'absorb-right', port: 'b' } },
          { from: { moduleId: 'absorb-right', port: 'out' }, to: { moduleId: 'state-after-right', port: 'a' } },
          { from: { moduleId: 'left-capacity', port: 'out' }, to: { moduleId: 'state-after-right', port: 'b' } },
          { from: { moduleId: 'state-after-right', port: 'out' }, to: { moduleId: 'mix-right', port: 'in' } },
          { from: { moduleId: 'mix-right', port: 'out' }, to: { moduleId: 'squeeze', port: 'in' } },
          { from: { moduleId: 'squeeze', port: 'out' }, to: { moduleId: 'squeeze-rate', port: 'in' } },
          { from: { moduleId: 'squeeze', port: 'out' }, to: { moduleId: 'squeeze-capacity', port: 'in' } },
          { from: { moduleId: 'squeeze-rate', port: 'out' }, to: { moduleId: 'digest-fold', port: 'a' } },
          { from: { moduleId: 'squeeze-capacity', port: 'out' }, to: { moduleId: 'digest-fold', port: 'b' } },
          { from: { moduleId: 'digest-fold', port: 'out' }, to: { moduleId: 'digest-rounds', port: 'in' } },
        ],
      },
      inputBindings: [
        {
          externalPort: 'left',
          internalModuleId: 'absorb-left',
          internalPort: 'a',
        },
        {
          externalPort: 'right',
          internalModuleId: 'right-prepare',
          internalPort: 'in',
        },
      ],
      outputBindings: [
        {
          externalPort: 'out',
          internalModuleId: 'digest-rounds',
          internalPort: 'out',
        },
      ],
      forwardedParams: [
        {
          externalParam: 'absorbMixRounds',
          internalModuleId: 'mix-left',
          internalParamKey: 'iterationCount',
        },
        {
          externalParam: 'absorbMixRounds',
          internalModuleId: 'mix-right',
          internalParamKey: 'iterationCount',
        },
        {
          externalParam: 'squeezeRounds',
          internalModuleId: 'squeeze',
          internalParamKey: 'iterationCount',
        },
      ],
    },
  },
  {
    id: 'ConditionalRotateBranch',
    name: 'Conditional Rotate Branch',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'ConditionalRotateBranch',
      name: 'Conditional Rotate Branch',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [{ id: 'shift', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } }],
        connections: [],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'shift', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'shift', internalPort: 'out' }],
      purpose: 'Then-branch for the conditional demo: rotates bits left by one position.',
    },
  },
  {
    id: 'ConditionalInvertBranch',
    name: 'Conditional Invert Branch',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'ConditionalInvertBranch',
      name: 'Conditional Invert Branch',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [
          { id: 'xor', defId: 'XOR', params: {} },
          { id: 'mask', defId: 'BitSource', params: { stream: [1, 1, 1, 1, 1, 1, 1, 1] } },
        ],
        connections: [
          { from: { moduleId: 'mask', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        ],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'xor', internalPort: 'a' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'xor', internalPort: 'out' }],
      purpose: 'Else-branch for the conditional demo: inverts all 8 bits by XOR with 11111111.',
    },
  },
  // --- MultiConditional demo branches ---
  {
    id: 'MultiCondBranchRotL1',
    name: 'Multi-Cond Rotate Left 1',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'MultiCondBranchRotL1',
      name: 'Multi-Cond Rotate Left 1',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [{ id: 'shift', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } }],
        connections: [],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'shift', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'shift', internalPort: 'out' }],
      purpose: 'Branch 0 for the multi-conditional demo: rotates bits left by one position.',
    },
  },
  {
    id: 'MultiCondBranchInvert',
    name: 'Multi-Cond Invert',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'MultiCondBranchInvert',
      name: 'Multi-Cond Invert',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [
          { id: 'xor', defId: 'XOR', params: {} },
          { id: 'mask', defId: 'BitSource', params: { stream: [1, 1, 1, 1, 1, 1, 1, 1] } },
        ],
        connections: [
          { from: { moduleId: 'mask', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        ],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'xor', internalPort: 'a' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'xor', internalPort: 'out' }],
      purpose: 'Branch 1 for the multi-conditional demo: inverts all 8 bits.',
    },
  },
  {
    id: 'MultiCondBranchRotL2',
    name: 'Multi-Cond Rotate Left 2',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'MultiCondBranchRotL2',
      name: 'Multi-Cond Rotate Left 2',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [{ id: 'shift', defId: 'BitShifter', params: { amount: 2, mode: 'rotate-left' } }],
        connections: [],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'shift', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'shift', internalPort: 'out' }],
      purpose: 'Branch 2 for the multi-conditional demo: rotates bits left by two positions.',
    },
  },
  {
    id: 'MultiCondBranchRotR1',
    name: 'Multi-Cond Rotate Right 1',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'MultiCondBranchRotR1',
      name: 'Multi-Cond Rotate Right 1',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [{ id: 'shift', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-right' } }],
        connections: [],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'shift', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'shift', internalPort: 'out' }],
      purpose: 'Branch 3 for the multi-conditional demo: rotates bits right by one position.',
    },
  },
  {
    id: 'MultiCondSwitch4',
    name: 'Multi-Cond Switch 4',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'MultiCondSwitch4',
      name: 'Multi-Cond Switch 4',
      kind: 'multi-conditional',
      version: 1,
      inputs: [
        { name: 'select', type: 'bits' },
        { name: 'in', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      branchDefIds: [
        'MultiCondBranchRotL1',
        'MultiCondBranchInvert',
        'MultiCondBranchRotL2',
        'MultiCondBranchRotR1',
      ],
    },
  },
  {
    id: 'ConditionalBranchDemo',
    name: 'Conditional Branch Demo',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'ConditionalBranchDemo',
      name: 'Conditional Branch Demo',
      kind: 'conditional',
      version: 1,
      inputs: [
        { name: 'select', type: 'bits', kind: 'scalar' },
        { name: 'in', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      thenDefId: 'ConditionalRotateBranch',
      elseDefId: 'ConditionalInvertBranch',
    },
  },
  // --- One Machine Two Directions cipher branches ---
  {
    id: 'CipherForwardBranch',
    name: 'Cipher Forward Branch',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'CipherForwardBranch',
      name: 'Cipher Forward Branch',
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
            params: { table: Array.from({ length: 256 }, (_, i) => 255 - i).join(',') },
          },
          { id: 'shift', defId: 'BitShifter', params: { amount: 2, mode: 'rotate-left' } },
        ],
        connections: [
          { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'shift', port: 'in' } },
        ],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'sbox', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'shift', internalPort: 'out' }],
      purpose:
        'Then-branch (select=0) for CipherDirectionSwitch: substitutes all bits with their complements, then rotates two positions left.',
    },
  },
  {
    id: 'CipherInverseBranch',
    name: 'Cipher Inverse Branch',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'CipherInverseBranch',
      name: 'Cipher Inverse Branch',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      project: {
        modules: [
          { id: 'shift', defId: 'BitShifter', params: { amount: 2, mode: 'rotate-right' } },
          {
            id: 'sbox',
            defId: 'SBox',
            params: { table: Array.from({ length: 256 }, (_, i) => 255 - i).join(',') },
          },
        ],
        connections: [
          { from: { moduleId: 'shift', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        ],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'shift', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'sbox', internalPort: 'out' }],
      purpose:
        'Else-branch (select=1) for CipherDirectionSwitch: rotates two positions right first, then substitutes all bits with their complements. Exactly undoes CipherForwardBranch.',
    },
  },
  {
    id: 'CipherDirectionSwitch',
    name: 'Cipher Direction Switch',
    version: 1,
    source: 'built-in',
    definition: {
      id: 'CipherDirectionSwitch',
      name: 'Cipher Direction Switch',
      kind: 'conditional',
      version: 1,
      inputs: [
        { name: 'select', type: 'bits', kind: 'scalar' },
        { name: 'in', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      thenDefId: 'CipherForwardBranch',
      elseDefId: 'CipherInverseBranch',
    },
  },
];
