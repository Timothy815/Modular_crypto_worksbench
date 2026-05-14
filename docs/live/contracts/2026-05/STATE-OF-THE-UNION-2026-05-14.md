# MCW State Of The Union

Last updated: May 14, 2026
Status: Active review note

---

## Executive Read

As of May 14, 2026, `main` is materially ahead of the April 29 baseline.

The most important change: the full **AES Building Blocks** teaching series is complete. Every individual AES round operation now has a demo, tutorial, and challenge (where applicable), all verified against NIST FIPS 197 test vectors. The math foundations for a full AES round composite are entirely in place.

Beyond AES: the palette received a substantial reorganization (new Elliptic Curves & Fields section, section-level filter dropdown), and the EC point inspector was reworked to handle real-scale secp256k1 coordinates without overflow.

---

## What Shipped Since April 29

### AES Building Blocks Series

All four AES round operations are now individually visible and verified.

| Operation | Demo | Tutorial | Challenge |
|---|---|---|---|
| MixColumns | Visible MixColumns | How AES Mixes a Column | Repair the MixColumns Coefficient |
| SubBytes | Visible SubBytes | Where The AES S-Box Comes From | Repair the Affine Constant |
| ShiftRows | Visible ShiftRows | Why AES Shuffles Bytes Between Columns | — |
| AddRoundKey | Visible AddRoundKey | How The Round Key Enters Each Round | Repair the Round Key |

All use NIST FIPS 197 test vectors, creating a coherent verification story students can trace by hand.

Implementation notes:
- ShiftRows uses a 128-element comma-separated permutation index string encoding the byte-column reorder
- AddRoundKey uses 4 parallel XOR lanes (one per byte), each with a separate HexSource key input
- SubBytes uses the shipped `SBox` with Rijndael table + affine constant as a breakable param
- GROUP_STAGE_MAP, GROUP_ORDER_HINTS, and PRIMITIVE_LIBRARY_META are all current for the AES Building Blocks group

### Palette Reorganization

- New `Elliptic Curves & Fields` section split out from `Modular Arithmetic`
- 15 ECC modules moved: FieldAdd/Sub/Mul/Inv, PointSource/OnCurve/Negate/Add/Double/Order/Equals, ScalarMultiply, ChallengeCombine, ScalarLinearCombine, NamedCurveBasePoint
- `Block Transforms` renamed from "Word & Diffusion"
- `GF2Mul`, `GF2Inv`, `NamedCurveBasePoint` — previously uncatalogued — now have full PRIMITIVE_LIBRARY_META entries
- Flat filter dropdown replaced with optgroup-based structure: Sources & Sinks, Symbol Domain, Bit Domain (with sub-filters: Bit Logic, Framing, Block Transforms, Modular Arithmetic, Elliptic Curves, State & Keystream), Cross-Domain, Authored
- Module library section count updated to 11 (test updated accordingly)

### EC Point Inspector Rework

Problem: the xor-grid layout was a 5-column CSS grid capped at 64px per column — completely unsuitable for 64-character secp256k1 hex coordinates.

Fix:
- New `xor-grid--ec-point` CSS modifier: 2-column stacked card layout (label | value)
- `ec-point-value` card with stacked decimal (`ec-point-text`) and hex (`ec-point-hex`) rows
- Applied to point-compare, point-action, and point-order inspector views
- `formatSignalCompact()` added to `formatters.ts`: truncates EC hex coords to `0xNNNNNN…NNNNNN` format for trace/stepper contexts
- `.selected-trace p` given `word-break: break-all` for any remaining overflow

---

## Current Genuine Next Work

### 1. Full AES Round Composite (Highest Priority)

The four individual building blocks are all visible and verified. The natural next slice is composing them into a single `AES Round` composite module: SubBytes → ShiftRows → MixColumns → AddRoundKey.

This is pure composition work — no new engine primitives required. The challenge is authoring the 128-bit state wiring cleanly and making the composite feel as legible as the individual building blocks.

### 2. Python Export Parity for GF2/AES Domain

`GF2Mul` and `GF2Inv` have no Python export. Given that MixColumns is now demonstrable with FIPS 197 vectors, the Python export gap is now more visible.

### 3. UI Refactor: parameter-inspector.tsx

`parameter-inspector.tsx` has grown as the primary large-surface candidate for the architecture-protection refactor mentioned in V2.1-NEXT-DOCKET.md. This is not urgent, but it will become a drag coefficient for future analysis work if deferred too long.

---

## What the April 29 State-of-the-Union Said vs Now

The April 29 note described MCW as having "four real strengths: explicit machine construction, reusable structure authoring, live inspection and cryptanalysis, guided classroom content."

That framing remains accurate. What is new:
- the cryptographic vocabulary now extends to all four individual AES round primitives with teaching content
- the palette is substantially better organized for a new user finding their first ECC or AES building block
- the EC inspector handles real-world key sizes without layout breakage

The product risk the April 29 note identified — "the shipped capability set is hard to summarize accurately" — has decreased slightly. The AES Building Blocks group is now the clearest single evidence of MCW's depth: it is not just a cipher assembler, it is a teaching environment where you can walk through a NIST standard one step at a time and repair broken implementations.

---

## Practical Next-Session Guidance

A fresh session should read, in order:
1. `AGENTS.md`
2. `IMPLEMENTATION-STATUS.md` (updated to reflect AES Building Blocks complete)
3. `ENGINE-V1-CONTRACT.md`
4. This file
5. `docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md` — historical context for AES primitive layer
6. `docs/live/contracts/2026-05/REAL-WORLD-CRYPTO-CAPABILITY-ROADMAP-V1.md` — overall trajectory

The most likely next task is the full AES round composite. The correct starting point is drafting a bounded contract, not implementing directly. Review the four shipped building block demos to understand the wiring complexity before scoping.

Do not treat "full visible AES round" as unshipped. It is now a composition task, not a primitive task.
