# Workbench Ergonomics V1

Last updated: March 24, 2026

Status: Shipped in `v1.13.0`.

## Purpose

This contract defines the first bounded ergonomics upgrade for direct graph editing on the workbench canvas.

The goal is not to turn MCW into a full design-tool clone.
The goal is to remove obvious friction from day-to-day building:
- selecting more than one module
- moving a related cluster together
- cleaning up a messy workspace with one intentional action

This slice should improve:
- speed of building
- comfort of rearranging a machine
- legibility of student-made work

This should remain a bounded workbench usability slice, not a general vector-design system.

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build Workspace**
- multi-select should work directly on the existing graph canvas
- moving a selected set should preserve relative positions
- cleanup should operate on the current project layout, not on composite internals in a hidden editor

2. **Guide Workspace**
- the same selection and movement mechanics should still work without breaking tutorial overlays
- cleanup should not erase tutorial context or workspace mode state

3. **Persistence**
- selection state itself does not need to persist
- resulting layout changes should persist as ordinary project layout changes

This slice should not become:
- full alignment/distribution tooling with many buttons
- canvas-level grouping semantics as a new data model
- an auto-layout engine that rewires the graph
- a graph beautifier that ignores user intent

## First Milestone

The first milestone should answer one question clearly:

**Can a student or teacher quickly rearrange a machine without moving modules one by one?**

The user should be able to:
- select multiple modules
- drag the selected set together
- clear or replace the selection intentionally
- click one cleanup action to space things out and line things up more readably

## Include

The first milestone should likely include:
- multi-select through click-with-modifier and/or marquee-box selection
- visible multi-selection state
- group movement preserving relative offsets
- deselect / replace-selection behavior that feels predictable
- one bounded cleanup action such as:
  - tidy current project layout
  - align and space modules based on current graph structure and existing positions

Prefer one strong cleanup action over a toolbar full of tiny layout controls.

## Exclude

This milestone should explicitly avoid:
- persistent named groups
- graph locking / pinning systems
- arbitrary snap grids as a mandatory editing model
- auto-routing connection splines as a parallel line of work
- per-axis align-left / distribute-horizontal / distribute-vertical command explosion

## Visual / Teaching Principles

Prefer:
- visible, obvious selection state
- movement that feels stable and unsurprising
- cleanup that improves readability without dramatically rewriting the machine
- a single “make this cleaner” mental model

Avoid:
- requiring pixel-perfect manual adjustment before cleanup helps
- turning layout cleanup into a professional diagramming toolbar
- hiding which modules are in the active selection

## Success Criteria

This slice is successful when a user can:
- build a machine with several related modules
- select a subset of them and move them together
- clean up a cluttered canvas with one action
- end up with a more readable workspace without losing confidence in the graph structure
