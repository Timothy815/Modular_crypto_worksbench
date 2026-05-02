# Large Workspace UX Triage V1

Last updated: March 27, 2026

Status: Shipped on `main`.

## Purpose

This contract defines a bounded validate-then-implement pass on large-workspace usability after the recent learning-path and palette coherence work.

The goal is not to redesign the whole workbench.
The goal is to identify the single highest-leverage workspace-UX pressure point now that MCW has matured into a deeper product, and implement one bounded fix if that pressure point is confirmed.

## Why Now

Recent work improved how MCW explains itself before a user even opens a graph:
- `LEARNING-SEQUENCE-V2` clarified the late teaching arc
- selector/pathfinding polish made demos, tutorials, and challenges easier to find
- `PALETTE-COHERENCE-V1` made the primitive library read more like the product’s machine language

That means the next unresolved product question is no longer:
- can users find the right content?

It is now:
- where does the actual workbench start to strain once the content becomes larger and more system-like?

## Why This Is Now Justified

`MCW-V2-SANITY-AUDIT.md` already evaluated large-workspace usability and concluded that it was:
- a real future pressure point
- not yet the highest-leverage next fix at that time

That earlier decision was correct.

What changed since then:
- the learning-library reorganization line was implemented
- selector/pathfinding polish was implemented
- primitive-palette coherence was implemented

Those were the two higher-leverage cohesion fixes identified ahead of workspace UX.

Large-workspace usability is therefore no longer an arbitrary new concern.
It is now the remaining unvalidated pressure point from the original post-`v1.44.0` cohesion audit.

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
But it also should not stop at another standalone audit if a bounded fix is clearly justified.

## Scope

This contract is limited to:
- validating the current workbench experience in representative larger demos
- reviewing current workspace affordances already shipped in `src/ui/components/workbench-panel.tsx`
- identifying the strongest current large-workspace usability friction
- implementing at most one bounded fix if that friction is clearly justified
- otherwise recording the result in status docs and closing the line without a standalone release milestone

Representative surfaces to review:
- `Visible Block Chaining`
- `Recursive Key Schedule`
- `Visible Tamper Check`
- `Visible Authenticated Encryption`
- `Visible Secure Handshake`

For this contract, "large workspace" means a shipped workspace with roughly 18+ modules or a multi-path system composition that requires reading multiple visible substructures, not merely a small graph with one awkward local layout.

Primary code surfaces to inspect:
- `src/ui/components/workbench-panel.tsx`
- `src/ui/demo-projects.ts`

Secondary supporting surface:
- `src/ui/workbench-document.ts`

No additional code files are in scope for the initial validation pass unless the confirmed bounded fix requires them.

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

If a concrete pressure point is confirmed, this slice should ship that narrowest improvement immediately instead of creating another standalone contract first.

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
- more than one bounded workspace fix

## Required Behaviors

1. **Validate before prescribing**
- do not assume the solution before the review is complete

2. **Prefer one bounded next move**
- this slice should end with one primary recommended follow-on, not a broad wishlist
- if implementation is justified, ship only one bounded fix

3. **Protect explicit-machine philosophy**
- do not recommend changes that hide structure just to make the canvas look cleaner

4. **Distinguish reading friction from authoring friction**
- note whether a problem affects:
  - scanning an existing demo
  - editing a larger graph
  - teaching from a larger graph

5. **Prefer product-specific judgment over generic UX cargo cult**
- recommendations must be justified by MCW’s actual interaction model, not by “most node editors have X”

6. **Use an explicit review protocol**
- for each representative workspace, attempt:
  - locate the final output module from the initial viewport
  - trace backward from the output to the first key or protocol-material source
  - identify the major visible substructures such as encryption path, verification path, key derivation path, or framing path
- note where those tasks require scrolling, repeated manual search, or orientation recovery

7. **Keep implementation gated**
- if no single bounded fix is clearly justified, do not force implementation just to produce a milestone

## Success Criteria

This contract is successful when:
- it identifies whether large-workspace usability is now the real highest-leverage product friction
- it names the strongest concrete friction in the current workbench, not a vague class of concerns
- it rules out broader redesign pressure where the current surface is already good enough
- it produces and implements one bounded fix if and only if one is justified
- if no fix is justified, it records that result in `IMPLEMENTATION-STATUS.md` rather than pretending the investigation itself is a release milestone

## Suggested Validation Questions

Review the current workbench by asking:
- in the larger shipped demos, is the hardest problem orientation, scanning, editing, or teaching?
- does `Tidy Layout` produce enough structure to support reading larger graphs?
- do annotations actually relieve large-graph pressure, or are they too manual to be the primary answer?
- do tutorial focus and step banners meaningfully compensate for flat canvas structure?
- is the biggest friction inside the canvas itself, or in the lack of workspace-level framing around it?
- does the current workbench already hold well enough that no immediate follow-on is justified?

## Deliverable Shape

The output of this contract should be:
- a short audit-style note, likely `LARGE-WORKSPACE-UX-AUDIT.md`, capturing the concrete finding
- and, if justified, one bounded implementation in the same slice

The result should conclude one of three things:
- no immediate follow-on is needed
- one small bounded workspace-UX slice is justified
- the real next problem is elsewhere, and large-workspace UX should wait

If the first conclusion is reached, record it in `IMPLEMENTATION-STATUS.md` and do not treat that outcome alone as a tagged milestone.

## Relationship To Recent Work

This contract follows:
- `MCW-V2-SANITY-PASS.md`
- `MCW-V2-SANITY-AUDIT.md`
- `LEARNING-SEQUENCE-V2.md`
- selector/pathfinding polish
- `PALETTE-COHERENCE-V1.md`

Those slices improved how users find and classify content.
This slice tests whether the current workbench experience itself now has one clear next pressure point, and closes that pressure point if a bounded fix is obvious enough.

## Likely Milestone

If pursued as the next bounded validation slice, this is a good candidate for:
- `v1.48.0` — Large Workspace UX Triage V1
