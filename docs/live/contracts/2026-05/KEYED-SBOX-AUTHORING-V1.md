# Keyed S-Box Authoring V1

Last updated: May 15, 2026
Status: Shipped

---

## Purpose

Add the first bounded keyed-substitution authoring slice for MCW so students can derive or select one visible substitution table from visible key material, verify that the table is a valid permutation, and compare its local behavior against a fixed baseline without pretending that key-dependence automatically implies quality.

This slice follows:

- [SBox Analysis Rigor Pass V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-04/SBOX-ANALYSIS-RIGOR-PASS-V1.md)
- [GF2 Field Arithmetic V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md)

It is not a full custom-cipher lab.
It is not an AES replacement slice.
It is not a claim that keyed S-boxes are production-safe or automatically stronger.

It is a bounded authoring-and-validity slice: make one key-dependent substitution table explicit, make its permutation validity visible, and make the consequences of changing the table inspectable.

---

## Why This Slice Exists

MCW already shows substitution honestly:

- `SBox` is a visible table, not a magic black box
- fixed tables can be inspected and perturbed
- local analysis language now distinguishes "different mapping" from meaningful structural claims

That is a strong base.
But the current substitution line is still mostly fixed-table oriented.

Students can currently see:

- a fixed AES S-box
- a fixed DES S1 table
- a fixed PRESENT-style 4-bit table
- analysis of one shipped table at a time

They cannot yet do the next product-important thing:

- feed in visible key material
- watch that key material choose or derive one visible substitution table
- verify that the resulting table is still a permutation
- compare it against a fixed baseline without sliding into "keyed means stronger"

That makes keyed substitution an honest next move.
It adds authoring power, but only if the validity boundary stays strict.

Without that boundary, keyed S-boxes become novelty generators.
With it, they become a real glass-box teaching surface for one important idea:

- local nonlinearity can depend on key material
- but validity and quality still need to be checked explicitly

---

## Strategic Principle

V1 must separate three different claims that students will otherwise blur together:

1. the table changed
2. the table is still a valid permutation
3. the table has good cryptographic structure

This slice may teach the first two directly.
It may gesture carefully at the third through bounded analysis surfaces.
It must not collapse them into one.

If the product ever says "this keyed S-box is good," it must be because a named local property is shown, not because the table depends on a key.

---

## Scope

### In scope

- one new flagship `Keyed S-Box Authoring` demo
- one bounded way for visible key material in the bits domain to choose one visible substitution-table transform from a fixed V1 family
- one explicit validity surface showing whether the resulting table is still a permutation
- one comparison surface between a fixed baseline table and the keyed table
- one tutorial explaining what changed, what stayed valid, and what that does not prove
- one repair challenge where the student restores permutation validity or the intended keyed mapping
- bounded inspector/manual/library/atlas updates if needed

### Out of scope

- full freeform S-box synthesis from arbitrary key sizes
- 8-bit keyed table boards
- arbitrary 8x8 cryptographic S-box generation claims
- integrating the keyed table into a full AES round in V1
- changing MixColumns, ShiftRows, or key schedule in this slice
- claiming resistance improvements from key-dependence alone
- a general "custom AES" authoring surface
- a generic optimizer for nonlinearity, SAC, or differential uniformity

---

## Required Product Behavior

### 1. The keyed table must stay visibly explicit

The student must be able to inspect the resulting substitution table as a table, not merely as an opaque transform output.

The key material may choose or derive the table, but the resulting mapping must stay visible and inspectable.

### 2. The derivation must be bounded and committed

V1 must use one tightly bounded derivation rule.

Required V1 shape:

- start from one fixed 4-bit baseline permutation
- use one visible 2-bit key input in the bits domain
- interpret that key as selecting exactly one of four shipped table variants:
  - `00` -> baseline table unchanged
  - `01` -> swap output positions `0` and `1`
  - `10` -> rotate the first row of the visible 4x4 table layout one step to the left
  - `11` -> overwrite output position `9` with the value from output position `5`, intentionally breaking permutation validity

These four variants are the V1 derivation family.
Implementation must not substitute a different family without revising the contract.

### 3. Valid permutation status must be machine-visible

The flagship board must include an explicit validity sink that answers:

- is the resulting keyed table still a one-to-one mapping?

This must be a machine-visible result, not only tutorial prose.

If the derived table is not a permutation, the product should say so plainly and the board should show the failure as a visible state.

### 4. Comparison with a baseline must remain present

The flagship board must preserve a visible baseline table so the keyed table is not read in isolation.

At minimum, the student should be able to inspect:

- one fixed baseline table
- one keyed variant table
- one or more example input/output pairs through each
- one validity result for the keyed table

### 5. Consequence language must stay narrow

The tutorial, inspector copy, and challenge copy must not say:

- keyed means stronger
- keyed means safer
- this fixes AES
- this creates a secure custom cipher

The required language standard is:

- the table changed because the visible key changed
- the table is or is not still a valid permutation
- this does or does not preserve one named local property
- this does not prove broad cryptographic quality

### 6. The slice must stay live and authorable

The student must be able to change the bounded key input and see:

- the derived keyed table update
- the validity result update
- the comparison outputs update

This must feel like a live machine, not a fixed explanatory poster.

### 7. The flagship board must teach one keyed-table idea, not all of them

The main demo must not try to teach simultaneously:

- keyed table derivation
- full AES round substitution replacement
- differential cryptanalysis
- avalanche metrics
- key schedule behavior

V1 should teach one narrow idea well:

- visible key material can select or derive a visible substitution table
- and that table still must be checked

---

## Recommended Surface Shape

The strongest V1 shape is:

- one baseline S-box branch on the left
- one keyed S-box branch on the right
- one shared visible input feeding both
- one visible key input feeding the keyed derivation step only
- one visible keyed-table validity sink
- one output-comparison region

Required V1 board:

- one 4-bit table
- one visible 2-bit key input
- one bounded family of four shipped table transforms selected by those bits

Why this is the right V1 shape:

- table structure remains readable
- validity remains easy to explain
- the machine stays small enough to feel inspectable

---

## Data / Content Guidance

Baseline table for V1:

- the shipped PRESENT-style 4-bit permutation:

```
12,5,6,11,9,0,10,13,3,14,15,8,4,7,1,2
```

Baseline known-answer examples:

- input `0x0` -> output `0xC`
- input `0x7` -> output `0xD`

V1 keyed derivation family:

- `00` -> baseline table unchanged
  - resulting table:
    `12,5,6,11,9,0,10,13,3,14,15,8,4,7,1,2`
- `01` -> swap output positions `0` and `1`
  - resulting table:
    `5,12,6,11,9,0,10,13,3,14,15,8,4,7,1,2`
- `10` -> rotate the first visible 4x4 row one step left
  - resulting table:
    `5,6,11,12,9,0,10,13,3,14,15,8,4,7,1,2`
- `11` -> overwrite output position `9` with the value from output position `5`
  - resulting table:
    `12,5,6,11,9,0,10,13,3,0,15,8,4,7,1,2`
  - this is intentionally invalid because `0` appears twice and `14` disappears

Required first teaching contrast:

- `00` as the intended valid keyed value
- `11` as the intentionally invalid keyed value used by the repair challenge

The board must say clearly that the `11` variant breaks invertibility because a repeated output appears and one value is missing.

---

## Tutorial

Ship one tutorial for the flagship keyed S-box board.

Recommended shape:

1. show the fixed baseline table
2. show how the visible key selects or derives the keyed table
3. inspect the keyed table directly
4. inspect the validity sink
5. compare one or two example substitutions between baseline and keyed table
6. state explicitly that:
   - the table changed
   - the table is or is not still a valid permutation
   - neither fact by itself proves cryptographic quality

The tutorial must remain local.
It should point to existing S-box analysis surfaces rather than re-teaching all S-box metrics from scratch.

---

## Challenge

Ship one repair challenge.

Required V1 challenge:

- the keyed derivation path currently uses key bits `11`
- that key selects the intentionally invalid table where output position `9` is overwritten with `0`, duplicating `0` and removing `14`
- the student must restore the intended bounded key value `00` so the table becomes the baseline valid permutation again

Why this is the strongest first challenge:

- it teaches that "different table" is not enough
- it keeps the repair gesture concrete
- it makes invertibility visible as a machine state, not a hidden assumption

The repair gesture in V1 is a key-source correction, not a rewiring task.
The shipped board should use one visible 2-bit key-source module whose param currently emits `11`.
The student repairs the board by changing that key-source param to `00`.

The challenge copy must say:

- restore the intended valid keyed table

It must not say:

- make the cipher secure
- fix AES
- strengthen the cryptography

---

## Implementation Notes

### 1. Prefer bounded table-selection over unconstrained generation

If there is a choice between:

- one small explicit family of keyed table variants
- and a large opaque generation rule

V1 should choose the small explicit family.

### 2. Reuse shipped S-box analysis and table representation where possible

If existing `SBox` table serialization, validation, and analysis views can be reused, do so.

This slice should not create a second incompatible table representation.

### 3. Validity must stay close to the derivation point

Do not bury the permutation-validity result in a distant manual note.
Keep the validity sink and keyed-table view adjacent to the derivation region.

### 4. Baseline and keyed branches should differ only where intended

The two branches should share:

- the same visible input
- the same output sink style

and differ only in the keyed derivation path and its downstream substitution result.

### 5. The visible key should be a live bits signal, not only a static module param

The bounded 2-bit key should use the existing bits signal domain so the board behaves like a live machine.
Do not reduce V1 to a table editor driven only by passive params if a visible key-source branch can express the selection honestly.

### 6. Bundle size should be checked early

If this slice adds another large authored table surface or heavy metadata, run `npm run build` early and keep any bundle-growth justified and bounded.

---

## Testing Requirements

1. `npx vitest run` must pass
2. `npm run build` must pass
3. the baseline branch must reproduce the named baseline substitution outputs, including `0x0 -> 0xC`, `0x7 -> 0xD`, and one additional entry affected by the keyed variants such as `0x1 -> 0x5`
4. the keyed branch must reproduce the named tables and substitution outputs for `00`, `01`, and `10`
5. the validity sink must report `valid` for keys `00`, `01`, and `10`, and `invalid` for key `11`
6. any keyed-table metadata or selection mapping must be covered by tests rather than only by visual inspection

---

## Success Criteria

This slice is successful when:

1. a student can see one fixed S-box and one keyed variant side-by-side
2. the visible key material clearly controls the keyed table choice or derivation
3. the board displays a machine-visible validity result for whether the keyed table is still a valid permutation
4. the board makes local substitution consequences visible without drifting into full-cipher claims
5. the tutorial and challenge keep the consequence language honest
6. the slice remains bounded and does not become a generic keyed-cipher authoring lab

---

## Likely Next Steps

The most natural follow-ons after this slice are:

1. a second bounded keyed-table slice for a different derivation family
2. a later bounded AES column-perturbation slice if row/column consequences should continue
3. a more explicit local metric-comparison slice if the product wants to compare valid keyed variants more rigorously

What should not happen next is bundling:

- keyed S-box authoring
- full AES round replacement
- row/column perturbation
- multi-round AES

into one oversized custom-cipher contract.
