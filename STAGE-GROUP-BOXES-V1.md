# STAGE-GROUP-BOXES-V1

Last updated: April 3, 2026

Status: Implemented locally, pending push

Owner: Codex
Scope: Workbench Readability / Teaching Layout / UI Metadata Only

---

## Why

MCW now supports:
- larger staged workspaces
- horizontal and vertical workspace layout direction
- node rotation
- orthogonal routing
- manual wire bend editing
- selected-cluster alignment and distribution

That means the next large-workspace gap is no longer basic placement.
It is **visible grouping**.

Users can build a readable machine, but the canvas still has limited help for showing:
- round boundaries
- sender / receiver regions
- control banks
- feedback areas
- setup vs transform vs output phases

Sticky-note annotations help, but they are too manual and too text-shaped to be the primary answer.

---

## Goal

Add one bounded **stage/group box** slice that lets a user place lightweight visible grouping regions behind parts of a workspace.

These regions should help the canvas read more like:
- a staged protocol diagram
- a round-based machine
- a banked construction
- a glass-box system with explicit visual phases

Without introducing graph semantics, grouping semantics, or engine behavior.

---

## Product Boundary

This slice is:
- visual
- workspace-local
- readability-oriented
- UI metadata only

It is not:
- a composite system
- a semantic group/container model
- a locked region or movement constraint
- a graph execution feature
- an annotation replacement
- a whiteboard tool expansion

---

## Core Rule

**A stage/group box is a visual region, not a graph primitive.**

It may help the user read and present the graph.
It must not change:
- execution
- validation
- selection semantics
- module membership semantics
- composite behavior

---

## Required V1 Shape

1. A workspace may contain zero or more stage/group boxes.
2. Each stage/group box must be stored only in workbench UI metadata.
3. Each stage/group box must support:
   - position
   - size
   - title
   - optional tint/style variant
4. Boxes must render behind modules and wires by default so they read as grouping regions, not foreground objects.
5. Users must be able to:
   - create a box
   - move a box
   - resize a box
   - rename/edit a box title
   - delete a box
6. V1 should allow a box to be created either:
   - from the current selected cluster bounds
   - or as a default empty box in the current viewport
7. Boxes must persist through:
   - refresh
   - save/load
   - export/import
   - shareable lab packs
   - workspace history / versions
8. Boxes must not imply module membership beyond visual overlap.
9. Moving modules in or out of a box must not mutate the box automatically in V1.
10. Boxes must not interfere with existing node drag, wire editing, or annotation drag.
11. V1 must not add snapping, locking, or nested containers.

---

## Good V1 Deliverables

- one `Add Group Box` action in the workbench actions area
- one `Create Group Box From Selection` path when a cluster is selected
- draggable/resizable box rendering on the canvas
- inline editable title or inspector-backed title editing
- a small bounded set of style variants such as:
  - neutral
  - stage
  - feedback
  - emphasis

---

## UX Rules

1. Boxes should feel like teaching aids, not object-model semantics.
2. Titles should stay upright and readable at all times.
3. The visual treatment should be low-noise:
   - soft tint
   - subtle border
   - clear title
4. Boxes should improve scanability without overwhelming the machine itself.
5. A selected box should be clearly editable, but non-selected boxes should stay visually quiet.
6. The default creation path should minimize manual setup:
   - if a cluster is selected, prefer a box sized to that visible fragment with padding
   - otherwise create a modest default box in the visible working area

---

## Explicit Non-Goals

- no semantic “group membership”
- no auto-growing box tied to selected modules
- no locked movement of children with the box
- no nested region hierarchy
- no annotation capture/embedding
- no auto-label generation from module contents
- no lane guides or minimap in this slice

Those are later separate slices if needed.

---

## Expected File Scope

Primary files likely in scope:
- `src/ui/workbench-document.ts`
- `src/ui/store.ts`
- `src/ui/store.test.ts`
- `src/ui/persistence.ts`
- `src/ui/workspace-state-support.ts`
- `src/ui/components/workbench-panel.tsx`
- `src/ui/components/workbench-actions.tsx`
- `src/App.css`

This slice should not require engine-layer changes.

---

## Success Condition

This slice is successful if:
- users can visually bracket rounds, phases, or regions on the canvas
- large workspaces become easier to read at a glance
- teachers can present a machine with explicit visible sections
- the feature remains purely visual and does not create hidden graph semantics

---

## Validation Expectations

This slice should add focused tests for:
- create/move/resize/delete behavior
- persistence in workspace documents
- history/version round-trip
- no interference with module selection and movement
- selection-based creation bounds

---

## Explicitly Avoid Next

Do not let this become:
- semantic grouping by stealth
- a composite-authoring shortcut
- a layout-locking system
- a generic whiteboard container system

Keep V1 visual, local, and teachability-focused.
