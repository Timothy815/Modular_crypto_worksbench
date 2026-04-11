# PYTHON-EXPORT-RUNTIME-LIBRARY-FOUNDATIONS-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Activate the first bounded productization slice for Python export after the one-file exporter reached a real completeness milestone.

This contract is the implementation follow-on to:
- `PYTHON-EXPORT-RUNTIME-LIBRARY-V1.md`
- `PYTHON-EXPORT-V1-COMPLETE.md`

---

## Product Goal

Split Python export into:
1. one reusable runtime file
2. one generated workspace implementation file

while preserving:
- parity
- readability
- explicit machine structure
- no hidden interpreter behavior

---

## Strategic Position

The current one-file exporter was the correct foundations architecture.

Now that the Python export leg is effectively complete for common authored machine shapes, the next meaningful move is no longer coverage. It is productization.

That means:
- separate runtime concerns from generated workspace concerns
- let the exported workspace read more like the machine the user built
- keep the runtime available as a reusable MCW Python surface

---

## Required V1 Shape

This slice must:
- produce exactly two Python files
- keep both files stdlib-only
- preserve parity against the current one-file exporter
- preserve the existing helper-function structure in generated workspace code
- move the reusable helper/runtime layer into `mcw_runtime.py`
- generate `<workspace>.py` as the authored machine implementation file
- make the generated workspace import only the runtime symbols it actually uses
- preserve stable sink output formatting
- preserve readable comments at the current bounded level

It must not:
- require `pip` packaging
- publish a Python package
- require installation outside the exported files
- redesign the helper-based execution model

---

## Artifact Shape

V1 should emit:
1. `mcw_runtime.py`
2. `<workspace>.py`

`mcw_runtime.py` should contain:
- reusable stateless helpers
- reusable temporal/stateful helpers
- stable formatting/output helpers
- no workspace-specific machine code

`<workspace>.py` should contain:
- imports from `mcw_runtime`
- generated helper functions for composites/iterators used by the workspace
- top-level `run()` or `run_ticks()`
- `main()` printing the same stable sink output lines as today

---

## Compatibility Rule

This slice should preserve the current export compatibility boundary.

It should not broaden or narrow machine coverage.

The only intended change is artifact organization:
- one-file export becomes two-file export for this mode

---

## Parity Requirement

Parity must hold against MCW execution exactly as it does for the current exporter:
- `executeProject()` for stateless compatible workspaces
- `executeTickedProject()` for temporal compatible workspaces

It must also hold against the current one-file exporter’s observable behavior:
- same sink output lines
- same ticked sink output lines
- same error behavior for unsupported export cases

---

## Suggested V1 Scope

The first bounded runtime-library slice should prove:
- one stateless workspace export
- one temporal workspace export
- one structured workspace export using composite/iterator helpers

It does not need to prove:
- distribution tooling
- version pinning across releases
- compact export modes
- alternative artifact layouts

---

## Success Condition

This slice is successful when:
- MCW can export `mcw_runtime.py` plus `<workspace>.py`
- generated workspace files are visibly cleaner than the current one-file artifact
- parity remains intact
- the runtime/library split is established as a real product surface, not just a planning note

---

## Outcome

Shipped in the first bounded two-file runtime-library productization slice:
- exported Python now emits `mcw_runtime.py` plus `<workspace>.py`
- generated workspace files import `mcw_runtime` explicitly and keep helper-based machine structure
- parity is proven for stateless, temporal, and structured workspaces against MCW execution
- the original one-file exporter remains available as the legacy self-contained path
