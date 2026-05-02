# Stream Cipher V1

Last updated: March 24, 2026

Status: Shipped in `v1.18.0`.

## Purpose

This contract defines the first bounded stream-cipher vocabulary slice after shipped:
- operators (`v1.14.0`)
- control primitives (`v1.15.0`)
- block framing (`v1.16.0`)
- protocol material (`v1.17.0`)

The goal is not to ship named stream ciphers as presets.
The goal is to make MCW better at expressing visible keystream construction and visible stream-control behavior.

This slice should establish that MCW can represent:
- a keystream machine built from multiple explicit registers
- a visible combiner function joining more than one register output
- a first bounded irregular-clocking teaching loop using already-shipped control primitives

## Why Now

MCW already ships:
- `Clock`
- `LFSR`
- `Counter`
- `Equals`
- `AtLeast`
- `Gate`
- framing and protocol-material foundations

That is enough to build simple stream-style machines, but the current language is still thin in two important ways:
- keystream combination still leans too heavily on `XOR`
- irregular or state-dependent stream behavior exists only as an implied pattern, not as a named teaching line

The next honest step is not rotor deepening yet.
The next honest step is to make stream-machine structure more legible using shared vocabulary that also helps later mechanized work.

## Architectural Decision

For the first stream-cipher milestone:
- stay on the existing `bits` domain
- reuse shipped clocks, counters, comparators, and gates
- prefer additive primitives and bounded composites over executor changes
- do not add new signal types
- do not add hidden stepping rules or implicit register orchestration

This slice should make stream behavior more visible by:
- adding one bounded combiner primitive beyond plain `XOR`
- packaging one or two explicit stream-machine composites/demos from already-shipped parts
- teaching irregular clocking as visible graph logic rather than hidden module magic

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- students should be able to wire two or more register outputs into a visible combiner
- students should be able to see how control signals affect whether a register advances
- stream machines should remain explicit graphs, not named presets

2. **Analyze**
- new stream-specific primitives should remain inspectable like existing operators/transforms
- no giant new analysis subsystem is needed for V1

3. **Guide / Challenge**
- at least one tutorial should teach how keystream combination differs from simple masking
- at least one demo should show visible stream control or irregular clocking
- at least one challenge should require repairing a combiner or control condition

This slice should not become:
- a preset catalog of historical stream ciphers
- a hidden scheduler for multi-register machines
- a brute-force key search surface
- a full protocol-mode library

## First Milestone

The first milestone should answer one question clearly:

**Can a student build and understand a visible multi-register keystream machine whose behavior depends on both combination and control?**

The student should be able to:
- combine more than one register output through an explicit keystream combiner
- see the difference between always-clocked and conditionally-clocked registers
- trace why one stream machine behaves differently from another

## Include

The first milestone should include:

### Primitive addition

- `Majority`
  - three 1-bit `bits` inputs: `a`, `b`, `c`
  - one 1-bit `bits` output
  - emits `[1]` when at least two inputs are active, otherwise `[0]`
  - purpose: make visible majority-style control and combination logic without hiding it in a composite

Why this primitive:
- it is small
- it is honest
- it unlocks visible irregular-clocking patterns
- it supports both stream and later mechanized control stories

### Explicit machine patterns

This milestone should also ship one or two bounded demos/composites using already-shipped parts plus `Majority`:
- a visible multi-register keystream combiner
- a visible irregular-clocking machine where one control output decides whether a downstream register advances

These should be assembled from existing modules, not hidden behind a named cipher module.

## Exclude

This milestone should explicitly avoid:
- named stream-cipher presets (`A5/1`, `Geffe`, etc.) as first-class modules
- new signal types
- hidden multi-register orchestration
- brute-force or period-analysis tooling
- stream-mode protocol wrappers
- `Mux` / `Demux` unless implementation proves they are absolutely necessary
- rotor notch / turnover realism in this same slice

## Relationship To Existing Modules

This slice builds directly on shipped foundations:
- `Clock` provides visible pulse timing
- `LFSR` provides explicit register-based keystream state
- `Gate`, `Equals`, and `AtLeast` provide visible control logic
- `Counter` can expose timing/state explicitly when a stream lab wants it

The first stream slice should avoid inventing new hidden machinery.
Its value should come from better visible composition, not from “smart” executor behavior.

## Visual / Teaching Principles

Prefer:
- explicit register banks on the graph
- explicit control paths that explain why a register advanced
- combiners that stay small enough to inspect mentally

Avoid:
- giant black-box stream generators
- describing irregular clocking only in prose while the graph stays generic
- teaching statistical security claims in the first slice

## Shipped Teaching Additions

The first milestone shipped with:

### Demo workspace

- `Majority-Clocked Keystream`
  - `Clock -> 3 Control LFSRs -> Majority -> Gate(clock pulse) -> Data LFSR -> XOR(BitSource) -> BitOutput`
  - makes three separate control streams vote on whether the data register advances
  - keeps irregular clocking visible as graph logic rather than hidden stepping behavior

### Tutorial

- `The Majority-Clocked Keystream`
  - teaches how three control registers feed a visible majority vote
  - shows how `Majority` and `Gate` together decide whether a downstream register advances
  - emphasizes irregular clocking as explicit structure, not module magic

### Challenge

- `Repair the Majority Vote`
  - starts from a majority-clocked keystream machine with one bad control-register seed
  - asks the student to restore the control stream so the majority vote opens the gate on the right ticks
  - teaches that the combiner/control path changes the output rhythm in a visible way

## Success Criteria

This slice is successful when a student can:
- build a visible multi-register keystream machine
- explain what the combiner is doing
- explain why one register does or does not advance
- modify the combiner or control path and predict that the output will change
- see stream ciphers as explicit machines, not opaque generators
