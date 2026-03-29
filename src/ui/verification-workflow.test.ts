import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import {
  createVerificationCaseFromBaseline,
  evaluateVerificationCases,
  getVerificationSourceOptions,
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
});
