# WIRE-POLISH-V1

Status: Shipped on main

## Goal

Make the selected-wire controls easier to read and faster to use without adding new routing or color semantics.

## Required V1 Shape

1. Show compact current-state chips for the selected wire
2. Surface current path mode, lane preference, and color override clearly
3. Keep the slice UI-only and bounded to toolbar/menu clarity
4. Preserve all existing wire behavior unchanged

## Explicit Non-Goals

- No new routing modes
- No new color semantics
- No new persistence fields
- No selected-wire inspector panel

## Shipped Note

MCW now exposes the current selected-wire state directly in the toolbar so authors can see whether a wire is auto/manual, lane-biased or neutral, and using workspace color mode or a custom override at a glance.
