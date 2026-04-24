# CARD-HOVER-DUPLICATE-V1

Status: Proposed

Owner: Codex

Date: 2026-04-23

---

## 1. Purpose

Reduce the friction of duplicating a module in the workbench by exposing a direct hover affordance on the card instead of forcing the author through the card menu for a common action.

---

## 2. Why Now

Recent authoring feedback on larger hand-built systems found that duplication is common enough to feel awkward when buried in the overflow/menu path.

The user does not need a new duplication model.
The user needs a faster way to trigger the existing one.

---

## 3. Problem

Today, single-module duplication is available in behavior but not in the card’s immediate interaction surface.

That creates avoidable friction during:

- round construction
- lane replication
- repeated pattern authoring
- rapid toy-cipher iteration

This slows down exactly the kind of machine-building MCW is trying to encourage.

---

## 4. Product Goal

Duplicating a module should feel like a normal card-level action, similar in immediacy to other direct canvas actions.

The affordance should be:

- fast
- explicit
- hard to misinterpret
- visually quiet until needed

---

## 5. Required V1 Shape

1. A hovered module card must expose a visible duplicate affordance without opening the card menu.
2. The affordance must call the existing single-module duplication behavior rather than introducing a separate duplication implementation.
3. The affordance must feel local to the card, not like a global toolbar action.
4. The affordance must not interfere with dragging, inline editing, or port authoring.
5. The existing duplicate option in the menu may remain; this slice adds a shortcut rather than replacing the old path.
6. The affordance must stay hidden in observation-only contexts or any context where module mutation is not allowed.

---

## 6. Bounded Scope

Primary surfaces:

- `src/ui/components/workbench-panel.tsx`
- `src/App.css`

Supporting surface:

- `src/App.tsx` only as needed to pass through the existing duplicate handler cleanly

---

## 7. Non-Goals

This slice should not:

- change cluster duplication behavior
- add keyboard shortcut design
- redesign the card menu
- introduce drag-to-duplicate or modifier-key cloning
- add duplicate affordances for workspace furniture in the same pass

---

## 8. Acceptance

This slice is successful when:

- a hovered card exposes an obvious duplicate action
- clicking it duplicates that module using the current offset/selection behavior
- the card still feels uncluttered when not hovered
- no drag or selection regressions are introduced
