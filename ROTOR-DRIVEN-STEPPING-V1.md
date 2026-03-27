# ROTOR-DRIVEN-STEPPING-V1

Last updated: March 27, 2026

Status: Implemented on `feature/rotor-driven-stepping`

---

## Purpose

Define the first bounded follow-on after linked rotor pairing for rotor-control behavior driven by visible machine logic.

This slice is meant to deepen rotor realism beyond:
- simple per-tick stepping
- explicit turnover outputs
- manually wired Enigma-style double-step behavior

It is not meant to introduce a generic state-machine runtime or hidden historical presets.

---

## Problem

MCW already supports:
- explicit rotor stepping from `clock`
- visible `turnover` output
- manually wired gate / OR control paths
- one bounded three-rotor double-step teaching surface

What it does not yet support cleanly is:
- reusable rotor-control submachines
- bounded rotor-driven stepping patterns where one rotor bank visibly determines the cadence of another
- a cleaner authoring surface for historically richer machines such as SIGABA-like control banks

Right now the idea exists in spirit, but only as ad hoc graph wiring. There is not yet a first-class bounded control shape for it.

---

## Strategic Position

This is the next deeper rotor-mechanics line after:
1. `ROTOR-REVERSE-PATH-V1`
2. `LINKED-ROTOR-PAIRING-V1`

It should remain clearly separate from:
- generic conditional composition
- iterator control
- broad FSM / scripting behavior

This is a rotor-control slice, not a general programming model.

---

## Core Question

What is the smallest reusable rotor-control pattern that makes rotor-driven stepping easier to author without hiding the control structure?

---

## Recommended V1 Product Shape

V1 should stay narrow and focus on one explicit control pattern:
- a visible rotor-control bank that emits step pulses for a separate rotor bank

The first slice should prefer:
- explicit `bits` step pulses
- explicit visible control paths
- explicit bounded rotor-bank wiring

It should not try to encode every historical stepping scheme.

---

## Recommended First Slice

The first slice should support one bounded authoring model:
- designate one rotor family as the control bank
- let its visible outputs contribute to a step pulse for another rotor family
- make that pattern easier to build, inspect, and teach than today's manual ad hoc wiring

The likely V1 shape is **not** a new executor model.

It is more likely one of:
- one new bounded rotor-control helper primitive
- one bounded composite/starter pattern built from existing `Clock`, `Gate`, `OR`, `Rotor`, and linked rotor pairs
- or one small rotor-specific helper plus existing control primitives

The key requirement is that the resulting stepping logic stays graph-visible.

---

## Scope

Include:
- one bounded rotor-driven stepping pattern
- explicit visible pulse flow into rotor `clock` inputs
- one updated rotor-control demo / tutorial surface
- engine and validation support only if strictly required by the bounded pattern

Exclude:
- SIGABA as a full preset machine
- arbitrary rotor-bank schedulers
- hidden stepping scripts
- changes to the DAG execution model
- general finite-state-machine abstractions
- bundling multi-way routing / conditionals / iterators into the same milestone

---

## Non-Goals

This slice should explicitly avoid:
- machine-specific hardcoding in the executor
- hidden state coupling between unrelated rotors
- symbolic control languages
- recursive or unbounded control flow
- broad timing-model redesign
- pretending this is “historical machine support” in general

---

## Existing Proven Ground

The current codebase already proves the following pieces:
- `Rotor.turnover` as explicit one-bit control output
- signal-driven advancement via `clock`
- shared clocks across stateful modules
- gate-controlled dependent clocking
- visible OR-composed rotor double-step logic

That means V1 should build on proven explicit pulse semantics, not invent a second control model.

---

## Desired V1 Behavior

For the first slice:
- control rotors or control paths should visibly generate the step pulses
- target rotors should still advance only through normal `clock` inputs
- users should be able to inspect the stepping logic in the graph without hidden scheduler rules
- the stepping pattern should be teachable as machine structure, not folklore

In product terms:
- visible control bank
- visible pulse routing
- visible driven rotor bank

---

## Teaching Surface

V1 should update or add one bounded teaching surface, likely derived from the current `Advanced Rotor Stepping` line.

The teaching surface should show:
- where the base pulse begins
- how rotor/control state modifies that pulse
- which rotor bank receives the final stepping signal

It should not attempt to explain every historical variant at once.

---

## Success Criteria

This slice is successful when:
- rotor-driven stepping is easier to author than today's ad hoc wiring
- the stepping logic remains graph-visible
- the product gains one bounded reusable rotor-control pattern
- the slice stays clearly separate from generic control-flow expansion

---

## Recommendation

This is the right next rotor-mechanics line after linked pairing, but only if kept narrow.

The correct V1 target is:
- **one bounded reusable rotor-control pattern**

Not:
- a broad rotor-systems overhaul
- not “SIGABA support” as a giant umbrella
- not a new execution architecture

---

## Implemented Outcome

V1 shipped as one built-in reusable composite:
- `RotorDoubleStepControl`

It packages one explicit pulse pattern:
- `turnoverA OR turnoverB`
- gated against the base `pulse`
- emitted as one visible `step` pulse

This was applied to the `Advanced Rotor Stepping` demo/tutorial as the reusable middle-rotor double-step control path, while keeping the left rotor's single-turnover gate explicit.
