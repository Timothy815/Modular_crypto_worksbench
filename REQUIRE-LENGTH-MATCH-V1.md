# REQUIRE-LENGTH-MATCH-V1

Last updated: April 10, 2026

Status: Shipped

## Purpose

Define the next bounded reference-driven mismatch-helper slice after `PAD-TO-MATCH-V1`.

This slice makes it possible to visibly say:
- require this sequence to already match that reference length
- fail here unless these two sequences are already aligned

The goal is to give MCW one explicit fail-fast companion to the already-shipped repair helpers.

## Why This Slice

MCW now has the full reference-driven repair trio:
- `RepeatSymbolToMatch`
- `RepeatBitsToMatch`
- `TruncateSymbolToMatch`
- `TruncateBitsToMatch`
- `PadSymbolToMatch`
- `PadBitsToMatch`

What is still missing is the strict companion.

Today a user who wants to say:
- these must already be the same length
- do not repair this mismatch for me
- stop the graph here if the lengths diverge

has no dedicated visible helper for that policy.

That leaves two bad outcomes:
1. rely on a later downstream width/type failure that does not clearly explain the authoring intent
2. overuse a repair helper when the real policy should have been fail-fast

## Product Goal

Users should be able to express:
- assert that this key already matches this message
- assert that this block buffer already matches this reference width

by placing a visible helper in the graph.

The graph should still say:
- what is being checked
- what is providing the reference length
- that no repair is being performed

## Core Decision

This slice introduces **reference-driven strict match helpers**.

The policy remains explicit in the module name.
No truncation, padding, or repetition occurs.

This is the product boundary:
- acceptable: `RequireBitsLengthMatch(reference=block)`
- unacceptable: `XOR` or `Permutation` silently acting as the mismatch guard

Important semantic note:
- this helper is an assertion, not a repair
- when lengths match, output equals `in` unchanged
- when lengths differ, runtime must reject with an explicit mismatch error

## V1 Product Shape

Bounded first-implementation modules:
- `RequireSymbolLengthMatch`
- `RequireBitsLengthMatch`

Inputs:
- `in`: explicit sequence being checked
- `reference`: explicit sequence whose length must match

Outputs:
- one unchanged sequence when the assertion passes

Params:
- none

## Required Behaviors

1. Length checking must remain graph-visible.
2. No repair policy may be hidden inside this helper.
3. Output ordering must be preserved because successful output is unchanged `in`.
4. Output length equals `in.length` when the assertion passes.
5. If `in.length === reference.length`, output must equal `in`.
6. If `in.length !== reference.length`, runtime must reject with an explicit mismatch error.
7. `reference` must be a sequence input, not a scalar tick item.
8. `reference` must share the same signal domain as `in`; cross-domain length comparison is out of scope for V1.
9. Existing operator modules such as `XOR`, `AND`, `OR`, `AddMod`, `Permutation`, and `SBox` must not silently adopt this behavior.
10. V1 must be pure, deterministic, and Python-exportable.
11. Empty sequences are valid only when both `in` and `reference` are empty; otherwise the same mismatch rule applies.

## Domain Rules

### `RequireSymbolLengthMatch`

- `in`: `symbol`, `kind: 'sequence'`
- `reference`: `symbol`, `kind: 'sequence'`, length-contributing only
- `out`: `symbol`, `kind: 'sequence'`
- length is measured in characters

Examples:
- input: `ATTACK`
- reference: `SECRET`
- output: `ATTACK`

- input: `ATTACKNOW`
- reference: `KEY`
- runtime error: `RequireSymbolLengthMatch length mismatch: input has 9 characters but reference has 3`

### `RequireBitsLengthMatch`

- `in`: `bits`, `kind: 'sequence'`
- `reference`: `bits`, `kind: 'sequence'`, length-contributing only
- `out`: `bits`, `kind: 'sequence'`
- length is measured in bits, not word groups

Examples:
- input length: `64`
- reference length: `64`
- output: unchanged input bits

- input length: `60`
- reference length: `64`
- runtime error: `RequireBitsLengthMatch length mismatch: input has 60 bits but reference has 64`

## Validation Requirements

Validation must reject:
- missing `in` connection
- missing `reference` connection
- scalar/sequence mismatches
- symbol/bits domain mismatches
- scalar kind on the `reference` input port
- `reference` domain not matching `in`

Runtime must reject:
- any resolved length mismatch between `in` and `reference`

Validation and runtime messages should be phrased in authoring language, for example:
- `RequireBitsLengthMatch expects a sequence reference, not a scalar bit word`
- `RequireSymbolLengthMatch length mismatch: input has 12 characters but reference has 8`

## Inspector / UX Guidance

Recommended inspector language:
- policy: `require exact length match`
- target source: `reference`
- current input length
- current reference length
- current status: `match` or `mismatch`

Recommended preview behavior:
- show unchanged output preview only when both inputs are available and lengths match
- make it obvious that the reference is contributing length only
- when lengths differ, show the mismatch clearly instead of showing a repaired preview
- describe resolved length in domain-native units:
  - character count for symbol sequences
  - bit count for bit sequences

Recommended status wording:
- `Status: lengths match`
- `Status: mismatch; no output produced`

## Python Export

Both modules in this contract are stateless and must be added to `SUPPORTED_PYTHON_EXPORT_DEF_IDS`.

Generated Python should:
- pass the input through unchanged when lengths match
- raise `ValueError` with a clear mismatch message when lengths differ

## Product Boundary

This slice is about strict mismatch rejection only.

It is not about:
- repeat-to-match
- truncate-to-match
- pad-to-match
- hidden mismatch rejection inside downstream operators
- cross-domain reference matching
- automatic recovery from mismatch

## Relationship To Existing Work

This slice extends:
- `EXPLICIT-MISMATCH-POLICIES-V1`
- `MATCH-LENGTH-MISMATCH-HELPERS-V1`
- `REPEAT-TO-MATCH-V1`
- `TRUNCATE-TO-MATCH-V1`
- `PAD-TO-MATCH-V1`

It should feel like the strict companion to the reference-driven repair helpers:
- repeat-to-match
- truncate-to-match
- pad-to-match

With this slice, the mismatch-helper family has both:
- explicit repair helpers
- explicit assertion helpers

## Likely Demo Paths

- `AsciiSequenceInput(message) -> RequireSymbolLengthMatch(reference=key) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(a)`
- `AsciiSequenceInput(key) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(b)`
- `BitSequenceInput(buffer) -> RequireBitsLengthMatch(reference=block) -> BitsSequenceToTicked(wordWidth=8) -> XOR(a)`
- `BitSequenceInput(block) -> BitsSequenceToTicked(wordWidth=8) -> XOR(b)`

## Explicit Non-Goals

Do not include:
- hidden mismatch repair inside `XOR`
- hidden mismatch checks in downstream modules
- cross-domain length matching
- a generic `MatchLength` primitive with a mode dropdown in V1
- automatic fallback to repeat/truncate/pad helpers

## Success Criteria

This contract is successful when:
- users can express fail-fast sequence alignment honestly on the graph
- mismatch errors become more local and more legible than downstream width failures
- MCW has a complete reference-driven mismatch family with both repair and strict assertion paths
