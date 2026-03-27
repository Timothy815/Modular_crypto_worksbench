# ROTOR-REVERSE-PATH-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded primitive / engine extension for explicit reverse traversal through rotor wiring.

This line is meant to make rotor-based machines more mechanically honest by allowing a signal to pass back through a rotor in the inverse direction, rather than forcing users to fake that behavior with unrelated wiring patterns.

It is not the current active implementation path.

---

## Problem

MCW already supports forward rotor-style symbolic permutation and visible stepping.

What it does not yet support directly is:
- traversing a rotor's active wiring in the reverse direction
- using the same stepped rotor state for both forward and reverse travel

That limits historically faithful machines such as Enigma-style forward / reflector / reverse traversal.

Without explicit reverse traversal, the user cannot represent the real signal path honestly.

---

## Strategic Position

This is a high-value future primitive / engine extension.

It deepens MCW as a cryptographic systems IDE without changing the product's identity.
It should be treated as a stronger near-future candidate than broad generic rotor expansion.

---

## Desired Shape

The first slice should support:
- explicit reverse traversal through a rotor
- the inverse of the rotor's current stepped mapping
- reuse of the rotor's current `position`, `ringOffset`, and `notches` behavior
- the same visible turnover output semantics already present on `Rotor`
- visible graph behavior that makes forward and reverse traversal distinguishable to the user

This should be mechanically faithful, not just behaviorally approximate.

---

## Recommended First Slice

The first slice should stay narrow:
- make reverse rotor traversal possible
- do not bundle in new rotor-control semantics
- do not bundle in SIGABA-style stepping
- do not redesign the entire rotor family

There are multiple possible product shapes:
- a dedicated reverse-rotor primitive
- a direction parameter on an existing rotor primitive

### Recommended V1 Product Shape

V1 should prefer a **dedicated reverse-rotor primitive** instead of a direction parameter on the existing `Rotor`.

Reason:
- it keeps forward and reverse travel graph-visible
- it preserves the current `Rotor` teaching surface
- it avoids overloading one primitive with hidden directional behavior
- it makes Enigma-style `Rotor -> Reflector -> Reverse Rotor` structure explicit in the graph

If implementation proves that sharing one engine helper is cleaner, that is fine internally, but the user-facing primitive shape should remain distinct in V1.

### Recommended V1 Behavior

For the first slice:
- add one new symbolic primitive, tentatively `RotorReverse`
- keep the same input/output surface as `Rotor`:
  - `in: symbol`
  - `clock: bits`
  - `out: symbol`
  - `turnover: bits`
- compute the inverse of the rotor's currently shifted wiring rather than the forward mapping
- keep advance behavior identical to `Rotor` when clocked
- keep turnover reporting identical to `Rotor`
- do not require any new execution-model semantics
- do not add hidden reflector behavior

This means the only new semantic is **direction of traversal through the same rotor state model**.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- rotor-driven stepping logic
- generalized reciprocal symbolic routing beyond the rotor family
- a full historical-machine package
- hidden auto-reflection semantics
- broad execution-model changes
- redesign of the existing `Rotor` parameter model
- bundling Enigma as a monolithic preset instead of visible graph structure
- introducing bidirectional symbolic signal semantics beyond this primitive pair

## Teaching Surface

V1 should ship with one bounded teaching surface:
- one demo that shows explicit `Rotor -> Reflector -> RotorReverse` traversal
- one tutorial or micro-demo-level explanation focused on why reverse traversal matters

It should not attempt:
- a full historical machine catalog
- a large rotor-teaching overhaul
- SIGABA-style stepping in the same slice

---

## Product Fit

This family would support:
- historically faithful Enigma-like machines
- visible forward / reflect / reverse signal paths
- stronger teaching value around why reciprocal traversal matters
- better expression of rotor-machine internals as explicit systems

---

## Recommendation

Keep this on the near-future docket and discuss it fairly soon.

This is a good candidate to revisit soon as the next rotor-realism primitive slice.

---

## Exit Condition

This contract is complete when:
- the reverse-traversal problem is recorded clearly
- the first slice is bounded to inverse traversal only
- the first slice is kept separate from rotor-driven stepping
- the preferred user-facing shape is explicit (`RotorReverse`, not hidden direction toggles)
- the project can revisit historically faithful rotor behavior without re-defining the goal
