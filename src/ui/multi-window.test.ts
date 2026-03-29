import { describe, expect, it } from 'vitest';

import {
  clampDetachedSplitRatio,
  createDetachedPanelGroup,
  formatDetachedPanelDocumentTitle,
  formatDetachedPanelGroupLabel,
  formatDetachedPanelWindowLabel,
  getDetachedPanelGroupByKind,
  moveDetachedPanelKindEarlier,
  moveDetachedPanelKindLater,
  moveDetachedPanelKindToGroup,
  removeDetachedPanelKind,
  setDetachedPanelGroupSplitRatio,
  setDetachedPanelGroupSplitSide,
  setDetachedPanelGroupPresentationMode,
  setDetachedPanelGroupActiveKind,
  swapDetachedPanelGroupSplitSides,
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
        splitLeftKind: 'palette',
        splitRightKind: 'palette',
        splitRatio: 0.5,
      },
    ]);
  });

  it('moves a detached surface into an existing window as the active tab', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette'],
        activeKind: 'palette',
        presentationMode: 'tabs',
        splitLeftKind: 'palette',
        splitRightKind: 'palette',
        splitRatio: 0.5,
      },
      {
        panelWindowId: 'window-b',
        tabs: ['inspector'],
        activeKind: 'inspector',
        presentationMode: 'combined',
        splitLeftKind: 'inspector',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
    ];

    const moved = moveDetachedPanelKindToGroup(groups, 'palette', 'window-b');

    expect(moved).toEqual([
      {
        panelWindowId: 'window-b',
        tabs: ['inspector', 'palette'],
        activeKind: 'palette',
        presentationMode: 'combined',
        splitLeftKind: 'inspector',
        splitRightKind: 'palette',
        splitRatio: 0.5,
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
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
    ];

    const nextGroups = removeDetachedPanelKind(groups, 'inspector');

    expect(nextGroups).toEqual([
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'learning'],
        activeKind: 'learning',
        presentationMode: 'tabs',
        splitLeftKind: 'palette',
        splitRightKind: 'learning',
        splitRatio: 0.5,
      },
    ]);
  });

  it('updates the active tab only within the targeted detached window', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector'],
        activeKind: 'palette',
        presentationMode: 'tabs',
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
      {
        panelWindowId: 'window-b',
        tabs: ['learning'],
        activeKind: 'learning',
        presentationMode: 'tabs',
        splitLeftKind: 'learning',
        splitRightKind: 'learning',
        splitRatio: 0.5,
      },
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
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      }),
    ).toBe('Tools + Inspector + Learning');
  });

  it('formats detached window labels with stable ordinals for the windows menu', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector'],
        activeKind: 'palette',
        presentationMode: 'tabs',
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
      {
        panelWindowId: 'window-b',
        tabs: ['learning'],
        activeKind: 'learning',
        presentationMode: 'combined',
        splitLeftKind: 'learning',
        splitRightKind: 'learning',
        splitRatio: 0.5,
      },
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
    expect(
      formatDetachedPanelDocumentTitle(
        ['palette', 'inspector', 'learning'],
        'inspector',
        'split',
        'palette',
        'inspector',
      ),
    ).toBe('Split (Tools + Inspector) — MCW');
  });

  it('can switch a detached group into combined mode and preserve its pane order', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector'],
        activeKind: 'palette',
        presentationMode: 'tabs',
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
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
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
    ];

    const movedEarlier = moveDetachedPanelKindEarlier(groups, 'window-a', 'learning');
    expect(movedEarlier[0]?.tabs).toEqual(['palette', 'learning', 'inspector']);

    const movedLater = moveDetachedPanelKindLater(movedEarlier, 'window-a', 'palette');
    expect(movedLater[0]?.tabs).toEqual(['learning', 'palette', 'inspector']);
  });

  it('can switch a detached group into split mode and seed a visible pair', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector', 'learning'],
        activeKind: 'palette',
        presentationMode: 'tabs',
        splitLeftKind: 'palette',
        splitRightKind: 'palette',
        splitRatio: 0.5,
      },
    ];

    expect(setDetachedPanelGroupPresentationMode(groups, 'window-a', 'split')).toEqual([
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector', 'learning'],
        activeKind: 'palette',
        presentationMode: 'split',
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
    ]);
  });

  it('can assign and swap the split pair while preserving a bounded ratio', () => {
    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector', 'learning'],
        activeKind: 'palette',
        presentationMode: 'split',
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
    ];

    const reassigned = setDetachedPanelGroupSplitSide(groups, 'window-a', 'right', 'learning');
    expect(reassigned[0]).toMatchObject({
      splitLeftKind: 'palette',
      splitRightKind: 'learning',
      activeKind: 'learning',
    });

    const swapped = swapDetachedPanelGroupSplitSides(reassigned, 'window-a');
    expect(swapped[0]).toMatchObject({
      splitLeftKind: 'learning',
      splitRightKind: 'palette',
    });
  });

  it('can clamp split ratios to bounded values', () => {
    expect(clampDetachedSplitRatio(0.1)).toBe(0.3);
    expect(clampDetachedSplitRatio(0.9)).toBe(0.7);
    expect(clampDetachedSplitRatio(0.55)).toBe(0.55);

    const groups: DetachedPanelWindowGroup[] = [
      {
        panelWindowId: 'window-a',
        tabs: ['palette', 'inspector'],
        activeKind: 'palette',
        presentationMode: 'split',
        splitLeftKind: 'palette',
        splitRightKind: 'inspector',
        splitRatio: 0.5,
      },
    ];

    expect(setDetachedPanelGroupSplitRatio(groups, 'window-a', 0.9)[0]?.splitRatio).toBe(0.7);
  });
});
