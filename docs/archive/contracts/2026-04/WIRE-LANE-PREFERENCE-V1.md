# WIRE-LANE-PREFERENCE-V1

Status: Shipped on `main`.
Date: 2026-04-03

## Intent

Add one bounded per-connection lane preference for orthogonal routing so dense workspaces can keep connections in cleaner corridors without expanding into a full routing editor.

## Required V1 Shape

1. Orthogonal routing only.
2. Per-connection UI metadata only.
3. Three states only:
   - `neutral`
   - `negative`
   - `positive`
4. Manual bend overrides remain authoritative when present.
5. Clearing a manual bend falls back to the preferred auto lane rather than removing the preference.
6. Round-trip through refresh, save/load, export/import, shareable lab packs, and workspace history/versions.
7. No engine semantics, validator behavior, or project schema changes.

## UX Rules

- Controls should only appear when a wire is selected.
- User-facing labels should be directional and axis-aware:
  - horizontal bend axis: `Prefer Left Lane` / `Prefer Right Lane`
  - vertical bend axis: `Prefer Upper Lane` / `Prefer Lower Lane`
- `Neutral Lane` must always remain available as a reset.

## Non-Goals

- No pathfinding rewrite.
- No arbitrary multi-lane editor.
- No curved-mode lane preference.
- No semantic wire classes.

## Success Condition

Users can bias an orthogonal wire into a cleaner corridor without converting the wire into a manually bent path.
