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
    'A compact end-to-end pipeline that repeats a visible ASCII key to match a visible ASCII message, bridges both paths into bits one character at a time, XORs them, and collects the encrypted result.',
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
    'A compact end-to-end pipeline that asserts two visible ASCII sequences already match in length before either path enters the operational bit domain.',
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
    'A compact end-to-end pipeline that visibly clips an overlong bit buffer to a reference block width before fixed-width word stepping and XOR.',
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
    'A compact end-to-end pipeline that visibly extends an undersized bit buffer to a reference block width before fixed-width word stepping and XOR.',
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
    'A compact dual-path workspace that shows ASCII flowing explicitly into the bit domain and out to hex, while a hex-authored sequence flows explicitly back into visible ASCII.',
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

export const PIPELINE_MICRO_DEMOS: PipelineMicroDemo[] = [
  ASCII_REPEATED_KEY_XOR_PIPELINE_MICRO_DEMO,
  STRICT_MATCH_BEFORE_XOR_PIPELINE_MICRO_DEMO,
  TRUNCATE_TO_BLOCK_PIPELINE_MICRO_DEMO,
  PAD_TO_BLOCK_PIPELINE_MICRO_DEMO,
  REPRESENTATION_ROUND_TRIP_PIPELINE_MICRO_DEMO,
];

const PIPELINE_MICRO_DEMO_BY_ID = Object.fromEntries(
  PIPELINE_MICRO_DEMOS.map((entry) => [entry.id, entry]),
) as Record<string, PipelineMicroDemo>;

export function getPipelineMicroDemo(id: string): PipelineMicroDemo | null {
  return PIPELINE_MICRO_DEMO_BY_ID[id] ?? null;
}
