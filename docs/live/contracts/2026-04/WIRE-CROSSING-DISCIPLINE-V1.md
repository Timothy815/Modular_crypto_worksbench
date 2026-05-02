# WIRE-CROSSING-DISCIPLINE-V1

Last updated: April 5, 2026

---

## Purpose

Define a bounded wire-readability follow-on for making dense wire crossings easier to parse in large workspaces.

This is a presentation and hierarchy slice.
It is not a routing rewrite, not a topology simplifier, and not a new interaction model.

---

## Problem

`WIRE-LEGIBILITY-VISUAL-DISCIPLINE-V1` improved overall wire readability in dense workspaces:
- active paths read more clearly
- unrelated wires recede better
- nearby parallel orthogonal runs separate more cleanly

The next remaining readability problem is crossings.

In dense graphs, crossings are still where local comprehension breaks down fastest:
- the active path can visually dissolve into the background at intersections
- hovered paths do not always read clearly enough against nearby runs
- trace/compare/invalid authority can be technically present but still feel visually muddy at busy crossing points

The graph remains correct, but the eye has to work too hard.

---

## Desired Outcome

Crossings should read with a clearer hierarchy:
- selected wire first
- other authoritative states next
- background wires last

The goal is not to make crossings disappear.
The goal is to make them visually parseable without hiding structure.

---

## V1 Scope

`WIRE-CROSSING-DISCIPLINE-V1` should stay tightly bounded to crossing readability only.

The slice should include:
- clearer crossing dominance for the selected wire
- stronger hovered-wire readability where it intersects nearby runs
- cleaner authority for trace, compare, and invalid wire states at crossings
- calmer visual presence for unrelated background wires at intersections

This should be achieved through stroke hierarchy, underlay treatment, and crossing-specific visual emphasis only.

---

## Required Constraints

1. This slice must remain UI-only.
2. It must not change routing, topology, or graph semantics.
3. It must not alter execution, export, or persistence behavior.
4. It must preserve per-wire identity and selectability at all times.
5. It must work in all shipped wire color modes:
   - `Domain`
   - `Neutral`
   - `High Contrast`
6. Selected, trace, compare, and invalid states must remain visually authoritative.
7. Crossing treatment must stay crisp and light-weight; avoid blurry or heavy filter stacks.

---

## Explicitly Avoid In V1

Do not include:
- automatic crossing rerouting
- bridge/jump glyphs that change the apparent topology
- hidden wire bundling
- multi-wire grouping
- new wire-editing affordances
- path animation
- wire labels at every crossing

---

## Implementation Guidance

Good directions:
- strengthen authoritative underlay treatment at intersections
- ensure hovered paths read more clearly against nearby runs
- reduce the visual weight of unrelated crossing traffic
- keep crossing emphasis consistent with the already-shipped visual-discipline slice

Bad directions:
- inventing a second routing system for crossings
- overusing blur or glow
- creating a “candy” look that makes the workspace noisier instead of clearer

---

## Exit Condition

This contract is complete when:
- dense crossings are easier to parse at a glance
- selected and hovered wires remain easy to follow through intersections
- trace/compare/invalid wires read clearly when they cross background traffic
- the slice stays bounded to presentation-layer hierarchy only
