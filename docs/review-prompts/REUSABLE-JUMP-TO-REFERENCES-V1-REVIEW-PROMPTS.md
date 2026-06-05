# Reusable Jump To References V1 — Review Prompts

Use these prompts as-is.

## Claude Prompt

```text
Review this bounded contract as a product and interaction critic:

- docs/live/contracts/2026-06/REUSABLE-JUMP-TO-REFERENCES-V1.md

Context:
MCW is a visual cryptography workbench used for teaching and experimentation.
It already ships a local authored-reuse model with:
- workspace-scoped reusables by default
- explicit copy-based promotion into a personal library
- immediate dependency visibility
- bounded promote-with-dependencies
- personal-library tags and filtering
- reusable impact summaries that distinguish placed-instance references from reusable-definition references

This new contract proposes the next authored-reuse follow-on: not broader dependency management, but one bounded navigation/actionability slice so authors can jump from a reusable's reference list to the actual local board or referring reusable that currently uses it.

Important recent contract decisions:
- placed-reference jumps are allowed when the target board is already available through MCW's current saved-local session, even if it is not the currently active board
- if a row comes from saved-local summary data but the board is not currently materialized in session state, the row stays visible with a disabled action and explicit reason
- if multiple placed instances of the same reusable exist on one board, V1 jumps to the first matching instance in `project.modules` order
- reusable-definition jumps must invoke the same existing open/edit affordance already used for that reusable kind, not merely filter or highlight the palette

Please focus on:
- whether this is the right next move after read-only reference visibility
- whether the contract stays disciplined as navigation/actionability rather than drifting into replace-reference or package-manager semantics
- whether the jump boundary is honest about what is and is not local/saved/resolvable
- whether the saved-local-summary boundary versus jumpable-in-session boundary is now clear and coherent
- whether the arrival behavior is concrete enough to review and implement
- whether the deterministic `project.modules` first-match rule is specific enough and product-sensible
- whether any requirement is too vague about what should happen for multi-instance boards, detached palettes, or unresolved targets
- whether the acceptance criteria are falsifiable rather than aspirational
- whether any wording accidentally implies recursive browsing, automatic repair, or external-file scanning

Do not spend most of the review on:
- arguing for a larger reusable management system
- speculative bulk replacement workflows
- package publishing, semantic versioning, or team catalogs
- implementation-detail bikeshedding beyond what the contract itself leaves ambiguous

Required output format:
1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. End with one short conclusion:
- acceptable as-is
- acceptable with small edits
- needs contract revision
```
