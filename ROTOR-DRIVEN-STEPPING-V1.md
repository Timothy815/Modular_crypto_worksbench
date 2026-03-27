# ROTOR-DRIVEN-STEPPING-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded future control / state architecture line for rotor-driven stepping behavior.

This line is meant to support machines where one rotor family or control path determines the stepping amount, sequence, or cadence of another rotor family, closer to SIGABA-style control than simple Enigma stepping.

It is not the current active implementation path.

---

## Problem

MCW already supports visible stepped execution and rotor stepping.

What it does not yet support cleanly is:
- stepping behavior derived from other rotor outputs or rotor state
- explicit rotor-control submachines that influence how another rotor bank advances

That limits more advanced historical and systems-level rotor machines.

This is not just a new primitive. It touches state coupling, control semantics, and tick behavior.

---

## Strategic Position

This is a meaningful future line, but it is larger and riskier than reverse rotor traversal.

It should not be bundled into `ROTOR-REVERSE-PATH-V1`.
It deserves its own contract because it may affect execution semantics and control architecture more deeply.

---

## Desired Shape

The first slice should eventually support:
- explicit control paths that influence stepping
- rotor-driven or state-driven advancement of other rotor structures
- visible control semantics rather than hidden machine-specific magic

Any implementation must preserve MCW's explicit-machine philosophy.

---

## Recommended First Slice

When this line is revisited, the first slice should stay narrow:
- one bounded rotor-control pattern
- explicit visible control inputs and stepping outputs
- no attempt to model every historical stepping scheme at once

The first question later will be whether this is best represented by:
- new control primitives
- rotor-specific stateful modules
- or a hybrid of existing control primitives plus a bounded rotor extension

This contract does not resolve that yet.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- a general finite-state-machine overhaul
- hidden stepping scripts
- machine-specific special cases hardcoded into the executor
- bundling reverse traversal and control stepping into one oversized milestone
- broad timing-model redesign

---

## Product Fit

This family would support:
- more advanced rotor-machine realism
- control-driven stepping patterns
- historically richer machines such as SIGABA-like constructions
- visible machine-scheduling behavior inside the graph

---

## Recommendation

Keep this on the docket, but behind `ROTOR-REVERSE-PATH-V1`.

It should be discussed fairly soon, but only after the project is ready to take on a deeper state/control slice.

---

## Exit Condition

This contract is complete when:
- the rotor-driven stepping idea is preserved cleanly
- it is kept distinct from simpler reverse traversal work
- the project can revisit this later without accidentally collapsing it into a vague rotor wishlist
