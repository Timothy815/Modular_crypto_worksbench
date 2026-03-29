# CRYPTANALYSIS-VISUALS-V1

Status: Proposed

Owner: Codex
Scope: UI / Analysis Surface / Product Legibility

## Why

MCW already has substantial cryptanalysis capability:
- classical text statistics
- repeated-fragment and period reasoning
- per-column frequency matching
- modern avalanche exploration
- round-aware diffusion summaries

What it still lacks is stronger visual interpretation.

Students can already compute useful evidence, but some of the most important questions still require too much scanning:
- which candidate period really stands out?
- which shifted column guess is strongest?
- where does diffusion increase sharply?
- which input bits are weak or strong influencers?

The next step should not be "more cryptanalysis families."
It should be better visual reading of the cryptanalysis already present.

## Goal

Add a bounded first visual-upgrade pass to the existing `Cryptanalysis` workspace so that both classical and modern analysis become easier to interpret at a glance.

This slice should strengthen:
- statistical readability
- pattern recognition
- structural diagnosis

without turning cryptanalysis into a dashboard farm or a math-heavy chart suite.

## Product Boundary

This slice extends the existing `Cryptanalysis` workspace only.

It does not:
- create a new workspace mode
- create a new detached surface
- add a new cryptanalysis family
- add automatic attack/search tooling

It should remain a visualization refinement of already-shipped workflows.

## Required V1 Shape

1. Modern cryptanalysis must gain at least one stronger aggregate visualization over the current aligned bit strips.
2. Classical cryptanalysis must gain at least one stronger candidate-comparison visualization over the current text/list presentation.
3. All new visuals must be derived from existing transparent metrics already computed by MCW, not from opaque new scoring systems.
4. The visual order must still favor intuition first:
   - visible pattern
   - compact metric support
   - textual explanation
5. New visuals must remain lightweight enough to fit inside the current cryptanalysis panel architecture.
6. No third-party charting library is required in V1 unless implementation proves the native DOM/CSS/SVG path genuinely inadequate.

## V1 Priority Visuals

### 1. Round Diffusion Chart

For modern analysis, add a compact chart that shows diffusion by round.

Minimum useful form:
- x-axis: round / stage order
- y-axis: changed-bit count or changed-bit percent

Purpose:
- make weak vs strong diffusion growth obvious
- show where spread accelerates
- make different constructions easier to compare visually

### 2. Input-to-Output Influence Heatmap

For modern analysis, add a bounded influence view that shows how individual input-bit flips affect output bits.

Bounded V1 rule:
- use a sweep over the available input bit positions
- show a simple matrix/heatmap of changed output positions
- stay within currently supported modern-analysis source/output compatibility rules

Purpose:
- reveal asymmetry
- reveal weak input positions
- make diffusion structure visible beyond one manually chosen flip

### 3. Candidate Period Comparison Plot

For classical analysis, add a visual comparison for period candidates.

Minimum useful form:
- candidate period on one axis
- IOC and/or support count visible per candidate

Purpose:
- reduce scan cost versus list-only period reasoning
- make standout candidate periods easier to notice

### 4. Frequency Residual / Confidence View

For classical analysis, add one stronger visual aid for per-column shift choice.

Allowed forms:
- residual bars (observed minus expected)
- top-shift score comparison bars
- confidence-gap bars between best and second-best shifts

Purpose:
- make "this shift is plausibly right" easier to read
- reduce reliance on eyeballing raw overlaid frequency bars alone

## Explicit Non-Goals

- No new attack families
- No linear/differential cryptanalysis suite
- No automatic solver
- No cryptanalysis scripting surface
- No generic arbitrary chart dashboard
- No large plotting dependency by default
- No detached cryptanalysis window expansion as part of this slice

## UX Rules

- New visuals must remain subordinate to the existing educational reading flow.
- Every visual must answer a concrete analysis question, not merely decorate the panel.
- When a visual uses a score or derived metric, that metric must already be explainable from current MCW analysis logic.
- Visuals should help students compare possibilities, not silently choose answers for them.
- The panel should remain readable on a normal desktop layout without forcing a second monitor.

## Implementation Guidance

Prefer:
- CSS/SVG bars
- simple matrix cells
- compact labeled charts

Avoid:
- generic chart framework adoption unless clearly necessary
- large abstract legends disconnected from the task
- visuals that require scrolling past the explanatory context that gives them meaning

## Suggested Implementation Order

1. Round diffusion chart
2. Candidate period comparison plot
3. Frequency residual/confidence view
4. Input-to-output influence heatmap

This order gives immediate value while keeping complexity bounded.

## Success Condition

This slice is successful if:
- students can identify likely period candidates faster
- students can read shift confidence more easily
- modern-analysis users can see diffusion growth without manually scanning row by row
- modern-analysis users can detect structural asymmetry or weak influence patterns more clearly
- cryptanalysis feels more interpretable without becoming more intimidating

## Notes

The guiding principle is:

MCW should make statistical evidence visible, not merely available.

The next cryptanalysis win is not more algorithms.
It is better visual understanding of the algorithms and evidence already present.
