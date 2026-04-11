# SEQUENCE-CHUNK-AND-JOIN-PRIMITIVES-V1

Last updated: April 10, 2026

Status: Shipped on `main`.

## Purpose

Define a bounded first implementation for splitting explicit bit sequences into fixed-size words and rejoining them back into whole sequences.

The goal is not to create general array programming or nested sequence containers.
The goal is to make fixed-width bit-word structure visible and authorable using explicit bridges that the engine can support honestly today.

## Why Now

MCW now has explicit sequence foundations for:
- symbols
- bits
- ASCII
- hex-authored bit buffers

The next honest missing step is structural grouping:
- turn one whole bit sequence into ordered fixed-width words
- process those words visibly across ticks
- join them back into one whole bit sequence

The first bounded implementation must acknowledge a real engine constraint:
- MCW does not yet have an honest sequence-of-sequences runtime type
- therefore V1 cannot pretend to emit nested chunk containers directly

Without a tightened contract, "chunking" risks becoming fake nested structure or hidden map semantics.

## Product Goal

Users should be able to express:
- split this bit buffer into 8-bit or 16-bit words
- process those words one tick at a time
- join processed words back into one ordered bit sequence

The graph should visibly show:
- where grouping happens
- what chunk width is being used
- how remainder bits are handled
- where reassembly happens

## Core Decision

V1 is narrowed to a bit-first segmentation/reassembly slice.

The first implementation shape is:
- segmentation via explicit fixed-width bit-sequence-to-ticked bridges
- reassembly via explicit ticked-bits-to-sequence collectors

This slice does **not** yet introduce a general chunk-container engine type.
It also does **not** redefine every existing primitive as block-aware.

## V1 Product Shape

Good bounded first-implementation shapes:
- `BitsSequenceToTicked` with explicit `wordWidth` and `remainderMode`
- `TickedBitsToSequence` as explicit reassembly
- demo and teaching paths that make the segmentation/rejoin pattern obvious

Deferred follow-on shapes:
- `ChunkBitsSequence`
- `JoinBitsSequence`
- `ChunkSymbolSequence`
- `JoinSymbolSequence`

Those future module names are valid product intent, but they are deferred until MCW has an honest grouped-sequence representation.

## Required Behaviors

1. Bit segmentation must preserve ordering.
2. Bit reassembly must preserve ordering.
3. Word width must be explicit.
4. Remainder handling must be explicit:
   - `error`
   - `truncate`
   - `pad`
5. Padding policy must be visible and parameterized where supported.
6. Reassembly must remain an ordinary graph-visible module.
7. Validation must reject impossible or ambiguous fixed-width segmentation configurations.
8. V1 must not silently infer word widths from downstream modules.
9. V1 must not introduce nested general-purpose container semantics.
10. V1 must not silently imply "apply this module to every chunk" semantics between segmentation and reassembly.

## Product Boundary

This slice is about **explicit fixed-width bit-word structure**.

It is not about:
- implicit block inference
- matrix/state abstractions
- automatic round scheduling
- hidden “apply this module to every chunk” semantics

Users must still place visible modules between chunking and joining if they want block-by-block processing.

## Design Guidance

Chunking modules should be easy to explain:

- `BitsSequenceToTicked`
  - input: whole bit sequence
  - output: one fixed-width bit word per tick
  - explicit remainder mode

- `TickedBitsToSequence`
  - input: one fixed-width bit word per tick
  - output: one whole bit sequence

- between them, users place visible scalar-word modules if they want per-word processing

## Important Implementation Constraint

This contract depends on the structured-sequence model but should still remain bounded.

The engine does not yet support sequence-of-sequences honestly.
Therefore the first implementation shape is explicitly narrowed to bit-first segmentation/reassembly through ticked bridges.
That narrowing is intentional and should not be hidden behind pseudo-generic APIs or misleading module names.

## Explicit Non-Goals

Do not include:
- general matrix containers
- arbitrary nesting depth
- implicit map/reduce behavior
- automatic block-cipher orchestration
- hidden propagation of chunk semantics through unrelated modules
- fake nested chunk values that the runtime does not actually model

## Success Criteria

This contract is successful when:
- fixed-width bit segmentation and reassembly are explicit, visible graph operations
- users can author word-oriented workflows without manual unrolling
- MCW gains honest block-style structure without pretending it already supports general chunk containers
