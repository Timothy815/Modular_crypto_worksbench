# DETACHED-WORKSPACE-WINDOW-REVIEW-V1

Last updated: April 24, 2026

Status: Review brief for Claude and Gemini

## Review Target

Review the contract:

- [DETACHED-WORKSPACE-WINDOW-V1.md](./DETACHED-WORKSPACE-WINDOW-V1.md)

This is a bounded review of the detached workspace window slice.

It is not a request to reopen:

- generic workspace-as-system composition
- arbitrary multi-window shells
- broad persistence redesign

## Context

MCW already has:

- tabbed workspaces in the main shell
- detached palette / inspector / learning windows
- local persistence of the full workspace session

The product need now is:

- show one workspace in a second live window
- keep the main app authoritative
- support “edit here, watch there” workflows for larger systems

## Review Questions For Both Reviewers

Please evaluate:

1. Is this the right bounded next slice for the user need?
2. Does the contract clearly separate a detached live workspace view from a second independent app instance?
3. Is the host-authoritative rule strong enough to prevent ambiguous ownership of state?
4. Is the scope narrow enough to avoid accidental multi-window sprawl?
5. Are the acceptance criteria concrete enough to guide implementation and review?

## Claude Review Ask

Claude should review this as a product and interaction critic.

Focus on:

- whether the contract identifies the real user workflow clearly
- whether the detached workspace concept is understandable to a normal MCW author
- whether the slice stays calm and bounded instead of turning into a full window-manager redesign
- whether the UX constraints are clear enough to prevent confusing “is this the same workspace or a copy?” behavior

Claude should prioritize:

- user mental model
- interaction clarity
- product scope discipline

Claude should not spend most of the review on:

- broad future system-composition ideas
- freeform multi-monitor wishlist items
- implementation details not implied by the contract

## Gemini Review Ask

Gemini should review this as a systems and boundary critic.

Focus on:

- whether host-authoritative detached workspace sync is technically coherent with the current app
- whether the contract is explicit enough about avoiding split-brain localStorage ownership
- whether the proposed slice fits the existing detached-window and query-param boot architecture
- whether any hidden state-consistency, persistence, or command-routing risks should be called out

Gemini should prioritize:

- state ownership correctness
- architectural coherence
- hidden edge cases
- implementation safety

Gemini should not spend most of the review on:

- broad roadmap debates
- speculative full-shell rewrites
- unrelated workspace-composition theory

## Required Output Format

Both reviewers should return:

1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. A short conclusion last:
- `acceptable as-is`
- `acceptable with small edits`
- `needs contract revision`

## Explicit Review Standard

This contract passes review when both reviewers can reasonably agree that:

- it solves the real dual-workspace authoring problem
- it does not create ambiguous state ownership
- it stays bounded to one honest detached-workspace slice
- it gives implementation enough structure to reuse the current detached-window model instead of inventing a parallel one
