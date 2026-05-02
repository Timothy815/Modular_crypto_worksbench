# Arithmetic Expansion V1

Last updated: March 24, 2026

Status: Shipped in `v1.25.0`.

## Purpose

This contract defines the first bounded post-`v1.24.0` arithmetic and framing expansion slice.

This is not a contract for full number-theoretic or public-key foundations.
It is not a contract for modular exponentiation, inverse, or finite-field operations.

The goal is to add three honest missing words to the MCW vocabulary:
- modular multiplication (`MulMod`)
- strict comparison (`GreaterThan`)
- padding removal (`BitUnpad`)

These three primitives close immediate gaps in the shipped arithmetic, control, and framing families without opening a new roadmap phase.

## Why Now

MCW already ships:
- `AddMod`, `SubMod`, `Modulo` for fixed-width word arithmetic
- `Equals`, `AtLeast` for comparison-based control signals
- `BitPad` for padding to a target width
- `BitSplit`, `BitJoin` for framing

What it still lacks:
- **multiplication** — the most basic missing arithmetic operation after add/sub
- **strict comparison** — `GreaterThan` fills the gap between `Equals` (==) and `AtLeast` (>=)
- **unpadding** — `BitPad` has no inverse; students cannot round-trip through a wider transform

## Architectural Decision

For this milestone:
- `MulMod` follows the exact same equal-width binary pattern as `AddMod`/`SubMod`
- `GreaterThan` follows the exact same equal-width comparator pattern as `Equals`/`AtLeast`
- `BitUnpad` follows the exact same single-input framing pattern as `BitPad`
- no new signal types, execution semantics, or validation machinery needed

## Product Boundary

This slice reuses existing MCW surfaces:

1. **Build** — all three appear in the module palette alongside their existing siblings
2. **Analyze** — `GreaterThan` reuses the existing compare transformation view
3. **Guide / Challenge** — one demo, one tutorial, one challenge

## Include

### Primitives

- `MulMod` — multiplies two equal-width bit words modulo 2^n
- `GreaterThan` — emits a 1-bit control signal when a > b (strict)
- `BitUnpad` — strips padding from one side to recover the original width

### Validation

- `MulMod` and `GreaterThan` added to the equal-width binary validation set
- `BitUnpad` validates `originalWidth` as a positive integer
- `GreaterThan` output width inferred as 1 (same as `Equals`/`AtLeast`)
- `MulMod` output width inferred from binary input width (same as `AddMod`)
- `BitUnpad` output width inferred from `originalWidth` param

### Teaching surface

- `Multiply Compare Unpad` demo workspace
- `Multiply Compare Unpad` tutorial (4 steps)
- `Repair the Unpad Width` challenge

## Exclude

- modular exponentiation
- modular inverse
- GCD or extended Euclidean helpers
- finite-field or group-operation families
- division or integer division
- LessThan (derivable from GreaterThan by swapping inputs)

## Success Criteria

This slice is successful when a student can:
- multiply two visible bit words and see the wrapped result
- compare a product against a visible threshold using strict greater-than
- round-trip a signal through pad-then-unpad and verify the output matches
- diagnose a broken unpad width and restore correct framing
