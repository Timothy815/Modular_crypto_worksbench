# CLUSTER-BOUNDARY-PORT-AUTHORING-V1

Last updated: March 27, 2026

Status: Implemented on `main`

---

## Purpose

Define a bounded builder-power slice for making composite boundary authoring faster and clearer when promoting a selected cluster into a reusable component.

This slice exists to reduce the hand-work involved in turning a visible authored fragment into a composite with clean, intentional inputs and outputs.

It is not a composite execution rewrite.
It is not a hidden auto-refactor system.

---

## Problem

MCW now has:
- repeated-structure authoring
- selected cluster operations
- stage assembly helpers
- composite creation and unzip flows
- composite reuse ergonomics

That means the next bottleneck is not whether reusable structure exists.
It is how much hand-adjustment is still required to expose clean cluster boundaries once a fragment is ready to become a reusable authored unit.

The current pain points are likely:
- selected fragments with boundary wires that are structurally valid but awkward as composite ports
- uncertainty about which touched ports really belong on the composite boundary
- repeated cleanup work after promoting a cluster into a reusable block

The machine language is already strong here.
The authoring burden around boundary exposure is still too manual.

---

## Product Goal

Make boundary-port authoring for selected clusters more deliberate and less laborious without hiding the graph or inventing a second abstraction model.

The right outcome is:
- clearer composite boundaries
- less cleanup after capture
- more confidence when promoting visible machine fragments into reusable components

---

## Recommended First Slice

V1 should stay narrow and explicit.

It should add:
- a clearer boundary-port authoring surface inside the existing composite creation flow
- explicit include/exclude control over inferred boundary ports before creation
- a final preview of the captured composite boundary after those choices are applied

The user should still create a composite from a selected visible fragment.
The user should just have more control over which inferred boundary ports become part of the reusable shell.

---

## Required Behaviors

V1 should provide:
- pre-create listing of inferred input and output boundary ports for the selected cluster
- explicit toggles or equivalent controls to include or exclude individual inferred ports
- immediate preview refresh as those boundary choices change
- final composite capture that respects the chosen boundary set

Rules:
- V1 operates only inside the existing composite creation flow
- V1 starts from the current inferred boundary-port set; it does not invent a new capture model
- excluded boundary ports are omitted from the resulting composite shell
- internal captured structure remains unchanged except for the resulting boundary exposure
- the final created composite remains a normal composite instance with normal unzip/edit behavior

---

## Scope

This slice includes:
- UI controls for explicit boundary-port include/exclude choices in the existing composite creation path
- capture-time application of those choices
- bounded preview updates that reflect the chosen boundary set
- focused tests for boundary choice application

---

## Non-Goals

V1 must not become:
- automatic semantic port naming
- a full boundary editor after composite creation
- arbitrary port reordering UI
- hidden rewiring of internal structure
- automatic cluster cleanup or layout repair
- composite inheritance or templates
- new composite execution semantics
- a library or palette redesign

---

## Why This Slice

This is the stronger next builder-power move than another parameter-copy surface because it compounds:
- repeated structure authoring
- stage assembly
- composite reuse
- larger-machine assembly

It attacks a structural bottleneck, not just a local editing convenience.

If MCW is going to keep growing into a serious machine-building environment, promoting selected visible fragments into clean reusable components needs to feel more intentional and less fussy.

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- inferred input and output boundary ports are listed inside the existing composite creation dialog
- each inferred boundary port can be explicitly included or excluded before capture
- the preview updates immediately as those choices change
- created composites respect the chosen boundary set while keeping normal unzip/edit behavior

---

## Exit Condition

This slice is complete when:
- the user can explicitly include or exclude inferred boundary ports before composite creation
- the composite preview reflects those choices clearly
- created composites respect the chosen boundary set
- the feature reduces capture-time cleanup without introducing hidden abstraction
