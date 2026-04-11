# GUIDE-RAILS-V1

Status: Shipped on `main`.

## Goal

Add lightweight visual guide rails to the workbench so larger machines can be laid out against persistent horizontal and vertical reference lines.

## V1 Shape

- Rails are workspace UI metadata only.
- Users can add horizontal and vertical rails.
- Rails can be moved, renamed, and deleted.
- Rails do not change graph semantics, execution, validation, or module definitions.
- Rails round-trip through refresh, save/load, history, versions, export/import, and shareable lab packs.

## Non-Goals

- No semantic grouping behavior.
- No auto-layout solver or constraint system.
- No snap-to-guide in V1.
- No wire-routing automation tied to rails.

## Shipped Note

V1 adds persistent, draggable guide rails as a lightweight structure layer beside notes and group boxes. This gives authors a way to maintain stage lanes, source/output corridors, and repeated alignment patterns without turning the workbench into a constrained diagram editor.
