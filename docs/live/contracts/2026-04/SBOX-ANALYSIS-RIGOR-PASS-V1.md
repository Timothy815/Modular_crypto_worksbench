# S-Box Analysis Rigor Pass V1

Last updated: April 30, 2026
Status: Shipped

## Purpose

Tighten the shipped `S-Box Properties` panel so it teaches real local cryptographic reasoning without overstating what an isolated S-box metric can justify.

This slice follows directly from:
- [ANALYSIS-VALIDITY-AUDIT-2026-04-30.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-04/ANALYSIS-VALIDITY-AUDIT-2026-04-30.md)
- [ANALYTICAL-RIGOR-ROADMAP-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-04/ANALYTICAL-RIGOR-ROADMAP-V1.md)

The panel already ships substantial real analysis:
- nonlinearity
- differential uniformity / DDT
- algebraic degree
- fixed points
- bit dependency
- SAC deviation

The goal is not to reduce that depth.

The goal is to keep the depth while making the interpretation more bounded and honest.

## Problem

The current panel has a good technical core, but some consequence language jumps too quickly from:

- local S-box property

to:

- attack-practicality claim
- full-cipher implication
- broad resistance claim

Examples of current drift include language like:

- “recover key bits with far fewer plaintexts than brute force”
- “Biham-Shamir differential cryptanalysis succeeds with a single chosen plaintext pair”
- “solvable in milliseconds by any computer”
- “actively resists the most common attack on block ciphers”

Those statements are directionally motivated by real theory, but they overstate what the isolated panel can prove inside MCW.

The risk is not bad math.

The risk is that students learn to treat a local metric as a direct security or attack verdict.

## Scope

V1 should tighten the shipped panel in these areas:

1. consequence wording
2. local-versus-global boundary language
3. explicit “what this does not prove” framing
4. consistency between the panel and the user manual

This slice should preserve the current metrics and visual structure unless a tiny wording-oriented UI change is needed to make the epistemic boundary visible.

## Non-Goals

This slice does not:

- redesign the full S-box panel
- add many new S-box metrics
- remove legitimate formal metrics already present
- introduce a single overall S-box score
- certify a box as secure or insecure
- judge a full cipher from the S-box panel alone

This is a rigor pass, not a feature-expansion pass.

## Core Questions

This pass must answer:

1. What does each shipped S-box metric actually establish?
2. What does it only suggest?
3. What does it not prove about the surrounding cipher?
4. How do we preserve useful consequence language without sliding into fake certainty?

## Required Changes

### 1. Soften attack-practicality consequence language

Consequence copy should stop short of direct operational claims unless the panel actually establishes them.

V1 should avoid lines that imply:

- guaranteed key recovery
- concrete plaintext complexity
- general attack success
- whole-cipher resistance

unless the statement is framed clearly as:

- local pressure in that attack family
- one contributing factor among several
- a comparative directional cue, not a proof

Good V1 direction:

- “creates stronger linear bias for attackers to exploit”
- “raises the probability of differential propagation through this substitution”
- “keeps the Boolean structure simpler than a higher-degree alternative”

Not:

- “this attack succeeds”
- “the cipher is solvable”
- “this actively resists block-cipher attacks”

### 2. Add an explicit local-boundary statement inside the panel

The existing disclaimer says the measurements describe the table in isolation.

V1 should strengthen that boundary slightly so students cannot miss the point:

- a good-looking S-box does not imply a strong cipher
- a weak local metric does not automatically imply an exploitable whole-cipher break
- surrounding round structure, key schedule, diffusion, and round count still matter

This should remain short and visible.

### 3. Add “what this does not prove” framing

At least one concise panel note should say plainly that the S-box panel does not prove:

- overall cipher security
- attack cost in the full design
- adequacy of round count
- adequacy of the linear layer or key schedule

This should feel like a native part of the analysis surface, not buried help text.

### 4. Keep metric categories honest

The panel currently mixes:

- formal local properties
- heuristic local interpretations
- attack-family relevance

V1 should make that feel more disciplined.

The metrics themselves can stay, but the interpretation should consistently read as:

- “this metric matters because…”
- “in isolation, lower/higher is generally better because…”
- “this still needs surrounding structure to matter in a whole cipher”

### 5. Align the user manual with the shipped rigor standard

The manual entry for `S-Box Properties` should match the panel’s tighter framing.

It should explain:

- what the metrics are
- why they matter locally
- that they do not certify the cipher

The manual should not use stronger or broader claims than the panel itself.

## UX Shape

The panel should feel like:

- a serious local property instrument

not like:

- a security rating card

Good V1 UI moves:

- concise “what this does not prove” line
- more careful consequence wording
- keeping strong formulas but reducing dramatic attack-certainty phrasing

The panel should remain interpretable and motivating.

This slice is not asking for a timid or empty panel.

It is asking for a more honest one.

## Success Criteria

This slice is successful if:

1. the panel still teaches why nonlinearity, differential uniformity, degree, and fixed points matter
2. the panel no longer reads like a direct attack or security verdict
3. students can distinguish local S-box quality from whole-cipher strength
4. the manual and the panel tell the same bounded story

## Likely Implementation Areas

- [src/ui/components/inspector-analyze-details.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/inspector-analyze-details.tsx)
- [src/ui/manual-content.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/manual-content.ts)
- any S-box consequence helpers or related tests if wording behavior is covered

## Follow-On

After this slice, the next rigor pass should likely be:

- `ANALYSIS-RESULT-TAXONOMY-V1`

That pass can unify the product-wide distinction between:

- structural
- behavioral
- statistical
- attack-relevant formal

without overloading this S-box-specific wording pass.
