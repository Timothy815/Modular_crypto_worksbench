# STAGE-ASSEMBLY-ERGONOMICS-V1

Last updated: March 27, 2026

Status: Implemented on `main`

---

## Purpose

Define a bounded builder-power slice for arranging selected modules into clearer stage-oriented rows or columns.

This slice exists to make explicit multi-stage machines faster to assemble without replacing the graph with hidden auto-generation.

---

## Problem

MCW can now express larger staged systems, but assembling those stages still requires too much manual placement work.

The current `Tidy Layout` action helps whole-workspace organization, but it does not give the user a direct way to reshape a selected fragment into a clearer stage row or column while continuing freeform authoring.

That leaves a gap for:
- repeated round layout
- visible sender/receiver symmetry
- control-bank and driven-bank arrangement
- quick cleanup of duplicated or pasted fragments

---

## Product Goal

Add small, explicit layout actions that let the user take a selected cluster and quickly:
- arrange it as a horizontal stage row
- stack it as a vertical stage column

These actions should reduce placement friction while keeping every module visible and editable.

---

## Required Behaviors

V1 adds two selected-layout actions:
- `Arrange Selected Stage Row`
- `Stack Selected Stage Column`

Rules:
- actions operate only on the current selection
- fewer than two selected modules is a no-op
- stage row preserves the selection's current left-to-right order
- stage column preserves the selection's current top-to-bottom order
- the current lead selection anchors the row or column
- placement uses fixed readable spacing, not variable force layout
- the result is one undo/redo step

---

## Scope

This slice includes:
- reducer-backed selected-layout actions
- header workspace-menu entry points
- one-step history integration
- focused reducer tests

---

## Non-Goals

V1 must not become:
- a general-purpose alignment toolbar
- a drag-handle transform system
- arbitrary spacing controls
- lane inference across the whole workspace
- automatic bus routing
- a replacement for `Tidy Layout`

---

## Interaction Model

The first slice should live in the existing workspace actions menu.

That keeps the behavior available without turning the workbench into a diagram editor with a large layout toolbar.

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- selected modules can be reshaped into a horizontal stage row
- selected modules can be stacked into a vertical stage column
- both actions are reducer-backed and undo/redo-safe
- the current lead selection acts as the anchor

---

## Exit Condition

This slice is complete when:
- selected modules can be arranged into a readable horizontal stage row
- selected modules can be stacked into a readable vertical stage column
- both actions are reducer-backed and undo/redo safe
- the feature improves staged-machine assembly without adding hidden structure
