# ECC Point Python Export Parity V1

Last updated: May 2, 2026
Status: Proposed

## Purpose

Finish the remaining Python export debt for the shipped ECC point-teaching line without broadening the product surface again.

This slice follows:

- [Elliptic Curve Point Mechanics V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ELLIPTIC-CURVE-POINT-MECHANICS-V1.md)
- [Scalar Multiplication V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/SCALAR-MULTIPLICATION-V1.md)
- [Visible ECDH V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-ECDH-V1.md)
- [Point Order and Subgroups V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/POINT-ORDER-AND-SUBGROUPS-V1.md)
- [Visible Schnorr V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-SCHNORR-V1.md)

It is not a new ECC capability contract.
It is not a named-curve contract.
It is not an export-productization contract.

It is a bounded parity-cleanup contract for the ECC point family MCW already ships.

## Why This Slice Exists

MCW’s ECC teaching line is now real:

- visible `ec-point` signals
- point construction and validation
- negation, addition, doubling
- scalar multiplication
- visible ECDH
- point order and subgroup structure
- visible Schnorr-style signing and verification

But Python export still reflects the order the teaching slices shipped rather than the full point-family surface.

That creates an avoidable mismatch:

- the workbench can teach the ECC line end to end
- exported Python can replay only part of that line cleanly

This slice exists to remove that mismatch before more ECC work accumulates on top of it.

## Current Shipped Baseline

At the time this contract was written, Python export already supports:

- `PointSource`
- `PointAdd`
- `PointOrder`
- `PointEquals`
- `ScalarMultiply`
- `ChallengeCombine`
- `ScalarLinearCombine`
- point sinks and the current point-domain runtime helpers

The main remaining primitive gaps are:

- `PointOnCurve`
- `PointNegate`
- `PointDouble`

The main remaining parity gap is not “engine support exists but export does not.”
It is “the full shipped ECC teaching line has not yet been exercised end to end through exported Python with deliberate coverage.”

## Problem

If MCW says a visible ECC teaching workspace is real, users should be able to:

- run it in the app
- export it to Python
- run the exported Python
- get the same visible sink results

The exporter should not lag behind the shipped ECC point family in a way that makes some teaching workspaces feel first-class and others feel partial.

## Scope

### In scope

- add Python export support for the remaining shipped point primitives:
  - `PointOnCurve`
  - `PointNegate`
  - `PointDouble`
- extend the Python runtime helper layer only as much as needed to support those primitives honestly
- add export parity tests for the full shipped ECC point family
- add export parity tests for the key shipped ECC teaching workspaces
- tighten any small exporter/runtime wording or helper behavior needed to keep point-domain behavior consistent between engine and Python

### Out of scope

- new ECC primitives
- new learning content
- named curves
- export UI productization
- generalized export cleanup outside the ECC point family
- ECDSA or other new signature work

## Required Product Behavior

### 1. Export must not trail the shipped ECC point family

If a point primitive already ships in the workbench and belongs to the current pedagogical ECC line, Python export should support it unless there is a deliberate and documented reason not to.

For this slice, that means the remaining point primitives must stop being silent holes in the export surface.

### 2. Export must preserve the same visible point semantics

The Python runtime must preserve:

- explicit curve provenance
- explicit infinity
- cross-curve mismatch failure
- same-curve membership checks
- point-domain rather than coordinate-only reasoning

It must not flatten points into an ad hoc tuple format that weakens the existing engine semantics.

### 3. Export errors must stay honest

If a workspace violates point-family assumptions in exported Python, the failure should remain explicit and interpretable.

That includes:

- invalid source points
- cross-curve mismatch
- infinity where the module requires an affine point
- point-order observation-limit failure

This slice must not weaken visible engine behavior into vague export-time or runtime crashes.

## Primitive Coverage Requirements

### 1. `PointOnCurve`

Python export must support the shipped `PointOnCurve` primitive in a way that preserves:

- explicit receiving curve params `p`, `a`, `b`
- explicit cross-curve mismatch failure
- one-bit output parity with the engine

### 2. `PointNegate`

Python export must support the shipped `PointNegate` primitive in a way that preserves:

- same-curve point negation
- explicit infinity passthrough
- explicit cross-curve mismatch failure

### 3. `PointDouble`

Python export must support the shipped `PointDouble` primitive in a way that preserves:

- visible infinity on `y = 0`
- same-curve doubling semantics
- explicit cross-curve mismatch failure

### 4. Do not broaden the point surface beyond what already ships

This slice should not opportunistically introduce:

- new curve helpers
- new point-domain abstractions
- new signature-only helpers

Only the support needed for parity should land.

## Test Requirements

### 1. Primitive parity tests

Add direct Python-export parity tests for:

- `PointOnCurve`
- `PointNegate`
- `PointDouble`

These tests should compare exported Python output against `executeProject(...)` behavior, not merely smoke-test that generated code runs.

### 2. Workspace parity tests

Add or extend exported-Python parity coverage for these shipped ECC workspaces:

- visible point mechanics
- visible scalar multiplication
- visible ECDH
- visible point order and subgroups
- visible Schnorr

The point of this requirement is not to test everything twice.
It is to prove that the shipped ECC teaching line can be replayed end to end through Python export.

### 3. Keep parity tests intentional, not gigantic

Do not try to exhaustively export every seeded demo in this slice.

Pick the ECC workspaces that represent the real point-family ladder and keep those tests explicit and named.

## Implementation Notes

### 1. Prefer reusing the existing point helper vocabulary

The exporter already ships core helpers such as:

- `_normalize_ec_curve`
- `_expect_ec_point`
- `_ec_point_add`
- `_ec_point_double`
- `_create_affine_point`
- `_create_infinity_point`

Claude should extend this layer carefully rather than inventing a parallel ECC runtime model.

### 2. Current known export gap

At the time of writing, the exporter already covers:

- `PointSource`
- `PointAdd`
- `PointOrder`
- `PointEquals`
- `ScalarMultiply`
- `ChallengeCombine`
- `ScalarLinearCombine`

The parity gap is therefore concrete and bounded, not speculative.

### 3. Keep sink behavior stable

`PointOutput` formatting and sink semantics should not change in this slice except where a minimal bug fix is needed for parity.

### 4. No hidden “close enough” fallback

If Claude discovers that one of the supposedly shipped point primitives still depends on a missing or ambiguous engine behavior, that should be called out explicitly rather than papered over in the Python path.

But the default expectation is that this slice is implementable as parity work, not that it will reveal a new architectural branch.

## Success Criteria

This slice is successful when:

1. the remaining shipped ECC point primitives export to Python cleanly
2. exported Python preserves the same point-domain semantics as the engine for those primitives
3. the key shipped ECC teaching workspaces execute with matching sink outputs in the exporter parity tests
4. no new ECC capability is added as part of the parity cleanup
5. the shipped ECC line no longer has obvious “works in the app, not in export” holes inside the point family

## Likely Next Step

After this slice, the next honest branch should be chosen deliberately:

- stay on export/product completeness work if more parity debt remains
- or return to new pedagogical capability with a fresh contract

This parity slice should close a boundary, not blur it.
