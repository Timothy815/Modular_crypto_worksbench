# SBOX-CONSTRUCTOR-EXPANSION-V1

Last updated: April 21, 2026

Status: Proposed bounded next slice

## Purpose

Define the next bounded S-box authoring follow-on after:
- shipped custom `SBox` table authoring
- shipped row/column transform controls
- shipped dimension-first generation workflow for 4-bit and 8-bit permutation tables

The goal is not to add arbitrary table sizes for completeness.

The goal is to extend MCW's S-box line in the most educationally valuable direction:
- support one important non-square common shape
- add a small number of historically meaningful preset families
- keep the table explicit and editable

## Why Now

MCW already teaches:
- that an S-box is a visible lookup table
- that a student can author or generate 4-bit and 8-bit permutation tables
- that row/column transforms visibly change substitution behavior

The next clear limitation is conceptual:
- the current workflow implies that "common S-boxes are square permutations"
- it does not yet show that real cryptographic systems also use non-square substitution boxes

The most important missing teaching example is:
- DES-style `6 -> 4`

That addition broadens the user's mental model more than adding niche square sizes such as:
- `5 -> 5`
- `7 -> 7`

## Product Goal

Users should be able to:
- create and inspect one bounded non-square common S-box shape
- choose from a small famous-box preset set where the preset itself is part of the lesson
- continue editing the resulting table through the existing explicit table workflow

The product should teach:
- not all S-boxes are square
- not all S-boxes are permutations
- famous-box presets are concrete authored tables, not special runtime magic

## Core Decision

This slice expands **constructor and preset coverage**, not runtime S-box semantics.

The right V1 move is:
1. add bounded non-square table support for `6 -> 4`
2. add curated preset families for existing `4 -> 4` and `8 -> 8`

The wrong V1 move is:
- generalized "all widths" support
- a giant branded S-box gallery
- algebraic quality scoring
- dynamic/keyed runtime mutation

## Required V1 Shape

1. The generation workflow must continue to be dimension-first.

2. The size selector must expand from:
- `4 -> 4`
- `8 -> 8`

to:
- `4 -> 4`
- `6 -> 4`
- `8 -> 8`

3. `6 -> 4` must be treated as a valid explicit authored lookup-table shape:
- 64 input entries
- 16 output values
- repeated outputs allowed
- permutation-only validation must not be enforced for this shape

4. Square permutation validation must remain intact for:
- `4 -> 4`
- `8 -> 8`

5. The generation UI must support bounded preset families:

### `4 -> 4`
- existing structured presets remain available
- add one or more famous lightweight-cipher preset tables only if they are named and inspectable

### `6 -> 4`
- add DES-style preset support
- V1 may ship either:
  - one bounded DES S-box preset, or
  - the full `S1` through `S8` set
- the chosen shape must stay compact and teachable

### `8 -> 8`
- retain existing structured presets
- add AES preset support
- add at most one or two additional famous byte-box presets if they materially improve comparison teaching

6. Famous presets must still become ordinary visible table data after selection.
They must not behave as special named runtime objects.

7. The existing editor must remain the source of truth after generation:
- per-cell editing where supported
- raw-table fallback where needed
- existing analysis/transformation views
- export behavior consistent with table support

8. The generation copy must distinguish clearly between:
- structured pedagogical presets
- famous cipher presets
- random generation

9. The product must not imply:
- that famous means secure in every context
- that random means strong
- that non-square boxes are "advanced" magic

## Preferred V1 Direction

The best bounded first move is:

### Part 1 — DES-style shape expansion
- add `6 -> 4`
- teach that outputs can repeat
- make row/column indexing honest for the DES family rather than forcing a square-grid fiction

### Part 2 — Curated preset expansion
- `4 -> 4`: add a lightweight-cipher comparison path
- `8 -> 8`: add AES and possibly one comparison peer

If scope needs tightening, keep:
- `6 -> 4`
- one DES preset
- AES preset

and defer the rest.

## UI / Teaching Rules

- The language must stay literal:
  - `Input bits`
  - `Output bits`
  - `64 rows`
  - `Repeated outputs allowed`
- The editor must not pretend that `6 -> 4` is a permutation editor
- DES-style tables should read as indexed substitution tables, not as malformed square grids
- Famous presets should include a short origin label, not a long history lesson
- The user should always be able to inspect the final table directly

## Validation Rules

For `4 -> 4` and `8 -> 8`:
- keep permutation validation
- keep existing transform/generation assumptions where valid

For `6 -> 4`:
- validate only:
  - output width
  - table length
  - value range
- do not require uniqueness across the 64 outputs

Transform operations that assume permutation structure may need to be:
- disabled for `6 -> 4`, or
- narrowly redefined for non-square indexed tables

V1 should prefer disabling over inventing shaky new semantics.

## Export / Analysis Boundary

This slice should preserve glass-box honesty across the rest of the product.

That means:
- generated presets become ordinary table params
- analysis views should show the actual selected table
- export should support only the shapes the exporter can honestly handle

If `6 -> 4` export is not yet implemented, V1 may still ship the authoring path as long as:
- the export boundary is explicit
- the product does not imply parity where it does not exist

## Good V1 Preset Candidates

Recommended order:

1. DES-style `6 -> 4`
- highest conceptual value
- first non-square common family

2. AES `8 -> 8`
- highest-value famous byte-box preset
- fits the existing modern teaching line

3. One lightweight `4 -> 4` family
- useful if there is already a real teaching workspace that can compare it

## Explicit Non-Goals

Do not include:
- arbitrary `n -> m` freeform support
- `5 -> 5` / `7 -> 7` / other niche widths just for completeness
- differential or linear property scorecards
- "optimize my S-box" tooling
- dynamic runtime-keyed S-box behavior
- a giant branded preset marketplace
- automatic generation from irreducible-polynomial or affine-structure builders in this slice

## Success Criteria

This slice is successful when:
- a user can create and inspect a DES-style `6 -> 4` S-box honestly
- a user can select at least one famous preset family without losing explicit table visibility
- the product teaches that non-square S-boxes are real and common
- the existing S-box authoring story becomes broader without becoming fuzzier

## Suggested Follow-On

If this slice lands cleanly, the next S-box constructor follow-on should be:
- a bounded general small-width `n -> m` table authoring model, or
- an algebraic constructor slice specifically for AES-like byte boxes

That later slice should only happen after `6 -> 4` and famous preset support prove that the broader mental model is worth carrying.
