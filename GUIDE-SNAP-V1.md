# GUIDE-SNAP-V1

Status: Implemented locally

## Goal

Make guide rails useful as active layout aids by allowing modules to snap to nearby horizontal and vertical rails during placement and dragging.

## V1 Shape

- Add per-workspace `Snap To Guides`.
- Apply guide snapping to module placement and module dragging only.
- Snap against nearby rail positions using module edge or center alignment.
- Keep guide snap compatible with existing grid snap.
- Persist the toggle through refresh, save/load, history, versions, export/import, and shareable lab packs.

## Non-Goals

- No constraint solver.
- No wire snapping.
- No automatic layout based on rails.
- No snapping for notes, group boxes, or guide rails themselves.

## Shipped Note

V1 makes guide rails active without turning them into a full layout system. Modules can now lightly snap to nearby rails while still remaining freely movable, which keeps larger workspaces orderly without introducing hidden semantics or CAD-style constraints.
