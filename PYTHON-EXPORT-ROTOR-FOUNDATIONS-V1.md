# PYTHON-EXPORT-ROTOR-FOUNDATIONS-V1

Last updated: March 28, 2026

Status: Drafted on `main`

---

## Purpose

Define the first bounded rotor-family Python export slice after the shipped temporal export support for:
- `Clock`
- `Counter`
- `LFSR`

This contract exists because the long-range export goal is now explicit:

- anything that can be expressed in MCW
- and anything that can run successfully in MCW
- should eventually be exportable as runnable Python

This slice is the next serious step toward that parity goal.

---

## Product Goal

Allow a user to export one compatible ticked workspace containing a bounded forward rotor path as one standalone Python file with parity against MCW ticked execution.

This is **rotor export foundations**, not full temporal parity across the entire rotor ecosystem.

---

## Strategic Position

The export line has already proved:
- stateless primitive export
- bounded temporal export with `Clock` and `Counter`
- cryptographically meaningful temporal export with `LFSR`

The next true frontier is the rotor family.

Rotor export matters because it is:
- historically distinctive
- central to MCW’s identity
- one of the clearest places where MCW exceeds ordinary crypto teaching tools

But it must enter carefully.

The first rotor export slice should prove:
- exported symbolic rotor traversal
- exported rotor position/ring-offset state
- exported tick-end stepping parity
- a readable temporal artifact shape that still matches MCW

It should not try to prove reverse traversal, linked forward/reverse rotor identity, or control-bank scheduling all at once.

---

## Core Question

What is the smallest rotor-family export slice that proves MCW can generate faithful historical-machine code without collapsing the explicit Python runtime into a hidden simulator?

---

## Required V1 Shape

This slice must:
- reuse the shipped temporal Python artifact model
- preserve one standalone `.py` file
- preserve one explicit `run_ticks()` loop
- preserve stable per-tick sink output lines
- add only the bounded runtime needed for one forward rotor path

It must not redesign the existing export runtime shape.

---

## Supported New Stateful Primitive

This slice should add exactly:
- `Rotor`

And continue relying on already-supported companions as needed, including:
- `Clock`
- `Counter`
- `LFSR`
- `TextInput`
- `Output`
- `SymbolToBits`
- `BitsToSymbol`
- `BitSource`
- `BitOutput`
- `XOR`
- `Gate`
- `Equals`
- `AtLeast`
- `Mux`
- `Demux`
- `MultiRouter`

The key boundary is:
- one new rotor-family primitive
- no linked rotor state
- no reverse face
- no control-bank timing

---

## Execution Parity Rule

Parity target remains:
- `executeTickedProject()`

For supported workspaces, generated Python must mirror MCW `Rotor` behavior exactly:
- current symbolic wiring traversal
- current `position`
- current `ringOffset`
- current stepping/advance timing
- current `turnover` / `notches` behavior exactly as implemented
- conditional stepping only when the rotor’s visible clock path activates it

This slice must follow MCW’s existing rotor implementation, not a cleaned-up reinterpretation.

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless and temporal helper layer
2. explicit rotor-state initialization
3. explicit rotor evaluate helpers
4. explicit rotor advance helpers
5. one topological per-tick loop
6. one `main()` that prints stable per-tick sink lines

Python stdlib only.
Target Python `3.8+`.

---

## State Model Requirement

The exported rotor state must stay explicit and readable:
- wiring remains visible as an explicit mapping
- rotor position is stored as a plain integer
- ring offset is stored as a plain integer
- notch/turnover data is explicit
- evaluate and advance remain line-by-line understandable

The generated code should read like:
- initialize rotor state
- evaluate current symbol transformation
- conditionally advance at tick end

It must not become:
- a generic opaque machine interpreter
- a compressed serialized runtime blob

---

## Explicit V1 Exclusions

This slice must still exclude:
- `RotorReverse`
- linked rotor pairing
- reflector-coupled return paths
- `Reflector`
- `Plugboard`
- rotor control-bank export
- composites
- iterators
- multi-phase temporal scheduling

If a workspace contains unsupported rotor-family or structured features, export must fail clearly before file generation.

---

## Compatibility Check

The compatibility check should now:
- allow `Rotor`
- continue allowing the already-shipped stateless and temporal subset
- continue rejecting unsupported temporal or structured features
- continue requiring a valid graph and a derivable tick count

It should still fail cleanly rather than partially exporting a rotor workspace.

---

## Parity Tests

This slice must add parity tests for at least:
- one `Clock -> Rotor -> Output` style workspace
- one workspace where rotor stepping changes visible output across ticks

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW `executeTickedProject()`

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Non-Goals

This slice must not:
- export `RotorReverse`
- export linked forward/reverse rotor state shadowing
- export reflector return paths
- export control-bank rotor scheduling
- export composites or iterators
- redesign the temporal Python artifact shape
- optimize for performance

---

## Success Condition

This slice is successful when:
- `Rotor` is exportable with clean parity against MCW ticked execution
- the generated Python remains readable and explicit
- the temporal runtime still looks like authored code, not an opaque engine dump
- the export line meaningfully advances toward full MCW execution parity without jumping straight into the full rotor ecosystem
