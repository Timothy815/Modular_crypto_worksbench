# PYTHON-EXPORT-ROTOR-CONTROL-V1

Last updated: March 28, 2026

Status: Implemented on `main`

---

## Purpose

Define the next bounded rotor-family Python export slice after the shipped rotor return-path export.

This contract is the follow-on to:
- `PYTHON-EXPORT-ROTOR-RETURN-PATH-V1.md`

The previous slices proved:
- bounded forward `Rotor` export
- bounded `Reflector` + `RotorReverse` export
- linked forward/reverse state shadowing parity
- readable historical return-path code generation

The next export frontier is bounded rotor control.

---

## Product Goal

Allow a user to export one compatible ticked workspace containing a bounded turnover-driven rotor stepping pattern as one standalone Python file with parity against MCW ticked execution.

This is **rotor control export**, not full historical-machine export.

---

## Strategic Position

The export line can now handle:
- stateless primitives
- temporal state with `Clock`, `Counter`, and `LFSR`
- bounded forward `Rotor`
- bounded `Rotor -> Reflector -> RotorReverse` paths

The next identity-defining step is:
- exported turnover-driven stepping behavior

That is the first slice where exported Python starts to express not just rotor traversal, but visible rotor-to-rotor control consequences.

But this slice must stay narrow.

It should prove:
- turnover-signal propagation parity
- gated rotor stepping parity
- readable explicit tick-end advance behavior across more than one rotor

It should not try to prove:
- full Enigma bank export
- full SIGABA-style control-bank export
- reusable exported rotor-control composite libraries
- arbitrary multi-rotor scheduling semantics

---

## Core Question

What is the smallest rotor-control export slice that proves MCW can generate faithful turnover-driven stepping behavior in Python without collapsing into a hidden scheduler?

---

## Required V1 Shape

This slice must:
- reuse the shipped temporal Python artifact model
- preserve one standalone `.py` file
- preserve one explicit `run_ticks()` loop
- preserve evaluate-before-advance ordering for the whole tick
- preserve one final non-topological advance pass after all evaluation and sink capture
- preserve stable per-tick sink output formatting
- preserve systematic generated module comments
- add only the bounded runtime/codegen needed to support turnover-driven stepping across multiple exported rotors
- record stepping decisions as explicit intermediate flags during evaluation, then apply advances from those flags at tick end

It must not redesign the existing export runtime shape.

---

## Supported New Behavior

This slice should add exactly:
- bounded multi-rotor stepping parity where one rotor's `turnover` output participates in downstream step control for another rotor

It should continue relying on already-shipped export support for:
- `Rotor`
- `RotorReverse`
- `Reflector`
- `Clock`
- `Gate`
- `Equals`
- `Mux`
- `OR`
- `AND`

The key boundary is:
- turnover-driven step control
- arbitrary graph-visible bit logic between `turnover` and `clock` so long as it stays inside the already-supported exported module subset
- explicit signal wiring
- no hidden machine scheduler

---

## Execution Parity Rule

Parity target remains:
- `executeTickedProject()`

For supported workspaces, generated Python must mirror MCW behavior exactly for:
- turnover generation on the controlling rotor
- downstream control logic built from already-supported exported primitives
- step/no-step outcomes on the driven rotor
- tick-end advance ordering across all exported stateful modules

The generated Python must continue to model rotor stepping the MCW way:
- module evaluation first
- sink capture second
- advance-flag recording next
- state advance last

It must not:
- precompute a machine schedule
- hide stepping behind a single opaque `machine.step()` helper
- introduce implicit clocks or hardcoded stepping rules outside visible graph connections

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless and temporal helper layer
2. explicit rotor state initialization for each exported rotor
3. explicit turnover-driven control evaluation inside `run_ticks()`
4. explicit step-flag variables for stateful modules whose advance depends on graph-visible clock/control input
5. explicit rotor advance calls at tick end for only those rotors whose clock/control path is active
5. one `main()` that prints stable per-tick sink lines

Python stdlib only.
Target Python `3.8+`.

---

## Supported Workspace Shape

This slice should support bounded workspaces such as:
- `TextInput -> Rotor -> Reflector -> RotorReverse -> Output`, with a second `Rotor` whose `clock` input is driven by turnover-derived logic
- one visible double-step-style teaching path where exported control logic visibly affects a downstream rotor's stepping

This slice does not need to support every rotor teaching surface.

It only needs to support:
- explicit graph-wired rotor control using already-supported exported modules
- bounded multi-rotor temporal parity
- visible control logic between `turnover` and `clock`, including direct wiring, gating, and simple boolean composition using already-supported exported modules

---

## Explicit V1 Exclusions

This slice must still exclude:
- `RotorDoubleStepControl` export as a first-class exported library abstraction
- `RotorControlBankRouter`
- arbitrary control-bank export
- full Enigma bank export
- full SIGABA-style export
- composites
- iterators

If a workspace depends on unsupported structured export features, export must fail clearly before file generation.

---

## Compatibility Check

The compatibility check should now:
- continue allowing the shipped stateless, temporal, and rotor-family subset
- continue allowing bounded linked forward/reverse rotor export
- continue requiring a valid graph and a derivable tick count when needed
- continue rejecting unsupported structured or control-bank features

This slice should not require a new compatibility architecture.
It should only widen the set of compatible rotor-control workspace shapes through the already-supported module subset.

---

## Parity Tests

This slice must add parity tests for at least:
- one workspace where a forward rotor `turnover` output drives downstream logic that steps another rotor
- one workspace where gated turnover control prevents a downstream rotor from advancing every tick
- one workspace where the controlled rotor participates in a visible sink path, proving that stepping behavior changed the exported output
- one sustained multi-rotor stepping trace that proves a double-step-style exported path stays in parity across multiple ticks

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW `executeTickedProject()`

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Non-Goals

This slice must not:
- export reusable rotor-control composites as named Python APIs
- export arbitrary multi-bank rotor schedulers
- redesign the temporal export runtime
- optimize for performance

---

## Success Condition

This slice is successful when:
- exported Python can reproduce one honest turnover-driven multi-rotor stepping path
- generated code stays explicit and readable
- rotor control remains visibly graph-derived rather than hidden inside a new scheduler abstraction
- the export line is ready to move from rotor control into structured-machine export
