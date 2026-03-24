# Stream Cipher V3

Last updated: March 24, 2026

Status: Proposed.

## Purpose

This contract defines the third bounded stream-cipher vocabulary slice after shipped:
- first stream foundations (`v1.18.0`)
- stream filtering (`v1.20.0`)
- advanced rotor realism (`v1.19.0`)

The goal is not to ship named stream ciphers as presets.
The goal is to deepen MCW's stream-machine language so students can express visible routing/scheduling behavior, not just visible voting, gating, and selection.

This slice should establish that MCW can represent:
- a control bit that routes one pulse or one 1-bit signal to one of two downstream paths
- a stream machine where control decides which register advances next
- the difference between selecting an output bit and routing a pulse to a destination

## Why Now

MCW already ships:
- `Gate`
- `Majority`
- `Mux`
- `Clock`
- `LFSR`

That is enough to build first irregular-clocking and first selector/filter machines.
It is not yet enough to honestly express a simple scheduler-style stream pattern where one control bit decides which one of two downstream registers receives the live pulse.

The next honest stream step is not a named cipher preset.
The next honest step is to add one small routing primitive that keeps stream scheduling explicit on the graph.

## Architectural Decision

For the third stream-cipher milestone:
- stay on the existing `bits` domain
- reuse shipped clocks, registers, and control primitives
- add one bounded routing primitive rather than a generalized scheduler
- keep stream behavior visible as graph wiring, not executor magic

This slice should:
- add one explicit destination-routing primitive
- show how routing differs from gating, voting, and selecting
- keep state transitions and destination choice inspectable in the existing surfaces

This slice should not:
- add named stream-cipher presets
- add new signal types
- add a generalized register-bank manager
- widen into byte-wide scheduling or protocol modes
- add brute-force/statistical tooling

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- students should be able to route one 1-bit pulse or control bit into one of two outputs
- students should be able to see which downstream path was activated on each tick
- scheduler-style routing should remain legible on the graph

2. **Analyze**
- the routing primitive should get the same compact transformation legibility as `Gate`, `Majority`, and `Mux`
- no giant new stream-analysis subsystem is needed for V3

3. **Guide / Challenge**
- at least one tutorial should teach the difference between gating, selecting, and routing
- at least one demo should show a clock pulse being routed to one of two candidate downstream registers
- at least one challenge should require repairing the routing control or swapped outputs

## First Milestone

The first milestone should answer one question clearly:

**Can a student build and explain a visible stream scheduler where control chooses which downstream register advances, rather than only whether a pulse exists or which bit continues forward?**

The student should be able to:
- explain what the routing control bit is doing
- predict which downstream path becomes active on a given tick
- contrast routing with selection, voting, and gating

## Include

### Primitive addition

- `Demux`
  - three 1-bit `bits` ports:
    - `select` input
    - `in` input
    - two 1-bit outputs: `a`, `b`
  - emits `in` on output `a` when `select` is `[0]`, with `b = [0]`
  - emits `in` on output `b` when `select` is `[1]`, with `a = [0]`
  - rejects statically known non-1-bit inputs where possible

Why this primitive:
- it is small
- it is honest
- it adds visible routing, not just visible voting or selection
- it unlocks simple stream-scheduler teaching patterns that the current library cannot express cleanly

### Explicit machine patterns

This milestone should also ship one or two bounded demos/composites using already-shipped parts plus `Demux`:
- a routed-clock keystream machine where one control register sends the live pulse to one of two candidate data registers
- a comparison lab that makes clear why `Demux` is not just `Gate` or `Mux`

These should be assembled from explicit modules, not hidden behind a named cipher module.

## Exclude

This milestone should explicitly avoid:
- named stream-cipher presets (`A5/1`, `Geffe`, etc.) as first-class modules
- generalized register-bank scheduling
- byte-wide demultiplexing unless the 1-bit slice proves insufficient
- packet/message scheduling abstractions
- brute-force or period-analysis tooling
- protocol/mode wrappers

## Relationship To Existing Modules

This slice builds directly on shipped foundations:
- `Gate` already shows how a pulse can be suppressed or passed
- `Majority` already shows how several control bits can vote
- `Mux` already shows how control can choose one of two candidate bits
- `Demux` would add the missing idea that control can choose which downstream path receives the active bit/pulse

The value of this slice is not "more stream modules."
The value is that MCW gains a visible routing primitive, which is a real missing word in the stream scheduling language.

## Visual / Teaching Principles

Prefer:
- tiny routing logic students can reason through mentally
- direct contrasts between gating, selecting, and routing
- scheduler-style machines whose behavior is explained by the graph

Avoid:
- giant routing fabrics in the first slice
- hiding the route split inside a composite while claiming the graph is explicit
- teaching cryptanalytic folklore before the scheduling mechanics are clear

## Suggested Teaching Additions

The first milestone should likely ship with:

### Demo workspace

- `Routed Clock Keystream`
  - `Clock -> Demux(select, pulse) -> two candidate data LFSRs -> XOR(...)`
  - makes it visible that control can choose which downstream register receives the live pulse

### Tutorial

One tutorial (4-6 steps) teaching:
- what the routing bit means
- how `Demux` differs from `Gate`
- how `Demux` differs from `Mux`
- why routing changes which register evolves over time

### Challenge

One bounded challenge such as:
- a routed-clock keystream machine with the wrong selector seed or swapped `Demux` outputs
- the student must restore the routing behavior so the output stream matches a reference

## Success Criteria

This slice is successful when a student can:
- explain why a routing primitive is different from a selector
- explain why a routing primitive is different from a gate
- build a visible scheduler-style keystream machine
- predict which downstream register advances on a given tick
- see routing as explicit machine structure rather than as hidden stream-cipher lore
