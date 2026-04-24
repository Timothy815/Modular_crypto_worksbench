import { describe, expect, it } from 'vitest';

import {
  clampWorkspaceZoom,
  DEFAULT_WORKSPACE_ZOOM,
  getCanvasViewportPoint,
  getFitWorkspaceZoom,
  getModuleFocusScrollPosition,
  getNextWorkspaceZoom,
  MAX_WORKSPACE_ZOOM,
  MIN_WORKSPACE_ZOOM,
} from './workspace-viewport';

describe('workspace-viewport', () => {
  it('clamps zoom into the bounded workspace range', () => {
    expect(clampWorkspaceZoom(0.1)).toBe(MIN_WORKSPACE_ZOOM);
    expect(clampWorkspaceZoom(2.2)).toBe(MAX_WORKSPACE_ZOOM);
    expect(clampWorkspaceZoom(1.13)).toBe(1.13);
  });

  it('steps zoom in and out predictably', () => {
    expect(getNextWorkspaceZoom(DEFAULT_WORKSPACE_ZOOM, 'in')).toBe(1.2);
    expect(getNextWorkspaceZoom(DEFAULT_WORKSPACE_ZOOM, 'out')).toBe(0.8);
  });

  it('maps client coordinates back into base canvas coordinates under zoom', () => {
    expect(
      getCanvasViewportPoint({
        clientX: 300,
        clientY: 220,
        canvasLeft: 100,
        canvasTop: 20,
        scrollLeft: 120,
        scrollTop: 80,
        zoom: 1.5,
      }),
    ).toEqual({
      x: (300 - 100 + 120) / 1.5,
      y: (220 - 20 + 80) / 1.5,
    });
  });

  it('computes a centered scroll target for module focus jumps', () => {
    const position = getModuleFocusScrollPosition({
      moduleX: 520,
      moduleY: 240,
      viewportWidth: 800,
      viewportHeight: 500,
      zoom: 1.2,
      nodeWidth: 132,
      nodeHeight: 112,
    });

    expect(position.left).toBeCloseTo(303.2, 5);
    expect(position.top).toBeCloseTo(105.2, 5);
  });

  it('derives a fit zoom that never exceeds the default workspace scale', () => {
    expect(
      getFitWorkspaceZoom({
        viewportWidth: 900,
        viewportHeight: 600,
        canvasWidth: 1600,
        canvasHeight: 900,
      }),
    ).toBe(0.52);

    expect(
      getFitWorkspaceZoom({
        viewportWidth: 2200,
        viewportHeight: 1400,
        canvasWidth: 600,
        canvasHeight: 420,
      }),
    ).toBe(DEFAULT_WORKSPACE_ZOOM);
  });
});
