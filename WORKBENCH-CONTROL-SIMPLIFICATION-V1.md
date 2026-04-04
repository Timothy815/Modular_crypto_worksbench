# WORKBENCH-CONTROL-SIMPLIFICATION-V1

Status: Shipped on main

## Goal

Reduce redundant control surfaces in the workbench so the icon strip is the clear primary path for high-frequency spatial actions and menus remain the fallback for lower-frequency authoring and document actions.

## Required V1 Shape

1. Keep quick actions as the primary surface for navigation, view aids, and selected-wire controls
2. Trim duplicated high-frequency controls from dropdown menus
3. Preserve menus for lower-frequency structure, save/version, and import/export actions
4. Keep the slice UI-only with no behavior changes

## Explicit Non-Goals

- No removal of the quick actions bar
- No removal of structure or import/export menus
- No feature changes
- No toolbar customization system

## Shipped Note

MCW now treats the icon strip as the primary surface for high-frequency workspace actions and trims duplicated menu entries so the chrome feels lighter and less redundant.
