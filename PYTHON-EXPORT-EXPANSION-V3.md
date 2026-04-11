# PYTHON-EXPORT-EXPANSION-V3

Last updated: March 27, 2026

Status: Shipped on `main`.

---

## Purpose

Define the next careful follow-on to:
- `PYTHON-EXPORT-FOUNDATIONS-V1.md`
- `PYTHON-EXPORT-EXPANSION-V1.md`
- `PYTHON-EXPORT-EXPANSION-V2.md`

This slice expands Python export across another curated stateless subset without reopening stateful execution, composites, iterators, or runtime redesign.

---

## Product Goal

Allow exported Python to cover a stronger protocol-material and symbol-structure subset by adding:
- `KeyInput`
- `IV`
- `Nonce`
- `Salt`
- `SymbolPermutation`
- `SymbolWindow`

These additions should make exported workspaces more useful for explicit key/seed material and symbolic framing/reordering pipelines.

---

## Core Question

What is the smallest next export expansion that materially broadens stateless symbolic and protocol-input coverage without changing the runtime class proven by the foundations slice?

---

## Required Boundary

This slice must:
- remain stateless-only
- remain primitive-only
- remain one-file Python generation
- remain `executeProject()` parity only

This slice must not:
- add `Clock`, `Counter`, `Rotor`, `RotorReverse`, `Reflector`, `Plugboard`, or `LFSR`
- add composites or iterators
- add ticked execution
- add runtime architecture changes beyond the helper functions needed for these primitives

---

## Added Supported Modules

This slice adds exactly these primitives to the Python export subset:
- `KeyInput`
- `IV`
- `Nonce`
- `Salt`
- `SymbolPermutation`
- `SymbolWindow`

No other export expansion is implied by this contract.

---

## Behavior Requirements

### `KeyInput`

Exported Python must:
- behave exactly like the existing symbol-source model
- emit the configured key symbol/string as a symbol signal

### `IV`, `Nonce`, and `Salt`

Exported Python must:
- accept the same `value` and `width` params as MCW
- validate hexadecimal input exactly as the in-app protocol-material sources do
- require widths to be positive multiples of 4
- reject values that exceed the declared width
- right-pad shorter values with zeros to the declared bit width

### `SymbolPermutation`

Exported Python must:
- accept the same comma-separated permutation order format
- require a bijective ordering
- require order length to match the input symbol length
- emit the reordered symbol string exactly as MCW does

### `SymbolWindow`

Exported Python must:
- accept the same `start` and `width` params as MCW
- require a non-negative start and positive width
- reject ranges that exceed the input symbol length
- emit the selected contiguous symbol window exactly as MCW does

---

## Parity Requirement

For supported workspaces using these added primitives, generated Python must preserve the same sink outputs as:
- `executeProject()`

Parity tests must include:
- one protocol-material workspace covering `KeyInput` plus at least one of `IV` / `Nonce` / `Salt`
- one symbol-structure workspace covering `SymbolPermutation` and `SymbolWindow`

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
- any Baudot or teleprinter export work in this slice

---

## Why This Slice

The export line already covers a meaningful stateless bit-domain subset.

This follow-on is the right next move because it:
- broadens export utility into protocol-material and symbol-domain teaching content
- supports more of MCW’s visible “why this input exists” vocabulary
- preserves the same safe runtime class

It expands expressive coverage without changing export architecture.

---

## Exit Condition

This slice is complete when:
- generated Python supports the six added primitives above
- parity tests cover both a protocol-material workspace and a symbol-structure workspace
- the export boundary remains stateless-only and primitive-only

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- Python export now supports `KeyInput`, `IV`, `Nonce`, and `Salt`
- Python export now supports `SymbolPermutation` and `SymbolWindow`
- parity coverage now includes both protocol-material and symbol-structure workspaces
