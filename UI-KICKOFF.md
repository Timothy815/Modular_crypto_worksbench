# MCW — UI Kickoff

Branch: `feature/minimal-ui-shell`

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

1. Replace static graph presentation with a more editor-like canvas layout.
2. Add parameter editing controls for the selected module instance.
3. Add a second demo graph and graph switching controls.
4. Begin extracting the shell into `src/ui/components/`.

---

## Non-Goals For This Slice

- freeform node placement
- wire drawing
- drag-and-drop
- persistence UI
- composite editing
- runtime stepping UI

Those belong to later branches.
