# PYTHON-EXPORT-STATEFUL-FOUNDATIONS-V1

Last updated: March 27, 2026

Status: Proposed next export line

---

## Purpose

Define the first bounded implementation slice for exporting an MCW workspace with stateful/ticked behavior as standalone executable Python.

This contract is the stateful follow-on to:
- `PYTHON-EXPORT-FOUNDATIONS-V1.md`
- `PYTHON-EXPORT-EXPANSION-V1.md`
- `PYTHON-EXPORT-EXPANSION-V2.md`
- `PYTHON-EXPORT-EXPANSION-V3.md`
- `PYTHON-EXPORT-EXPANSION-V4.md`

The stateless line is now broad enough that the next real export frontier is temporal behavior.

---

## Product Goal

Allow a user to export one compatible ticked workspace as one readable standalone Python file that reproduces MCW’s bounded per-tick execution for a very small supported stateful subset.

This is **stateful export foundations**, not general runtime parity for every temporal machine.

---

## Strategic Position

This is the most important next Python export step because it begins the transition from:
- exported static graphs

to:
- exported machines that evolve over time

But it must stay extremely narrow.

The first stateful export line should prove:
- one explicit tick loop shape
- parity against `executeTickedProject()`
- a maintainable state representation
- compatibility gating for unsupported stateful features

It should not try to prove rotor export, linked state export, or every stateful primitive family at once.

---

## Core Question

What is the smallest stateful Python export slice that proves MCW can generate faithful temporal code without collapsing the clean stateless foundations into a full runtime rewrite?

---

## Required V1 Shape

V1 must export:
- one workspace
- to one standalone `.py` file
- for one bounded ticked execution model
- over one curated stateful subset plus already-supported stateless companions

The generated file must:
- contain the runtime helpers it needs
- contain a `run_ticks()` function or equivalent explicit tick loop
- preserve visible tick-to-tick state changes in readable Python
- print sink outputs using the existing sink formatting rules

The output should remain readable, topological, and explicit rather than optimized.

---

## Supported Stateful V1 Subset

The first stateful slice should support exactly:
- `Clock`
- `Counter`

And only the already-supported stateless companions needed to make those useful in exported workspaces, such as:
- `BitSource`
- `BitOutput`
- `HexOutput`
- `BitsToHex`
- `Equals`
- `AtLeast`
- `GreaterThan`
- `Gate`
- `Mux`
- `Demux`
- `MultiRouter`
- `BitJoin`
- `BitSplit`
- `BitPad`
- `BitWindow`
- `BitShifter`

This list is intentionally narrow.

The first stateful slice is about:
- tick loop foundations
- exported temporal state
- simple authored control around counters

It is not yet about cryptographic rotor realism or keystream machines.

---

## Explicit Stateful V1 Exclusions

V1 must exclude:

### Stateful / Temporal Families Not Yet Supported
- `Rotor`
- `RotorReverse`
- `Reflector`
- `Plugboard`
- `LFSR`
- `BaudotSource`

### Structured Definitions
- composites
- iterators

### Advanced Temporal Features
- linked rotor param shadowing
- tick slicing beyond what the first supported subset needs
- multi-phase temporal scheduling
- playback-speed or UI-timeline concerns

If a workspace contains any unsupported stateful module or temporal feature, export must fail clearly before file generation.

---

## Execution Parity Rule

V1 parity target is:
- `executeTickedProject()`

For supported workspaces, generated Python must produce sink outputs equivalent to MCW’s ticked execution for the same project, params, and tick count.

Export requires:
- normal MCW graph validation to pass
- compatibility checking for the supported stateful export subset to pass

If graph validation fails, export must report validation issues first.

---

## Artifact Shape

V1 still produces:
- one standalone `.py` file

That file should contain:
1. small Python helpers for the supported stateful subset
2. explicit module-state storage for supported stateful modules
3. one topological per-tick execution pass
4. one `run_ticks()` function that executes the workspace for a declared number of ticks
5. one `main()` function that invokes `run_ticks()` and prints sink outputs

Python stdlib only.
Target Python `3.8+`.

---

## State Model Requirement

The first stateful slice must keep state representation simple and visible:
- each supported stateful module should have an explicit Python state record
- tick-to-tick state changes should be readable line by line
- no hidden scheduler object
- no compressed serialized runtime blob

The generated code should read like:
- initialize module state
- for each tick: advance, evaluate, capture sinks

not like a generic opaque interpreter.

---

## Export Entry Surface

V1 should reuse the existing `Export Python` action.

User flow:
1. user clicks `Export Python`
2. graph validation runs
3. stateful compatibility check runs
4. if compatible, download one `.py` file
5. if incompatible, show a clear report and do not emit code

No separate export UI is needed in V1.

---

## Tick Count Rule

The first stateful slice must use an explicit tick count.

V1 should not attempt:
- unbounded execution
- interactive external playback
- exported runtime controls

The export should embed or derive one concrete tick count exactly as MCW does for the supported subset.

---

## Compatibility Check

Before export, MCW must run an explicit stateful compatibility check.

The report should identify:
- unsupported stateful modules by instance ID and `defId`
- unsupported composites or iterators
- unsupported temporal features

Stateful export should fail cleanly rather than partially exporting a temporal workspace.

---

## Parity Tests

V1 parity tests must:
- generate Python for at least one `Clock -> Counter -> sink` style workspace
- generate Python for at least one control-oriented counter workspace where ticked state affects routing or gating
- execute the generated Python with `python3`
- compare its sink output lines against MCW `executeTickedProject()` output

Tests should skip gracefully if `python3` is unavailable, matching the current stateless export line.

---

## Non-Goals

This slice must not:
- export rotor machines yet
- export linked forward/reverse rotor behavior
- export SIGABA-style control banks yet
- export `LFSR` yet
- export composites or iterators
- redesign the export architecture
- promise production-grade external runtimes

---

## Why This Slice

The stateless export line is now broad and useful.

The next meaningful frontier is temporal behavior, but the right way to enter it is through the smallest honest stateful pair:
- `Clock`
- `Counter`

That pair is enough to prove:
- exported per-tick state
- exported temporal control
- a readable Python tick loop

without opening the full complexity of the rotor and keystream families.

---

## Recommendation

Treat this as the first active stateful export contract.

If implemented carefully, it should become the proving ground for whether MCW can extend Python export beyond static executable specification into bounded temporal machines.

---

## Exit Condition

This contract is complete when:
- the first stateful export slice is explicitly bounded
- the supported stateful subset is narrow and named
- parity target, artifact shape, and compatibility behavior are clear
- the project can begin stateful export implementation without drifting into rotor/runtime sprawl
