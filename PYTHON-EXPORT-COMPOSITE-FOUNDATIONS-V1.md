# PYTHON-EXPORT-COMPOSITE-FOUNDATIONS-V1

Last updated: March 28, 2026

Status: Implemented on `main`

---

## Purpose

Define the first structured-machine Python export slice after the shipped rotor-control export.

This contract is the follow-on to:
- `PYTHON-EXPORT-ROTOR-CONTROL-V1.md`

The previous export line proved:
- broad stateless primitive export
- bounded temporal export
- bounded rotor-family export
- bounded turnover-driven rotor-control export

The next export frontier is **composite foundations**.

---

## Product Goal

Allow a user to export one compatible workspace containing user-authored or shipped composite modules as one standalone Python file with parity against MCW execution.

This is **composite export foundations**, not full structured export.

---

## Strategic Position

Python export is now powerful enough to handle:
- flat primitive graphs
- ticked primitive graphs
- bounded historical-machine paths and control

But it still cannot export one of MCW’s core authoring truths:
- reusable composed machines

That means the line is still strategically incomplete.

The next decisive step is:
- export composed machines while preserving authored structure in readable Python

This slice should prove:
- bounded composite expansion/export parity
- readable generated code for submachine structure
- explicit handling of composite boundaries without collapsing the whole workspace into an opaque blob

It should not yet prove:
- iterator export
- arbitrary recursive structured export
- a general-purpose generated runtime object model for all future structure

---

## Core Question

What is the smallest composite export slice that proves MCW can generate faithful composed-machine Python without flattening away the product’s reusable-machine structure?

---

## Required V1 Shape

This slice must:
- preserve one standalone `.py` file
- preserve Python stdlib-only output
- preserve parity against MCW execution for the supported subset
- add bounded support for composite definitions whose internals are themselves export-compatible
- preserve explicit readable generated comments
- preserve authored composite boundaries in a visible way inside the generated Python
- preserve helper-local variable scoping for every internal module
- pass forwarded composite params into generated helpers as explicit helper arguments

It must not redesign the entire export runtime into a generic object framework.

---

## Supported Composite Scope

This slice should support:
- shipped composites whose internals are already composed only of export-supported primitives/stateful modules
- user-authored composites whose internals are already composed only of export-supported primitives/stateful modules
- composites with internal primitive/stateful-module bodies only

The recommended V1 boundary is:
- exported composites become explicit generated helper functions
- each helper has explicit typed input parameters and explicit returned output map entries
- the top-level workspace still exports as one readable file
- helper-local variables represent all internal modules to avoid namespace collisions
- helper arguments carry any forwarded composite params explicitly

This slice does not need to support:
- iterators
- composite families with unsupported internal modules
- nested composites of any depth

---

## Execution Parity Rule

Parity target remains:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

Generated Python must mirror MCW behavior exactly for:
- composite input binding behavior
- composite output binding behavior
- forwarded param injection behavior
- internal topological execution of the composite body
- ticked behavior inside composites if the composite internals are already within the shipped temporal subset

The generated Python must preserve the MCW structure model:
- a composite is still visibly a submachine
- internals remain explicit in generated code
- parity must come from faithful expansion/binding, not from introducing a hidden interpreter

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless/temporal helper layer
2. generated helper functions for supported composites
3. explicit internal comments marking composite boundaries
4. the top-level `run()` or `run_ticks()` entry using those composite helpers
5. one `main()` that prints stable sink output lines

Composite helpers should return explicit Python dicts keyed by external output port name.

The generated code should read like:
- helper functions for reusable submachines
- top-level orchestration of those helpers

It must not read like:
- a flattened undifferentiated block with all composite identity erased
- a hidden serialized project interpreter

---

## Compatibility Check

The compatibility check should now:
- allow composites whose internal project graph is itself fully export-compatible
- allow forwarded params when they target already-export-compatible internal params
- reject composites containing unsupported internals
- reject iterators inside composites for this slice
- reject nested composites for this slice

This slice should extend the existing compatibility architecture rather than replacing it.

---

## Explicit V1 Exclusions

This slice must still exclude:
- iterators
- iterator-containing composites
- nested composites
- hidden project interpreters
- external runtime packages

If a workspace depends on unsupported structured features, export must fail clearly before file generation.

---

## Parity Tests

This slice must add parity tests for at least:
- one stateless workspace using a shipped composite
- one stateless workspace using a user-authored composite
- one temporal workspace using a compatible composite with already-shipped temporal internals
- one workspace proving that composite helper generation preserves visible machine structure in the emitted Python

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Non-Goals

This slice must not:
- add iterator export
- add a generalized structure runtime
- optimize for performance
- claim “full MCW export parity”

---

## Success Condition

This slice is successful when:
- exported Python can represent one composed machine as readable helper-based code
- composite boundaries remain visible in generated output
- parity holds for supported stateless and temporal composite workspaces
- the export line is ready to move from composite foundations into iterator export
