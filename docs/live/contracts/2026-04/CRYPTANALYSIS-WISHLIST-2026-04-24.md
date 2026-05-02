## Cryptanalysis Wishlist

Last updated: April 24, 2026

## Purpose

This note records a prioritized cryptanalysis wishlist against the current shipped MCW surface.

It is not a claim that all of these items should ship soon.

It exists to answer a narrower question:

- if MCW already has a real cryptanalysis workspace
- and the next goal is better analyst throughput rather than first-pass capability
- what should be considered first

The ordering here is intentionally:

1. high impact, low effort
2. high impact, medium effort
3. meaningful but later

## Current Baseline

MCW already ships:

- dedicated `Cryptanalysis` workspace mode
- `Classical`, `Modern`, and `Randomness` sub-modes
- one-bit flip avalanche exploration
- round-aware diffusion matrix and chart when traces support it
- bounded influence heatmap
- candidate-period comparison for Vigenere analysis
- shift confidence and frequency comparison views
- short-pattern randomness heatmap

So the next cryptanalysis work should mostly improve:

- repeatability
- breadth of experiment
- friction of setup
- trust in results

not rebuild first-pass views that already exist.

## Tier 1

### 1. Batch Avalanche Sweep In Product

Impact: Very high
Effort: Low to medium

Add an in-product sweep mode for the existing modern avalanche workspace:

- run all single-bit flips across the selected baseline input
- report:
  - minimum changed bits
  - maximum changed bits
  - average changed bits
  - median
  - spread or standard deviation
- show weakest and strongest flip positions
- allow per-byte or per-word grouping summaries for larger machines

Why first:

- users are already doing this through exported Python
- the current UI proves one-bit diffusion visually, but not systematically
- this is the single clearest bridge from "interesting demo" to "real analysis bench"

### 2. Saved Analysis Cases

Impact: High
Effort: Low

Let a project store named cryptanalysis cases:

- baseline input
- chosen flip bit
- selected sink
- selected source
- optional notes

Why first:

- repeated experiments are currently easy to lose
- saved cases make classroom and design-review workflows much cleaner
- this is a low-risk persistence/UI slice that improves trust and reproducibility

### 3. Better Sink And Source Picking For Modern Analysis

Impact: High
Effort: Low

Promote explicit source and sink selection in the modern analysis surface instead of relying so heavily on "supported path exists" detection.

Include:

- a clear source picker when multiple flippable sources exist
- a clear sink picker when multiple bit outputs exist
- strong empty states when the selected machine is not analyzable

Why first:

- this reduces ambiguity immediately
- it makes larger machines much easier to analyze intentionally
- it reduces the feeling that cryptanalysis is attached to "whatever output MCW guessed"

### 4. Embedded Export Parity Cases

Impact: High
Effort: Low

When Python export is generated, include at least one embedded parity case automatically when the workspace already has the required source/sink configuration.

Why first:

- current exported `verify_parity.py` often has no usable cases
- users are already checking trust by hand
- this is a low-effort trust handoff win

### 5. Weakest-Bit Callout In Avalanche View

Impact: Medium to high
Effort: Low

After a batch sweep exists, highlight:

- weakest input bit positions
- strongest input bit positions
- least responsive output regions

Why first:

- it turns raw sweep numbers into structural clues
- it helps users revise machines rather than only admire metrics

## Tier 2

### 6. Key-Schedule-Focused Analysis View

Impact: Very high
Effort: Medium

Add an analysis mode that treats key evolution as a first-class subject:

- compare round-key outputs across rounds
- show changed-bit counts between adjacent round keys
- show whether a flipped master-key bit spreads broadly or stalls
- allow side-by-side "plaintext flip" vs "key flip" comparison

Why next:

- current modern analysis is strongly plaintext-to-ciphertext oriented
- the product is now being used to design ciphers with nontrivial key schedules
- this is a real analytical gap rather than a nice-to-have

### 7. Round Contribution View

Impact: High
Effort: Medium

Extend the existing round-diffusion line so the user can see not just that rounds spread change, but where the major spread step occurred.

Possible forms:

- delta changed-bits from round to round
- "largest spread jump" marker
- contribution bars

Why next:

- the current chart is useful but still somewhat descriptive
- this would help users understand whether one extra round is doing real work or just polishing the tail

### 8. Comparison Presets For Variant Testing

Impact: High
Effort: Medium

Allow a project to store named machine variants or analysis presets such as:

- with and without round constants
- 4 rounds vs 5 rounds
- baseline permutation vs revised permutation

Why next:

- users are already doing iterative cipher design
- quick variant comparison is one of MCW's strongest natural use cases
- preset-backed comparison reduces setup friction substantially

### 9. Structured Exported-Analysis Script Generation

Impact: Medium to high
Effort: Medium

Export a ready-to-run analysis helper alongside Python export for supported workspaces:

- avalanche sweep
- key-flip sweep
- summary statistics

Why next:

- this keeps MCW honest as a bridge between visual design and scripted analysis
- it complements, rather than replaces, in-product tools

## Tier 3

### 10. Influence Heatmap Expansion

Impact: Medium
Effort: Medium to high

Broaden the bounded influence heatmap so it can:

- handle more source-path shapes
- support larger output grouping modes
- optionally aggregate by byte or lane

This is worthwhile, but it should follow the batch sweep work because the current heatmap is already useful and more demanding infrastructure is needed for broader support.

### 11. Lightweight Differential Trail Exploration

Impact: Medium
Effort: High

This should stay intentionally lightweight and visual:

- chosen input difference
- resulting output difference shape
- repeated across a few selected probes

Not:

- dense attack tables
- solver-like workflows

This is worth exploring later, but not before the basic analyst-throughput problems are solved.

### 12. Key-Schedule Randomness And Bias Checks

Impact: Medium
Effort: High

This would ask:

- do round keys look too similar
- do short patterns repeat
- are some lanes under-mixed

Useful, but likely best after the dedicated key-schedule view exists.

### 13. Linear / Differential Cryptanalysis Suites

Impact: Potentially high
Effort: Very high

This remains explicitly later.

MCW should not jump here before it has:

- strong repeatable sweep tooling
- saved analysis cases
- source/sink clarity
- key-schedule analysis

## Recommended Order

If the goal is maximum cryptanalysis gain per implementation cost, the next sequence should be:

1. batch avalanche sweep in product
2. saved analysis cases
3. explicit source and sink picking
4. embedded export parity cases
5. key-schedule-focused analysis

## Practical Reading

The current cryptanalysis surface is already strong enough to justify these next steps.

The biggest gap is not "more crypto theory."

The biggest gap is:

- repeatable experiment management
- broader automated measurement
- clearer trust handoff between UI and export

That is where the next high-impact work should go.
