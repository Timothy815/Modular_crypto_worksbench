import { describe, expect, it } from 'vitest';

import { computeAesConsequenceAnalysis } from './aes-consequence-analysis';

function hexToBits(hex: string): number[] {
  return hex
    .split('')
    .flatMap((digit) => Number.parseInt(digit, 16).toString(2).padStart(4, '0').split('').map(Number));
}

function buildState(hex: string) {
  return { type: 'bits' as const, value: hexToBits(hex) };
}

describe('computeAesConsequenceAnalysis', () => {
  it('derives the committed row-perturbation stage facts', () => {
    const analysis = computeAesConsequenceAnalysis({
      stage0Label: 'ShiftRows',
      stage1Label: 'Final output',
      ruleChanged: 'Row 1 ShiftRows rotation changed from 1 byte to 0 bytes.',
      claimBoundary: 'This is a local routing consequence, not a security verdict.',
      canonicalStage0: buildState('D4BF5D30E0B452AEB84111F11E2798E5'),
      perturbedStage0: buildState('D4275D30E0BF52AEB8B411F11E4198E5'),
      canonicalStage1: buildState('A49C7FF2689F352B6B5BEA43026A5049'),
      perturbedStage1: buildState('17B7E76A75893E206FAA1FB6A8A6362F'),
    });

    expect(analysis.firstDivergenceLabel).toBe('ShiftRows');
    expect(analysis.stages[0]).toMatchObject({
      label: 'ShiftRows',
      canonicalHex: 'D4BF5D30E0B452AEB84111F11E2798E5',
      perturbedHex: 'D4275D30E0BF52AEB8B411F11E4198E5',
      changedBytes: 4,
      matches: false,
    });
    expect(analysis.stages[1]).toMatchObject({
      label: 'Final output',
      changedBytes: 16,
      matches: false,
    });
  });

  it('derives the committed column-perturbation stage facts', () => {
    const analysis = computeAesConsequenceAnalysis({
      stage0Label: 'post-MixColumns',
      stage1Label: 'Final output',
      ruleChanged: 'The first MixColumns row changed from 02 03 01 01 to 02 02 01 01.',
      claimBoundary: 'This is a local diffusion consequence, not a security verdict.',
      canonicalStage0: buildState('046681E5E0CB199A48F8D37A2806264C'),
      perturbedStage0: buildState('BB6681E554CB199A09F8D37A0F06264C'),
      canonicalStage1: buildState('A49C7FF2689F352B6B5BEA43026A5049'),
      perturbedStage1: buildState('1B9C7FF2DC9F352B2A5BEA43256A5049'),
    });

    expect(analysis.firstDivergenceLabel).toBe('post-MixColumns');
    expect(analysis.stages[0]?.changedBytes).toBe(4);
    expect(analysis.stages[1]?.changedBytes).toBe(4);
  });

  it('computes counts from live inputs instead of hardcoding seeded values', () => {
    const analysis = computeAesConsequenceAnalysis({
      stage0Label: 'ShiftRows',
      stage1Label: 'Final output',
      ruleChanged: 'Test rule change.',
      claimBoundary: 'Test boundary.',
      canonicalStage0: buildState('00112233445566778899AABBCCDDEEFF'),
      perturbedStage0: buildState('00112233445566778899AABBCCDDEE00'),
      canonicalStage1: buildState('00112233445566778899AABBCCDDEEFF'),
      perturbedStage1: buildState('FF112233445566778899AABBCCDDEE00'),
    });

    expect(analysis.firstDivergenceLabel).toBe('ShiftRows');
    expect(analysis.stages[0]?.changedBytes).toBe(1);
    expect(analysis.stages[1]?.changedBytes).toBe(2);
  });

  it('reports the zero-difference case explicitly', () => {
    const analysis = computeAesConsequenceAnalysis({
      stage0Label: 'ShiftRows',
      stage1Label: 'Final output',
      ruleChanged: 'Test rule change.',
      claimBoundary: 'Test boundary.',
      canonicalStage0: buildState('00112233445566778899AABBCCDDEEFF'),
      perturbedStage0: buildState('00112233445566778899AABBCCDDEEFF'),
      canonicalStage1: buildState('00112233445566778899AABBCCDDEEFF'),
      perturbedStage1: buildState('00112233445566778899AABBCCDDEEFF'),
    });

    expect(analysis.firstDivergenceLabel).toBeNull();
    expect(analysis.hasAnyDifference).toBe(false);
    expect(analysis.stages[0]?.changedBytes).toBe(0);
    expect(analysis.stages[1]?.changedBytes).toBe(0);
  });
});

