# PYTHON-EXPORT-EXPANSION-V1

Last updated: March 27, 2026

Status: Shipped on `main`.

---

## Purpose

Define the first careful follow-on to:
- `PYTHON-EXPORT-FOUNDATIONS-V1.md`

This slice expands the supported stateless export subset toward modern cryptographic constructions without reopening stateful execution, composites, or iterators.

---

## Product Goal

Allow Python export to cover a more meaningful modern-construction subset by adding:
- `SBox`
- `AddMod`
- `SubMod`
- `Modulo`

These additions should make exported workspaces more useful for substitution/permutation networks and bounded modular-arithmetic teaching pipelines while preserving the foundations contract.

---

## Core Question

What is the smallest next export expansion that makes Python export materially more useful for modern cryptographic teaching content without changing the stateless primitive-only boundary?

---

## Required Boundary

This slice must:
- remain stateless-only
- remain primitive-only
- remain one-file Python generation
- remain `executeProject()` parity only

This slice must not:
- add `Clock`, `Counter`, `Rotor`, `RotorReverse`, or `LFSR`
- add composites or iterators
- add ticked execution
- add optimizer or runtime architecture changes

---

## Added Supported Modules

This slice adds exactly these primitives to the Python export subset:
- `SBox`
- `AddMod`
- `SubMod`
- `Modulo`

No other module-family expansion is implied by this contract.

---

## Behavior Requirements

### `SBox`

Exported Python must:
- accept the same comma-separated permutation table parameter format
- enforce the same power-of-two table length rule
- enforce the same no-duplicates rule
- apply substitution chunk-by-chunk across the input bitstream
- reject input widths that are not a multiple of the inferred S-Box width

### `AddMod`

Exported Python must:
- require equal-width bit inputs
- interpret both inputs as unsigned words
- compute `(a + b) mod 2^n`
- return a same-width bit word

### `SubMod`

Exported Python must:
- require equal-width bit inputs
- interpret both inputs as unsigned words
- compute `(a - b) mod 2^n`
- return a same-width bit word

### `Modulo`

Exported Python must:
- require a positive integer modulus
- reject modulus values larger than the input word range
- compute `input mod modulus`
- return a same-width bit word

---

## Parity Requirement

For supported workspaces using these added primitives, generated Python must preserve the same sink outputs as:
- `executeProject()`

Parity tests must include:
- one `SBox`-using workspace
- one arithmetic workspace using `AddMod`, `SubMod`, or `Modulo`

---

## Scope

Include:
- Python runtime helpers for `SBox`, `AddMod`, `SubMod`, and `Modulo`
- compatibility support for those definitions
- parity tests for the added coverage
- documentation updates reflecting the expanded subset

Exclude:
- any stateful/ticked export
- any composite/iterator export
- any export UI redesign
- broadening Python export into a package/backend framework

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- Python export now supports `SBox`
- Python export now supports `AddMod`, `SubMod`, and `Modulo`
- parity coverage includes both substitution and modular-arithmetic workspaces

---

## Why This Slice

`PYTHON-EXPORT-FOUNDATIONS-V1` proved that MCW can emit faithful standalone code for a bounded stateless subset.

This follow-on is the right next move because it:
- materially improves export usefulness
- supports modern cryptographic teaching pipelines
- preserves the same safe architectural boundary

It expands value, not scope class.
