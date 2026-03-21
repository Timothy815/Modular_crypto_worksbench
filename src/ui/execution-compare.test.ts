import { describe, expect, it } from 'vitest';

import { executeProject } from '../engine/executor';
import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import { compareExecutionResults, findFirstTraceDivergence } from './execution-compare';

describe('execution comparison helpers', () => {
  const baseProject: Project = {
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

  it('detects matching outputs and no divergence for identical executions', () => {
    const baseline = executeProject(baseProject, V1_REGISTRY);
    const variant = executeProject(baseProject, V1_REGISTRY);

    const comparison = compareExecutionResults(baseline, variant);

    expect(comparison.outputsMatch).toBe(true);
    expect(comparison.baselineOutput.formatted).toBe('W');
    expect(comparison.variantOutput.formatted).toBe('W');
    expect(comparison.firstDivergence).toBeNull();
  });

  it('finds the first divergence when a parameter mutation changes the trace', () => {
    const baseline = executeProject(baseProject, V1_REGISTRY);
    const variantProject: Project = {
      ...baseProject,
      modules: baseProject.modules.map((moduleInstance) =>
        moduleInstance.id === 'key'
          ? { ...moduleInstance, params: { stream: [1, 0, 1, 1, 1] } }
          : { ...moduleInstance, params: { ...moduleInstance.params } },
      ),
      connections: baseProject.connections.map((connection) => ({
        from: { ...connection.from },
        to: { ...connection.to },
      })),
    };
    const variant = executeProject(variantProject, V1_REGISTRY);

    const comparison = compareExecutionResults(baseline, variant);

    expect(comparison.outputsMatch).toBe(false);
    expect(comparison.baselineOutput.formatted).toBe('W');
    expect(comparison.variantOutput.formatted).toBe('X');
    expect(comparison.firstDivergence).toMatchObject({
      stepIndex: 1,
      reason: 'outputs',
    });
    expect(comparison.firstDivergence?.baseline?.moduleId).toBe('key');
    expect(comparison.firstDivergence?.variant?.moduleId).toBe('key');
  });

  it('detects divergence when execution order changes', () => {
    const baseline = executeProject(baseProject, V1_REGISTRY);
    const variantProject: Project = {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'A' } },
        { id: 'encode', defId: 'SymbolToBits', params: {} },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    };
    const variant = executeProject(variantProject, V1_REGISTRY);

    const divergence = findFirstTraceDivergence(baseline, variant);

    expect(divergence).toMatchObject({
      stepIndex: 1,
      reason: 'module-id',
    });
    expect(divergence?.baseline?.moduleId).toBe('key');
    expect(divergence?.variant?.moduleId).toBe('encode');
  });
});
