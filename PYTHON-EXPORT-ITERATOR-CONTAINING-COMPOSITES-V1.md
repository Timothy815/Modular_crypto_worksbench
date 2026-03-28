# PYTHON-EXPORT-ITERATOR-CONTAINING-COMPOSITES-V1

Last updated: March 28, 2026

Status: Implemented

---

## Purpose

Define the next bounded recursive-structure export slice after shipped nested composite export.

This contract is the follow-on to:
- `PYTHON-EXPORT-NESTED-COMPOSITES-V1.md`
- `PYTHON-EXPORT-STRUCTURED-COMPATIBILITY-V1.md`

The export line now supports:
- full primitive registry coverage
- bounded temporal/stateful export
- bounded rotor-family export
- depth-1 composites
- iterator helpers
- broader shipped iterator families
- nested composite helper generation

The next remaining structural frontier is:
- composites whose internal bodies contain supported iterator instances

---

## Product Goal

Allow Python export to represent one authored machine whose composite body includes export-compatible iterators, while preserving explicit helper-based structure and visible round behavior in generated Python.

This is **iterator-containing composite export**, not generalized mixed recursive export.

---

## Strategic Position

Nested composite export proved:
- recursive composite helper generation
- leaf-first helper ordering
- multi-level forwarded-param drilling through nested composite calls

But Python export still rejects a common authored-machine shape:
- a composite that packages one or more already-supported iterators into a reusable larger machine

That means the next decisive structural move is:
- allow iterator helpers to appear inside composite helpers

This slice should prove:
- helper-composed machines where composites orchestrate iterator helpers
- continued readable generated Python
- continued parity without introducing a serialized runtime interpreter

It should not yet prove:
- iterator round definitions that are themselves iterators
- composites containing unsupported iterator families
- arbitrary mixed recursive structure of all forms
- runtime-library/package splitting

---

## Core Question

What is the smallest mixed-structure slice that materially expands Python export completeness while keeping the generated Python explicit, helper-based, and reviewable?

---

## Required V1 Shape

This slice must:
- preserve one standalone `.py` file
- preserve Python stdlib-only output
- preserve helper-function composite export
- preserve helper-function iterator export
- allow composite bodies to contain already-export-compatible iterator instances
- preserve globally unique helper names for iterator instances inside composite bodies
- preserve explicit local scoping inside each generated helper
- preserve deterministic leaf-first helper ordering across composite and iterator dependencies
- preserve explicit forwarded-param injection into iterators through composite boundaries
- preserve forwarded-param control of internal iterator `iterationCount`
- preserve explicit iterator key-bus slicing and `iterationCount` override behavior
- preserve explicit composite `_init_state` / `_tick` ownership of iterator sub-state
- preserve parity against MCW execution for the supported subset

It must not redesign the exporter into a serialized project interpreter.

---

## Supported Structural Scope

This slice should support:
- shipped composites whose internals include already-supported iterator instances
- user-authored composites whose internals include already-supported iterator instances
- temporal iterator-containing composites only when every internal definition stays within the shipped temporal export subset

The recommended V1 boundary is:
- composite helpers may call iterator helpers
- iterator helpers may call supported composite round helpers, as already shipped
- nested composites may contain iterator helpers if every involved definition is export-compatible under this slice

This slice does not need to support:
- iterator round definitions that are themselves iterators
- iterator round-definition composites whose bodies themselves contain iterators
- nested iterators
- generalized recursive mixed composite/iterator export
- hidden structure runtimes

---

## Execution Parity Rule

Parity target remains:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

Generated Python must mirror MCW behavior exactly for:
- composite input binding into iterator-containing bodies
- composite output binding from iterator outputs
- forwarded param injection through composite boundaries into iterator calls
- composite `_init_state` / `_tick` routing of iterator-owned sub-state
- iterator key-bus slicing inside composite helpers
- helper-to-helper call ordering
- temporal behavior inside iterator-containing composites when every internal definition already falls inside the shipped temporal subset

Parity must come from explicit helper composition, not from introducing a project interpreter.

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless/temporal helper layer
2. generated helper functions for recursively export-compatible composites
3. generated helper functions for export-compatible iterators, including globally unique namespaced helpers for iterator instances inside composite bodies
4. visible iterator-helper calls inside generated composite helpers where authored machines use iterators internally
5. top-level `run()` or `run_ticks()` using those helpers
6. one `main()` that prints stable sink output lines

The generated code should still read like:
- explicit reusable helper layers
- visible authored structure
- explicit orchestration

It must not read like:
- a hidden serialized executor
- a generalized runtime for arbitrary mixed recursive structures

---

## Compatibility Check

The compatibility check should now:
- allow composites containing already-supported iterator instances
- continue to reject iterator round definitions that are themselves iterators
- continue to reject iterator round-definition composites whose bodies themselves contain iterators
- continue to reject unsupported iterator families inside composite bodies
- continue to reject generalized recursive mixed structure beyond this bounded slice

This slice should extend the current compatibility architecture rather than replace it.

---

## Parity Tests

This slice must add parity tests for at least:
- one shipped iterator-containing composite workspace
- one user-authored iterator-containing composite workspace
- one temporal iterator-containing composite workspace if a compatible temporal case is available
- one workspace proving that iterator helper calls remain visible in emitted composite helpers

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Explicit V1 Exclusions

This slice still excludes:
- iterator round definitions that are themselves iterators
- iterator round-definition composites whose bodies themselves contain iterators
- nested iterators
- generalized recursive mixed structure export
- runtime-library/package splitting

---

## Success Condition

This slice is successful when:
- Python export can represent machines where composites orchestrate already-supported iterator helpers
- authored composite boundaries and iterator round boundaries remain visible
- parity holds for supported iterator-containing composite workspaces
- the remaining structural frontier narrows from “mixed recursive structure” to the still-excluded generalized recursive cases
