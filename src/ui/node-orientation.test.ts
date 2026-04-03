import { describe, expect, it } from 'vitest';

import {
  getDefaultNodeOrientation,
  getNextNodeOrientationClockwise,
  getNodeOrientation,
  getPortSideForOrientation,
} from './node-orientation';

describe('node orientation helpers', () => {
  it('maps workspace direction to default node orientation', () => {
    expect(getDefaultNodeOrientation('horizontal')).toBe('east');
    expect(getDefaultNodeOrientation('vertical')).toBe('south');
  });

  it('falls back to workspace direction when no explicit node orientation is set', () => {
    expect(getNodeOrientation(undefined, 'horizontal')).toBe('east');
    expect(getNodeOrientation(undefined, 'vertical')).toBe('south');
  });

  it('rotates clockwise through all cardinal orientations', () => {
    expect(getNextNodeOrientationClockwise('east')).toBe('south');
    expect(getNextNodeOrientationClockwise('south')).toBe('west');
    expect(getNextNodeOrientationClockwise('west')).toBe('north');
    expect(getNextNodeOrientationClockwise('north')).toBe('east');
  });

  it('keeps inputs and outputs on opposing sides', () => {
    expect(getPortSideForOrientation('east', 'in')).toBe('left');
    expect(getPortSideForOrientation('east', 'out')).toBe('right');
    expect(getPortSideForOrientation('south', 'in')).toBe('top');
    expect(getPortSideForOrientation('south', 'out')).toBe('bottom');
    expect(getPortSideForOrientation('west', 'in')).toBe('right');
    expect(getPortSideForOrientation('west', 'out')).toBe('left');
    expect(getPortSideForOrientation('north', 'in')).toBe('bottom');
    expect(getPortSideForOrientation('north', 'out')).toBe('top');
  });
});
