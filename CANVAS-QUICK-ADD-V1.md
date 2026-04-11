# CANVAS-QUICK-ADD-V1

Last updated: April 11, 2026

Status: Shipped on `main`.

## Purpose

Add a double-click-to-search module placement gesture that lets the user add any module without leaving the canvas.

This is the single biggest authoring fluency improvement available. It eliminates the most common ceremony in building a graph: open palette → scroll or search → drag module → position it. That four-step sequence becomes one gesture.

## North Star Alignment

This slice scores against the experiential north star on:
- **Authoring Fluency** — eliminates the ceremony of fetching modules from the palette
- **Mechanism Feel** — you stay in the workspace and reach for modules rather than leaving to retrieve them

## Behavior

Double-click on empty canvas space opens a small floating search overlay anchored at the click position.

The user types to filter the module list. The list narrows as they type. Pressing Enter or clicking a result places the module at the click position and closes the overlay. Pressing Escape closes the overlay without placing anything.

The placed module is selected immediately after placement so the user can begin connecting it.

## Rules

- Trigger: double-click on empty canvas (not on a module, not on a wire, not on a group box)
- The overlay appears at or near the click position, repositioned if it would overflow the viewport
- The overlay shows the module name and its section (e.g. `XOR — Bit Logic`)
- Search matches on module name and existing search vocabulary (same terms used in palette search)
- The overlay is dismissed by: Enter (place), Escape (cancel), or click outside
- The placed module's position is the canvas coordinate of the double-click, adjusted so the module center lands at that point
- Placement is undo/redo-safe (same reducer action as palette placement)
- The palette remains fully available and unchanged — this is an additional gesture, not a replacement

## Explicitly Out of Scope

- Placing multiple modules in one gesture
- Showing connection suggestions after placement
- Showing recently used modules (can be a follow-on)
- Replacing or deprecating the palette
- Any engine changes

## Implementation Notes

The double-click handler lives on the canvas background element. The overlay is a small controlled component with a text input and a filtered list. Module search reuses the existing `matchesModuleSearch` function already used by the palette. Placement uses the existing add-module reducer action with an explicit position derived from the click coordinates.

The main integration points are:
- canvas background event handler (new)
- floating overlay component (new, small)
- existing `matchesModuleSearch` from `module-library.ts` (reused)
- existing add-module reducer action (reused)

## Acceptance Criteria

- Double-clicking empty canvas opens the search overlay at the click position
- Typing filters the module list using the same search vocabulary as the palette
- Enter places the top-matching module at the click position and closes the overlay
- The placed module is immediately selected
- Escape closes the overlay without placing anything
- Double-clicking a module or wire does not trigger the overlay
- Placed modules are undoable with a single undo step
- The palette remains fully functional and unchanged
- All existing tests pass
- Bundle size guard passes
