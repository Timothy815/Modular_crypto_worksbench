# MULTIWAY-ROUTING-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded future primitive-expansion line for explicit multi-way routing.

This line is meant to increase MCW's visible control-flow expressiveness without collapsing into hidden branching, symbolic scripting, or a general-purpose programming model.

It is not the current active implementation path.
It is a future docket item to revisit after the current ergonomics / authorship line justifies a new primitive family.

---

## Problem

MCW already has visible binary routing primitives:
- `Mux` (choose one of two inputs)
- `Demux` (route one input to one of two outputs)
- `Gate` (allow or block a path with one-bit control)

Those are useful, but they do not yet express an explicit multi-way "switch / case" style routing decision.

There is currently no primitive that visibly says:
- route one input to one of `N` outputs based on a multi-bit control word
- or choose one of `N` inputs based on a multi-bit control word

That limits some finite-state, staged-routing, and explicit scheduling machines.

A simple motivating example is:
- `Counter(width = 3)` driving an 8-way routing decision
- one active route at a time
- a visible progression through eight explicit destinations as the counter advances

That is meaningfully different from composing multiple binary `Demux` modules by hand. It deserves its own future contract consideration.

---

## Strategic Position

This is a primitive-family expansion item, not an ergonomics item.

It should not replace the current recommended path around workspace legibility, authoring power, or other immediate usability work.

The value of this contract is to record the idea cleanly now so that future implementation does not drift into an underspecified or overpowered control primitive.

---

## Proposed Family

This future line likely contains two related primitives.

### 1. Multi-Way Router

One input, many outputs.
A multi-bit control word selects exactly one output.

This is the direct multi-way generalization of `Demux` and is the strongest first candidate because it matches the motivating counter-driven use case.

### 2. Multi-Way Selector

Many inputs, one output.
A multi-bit control word selects exactly one input.

This is the direct multi-way generalization of `Mux`.

---

## Recommended First Slice

If this family is implemented, the first slice should focus on the **Multi-Way Router** only.

Reason:
- it directly matches the user's described case-switch / staged-routing need
- it keeps the first slice smaller
- it builds naturally on the already-shipped `Demux`, `Gate`, `Counter`, and state/timing vocabulary

The multi-way selector variant should be treated as a follow-on unless implementation reveals that both are truly inseparable.

---

## Desired V1 Behavior

For the first multi-way router slice:
- one `bits` input carries the routed data
- one `bits` input carries the control word
- the number of outputs is parameterized as a bounded small set, likely `2`, `4`, or `8`
- control width must match the number of outputs exactly (`1`, `2`, or `3` bits respectively)
- exactly one output is active for any valid control value
- inactive outputs emit zero-valued words of the same width as the routed input
- routing behavior is deterministic and fully explicit

This should read like a visible indexed case switch, not like hidden procedural branching.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- symbolic control values
- auto-generated branching trees
- arbitrary unbounded output counts
- hidden script semantics
- implicit width conversion
- control-word coercion
- generalized finite-state-machine infrastructure
- many-input / one-output selector support in the same first slice unless absolutely necessary

---

## Product Fit

This family would support visible:
- stage scheduling
- finite explicit routing
- counter-driven output sequencing
- controlled branch selection in larger graphs
- switch/case style graph behavior without hiding the machine

That makes it a plausible future addition to MCW as a cryptographic systems IDE, provided the slice stays bounded and remains visibly inspectable.

---

## Recommendation

Keep this on the near-future menu, but do not treat it as the next immediate implementation step.

The right posture is:
- record it now
- keep the scope narrow
- revisit it after the current ergonomics / workspace-legibility line justifies another primitive-family expansion

---

## Exit Condition

This contract is complete when:
- the future primitive-family shape is named clearly
- the first slice is bounded to a multi-way router
- the non-goals prevent the feature from becoming hidden control flow or programming-language drift
- the project can safely revisit the idea later without re-litigating the problem definition
