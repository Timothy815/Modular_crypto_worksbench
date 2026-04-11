# PYTHON-EXPORT-V1-COMPLETE

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Record the completion checkpoint for the current self-contained Python export leg.

This document marks the point where Python export has reached its first real completeness milestone:
- full primitive registry coverage
- bounded temporal/stateful coverage
- bounded rotor-family coverage
- structured helper export across composites and iterators
- recursive helper export across the common authored machine shapes in MCW

---

## What Is Complete

The current one-file Python exporter now covers:
- all primitive modules in the registry
- the shipped temporal/stateful subset
- forward rotor export
- rotor return path export
- bounded rotor-control export
- first-class composite helper export
- iterator helper export
- iterator expansion across shipped machine families
- nested composite export
- iterator-containing composite export
- nested iterator export
- the remaining helper-expressible mixed recursive composite/iterator structures

In practical terms:
- the exporter is no longer a novelty
- the exporter is now a real product surface
- the exporter can carry away the common authored machines that define MCW’s teaching and machine-building identity

---

## What This Does Not Mean

This completion checkpoint does **not** mean:
- every imaginable future engine feature is automatically exportable
- the exporter has reached its final long-term architecture
- productization and runtime separation are already solved

It means:
- the current self-contained one-file export leg reached its first meaningful completeness target

---

## Remaining Work After Completion

The next work is no longer ordinary coverage expansion.

The next frontier is:
- productization

Specifically:
- a reusable `mcw_runtime.py` surface
- a separate generated workspace implementation file
- a deliberate split between runtime code and authored machine code

That work is tracked separately in:
- `PYTHON-EXPORT-RUNTIME-LIBRARY-V1.md`
- `PYTHON-EXPORT-RUNTIME-LIBRARY-FOUNDATIONS-V1.md`

---

## Strategic Meaning

This checkpoint means MCW can now honestly claim:
- Python export is a core feature
- not just an amusement

The remaining questions are now about:
- packaging
- usability
- long-term code organization
- product shape

not about whether the exporter is fundamentally capable enough to matter.

---

## Success Condition

This checkpoint is successful when:
- the repo explicitly records that the current Python export leg reached a completeness milestone
- the next export work is clearly framed as productization rather than unfinished ordinary coverage
