# PYTHON-EXPORT-PLUGBOARD-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the next Python export implementation slice after the shipped full coverage audit.

This contract is the follow-on to:
- `PYTHON-EXPORT-COVERAGE-MAP-V1.md`

The audit identified the remaining primitive/runtime gaps as:
- `BaudotSource`
- `ModExp`
- `ModInverse`
- `Plugboard`

The first recommended implementation target is:
- `Plugboard`

---

## Product Goal

Add bounded `Plugboard` export support so Python export can represent the remaining obvious Enigma-class primitive gap in the current historical-machine line.

This is **plugboard export**, not broader rotor-bank or control-bank expansion.

---

## Strategic Position

Python export already supports:
- `Rotor`
- `Reflector`
- `RotorReverse`
- turnover-driven rotor stepping

Without `Plugboard`, the historical-machine export story is still missing one obvious visible primitive.

This slice should:
- close that primitive gap
- preserve the current one-file export architecture
- keep generated Python readable and explicit

It should not widen into:
- broader control-bank export
- recursive structured export
- runtime-library splitting

---

## Core Question

What is the smallest `Plugboard` export slice that preserves parity with the existing engine implementation and completes the remaining obvious Enigma-class primitive hole?

---

## Required V1 Shape

This slice must:
- add explicit Python runtime helper support for `Plugboard`
- mirror [plugboard.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/plugboard.ts) directly rather than introducing a cleaned-up reinterpretation
- preserve reciprocal wiring validation
- preserve uppercase alphabet validation
- preserve readable generated wiring embedding
- preserve one-file export architecture

It must not:
- change current rotor export semantics
- add new structured export support
- broaden compatibility outside `Plugboard`

---

## Execution Parity Rule

Generated Python must mirror MCW behavior exactly for:
- `Plugboard` wiring validation
- reciprocal pair enforcement
- passthrough identity mappings
- symbol lookup against the uppercase alphabet
- invalid symbol rejection

The Python helper should stay structurally parallel to the engine logic:
- parse/validate wiring
- normalize the incoming symbol
- map through the reciprocal wiring array

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

The generated runtime should now include:
- one explicit `plugboard_eval(signal, wiring)` helper
- one explicit `_parse_plugboard_wiring(wiring_value)` helper

`Plugboard` wiring should be embedded in generated Python as:
- an explicit 26-element list of single-character uppercase strings

---

## Compatibility Rule

This slice should:
- allow `Plugboard` in otherwise export-compatible workspaces
- continue to reject unsupported structured recursion and other existing unsupported cases unchanged

This slice must not loosen any current structured export boundary.

---

## Parity Tests

This slice must add parity tests for at least:
- one stateless `Plugboard` workspace with visible reciprocal swaps
- one historical-machine path using `Plugboard` in combination with already-supported rotor-family export

Tests should:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

As with the existing export suite, they should skip gracefully if `python3` is unavailable.

---

## Explicit V1 Exclusions

This slice still excludes:
- recursive structured export
- broader rotor/control-bank expansion
- runtime-library/package splitting

---

## Success Condition

This slice is successful when:
- `Plugboard` leaves the audit gap list
- exported Python can represent the obvious remaining Enigma-class primitive hole
- parity holds for both direct `Plugboard` use and a bounded historical-machine path that includes it
