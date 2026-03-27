import { describe, expect, it } from 'vitest';

import { getPrimitiveMicroDemo, PRIMITIVE_MICRO_DEMOS } from './primitive-micro-demos';

describe('primitive micro demos', () => {
  it('is bounded to the locked V1 and V2 primitive sets', () => {
    expect(PRIMITIVE_MICRO_DEMOS.map((entry) => entry.defId)).toEqual([
      'Mux',
      'Demux',
      'Gate',
      'Equals',
      'AtLeast',
      'Majority',
      'Clock',
      'Counter',
      'BitSplit',
      'BitPad',
      'BitJoin',
      'LFSR',
    ]);
  });

  it('returns seeded demos only for eligible primitives', () => {
    expect(getPrimitiveMicroDemo('Mux')?.name).toBe('Mux Micro Demo');
    expect(getPrimitiveMicroDemo('Demux')?.name).toBe('Demux Micro Demo');
    expect(getPrimitiveMicroDemo('Counter')?.name).toBe('Counter Micro Demo');
    expect(getPrimitiveMicroDemo('LFSR')?.name).toBe('LFSR Micro Demo');
    expect(getPrimitiveMicroDemo('XOR')).toBeNull();
  });

  it('keeps the focal primitive first so the opened workspace anchors on it', () => {
    for (const entry of PRIMITIVE_MICRO_DEMOS) {
      expect(entry.document.project.modules[0]?.defId).toBe(entry.defId);
    }
  });

  it('defaults timing and state micro demos to ticked mode only for the locked V2 runtime set', () => {
    expect(getPrimitiveMicroDemo('Clock')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('Counter')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('LFSR')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('BitSplit')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('BitPad')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('BitJoin')?.defaultTickedMode).toBeUndefined();
  });
});
