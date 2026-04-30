# Output Statistics Honesty Pass V1

Last updated: April 30, 2026
Status: Open

## Purpose

Tighten the shipped `Output Statistics` analysis so it teaches careful statistical reading instead of inviting students to treat it like a randomness verdict.

This slice follows directly from:
- [ANALYSIS-VALIDITY-AUDIT-2026-04-30.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-04/ANALYSIS-VALIDITY-AUDIT-2026-04-30.md)
- [ANALYTICAL-RIGOR-ROADMAP-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-04/ANALYTICAL-RIGOR-ROADMAP-V1.md)

The panel already exists and is useful.

The goal is not to redesign it from scratch.

The goal is to make its formulas, gates, labels, and fallback states more technically honest.

## Problem

The current panel mixes:

- p-values
- entropy
- frequency histograms
- sequential correlation
- runs analysis
- summary copy

into one polished surface.

That is powerful, but it creates a risk:

- a student can read the panel as a general randomness or security verdict
- an invalid or downgraded test can still look authoritative
- a descriptive statistic can be mistaken for an inferential result

The code already contains several good safeguards, but the epistemic boundaries are not surfaced clearly enough.

## Scope

V1 should tighten the existing panel in these areas:

1. validity-state clarity
2. sample-size and applicability messaging
3. natural-width versus byte-flattened analysis clarity
4. wording of summary and per-section interpretation
5. downgrade visibility for coarse-bucket or low-sample paths

This slice should not add many new statistics.

It should make the current ones safer and clearer.

## Non-Goals

This slice does not:

- attempt to certify randomness
- add heavy new statistical tests
- turn the panel into a research-quality randomness suite
- redesign the overall cryptanalysis workspace
- replace the current educational charts with dense academic tables

## Core Questions

This pass must answer:

1. Which results are valid enough to interpret?
2. Which are only descriptive at the current sample size?
3. When is the panel silently operating in a downgraded mode?
4. How do we make those boundaries visible before the student overreads the result?

## Required Changes

### 1. Make validity states explicit and consistent

Each section should distinguish clearly between:

- `valid`
- `low sample`
- `downgraded`
- `prerequisite failed`
- `not applicable`

This should not be buried in paragraph copy.

It should appear directly in the section label, status chip, or prominent note.

### 2. Make coarse-bucket downgrades visible

The frequency section currently falls back from full 256-bucket behavior to coarse buckets when expected counts are too low.

V1 should:

- make the fallback visible in the UI
- explain what was downgraded
- explain what that means for interpretation

The student should not mistake a coarse histogram for a full-byte frequency test.

### 3. Make byte-flattening explicit for wide outputs

The engine flattens outputs wider than 30 bits into byte streams for entropy, frequency, correlation, and scatter.

V1 should:

- explain that this is a byte-level projection of a wider output
- make it visible that the test is no longer operating on one whole output word as a single symbol
- avoid wording that implies “full output randomness” when the panel is actually analyzing projected byte units

### 4. Tighten wording around entropy and correlation

Entropy and serial correlation need clearer bounded phrasing.

V1 should avoid:

- language that sounds like a security grade
- language that implies unpredictability
- language that implies broad randomness from one descriptive result

Instead, it should reinforce:

- what the measure is actually about
- what that measure misses

### 5. Strengthen runs-test fallback messaging

The runs test already has a prerequisite and a sample threshold.

V1 should make it obvious whether:

- the prerequisite failed
- the sample is too small
- the test ran and produced a result

These states should not collapse into a generic “n/a” feel.

### 6. Replace any verdict-like aggregate feel with bounded profile language

If the current panel’s summary or label reads like a broad verdict, V1 should soften it.

The panel should describe:

- visible structure
- near-uniform appearance
- obvious imbalance
- strong local dependence

It should not sound like:

- random
- secure
- statistically strong

unless the wording is explicitly bounded to the observed sample and statistic family.

## UX Shape

The panel should feel like:

- a careful lab instrument

not like:

- a certification dashboard

Good V1 UI moves:

- clearer status chips
- stronger section subtitles
- concise “what this does not prove” lines where needed
- explicit coarse-mode and wide-output notices

The surface should remain readable and visual.

## Success Criteria

This slice is successful if:

1. a student can tell when a section is downgraded or invalid
2. a student can tell when a test is byte-level over a projected wide output
3. the panel no longer reads like a general randomness verdict
4. the output remains useful for comparison and structure-spotting

## Likely Implementation Areas

- [src/engine/analysis/output-statistics.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/analysis/output-statistics.ts)
- [src/ui/components/cryptanalysis-panel.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/cryptanalysis-panel.tsx)
- associated tests for output-statistics behavior and UI-state wording where applicable

## Follow-On

After this slice, the next likely rigor pass should be:

- `SBOX-ANALYSIS-RIGOR-PASS-V1`
