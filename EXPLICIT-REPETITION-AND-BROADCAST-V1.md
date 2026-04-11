# EXPLICIT-REPETITION-AND-BROADCAST-V1

Last updated: April 8, 2026

Status: Shipped on `main`.

## Purpose

Define a bounded explicit-alignment slice for handling short-key / long-input style constructions without hidden coercion.

The goal is not to make mismatch handling automatic.
The goal is to make repetition, cycling, and broadcast behavior visible, authorable, and reusable inside the graph.

## Why Now

MCW is strongest when important behavior is explicit:
- no hidden conversions
- no silent scheduling
- no invisible structure

But some current authoring friction is the wrong kind of explicitness.

Examples:
- Vigenere-style repeated keys
- repeated-byte XOR against a longer bitstring
- short masks or pads applied across longer data
- finite sequences that need to wrap visibly over a longer run

Requiring the user to manually type or unroll repeated material over and over is honest, but not good product behavior.

The missing capability is:
- explicit repetition
- explicit cycling
- explicit broadcast

without baking those policies invisibly into unrelated cipher or arithmetic modules.

## Product Goal

A user should be able to express:
- “repeat this key until it matches the target length”
- “broadcast this byte across a longer bitstring”
- “cycle this short sequence visibly”

by placing explicit helper modules in the graph.

The result should:
- preserve MCW’s glass-box model
- reduce repetitive manual authoring
- avoid hidden mismatch policies inside existing modules

## Core Decision

This slice introduces explicit **repetition / cycling / broadcast** helper modules.

It does **not** introduce:
- silent length coercion inside existing modules
- automatic mismatch repair by the engine
- special hidden behavior inside `XOR`, Vigenere-like composites, or other existing structures

## Product Shape

The V1 family should stay small and obvious.

Good candidate shapes are:
- `RepeatBitsToLength`
- `RepeatSymbolToLength`
- `BroadcastBits`

If a more generalized helper can be expressed honestly without making validation or semantics fuzzy, that is acceptable.
But V1 should prefer clarity over abstraction.

## Scope

This contract is limited to:
- explicit helper modules for repetition / cycling / broadcast
- validation rules for those modules
- analysis / display behavior needed to keep the modules understandable
- unit tests for correct alignment behavior

This slice may include:
- modules that take a short source plus a target length or reference length
- modules that repeat or broadcast visibly
- bounded support for both symbol-domain and bit-domain cases where the signal model already makes sense

## Required Behaviors

1. Repetition and broadcast behavior must be explicit in the graph.
2. Existing modules must not silently adopt new mismatch behavior.
3. The helper modules must have deterministic, inspectable semantics.
4. A repeated or broadcast signal must still be an ordinary MCW signal, not a hidden iterator side effect.
5. V1 must clearly define how the target length is obtained:
   - directly from a numeric parameter
   - or from a reference input/module in a bounded, explicit way
6. Validation must reject impossible or ambiguous configurations.
7. The modules must remain pure and engine-local like other primitives.
8. V1 must not depend on implicit auto-wrapping in unrelated execution paths.
9. The modules should be understandable enough to support classical repeated-key constructions and repeated-byte XOR without special-case teaching logic.

## Important Product Boundary

This slice is about **visible mismatch policy**.

It is not about:
- full sequence-processing semantics across every module
- stream-processing redesign
- hidden key scheduling
- a new iterator model

The graph must still tell the truth:
- “this key is being repeated”
- “this byte is being broadcast”
- “this sequence is cycling”

## Design Guidance

V1 should favor modules that are easy to explain:

- `RepeatBitsToLength`
  - repeats a bit sequence until a target bit length is reached
  - truncates only according to explicit documented behavior

- `RepeatSymbolToLength`
  - repeats a symbol sequence until a target symbol length is reached

- `BroadcastBits`
  - expands a single bit pattern or fixed-width word across a larger target width/length

The exact parameterization can vary, but the behavior must be:
- explicit
- bounded
- easy to verify by eye in Analyze

## Explicit Non-Goals

Do not include:
- hidden auto-repeat behavior inside `XOR` or other primitives
- generic “make these lengths match somehow” engine magic
- full stream-language redesign
- iterator-internal scheduling changes
- fuzzy mismatch heuristics
- automatic cryptographic macro behavior

## Success Criteria

This contract is successful when:
- Vigenere-style repeated-key behavior can be expressed without manually unrolling the key
- repeated-byte XOR can be expressed honestly and conveniently
- the graph still makes repetition/broadcast behavior visible
- MCW reduces repetitive authoring without sacrificing its glass-box discipline
