import { describe, expect, it } from 'vitest';

import { TextInput } from '../engine/modules/text-input';
import { Output } from '../engine/modules/output';
import { XOR } from '../engine/modules/xor';
import { V1_REGISTRY } from '../engine/modules';
import { executeProject } from '../engine/executor';
import type { ModuleRegistry, Project } from '../engine/types';
import {
  buildStageSignalInspection,
  serializeStageSignalForClipboard,
} from './stage-signal-inspection';

describe('buildStageSignalInspection', () => {
  it('builds a bounded comparison for a linear single-input chain', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'shift', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'shift', port: 'in' } },
        { from: { moduleId: 'shift', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    };

    const execution = executeProject(project, V1_REGISTRY);
    const inspection = buildStageSignalInspection({
      execution,
      executionError: null,
      project,
      registry: V1_REGISTRY,
      moduleInstance: project.modules[1] ?? null,
      moduleDef: V1_REGISTRY.BitShifter,
      roleDetail: 'visible transformation stage',
    });

    expect(inspection?.traceState).toBe('ready');
    expect(inspection?.display?.representation).toBe('hex');
    expect(inspection?.parents).toHaveLength(1);
    expect(inspection?.parents[0]?.moduleId).toBe('source');
    expect(inspection?.comparison?.status).toBe('changed');
  });

  it('shows all immediate visible parents for a multi-input module and suppresses previous-stage comparison', () => {
    const project: Project = {
      modules: [
        { id: 'left', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'right', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'mix', defId: 'XOR', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'mix', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'mix', port: 'b' } },
      ],
    };

    const execution = executeProject(project, V1_REGISTRY);
    const inspection = buildStageSignalInspection({
      execution,
      executionError: null,
      project,
      registry: V1_REGISTRY,
      moduleInstance: project.modules[2] ?? null,
      moduleDef: XOR,
      roleDetail: 'visible transformation stage',
    });

    expect(inspection?.parents.map((parent) => parent.moduleId)).toEqual(['left', 'right']);
    expect(inspection?.comparison).toBeNull();
  });

  it('treats a selected sink as an input-stage inspection target', () => {
    const project: Project = {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'HELLO' } },
        { id: 'sink', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'sink', port: 'in' } },
      ],
    };
    const registry: ModuleRegistry = {
      ...V1_REGISTRY,
      TextInput,
      Output,
    };

    const execution = executeProject(project, registry);
    const inspection = buildStageSignalInspection({
      execution,
      executionError: null,
      project,
      registry,
      moduleInstance: project.modules[1] ?? null,
      moduleDef: Output,
      roleDetail: 'final endpoint for the visible result',
    });

    expect(inspection?.selectedPortDirection).toBe('input');
    expect(inspection?.display?.value).toBe('HELLO');
    expect(inspection?.parents).toHaveLength(1);
    expect(inspection?.parents[0]?.moduleId).toBe('text');
  });

  it('reports no-execution and execution-error states honestly', () => {
    const project: Project = { modules: [], connections: [] };

    const noExecution = buildStageSignalInspection({
      execution: null,
      executionError: null,
      project,
      registry: V1_REGISTRY,
      moduleInstance: { id: 'text', defId: 'TextInput', params: { value: 'A' } },
      moduleDef: TextInput,
      roleDetail: 'graph entry point',
    });
    expect(noExecution?.traceState).toBe('no-execution');
    expect(noExecution?.traceMessage).toContain('Run the machine');

    const executionError = buildStageSignalInspection({
      execution: null,
      executionError: 'cycle detected',
      project,
      registry: V1_REGISTRY,
      moduleInstance: { id: 'text', defId: 'TextInput', params: { value: 'A' } },
      moduleDef: TextInput,
      roleDetail: 'graph entry point',
    });
    expect(executionError?.traceState).toBe('execution-error');
    expect(executionError?.traceMessage).toContain('failed validation or execution');
  });
});

describe('serializeStageSignalForClipboard', () => {
  it('returns display text by default for bit signals and raw bits when requested', () => {
    expect(
      serializeStageSignalForClipboard({ type: 'bits', value: [1, 0, 1, 0, 1, 0, 1, 0] }),
    ).toBe('AA');
    expect(
      serializeStageSignalForClipboard({ type: 'bits', value: [1, 0, 1, 0, 1, 0, 1, 0] }, 'bits'),
    ).toBe('10101010');
  });

  it('returns symbol values directly and null for absent signals', () => {
    expect(serializeStageSignalForClipboard({ type: 'symbol', value: 'HELLO' })).toBe('HELLO');
    expect(serializeStageSignalForClipboard(null)).toBeNull();
  });
});
