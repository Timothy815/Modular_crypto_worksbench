# SOFT-GRID-SNAP-V1

Status: Shipped on `main`.

Owner: Codex
Scope: Workbench UI metadata and placement ergonomics only

## Goal

Add an optional soft grid and optional snap-to-grid behavior so manual workspace layout feels cleaner without forcing a rigid diagram-editor model.

## Shipped Shape

V1 is implemented locally with the following bounded shape:

1. Per-workspace `showGrid` toggle.
2. Per-workspace `snapToGrid` toggle.
3. Fixed grid size only in V1.
4. Module dragging respects snap when enabled.
5. New-module placement respects snap when enabled.
6. Grid and snap persist through:
   - refresh
   - save/load
   - workspace history / versions
   - export/import
   - shareable lab packs

## Non-Goals

- No engine/schema changes.
- No custom grid-size editor.
- No annotation snap in V1.
- No group-box snap in V1.
- No guide rails or smart alignment inference.

## Note

This is a placement/readability slice only. It complements alignment, group boxes, minimap, layout direction, and rotation without widening into a general CAD/grid editor.
