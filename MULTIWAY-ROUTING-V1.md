# MULTIWAY-ROUTING-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded primitive-expansion line for explicit multi-way routing.

This line is meant to increase MCW's visible control-flow expressiveness without collapsing into hidden branching, symbolic scripting, or a general-purpose programming model.

It is now the active primitive-expansion path after the current ergonomics / authorship line.

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

The first slice focuses on the **Multi-Way Router** only.

Reason:
- it directly matches the user's described case-switch / staged-routing need
- it keeps the first slice smaller
- it builds naturally on the already-shipped `Demux`, `Gate`, `Counter`, and state/timing vocabulary

The multi-way selector variant stays a follow-on.

---

## Desired V1 Behavior

For the first multi-way router slice:
- the primitive is named `MultiRouter`
- it has one `bits` data input named `in`
- it has one `bits` control input named `select`
- it exposes fixed visible outputs `out0` through `out7`
- it uses a bounded `routeCount` param with exact allowed values `2`, `4`, or `8`
- only the first `routeCount` outputs are considered active routing destinations
- control width must match `routeCount` exactly:
  - `2` routes requires `1` control bit
  - `4` routes requires `2` control bits
  - `8` routes requires `3` control bits
- the routed input is an arbitrary-width `bits` word
- exactly one active destination receives the routed input for any valid control value
- every inactive output emits a zero-valued word of the same width as the routed input
- outputs beyond the active `routeCount` also emit zero-valued words of that same width
- routing behavior is deterministic and fully explicit

### Static Port Constraint

MCW module ports are currently static, not parameterized per instance.

Because of that, V1 does **not** attempt a dynamically sized output port set.
Instead, `MultiRouter` always exposes `out0` through `out7`, and `routeCount` determines how many of those visible ports participate in the active routing domain.

This is an intentional V1 adaptation to the current engine architecture, not a temporary hack to be hidden from users.

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
- many-input / one-output selector support in the same first slice
- dynamic per-instance port creation
- rename or redesign of existing `Mux` / `Demux` behavior
- broad conditional-composition semantics

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

## Teaching Surface

V1 should ship with one bounded teaching surface:
- one palette-local micro demo
- focused on a counter-driven visible route progression
- not a second demo-library expansion and not a new tutorial/challenge line

The micro demo should show:
- a `Counter`
- one `MultiRouter`
- one visible data input
- a small set of visible outputs so the active route progression is obvious

---

## Exit Condition

This contract is complete when:
- the primitive-family shape is named clearly
- the first slice is bounded to one `MultiRouter`
- the non-goals prevent the feature from becoming hidden control flow or programming-language drift
- the static-port adaptation is explicit
- the project can safely implement the primitive without re-litigating the problem definition
