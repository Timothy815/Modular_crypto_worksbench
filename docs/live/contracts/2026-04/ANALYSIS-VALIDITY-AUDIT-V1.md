# Analysis Validity Audit V1

Last updated: April 29, 2026
Status: Shipped

## Purpose

Run a code-first validity and applicability audit across MCW's shipped analysis surfaces so the product can distinguish:

- valid from invalid
- descriptive from inferential
- local evidence from broader cryptographic conclusion
- useful comparison from misleading authority

This is the first bounded execution step under `ANALYTICAL-RIGOR-ROADMAP-V1.md`.

It is an audit-and-triage slice, not an implementation slice.

## Why This Slice Exists

MCW already ships meaningful analysis panels:

- `Randomness`
- `Modern`
- `Key Schedule`
- `Output Statistics`
- `Stage Inspection`
- `S-Box Properties`
- other local Analyze-tab property panels

That is enough surface area that rigor drift is now a real product risk.

If a panel computes a statistic outside its valid regime, or uses language that implies more certainty than the result deserves, students can learn the wrong lesson even when the underlying code is technically working.

The next step should therefore be:

- inventory what is currently measured
- identify the validity boundary for each surface
- identify the most consequential misleading interpretations currently possible
- rank the next honesty passes by risk

## Scope

This audit covers shipped analysis surfaces that make interpretive or quasi-formal claims.

V1 should review at minimum:

1. `Output Statistics`
2. `S-Box Properties`
3. `Randomness` cryptanalysis
4. `Modern` cryptanalysis and round-contribution framing
5. `Key Schedule` analysis
6. `Stage Inspection` role / provenance / comparison language
7. other Analyze-tab property panels where the UI uses consequence or attack-language framing

Examples:
- LFSR
- Plugboard
- Reflector
- Modulus
- Permutation

## Non-Goals

This slice does not:

- implement formula changes
- change shipped UI wording directly
- redesign any analysis panel
- add new statistics
- add a product-wide taxonomy yet
- attempt a full academic review of every metric in the product

That comes after the audit identifies which risks matter most.

## Core Questions

The audit must answer:

1. What does each surface actually measure today?
2. Under what assumptions or applicability conditions is that result meaningful?
3. What does the current UI imply that the result does not strictly justify?
4. Which panels are safest as descriptive/comparative teaching tools?
5. Which panels most urgently need an honesty or validity pass?

## Required Output

The audit output should produce a concrete review document containing:

1. a surface-by-surface inventory
- panel or surface name
- what it measures
- whether the result is best classified as:
  - `Structural`
  - `Behavioral`
  - `Statistical`
  - `Attack-relevant formal`
- whether the result is:
  - descriptive
  - comparative
  - heuristic
  - formal

2. a validity / applicability note for each surface
- required inputs
- sample-size or shape assumptions where applicable
- known invalid or weak regimes

3. a “what this does not prove” note for each surface
- stated plainly
- not academic filler

4. a top-risk ranking
- the three to five most consequential rigor risks in the current product
- ranked by student-mislearning risk, not by implementation difficulty

5. a next-slice recommendation
- identify which single honesty pass should come first
- identify which should follow second

## Expected Review Standard

This audit should be code-first and skeptical.

It should not:

- assume the contract memory is accurate
- assume a panel is weak just because it sounds advanced
- assume a panel is safe just because it already exists

It should inspect:

- formulas where they matter
- thresholds and gates where they matter
- wording where it shapes interpretation
- fallback behavior where invalidity should be surfaced

## Visual / UX Focus

The audit is not just about formulas.

It must also review the epistemic shape of the UI:

- does the panel look more certain than it is
- is invalidity visible enough
- does a “summary” behave like a hidden score
- are caution notes prominent or buried
- is the student being taught what the next sensible test would be

## Deliverable Shape

The output should likely become a dated audit note, not a long-lived evergreen contract.

Recommended format:

- one audit document in `docs/live/contracts/2026-04/`
- concise per-surface sections
- explicit top-risk shortlist
- explicit next-action recommendation

## Success Criteria

This slice is successful if it produces:

1. a trustworthy code-first rigor baseline for current analysis surfaces
2. a ranked list of the most important misleading or invalid-result risks
3. a clear recommendation for the next implementation slice

It is not successful if it merely restates that “rigor matters” without telling us where the most important product risks actually are.

## Likely Immediate Follow-On

The most probable follow-on after this audit is:

- `OUTPUT-STATISTICS-HONESTY-PASS-V1`

unless the audit shows that another surface carries higher student-mislearning risk.
