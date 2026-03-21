import { describe, expect, it } from 'vitest';

import type { ModuleRegistry, Project } from './types';
import { validateProject } from './validation';

const registry: ModuleRegistry = {
  Source: {
    id: 'Source',
    name: 'Source',
    inputs: [],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: () => ({ out: { type: 'symbol', value: 'A' } }),
  },
  Sink: {
    id: 'Sink',
    name: 'Sink',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [],
    paramSchema: {},
    evaluate: () => ({}),
  },
  Loop: {
    id: 'Loop',
    name: 'Loop',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
};

describe('validateProject', () => {
  it('rejects signal type mismatches', () => {
    const project: Project = {
      modules: [
        { id: 'source-1', defId: 'Source', params: {} },
        { id: 'sink-1', defId: 'Sink', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'source-1', port: 'out' },
          to: { moduleId: 'sink-1', port: 'in' },
        },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'signal-type-mismatch')).toBe(true);
  });

  it('rejects cycles', () => {
    const project: Project = {
      modules: [
        { id: 'a', defId: 'Loop', params: {} },
        { id: 'b', defId: 'Loop', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'a', port: 'out' },
          to: { moduleId: 'b', port: 'in' },
        },
        {
          from: { moduleId: 'b', port: 'out' },
          to: { moduleId: 'a', port: 'in' },
        },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'cycle-detected')).toBe(true);
  });
});
