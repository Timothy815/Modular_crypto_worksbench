## Key-Schedule-Focused Analysis V1

Last updated: April 24, 2026

## Purpose

Extend MCW’s cryptanalysis surface so users can analyze key evolution as a first-class machine behavior rather than only studying plaintext-to-ciphertext diffusion.

This slice is intended to answer a concrete product gap:

- users can already measure output avalanche reasonably well
- users building ciphers in MCW are now authoring nontrivial key schedules
- the current analysis surface does not help them inspect whether round keys actually evolve or whether a flipped master-key bit spreads broadly through that schedule

## Problem

Right now MCW is much better at answering:

- what happens if I flip one plaintext bit

than:

- what happens if I flip one key bit
- how much do adjacent round keys differ
- are later round keys genuinely evolving, or just repeating shallow structure

Users can still inspect this manually by wiring outputs, exporting Python, or comparing traces by hand, but that is too much ceremony for something that should be central to cipher design.

## User Value

This slice should let a user:

- point at a round-key path and inspect how it changes across rounds
- flip a master-key bit and see whether the schedule spreads that change meaningfully
- compare “plaintext diffusion looks healthy” versus “key schedule still looks weak”

The goal is evidence, not verdict.

## Scope

V1 is intentionally bounded.

It should:

- stay inside the existing `Cryptanalysis` workspace
- add a key-schedule analysis mode or sub-surface rather than a new product area
- work for machines that already expose analyzable key-schedule outputs
- focus on changed-bit counts and simple summaries, not advanced cryptanalytic theory

V1 should not:

- infer hidden round structure from arbitrary graphs
- build a generic graph-query system
- become a full key-attack surface
- replace existing modern avalanche analysis

## V1 Configuration Model

V1 should be manually configured, not inferred heuristically.

That means:

- the user explicitly chooses the master-key source
- the user explicitly chooses which round-key stages to analyze
- the user explicitly controls the order of those stages

V1 should not depend on:

- alphabetical naming
- topology-based ordering guesses
- hidden internal probe inference
- automatic detection of "key-like" semantics from labels alone

## Supported V1 Shape

V1 should only activate when the current machine exposes a clear analyzable key-schedule path.

For V1, that means:

1. there is at least one explicit bit-domain source the user can select as the master key input
2. there are one or more explicit terminal bit-domain outputs the user can select as round-key snapshots
3. the selected round-key outputs can be arranged by the user into an ordered sequence for analysis

If that shape is not present, the feature should fail soft with an explanatory empty state rather than guessing.

For V1, internal composite probes or arbitrary trace-only internal nodes are out of scope.

Users should analyze only explicitly exposed terminal outputs.

## Core Questions V1 Must Answer

V1 should make these questions easy to answer:

1. How different are adjacent round-key outputs from one another?
2. If I flip one master-key bit, how broadly does that difference spread across the round-key sequence?
3. Are some round-key stages much weaker or stronger than others?

## Required Output

When the supported shape exists, V1 should provide:

### 1. Round-Key Sequence Summary

A simple ordered list or strip of the observable round-key outputs:

- stage or output label
- width
- formatted value when representable

The sequence should reflect the user-defined order, not an inferred one.

### 2. Adjacent Round Difference Summary

For each adjacent pair in the round-key sequence:

- changed-bit count
- optional percentage

V1 should only compute adjacent differences when the neighboring stages have matching bit widths.

If widths differ, the UI should show an explicit width-mismatch note for that pair rather than forcing a comparison.

This is the fastest way to see whether the key schedule is evolving or stalling.

### 3. Key-Bit Flip Sweep

A bounded sweep that flips one bit in the selected master-key source and measures the resulting changed-bit count at each round-key stage.

V1 should summarize at least:

- minimum changed bits per stage
- maximum changed bits per stage
- average changed bits per stage

### 4. Weak / Strong Stage Callouts

Short callouts that identify:

- stages with the weakest average spread from key-bit flips
- stages with the strongest average spread

### 5. Plaintext vs Key Framing

The product should make it clear that this is about key evolution, not message avalanche.

V1 does not require a side-by-side comparison chart, but the wording should distinguish the two clearly.

The surface itself should also be structurally labeled as key-schedule analysis, not just described differently in body copy.

## Trigger Model

This should be explicit, not silent.

V1 should require the user to enter the key-schedule analysis surface intentionally.

The key-bit flip sweep should always run from an explicit `Run Analysis` action in V1.

It should not auto-run on view entry, on every keystroke, or on every configuration change.

## Visual Shape

The UI should stay evidence-first and compact.

A good V1 shape is:

1. explicit master-key source picker from supported bit-domain sources
2. explicit round-key stage picker from supported terminal bit-domain outputs
3. explicit ordered round-key output list
3. adjacent-difference summary block
4. key-bit sweep summary block
5. weak/strong stage callouts

Avoid turning this into a dense table-first spreadsheet in V1.

## Fallback Behavior

If V1 cannot identify a supported key-schedule path, it should show an explicit empty state that says, in substance:

- no analyzable key-schedule path was found
- expose a clear key source and ordered round-key outputs to use this view

Changing any of the following should mark existing results stale:

- selected master-key source
- selected round-key stages
- stage order
- machine state

If the machine is too large or too expensive for an immediate full sweep, the UI should disclose when the analysis shown is partial or stale.

## Copy Principles

Keep the language observational.

Good copy:

- `Key schedule changed 22 of 64 bits between Round Key 2 and Round Key 3.`
- `A flipped master-key bit spreads weakly into Round Key 1 and much more broadly by Round Key 4.`

Bad copy:

- `Strong key schedule`
- `Secure`
- `Broken`

This view should help users reason, not brand the machine.

## Non-Goals

V1 is not:

- a full differential or linear key analysis tool
- automatic detection of every possible round-key signal hidden inside arbitrary composites
- saved key-schedule reports
- export of key-analysis scripts
- key-recovery guidance
- proof that a schedule is secure or insecure

## Likely Implementation Direction

The safest path is to reuse the existing modern-analysis execution style:

1. let the user choose a supported key source
2. let the user choose and order supported terminal round-key outputs
3. run the authored machine repeatedly with one-bit master-key flips
4. compute changed-bit counts against the baseline round-key outputs
5. summarize those results per stage

This should be a bounded observational layer over the current machine, not a new engine subsystem.

## Success Criteria

This slice is successful when:

1. users can inspect adjacent round-key evolution without exporting Python
2. users can run a bounded key-bit flip sweep and see where spread is weak or strong
3. the UI labels and structures key-schedule behavior distinctly from plaintext avalanche
4. unsupported machines fail soft instead of producing guessed results
