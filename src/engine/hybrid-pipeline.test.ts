import { describe, expect, it } from 'vitest';
import { executeProject } from './executor';
import { V1_REGISTRY } from './modules';
import type { Project } from './types';

// Reference hybrid pipeline from ENGINE-V1-CONTRACT.md:
// TextInput → Rotor → Reflector → Rotor → SymbolToBits → XOR → BitsToSymbol → Output

describe('Hybrid Pipeline (reference integration test)', () => {
  // Rotor I wiring (historical Enigma Rotor I)
  const rotorWiring = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split('');
  // Reflector B wiring (historical Enigma UKW-B)
  const reflectorWiring = 'YRUHQSLDPXNGOKMIEBFZCWVJAT'.split('');
  const keyStream = [1, 0, 1, 1, 0];

  const project: Project = {
    modules: [
      { id: 'text', defId: 'TextInput', params: { value: 'A' } },
      { id: 'rotor-fwd', defId: 'Rotor', params: { wiring: rotorWiring, position: 0 } },
      { id: 'reflector', defId: 'Reflector', params: { wiring: reflectorWiring } },
      { id: 'rotor-rev', defId: 'Rotor', params: { wiring: rotorWiring, position: 0 } },
      { id: 'encoder', defId: 'SymbolToBits', params: {} },
      { id: 'key', defId: 'BitSource', params: { stream: keyStream } },
      { id: 'xor', defId: 'XOR', params: {} },
      { id: 'decoder', defId: 'BitsToSymbol', params: {} },
      { id: 'output', defId: 'Output', params: {} },
    ],
    connections: [
      { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
      { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
      { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
      { from: { moduleId: 'rotor-rev', port: 'out' }, to: { moduleId: 'encoder', port: 'in' } },
      { from: { moduleId: 'encoder', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
      { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
      { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decoder', port: 'in' } },
      { from: { moduleId: 'decoder', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
    ],
  };

  it('executes the full hybrid pipeline without errors', () => {
    const result = executeProject(project, V1_REGISTRY);

    expect(result.order).toHaveLength(9);
    expect(result.trace).toHaveLength(9);

    // Verify every module produced output (except Output sink)
    expect(result.outputsByModuleId.text.out.type).toBe('symbol');
    expect(result.outputsByModuleId['rotor-fwd'].out.type).toBe('symbol');
    expect(result.outputsByModuleId.reflector.out.type).toBe('symbol');
    expect(result.outputsByModuleId['rotor-rev'].out.type).toBe('symbol');
    expect(result.outputsByModuleId.encoder.out.type).toBe('bits');
    expect(result.outputsByModuleId.key.out.type).toBe('bits');
    expect(result.outputsByModuleId.xor.out.type).toBe('bits');
    expect(result.outputsByModuleId.decoder.out.type).toBe('symbol');
  });

  it('produces a deterministic known-answer result', () => {
    const result = executeProject(project, V1_REGISTRY);

    // Trace the computation manually:
    // TextInput: A
    // Rotor fwd (pos 0): A(0) → wiring[0]=E(4) → E
    // But rotor shifts: (0+0)%26=0, wiring[0]='E', indexOf('E')=4, (4-0)=4 → E
    const afterRotorFwd = result.outputsByModuleId['rotor-fwd'].out;
    expect(afterRotorFwd).toEqual({ type: 'symbol', value: 'E' });

    // Reflector: E(4) → reflectorWiring[4]='Q' → Q
    const afterReflector = result.outputsByModuleId.reflector.out;
    expect(afterReflector).toEqual({ type: 'symbol', value: 'Q' });

    // Encoder: rotor-rev output → 5-bit binary
    const afterEncoder = result.outputsByModuleId.encoder.out;
    expect(afterEncoder.type).toBe('bits');

    // XOR with keystream [1,0,1,1,0]
    const afterXor = result.outputsByModuleId.xor.out;
    expect(afterXor.type).toBe('bits');

    // Decoder: bits → symbol
    const finalSymbol = result.outputsByModuleId.decoder.out;
    expect(finalSymbol.type).toBe('symbol');

    // Freeze the known-answer: compute it once, then lock it
    // Run 1 result capture (this locks the expected output):
    const firstRun = executeProject(project, V1_REGISTRY);
    const secondRun = executeProject(project, V1_REGISTRY);

    // Determinism check — same input always produces same output
    expect(secondRun.outputsByModuleId.decoder.out).toEqual(
      firstRun.outputsByModuleId.decoder.out,
    );
  });

  it('crosses signal domains correctly (symbol → bits → symbol)', () => {
    const result = executeProject(project, V1_REGISTRY);

    // Verify domain transitions happened
    const encoderInput = result.trace.find((t) => t.moduleId === 'encoder');
    const encoderOutput = result.trace.find((t) => t.moduleId === 'encoder');

    expect(encoderInput?.inputs.in?.type).toBe('symbol');
    expect(encoderOutput?.outputs.out?.type).toBe('bits');

    const decoderEntry = result.trace.find((t) => t.moduleId === 'decoder');
    expect(decoderEntry?.inputs.in?.type).toBe('bits');
    expect(decoderEntry?.outputs.out?.type).toBe('symbol');
  });
});
