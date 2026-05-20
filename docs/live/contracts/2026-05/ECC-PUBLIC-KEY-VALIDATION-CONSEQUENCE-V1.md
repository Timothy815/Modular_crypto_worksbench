# ECC Public-Key Validation Consequence V1

Last updated: May 19, 2026
Status: Shipped

---

## Purpose

Add one bounded ECC consequence slice showing why a protocol must validate a peer public point before using it for agreement.

This is not a full public-key validation framework.
It is not a generic invalid-curve attack lab.
It is not named-curve exploit theater.

It is one bounded glass-box protocol lesson:

- a peer point can be structurally on the visible toy curve and still be wrong for protocol use
- a curve-membership check alone is not enough
- if the wrong point is accepted, the shared-secret space can collapse in a way the student can already see from the shipped low-order ECDH board

---

## Why This Slice Exists

MCW now teaches several ECC truths separately:

- visible point arithmetic
- visible ECDH agreement
- point order and subgroup structure
- low-order peer-point consequence

What is still missing is the protocol discipline that connects them:

- why an implementation must validate the peer public point before feeding it into ECDH

Without that connection, the user can learn:

- low-order points are dangerous

without yet seeing:

- the danger begins at acceptance time
- “on the curve” is not the same as “safe for this protocol”

This slice closes that gap.

---

## Scope

### In scope

- one flagship toy-curve ECDH validation-consequence board
- one bounded public-key acceptance comparison:
  - broken acceptance path checks only curve membership
  - honest acceptance path checks subgroup membership against the intended subgroup order
- one visible consequence region showing:
  - broken accepted peer leads to shared-secret collapse
  - honest accepted peer does not
- one tutorial
- one repair challenge
- seeded known-answer tests for the committed toy-curve family

### Out of scope

- full production public-key validation policy
- generic invalid-curve or twist-attack tooling
- named-curve exploit framing
- ECDSA
- broader certificate / identity / trust modeling
- replacing the existing low-order ECDH consequence board

---

## Strategic Principle

V1 must separate three things clearly:

- structural acceptance mistake
- visible shared-secret consequence
- claim boundary

The board may say:

- this peer point is on the visible toy curve
- this peer point is not in the intended visible subgroup
- accepting it anyway collapses the shared-secret space in this pedagogical ECDH setup

The board must not imply:

- this is a complete production attack pipeline
- every ECC stack fails this way by default
- subgroup validation is the only real-world public-key check that matters

The lesson is:

- protocol inputs must be structurally validated before use

not:

- “ECC is broken.”

---

## Required Product Behavior

### 1. The board must keep the acceptance seam explicit

The board must show two acceptance stories for the same candidate low-order peer point:

- a broken path that checks only curve membership
- an honest path that also checks subgroup membership against the intended subgroup order

The acceptance seam must be graph-visible rather than hidden in prose.

### 2. The subgroup check must be explicit and machine-readable

V1 must not rely on vague “bad point” language.

The honest path must visibly show that subgroup membership is tested by multiplying the candidate peer point by the intended subgroup order `n = 11` and checking whether the result is the point at infinity.

The broken path must visibly omit that check.

### 3. The consequence surface is committed

V1 must use one exact machine-visible payoff:

- two distinct private scalars `a` and `a'`
- both are multiplied by the broken accepted peer point
- both shared results are shown explicitly
- one `PointEquals` sink shows they collapse to the same shared point

The board must also keep one honest reference beside it:

- the same two private scalars multiplied by the honest accepted peer point
- one `PointEquals` sink shows they do not collapse there

### 4. The board must keep the toy curve explicit

V1 must name and use the same toy curve already established in the shipped ECC line:

- `p = 17`
- `a = 2`
- `b = 3`

The low-order point and the honest peer point must both live on that visible curve.

### 5. The board must keep the honest contrast visible

This slice is not only “bad point makes equality 1.”

The honest peer path must stay on the board so the user can compare:

- honest accepted peer -> distinct shared outcomes
- broken accepted peer -> collapsed shared outcomes

### 6. The claim boundary must stay specific

The product may say:

- this board shows why curve-membership checking alone is insufficient
- this board shows one subgroup-validation consequence on a toy curve

The product must not say:

- this single toy board is a complete model of production public-key validation

---

## Recommended Surface Shape

The strongest V1 shape is five visible regions:

1. shared setup lane
2. peer-point comparison lane
3. broken acceptance lane
4. honest acceptance lane
5. shared-secret consequence lane

### Shared setup lane

Must show:

- toy curve declaration
- subgroup order source `n = 11`
- two visible private scalars:
  - `a = 3`
  - `a' = 5`

### Peer-point comparison lane

Must show both peer candidates explicitly:

- honest peer public point `B = (8, 2)`
- low-order peer point `Q_low = (16, 0)`

Must also show:

- `PointOnCurve(B) = 1`
- `PointOnCurve(Q_low) = 1`
- `11B = ∞`
- `11Q_low = Q_low`
- `PointEquals(11B, ∞) = 1`
- `PointEquals(11Q_low, ∞) = 0`

This is the core protocol lesson:

- on-curve does not imply in-subgroup

### Broken acceptance lane

Must be labeled as accepting the peer after the curve-membership check alone.

Its accepted peer output is the low-order point `Q_low`.

### Honest acceptance lane

Must be labeled as requiring the subgroup check as well.

Its accepted peer output is the honest point `B`.

### Shared-secret consequence lane

Must show both comparison pairs:

- broken consequence:
  - `aQ_low`
  - `a'Q_low`
  - `PointEquals(aQ_low, a'Q_low)`
- honest contrast:
  - `aB`
  - `a'B`
  - `PointEquals(aB, a'B)`

The board should feel like a protocol-input autopsy, not a static warning card.

---

## Data / Content Guidance

V1 commits one exact seeded toy-curve family:

- curve: `y^2 = x^3 + 2x + 3 (mod 17)`
- intended subgroup order: `n = 11`
- honest base point: `G = (15, 12)` of order `11`
- honest peer public point: `B = (8, 2)`
- low-order peer point: `Q_low = (16, 0)` of order `2`
- private scalar `a = 3`
- comparison scalar `a' = 5`

Committed visible validation facts:

- `PointOnCurve(B) = 1`
- `PointOnCurve(Q_low) = 1`
- `11B = ∞`
- `11Q_low = Q_low`
- `PointEquals(11B, ∞) = 1`
- `PointEquals(11Q_low, ∞) = 0`

Committed consequence facts:

- honest path:
  - `aB = (14, 2)`
  - `a'B = (15, 5)`
  - `PointEquals(aB, a'B) = 0`
- broken path:
  - `aQ_low = (16, 0)`
  - `a'Q_low = (16, 0)`
  - `PointEquals(aQ_low, a'Q_low) = 1`

These values are the contract truth for the implementation and tests.

---

## Tutorial Requirements

V1 must ship one tutorial focused on this exact board.

The tutorial should walk through this sequence:

1. identify the visible toy curve and subgroup order `n = 11`
2. identify the two peer candidates:
   - `B = (8, 2)`
   - `Q_low = (16, 0)`
3. show that both are on the visible curve
4. show the subgroup distinction explicitly:
   - `11B = ∞`
   - `11Q_low = Q_low`
5. state the protocol lesson precisely:
   - `Q_low` is dangerous because it has order `2`
   - any scalar multiple lands in the tiny subgroup `{∞, Q_low}`
   - curve-membership alone would still accept it
6. read the shared-secret consequence:
   - broken path gives `aQ_low = a'Q_low = (16, 0)`
   - honest path gives `aB ≠ a'B`
7. state the claim boundary explicitly:
   - the mistake is accepting a peer point without the subgroup check
   - the visible consequence is shared-secret collapse on this toy board
   - this demonstrates one validation failure mode, not a complete production validation model

---

## Challenge Requirements

V1 must ship one repair challenge.

The broken state is committed:

- the consequence lane currently takes its peer input from the broken acceptance output
- that broken acceptance output accepts `Q_low` after the curve-membership check alone

The repair gesture is committed:

- rewire both consequence-lane peer inputs from `accepted-peer-broken` to `accepted-peer-honest`

The solved state is committed:

- `aB = (14, 2)`
- `a'B = (15, 5)`
- `PointEquals(aB, a'B) = 0`

This must be a bounded rewiring repair, not a broad board rewrite.

---

## Primitive Strategy

V1 should prefer shipped ECC primitives and visible composition:

- `PointSource`
- `PointOnCurve`
- `ScalarMultiply`
- `PointEquals`
- subgroup-order scalar source

V1 should not introduce a broad opaque `ValidatePublicKey` box.

If one tiny helper is needed, it must stay narrowly named and purely presentational, not cryptographically magical.

The preferred implementation is visible composition from shipped primitives.

---

## Testing Requirements

1. `npx vitest run` must pass.
2. `npm run build` must pass.
3. The seeded board must reproduce the committed validation facts:
   - `PointOnCurve(B) = 1`
   - `PointOnCurve(Q_low) = 1`
   - `PointEquals(11B, ∞) = 1`
   - `PointEquals(11Q_low, ∞) = 0`
4. The seeded board must reproduce the committed honest consequence facts:
   - `aB = (14, 2)`
   - `a'B = (15, 5)`
   - `PointEquals(aB, a'B) = 0`
5. The seeded board must reproduce the committed broken consequence facts:
   - `aQ_low = (16, 0)`
   - `a'Q_low = (16, 0)`
   - `PointEquals(aQ_low, a'Q_low) = 1`
6. The repair challenge must start broken and pass only when both consequence-lane peer inputs are rewired from `accepted-peer-broken` to `accepted-peer-honest`.

---

## Success Criteria

V1 is successful if:

- the user can see that `Q_low` is on the curve but not in the intended subgroup
- the user can see that broken acceptance still lets `Q_low` into ECDH
- the user can see that the shared-secret space collapses under the broken accepted peer
- the honest peer path stays visible as contrast
- the board teaches validation discipline, not vague “bad point” superstition

---

## Likely Follow-On

If this slice lands well, the next follow-on does not have to stay in ECC misuse.

The next queue after this is currently:

1. `WORKSPACE-DURABILITY-SAFETY-V1`
2. authoring / packaging ergonomics

This contract should therefore stay narrowly focused on the remaining ECC validation truth, not expand to absorb broader persistence or packaging concerns.
