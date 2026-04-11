import type { WorkbenchDocument } from './workbench-document';

export interface PipelineMicroDemo {
  id: string;
  name: string;
  summary: string;
  pipeline: string;
  defaultTickedMode?: boolean;
  document: WorkbenchDocument;
}

const ASCII_REPEATED_KEY_XOR_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'ascii-repeated-key-xor',
  name: 'ASCII Repeated-Key XOR',
  summary:
    'Uses a repeat mismatch helper to align the ASCII key to the message, two character-per-tick bridges into the bit domain, XOR, and a collector to gather the encrypted result as visible hex.',
  pipeline:
    'AsciiSequenceInput(message) + AsciiSequenceInput(key) -> RepeatSymbolToMatch -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'message', defId: 'AsciiSequenceInput', params: { value: 'ATTACK' } },
        { id: 'key', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'repeat', defId: 'RepeatSymbolToMatch', params: {} },
        { id: 'message-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'key-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'message-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'key-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'repeat', port: 'reference' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'message-tick', port: 'in' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'repeat', port: 'in' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'key-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'message-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'key-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'message-tick', port: 'out' }, to: { moduleId: 'message-bits', port: 'in' } },
        { from: { moduleId: 'key-tick', port: 'out' }, to: { moduleId: 'key-bits', port: 'in' } },
        { from: { moduleId: 'message-bits', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        message: { x: 52, y: 64 },
        key: { x: 52, y: 212 },
        repeat: { x: 304, y: 212 },
        'message-tick': { x: 304, y: 64 },
        'key-tick': { x: 564, y: 212 },
        clock: { x: 304, y: 344 },
        'message-bits': { x: 564, y: 64 },
        'key-bits': { x: 824, y: 212 },
        xor: { x: 1080, y: 136 },
        collect: { x: 1336, y: 136 },
        hex: { x: 1592, y: 136 },
        out: { x: 1800, y: 136 },
      },
      annotations: [],
    },
  },
};

const STRICT_MATCH_BEFORE_XOR_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'strict-match-before-xor',
  name: 'Strict Match Before XOR',
  summary:
    'Strict mismatch helper asserts the key already matches the message length before either path bridges into bits. Stops loudly if lengths differ.',
  pipeline:
    'AsciiSequenceInput(message) -> RequireSymbolLengthMatch(reference=key) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR <- AsciiSequenceInput(key) -> AsciiSequenceToTicked -> AsciiCharToBits -> TickedBitsToSequence -> BitsToHex -> HexOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'require', defId: 'RequireSymbolLengthMatch', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'message', defId: 'AsciiSequenceInput', params: { value: 'SECRET' } },
        { id: 'key', defId: 'AsciiSequenceInput', params: { value: 'PUZZLE' } },
        { id: 'message-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'key-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'message-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'key-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'require', port: 'in' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'require', port: 'reference' } },
        { from: { moduleId: 'require', port: 'out' }, to: { moduleId: 'message-tick', port: 'in' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'key-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'message-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'key-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'message-tick', port: 'out' }, to: { moduleId: 'message-bits', port: 'in' } },
        { from: { moduleId: 'key-tick', port: 'out' }, to: { moduleId: 'key-bits', port: 'in' } },
        { from: { moduleId: 'message-bits', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        message: { x: 52, y: 64 },
        key: { x: 52, y: 232 },
        require: { x: 304, y: 64 },
        'key-tick': { x: 304, y: 232 },
        'message-tick': { x: 588, y: 64 },
        clock: { x: 304, y: 364 },
        'key-bits': { x: 588, y: 232 },
        'message-bits': { x: 852, y: 64 },
        xor: { x: 1108, y: 136 },
        collect: { x: 1364, y: 136 },
        hex: { x: 1620, y: 136 },
        out: { x: 1828, y: 136 },
      },
      annotations: [],
    },
  },
};

const TRUNCATE_TO_BLOCK_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'truncate-to-block',
  name: 'Truncate To Block',
  summary:
    'Truncate mismatch helper clips an overlong bit buffer to a reference block, then both paths bridge into the word domain for XOR.',
  pipeline:
    'BitSequenceInput(longBuffer) + BitSequenceInput(block) -> TruncateBitsToMatch -> BitsSequenceToTicked(wordWidth=4) -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'truncate', defId: 'TruncateBitsToMatch', params: { side: 'left' } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'buffer', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0] } },
        { id: 'block', defId: 'BitSequenceInput', params: { stream: [0, 1, 0, 1, 1, 1, 0, 0] } },
        {
          id: 'buffer-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: false, remainderMode: 'error' },
        },
        {
          id: 'block-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: false, remainderMode: 'error' },
        },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 2 } },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'buffer', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'truncate', port: 'reference' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'buffer-tick', port: 'in' } },
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'block-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'buffer-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'block-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'buffer-tick', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'block-tick', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        buffer: { x: 52, y: 64 },
        block: { x: 52, y: 232 },
        truncate: { x: 328, y: 64 },
        'block-tick': { x: 328, y: 232 },
        'buffer-tick': { x: 620, y: 64 },
        clock: { x: 328, y: 364 },
        xor: { x: 900, y: 136 },
        collect: { x: 1160, y: 136 },
        hex: { x: 1416, y: 136 },
        out: { x: 1624, y: 136 },
      },
      annotations: [],
    },
  },
};

const PAD_TO_BLOCK_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'pad-to-block',
  name: 'Pad To Block',
  summary:
    'Pad mismatch helper extends a short bit buffer to a reference block width, then both paths bridge into the word domain for XOR.',
  pipeline:
    'BitSequenceInput(shortBuffer) + BitSequenceInput(block) -> PadBitsToMatch -> BitsSequenceToTicked(wordWidth=4) -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'pad', defId: 'PadBitsToMatch', params: { side: 'right', padBit: '0' } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'buffer', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1] } },
        { id: 'block', defId: 'BitSequenceInput', params: { stream: [0, 1, 0, 1, 1, 1, 0, 0] } },
        {
          id: 'buffer-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: false, remainderMode: 'error' },
        },
        {
          id: 'block-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: false, remainderMode: 'error' },
        },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 2 } },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'buffer', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'pad', port: 'reference' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'buffer-tick', port: 'in' } },
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'block-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'buffer-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'block-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'buffer-tick', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'block-tick', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        buffer: { x: 52, y: 64 },
        block: { x: 52, y: 232 },
        pad: { x: 328, y: 64 },
        'block-tick': { x: 328, y: 232 },
        'buffer-tick': { x: 620, y: 64 },
        clock: { x: 328, y: 364 },
        xor: { x: 900, y: 136 },
        collect: { x: 1160, y: 136 },
        hex: { x: 1416, y: 136 },
        out: { x: 1624, y: 136 },
      },
      annotations: [],
    },
  },
};

const REPRESENTATION_ROUND_TRIP_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'representation-round-trip',
  name: 'Representation Round Trip',
  summary:
    'Two representation bridges — ASCII → bits → hex in the top path, hex → bits → ASCII in the bottom — with no operators. A pure bridge round-trip.',
  pipeline:
    'AsciiSequenceInput -> AsciiSequenceToBits -> BitsToHex -> HexOutput, plus HexSequenceInput -> BitsToAscii -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'ascii', defId: 'AsciiSequenceInput', params: { value: 'OK' } },
        { id: 'ascii-bits', defId: 'AsciiSequenceToBits', params: {} },
        { id: 'bits-hex', defId: 'BitsToHex', params: {} },
        { id: 'hex-out', defId: 'HexOutput', params: {} },
        { id: 'hex', defId: 'HexSequenceInput', params: { value: '4F4B' } },
        { id: 'bits-ascii', defId: 'BitsToAscii', params: {} },
        { id: 'text-out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'ascii', port: 'out' }, to: { moduleId: 'ascii-bits', port: 'in' } },
        { from: { moduleId: 'ascii-bits', port: 'out' }, to: { moduleId: 'bits-hex', port: 'in' } },
        { from: { moduleId: 'bits-hex', port: 'out' }, to: { moduleId: 'hex-out', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'bits-ascii', port: 'in' } },
        { from: { moduleId: 'bits-ascii', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        ascii: { x: 52, y: 64 },
        'ascii-bits': { x: 332, y: 64 },
        'bits-hex': { x: 620, y: 64 },
        'hex-out': { x: 852, y: 64 },
        hex: { x: 52, y: 248 },
        'bits-ascii': { x: 332, y: 248 },
        'text-out': { x: 620, y: 248 },
      },
      annotations: [],
    },
  },
};

const ASCII_REPEATED_KEY_XOR_ENCRYPT_DECRYPT_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'ascii-repeated-key-xor-encrypt-decrypt',
  name: 'ASCII Repeated-Key XOR Encrypt/Decrypt',
  summary:
    'Paired encrypt/decrypt: top branch uses a repeat mismatch helper, two character-per-tick bridges, XOR, and a collector to produce hex ciphertext. Bottom branch bridges hex input, XORs with the same key bits, and collects the recovered ASCII.',
  pipeline:
    'AsciiSequenceInput(plain) + AsciiSequenceInput(key) -> RepeatSymbolToMatch(reference=plain) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput, plus HexSequenceInput(cipher) -> BitsSequenceToTicked(wordWidth=8) -> XOR -> TickedBitsToSequence -> BitsToAscii -> TextOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'plain', defId: 'AsciiSequenceInput', params: { value: 'ATTACK' } },
        { id: 'key', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'repeat', defId: 'RepeatSymbolToMatch', params: {} },
        { id: 'plain-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'key-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'plain-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'key-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'encrypt-xor', defId: 'XOR', params: {} },
        { id: 'encrypt-collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'cipher-hex', defId: 'BitsToHex', params: {} },
        { id: 'cipher-out', defId: 'HexOutput', params: {} },
        { id: 'cipher-in', defId: 'HexSequenceInput', params: { value: '0A110D0A0612' } },
        {
          id: 'cipher-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        { id: 'decrypt-xor', defId: 'XOR', params: {} },
        { id: 'decrypt-collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'recover-ascii', defId: 'BitsToAscii', params: {} },
        { id: 'recover-out', defId: 'TextOutput', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
      ],
      connections: [
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'repeat', port: 'reference' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'repeat', port: 'in' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'plain-tick', port: 'in' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'key-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'plain-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'key-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'cipher-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'encrypt-collect', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'decrypt-collect', port: 'clock' } },
        { from: { moduleId: 'plain-tick', port: 'out' }, to: { moduleId: 'plain-bits', port: 'in' } },
        { from: { moduleId: 'key-tick', port: 'out' }, to: { moduleId: 'key-bits', port: 'in' } },
        { from: { moduleId: 'plain-bits', port: 'out' }, to: { moduleId: 'encrypt-xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'encrypt-xor', port: 'b' } },
        { from: { moduleId: 'encrypt-xor', port: 'out' }, to: { moduleId: 'encrypt-collect', port: 'in' } },
        { from: { moduleId: 'encrypt-collect', port: 'out' }, to: { moduleId: 'cipher-hex', port: 'in' } },
        { from: { moduleId: 'cipher-hex', port: 'out' }, to: { moduleId: 'cipher-out', port: 'in' } },
        { from: { moduleId: 'cipher-in', port: 'out' }, to: { moduleId: 'cipher-tick', port: 'in' } },
        { from: { moduleId: 'cipher-tick', port: 'out' }, to: { moduleId: 'decrypt-xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'decrypt-xor', port: 'b' } },
        { from: { moduleId: 'decrypt-xor', port: 'out' }, to: { moduleId: 'decrypt-collect', port: 'in' } },
        { from: { moduleId: 'decrypt-collect', port: 'out' }, to: { moduleId: 'recover-ascii', port: 'in' } },
        { from: { moduleId: 'recover-ascii', port: 'out' }, to: { moduleId: 'recover-out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        plain: { x: 48, y: 48 },
        key: { x: 48, y: 184 },
        repeat: { x: 292, y: 184 },
        'plain-tick': { x: 292, y: 48 },
        'key-tick': { x: 548, y: 184 },
        'plain-bits': { x: 548, y: 48 },
        'key-bits': { x: 816, y: 184 },
        'encrypt-xor': { x: 1084, y: 112 },
        'encrypt-collect': { x: 1336, y: 112 },
        'cipher-hex': { x: 1588, y: 112 },
        'cipher-out': { x: 1812, y: 112 },
        'cipher-in': { x: 48, y: 472 },
        'cipher-tick': { x: 292, y: 472 },
        'decrypt-xor': { x: 1084, y: 472 },
        'decrypt-collect': { x: 1336, y: 472 },
        'recover-ascii': { x: 1588, y: 472 },
        'recover-out': { x: 1812, y: 472 },
        clock: { x: 548, y: 332 },
      },
      annotations: [],
    },
  },
};

const ASCII_STRICT_MATCH_XOR_ENCRYPT_DECRYPT_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'ascii-strict-match-xor-encrypt-decrypt',
  name: 'ASCII Strict-Match XOR Encrypt/Decrypt',
  summary:
    'Paired encrypt/decrypt using a strict mismatch helper before the first bridge. Stops loudly if key and message lengths differ. The bottom branch decrypts using the same key bridge structure.',
  pipeline:
    'AsciiSequenceInput(message) + AsciiSequenceInput(key) -> RequireSymbolLengthMatch -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput, plus HexSequenceInput(cipher) -> BitsSequenceToTicked(wordWidth=8) -> XOR -> TickedBitsToSequence -> BitsToAscii -> TextOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'message', defId: 'AsciiSequenceInput', params: { value: 'SECRET' } },
        { id: 'key', defId: 'AsciiSequenceInput', params: { value: 'PUZZLE' } },
        { id: 'require', defId: 'RequireSymbolLengthMatch', params: {} },
        { id: 'message-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'key-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'message-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'key-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'encrypt-xor', defId: 'XOR', params: {} },
        { id: 'encrypt-collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'cipher-hex', defId: 'BitsToHex', params: {} },
        { id: 'cipher-out', defId: 'HexOutput', params: {} },
        { id: 'cipher-in', defId: 'HexSequenceInput', params: { value: '031019080911' } },
        {
          id: 'cipher-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        { id: 'decrypt-xor', defId: 'XOR', params: {} },
        { id: 'decrypt-collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'recover-ascii', defId: 'BitsToAscii', params: {} },
        { id: 'recover-out', defId: 'TextOutput', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
      ],
      connections: [
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'require', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'require', port: 'reference' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'message-tick', port: 'in' } },
        { from: { moduleId: 'require', port: 'out' }, to: { moduleId: 'key-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'message-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'key-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'cipher-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'encrypt-collect', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'decrypt-collect', port: 'clock' } },
        { from: { moduleId: 'message-tick', port: 'out' }, to: { moduleId: 'message-bits', port: 'in' } },
        { from: { moduleId: 'key-tick', port: 'out' }, to: { moduleId: 'key-bits', port: 'in' } },
        { from: { moduleId: 'message-bits', port: 'out' }, to: { moduleId: 'encrypt-xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'encrypt-xor', port: 'b' } },
        { from: { moduleId: 'encrypt-xor', port: 'out' }, to: { moduleId: 'encrypt-collect', port: 'in' } },
        { from: { moduleId: 'encrypt-collect', port: 'out' }, to: { moduleId: 'cipher-hex', port: 'in' } },
        { from: { moduleId: 'cipher-hex', port: 'out' }, to: { moduleId: 'cipher-out', port: 'in' } },
        { from: { moduleId: 'cipher-in', port: 'out' }, to: { moduleId: 'cipher-tick', port: 'in' } },
        { from: { moduleId: 'cipher-tick', port: 'out' }, to: { moduleId: 'decrypt-xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'decrypt-xor', port: 'b' } },
        { from: { moduleId: 'decrypt-xor', port: 'out' }, to: { moduleId: 'decrypt-collect', port: 'in' } },
        { from: { moduleId: 'decrypt-collect', port: 'out' }, to: { moduleId: 'recover-ascii', port: 'in' } },
        { from: { moduleId: 'recover-ascii', port: 'out' }, to: { moduleId: 'recover-out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        message: { x: 48, y: 48 },
        key: { x: 48, y: 184 },
        require: { x: 292, y: 184 },
        'message-tick': { x: 292, y: 48 },
        'key-tick': { x: 548, y: 184 },
        'message-bits': { x: 548, y: 48 },
        'key-bits': { x: 816, y: 184 },
        'encrypt-xor': { x: 1084, y: 112 },
        'encrypt-collect': { x: 1336, y: 112 },
        'cipher-hex': { x: 1588, y: 112 },
        'cipher-out': { x: 1812, y: 112 },
        'cipher-in': { x: 48, y: 472 },
        'cipher-tick': { x: 292, y: 472 },
        'decrypt-xor': { x: 1084, y: 472 },
        'decrypt-collect': { x: 1336, y: 472 },
        'recover-ascii': { x: 1588, y: 472 },
        'recover-out': { x: 1812, y: 472 },
        clock: { x: 548, y: 332 },
      },
      annotations: [],
    },
  },
};

const HEX_BLOCK_XOR_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'hex-block-xor',
  name: 'Hex Block XOR',
  summary:
    'Two hex sources bridge into the word domain one byte at a time, XOR, and a collector produces visible hex. No mismatch helper needed — both blocks are already the same width.',
  pipeline:
    'HexSequenceInput(leftBlock) + HexSequenceInput(rightBlock) -> BitsSequenceToTicked(wordWidth=8) -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'left', defId: 'HexSequenceInput', params: { value: 'A1B2C3D4' } },
        { id: 'right', defId: 'HexSequenceInput', params: { value: '0F0F0F0F' } },
        {
          id: 'left-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        {
          id: 'right-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'left-tick', port: 'in' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'right-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'left-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'right-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'left-tick', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'right-tick', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        left: { x: 52, y: 64 },
        right: { x: 52, y: 236 },
        'left-tick': { x: 340, y: 64 },
        'right-tick': { x: 340, y: 236 },
        clock: { x: 340, y: 368 },
        xor: { x: 636, y: 148 },
        collect: { x: 904, y: 148 },
        hex: { x: 1168, y: 148 },
        out: { x: 1388, y: 148 },
      },
      annotations: [],
    },
  },
};

const HEX_NORMALIZE_THEN_XOR_PIPELINE_MICRO_DEMO: PipelineMicroDemo = {
  id: 'hex-normalize-then-xor',
  name: 'Hex Normalize Then XOR',
  summary:
    'Two chained mismatch helpers — truncate then pad — align the buffer to the reference block. Both paths then bridge into the word domain for XOR. Shows the composed normalization pattern.',
  pipeline:
    'HexSequenceInput(buffer) -> TruncateBitsToMatch -> PadBitsToMatch -> BitsSequenceToTicked(wordWidth=8) -> XOR <- HexSequenceInput(block) -> TickedBitsToSequence -> BitsToHex -> HexOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'buffer', defId: 'HexSequenceInput', params: { value: 'A1B2C3' } },
        { id: 'block', defId: 'HexSequenceInput', params: { value: '0F0F0F0F' } },
        { id: 'truncate', defId: 'TruncateBitsToMatch', params: { side: 'left' } },
        { id: 'pad', defId: 'PadBitsToMatch', params: { side: 'right', padBit: '0' } },
        {
          id: 'buffer-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        {
          id: 'block-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
      ],
      connections: [
        { from: { moduleId: 'buffer', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'truncate', port: 'reference' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'pad', port: 'reference' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'buffer-tick', port: 'in' } },
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'block-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'buffer-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'block-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'buffer-tick', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'block-tick', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        buffer: { x: 52, y: 64 },
        block: { x: 52, y: 252 },
        truncate: { x: 328, y: 64 },
        pad: { x: 608, y: 64 },
        'block-tick': { x: 328, y: 252 },
        'buffer-tick': { x: 892, y: 64 },
        clock: { x: 608, y: 392 },
        xor: { x: 1180, y: 148 },
        collect: { x: 1440, y: 148 },
        hex: { x: 1700, y: 148 },
        out: { x: 1920, y: 148 },
      },
      annotations: [],
    },
  },
};

export const PIPELINE_MICRO_DEMOS: PipelineMicroDemo[] = [
  ASCII_REPEATED_KEY_XOR_PIPELINE_MICRO_DEMO,
  STRICT_MATCH_BEFORE_XOR_PIPELINE_MICRO_DEMO,
  TRUNCATE_TO_BLOCK_PIPELINE_MICRO_DEMO,
  PAD_TO_BLOCK_PIPELINE_MICRO_DEMO,
  REPRESENTATION_ROUND_TRIP_PIPELINE_MICRO_DEMO,
  ASCII_REPEATED_KEY_XOR_ENCRYPT_DECRYPT_PIPELINE_MICRO_DEMO,
  ASCII_STRICT_MATCH_XOR_ENCRYPT_DECRYPT_PIPELINE_MICRO_DEMO,
  HEX_BLOCK_XOR_PIPELINE_MICRO_DEMO,
  HEX_NORMALIZE_THEN_XOR_PIPELINE_MICRO_DEMO,
];

const PIPELINE_MICRO_DEMO_BY_ID = Object.fromEntries(
  PIPELINE_MICRO_DEMOS.map((entry) => [entry.id, entry]),
) as Record<string, PipelineMicroDemo>;

export function getPipelineMicroDemo(id: string): PipelineMicroDemo | null {
  return PIPELINE_MICRO_DEMO_BY_ID[id] ?? null;
}
