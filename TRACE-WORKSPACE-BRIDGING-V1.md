# TRACE-WORKSPACE-BRIDGING-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded ergonomics slice for making execution trace state easier to read inside the live workspace.

This line is meant to strengthen the connection between:
- the execution-order / analysis surfaces
- and the visible graph on the canvas

It is not a new execution mode and not an animation-heavy visualization system.

---

## Problem

Recent `v2.1` ergonomics work has improved:
- zoom / fit / reset / focus recovery
- trace-driven focus jumps into the workspace
- wire selection and one-hop local wire legibility

That means the next friction is no longer simply getting back to the right place in the graph.

The remaining gap is:
- seeing which part of the visible graph is currently active during stepping
- understanding the immediate local path around the active trace node
- keeping the execution trace and workspace reading connected without bouncing mentally between two separate views

MCW already exposes execution honestly. The next improvement is to help the workspace express that active state more clearly.

---

## Strategic Position

This is a natural continuation of the current workspace-legibility line.

It should remain:
- visual
- bounded
- execution-faithful

It should not drift into cinematic signal playback, recursive whole-graph glow effects, or a separate analysis visualization layer.

---

## Desired Shape

The first slice should support:
- clearer workspace emphasis for the currently active trace node
- clearer workspace emphasis for the immediate local wires around that active node
- tighter visual correspondence between trace selection and workspace emphasis

The goal is to make the current step easier to understand in the existing graph, not to create a new way of running the graph.

---

## Recommended First Slice

The first slice should stay narrow:
- when a trace entry is active, emphasize the active node in the workspace
- emphasize its one-hop incoming and outgoing wires
- allow trace-driven emphasis to coexist with the new wire-selection / node-selection legibility work
- prefer subtle, readable visual focus over aggressive animation

For V1, this should be limited to:
- one active trace node at a time
- one-hop incoming / outgoing wire emphasis only
- visual emphasis only, with no changes to execution order or trace semantics

This slice should not attempt recursive path tracing.
It should not collapse trace emphasis and wire selection into one unified interaction model.
When both states exist, direct wire selection should remain the stronger explicit signal for that wire, while trace emphasis continues to read as step-context.

This should improve live comprehension without changing execution meaning.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- animated signal playback across the whole graph
- recursive path highlighting
- unifying all trace, selection, and wire states into one overloaded interaction model
- multi-step trace trails
- graph replay timelines
- new execution semantics
- analysis-only alternate canvases

---

## Product Fit

This family would support:
- easier step-by-step understanding of machine behavior
- stronger connection between analysis and authored structure
- more legible debugging of larger machines

It compounds well with the already-shipped focus, zoom, trace selection, and wire-legibility work.

---

## Recommendation

Treat this as the next bounded ergonomics slice unless a more urgent authoring bottleneck appears during normal use.

It is a natural follow-on to `WIRE-LEGIBILITY-ERGONOMICS-V1`.

---

## Exit Condition

This contract is complete when:
- the next trace-to-workspace readability problem is named clearly
- the first slice is bounded to visual bridging rather than execution redesign
- the project can move into implementation without drifting into analysis spectacle
