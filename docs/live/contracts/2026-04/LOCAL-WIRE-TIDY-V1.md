# LOCAL-WIRE-TIDY-V1

Last updated: April 5, 2026

---

## Purpose

Define a bounded local tidy slice for cleaning up dense wire regions by reorganizing only the selected subgraph.

This is a readability and layout-cleanup feature.
It is not a whole-workspace auto-layout rewrite.

---

## Problem

MCW now has stronger wire readability:
- visual discipline
- crossing discipline
- lane preference
- manual bends

But dense local regions still become hard to rescue once they drift out of shape.

Whole-workspace `Tidy Layout` is useful, but it is too blunt when the user only wants to clean up:
- one round cluster
- one key-schedule bank
- one crowded transformation pocket

The missing tool is a local tidy that improves wiring readability without disturbing the whole machine.

---

## Goal

Add one bounded **local wire tidy** slice that:
- operates only on the currently selected modules
- reuses the existing graph-aware tidy language
- improves wire readability by cleaning up local module arrangement in place

This slice should make dense subgraphs easier to read without becoming a new general auto-layout system.

---

## Product Boundary

This slice is:
- local
- selection-scoped
- layout-only
- explicit

It is not:
- a global tidy replacement
- a route solver
- a wire editor
- a semantic stage inference system

---

## Required V1 Shape

1. V1 adds a `Tidy Selection` action.
2. It operates only on selected modules in the current workspace.
3. Fewer than two selected modules is a no-op.
4. The action reuses the existing graph-aware tidy language rather than inventing a second layout style.
5. Only selected module positions may change.
6. Unselected modules, annotations, stage labels, group boxes, guide rails, and wire metadata must remain unchanged.
7. Connections remain the same; only the selected module layout changes.
8. The lead selection should remain the visual anchor so the cleaned fragment stays local rather than jumping elsewhere.
9. The action must be one undo/redo step.
10. It must respect the current workspace layout direction.

---

## Interaction Model

The action should live with the existing selected-layout tools in the workbench action area.

It should feel like:
- a local cleanup tool
- a rescue for dense subgraphs
- a complement to align/distribute and stage-row/column actions

It should not introduce a new authoring mode.

---

## Non-Goals

Do not include:
- whole-canvas tidy behavior changes
- wire rerouting logic
- automatic stage detection
- “tidy inside every box” inference
- note / label / rail repositioning
- arbitrary spacing controls

---

## Expected File Scope

Primary files likely in scope:
- `src/ui/store.ts`
- `src/ui/store.test.ts`
- `src/ui/components/workbench-actions.tsx`
- `src/App.tsx`

This slice should not require engine changes.

---

## Exit Condition

This contract is complete when:
- a selected dense fragment can be cleaned up without disturbing the rest of the workspace
- the result reads more clearly with improved local wire discipline
- the action is history-safe and selection-scoped
- MCW gains a local rescue tool without drifting into global auto-layout complexity
