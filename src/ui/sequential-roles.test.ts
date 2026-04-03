import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import { getSequentialRole, getSequentialRoleLabel } from './sequential-roles';

describe('sequential role helpers', () => {
  it('classifies stateful modules as state', () => {
    expect(getSequentialRole('LFSR', V1_REGISTRY.LFSR)).toBe('state');
  });

  it('classifies bounded control modules as control', () => {
    expect(getSequentialRole('Clock', V1_REGISTRY.Clock)).toBe('control');
  });

  it('classifies output sinks as observe', () => {
    expect(getSequentialRole('BitOutput', V1_REGISTRY.BitOutput)).toBe('observe');
  });

  it('leaves unclassified modules without a badge', () => {
    expect(getSequentialRole('XOR', V1_REGISTRY.XOR)).toBeNull();
  });

  it('returns readable labels', () => {
    expect(getSequentialRoleLabel('state')).toBe('State');
    expect(getSequentialRoleLabel('control')).toBe('Control');
    expect(getSequentialRoleLabel('observe')).toBe('Observe');
  });
});
