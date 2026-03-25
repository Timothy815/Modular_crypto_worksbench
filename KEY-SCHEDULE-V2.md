# Key Schedule V2

Last updated: March 24, 2026

Status: Proposed.

## Purpose

This contract defines the first bounded post-groundwork key-routing / schedule slice after shipped:
- block framing (`v1.16.0`)
- protocol material (`v1.17.0`)
- three bounded stream-machine slices (`v1.18.0` / `v1.20.0` / `v1.21.0`)
- advanced rotor realism (`v1.19.0`)
- symbol permutation (`v1.22.0`)

This is not a contract for full AES/DES-style key expansion.
It is not a contract for hidden iterator-level round-key injection.

The goal is to give MCW one honest, explicit word for visible per-round key routing so repeated-round machines can consume different sub-keys without magic.

This slice should establish that MCW can represent:
- one visible key bus entering a machine
- explicit extraction of one sub-key window from that bus
- different rounds consuming different visible sub-keys
- round-key choice as graph structure rather than hidden executor behavior

## Why Now

MCW already ships:
- reusable round structure groundwork
- bounded iterators and packaged rounds
- explicit key-bus groundwork
- modern round demos and guided labs
- framing and protocol-material foundations

What it still lacks is a small, general-purpose key-routing primitive that makes one visible bus feed different sub-keys into different rounds.

Right now students can:
- build keyed rounds
- stack rounds manually
- expose key buses

But they do not yet have one clean primitive for:
- taking a wider visible key bus
- selecting one bounded sub-key slice
- wiring that slice into a specific round

The next honest step is not "full key schedule automation."
The next honest step is one bounded key-window routing primitive.

## Architectural Decision

For the first key-routing/schedule milestone:
- stay on the existing `bits` domain
- treat sub-keys as ordinary visible signals
- avoid hidden per-round param mutation
- avoid iterator-aware key injection in V2

This slice should:
- add one explicit key-window extraction primitive
- keep per-round key choice readable on the graph
- reuse existing rounds/composites rather than inventing a round manager

This slice should not:
- add hidden iterator key distribution
- add full key expansion algorithms as opaque modules
- add new signal types
- widen into block-mode or protocol orchestration

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- students should be able to route one visible key bus into different visible sub-key windows
- sub-key flow should remain legible on the canvas

2. **Analyze**
- the new primitive should get the same compact transformation treatment as other routing/select primitives
- students should be able to explain which sub-key bits a given round received

3. **Guide / Challenge**
- at least one tutorial should explain visible sub-key routing
- at least one demo should show different rounds receiving different sub-keys from one bus
- at least one challenge should require repairing the wrong key-window selection

## First Milestone

The first milestone should answer one question clearly:

**Can a student build and explain a repeated-round machine where different rounds consume different visible sub-keys from one explicit key bus, without hidden scheduling magic?**

The student should be able to:
- explain which bits of the key bus each round receives
- predict how changing one sub-key window changes the final output
- contrast explicit sub-key routing with hidden per-round mutation

## Include

### Primitive addition

- `BitWindow`
  - one `bits` input
  - one `bits` output
  - explicit `start` and `width` params
  - emits a contiguous fixed-width slice from the input bus
  - validates that the requested window fits within the input width when statically knowable

Why this primitive:
- it is small
- it is honest
- it adds one missing word to the language of key routing
- it keeps sub-key choice explicit instead of encoded as hidden round metadata

### Explicit machine patterns

This milestone should also ship one or two bounded demos/composites using already-shipped parts plus `BitWindow`:
- a visible two-round keyed machine where each round reads a different window from one key bus
- a contrast lab showing one wrong window producing the wrong ciphertext even when the round structure is otherwise correct

These should be assembled from explicit modules, not hidden behind a named block-cipher module.

## Exclude

This milestone should explicitly avoid:
- AES / DES / Serpent / ChaCha key-schedule presets
- iterator-level hidden round-key injection
- automatic per-round window generation
- rotated/derived round-key algorithms baked into the primitive
- key-expansion randomness or protocol wrappers

## Relationship To Existing Modules

This slice builds directly on shipped groundwork:
- `ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md` established repeated-round structure without hidden loops
- `KEY-SCHEDULE-GROUNDWORK-V1.md` established visible key flow as the non-negotiable baseline
- `BitSplit` already proves that explicit structural slicing is on-model in the `bits` domain

`BitWindow` would add the missing idea that one visible key bus can feed multiple different rounds without duplicating whole source modules or hiding key choice in prose.

The value of this slice is not "full key schedule support."
The value is that MCW gains a direct sub-key routing word in the machine language.

## Visual / Teaching Principles

Prefer:
- short key buses students can reason through mentally
- direct contrasts between one bus / many windows and many separate fixed sources
- examples where a single wrong sub-key window causes a visible round-level divergence

Avoid:
- giant round stacks in the first slice
- hiding key-window extraction inside a composite while claiming the graph is explicit
- teaching famous algorithm schedules before the routing mechanics are clear

## Suggested Teaching Additions

The first milestone should likely ship with:

### Demo workspace

- `Visible Sub-Key Bus`
  - `BitSource(key bus) -> BitWindow(round 1) / BitWindow(round 2) -> keyed rounds -> output`
  - makes it obvious that each round reads a different slice of the same visible key material

### Tutorial

One tutorial (4-6 steps) teaching:
- what a visible key bus is
- how `BitWindow` chooses one sub-key slice
- how different rounds can consume different sub-keys without hidden scheduling
- how to inspect a wrong key-window choice

### Challenge

One bounded challenge such as:
- a two-round keyed machine with the wrong `start` value on one `BitWindow`
- the student must restore the correct sub-key routing so the output matches a reference

## Success Criteria

This slice is successful when a student can:
- explain which part of a key bus each round receives
- predict how a wrong key-window changes the final machine output
- contrast explicit sub-key routing with hidden round-key mutation
- see key scheduling as visible machine structure rather than as preset algorithm magic
