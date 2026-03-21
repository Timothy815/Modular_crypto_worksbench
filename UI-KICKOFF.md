# MCW — UI Kickoff

Branch: `feature/minimal-ui-shell`
Checkpoint:
- `67558b3` — Start minimal UI shell
- `4522196` — Add param-driven UI inspector
- working tree now includes reducer-backed UI state and draft-aware param editing

This document records the first UI-phase decisions so work can pass cleanly between Codex and Claude.

---

## Scope of This Branch

This branch starts the transition from engine-only work to a minimal interactive UI shell.

The goal is not to build the final node editor yet.

The goal is to establish:
- a real `src/ui/` boundary
- a visible workbench layout
- engine-backed demo execution inside the browser
- a clear handoff point for later editor work

---

## What This UI Slice Should Prove

The first UI slice should prove that the engine can be surfaced coherently in a browser without inventing the full graph editor.

Success means:
- users can see the available V1 primitives
- users can inspect a sample graph
- users can run or view a real engine execution result
- the UI remains clearly separate from `src/engine/`

---

## Files Introduced in This Slice

Expected new UI-owned surfaces:
- `src/ui/demo-projects.ts`
- `src/ui/` support files as needed
- updates to `src/App.tsx`
- updates to `src/App.css`

These files are safe for Claude to continue from later.

---

## Boundaries

- `src/engine/` remains architect-owned and should not be reshaped for convenience.
- UI files may import from `src/engine/`.
- Engine files must not import from `src/ui/`.
- This branch should avoid React Flow or drag-and-drop until the shell and data model feel stable.

---

## Recommended Next Steps For Claude

Once back online, Claude should be able to continue from this branch by taking one of these bounded tasks:

1. Replace the current graph strip with a more editor-like canvas layout while preserving the current selection model.
2. Improve parameter editing UX for `bits` and `wiring` fields with more structured controls.
3. Add a dedicated selected-module summary card or inline port visualization.
4. Introduce `src/ui/components/` substructure for canvas-only concerns if the workbench view grows further.

---

## Current Implemented State

The branch now contains:
- a `src/ui/` boundary
- demo project definitions in `src/ui/demo-projects.ts`
- reducer-backed UI state in `src/ui/store.ts`
- component extraction for:
  - primitive palette
  - workbench panel
  - parameter inspector
- selected module state
- param-driven editing based on `def.paramSchema`
- draft-aware param parsing and field-level error feedback
- live re-execution through local UI state

This means the branch has already validated the key UI-side promise of `paramSchema`: the engine metadata can drive browser controls.

---

## Non-Goals For This Slice

- freeform node placement
- wire drawing
- drag-and-drop
- persistence UI
- composite editing
- runtime stepping UI

Those belong to later branches.
