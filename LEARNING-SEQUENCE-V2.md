# Learning Sequence V2

Last updated: March 26, 2026

Status: Implemented on local `main` after the completed `MCW-V2-SANITY-AUDIT.md`.

## Purpose

This contract defines the next bounded pathfinding pass for MCW after the first shipped sequencing milestone.

The goal is not to replace `LEARNING-SEQUENCE-V1.md`.
The goal is to revise the later teaching spine so the product’s visible learning map matches the depth the workbench now actually supports.

## Why Now

The first sequencing milestone succeeded at the original goal:
- stage labels exist
- ordering exists
- core vs optional labeling exists
- `Best after` and `Recommended next` exist

But the library has now expanded beyond what the first late-stage taxonomy can express cleanly.

The current late arc includes:
- arithmetic expansion
- number theory
- visible shared-secret derivation
- visible integrity/authentication
- visible authenticated encryption
- visible signature verification
- visible handshake composition

Those are no longer one conceptual bucket.

## Product Goal

The learner-facing library should make the late arc legible at a glance.

A user should be able to tell:
- where arithmetic and number theory end
- where integrity/authentication begins
- where asymmetric verification and system composition begin
- which later labs are still core path versus optional analysis side paths

The experience should stay:
- guided, not rigid
- free to explore, not locked down
- explicit, not wizard-driven

## Core Decision

MCW should keep the `V1` sequencing model, but revise the late learning spine and visible grouping labels.

This contract is about:
- better late-stage classification
- better group naming
- better selector/pathfinding clarity

It is not about:
- new content
- hard prerequisites
- a large UI overhaul

## Required Changes

### 1. Split the late learning spine more honestly

The current terminal bucket is too broad.

The revised late path should distinguish at least:
- bounded arithmetic / number theory foundations
- integrity / authentication composition
- asymmetric verification / systems composition

Exact final labels may vary, but the product must stop presenting signatures and the secure handshake as if they are just more `Number Theory`.

### 2. Reclassify shipped late-arc content

Affected shipped lines include:
- `Toy RSA`
- `Diffie-Hellman Key Exchange`
- `Visible Tamper Check`
- `Visible Authenticated Encryption`
- `Visible Signature Verification`
- `Visible Secure Handshake`

These should be assigned to revised stages/groups that reflect their real teaching role rather than their implementation substrate alone.

### 3. Preserve the dependency story

The current `recommendedAfter` links are valuable and should remain.

This pass should preserve or clarify dependency stories such as:
- number theory before shared-secret agreement
- integrity before authenticated encryption
- authenticated encryption before signature follow-on if that remains the intended bridge
- signature verification before the secure handshake

### 4. Improve selector clarity, not just sort order

The workbench and tutorial/challenge selectors should surface the revised grouping model clearly enough that users do not need prior product knowledge to find the right late-stage family.

This pass may include:
- revised group names
- revised stage labels
- revised group sorting

This pass should not require:
- hard locks
- nested folder trees
- account/course machinery

## Non-Goals

Do not include:
- new demos, tutorials, or challenges
- new primitives
- certificate chains or PKI
- large-workspace navigation systems
- palette redesign unrelated to learning-path clarity

## Success Criteria

This contract is successful when:
- the late library no longer feels like one terminal bucket
- integrity/authentication and systems-composition lines read as distinct teaching families
- the handshake line is discoverable without already knowing where it lives
- the current product breadth feels better organized without adding heavy workflow machinery

## Likely UI Surfaces

Primary surfaces:
- `src/ui/learning-sequence.ts`
- demo/tutorial/challenge metadata
- workbench group/workspace selector
- tutorial and challenge grouping selectors

Secondary surfaces, only if needed:
- project context labels
- palette wording where it directly supports the revised pathfinding story

## What To Avoid

Avoid:
- treating this as a cosmetic renaming pass only
- creating many tiny stages that feel bureaucratic
- moving optional analysis lines into the main path without justification
- using new group labels that hide explicit machine structure behind vague curriculum language

## Relationship To The V2 Sanity Pass

This is the one bounded follow-on justified by `MCW-V2-SANITY-AUDIT.md`.

It should be treated as:
- a product-organization fix
- not a new capability family
- not a broad `v2.0` rewrite
