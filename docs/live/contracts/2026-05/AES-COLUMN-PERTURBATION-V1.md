# AES Column Perturbation V1

Last updated: May 16, 2026
Status: Shipped

---

## Purpose

Add the next bounded AES structure-perturbation slice for MCW so students can change one visible MixColumns rule, compare that perturbed branch against the canonical AES round, and inspect the consequence without drifting into a generic cipher-authoring surface.

This slice follows already-shipped work:

- [GF2 Field Arithmetic V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md)
- [AES Round Composite V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AES-ROUND-COMPOSITE-V1.md)
- [AES Row/Column Perturbation V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AES-ROW-COLUMN-PERTURBATION-V1.md)

It is not a keyed S-box slice.
It is not a multi-round AES slice.
It is not a freeform GF(2^8) matrix lab.

It is one bounded control-and-consequence slice: keep the shipped canonical AES round intact, perturb one column-mixing rule, and show what consequence follows.

---

## Why This Slice Exists

MCW's AES line is now strong in visibility:

- GF(2^8) multiplication and inversion are shipped
- all four AES round operations are shipped as explicit boards
- one full visible round is shipped
- one bounded row-rotation perturbation board is shipped
- one bounded keyed S-box authoring board is shipped

That is a real teaching line.
But the current control gap inside AES is now clearer:

- row routing is perturbable
- substitution is perturbable in a bounded local way
- column diffusion is still mostly fixed

Students can currently see that AES diffusion depends on exact row routing.
They cannot yet do the matching next thing:

- change one visible MixColumns rule
- keep the same input state and round key
- compare canonical and perturbed intermediate/final state honestly
- see that diffusion structure depends on the column rule too

This is the highest-leverage remaining controllability gap in the AES line.

---

## Scope

### In scope

- one new flagship `AES Column Perturbation` demo
- one bounded MixColumns perturbation family only
- one canonical branch and one perturbed branch fed from the same visible state and round key
- one tutorial
- one repair challenge
- bounded manual/library/atlas copy updates if needed

### Out of scope

- row-rotation perturbation in this board
- keyed S-boxes
- changing SubBytes
- changing AddRoundKey
- full unconstrained 4x4 GF(2^8) matrix authoring
- arbitrary custom diffusion matrices
- multi-round AES
- decryption
- any claim that the perturbed column rule is secure, broken, stronger, or useful beyond the explicitly shown local consequence

---

## Strategic Principle

V1 must preserve a clear distinction between:

- the shipped canonical AES round
- one bounded changed column-mixing rule
- the visible consequence of that one change

The board is successful only if a student can answer:

- which column rule changed
- where that rule changed
- what intermediate or final consequence followed
- what that does and does not prove

It is not successful if it merely shows “different bytes came out.”

---

## Required Product Behavior

### 1. The canonical AES path must remain visibly present

The flagship board must include one canonical branch that reproduces the shipped AES round behavior exactly on the FIPS 197 Appendix B Round 1 vector.

That branch is the anchor.
The perturbation is only meaningful because the canonical path remains visible for comparison.

### 2. The perturbation family must stay singular and bounded

V1 must teach one column-mixing perturbation family only.

The preferred bounded form is:

- keep the canonical AES coefficient matrix visible
- change exactly one coefficient slot in one row of the visible column-mixing rule
- restrict the replacement to one tight predeclared alternate coefficient

The strongest first perturbation is:

- canonical first-row coefficient sequence `02 03 01 01`
- perturbed first-row coefficient sequence `02 02 01 01`

This bounded coefficient change applies to the first visible MixColumns row across all four visible column mixers in the perturbed branch.

This changes one local multiplication rule without collapsing the board into freeform matrix editing.

### 3. The changed coefficient must remain visible at the point of divergence

The changed coefficient value must stay visible in the perturbed branch where the MixColumns computation diverges.

Branch-header labels alone are not enough.
The student should still be able to see, at the changed stage itself, that the perturbed branch is using `02 02 01 01` rather than `02 03 01 01`.

### 4. Comparison must be visible, not inferred

The flagship board must let the student compare canonical and perturbed behavior through visible machine state.

At minimum, the student should be able to inspect:

- the changed MixColumns rule
- the changed post-MixColumns state
- the changed final round output

Required comparison shape:

- one canonical branch and one perturbed branch fed from the same visible input state and round key
- explicit output comparison sinks
- branch labels that name which path is canonical and which is perturbed

### 5. Consequence language must stay bounded

The tutorial, inspector copy, and challenge copy must not slide from:

- “this column rule changed”
- “the visible consequence is different”

into:

- “this is more secure”
- “this breaks AES”
- “this fixes AES”

unless a very specific named local property is being discussed.

The required language standard is:

- describe what changed
- describe what intermediate or final consequence changed
- describe what that does not prove

### 6. The board must remain live

The student must be able to switch the bounded perturbation live and see the perturbed branch behavior update immediately.

This slice is not a frozen before/after poster.
It must behave like a live machine.

For V1, this means:

- both branches compute simultaneously from the same visible AES state and round key
- the perturbed branch exposes one bounded coefficient control
- changing that coefficient control updates the post-MixColumns and final-output comparison surfaces without reload or rewiring

---

## Recommended Surface Shape

The strongest V1 shape is:

- one canonical AES round branch on the left
- one perturbed AES round branch on the right
- shared visible input state and round key feeding both
- one clearly labeled MixColumns perturbation region near the changed stage
- one post-MixColumns comparison region
- one final-output comparison region

Recommended board:

- reuse the shipped `AES Round (Full)` branch structure
- keep the MixColumns perturbation localized to the first output row of each visible column mixer
- avoid introducing a second independent perturbation mode

---

## Data / Content Guidance

Use the shipped FIPS 197 Appendix B Round 1 state and round key as the canonical known-answer vector.

Canonical branch expected round output:

```
a4 68 6b 02
9c 9f 5b 6a
7f 35 ea 50
f2 2b 43 49
```

Committed first perturbation for V1:

- canonical first MixColumns row coefficients: `02 03 01 01`
- perturbed first MixColumns row coefficients: `02 02 01 01`
- this change is applied across the first visible row of all four column mixers in the perturbed branch

Perturbed branch expected post-MixColumns state:

```
bb 66 81 e5
54 cb 19 9a
09 f8 d3 7a
0f 06 26 4c
```

Perturbed branch expected final round output:

```
1b 9c 7f f2
dc 9f 35 2b
2a 5b ea 43
25 6a 50 49
```

Preferred first teaching consequence:

- the perturbation should still preserve a clear one-coefficient-local edit
- the post-MixColumns state should visibly diverge before AddRoundKey
- the final round output should remain deterministically different on the same FIPS vector

---

## Tutorial

Ship one tutorial for the flagship board.

Recommended shape:

1. show that both branches share the same AES input state and round key
2. point at the canonical `02 03 01 01` first row in MixColumns
3. point at the perturbed `02 02 01 01` first row in MixColumns
4. identify the first intermediate state where the consequence becomes visible: post-MixColumns
5. compare the final round outputs
6. state explicitly that:
   - the column rule changed
   - the visible state changed
   - this does not by itself prove anything about security

The tutorial must remain local.
It should point back to `Visible MixColumns` and `AES Round (Full)` rather than re-teaching the entire AES line from scratch.

---

## Challenge

Ship one repair challenge.

Required first challenge:

- the perturbed branch's first-row second coefficient slot is set to `02` where the canonical rule requires `03`
- the student must restore that one coefficient slot from `02` to `03` so the branch matches the shipped AES round again

The repair gesture is one bounded module-param correction, not a rewiring task.

The challenge copy must say:

- restore the intended canonical column-mixing rule

It must not say:

- make AES secure
- repair encryption generally
- fix the cipher design

---

## Implementation Notes

### 1. Reuse shipped GF(2^8) and AES wiring

Prefer reusing the shipped `GF2Mul`, `XOR`, and AES round branch structure rather than inventing a new custom MixColumns primitive for this slice.

### 2. Keep the perturbation local

Do not perturb multiple coefficient rows at once in V1.
One coefficient change is enough if the consequence is clearly visible.

### 3. Keep the repair gesture local and explicit

The broken challenge state should be one visible coefficient edit in the perturbed branch:

- wrong coefficient slot: first MixColumns row, second coefficient
- broken value: `02`
- repair value: `03`

Do not turn the challenge into a rewiring or multi-parameter hunt.

### 4. Bundle size should be checked early

If this slice adds another large authored board to `demo-data`, run `npm run build` early and keep any bundle-growth justified and bounded.

---

## Testing Requirements

1. `npx vitest run` must pass
2. `npm run build` must pass
3. the canonical branch must still reproduce the named FIPS 197 round-1 output exactly
4. the perturbed branch must reproduce the named post-MixColumns state `bb6681e554cb199a09f8d37a0f06264c` and the named final round output `1b9c7ff2dc9f352b2a5bea43256a5049` for the committed coefficient change
5. the comparison sinks must visibly report that canonical and perturbed outputs differ before repair
6. the repair challenge must start broken and pass only when the coefficient rule is restored to the canonical value

---

## Success Criteria

This slice is successful when:

1. a student can open `AES Column Perturbation` and immediately see one canonical branch and one column-perturbed branch fed from the same AES input state and round key
2. the changed MixColumns rule stays visibly explicit at the point of divergence
3. the first visible consequence appears in the post-MixColumns state, not only at the final sink
4. the final output divergence is machine-visible
5. the product language stays disciplined: changed rule, changed consequence, no inflated security claim
6. the board feels like a live machine rather than a static comparison poster

---

## Likely Follow-On

If this slice ships cleanly, the next AES control question is whether the family then feels sufficiently controllable without drifting into generic cipher authoring.

The likely follow-on is not “custom AES.”
It is a fresh reassessment of whether any bounded remaining AES control gap is still important enough to deserve its own slice.
