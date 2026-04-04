# ARBITRARY-WIRE-COLORING-V1

Status: Shipped on main

## Goal

Add bounded per-connection wire color overrides so authors can mark key lanes, feedback paths, and teaching emphasis routes without changing graph semantics.

## Required V1 Shape

1. Per-connection color override stored in workspace UI metadata only
2. Curated palette only, not a freeform color picker
3. `Reset To Workspace Wire Colors` always available
4. Selected, trace, compare, and invalid wire states remain visually authoritative
5. Full round-trip through refresh, history, versions, export/import, and shareable lab packs

## Explicit Non-Goals

- No engine semantics
- No per-endpoint or gradient styling
- No arbitrary hex input
- No semantic validation tied to color

## Shipped Note

MCW now supports bounded per-wire recoloring as a presentation aid. The base wire can be overridden from a curated palette while all higher-priority interaction and analysis states still render above that color choice.
