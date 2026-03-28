# PYTHON-EXPORT-DELIVERY-UX-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the first bounded delivery/hand-off refinement slice after the two-file Python export runtime split and runtime-surface refinement shipped.

This contract is the implementation follow-on to:
- `PYTHON-EXPORT-V1-COMPLETE.md`
- `PYTHON-EXPORT-RUNTIME-LIBRARY-FOUNDATIONS-V1.md`
- `PYTHON-EXPORT-RUNTIME-SURFACE-V1.md`

---

## Product Goal

Improve how MCW hands the two-file Python export to the user so that:
1. the artifact handoff feels deliberate and reliable
2. the relationship between `mcw_runtime.py` and `<workspace>.py` is easier to keep intact
3. the export action feels more like a polished product surface than two unrelated browser downloads

while preserving:
- parity
- the current two-file artifact boundary
- stdlib-only exported Python
- the current machine coverage and helper-based execution model

---

## Strategic Position

The export line is now complete in capability and shaped in runtime surface.

The next remaining productization gap is not semantics. It is delivery UX.

This slice should improve:
- artifact handoff
- artifact naming clarity
- the user’s ability to keep the two files together reliably

It should not drift into packaging/distribution strategy beyond the immediate export handoff.

---

## Required V1 Shape

This slice must:
- preserve the current two-file Python export contents
- preserve the current runtime/workspace file roles
- preserve parity against the current shipped two-file export behavior
- improve the handoff so users receive the runtime and workspace together as one export action
- keep artifact names stable and readable
- keep the workspace/runtime relationship explicit in the delivered artifact

It must not:
- broaden machine coverage
- redesign the runtime surface again
- introduce `pip` packaging or installation requirements
- publish a Python package
- change the helper-based execution model

---

## Artifact Shape

The delivered export should remain conceptually:
1. `mcw_runtime.py`
2. `<workspace>.py`

V1 may package these together for delivery convenience, but it must not turn the export into:
- an installed dependency
- a Python package layout
- a multi-directory scaffold

If bundling is used, it should stay minimal and obvious:
- one archive
- containing exactly the expected Python artifacts
- with no hidden generated extras unless explicitly justified

---

## Delivery Rule

The export action should hand off the runtime and workspace together in a way that reduces browser friction and reduces the chance that the files become separated.

The immediate goal is reliability and clarity, not ecosystem packaging.

That means:
- one deliberate handoff action
- clear artifact names
- no extra installation steps

---

## Parity Requirement

Parity must hold against the current shipped two-file export behavior:
- same sink output lines
- same ticked sink output lines
- same compatibility boundary
- same generated machine behavior

This slice must not change what exports successfully or how exported Python executes.

---

## Suggested V1 Scope

The first bounded delivery-UX slice should prove:
- one stateless export handoff
- one temporal export handoff
- one structured export handoff

It does not need to prove:
- package publishing
- runtime installation workflows
- alternative archive formats
- multi-workspace export bundles

---

## Success Condition

This slice is successful when:
- the two-file export is handed to the user as one reliable product action
- the delivered artifact keeps the runtime/workspace relationship obvious
- two-file parity remains intact
- MCW’s Python export feels less like “two separate downloads” and more like one coherent export handoff
