# PORT-ORDER-AUTHORING-V1

## Goal

Let users reorder visible input and output ports per module instance so dense workspaces can be made cleaner without changing engine semantics.

## Product Shape

- Reordering is workspace UI metadata only.
- Engine port definitions and connection semantics do not change.
- The feature applies per instance, not globally per primitive definition.
- V1 is order-only. It does not move ports to different sides of the node.

## Why

Large authored machines get visually noisy when port order is fixed but local geometry wants a different presentation order. The right first move is to let the user reorder ports before introducing stronger side-layout or waypoint controls.

## Required Behaviors

1. A selected module with more than one input or output can reorder those visible ports in the inspector.
2. Reordering updates the workspace card immediately.
3. Connection anchors and rendered wires follow the new visible order.
4. Connection identity remains bound to the port name, not its visual slot.
5. Save/load, workspace history, versions, export/import, and shareable lab packs preserve the order overrides.
6. If a module definition changes and ports are added or removed, stored order must normalize safely:
   - known ports retain their relative authored order
   - unknown removed ports are dropped
   - newly introduced ports append in definition order
7. If the authored order matches the definition order, the override may collapse back to default metadata.

## Explicit Non-Goals

- No engine-level port-definition mutation.
- No per-port free placement.
- No moving individual ports between card sides.
- No new connection rules.
- No wire-path waypoint editing in this slice.

## Notes

This is the bounded precursor to any later port-side preset work. The point is to reduce crossings and make complex nodes read more clearly without turning MCW into a freeform diagram editor.
