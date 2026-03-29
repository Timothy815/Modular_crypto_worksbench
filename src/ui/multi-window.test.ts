import { describe, expect, it } from 'vitest';

import {
  createDetachedPanelGroup,
  formatDetachedPanelDocumentTitle,
  formatDetachedPanelGroupLabel,
  formatDetachedPanelWindowLabel,
  getDetachedPanelGroupByKind,
  moveDetachedPanelKindEarlier,
  moveDetachedPanelKindLater,
  moveDetachedPanelKindToGroup,
  removeDetachedPanelKind,
  setDetachedPanelGroupPresentationMode,
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
        presentationMode: 'tabs',
      },
    ]);
  });

  it('moves a detached surface into an existing window as the active tab', () => {
    const groups: DetachedPanelWindowGroup[] = [
      { panelWindowId: 'window-a', tabs: ['palette'], activeKind: 'palette', presentationMode: 'tabs' },
      { panelWindowId: 'window-b', tabs: ['inspector'], activeKind: 'inspector', presentationMode: 'combined' },
    ];

    const moved = moveDetachedPanelKindToGroup(groups, 'palette', 'window-b');

    expect(moved).toEqual([
      {
        panelWindowId: 'window-b',
        tabs: ['inspector', 'palette'],
        activeKind: 'palette',
        presentationMode: 'combined',
      },
    ]);
  });

  it('retains the remaining tab as active when the current active tab returns to main', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector', 'learning'],
        activeKind: 'inspector',
        presentationMode: 'tabs',
      },
    ];

    const nextGroups = removeDetachedPanelKind(groups, 'inspector');

    expect(nextGroups).toEqual([
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'learning'],
        activeKind: 'learning',
        presentationMode: 'tabs',
      },
    ]);
  });

  it('updates the active tab only within the targeted detached window', () => {
    const groups: DetachedPanelWindowGroup[] = [
      { panelWindowId: 'window-a', tabs: ['palette', 'inspector'], activeKind: 'palette', presentationMode: 'tabs' },
      { panelWindowId: 'window-b', tabs: ['learning'], activeKind: 'learning', presentationMode: 'tabs' },
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
        presentationMode: 'tabs',
      }),
    ).toBe('Tools + Inspector + Learning');
  });

  it('formats detached window labels with stable ordinals for the windows menu', () => {
    const groups: DetachedPanelWindowGroup[] = [
      { panelWindowId: 'window-a', tabs: ['palette', 'inspector'], activeKind: 'palette', presentationMode: 'tabs' },
      { panelWindowId: 'window-b', tabs: ['learning'], activeKind: 'learning', presentationMode: 'combined' },
    ];

    expect(formatDetachedPanelWindowLabel(groups, groups[0])).toBe(
      'Window 1 (Tools + Inspector)',
    );
    expect(formatDetachedPanelWindowLabel(groups, groups[1])).toBe(
      'Window 2 (Learning)',
    );
  });

  it('formats detached browser titles from the active tab and grouped context', () => {
    expect(formatDetachedPanelDocumentTitle(['palette'], 'palette', 'tabs')).toBe('Tools — MCW');
    expect(formatDetachedPanelDocumentTitle(['palette', 'inspector'], 'inspector', 'tabs')).toBe(
      'Inspector — Tools + Inspector — MCW',
    );
    expect(
      formatDetachedPanelDocumentTitle(['palette', 'inspector'], 'inspector', 'combined'),
    ).toBe('Combined (Tools + Inspector) — MCW');
  });

  it('can switch a detached group into combined mode and preserve its pane order', () => {
    const groups: DetachedPanelWindowGroup[] = [
      { panelWindowId: 'window-a', tabs: ['palette', 'inspector'], activeKind: 'palette', presentationMode: 'tabs' },
    ];

    expect(
      setDetachedPanelGroupPresentationMode(groups, 'window-a', 'combined')[0]?.presentationMode,
    ).toBe('combined');
  });

  it('can move panes earlier and later within a combined detached stack', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector', 'learning'],
        activeKind: 'inspector',
        presentationMode: 'combined',
      },
    ];

    const movedEarlier = moveDetachedPanelKindEarlier(groups, 'window-a', 'learning');
    expect(movedEarlier[0]?.tabs).toEqual(['palette', 'learning', 'inspector']);

    const movedLater = moveDetachedPanelKindLater(movedEarlier, 'window-a', 'palette');
    expect(movedLater[0]?.tabs).toEqual(['learning', 'palette', 'inspector']);
  });
});
