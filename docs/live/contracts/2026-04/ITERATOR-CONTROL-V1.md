# ITERATOR-CONTROL-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded future control / repetition line for improving iterator behavior in MCW.

This line is meant to increase the expressive power of repeated explicit machines while preserving bounded, inspectable, graph-visible execution.

It is not the current active implementation path.

---

## Problem

MCW already has iterators and explicit repeated structure.

What it does not yet support cleanly is stronger iterator control behavior such as:
- more expressive bounded continuation control
- clearer explicit staging of repeated control decisions
- richer interaction between repeated structure and control signals

That limits some complex repeated machines, especially where repetition and control need to interact visibly.

---

## Strategic Position

This is one of the most powerful future lines in the product, and therefore one of the riskiest.

Iterator-control work can easily drift toward:
- hidden program flow
- script-like loops
- execution semantics that are harder to inspect than the rest of MCW

Because of that, it should be approached carefully and only in bounded slices.

---

## Desired Shape

Any future iterator-control slice should preserve:
- bounded repetition
- explicit control inputs
- visible repeated structure
- deterministic, inspectable execution

The goal is not “more looping.”
The goal is better visible control over repeated machine structure.

---

## Recommended First Slice

When revisited, the first slice should stay narrow:
- one bounded iterator-control behavior
- no unbounded continuation
- no recursion
- no hidden state machine inside the iterator layer

This line may later depend on stronger conditional composition or routing primitives, but it should not assume them yet.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- unbounded loops
- recursive graph execution
- hidden break / continue semantics
- script-style conditional execution inside iterators
- broad execution-model rewrites

---

## Product Fit

This family would support:
- more expressive repeated constructions
- clearer bounded control over staged machine behavior
- stronger authoring power for explicit multi-stage cryptographic systems

---

## Recommendation

Keep this on the docket, but behind the simpler control-structure items:
- `MULTIWAY-ROUTING-V1`
- `CONDITIONAL-COMPOSITION-V1`

It should be discussed soon, but implemented only after the control semantics are clarified enough to avoid drift.

---

## Exit Condition

This contract is complete when:
- iterator-control is recorded as a distinct future line
- its risks are named explicitly
- the project can revisit it later without collapsing it into vague “better loops” language
