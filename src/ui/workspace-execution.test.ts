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
});
