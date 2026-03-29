# SBOX-TABLE-TRANSFORMS-V1

Status: Implemented

Owner: Codex
Scope: Primitive Authoring / Teaching / Modern-Crypto Experimentation

## Why

MCW already has the first fixed-table `SBox` line in place:
- `SBox` as a visible lookup-table primitive
- a lookup/substitution transformation view
- bounded custom `SBox` table authoring

That foundation is the right starting point.

The next interesting teaching and experimentation question is not:
- "can MCW hide a smart adaptive S-box behind one black-box primitive?"

It is:
- "can MCW let a user visibly transform an authored S-box table and study what changed?"

This is valuable because it fits MCW's actual strengths:
- explicit structure
- visible mutation
- analyzable consequences
- direct comparison before/after

It also creates a safer path into dynamic/keyed S-box ideas without pretending that "more movement" automatically means "better cryptography."

## Goal

Add a bounded first pass of explicit `SBox` table transforms that let a user rearrange an authored substitution table through simple, visible operations.

The first milestone should make it possible to:
- take an existing valid `SBox` table
- apply a small set of table-level transforms
- keep the resulting table structurally valid
- re-run the machine and compare the behavioral consequences

This is a table-transformation teaching feature, not a claim of cryptographic improvement.

## Product Boundary

This slice should stay inside the existing authored-`SBox` model.

It should not:
- introduce a self-mutating runtime `SBox`
- create a hidden keyed/adaptive substitution primitive
- auto-score cryptographic quality
- claim that transformed tables are "better"
- add a generic matrix editor framework
- replace the existing direct cell-edit authoring workflow

The right V1 shape is:
- fixed `SBox` table
- explicit transform operations
- visible before/after consequences

## Required V1 Shape

1. The feature must operate on the existing authored `SBox.table` parameter model.
2. The first transform set must be bounded and explicit. Good V1 candidates are:
   - swap two rows
   - swap two columns
   - rotate one row left/right
   - rotate one column up/down
3. Every transform must preserve the table as a permutation of the same value set.
3a. `Row` and `column` must be defined relative to the visual grid shape:
   - a row is one contiguous group of `gridColumns` entries in the flat table
   - a column is entries at positions `i`, `i + gridColumns`, `i + 2 * gridColumns`, and so on
   - for 16-entry / 4-bit tables, `gridColumns = 4`
   - for 256-entry / 8-bit tables, `gridColumns = 16`
3b. Each transform operation must flow through the existing `onParamChange` path and be reversible as one undo step.
3c. Transform helpers must live in the UI layer, not in `src/engine/modules/sbox.ts`. The engine `SBox` remains a pure fixed-lookup primitive.
4. The transform action must be visible and user-directed, not automatic.
5. The user must be able to understand what changed in the table after a transform is applied.
6. The transformed table must continue to work with:
   - normal execution
   - the existing `SBox` transformation view
   - Python export, if the resulting table is still within the already-supported `SBox` export model
7. The V1 surface must remain small enough to teach in one sitting.

## Preferred V1 Direction

The likely best shape is:
- keep the existing grid-based `SBox` editor
- add a small `Transforms` section in the inspector for `SBox`
- provide one-step explicit operations with bounded controls
- immediately update the table and reuse existing validation/rendering

This keeps the feature honest:
- the table is still the source of truth
- transforms are just structured edits to that table

## Teaching Rules

- The UI must present transforms as table rearrangements, not as cryptographic magic.
- The language should stay literal:
  - `Swap rows`
  - `Rotate row right`
  - `Swap columns`
- The product should never imply that a transformed table is automatically stronger or more secure.
- The feature should encourage comparison:
  - before vs after substitution behavior
  - before vs after avalanche/cryptanalysis behavior where the user chooses to inspect it

## UX Rules

- The transform controls must be visibly separate from free-form cell editing.
- Each operation should be easy to reverse through the existing undo/redo stack.
- The affected row/column or cells should be visually obvious immediately after applying a transform.
- The user's currently selected grid cell determines the active row and column for rotation operations.
- For swap operations, the first row/column is inferred from the current selection and the second is chosen through a compact bounded control.
- Transform controls should appear in the existing `sbox-editor-actions` area, not in a new inspector panel section.
- The controls must stay bounded:
  - no mini scripting language
  - no arbitrary transform composition DSL
  - no hidden randomization in V1

## Good V1 Operations

The best first set is whichever stays easiest to explain and safest to validate.

Recommended order:
1. swap two rows
2. rotate one row left/right
3. swap two columns
4. rotate one column up/down

These are concrete enough to teach and compare without requiring a more abstract transform language.

## Non-Goals

- No keyed/runtime-changing S-box in V1
- No automatic `optimize this S-box` feature
- No differential or linear scorecard surface
- No random S-box generator
- No import/export library of famous branded S-boxes
- No standalone cryptanalysis dashboard dedicated only to S-box transforms
- No new engine-layer S-box types or runtime mutation
- No multi-step transform composition or macro recording
- No transform history beyond the existing undo/redo stack

## Success Condition

This slice is successful if:
- a student can start with an authored `SBox`
- apply a visible table transform
- understand what structural change was made
- re-run the machine and inspect the changed lookup behavior
- use MCW's existing analysis surfaces to compare consequences without the product overstating security claims

## Notes

MCW already has the `fixed lookup table` foundation.

This slice should build on that foundation in the most MCW-native way:
- explicit
- visible
- reversible
- analyzable

If later work explores dynamic or keyed S-box behavior, it should come after this simpler table-transform teaching line, not before it.
