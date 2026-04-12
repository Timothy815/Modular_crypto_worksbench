import type { WorkspaceClipboardSnapshot } from './workspace-clipboard';

export interface PipelineStarter {
  id: string;
  label: string;
  description: string;
  snapshot: WorkspaceClipboardSnapshot;
}

const G = 220; // horizontal gap between nodes

export const PIPELINE_STARTERS: PipelineStarter[] = [
  {
    id: 'symbol-cipher-input',
    label: 'Symbol Cipher Input',
    description: 'Text → char-by-char bits',
    snapshot: {
      modules: [
        { id: '_TextInput', defId: 'TextInput', params: { text: 'HELLO' } },
        { id: '_AsciiSeqToTicked', defId: 'AsciiSequenceToTicked', params: { index: 0 } },
        { id: '_AsciiCharToBits', defId: 'AsciiCharToBits', params: {} },
      ],
      connections: [
        { from: { moduleId: '_TextInput', port: 'out' }, to: { moduleId: '_AsciiSeqToTicked', port: 'in' } },
        { from: { moduleId: '_AsciiSeqToTicked', port: 'out' }, to: { moduleId: '_AsciiCharToBits', port: 'in' } },
      ],
      relativeLayout: {
        _TextInput: { x: 0, y: 0 },
        _AsciiSeqToTicked: { x: G, y: 0 },
        _AsciiCharToBits: { x: G * 2, y: 0 },
      },
    },
  },
  {
    id: 'symbol-key-input',
    label: 'Symbol Key Input',
    description: 'Key → repeat to match → char-by-char bits',
    snapshot: {
      modules: [
        { id: '_KeyInput', defId: 'KeyInput', params: { text: 'KEY' } },
        { id: '_RepeatToMatch', defId: 'RepeatSymbolToMatch', params: {} },
        { id: '_AsciiSeqToTicked', defId: 'AsciiSequenceToTicked', params: { index: 0 } },
        { id: '_AsciiCharToBits', defId: 'AsciiCharToBits', params: {} },
      ],
      connections: [
        { from: { moduleId: '_KeyInput', port: 'out' }, to: { moduleId: '_RepeatToMatch', port: 'in' } },
        { from: { moduleId: '_RepeatToMatch', port: 'out' }, to: { moduleId: '_AsciiSeqToTicked', port: 'in' } },
        { from: { moduleId: '_AsciiSeqToTicked', port: 'out' }, to: { moduleId: '_AsciiCharToBits', port: 'in' } },
      ],
      relativeLayout: {
        _KeyInput: { x: 0, y: 0 },
        _RepeatToMatch: { x: G, y: 0 },
        _AsciiSeqToTicked: { x: G * 2, y: 0 },
        _AsciiCharToBits: { x: G * 3, y: 0 },
      },
    },
  },
  {
    id: 'bit-stream-input',
    label: 'Bit Stream Input',
    description: 'Hex source → word-per-tick bits',
    snapshot: {
      modules: [
        { id: '_HexSource', defId: 'HexSource', params: { value: 'DEADBEEF' } },
        { id: '_BitsSeqToTicked', defId: 'BitsSequenceToTicked', params: { index: 0, wordWidth: 8, wrap: false } },
      ],
      connections: [
        { from: { moduleId: '_HexSource', port: 'out' }, to: { moduleId: '_BitsSeqToTicked', port: 'in' } },
      ],
      relativeLayout: {
        _HexSource: { x: 0, y: 0 },
        _BitsSeqToTicked: { x: G, y: 0 },
      },
    },
  },
  {
    id: 'symbol-output-chain',
    label: 'Symbol Output Chain',
    description: 'Ticked bits → ASCII → collect → output',
    snapshot: {
      modules: [
        { id: '_BitsToAscii', defId: 'BitsToAsciiChar', params: {} },
        { id: '_TickedToSeq', defId: 'TickedSymbolsToSequence', params: {} },
        { id: '_Output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: '_BitsToAscii', port: 'out' }, to: { moduleId: '_TickedToSeq', port: 'in' } },
        { from: { moduleId: '_TickedToSeq', port: 'out' }, to: { moduleId: '_Output', port: 'in' } },
      ],
      relativeLayout: {
        _BitsToAscii: { x: 0, y: 0 },
        _TickedToSeq: { x: G, y: 0 },
        _Output: { x: G * 2, y: 0 },
      },
    },
  },
];

export function getStarterById(id: string): PipelineStarter | undefined {
  return PIPELINE_STARTERS.find((s) => s.id === id);
}
