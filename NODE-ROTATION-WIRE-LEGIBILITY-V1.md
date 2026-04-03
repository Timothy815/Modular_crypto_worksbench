# NODE-ROTATION-WIRE-LEGIBILITY-V1

Status: Proposed
Owner: Codex
Last updated: April 3, 2026

## Intent

Add a bounded advanced-authoring legibility slice that lets a placed module instance rotate its input/output orientation without changing the machine semantics.

The primary goal is to support hybrid layouts that can grow horizontally and vertically in the same workspace, more like a circuit board or patch surface, while keeping signal flow readable.

## Why

MCW now supports:
- larger flagship labs
- vertical and horizontal workspace layout direction
- composite drill-down and richer multi-surface inspection

That makes the next readability pressure point obvious:
- some workspaces want global horizontal flow
- some want global vertical flow
- some want both, in different local fragments

Per-node rotation is the first advanced step toward that hybrid layout style.

## Core Principle

This slice is about **port orientation and wire legibility**, not about changing graph semantics.

Rotating a module instance must not:
- change execution order
- change signal interpretation
- create a second kind of module
- mutate the shared primitive or composite definition

It only changes how that specific placed instance is drawn and connected in the workbench.

## Non-Goals

V1 does **not**:
- change execution or validation semantics
- introduce freeform wire-handle editing
- add manual per-segment routing control
- create a second graph model
- add semantic wire-color meaning such as “secure”, “unsafe”, or “verified”
- auto-optimize all wires globally like a CAD router

## Required V1 Shape

1. Add per-module-instance orientation in workspace UI metadata only.

2. The engine project model remains unchanged.

3. A module instance can face one of four directions:
   - `east`
   - `south`
   - `west`
   - `north`

4. Input and output sides must always remain opposed for readability:
   - `east`: inputs left, outputs right
   - `south`: inputs top, outputs bottom
   - `west`: inputs right, outputs left
   - `north`: inputs bottom, outputs top

5. Module titles, port labels, and status badges must remain upright and readable after rotation.
   Users should never need to turn their heads to read node content.

6. Existing workspaces without instance orientation metadata must render with the current default orientation.

7. Rotation must apply equally to primitive instances and composite instances.

8. V1 should provide a small explicit rotate control for the selected module instance in the inspector or module actions, not a hidden gesture.

9. Workspace-level layout direction remains the default layout/tidy bias. Per-node rotation is an advanced local override, not a replacement for workspace direction.

10. Tidy must treat user-chosen node orientation as a fixed constraint. It may reflow position, but it must not silently erase manually chosen orientation.

11. Newly added modules should default to the orientation that matches the workspace-level layout direction:
   - horizontal workspace bias -> `east`
   - vertical workspace bias -> `south`

## Wire Legibility Rules

V1 wire behavior should remain bounded:
- connection anchors move with the rotated ports
- the renderer should continue using the existing wire style/routing approach
- wires should remain readable after rotation, even if not globally optimal
- inputs and outputs must continue to read clearly from the side they occupy

V1 may include light visual legibility improvements only if they remain bounded, such as:
- slightly clearer elbow preference for rotated connections
- clearer hover/selection emphasis

## Persistence Rules

- Orientation persists per placed module instance in workspace UI metadata.
- It must survive refresh, save/load, and shareable lab pack export/import.
- It must not require an engine schema change.

## UX Rules

- Rotation is an advanced-authoring affordance and should appear near module arrangement / inspector actions.
- The control should use a clearly labeled `Rotate 90° Clockwise` action or equivalent plain direction control.
- The UI should always make the resulting orientation obvious without requiring guesswork.
- Input/output labels should do more work than iconography.

## Future Direction

This contract intentionally opens a path toward later follow-ons without widening V1:

Possible later slices:
- optional wire color palettes for connection legibility
- bounded connection color grouping by source or selection context
- more precise orthogonal wire routing
- optional manual routing hints or bend points
- hover-revealed endpoint labels on wires so users can see the connected components without selecting the wire first

Those should be separate contracts. They are related, but they are not required to make per-node rotation valuable.

## Implementation Preference

Prefer implementing this as UI-layer workbench metadata plus port-anchor rendering changes:
- workspace UI metadata stores orientation by module instance id
- node rendering reads that orientation
- node content remains upright while only the input/output side mapping and anchor positions rotate
- connection anchor calculation respects it
- persistence round-trips it with other workspace UI state

Do not push this into engine types or composite definition semantics.

## Success Condition

V1 is complete when:
- a user can rotate an individual placed module instance
- inputs and outputs move to the correct opposing sides
- wires connect to the rotated sides correctly
- the chosen orientation persists across refresh and save/load
- the machine still means exactly the same thing

## Risks

- If this turns into full manual wire routing, the slice is too large.
- If rotated nodes become harder to read because labels disappear or overlap, the slice has failed.
- If tidy or auto-placement keeps fighting user rotation choices, the feature will feel unreliable.

## Final Note

This is the advanced hybrid-layout direction:
- workspace direction gives the whole graph a readable bias
- per-node rotation gives advanced users local control where the global bias is not enough

That combination is what starts to make the workbench feel more like a serious circuit surface rather than a single-axis diagram.
