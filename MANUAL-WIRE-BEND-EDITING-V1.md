# MANUAL-WIRE-BEND-EDITING-V1

Status: Shipped on main
Owner: Codex
Last updated: April 3, 2026

## Intent

Add a bounded manual bend-editing layer for orthogonal wires so users can place elbows where they want them without changing the machine itself.

The goal is to preserve MCW's glass-box execution model while giving advanced users enough routing control to make dense workspaces read more like deliberate circuit layouts.

## Why

MCW now supports:
- per-workspace horizontal and vertical layout direction
- per-node rotation with upright labels
- semantic wire tinting and hover endpoint labels
- workspace-level orthogonal routing

Those upgrades make the next remaining routing friction clear:
- orthogonal routing is cleaner than curves, but the automatic elbows are still only "good enough"
- dense feedback loops and hybrid layouts often want the bend in a different place than the default midpoint
- advanced users want local control over path shape without asking for a full CAD editor

The next safe step is not arbitrary wire drawing. It is bounded bend editing on orthogonal paths.

## Core Principle

This slice is about **path shape control**, not graph semantics.

Manual bends must not:
- change execution behavior
- change validation behavior
- change which ports are connected
- create hidden graph nodes
- require engine changes

It only changes how an existing orthogonal path is drawn.

## Non-Goals

V1 does **not**:
- add freehand wire drawing
- support arbitrary many bend points
- edit curved wires
- introduce generalized pathfinding
- optimize crossings globally
- add semantic wire color authoring
- add wire bundles or buses
- rewrite connection selection semantics
- turn MCW into a general-purpose diagram editor

## Required V1 Shape

1. Manual bend editing applies only when the workspace routing mode is `Orthogonal`.

2. V1 should support a bounded number of editable bend handles per connection:
   - one central elbow handle for simple 2-turn paths
   - or the minimal equivalent handle set needed for the current orthogonal path shape

3. Dragging a bend handle changes only the rendered orthogonal path for that connection.

4. The connection itself remains exactly the same:
   - same source module/port
   - same target module/port
   - same execution meaning

5. Bend edits must persist per connection in workspace UI metadata and survive:
   - refresh
   - save/load
   - workspace export/import
   - shareable lab pack export/import
   - undo/redo
   - workspace version save/restore

6. Bend metadata must not appear in engine `Project` or `ModuleInstance` types.

7. V1 must provide a clear `Reset Wire Path` action that returns a connection to automatic orthogonal routing.

8. Hover labels, selection emphasis, comparison highlighting, and signal-domain tinting must continue to work exactly as they do now.

9. If a user never edits a bend, the connection continues to use the existing automatic orthogonal path.

10. If a bend edit becomes invalid because node movement makes it degenerate, the renderer should fall back safely to automatic orthogonal routing rather than producing broken geometry.

11. Bend handles must be axis-aware:
   - vertical central segments move horizontally
   - horizontal central segments move vertically

12. Every bend adjustment must participate in workspace undo/redo as a normal authoring action.

## Editing Rules

V1 should stay deterministic and bounded.

Recommended rule shape:
- automatic orthogonal routing still computes the base path
- manual metadata stores only the minimum offset or elbow-position override needed to re-place that bend
- the renderer combines:
  - the current anchors
  - the current orthogonal mode
  - the optional bend override

Mandatory constraints:
- no arbitrary point lists
- no more than the minimal bounded handle count needed for the current path shape
- dragging must stay axis-aware and preserve orthogonal segments
- `Reset Wire Path` must fully remove the manual override
- if a manual bend effectively matches the automatic path again, the override should be cleared instead of persisted

## UX Rules

- Bend handles should appear only for the selected connection.
- Handles should read as routing controls, not as graph-edit controls.
- The UI must make it obvious that bend editing is available only in orthogonal mode.
- `Reset Wire Path` should live near existing wire-selection actions, not in the global workspace toolbar.
- The interaction should feel like "adjust the elbow," not "redraw the wire."
- Bend handles must be visually distinct from circular port anchors.

## Persistence Rules

- Bend overrides are workspace UI metadata only.
- They should be stored per connection in a stable workspace-level structure keyed by the existing connection comparison key.
- They must not leak into engine-facing state.
- Existing workspaces without bend metadata should continue to render with automatic routing.

## Future Direction

This contract intentionally stops before freeform routing.

Possible later follow-ons:
- multiple bend points
- bounded per-wire lane preferences
- hover endpoint labels that expand on selected wires
- user-controlled semantic wire colors
- stronger collision avoidance

Those should be separate contracts.

## Implementation Preference

Prefer implementing this as a renderer-level override on top of the current orthogonal path helper:
- keep the existing connection model
- keep the current automatic orthogonal generator
- add optional bend metadata as a small UI-layer override
- expose drag handles only when a connection is selected

Do not introduce hidden graph nodes or a second graph representation.

## Success Condition

V1 is complete when:
- a selected orthogonal wire exposes draggable bend control
- dragging the control repositions the elbow while preserving orthogonal geometry
- `Reset Wire Path` returns the wire to automatic routing
- the override survives refresh and import/export
- the machine means exactly the same thing before and after bend editing

## Risks

- If this expands into arbitrary path editing, the slice is too large.
- If bend metadata leaks into engine state, the slice has failed.
- If dragging handles makes paths unstable or non-orthogonal, the slice will feel unreliable.

## Final Note

This is the next bounded routing-control step after:
- workspace direction
- per-node rotation
- wire hover labels
- semantic wire tinting
- workspace-level orthogonal routing

It should make the workbench feel more deliberate and circuit-like without crossing into a full CAD tool.
