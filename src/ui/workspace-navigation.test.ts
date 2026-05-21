import { describe, expect, it } from 'vitest';

import {
  MAX_WORKSPACE_SAVED_VIEW_REGIONS,
  appendWorkspaceSavedViewRegion,
  computeViewportForRect,
} from './workspace-navigation';

describe('workspace-navigation', () => {
  it('computes a centered fit viewport for a bounded world rect', () => {
    expect(
      computeViewportForRect({
        rect: { left: 100, top: 80, right: 500, bottom: 280 },
        viewportWidth: 800,
        viewportHeight: 600,
        maxZoom: 1.6,
      }),
    ).toEqual({
      zoom: 1.6,
      scrollLeft: 80,
      scrollTop: 0,
    });
  });

  it('caps saved regions at the explicit workspace limit', () => {
    const regions = Array.from({ length: MAX_WORKSPACE_SAVED_VIEW_REGIONS }, (_, index) => ({
      id: `view-${index + 1}`,
      name: `View ${index + 1}`,
      scrollLeft: index * 10,
      scrollTop: index * 5,
      zoom: 1,
    }));

    const nextRegions = appendWorkspaceSavedViewRegion(regions, {
      id: 'view-999',
      name: 'Overflow',
      scrollLeft: 0,
      scrollTop: 0,
      zoom: 1,
    });

    expect(nextRegions).toBe(regions);
    expect(nextRegions).toHaveLength(MAX_WORKSPACE_SAVED_VIEW_REGIONS);
  });
});
