# PILOT-POLISH-V1

Last updated: April 3, 2026

Status: Shipped on `main`.

Owner: Codex
Scope: Product Polish / Pilot Readiness / Friction Reduction

---

## Why

MCW now has enough capability to support a real instructor pilot:
- flagship classical and modern labs
- verification and parity trust
- instructor pilot resources
- shareable lab packs
- stronger cryptanalysis interpretation

The next likely adoption bottleneck is not missing vocabulary.

It is friction:
- a panel that takes a little too much space
- a label that is technically correct but not useful
- a workflow that is one click heavier than it should be
- a first-use confusion point that only appears during real testing

This slice exists to capture and remove that friction in a disciplined way before it grows stale or gets buried under larger feature work.

---

## Goal

Run one bounded pilot-facing polish pass that improves first-use smoothness, classroom legibility, and teacher confidence without opening another major feature line.

This slice should make the product feel more finished in real use:
- less scan cost
- fewer redundant words
- clearer next actions
- tighter panel behavior

---

## Product Boundary

This slice is:
- polish-driven
- evidence-driven
- focused on existing shipped surfaces

It is not:
- a new primitive family
- a new analysis family
- a broad redesign
- a hidden backlog rewrite disguised as polish

The primary surfaces it may touch are:
- workbench footer / tick bar / inspector
- learning dock and recommendation affordances
- shareable lab-pack handoff
- instructor-facing product help and small wording fixes

---

## Required V1 Shape

1. Every change must be tied to a real observed friction point from hands-on use, not speculative preference.
2. Each polish item must be small, self-contained, and behaviorally local.
3. V1 should prefer reducing noise over adding more UI.
4. V1 should favor:
   - clearer defaults
   - less redundancy
   - more direct navigation
   - tighter spatial use
5. The slice must remain bounded enough to ship as one short polish loop rather than turning into an endless catch-all.
6. Each accepted item should improve one of:
   - first-use comprehension
   - classroom-readability
   - pilot handoff smoothness
   - trust/verification legibility
7. Items that imply a new subsystem or new product branch must be deferred into their own contract instead.
8. Zero Schema Drift: every item in this pass must be achievable without modifying `WorkbenchDocument`, `Project`, `ModuleInstance`, or the persisted project version.
9. Each accepted item must begin with an explicit `Friction:` statement naming the real observed annoyance it resolves.
10. V1 is time-boxed to one focused implementation loop rather than an open-ended cleanup campaign.

---

## Good V1 Candidates

Examples of the right size:
- reclaiming vertical space in crowded inspector/workbench sections
- making recommendation links directly actionable
- tightening redundant explanatory copy
- improving output wrapping and sticky summary behavior
- smoothing searchability and selection in demos/labs
- reducing import/export confusion in shareable lab-pack flows
- polishing classroom-facing wording where the current text is technically right but too tool-shaped

---

## Explicit Non-Goals

- No new major capability family
- No broad visual redesign
- No new docking/window model
- No instructor LMS / grading / roster workflow
- No “while we’re here” architecture campaign
- No speculative polish with no real observed friction behind it

---

## Suggested Working Method

For each candidate item:
1. start with `Friction: ...`
2. make the smallest fix that resolves it
3. validate the local behavior
4. ship before accumulating too many unrelated polish edits

This should behave more like a short evidence-driven tightening loop than a large milestone.

---

## Success Condition

This slice is successful if:
- MCW feels easier to read and use in first-contact pilot sessions
- recent real-use annoyances are actually removed instead of merely documented
- the product becomes more teacher-ready without widening scope
- the next remaining friction points become clearer and better prioritized
- at least five specifically identified friction points are demonstrably resolved in one bounded pass

---

## Notes

The guiding rule is:

**At this stage, small friction removal can be more valuable than medium-sized feature expansion.**

MCW already has enough expressive power that adoption now depends heavily on whether the product feels teachable, direct, and calm under real use.

Prefer:
- removing words, borders, or clicks
- replacing raw tool-language with classroom-readable language
- making an existing action more direct

Avoid:
- decoration for its own sake
- adding new icons, colors, or chrome unless they remove proven friction
