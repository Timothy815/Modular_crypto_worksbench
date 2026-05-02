# Visible Schnorr V1

Last updated: May 2, 2026
Status: Shipped

## Purpose

Add the first honest signature teaching slice to MCW using Schnorr-style signing rather than jumping directly to ECDSA.

This slice follows:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Visible ECDH V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-ECDH-V1.md)
- [Point Order and Subgroups V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/POINT-ORDER-AND-SUBGROUPS-V1.md)
- [ECC Rigor Pass V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-RIGOR-PASS-V1.md)

It is not an ECDSA contract.
It is not a named-curve contract.
It is not a production signature API.

It is a bounded glass-box signature-teaching contract.

## Why Schnorr First

MCW now has enough visible ECC structure to support the next real asymmetric idea:

- a secret scalar
- a visible base point
- scalar multiplication
- visible subgroup/order intuition
- a clear difference between a public point and a shared point

Schnorr is the right first signature line because it is structurally clearer than ECDSA:

- one nonce-derived point commitment
- one challenge
- one response
- one clean verification equation

That fits MCW’s live-machine standard better than ECDSA’s more failure-prone shape.

## Problem

Students can currently see:

- how scalar multiplication acts on visible points
- how ECDH lands on a shared point
- why subgroup size matters

They still cannot see how a private scalar can prove knowledge without being revealed.

If MCW wants a first honest signature wing, it should teach:

- commitment point generation
- challenge formation as an explicit stage
- response computation as an explicit stage
- verification as an equality of visible point-domain paths

without collapsing the whole story into a black-box `Sign` or `Verify` primitive.

## Pedagogical V1 Choice

To keep the slice honest and implementable, V1 should commit to one concrete pedagogical Schnorr shape:

- one visible message value in the `integer` domain
- one visible challenge stage that combines:
  - the nonce commitment point `R`
  - the public key point `P`
  - the visible message value `m`
- one explicit scalar-order modulus `n`

This means V1 is not pretending to ship `H(R || P || m)` as a production hash.

Instead, V1 ships a visible pedagogical challenge stage whose surrounding copy says:

- this stands in for the challenge-forming role of hashing in real Schnorr
- this is a teaching combiner, not production-safe hashing or encoding
- the important structural idea is that the signer and verifier use the same challenge value derived from the same visible ingredients

## Required Product Behavior

### 1. The signature story must stay graph-visible

Students should be able to see:

- the secret scalar role
- the nonce scalar role
- the public key derivation
- the commitment point derivation
- the challenge value
- the response value
- the final verification equality

The product should not hide the whole workflow inside a single opaque signature block.

### 2. Verification must reduce to visible equality

The educational payoff of this slice is that verification can be seen as:

- one point-domain path on the left
- one point-domain path on the right
- a visible equality result

The product must make that visible rather than merely stating that verification succeeded.

### 3. Nonce discipline must be named, but bounded

The slice should say plainly:

- the nonce matters
- nonce reuse is dangerous

But V1 should not expand into a full nonce-misuse lab unless that stays trivially bounded.

At minimum, the tutorial or challenge copy must identify nonce freshness as a real boundary.

### 4. Message handling must stay honest

V1 should not pretend to ship full cryptographic hashing or domain separation as part of “real Schnorr.”

V1 should use one explicit pedagogical challenge-combine stage rather than leaving the challenge implicit or manually edited in multiple places.

That stage must say:

- this is a pedagogical challenge stage
- this is not a production-safe signature construction by itself
- this stands in for the challenge-forming role of hashing and encoding in real Schnorr

### 5. The private/public/signature distinction must stay explicit

The product must distinguish:

- private scalar
- public point
- signature commitment point
- signature response scalar

and should not let those blur together into generic “ECC values.”

## Scope

### In scope

- one bounded visible Schnorr teaching workspace
- one tutorial
- one repair or interpretation challenge
- manual and library coverage for any newly introduced teaching helper primitives
- micro demos for any newly introduced primitives in this slice

### Out of scope

- ECDSA
- named curves
- production signature claims
- complete hash/KDF/signature productization
- broad export cleanup outside the slice

## Primitive Strategy

### Preferred path

Build the visible Schnorr teaching workspace from already-shipped machinery whenever possible:

- visible integer values
- visible points
- scalar multiplication
- point equality
- prime-field arithmetic

### Acceptable bounded helpers

If the current surface cannot express the signature graph honestly enough, V1 may add small helpers such as:

- a bounded `ChallengeCombine` helper
- a bounded `ScalarLinearCombine` helper over the integer domain with explicit scalar-order modulus `n`
- a bounded verification-side equality helper if the existing point equality surface is not enough

Any helper introduced here must:

- be visibly named for what it does
- be documented in the manual
- ship with a micro demo
- not masquerade as a full `Sign` or `Verify` shell

### Unacceptable helpers

Do not add:

- `SchnorrSign`
- `SchnorrVerify`
- `ECCSignature`
- `SecureSignaturePreset`

as opaque V1 primitives.

### Required scalar-order honesty

If V1 introduces scalar-domain arithmetic for the response computation, it must acknowledge explicitly:

- the response scalar is computed modulo the subgroup order `n`
- that modulus is not the curve prime `p`
- the shipped prime-field family over `p` is therefore not enough by itself for the response computation

So if helper arithmetic is needed for:

- `s = r + cx mod n`

it must be visibly framed as scalar-order arithmetic with explicit `n`, not silently reused `mod p` field arithmetic.

## Teaching Shape

The flagship workspace should show, at minimum:

1. public key derivation from a private scalar and visible base point
2. nonce commitment point derivation from a nonce scalar and the same base point
3. one bounded `ChallengeCombine` stage deriving `c` from visible `R`, `P`, and `m`
4. response computation from visible scalar ingredients with explicit scalar-order modulus `n`
5. verification as equality between two visible point-domain paths

The challenge stage should not be left abstract in V1.
It should be one concrete visible stage in the shipped flagship graph.

The public-key derivation stage can and should reuse the same visible scalar-multiplication story MCW already ships, but it should still appear inside the Schnorr workspace so the signature flow is self-contained.

## UI Requirements

### 1. The verification equation must be inspectable

The verify step should visibly support a mental model like:

- left path: `sG`
- right path: `R + cP`
- compare with a visible equality surface

Students should be able to inspect the operands and result as machine state, not only as tutorial prose.

V1 should commit to the graph topology for this payoff:

- one visible `ScalarMultiply` chain for `sG`
- one visible `ScalarMultiply` chain for `cP`
- one visible `PointAdd` stage for `R + cP`
- one visible `PointEquals` terminus comparing the two paths

The flagship demo should make those two verification paths visually distinct.

### 2. The tutorial must say what this does not prove

The tutorial should explicitly say:

- this is a visible pedagogical Schnorr-style signature flow
- it does not by itself imply production-safe hashing, encoding, or deployment correctness
- nonce freshness matters even though V1 does not become a full misuse lab

Placement requirements:

- the nonce-freshness warning must appear when the nonce is introduced, not only at the end
- the challenge-stage limitation must appear where the challenge value is first explained
- the production-boundary note must appear again at verification or wrap-up

### 3. The challenge should test one real mental-model repair

Good challenge candidates include:

- broken verification equation wiring
- wrong public-key branch in verification
- reused or misrouted nonce input
- challenge path connected to the wrong visible value

The challenge should be a broken-workspace repair, not a blank construction.

V1 does not need a full nonce-reuse attack lab.
Nonce-discipline may remain tutorial-first in this slice.
If the challenge uses a nonce-related error, it should be a wiring or freshness-role mixup rather than a full key-recovery demonstration.

## Python Export

Python export parity is in scope only if the visible flagship Schnorr workspace can be exported through the already-shipped arithmetic, point, and helper surface without widening the slice unsafely.

If a parity gap appears that would require a broader export tranche, it should be recorded explicitly and split into a follow-on contract rather than silently broadened here.

This clause should be read in the context of accumulated ECC export debt.
If this slice discovers that point/signature export gaps are now substantial enough to deserve their own planned follow-on, that follow-on should be named explicitly rather than left as an unnamed future cleanup.

## Success Criteria

This slice is successful when:

1. students can trace a visible Schnorr-style signing and verification flow end to end
2. the verification step reduces to visible equality of point-domain paths
3. nonce importance is named explicitly without the slice expanding into a large misuse lab
4. any new helper primitives remain small, explicit, documented, and micro-demo-backed
5. the slice does not drift into ECDSA, named-curve claims, or black-box signature widgets
