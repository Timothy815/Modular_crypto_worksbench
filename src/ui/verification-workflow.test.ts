import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import {
  createVerificationCaseFromBaseline,
  createTickedVerificationCaseFromBaseline,
  evaluateVerificationCases,
  getVerificationSourceOptions,
  importVerificationCasesFromText,
} from './verification-workflow';

describe('verification workflow helpers', () => {
  const project: Project = {
    modules: [
      { id: 'text', defId: 'TextInput', params: { value: 'A' } },
      { id: 'key', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0] } },
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
  };

  const tickedProject: Project = {
    modules: [
      { id: 'source', defId: 'HexSource', params: { value: 'A3F0' } },
      { id: 'key', defId: 'HexSource', params: { value: 'AAAA' } },
      { id: 'xor', defId: 'XOR', params: {} },
      { id: 'hex', defId: 'BitsToHex', params: {} },
      { id: 'output', defId: 'HexOutput', params: {} },
    ],
    connections: [
      { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
      { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
      { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
      { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
    ],
  };

  it('finds supported verification sources in a project', () => {
    const options = getVerificationSourceOptions(project, V1_REGISTRY);

    expect(options).toEqual([
      {
        moduleId: 'text',
        defId: 'TextInput',
        label: 'text (Text Input)',
      },
    ]);
  });

  it('builds a verification case from the captured baseline output', () => {
    const sourceOption = getVerificationSourceOptions(project, V1_REGISTRY)[0]!;
    const result = createVerificationCaseFromBaseline({
      baselineProject: project,
      registry: V1_REGISTRY,
      sourceOption,
      inputValue: 'A',
    });

    expect(result.error).toBeNull();
    expect(result.case).toMatchObject({
      sourceModuleId: 'text',
      sourceDefId: 'TextInput',
      inputValue: 'A',
      expectedOutput: 'W',
    });
  });

  it('reports pass/fail and first divergence for verification cases', () => {
    const sourceOption = getVerificationSourceOptions(project, V1_REGISTRY)[0]!;
    const builtCase = createVerificationCaseFromBaseline({
      baselineProject: project,
      registry: V1_REGISTRY,
      sourceOption,
      inputValue: 'A',
    });

    if (!builtCase.case) {
      throw new Error('Expected a verification case');
    }

    const passingResults = evaluateVerificationCases({
      baselineProject: project,
      currentProject: project,
      registry: V1_REGISTRY,
      cases: [builtCase.case],
    });

    expect(passingResults[0]).toMatchObject({
      expectedOutput: 'W',
      actualOutput: 'W',
      baselineOutput: 'W',
      passed: true,
      divergence: null,
      error: null,
    });

    const variantProject: Project = {
      modules: project.modules.map((moduleInstance) =>
        moduleInstance.id === 'key'
          ? { ...moduleInstance, params: { stream: [1, 0, 1, 1, 1] } }
          : { ...moduleInstance, params: { ...moduleInstance.params } },
      ),
      connections: project.connections.map((connection) => ({
        from: { ...connection.from },
        to: { ...connection.to },
      })),
    };

    const failingResults = evaluateVerificationCases({
      baselineProject: project,
      currentProject: variantProject,
      registry: V1_REGISTRY,
      cases: [builtCase.case],
    });

    expect(failingResults[0]).toMatchObject({
      expectedOutput: 'W',
      actualOutput: 'X',
      baselineOutput: 'W',
      passed: false,
      error: null,
    });
    expect(failingResults[0]?.divergence).toMatchObject({
      stepIndex: 1,
      reason: 'outputs',
    });
  });

  it('builds and evaluates bounded ticked verification cases', () => {
    const sourceOption = getVerificationSourceOptions(tickedProject, V1_REGISTRY)[0]!;
    const builtCase = createTickedVerificationCaseFromBaseline({
      baselineProject: tickedProject,
      registry: V1_REGISTRY,
      sourceOption,
      inputValue: 'A3F0',
      tickCount: 2,
    });

    expect(builtCase.error).toBeNull();
    expect(builtCase.case).toMatchObject({
      mode: 'ticked',
      sourceModuleId: 'source',
      inputValue: 'A3F0',
      tickCount: 2,
      expectedOutput: '095A',
    });

    if (!builtCase.case) {
      throw new Error('Expected a ticked verification case');
    }

    const passingResults = evaluateVerificationCases({
      baselineProject: tickedProject,
      currentProject: tickedProject,
      registry: V1_REGISTRY,
      cases: [builtCase.case],
    });

    expect(passingResults[0]).toMatchObject({
      mode: 'ticked',
      expectedOutput: '095A',
      actualOutput: '095A',
      baselineOutput: '095A',
      passed: true,
      error: null,
      tickCount: 2,
    });

    const variantProject: Project = {
      modules: tickedProject.modules.map((moduleInstance) =>
        moduleInstance.id === 'key'
          ? {
              ...moduleInstance,
              params: { value: 'F0F0' },
            }
          : { ...moduleInstance, params: { ...moduleInstance.params } },
      ),
      connections: tickedProject.connections.map((connection) => ({
        from: { ...connection.from },
        to: { ...connection.to },
      })),
    };

    const failingResults = evaluateVerificationCases({
      baselineProject: tickedProject,
      currentProject: variantProject,
      registry: V1_REGISTRY,
      cases: [builtCase.case],
    });

    expect(failingResults[0]).toMatchObject({
      mode: 'ticked',
      expectedOutput: '095A',
      actualOutput: '5300',
      baselineOutput: '095A',
      passed: false,
      error: null,
      tickCount: 2,
    });
    expect(failingResults[0]?.divergence).toMatchObject({
      tickIndex: 0,
      reason: 'outputs',
    });
  });

  it('imports multiple known-answer cases from bounded line-oriented text', () => {
    const sourceOption = getVerificationSourceOptions(project, V1_REGISTRY)[0]!;
    const preview = importVerificationCasesFromText({
      baselineProject: null,
      currentProject: project,
      registry: V1_REGISTRY,
      sourceOption,
      rawText: 'A -> W\nB: X\n# comment\nC, Y',
      mode: 'stateless',
    });

    expect(preview.errors).toEqual([]);
    expect(preview.cases).toHaveLength(3);
    expect(preview.cases.map((entry) => entry.inputValue)).toEqual(['A', 'B', 'C']);
    expect(preview.cases.map((entry) => entry.expectedOutput)).toEqual(['W', 'X', 'Y']);
    expect(preview.cases.every((entry) => entry.targetSinkModuleId === 'output')).toBe(true);
  });

  it('evaluates imported cases without a captured baseline as output-only checks', () => {
    const sourceOption = getVerificationSourceOptions(project, V1_REGISTRY)[0]!;
    const preview = importVerificationCasesFromText({
      baselineProject: null,
      currentProject: project,
      registry: V1_REGISTRY,
      sourceOption,
      rawText: 'A -> W\nB -> Q',
      mode: 'stateless',
    });

    const results = evaluateVerificationCases({
      baselineProject: null,
      currentProject: project,
      registry: V1_REGISTRY,
      cases: preview.cases,
    });

    expect(results[0]).toMatchObject({
      expectedOutput: 'W',
      actualOutput: 'W',
      baselineOutput: 'W',
      passed: true,
      divergence: null,
      targetSinkLabel: 'output (Output)',
    });
    expect(results[1]).toMatchObject({
      expectedOutput: 'Q',
      actualOutput: 'X',
      baselineOutput: 'Q',
      passed: false,
      divergence: null,
      targetSinkLabel: 'output (Output)',
    });
  });
});
