# SELECTION-DETAILS-UNIFICATION-V1

Status: Shipped on main

## Goal

Make workbench selection readouts feel like one coherent system across wires and layout furniture.

## Required V1 Shape

1. Present selected-wire and selected-layout details through one shared details treatment
2. Keep selection precedence visually clear without adding new selection semantics
3. Preserve existing selection behavior and actions unchanged
4. Keep the slice UI-only and bounded to coherence

## Explicit Non-Goals

- No new selection types
- No inspector rewrite
- No new persistence
- No graph behavior changes

## Shipped Note

MCW now uses one shared selection-details section in the workbench action area, so wire and layout-furniture readouts follow the same visual language and precedence.
