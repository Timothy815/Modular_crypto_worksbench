# WIRE-LEGIBILITY-VISUAL-DISCIPLINE-V1

Last updated: April 4, 2026

---

## Purpose

Define a bounded workspace-legibility slice for making dense groups of wires read more clearly in complex workspaces.

This is a readability and visual-discipline pass.
It is not a routing rewrite, not a graph-layout solver, and not a CAD feature line.

---

## Problem

MCW can now organize large workspaces with:
- orthogonal routing
- manual wire bends
- lane preference
- group boxes
- guide rails
- stage labels
- minimap
- grid and guide snapping

Those tools help layout, but dense machines can still degrade into a visual wiring forest:
- parallel runs collapse into one visual corridor
- non-selected wires compete too strongly with the path you are trying to inspect
- crossings and tightly packed elbows can read as clutter rather than structure
- larger workspaces begin to feel like “rats nests” even when the underlying graph is sound

The next need is not more authoring power.
It is stronger visual discipline for existing wire structure.

---

## Strategic Position

This is the right next slice because it directly supports the product goal the user cares about now:
- make complex systems look as simple as possible

It stays in the workspace readability lane.
It should not drift into auto-layout, pathfinding, hidden aggregation, or conceptual compression of the graph itself.

---

## Desired Outcome

Dense workspaces should become easier to scan without changing graph meaning.

In practice, V1 should improve:
- separation between nearby parallel wire runs
- readability of selected and inspected paths
- visual de-emphasis of unrelated wires in busy regions
- crossing hierarchy where several wires share the same neighborhood

The graph should still remain explicit and honest.
Nothing should be hidden, collapsed, or semantically bundled.

---

## V1 Scope

`WIRE-LEGIBILITY-VISUAL-DISCIPLINE-V1` should stay bounded to visual treatment only.

The slice should include:
- stronger visual priority for the selected wire and its immediate local run
- calmer treatment for non-selected wires in dense regions
- slightly clearer separation for nearby parallel orthogonal segments
- cleaner crossing hierarchy so important paths do not visually dissolve into the background
- no change to execution, validation, or workspace document semantics

This can include modest stroke, opacity, underlay, or spacing adjustments.
It may also include local heuristics for how nearby parallel segments are visually offset or separated, as long as those heuristics stay presentation-only.

---

## Required Constraints

1. This slice must remain UI-only.
2. It must not alter project graph semantics, execution, or exported behavior.
3. It must not introduce new path editing controls.
4. It must not introduce hidden wire grouping, collapsing, or expansion.
5. It must not require users to opt into a new editor mode.
6. It must work with existing:
   - curved routing
   - orthogonal routing
   - manual bend overrides
   - lane preference
   - wire color modes
   - per-wire color overrides
7. Selected, trace, compare, and invalid states must remain visually authoritative.
8. Active path dominance must be preserved through layering so selected and other authoritative states are never visually buried by background treatments.
9. Any visual separation of nearby orthogonal runs must be deterministic and derived from existing connection-local data so paths do not jitter during dragging or refresh.
10. The slice must read clearly in all shipped wire color modes:
    - `Domain`
    - `Neutral`
    - `High Contrast`
11. Even when visual treatment makes nearby wires read more distinctly, each connection must remain individually selectable and keep its discrete source/target identity.

---

## Explicitly Avoid In V1

Do not include:
- full path bundling algorithms
- automatic wire merging
- edge labels on every wire
- recursive path tracing
- route simplification that changes apparent topology
- solver-driven deconfliction
- new interaction models for wires
- new persistence fields unless absolutely required for a presentation-only toggle

---

## Implementation Guidance

Prefer local presentation heuristics over new abstract systems.

Good implementation directions:
- adjust base and selected stroke treatment in busy regions
- give non-selected wires more disciplined fade behavior without making them disappear
- improve how parallel orthogonal segments visually separate when they are very close
- treat wire crossings so the active or more relevant path reads first
- keep any crossing treatment crisp and light-weight rather than blurry or filter-heavy

Bad implementation directions:
- inventing a hidden routing layer
- adding global “bundle mode” complexity
- creating a second wire semantics system in CSS or state
- relying on heavy SVG filter stacks that create blur corridors or obvious performance drag

---

## Product Fit

This slice supports:
- large algorithm workspaces
- round-based constructions
- hybrid symbolic/bit pipelines
- classroom explanations where visual clarity matters as much as correctness

It compounds with the already-shipped:
- wire selection
- wire lane preference
- manual bends
- guide rails
- stage labels
- selected-cluster alignment

---

## Exit Condition

This contract is complete when:
- dense workspaces read more clearly without changing their structure
- selected paths remain easy to follow in crowded areas
- unrelated wires recede enough to reduce clutter
- the implementation stays bounded to readability rather than routing behavior
