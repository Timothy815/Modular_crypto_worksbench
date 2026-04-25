## Round Contribution View V1

Last updated: April 24, 2026

## Purpose

Extend the modern cryptanalysis surface so users can see which internal rounds actually added diffusion, not just the final changed-bit total.

This slice exists to answer a narrow but important question:

- after a single flipped input bit, which round materially increased spread
- where did diffusion stall
- whether a later round added new change or merely preserved what earlier rounds had already done

## Problem

MCW already shows round-aware diffusion, but the current view is still mostly cumulative.

Users can see:

- how many bits are different at each visible round

But they still have to infer:

- which round produced the biggest jump
- whether some rounds add very little
- whether later rounds plateau or regress

That inference is teachable, but the product should make it easier.

## User Value

This slice should let a user answer:

1. Which round contributed the most new spread?
2. Did any round add almost nothing?
3. Did diffusion plateau before the final round?

The goal is attribution, not a verdict.

## Scope

V1 is intentionally small.

It should:

- stay inside the existing `Cryptanalysis -> Modern` surface
- reuse the existing round-diffusion trace rather than introducing a new engine
- add one compact attribution block next to the existing round-aware diffusion view
- work only when round-aware diffusion already exists

V1 should not:

- add a new workspace mode
- compare two different machines directly
- infer cryptographic strength
- expand into key-schedule or randomness analysis

## Supported Shape

V1 only applies when the existing modern analysis surface already has visible round-diffusion entries.

If no round-diffusion entries exist, the contribution view should not render a fake fallback analysis. It should simply remain absent or show a short explanatory empty state.

## Core Question

V1 must answer one thing clearly:

- how much did each round add relative to the previous observable round

## Required Output

When round-diffusion data exists, V1 should provide:

### 1. Per-Round Contribution Summary

For each observable round:

- cumulative changed-bit count
- cumulative changed percent
- delta versus the previous round

The first round may treat its own changed-bit count as its initial contribution.

### 2. Biggest Gain Callout

A short callout identifying which round produced the largest positive jump in changed bits.

### 3. Plateau / Regression Signal

A short callout identifying whether any visible round added zero or negative new spread compared with the prior round.

This is not a failure badge. It is an observational cue.

## Visual Shape

The UI should stay compact and evidence-first.

A good V1 shape is:

1. one summary row of callouts
2. one ordered list of rounds
3. each row showing:
   - round label
   - cumulative changed bits
   - delta from previous round

Do not add another large heatmap, another dense matrix, or a second spreadsheet-style table in V1.

## Trigger Model

No new trigger is needed.

If the existing modern-analysis flip state produces round-diffusion data, the contribution view may render automatically from that same data.

## Copy Principles

Keep the language observational.

Good:

- `Round 3 added 12 new changed bits relative to Round 2.`
- `Diffusion plateaued after Round 4 in this observed path.`

Bad:

- `Round 3 is secure`
- `Round 4 is bad`
- `This cipher is strong`

## Non-Goals

V1 is not:

- proof of security
- a comparative attack surface
- a new modern-analysis mode
- automatic advice about how many rounds are correct

## Self Review

This contract stays small enough for one implementation pass because:

- it reuses existing round-diffusion data
- it introduces no new machine execution path
- it answers one concrete attribution question

The main discipline is to keep it as a reduction over existing data, not a second analysis engine.
