# SELECTED-CLUSTER-ALIGNMENT-V1

Last updated: April 3, 2026

Status: Implemented locally; pending push

Owner: Codex
Scope: Workbench Layout / Selection Ergonomics / Bounded Alignment

---

## Why

MCW already supports:
- visible multi-selection
- drag-box selection
- selected-cluster duplication and deletion
- selected stage row / stage column reshaping
- whole-workspace tidy

That leaves one clear local layout gap:

When a user has a selected fragment that is almost readable, they still do not have a direct way to:
- align one edge cleanly
- center a related bank
- distribute uneven spacing

The result is extra manual dragging in exactly the cases where the structure is already visible and should be easy to refine:
- repeated rounds
- sender / receiver branches
- keyed control banks
- hand-built teaching diagrams that need to look intentional

---

## Goal

Add one bounded **selected-cluster alignment** slice that gives users a small set of explicit local layout actions:
- align selected modules
- distribute selected modules

This slice should improve layout legibility without turning MCW into a general-purpose diagram editor or replacing the existing stage-row / stage-column actions.

---

## Product Boundary

This slice is:
- selection-scoped
- local
- layout-only
- explicit

It is not:
- a full alignment toolbar
- freeform resize / transform handles
- smart graph beautification
- a global auto-layout rewrite
- a grouping or semantic container system
- a snap-grid milestone

---

## Core Rule

**Operate on the selected visible fragment only.**

V1 should move only the currently selected modules.
It should not infer stages, banks, or semantic groups beyond the explicit selection.

---

## Required V1 Shape

1. V1 adds explicit alignment actions for the current selection:
   - `Align Left`
   - `Align Right`
   - `Align Top`
   - `Align Bottom`
   - `Align Horizontal Center`
   - `Align Vertical Center`
2. V1 adds explicit distribution actions for the current selection:
   - `Distribute Horizontally`
   - `Distribute Vertically`
3. All actions operate only on selected modules in the current workspace.
4. Fewer than two selected modules is a no-op for alignment actions.
5. Fewer than three selected modules is a no-op for distribution actions.
6. Actions must preserve module IDs, params, connections, annotations, probes, drafts, and selection membership.
7. Actions must update only module positions.
8. The lead selection must remain the lead selection after the action.
9. Every action must be one undo/redo step.
10. V1 must not introduce new engine-layer data or semantics.
11. V1 must not introduce persistent named groups or alignment guides.
12. V1 must not alter per-node rotation, wire routing mode, or manual wire bends.
13. Distribution must keep the outermost selected modules fixed on the chosen axis.
14. Center alignment must use visible node bounds so modules center by their rendered boxes, not by raw top-left points alone.
15. V1 should reuse the existing reducer-backed selected-layout path so align/distribute actions remain history-safe and local.

---

## Alignment Rules

1. Alignment uses the currently selected modules only.
2. `Align Left` / `Align Right` use the selected modules' outer x-bounds.
3. `Align Top` / `Align Bottom` use the selected modules' outer y-bounds.
4. Center alignment uses the selected modules' current bounding box:
   - horizontal center aligns module centers to the selection midpoint on the x-axis
   - vertical center aligns module centers to the selection midpoint on the y-axis
5. Alignment should preserve the non-aligned axis unchanged.

---

## Distribution Rules

1. Distribution uses the current selected set's sorted visual order:
   - horizontal distribution sorts by x-position
   - vertical distribution sorts by y-position
2. The outermost modules on the chosen axis stay fixed.
3. Interior modules are redistributed evenly between those outer anchors.
4. Distribution changes only the chosen axis.
5. Distribution must be deterministic for the same selected layout.
6. Fewer than three selected modules is a no-op for distribution.

---

## Good V1 Deliverables

- selected-layout action entries in the existing workbench actions surface
- reducer-backed alignment commands
- reducer-backed distribution commands
- focused tests for position updates and history behavior
- no new heavy toolbar or diagram-editor chrome

---

## Explicit Non-Goals

- no arbitrary spacing dialog
- no per-axis pixel input controls
- no snap-grid requirement
- no guide lines or ruler system
- no annotation alignment
- no edge alignment
- no whiteboard-style transform box
- no semantic stage inference
- no replacement for `Arrange Selected Stage Row` or `Stack Selected Stage Column`

Those remain separate lines if needed:
- snap grid
- guide rails
- stage/group boxes
- mini-map

---

## UX Rules

1. These actions should live with the existing workbench actions rather than becoming a large persistent toolbar.
2. The naming should stay plain and literal:
   - `Align Left`
   - `Distribute Horizontally`
3. Prefer a small strong set of actions over a crowded diagramming surface.
4. These actions should feel like local cleanup tools, not a new authoring mode.
5. The user should always be able to predict which modules will move:
   - exactly the selected modules
   - no hidden extras

---

## Expected File Scope

Primary files likely in scope:
- `src/ui/store.ts`
- `src/ui/store.test.ts`
- `src/ui/components/workbench-actions.tsx`
- `src/App.tsx`

Supporting layout helpers are acceptable if they remain small and selection-scoped.

This slice should not require engine-layer changes.

---

## Success Condition

This slice is successful if:
- a user can clean up a selected fragment without manual pixel dragging
- repeated rounds and mirrored branches can be made visibly neater with one action
- the workbench becomes easier to present and read in class
- MCW gains local layout power without becoming a generic diagram editor

---

## Validation Expectations

This slice should add focused tests for:
- each alignment action moving only the expected axis
- each distribution action preserving outer anchors
- deterministic sorted distribution behavior
- no-op behavior for too-small selections
- undo/redo integration
- preservation of selection membership and other workspace-local state

---

## Explicitly Avoid Next

Do not let this become:
- a broad transform system
- a guide / ruler / snap-grid campaign
- semantic stage inference
- edge editing by stealth
- a generic design-tool toolbar

Keep the first move local, explicit, and state-safe.

---

## Implemented Locally Note

The current local implementation now adds:
- `Align Left`
- `Align Right`
- `Align Top`
- `Align Bottom`
- `Align Horizontal Center`
- `Align Vertical Center`
- `Distribute Horizontally`
- `Distribute Vertically`

It reuses the existing reducer-backed selected-layout action path so the feature:
- moves only selected modules
- preserves non-layout workspace state
- participates in one-step undo/redo
