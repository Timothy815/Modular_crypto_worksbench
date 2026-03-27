# WIRE-LEGIBILITY-ERGONOMICS-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded ergonomics slice for making dense connection structure easier to read in the workspace.

This line is meant to improve graph legibility during authorship and inspection, especially as workspaces become larger and more connected.

It is not a routing redesign and not a new graph-layout system.

---

## Problem

Recent `v2.1` work has improved:
- cluster duplication and deletion
- workspace history and versioning
- zoom / fit / reset / focus recovery
- direct rewiring
- parameter authoring and comparison
- primitive-local micro demos

That means the next friction is less about creating structure and more about reading it.

In denser workspaces, it can still be hard to:
- follow a specific wire visually
- understand the immediate fan-in / fan-out of a selected node
- keep local path context clear while editing or inspecting a graph

MCW currently has explicit structure, but the visual emphasis on that structure can still be improved.

---

## Strategic Position

This is the right kind of ergonomics work for the current stage of the product:
- high leverage
- low conceptual risk
- directly supportive of authoring and analysis

It should stay in the workspace-legibility lane, not drift into auto-routing or generic diagram-tool behavior.

---

## Desired Shape

The first slice should support:
- selecting a wire directly
- clearer visual emphasis for the selected wire
- clearer visual emphasis for the immediate neighborhood of a selected node
- easier reading of local upstream / downstream connection context

The goal is to make explicit structure easier to see, not to hide or transform it.

---

## Recommended First Slice

The first slice should stay narrow and read-focused:
- click a wire to select it
- highlight that wire clearly
- when a node is selected, emphasize its directly connected incoming and outgoing wires
- de-emphasize unrelated wires enough to improve local readability without making the rest of the graph disappear

For V1, this should be limited to:
- one selected wire at a time
- one-hop incoming / outgoing wire emphasis for a selected node only
- visual emphasis and de-emphasis only, with no change to graph meaning or execution behavior

This slice should not attempt recursive path tracing.
It should not try to unify wire emphasis with execution-trace emphasis yet.

This should improve graph reading without changing graph meaning.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- auto-routing
- path bundling
- edge labels everywhere
- minimap expansion
- hidden path collapse / expand systems
- animation-heavy path tracing
- editing wires by dragging their midpoints
- broad canvas redesign
- multi-wire selection
- recursive path highlighting
- new persistent history semantics beyond normal workspace selection state

---

## Product Fit

This family would support:
- easier visual inspection of dense machines
- better local comprehension during authoring
- stronger connection between execution understanding and workspace reading

It compounds well with the already-shipped zoom, focus, trace, and rewiring improvements.

---

## Recommendation

Treat this as the next bounded ergonomics slice unless a more urgent reading bottleneck appears during normal use.

It is a natural continuation of the current `v2.1` authorship / legibility line.

---

## Exit Condition

This contract is complete when:
- the next wire/path readability problem is named clearly
- the first slice is bounded to visual legibility rather than routing behavior
- the project can move into implementation without drifting into generic graph-editor sprawl
