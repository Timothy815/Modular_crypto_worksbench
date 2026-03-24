import { describe, expect, it } from 'vitest';

import { AsciiSource } from './modules/ascii-source';
import { BaudotSource } from './modules/baudot-source';
import { HexSource } from './modules/hex-source';
import { Permutation } from './modules/permutation';
import { Plugboard } from './modules/plugboard';
import { Reflector } from './modules/reflector';
import { SBox } from './modules/s-box';
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
  [AsciiSource.id]: AsciiSource,
  [BaudotSource.id]: BaudotSource,
  [HexSource.id]: HexSource,
  [Permutation.id]: Permutation,
  [Plugboard.id]: Plugboard,
  [Reflector.id]: Reflector,
  [SBox.id]: SBox,
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

  it('rejects malformed permutation order params before execution', () => {
    const project: Project = {
      modules: [{ id: 'permute-1', defId: 'Permutation', params: { order: '0,1,X,3' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'permute-1' &&
          issue.message.includes('Permutation order must contain only non-negative integers'),
      ),
    ).toBe(true);
  });

  it('rejects malformed s-box tables before execution', () => {
    const project: Project = {
      modules: [{ id: 'sbox-1', defId: 'SBox', params: { table: '0,1,2' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'sbox-1' &&
          issue.message.includes('SBox table length must be a power of two'),
      ),
    ).toBe(true);
  });

  it('rejects malformed reflector wiring before execution', () => {
    const project: Project = {
      modules: [
        {
          id: 'reflector-1',
          defId: 'Reflector',
          params: { wiring: 'BCDEFGHIJKLMNOPQRSTUVWXYZA'.split('') },
        },
      ],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'reflector-1' &&
          issue.message.includes('Reflector wiring must be involutive'),
      ),
    ).toBe(true);
  });

  it('rejects malformed plugboard wiring before execution', () => {
    const project: Project = {
      modules: [
        {
          id: 'plugboard-1',
          defId: 'Plugboard',
          params: { wiring: 'BCADEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
        },
      ],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'plugboard-1' &&
          issue.message.includes('Plugboard wiring must be reciprocal'),
      ),
    ).toBe(true);
  });

  it('rejects malformed hex source params before execution', () => {
    const project: Project = {
      modules: [{ id: 'hex-1', defId: 'HexSource', params: { value: 'G1' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'hex-1' &&
          issue.message.includes('HexSource accepts only hexadecimal characters 0-9 and A-F'),
      ),
    ).toBe(true);
  });

  it('rejects non-ascii source params before execution', () => {
    const project: Project = {
      modules: [{ id: 'ascii-1', defId: 'AsciiSource', params: { value: 'é' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'ascii-1' &&
          issue.message.includes('AsciiSource accepts only 7-bit ASCII characters'),
      ),
    ).toBe(true);
  });

  it('rejects non-baudot source params before execution', () => {
    const project: Project = {
      modules: [{ id: 'baudot-1', defId: 'BaudotSource', params: { value: 'HELLO!' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'baudot-1' &&
          issue.message.includes('BaudotSource accepts only letters A-Z and spaces in letters mode'),
      ),
    ).toBe(true);
  });
});
