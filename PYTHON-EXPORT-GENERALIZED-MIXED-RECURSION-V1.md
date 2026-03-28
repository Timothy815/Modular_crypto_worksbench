# PYTHON-EXPORT-GENERALIZED-MIXED-RECURSION-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the next bounded structural export slice after shipped nested iterator export.

This contract is the follow-on to:
- `PYTHON-EXPORT-NESTED-ITERATORS-V1.md`

The export line now supports:
- full primitive registry coverage
- bounded temporal/stateful export
- bounded rotor-family export
- nested composite helper generation
- iterator helpers
- iterator-containing composite helpers
- nested iterator helpers

The next remaining structural frontier is:
- generalized mixed recursive structure across composites and iterators within the existing helper-function model

---

## Product Goal

Allow Python export to represent the remaining common authored machines where composites and iterators recurse into each other in combinations that are still graph-visible and helper-expressible, without collapsing into a serialized project interpreter.

This is **generalized mixed recursive helper export**, not a runtime redesign.

---

## Strategic Position

The export line has now reached a strong completeness milestone for:
- primitives
- temporal primitives
- rotor-family machines
- composites
- iterators
- nested composites
- iterator-containing composites
- nested iterators

What remains is no longer broad capability work. It is the last structural completeness frontier:
- helper-based support for the remaining mixed recursive authored forms

This slice should prove:
- the exporter can traverse the remaining common composite/iterator recursion graph
- helper generation can remain explicit and reviewable even at the highest authored structure depth
- compatibility checks can bound unsupported pathological cases cleanly

It should not yet prove:
- a hidden runtime interpreter
- package/runtime-library restructuring
- arbitrary user-defined recursion beyond the engine’s authored-definition DAG model

---

## Core Question

What is the smallest mixed-recursive export slice that closes the remaining common authored-machine gaps while preserving explicit helper-based Python generation?

---

## Required V1 Shape

This slice must:
- preserve one standalone `.py` file
- preserve Python stdlib-only output
- preserve helper-function structured export
- allow already-export-compatible composites and iterators to recurse into one another within the authored-definition DAG
- preserve globally unique helper names across all generated composite and iterator helpers
- preserve deterministic dependency ordering across mixed recursive helper layers
- preserve explicit local scoping inside each generated helper
- preserve explicit forwarded-param drilling through mixed recursive helper calls
- preserve explicit key-bus slicing and `iterationCount` override parity through mixed recursive helper layers
- preserve explicit `_init_state` / `_tick` routing through mixed recursive state trees
- preserve compatibility rejection for any remaining unsupported stateful/runtime forms
- preserve parity against MCW execution for the supported subset

It must not redesign the exporter into a serialized project interpreter.

---

## Supported Structural Scope

This slice should support:
- composites containing iterators whose round definitions are themselves already-supported iterators
- iterators whose round-definition composites contain already-supported iterators
- deeper authored mixtures of already-supported composite and iterator helpers when the definition graph remains acyclic
- temporal mixed recursive structures only when every reachable definition stays within the shipped temporal export subset

The recommended V1 boundary is:
- support recursive helper composition across the remaining common authored machine families
- keep the implementation inside the existing helper-generation architecture
- reject only the still-exotic forms that cannot be expressed without a hidden executor/runtime

This slice does not need to support:
- runtime-library/package splitting
- hidden structure runtimes
- any engine shape that would require abandoning helper-based explicit code generation

---

## Execution Parity Rule

Parity target remains:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

Generated Python must mirror MCW behavior exactly for:
- mixed composite/iterator helper call ordering
- mixed forwarded-param drilling
- mixed nested key-bus slicing
- mixed nested `iterationCount` override handling
- mixed nested `_init_state` / `_tick` state routing
- temporal behavior inside the supported mixed recursive subset

Parity must come from explicit helper composition, not from introducing a project interpreter.

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless/temporal helper layer
2. generated helper functions for all reachable export-compatible composites
3. generated helper functions for all reachable export-compatible iterators
4. visible mixed recursive helper calls where authored machines recurse across composite and iterator layers
5. top-level `run()` or `run_ticks()` using those helpers
6. one `main()` that prints stable sink output lines

The generated code should still read like:
- explicit reusable helper layers
- visible authored structure
- explicit orchestration

It must not read like:
- a hidden serialized executor
- a generalized runtime for arbitrary user code

---

## Compatibility Check

The compatibility check should now:
- allow the remaining helper-expressible mixed recursive structure across composites and iterators
- reject definition cycles across both composite and iterator layers
- continue to reject any remaining unsupported stateful/runtime forms
- continue to reject any structure that would require a hidden interpreter or runtime model change

This slice should extend the current compatibility architecture rather than replace it.

---

## Parity Tests

This slice must add parity tests for at least:
- one shipped mixed recursive workspace newly unlocked by this slice
- one user-authored mixed recursive workspace newly unlocked by this slice
- one temporal mixed recursive workspace if a compatible case is available
- one workspace proving that the emitted Python still shows visible mixed helper calls rather than flattened hidden execution

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Explicit V1 Exclusions

This slice still excludes:
- runtime-library/package splitting
- hidden structure runtimes
- any fallback that serializes the project into a generic interpreter

---

## Success Condition

This slice is successful when:
- the remaining common authored mixed recursive machine shapes export successfully
- generated Python remains helper-based and readable
- parity holds for supported mixed recursive workspaces
- the remaining gap to claiming Python export as a complete V1 feature becomes productization and future architecture, not ordinary machine coverage
