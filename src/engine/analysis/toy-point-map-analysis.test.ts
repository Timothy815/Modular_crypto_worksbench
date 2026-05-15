import { describe, expect, it } from 'vitest';

import { computeToyPointMapAnalysis } from './toy-point-map-analysis';

describe('computeToyPointMapAnalysis', () => {
  it('derives the known affine point set for y^2 = x^3 + 2x + 3 (mod 17)', () => {
    const analysis = computeToyPointMapAnalysis({
      p: 17,
      a: 2,
      b: 3,
      selectedX: 5,
      selectedY: 6,
      walkLength: 5,
    });

    expect(analysis.fieldSize).toBe(17);
    expect(analysis.totalAffinePoints).toBe(21);
    expect(analysis.validPoints.map((point) => point.label)).toEqual([
      '(2, 7)',
      '(2, 10)',
      '(3, 6)',
      '(3, 11)',
      '(5, 6)',
      '(5, 11)',
      '(8, 2)',
      '(8, 15)',
      '(9, 6)',
      '(9, 11)',
      '(11, 8)',
      '(11, 9)',
      '(12, 2)',
      '(12, 15)',
      '(13, 4)',
      '(13, 13)',
      '(14, 2)',
      '(14, 15)',
      '(15, 5)',
      '(15, 12)',
      '(16, 0)',
    ]);
  });

  it('marks the selected point and bounded repeated-action walk', () => {
    const analysis = computeToyPointMapAnalysis({
      p: 17,
      a: 2,
      b: 3,
      selectedX: 5,
      selectedY: 6,
      walkLength: 5,
    });

    expect(analysis.selectedPointText).toBe('(5, 6)');
    expect(analysis.walkEntries.map((entry) => `${entry.label}:${entry.pointText}`)).toEqual([
      'P:(5, 6)',
      '2P:(15, 12)',
      '3P:(13, 13)',
      '4P:(8, 2)',
      '5P:(2, 7)',
    ]);

    expect(analysis.validPoints.find((point) => point.label === '(5, 6)')?.isSelected).toBe(true);
    expect(analysis.validPoints.find((point) => point.label === '(13, 13)')?.walkLabels).toEqual(['3P']);
  });

  it('rejects out-of-bounds walk length', () => {
    expect(() =>
      computeToyPointMapAnalysis({
        p: 17,
        a: 2,
        b: 3,
        selectedX: 5,
        selectedY: 6,
        walkLength: 9,
      }),
    ).toThrow(/walkLength/i);
  });
});
