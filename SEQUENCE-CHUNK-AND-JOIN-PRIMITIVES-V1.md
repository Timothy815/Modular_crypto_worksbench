# SEQUENCE-CHUNK-AND-JOIN-PRIMITIVES-V1

Last updated: April 10, 2026

Status: Drafted for review before implementation

## Purpose

Define bounded primitives for splitting explicit sequences into fixed-size chunks and rejoining them back into whole sequences.

The goal is not to create general array programming.
The goal is to make block-oriented cryptographic structure visible and authorable.

## Why Now

MCW now has explicit sequence foundations for:
- symbols
- bits
- ASCII
- hex-authored bit buffers

The next honest missing step is structural grouping:
- turn one whole sequence into ordered blocks or words
- process those blocks visibly
- join them back into one whole sequence

Without chunk/join primitives, users still have to fake block structure through manual layout and ad hoc bridging.

## Product Goal

Users should be able to express:
- split this bit buffer into 8-bit or 16-bit words
- split this symbol sequence into fixed-size groups
- join processed chunks back into one ordered sequence

The graph should visibly show:
- where grouping happens
- what chunk width is being used
- how remainder bits/symbols are handled

## Core Decision

V1 introduces explicit chunk and join primitives.

These primitives operate on already-explicit sequence signals.
They do **not** redefine every existing primitive as block-aware.

## V1 Product Shape

Good bounded V1 shapes:
- `ChunkBitsSequence`
- `JoinBitsSequence`
- `ChunkSymbolSequence`
- `JoinSymbolSequence`

If symbol chunking proves too broad for first implementation, a bit-first V1 is acceptable, but the contract should define the product intent for both domains.

## Required Behaviors

1. Chunking must preserve ordering.
2. Joining must preserve ordering.
3. Chunk width / group size must be explicit.
4. Remainder handling must be explicit:
   - `error`
   - `truncate`
   - `pad`
5. Padding policy must be visible and parameterized where supported.
6. Join operations must define whether they:
   - require equal chunk widths
   - or simply flatten ordered chunks
7. Validation must reject impossible or ambiguous configurations.
8. Chunking and joining must remain ordinary graph-visible modules.
9. V1 must not silently infer chunk widths from downstream modules.
10. V1 must not introduce nested general-purpose container semantics beyond what is needed for explicit chunk grouping.

## Product Boundary

This slice is about **explicit grouping**.

It is not about:
- implicit block inference
- matrix/state abstractions
- automatic round scheduling
- hidden “apply this module to every chunk” semantics

Users must still place visible modules between chunking and joining if they want block-by-block processing.

## Design Guidance

Chunking modules should be easy to explain:

- `ChunkBitsSequence`
  - input: whole bit sequence
  - output: ordered sequence of fixed-width bit words
  - explicit remainder mode

- `JoinBitsSequence`
  - input: ordered sequence of bit words
  - output: one whole bit sequence

- `ChunkSymbolSequence`
  - input: whole symbol sequence
  - output: ordered sequence of fixed-length symbol groups

- `JoinSymbolSequence`
  - input: ordered sequence of symbol groups
  - output: one whole symbol sequence

## Important Implementation Constraint

This contract depends on the structured-sequence model but should still remain bounded.

If the engine does not yet support sequence-of-sequences honestly, V1 may need a narrower first implementation shape.
That narrowing must be explicit rather than hidden behind pseudo-generic APIs.

## Explicit Non-Goals

Do not include:
- general matrix containers
- arbitrary nesting depth
- implicit map/reduce behavior
- automatic block-cipher orchestration
- hidden propagation of chunk semantics through unrelated modules

## Success Criteria

This contract is successful when:
- block splitting and rejoining become explicit, visible graph operations
- users can author block-based workflows without manual unrolling
- chunk semantics remain honest and bounded instead of becoming ad hoc engine magic
