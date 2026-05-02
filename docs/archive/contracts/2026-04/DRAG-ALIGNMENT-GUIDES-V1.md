# DRAG-ALIGNMENT-GUIDES-V1

Status: Shipped on `main`.

## Intent

Add temporary alignment cues while dragging modules so layout decisions feel deliberate without introducing new graph semantics or persistence.

## Required V1 Shape

1. Show temporary horizontal and vertical alignment guides while dragging modules.
2. Reuse current module and guide-rail geometry instead of inventing a separate snapping model.
3. Keep the slice visual-only with zero schema drift.
4. Limit the first pass to module dragging only.

## Shipped Note

The local implementation adds temporary dashed guide lines when the dragged module is close to:

- another module edge or center
- a guide rail

These guides disappear when dragging stops and do not change snapping or routing behavior.

## Non-Goals

- no persistence
- no note, group-box, or stage-label alignment matching yet
- no new snapping rules
- no auto-layout solver
