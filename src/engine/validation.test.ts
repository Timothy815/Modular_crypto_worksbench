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
    paramSchema: {
      mode: {
        key: 'mode',
        label: 'Mode',
        kind: 'select',
        defaultValue: 'strict',
        required: true,
        options: [
          { label: 'Strict', value: 'strict' },
          { label: 'Lenient', value: 'lenient' },
        ],
      },
    },
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
        { id: 'sink-1', defId: 'Sink', params: { mode: 'strict' } },
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

  it('rejects missing required params', () => {
    const project: Project = {
      modules: [{ id: 'sink-1', defId: 'Sink', params: {} }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'missing-required-param')).toBe(true);
  });

  it('rejects unknown params', () => {
    const project: Project = {
      modules: [{ id: 'sink-1', defId: 'Sink', params: { mode: 'strict', extra: true } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'unknown-param')).toBe(true);
  });

  it('rejects invalid select options', () => {
    const project: Project = {
      modules: [{ id: 'sink-1', defId: 'Sink', params: { mode: 'broken' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-param-option')).toBe(true);
  });

  it('rejects duplicate incoming edges to one input', () => {
    const project: Project = {
      modules: [
        { id: 'source-1', defId: 'Source', params: {} },
        { id: 'source-2', defId: 'Source', params: {} },
        { id: 'sink-1', defId: 'Sink', params: { mode: 'strict' } },
      ],
      connections: [
        {
          from: { moduleId: 'source-1', port: 'out' },
          to: { moduleId: 'sink-1', port: 'in' },
        },
        {
          from: { moduleId: 'source-2', port: 'out' },
          to: { moduleId: 'sink-1', port: 'in' },
        },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'duplicate-input-connection')).toBe(true);
  });

  it('rejects unknown module definitions', () => {
    const project: Project = {
      modules: [{ id: 'ghost', defId: 'MissingDef', params: {} }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'unknown-module-def')).toBe(true);
  });
});
