import { describe, expect, it } from 'vitest';

import { deriveTickCount, executeProject, executeTickedProject } from '../engine/executor';
import { V1_REGISTRY } from '../engine/modules';
import { validateProject } from '../engine/validation';
import { collectTickedOutput } from './execution-compare';
import { getPipelineMicroDemo, PIPELINE_MICRO_DEMOS } from './pipeline-micro-demos';

describe('pipeline micro demos', () => {
  it('is bounded to the shipped V1 set plus the locked V2 end-to-end sequence workflows', () => {
    expect(PIPELINE_MICRO_DEMOS.map((entry) => entry.id)).toEqual([
      'ascii-repeated-key-xor',
      'strict-match-before-xor',
      'truncate-to-block',
      'pad-to-block',
      'representation-round-trip',
      'scalar-times-two',
      'scalar-times-zero',
      'scalar-times-three',
      'visible-ecdh-shared-secret-equality',
      'point-order-cycles-to-infinity',
      'contrasting-point-orders',
      'ascii-repeated-key-xor-encrypt-decrypt',
      'ascii-strict-match-xor-encrypt-decrypt',
      'hex-block-xor',
      'hex-normalize-then-xor',
      'canvas-authoring-xor',
    ]);
  });

  it('returns seeded demos by pipeline id', () => {
    expect(getPipelineMicroDemo('ascii-repeated-key-xor')?.name).toBe('ASCII Repeated-Key XOR');
    expect(getPipelineMicroDemo('strict-match-before-xor')?.name).toBe('Strict Match Before XOR');
    expect(getPipelineMicroDemo('truncate-to-block')?.name).toBe('Truncate To Block');
    expect(getPipelineMicroDemo('pad-to-block')?.name).toBe('Pad To Block');
    expect(getPipelineMicroDemo('representation-round-trip')?.name).toBe('Representation Round Trip');
    expect(getPipelineMicroDemo('scalar-times-two')?.name).toBe('Scalar × 2');
    expect(getPipelineMicroDemo('scalar-times-zero')?.name).toBe('Scalar × 0');
    expect(getPipelineMicroDemo('scalar-times-three')?.name).toBe('Scalar × 3');
    expect(getPipelineMicroDemo('visible-ecdh-shared-secret-equality')?.name).toBe(
      'Visible ECDH Shared Secret Equality',
    );
    expect(getPipelineMicroDemo('point-order-cycles-to-infinity')?.name).toBe(
      'Point Order Cycles To Infinity',
    );
    expect(getPipelineMicroDemo('contrasting-point-orders')?.name).toBe(
      'Contrasting Point Orders',
    );
    expect(getPipelineMicroDemo('ascii-repeated-key-xor-encrypt-decrypt')?.name).toBe(
      'ASCII Repeated-Key XOR Encrypt/Decrypt',
    );
    expect(getPipelineMicroDemo('ascii-strict-match-xor-encrypt-decrypt')?.name).toBe(
      'ASCII Strict-Match XOR Encrypt/Decrypt',
    );
    expect(getPipelineMicroDemo('hex-block-xor')?.name).toBe('Hex Block XOR');
    expect(getPipelineMicroDemo('hex-normalize-then-xor')?.name).toBe('Hex Normalize Then XOR');
    expect(getPipelineMicroDemo('canvas-authoring-xor')?.name).toBe('Canvas Authoring XOR Builder');
    expect(getPipelineMicroDemo('missing')).toBeNull();
  });

  it('defaults every composition workflow to ticked mode and leaves the round-trip unticked', () => {
    expect(getPipelineMicroDemo('ascii-repeated-key-xor')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('strict-match-before-xor')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('truncate-to-block')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('pad-to-block')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('ascii-repeated-key-xor-encrypt-decrypt')?.defaultTickedMode).toBe(
      true,
    );
    expect(getPipelineMicroDemo('ascii-strict-match-xor-encrypt-decrypt')?.defaultTickedMode).toBe(
      true,
    );
    expect(getPipelineMicroDemo('hex-block-xor')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('hex-normalize-then-xor')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('canvas-authoring-xor')?.defaultTickedMode).toBe(true);
    expect(getPipelineMicroDemo('scalar-times-two')?.defaultTickedMode).toBeUndefined();
    expect(getPipelineMicroDemo('scalar-times-zero')?.defaultTickedMode).toBeUndefined();
    expect(getPipelineMicroDemo('scalar-times-three')?.defaultTickedMode).toBeUndefined();
    expect(getPipelineMicroDemo('visible-ecdh-shared-secret-equality')?.defaultTickedMode).toBeUndefined();
    expect(getPipelineMicroDemo('point-order-cycles-to-infinity')?.defaultTickedMode).toBeUndefined();
    expect(getPipelineMicroDemo('contrasting-point-orders')?.defaultTickedMode).toBeUndefined();
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

  it('keeps the scalar micro demos honest about visible point action and bounded checks', () => {
    const timesTwo = getPipelineMicroDemo('scalar-times-two');
    const timesZero = getPipelineMicroDemo('scalar-times-zero');
    const timesThree = getPipelineMicroDemo('scalar-times-three');
    const pointOrderCycle = getPipelineMicroDemo('point-order-cycles-to-infinity');
    const contrastingOrders = getPipelineMicroDemo('contrasting-point-orders');

    expect(timesTwo?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitSource',
      'BitsToInteger',
      'PointSource',
      'ScalarMultiply',
      'PointOutput',
      'PointDouble',
      'PointOutput',
    ]);

    expect(timesZero?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitSource',
      'BitsToInteger',
      'PointSource',
      'ScalarMultiply',
      'PointOutput',
    ]);

    expect(timesThree?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitSource',
      'BitsToInteger',
      'PointSource',
      'ScalarMultiply',
      'PointOutput',
      'PointDouble',
      'PointAdd',
      'PointOutput',
    ]);

    const ecdh = getPipelineMicroDemo('visible-ecdh-shared-secret-equality');
    expect(ecdh?.document.project.modules.map((module) => module.defId)).toEqual([
      'PointSource',
      'BitSource',
      'BitsToInteger',
      'ScalarMultiply',
      'BitSource',
      'BitsToInteger',
      'ScalarMultiply',
      'ScalarMultiply',
      'ScalarMultiply',
      'PointEquals',
      'BitOutput',
    ]);

    expect(pointOrderCycle?.document.project.modules.map((module) => module.defId)).toEqual([
      'PointSource',
      'PointOrder',
      'IntegerOutput',
      'ScalarMultiply',
      'PointOutput',
    ]);

    expect(contrastingOrders?.document.project.modules.map((module) => module.defId)).toEqual([
      'PointSource',
      'PointOrder',
      'IntegerOutput',
      'PointSource',
      'PointOrder',
      'IntegerOutput',
      'ScalarMultiply',
      'PointOutput',
    ]);
  });

  it('keeps the repeated-key encrypt/decrypt demo honest about paired visible branches', () => {
    const demo = getPipelineMicroDemo('ascii-repeated-key-xor-encrypt-decrypt');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'AsciiSequenceInput',
      'AsciiSequenceInput',
      'RepeatSymbolToMatch',
      'AsciiSequenceToTicked',
      'AsciiSequenceToTicked',
      'AsciiCharToBits',
      'AsciiCharToBits',
      'XOR',
      'TickedBitsToSequence',
      'BitsToHex',
      'HexOutput',
      'HexSequenceInput',
      'BitsSequenceToTicked',
      'XOR',
      'TickedBitsToSequence',
      'BitsToAscii',
      'TextOutput',
      'Clock',
    ]);
  });

  it('keeps the strict encrypt/decrypt demo honest about require-based key scheduling', () => {
    const demo = getPipelineMicroDemo('ascii-strict-match-xor-encrypt-decrypt');
    expect(demo?.document.project.modules.map((module) => module.defId)).toContain(
      'RequireSymbolLengthMatch',
    );
    expect(demo?.document.project.modules.map((module) => module.defId)).not.toContain(
      'RepeatSymbolToMatch',
    );
  });

  it('keeps the hex block and normalize demos honest about byte-stepped hex workflows', () => {
    const hexBlock = getPipelineMicroDemo('hex-block-xor');
    const normalize = getPipelineMicroDemo('hex-normalize-then-xor');

    expect(hexBlock?.document.project.modules.map((module) => module.defId)).toEqual([
      'HexSequenceInput',
      'HexSequenceInput',
      'BitsSequenceToTicked',
      'BitsSequenceToTicked',
      'XOR',
      'TickedBitsToSequence',
      'BitsToHex',
      'HexOutput',
      'Clock',
    ]);

    expect(normalize?.document.project.modules.map((module) => module.defId)).toContain(
      'TruncateBitsToMatch',
    );
    expect(normalize?.document.project.modules.map((module) => module.defId)).toContain(
      'PadBitsToMatch',
    );
  });

  it('seeds the canvas authoring demo with a working XOR path plus visible gesture prompts', () => {
    const demo = getPipelineMicroDemo('canvas-authoring-xor');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'AsciiSequenceInput',
      'AsciiSequenceInput',
      'RepeatSymbolToMatch',
      'AsciiSequenceToTicked',
      'AsciiSequenceToTicked',
      'AsciiCharToBits',
      'AsciiCharToBits',
      'XOR',
      'TickedBitsToSequence',
      'BitsToHex',
      'HexOutput',
      'TextOutput',
      'Clock',
    ]);
    expect(demo?.document.ui.annotations).toHaveLength(4);
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

  it('encrypts and decrypts correctly in the repeated-key ASCII pair demo', () => {
    const demo = getPipelineMicroDemo('ascii-repeated-key-xor-encrypt-decrypt');
    const tickCount = deriveTickCount(demo!.document.project, V1_REGISTRY);
    const result = executeTickedProject(demo!.document.project, V1_REGISTRY, tickCount ?? 0);

    expect(collectTickedOutput(result, 'cipher-out')).toBe('0A110D0A0612');
    expect(collectTickedOutput(result, 'recover-out')).toBe('ATTACK');
  });

  it('encrypts and decrypts correctly in the strict-match ASCII pair demo', () => {
    const demo = getPipelineMicroDemo('ascii-strict-match-xor-encrypt-decrypt');
    const tickCount = deriveTickCount(demo!.document.project, V1_REGISTRY);
    const result = executeTickedProject(demo!.document.project, V1_REGISTRY, tickCount ?? 0);

    expect(collectTickedOutput(result, 'cipher-out')).toBe('031019080911');
    expect(collectTickedOutput(result, 'recover-out')).toBe('SECRET');
  });

  it('keeps the canvas authoring demo executable while producing the same cipher as the base repeated-key XOR flow', () => {
    const demo = getPipelineMicroDemo('canvas-authoring-xor');
    const tickCount = deriveTickCount(demo!.document.project, V1_REGISTRY);
    const result = executeTickedProject(demo!.document.project, V1_REGISTRY, tickCount ?? 0);

    expect(collectTickedOutput(result, 'out')).toBe('0A110D0A0612');
  });
});
