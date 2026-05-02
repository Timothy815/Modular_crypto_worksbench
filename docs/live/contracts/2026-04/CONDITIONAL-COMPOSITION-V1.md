# CONDITIONAL-COMPOSITION-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded future control-structure line for explicit conditional composition in MCW.

This line is meant to support visible finite conditional behavior such as:
- `if / else`
- `case`-style branching
- bounded branch selection between explicit graph fragments

It is not the current active implementation path.

---

## Problem

MCW already has control-oriented primitives such as:
- `Gate`
- `Mux`
- `Demux`
- `Equals`
- `AtLeast`
- `Counter`

Those primitives are useful, but they currently express condition and routing only at a relatively local level.

There is not yet a clean higher-level way to represent:
- one visible branch vs another visible branch
- bounded finite conditional composition across graph fragments
- explicit “this path runs when the condition is true, that one when it is false” behavior

That limits some control-rich machines.

---

## Strategic Position

This is an important future line, but it must remain finite, explicit, and graph-visible.

It should not drift into hidden scripting, general-purpose control flow, or a programming-language layer inside MCW.

---

## Desired Shape

The first slice should support:
- explicit bounded conditional structure
- graph-visible branches
- visible control inputs
- deterministic behavior with no hidden execution semantics

This should make finite branch structure easier to author without hiding the machine.

---

## Recommended First Slice

The first slice should stay narrow:
- one bounded conditional-composition form
- visible branch selection only
- no unbounded branching logic
- no hidden evaluation rules

This may later build on top of multi-way routing rather than replace it.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- a scripting layer
- hidden execution of inactive branches
- recursion
- unbounded loops
- generalized programming-language constructs
- collapsing multiple future control ideas into one contract

---

## Product Fit

This family would support:
- clearer explicit control-flow composition
- bounded branch selection in larger machines
- more expressive control-rich cryptographic systems
- visible machine logic without abandoning MCW’s explicit-machine philosophy

---

## Recommendation

Keep this on the near-future docket, adjacent to `MULTIWAY-ROUTING-V1`.

It should be discussed fairly soon, but only as a bounded finite-control line.

---

## Exit Condition

This contract is complete when:
- the bounded conditional-composition idea is recorded clearly
- it is kept distinct from general programming-language drift
- the project can revisit it later without re-litigating the problem definition
