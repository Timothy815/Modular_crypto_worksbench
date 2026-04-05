# ADAPTIVE-NODE-CARD-SIZING-V1

Last updated: April 5, 2026

Status: Drafted for review before implementation

## Purpose

Define a bounded workspace-card sizing refinement so simple modules feel lighter and dense multi-port modules gain a little more breathing room.

The goal is not a new card design system.
The goal is to make node cards scale slightly better with visual complexity while preserving MCW's current card language.

## Why Now

Recent workspace refinement has made the graph much more authorable:
- port ordering
- node-wide port posture
- per-port side assignment
- local tidy
- multi-anchor orthogonal wires
- wire direction cues

That means one of the clearest remaining readability bottlenecks is now the card itself.

The current fixed-width card does two bad things at once:
- simple sources and sinks look heavier than they need to
- multi-port modules still feel cramped, especially in ticked mode or with longer port labels

## Product Goal

Node cards should feel:
- lighter for simple modules
- slightly roomier for complex modules
- still visually consistent as one card family

The ideal outcome is:
- less wasted space in simple regions
- fewer cramped port/label stacks on complex nodes
- better live-state legibility in ticked mode
- no new semantic burden on the user

## Core Decision

This slice introduces **bounded adaptive card sizing** based on visible card complexity.

It does **not** introduce:
- freeform per-node resizing
- user-authored card dimensions
- radically different module templates

## Scope

This contract is limited to:
- workspace card sizing rules
- anchor offsets and card-internal spacing that must follow the new sizes
- selection/tick/probe/history rendering that depends on card size
- supporting constants in the canvas/workbench rendering layer
- styles in `src/App.css`

This slice may include:
- one smaller card size for visually simple nodes
- one standard card size
- one slightly roomier card size for dense nodes
- deterministic sizing derived from visible card complexity

## Required Behaviors

1. Card sizing must stay deterministic.
2. The same module instance in the same visual state must always resolve to the same card size.
3. Simple modules may render in a narrower card size than the current default.
4. Denser modules may render in the current size or a slightly roomier size.
5. Port anchors, labels, and endpoint positions must follow the chosen card size correctly.
6. Ticked-mode state, history chips, role badges, and titles must remain legible at all supported sizes.
7. Card sizing must remain presentation-only.
8. No engine semantics, export behavior, or connection identity may change.
9. Selection, hover, drag, wiring, and minimap behavior must continue to work correctly.
10. Save/load/history/artifact flows must not require any new persistence shape for V1.

## Sizing Guidance

V1 should stay intentionally small.

A good bounded shape would be:
- `compact`
- `standard`
- `roomy`

The sizing heuristic should be driven by visible complexity such as:
- number of visible ports
- whether ports occupy multiple sides
- whether the node is showing richer ticked-mode or history state

The heuristic should **not** depend on cryptographic meaning or primitive category.

## Explicit Non-Goals

Do not include:
- manual resize handles
- per-instance stored card width/height
- different card skins by primitive family
- collapsing cards into icon-only chips
- dynamic content hiding to force cards smaller
- a node-local mini layout editor

## Success Criteria

This contract is successful when:
- simple nodes occupy less visual weight
- dense nodes read more comfortably
- the workspace stays visually coherent as one card system
- wiring and anchor behavior remain stable
- the feature reduces clutter without making card behavior feel surprising

