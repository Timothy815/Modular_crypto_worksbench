# PYTHON-EXPORT-STRUCTURED-COMPATIBILITY-V1

Last updated: March 28, 2026

Status: Implemented on `main`

---

## Purpose

Define the first structured-export compatibility tightening after the shipped iterator expansion slice.

This contract is the follow-on to:
- `PYTHON-EXPORT-ITERATOR-EXPANSION-V1.md`

The previous export line proved:
- composite helper export
- iterator helper export
- broader shipped iterator coverage

The next export need is not a new runtime feature. It is **structured compatibility honesty**.

---

## Product Goal

Make Python export state clearly and correctly what remaining structured-machine cases are still unsupported, so the export line moves closer to a real completeness milestone without quietly overclaiming support.

This is **compatibility tightening**, not a new structure runtime.

---

## Strategic Position

Python export can now represent a substantial fraction of MCW:
- broad stateless primitives
- bounded temporal primitives
- bounded rotor-family behavior
- depth-1 composites
- bounded iterator helpers
- broader shipped iterator families

But the remaining structured exclusions must now be made fully explicit in code, not just in contracts.

The key remaining unsupported cases are:
- iterators inside composites
- nested composites
- iterators whose round definition is another iterator
- generalized recursive structured export

This slice should make those boundaries explicit and test-proven.

---

## Core Question

How do we make the current structured export boundary fully honest and visible in the compatibility layer before pushing toward broader completeness?

---

## Required V1 Shape

This slice must:
- preserve the shipped one-file export architecture
- preserve all current composite and iterator helper generation behavior
- preserve all current parity behavior
- tighten compatibility checking for remaining unsupported structured cases
- keep failure messages explicit and human-readable

It must not broaden the runtime or change generated code shape for supported exports.

---

## Shipped Tightening

This slice must explicitly reject:
- iterators inside composites
- nested composites
- iterators whose round definition is another iterator
- unsupported structured recursion through composite or iterator bodies

The compatibility layer should continue to allow:
- depth-1 composite helpers whose internals are otherwise export-compatible
- depth-1 iterator helpers whose round definition is otherwise export-compatible

---

## Compatibility Rule

Python export compatibility must now state the remaining structured gap truthfully:
- supported structured export is bounded to depth-1 composites and bounded iterator helpers
- unsupported structured recursion must fail before file generation
- iterator-containing composites are not silently allowed

This slice is successful only if the code-level compatibility walk matches the documented contract boundary.

---

## Parity / Rejection Tests

This slice must add compatibility tests for at least:
- one composite containing an iterator
- one iterator whose round-definition composite itself contains an iterator

Tests should assert:
- export is rejected
- the rejection reason is explicit and stable

---

## Explicit V1 Exclusions

This slice still excludes:
- nested iterators
- iterators inside composites
- nested composites
- generalized recursive structured export
- runtime-library/package splitting

---

## Success Condition

This slice is successful when:
- the structured export boundary is fully honest in code and tests
- unsupported structured recursion is rejected clearly before generation
- the export line is ready to continue toward broader completeness from a truthful compatibility base
