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

export function isEditableShortcutTarget(target: EventTarget | null) {
  const maybeElement = target as ShortcutTargetShape | null;
  const tagName = maybeElement?.tagName?.toUpperCase();
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  return maybeElement?.isContentEditable === true;
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
