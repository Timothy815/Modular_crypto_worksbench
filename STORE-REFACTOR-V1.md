# STORE-REFACTOR-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Reduce future drag in `src/ui/store.ts` without changing reducer behavior.

This slice is a bounded maintenance pass, not a state-model redesign.

---

## Required Boundary

This slice must:
- preserve reducer behavior
- preserve workspace history and versioning semantics
- extract pure workspace state/history helpers into a dedicated module
- reduce the amount of snapshot/versioning logic carried inline inside `store.ts`

This slice must not:
- redesign the reducer action model
- change workspace history depth or restore semantics
- change version-document structure
- move unrelated project-editing behavior out of `store.ts`

---

## Implementation Shape

V1 should extract:
- layout/annotation clone helpers used by workspace history/versioning
- workspace snapshot construction / application helpers
- undo / redo / save-version / restore-version helper flows

Expected extracted surface:
- `src/ui/workspace-state-support.ts`

`store.ts` should remain the orchestration surface for:
- overall reducer branching
- project-editing actions
- composite-editor actions
- selection/layout behavior outside workspace-history/versioning

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- workspace history/versioning helpers now live in `workspace-state-support.ts`
- `store.ts` now delegates undo/redo/version operations to that pure helper module
- reducer behavior remains unchanged under existing store tests

---

## Why This Slice

After the inspector, workbench, and App-shell refactors, `store.ts` was the next clear structural anchor.

This cut is intentionally conservative:
- no state redesign
- no reducer semantics change
- real reduction in inline history/versioning burden

It keeps future builder-power, export, and multi-window work from turning the reducer into the next drag coefficient.
