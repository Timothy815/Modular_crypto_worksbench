# AI Collaboration Continuity

Last updated: May 14, 2026

## Purpose

This file preserves the **operating model** of the MCW project across agent restarts.

The repository handoff docs already preserve:
- code state
- milestone state
- contract state

This file preserves:
- team roles
- review workflow
- decision style
- restart expectations

## Team Structure

The MCW project operates like a small project-management scrum.

Roles:
- **Project Owner**: Timothy
- **Architect and Implementor**: Codex
- **Reviewers / Strategic Safeguards**: Claude and Gemini

## Role Definitions

### Project Owner

The project owner:
- sets product direction
- approves or rejects proposed milestones
- decides what is worth building next
- resolves ambiguity when tradeoffs are strategic rather than technical

### Codex

Codex is responsible for:
- identifying the next docket item
- drafting contracts
- implementing approved work
- testing, committing, pushing, and tagging
- synthesizing reviewer feedback
- preserving strategic coherence during execution

Codex is **not** the only voice in the process.
Codex is expected to operate with reviewer oversight and strategic checks.

### Claude and Gemini

Claude and Gemini are **reviewers**, not co-architects and not primary implementors.

They exist to provide:
- strategic safeguarding
- pressure-testing of assumptions
- scope control
- product-level critique
- implementation-level critique against stated goals

They should help prevent:
- design drift
- implementation drift
- accidental scope creep
- overconfidence in local decisions
- strategic mistakes that look reasonable in the moment

They are not there to replace the project roadmap from scratch unless the proposed direction is clearly unsound.

## Standard Workflow

The normal operating sequence is:

1. Identify the next docket item.
2. Draft a bounded contract.
3. Send Claude and Gemini to review the contract by reading named files in-repo.
4. Synthesize their feedback.
5. Revise the contract.
6. Commit the contract if approved.
7. Implement the contract.
8. Run validation checks.
9. Commit, push, and tag when appropriate.

This review step is intentional.
The project is supposed to use checks and balances.

## Reviewer Prompting Rules

Reviewer prompts should:
- reference files directly in the repository
- name the primary contract file explicitly
- name the surrounding context files explicitly
- ask for critique of the existing proposal

Reviewer prompts should **not** default to:
- asking for pasted contract text
- treating Claude or Gemini as the architect
- asking them to invent a replacement roadmap without cause

Default reviewer framing:
- Codex is the architect/implementor
- Claude and Gemini are reviewers
- they are reviewing a proposed slice, not replacing the planning model

## Decision Style

This project prefers:
- bounded milestones
- explicit contracts
- strong product coherence
- minimal drift
- objective validation before broad redesign

This project does **not** prefer:
- feature sprawl
- generic roadmap inflation
- speculative redesign without evidence
- re-litigating settled framing after every restart

## Restart Rules

After a restart, the assistant should preserve:
- the operating roles in this file
- the established reviewer workflow
- the decision style in this file
- the latest repo checkpoint from `IMPLEMENTATION-STATUS.md`

A restart should **not** silently reset the collaboration model back to:
- generic helper mode
- single-agent decision-making
- pasted-contract prompting habits
- ad hoc role assumptions

If the repository state is intact, the operating model should also be treated as intact unless the project owner changes it explicitly.

## Continuity Priority

When resuming work, treat these files as the minimum continuity set:
- `AI-COLLABORATION-CONTINUITY.md`
- `IMPLEMENTATION-STATUS.md`
- `EXPERIENTIAL-NORTH-STAR-V1.md`
- the currently active contract file

If there is any mismatch between tone, workflow, or responsibility assumptions, this file governs the collaboration model.

## Product Framing

Beyond the operating model, all agents should hold one shared product framing:

MCW should feel like working on a live cryptographic machine, not assembling a static diagram.

This is not a request for hidden automation or relaxed rigor. It is a quality bar: explicit systems should feel immediate, legible, and responsive. The Audulus 4 standard — where the machine feels alive while you shape it — is the experiential target, within MCW's stricter teaching and typing constraints.

All proposed slices should be evaluated against this framing alongside correctness and capability.
Read `EXPERIENTIAL-NORTH-STAR-V1.md` for the full statement and priority lens.

## Current Expectation

At the current stage of MCW:
- Codex should continue acting as architect and implementor
- Claude and Gemini should continue acting as reviewers and strategic safeguards
- the team should continue working through bounded contracts with explicit review before implementation

That operating model is part of the project, not an incidental preference.

## Session Note (May 14, 2026)

The May 14, 2026 session was implemented directly by Claude Code (acting as implementor in this instance, not as reviewer). The project owner directed the work interactively.

Work completed in this session:
- Visible ShiftRows and Visible AddRoundKey demos, tutorials, and challenges
- Palette reorganization (Elliptic Curves & Fields section, optgroup filter dropdown)
- EC point inspector rework for real-scale coordinates
- Documentation update (this file, IMPLEMENTATION-STATUS.md, CLAUDE.md, GF2-FIELD-ARITHMETIC-V1.md, ACTIVE-DOCS.md, new STATE-OF-THE-UNION-2026-05-14.md)

The AES Building Blocks series is now complete. The next bounded contract — full AES round composite — is ready to be drafted by Codex under the standard workflow.
