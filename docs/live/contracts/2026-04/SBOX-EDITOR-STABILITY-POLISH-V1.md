# SBOX-EDITOR-STABILITY-POLISH-V1

Last updated: April 21, 2026

Status: Proposed bounded next slice

## Purpose

Define the next bounded polish slice for the S-box authoring surface after:
- shipped `4 -> 4`, `6 -> 4`, and `8 -> 8` support
- shipped DES-style and AES seeded boards
- shipped the first stability pass that removed the visible brittle width controls

This slice is not about adding more constructor breadth.

This slice is about making the S-box editor feel as stable and legible as the pre-expansion version while preserving the new bounded shapes.

## Problem

The expanded S-box feature line is now functionally broader, but the UX still carries some risk:
- shape changes can feel destructive rather than deliberate
- preset and shape selection are still split across different mental models
- the editor can still feel more narrated than necessary
- the old `4 -> 4` and `8 -> 8` workflows were calmer and harder to misuse

The product problem is not missing capability.

The product problem is that the S-box authoring surface should feel like one stable board that can take on a few honest shapes, not like a parameterized configuration panel.

## Product Goal

Users should feel that:
- `4 -> 4` is still the familiar small teaching grid
- `8 -> 8` is still the familiar byte-grid teaching board
- `6 -> 4` is an honest additional board, not a fragile special mode

Shape changes should feel like:
- choosing a new authored board

They should not feel like:
- editing a low-level type signature and hoping the rest of the UI survives

## Core Decision

The S-box editor should be **board-first**, not param-first.

The right V1 move is:
1. keep one visible shape selector inside the S-box editor
2. hide raw width plumbing from the default inspector surface
3. treat shape changes as loading a valid board state
4. keep advanced/raw editing available without making it the primary workflow

The wrong V1 move is:
- bringing back visible independent width controls
- exposing invalid intermediate states
- trying to preserve every authored table across every shape change automatically

## Required UX Shape

1. The visible primary decision must be one bounded `Shape` control:
- `4 -> 4`
- `6 -> 4`
- `8 -> 8`

2. Independent `inputBits` and `outputBits` fields must remain hidden from the normal parameter surface.

3. Changing shape must always land on a valid authored table immediately.

4. The default seeded board for each shape should be stable and inspectable:
- `4 -> 4`: one small teaching permutation or famous `4 -> 4` preset
- `6 -> 4`: DES-style seeded board
- `8 -> 8`: AES seeded board

5. The user should never see a white-screen or editor collapse because the board passed through an impossible intermediate shape.

6. The old square-grid experience should remain intact:
- `4 -> 4` still feels like the familiar teaching grid
- `8 -> 8` still feels like the familiar byte grid

7. `6 -> 4` should remain explicit and honest:
- DES-style row/column semantics
- direct output authoring allowed
- no fake inverse/permutation framing

## Interaction Rules

1. Shape change means "load a different board", not "mutate the current board cell-by-cell across dimensions."

2. If shape changes are destructive to current authored work, the product may:
- silently reseed for now, if the behavior is stable and obvious
- or add a lightweight confirmation later if user testing shows accidental loss is a real problem

3. Presets should feel first-class and concrete.

4. The editor should prefer:
- direct manipulation
- compact control surfaces
- low narration

5. The editor should avoid:
- restating obvious visible behavior in persistent helper chips
- exposing technical width-plumbing language unless needed for clarity

## Copy Rules

- Keep only the chips that prevent confusion or explain a non-obvious restriction.
- Remove helper copy that merely narrates what the user can already see.
- Keep DES-specific explanation where it teaches a genuinely different lookup grammar.
- Keep permutation-only analysis language scoped to the shapes where it is actually true.

## Analysis Rules

For `4 -> 4` and `8 -> 8`:
- inverse/fixed-point/involution tools remain available

For `6 -> 4`:
- permutation-only analysis stays hidden
- the analysis view should explain the DES row/column grammar clearly and briefly

## Non-Goals

Do not include:
- additional S-box widths
- algebraic constructor families
- cryptanalytic scorecards
- preserving arbitrary authored tables across incompatible shape changes
- a large preset-browser redesign

## Success Criteria

This slice is successful when:
- the S-box editor never breaks from a normal shape change
- the old `4 -> 4` and `8 -> 8` boards feel as stable as they did before expansion
- `6 -> 4` feels like one more honest board, not a brittle exception
- the visible UI stays compact and low-drama
- the editor feels harder to misuse than it did immediately after shape expansion

## Implementation Boundary

If scope must stay tight, keep:
1. one visible shape selector
2. hidden raw width params
3. valid-board reseeding on shape change
4. removal of low-value explanatory copy

Everything else can wait.
