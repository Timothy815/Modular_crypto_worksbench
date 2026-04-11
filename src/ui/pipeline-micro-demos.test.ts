import { describe, expect, it } from 'vitest';

import { deriveTickCount, executeProject, executeTickedProject } from '../engine/executor';
import { V1_REGISTRY } from '../engine/modules';
import { validateProject } from '../engine/validation';
import { getPipelineMicroDemo, PIPELINE_MICRO_DEMOS } from './pipeline-micro-demos';

describe('pipeline micro demos', () => {
  it('is bounded to the locked V1 end-to-end sequence and mismatch workflows', () => {
    expect(PIPELINE_MICRO_DEMOS.map((entry) => entry.id)).toEqual([
      'ascii-repeated-key-xor',
      'strict-match-before-xor',
      'truncate-to-block',
      'pad-to-block',
      'representation-round-trip',
    ]);
  });

  it('returns seeded demos by pipeline id', () => {
    expect(getPipelineMicroDemo('ascii-repeated-key-xor')?.name).toBe('ASCII Repeated-Key XOR');
    expect(getPipelineMicroDemo('strict-match-before-xor')?.name).toBe('Strict Match Before XOR');
    expect(getPipelineMicroDemo('truncate-to-block')?.name).toBe('Truncate To Block');
    expect(getPipelineMicroDemo('pad-to-block')?.name).toBe('Pad To Block');
    expect(getPipelineMicroDemo('representation-round-trip')?.name).toBe('Representation Round Trip');
    expect(getPipelineMicroDemo('missing')).toBeNull();
  });

  it('defaults the ticked composition workflows to ticked mode and leaves the round-trip unticked', () => {
    expect(getPipelineMicroDemo('ascii-repeated-key-xor')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('strict-match-before-xor')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('truncate-to-block')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('pad-to-block')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('representation-round-trip')?.defaultTickedMode).toBeUndefined();
  });

  it('keeps the repeated-key XOR demo honest about explicit repetition, bridges, and collection', () => {
    const demo = getPipelineMicroDemo('ascii-repeated-key-xor');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'XOR',
      'AsciiSequenceInput',
      'AsciiSequenceInput',
      'RepeatSymbolToMatch',
      'AsciiSequenceToTicked',
      'AsciiSequenceToTicked',
      'AsciiCharToBits',
      'AsciiCharToBits',
      'Clock',
      'TickedBitsToSequence',
      'BitsToHex',
      'HexOutput',
    ]);
  });

  it('keeps the strict-match XOR demo honest about fail-fast assertion instead of repair', () => {
    const demo = getPipelineMicroDemo('strict-match-before-xor');
    expect(demo?.document.project.modules.map((module) => module.defId)).toContain(
      'RequireSymbolLengthMatch',
    );
    expect(demo?.document.project.modules.map((module) => module.defId)).not.toContain(
      'RepeatSymbolToMatch',
    );
  });

  it('keeps the truncate and pad demos honest about their explicit mismatch policies', () => {
    const truncate = getPipelineMicroDemo('truncate-to-block');
    const pad = getPipelineMicroDemo('pad-to-block');

    expect(truncate?.document.project.modules.map((module) => module.defId)).toContain(
      'TruncateBitsToMatch',
    );
    expect(truncate?.document.project.modules.map((module) => module.defId)).not.toContain(
      'PadBitsToMatch',
    );
    expect(pad?.document.project.modules.map((module) => module.defId)).toContain('PadBitsToMatch');
    expect(pad?.document.project.modules.map((module) => module.defId)).not.toContain(
      'TruncateBitsToMatch',
    );
  });

  it('keeps the round-trip demo honest about explicit representation bridges', () => {
    const demo = getPipelineMicroDemo('representation-round-trip');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'AsciiSequenceInput',
      'AsciiSequenceToBits',
      'BitsToHex',
      'HexOutput',
      'HexSequenceInput',
      'BitsToAscii',
      'TextOutput',
    ]);
  });

  it('keeps every seeded workspace statically valid', () => {
    for (const demo of PIPELINE_MICRO_DEMOS) {
      const validation = validateProject(demo.document.project, V1_REGISTRY);
      expect(validation.ok, demo.id).toBe(true);
    }
  });

  it('executes the unticked round-trip demo and all ticked demos without runtime failure', () => {
    for (const demo of PIPELINE_MICRO_DEMOS) {
      if (demo.defaultTickedMode) {
        const tickCount = deriveTickCount(demo.document.project, V1_REGISTRY);
        expect(tickCount, demo.id).not.toBeNull();
        expect(() =>
          executeTickedProject(demo.document.project, V1_REGISTRY, tickCount ?? 0),
        ).not.toThrow();
      } else {
        expect(() => executeProject(demo.document.project, V1_REGISTRY)).not.toThrow();
      }
    }
  });
});
