# MULTI-WINDOW-WORKSPACE-V1

Last updated: March 27, 2026

---

## Purpose

Define and record the first bounded shipped ergonomics line for allowing selected MCW surfaces to exist in separate browser tabs or windows.

This line supports multi-monitor use and denser working arrangements by letting selected panels live outside the main workbench viewport.

---

## Problem

MCW now has several dense, valuable surfaces:
- workbench
- inspector
- tool palette
- tutorials / challenges
- cryptanalysis

As the product grows, there is value in splitting some of these across screens rather than forcing all interaction through one browser viewport.

The immediate user value is clear:
- more visible workspace area
- easier side-by-side reference
- better multi-monitor use

But this is not a trivial UI tweak because it also raises state-synchronization questions.

---

## Strategic Position

This is a real and worthwhile future ergonomics line, but it is larger than it first appears.

It touches:
- shared UI state
- active workspace synchronization
- selection/focus consistency
- live execution / trace / history coherence across windows

Because of that, it should be handled as its own product line, not folded casually into another ergonomics slice.

---

## Shipped First Slice

The shipped first slice stays narrow:
- supports only two detachable surfaces:
  - `Inspector`
  - `Palette`
- keeps them as live views on the same active workspace
- uses the main window as the authoritative state host
- avoids arbitrary pane managers or a fully detachable-everything workspace

This proves the synchronization model before any later expansion to tutorials, challenges, or cryptanalysis.

---

## Desired Shape

The first slice should aim for:
- one active workspace shared across windows
- live synchronized read/write state
- minimal friction in opening and closing detached surfaces
- no ambiguity about which workspace is being edited

The goal is to increase usable screen real estate, not to turn MCW into a floating-window IDE shell all at once.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- detaching every surface at once
- full custom pane-layout management
- independent workspaces in each window
- hidden synchronization rules
- collaborative/multi-user state
- broad redesign of navigation or docking

---

## Product Fit

This family would support:
- multi-monitor use
- more usable canvas area
- better side-by-side authoring and inspection

It is a good future ergonomics line, but it should follow the current bounded workflow/legibility run rather than interrupt it.

---

## Shipped Behaviors

The first shipped slice now provides:
- `Open Tools In Window` / `Return Tools To Main Window`
- `Open Inspector In Window` / `Return Inspector To Main Window`
- live synchronized detached `Palette` and `Inspector` windows
- detached panels as synchronized views, not independent workspace clients
- docked copies hidden in the main window while the detached copy is active

The host window remains authoritative for:
- reducer actions
- palette micro-demo launches
- composite-library export
- focus and trace coordination
- version/baseline actions

---

## Exit Condition

This contract is complete when:
- detached `Palette` and `Inspector` windows are shipped
- the synchronization model stays bounded to host-authoritative live views
- future follow-ons can revisit broader detachment without re-litigating the first-slice boundary
