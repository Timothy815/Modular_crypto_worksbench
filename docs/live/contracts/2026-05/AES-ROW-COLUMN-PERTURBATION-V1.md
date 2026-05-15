# AES Row/Column Perturbation V1

Last updated: May 15, 2026
Status: Shipped

---

## Purpose

Add the first bounded AES structure-perturbation slice for MCW so students can change one row-rotation rule or one column-mixing rule and see what that change does to the visible round behavior.

This slice follows:

- [GF2 Field Arithmetic V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md)
- [AES Round Composite V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AES-ROUND-COMPOSITE-V1.md)

It is not a keyed S-box slice.
It is not a multi-round AES slice.
It is not a generic custom-cipher lab.

It is a bounded control-and-consequence slice: keep the shipped AES round intact, then let a student perturb one row-rotation or one column-mixing rule and inspect the consequences honestly.

---

## Why This Slice Exists

MCW's AES line is now structurally visible:

- GF(2^8) multiplication and inversion
- visible MixColumns
- visible SubBytes
- visible ShiftRows
- visible AddRoundKey
- a full visible AES round

That is a strong first bar.
But the current AES surfaces still mostly show the prescribed machine, not the space around it.

Students can currently see:

- the canonical row rotation
- the canonical column mixer
- the canonical round output

They cannot yet do the next product-important thing:

- change one row rotation and watch the round behavior change
- change one column-mixing rule and watch the diffusion pattern change
- compare the canonical board and the perturbed board without pretending the perturbed version is "more secure" or "less secure" just because it differs

This is the same product move that strengthened ECC:

- not just "here is the machine"
- but also "here is what happens when you perturb one explicit structural rule"

Without that, AES remains visible but not yet authorable enough.

---

## Scope

### In scope

- one new `AES Row/Column Perturbation` flagship demo workspace built from the already-shipped AES round board shape
- one bounded perturbation control for ShiftRows as the primary V1 teaching surface
- one comparison surface that keeps the canonical path and one perturbed path legible side-by-side or stage-by-stage
- one tutorial explaining what was changed and what consequence is visible
- one repair challenge built from the primary ShiftRows perturbation surface
- bounded manual/library/atlas copy updates if needed

### Out of scope

- keyed S-boxes
- changing the SubBytes table in this slice
- AES key schedule work
- multi-round AES
- decryption slices
- a shipped MixColumns perturbation board in V1
- generic custom matrix authoring over unrestricted GF(2^8) coefficients
- arbitrary byte-permutation authoring for full-state routing
- any claim that a changed row rotation or changed column mix rule is "secure," "better," or "production-usable"
- a general AES research sandbox

---

## Strategic Principle

V1 must preserve a clear distinction between:

- the shipped canonical AES round
- one bounded structural perturbation
- the visible consequence of that perturbation

This contract is successful only if the student can answer:

- what rule changed
- where it changed
- what output or intermediate consequence followed
- what that does and does not prove

It is not successful if the product merely shows "different bytes came out."

---

## Required Product Behavior

### 1. The canonical AES path must remain visibly present

The flagship board must include one canonical branch that reproduces the shipped AES round behavior exactly on the FIPS 197 Appendix B Round 1 vector.

That branch is the anchor.
The perturbation is meaningful only because the canonical path remains visible for comparison.

### 2. ShiftRows perturbation must be bounded and explicit

V1 may expose one bounded authoring surface for row rotation only.

The preferred bounded form is:

- row 0 fixed at 0
- row 1 selectable between a small bounded set such as `0` or `1`
- row 2 selectable between a small bounded set such as `1` or `2`
- row 3 selectable between a small bounded set such as `2` or `3`

The exact allowed values may vary, but V1 must not become arbitrary 16-byte permutation authoring.

The product must say clearly:

- this changes the row-rotation rule
- this does not mean the resulting structure is a valid AES variant or a secure cipher

### 3. MixColumns perturbation must be bounded and explicit

V1 may expose one bounded authoring surface for column mixing only.

The preferred bounded form is:

- one visible coefficient slot in the canonical AES matrix becomes perturbable within a tight bounded set
- or one pre-declared alternate matrix is switchable against the canonical matrix

V1 must not expose a full unconstrained 4x4 GF(2^8) matrix authoring experience.

The product must say clearly:

- this changes the column-mixing rule
- this visibly changes diffusion behavior
- this does not by itself establish a meaningful security judgment

### 4. Comparison must be visible, not inferred

The flagship board must let the student compare canonical and perturbed behavior through visible machine state.

At minimum, the student should be able to inspect:

- the changed row-rotation or matrix rule
- the changed intermediate state
- the changed final round output

Required comparison surfaces:

- one canonical branch and one perturbed branch fed from the same visible input state and round key
- explicit output comparison sinks per changed branch
- stage labels that name which path is canonical and which is perturbed
- the active perturbation value must remain visible at the point of divergence, not only in a branch-header label

### 5. Consequence language must stay bounded

The tutorial, inspector copy, and challenge copy must not slide from:

- "this structural rule changed"
- "the visible consequence is different"

into:

- "this is more secure"
- "this breaks AES"
- "this fixes AES"

unless the contract defines a very specific local property being discussed.

The required language standard is:

- describe what changed
- describe what output or diffusion pattern changed
- describe what the change does not prove

### 6. The board must remain authorable rather than hard-coded

The student must be able to switch or edit the bounded perturbation surface live and see the branch behavior update.

This slice is not a frozen before/after poster.
It must behave like a live machine.

### 7. The perturbation choice must be singular in the flagship board

The main demo must not try to teach:

- changed row rotation
- changed MixColumns coefficients
- changed S-boxes
- changed round-key handling

all at once.

If the product later ships a bounded MixColumns perturbation surface, it must ship as a second clearly separated teaching board rather than as a mode toggle inside the flagship V1 board.

---

## Recommended Surface Shape

The strongest V1 shape is:

- one canonical AES round branch on the left
- one perturbed AES round branch on the right
- shared visible input state and round key feeding both
- one clearly labeled perturbation control region near the changed stage
- one output-comparison region at the end

Recommended primary demo shape:

- `Canonical AES Round`
- `Perturbed AES Round`
- one active perturbation family selected for that board

Recommended first board:

- row-rotation perturbation first

If the product later adds a column-mixing perturbation surface, ship it as a second demo with its own tutorial/challenge rather than combining both perturbation families into one switched flagship board.

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

Preferred first perturbation for V1:

- ShiftRows row-1 rotation set to `0` instead of canonical `1`

Primary perturbed branch expected round output for that row-1 rotation change:

```
17 75 6f a8
b7 89 aa a6
e7 3e 1f 36
6a 20 b6 2f
```

Why this is the preferred first perturbation:

- it is easy to state
- it is easy to inspect
- it changes the wiring of the visible row movement directly
- it avoids premature GF(2^8) authoring complexity while still teaching structural consequence

Potential later second perturbation after V1:

- one canonical MixColumns coefficient changed in a bounded way, such as swapping one `03` for `02`

That is intentionally deferred from the flagship V1 board so the first perturbation surface stays singular and legible.

---

## Tutorial

Ship one tutorial for the primary perturbation surface.

Recommended tutorial shape:

1. show the canonical branch and name the unchanged AES rule
2. show the perturbed branch and name the one changed rule
3. inspect the ShiftRows output as the first intermediate state where the row-1 rotation change becomes visible
4. inspect the final output divergence
5. state what this does and does not prove

If a second perturbation surface ships in V1, it may have its own short tutorial rather than overloading one long tutorial.

---

## Challenge

Ship one repair challenge.

The strongest V1 challenge is:

- canonical ShiftRows offsets are intended
- one bounded row-rotation parameter is changed
- the student must restore the canonical value by tracing the visible divergence

Preferred concrete break:

- row 1 rotation offset is set to `0` instead of `1`

Why this is the right first challenge:

- the break is structural, not cosmetic
- it is visible at the first changed stage
- it teaches that downstream consequences come from an upstream routing change

The challenge copy must not say:

- "make AES secure again"
- "fix the crypto"

It should say:

- restore the canonical AES row-rotation rule for this teaching board

---

## Implementation Notes

### 1. Prefer bounded parameterization over new crypto primitives

If the perturbation can be expressed by:

- alternate `Permutation` parameters
- bounded GF(2^8) coefficient choices
- existing compare/output sinks

then V1 should stay there.

Do not introduce a new black-box `PerturbedAESRound` primitive.

### 2. Keep canonical and perturbed paths structurally comparable

The two branches should differ only where the perturbation actually happens.

Do not quietly restructure unrelated wiring between the branches.

### 3. Bounded authoring beats freeform authoring

If there is a choice between:

- a tiny explicit selector of allowed structural variants
- and a fully freeform matrix/permutation authoring surface

V1 should choose the tiny explicit selector.

### 4. Consequence surfaces must be machine-visible

Do not rely only on tutorial prose to explain that outputs differ.

Use visible branch outputs and explicit sinks so the student can inspect the machine state directly.

### 5. Bundle size should be checked early

The AES round composite and recent ECC intuition slices already put pressure on `demo-data`.
If V1 adds another large dual-branch AES board, run `npm run build` early and keep any bundle-guard increase justified and minimal.

---

## Testing Requirements

1. `npx vitest run` must pass
2. `npm run build` must pass
3. the canonical branch must still reproduce the shipped AES round output exactly on the FIPS Round 1 vector
4. the primary perturbation branch must produce the named known output for row-1 rotation = `0` on the same vector
5. the challenge must start broken and pass after the intended bounded repair
6. any new metadata or routing tables for the perturbation surface must be covered by tests rather than only by visual inspection

---

## Success Criteria

This slice is successful when:

1. a student can open one AES perturbation board and immediately see which branch is canonical and which is perturbed
2. the changed structural rule is explicit and locally inspectable
3. the changed consequence is visible in intermediate or final machine state
4. the board remains bounded rather than becoming a generic cipher-construction lab
5. the tutorial and challenge explain the perturbation honestly without making premature security claims
6. the shipped canonical AES round remains intact and verified

---

## Likely Next Steps

The most natural follow-ons after this slice are:

1. `KEYED-SBOX-AUTHORING-V1`
   - if the product wants to explore key-dependent substitution honestly as its own bounded authoring problem

2. a second AES perturbation slice for whichever structural family is not chosen as the primary V1 board
   - row rotation first, then column mixing
   - or the reverse, if implementation reality proves the other is the cleaner first teaching surface

What should not happen next is bundling:

- keyed S-boxes
- row perturbation
- column perturbation
- multi-round AES

into one oversized "custom AES lab" contract.
