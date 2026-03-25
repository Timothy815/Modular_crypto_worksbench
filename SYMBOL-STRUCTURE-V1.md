# Symbol Structure V1

Last updated: March 24, 2026

Status: Proposed.

## Purpose

This contract defines the first bounded post-`v1.23.0` symbol/message-structure slice.

This is not a contract for full chunked message scheduling.
It is not a contract for automatic fillers, matrix layouts, or transposition-cipher presets.

The goal is to give MCW one honest, explicit word for selecting a contiguous symbol-range from a visible message bus so students can express sub-message structure without hidden chunking logic.

This slice should establish that MCW can represent:
- one visible `symbol` message entering a machine
- explicit extraction of one bounded contiguous symbol window
- different downstream branches consuming different visible submessages
- message structure as graph structure rather than preset cipher behavior

## Why Now

MCW already ships:
- classical symbol-domain primitives
- visible symbol permutation through `SymbolPermutation`
- explicit bit-domain framing through `BitSplit`, `BitPad`, and `BitJoin`
- visible sub-key routing through `BitWindow`

What it still lacks is a small, general-purpose symbol-domain structure primitive that makes one visible message feed different visible submessages without forcing students into bit-domain conversion or preset ciphers.

Right now students can:
- permute whole symbol vectors
- substitute symbols
- route symbol data through classical machines

But they do not yet have one clean primitive for:
- taking a visible symbol message
- selecting one bounded contiguous symbol slice
- wiring that slice into a specific downstream branch

The next honest step is not "full message scheduler automation."
The next honest step is one bounded symbol-window primitive.

## Architectural Decision

For the first symbol/message-structure milestone:
- stay on the existing `symbol` domain
- treat submessages as ordinary visible signals
- avoid new message-array signal types
- avoid auto-chunking and filler behavior in V1

This slice should:
- add one explicit contiguous symbol-window extraction primitive
- keep message structure readable on the graph
- reuse existing symbol primitives rather than inventing a message manager

This slice should not:
- add auto-padding or filler insertion
- add matrix/row-column scheduling helpers
- add inverse helpers automatically
- widen into cryptanalysis or preset transposition workflows

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- students should be able to route one visible symbol message into one or more visible contiguous windows
- submessage flow should remain legible on the canvas

2. **Analyze**
- the new primitive should get the same compact transformation treatment as other routing/select primitives
- students should be able to explain which symbols a downstream branch received

3. **Guide / Challenge**
- at least one tutorial should explain visible symbol-window routing
- at least one demo should show a message feeding more than one symbol-region use
- at least one challenge should require repairing the wrong symbol-window selection

## First Milestone

The first milestone should answer one question clearly:

**Can a student build and explain a machine where different downstream symbol-domain branches consume different visible contiguous windows from one explicit message, without hidden chunking logic?**

The student should be able to:
- explain which symbol positions a branch receives
- predict how changing one symbol window changes the final output
- contrast explicit symbol-window routing with preset transposition structure

## Include

### Primitive addition

- `SymbolWindow`
  - one `symbol` input
  - one `symbol` output
  - explicit `start` and `width` params
  - emits a contiguous fixed-width slice from the input message
  - validates that the requested window fits within the input width when statically knowable

Why this primitive:
- it is small
- it is honest
- it adds one missing word to the language of symbol/message structure
- it keeps submessage choice explicit instead of encoded as hidden layout logic

### Explicit machine patterns

This milestone should also ship one or two bounded demos/composites using already-shipped parts plus `SymbolWindow`:
- a visible two-branch symbol machine where each branch reads a different contiguous window from one message
- a contrast lab showing one wrong window producing the wrong output even when the downstream transforms are otherwise correct

These should be assembled from explicit modules, not hidden behind a named transposition cipher.

## Exclude

This milestone should explicitly avoid:
- transposition-cipher presets
- auto-chunking or repeated block slicing
- filler insertion (`X`, padding symbols, etc.)
- matrix or rail-fence layout helpers
- inverse-window or auto-rejoin helpers

## Relationship To Existing Modules

This slice builds directly on shipped groundwork:
- `SYMBOL-PERMUTATION-V1.md` established visible symbol-order routing without changing symbol identity
- `KEY-SCHEDULE-V2.md` established visible contiguous window extraction in the `bits` domain
- classical symbol primitives already prove that `symbol` signals are first-class machine material

`SymbolWindow` would add the missing idea that one visible symbol message can feed multiple different submessage branches without hiding message structure in prose.

The value of this slice is not "full classical transposition support."
The value is that MCW gains a direct symbol-structure word in the machine language.

## Visual / Teaching Principles

Prefer:
- short messages students can reason through mentally
- direct contrasts between whole-message use and one-window use
- examples where a single wrong symbol window causes a visible branch-level divergence

Avoid:
- giant multi-branch message graphs in the first slice
- hiding symbol-window extraction inside a composite while claiming the graph is explicit
- teaching famous transposition algorithms before message-structure mechanics are clear

## Suggested Teaching Additions

The first milestone should likely ship with:

### Demo workspace

- `Visible Message Window`
  - `TextInput(message) -> SymbolWindow(branch 1) / SymbolWindow(branch 2) -> symbol transforms -> output comparison`
  - makes it obvious that each branch reads a different contiguous region of the same visible message

### Tutorial

One tutorial (4-6 steps) teaching:
- what a visible symbol message bus is
- how `SymbolWindow` chooses one contiguous symbol slice
- how different downstream branches can consume different submessages without hidden chunking
- how to inspect a wrong symbol-window choice

### Challenge

One bounded challenge such as:
- a two-branch symbol machine with the wrong `start` value on one `SymbolWindow`
- the student must restore the correct symbol-window routing so the output matches a reference

## Success Criteria

This slice is successful when a student can:
- explain which part of a symbol message a branch receives
- predict how a wrong symbol-window changes the final machine output
- contrast explicit message structure with preset transposition behavior
- see message slicing as visible machine structure rather than hidden layout magic
