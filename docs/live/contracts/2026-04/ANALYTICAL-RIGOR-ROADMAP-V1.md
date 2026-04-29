# Analytical Rigor Roadmap V1

Last updated: April 29, 2026
Status: Active roadmap note

## Purpose

Define the next product lane for making MCW's analysis surfaces more technically disciplined, more validity-aware, and harder to misread.

This roadmap assumes the current code-first baseline is true:
- analysis surfaces already exist
- inspection depth already exists
- the next problem is not "can MCW measure things at all"
- the next problem is whether those measurements are framed honestly and used rigorously

This is not a release promise.

It is a prioritization and evaluation frame for future slices.

## Why This Lane Exists

MCW is already capable enough that students can produce convincing-looking outputs and analysis results.

That creates a new risk:
- a technically weak or underspecified metric can look authoritative
- a local result can be mistaken for a global cryptographic claim
- a visually strong panel can over-teach confidence instead of judgment

If MCW wants to serve serious students, its analysis surfaces must increasingly distinguish:
- observation
- heuristic interpretation
- formal property
- unsupported conclusion

Analytical rigor is the product discipline that protects that boundary.

## North Star

MCW should help students answer:

- what exactly is being measured
- under what assumptions is this result meaningful
- what does this result suggest
- what does this result not prove
- what would I test next

That is the standard.

The goal is not to turn MCW into a research suite.

The goal is to make every shipped analysis surface honest enough that it teaches disciplined reasoning rather than cargo-cult confidence.

## Product Outcome

A serious student using MCW should be able to:

1. identify whether a result is structural, behavioral, statistical, or attack-relevant
2. tell whether the sample size or applicability conditions are adequate
3. explain the result in bounded language
4. compare two machines or two variants without overclaiming
5. choose a sensible next test rather than stop at the first strong-looking number

If MCW reliably teaches that behavior, its analysis surfaces are rigorous enough to trust as teaching tools.

## Current Strengths

MCW already has:

- meaningful cryptanalysis surfaces
- stage and signal inspection
- output statistics
- substantial S-box property analysis
- guided labs and comparison-oriented content

That means the product does not need to invent rigor from scratch.

It needs to audit, refine, classify, and explain what is already there.

## Current Risks

The main rigor risks are:

1. validity drift
- a metric is computed outside the regime where it is trustworthy

2. interpretation drift
- a descriptive result is read as an attack-relevant result

3. score drift
- a summary label or aggregate score implies more certainty than the inputs justify

4. product inconsistency
- one panel is careful and bounded while another sounds categorical

5. hidden incompleteness
- the product shows a metric but does not say what companion metric is missing

## Priority Order

Analytical rigor work should be prioritized in this order:

1. validity and applicability auditing
2. output-statistics honesty pass
3. S-box analysis rigor pass
4. product-wide result taxonomy
5. comparison-first interpretation workflows

## Priority 1: Validity And Applicability Audit

### Goal

Every analysis surface should say:

- what it measures
- what inputs or conditions it expects
- when the result is invalid, undersampled, approximate, or only comparative

### Required Improvements

- add explicit validity conditions to every major analysis panel
- define minimum sample thresholds where applicable
- distinguish unavailable from invalid from approximate from descriptive
- make preconditions visible before or beside results, not buried in help text

### Success Test

A student can tell whether a result is valid enough to use before they start interpreting it.

## Priority 2: Output Statistics Honesty Pass

### Goal

Make the `Output Statistics` panel technically sound enough that it teaches careful statistical reading rather than fake-randomness confidence.

### Required Improvements

- review and tighten formulas where needed
- add sample-size gates and bucket-count applicability limits
- distinguish natural-width value analysis from packed-byte analysis
- prevent invalid tests from quietly producing authoritative-looking numbers
- explicitly label descriptive versus inferential summaries

### Success Test

A student cannot easily mistake "looks balanced on this sweep" for "cryptographically random."

## Priority 3: S-Box Analysis Rigor Pass

### Goal

Keep S-box analysis educationally powerful without implying that a strong-looking S-box implies a strong cipher.

### Required Improvements

- audit which S-box metrics are already present and how they are framed
- ensure differential and linear relevance are not underemphasized if weaker proxies are shown prominently
- add bounded "what this does not prove" language to local-property summaries
- avoid fake security scores or weakly justified aggregate labels

### Success Test

A student can explain why a good S-box profile matters and still correctly state that it does not certify the full cipher.

## Priority 4: Analysis Result Taxonomy

### Goal

Give MCW a consistent product-wide language for the kinds of results it reports.

### Required Improvements

Introduce and use a bounded classification system such as:

- `Structural`
- `Behavioral`
- `Statistical`
- `Attack-relevant formal`

Each analysis surface should make clear which category its results belong to.

### Success Test

Students stop treating every analysis output as if it carried the same epistemic weight.

## Priority 5: Comparison-First Interpretation

### Goal

Teach rigor through contrast rather than through isolated verdicts.

### Required Improvements

- emphasize before/after and weak/stronger comparison paths
- encourage interpretation in terms of deltas, not just isolated levels
- make "what changed?" central to analytical reading
- connect labs and guided content to explicit comparison questions

### Success Test

Students become more likely to compare variants and less likely to stop at a single flattering result.

## Recommended Near-Term Slices

If this lane becomes active work, the best next bounded sequence is:

1. `ANALYSIS-VALIDITY-AUDIT-V1`
- cross-panel validity/applicability audit

2. `OUTPUT-STATISTICS-HONESTY-PASS-V1`
- formulas, thresholds, sample-size gates, and wording

3. `SBOX-ANALYSIS-RIGOR-PASS-V1`
- metric framing, omissions, and interpretation limits

4. `ANALYSIS-RESULT-TAXONOMY-V1`
- unify labels across analysis surfaces

These slices are higher-value than adding another flashy metric before the current ones are fully honest.

## Non-Goals

This roadmap is not a call to:

- turn MCW into a research cryptanalysis platform
- flood the product with academic tables without explanation
- replace guided intuition with dense formalism
- claim security where only local properties are measured

The goal is disciplined educational rigor, not maximal metric count.

## Evaluation Standard

Future analysis work should be judged against these questions:

- does this make the result more technically honest
- does this make the applicability boundary clearer
- does this reduce the chance of overclaiming
- does this help students reason about what to test next

If a slice adds metrics but weakens interpretive discipline, it should not count as progress in this lane.

## True Success

MCW can claim analytical rigor as a real strength when:

- its analysis surfaces are technically defensible at the level they claim
- their limitations are visible in-product
- their language clearly separates observation from conclusion
- and students learn to use them as part of a disciplined investigative process

At that point MCW is not merely interestingly analytical.

It becomes a product that trains careful cryptographic judgment.
