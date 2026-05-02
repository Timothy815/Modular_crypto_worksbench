# BIT-AND-HEX-SEQUENCE-BRIDGES-V1

Last updated: April 9, 2026

Status: Shipped on `main`.

## Purpose

Extend the new structured-sequence foundation into the bit and hex authoring path.

The goal is not to add a third engine signal domain.
The goal is to make whole bit sequences and hex-authored bit sequences explicit, inspectable, and bridgeable into ticked workflows the same way symbol sequences now are.

## Why Now

`STRUCTURED-SEQUENCE-SIGNAL-MODEL-V1` established the first honest path for:
- whole symbol sequence input
- explicit repetition
- explicit sequence-to-ticked bridging

But the bit and hex side still sits in the older ambiguous model:
- `BitSource` can act like a whole bit word or a per-tick bit source depending on execution mode
- `HexSource` is convenient for entering bit values, but it does not yet participate in the explicit sequence model
- `RepeatBitsToLength` is only useful when its input is already the intended whole sequence

That means repeated-bit-mask, repeated-byte-XOR, and hex-authored repeated-key workflows still do not have an equally honest path.

## Product Goal

Users should be able to author:
- a whole bit sequence
- a whole hex-authored bit sequence
- an explicit bridge from that whole sequence to one bit word per tick

without:
- relying on `BitSource` or `HexSource` to silently change semantic kind under ticked execution
- guessing whether a value is one calculation word or a sequence of words
- introducing a separate hidden hex signal domain

## Core Decision

Hex remains an authoring/view convenience over the `bits` domain.

This slice should introduce explicit whole-sequence sources and bridges for bit workflows, but it should not create:
- a new engine signal type for hex
- implicit sequence semantics inside existing scalar bit primitives
- automatic chunking inside unrelated modules

## What Already Exists

Current shipped pieces:
- `STRUCTURED-SEQUENCE-SIGNAL-MODEL-V1`
- `SymbolSequenceInput`
- `SymbolSequenceToTicked`
- `RepeatBitsToLength`
- `BroadcastBits`
- scalar bit-domain primitives such as `XOR`, `SBox`, `Permutation`, `Counter`, and `LFSR`

Current gap:
- there is no explicit whole-sequence bit input companion to `SymbolSequenceInput`
- there is no explicit sequence-to-ticked bridge for bit words
- there is no hex-authored whole-sequence source for bit workflows

## Proposed V1 Product Shape

V1 should stay small and obvious.

Good candidate modules:
- `BitSequenceInput`
- `BitsSequenceToTicked`
- `HexSequenceInput`

Where:
- `BitSequenceInput` authors a whole bit sequence directly
- `HexSequenceInput` authors a whole bit sequence using hex text as the input format
- `BitsSequenceToTicked` emits one fixed-width bit word per tick from a whole bit sequence

## Required Behaviors

1. `BitSequenceInput` must emit a `bits` signal with `kind: 'sequence'`.
2. `HexSequenceInput` must emit a `bits` signal with `kind: 'sequence'`.
3. `HexSequenceInput` must parse hex text deterministically into the bit sequence it emits.
4. `HexSequenceInput` must use the same sanitization and hex-to-bits logic as `HexSource`.
5. `BitsSequenceToTicked` must consume a `bits` signal with `kind: 'sequence'` and emit a `bits` signal with `kind: 'scalar'`.
6. `BitsSequenceToTicked` must require an explicit fixed word width for each emitted tick item.
7. `BitsSequenceToTicked` must preserve ordering.
8. `BitsSequenceToTicked` must define explicit edge behavior for trailing incomplete words:
   - pad
   - truncate
   - error
9. `BitsSequenceToTicked` must default to `error` for remainder handling.
10. Existing scalar bit primitives must remain scalar-only by default.
11. No existing scalar primitive may silently map across a bit sequence as part of this slice.
12. Validation must reject scalar/sequence kind mismatches when kinds are explicit.
13. Validation must reject impossible fixed-width sequence slicing configurations.
14. Hex in this slice is an input format, not an engine-level runtime signal type.

## Important Clarification

This slice must answer one ambiguity explicitly:

For the `bits` domain, a scalar bit value is one calculation word.
A bit sequence in V1 is represented as one flat `number[]` buffer that is later segmented into words only by an explicit bridge such as `BitsSequenceToTicked`.

V1 should avoid fuzzy “sometimes this array is one word, sometimes it is many words” behavior.

## Recommended Bounded V1 Defaults

Safe V1 defaults:
- `BitSequenceInput`
  - direct bit-string authoring
  - example: `101100111001`
- `HexSequenceInput`
  - hex-string authoring
  - example: `A3F9`
- `BitsSequenceToTicked`
  - param: `wordWidth`
  - param: `wrap`
  - `wrap` means the emitted word stream cycles when the workspace runs for more ticks than there are available words
  - param: `remainderMode` = `pad | truncate | error`

This keeps the slice focused on:
- whole sequence
- explicit bridge
- honest ticked consumption

## Product Boundary

This slice should define and ship:
- explicit bit-sequence source(s)
- explicit bit-sequence-to-ticked bridge
- validation and export support for those modules
- primitive micro demos that teach the intended path

It should not yet include:
- general chunking/joining families
- matrix/state containers
- automatic byte-block interpretation across the whole engine
- hidden broadcast or repeat behavior inside bit primitives

## Non-Goals

Do not include:
- a new `hex` signal type
- implicit nibble/byte chunk propagation
- full byte-array abstractions
- automatic conversion of existing `BitSource` / `HexSource` projects
- sequence-aware upgrades of `XOR`, `SBox`, `Permutation`, or `LFSR`

## Success Criteria

This contract is successful when:
- users have an explicit whole-sequence path for bits just like they now do for symbols
- hex-authored repeated-key and repeated-byte workflows can be expressed honestly
- the graph makes clear when it is handling:
  - one bit word
  - a whole bit sequence
  - one emitted word per tick
- MCW gains bit/hex sequence clarity without adding a new hidden domain or automatic coercion
