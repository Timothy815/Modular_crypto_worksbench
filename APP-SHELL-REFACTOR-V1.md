# APP-SHELL-REFACTOR-V1

Last updated: March 28, 2026

---

## Purpose

Record the first bounded App-shell refactor slice after the inspector and workbench refactors.

This slice reduces orchestration weight in `src/App.tsx` without changing product behavior.

---

## Shipped Scope

The shipped cut is intentionally narrow:
- extract the main tutorial/challenge rendering surface into a dedicated `LearningDock` component
- extract duplicated challenge-capture draft setup into a pure helper module
- preserve all existing behavior, actions, and state ownership in `App.tsx`

---

## Shipped Files

- `src/ui/components/learning-dock.tsx`
- `src/ui/challenge-capture.ts`

---

## Non-Goals

- no reducer/store redesign
- no panel behavior redesign
- no challenge or tutorial data model changes
- no extraction of all App-shell responsibilities at once

---

## Exit Condition

This contract is complete when:
- the learning-surface render block is no longer inline in `App.tsx`
- challenge-capture draft defaults are no longer duplicated in multiple locations
- behavior remains unchanged and validation stays green
