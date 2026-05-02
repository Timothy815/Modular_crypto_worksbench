# TICKED-TO-SEQUENCE-COLLECTORS-V1

Last updated: April 10, 2026

Status: Shipped on `main`

## Purpose

Define a bounded reverse bridge for collecting per-tick scalar output into an explicit whole sequence.

The goal is to complete the honest bridge pair introduced by the sequence foundation:
- whole sequence -> ticked scalar
- ticked scalar -> whole sequence

This slice is not about timeline replay or hidden buffering in the executor.
It is about visible, authorable collection inside the graph.

## Why Now

MCW now has explicit sequence sources and explicit sequence-to-ticked bridges for:
- symbols
- bits
- ASCII
- hex-authored bit sequences

But the reverse path is still missing.

That leaves an important gap in real workflows:
- generate one symbol or one word per tick
- then recover the whole emitted message, key stream, or block stream as one visible sequence

Without an explicit collector, users can step through a mechanism but cannot honestly re-materialize its output as one whole sequence for downstream structure-aware modules.

## Product Goal

Users should be able to:
- clock a mechanism forward one element per tick
- collect its emitted scalar outputs into an ordered sequence
- then feed that collected sequence into later repetition, chunking, comparison, or export flows

The graph should visibly say:
- “this module emits one element per tick”
- “this module collects those elements into one ordered sequence”

## Core Decision

V1 introduces explicit collector modules.

These collectors are:
- stateful
- tick-driven
- graph-visible
- bounded

They do **not** imply hidden accumulation in sinks or in the executor.

## V1 Product Shape

Good bounded V1 shapes:
- `TickedSymbolsToSequence`
- `TickedBitsToSequence`

If ASCII can be represented honestly through the symbol collector in V1, no separate ASCII collector is required yet.

If bit collection is implemented, the collected result should remain a sequence-typed `bits` signal, not silently become a scalar word.

## Required Behaviors

1. A collector must accept scalar ticked input and build an ordered sequence over ticks.
2. Collection order must match tick order exactly.
3. Collection must be explicit and stateful; no hidden sink-side accumulation.
4. A collector must define what causes the collected output to update:
   - usually its own clock input
   - or the same tick progression used by the source path
5. The collected sequence must be visible as an ordinary MCW signal at the output port.
6. Reset / clear behavior must be explicit and bounded:
   - either by a visible reset input
   - or by a clear contract-defined state rule
7. Validation must reject kind/domain mismatches:
   - scalar symbol into symbol collector
   - scalar bits into bit collector
   - no silent coercion
8. V1 must define whether the collector exposes:
   - the full collected sequence only
   - or also current length/count
9. Collected output must remain deterministic under ticked execution and export.
10. V1 must not introduce general timeline history browsing.

## Bounded State Model

Collectors may maintain:
- current collected sequence
- current item count

They should not maintain:
- arbitrary replay logs
- hidden metadata unrelated to the collected sequence

## Visual / UX Expectations

The user should be able to tell:
- this module is accumulating over time
- how many items have been collected so far
- what the current collected sequence is

The exact presentation can be modest in V1, but it must be visible enough to preserve the glass-box model.

## Python Export Requirement

If implemented, collectors must export honestly to Python:
- explicit state init
- explicit per-tick accumulation
- explicit collected output

No hidden runtime shortcuts should appear in the export path.

## Explicit Non-Goals

Do not include:
- timeline scrubbing
- history viewers
- automatic sequence collection in sinks
- generalized event logs
- hidden “collect all ticks automatically” behavior in unrelated modules

## Likely Follow-On Contracts

This slice should later enable:
- collected-stream comparison
- block regrouping after ticked generation
- explicit record/replay teaching flows

## Success Criteria

This contract is successful when:
- a per-tick symbol or bit stream can be visibly reassembled into a whole sequence
- the collection step is explicit in the graph
- users no longer need to infer or manually reconstruct a generated stream after ticking
