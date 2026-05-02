# EXPLICIT-MISMATCH-POLICIES-V1

Last updated: April 10, 2026

Status: Shipped on `main`

## Purpose

Define a bounded family of explicit mismatch-policy helpers beyond repetition.

The goal is to let users resolve length and grouping mismatches honestly in the graph without hidden coercion and without overloading unrelated primitives.

## Why Now

MCW now has explicit repetition and broadcast helpers, which address only part of the mismatch problem.

Real constructions also need other visible policies, such as:
- truncate this sequence to a target length
- pad this sequence to a target length
- reject uneven input unless explicitly repaired
- align one structure against another with a named policy

Without these helpers, users are forced into:
- manual data rewriting
- brittle graph workarounds
- hidden assumptions about how modules should behave on uneven inputs

## Product Goal

Users should be able to express:
- “repeat this key until it matches the target length”
- “truncate this stream to the first N elements”
- “pad this sequence to N with a visible pad rule”
- “reject this mismatch unless I explicitly resolve it”

The graph should make the chosen policy visible.

## Core Decision

Mismatch handling remains explicit and modular.

V1 expands the policy family beyond repetition, but it does **not** allow core arithmetic or cryptographic modules to silently repair mismatches internally.

## V1 Product Shape

Good bounded V1 shapes:
- `TruncateSymbolSequence`
- `TruncateBitsSequence`
- `PadSymbolSequence`
- `PadBitsSequence`

If target length can be parameterized honestly, that is sufficient for V1.
Reference-length-driven versions can come later if needed.

## Required Behaviors

1. Every mismatch policy must be graph-visible.
2. Existing modules such as `XOR`, `SBox`, `AddMod`, `Permutation`, and `Rotor` must not silently adopt these policies.
3. Truncation must preserve ordering and define which side is preserved:
   - left
   - right
4. Padding must preserve ordering and define:
   - pad side
   - pad value / pad symbol
5. Policy modules must define their target length explicitly.
6. Validation must reject impossible configurations:
   - negative lengths
   - invalid pad values
   - nonsensical domain combinations
7. V1 must remain deterministic and exportable.
8. Policy modules must work on already-explicit sequence signals, not on ambiguous tick-sliceable sources.

## Relationship To Existing Work

This slice extends:
- `EXPLICIT-REPETITION-AND-BROADCAST-V1`
- `STRUCTURED-SEQUENCE-SIGNAL-MODEL-V1`

It should feel like the next family member in the same product language:
- repeat
- broadcast
- truncate
- pad
- error unless explicitly repaired

## Product Boundary

This slice is about visible repair policies.

It is not about:
- hidden coercion
- automatic policy negotiation between connected modules
- generalized sequence algebra
- block-aware automatic mapping

## Design Guidance

Keep the modules small and literal.

Examples:

- `TruncateSymbolSequence`
  - input: `HELLOWORLD`
  - target length: `5`
  - side: `right`
  - output: `HELLO`

- `PadBitsSequence`
  - input: `[1,0,1,1]`
  - target length: `8`
  - side: `left`
  - pad bit: `0`
  - output: `[0,0,0,0,1,0,1,1]`

## Explicit Non-Goals

Do not include:
- hidden mismatch repair inside existing modules
- fuzzy “best effort” matching
- sequence-aware broadcasting beyond the already-shipped bounded helpers
- automatic padding policies based on downstream expectations

## Likely Follow-On Contracts

This slice should later support:
- cleaner keyed XOR and Vigenere workflows
- explicit block framing repair before chunking
- visible protocol framing and record alignment

## Success Criteria

This contract is successful when:
- users can resolve common non-repeat mismatches explicitly in the graph
- sequence workflows become less brittle and less manual
- MCW remains honest about what policy made two incompatible structures line up
