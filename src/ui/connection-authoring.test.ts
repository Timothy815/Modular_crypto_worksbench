import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import { findIncomingConnectionIndex, getTargetPortState } from './connection-authoring';

const TEST_PROJECT: Project = {
  modules: [
    { id: 'src-a', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
    { id: 'src-b', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
    { id: 'xor-1', defId: 'XOR', params: {} },
    { id: 'sink-1', defId: 'BitOutput', params: {} },
  ],
  connections: [
    {
      from: { moduleId: 'src-a', port: 'out' },
      to: { moduleId: 'xor-1', port: 'a' },
    },
    {
      from: { moduleId: 'src-b', port: 'out' },
      to: { moduleId: 'xor-1', port: 'b' },
    },
    {
      from: { moduleId: 'xor-1', port: 'out' },
      to: { moduleId: 'sink-1', port: 'in' },
    },
  ],
};

const CYCLIC_REWIRE_PROJECT: Project = {
  modules: [
    { id: 'src-a', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
    { id: 'src-b', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
    { id: 'xor-1', defId: 'XOR', params: {} },
    { id: 'xor-2', defId: 'XOR', params: {} },
  ],
  connections: [
    {
      from: { moduleId: 'src-a', port: 'out' },
      to: { moduleId: 'xor-1', port: 'a' },
    },
    {
      from: { moduleId: 'src-b', port: 'out' },
      to: { moduleId: 'xor-1', port: 'b' },
    },
    {
      from: { moduleId: 'xor-1', port: 'out' },
      to: { moduleId: 'xor-2', port: 'a' },
    },
    {
      from: { moduleId: 'src-b', port: 'out' },
      to: { moduleId: 'xor-2', port: 'b' },
    },
  ],
};

describe('connection authoring helpers', () => {
  it('finds the incoming connection index for an occupied input', () => {
    expect(findIncomingConnectionIndex(TEST_PROJECT, 'xor-1', 'a')).toBe(0);
    expect(findIncomingConnectionIndex(TEST_PROJECT, 'sink-1', 'in')).toBe(2);
    expect(findIncomingConnectionIndex(TEST_PROJECT, 'src-a', 'out')).toBe(-1);
  });

  it('treats occupied inputs as valid replacement targets', () => {
    const state = getTargetPortState(
      TEST_PROJECT,
      V1_REGISTRY,
      'src-b',
      'out',
      'xor-1',
      'a',
    );

    expect(state.valid).toBe(true);
    expect(state.mode).toBe('replace');
    expect(state.replaceConnectionIndex).toBe(0);
  });

  it('allows retargeting an existing connection without self-collision', () => {
    const state = getTargetPortState(
      TEST_PROJECT,
      V1_REGISTRY,
      'src-a',
      'out',
      'xor-1',
      'b',
      0,
    );

    expect(state.valid).toBe(true);
    expect(state.mode).toBe('replace');
    expect(state.replaceConnectionIndex).toBe(1);
  });

  it('still blocks rewires that would introduce a cycle', () => {
    const state = getTargetPortState(
      CYCLIC_REWIRE_PROJECT,
      V1_REGISTRY,
      'xor-2',
      'out',
      'xor-1',
      'a',
    );

    expect(state.valid).toBe(false);
    expect(state.mode).toBe('blocked');
  });

  it('blocks signal kind mismatches with an explicit bridge suggestion', () => {
    const project: Project = {
      modules: [
        { id: 'message', defId: 'AsciiSequenceInput', params: { value: 'HELLO' } },
        { id: 'bridge', defId: 'AsciiCharToBits', params: {} },
      ],
      connections: [],
    };

    const state = getTargetPortState(project, V1_REGISTRY, 'message', 'out', 'bridge', 'in');

    expect(state.valid).toBe(false);
    expect(state.mode).toBe('blocked');
    expect(state.reason).toContain('Signal kind mismatch');
    expect(state.reason).toContain('Insert SymbolSequenceToTicked or AsciiSequenceToTicked');
  });
});
