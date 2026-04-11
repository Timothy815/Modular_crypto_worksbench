# PYTHON-EXPORT-NESTED-COMPOSITES-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Define the first bounded recursive-structure export slice after the primitive registry line reached full Python export coverage.

This contract is the follow-on to:
- `PYTHON-EXPORT-COVERAGE-MAP-V1.md`

The coverage audit now shows:
- primitive/runtime coverage is complete
- the next export frontier is structural rather than vocabulary-based

The smallest meaningful structural step is:
- nested composites

---

## Product Goal

Allow Python export to represent one authored machine whose composite body contains other export-compatible composites, while preserving visible helper-based structure in generated Python.

This is **nested composite export**, not generalized recursive structured export.

---

## Strategic Position

Python export already supports:
- depth-1 composite helpers
- bounded iterator helpers
- broad primitive/stateful coverage

But it still rejects one of the most natural authored-machine shapes:
- a composite that uses another compatible composite internally

That means the next decisive structural move is:
- extend helper-based export from depth-1 composite bodies to bounded nested composite composition

This slice should prove:
- nested helper composition without flattening away authored submachine boundaries
- continued readable generated Python
- continued parity without introducing a hidden interpreter

It should not yet prove:
- iterator-containing composites
- nested iterators
- arbitrary recursive structured export of all forms
- runtime-library/package splitting

---

## Core Question

What is the smallest recursive-structure slice that materially expands structured export while keeping the generated Python explicit, helper-based, and reviewable?

---

## Required V1 Shape

This slice must:
- preserve one standalone `.py` file
- preserve Python stdlib-only output
- preserve helper-function composite export
- allow nested composite bodies beyond depth 1 when every nested internal definition is itself export-compatible
- emit composite helper definitions in deterministic leaf-first dependency order
- preserve explicit local scoping inside each generated helper
- preserve isolated variable maps per generated helper scope
- preserve explicit forwarded-param injection through nested composite calls
- preserve multi-level forwarded-param drilling through nested composite calls
- preserve normal Python identifier sanitization rules across nested scopes
- preserve parity against MCW execution for the supported subset

The compatibility and generation walk must also enforce that the composite-definition hierarchy is a DAG.

It must not redesign the exporter into a serialized project interpreter.

---

## Supported Structural Scope

This slice should support:
- shipped composites whose internals include other export-compatible composites
- user-authored composites whose internals include other export-compatible composites
- temporal nested composites only when every internal definition stays within the shipped temporal export subset

The recommended V1 boundary is:
- recursive composite-helper generation only
- no iterators inside composites yet
- no nested iterators
- no iterator round definitions that are themselves iterators

This slice does not need to support:
- iterator-containing composites
- generalized recursive mixed composite/iterator export
- hidden structure runtimes

---

## Execution Parity Rule

Parity target remains:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

Generated Python must mirror MCW behavior exactly for:
- recursive composite input binding
- recursive composite output binding
- forwarded param injection through multiple composite layers
- helper-to-helper call ordering
- temporal behavior inside nested composites when every internal definition already falls inside the shipped temporal subset

Parity must come from explicit helper composition, not from introducing a project interpreter.

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless/temporal helper layer
2. generated helper functions for recursively export-compatible composites
3. visible helper-to-helper composition inside generated nested composite helpers
4. top-level `run()` or `run_ticks()` using those helpers
5. one `main()` that prints stable sink output lines

The generated code should still read like:
- explicit reusable helper layers
- visible authored structure
- explicit orchestration

It must not read like:
- a flattened blob with all structure erased
- a hidden serialized executor

---

## Compatibility Check

The compatibility check should now:
- allow nested composites when every nested internal definition is export-compatible under this slice
- reject composite-definition cycles before generation begins
- continue to reject iterators inside composites
- continue to reject nested iterators
- continue to reject iterator round definitions that are themselves iterators

This slice should extend the current compatibility architecture rather than replace it.

---

## Parity Tests

This slice must add parity tests for at least:
- one shipped nested composite workspace
- one user-authored nested composite workspace
- one temporal nested composite workspace if a compatible temporal case is available
- one workspace proving that nested helper composition remains visible in emitted Python
- one workspace proving that composite-definition cycles are rejected before generation

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Explicit V1 Exclusions

This slice still excludes:
- iterator-containing composites
- nested iterators
- generalized recursive mixed structure export
- runtime-library/package splitting

---

## Success Condition

This slice is successful when:
- Python export can represent nested composite machines as helper-composed Python
- authored nested composite boundaries remain visible
- parity holds for supported nested composite workspaces
- the remaining structural frontier narrows from “recursive structure in general” to the iterator-containing composite line
