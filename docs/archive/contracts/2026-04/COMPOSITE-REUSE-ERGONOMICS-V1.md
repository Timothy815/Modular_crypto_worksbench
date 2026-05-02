# COMPOSITE-REUSE-ERGONOMICS-V1

Last updated: March 27, 2026

Status: Shipped on `main`.

---

## Purpose

Define a bounded ergonomics slice for making composite creation and reuse easier to understand and faster to apply.

This line is meant to improve authoring leverage around explicit reusable structure without hiding the graph or turning composites into a second programming model.

It is not a composite-system rewrite.

---

## Problem

MCW already supports:
- creating composites from selected structure
- editing composite internals
- unzipping composites back into editable internals
- repeated-structure authoring and cluster operations

That means the next friction is less about whether reuse exists and more about how legible and fluid that reuse feels.

The current gaps are likely around:
- understanding what a selected cluster will become as a composite
- understanding how a composite will behave when reused in other workspaces
- moving from authored fragment to reusable component with less uncertainty

MCW can already reuse structure. The next step is making that reuse easier to trust and apply.

---

## Strategic Position

This is the right next ergonomics step if we want to finish the current authoring-power run before returning to primitive expansion.

It stays inside:
- explicit-machine authorship
- reuse clarity
- bounded workflow polish

It should not drift into hidden abstraction, automatic refactoring, or library-system sprawl.

---

## Desired Shape

The first slice should support:
- clearer pre-create understanding of composite boundaries
- clearer post-create understanding of what was captured
- smoother reuse of created composites from the palette/library surface

The goal is to reduce hesitation around reusable structure, not to automate architecture decisions for the user.

---

## Recommended First Slice

The first slice should stay narrow:
- improve the visibility of what selected structure will become when creating a composite
- improve the clarity of what ports/boundaries were inferred
- improve the legibility of saved composite reuse from the existing palette/library flow

For V1, this should be limited to:
- a real pre-create preview of inferred composite boundary ports in the existing create dialog
- a clearer summary of reusable composite/iterator shape in the existing palette/library cards
- workflow clarity only, with no new composite semantics

This slice should not change how composite capture works internally.
It should not change how composite replacement or unzip semantics behave.

This should remain a workflow-clarity slice, not a new composite capability line.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- automatic subgraph extraction
- hidden refactors
- composite inheritance
- linked-template behavior
- nested composite management overhaul
- library taxonomy redesign
- broad port-inference rewrites unless required for clarity
- changes to composite execution semantics
- new linked-library behavior

---

## Product Fit

This family would support:
- faster authoring of reusable structures
- more confidence in promoting fragments into composites
- better reuse of existing authored cryptographic subsystems

It compounds directly with the already-shipped repeated-structure, selection, history, versioning, and wire/trace legibility work.

---

## Recommendation

Treat this as the next bounded ergonomics slice.

It is the strongest remaining workflow-quality step before switching back into either comparison ergonomics or new primitive-family work.

---

## Exit Condition

This contract is complete when:
- the next composite-reuse workflow problem is named clearly
- the first slice is bounded to workflow legibility rather than capability expansion
- the project can move into implementation without drifting into hidden abstraction
