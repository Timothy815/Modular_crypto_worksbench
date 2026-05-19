# ECDH Low-Order Point Consequence V1

Last updated: May 19, 2026
Status: Shipped on feature/aes-column-perturbation

---

## Purpose

Add the next bounded ECC consequence slice for MCW so students can see that accepting the wrong peer point in visible ECDH can collapse the shared-secret space into a tiny, predictable set.

This slice follows:

- [Visible ECDH V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-ECDH-V1.md)
- [Point Order And Subgroups V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/POINT-ORDER-AND-SUBGROUPS-V1.md)
- [Toy Curve Point Map V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/TOY-CURVE-POINT-MAP-V1.md)
- [ECC Rigor Pass V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-RIGOR-PASS-V1.md)

It is not a generic invalid-curve attack lab.
It is not a named-curve exploit contract.
It is not a production peer-validation checklist.

It is one bounded operational-consequence slice: show that if one ECDH side multiplies its secret scalar by a low-order peer point, the resulting shared point can collapse into a tiny visible subgroup and stop behaving like an honest wide secret.

---

## Why This Slice Exists

MCW’s ECC line is now strong in:

- visible point mechanics
- visible scalar multiplication
- visible double-and-add
- toy-curve point-map intuition
- visible ECDH
- visible Schnorr signing
- Schnorr nonce-reuse consequence

That means students can now see honest ECC structure and at least one signature misuse consequence.

But a major protocol-side consequence gap remains:

- visible ECDH currently teaches agreement
- point-order work teaches subgroup structure
- the product still does not show what goes wrong if the peer point itself is the wrong structural object

The next highest-value ECC improvement is to connect those two already-shipped truths:

- some points have small order
- multiplying by such a point cannot produce a wide shared-secret space

without turning MCW into a general attack workbench.

---

## Scope

### In scope

- one bounded low-order-point ECDH consequence flagship board
- one tutorial
- one repair challenge
- one machine-visible consequence-reading surface for the shared-secret collapse
- one or two narrow helpers only if the current board cannot express the visible consequence honestly enough
- manual/library/atlas coverage for anything new
- bounded seeded tests and known-answer vectors

### Out of scope

- generic invalid-curve tooling
- named real-world curve exploit claims
- ECDSA or Schnorr follow-on misuse in the same slice
- full public-key validation frameworks
- broad “malicious peer” protocol dashboards
- automatic secure point acceptance certification

---

## Strategic Principle

V1 must separate three things clearly:

- the structural misuse
- the visible shared-secret consequence
- the cryptographic claim boundary

The slice succeeds only if a student can read:

- this peer point has low order
- the ECDH branch still computes mechanically
- but the possible shared points now live in a tiny visible subgroup
- that is why unvalidated peer points are dangerous

It is not enough to say:

- “bad public key”
- “small subgroup”
- “shared secret weaker”

without showing the machine consequence.

---

## Required Product Behavior

### 1. The low-order peer point must be explicit

The flagship board must visibly distinguish:

- one honest base point used for normal public-key derivation
- one malicious or wrong peer point of low order

The student must be able to inspect that point’s order directly on the board.

### 2. The protocol consequence must stay graph-visible

Students must be able to see:

- the low-order peer point
- its visible point order
- the victim private scalar
- one second distinct comparison private scalar
- the resulting shared point from multiplying the private scalar by that low-order point
- one equality surface showing that two different private scalars can collapse to the same shared point under that low-order peer

V1 must not collapse the entire story into one opaque “bad ECDH” result sink.

### 3. The consequence must be machine-visible, not only verbal

The board must end in one committed machine-visible consequence surface:

- two distinct private scalars feed the same low-order peer point
- both shared-point results are shown explicitly
- one `PointEquals` result shows they collapse to the same shared point

V1 should not leave the consequence shape open between multiple alternatives.

### 4. The subgroup boundary must stay explicit

The board must keep saying and showing:

- the low-order point lives on the same visible curve
- the failure is about subgroup/order structure, not generic curve invalidity alone
- the arithmetic still happens modulo the same point law

### 5. The claim boundary must stay bounded

The product may say:

- accepting a low-order peer point can collapse the shared-secret space
- peer-point validation matters

The product must not say:

- this toy board proves a deployed implementation is exploitable
- every bad ECDH point attack looks exactly like this
- the toy curve is a stand-in for a full production validation checklist

### 6. The board must stay live

If the peer point is repaired to the intended high-order point, the shared-secret collapse surface must stop showing the low-order consequence.

This must be a live machine effect, not a static before/after illustration.

---

## Recommended Surface Shape

The strongest V1 shape is one pedagogical workspace with three visible regions:

1. one honest setup lane
   - shared base point `G`
   - victim private scalar `a`
   - honest public point `aG`

2. one peer-point comparison lane
   - one honest peer public point
   - one low-order peer point
   - visible point-order readout for the low-order point

3. one consequence lane
   - compute `aQ_low`
   - compute `a'Q_low` for one second distinct private scalar
   - compare those two shared points with `PointEquals`

The board should feel like a protocol-side structural failure autopsy, not a generic ECC comparison poster.

---

## Pedagogical V1 Choice

V1 should commit to:

- one small toy curve already used in the shipped ECC line:
  - `p = 17`
  - `a = 2`
  - `b = 3`
- one honest base point:
  - `G = (15, 12)` with order `11`
- one honest peer public point derived from that base point:
  - `B = 2G = (8, 2)`
- one named low-order peer point on the same curve:
  - `Q_low = (16, 0)` with order `2`
- one victim private scalar:
  - `a = 3`
- one second distinct comparison private scalar:
  - `a' = 5`
- one committed collapse fact:
  - `aQ_low = (16, 0)`
  - `a'Q_low = (16, 0)`
  - therefore the equality sink on the low-order branch must emit `1`
- one committed honest-reference fact:
  - `aB = (14, 2)`

The point is not realistic parameter attack surface.
The point is showing why subgroup structure matters to protocol use.

---

## Preferred Product Shape

V1 should prefer the consequence shape that is easiest to read honestly:

- keep one victim private scalar fixed
- feed it one low-order peer point
- show the resulting shared point
- then show a second distinct private scalar producing the same shared point or another point in the same tiny subgroup cycle

That makes the collapse visible as:

- “different secrets do not spread over a wide shared-point space anymore”

without needing a large search dashboard.

---

## Primitive Strategy

### Preferred path

Build this slice from shipped ECC machinery whenever possible:

- `PointSource`
- `PointOrder`
- `ScalarMultiply`
- `PointEquals`
- existing integer bridges

### Acceptable bounded helpers

If the current board cannot express the consequence honestly enough, V1 may add one narrow helper such as:

- one bounded subgroup-membership comparison helper
- or one bounded consequence summary helper tied specifically to visible ECDH low-order collapse

Any helper introduced here must:

- be narrowly named
- remain clearly subordinate to the visible point arithmetic
- not masquerade as a general ECC validation oracle

---

## Data / Content Guidance

V1 is committed to one concrete seeded toy-curve family:

- curve:
  - `y^2 = x^3 + 2x + 3 (mod 17)`
- honest base point:
  - `G = (15, 12)`
  - order `11`
- honest peer scalar:
  - `b = 2`
- honest peer public point:
  - `B = (8, 2)`
- low-order peer point:
  - `Q_low = (16, 0)`
  - order `2`
- victim scalar:
  - `a = 3`
- comparison scalar:
  - `a' = 5`
- known shared-point outputs:
  - `aB = (14, 2)`
  - `aQ_low = (16, 0)`
  - `a'Q_low = (16, 0)`

The machine-visible collapse surface is therefore committed:

- `PointEquals(aQ_low, a'Q_low) = 1`

Prefer a point of very small order so the consequence is immediately legible.

The acceptance vectors should be small enough that the subgroup cycle can be read directly from the workspace and, ideally, cross-checked against the toy-curve point-map line.

---

## Tutorial

Ship one tutorial:

- `Why A Low-Order ECDH Peer Point Collapses The Secret`

The tutorial should show:

1. the honest ECDH setup ingredients
2. the wrong peer point and its visible order
3. the resulting shared point on the victim lane
4. the bounded shared-point family or repeated-outcome consequence
5. what this says about subgroup structure:
   - the shared-point space is bounded by the order of the peer point
   - a point of order `2` can only produce two subgroup outcomes: `∞` and `Q_low`
   - the collapse is caused by the order-`2` structure of `Q_low`, not by a “good” or “bad” choice of victim scalar
   - on this board, odd victim scalars land on `Q_low` and even victim scalars land on `∞`, which is still a tiny collapsed outcome space rather than safety
   - an adversarial peer point can therefore force the protocol into a tiny visible subgroup regardless of the victim’s scalar parity
6. what this does not prove about production ECDH

The final step should say explicitly:

- this demonstrates the algebraic structure of one low-order-point failure mode
- it does not by itself model full production peer validation, serialization, cofactor handling, or deployment conditions

---

## Challenge

Ship one repair challenge where:

- the starting board feeds the victim lane from the low-order peer point
- the student must restore the intended honest peer public point

The broken state must be explicit:

- the victim shared-secret multiply and the comparison shared-secret multiply are both wired to `Q_low = (16, 0)` instead of the honest peer public point `B = (8, 2)`

The repair gesture must be one bounded wiring correction:

- reconnect both low-order peer inputs from the `Q_low` source to the honest peer public-point source `B`

The challenge should begin in the low-order-collapse state and end with the honest ECDH agreement state.

---

## Implementation Notes

### 1. Start from shipped ECDH and subgroup truth

Do not invent a separate story about bad points.

This slice should grow directly out of:

- the shipped visible ECDH line
- the shipped point-order/subgroup line

### 2. Prefer one concrete low-order consequence over generic validation language

Students learn more from one explicit collapse than from a vague “always validate public keys” slogan.

### 3. Keep the visible result local and bounded

V1 should not become:

- a full point-census browser
- a curve-security scorecard
- a generic malicious-peer harness

---

## Testing Requirements

1. `npx vitest run` must pass
2. `npm run build` must pass
3. the seeded low-order point `Q_low = (16, 0)` has visible order `2`
4. the seeded honest peer public point is `B = (8, 2)`
5. the seeded honest victim shared point is `aB = (14, 2)`
6. the seeded low-order collapse outputs are:
   - `aQ_low = (16, 0)`
   - `a'Q_low = (16, 0)`
   - `PointEquals(aQ_low, a'Q_low) = 1`
7. the repair challenge begins in the low-order-collapse state and passes only when the honest peer point source is restored
8. the tutorial and challenge reference the real board modules they claim to teach

---

## Acceptance Criteria

1. a student can open one board and see that the peer point itself is the problem
2. a student can read that point’s low order directly
3. the shared-secret consequence is machine-visible rather than only verbal
4. the board stays bounded and pedagogical rather than turning into a generic ECC attack surface
5. the tutorial explains the structural reason for the collapse and its claim boundary clearly

---

## What Follows

If this slice ships cleanly, the next ECC candidates should likely be:

1. `SCHNORR-CHALLENGE-BINDING-CONSEQUENCE-V1`
2. `ECC-PUBLIC-KEY-VALIDATION-CONSEQUENCE-V1`

Only after those top ECC consequence/validation slices should the queued persistence-safety slice become the next likely non-crypto priority.
