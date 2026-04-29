export interface ShortcutCombo {
  key: string;
  metaOrCtrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

interface ShortcutTargetShape {
  tagName?: string;
  isContentEditable?: boolean;
}

function getShortcutTargetTagName(target: EventTarget | null) {
  return (target as ShortcutTargetShape | null)?.tagName?.toUpperCase() ?? null;
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  const maybeElement = target as ShortcutTargetShape | null;
  const tagName = getShortcutTargetTagName(target);
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  return maybeElement?.isContentEditable === true;
}

export function isInteractiveShortcutTarget(target: EventTarget | null) {
  const tagName = getShortcutTargetTagName(target);
  return tagName === 'BUTTON' || tagName === 'A' || tagName === 'SUMMARY';
}

export function matchesShortcutCombo(event: KeyboardEvent, combo: ShortcutCombo) {
  const normalizedKey = event.key.toLowerCase();
  if (normalizedKey !== combo.key.toLowerCase()) {
    return false;
  }

  if (Boolean(combo.metaOrCtrl) !== Boolean(event.metaKey || event.ctrlKey)) {
    return false;
  }
  if (Boolean(combo.shift) !== Boolean(event.shiftKey)) {
    return false;
  }
  if (Boolean(combo.alt) !== Boolean(event.altKey)) {
    return false;
  }

  return true;
}
