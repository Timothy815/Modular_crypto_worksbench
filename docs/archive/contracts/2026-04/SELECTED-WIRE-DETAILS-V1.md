# SELECTED-WIRE-DETAILS-V1

Status: Shipped on main

## Goal

Make the currently selected connection fully legible at a glance without adding a separate inspector surface.

## Required V1 Shape

1. Show a compact selected-wire details card next to the existing wire tools
2. Surface source endpoint, target endpoint, path mode, lane state, and color state
3. Keep the slice UI-only and bounded to readout clarity
4. Preserve existing wire actions and semantics unchanged

## Explicit Non-Goals

- No new wire behavior
- No second inspector panel
- No persistence changes
- No routing or color logic changes

## Shipped Note

MCW now shows a compact selected-wire details card in the workbench actions area so authors can read the active connection’s endpoints and current state without inferring everything from the toolbar controls alone.
