# SBOX-GENERATION-WORKFLOW-V1

Status: Implementing

Owner: Codex
Scope: Primitive Authoring / Modern-Crypto Teaching / Workflow Ergonomics

## Why

MCW already has:
- shipped custom `SBox` table authoring
- shipped row/column transform controls
- a visible lookup/transformation analysis path

That foundation is good, but the current authoring loop is still too manual for the way users actually want to work.

Right now the product makes it possible to author an `SBox`.
It does not yet make it *fast* to create one intentionally.

The current pain points are:
- starting from a raw table is slow
- large tables are error-prone to fill by hand
- users often know the intended table *shape* before they know every entry
- generating randomized variants is awkward
- the current workflow is still better for editing than for initial creation

This slice should solve the workflow problem, not by hiding the table, but by giving the user a faster way to create a visible table before refining it.

## Goal

Add a bounded `SBox` generation workflow that lets a user choose table dimensions and generation mode first, then produce a visible authored table that can still be edited and transformed through the existing `SBox` surfaces.

The first milestone should make it possible to:
- choose a supported power-of-two `SBox` size
- generate a table from a small preset set
- distinguish between deterministic structured presets and randomized presets
- continue editing the generated table using the existing grid and transform controls

This is a workflow acceleration slice, not a cryptographic quality claim.

## Product Boundary

This slice must stay inside the existing authored-`SBox` model.

It should not:
- introduce a hidden adaptive or keyed runtime `SBox`
- auto-score the generated table as "good cryptography"
- replace the current editor with a black-box wizard
- create a giant property-analysis suite
- import a library of famous branded S-boxes as the main path
- pretend random generation implies cryptographic strength

The right V1 shape is:
- choose size
- choose generation preset
- generate visible table
- refine with existing editor and transforms

## Required V1 Shape

1. The feature must operate on the existing `SBox.table` parameter model.
2. The generation flow must be dimension-first:
   - choose a supported power-of-two table size
   - then choose a generation mode
3. The V1 size selector must offer exactly two options: 4-bit / 16 entries and 8-bit / 256 entries. Other power-of-two widths are excluded from the generation UI.
4. The UI must clearly distinguish between:
   - deterministic structured presets (identity, reverse, pair-swap) — where the result is predictable and inspectable
   - randomized presets (random permutation) — where the result varies each time
   All generated tables are valid permutations. MCW does not support non-permutation SBox tables.
5. V1 should ship a bounded set of generation presets:
   - Identity
   - Reverse
   - Random permutation
   - Pair-swap permutation: `table[2i] = 2i + 1` and `table[2i + 1] = 2i` for all valid `i`
6. Random generation must be visibly described as:
   - random table order
   - not a claim of cryptographic quality
7. Random permutation generation in V1 must use Fisher-Yates shuffle over `Math.random()`. No seed persistence is required.
8. The generated result must continue to work with:
   - existing `SBox` grid editing
   - existing row/column transform controls
   - existing lookup/transformation analysis view
   - existing Python export model, if the final table remains export-supported
9. Generation actions must flow through the current authored-param update path so they remain undoable as one step.
10. Generation always replaces the full table (size and content). It is never a partial overlay on an existing table.
11. The existing "Reset To Identity" and "Reset To Reverse" buttons should be removed or folded into the generation controls to avoid duplicate affordances.
12. The feature must remain teachable in one sitting.

## Preferred V1 Direction

The likely best shape is:
- keep the current `SBox` editor as the main authored surface
- add a compact `Generate` block inside the existing editor controls
- allow users to:
  - choose size
  - choose preset
  - generate into the current table
- then continue with existing per-cell editing and transforms

This keeps the source of truth clear:
- the table is still the table
- generation is just a faster way to create it

## Good V1 Generation Presets

Recommended first set:

1. Identity
- easiest baseline
- strong teaching default

2. Reverse
- already familiar from existing reset behavior
- useful contrast against identity

3. Random permutation
- fast way to produce a visible permutation table
- uses Fisher-Yates shuffle, no seed persistence

4. Pair-swap permutation
- `table[2i] = 2i + 1` and `table[2i + 1] = 2i` for all valid `i`
- explicitly visible and easy to explain
- good for teaching invertible rearrangements

If the UI needs one fewer option for clarity, drop `Reverse` before dropping `Random permutation`.

## Teaching Rules

- The UI must present generation as authored table setup, not as automatic cryptographic design.
- The copy must stay literal:
  - `Choose size`
  - `Generate identity`
  - `Generate random permutation`
- The product must not imply that random means secure.
- The pair-swap path should be described as one visible permutation recipe, not as a privileged cryptographic technique.
- Users should be encouraged to generate first, then inspect or refine in the existing editor.

## UX Rules

- Generation controls should appear in the existing `SBox` editor area, not as a separate wizard surface.
- The workflow should be fast enough that a user can create a fresh 4-bit or 8-bit table without touching the raw CSV field.
- Current manual editing must remain available as an advanced fallback.
- The table should update immediately after generation.
- No multi-step scripting language, no transform macros, and no hidden randomization beyond the chosen preset.

## Non-Goals

- No runtime-keyed or dynamic `SBox` in this slice
- No automatic "good S-box" generator
- No differential or linear scorecards
- No seed persistence or reproducible random generation in V1
- No non-permutation (lossy/collapsing) table generation
- No generation sizes beyond 4-bit and 8-bit in V1
- No famous S-box gallery or branded presets
- No replacement of the existing editor with a wizard-only workflow

## Success Condition

This slice is successful if:
- a student or teacher can create a new visible `SBox` table by selecting size and preset
- they can intentionally choose between a structured baseline and a randomized permutation table
- they can continue editing or transforming the result in the current workflow
- the overall authoring loop feels much faster and less error-prone than raw table editing alone

## Notes

MCW already has the right S-box foundations:
- visible authored table
- visible lookup analysis
- visible transform operations

This slice should improve the speed and confidence of initial creation without changing the basic teaching story:
- an S-box is still a table
- the table is still visible
- generation is just a faster starting point, not magic

If later work explores dynamic or keyed S-box behavior, it should come after this simpler generation teaching line, not before it.
