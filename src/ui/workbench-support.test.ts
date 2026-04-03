import { describe, expect, it } from 'vitest';

import { getOrthogonalPath, getOrthogonalPendingPath } from './workbench-support';

describe('workbench-support orthogonal routing', () => {
  it('starts with a fixed step-back from the source anchor', () => {
    const path = getOrthogonalPath(
      { x: 100, y: 100 },
      'right',
      { x: 260, y: 180 },
      'left',
      0,
      0,
    );

    expect(path).toContain('L 120 100');
    expect(path).toContain('Q');
    expect(path).toContain('L 240 180');
  });

  it('keeps pending orthogonal paths axis-aligned with rounded elbows', () => {
    const path = getOrthogonalPendingPath(
      { x: 100, y: 100 },
      'bottom',
      { x: 180, y: 220 },
    );

    expect(path).toContain('M 100 100');
    expect(path).toContain('L 100 120');
    expect(path).toContain('Q 100 170');
    expect(path).toContain('L 180 220');
  });
});
