import { executeProject } from '../engine/executor';
import { V1_REGISTRY } from '../engine/modules';
import type {
  ExecutionResult,
  ModuleRegistry,
  Project,
  Signal,
} from '../engine/types';

export interface DemoProject {
  id: string;
  name: string;
  summary: string;
  pipeline: string;
  project: Project;
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
  },
];

export function runDemoProject(project: Project, registry: ModuleRegistry = V1_REGISTRY): ExecutionResult {
  return executeProject(project, registry);
}

export function formatSignal(signal: Signal | undefined): string {
  if (!signal) {
    return 'n/a';
  }

  return signal.type === 'symbol'
    ? signal.value
    : `[${signal.value.join(', ')}]`;
}
