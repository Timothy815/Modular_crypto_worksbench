# TRUNCATE-TO-MATCH-V1

Last updated: April 10, 2026

Status: Draft

## Purpose

Define the next bounded reference-driven mismatch helper slice after `REPEAT-TO-MATCH-V1`.

This slice makes it possible to visibly say:
- keep only the left side of this sequence until it matches that reference
- keep only the right side of this sequence until it matches that reference

The goal is to remove manual target-length bookkeeping for truncation workflows while keeping the truncation policy explicit on the graph.

## Why This Slice

MCW now has:
- fixed target-length truncation helpers
  - `TruncateSymbolSequence`
  - `TruncateBitsSequence`
- reference-driven repetition helpers
  - `RepeatSymbolToMatch`
  - `RepeatBitsToMatch`

What is still missing is the equivalent reference-driven truncation path.

Today the user must:
1. inspect the intended comparison or block width
2. count the target length by hand
3. enter that number into a truncate helper
4. keep it in sync manually if the reference changes

That is the same bookkeeping problem that `REPEAT-TO-MATCH-V1` just removed for repeated-key workflows.

## Product Goal

Users should be able to express:
- truncate this message to match that block width
- truncate this bit buffer to match that visible reference

by placing a visible helper in the graph.

The graph should still say:
- what is being truncated
- what is providing the target length
- which side is preserved

## Core Decision

This slice introduces **reference-driven truncation helpers**.

The policy remains explicit in the module name and side parameter.
Only the target length becomes reference-derived.

This is the product boundary:
- acceptable: `TruncateBitsToMatch(side=left, reference=block)`
- unacceptable: `XOR` or `Permutation` silently clipping the longer input

Important semantic note:
- this helper does not guarantee equality with the reference in all cases
- it guarantees that output length will not exceed reference length
- when the input is already shorter than the reference, the output remains unchanged

## V1 Product Shape

Bounded first-implementation modules:
- `TruncateSymbolToMatch`
- `TruncateBitsToMatch`

Inputs:
- `in`: explicit sequence to truncate
- `reference`: explicit sequence whose length governs the output

Outputs:
- one truncated sequence

Required params:
- `side`
  - `left`
  - `right`

Interpretation:
- `left` means keep the leftmost prefix of the input
- `right` means keep the rightmost suffix of the input

## Required Behaviors

1. Truncation must remain graph-visible.
2. Output ordering must be preserved.
3. The preserved side must remain explicit through the `side` param.
4. Output length equals `min(in.length, reference.length)`.
5. If `in.length > reference.length`, output length must exactly equal reference length.
6. If `in.length === reference.length`, output must equal `in`.
7. If `in.length < reference.length`, output must equal `in` unchanged.
8. Empty reference must yield empty output regardless of `side`.
9. `reference` must be a sequence input, not a scalar tick item.
10. `reference` must share the same signal domain as `in`; cross-domain length derivation is out of scope for V1.
11. Existing operator modules such as `XOR`, `AND`, `OR`, `AddMod`, `Permutation`, and `SBox` must not silently adopt this behavior.
12. V1 must be pure, deterministic, and Python-exportable.

## Domain Rules

### `TruncateSymbolToMatch`

- `in`: `symbol`, `kind: 'sequence'`
- `reference`: `symbol`, `kind: 'sequence'`
- `out`: `symbol`, `kind: 'sequence'`
- `side`: `left | right`

Examples:
- input: `HELLOWORLD`
- reference: `KEY`
- side: `left`
- output: `HEL`

- input: `HELLOWORLD`
- reference: `KEY`
- side: `right`
- output: `RLD`

### `TruncateBitsToMatch`

- `in`: `bits`, `kind: 'sequence'`
- `reference`: `bits`, `kind: 'sequence'`
- `out`: `bits`, `kind: 'sequence'`
- `side`: `left | right`
- length is measured in bits, not word groups

Examples:
- input: `[1,0,1,1,0,0,1,1]`
- reference length: `4`
- side: `left`
- output: `[1,0,1,1]`

- input: `[1,0,1,1,0,0,1,1]`
- reference length: `4`
- side: `right`
- output: `[0,0,1,1]`

## Validation Requirements

Validation must reject:
- missing `in` connection
- missing `reference` connection
- scalar/sequence mismatches
- symbol/bits domain mismatches
- scalar kind on the `reference` input port
- `reference` domain not matching `in`
- invalid `side` param values

Runtime should not error merely because `in` is shorter than `reference`.
That case is identity behavior in this slice, not failure.

Validation and runtime messages should be phrased in authoring language, for example:
- `TruncateBitsToMatch expects a sequence reference, not a scalar bit word`
- `TruncateSymbolToMatch side must be left or right`

## Inspector / UX Guidance

Recommended inspector language:
- policy: `truncate to reference length`
- preserved side: `left` or `right`
- target source: `reference`
- resolved current length: visible when analysis/runtime data is available

Recommended preview behavior:
- show the resulting truncated output when both inputs are available
- make it obvious that the reference is contributing length only
- when `in.length < reference.length`, display a notice that no truncation was applied and the output equals the input, not the reference length
- describe resolved length in domain-native units:
  - character count for symbol sequences
  - bit count for bit sequences

## Product Boundary

This slice is about ergonomic truncation only.

It is not about:
- repeat-to-match
- pad-to-match
- strict mismatch rejection helpers
- hidden clipping inside existing operators
- downstream-driven policy inference

## Relationship To Existing Work

This slice extends:
- `EXPLICIT-MISMATCH-POLICIES-V1`
- `MATCH-LENGTH-MISMATCH-HELPERS-V1`
- `REPEAT-TO-MATCH-V1`

It should feel like the reference-driven truncation companion to:
- `TruncateSymbolSequence`
- `TruncateBitsSequence`

## Likely Demo Paths

- `SymbolSequenceInput(message) -> TruncateSymbolToMatch(reference=key, side=left) -> TextOutput`
- `BitSequenceInput(buffer) -> TruncateBitsToMatch(reference=block, side=right) -> BitOutput`
- `BitSequenceInput(longBuffer) -> TruncateBitsToMatch(reference=block, side=left) -> BitsSequenceToTicked(wordWidth=8) -> XOR(b=blockWord)`

## Explicit Non-Goals

Do not include:
- hidden mismatch repair inside `XOR`
- hidden clipping in downstream modules
- cross-domain reference matching
- automatic fallback from truncate-to-match to pad-to-match
- a generic `MatchLength` primitive with a mode dropdown in V1

## Success Criteria

This contract is successful when:
- reference-driven truncation stops requiring manual target-length counting
- the graph still makes the truncation policy visible
- users can build honest visible clipping workflows without pushing mismatch behavior into unrelated operators
