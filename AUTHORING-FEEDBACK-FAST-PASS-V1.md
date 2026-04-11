# AUTHORING-FEEDBACK-FAST-PASS-V1

Last updated: April 11, 2026

Status: Draft

## Purpose

Ship three small, cohesive authoring-feedback improvements that make the graph feel more immediate and responsive while you are building in it.

These are UI-only changes. No engine changes, no new module types, no new data model.

Each item is fast to implement and produces a visible experiential improvement independently. They are bundled because they share a single theme: the graph should give you better feedback while you are working in it, not just after you finish.

## North Star Alignment

This slice scores against the experiential north star on:
- **Live Readability** — wire domain coloring makes signal paths readable without entering Analyze
- **Authoring Fluency** — port compatibility highlighting removes uncertainty during connection drag
- **Mechanism Feel** — the graph becomes visually responsive to your actions before you complete them

## Items

### 1. Wire Domain Coloring

Color wires by signal domain: one color for `bits` paths, a different color for `symbol` paths.

Rules:
- Color is always on — no hover, no mode, no toggle required
- Color is derived from the source port's signal type
- Wires of unknown or indeterminate type remain neutral (current color)
- The two colors must be clearly distinguishable in both light and dark mode
- No labels, no icons — color only

The type information is already in the graph. This surfaces it visually.

A student looking at any graph should be able to trace the symbol domain and the bits domain at a glance without reading module names.

### 2. Port Compatibility Highlight During Connection Drag

When the user begins dragging from an output port, highlight compatible input ports and dim incompatible ones.

Rules:
- Highlight is active only during an in-progress connection drag
- Compatible = same signal domain as the dragged output
- Incompatible = different signal domain, or already-connected input ports that would be blocked
- On drag end (connection made or cancelled), all ports return to their default state
- No persistent state change — purely visual feedback during the drag gesture

The graph should feel receptive during patching. Ports that will accept your wire should look like they want it.

### 3. Inline Module Rename

Double-click a module's name label on the canvas to rename it in place.

Rules:
- Double-click the visible name label on the canvas node
- The label becomes an editable text input in place
- Enter or blur confirms the rename
- Escape cancels without saving
- Rename behavior must be identical to the existing inspector rename workflow (same validation, same atomic reference updates across graph/layout/selection/drafts/probes)
- The inspector rename workflow remains available and unchanged

The user should be able to rename a module without leaving the canvas or opening the inspector.

## Explicitly Out of Scope

- Wire thickness, animation, or glow effects
- Signal value display on wires
- Port labels always visible (covered by composite port hints, already shipped)
- Any new module types
- Any engine changes

## Implementation Notes

Wire coloring: The edge renderer already has access to connection data. Source port type is derivable from the module definition registry. This is a rendering-layer change only.

Port highlight: The drag state is already tracked in the reducer/store. During an active connection drag, the dragged port type is known. Port compatibility is a type comparison already used in validation.

Inline rename: The rename reducer action already exists. This adds a canvas-level double-click handler and an in-place input component on the node label, using the same action.

## Acceptance Criteria

- A bits wire and a symbol wire are visually distinguishable at a glance in any graph
- Dragging from a bits output causes bits-compatible input ports to highlight and symbol input ports to dim
- Dragging from a symbol output causes symbol-compatible input ports to highlight and bits input ports to dim
- Double-clicking a module name on the canvas produces an editable label
- Renaming via canvas produces identical results to renaming via the inspector
- All existing tests pass
- Bundle size guard passes
