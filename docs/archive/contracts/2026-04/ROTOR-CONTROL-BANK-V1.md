# ROTOR-CONTROL-BANK-V1

Last updated: March 27, 2026

Status: Shipped on `main`.

---

## Purpose

Define the first bounded follow-on after `ROTOR-DRIVEN-STEPPING-V1` for rotor-driven stepping where one visible rotor bank contributes control pulses for a separate visible driven rotor bank.

This is the next step toward SIGABA-like authored machines, but it is **not** a claim of full SIGABA support.

The goal is to make:
- one visible control bank
- one visible driven bank
- one visible pulse-routing layer between them

feel authorable and teachable without introducing a hidden scheduler.

---

## Problem

MCW now supports:
- explicit rotor stepping from `clock`
- explicit `turnover` outputs
- linked forward/reverse rotor faces
- one reusable rotor-control helper:
  - `RotorDoubleStepControl`

What it does not yet support cleanly is:
- a bounded authored pattern where one rotor bank visibly influences the stepping cadence of another rotor bank
- a reusable control-bank teaching surface closer to historical control-bank machines
- a cleaner authored alternative to hand-wiring every intermediate pulse path from scratch

Right now the engine is compatible with this idea, but the authoring surface is still too manual for it to read as a real product capability.

---

## Strategic Principle

**Visible control bank, visible driven bank, visible pulse routing.**

That means:
- control rotors remain ordinary visible rotors
- driven rotors remain ordinary visible rotors
- the stepping influence between them is expressed through explicit `bits` outputs and explicit `clock`-pulse paths
- the executor must not gain a hidden rotor-bank scheduler

---

## Core Question

What is the smallest reusable authored pattern that lets one rotor bank drive the stepping of another rotor bank without hiding the control logic?

---

## Recommended Product Shape

V1 should stay narrow and support one bounded authored control-bank pattern:
- one small control bank
- one small driven bank
- one explicit pulse-composition layer between them

The likely V1 shape is **not** a new primitive family.

It is more likely:
- one new reusable starter composite built from existing rotor/control primitives
- one updated demo and one tutorial showing the pattern
- perhaps one small helper only if the composite route proves insufficient

The stepping logic must remain visible and unzip-able.

---

## Recommended First Slice

The first slice should support one bounded control-bank pattern such as:
- a small control rotor bank emits turnover-derived bits
- those bits are combined through explicit visible pulse logic
- the result steps a separate driven rotor bank

The slice should prefer:
- existing `Rotor`, `RotorReverse`, `Clock`, `Gate`, `OR`, `MultiRouter`, and linked rotor behavior where useful
- reusable composite packaging over new executor semantics
- one well-explained pattern, not a menu of historical presets

This should read as:
- "here is how one rotor set can visibly control another"

not:
- "here is a hidden SIGABA mode"

---

## Scope

Include:
- one bounded authored control-bank rotor pattern
- explicit pulse flow from control bank to driven bank
- one reusable composite or equivalent visible helper if needed
- one updated demo / tutorial teaching surface
- validation or runtime support only if strictly required by the bounded pattern

Exclude:
- full SIGABA fidelity
- arbitrary control-bank schedulers
- machine presets with hidden stepping rules
- executor redesign
- generalized FSM or scripting behavior
- bundling conditional-composition or iterator-control work into the same slice

---

## Non-Goals

This slice should explicitly avoid:
- hidden control-bank wiring
- implicit derived clocks with no visible path
- historical-brand-name support as a marketing umbrella
- arbitrary many-bank coordination
- recursive or unbounded control flow
- converting rotor control into a generic programming model

---

## Existing Proven Ground

The current codebase already proves:
- rotor turnover as explicit one-bit output
- signal-driven stepping through normal `clock` inputs
- linked forward/reverse rotor identity
- reusable explicit pulse packaging through `RotorDoubleStepControl`
- bounded multi-way visible routing through `MultiRouter`

That means V1 should extend proven pulse semantics, not invent a second control architecture.

---

## Desired V1 Behavior

For the first control-bank slice:
- control rotors visibly emit the bits that matter
- pulse-composition logic is visible in the graph
- driven rotors still advance only through standard `clock` inputs
- users can inspect the control bank, the pulse logic, and the driven bank as three separate visible layers
- the resulting machine is teachable as a mechanical system, not folklore

In product terms:
- visible control bank
- visible pulse-routing layer
- visible driven bank

---

## Teaching Surface

V1 should add one bounded rotor-control teaching surface that shows:
- where the base pulse begins
- which control-bank rotor outputs matter
- how those outputs are combined
- which driven rotors receive the final stepping signals

This teaching surface should be clearly "SIGABA-like" in spirit only if the copy says so carefully.
It should not claim historical completeness.

---

## Success Criteria

This slice is successful when:
- one rotor bank can visibly influence the stepping of another bank
- the resulting control logic is easier to author than pure ad hoc wiring
- the pattern remains graph-visible and unzip-able
- the slice stays clearly separate from executor redesign and generic control-flow expansion

---

## Recommendation

This should be the next rotor-mechanics follow-on after `ROTOR-DRIVEN-STEPPING-V1`.

The correct V1 target is:
- **one bounded visible control-bank pattern**

Not:
- full SIGABA support
- not a hidden rotor scheduler
- not a broad control-language overhaul

---

## Implemented Outcome

V1 shipped as one built-in reusable composite:
- `RotorControlBankRouter`

It packages one explicit control-bank pulse pattern:
- gate the base `pulse` with an `enable` bit
- route the surviving pulse between two outputs with a one-bit `select`
- emit visible `stepA` / `stepB` pulses for a separate driven rotor bank

This was applied to a new `Rotor Control Bank` demo/tutorial where:
- one visible control rotor emits the enable bit
- one visible control rotor emits the select bit
- one visible pulse-routing layer decides which driven rotor advances

The slice remains explicitly SIGABA-like in spirit only. It does not claim full historical fidelity.
