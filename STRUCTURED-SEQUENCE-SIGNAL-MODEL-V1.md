# STRUCTURED-SEQUENCE-SIGNAL-MODEL-V1

Last updated: April 9, 2026

Status: Shipped on `main`

## Purpose

Define a bounded architectural transition for representing and processing structured sequences in MCW without breaking the engine's glass-box discipline.

The goal is not to turn MCW into a general-purpose dataflow language.
The goal is to make repeated-key, chunked, block-based, and stream-aligned cryptographic constructions expressible without relying on ambiguous scalar-versus-sequence behavior.

## Why Now

MCW currently has a real mismatch between:
- whole-signal execution
- tick-sliced execution
- author expectations for repeated-key and chunked workflows

Examples:
- `RepeatSymbolToLength` is intended to support Vigenere-style repeated keys
- `RepeatBitsToLength` is intended to support repeated-bit masks and repeated-key XOR

But the current source model allows the same module to behave as:
- a whole sequence in unticked execution
- one element per tick in ticked execution

That means a repeated key like `KEY` can degrade into:
- `KEYKEYKEYK` in one context
- `KKKKKKKKKK` in another

The problem is not just the repeat modules.
The problem is that MCW does not yet have a first-class, explicit model for:
- scalar element
- ordered sequence
- chunked/block grouping

## What Already Exists

MCW already supports:
- scalar symbol signals: `type: 'symbol'; value: string`
- scalar bit signals: `type: 'bits'; value: number[]`
- tick-sliceable sources that emit one element per tick:
  - `TextInput`
  - `BitSource`
  - `AsciiSource`
  - `HexSource`
  - `BaudotSource`
- explicit repetition/broadcast helpers:
  - `RepeatSymbolToLength`
  - `RepeatBitsToLength`
  - `BroadcastBits`

These helpers are correct only when their input is already the intended whole sequence.
They do not solve the deeper ambiguity of how MCW should represent and pass structured sequences through the graph.

## Product Goal

Users should be able to build constructions such as:
- repeated-key classical ciphers
- repeated-byte XOR
- block chunking and rejoining
- explicit substitution-permutation pipelines over grouped data

without:
- manually unrolling sequences
- guessing whether a source is currently acting as a whole sequence or a per-tick scalar
- relying on hidden mismatch handling inside unrelated modules

## Core Decision

This slice defines the structured sequence model first.

It does **not** immediately redesign every module.
It establishes the rules that later sequence-aware primitives and bridges must follow.

## Required Questions This Contract Must Answer

1. What is the difference between:
   - a scalar symbol
   - a symbol sequence
   - a scalar bit word
   - a bit sequence
2. How are sequences represented in engine types?
3. How do ports declare whether they expect:
   - scalar
   - sequence
   - chunked/grouped sequence
4. How do tick-sliceable sources interact with sequence signals?
5. What explicit modules are required to convert between:
   - whole sequence
   - per-tick element stream
   - chunked blocks
6. What must remain explicit in the graph instead of hidden in the executor?

## Proposed V1 Direction

V1 should establish a bounded distinction between:
- scalar signals
- sequence signals

without immediately introducing arbitrary nested containers or matrix/state abstractions.

The likely product-safe progression is:

1. Define first-class sequence-capable signal variants
2. Define bounded port typing rules for scalar vs sequence expectations
3. Define explicit adapters between:
   - whole sequence
   - ticked element stream
   Candidate bridge shapes:
   - `SequenceToTicked`
   - `TickedToSequence`
4. Keep chunking/block grouping as a follow-on contract that builds on the sequence model

## Required Behaviors

1. MCW must stop depending on ambiguous “string means maybe one symbol, maybe a sequence” behavior in sequence-sensitive workflows.
2. The sequence model must preserve ordering explicitly.
3. Tick-driven execution must not silently reinterpret a whole sequence as a different semantic kind of signal without an explicit adapter.
4. Sequence-aware behavior must remain explicit in the graph.
5. Existing scalar-only cryptographic primitives must not silently accept new sequence semantics unless explicitly upgraded by later contracts.
6. Validation must be able to reject scalar/sequence mismatches at port boundaries.
7. The model must remain engine-local and deterministic.
8. V1 must not require a full rewrite of every existing primitive.
9. Every `PortDef` must declare or inherit a kind expectation:
   - `scalar`
   - `sequence`
   Existing ports may default to `scalar` for backward compatibility, but connecting mismatched kinds without an explicit adapter must become a validation error.
10. Scalar invariants must be explicit:
   - a scalar symbol is exactly one symbol
   - a scalar bit value is one calculation word, not an implicitly iterable sequence
11. Unticked execution must treat sequence values as atomic for modules that are not explicitly sequence-aware.
12. Existing primitives such as `XOR`, `AddMod`, `SBox`, `Rotor`, and `Permutation` must not implicitly distribute or map across sequences as part of this contract.

## Product Boundary

This contract is foundational, but it must remain bounded.

It should define:
- the data model
- the port expectations
- the explicit adaptation rules

It should **not** yet implement:
- general arrays
- arbitrary matrices
- iterator internal state redesign
- automatic chunk propagation across the whole engine
- hidden scalar/sequence coercion

## Implementation Constraints

Any later implementation based on this contract must:
- preserve the engine's zero-dependency purity
- avoid hidden coercion inside `XOR`, `AddMod`, `SBox`, or other unrelated primitives
- avoid “sometimes scalar, sometimes sequence” behavior with no visible adapter
- be incremental enough that existing projects remain understandable and upgradeable

## Explicit Defaulting Rule

Existing primitives remain scalar by default.

That means later sequence support must be opt-in and explicit.
This contract should move ambiguity into the type system first rather than spreading new behavior across the registry all at once.

## Likely Follow-On Contracts

This contract should enable, in order:
- `SEQUENCE-ADAPTERS-V1`
- `BLOCK-CHUNKING-PRIMITIVES-V1`
- `SEQUENCE-AWARE-BRIDGE-MODULES-V1`
- potentially later:
  - `ARRAY-AND-STATE-CONTAINER-V1`

## Explicit Non-Goals

Do not include:
- hidden automatic mismatch repair
- free-form container semantics
- immediate upgrades of every primitive to sequence-aware operation
- matrix/state abstractions in V1
- a full iterator redesign

## Success Criteria

This contract is successful when:
- the source of the Vigenere/repeated-key mismatch problem is explicitly resolved at the model level
- later repetition/chunking/bridge slices have a clear, non-ambiguous foundation
- MCW remains honest about when it is processing:
  - one element
  - an ordered sequence
  - a ticked stream of elements
