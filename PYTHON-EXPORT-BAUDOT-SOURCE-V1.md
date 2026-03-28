# PYTHON-EXPORT-BAUDOT-SOURCE-V1

Last updated: March 28, 2026

Status: Implemented on `main`

---

## Purpose

Define the next Python export implementation slice after the shipped `Plugboard` export.

This contract is the follow-on to:
- `PYTHON-EXPORT-COVERAGE-MAP-V1.md`

After the shipped `Plugboard` slice, the remaining primitive/runtime gaps are:
- `BaudotSource`
- `ModExp`
- `ModInverse`

The next recommended implementation target is:
- `BaudotSource`

---

## Product Goal

Add bounded `BaudotSource` export support so Python export closes the remaining Baudot source/output asymmetry in the current vocabulary line.

This is **Baudot source export**, not a broader Baudot-mode redesign.

---

## Required V1 Shape

This slice must:
- add explicit Python runtime helper support for `BaudotSource`
- mirror [baudot-source.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/baudot-source.ts) and [baudot-codec.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/baudot-codec.ts) directly
- preserve letters-mode validation for `A-Z` and space
- preserve uppercase normalization
- preserve tick-slice parity for ticked export
- preserve one-file export architecture

It must not:
- redesign Baudot handling beyond the current letters-mode source behavior
- change current `BitsToBaudot` / `BaudotOutput` semantics
- broaden compatibility outside `BaudotSource`

---

## Execution Parity Rule

Generated Python must mirror MCW behavior exactly for:
- source-text validation
- uppercase normalization
- letters-mode encoding
- per-character tick slicing
- empty-string / end-of-stream behavior

The Python helper layer should stay structurally parallel to the engine logic:
- validate the full text
- encode the normalized string into 5-bit letters-mode Baudot
- provide one tick-sliced helper that emits one encoded character per tick

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

The generated runtime should now include:
- one explicit `baudot_source(value)` helper
- one explicit `baudot_source_tick(value, tick)` helper

---

## Compatibility Rule

This slice should:
- allow `BaudotSource` in otherwise export-compatible workspaces
- treat `BaudotSource` as a valid tick-sliceable stateful companion in temporal export
- continue to reject unsupported structured recursion and other existing unsupported cases unchanged

---

## Parity Tests

This slice must add parity tests for at least:
- one stateless `BaudotSource` workspace
- one ticked `BaudotSource` workspace using `BitsToBaudot` / `BaudotOutput`

Tests should:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW execution

---

## Success Condition

This slice is successful when:
- `BaudotSource` leaves the audit gap list
- exported Python supports both stateless and tick-sliced `BaudotSource` parity
- the remaining primitive gaps are reduced to `ModExp` and `ModInverse`
