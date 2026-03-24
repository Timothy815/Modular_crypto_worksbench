# Stream Cipher V2

Last updated: March 24, 2026

Status: Proposed.

## Purpose

This contract defines the second bounded stream-cipher vocabulary slice after shipped:
- first stream foundations (`v1.18.0`)
- advanced rotor realism (`v1.19.0`)

The goal is not to ship named stream ciphers as presets.
The goal is to deepen MCW's stream-machine language so students can express visible filter-style behavior, not just visible voting and gated clocking.

This slice should establish that MCW can represent:
- a visible selector-based keystream combiner
- a stream machine where one control bit chooses between competing register outputs
- the difference between combining bits and selecting one source over another

## Why Now

MCW already ships:
- `Clock`
- `LFSR`
- `Gate`
- `Majority`
- `XOR`
- framing and protocol-material foundations

That is enough to build first irregular-clocking machines.
It is not yet enough to honestly express a classic filter-style stream pattern where control decides which one of several candidate bits becomes the keystream bit.

The next honest stream step is not a named cipher preset.
The next honest step is to add one small selector primitive that keeps stream filtering explicit on the graph.

## Architectural Decision

For the second stream-cipher milestone:
- stay on the existing `bits` domain
- reuse shipped clocks, registers, protocol inputs, and framing where helpful
- add one bounded selector primitive rather than a whole family of preset stream generators
- keep stream behavior visible as graph wiring, not executor magic

This slice should:
- add one explicit bit-selector primitive
- show how selector-based filtering differs from majority voting and from XOR
- keep state, control, and output selection inspectable in the existing surfaces

This slice should not:
- add named stream-cipher presets
- add new signal types
- add hidden register orchestration
- add brute-force/statistical cryptanalysis tooling
- widen into protocol modes or authenticated encryption

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- students should be able to wire two candidate 1-bit sources into a visible selector
- students should be able to trace which source won on each tick
- selector-based filtering should remain legible on the graph

2. **Analyze**
- the selector primitive should get the same compact transformation legibility as `Majority`, `Gate`, and compare modules
- no giant new stream-analysis subsystem is needed for V2

3. **Guide / Challenge**
- at least one tutorial should teach the difference between voting, gating, and selecting
- at least one demo should show a filtered keystream path where the control bit picks the active source
- at least one challenge should require repairing the selector path or control source

## First Milestone

The first milestone should answer one question clearly:

**Can a student build and explain a visible stream filter where control chooses which bit becomes the keystream, rather than only deciding whether a register advances?**

The student should be able to:
- explain what the selector control bit is doing
- predict which candidate stream is active on a given tick
- contrast selector-based filtering with majority voting and simple XOR combination

## Include

### Primitive addition

- `Mux`
  - three 1-bit `bits` inputs:
    - `select`
    - `a`
    - `b`
  - one 1-bit `bits` output
  - emits `a` when `select` is `[0]`
  - emits `b` when `select` is `[1]`
  - rejects statically known non-1-bit inputs where possible

Why this primitive:
- it is small
- it is honest
- it adds visible selection, not just visible voting
- it unlocks stream-filter teaching patterns that the current library cannot express cleanly

### Explicit machine patterns

This milestone should also ship one or two bounded demos/composites using already-shipped parts plus `Mux`:
- a filtered keystream machine where one control register chooses between two candidate data bits
- a comparison lab that makes clear why `Mux` is not just `Gate`, `Majority`, or `XOR`

These should be assembled from explicit modules, not hidden behind a named cipher module.

## Exclude

This milestone should explicitly avoid:
- named stream-cipher presets (`Geffe`, `A5/1`, etc.) as first-class modules
- a generalized register-bank scheduler
- byte-wide multiplexing unless the 1-bit slice proves insufficient
- `Demux` in the same slice unless implementation proves it is absolutely necessary
- brute-force or period-analysis tooling
- protocol/mode wrappers

## Relationship To Existing Modules

This slice builds directly on shipped foundations:
- `Majority` already shows how several control bits can vote on one decision
- `Gate` already shows how control can suppress a pulse
- `Mux` would add the missing idea that control can choose which candidate bit continues forward
- `XOR` remains the explicit masking combiner downstream

The value of this slice is not "more stream modules."
The value is that MCW gains a visible selection primitive, which is a real missing word in the modern stream language.

## Visual / Teaching Principles

Prefer:
- tiny selector logic students can reason through mentally
- direct contrasts between voting, gating, and selecting
- filter-style machines whose behavior is explained by the graph

Avoid:
- giant filter functions with many inputs in the first slice
- hiding selector behavior inside a composite while claiming the graph is explicit
- teaching security folklore before the selection mechanics are clear

## Suggested Teaching Additions

The first milestone should likely ship with:

### Demo workspace

- `Filtered Keystream`
  - `Clock -> Control LFSR -> Mux(select, data-a bit, data-b bit) -> XOR(BitSource) -> BitOutput`
  - makes it visible that control can choose one candidate stream over another instead of only voting or gating

### Tutorial

One tutorial (4-6 steps) teaching:
- what the selector bit means
- how `Mux` differs from `Majority`
- how `Mux` differs from `Gate`
- why selection changes the ciphertext rhythm/content

### Challenge

One bounded challenge such as:
- a filtered keystream machine with the wrong selector seed or swapped `Mux` inputs
- the student must restore the filtering behavior so the output stream matches a reference

## Success Criteria

This slice is successful when a student can:
- explain why a selector primitive is different from a vote
- explain why a selector primitive is different from a gate
- build a visible filter-style keystream machine
- predict which source wins on a given tick
- see selector-based filtering as explicit machine structure rather than as hidden stream-cipher lore
