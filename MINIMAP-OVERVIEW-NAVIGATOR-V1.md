# MINIMAP-OVERVIEW-NAVIGATOR-V1

Last updated: April 3, 2026

Status: Implemented locally, pending push

Owner: Codex
Scope: Large Workspace Navigation / Workbench Readability / UI Metadata Only

---

## Why

MCW now supports:
- horizontal and vertical workspace layout
- rotated nodes
- orthogonal routing
- manual wire bend editing
- stage/group boxes

That means the next large-workspace gap is no longer basic authoring.
It is **staying oriented while moving around the canvas**.

---

## Goal

Add one bounded overview navigator that:
- shows a compact map of the current workspace
- shows the current viewport inside that map
- allows click-to-pan navigation
- persists per workspace as UI metadata only

---

## Product Boundary

This slice is:
- navigation-focused
- workspace-local
- purely visual
- UI metadata only

It is not:
- a second canvas
- a semantic grouping system
- a zoom timeline
- a topology editor

---

## Required V1 Shape

1. A workspace may show or hide a compact overview navigator.
2. Visibility must persist per workspace through:
   - refresh
   - save/load
   - export/import
   - shareable lab packs
   - workspace versions/history
3. The navigator must render:
   - module positions
   - group boxes
   - annotation markers
   - the current viewport rectangle
4. Clicking the navigator must pan the main workbench toward that location.
5. V1 must not allow editing modules, wires, or boxes inside the navigator.
6. V1 must remain compatible with:
   - workspace layout direction
   - node rotation
   - orthogonal routing
   - manual wire bends

---

## UX Rules

1. The navigator should stay visually quiet.
2. It should live at the edge of the workbench, not compete with the main canvas.
3. The viewport rectangle must remain clear at a glance.
4. The toggle belongs in the workbench `View` surface because this is navigation, not machine semantics.

---

## Explicit Non-Goals

- no editing inside the minimap
- no second selection model
- no zoom slider inside the minimap
- no semantic lane display
- no wire rendering inside V1

---

## Success Condition

This slice is successful if:
- users can reorient quickly inside larger workspaces
- the current viewport is easy to locate
- click-to-pan works reliably
- the feature remains visual and low-noise
