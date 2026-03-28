# PYTHON-EXPORT-ROTOR-RETURN-PATH-V1

Last updated: March 28, 2026

Status: Drafted on `main`

---

## Purpose

Define the next bounded rotor-family Python export slice after the shipped forward-rotor export foundations.

This contract is the follow-on to:
- `PYTHON-EXPORT-ROTOR-FOUNDATIONS-V1.md`

The previous slice proved:
- bounded forward `Rotor` export
- readable rotor state in generated Python
- turnover propagation
- clock-gated rotor stepping parity

The next real rotor export frontier is the return path.

---

## Product Goal

Allow a user to export one compatible ticked workspace containing a bounded Enigma-style return path as one standalone Python file with parity against MCW ticked execution.

This is **rotor return-path export**, not full rotor-system export.

---

## Strategic Position

The export line can now handle:
- stateless primitives
- temporal state with `Clock`, `Counter`, and `LFSR`
- bounded forward `Rotor`

The next identity-defining step is:
- `Rotor -> Reflector -> RotorReverse`

That is the first slice where exported Python starts to look like a historically honest rotor machine rather than a single stateful substitution stage.

But this slice must still stay narrow.

It should prove:
- reflector traversal parity
- reverse traversal parity
- linked forward/reverse rotor-state shadowing parity
- readable return-path code generation

It should not try to prove:
- control-bank scheduling export
- multi-rotor control architectures
- full rotor-machine export parity across every shipped rotor teaching surface

---

## Core Question

What is the smallest rotor return-path export slice that proves MCW can generate faithful forward/reflect/reverse machine code without collapsing into a generic historical-cipher runtime?

---

## Required V1 Shape

This slice must:
- reuse the shipped temporal Python artifact model
- preserve one standalone `.py` file
- preserve one explicit `run_ticks()` loop
- preserve stable per-tick sink output formatting
- add only the bounded runtime needed for:
  - `Reflector`
  - `RotorReverse`
  - linked forward/reverse rotor shadowing
- keep systematic generated comments for module blocks
- require synchronous live shadowing for linked reverse rotors
- keep evaluate-before-advance ordering intact for the whole tick loop

It must not redesign the existing export runtime shape.

---

## Supported New Rotor-Family Primitives

This slice should add exactly:
- `Reflector`
- `RotorReverse`

And continue relying on the already-shipped companions as needed, including:
- `Rotor`
- `TextInput`
- `Output`
- `TextOutput`
- `Clock`
- `Gate`
- `Equals`
- `Mux`

The key boundary is:
- one bounded return path
- one linked forward/reverse rotor identity
- no rotor control-bank scheduling

---

## Execution Parity Rule

Parity target remains:
- `executeTickedProject()`

For supported workspaces, generated Python must mirror MCW behavior exactly for:
- forward rotor traversal
- reflector traversal
- reverse rotor traversal
- linked reverse-rotor shadowing of forward rotor state
- tick-end stepping ownership remaining on the forward `Rotor`
- turnover output behavior remaining attached to the forward rotor face

The exported Python must follow MCW’s existing linked-rotor model, not a simplified “single hidden rotor object” reinterpretation.

That means:
- `RotorReverse` remains a visible exported module block
- linked state is derived from the forward rotor state in a bounded, explicit way
- reverse traversal does not own an independent stepping lifecycle
- `RotorReverse` must not allocate its own rotor-state object in generated Python
- reverse traversal must read from the linked forward rotor state object at evaluation time, not from a copied snapshot
- reverse traversal must use the same normalization helper as forward traversal

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateless and temporal helper layer
2. explicit forward rotor state initialization
3. explicit reflector traversal helpers
4. explicit reverse rotor traversal helpers
5. explicit linked-state shadowing helpers for the reverse face
6. one topological per-tick loop
7. one `main()` that prints stable per-tick sink lines

Python stdlib only.
Target Python `3.8+`.

Reflector wiring must be embedded as an explicit 26-element list of single-character strings.
The generated Python should include a dedicated `reflector_traverse(signal, wiring)` helper.

---

## State Model Requirement

The generated return-path code must stay explicit and readable:
- forward rotor state remains the authoritative mechanical state
- reverse rotor blocks must visibly derive from that state rather than mutating it
- reflector wiring remains explicit
- traversal helpers remain line-by-line understandable
- `rotor_reverse_eval(signal, linked_rotor_state)` should be the concrete helper shape for linked reverse traversal

The generated code should read like:
- initialize forward rotor state
- evaluate forward traversal
- evaluate reflector traversal
- evaluate reverse traversal from linked state
- conditionally advance only the forward rotor at tick end

It must not become:
- a hidden rotor-machine interpreter
- a collapsed opaque “machine.step()” abstraction

---

## Explicit V1 Exclusions

This slice must still exclude:
- rotor control-bank export
- `RotorDoubleStepControl`
- `RotorControlBankRouter`
- multi-rotor control scheduling
- full Enigma bank export
- full SIGABA-style export
- composites
- iterators

If a workspace contains unsupported rotor-control or structured features, export must fail clearly before file generation.

---

## Compatibility Check

The compatibility check should now:
- allow `Reflector`
- allow `RotorReverse`
- allow bounded linked forward/reverse rotor export
- reject orphaned or invalid `linkedRotorId` references for exported `RotorReverse` instances
- reject unlinked `RotorReverse` for this slice
- continue allowing the already-shipped stateless and temporal subset
- continue rejecting unsupported rotor-control and structured features
- continue requiring a valid graph and a derivable tick count when needed

It should still fail cleanly rather than partially exporting a broader historical machine.

---

## Parity Tests

This slice must add parity tests for at least:
- one `TextInput -> Rotor -> Reflector -> RotorReverse -> Output` workspace
- one linked forward/reverse workspace where forward rotor stepping changes the return-path output across ticks
- one workspace verifying that reverse traversal mirrors the forward rotor state without independently advancing
- one workspace where a linked reverse rotor `turnover` output remains in parity with the shared forward rotor state if it is used downstream

Tests must:
- generate Python
- execute it with `python3`
- compare sink output lines against MCW `executeTickedProject()`

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Non-Goals

This slice must not:
- export control-bank rotor scheduling
- export double-step reusable composites
- export arbitrary rotor-machine libraries
- redesign the temporal Python artifact shape
- optimize for performance

---

## Success Condition

This slice is successful when:
- bounded `Rotor -> Reflector -> RotorReverse` paths export with clean parity
- linked forward/reverse rotor behavior remains explicit in the generated Python
- the generated artifact remains readable and teaching-friendly
- the export line reaches the first honest return-path historical machine without widening prematurely into the full rotor ecosystem
