# EXPERIENTIAL-NORTH-STAR-V1

Last updated: April 11, 2026

Status: Active product note

## Purpose

Define a short experiential north star for MCW so future product slices can be evaluated not only for correctness and capability, but also for how directly the workbench feels like shaping a live machine.

This is not an implementation contract.
This is not a roadmap replacement.
It is a future-direction note that should help guide prioritization across many bounded slices.

## Core Statement

MCW should increasingly feel like directly shaping a live cryptographic machine.

The goal is not hidden automation.
The goal is not relaxed rigor.
The goal is not to make the graph less explicit.

The goal is to make explicit systems feel:
- immediate
- legible
- responsive
- playable

within MCW's stricter cryptographic and educational constraints.

## Audulus Comparison, Properly Framed

MCW should not try to become Audulus for cryptography in a superficial sense.

The right comparison is experiential, not literal:

> Within cryptography's stricter teaching, typing, and explicit-conversion constraints, MCW should move toward the same experiential standard that Audulus reaches in modular signal design: the user should feel like they are handling a living machine, not merely assembling a diagram.

## What This Means In Practice

Future slices should increasingly favor work that makes the machine feel more direct to shape:
- wiring should feel intentional rather than bureaucratic
- state should be easier to read while the machine is running
- pipeline structure should be easier to recognize while staying explicit
- graph edits should feel closely connected to visible machine behavior
- repeated bookkeeping should be reduced only when that reduction preserves graph honesty

## What This Does Not Mean

This note does **not** justify:
- hidden coercions
- automatic graph repair behind the scenes
- silent type adaptation
- invisible mismatch handling
- generic “smart” behavior that obscures the machine

MCW's distinct strength remains its glass-box honesty.
The experiential goal is to make that honesty feel alive, not to dilute it.

## Priority Lens

When choosing among future bounded slices, prefer work that improves one or more of these:

1. **Live Readability**
- Can the user tell what the machine is doing right now?

2. **Authoring Fluency**
- Does building or rewiring the graph feel direct and confident?

3. **Pipeline Legibility**
- Can the user recognize the structure of the system without excessive interpretation?

4. **Mechanism Feel**
- Does interacting with the graph feel like shaping a real working mechanism rather than filling out a formal diagram?

5. **Honest Ergonomics**
- Does the slice reduce friction without hiding the policy or the data transformation?

## Relationship To Current Work

This note reinforces the value of slices such as:
- pipeline wayfinding
- live-state readability
- strict-but-clear mismatch workflow polish
- wiring confidence and fluency
- bounded ergonomics around explicit sequence handling

It should not override the current bounded-slice workflow.
It should sharpen it.

## Success Condition

This note is doing its job if future decisions can increasingly be justified in both of these ways:
- “this makes MCW more explicit and correct”
- “this makes MCW feel more like directly shaping a live machine”
