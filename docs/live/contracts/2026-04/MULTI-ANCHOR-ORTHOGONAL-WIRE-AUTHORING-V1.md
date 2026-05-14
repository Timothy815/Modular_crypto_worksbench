# MULTI-ANCHOR-ORTHOGONAL-WIRE-AUTHORING-V1

Last updated: April 5, 2026
Status: Shipped on main

---

## Purpose

Define a bounded, more intuitive wire-authoring model for orthogonal connections that feels closer to drawing while preserving MCW's structured readability rules.

This explicitly replaces the rejected single-waypoint toggle approach.
It is a selected-wire authoring slice, not a routing rewrite and not freehand drawing.

---

## Problem

The previous waypoint experiment failed in practice:
- it was not intuitive from the first click
- it behaved more like a hidden mode than a visible drawing action
- it required too much guesswork about how to place and adjust a point
- it introduced more friction than readability

At the same time, the underlying need is real:
- some wires need to pass around a dense pocket
- lane preference and single-bend control are too coarse for some cases
- local visual organization sometimes requires several controlled orthogonal turns

The product need is not "more wire options."
The product need is "a wire path can be authored in a way that feels obvious and deliberate."

---

## Desired Outcome

For a selected orthogonal wire, the user should be able to author a cleaner route by placing and moving multiple persistent anchors.

The interaction should feel close to drawing, but constrained:
- click the wire to add an anchor
- drag an anchor to refine it
- each segment remains orthogonal
- anchors are grid-snapped
- deleting the wire removes all anchors automatically

The route should become easier to organize without turning MCW into a CAD tool.

---

## V1 Scope

`MULTI-ANCHOR-ORTHOGONAL-WIRE-AUTHORING-V1` should include:

- a selected-wire `Waypoint Mode` toggle
- click-on-wire insertion of anchors while `Waypoint Mode` is active
- multiple anchors per orthogonal wire
- draggable anchors
- orthogonal segment preservation between:
  - source
  - anchor chain
  - target
- grid-snapped anchor placement and movement
- reset-to-auto-route behavior that clears all anchors
- anchor cleanup when a wire is deleted

V1 should stay intentionally small:
- support up to 4 anchors per wire
- stay on the existing selected-wire surface
- avoid adding a second path editor or anchor-management panel

This slice is for orthogonal routing only.

---

## Interaction Model

### Selected Wire

The feature only activates for the currently selected wire.

### Waypoint Mode

When `Waypoint Mode` is on for a selected orthogonal wire:
- clicking near the selected wire inserts an anchor on the nearest valid orthogonal segment
- clicking additional points on the wire can insert more anchors
- dragging an anchor moves it
- the path updates live while preserving orthogonal structure

When `Waypoint Mode` is off:
- anchors are hidden
- the authored path still remains in effect

Do not overload the mode toggle with reset behavior.
Resetting to the automatic route should remain a separate explicit action.

### Anchor Editing

Anchors must:
- be visible only for the selected wire
- be fully interactive only while `Waypoint Mode` is active
- be visually obvious when the selected wire is editable
- be individually draggable
- remain snapped to the existing workspace grid

V1 anchor removal should be single and explicit:
- selecting an anchor and using `Backspace` / `Delete` removes that anchor

Do not introduce multiple competing removal gestures in V1.

---

## Routing Rules

1. Segments must remain orthogonal.
2. Anchors are persistent, per-wire UI metadata.
3. The route is defined by:
   - source anchor
   - zero or more authored anchors
   - target anchor
4. The rendering logic must preserve a predictable orthogonal chain between those points.
5. Clicking near the selected wire must resolve deterministically to the nearest valid segment.
6. The same click location on the same path should produce the same inserted segment choice.
7. Anchor positions must be stored as an ordered per-connection anchor list.
8. Existing lane preference should continue to matter only for unanchored or reset paths.

---

## Required Constraints

1. This slice must remain UI-only.
2. It must not change engine execution, export semantics, or signal behavior.
3. It must not introduce freehand or bezier routing.
4. It must not allow off-grid anchor placement.
5. It must not remove per-wire identity or selectability.
6. It must preserve wire deletion semantics:
   - deleting a wire deletes all of its anchors
7. It must not destabilize the reconnect flow that was just repaired.
8. It must work with the existing selected-wire toolbar model.
9. It must not reintroduce hover-driven reconnect instability; reconnect targeting must remain geometry-stable.
10. Anchor insertion must use a bounded hit tolerance so it feels forgiving without causing accidental insertions.
11. V1 must not exceed 4 anchors per wire.
12. The selected-wire toolbar must stay minimal:
   - `Waypoint Mode`
   - `Reset Path`
   - no separate anchor-management palette

---

## Explicitly Avoid In V1

Do not include:
- arbitrary path drawing
- bezier handles
- per-segment styling
- semantic wire grouping
- automatic obstacle avoidance
- hidden anchors that only exist in data
- topology-changing bridge glyphs
- a second unrelated wire editor surface

---

## Persistence

Anchors must round-trip through the same workspace-local UI metadata paths used by other connection authoring features.

They must persist through:
- refresh
- save/load
- workspace history and versions
- workspace artifact export/import
- shareable lab pack persistence

---

## Implementation Guidance

Good directions:
- treat wire authoring as "click on the wire to place structure"
- keep the selected-wire toolbar as the entry point for mode toggling and reset
- make anchor visibility and editability obvious only when relevant
- preserve the stable reconnect targeting behavior already repaired
- keep the first implementation small enough that it still feels like wire authoring, not path programming

Bad directions:
- reintroducing a hidden placement mode that finalizes unexpectedly
- requiring the user to hunt for a tiny handle before anything meaningful happens
- making the path-authoring interaction more abstract than the wire itself
- broadening into generic CAD behavior
- adding multiple overlapping ways to add, remove, or manage anchors

---

## Exit Condition

This contract is complete when:
- adding anchors feels obvious from the first click
- moving anchors feels stable and grid-snapped
- multiple anchors can guide a wire cleanly around dense regions
- the route remains orthogonal and visually legible
- reset-to-auto-route clears the authored anchor chain
- the slice improves path authoring without making the workbench feel heavier
