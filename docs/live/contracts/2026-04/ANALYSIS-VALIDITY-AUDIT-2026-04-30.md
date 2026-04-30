# Analysis Validity Audit

Last updated: April 30, 2026
Status: Active audit note

Related contract:
- [ANALYSIS-VALIDITY-AUDIT-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-04/ANALYSIS-VALIDITY-AUDIT-V1.md)

## Purpose

This is a code-first validity and applicability audit of MCW's shipped analysis surfaces.

It focuses on three questions:

1. what each surface actually measures today
2. when the result is valid enough to interpret
3. what the current UI could cause a student to overclaim

This is not an implementation document.

It is a risk-ranking baseline for the next analytical-rigor slices.

## Method

Reviewed shipped code paths in:

- [src/engine/analysis/output-statistics.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/analysis/output-statistics.ts)
- [src/ui/components/cryptanalysis-panel.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/cryptanalysis-panel.tsx)
- [src/engine/analysis/sbox-analysis.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/analysis/sbox-analysis.ts)
- [src/ui/components/inspector-analyze-details.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/inspector-analyze-details.tsx)
- [src/ui/stage-signal-inspection.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/stage-signal-inspection.ts)
- [src/ui/cryptanalysis.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/cryptanalysis.ts)

## Classification Guide

This audit uses the following result categories:

- `Structural`
- `Behavioral`
- `Statistical`
- `Attack-relevant formal`

And the following epistemic levels:

- `Descriptive`
- `Comparative`
- `Heuristic`
- `Formal`

## Surface Inventory

### 1. Output Statistics

- Category:
  - `Statistical`
- Epistemic level:
  - `Descriptive`
  - `Comparative`
  - partial `Heuristic`

What it measures:
- bit balance and monobit p-value
- entropy over output units
- bucketed frequency distribution with chi-squared p-value
- lag-1 sequential correlation on consecutive values
- scatter-grid visualization of adjacent pairs
- runs test and run-length counts
- key-dependency sanity check

Current strengths:
- the panel already warns that “statistics measure the look of randomness, not the strength of a secret”
- it distinguishes symbol-mode sweep from bit/word sweep
- it has some sample-valid flags
- it includes a key-dependency sanity check, which is an unusually good educational guardrail

Validity/applicability concerns:
- the chi-squared engine uses 256 buckets only when `n / 256 >= 5`, otherwise it drops to 16 coarse buckets
- this is technically safer than always forcing 256 buckets, but the panel does not make the bucket downgrade prominent enough
- `computeByteEntropy` labels output-unit entropy as “byte entropy” in places even when the natural analyzed unit is not literally a byte
- `computeCorrelation` always treats consecutive natural values with Pearson `r`, which is only a narrow linear-dependence view
- `computeRunsUniformity` uses the NIST-style runs p-value with a prerequisite, but the UI does not strongly distinguish “test invalid” from “test merely unimpressive”
- `sampleValid` thresholds exist, but they are inconsistent across tests and not surfaced as a coherent applicability model
- the engine explicitly switches to byte-stream flattening for outputs wider than 30 bits, but the epistemic consequence of that change is not presented as a first-class caveat

What this surface does not prove:
- not cryptographic randomness
- not unpredictability
- not keystream quality
- not cipher strength
- not resistance to known attacks

Main risk:
- the panel is technically rich enough and visually polished enough that students can easily overread it as a “randomness verdict”

Assessment:
- highest current rigor risk in the product

### 2. S-Box Properties

- Category:
  - `Structural`
  - `Attack-relevant formal`
- Epistemic level:
  - mostly `Formal`
  - some `Heuristic` interpretation language

What it measures:
- nonlinearity
- component nonlinearity
- differential distribution / differential uniformity
- algebraic degree
- fixed points
- bit-dependency matrix
- SAC deviation
- lookup/transformation visualization

Current strengths:
- the underlying engine metrics are real and recognizable
- the UI clearly says the measurements describe the S-box “in isolation”
- differential and linear relevance are present, not hidden
- the panel avoids a single fake security score

Validity/applicability concerns:
- the consequence text is often stronger and more categorical than the bounded teaching posture elsewhere in MCW
- example risk: some consequence copy jumps quickly from local metric to attacker capability language
- fixed-point consequences are phrased as if the operational exploitability were broader than the metric alone can justify
- the panel does not yet clearly separate:
  - “local property that matters”
  - from “property sufficient to infer attack practicality”
- SAC is present through bit dependency and deviation, but the product language does not always distinguish it from stronger attack-relevant criteria

What this surface does not prove:
- not whole-cipher security
- not round-function adequacy by itself
- not resistance to differential or linear attacks across the full machine

Main risk:
- not formula invalidity
- overstrong consequence wording relative to what a local S-box metric alone justifies

Assessment:
- second-highest rigor risk, mostly because of interpretation language rather than bad computation

### 3. Randomness Cryptanalysis

- Category:
  - `Statistical`
  - `Behavioral`
- Epistemic level:
  - `Descriptive`
  - `Comparative`
  - `Heuristic`

What it measures:
- sample bit balance
- per-bit entropy over 0/1 counts
- runs and run lengths
- adjacent transition counts
- short-pattern heatmap
- repeated short windows

Current strengths:
- the wording is already noticeably cautious
- many interpretation strings explicitly say “proves little” or “does not certify strength”
- the UI positions this as visible stream-structure analysis, not a security certificate

Validity/applicability concerns:
- this surface is mostly descriptive and does not pretend otherwise, which is good
- however, there are no formal p-values or stronger applicability gates, so a polished visual can still invite more confidence than the metric family deserves
- some labels like “entropy” can still carry more mathematical aura than the implementation supports unless the student reads the help copy closely

What this surface does not prove:
- not cryptographic pseudorandomness
- not unpredictability
- not security of a PRNG or stream cipher

Main risk:
- relatively low compared with `Output Statistics`, because the wording is already guarded

Assessment:
- acceptable as a descriptive teaching surface
- should eventually inherit product-wide taxonomy and validity language

### 4. Modern Cryptanalysis And Round Contribution

- Category:
  - `Behavioral`
- Epistemic level:
  - `Comparative`
  - `Heuristic`

What it measures:
- change spread from single-bit flips
- round-by-round visible diffusion
- round contribution deltas
- bounded influence heatmap

Current strengths:
- the wording is comparatively honest
- the UI already says a plateau “does not prove the machine is weak”
- it encourages asking which rounds add spread rather than just admiring a final total

Validity/applicability concerns:
- this surface is path-specific and case-specific, which is good to say explicitly
- it still lacks a clear product-wide label that this is observed behavioral evidence, not formal security evidence
- the bounded influence heatmap is helpful, but the cap and supported-source constraints are not part of a larger validity model yet

What this surface does not prove:
- not security
- not attack resistance
- not adequacy across all inputs
- not adequacy across all paths

Main risk:
- moderate
- mostly about students overgeneralizing from observed diffusion in a bounded path

Assessment:
- comparatively healthy
- better wording than some other advanced surfaces

### 5. Key Schedule Analysis

- Category:
  - `Behavioral`
- Epistemic level:
  - `Comparative`
  - `Heuristic`

What it measures:
- adjacent explicit round-key differences
- stage-by-stage response to master-key bit flips
- weakest/strongest stage summaries

Current strengths:
- the manual-selection model avoids hidden inference
- the panel explicitly distinguishes this from plaintext avalanche
- it is framed as an observational surface over explicit outputs

Validity/applicability concerns:
- this surface observes only what the user chooses to expose
- that boundary is conceptually sound, but should become part of a product-wide “scope of observation” vocabulary
- weakest/strongest stage labels are useful, but should continue to avoid sounding like full schedule verdicts

What this surface does not prove:
- not full key-schedule security
- not resistance to related-key attacks
- not adequacy of hidden internal schedule structure

Main risk:
- moderate-low
- overgeneralization from explicit terminal stage outputs

Assessment:
- generally sound as a bounded observational panel

### 6. Stage Inspection

- Category:
  - `Structural`
  - `Behavioral`
- Epistemic level:
  - `Descriptive`
  - `Comparative`

What it measures:
- current signal at a selected stage
- immediate visible parents
- bounded same-width direct comparison
- role detail for the selected module

Current strengths:
- the surface is naturally humble
- it already has strong “no trace / no signal / no simple comparison” fallbacks
- it is hard to overread because the scope is local and explicit

Validity/applicability concerns:
- the “role detail” is generic type-language, not full semantic interpretation
- that is acceptable, but the product should keep it that way unless it can justify stronger claims

What this surface does not prove:
- not semantic purpose beyond the local role language
- not global provenance beyond immediate visible inputs

Main risk:
- low

Assessment:
- currently one of the healthiest rigor surfaces in the product

### 7. Other Analyze-Tab Property Panels

Includes:
- LFSR
- Plugboard
- Reflector
- Modulus
- Permutation

- Category:
  - mainly `Structural`
  - with some `Attack-relevant formal` interpretation copy
- Epistemic level:
  - mixed `Formal` and `Heuristic`

Current strengths:
- they connect local property to classroom meaning
- they make hidden assumptions visible

Validity/applicability concerns:
- some consequence text uses strong attacker-language phrasing that may overstate what the isolated property establishes on its own
- these panels do not yet participate in a shared product-wide result taxonomy

What these surfaces do not prove:
- not full-system security
- not practical exploitability by themselves

Main risk:
- lower than `Output Statistics`
- lower than `S-Box Properties`
- but still worth a later consistency pass

## Top Rigor Risks

### 1. Output Statistics can look like a randomness verdict

Why this ranks first:
- it combines multiple statistics, charts, p-values, and a summary label
- it has the highest chance of being mistaken for a general security assessment
- it contains the most sample-size and applicability complexity

Main issue:
- the panel is more statistically subtle than its current validity framing

### 2. S-Box consequence language can overstate local metrics

Why this ranks second:
- the core metrics are good
- the strongest risk is the leap from “good/bad local property” to “attack feasibility” language that sounds more categorical than the evidence alone warrants

### 3. MCW lacks a product-wide result taxonomy

Why this matters:
- different surfaces currently mix structural, behavioral, statistical, and formal results without one shared epistemic language
- that makes it easier for students to treat all analysis outputs as equivalent kinds of evidence

### 4. Validity states are inconsistent across panels

Examples:
- `sampleValid`
- low-confidence badges
- prerequisite failures
- bounded-source restrictions

These exist, but they do not yet feel like one coherent product rule.

### 5. Some local property panels use stronger attack language than the product can consistently support

This is a secondary but real consistency problem.

## Recommended Next Slice

### First

- `OUTPUT-STATISTICS-HONESTY-PASS-V1`

Why first:
- highest misreading risk
- highest concentration of thresholds, approximations, and bucket/sample-size issues
- easiest place for polished charts to outrun technical honesty

### Second

- `SBOX-ANALYSIS-RIGOR-PASS-V1`

Why second:
- the engine is strong
- the main work is interpretive restraint and taxonomy alignment

### Third

- `ANALYSIS-RESULT-TAXONOMY-V1`

Why third:
- after the two highest-risk surfaces are tightened, a taxonomy pass can unify the product vocabulary cleanly

## Bottom Line

MCW's analysis problem is not lack of capability.

It is uneven epistemic discipline.

The product already has enough analytical power to teach real cryptographic reasoning.
The next work should make that power safer and clearer:

- tighten the most statistically fragile surface first
- restrain overstrong interpretation where local metrics are being overread
- then unify the product's language about what kinds of results it is showing

That path will improve rigor more than adding another new metric right now.
