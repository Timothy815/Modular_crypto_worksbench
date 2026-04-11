# PYTHON-EXPORT-NESTED-ITERATORS-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Define the next bounded structural export slice after shipped iterator-containing composite export.

This contract is the follow-on to:
- `PYTHON-EXPORT-ITERATOR-CONTAINING-COMPOSITES-V1.md`

The export line now supports:
- full primitive registry coverage
- bounded temporal/stateful export
- bounded rotor-family export
- nested composite helper generation
- iterator helpers
- iterator-containing composite helpers

The next remaining structural frontier is:
- iterator round definitions that are themselves iterators

---

## Product Goal

Allow Python export to represent one authored machine whose iterator round definition is itself an already-export-compatible iterator, while preserving explicit helper-based structure and visible repeated-round behavior in generated Python.

This is **nested iterator export**, not generalized recursive mixed export.

---

## Strategic Position

Iterator-containing composite export proved:
- composites can orchestrate already-supported iterator helpers
- iterator helper naming can remain globally unique in one file
- iterator sub-state can be routed explicitly through composite helper state

But Python export still rejects one natural repeated-machine shape:
- an iterator whose round definition is another export-compatible iterator

That means the next decisive structural move is:
- allow iterator helpers to call already-supported iterator helpers as round definitions

This slice should prove:
- explicit nested iterator helper composition
- continued readable generated Python
- continued parity without introducing a serialized runtime interpreter

It should not yet prove:
- arbitrary recursive mixed structure of all forms
- hidden runtime scheduling
- runtime-library/package splitting

---

## Core Question

What is the smallest iterator-recursive slice that materially expands Python export completeness while keeping generated Python explicit, helper-based, and reviewable?

---

## Required V1 Shape

This slice must:
- preserve one standalone `.py` file
- preserve Python stdlib-only output
- preserve helper-function iterator export
- allow iterator round definitions that are themselves already-export-compatible iterators
- use distinct definition-level helper names for iterator round definitions that are themselves iterators
- preserve globally unique helper names for nested iterator helpers
- preserve explicit local scoping inside each generated helper
- preserve deterministic dependency ordering across nested iterator helpers
- preserve explicit round-to-round chaining through nested iterator calls
- preserve explicit key-bus slicing and `iterationCount` override parity through nested iterator layers
- preserve explicit `_init_state` / `_tick` routing of nested iterator sub-state
- preserve parity against MCW execution for the supported subset

It must not redesign the exporter into a serialized project interpreter.

---

## Supported Structural Scope

This slice should support:
- shipped iterators whose round definition is another already-supported iterator
- user-authored iterators whose round definition is another already-supported iterator
- temporal nested iterators only when every involved definition stays within the shipped temporal export subset

The recommended V1 boundary is:
- iterator helpers may call already-supported iterator helpers
- those nested iterator helpers may continue to call already-supported composite round helpers, as already shipped
- nested composites containing those supported nested iterators may remain out of scope unless already covered by prior slices without new recursion requirements

This slice does not need to support:
- arbitrary deeper mixed recursive export beyond nested iterator helper composition
- iterator round-definition composites whose bodies contain unsupported iterator families
- hidden structure runtimes

---

## Execution Parity Rule

Parity target remains:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

Generated Python must mirror MCW behavior exactly for:
- nested iterator round chaining
- nested iterator key-bus slicing
- nested `iterationCount` override handling
- nested iterator `_init_state` / `_tick` sub-state routing
- explicit recursive walking of nested iterator state trees during `_init_state` and `_tick`
- helper-to-helper call ordering
- temporal behavior inside nested iterators when every internal definition already falls inside the shipped temporal subset

Parity must come from explicit helper composition, not from introducing a project interpreter.

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless/temporal helper layer
2. generated helper functions for export-compatible composites
3. generated helper functions for export-compatible iterators
4. generated definition-level iterator helpers for iterator round definitions that are themselves iterators
5. visible nested iterator-helper calls inside generated iterator helpers where authored machines use iterator round definitions
5. top-level `run()` or `run_ticks()` using those helpers
6. one `main()` that prints stable sink output lines

The generated code should still read like:
- explicit reusable helper layers
- visible authored structure
- explicit orchestration

It must not read like:
- a hidden serialized executor
- a generalized runtime for arbitrary recursive mixed structures

---

## Compatibility Check

The compatibility check should now:
- allow iterator round definitions that are themselves already-supported iterators
- reject iterator definition cycles before code generation
- continue to reject unsupported iterator families inside nested iterator layers
- continue to reject generalized recursive mixed structure beyond this bounded slice

This slice should extend the current compatibility architecture rather than replace it.

---

## Parity Tests

This slice must add parity tests for at least:
- one user-authored nested iterator workspace
- one keyed nested iterator workspace
- one temporal nested iterator workspace if a compatible temporal case is available
- one workspace proving that nested iterator helper calls remain visible in emitted Python

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Explicit V1 Exclusions

This slice still excludes:
- generalized recursive mixed structure export beyond nested iterator helper composition
- hidden structure runtimes
- runtime-library/package splitting

---

## Success Condition

This slice is successful when:
- Python export can represent machines where iterator helpers orchestrate already-supported iterator helpers
- authored iterator round boundaries remain visible
- parity holds for supported nested iterator workspaces
- the remaining structural frontier narrows from “recursive structure in common authored forms” to the still-excluded generalized recursive cases
