# Composite Port Hints V1

## Status

Proposed housekeeping follow-on after `v1.34.0`.

## Purpose

Make composite inputs and outputs easier to identify during wiring without adding always-on canvas clutter.

This slice exists to solve a practical builder problem:
- composites with multiple ports are easy to mis-wire
- the port names already exist in the composite definition
- but that metadata is not surfaced at the moment it is most useful

The goal is not to redesign composite boundaries.
The goal is to surface existing port metadata contextually.

## Strategic Principle

**Keep the canvas quiet at rest, and helpful during interaction.**

That means:
- no permanent port-label overlays
- hints appear only when a user is actively inspecting or wiring a composite boundary
- the inspector remains the persistent source of full port details

## V1 Scope

V1 should stay bounded to **contextual port hints for composite and iterator boundaries**.

Primary user story:
- start wiring into or out of a composite
- hover a boundary port or drag a connection over the target composite
- see which port is which before completing the connection

## Included

- hover-time port hints for composite/iterator input and output anchors
- show:
  - port name
  - signal type
- during a live connection drag:
  - show input-side hints when the drag cursor is over a composite/iterator node
  - do not show global labels across the whole canvas
- keep the inspector as the persistent place for full port listings

## Explicitly Excluded

Do not include in V1:
- always-on port labels
- auto-wiring
- auto-matching by type or name
- primitive-wide port hints for every module
- composite-boundary redesign
- user-defined port renaming
- changes to composite serialization or interface semantics

## Core Rules

1. **Hints are observational only**
   - they display existing metadata
   - they do not change the graph or the composite definition

2. **Hints must stay contextual**
   - hover and target-module drag states only
   - no permanent label mode in this slice

3. **Scope stays at composite boundaries**
   - apply only to composite/iterator ports in V1
   - do not widen to all primitives by default

4. **Drag hints stay local**
   - when wiring, show labels on the currently hovered target composite
   - do not flood the entire canvas with active labels

## Success Criteria

V1 is successful if:
- users can distinguish composite boundary ports during wiring more reliably
- the canvas remains visually quiet when idle
- no engine or persistence changes are required
- the feature reduces mis-wiring without introducing auto-magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- composite interface authoring / port renaming
- bounded primitive port hints for selected multi-port modules
- richer connection-intent highlighting

## Explicitly Avoid Next

Do not turn this into:
- always-on labeling
- a port-renaming system
- an auto-wiring assistant
- a broader composite-interface redesign without a new contract
