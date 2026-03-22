import { executeProject } from '../engine/executor';
import { V1_REGISTRY } from '../engine/modules';
import type {
  ExecutionResult,
  ModuleRegistry,
  Project,
} from '../engine/types';

export interface DemoProject {
  id: string;
  name: string;
  summary: string;
  pipeline: string;
  defaultTickedMode?: boolean;
  project: Project;
  layout: Record<string, { x: number; y: number }>;
}

export const demoProjects: DemoProject[] = [
  {
    id: 'bridge',
    name: 'Bridge Pipeline',
    summary: 'A minimal symbol-to-bits-to-symbol run that proves the engine/UI bridge.',
    pipeline: 'TextInput -> SymbolToBits -> XOR -> BitsToSymbol -> Output',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'M' } },
        { id: 'key', defId: 'BitSource', params: { stream: [0, 0, 0, 1, 1] } },
        { id: 'encode', defId: 'SymbolToBits', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 28, y: 72 },
      key: { x: 28, y: 262 },
      encode: { x: 240, y: 72 },
      xor: { x: 452, y: 162 },
      decode: { x: 664, y: 72 },
      output: { x: 876, y: 72 },
    },
  },
  {
    id: 'modern',
    name: 'Modern Toy Round',
    summary: 'A small bit-domain toy round using permutation and shifting before XOR.',
    pipeline: 'TextInput -> SymbolToBits -> Permutation -> BitShifter -> XOR -> BitsToSymbol -> Output',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'C' } },
        { id: 'encode', defId: 'SymbolToBits', params: {} },
        { id: 'permute', defId: 'Permutation', params: { order: '2,0,4,1,3' } },
        { id: 'shift', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } },
        { id: 'key', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1] } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'shift', port: 'in' } },
        { from: { moduleId: 'shift', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 24, y: 136 },
      encode: { x: 184, y: 136 },
      permute: { x: 344, y: 136 },
      shift: { x: 504, y: 136 },
      key: { x: 504, y: 304 },
      xor: { x: 664, y: 220 },
      decode: { x: 824, y: 136 },
      output: { x: 984, y: 136 },
    },
  },
  {
    id: 'byte-round',
    name: 'Byte S-Box Round',
    summary: 'An 8-bit substitution and permutation round that stays fully in the bit domain.',
    pipeline: 'BitSource -> SBox(256) -> Permutation -> BitOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1, 1, 0, 0] } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      sbox: { x: 292, y: 156 },
      permute: { x: 536, y: 156 },
      output: { x: 780, y: 156 },
    },
  },
  {
    id: 'hex-round',
    name: 'Hex Byte Round',
    summary: 'A byte-oriented round that starts from hex, stays in bits for substitution/permutation, and returns to hex.',
    pipeline: 'HexSource -> SBox(256) -> Permutation -> BitsToHex -> Output',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      sbox: { x: 252, y: 156 },
      permute: { x: 456, y: 156 },
      encode: { x: 660, y: 156 },
      output: { x: 864, y: 156 },
    },
  },
  {
    id: 'ascii-round',
    name: 'ASCII Byte Round',
    summary: 'A byte-oriented round that begins with ASCII text, transforms it in bits, and returns to ASCII.',
    pipeline: 'AsciiSource -> SBox(256) -> Permutation -> BitsToAscii -> Output',
    project: {
      modules: [
        { id: 'source', defId: 'AsciiSource', params: { value: 'A' } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        { id: 'encode', defId: 'BitsToAscii', params: {} },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      sbox: { x: 252, y: 156 },
      permute: { x: 456, y: 156 },
      encode: { x: 660, y: 156 },
      output: { x: 864, y: 156 },
    },
  },
  {
    id: 'sequential',
    name: 'Sequential Heart',
    summary: 'A clocked keystream pipeline that turns state changes into a symbol stream over time.',
    pipeline: 'Clock -> LFSR -> BitsToSymbol -> Output',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        {
          id: 'lfsr',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 5 },
        },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 48, y: 156 },
      lfsr: { x: 292, y: 156 },
      decode: { x: 536, y: 156 },
      output: { x: 780, y: 156 },
    },
  },
  {
    id: 'keystream',
    name: 'Modern Keystream',
    summary: 'A clocked LFSR keystream XORs a plaintext bit stream without ever leaving the bit domain.',
    pipeline: 'Clock -> LFSR -> XOR(BitSource) -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'plain', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        {
          id: 'lfsr',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 1 },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 48, y: 72 },
      plain: { x: 48, y: 262 },
      lfsr: { x: 292, y: 72 },
      xor: { x: 536, y: 168 },
      output: { x: 780, y: 168 },
    },
  },
  {
    id: 'gated-keystream',
    name: 'Gated Keystream',
    summary: 'One clocked LFSR gates a second keystream register, creating a dependent clock chain in the bit domain.',
    pipeline: 'Clock -> Gate LFSR -> Data LFSR -> XOR(BitSource) -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'plain', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        {
          id: 'gate',
          defId: 'LFSR',
          params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 1 },
        },
        {
          id: 'data',
          defId: 'LFSR',
          params: { seed: [1, 1, 0, 1, 0], taps: '1,3', outputLength: 1 },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'gate', port: 'clock' } },
        { from: { moduleId: 'gate', port: 'out' }, to: { moduleId: 'data', port: 'clock' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 64 },
      plain: { x: 40, y: 256 },
      gate: { x: 260, y: 64 },
      data: { x: 500, y: 64 },
      xor: { x: 720, y: 168 },
      output: { x: 940, y: 168 },
    },
  },
  {
    id: 'hybrid',
    name: 'Hybrid Reference',
    summary: 'The V1 hybrid machine crossing classical and modern domains.',
    pipeline: 'TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'A' } },
        {
          id: 'rotor-fwd',
          defId: 'Rotor',
          params: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''), position: 0 },
        },
        {
          id: 'reflector',
          defId: 'Reflector',
          params: { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT'.split('') },
        },
        {
          id: 'rotor-rev',
          defId: 'Rotor',
          params: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''), position: 0 },
        },
        { id: 'encode', defId: 'SymbolToBits', params: {} },
        { id: 'key', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0] } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
        { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
        { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
        { from: { moduleId: 'rotor-rev', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 24, y: 132 },
      'rotor-fwd': { x: 184, y: 132 },
      reflector: { x: 344, y: 132 },
      'rotor-rev': { x: 504, y: 132 },
      encode: { x: 664, y: 132 },
      key: { x: 664, y: 304 },
      xor: { x: 824, y: 218 },
      decode: { x: 984, y: 132 },
      output: { x: 1144, y: 132 },
    },
  },
];

export function runDemoProject(project: Project, registry: ModuleRegistry = V1_REGISTRY): ExecutionResult {
  return executeProject(project, registry);
}
