# MCW — UI Kickoff

Branch: `feature/minimal-ui-shell`
Checkpoint:
- `67558b3` — Start minimal UI shell
- `4522196` — Add param-driven UI inspector
- `5190719` — Refactor UI state into reducer
- `48c6c78` — Add visual workbench canvas
- `d3c8a22` — Add node movement and panel controls
- `a48c498` — Improve node dragging and anchors
- `6252d12` — Add module creation and deletion
- `5f1f538` — Tighten connection validation and highlighting
- `e37575e` — Add structured bits and wiring editors
- `baec33d` — Add workbench persistence and JSON import export
- `4ebfa9b` — Add sticky-note annotations

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

## Recommended Next Steps

Editor fundamentals and persistence groundwork are now complete. Remaining work:

1. Extract structured param editors into dedicated components.
2. Introduce theme tokens and dark-mode support without rewriting components.
3. Prepare merge-readiness cleanup for the minimal UI milestone.
4. Composite-module UI.
5. Deeper execution visibility / step-through tooling.

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
- a visual canvas-style workbench with positioned demo nodes and rendered connections
- selected-module port visibility in the inspector
- reactive per-project layout state in the UI store
- basic node movement
- collapsible palette and inspector panels so the workbench can expand
- add-module from palette
- delete-module from inspector
- live re-execution through local UI state
- **refactored node DOM** — nodes use separate body and port hit areas
- **port-to-port connection creation** — drag from output port to input port
- **connection deletion** — click existing connection to remove (hover highlights orange)
- **module category color-coding** — sources (teal), operators (orange), bridges (purple), sinks (green)
- **improved module placement** — new nodes placed in visible canvas area, avoids overlap
- **`src/ui/module-categories.ts`** — shared category mapping for consistent color-coding across palette and canvas
- **UI-side connection validation** — invalid targets blocked before dispatch, with target highlighting
- **structured param editing** — `bits` and `wiring` use purpose-built editors instead of raw textareas
- **workbench persistence** — autosave/restore plus JSON import/export for workbench documents
- **sticky-note annotations** — draggable canvas notes stored as UI metadata, not engine primitives

What is intentionally not built yet:
- composite-module UI
- dark mode
- runtime stepping / deeper trace tooling

Safe resume point for any model:
- branch: `origin/feature/minimal-ui-shell`
- first files to review:
  - `PROJECT_OWNER_NOTES.md`
  - `UI-KICKOFF.md`
  - `src/App.tsx`
  - `src/ui/store.ts`
  - `src/ui/components/workbench-panel.tsx`
  - `src/ui/module-categories.ts`

This means the branch has validated all four editor fundamentals: add, delete, move, and connect modules.
It also now has a real workbench lifecycle: persist, restore, export, import, and annotate.

---

## Non-Goals For This Slice

- freeform node placement
- advanced wire routing / rewiring UX
- drag-and-drop
- composite editing
- runtime stepping UI

Those belong to later branches.
