import { describe, expect, it } from 'vitest';

import { isEditableShortcutTarget, isInteractiveShortcutTarget, matchesShortcutCombo } from './keyboard-shortcuts';

describe('isEditableShortcutTarget', () => {
  it('returns true for form controls and content-editable elements', () => {
    const input = { tagName: 'input' } as unknown as EventTarget;
    const textarea = { tagName: 'textarea' } as unknown as EventTarget;
    const select = { tagName: 'select' } as unknown as EventTarget;
    const editable = { tagName: 'div', isContentEditable: true } as unknown as EventTarget;

    expect(isEditableShortcutTarget(input)).toBe(true);
    expect(isEditableShortcutTarget(textarea)).toBe(true);
    expect(isEditableShortcutTarget(select)).toBe(true);
    expect(isEditableShortcutTarget(editable)).toBe(true);
  });

  it('returns false for ordinary non-editable elements', () => {
    const div = { tagName: 'div' } as unknown as EventTarget;
    expect(isEditableShortcutTarget(div)).toBe(false);
    expect(isEditableShortcutTarget(null)).toBe(false);
  });
});

describe('matchesShortcutCombo', () => {
  it('matches meta/ctrl, shift, and alt requirements exactly', () => {
    const duplicateEvent = { key: 'd', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
    expect(matchesShortcutCombo(duplicateEvent, { key: 'd', metaOrCtrl: true })).toBe(true);
    expect(matchesShortcutCombo(duplicateEvent, { key: 'd', metaOrCtrl: true, shift: true })).toBe(
      false,
    );

    const redoEvent = { key: 'z', ctrlKey: false, metaKey: true, shiftKey: true, altKey: false } as KeyboardEvent;
    expect(matchesShortcutCombo(redoEvent, { key: 'z', metaOrCtrl: true, shift: true })).toBe(true);
    expect(matchesShortcutCombo(redoEvent, { key: 'z', metaOrCtrl: true })).toBe(false);

    const saveWorkspaceEvent = { key: 's', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
    expect(matchesShortcutCombo(saveWorkspaceEvent, { key: 's', metaOrCtrl: true })).toBe(true);
    expect(matchesShortcutCombo(saveWorkspaceEvent, { key: 's', metaOrCtrl: true, shift: true })).toBe(false);

    const saveVersionEvent = { key: 's', ctrlKey: false, metaKey: true, shiftKey: true, altKey: false } as KeyboardEvent;
    expect(matchesShortcutCombo(saveVersionEvent, { key: 's', metaOrCtrl: true, shift: true })).toBe(true);
    expect(matchesShortcutCombo(saveVersionEvent, { key: 's', metaOrCtrl: true })).toBe(false);

    const createCompositeEvent = { key: 'g', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
    expect(matchesShortcutCombo(createCompositeEvent, { key: 'g', metaOrCtrl: true })).toBe(true);

    const unzipCompositeEvent = { key: 'u', ctrlKey: false, metaKey: true, shiftKey: true, altKey: false } as KeyboardEvent;
    expect(matchesShortcutCombo(unzipCompositeEvent, { key: 'u', metaOrCtrl: true, shift: true })).toBe(true);
    expect(matchesShortcutCombo(unzipCompositeEvent, { key: 'u', metaOrCtrl: true })).toBe(false);
  });

  it('matches plain keys only when no modifiers are present', () => {
    const deleteEvent = { key: 'Delete', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
    expect(matchesShortcutCombo(deleteEvent, { key: 'Delete' })).toBe(true);

    const modifiedDeleteEvent = { key: 'Delete', ctrlKey: false, metaKey: false, shiftKey: false, altKey: true } as KeyboardEvent;
    expect(matchesShortcutCombo(modifiedDeleteEvent, { key: 'Delete' })).toBe(false);
  });
});

describe('isInteractiveShortcutTarget', () => {
  it('returns true for controls that should keep Enter semantics local', () => {
    const button = { tagName: 'button' } as unknown as EventTarget;
    const link = { tagName: 'a' } as unknown as EventTarget;
    const summary = { tagName: 'summary' } as unknown as EventTarget;

    expect(isInteractiveShortcutTarget(button)).toBe(true);
    expect(isInteractiveShortcutTarget(link)).toBe(true);
    expect(isInteractiveShortcutTarget(summary)).toBe(true);
  });

  it('returns false for ordinary canvas or inspector containers', () => {
    const div = { tagName: 'div' } as unknown as EventTarget;
    expect(isInteractiveShortcutTarget(div)).toBe(false);
    expect(isInteractiveShortcutTarget(null)).toBe(false);
  });
});
