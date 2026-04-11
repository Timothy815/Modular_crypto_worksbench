# REPEAT-TO-MATCH-V1

Last updated: April 10, 2026

Status: Draft

## Purpose

Define a bounded ergonomic follow-on for repeated-key and repeated-mask workflows where one explicit sequence should repeat until it matches the length of another explicit sequence.

The goal is not to hide mismatch repair inside `XOR` or other operator modules.
The goal is to remove manual target-length bookkeeping while keeping the chosen policy visible on the graph.

## Why Now

MCW already has:
- `RepeatSymbolToLength`
- `RepeatBitsToLength`

Those modules are honest, but they still force the user to manually enter the target length.
That creates the wrong kind of explicitness in common workflows:
- Vigenere-style repeated keys
- repeated-key XOR
- repeated visible masks
- short protocol material repeated against a longer reference buffer

Today the user must:
1. count the reference length
2. enter that number by hand
3. keep it in sync manually if the reference changes

That is not additional cryptographic insight.
It is authoring friction.

## Product Goal

Users should be able to express:
- repeat this key to match that message
- repeat this bit mask to match that buffer

by placing a visible helper in the graph.

The graph should still say:
- what is being repeated
- what it is being matched against
- that the policy is repetition rather than truncation or padding

## Core Decision

This slice introduces **reference-driven repetition helpers**.

The policy remains explicit.
Only the target length becomes reference-derived.

This is the key product boundary:
- acceptable: `RepeatSymbolToMatch(reference=message)`
- unacceptable: `XOR` silently repeating the shorter input

## V1 Product Shape

Bounded first-implementation modules:
- `RepeatSymbolToMatch`
- `RepeatBitsToMatch`

Inputs:
- `in`: explicit sequence to repeat
- `reference`: explicit sequence whose length governs the output

Outputs:
- one repeated sequence whose length exactly matches `reference`

No other policy is included in this slice.
This contract is intentionally narrower than a full mismatch-helper family.

## Required Behaviors

1. Repetition must remain graph-visible.
2. Output length must exactly equal the reference sequence length.
3. Ordering must be preserved.
4. Repetition must be cyclic and deterministic.
5. Empty input sequence must be rejected with an explicit validation/runtime error.
6. Empty reference sequence must yield an empty output sequence.
7. Existing operator modules such as `XOR`, `AND`, `OR`, `AddMod`, `Permutation`, and `SBox` must not silently adopt this behavior.
8. The helpers must operate only on already-explicit sequence signals.
9. V1 must be pure, deterministic, and Python-exportable.
10. The helpers must not infer policy from downstream modules.
11. `reference` must be a sequence input, not a scalar tick item.
12. `reference` must share the same signal domain as `in`; cross-domain length derivation is out of scope for V1.

## Domain Rules

### `RepeatSymbolToMatch`

- `in`: `symbol`, `kind: 'sequence'`
- `reference`: `symbol`, `kind: 'sequence'`
- `out`: `symbol`, `kind: 'sequence'`

Example:
- input: `KEY`
- reference: `HELLOWORLD`
- output: `KEYKEYKEYK`

### `RepeatBitsToMatch`

- `in`: `bits`, `kind: 'sequence'`
- `reference`: `bits`, `kind: 'sequence'`
- `out`: `bits`, `kind: 'sequence'`

Example:
- input: `[1,0,1]`
- reference length: `8`
- output: `[1,0,1,1,0,1,1,0]`

## Validation Requirements

Validation must reject:
- missing `in` connection
- missing `reference` connection
- scalar/sequence mismatches
- symbol/bits domain mismatches
- scalar kind on the `reference` input port
- `reference` domain not matching `in`

Runtime must reject:
- empty `in` sequence when `reference` is non-empty

Validation and runtime messages should be phrased in authoring language, for example:
- `RepeatSymbolToMatch requires a non-empty input sequence to repeat`
- `RepeatBitsToMatch expects a sequence reference, not a scalar bit word`

## Inspector / UX Guidance

The module should be easy to read in the inspector.

Recommended inspector language:
- policy: `repeat cyclically`
- output length: `matches reference`
- resolved current length: visible when analysis/runtime data is available

Recommended preview behavior:
- show the repeated result when both inputs are available
- make it obvious that the reference is providing length, not data content
- describe resolved length in domain-native units:
  - character count for symbol sequences
  - bit count for bit sequences

## Product Boundary

This slice is about ergonomic repetition only.

It is not about:
- truncation-to-match
- pad-to-match
- hidden auto-match behavior inside existing modules
- downstream-driven policy inference
- generalized sequence algebra

## Relationship To Existing Work

This slice extends:
- `EXPLICIT-REPETITION-AND-BROADCAST-V1`
- `EXPLICIT-MISMATCH-POLICIES-V1`
- `STRUCTURED-SEQUENCE-SIGNAL-MODEL-V1`

It should feel like the ergonomic companion to:
- `RepeatSymbolToLength`
- `RepeatBitsToLength`

## Likely Demo Paths

- `AsciiSequenceInput(message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR (input a)`
- `AsciiSequenceInput(key) -> RepeatSymbolToMatch(reference=message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR (input b)`
- `XOR -> TickedBitsToSequence`
- `BitSequenceInput(data) -> BitsSequenceToTicked(wordWidth=8) -> XOR (input a)`
- `BitSequenceInput(mask) -> RepeatBitsToMatch(reference=data) -> BitsSequenceToTicked(wordWidth=8) -> XOR (input b)`
- `XOR -> TickedBitsToSequence`

## Explicit Non-Goals

Do not include:
- hidden mismatch repair inside `XOR`
- automatic cross-domain matching
- automatic policy switching based on length
- generic “match somehow” helpers with fuzzy semantics

## Success Criteria

This contract is successful when:
- repeated-key workflows stop requiring manual target-length counting
- the graph still makes the repeat policy visible
- users can build ergonomic repeated-key XOR and Vigenere-style constructions without losing the glass-box model
