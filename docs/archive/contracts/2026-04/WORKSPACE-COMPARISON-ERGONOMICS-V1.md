# WORKSPACE-COMPARISON-ERGONOMICS-V1

Last updated: March 27, 2026

Status: Shipped on `main`.

---

## Purpose

Define a bounded ergonomics slice for making workspace-to-workspace comparison easier to read and use.

This line is meant to help a user understand how one machine state differs from another machine state without turning MCW into a general-purpose diff tool.

It is not a full semantic-equivalence engine and not a new version-control system.

---

## Problem

MCW already supports:
- undo / redo
- named workspace versions
- comparison-oriented execution workflows
- stronger workspace legibility and trace/workspace bridging

That means the next friction is not whether the user can save or restore a workspace state.

The next friction is:
- seeing what changed between one workspace state and another
- understanding structural differences without manually inspecting the entire graph
- connecting saved checkpoints to visible authored differences in the machine

MCW can already preserve machine states. The next step is making those states easier to compare.

---

## Strategic Position

This is the right next ergonomics slice if we want to finish the current workflow/legibility run cleanly before shifting back into new primitive families.

It stays inside:
- visible machine comparison
- workspace readability
- bounded interpretation of authored differences

It should not drift into a generalized source-control UI or semantic graph solver.

---

## Desired Shape

The first slice should support:
- comparing the current workspace against one saved workspace version
- clearer visibility of which modules and connections are unchanged vs added vs removed
- bounded visual difference reporting that helps a user inspect the machine directly

The goal is to answer “what changed in this machine?” more clearly, not to create a fully abstract diff language.

---

## Recommended First Slice

The first slice should stay narrow:
- choose one saved version as the comparison baseline
- compare current workspace structure against that baseline
- emphasize added, removed, and unchanged modules/connections visually
- keep the comparison tied to the existing workspace view rather than opening a whole second editing shell

For V1, this should be limited to:
- one saved version baseline at a time
- structural comparison only: modules and connections
- ID-based comparison only, with no rename or semantic-equivalence heuristics
- removed modules/connections surfaced through overlays and summary, not a second editable ghost graph
- baseline treated as read-only

This slice should not compare params, annotations, tick state, or execution outputs yet.

This should remain a reading/comprehension slice, not a branch-management or merge workflow.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- side-by-side full editor panes
- semantic equivalence detection for structurally different but behaviorally similar machines
- comparison of every persisted artifact at once
- merge tooling
- patch application
- version-graph branching UI
- generalized textual diff viewers
- rename matching heuristics

---

## Product Fit

This family would support:
- easier inspection of saved checkpoints
- stronger understanding of refactors and experiments
- more confidence when iterating on larger machines

It compounds directly with the already-shipped history, versioning, wire legibility, trace bridging, and composite-reuse work.

---

## Recommendation

Treat this as the next ergonomics slice after `COMPOSITE-REUSE-ERGONOMICS-V1`.

It is a natural final step in the current workflow/legibility run before returning to new control primitives, rotor extensions, or export foundations.

---

## Exit Condition

This contract is complete when:
- the workspace-comparison problem is named clearly
- the first slice is bounded to visual machine-state comparison
- the project can move into implementation without drifting into a generalized diff product
