# SBOX-EDITOR-STABILITY-POLISH-REVIEW-V1

Last updated: April 21, 2026

Status: Review brief for Claude and Gemini

## Review Target

Review the implementation of:
- [SBOX-EDITOR-STABILITY-POLISH-V1.md](./SBOX-EDITOR-STABILITY-POLISH-V1.md)

This is a bounded review of the S-box editor stability/polish slice.

It is not a request to reopen the whole S-box roadmap.

## Context

Recent S-box work added:
- explicit `6 -> 4` support
- DES-style layout handling
- AES and DES seeded examples

The product concern now is stability and feel:
- does the editor behave like one stable board?
- do the old `4 -> 4` and `8 -> 8` workflows still feel calm and dependable?
- does `6 -> 4` feel honest without infecting the square-grid flows with fragility?

## Review Questions For Both Reviewers

Please evaluate:

1. Does the S-box editor now avoid invalid intermediate states during normal shape changes?

2. Does the visible UI expose only the decisions the user actually needs?

3. Does the editor preserve the old square-grid feel for `4 -> 4` and `8 -> 8`?

4. Does the `6 -> 4` path stay honest without adding conceptual noise to the square-grid flows?

5. Is the remaining helper copy actually useful, or is any of it still redundant?

6. Are there any obvious behavioral regressions in:
- export
- analysis
- direct table editing
- generated/seeded board resets

## Claude Review Ask

Claude should review this as a product-facing implementation critic.

Focus on:
- whether the editor now feels coherent to use
- whether the interaction model is simpler than the previous width-field version
- whether the copy is still too chatty anywhere
- whether shape change behavior should remain silent reseeding or move toward a confirmation pattern later

Claude should prioritize:
- UX coherence
- user confusion risks
- interaction friction

Claude should not spend most of the review re-arguing:
- whether `6 -> 4` should exist at all
- whether more S-box families should be added now

## Gemini Review Ask

Gemini should review this as a systems and boundary critic.

Focus on:
- whether the hidden-width / visible-shape split is technically coherent
- whether any invalid-state seams remain
- whether there are export or validation mismatches still hiding under the UI
- whether the board reseeding model introduces any subtle consistency risk across analysis, execution, persistence, or tests

Gemini should prioritize:
- state-transition safety
- model/UI consistency
- hidden edge cases
- future maintainability

Gemini should not spend most of the review re-arguing:
- broad roadmap questions
- unrelated S-box theory expansions

## Required Output Format

Both reviewers should return:

1. Findings first, ordered by severity
2. Concrete file/behavior references where possible
3. Open questions second
4. A short conclusion last:
- `acceptable as-is`
- `acceptable with small follow-up`
- `needs another implementation pass`

## Explicit Review Standard

This slice passes review when both reviewers can reasonably agree that:
- the editor is harder to break than the earlier width-param version
- the square-grid flows remain intact
- the `6 -> 4` flow is honest and bounded
- the visible UI is calmer, not more elaborate

If a reviewer wants a follow-up, it should stay bounded.

Good examples:
- add confirmation before destructive shape reseed
- remove one more redundant chip
- tighten one remaining DES explanation

Bad examples:
- redesign the whole S-box system
- reopen generalized constructor breadth
- propose a new broad roadmap under the guise of review
