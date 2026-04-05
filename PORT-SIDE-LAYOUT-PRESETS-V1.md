# PORT-SIDE-LAYOUT-PRESETS-V1

## Goal

Reduce local wire clutter by letting a module choose a cleaner visual port posture without changing engine semantics or enabling arbitrary per-port side placement.

## Why

`PORT-ORDER-AUTHORING-V1` proved that presentation-only port metadata can make dense workspaces noticeably cleaner. The next bounded step is to let a node choose whether its ports should present in a horizontal or vertical posture when that makes nearby wiring read more clearly.

This should:
- simplify local corridors before resorting to deeper wire control
- compound with node rotation, orthogonal routing, lane preference, and local wire tidy
- stay strictly in workspace UI metadata

## V1 Shape

Add per-instance visual port-side presets:
- `Default`
- `Horizontal`
- `Vertical`

Behavior:
- `Default` continues to derive port sides from node orientation and workspace layout direction
- `Horizontal` forces inputs left / outputs right
- `Vertical` forces inputs top / outputs bottom

The preset affects:
- workspace card port anchor placement
- workspace card visible input/output ordering lanes
- connection endpoint side selection for rendered wires
- pending and rewired connection previews

The preset does not affect:
- engine execution
- module definitions
- port names or types
- port ordering within a side

## Authoring Surface

Expose the preset as a compact per-module control in the inspector near the existing `Inputs` / `Outputs` ordering controls.

Keep it:
- per-instance
- quick to toggle
- clearly visual in meaning

## Persistence

Store the preset as workspace-local UI metadata on the module position entry.

It must round-trip through:
- refresh
- save/load
- workspace history and versions
- workspace artifact export/import
- composite and project cloning paths that already preserve layout metadata

## Constraints

- No arbitrary per-port side placement
- No engine/schema rewrite beyond bounded workspace metadata
- No change to port compatibility or connection semantics
- No effect on composite definitions beyond normal instance rendering

## Out of Scope

- Per-port free placement
- Mixed side assignment on a single node
- Automatic preset selection
- Additional routing intelligence
