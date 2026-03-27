import { describe, expect, it } from 'vitest';

import { getModulesInSelectionBox, normalizeSelectionBoxRect } from './canvas-selection';

describe('normalizeSelectionBoxRect', () => {
  it('normalizes drag coordinates into a bounding box', () => {
    expect(
      normalizeSelectionBoxRect({
        startX: 320,
        startY: 280,
        currentX: 120,
        currentY: 160,
      }),
    ).toEqual({
      left: 120,
      top: 160,
      right: 320,
      bottom: 280,
    });
  });
});

describe('getModulesInSelectionBox', () => {
  it('returns modules whose node rectangles intersect the box in layout order', () => {
    const selected = getModulesInSelectionBox({
      moduleIds: ['c', 'a', 'b'],
      layout: {
        a: { x: 120, y: 120 },
        b: { x: 320, y: 140 },
        c: { x: 640, y: 180 },
      },
      box: {
        left: 100,
        top: 100,
        right: 500,
        bottom: 320,
      },
    });

    expect(selected).toEqual(['a', 'b']);
  });

  it('returns an empty selection when no nodes intersect the box', () => {
    expect(
      getModulesInSelectionBox({
        moduleIds: ['a'],
        layout: {
          a: { x: 640, y: 480 },
        },
        box: {
          left: 0,
          top: 0,
          right: 120,
          bottom: 120,
        },
      }),
    ).toEqual([]);
  });
});
