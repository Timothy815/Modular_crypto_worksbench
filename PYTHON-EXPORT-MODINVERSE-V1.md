# PYTHON-EXPORT-MODINVERSE-V1

Last updated: March 28, 2026

Status: Implemented on `main`

---

## Purpose

Define the next Python export implementation slice after the shipped `ModExp` export.

This contract is the follow-on to:
- `PYTHON-EXPORT-COVERAGE-MAP-V1.md`

After the shipped `ModExp` slice, the remaining primitive/runtime gap is:
- `ModInverse`

The next recommended implementation target is:
- `ModInverse`

---

## Product Goal

Add bounded `ModInverse` export support so Python export closes the final remaining primitive/runtime gap in the current registry line.

This is **ModInverse export**, not a broader number-theory redesign.

---

## Required V1 Shape

This slice must:
- add explicit Python runtime helper support for `ModInverse`
- mirror [mod-inverse.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mod-inverse.ts) directly
- preserve modulus validation
- preserve word-width preservation and empty-word behavior
- preserve extended-Euclidean inverse semantics
- preserve the current error on non-invertible values
- preserve one-file export architecture

It must not:
- redesign number-theory export broadly
- change existing arithmetic export semantics
- broaden compatibility outside `ModInverse`

---

## Execution Parity Rule

Generated Python must mirror MCW behavior exactly for:
- modulus normalization and validation
- empty-input behavior
- input-word width preservation
- modulus range checking against the input word range
- extended-GCD inverse computation
- error behavior when the input has no inverse modulo the chosen modulus

The Python helper layer should stay structurally parallel to the engine logic:
- decode the input bit word
- validate modulus
- compute the extended GCD
- reject non-invertible inputs when `gcd != 1`
- normalize the inverse into the `0..modulus-1` range
- return a bit word with the original input width

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

The generated runtime should now include:
- one explicit `mod_inverse(signal, modulus)` helper
- one explicit `_extended_gcd(a, b)` helper

---

## Compatibility Rule

This slice should:
- allow `ModInverse` in otherwise export-compatible workspaces
- continue to reject unsupported structured recursion and other existing unsupported cases unchanged

---

## Parity Tests

This slice must add parity tests for at least:
- one direct `ModInverse` workspace
- one small number-theoretic path that makes invertibility failure or success visible through a sink

Tests should:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

---

## Success Condition

This slice is successful when:
- `ModInverse` leaves the audit gap list
- exported Python supports bounded `ModInverse` parity
- the primitive registry line is fully covered by Python export
- the next export frontier is structural rather than primitive/runtime completion
