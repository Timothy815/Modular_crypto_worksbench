# REFERENCE-LENGTH-ERGONOMICS-V2

Last updated: April 11, 2026

Status: Draft

## Purpose

Define a tighter second-pass decision contract for reference-length ergonomics after the mismatch-helper family, pipeline demos, and role/cueing pass are already in place.

This contract exists to answer one question cleanly:

> Is the remaining friction actually a missing helper primitive, or is it better solved by clearer graph composition and UI guidance around existing fanout?

This is a decision contract first.
It should not be implemented until that question is answered in a bounded way.

## Why V2 Exists

`REFERENCE-LENGTH-ERGONOMICS-V1` identified a real pain point but stayed too abstract about the solution.

The unresolved issues were:
- whether MCW already solves most of the problem through ordinary connection fanout
- whether a new helper would actually reduce cognitive load or simply add one more box
- whether the friction is dataflow friction or graph-reading friction
- whether the proposed helper would secretly introduce a new signal type or hidden policy

V2 narrows the problem and sets a stricter acceptance bar.

## Current Product Baseline

MCW already has:
- explicit reference-driven repair helpers:
  - `Repeat*ToMatch`
  - `Truncate*ToMatch`
  - `Pad*ToMatch`
- explicit strict helpers:
  - `Require*LengthMatch`
- output fanout for visible reference sequences
- pipeline micro demos that show repeated-key and normalization workflows
- role-language and cueing that make bridges, collectors, mismatch helpers, and sinks easier to read

That means the remaining problem is no longer “MCW cannot express this.”

The problem is now:
- graph readability when one reference sequence feeds several alignment branches
- duplicated connection ceremony in visually dense normalization regions
- uncertainty about whether the graph is using the same visible reference intentionally across branches

## Product Problem

Users may now reasonably say:
- “I know which message or block is my visible reference, but this branch fanout is visually noisy.”
- “I want the graph to read as ‘all of these helpers are anchored to this same reference.’”
- “I do not want a magic auto-normalizer, but I do want less accounting clutter.”

The wrong response would be to hide policy.
The right response, if any, must make the existing explicit graph easier to read.

## Core Question

Can MCW improve reference-length ergonomics without:
- inventing a hidden length signal type
- inventing a generic normalize-policy dropdown
- pretending a new helper is solving an engine problem when the real issue is graph legibility

## Strategic Principle

**Do not add a helper unless it improves graph meaning, not just graph population.**

That means:
- fanout by itself is not a sufficient reason for a new primitive
- a new helper is only justified if it makes reference intent easier to understand at a glance
- the mismatch policy must remain downstream and explicit

## Relationship To Existing Work

This contract builds on:
- `MATCH-LENGTH-MISMATCH-HELPERS-V1`
- `REPEAT-TO-MATCH-V1`
- `TRUNCATE-TO-MATCH-V1`
- `PAD-TO-MATCH-V1`
- `REQUIRE-LENGTH-MATCH-V1`
- `PIPELINE-MICRO-DEMOS-V2`
- `PIPELINE-ROLE-LANGUAGE-V1`

This contract supersedes `REFERENCE-LENGTH-ERGONOMICS-V1` as the active framing for this topic.

## Include

V2 should evaluate only these bounded options:

### Option A: No new primitive, stronger composition language

This option says:
- fanout is already enough
- the real fix is better demo patterns, grouping, and inspector wording around “shared visible reference”
- no new module is added

This is the preferred outcome unless a new primitive proves clearly better.

### Option B: A pass-through reference-anchor helper

This option allows one bounded helper family such as:
- `SymbolReferenceAnchor`
- `BitsReferenceAnchor`

or similarly named modules.

Strict requirements:
- input and output remain the same domain and same kind
- the helper is a visible named anchor / pass-through only
- it does not emit a new scalar length value
- it does not choose repeat/truncate/pad/require policy
- it exists only to make shared-reference intent legible in dense pipelines

### Option C: No engine or graph change, only inspector/palette language

This option says:
- add bounded UI language like “shared visible reference” where existing fanout is already doing the right thing
- do not add any new module

## Exclude

Do not include in V2:
- `AutoMatchLength`
- `NormalizeToMatch` with a mode dropdown
- hidden graph rewriting
- any new scalar/integer length signal type
- any operator-level width coercion
- hidden choice among repeat/truncate/pad/require

## Decision Rules

1. **A new helper must preserve type honesty**
- no phantom length type
- no new invisible metadata channel
- no policy baked into the helper

2. **A new helper must improve readability more than it increases box count**
- if the same effect can be achieved more clearly with fanout plus naming/grouping, do not add the helper

3. **The mismatch policy must still be the visually authoritative decision**
- repeat, truncate, pad, and require remain the real policy nodes

4. **Any helper in this space must be pass-through, not interpretive**
- it may anchor, label, or organize
- it may not transform semantics

5. **If evidence is weak, prefer no primitive**
- this is a decision contract
- “do nothing new” is an acceptable successful outcome

## Recommended Evaluation Questions

Before implementation, explicitly answer:

1. In the current repeated-key and normalize-then-XOR demos, where is the actual pain:
- too many wires
- too much visual crossing
- uncertainty about shared reference intent
- or something else

2. Does an anchor helper make the graph easier to read than simple fanout plus stage grouping?

3. Would a named anchor become a reusable teaching pattern, or would it feel like plumbing trivia?

4. Can the same clarity be achieved with inspector language such as:
- `Shared visible reference`
- `Reference reused by 3 mismatch helpers`

without adding a new primitive?

## Likely Success Shapes

This slice is successful if it lands in one of these outcomes:

### Success shape 1: explicit rejection

Conclusion:
- no new primitive is needed
- improve demo composition and inspector guidance only

This is a good result if it is honest.

### Success shape 2: one bounded anchor primitive

Conclusion:
- one pass-through anchor helper is justified
- the helper exists purely to clarify shared-reference intent

This is acceptable only if it remains visually and semantically minimal.

## Exit Criteria

This contract is complete when the team can say one of the following clearly:

1. “The problem was graph readability, not capability; no new primitive is needed.”
2. “One pass-through anchor helper is justified and bounded; the implementation contract can now be opened.”

If neither statement can be defended cleanly, do not implement.

## Explicitly Avoid Next

Do not let this turn into:
- a convenience-first helper that undermines mismatch honesty
- a hidden sequence algebra layer
- a policy multiplexer
- a reaction to wire clutter that should really be solved by layout and grouping

This slice is only about deciding whether a new reference-length helper is genuinely warranted.
