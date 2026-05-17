# Schnorr Nonce Reuse Consequence V1

Last updated: May 17, 2026
Status: Shipped on feature/aes-column-perturbation

---

## Purpose

Add the next bounded ECC misuse-teaching slice for MCW so students can see one concrete signature failure mode as a live machine consequence rather than only hearing the warning in prose.

This slice follows:

- [Visible Schnorr V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-SCHNORR-V1.md)
- [ECC Rigor Pass V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-RIGOR-PASS-V1.md)
- [Visible Double-And-Add V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-DOUBLE-AND-ADD-V1.md)
- [Toy Curve Point Map V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/TOY-CURVE-POINT-MAP-V1.md)

It is not an ECDSA contract.
It is not a generic ECC attack lab.
It is not a production key-recovery tool.

It is one bounded consequence slice: show that reusing the same Schnorr nonce across two visible pedagogical signatures produces the same commitment point and collapses signer secrecy in a way students can trace.

---

## Why This Slice Exists

MCW’s ECC line is now strong in structure and intuition:

- visible point mechanics
- visible scalar multiplication
- visible double-and-add
- visible ECDH
- visible point order and subgroups
- visible Schnorr-style signing
- toy-curve point-map intuition

But the main remaining weakness is operational consequence.

The current Schnorr surface says plainly:

- nonce freshness matters
- nonce reuse is dangerous

That is honest, but still abstract.

The next highest-value ECC improvement is to let students see:

- two signatures sharing the same visible nonce commitment point `R`
- the same response structure used twice under different challenges
- why that repeated nonce collapses the signature story from “proof of knowledge” into “recoverable relation”

without pretending MCW has become a general-purpose exploit framework.

---

## Scope

### In scope

- one bounded visible Schnorr nonce-reuse flagship board
- one tutorial
- one repair challenge
- one or two small bounded helpers only if the current scalar/integer surface cannot express the recovery arithmetic honestly enough
- manual/library/atlas coverage for anything new in the slice
- bounded seeded tests and known-answer vectors

### Out of scope

- ECDSA nonce reuse
- generic lattice/fault/malleability labs
- named-curve real-world attack claims
- full production hash/encoding/signature pipelines
- broad ECC exploit infrastructure
- arbitrary “recover any secret from any malformed signature” surfaces

---

## Strategic Principle

V1 must separate three things clearly:

- the structural misuse
- the visible algebraic consequence
- the cryptographic claim boundary

The slice succeeds only if a student can read:

- the same nonce produced the same visible commitment point `R`
- two different challenges and responses now expose enough structure to recover the secret scalar on this pedagogical board
- this demonstrates a real signature failure mode
- this does not by itself turn MCW into a production exploit or certify real-world attack conditions beyond the bounded misuse shown

It is not enough to say:

- “nonce reuse is bad”
- “the signatures match strangely”
- “the private key can be found”

without showing how the machine exposes that consequence.

---

## Required Product Behavior

### 1. The misuse must be visible as two signatures sharing one nonce commitment

The flagship board must show two Schnorr-style signatures over:

- the same visible base point `G`
- the same visible secret scalar `x`
- the same visible nonce scalar `r`
- two different visible messages or challenges

The product must make the shared commitment point `R` visible as the first misuse fact.

### 2. The recovery path must stay graph-visible

Students must be able to see the bounded recovery structure, not just its result.

At minimum the board must make visible:

- `s1`
- `s2`
- `c1`
- `c2`
- `s1 - s2`
- `c1 - c2`
- one explicit division or inversion step modulo subgroup order `n`
- the recovered secret scalar `x`
- one visible equality check that the recovered scalar matches the original pedagogical signer secret

V1 must not hide the full consequence in one opaque `RecoverSecret` box unless the surrounding graph still shows the exact scalar ingredients and the helper stays narrowly named.

Regardless of whether a bounded helper is introduced, these recovery facts must remain graph-visible outside it:

- `Δs = s1 - s2 mod n`
- `Δc = c1 - c2 mod n`
- the modular inversion or division step over `Δc`

### 3. The arithmetic modulus must stay explicit

The slice must keep saying and showing:

- this recovery arithmetic is modulo subgroup order `n`
- that modulus is not the curve prime `p`
- this is scalar-order arithmetic, not point-coordinate field arithmetic

### 4. The result must be machine-checked

The flagship board must end in a visible equality result:

- recovered secret scalar equals original pedagogical secret scalar

This can be an `Equals` result in the integer or bits domain after explicit bridging if needed.

### 5. The nonce-failure claim must stay bounded

The product may say:

- nonce reuse in Schnorr-style signing is catastrophic
- reusing the same nonce across distinct signatures can expose the secret scalar

The product must not say:

- this board proves a real deployed system is exploitable
- this toy recovery path is a drop-in production attack
- all signature misuse cases collapse the same way

### 6. The board must stay live

If the repeated nonce is repaired so the two signatures no longer share the same nonce commitment, the recovery path must stop yielding the original secret scalar cleanly.

This must be a live machine effect, not a static before/after poster.

---

## Recommended Surface Shape

The strongest V1 shape is one flagship pedagogical workspace with three visible lanes:

1. one shared signer setup lane
   - base point `G`
   - secret scalar `x`
   - one reused nonce scalar `r`

2. two signature lanes
   - message or challenge lane A
   - message or challenge lane B
   - both lanes visibly share the same `R`

3. one recovery lane
   - compute `Δs = s1 - s2 mod n`
   - compute `Δc = c1 - c2 mod n`
   - compute `x = Δs / Δc mod n`
   - compare recovered `x` to the original visible pedagogical secret scalar

The board should feel like a glass-box misuse autopsy, not like two unrelated signature boards placed near each other.

---

## Pedagogical V1 Choice

V1 should commit to one small pedagogical Schnorr misuse shape:

- one toy visible curve
- one visible subgroup order `n`
- one visible signer secret scalar `x`
- one visible reused nonce scalar `r`
- two small visible messages or pre-chosen challenge values

V1 should prefer reusing the shipped pedagogical Schnorr ingredients rather than introducing real hashing or serialization.

The point is not realistic transcript encoding.
The point is showing the consequence of one repeated nonce.

---

## Primitive Strategy

### Preferred path

Build the recovery lane from shipped machinery whenever possible:

- integer sources
- scalar-order arithmetic helpers already in the Schnorr line
- explicit modulo/inverse helpers
- equality sinks

### Acceptable bounded helpers

If the current integer or scalar surface cannot express the recovery path honestly enough, V1 may add one small helper such as:

- `ScalarRecoverFromNonceReuse`
- or one narrower arithmetic helper for visible modular division over scalar order `n`

Any helper introduced here must:

- be narrowly named
- state it is scalar-order arithmetic
- ship with a micro demo
- not masquerade as a general ECC attack primitive

### Unacceptable helpers

Do not add:

- `BreakSchnorr`
- `RecoverAnySecret`
- `ExploitSignature`
- a generic “ECC Attack” dashboard

---

## Data / Content Guidance

V1 commits one concrete seeded pedagogical transcript family up front.

Committed V1 values:

- subgroup order `n = 11`
- signer secret scalar `x = 7`
- reused nonce scalar `r = 3`
- first challenge `c1 = 4`
- second challenge `c2 = 9`

Resulting responses under `s = r + cx mod n`:

- `s1 = 3 + 4·7 mod 11 = 9`
- `s2 = 3 + 9·7 mod 11 = 0`

Committed recovery path:

- `Δs = s1 - s2 mod 11 = 9`
- `Δc = c1 - c2 mod 11 = 6`
- `Δc^-1 mod 11 = 2`
- recovered `x = Δs / Δc mod 11 = 9 · 2 mod 11 = 7`

These exact values must anchor:

- seeded board content
- tutorial copy
- challenge acceptance
- helper tests if a new bounded recovery helper is introduced

V1 should keep these small hand-checkable values rather than replacing them with larger opaque transcript constants.

---

## Tutorial

Ship one tutorial focused on the flagship misuse board.

Recommended shape:

1. identify the shared signer setup and the reused nonce
2. point at the two signature lanes and show that they share the same visible commitment point `R`
3. identify the two different challenge values
4. read the two different response values
5. trace the recovery lane through `Δs`, `Δc`, and the scalar-order division step
6. end on the equality check showing recovered `x` matches the original visible pedagogical signer secret
7. state explicitly:
   - the misuse was nonce reuse
   - the consequence was secret-scalar recovery on this pedagogical board
   - this demonstrates the algebraic structure of the failure, not a complete production attack; real Schnorr systems also depend on hashing, serialization, and implementation details this board does not model

The tutorial must not re-teach the entire Schnorr signature slice from scratch.

---

## Challenge

Ship one repair challenge.

Recommended break:

- both signature lanes are initially wired to the same constant nonce-source module emitting `r = 3`
- the student must rewire the second signature lane to its own distinct constant nonce-source module emitting a different nonce value

The repaired board should:

- no longer share the same commitment point `R`
- no longer let the recovery lane reproduce the original secret scalar cleanly

The challenge is a bounded rewiring repair:

- broken state: both lanes read from the same nonce-source module
- intended repair gesture: reconnect the second signature lane to its own distinct nonce-source module
- not a broad graph rewrite and not a large parameter-edit sweep

---

## Implementation Notes

### 1. Reuse the shipped Schnorr story where possible

Do not build a second disconnected signature language.
This slice should clearly follow the visible Schnorr board already shipped.

### 2. Keep scalar recovery arithmetic pure and testable

Any helper logic used for the recovery lane must live in pure testable code, not inline UI prose.

### 3. Keep the point/secret distinction explicit

Students should never be left with the impression that recovering a point is the same thing as recovering the secret scalar.
The board should show the scalar-domain recovery result explicitly.

### 4. Keep the curve pedagogical

Do not force real-scale or named-curve ergonomics into this slice.
The point is consequence legibility, not prestige.

---

## Testing Requirements

1. `npx vitest run` must pass
2. `npm run build` must pass
3. the flagship board must show the same visible commitment point `R` on both signature lanes in the broken nonce-reuse state
4. the recovery lane must reproduce the named seeded secret scalar exactly in the broken nonce-reuse state
5. the repair challenge must stop that equality from holding when the second nonce is restored to a distinct value
6. any new scalar-order helper must have direct unit coverage on the named known-answer vector

---

## Success Criteria

This slice is successful when:

1. students can point to nonce reuse as the exact structural misuse
2. students can trace how two signature transcripts collapse into one scalar recovery path
3. the product demonstrates the consequence as a live machine fact, not just as a warning sentence
4. the board stays bounded and pedagogical rather than turning into a generic ECC exploit surface
5. the wording stays honest about what the board does and does not prove

---

## Likely Follow-On

If this slice ships cleanly, the next ECC direction should be reassessed from code rather than assumed automatically.

Plausible follow-ons after this are:

- one bounded subgroup or cofactor pitfall slice
- one bounded real-scale Schnorr consequence slice later, only if the pedagogical misuse line is already solid
- or an eventual ECDSA teaching slice, but only after nonce and failure-mode framing is mature enough
