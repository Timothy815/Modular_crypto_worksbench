# WIRE-COLOR-CUSTOMIZATION-V1

Status: Implemented locally, pending push
Date: 2026-04-03

## Intent

Add bounded workspace-level wire color control so users can choose the legibility style that fits a dense machine without turning wire appearance into per-wire decoration.

## Required V1 Shape

1. Workspace-level visual mode only.
2. Three modes only:
   - `domain`
   - `neutral`
   - `high-contrast`
3. Persist through refresh, save/load, export/import, shareable lab packs, and workspace history/versions.
4. Keep engine semantics and project schema unchanged.
5. Preserve existing selection, trace, compare, and invalid-wire emphasis as authoritative overrides.

## UX Rules

- Controls should be available with the other workspace view/layout actions.
- `Domain` should preserve the current semantic split between bit-domain and symbol-domain connections.
- `Neutral` should calm the graph visually while keeping selected and emphasized wires easy to spot.
- `High Contrast` should make domain differences easier to scan in larger or denser workspaces.

## Non-Goals

- No per-wire arbitrary color picker.
- No semantic recoloring of modules or ports.
- No new routing behavior.
- No engine-visible connection classes.

## Success Condition

Users can switch the workspace between calmer or more explicit wire-color styles without losing any of the existing connection emphasis cues.
