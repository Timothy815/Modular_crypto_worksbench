# COMPOSITE-INSTANCE-DRILLDOWN-V1

Last updated: April 3, 2026

Status: Shipped on main

Owner: Codex
Scope: Composite UX / Instance Readability / Bounded Navigation

---

## Why

MCW already supports:
- reusable composites
- composite unzip back into editable internals
- forwarded parameters
- composite reuse ergonomics

But there is still one important readability gap:

When a user places a composite instance into a larger machine, the instance can become a black box at exactly the moment the product should remain glass-box.

The current choices are too extreme:
- stay outside and infer what the composite is doing
- or switch into reusable composite editing / unzip flows that are definition-oriented rather than instance-oriented

This slice exists to create a middle path:
- open one placed composite instance in its own tab
- inspect the internal graph in the context of that instance
- follow trace, signals, and forwarded parameters
- without mutating the saved reusable composite definition

---

## Goal

Add one bounded **instance drill-down** workflow for placed composite modules so users can inspect a composite instance from inside the current workspace flow without widening into instance-local editing or composite override semantics.

This slice should make composites easier to read and teach:
- less context switching
- less “open the definition just to understand the instance”
- clearer connection between outer machine behavior and inner composite structure

---

## Product Boundary

This slice is:
- navigation-oriented
- readability-oriented
- instance-scoped
- glass-box preserving

It is not:
- instance-local primitive editing
- instance override storage
- composite-definition mutation from the drill-down tab
- a new composite execution model
- a new saved document type

---

## Core Rule

**V1 is instance drill-down, not instance overrides.**

The user may open and inspect the internals of a placed composite instance.
They may not create persistent per-instance internal parameter differences in V1.

---

## Required V1 Shape

1. A selected composite instance can be opened in its own workspace-style tab.
2. The outer workspace tab remains available and unchanged.
3. The drill-down tab is explicitly instance-scoped, not definition-scoped.
4. The drill-down view must preserve read/trace/analyze value even if editing remains limited.
5. V1 must not add per-instance override fields to `Project`, `ModuleInstance`, or composite-definition persistence.
6. V1 must not silently modify the reusable composite definition when opened from an instance drill-down tab.
7. The drill-down surface should clearly identify:
   - which outer instance is being viewed
   - which reusable composite definition it comes from
8. Forwarded parameters should be legible in the drill-down view as resolved instance values.
9. V1 should reuse existing workbench surfaces where possible rather than inventing a second composite IDE.
10. If an action would mutate the shared reusable composite definition, V1 must route the user into the existing definition-oriented workflow explicitly rather than pretending it is instance-local.
11. V1 is limited to one drill-down level. A composite inside the drill-down view may be inspected, but it must not open a second nested drill-down tab in this slice.
12. The drill-down surface must filter the parent execution trace to the selected instance scope only.
13. Parameters shown in the drill-down inspector must be read-only in V1.
14. Closing the drill-down must return the user to the parent workspace without disturbing the parent workspace selection, layout, or saved state.
15. The drill-down tab is transient. It must not be persisted to local storage or saved as a normal workspace tab/document.

---

## Good V1 Deliverables

- one `Open Instance` or equivalent action for selected composite modules
- one tabbed drill-down surface for a placed composite instance
- clear header/breadcrumb text showing:
  - outer workspace
  - instance id
  - definition id
- one explicit back/close action returning to the parent workspace view
- readable internal graph using the existing workbench rendering language
- visible trace/analyze context when execution data is available
- forwarded parameter visibility in instance context
- read-only parameter inspection for modules inside the drilled-down instance

---

## Explicit Non-Goals

- no per-instance internal parameter mutation
- no instance-local rewiring
- no persistent instance override model
- no branching saved-document lineage for one composite instance
- no new execution semantics for composites
- no automatic syncing layer between instance tabs and reusable-definition editing

Those are separate future lines if needed:
- instance overrides
- instance-local forks
- composite specialization workflows

---

## UX Rules

1. The instance drill-down tab should feel like opening a lens into the current machine, not switching to a different product area.
2. The tab title should make the scope obvious, for example:
   - composite name
   - instance id
3. The user should never confuse:
   - viewing one instance
   - editing the reusable definition
4. If V1 exposes an edit affordance that targets the reusable definition, it must say so directly.
5. Prefer clarity over capability in V1:
   - read first
   - analyze first
   - mutate later, in a separate contract if needed
6. The drill-down surface should reuse the existing `WorkbenchPanel` in an observation-oriented mode rather than introducing a second composite-specific canvas surface.
7. The breadcrumb should remain visible while the user is inside the drill-down:
   - `[Workspace Name] > [Instance ID] ([Definition Name])`
8. If the selected module inside the drill-down is itself a composite, V1 should expose shared-definition editing only, not nested instance drill-down.

---

## Success Condition

This slice is successful if:
- a user can place a composite inside a larger machine and inspect its internals without leaving the current learning flow
- a student can connect an outer behavior to inner composite structure more easily
- the product stays glass-box for composites without widening into instance override semantics
- no project-schema or composite-persistence complexity is introduced

---

## Notes

This is a friction-saving move because it removes a forced all-or-nothing choice:
- either treat composites as opaque
- or jump straight into definition editing

V1 should prove that **instance readability** is valuable before the product considers the much riskier line of **instance-local editing**.

---

## Shipped Note

MCW now supports one bounded composite instance drill-down workflow:
- open a placed composite instance from the inspector
- inspect its internal graph in an observation-oriented workbench view
- follow localized trace and signal context scoped to that instance
- see forwarded parameters as resolved instance values
- return to the parent workspace without mutating the shared definition

The shipped slice stays deliberately narrow:
- no nested drill-down
- no instance-local parameter overrides
- no per-instance persistence
- no hidden definition mutation

If users later need instance-local specialization, that should be a separate contract after this readability-first slice proves its value.
