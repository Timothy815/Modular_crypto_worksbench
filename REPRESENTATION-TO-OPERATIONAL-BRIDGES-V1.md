# REPRESENTATION-TO-OPERATIONAL-BRIDGES-V1

Last updated: April 10, 2026

Status: Shipped on `main`

## Purpose

Define a bounded bridge-completeness pass for human-readable representations such as ASCII and Hex.

The goal is not to collapse MCW into a bit-only system.
The goal is to ensure that any representation users can honestly author for cryptographic work can also honestly enter computation and return from it through explicit, reversible bridge paths.

## Why Now

MCW now supports:
- `AsciiSequenceInput`
- `AsciiSequenceToTicked`
- `HexSequenceInput`
- `BitsSequenceToTicked`
- explicit repetition, truncation, padding, and collection helpers

But there is still a real product gap:
- users can author ASCII and Hex sequences honestly
- users can tick them honestly
- but they do not yet have a complete explicit path into core operational bit-domain work such as:
  - `XOR`
  - `SBox`
  - `Permutation`
  - block-style transforms

That means a representation can still become a practical dead end even though it is no longer a modeling dead end.

## Product Goal

Users should be able to build honest, composable flows such as:

- `ASCII sequence -> ASCII char per tick -> bits per tick -> XOR`
- `Hex sequence -> hex digit per tick -> bits per tick -> SBox`
- `Bits -> ASCII char per tick -> collected ASCII sequence`
- `Bits -> hex digit per tick -> collected hex sequence`

without:
- hidden coercion inside cryptographic primitives
- manual rewriting of values between modules
- representation-only modules that cannot feed real computation

## Core Decision

Representation formats are allowed and encouraged in MCW, but they must not strand the user.

This slice formalizes the rule that:
- operational computation happens in explicit operational domains such as `bits` or `symbol`
- representation modules must have explicit bridge paths into those domains and back out again where promised
- no bridge may hide inside unrelated cryptographic operators

## What Already Exists

Current shipped work already provides:
- `AsciiSequenceInput`
- `AsciiSequenceToTicked`
- `HexSequenceInput`
- `BitsSequenceToTicked`
- `TickedBitsToSequence`
- `TickedSymbolsToSequence`
- `BitSequenceInput`
- `SymbolSequenceInput`
- `HexSource`
- `AsciiSource`
- `SymbolToBits`
- `BitsToSymbol`

Current remaining gap:
- no explicit scalar-per-tick ASCII-to-bits bridge
- no explicit scalar-per-tick Hex-to-bits bridge
- no explicit bits-to-ASCII-char bridge
- no explicit bits-to-hex-digit bridge
- therefore no honest end-to-end path from authored representation streams into core bit-domain crypto and back

## Bounded V1 Product Shape

Good bounded V1 bridge shapes:
- `AsciiCharToBits`
- `BitsToAsciiChar`
- `HexDigitToBits`
- `BitsToHexDigit`

These are intentionally scalar/ticked companions to the already-shipped sequence authoring modules.

Whole-sequence conversion can continue to use existing sequence paths plus collectors where appropriate.

## Required Behaviors

1. Representation bridges must be explicit graph-visible modules.
2. ASCII and Hex authoring paths must have an honest route into `bits` for operational cryptographic work.
3. If a bridge promises reversibility, it must enforce strict validation rather than silently repairing invalid values.
4. `AsciiCharToBits` must accept a `type: 'symbol', kind: 'scalar'` input of exactly one ASCII character and emit a `type: 'bits', kind: 'scalar'` output of width 8.
5. `BitsToAsciiChar` must accept a `type: 'bits', kind: 'scalar'` input of width 8 and emit a `type: 'symbol', kind: 'scalar'` output of exactly one ASCII character.
6. `HexDigitToBits` must accept exactly one scalar hex symbol and emit one scalar `bits` word of width 4. Its input is `type: 'symbol', kind: 'scalar'`.
7. `BitsToHexDigit` must accept exactly one scalar `bits` word of width 4 and emit one scalar hex symbol. Its output is `type: 'symbol', kind: 'scalar'`.
8. These bridges must reject invalid widths and invalid input characters with explicit errors.
9. Existing cryptographic primitives such as `XOR`, `SBox`, `Permutation`, `AddMod`, and `Rotor` must not silently perform representation conversion internally.
10. Representation bridges must compose cleanly with already-shipped sequence bridges:
   - sequence input
   - sequence to ticked
   - ticked to sequence
11. V1 must preserve the existing multi-domain rule:
   - bit-oriented workflows may remain in `bits`
   - classical symbol workflows may remain in `symbol`
   - this slice must not redefine all crypto as bit-only
12. No representation bridge may terminate in a display-only output if it is presented as an operational generator for downstream use.

## Strict Encoding Rules

### ASCII

- encoding width: exactly 8 bits
- valid scalar symbol length: exactly 1 character
- valid character range in V1: 0-127, matching the current `AsciiSequenceInput` and `AsciiSource` validation range
- extended range `128-255` is deferred until the upstream ASCII authoring path is widened honestly
- V1 is a single-byte character mapping over the currently supported 7-bit source range, not UTF-8 multi-byte text handling
- no UTF-8 multi-byte behavior in V1
- control characters in the supported range are permitted operationally, even if UI display may need escaped or numeric preview treatment later

### Hex

- one hex digit maps to exactly 4 bits
- valid characters: `0-9`, `A-F`, `a-f`
- `HexDigitToBits` must treat lowercase and uppercase hex digits as identical
- output from `BitsToHexDigit` should be uppercase
- no `0x` prefix handling in scalar digit bridges

## Relationship To Existing Bridges

These modules are fixed-standard bridges.

Unlike `SymbolToBits`, which requires a user-authored alphabet mapping, these modules must use fixed standard encodings:
- fixed 8-bit output for the currently supported 7-bit ASCII source range
- standard hex nibble encoding for hex digit bridges

They exist to remove unnecessary manual alphabet setup from common representation-to-bit workflows.

## Operational Output Rule

Representation modules may exist, but if they are intended to participate in cryptographic pipelines they must have an explicit path into operational signals.

That means:
- ASCII- and Hex-oriented sources are acceptable
- but only if they can visibly bridge into `bits` or another real computational domain
- and only if the return path is equally explicit where promised

This rule prevents:
- display-only dead ends
- ambiguous “representation theater”
- modules that can be authored but not computed with

## Product Boundary

This contract should define and ship:
- scalar/ticked representation-to-bits bridges
- scalar/ticked bits-to-representation bridges
- validation and export support
- micro demos that show honest end-to-end use

It should not yet include:
- Base64
- UTF-8
- generalized text encodings
- automatic bridge insertion
- sequence-aware upgrades of unrelated cryptographic operators

## Likely Demo Paths

Good teaching demos after this slice:
- `ASCII Sequence Input -> ASCII Sequence To Ticked -> AsciiCharToBits -> XOR -> TickedBitsToSequence`
- `Hex Sequence Input -> Bits Sequence To Ticked (wordWidth=4) -> XOR -> BitsToHexDigit -> Ticked Symbols To Sequence`
- `Bits -> BitsToAsciiChar -> TickedSymbolsToSequence`

Clarifying note:
- `HexDigitToBits` is a scalar bridge for workflows where a single hex digit arrives as a symbol from a scalar authoring source
- it is not needed in the main `HexSequenceInput` path, which already enters the bit domain through `BitsSequenceToTicked`

## Python Export Requirement

Python export must stay explicit and readable.

Preferred parity rules:
- `AsciiCharToBits` should use `ord()` plus explicit width handling
- `BitsToAsciiChar` should use `chr()` only after width and range checks
- `HexDigitToBits` should use explicit nibble parsing
- `BitsToHexDigit` should emit uppercase hex digits deterministically

All four modules in this contract are stateless and must be included in the ordinary stateless Python export support set rather than the stateful export path.

The exported path should remain visibly equivalent to the graph path rather than hiding conversion logic in opaque helpers.

## Error Guidance

Validation and runtime errors should help the user recover honestly.

Examples:
- width mismatch into `BitsToAsciiChar` should explicitly suggest using a visible width-repair helper such as padding or truncation before the bridge
- invalid hex digit errors should state the accepted character set directly
- invalid multi-character scalar input should say that the bridge expects exactly one scalar representation item per tick

## Explicit Non-Goals

Do not include:
- hidden coercion inside `XOR`, `SBox`, `Permutation`, or other core operators
- a new `ascii` or `hex` engine signal domain
- automatic conversion of all existing sources
- full text-processing semantics
- abandoning symbol-domain classical workflows in favor of bits-only policy

## Success Criteria

This contract is successful when:
- ASCII and Hex are no longer practical dead ends in cryptographic pipelines
- users can honestly route authored representation data into operational bit-domain work and back out again
- the graph makes clear when it is handling:
  - representation
  - operational bits
  - per-tick scalar values
  - whole collected sequences
- MCW remains multi-domain, explicit, and glass-box honest
