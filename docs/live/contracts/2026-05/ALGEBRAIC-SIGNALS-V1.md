# Algebraic Signals V1

Last updated: May 1, 2026
Status: Shipped

## Purpose

Define the first bounded expansion of MCW's signal vocabulary beyond:

- `bits`
- `symbol`

so future algebraic and elliptic-curve work can be represented honestly instead of being hidden inside anonymous bitstrings.

This slice follows:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Arithmetic Exactness Audit — 2026-05-01](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ARITHMETIC-EXACTNESS-AUDIT-2026-05-01.md)
- the shipped exact arithmetic substrate work

It is not a field-arithmetic contract.
It is not an ECC point-mechanics contract.

It is the signal-model step needed before those can be product-honest.

## Problem

MCW can now compute current arithmetic primitives through an exact internal integer substrate.

But the product still exposes only two visible signal domains:

- `bits`
- `symbol`

That is enough for:

- classical ciphers
- modern bit-level structures
- toy number-theory expressed through bit words

It is not enough for future algebraic cryptography if MCW wants to stay honest.

Without richer signal domains, future work would be pushed toward:

- hiding integers inside bitstrings
- hiding points inside bitstrings
- relying on invisible semantic assumptions

That would violate MCW's core standard that important transformations remain visible and typed.

## Goal

Introduce the first bounded algebraic signal vocabulary so that future arithmetic, field, and ECC work can display and inspect the right kinds of values directly.

The result should be:

- new signal domains where they materially improve honesty
- explicit bridges between domains
- no hidden coercion
- preserved live-machine feel
- preserved engine/UI separation

## Scope

V1 is intentionally narrow.

In scope:

- decide and add the first new algebraic signal domain
- define how that domain appears in engine types
- define how that domain is rendered in the inspector and sink-oriented views
- define how explicit bridges to and from `bits` work where needed
- update validation/type checking for the new domain
- add a minimal teaching/demo path proving the domain is usable

Out of scope:

- prime-field arithmetic itself
- elliptic-curve point mechanics
- protocol-level ECC composites
- a whole family of algebraic domains at once
- black-box convenience adapters

## Recommended V1 Shape

V1 should start with exactly one new visible algebraic domain:

- `integer`

Do not start with both `integer` and `ec-point` in the same slice.

Why:

- `integer` is the immediate honest representation needed after exact arithmetic substrate work
- it is simpler to reason about and validate
- it provides a cleaner bridge into future field arithmetic
- it lets MCW learn how to add a new signal domain without taking on point semantics too early

`ec-point` should be deferred to a later slice after integer-domain ergonomics and explicit bridges are proven.

## Required Product Behavior

1. A student must be able to tell when a value is an `integer` and when it is a `bits` signal.
2. Conversion between `bits` and `integer` must be explicit in the graph.
3. Existing `bits`-domain workflows must keep working unchanged unless a user explicitly introduces the new domain.
4. New integer-domain values must be inspectable without turning into opaque JSON blobs or raw engine internals.
5. The product must not silently auto-convert between `integer` and `bits`.

## Domain Semantics

### `integer`

`integer` in V1 should mean:

- an exact non-negative integer value in the supported substrate regime

It should not mean:

- arbitrary signed math
- rationals
- field elements with hidden modulus semantics
- points

Field semantics belong later.

V1 integer semantics should stay deliberately plain.

At the engine/UI boundary in V1, integer-domain signals should preserve exactness without exposing raw engine `bigint` objects as the visible product type.

That means V1 must choose one explicit representation strategy for integer-domain signal payloads that is:

- exact
- serializable
- UI-readable

The representation must not silently fall back to unsafe JavaScript `number` when the value exceeds safe-integer range.

## Engine Requirements

### 1. Extend signal typing

The engine signal union must gain a bounded new domain for exact non-negative integers.

That domain should:

- preserve exactness
- remain serializable through the chosen engine/UI boundary strategy
- not leak hidden modulus or curve assumptions

### 2. Add explicit bridges

At minimum, V1 should include explicit modules for:

- `BitsToInteger`
- `IntegerToBits`

These modules must make the representation change visible in the graph.

They should not be folded invisibly into arithmetic primitives.

`IntegerToBits` must reject explicitly when the integer value does not fit in the requested target width.

V1 should not:

- truncate silently
- wrap silently
- infer a larger width automatically

### 3. Keep arithmetic intent explicit

Current arithmetic modules may or may not continue to expose `bits` I/O in V1.

The contract does not require immediate migration of all arithmetic modules to `integer` I/O.

But V1 must make it possible for future arithmetic families to operate on an honest visible integer domain instead of bitstrings-only semantics.

### 4. Validation and exactness

The new domain must respect the supported exactness regime already established by the integer substrate work.

If an integer-domain value exceeds the supported exact regime, MCW must reject it explicitly rather than degrade silently.

## UI Requirements

### 1. Inspector readability

Selected integer-domain values must render clearly in the inspector.

At minimum, V1 should support:

- decimal display always
- hex as an explicit secondary toggle or alternate view

The representation should be legible and intentionally formatted, not an engine dump.

### 2. Sink honesty

If integer values are shown at sinks or in output-oriented panels, the UI must say what domain is being shown.

Do not let an integer value masquerade as a bitstream or text output.

V1 should commit to a concrete visual mechanism such as:

- a domain chip
- a type badge

so the student can tell at a glance that the shown value is `integer` rather than `bits` or `symbol`.

### 3. Live-machine feel

This slice must still satisfy the experiential standard:

- changing an input and rerunning should make integer-domain behavior visibly update
- the student should feel like they are inspecting a live machine, not editing an abstract theorem

## Teaching Requirements

V1 should include one bounded demonstration path proving that the new domain teaches something useful.

V1 should commit to:

- a visible `bits -> integer -> bits` round-trip

This is the right teaching path for the vocabulary slice because it proves:

- the bridges work
- the representation change is visible
- the new domain is not just hidden engine machinery

without yet smuggling arithmetic or field semantics into the same slice.

The goal is not breadth.
The goal is to prove that the new domain improves honesty and understanding.

## Non-Goals

V1 should not:

- add `ec-point` yet
- add finite-field arithmetic yet
- migrate the whole product to algebraic signals at once
- hide bridges inside existing modules
- introduce implicit domain inference

This is a bounded vocabulary slice, not an algebraic overhaul.

## Success Criteria

V1 is successful if:

1. MCW has a first honest visible algebraic signal domain beyond `bits` and `symbol`.
2. Conversion between `bits` and `integer` is explicit and inspectable.
3. The new domain is readable in the inspector and does not feel like raw internals leaking into UI.
4. Existing non-algebraic workflows remain stable.
5. The product is in a materially stronger position for prime-field arithmetic without yet pretending to support it.

## Likely Next Step

If this slice succeeds, the correct follow-on is:

- `PRIME-FIELD-ARITHMETIC-V1`

Only after that should MCW attempt:

- `ELLIPTIC-CURVE-POINT-MECHANICS-V1`

The sequence should remain:

1. exact arithmetic substrate
2. algebraic signals
3. prime-field arithmetic
4. point mechanics
5. visible ECDH

That ordering is part of the product discipline.
