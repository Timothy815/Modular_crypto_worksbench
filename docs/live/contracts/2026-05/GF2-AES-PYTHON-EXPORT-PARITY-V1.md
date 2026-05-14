# GF2 AES Python Export Parity V1

Last updated: May 14, 2026
Status: Shipped

---

## Purpose

Close the remaining Python export gap for the already-shipped GF(2^8) and AES teaching line so exported Python can replay the same visible workspaces without obvious domain-specific holes.

This is a parity-and-gap-fill slice, not a new capability slice. The product already ships:

- `GF2Mul`
- `GF2Inv`
- `Visible MixColumns`
- `Visible SubBytes`
- `Visible ShiftRows`
- `Visible AddRoundKey`
- `AES Round (Full)`

The goal here is simple: if a student can run these boards in MCW, the same boards should export to Python and produce the same results honestly.

---

## Why This Slice Exists

MCW now has a real visible AES line, but export parity is still the part most likely to drift behind the in-app teaching surface.

That drift is especially risky here because AES is exact, byte-oriented, and test-vector-heavy. A board that works in the UI but fails, omits, or silently changes behavior in exported Python undermines the "live machine" promise precisely where students expect reproducibility.

This slice keeps the export layer honest:

- no new AES primitives
- no new teaching surfaces
- no export productization push
- just enough validation and gap-fill work that the shipped GF2/AES line can replay outside the browser with the same semantics

---

## Current Shipped Baseline

The following AES/GF2 surfaces are already shipped on `main` and are in scope for parity review:

| Surface | Status | Notes |
|---|---|---|
| `GF2Mul` | Shipped | GF(2^8) multiply over bits-domain byte signals |
| `GF2Inv` | Shipped | GF(2^8) inverse over bits-domain byte signals |
| `Visible MixColumns` | Shipped | Uses FIPS 197 column test vector |
| `Visible SubBytes` | Shipped | Uses AES S-box path already visible in product |
| `Visible ShiftRows` | Shipped | Uses a byte-permutation path over 128-bit state |
| `Visible AddRoundKey` | Shipped | Uses XOR over visible byte lanes |
| `AES Round (Full)` | Shipped | Verified against FIPS 197 Appendix B round 1 |

The round composite already has a Python round-trip test at the seeded-workspace level. This contract formalizes the remaining export baseline and closes any latent module/runtime holes instead of treating that current success as "probably good enough."

---

## Scope

### In scope

- Confirm or complete Python export coverage for the shipped GF2/AES primitive path:
  - `GF2Mul`
  - `GF2Inv`
  - `SBox` as used by the shipped AES SubBytes board
  - any already-shipped byte/bit routing helpers required by the AES boards, including the full-round ShiftRows path

- Confirm workspace-level parity for the shipped AES teaching line:
  - `Visible MixColumns`
  - `Visible SubBytes`
  - `Visible ShiftRows`
  - `Visible AddRoundKey`
  - `AES Round (Full)`

- Add or tighten Python export tests so exported Python matches `executeProject()` for the shipped AES/GF2 surfaces

- Add only the minimum bounded exporter/runtime code needed to close discovered parity gaps

- Keep all semantics aligned with the shipped in-app visible behavior:
  - same byte ordering
  - same bit ordering
  - same permutation behavior
  - same field arithmetic results
  - same exact FIPS 197 test-vector outcomes

### Out of scope

- New AES teaching features
- New GF2 or AES engine primitives
- Key schedule export
- Multi-round AES export productization beyond the already-shipped full-round board
- A generalized "crypto codegen overhaul"
- UI work, including export chrome redesign
- Runtime optimizations not required for correctness

---

## Required Product Behavior

### 1. Export must not trail the shipped GF2/AES teaching line

If a shipped GF2/AES board runs correctly in MCW, exported Python must either:

- replay it correctly, or
- fail explicitly because of a named, diagnosed gap that this slice then closes

Silent omission, partial replay, or "best effort" degradation is not acceptable.

### 2. Export must preserve the same byte and bit semantics

This slice is not successful if the exported Python merely "gets approximately the right AES answer." It must preserve the same structural semantics as the in-app boards:

- byte positions stay in the same places
- permutation order stays exact
- GF(2^8) arithmetic stays exact
- bus assembly/disassembly behavior stays exact

If a full AES round passes only because a hidden ordering bug cancels out elsewhere, that is a failure, not a success.

### 3. Export must preserve visible-board honesty

The exported Python should mirror the already-shipped board structure closely enough that a student or instructor can recognize the same logic:

- SubBytes still reflects the shipped S-box path
- ShiftRows still reflects the shipped permutation path
- MixColumns still reflects the shipped GF(2^8) matrix multiplication structure
- AddRoundKey still reflects byte-wise XOR

This does not require one Python function per visual node, but it does require that the exporter/runtime not replace the board with a hidden black-box AES implementation.

### 4. This slice is validation-first, gap-fill second

The first job is to verify what already works.

Only after validation exposes a real parity gap should this slice add bounded exporter/runtime code. The work should stay incremental:

1. confirm current primitive parity
2. confirm current workspace parity
3. fix only the specific holes found
4. lock them with tests

---

## Primitive Coverage Requirements

The parity review must check these module families directly, not only through the full-round board:

### 1. `GF2Mul`

Must export correctly for the shipped AES use cases and match engine execution exactly.

Reference test vectors should include the canonical GF(2^8) cases already used in the shipped GF2 field slice, including:

- `GF2Mul(57, 83, poly=11B) -> C1`
- `GF2Mul(02, 02, poly=11B) -> 04`

### 2. `GF2Inv`

Must export correctly for the shipped AES use cases and match engine execution exactly.

Reference test vectors should include the canonical shipped inverse checks from the GF2 field slice, including round-trip-style validation over known AES byte examples rather than one lucky case only.

### 3. `SBox`

Must export correctly for the shipped AES SubBytes board path, including the Rijndael table-driven behavior currently exposed in product.

This slice does not need to re-litigate how SubBytes is taught. It only needs export parity for the shipped board.

### 4. `BitJoin` and shipped routing helpers used by AES boards

Any already-shipped helpers required to replay the AES boards must export correctly as used in those boards, especially the full-round ShiftRows path.

That includes `BitJoin` directly, plus the current 128-bit state assembly/disassembly path used by `AES Round (Full)`.

---

## Workspace Parity Requirements

The following shipped workspaces must be covered explicitly:

### 1. `Visible MixColumns`

Exported Python must match engine execution on the shipped demo's default inputs as loaded from `demo-projects.ts`, which are the FIPS 197 column values already used by the visible board.

### 2. `Visible SubBytes`

Exported Python must match engine execution on the shipped demo's default inputs as loaded from `demo-projects.ts`.

### 3. `Visible ShiftRows`

Exported Python must match engine execution on the shipped demo's default inputs as loaded from `demo-projects.ts`, preserving the same visible byte ordering.

### 4. `Visible AddRoundKey`

Exported Python must match engine execution on the shipped demo's default inputs as loaded from `demo-projects.ts` and preserve the same per-byte result ordering.

### 5. `AES Round (Full)`

Exported Python must match engine execution on the shipped demo's default inputs as loaded from `demo-projects.ts`, which are the FIPS 197 Appendix B round-1 values, and must produce the same final 16-byte output exactly.

This is the flagship parity check for the slice.

---

## Implementation Notes

### 1. Start from the existing exporter baseline

The export implementations for the GF2/AES path already exist in `python.ts`, including the relevant shipped module/runtime coverage for:

- `GF2Mul`
- `GF2Inv`
- `SBox`
- `Permutation`
- `BitJoin`
- `XOR`
- `HexSource`
- `BitsToHex`
- `HexOutput`

The known gap is not "missing exporters by default." The primary gap is test coverage at the primitive and individual-workspace level.

Start by:

1. running the full suite
2. confirming the existing seeded full-round parity test state
3. adding targeted primitive/workspace coverage
4. only then filling any real exporter/runtime hole that those tests expose

### 2. Reuse the shipped runtime model

Do not add a parallel Python-side AES implementation "just to make the tests pass."

The point of this slice is parity with the shipped visible boards, not bypassing them.

### 3. Prefer bounded fixes over exporter churn

If the parity gap is local to:

- one primitive exporter
- one runtime helper
- one signal assembly path

fix that local gap directly instead of broad exporter refactoring.

### 4. Full-round success does not eliminate primitive checks

It is possible for an end-to-end AES board to succeed while a local primitive path is still under-tested or accidentally coupled to a lucky configuration.

Keep the primitive tests and workspace tests both.

### 5. Record any remaining debt explicitly

If this slice reveals export debt that is real but out of scope, name it directly in implementation notes or status updates. Do not leave it as implied future cleanup.

### 6. No product-surface expansion

Do not turn this into:

- export UX redesign
- "generate optimized AES Python"
- a generalized codegen architecture rewrite

Those are separate conversations.

---

## Test Requirements

### 1. Primitive parity tests

Add or tighten tests so exported Python matches engine execution for:

- `GF2Mul`
- `GF2Inv`
- `SBox` in the shipped AES path
- `BitJoin` as used by the shipped ShiftRows/AES full-round path

### 2. Workspace parity tests

Add or tighten tests so exported Python matches engine execution for:

- `Visible MixColumns` using the shipped demo's default inputs
- `Visible SubBytes` using the shipped demo's default inputs
- `Visible ShiftRows` using the shipped demo's default inputs
- `Visible AddRoundKey` using the shipped demo's default inputs
- `AES Round (Full)` using the shipped demo's default inputs

### 3. FIPS 197 full-round parity

The exported full-round board must reproduce the same FIPS 197 Appendix B round-1 output already verified in-app.

### 4. Existing suite remains green

`npx vitest run` must pass in full.

`npm run build` must pass.

---

## Success Criteria

This slice is successful when:

1. The shipped GF2/AES primitive path exports honestly enough to replay the shipped boards
2. The shipped AES teaching workspaces export and execute with the same results as `executeProject()`
3. The full AES round export matches the shipped FIPS 197 round-1 board exactly
4. No new AES or GF2 capability is added as part of this slice
5. Any real remaining export debt is named explicitly rather than hidden behind a passing flagship case

---

## Likely Next Step

After this slice, the next bounded follow-on should be:

### `parameter-inspector.tsx Refactor`

That work should remain architecture-protection only:

- split a large UI surface conservatively
- preserve behavior exactly
- avoid coupling the refactor to new cryptography capability

The goal is to reduce drag on future analysis and inspector work, not to redesign the product.
