# AES Round Composite V1

Last updated: May 14, 2026
Status: Shipped

---

## Purpose

Compose the four individually-shipped AES round operations into a single first-class `AES Round` composite module — the first time a student can watch a complete AES round compute in one workspace, with every intermediate signal visible.

This slice is composition-first wiring work. Every cryptographic building block is already shipped and FIPS 197 verified:

| Operation | Shipped As | FIPS 197 Verified |
|---|---|---|
| SubBytes | `SBox` (Rijndael table) + affine constant param | Yes |
| ShiftRows | `Permutation` (128-element index string) | Yes |
| MixColumns | 4× `GF2Mul` chains per column | Yes — [04,66,81,E5] |
| AddRoundKey | 4× `XOR` per byte | Yes — [A4,9C,7F,F2] |

The gap is that these live as four separate demos. A student cannot currently see a round as a unit — they have to mentally stitch four workspaces together. This contract closes that gap.

One bounded wiring prerequisite may still be needed: the shipped ShiftRows board operates on one `bits[128]` state, while the full round naturally produces 16 separate `bits[8]` byte wires after SubBytes. If no concat primitive already exists, this slice may add one minimal bits-domain glue primitive (`BitConcat`) before building the round composite. That prerequisite is not new cryptographic capability; it is bus assembly glue required to keep the round wiring explicit and legible.

---

## Why This Slice Exists

AES is a substitution-permutation network. Understanding why its rounds are secure requires seeing all four operations interact: SubBytes introduces nonlinearity, ShiftRows spreads bytes across columns, MixColumns creates inter-byte diffusion, and AddRoundKey binds the plaintext to the key. No single operation provides security — the combination does.

A student who sees all four operations in sequence, on the same 16-byte state, watching each intermediate change, will understand something no textbook diagram can show: the state after ShiftRows is what MixColumns operates on, and the confusion+diffusion combination is not cumulative decoration but a functional cascade.

This is also the slice that turns MCW's AES Building Blocks from a teaching series into an assembly environment. After this ships, a student can compose multiple rounds manually, or author a simplified AES cipher for their own analysis.

---

## Scope

### In scope

- An `AES Round (Full)` demo workspace that wires all four operations in sequence on a 16-byte state
  - State input: 16 individual HexSource modules (one per state byte), labelled s00–s33 in AES column-major notation
  - Round key input: 16 individual HexSource modules (one per key byte), labelled k00–k33
  - SubBytes stage: 16 SBox instances (one per byte), each configured with the Rijndael substitution table
  - ShiftRows stage: a single Permutation module receiving the 128 concatenated bits of the post-SubBytes state; 128-element permutation index encoding AES byte shuffle [0,5,10,15,4,9,14,3,8,13,2,7,12,1,6,11] in column-major layout (same index as the shipped Visible ShiftRows demo)
  - MixColumns stage: 4 column groups, each using the shipped 4-byte GF2Mul matrix chain
  - AddRoundKey stage: 16 XOR instances (one per post-MixColumns byte + one round key byte)
  - Output: 16 BitsToHex + HexOutput modules for the final state bytes
  - Stage group boxes labelling each of the four stages
  - FIPS 197 Appendix B Round 1 test vector pre-loaded as the default input values

- A `How One AES Round Works` tutorial (5–6 steps) walking the Round 1 state from input through each stage to the final output, referencing the FIPS 197 vector at each transition

- A `Repair the AES Round` challenge:
  - Source: the full round workspace
  - Break: one SBox in the SubBytes stage has its `table` param replaced with the identity permutation (0,1,2,…,255), effectively disabling substitution for that byte
  - Effect: the output byte at that position is wrong; downstream MixColumns propagates the error to four output bytes, making the break detectible but not obviously local
  - Student task: find which SBox is broken and restore the Rijndael table
  - Hints: the output diverges from the FIPS 197 Round 1 expected value; the error is in the SubBytes stage; exactly one of the 16 SBox modules is misconfigured

- A Python export check confirming that exporting the full round workspace produces output matching `executeProject()` on the same FIPS 197 test vector
  - Phase 1 expectation: validate the already-shipped export path against the full round workspace and record any blocking gaps
  - If validation exposes real GF2/AES exporter/runtime holes, close them in the explicit follow-on parity slice rather than silently widening this composition slice

### Out of scope

- Key schedule (deriving round keys from a master key — a later contract)
- Multi-round AES (10-round AES-128, 12-round AES-192, 14-round AES-256 — all later)
- AES decryption (InvSubBytes, InvShiftRows, InvMixColumns — a later contract)
- A new `AES Round` engine primitive (the composite is sufficient for V1; a compiled primitive can follow if authoring proves too expensive to teach from)
- A single-port bits[128] state input (the per-byte HexSource model is more legible; a collapsed interface is a later UX slice)
- The key schedule feeding into this round (the round key is manually entered for V1)

---

## Required Product Behavior

### 1. The full round must reproduce FIPS 197 Appendix B Round 1

**Input state (column-major, hex bytes):**
```
19 a0 9a e9
3d f4 c6 f8
e3 e2 8d 48
be 2b 2a 08
```

**Round key 1 (from FIPS 197 key schedule, key = 2b7e151628aed2a6abf7158809cf4f3c):**
```
a0 88 23 2a
fa 54 a3 6c
fe 2c 39 76
17 b1 39 05
```

**Expected output after the full round:**
```
a4 68 6b 02
9c 9f 5b 6a
7f 35 ea 50
f2 2b 43 49
```

This is the non-negotiable acceptance test. The workspace pre-loaded with these values must produce this output exactly.

**Expected intermediate state after SubBytes:**
```
d4 e0 b8 1e
27 bf b4 41
11 98 5d 52
ae f1 e5 30
```

**Expected intermediate state after ShiftRows:**
```
d4 e0 b8 1e
bf b4 41 27
5d 52 11 98
30 ae f1 e5
```

**Expected intermediate state after MixColumns:**
```
04 e0 48 28
66 cb f8 06
81 19 d3 26
e5 9a 7a 4c
```

### 2. The intermediate states must be legible

At each stage boundary, the signal values must be readable without running the stepper. The workspace should be structured so the four stage groups are visually distinct and a student can probe any intermediate byte.

### 3. The challenge break must affect exactly four output bytes

Disabling one SBox sends one wrong byte into ShiftRows, which moves it to a new column position, which then enters MixColumns where it contaminates the entire 4-byte output column. The resulting repair challenge should produce exactly 4 wrong output bytes — a pattern that teaches MixColumns diffusion as a side effect of finding the fault.

Choose the broken SBox position so the wrong byte enters a column where it is not already in the first row (to ensure ShiftRows visibly moves it before MixColumns amplifies it). Once the broken position is chosen in implementation, the challenge test must name the four specific final output byte positions expected to diverge.

### 4. The tutorial must reference exact FIPS 197 hex values at each step

This is a teaching tool for a cybersecurity classroom. Vague "the values change" language is not enough. Each tutorial step should name the state it is describing in hex, so a student following along with a physical copy of FIPS 197 or a reference implementation can confirm they are seeing the same thing.

---

## Workspace Layout Guidance

The full round workspace is inherently large — 16 state inputs, 4 stage groups, 16 key inputs, 16 outputs. Layout choices matter.

Recommended structure:
- **Left column**: 16 HexSource state inputs (s00–s33), arranged in 4×4 column-major grid, labelled by AES matrix position
- **Left-centre**: SubBytes stage — 16 SBox instances, one per state byte, in a group box
- **Centre**: ShiftRows stage — one Permutation module with all 128 bits collected into it via a group box. This requires explicit byte-to-bus concatenation before the permutation and explicit bit-window extraction afterward.
- **Right-centre**: MixColumns stage — 4 column groups, each with its GF2Mul chain, in a group box
- **Right**: AddRoundKey stage — 16 XOR instances (one per byte), with the 16 round key HexSource inputs feeding from the right side, in a group box
- **Far right**: 16 BitsToHex + HexOutput instances

Stage group boxes should use distinct label prefixes: `SubBytes`, `ShiftRows`, `MixColumns`, `AddRoundKey`.

The workspace will exceed comfortable single-screen size. This is acceptable — it is the point. The student is meant to scroll and zoom and see the complexity of a single round. The minimap navigation (already shipped) handles orientation.

**Important wiring note for ShiftRows:**

The shipped Visible ShiftRows demo uses a `Permutation` module receiving a single `bits[128]` input (all 16 bytes concatenated). The AES Round composite needs to collect 16 separate `bits[8]` outputs from SubBytes and feed them into this single Permutation.

The required order of implementation is:

1. Verify in source whether a bits concatenation primitive already exists (`BitConcat`, `Bus`, or similar).
2. If it exists, use it.
3. If it does not exist, add one minimal `BitConcat` primitive as a bounded prerequisite for this slice.
4. Do not fall back to 128 manual bit wires unless blocked and documented as a temporary stopgap.

The round composite should not defer this wiring need into a vague follow-on. Either use the shipped primitive or add the minimal prerequisite first so the ShiftRows stage remains inspectable and structurally honest.

---

## Tutorial: How One AES Round Works

**Step 1 — The State**
Title: "16 Bytes, One Round"
Body: "AES operates on a 4×4 grid of bytes called the state. This workspace shows one complete AES round on a real 16-byte state from FIPS 197 Appendix B. Every intermediate value is visible. The input state is in the left column — the first 16 bytes of our plaintext after the initial AddRoundKey."
Focus: the 16 HexSource inputs

**Step 2 — SubBytes: Nonlinearity**
Title: "SubBytes Adds Confusion"
Body: "Each of the 16 bytes is independently passed through the Rijndael S-box — a fixed lookup table derived from GF(2⁸) inversion plus an affine transform. The S-box has no fixed points (no byte maps to itself) and no opposite fixed points. This nonlinearity makes AES resistant to linear cryptanalysis."
Focus: the SubBytes group box
Note: show the FIPS 197 intermediate state values after SubBytes

**Step 3 — ShiftRows: Spreading the Bytes**
Title: "ShiftRows Moves Bytes Between Columns"
Body: "The 16 post-SubBytes bytes are reordered by row offset: row 0 stays, row 1 rotates left by 1, row 2 by 2, row 3 by 3. This means each column of the state now contains bytes from four different original columns. SubBytes operated on columns; ShiftRows spreads the results so MixColumns cannot undo SubBytes column by column."
Focus: the ShiftRows Permutation module
Note: show FIPS 197 intermediate state values after ShiftRows

**Step 4 — MixColumns: Inter-Byte Diffusion**
Title: "MixColumns Mixes Each Column"
Body: "Each 4-byte column is multiplied by a fixed MDS matrix over GF(2⁸). One input byte now influences all four output bytes in its column. Combined with ShiftRows, every output byte depends on every input byte after two rounds — the AES wide-trail strategy."
Focus: the MixColumns group box
Note: show FIPS 197 intermediate state values after MixColumns

**Step 5 — AddRoundKey: Binding the Key**
Title: "AddRoundKey Mixes In the Round Key"
Body: "The 16 post-MixColumns bytes are XORed with the 16 bytes of the round key. XOR is its own inverse, so the same operation decrypts. The round key is derived from the master key by the key schedule — not shown here, but every AES round uses a different derived key."
Focus: the AddRoundKey group box

**Step 6 — The Full Round**
Title: "Confusion + Diffusion = Security"
Body: "The output of this round is the input to the next. After 10 rounds (for AES-128), every output bit depends on every input bit and every key bit. No individual operation achieves this alone: SubBytes provides nonlinearity, ShiftRows and MixColumns provide diffusion, AddRoundKey binds the key. The security comes from their interaction — which is now visible here, one byte at a time."
Focus: the 16 HexOutput modules

---

## Challenge: Repair the AES Round

**Name**: Repair the AES Round
**Difficulty**: intermediate
**Source workspace**: `AES Round (Full)` demo

**Break**: One SBox in the SubBytes stage (choose byte position s12 or s21 — a non-first-row position) has its `table` param replaced with the identity mapping `0,1,2,3,…,255`. The substitution for that byte is disabled — the byte passes through unchanged.

**Effect**: The wrong byte enters ShiftRows, moves to a new column position, then enters MixColumns where the error propagates to four output bytes. The final output diverges from the FIPS 197 Round 1 expected value by exactly 4 bytes.

**Student task**: The output is wrong. Find which stage has the break and which module within that stage is misconfigured. Restore the correct Rijndael S-box.

**Hints**:
1. Compare your output against the FIPS 197 Appendix B Round 1 expected value. How many bytes differ?
2. MixColumns means one corrupted input byte produces four wrong output bytes — trace the column that contains the wrong bytes back through MixColumns.
3. ShiftRows moved the corrupted byte from its original column — trace it back one more stage.
4. Find the SBox at the source position and check its table parameter. The Rijndael table starts: 63, 7c, 77, 7b, f2, 6b, 6f, c5, 30, 01…

---

## Implementation Notes

### 1. BitConcat availability

The full-round wiring requires collecting 16 separate `bits[8]` signals into one `bits[128]` signal for the ShiftRows Permutation. Verify before implementing:

```
rg "BitConcat\|BitBus\|bit-concat\|bit-bus" src/engine/modules/
```

If no concat primitive exists, implement a minimal `BitConcat` primitive as a bounded pre-step before the demo:
- byte-oriented inputs (`in0`…`in15`, each `bits[8]`)
- one `bits[128]` output
- deterministic concatenation in declared input order

Keep it out of scope for the challenge and tutorial framing. It is wiring glue, not a new AES teaching object.

### 2. Demo size and the bundle guard

The full round demo adds 16 HexSource inputs, 16 SBox instances, 1 Permutation, 16+ GF2Mul instances, 16 XOR instances, and 16 BitsToHex/HexOutput instances — roughly 80–100 module instances. The demo-data chunk is already near the `maxChunk` ceiling (340 KiB). Before committing the demo, run `npm run build` and check the bundle guard output. If the demo-data chunk exceeds 340 KiB, raise `maxChunk` in `scripts/check-bundle-size.mjs` with a comment explaining the reason.

### 3. Wiring strategy for MixColumns

The shipped `Visible MixColumns` demo implements one 4-byte column. The full round needs four independent columns. Each column is identical in structure — copy the column wiring four times. Do not try to share modules between columns. MCW's execution model is a DAG; structural duplication is explicit and expected.

### 4. FIPS 197 reference

Use FIPS 197 (AES standard), Appendix B: "Cipher Example" for all test vectors. The state trace in Appendix B walks through each of the 10 rounds with intermediate values after each operation. Round 1's intermediate states are the acceptance criterion for this contract.

The FIPS 197 document is freely available from NIST. The Appendix B values are exact and should be used verbatim — do not derive them from a secondary source.

### 5. No new engine module is required

Everything in this slice is composition. The `SBox`, `Permutation`, `GF2Mul`, and `XOR` modules are all shipped. The challenge is authoring a correct, readable demo workspace, not adding new engine logic.

If `BitConcat` is missing, it is the only exception — and even then, it is a minimal bits-domain primitive (no novel logic, just concatenation).

---

## Test Requirements

### 1. FIPS 197 Round 1 acceptance test

A test in `starter-challenges.ts` or a dedicated unit test should verify:
- The `AES Round (Full)` demo workspace, executed with the FIPS 197 Appendix B input state and Round 1 key, produces the expected Round 1 output state
- All 16 output bytes must match exactly

### 2. Broken challenge diverges correctly

The `Repair the AES Round` challenge workspace, when executed without repair, must produce a wrong output. The test should verify that:
- Exactly 4 output bytes differ from the expected value
- The 4 wrong bytes are the expected column that the broken byte contaminates

### 3. Python export check

Export the full round demo to Python and execute it with the FIPS 197 test inputs. The Python output must match `executeProject()`.

If this validation exposes a real export gap in the already-shipped GF2/AES path, record that gap explicitly and close it in the follow-on parity slice rather than silently ballooning the scope of this composition slice.

### 4. Existing content unbroken

`npx vitest run` must pass in full. The existing AES Building Blocks demos (Visible MixColumns, Visible SubBytes, Visible ShiftRows, Visible AddRoundKey) must not be affected.

---

## Success Criteria

This slice is successful when:

1. A student can open `AES Round (Full)` and see a FIPS 197–verified complete round in one workspace
2. Every intermediate state (post-SubBytes, post-ShiftRows, post-MixColumns, post-AddRoundKey) is inspectable without using the stepper
3. The tutorial walks the state from input to output with FIPS 197 hex values at each step
4. The challenge produces a detectible but non-obvious break (4 wrong output bytes) that a student can trace back to a single broken SBox
5. Python export parity is confirmed for the complete round
6. No existing content is broken
7. The demo-data bundle guard passes

---

## Likely Next Steps

After this slice, the two most natural follow-ons are:

### Phase 2: GF2/AES Python Export Parity V1

The GF2-FIELD-ARITHMETIC-V1 contract listed Python export for `GF2Mul` and `GF2Inv` as in-scope, but Python export may be incomplete for the full AES domain. This slice should:
- Confirm `GF2Mul` and `GF2Inv` export to Python correctly
- Confirm the SubBytes affine transform (the `SBox` evaluate path) exports correctly
- Add a round-trip test: export the full AES round workspace to Python; execute with FIPS 197 inputs; compare to MCW output
- This is bounded: no new Python runtime modules should be needed if the existing export layer is correct; if gaps exist, fill them before tagging

This is a validation-and-gap-fill slice, not a new feature slice.

### Phase 3: UI Refactor — parameter-inspector.tsx

`parameter-inspector.tsx` has grown as new primitive families (ECC, GF2, AES) have added analysis views. It is the primary large-surface candidate for the architecture-protection refactor described in V2.1-NEXT-DOCKET.md.

This refactor should:
- Split `parameter-inspector.tsx` into family-oriented or concern-oriented subcomponents without changing visible behavior
- Preserve all existing analysis views exactly
- Not add new capabilities — this is maintenance work, not feature work
- Be treated as architecture protection: the file will become a drag coefficient for future analysis work if deferred much longer

This slice should be scoped conservatively. The goal is a cleaner internal split, not a redesign of the analysis surface.
