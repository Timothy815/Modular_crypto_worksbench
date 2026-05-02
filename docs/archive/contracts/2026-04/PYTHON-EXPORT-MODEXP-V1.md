# PYTHON-EXPORT-MODEXP-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Define the next Python export implementation slice after the shipped `BaudotSource` export.

This contract is the follow-on to:
- `PYTHON-EXPORT-COVERAGE-MAP-V1.md`

After the shipped `BaudotSource` slice, the remaining primitive/runtime gaps are:
- `ModExp`
- `ModInverse`

The next recommended implementation target is:
- `ModExp`

---

## Product Goal

Add bounded `ModExp` export support so Python export closes the remaining modular-exponentiation primitive gap in the current number-theoretic vocabulary line.

This is **ModExp export**, not a broader number-theory redesign.

---

## Required V1 Shape

This slice must:
- add explicit Python runtime helper support for `ModExp`
- mirror [mod-exp.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mod-exp.ts) directly
- preserve modulus validation
- preserve word-width preservation and empty-word behavior
- preserve repeated-squaring semantics
- preserve one-file export architecture

It must not:
- redesign number-theory export broadly
- change existing arithmetic export semantics
- broaden compatibility outside `ModExp`

---

## Execution Parity Rule

Generated Python must mirror MCW behavior exactly for:
- modulus normalization and validation
- empty-input behavior
- base-word width preservation
- modulus range checking against the base word range
- repeated-squaring modular exponentiation semantics

The Python helper layer should stay structurally parallel to the engine logic:
- decode `base` and `exp` from bits
- validate modulus
- compute `base^exp mod modulus`
- return a bit word with the original base width

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

The generated runtime should now include:
- one explicit `mod_exp(base, exp, modulus)` helper

---

## Compatibility Rule

This slice should:
- allow `ModExp` in otherwise export-compatible workspaces
- continue to reject unsupported structured recursion and other existing unsupported cases unchanged

---

## Parity Tests

This slice must add parity tests for at least:
- one direct `ModExp` workspace
- one small number-theoretic path that makes the emitted arithmetic behavior visible through a sink

Tests should:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

---

## Success Condition

This slice is successful when:
- `ModExp` leaves the audit gap list
- exported Python supports bounded `ModExp` parity
- the remaining primitive gap list is reduced to `ModInverse`
