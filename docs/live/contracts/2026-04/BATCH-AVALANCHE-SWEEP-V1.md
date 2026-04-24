# Batch Avalanche Sweep V1

Last updated: April 24, 2026

## Purpose

This contract defines the next bounded modern-cryptanalysis slice for MCW.

The goal is to extend the already-shipped one-bit Avalanche Explorer into a repeatable sweep tool that measures the whole input surface instead of one flip at a time.

This is the shortest path from:

- "I can see one interesting avalanche example"

to:

- "I can tell whether this machine is consistently diffusive or only impressive in a few cases"

## Product Position

This slice belongs in the existing `Cryptanalysis -> Modern` workspace.

It is an extension of the current modern-analysis surface, not a new analysis shell.

The existing modern view already owns:

- baseline vs variant output difference
- one-bit flip control
- round-aware diffusion view
- bounded influence heatmap

Batch Avalanche Sweep V1 should add:

- whole-input sweep execution
- summary statistics
- weakest/strongest bit callouts
- grouped summaries for larger machines

It should not replace the current single-flip view.

The correct product shape is:

- one-bit flip for intuition
- batch sweep for confidence

## Problem Statement

MCW can already show that a single flipped input bit changes a machine.

It is still weak at answering:

- is the diffusion strong across all input bits
- what is the weakest case
- what is the strongest case
- is the machine uniform or uneven
- which region of the input is underperforming

Users are currently answering those questions by exporting Python and running custom scripts.

That is useful, but it means the visual workbench still stops one step too early.

## V1 Scope

V1 must stay narrow.

It should only sweep:

- all single-bit flips across the currently selected supported source

It should not attempt:

- pairwise input-difference sweeps
- key-search workflows
- differential trail search
- arbitrary Monte Carlo harnesses
- solver-style attack tooling

## Required Inputs

V1 should reuse the same supported source/output requirements that the current modern avalanche view already uses.

That means:

- supported bit-like source path
- supported bit-domain output path

If the current workspace cannot run the existing modern avalanche view, it should not claim to support the batch sweep either.

When more than one supported source exists, V1 must expose an explicit source selector for the sweep.

V1 must not silently lock the batch sweep to whichever supported source was discovered first.

## Required Output

When a supported machine is selected, V1 must compute a full single-bit avalanche sweep over the current baseline input and show:

1. total number of flips evaluated
2. minimum changed output bits
3. maximum changed output bits
4. average changed output bits
5. median changed output bits
6. a spread metric
   - standard deviation
7. weakest input bit positions
8. strongest input bit positions

For larger machines, V1 should also provide grouped summaries by:

- byte when the input width is divisible by 8

Byte grouping should only appear when the selected source width is divisible by 8.

V1 does not need to claim that every 8-bit group is a meaningful semantic byte for every machine.
It only needs to provide a bounded grouped view over 8-bit segments when that width is available.

This grouped summary should remain bounded:

- no arbitrary lane-model authoring in V1
- no user-defined grouping schemes in V1

## Visual Shape

The visual order should be:

1. summary verdict shape
2. weakest/strongest callouts
3. grouped evidence
4. optional detailed per-bit table

Recommended UI blocks:

### 0. Sweep Trigger And Freshness

V1 must define an explicit sweep trigger.

The correct default is:

- for sources up to `64` bits, the sweep may auto-run when the source selection or baseline input changes
- for sources above `64` bits, the user must explicitly start the sweep with a `Run Sweep` action

If a displayed sweep no longer matches the current baseline input, selected source, selected sink, or machine state, the UI must mark the result as stale.

V1 may auto-rerun stale results only in the `64`-bit-and-under` case.

For larger sources, V1 should prefer:

- stale marker
- explicit rerun action

over silent recomputation on every change.

### 1. Sweep Summary Card

Show:

- evaluated flips
- min
- max
- average
- median
- spread

This should be scannable in seconds.

### 2. Weakest / Strongest Input Callouts

Show:

- a short list of weakest input bits
- a short list of strongest input bits
- changed-bit count for each

This is the most actionable part of the result and should not be buried in a long table.

In V1, each list should show up to `8` entries.

When more than `8` positions tie or cluster near the boundary, V1 does not need special tie-expansion logic.
It only needs a stable bounded list.

### 3. Grouped Input Summary

When byte grouping is available, show:

- average changed output bits per input byte
- weakest byte group
- strongest byte group

This should help users spot underperforming regions in larger machines without reading 128 individual rows.

### 4. Optional Detailed Sweep Table

V1 may include a bounded detailed list:

- input bit index
- changed output bit count
- changed percent

If present, it should remain compact and sortable-free in V1.

The default order must be input bit index ascending.

Do not turn this into a spreadsheet interface.

## Relationship To Existing Heatmap

The existing bounded influence heatmap should remain.

Batch Avalanche Sweep V1 does not replace it.

The intended relationship is:

- heatmap answers:
  - which outputs react when each input bit flips
- sweep summary answers:
  - how strong and how uniform the machine is overall

These are complementary, not duplicate views.

## Performance Bound

V1 should be safe for normal classroom and toy-cipher-sized machines.

That means:

- all single-bit flips for the active supported source
- no combinatorial multi-bit expansion

If the machine is too large or too expensive for an immediate full sweep, V1 may:

- show a bounded explanatory fallback
- or cap the sweep with explicit disclosure

But it must not silently pretend a partial sweep is complete.

For V1, the main implementation protection should be:

- sources above `64` bits require explicit `Run Sweep`

For supported sources up to `256` bits, V1 should still aim to execute a complete sweep rather than silently degrading to a sample.

If a complete sweep cannot be completed for a supported source, the UI must say so explicitly.

## Copy Principles

The tone should stay evidence-first, not verdict-first.

Prefer:

- "weakest observed flip"
- "strongest observed flip"
- "average changed bits"
- "spread is uneven / tighter / broader"

Avoid:

- secure / insecure badges
- claims that a good sweep proves cipher strength

The teaching line should remain:

- good avalanche is encouraging
- weak avalanche is revealing
- neither is a full security proof

## Non-Goals

V1 does not include:

- automatic attack recommendations
- differential or linear cryptanalysis suites
- saved analysis cases
- key-schedule-specific analysis
- export-script generation

Those are worthwhile later, but they are not part of this slice.

## Implementation Sequence

1. Lock the contract.
2. Add a bounded sweep helper to the modern-analysis logic.
3. Render sweep summary statistics inside the existing modern cryptanalysis panel.
4. Add weakest/strongest callouts.
5. Add byte-group summaries when input width supports them.
6. Only after the basic results are legible, decide whether a compact detailed per-bit table is needed.

## Success Criteria

This slice is successful when a user can:

- run a full single-bit avalanche sweep without exporting Python
- tell whether the machine is broadly diffusive or uneven
- identify the weakest observed input bits
- identify stronger and weaker byte regions in larger machines
- use the result to guide the next machine revision

It is especially successful if a user can answer:

- "Did one good example fool me?"

without leaving MCW.
