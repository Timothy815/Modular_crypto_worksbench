# CONTROL-FAMILY-COMPARISON-TEACHING-V1

Status: Shipped on `main`

## Purpose

Add one bounded comparison workspace that teaches the three most important live control roles already present in MCW:

- `Gate` — allow or blank a signal
- `Mux` — choose one of two candidate signals
- `MultiRouter` — route one signal into one of several visible lanes

This is not a new control-system architecture slice. It is a compact teaching surface that lets users read those three behaviors side by side under one shared clock.

## Why This Slice Exists

MCW already has:

- individual control-oriented demos
- control primitives in the palette
- wayfinding text on those primitives

What is still missing is one small board that answers the comparison question directly:

**What changes when a control bit is used to block, choose, or route?**

That distinction matters for usability because these modules are easy to confuse during authoring:

- users can treat `Gate` like a selector when it is really a blocker
- users can treat `Mux` like a router when it is really a chooser
- users can treat `MultiRouter` like a multi-lane `Mux` when it actually energizes one visible route among many outputs

## Required Outcome

Ship exactly:

1. one seeded demo project
2. one matching starter tutorial
3. one small demo-registry test
4. implementation status update

## Demo Shape

Create one demo with:

- one shared `Clock`
- one visible changing control bit for `Gate` and `Mux`
- one visible 2-bit route selector for `MultiRouter`

Suggested branch shapes:

1. **Gate branch**
   - `IV -> Gate -> BitOutput`
   - one 1-bit control stream drives `Gate.control`

2. **Mux branch**
   - `ConstantBit(0)` and `ConstantBit(1)` feed `Mux.a` and `Mux.b`
   - the same 1-bit control stream feeds `Mux.select`
   - `Mux -> BitOutput`

3. **MultiRouter branch**
   - `IV -> MultiRouter(routeCount=4)`
   - `Counter(width=2)` feeds `MultiRouter.select`
   - four visible outputs show which lane is currently active

The demo must default to ticked mode.

## Teaching Point

The tutorial must make these distinctions explicit:

- `Gate` keeps one signal path and decides whether it survives
- `Mux` chooses which candidate continues forward
- `MultiRouter` sends one incoming signal into one visible route among many

## Scope Rules

Include:

- one bounded side-by-side comparison board
- one shared pulse source
- direct outputs for each branch
- one tutorial that frames the three roles as a control grammar

Exclude:

- `Require*LengthMatch` policy teaching
- new control primitives
- challenge conversion
- broad conditional-definition work
- new execution semantics

## Acceptance

This slice is complete when:

- a user can open one workspace and step through all three behaviors under visible timing
- the tutorial can explain why `Gate`, `Mux`, and `MultiRouter` are not interchangeable
- the comparison remains smaller than the existing stream-cipher labs that use these modules in larger machines

