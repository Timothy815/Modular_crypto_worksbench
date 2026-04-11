# PAD-TO-MATCH-V1

Last updated: April 10, 2026

Status: Draft

## Purpose

Define the next bounded reference-driven mismatch helper slice after `TRUNCATE-TO-MATCH-V1`.

This slice makes it possible to visibly say:
- pad this sequence on the left until it reaches that reference length
- pad this sequence on the right until it reaches that reference length

The goal is to remove manual target-length bookkeeping for padding workflows while keeping both the padding policy and pad value explicit on the graph.

## Why This Slice

MCW now has:
- fixed target-length padding helpers
  - `PadBitsSequence`
- reference-driven mismatch helpers
  - `RepeatSymbolToMatch`
  - `RepeatBitsToMatch`
  - `TruncateSymbolToMatch`
  - `TruncateBitsToMatch`

What is still missing is the equivalent reference-driven padding path.

Today the user must:
1. inspect the intended block width or comparison width
2. count the target length by hand
3. enter that number into a pad helper
4. keep it in sync manually if the reference changes

That is the same bookkeeping problem already removed for repetition and truncation.

## Product Goal

Users should be able to express:
- pad this short bit buffer to match that block
- pad this short symbol sequence to match that visible reference

by placing a visible helper in the graph.

The graph should still say:
- what is being padded
- what is providing the target length
- which side receives the padding
- what value is being padded in

## Core Decision

This slice introduces **reference-driven padding helpers**.

The policy remains explicit in the module name and pad-side / pad-value params.
Only the target length becomes reference-derived.

This is the product boundary:
- acceptable: `PadBitsToMatch(side=left, padBit=0, reference=block)`
- unacceptable: `XOR` or `SBox` silently extending the shorter input

Important semantic note:
- this helper does not guarantee equality with the reference in all cases
- it guarantees that output length will never be shorter than the reference because of under-padding
- if the input is already at least as long as the reference, the output remains unchanged
- this helper does not silently truncate overlong inputs

## V1 Product Shape

Bounded first-implementation modules:
- `PadSymbolToMatch`
- `PadBitsToMatch`

Inputs:
- `in`: explicit sequence to pad
- `reference`: explicit sequence whose length governs the output

Outputs:
- one padded sequence

Required params:
- `side`
  - `left`
  - `right`

Pad-value params:
- `padChar` for `PadSymbolToMatch`
- `padBit` for `PadBitsToMatch`

Interpretation:
- `left` means padding is added before the input
- `right` means padding is added after the input

## Required Behaviors

1. Padding must remain graph-visible.
2. Output ordering must be preserved.
3. The pad side must remain explicit through the `side` param.
4. The pad value must remain explicit through the helper params.
5. Output length equals `max(in.length, reference.length)`.
6. Padding is applied only when `in.length < reference.length`, and in that case output length must exactly equal reference length.
7. If `in.length === reference.length`, output must equal `in`.
8. If `in.length > reference.length`, output must equal `in` unchanged.
9. When `reference` is empty and `in` is non-empty, output must equal `in` unchanged.
   Note: this is a deliberate exception to the family pattern.
   `RepeatToMatch` and `TruncateToMatch` both yield empty output for empty reference.
   `PadToMatch` cannot, because padding cannot shrink existing data and the overlong-input policy applies instead.
10. `reference` must be a sequence input, not a scalar tick item.
11. `reference` must share the same signal domain as `in`; cross-domain length derivation is out of scope for V1.
12. Existing operator modules such as `XOR`, `AND`, `OR`, `AddMod`, `Permutation`, and `SBox` must not silently adopt this behavior.
13. V1 must be pure, deterministic, and Python-exportable.
14. If `in` is empty and `reference` is non-empty, the output must consist entirely of the explicit pad value repeated to the reference length.

## Domain Rules

### `PadSymbolToMatch`

- `in`: `symbol`, `kind: 'sequence'`
- `reference`: `symbol`, `kind: 'sequence'`, length-contributing only
- `out`: `symbol`, `kind: 'sequence'`
- `side`: `left | right`
- `padChar`: exactly one printable non-control ASCII character
- default `padChar`: a single space character (` `)

Examples:
- input: `KEY`
- reference: `HELLOWORLD`
- side: `left`
- padChar: `_`
- output: `_______KEY`

- input: `KEY`
- reference: `HELLOWORLD`
- side: `right`
- padChar: `X`
- output: `KEYXXXXXXX`

### `PadBitsToMatch`

- `in`: `bits`, `kind: 'sequence'`
- `reference`: `bits`, `kind: 'sequence'`, length-contributing only
- `out`: `bits`, `kind: 'sequence'`
- `side`: `left | right`
- `padBit`: integer `0 | 1`
- default `padBit`: `0`
- length is measured in bits, not word groups

Examples:
- input: `[1,0,1]`
- reference length: `8`
- side: `left`
- padBit: `0`
- output: `[0,0,0,0,0,1,0,1]`

- input: `[1,0,1]`
- reference length: `8`
- side: `right`
- padBit: `1`
- output: `[1,0,1,1,1,1,1,1]`

## Validation Requirements

Validation must reject:
- missing `in` connection
- missing `reference` connection
- scalar/sequence mismatches
- symbol/bits domain mismatches
- scalar kind on the `reference` input port
- `reference` domain not matching `in`
- invalid `side` param values
- invalid `padBit` param values
- `padChar` values that are not exactly one character

Runtime should not error merely because `in` is already as long as or longer than `reference`.
Those cases are unchanged-output behavior in this slice, not failure.

Validation and runtime messages should be phrased in authoring language, for example:
- `PadBitsToMatch expects a sequence reference, not a scalar bit word`
- `PadSymbolToMatch requires "padChar" to be exactly one character`
- `PadBitsToMatch side must be left or right`

## Inspector / UX Guidance

Recommended inspector language:
- policy: `pad to reference length`
- pad side: `left` or `right`
- pad value: visible
- target source: `reference`
- output length rule: `max(input, reference)`
- resolved current length: visible when analysis/runtime data is available

Recommended preview behavior:
- show the resulting padded output when both inputs are available
- make it obvious that the reference is contributing length only
- when `in.length >= reference.length`, display a notice that no padding was applied and the output equals the input
- describe resolved length in domain-native units:
  - character count for symbol sequences
  - bit count for bit sequences

## Product Boundary

This slice is about ergonomic padding only.

It is not about:
- repeat-to-match
- truncate-to-match
- strict mismatch rejection helpers
- hidden extension inside existing operators
- downstream-driven policy inference

## Relationship To Existing Work

This slice extends:
- `EXPLICIT-MISMATCH-POLICIES-V1`
- `MATCH-LENGTH-MISMATCH-HELPERS-V1`
- `REPEAT-TO-MATCH-V1`
- `TRUNCATE-TO-MATCH-V1`

It should feel like the reference-driven padding companion to:
- `PadBitsSequence`

With this slice, the three reference-driven adjustment helpers are complete:
- repeat-to-match
- truncate-to-match
- pad-to-match

The deferred strict/error variant remains out of scope for V1.

## Likely Demo Paths

- `BitSequenceInput(shortKey) -> PadBitsToMatch(reference=message, side=right, padBit=0) -> XOR(b=message)`
- `SymbolSequenceInput(shortCode) -> PadSymbolToMatch(reference=fixedBlock, side=left, padChar=' ') -> SymbolPermutation`
- `BitSequenceInput(variableLengthBuffer) -> TruncateBitsToMatch(reference=block, side=left) -> PadBitsToMatch(reference=block, side=right, padBit=0) -> XOR(b=block)`

## Explicit Non-Goals

Do not include:
- hidden mismatch repair inside `XOR`
- hidden extension in downstream modules
- cross-domain reference matching
- automatic fallback from pad-to-match to truncate-to-match
- a generic `MatchLength` primitive with a mode dropdown in V1

## Success Criteria

This contract is successful when:
- reference-driven padding stops requiring manual target-length counting
- the graph still makes the padding policy visible
- users can build honest visible extension workflows without pushing mismatch behavior into unrelated operators
