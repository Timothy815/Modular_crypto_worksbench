# PYTHON-EXPORT-EXPANSION-V2

Last updated: March 27, 2026

Status: Implemented on `main`

---

## Purpose

Define the next careful follow-on to:
- `PYTHON-EXPORT-FOUNDATIONS-V1.md`
- `PYTHON-EXPORT-EXPANSION-V1.md`

This slice expands Python export across another curated stateless subset without reopening stateful execution, composites, iterators, or broader runtime redesign.

---

## Product Goal

Allow exported Python to cover a stronger stateless control / arithmetic / byte-structure subset by adding:
- `Majority`
- `GreaterThan`
- `MulMod`
- `ByteRotate`
- `ByteSwap`
- `BitUnpad`

These additions should make exported workspaces more useful for threshold logic, bounded comparison and multiplication, and byte-oriented framing/transformation pipelines.

---

## Core Question

What is the smallest next export expansion that materially broadens practical stateless workspace coverage without changing the runtime class proven by the foundations slice?

---

## Required Boundary

This slice must:
- remain stateless-only
- remain primitive-only
- remain one-file Python generation
- remain `executeProject()` parity only

This slice must not:
- add `Clock`, `Counter`, `Rotor`, `RotorReverse`, `Reflector`, or `LFSR`
- add composites or iterators
- add ticked execution
- add runtime architecture changes beyond the helper functions needed for these primitives

---

## Added Supported Modules

This slice adds exactly these primitives to the Python export subset:
- `Majority`
- `GreaterThan`
- `MulMod`
- `ByteRotate`
- `ByteSwap`
- `BitUnpad`

No other export expansion is implied by this contract.

---

## Behavior Requirements

### `Majority`

Exported Python must:
- require 1-bit inputs on `a`, `b`, and `c`
- emit `1` when at least two inputs are active
- emit `0` otherwise

### `GreaterThan`

Exported Python must:
- require equal-width bit inputs
- interpret both inputs as unsigned words
- emit a 1-bit control word reflecting `a > b`

### `MulMod`

Exported Python must:
- require equal-width bit inputs
- interpret both inputs as unsigned words
- compute `(a * b) mod 2^n`
- return a same-width bit word

### `ByteRotate`

Exported Python must:
- require an input width divisible by 8
- support the same `amount` and `direction` params as MCW
- rotate by whole-byte groups only
- preserve input width exactly

### `ByteSwap`

Exported Python must:
- require an input width divisible by 8
- reverse the byte order of the input word
- preserve input width exactly

### `BitUnpad`

Exported Python must:
- support the same `originalWidth` and `side` params as MCW
- return the original input unchanged when it is already at or below `originalWidth`
- otherwise strip bits from the configured side to reach the original width

---

## Parity Requirement

For supported workspaces using these added primitives, generated Python must preserve the same sink outputs as:
- `executeProject()`

Parity tests must include:
- one control/arithmetic workspace covering `Majority`, `GreaterThan`, and `MulMod`
- one byte-structure workspace covering `ByteRotate`, `ByteSwap`, and `BitUnpad`

---

## Scope

Include:
- Python runtime helpers for the added primitives
- compatibility support for those definitions
- parity tests for the expanded coverage
- documentation updates reflecting the expanded subset

Exclude:
- any stateful/ticked export
- any composite/iterator export
- any export UI redesign
- broader backend/package/exporter architecture work

---

## Why This Slice

`PYTHON-EXPORT-FOUNDATIONS-V1` proved the runtime shape.
`PYTHON-EXPORT-EXPANSION-V1` proved careful stateless growth toward modern constructions.

This follow-on is the right next move because it:
- broadens export utility across another real family of teaching and authored-machine workspaces
- keeps parity pressure on the existing one-file runtime
- still avoids the complexity jump into stateful/ticked export

It deepens the export line without changing its class.

---

## Exit Condition

This slice is complete when:
- generated Python supports the six added primitives above
- parity tests cover both arithmetic/control and byte-structure workspaces
- the export boundary remains stateless-only and primitive-only

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- Python export now supports `Majority`, `GreaterThan`, and `MulMod`
- Python export now supports `ByteRotate`, `ByteSwap`, and `BitUnpad`
- parity coverage now includes both control/arithmetic and byte-structure workspaces
