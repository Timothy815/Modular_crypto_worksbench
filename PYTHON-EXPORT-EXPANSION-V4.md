# PYTHON-EXPORT-EXPANSION-V4

Last updated: March 27, 2026

Status: Implemented on `main`

---

## Purpose

Define the next careful follow-on to the current stateless Python export line.

This slice extends export coverage across the remaining stateless Baudot bridge/sink pair without reopening stateful execution, composites, iterators, or runtime redesign.

---

## Product Goal

Allow exported Python to cover the stateless teleprinter bridge boundary by adding:
- `BitsToBaudot`
- `BaudotOutput`

These additions should let exported workspaces end in visible Baudot text as long as the source side remains stateless.

---

## Core Question

What is the smallest next export expansion that closes the stateless Baudot bridge boundary without pulling in the stateful `BaudotSource` line?

---

## Required Boundary

This slice must:
- remain stateless-only
- remain primitive-only
- remain one-file Python generation
- remain `executeProject()` parity only

This slice must not:
- add `BaudotSource`
- add `Clock`, `Counter`, `Rotor`, `RotorReverse`, `Reflector`, `Plugboard`, or `LFSR`
- add composites or iterators
- add ticked execution
- add runtime architecture changes beyond the helper functions needed for these primitives

---

## Added Supported Modules

This slice adds exactly these primitives to the Python export subset:
- `BitsToBaudot`
- `BaudotOutput`

No other export expansion is implied by this contract.

---

## Behavior Requirements

### `BitsToBaudot`

Exported Python must:
- require a bits input whose width is divisible by 5
- decode 5-bit chunks using the same letters-mode Baudot table as MCW
- emit `?` for empty/unmapped table entries in the same way MCW does

### `BaudotOutput`

Exported Python must:
- behave like a symbol sink
- print the decoded Baudot text using the same sink output formatting rules as other symbol sinks

---

## Parity Requirement

For supported workspaces using these added primitives, generated Python must preserve the same sink outputs as:
- `executeProject()`

Parity tests must include:
- one stateless Baudot decoding workspace using `BitSource -> BitsToBaudot -> BaudotOutput`

---

## Scope

Include:
- Python runtime helper for Baudot decoding
- compatibility support for `BitsToBaudot` and `BaudotOutput`
- parity tests for the added coverage
- documentation updates reflecting the expanded subset

Exclude:
- `BaudotSource`
- any stateful/ticked export
- any composite/iterator export
- any export UI redesign

---

## Why This Slice

The stateless export line is now broad across bit, symbol, arithmetic, control, protocol-material, and symbol-structure families.

This follow-on is the right next move because it:
- closes one more clear stateless bridge boundary
- supports existing Baudot teaching/demonstration content on the decode/sink side
- stays entirely inside the already-proven export runtime class

It is a small, clean completion slice before the project turns toward stateful export.

---

## Exit Condition

This slice is complete when:
- generated Python supports `BitsToBaudot` and `BaudotOutput`
- parity tests cover a stateless Baudot decoding workspace
- the export boundary remains stateless-only and primitive-only

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- Python export now supports `BitsToBaudot`
- Python export now supports `BaudotOutput`
- parity coverage now includes a stateless Baudot decoding workspace
