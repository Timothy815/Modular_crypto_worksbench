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
