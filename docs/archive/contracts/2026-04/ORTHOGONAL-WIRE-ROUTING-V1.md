# ORTHOGONAL-WIRE-ROUTING-V1

Status: Shipped on main
Owner: Codex
Last updated: April 3, 2026

## Intent

Add a bounded wire-routing refinement that makes connections read more like deliberate circuit traces instead of purely automatic curves.

The goal is to improve legibility and author control for larger workspaces without turning MCW into a general-purpose CAD tool or freeform diagram editor.

## Why

MCW now supports:
- horizontal and vertical workspace layout direction
- per-node rotation with upright labels
- wire hover labels
- semantic wire color tinting

Those upgrades make the next remaining wire bottleneck obvious:
- some graphs still feel visually loose even when the structure is correct
- curved auto-routing can make dense or rotated layouts harder to follow
- advanced users want cleaner, more deliberate signal paths

The next safe step is not arbitrary bezier editing. It is bounded orthogonal routing.

## Core Principle

This slice is about **drawing clarity**, not graph semantics.

Routing mode must not:
- change execution behavior
- change validation behavior
- change which modules are connected
- create hidden intermediate graph nodes
- require engine changes

It only changes how existing connections are rendered and, in a bounded way, how their path shape is chosen.

## Non-Goals

V1 does **not**:
- add freeform bend-point dragging
- add arbitrary per-segment editing
- introduce a full path editor
- auto-optimize the entire graph like a PCB router
- add wire bundles or buses
- change selection semantics
- add semantic security color meaning such as “safe” or “unsafe”
- collapse multiple wires into one visual channel
- rewrite the entire canvas rendering system

## Required V1 Shape

1. Add a bounded orthogonal routing mode for workbench connections.

2. Keep the current routing mode available as the default fallback.

3. Orthogonal routing means connections are rendered as axis-aligned segments with right-angle turns.

4. The path must continue to respect the current anchor positions produced by:
   - workspace layout direction
   - per-node rotation
   - existing port ordering

5. Orthogonal routing must work in both horizontal and vertical workspace layouts.

6. Orthogonal routing must work with rotated nodes whose inputs/outputs appear on top, bottom, left, or right.

7. Hover labels and selection emphasis must continue to work in orthogonal mode.

8. Existing connection semantics remain unchanged. No new graph objects are introduced.

9. V1 should provide one workspace-level routing mode toggle:
   - `Curved`
   - `Orthogonal`

10. The chosen routing mode must persist per workspace in UI metadata and survive:
   - refresh
   - save/load
   - workspace export/import
   - shareable lab pack export/import

11. Existing workspaces without routing metadata must default to `Curved`.

12. Every orthogonal path must include a mandatory step-back margin before its first turn so the line reads as leaving the port cleanly instead of clipping the node edge.

13. Orthogonal routing must apply small deterministic lane offsets so parallel connections do not collapse into a single visual bus when nodes align.

## Routing Rules

V1 orthogonal paths should remain deterministic and bounded.

Recommended rule shape:
- choose a primary axis based on source/target side pairing
- route away from the source anchor
- make one or two right-angle turns
- approach the target anchor cleanly from its side

Mandatory constraints:
- use a fixed step-back margin of about `20px` before the first turn
- use local geometry only
- do not use generalized pathfinding such as A* or Dijkstra
- lane offsets must be stable for the same source/target port pairing

This should produce stable readable paths, not globally optimal ones.

The system should prefer:
- short clear elbows
- no diagonal segments
- predictable repeated behavior for the same geometry

V1 does not need to solve every crossing.
It only needs to be visibly cleaner and more deliberate than the current curve in the most common cases.

## UX Rules

- The routing toggle should live near other workspace layout actions such as `Tidy Layout` and layout direction.
- The control should read as a view/layout choice, not a machine choice.
- Orthogonal mode should feel like a workspace preference, not a one-off connection trick.
- The UI must not imply that orthogonal routing changes the machine itself.
- A compact `Curve / Ortho` segmented or paired control is preferred if it fits the existing menu language cleanly.

## Persistence Rules

- Routing mode is workspace UI metadata only.
- It must not appear in engine `Project` or `ModuleInstance` types.
- It should serialize alongside other workbench layout/view settings.
- In practice, it should live beside the existing workspace layout direction metadata, not in engine-facing state.

## Future Direction

This contract intentionally stops before manual trace shaping.

Possible later follow-ons:
- per-connection routing hints
- bounded bend-point insertion
- wire-layer or lane preferences
- stronger domain or source-based color customization
- endpoint labels on persistent selection

Those should be separate contracts. They are related, but they should not bloat the first routing slice.

## Implementation Preference

Prefer implementing this as a renderer-level path generator choice:
- keep the existing anchor and selection model
- add one orthogonal path function beside the current curved path function
- switch between them by workspace routing mode
- persist the mode in workbench UI metadata only

Do not introduce hidden graph nodes or a second execution graph.

## Success Condition

V1 is complete when:
- a workspace can choose `Curved` or `Orthogonal` routing
- orthogonal mode produces deterministic right-angle connection paths
- the mode survives refresh and export/import
- hover labels, selection, and rotated anchors still work
- the machine means exactly the same thing in both modes

## Risks

- If this expands into freeform path editing, the slice is too large.
- If orthogonal mode breaks with rotated nodes, the slice has failed.
- If the paths feel unstable or jump unpredictably as nodes move, the slice will feel unreliable.

## Final Note

This is the next legibility step after:
- workspace direction
- per-node rotation
- wire hover labels
- semantic wire tinting

It gives the workbench a cleaner circuit-surface feel without crossing into full diagram-tool complexity.
