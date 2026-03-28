# PYTHON-EXPORT-COVERAGE-MAP-V1

Last updated: March 28, 2026

Status: Recorded from the shipped codebase on `main`

---

## Purpose

Record the first explicit coverage map for MCW Python export after:
- primitive/stateless export
- temporal export
- rotor-family export
- composite export
- iterator export
- structured compatibility tightening

This document is the deliverable for:
- `PYTHON-EXPORT-FULL-COVERAGE-AUDIT-V1.md`

It is an inventory and prioritization artifact.
It is not an implementation contract.

---

## Primitive Registry Baseline

The definitive primitive-module baseline for this audit is:
- [src/engine/modules/index.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/index.ts)

Primitive modules currently present in the registry: `59`

Primitive modules currently export-compatible: `55`

Primitive modules currently unsupported: `4`

---

## Export-Compatible Primitive Modules

Current Python export supports these primitive modules:

- sources / sinks / bridges:
  - `TextInput`
  - `KeyInput`
  - `BitSource`
  - `AsciiSource`
  - `HexSource`
  - `IV`
  - `Nonce`
  - `Salt`
  - `Output`
  - `TextOutput`
  - `BitOutput`
  - `HexOutput`
  - `BaudotOutput`
  - `SymbolToBits`
  - `BitsToAscii`
  - `BitsToBaudot`
  - `BitsToSymbol`
  - `BitsToHex`
  - `HexToAscii`
  - `AsciiToHex`
- stateless operators / transforms:
  - `XOR`
  - `AND`
  - `OR`
  - `NOT`
  - `AddMod`
  - `SubMod`
  - `Modulo`
  - `MulMod`
  - `Majority`
  - `Mux`
  - `Demux`
  - `MultiRouter`
  - `GreaterThan`
  - `Equals`
  - `AtLeast`
  - `Gate`
  - `Permutation`
  - `SymbolPermutation`
  - `SymbolWindow`
  - `BitShifter`
  - `ByteRotate`
  - `ByteSwap`
  - `BitJoin`
  - `BitSplit`
  - `BitPad`
  - `BitUnpad`
  - `BitWindow`
  - `SBox`
- temporal / stateful:
  - `Clock`
  - `Counter`
  - `LFSR`
  - `Rotor`
  - `RotorReverse`
  - `Reflector`

---

## Unsupported Primitive Modules

These primitive modules are still not export-compatible:

1. `BaudotSource`
- classification: `missing-runtime-support`
- reason: export supports Baudot decoding/output, but not a Python-side Baudot source helper
- likely difficulty: low

2. `ModExp`
- classification: `missing-runtime-support`
- reason: no emitted Python helper or parity line yet
- likely difficulty: low to medium

3. `ModInverse`
- classification: `missing-runtime-support`
- reason: no emitted Python helper or parity line yet
- likely difficulty: low to medium

4. `Plugboard`
- classification: `missing-runtime-support`
- reason: historical-machine support is broad, but plugboard permutation behavior is not yet exported
- likely difficulty: medium

---

## Supported Structured Forms

Python export currently supports:

- user-authored depth-1 composites whose internal project graph is export-compatible
- shipped depth-1 composites whose internal project graph is export-compatible
- bounded iterator helpers whose round definition is export-compatible
- keyed iterators with explicit key-bus slicing validation
- temporal iterators when the round definition already falls inside the shipped temporal export helper model

---

## Shipped Structured Definitions: Supported

Shipped starter composites/iterators currently export-compatible:

- composites:
  - `RotorDoubleStepControl`
  - `RotorControlBankRouter`
  - `FeistelRoundComposite`
  - `KeyedByteRoundComposite`
  - `ByteRoundComposite`
  - `HashDigestRoundComposite`
  - `SpongeMixRoundComposite`
  - `SymbolRoundTripComposite`
- iterators:
  - `ByteRoundIterator`
  - `HashDigestRoundIterator`
  - `SpongeMixRoundIterator`
  - `KeyedByteRoundIterator`
  - `FeistelRoundIterator`

---

## Shipped Structured Definitions: Unsupported

These shipped structured definitions remain unsupported:

1. `IteratedByteRoundsComposite`
- classification: `intentional-boundary`
- reason: nested composite body (`ByteRoundComposite` inside a composite) is still outside the shipped depth-1 composite boundary

2. `ToyCompressionHashComposite`
- classification: `intentional-boundary`
- reason: iterator-containing composite; blocked by current structured compatibility boundary

3. `ToySpongeHashComposite`
- classification: `intentional-boundary`
- reason: iterator-containing composite; blocked by current structured compatibility boundary

---

## Structured Boundary Summary

Current structured export boundary is:
- supported:
  - depth-1 composites
  - bounded iterator helpers
  - shipped iterator expansion families
- unsupported:
  - nested composites
  - iterators inside composites
  - iterator round definitions that are themselves iterators
  - generalized recursive structured export

This is now enforced in both:
- compatibility logic in [python.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/codegen/python.ts)
- rejection coverage in [python.test.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/codegen/python.test.ts)

---

## Rotor / Historical-Machine Gap Summary

Current historical-machine export coverage includes:
- `Rotor`
- `Reflector`
- `RotorReverse`
- turnover-driven rotor stepping

Current historical-machine export gaps:
- `Plugboard`
- broader rotor/control-bank authored-machine export beyond the current bounded control slice

Classification:
- `Plugboard` is `missing-runtime-support`
- broader control-bank / authored-bank export is `shared-state-or-recursive-semantics`

---

## Verification Notes

There is strong parity coverage for:
- flat primitive export
- temporal export
- rotor-family export
- composite foundations
- iterator foundations and expansion

But the audit should still note one verification category:

- `needs-verification-only`
  - some export-compatible shipped composites such as `RotorDoubleStepControl` and `RotorControlBankRouter` are structurally supported and should export cleanly, but they do not yet have the same named parity prominence in the test suite as the major iterator/rotor milestones

This is not a blocker.
It is a test-strengthening note.

---

## Gap Priority

The highest-value remaining gaps are:

1. `Plugboard`
- why: completes the remaining obvious Enigma-class vocabulary hole in primitive export
- category: `missing-runtime-support`

2. `BaudotSource`
- why: closes the remaining Baudot source/output asymmetry
- category: `missing-runtime-support`

3. `ModExp` and `ModInverse`
- why: completes the remaining major number-theoretic primitive gap
- category: `missing-runtime-support`

4. nested/recursive structured export
- why: this is the largest remaining structural blocker between “strong export line” and “anything MCW can run should eventually export”
- category: `shared-state-or-recursive-semantics`

5. runtime-library split
- why: productization and long-term code organization
- category: `future-productization`

---

## Most Likely Next Export Frontier

Based on the shipped codebase, the most likely next export frontier is:
- finish the remaining unsupported primitive/runtime helpers first

Recommended immediate implementation order:
1. `Plugboard`
2. `BaudotSource`
3. `ModExp`
4. `ModInverse`

After that, the next true frontier becomes:
- broader recursive structured export

That is the point where the line stops being “remaining helpers” and becomes “new architecture.”
