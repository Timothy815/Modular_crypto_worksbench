import { describe, expect, it } from 'vitest';

import {
  getClampedMinimapViewportRect,
  getElasticWorkspaceWorldBounds,
} from './workspace-bounds';

describe('workspace-bounds', () => {
  it('adds elastic world slack without changing authored bounds inputs', () => {
    expect(
      getElasticWorkspaceWorldBounds({
        authoredWidth: 980,
        authoredHeight: 360,
        viewportWidth: 1200,
        viewportHeight: 800,
      }),
    ).toEqual({
      width: 1880,
      height: 1360,
    });
  });

  it('clamps the minimap viewport rectangle to authored content rather than elastic slack', () => {
    expect(
      getClampedMinimapViewportRect({
        authoredWidth: 1000,
        authoredHeight: 800,
        scale: 0.1,
        offsetX: 10,
        offsetY: 6,
        scrollLeft: 1400,
        scrollTop: 1200,
        clientWidth: 400,
        clientHeight: 300,
        zoom: 1,
      }),
    ).toEqual({
      left: 70,
      top: 56,
      width: 40,
      height: 30,
    });
  });
});
