# PYTHON-EXPORT-STATEFUL-EXPANSION-V1

Last updated: March 27, 2026

Status: Shipped on `main`.

---

## Purpose

Define the first careful follow-on to `PYTHON-EXPORT-STATEFUL-FOUNDATIONS-V1.md`.

The stateful foundations slice proved:
- one explicit exported tick loop
- parity with `executeTickedProject()`
- bounded temporal state for `Clock` and `Counter`

The next stateful export step should broaden that temporal runtime just enough to reach the first genuinely cryptographic keystream primitive without opening the rotor family yet.

---

## Product Goal

Allow a user to export one compatible ticked workspace that includes `LFSR` as standalone executable Python with parity against MCW ticked execution.

This is **stateful export expansion**, not full temporal parity across the entire machine vocabulary.

---

## Strategic Position

`LFSR` is the right next stateful export target because it is:
- cryptographically meaningful
- already shipped and well-understood inside MCW
- stateful without requiring linked state, reverse traversal, or control-bank timing

This makes it the correct bridge between:
- simple temporal export (`Clock`, `Counter`)

and later, harder temporal export families such as:
- `Rotor`
- `RotorReverse`
- linked rotor pairing
- rotor control banks

---

## Core Question

What is the smallest next temporal export slice that proves MCW can export a real keystream-style state machine without collapsing into rotor-era runtime complexity?

---

## Required V1 Shape

This slice must:
- reuse the shipped stateful Python export foundations
- preserve the same one-file artifact model
- preserve the same explicit `run_ticks()` loop shape
- preserve the same stable per-tick sink output format
- add only the minimum runtime needed for `LFSR`

It must not redesign the foundations runtime.

---

## Supported New Stateful Primitive

This slice should add exactly:
- `LFSR`

It should continue to rely on the already-shipped stateless and stateful companions as needed, including:
- `Clock`
- `Counter`
- `BitSource`
- `BitOutput`
- `HexOutput`
- `BitsToHex`
- `XOR`
- `Gate`
- `Equals`
- `AtLeast`
- `GreaterThan`
- `Mux`
- `Demux`
- `MultiRouter`
- `BitJoin`
- `BitSplit`
- `BitPad`
- `BitWindow`
- `BitShifter`

The key boundary is:
- one new stateful primitive family
- no new structured definitions
- no rotor semantics

---

## Execution Parity Rule

Parity target remains:
- `executeTickedProject()`

For supported workspaces, generated Python must mirror MCW’s current `LFSR` behavior exactly:
- `evaluate()` emits a bit word from the current register state
- `advance()` shifts the register once at tick end
- if `clock` is connected, advance happens only on an active `[1]` pulse
- if `clock` is unconnected, advance happens every tick
- `taps` are parsed exactly as the current MCW engine parses them
- `outputLength` determines how many bits each tick emits from the current register snapshot

This slice must follow MCW’s current `LFSR` implementation, not a rewritten or “cleaned up” interpretation.

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should now contain:
1. the shipped stateful foundations helpers
2. explicit `LFSR` state initialization
3. explicit `LFSR` evaluate helpers
4. explicit `LFSR` advance helpers
5. one topological per-tick loop
6. one `main()` that prints stable per-tick sink lines

Python stdlib only.
Target Python `3.8+`.

---

## State Model Requirement

The exported `LFSR` state must stay simple and visible:
- register bits remain an explicit Python list
- taps remain an explicit parsed list
- output generation remains line-by-line understandable
- no hidden runtime object graph
- no generic temporal interpreter abstraction

The generated Python should read like:
- initialize register state
- evaluate current keystream output
- conditionally advance register

not like a black-box simulator.

---

## Explicit V1 Exclusions

This slice must still exclude:
- `Rotor`
- `RotorReverse`
- `Reflector`
- `Plugboard`
- linked rotor pairing
- rotor control-bank runtime export
- composites
- iterators
- `BaudotSource`
- multi-phase temporal scheduling

If a workspace contains unsupported temporal features, export must fail clearly before file generation.

---

## Compatibility Check

The compatibility check should now:
- allow `LFSR`
- continue allowing the already-shipped stateful foundations subset
- continue rejecting unsupported temporal or structured definitions
- continue requiring a valid graph and a derivable tick count

It should continue to fail cleanly rather than partially exporting a temporal workspace.

---

## Parity Tests

This slice must add parity tests for at least:
- one `Clock -> LFSR -> sink` workspace
- one `LFSR` workspace where its ticked output influences visible logic or routing before reaching the sink

Tests must:
- generate Python
- execute it with `python3`
- compare its sink output lines against MCW `executeTickedProject()`

As with the existing export tests, they should skip gracefully if `python3` is unavailable.

---

## Non-Goals

This slice must not:
- export any rotor family runtime
- export linked rotor state shadowing
- export rotor reverse traversal
- export control-bank scheduling
- export composites or iterators
- redesign the stateful Python artifact shape
- optimize for performance

---

## Success Condition

This slice is successful when:
- `LFSR` is exportable with clean parity against MCW ticked execution
- the generated Python remains readable and explicit
- the foundations runtime remains understandable
- the project is still well short of rotor-level temporal complexity

That will prove that stateful Python export can move from simple counters to the first real cryptographic keystream primitive without losing discipline.
