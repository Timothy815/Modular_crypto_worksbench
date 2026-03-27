# Large Workspace UX Triage V1

Last updated: March 27, 2026

Status: Proposed next bounded follow-on after `v1.47.0` (`PALETTE-COHERENCE-V1`).

## Purpose

This contract defines a bounded validation pass on large-workspace usability after the recent learning-path and palette coherence work.

The goal is not to redesign the whole workbench.
The goal is to identify the single highest-leverage workspace-UX pressure point now that MCW has matured into a deeper product.

## Why Now

Recent work improved how MCW explains itself before a user even opens a graph:
- `LEARNING-SEQUENCE-V2` clarified the late teaching arc
- selector/pathfinding polish made demos, tutorials, and challenges easier to find
- `PALETTE-COHERENCE-V1` made the primitive library read more like the product’s machine language

That means the next unresolved product question is no longer:
- can users find the right content?

It is now:
- where does the actual workbench start to strain once the content becomes larger and more system-like?

## Core Question

This slice should answer:
- what is the biggest real friction point when reading, scanning, or manipulating larger MCW workspaces?

Examples of possible answers:
- long horizontal scrolling with weak orientation cues
- difficulty identifying the major substructures in one larger graph
- weak visual emphasis on “main path” versus supporting context
- too much flatness in graphs that are logically phased or layered
- insufficient workspace-level affordances around notes, layout, or focus

This contract does **not** assume which of those is actually the problem.

## Scope

This contract is limited to:
- reviewing the current workbench experience in representative larger demos
- reviewing current workspace affordances already shipped in `src/ui/components/workbench-panel.tsx`
- identifying the strongest current large-workspace usability friction
- translating that friction into one bounded recommended follow-on
- recording the result in an audit-style deliverable

Representative surfaces to review:
- `Visible Block Chaining`
- `Recursive Key Schedule`
- `Visible Tamper Check`
- `Visible Authenticated Encryption`
- `Visible Secure Handshake`

Primary code surfaces to inspect:
- `src/ui/components/workbench-panel.tsx`
- `src/ui/demo-projects.ts`
- any small supporting workspace-state or layout files that materially affect the review

## Product Goal

The workbench should remain:
- explicit
- inspectable
- honest about structure

But larger workspaces should also feel:
- orientable
- scannable
- teachable without excessive manual explanation

This slice exists to find the narrowest improvement that would most increase those qualities.

## Non-Goals

Do not include:
- a generic redesign of the canvas
- React Flow migration or graph-engine replacement
- a minimap feature spree
- zoom/pan controls just because they are common
- a broad styling refresh
- a new tutorial-pathfinding pass
- a new palette taxonomy pass
- new primitives, demos, tutorials, or challenges

## Required Behaviors

1. **Validate before prescribing**
- do not assume the solution before the review is complete

2. **Prefer one bounded next move**
- this slice should end with one primary recommended follow-on, not a broad wishlist

3. **Protect explicit-machine philosophy**
- do not recommend changes that hide structure just to make the canvas look cleaner

4. **Distinguish reading friction from authoring friction**
- note whether a problem affects:
  - scanning an existing demo
  - editing a larger graph
  - teaching from a larger graph

5. **Prefer product-specific judgment over generic UX cargo cult**
- recommendations must be justified by MCW’s actual interaction model, not by “most node editors have X”

## Success Criteria

This contract is successful when:
- it identifies whether large-workspace usability is now the real highest-leverage product friction
- it names the strongest concrete friction in the current workbench, not a vague class of concerns
- it rules out broader redesign pressure where the current surface is already good enough
- it produces one bounded recommended next contract if and only if one is justified

## Suggested Validation Questions

Review the current workbench by asking:
- in the larger shipped demos, is the hardest problem orientation, scanning, editing, or teaching?
- does `Tidy Layout` produce enough structure to support reading larger graphs?
- do annotations actually relieve large-graph pressure, or are they too manual to be the primary answer?
- do tutorial focus and step banners meaningfully compensate for flat canvas structure?
- is the biggest friction inside the canvas itself, or in the lack of workspace-level framing around it?
- does the current workbench already hold well enough that no immediate follow-on is justified?

## Likely Deliverable

The output of this contract should be an audit-style document, likely:
- `LARGE-WORKSPACE-UX-AUDIT.md`

That audit should conclude one of three things:
- no immediate follow-on is needed
- one small bounded workspace-UX slice is justified
- the real next problem is elsewhere, and large-workspace UX should wait

## Relationship To Recent Work

This contract follows:
- `MCW-V2-SANITY-PASS.md`
- `MCW-V2-SANITY-AUDIT.md`
- `LEARNING-SEQUENCE-V2.md`
- selector/pathfinding polish
- `PALETTE-COHERENCE-V1.md`

Those slices improved how users find and classify content.
This slice tests whether the current workbench experience itself now has one clear next pressure point.

## Likely Milestone

If pursued as the next bounded validation slice, this is a good candidate for:
- `v1.48.0` — Large Workspace UX Triage V1
