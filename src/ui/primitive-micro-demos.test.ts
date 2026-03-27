import { describe, expect, it } from 'vitest';

import { getPrimitiveMicroDemo, PRIMITIVE_MICRO_DEMOS } from './primitive-micro-demos';

describe('primitive micro demos', () => {
  it('is bounded to the locked V1 primitive set', () => {
    expect(PRIMITIVE_MICRO_DEMOS.map((entry) => entry.defId)).toEqual([
      'Mux',
      'Demux',
      'Gate',
      'Equals',
      'AtLeast',
      'Majority',
    ]);
  });

  it('returns seeded demos only for eligible primitives', () => {
    expect(getPrimitiveMicroDemo('Mux')?.name).toBe('Mux Micro Demo');
    expect(getPrimitiveMicroDemo('Demux')?.name).toBe('Demux Micro Demo');
    expect(getPrimitiveMicroDemo('XOR')).toBeNull();
  });

  it('keeps the focal primitive first so the opened workspace anchors on it', () => {
    for (const entry of PRIMITIVE_MICRO_DEMOS) {
      expect(entry.document.project.modules[0]?.defId).toBe(entry.defId);
    }
  });
});
