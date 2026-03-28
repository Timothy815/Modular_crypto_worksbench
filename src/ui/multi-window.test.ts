import { describe, expect, it } from 'vitest';

import {
  createDetachedPanelGroup,
  formatDetachedPanelGroupLabel,
  getDetachedPanelGroupByKind,
  moveDetachedPanelKindToGroup,
  removeDetachedPanelKind,
  setDetachedPanelGroupActiveKind,
  type DetachedPanelWindowGroup,
} from './multi-window';

describe('multi-window helpers', () => {
  it('creates a detached window group for a newly detached surface', () => {
    const groups = createDetachedPanelGroup([], 'window-a', 'palette');

    expect(groups).toEqual([
      {
        panelWindowId: 'window-a',
        tabs: ['palette'],
        activeKind: 'palette',
      },
    ]);
  });

  it('moves a detached surface into an existing window as the active tab', () => {
    const groups: DetachedPanelWindowGroup[] = [
      { panelWindowId: 'window-a', tabs: ['palette'], activeKind: 'palette' },
      { panelWindowId: 'window-b', tabs: ['inspector'], activeKind: 'inspector' },
    ];

    const moved = moveDetachedPanelKindToGroup(groups, 'palette', 'window-b');

    expect(moved).toEqual([
      {
        panelWindowId: 'window-b',
        tabs: ['inspector', 'palette'],
        activeKind: 'palette',
      },
    ]);
  });

  it('retains the remaining tab as active when the current active tab returns to main', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector', 'learning'],
        activeKind: 'inspector',
      },
    ];

    const nextGroups = removeDetachedPanelKind(groups, 'inspector');

    expect(nextGroups).toEqual([
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'learning'],
        activeKind: 'learning',
      },
    ]);
  });

  it('updates the active tab only within the targeted detached window', () => {
    const groups: DetachedPanelWindowGroup[] = [
      { panelWindowId: 'window-a', tabs: ['palette', 'inspector'], activeKind: 'palette' },
      { panelWindowId: 'window-b', tabs: ['learning'], activeKind: 'learning' },
    ];

    const nextGroups = setDetachedPanelGroupActiveKind(groups, 'window-a', 'inspector');

    expect(getDetachedPanelGroupByKind(nextGroups, 'inspector')?.activeKind).toBe('inspector');
    expect(getDetachedPanelGroupByKind(nextGroups, 'learning')?.activeKind).toBe('learning');
  });

  it('formats detached window labels from their tab composition', () => {
    expect(
      formatDetachedPanelGroupLabel({
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector', 'learning'],
        activeKind: 'palette',
      }),
    ).toBe('Tools + Inspector + Learning');
  });
});
