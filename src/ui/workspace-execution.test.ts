import { describe, expect, it } from 'vitest';

import { BitOutput } from '../engine/modules/bit-output';
import { BitSource } from '../engine/modules/bit-source';
import { Clock } from '../engine/modules/clock';
import { Counter } from '../engine/modules/counter';
import type { ModuleRegistry, Project } from '../engine/types';
import { resolveWorkspaceExecution } from './workspace-execution';

const registry: ModuleRegistry = {
  [BitSource.id]: BitSource,
  [BitOutput.id]: BitOutput,
  [Clock.id]: Clock,
  [Counter.id]: Counter,
  NeedsParam: {
    id: 'NeedsParam',
    name: 'Needs Param',
    inputs: [],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {
      mode: {
        key: 'mode',
        label: 'Mode',
        kind: 'select',
        defaultValue: 'strict',
        required: true,
        options: [
          { label: 'Strict', value: 'strict' },
          { label: 'Loose', value: 'loose' },
        ],
      },
    },
    evaluate: () => ({ out: { type: 'bits', value: [1] } }),
  },
};

describe('resolveWorkspaceExecution', () => {
  it('keeps a valid sink branch running when an isolated invalid module is added', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'output', defId: 'BitOutput', params: {} },
        { id: 'dangling', defId: 'NeedsParam', params: {} },
      ],
      connections: [{ from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'output', port: 'in' } }],
    };

    const result = resolveWorkspaceExecution(project, registry, false, 0);

    expect(result.executionError).toBeNull();
    expect(result.primaryOutputModuleId).toBe('output');
    expect(result.execution?.trace.some((entry) => entry.moduleId === 'output')).toBe(true);
  });

  it('prefers a sink with a real signal over a disconnected sink when choosing the primary output', () => {
    const project: Project = {
      modules: [
        { id: 'blank-output', defId: 'BitOutput', params: {} },
        { id: 'source', defId: 'BitSource', params: { stream: [1, 1, 0, 0] } },
        { id: 'connected-output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'connected-output', port: 'in' } },
      ],
    };

    const result = resolveWorkspaceExecution(project, registry, false, 0);

    expect(result.executionError).toBeNull();
    expect(result.primaryOutputModuleId).toBe('connected-output');
  });

  it('keeps ticked execution available when an isolated invalid branch is present', () => {
    const project: Project = {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 2, offset: 0, length: 8 } },
        { id: 'counter', defId: 'Counter', params: { width: 4, value: 0, step: 1 } },
        { id: 'output', defId: 'BitOutput', params: {} },
        { id: 'dangling', defId: 'NeedsParam', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'counter', port: 'clock' } },
        { from: { moduleId: 'counter', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    };

    const result = resolveWorkspaceExecution(project, registry, true, 1);

    expect(result.executionError).toBeNull();
    expect(result.tickedExecution).not.toBeNull();
    expect(result.tickCount).toBeGreaterThan(0);
    expect(result.primaryOutputModuleId).toBe('output');
  });

  it('prefers the selected chain sink when the selection belongs to exactly one output branch', () => {
    const project: Project = {
      modules: [
        { id: 'left-source', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'left-output', defId: 'BitOutput', params: {} },
        { id: 'right-source', defId: 'BitSource', params: { stream: [1, 1, 0, 0] } },
        { id: 'right-output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left-source', port: 'out' }, to: { moduleId: 'left-output', port: 'in' } },
        { from: { moduleId: 'right-source', port: 'out' }, to: { moduleId: 'right-output', port: 'in' } },
      ],
    };

    const result = resolveWorkspaceExecution(project, registry, false, 0, ['right-source']);

    expect(result.executionError).toBeNull();
    expect(result.primaryOutputModuleId).toBe('right-output');
  });

  it('falls back to the normal primary-output heuristic when the selected module is shared upstream', () => {
    const project: Project = {
      modules: [
        { id: 'shared-source', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'left-output', defId: 'BitOutput', params: {} },
        { id: 'right-output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'shared-source', port: 'out' }, to: { moduleId: 'left-output', port: 'in' } },
        { from: { moduleId: 'shared-source', port: 'out' }, to: { moduleId: 'right-output', port: 'in' } },
      ],
    };

    const result = resolveWorkspaceExecution(project, registry, false, 0, ['shared-source']);

    expect(result.executionError).toBeNull();
    expect(result.primaryOutputModuleId).toBe('left-output');
  });

  it('uses the selected branch tick count when output branches have different lengths', () => {
    const project: Project = {
      modules: [
        { id: 'left-clock', defId: 'Clock', params: { period: 1, offset: 0, length: 2 } },
        { id: 'left-counter', defId: 'Counter', params: { width: 3, value: 0, step: 1 } },
        { id: 'left-output', defId: 'BitOutput', params: {} },
        { id: 'right-clock', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        { id: 'right-counter', defId: 'Counter', params: { width: 3, value: 0, step: 1 } },
        { id: 'right-output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left-clock', port: 'pulse' }, to: { moduleId: 'left-counter', port: 'clock' } },
        { from: { moduleId: 'left-counter', port: 'out' }, to: { moduleId: 'left-output', port: 'in' } },
        { from: { moduleId: 'right-clock', port: 'pulse' }, to: { moduleId: 'right-counter', port: 'clock' } },
        { from: { moduleId: 'right-counter', port: 'out' }, to: { moduleId: 'right-output', port: 'in' } },
      ],
    };

    const defaultResult = resolveWorkspaceExecution(project, registry, true, 0);
    expect(defaultResult.tickCount).toBe(2);

    const selectedResult = resolveWorkspaceExecution(project, registry, true, 4, ['right-counter']);

    expect(selectedResult.executionError).toBeNull();
    expect(selectedResult.primaryOutputModuleId).toBe('right-output');
    expect(selectedResult.tickCount).toBe(5);
    expect(selectedResult.tickedExecution?.ticks).toHaveLength(5);
  });
});
