# PYTHON-EXPORT-ITERATOR-FOUNDATIONS-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Define the first iterator-export slice after the shipped composite foundations export.

This contract is the follow-on to:
- `PYTHON-EXPORT-COMPOSITE-FOUNDATIONS-V1.md`

The previous export line proved:
- broad stateless primitive export
- bounded temporal export
- bounded rotor-family export
- bounded turnover-driven rotor-control export
- first-class helper-function composite export

The next export frontier is **iterator foundations**.

---

## Product Goal

Allow a user to export one compatible workspace containing iterator modules as one standalone Python file with parity against MCW execution.

This is **iterator export foundations**, not full arbitrary structured export.

---

## Strategic Position

Python export can now represent:
- flat primitive graphs
- temporal primitive graphs
- bounded historical-machine paths and control
- authored composite helpers

But it still cannot export one of MCW's most important machine-shaping tools:
- bounded repeated round structure

That means the line is still strategically incomplete.

The next decisive step is:
- export iterator-built machines while preserving visible round structure in readable Python

This slice should prove:
- bounded iterator expansion/export parity
- readable generated code for repeated round structure
- explicit handling of iterator input binding and key-bus slicing without introducing a hidden interpreter

It should not yet prove:
- arbitrary recursive structured export
- iterator-containing composites
- nested iterator export
- a generalized structure runtime object model

---

## Core Question

What is the smallest iterator export slice that proves MCW can generate faithful repeated-machine Python while preserving authored round structure and iterator semantics?

---

## Required V1 Shape

This slice must:
- preserve one standalone `.py` file
- preserve Python stdlib-only output
- preserve parity against MCW execution for the supported subset
- add bounded support for iterator definitions whose round definition is already export-compatible
- preserve explicit readable generated comments
- preserve visible round structure in the generated Python rather than flattening it into opaque loops
- preserve explicit key-bus slicing behavior when `roundKeyWidth` is present
- preserve explicit instance-level `iterationCount` override behavior
- preserve explicit round-to-round `out -> in` chaining in generated Python
- preserve runtime key-bus width checking for keyed iterators

It must not redesign the exporter into a serialized project interpreter.

---

## Supported Iterator Scope

This slice should support:
- iterators whose `roundDefId` resolves to an export-compatible primitive definition
- iterators whose `roundDefId` resolves to an export-compatible composite definition already within the shipped composite foundations boundary
- stateless iterators
- temporal iterators only when the round definition is already within the shipped temporal export subset
- iterators with or without `roundKeyWidth`

The recommended V1 boundary is:
- exported iterators become explicit generated helper functions specialized to the exported iterator instance
- each helper visibly enumerates its bounded rounds
- each round remains visible as a named step in generated Python
- helpers accept explicit input arguments and explicit forwarded iterator params needed for execution
- helpers return explicit Python dicts keyed by external output port name

This slice does not need to support:
- nested iterators
- iterators whose round definition is itself another iterator
- iterator-containing composites
- arbitrary recursive structure expansion

---

## Execution Parity Rule

Parity target remains:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

Generated Python must mirror MCW behavior exactly for:
- iterator round-count resolution
- positive-integer `iterationCount` override resolution
- iterator input binding into round 1
- round-to-round `out -> in` chaining
- key-bus slicing when `roundKeyWidth` is present
- final output coming from the last round's `out`
- temporal behavior inside iterator rounds when the round definition is already within the shipped temporal export subset

The generated Python must preserve the MCW structure model:
- an iterator is still visibly a bounded repeated machine
- rounds remain explicit in generated code
- parity must come from faithful round expansion and binding, not from introducing a hidden executor

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless/temporal helper layer
2. generated helper functions for supported composites
3. generated helper functions for supported iterators
4. explicit internal comments marking iterator boundaries and round boundaries
5. the top-level `run()` or `run_ticks()` entry using those iterator helpers
6. one `main()` that prints stable sink output lines

Iterator helpers should:
- accept explicit input arguments
- accept explicit iteration-count and key-bus arguments when needed
- return explicit Python dicts keyed by external output port name
- validate keyed-bus width before slicing when `roundKeyWidth` is present

The generated code should read like:
- helper functions for reusable bounded round structures
- explicit per-round calls inside those helpers
- top-level orchestration of those helpers

It must not read like:
- a flattened block with all round identity erased
- a hidden serialized project interpreter

---

## Compatibility Check

The compatibility check should now:
- allow iterators whose round definition is already export-compatible
- allow instance-level `iterationCount` overrides
- allow `roundKeyWidth` iterators when the key bus is already expressible in the shipped export line
- reject iterators whose round definition is unsupported
- reject iterators whose round definition is another iterator
- reject iterators inside composites for this slice
- reject nested iterators for this slice

This slice should extend the existing compatibility architecture rather than replacing it.

---

## Scoping Rules

V1 should explicitly enforce:
- one iterator helper owns the bounded repeated structure for one iterator definition
- internal round variables are local to the iterator helper
- round-local names must remain isolated from top-level module variables and other helpers
- one external iterator input may fan out to multiple round-local uses when required by the round definition
- key-bus slices must be represented explicitly in generated Python rather than hidden in runtime tables
- each round's emitted output must be explicitly passed as the next round's input in generated Python

Temporal iterator helpers should stay structurally parallel to shipped temporal composite helpers:
- one init helper when runtime state is needed
- one tick helper when per-tick execution is needed
- temporal iterator V1 does not need to support nested structured state beyond one round definition level

---

## Explicit V1 Exclusions

This slice must still exclude:
- nested iterators
- iterators inside composites
- iterator round definitions that are themselves iterators
- generalized recursive structured export
- hidden project interpreters
- external runtime packages

If a workspace depends on unsupported structured features, export must fail clearly before file generation.

---

## Parity Tests

This slice must add parity tests for at least:
- one stateless workspace using a shipped iterator
- one stateless workspace using a keyed iterator with visible key-bus slicing
- one temporal workspace using an iterator whose round definition is already within the shipped temporal subset
- one temporal workspace using an iterator whose round definition is already within the shipped temporal export subset
- one workspace proving that iterator helper generation preserves visible round structure in emitted Python

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Non-Goals

This slice must not:
- add nested iterator export
- add iterator-containing composite export
- add a generalized structure runtime
- optimize for performance
- claim full MCW export parity

---

## Success Condition

This slice is successful when:
- exported Python can represent one bounded repeated machine as readable helper-based code
- iterator round boundaries remain visible in generated output
- key-bus slicing and round-count override behavior preserve MCW parity
- parity holds for supported stateless and temporal iterator workspaces
- the export line is ready to move from iterator foundations toward broader structured-machine completeness
