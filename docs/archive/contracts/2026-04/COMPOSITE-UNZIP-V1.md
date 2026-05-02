# Composite Unzip V1

Last updated: March 24, 2026

Status: Shipped in `v1.13.0`.

## Purpose

This contract defines the first bounded inverse-composition slice: expanding a composite instance back into visible modules on the canvas.

The goal is not to dissolve all abstraction boundaries everywhere.
The goal is to let a user intentionally “open the box” on a composite instance when they want to resume editing the underlying parts directly in the workbench.

This slice should support:
- learning through decomposition
- recovering editable structure from a reusable box
- moving back from abstraction to construction without rebuilding by hand

## Product Boundary

This slice should reuse existing composite/workbench systems:

1. **Build Workspace**
- unzip should operate on a selected composite instance on the main canvas
- expanded modules should appear as ordinary modules in the current project

2. **Composite Definitions**
- unzipping should not mutate the stored composite definition itself
- it should only replace one instance with a visible expanded subgraph in the current project

3. **Connections / Layout**
- external edges should reconnect to the correct boundary modules after expansion
- the expanded layout should be readable enough to continue editing

This slice should not become:
- recursive deep expansion of an entire architecture tree in one click
- destructive edits to shared composite definitions
- a hidden reverse-compiler for every reusable artifact at once

## First Milestone

The first milestone should answer one question clearly:

**Can a user take one composite instance and restore its editable internal graph on the canvas without rebuilding it by hand?**

The user should be able to:
- select a composite instance
- expand/unzip it into visible internal modules
- keep the machine connected correctly at its boundaries
- continue editing the unzipped graph as ordinary modules

## Include

The first milestone should likely include:
- one explicit unzip action for composite instances
- namespaced or safely regenerated internal module ids on expansion
- reconnection of inbound/outbound edges through the former composite boundary
- a readable initial placement of the expanded modules near the original composite location

Prefer one intentional unzip action over automatic hidden expansion behavior.

## Exclude

This milestone should explicitly avoid:
- unzipping iterators in the same slice
- editing shared built-in library definitions in place
- preserving every last internal layout nuance from the source definition if that complicates the expansion
- bulk “expand all composites” tooling

## Visual / Teaching Principles

Prefer:
- a feeling of opening a box back into parts
- expansion that preserves user trust in the graph
- obvious continuity between the former composite boundary and the revealed modules

Avoid:
- exploding modules chaotically across the canvas
- hidden mutation of reusable definitions
- making unzip feel irreversible or dangerous

## Success Criteria

This slice is successful when a user can:
- select a composite instance
- unzip it into visible modules
- keep the machine working after expansion
- resume direct editing of the revealed parts without reconstructing them from scratch
