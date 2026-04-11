# PYTHON-EXPORT-ITERATOR-EXPANSION-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Define the first iterator-export follow-on after the shipped iterator foundations slice.

This contract is the follow-on to:
- `PYTHON-EXPORT-ITERATOR-FOUNDATIONS-V1.md`

The previous iterator slice proved:
- first-class helper-function iterator export
- visible round boundaries in generated Python
- explicit round chaining
- explicit key-bus slicing and iteration-count override parity
- bounded temporal iterator export for supported round definitions

The next export frontier is **iterator expansion**.

---

## Product Goal

Broaden iterator export coverage across the most important shipped iterator families so Python export can represent a larger fraction of MCW’s real repeated-machine teaching surfaces.

This is **iterator expansion**, not full recursive structured export.

---

## Strategic Position

Python export now supports:
- primitives
- temporal primitives
- rotor-family slices
- composites
- iterator foundations

But the iterator line is still too narrow if it only proves one or two bounded repeated-machine examples.

The next decisive step is:
- extend iterator export coverage across the highest-value shipped iterator families that are already central to MCW’s visible repeated-round teaching line

This slice should prove:
- broader shipped-iterator coverage
- parity across more realistic repeated-round machine patterns
- continued helper-based readability without drifting into hidden runtime interpretation

It should not yet prove:
- nested iterators
- iterator-containing composites
- arbitrary recursive structured export
- generalized runtime/library packaging

---

## Core Question

What is the next bounded iterator-export expansion that materially increases Python export completeness without widening into generalized structured recursion?

---

## Required V1 Shape

This slice must:
- preserve the shipped one-file export architecture
- preserve helper-function iterator export
- preserve visible bounded round structure in generated Python
- preserve parity-first behavior
- broaden coverage only across shipped iterator families whose round definitions are already inside the export-supported structured subset

It must not redesign iterator export representation.

---

## Shipped Coverage

The shipped V1 targets are:
- `FeistelRoundIterator`
- `HashDigestRoundIterator`
- `SpongeMixRoundIterator`

Reason:
- they represent higher-value repeated machine structures than the initial byte-round proofs
- they are already part of MCW’s visible teaching surface
- together they pressure-test:
  - repeated keyed structure
  - repeated digest structure
  - repeated sponge-style state-mixing structure

This slice also continues to rely on:
- stronger parity coverage for shipped `ByteRoundIterator` and `KeyedByteRoundIterator`

This slice does not need to support:
- nested iterators
- iterators inside composites
- iterators whose round definitions contain unsupported structured recursion

---

## Execution Parity Rule

Parity target remains:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

Generated Python must continue to mirror MCW behavior exactly for:
- round-count resolution
- round chaining
- key-bus slicing when present
- final output resolution
- temporal execution when the shipped iterator family already falls inside the temporal export boundary

This slice should prove broader parity, not change the parity model.

---

## Compatibility Rule

This slice should continue to:
- reject nested iterators
- reject iterator-containing composites
- reject unsupported structured recursion

It should expand compatibility only where the shipped iterator family’s round definition is already fully export-compatible under the current structured export model.

---

## Parity Tests

This slice must add parity tests for at least:
- one `FeistelRoundIterator` workspace
- one `HashDigestRoundIterator` workspace
- one `SpongeMixRoundIterator` workspace

Tests should:
- use shipped iterator definitions where possible
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Explicit V1 Exclusions

This slice must still exclude:
- nested iterators
- iterator-containing composites
- recursive structure export
- hidden interpreters
- runtime-library/package splitting

---

## Success Condition

This slice is successful when:
- Python export covers a broader and more meaningful set of shipped iterator families
- parity holds across those repeated-machine teaching surfaces
- the export line is closer to a real completeness milestone rather than a narrow foundations proof
