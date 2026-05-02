# Elliptic-Curve Point Mechanics V1

Last updated: May 2, 2026
Status: Shipped

## Purpose

Introduce the first honest elliptic-curve point layer for MCW so future scalar-multiplication and visible ECDH work can rest on inspectable point operations instead of black-box protocol shells.

This slice follows:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Exact Integer Substrate V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/EXACT-INTEGER-SUBSTRATE-V1.md)
- [Algebraic Signals V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ALGEBRAIC-SIGNALS-V1.md)
- [Prime-Field Arithmetic V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/PRIME-FIELD-ARITHMETIC-V1.md)

It is not a scalar-multiplication contract.
It is not an ECDH contract.
It is not a signature contract.

It is the point-mechanics layer required before those can be honest.

## Problem

MCW now has:

- an exact integer substrate
- a visible `integer` signal domain
- explicit `bits <-> integer` bridges
- real prime-field arithmetic over visible integer-domain values

That is enough to teach:

- finite-field arithmetic
- modular inverse in a prime field
- the idea that later curve work rests on field operations

It is not enough to teach elliptic curves honestly.

Without a visible point layer, future ECC work would be pushed toward one of two bad outcomes:

- hiding points inside anonymous tuples or opaque strings
- jumping directly to scalar multiplication or ECDH without showing the underlying point algebra

Both would violate MCW's product standard.

## Goal

Add the first bounded family of elliptic-curve point primitives and a visible point representation so a student can inspect and reason about:

- whether a point lies on a curve
- how one point is negated
- how two points are added
- how doubling is just a special point-addition case with different geometry/algebra

The result should be:

- a visible point-domain signal
- explicit curve parameters
- explicit visible failure for undefined or invalid point operations
- inspectable point outputs and intermediate values
- no protocol overclaiming

## Scope

V1 is intentionally narrow.

In scope:

- a visible `ec-point` signal domain
- one explicit point source/constructor path
- point-on-curve validation
- point negation
- point addition
- point doubling
- bounded inspector/readout support for point values
- one demo and one tutorial proving the point layer is usable

Out of scope:

- scalar multiplication
- ECDH
- signatures
- binary-field curves
- project-wide curve registries
- theorem-heavy analysis panels

## Required Product Behavior

1. A student must be able to tell when a value is a visible point rather than bits or integers.
2. A student must be able to inspect the coordinates of a point in a readable way.
3. Curve parameters must remain explicit in V1.
4. Invalid or undefined point operations must fail explicitly.
5. The product must not imply that visible point arithmetic means “ECC support is done.”

## Recommended V1 Shape

V1 should add exactly one new visible signal domain:

- `ec-point`

Do not combine:

- point mechanics
- scalar multiplication
- protocol composites

in one slice.

Why:

- point-domain typing is a new product and engine boundary
- addition and doubling already introduce nontrivial failure cases
- students need one stable layer to reason about before repeated-group action is added

## Domain Semantics

### `ec-point`

In V1, `ec-point` should mean:

- an affine point `(x, y)` on a declared short Weierstrass curve over a prime field
- or the point at infinity as an explicit visible value in the same domain

V1 must support the point at infinity explicitly and make it inspectable.

Required path:

- allow the point at infinity as an explicit visible `ec-point` value
- give it a dedicated inspector rendering such as `∞`

Do not hide infinity as:

- `null`
- missing output
- a fake coordinate pair

An `ec-point` signal must also carry enough exact, serializable curve provenance for downstream point primitives to verify that an incoming point belongs to the same declared curve context they are parameterized for.

This is not a hidden global registry.
It is explicit point-domain provenance needed to prevent silent wrong answers when points are connected into modules with mismatched curve parameters.

### Curve family

V1 should stay with:

- short Weierstrass curves over prime fields

That means curve parameters are the visible tuple:

- `p`
- `a`
- `b`

In V1, these curves are intentionally pedagogically small and remain bounded by the current safe-integer product surface.

MCW should say this honestly.
This slice is for visible point mechanics, not real-world named curve support.

MCW should not imply broader ECC coverage in this slice.

## Engine Requirements

### 1. Exact point arithmetic

All point operations must use:

- the exact integer substrate
- the shipped prime-field arithmetic rules

No point operation may depend on:

- floating-point geometry shortcuts
- hidden JS-number coercion
- fake “coordinate-looking” approximations

### 2. Visible point-domain I/O

Point operations must consume and emit visible `ec-point` signals.

V1 should not hide points inside:

- JSON strings
- comma-separated integers
- bits

unless a user explicitly crosses a bridge in a later slice.

### 3. Explicit curve parameters

V1 may keep curve parameters as module params if they stay within the supported exactness regime.

That means:

- `p`
- `a`
- `b`

remain explicit on each point primitive in V1.

Curve context must not be hidden in a global registry or ambient workspace state.

But V1 must not rely on repeated module params alone for correctness.

Every point-consuming primitive must verify that:

- the incoming point signal carries curve provenance
- that provenance matches the primitive's declared `p`, `a`, and `b`

Cross-curve mismatches must fail explicitly rather than compute a plausible-looking answer.

### 4. Point validity

V1 must define what happens when a visible point input is not on the declared curve.

Recommended path:

- reject the input explicitly at runtime

Do not silently reinterpret or “repair” an invalid point.

### 5. Undefined operations

V1 must define what happens in the obvious problematic cases:

- adding points from different curves
- doubling a point where the tangent formula is undefined
- adding inverse points

Required path:

- support infinity explicitly
- represent inverse-point addition and tangent-degenerate doubling as visible infinity where mathematically correct
- use explicit runtime failure only when the input itself is invalid or the module parameters are inconsistent

## Required Primitive Family

V1 should add a distinct point family such as:

- `PointSource`
- `PointOnCurve`
- `PointNegate`
- `PointAdd`
- `PointDouble`

Names can vary slightly, but the family should read clearly as point mechanics, not generic data transforms.

### Point source / constructor

V1 should include exactly one honest way to introduce a point into the graph.

Recommended path:

- `PointSource`
  - explicit params for `x`, `y`, `p`, `a`, `b`
  - validates that the point is on the declared curve

This is cleaner than trying to build a point from three or four separate integer wires in the same slice.

### Point-on-curve check

`PointOnCurve` must have explicit, non-ambiguous semantics in V1.

Recommended path:

- consume one `ec-point`
- emit a `bits` result expressing whether the point is on the receiving primitive's declared curve

This keeps the constructor/validator roles distinct:

- `PointSource` introduces one declared point and rejects invalid construction
- `PointOnCurve` is a visible checker a student can place in the graph

### Point add vs point double

V1 should expose both `PointAdd` and `PointDouble` as a deliberate teaching choice.

Why:

- doubling is mathematically a special case of point addition
- but it uses a distinct formula branch that students should be able to inspect directly

`PointAdd` should still handle the equal-input case honestly rather than fail just because the same point appears twice.
`PointDouble` exists so the special case has a first-class visible module, not because it is a fundamentally different algebraic operation.

## Validation Requirements

V1 must validate at least:

- `p` is present
- `p` is a positive safe integer prime at the current product surface
- `a` and `b` are present and in the field range
- curve discriminant is nonzero mod `p`
- `x` and `y`, where applicable, are in the field range
- `PointSource` points are on the declared curve

Because curve params are module params in V1, these checks should happen statically before execution where possible.

That means:

- prime validation is static, not deferred to runtime
- discriminant validation is static, not deferred to runtime
- source-point construction validity is static where all required params are present

Runtime validation should remain for:

- incoming point signals that do not match the receiving primitive's curve provenance
- malformed or out-of-context point values flowing through the graph

Validation should distinguish:

- invalid curve parameters
- invalid point construction
- cross-curve mismatch
- out-of-regime exactness boundary
- runtime invalid point input

## UI Requirements

### 1. Point readability

Selected point-domain values must render clearly in the inspector.

At minimum, V1 should support:

- coordinate display as `(x, y)`
- decimal always shown
- optional hex secondary view where appropriate
- explicit infinity rendering such as `∞`

The representation should read like a point, not a dumped object.

### 2. Sink honesty

If point values are shown at sinks or output-oriented panels, the UI must say what domain is being shown.

V1 should commit to:

- a visible domain chip or type badge

so a point cannot masquerade as plain text or integer output.

### 3. Mechanical explanation

Where bounded consequence or explanation copy appears, the product should teach:

- this is point arithmetic over a prime field
- it is foundational for later ECC work
- it does not by itself imply scalar multiplication, ECDH, or protocol security

At minimum, this limitation should appear in:

- the library/detail copy for the point family

## Teaching Requirements

V1 should include:

- one demo workspace
- one tutorial

Recommended teaching path:

1. start from one declared point on a small visible curve such as `y^2 = x^3 + 2x + 3 (mod 17)`
2. negate it
3. add the point and its negation
4. inspect the result as visible infinity
5. double a point and compare the result with plain addition of the point to itself

This path teaches:

- point identity and inverse
- visible curve membership
- point addition vs doubling

without jumping ahead to repeated multiplication or protocols.

These examples should also make the product boundary plain:

- V1 curves are intentionally small and pedagogical
- this slice does not attempt real-world named-curve support

Challenge content is optional in this slice.

## Non-Goals

V1 should not:

- add scalar multiplication
- add ECDH
- add signatures
- add named curve catalogs
- hide curve parameters in ambient state
- collapse the point family into one opaque “ECC math” module

This is a foundation slice, not a prestige shortcut.

## Success Criteria

V1 is successful if:

1. MCW has a clearly named visible point domain and point-mechanics family.
2. Point values are readable and inspectable without hiding their coordinates.
3. Curve validity and point validity are explicit and visible.
4. Undefined point cases are handled honestly rather than silently degraded.
5. MCW is in a materially stronger position for scalar multiplication work without yet pretending to support ECDH.

## Likely Next Step

If this slice succeeds, the correct follow-on is:

- `SCALAR-MULTIPLICATION-V1`

not protocol wrappers first.
