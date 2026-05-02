# Visible ECDH V1

Last updated: May 2, 2026
Status: Shipped

## Purpose

Add the first honest elliptic-curve key-agreement teaching slice for MCW so students can see how two private scalars, one shared base point, and repeated point action produce the same shared secret on both sides.

This slice follows:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Elliptic-Curve Point Mechanics V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ELLIPTIC-CURVE-POINT-MECHANICS-V1.md)
- [Scalar Multiplication V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/SCALAR-MULTIPLICATION-V1.md)

It is not a signature contract.
It is not a named-curve contract.
It is not a production-security contract.

It is the first bounded protocol layer that makes the elliptic-curve machinery teach a real asymmetric story.

## Problem

MCW now has enough ECC substrate to express:

- exact integer arithmetic
- visible integer-domain values
- prime-field arithmetic
- visible points with curve provenance and infinity
- point addition, negation, doubling
- scalar multiplication

That is enough to teach local curve mechanics.

It is not yet enough to teach the first protocol insight students actually need:

- each side keeps a private scalar
- each side derives a public point from the same base point
- each side combines its private scalar with the other side's public point
- both sides land on the same shared secret point

Without a bounded ECDH slice, the current ECC work risks feeling like isolated math parts rather than a coherent cryptographic system.

## Goal

Add one bounded visible ECDH teaching path that:

- keeps private scalars explicit
- keeps public-key derivation explicit
- keeps the shared-secret derivation explicit
- makes both sides' equality visible and testable
- states clearly what the demo does and does not prove

The result should let a student explain:

- what stays private
- what becomes public
- why the same base point matters
- why both sides meet at the same shared point

## Scope

In scope:

- one bounded visible ECDH demo workspace
- one tutorial that walks through private scalar, public point, and shared secret derivation
- one challenge that tests whether the student can restore or complete an ECDH graph
- bounded compare/verification support so students can see that both sides agree
- explicit output wording for public points vs shared-secret point
- micro demos for any new primitive introduced in this slice

Out of scope:

- signatures
- named-curve catalogs
- PEM, DER, SEC1, or real deployment formats
- point compression
- KDFs
- symmetric encryption built on the shared point
- protocol transcript shells
- real-world deployment claims

## Required Product Behavior

1. A student must be able to see that the shared secret comes from repeated point action on a shared base point, not from a magic protocol box.
2. Private scalars must remain explicit and distinguishable from public points.
3. Public-key derivation must remain visible as scalar multiplication on the shared base point.
4. Shared-secret equality must be visible and testable from both sides.
5. The product must say clearly that a visible small-curve ECDH demo is a pedagogical model, not a deployment recipe.

## Recommended V1 Shape

V1 should prefer one bounded, explicit protocol assembly over a new black-box module.

Recommended path:

- build visible ECDH from the shipped point/scalar primitives
- add only the smallest supporting surface needed to make the protocol legible
- do not introduce an `ECDH` black-box primitive in V1

Recommended topology:

- one shared `PointSource` for the base point `G`
- that single visible `G` output fans out to both Alice and Bob public-key derivation legs
- both shared-secret derivation legs must depend on public points ultimately derived from that same visible `G`

Why:

- the protocol is only educationally valuable if the student can inspect the moving parts
- MCW's standard is visible mechanism, not hidden convenience

## Primitive Strategy

V1 should avoid adding a protocol primitive unless there is a truly necessary supporting helper.

Preferred approach:

- use existing `PointSource`, `ScalarMultiply`, `PointOutput`, and current comparison/verification surfaces
- add one narrow equality helper as the required comparison surface for shared-secret agreement
- if any further helper is required, it must be narrow, explicit, and justified as a visibility aid rather than a protocol abstraction

Required helper:

- `PointEquals`

Recommended shape:

- inputs:
  - two `ec-point` inputs
- output:
  - one `bits` output representing equality as a visible 1-bit result
- behavior:
  - emits `1` when the points are equal
  - emits `0` when the points are unequal
  - fails visibly on cross-curve mismatch or invalid point-domain input

Examples of other acceptable helpers only if needed:

- a bounded labeled public/private sink variant

Examples of unacceptable helpers in V1:

- `ECDHParty`
- `ECDHExchange`
- `MakeSharedSecret`

## Domain Semantics

### Private scalars

Private scalars in V1 are:

- exact visible `integer` values
- pedagogical stand-ins for private keys

They are not:

- secure secret-storage abstractions
- hidden credentials
- implied real-world key material

The tutorial must say this plainly:

- in MCW, the scalar is intentionally visible so students can understand the algebra
- “private” in this slice means “kept secret in the real protocol model,” not “hidden from the classroom workspace”

### Public points

Public outputs in V1 are:

- visible `ec-point` values derived as `aG` or `bG`

They are not:

- encoded wire-format keys
- compressed points
- real deployment artifacts

### Shared secret

The shared secret in V1 is:

- a visible `ec-point`

V1 should not pretend that this point is already a finished symmetric key.
If later slices derive a key from it, that must be another explicit step.

## Engine Requirements

### 1. Build from visible primitives

The visible ECDH path should be assembled from shipped ECC primitives.

Do not hide:

- base-point selection
- private-scalar input
- public-point derivation
- peer-public-point reuse
- shared-secret derivation

### 2. Shared base point is explicit

The demo and tutorial must make the shared base point visible as a first-class point in the graph.

Students should be able to see that both public keys and both shared-secret derivations depend on the same base point.

V1 should make this correct by construction in the flagship demo and tutorial:

- use one shared `PointSource` instance for `G`
- fan that same output into both scalar-multiplication branches

Do not build the primary demo around two separately authored base-point sources that merely happen to match.

### 3. Equality is visible

Students must be able to see that:

- `a(bG)`
- `b(aG)`

land on the same visible point.

V1 should not rely on visual side-by-side inspection alone for the primary protocol payoff.

The required equality surface is:

- a narrow `PointEquals` helper whose visible output is wired to a sink

Side-by-side point outputs may still appear in the demo, but they are secondary to the explicit equality result.

### 4. No hidden key derivation

V1 must not silently turn the shared point into:

- a byte string
- a symmetric key
- a hidden downstream protocol value

If anything beyond the point is shown, it must be visibly identified as an extra pedagogical step and not part of V1 by default.

### 5. Honest small-curve framing

V1 must say plainly that the visible ECDH path uses pedagogically small curves and explicit values so students can inspect the mechanism.

It must not imply:

- real-world performance
- real-world parameter sizes
- or direct deployment safety

## UI Requirements

### 1. Private vs public role language

The product surface must distinguish clearly between:

- private scalar
- public point
- shared secret point

At minimum this should appear in:

- demo/tutorial wording
- module/sink labels or surrounding explanatory copy
- user manual language

### 2. Equality visibility

The shared-secret comparison should read clearly as:

- “both sides agree”

not merely:

- “these two outputs look similar”

The primary visible equality surface should be:

- a dedicated 1-bit equality result from `PointEquals`
- routed to an explicit sink with role language such as `Shared secrets agree`

### 3. What this does not prove

At minimum the ECDH-facing library/detail or tutorial copy must say:

- this shows how both sides derive the same shared point
- this does not prove real-world security
- this does not include key derivation or authenticated protocol design

At minimum this should appear in:

- the tutorial at the shared-secret stage
- and the shared-secret sink or surrounding explanatory copy in the flagship demo

## Teaching Requirements

V1 must ship:

- one main visible ECDH demo
- one tutorial
- one challenge

The main demo should show:

- shared base point `G`
- Alice private scalar `a`
- Bob private scalar `b`
- public points `aG` and `bG`
- shared-secret derivations `a(bG)` and `b(aG)`
- visible equality of the two shared points through `PointEquals`

The tutorial should explicitly explain:

- what is private
- what is public
- why both sides can agree
- why the shared point is not yet “finished encryption”
- why the private scalars are still intentionally visible in MCW's classroom model

The challenge should require at least one active repair step such as:

- reconnecting a broken shared-secret leg
- restoring the correct base-point flow
- fixing a public/shared-role mixup, such as routing a public point sink where the shared-secret equality leg should go

The challenge should use a broken-workspace format rather than a blank construction format.

## Micro Demos

If this slice introduces any new helper primitive, it must ship with a micro demo.

Because `PointEquals` is required in this slice, V1 must ship:

- one `PointEquals` micro demo

And V1 should also add one minimal ECC protocol micro demo that isolates:

- shared-secret equality from two already-derived public points

Do not treat a repeated public-key-derivation demo as sufficient here; scalar-multiplication micro demos already cover that layer.

## Validation Requirements

V1 must preserve the current ECC validity rules:

- curve params valid
- points valid for the declared curve
- cross-curve mismatches rejected visibly
- infinity handled honestly

If a new equality helper is added, it must not silently coerce domains or flatten points into anonymous text.

## Python Export

Python export is not the main purpose of this slice.

Preferred V1 rule:

- export parity is expected for the flagship visible ECDH demo if it can be achieved through the already-shipped point/scalar export surface plus `PointEquals`
- do not widen this slice into a generalized ECC export cleanup

If a missing export gap blocks the demo, record it explicitly and split it into:

- `ECC-POINT-PYTHON-EXPORT-PARITY-V1`

rather than smuggling broad export debt into the protocol slice.

## Non-Goals

V1 is not trying to:

- finish ECC
- teach signatures
- compress the full real-world ECC stack into one experience
- market MCW as production-ECC software

It is trying to make the first asymmetric elliptic-curve protocol legible and explainable.

## Success Criteria

V1 is successful if:

1. a student can inspect an ECDH graph and explain what stays private, what becomes public, and why both sides agree
2. the shared secret is visibly derived on both sides rather than hidden in a protocol box
3. the product clearly states that the visible shared point is not yet a finished symmetric key or real-world deployment surface
4. the shipped demo, tutorial, and challenge make the protocol active rather than passive
5. the slice does not widen into signatures, key derivation, or broad export cleanup
