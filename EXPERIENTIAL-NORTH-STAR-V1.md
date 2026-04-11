# EXPERIENTIAL-NORTH-STAR-V1

Last updated: April 11, 2026

Status: Active product note

## Purpose

Define a short experiential north star for MCW so future product slices can be evaluated not only for correctness and capability, but also for how directly the workbench feels like shaping a live machine.

This is not an implementation contract.
This is not a roadmap replacement.
It is a lens that should sharpen prioritization across many bounded slices.

## Core Statement

MCW should increasingly feel like working on a live cryptographic machine, not assembling a static diagram.

The goal is not hidden automation.
The goal is not relaxed rigor.
The goal is not to make the graph less explicit.

The goal is to make explicit systems feel:
- immediate — edits connect visibly to machine behavior
- legible — structure reads at a glance without decoding
- responsive — the machine feels alive while you are building it

within MCW's stricter cryptographic and educational constraints.

## The Audulus 4 Standard

The quality to aim for is not Audulus's feature set. It is the feeling Audulus creates:

> When you patch a cable or turn a knob in Audulus, you feel the machine respond. You are not filling out a configuration form. You are shaping something that is already running.

MCW cannot and should not copy Audulus literally — cryptography requires typed domains, explicit conversions, and glass-box honesty that modular audio does not. But within those constraints, the same experiential standard applies:

**The user should feel like they are handling a working machine, not authoring a specification.**

The gap between those two feelings is the space this note is trying to close.

## What This Means In Practice

Future slices should increasingly favor work that closes that gap:

- **Wiring feels like routing a signal**, not drawing a logical arrow.
  MCW-specific target: direct rewiring, clear port feedback, wire type visible at a glance.

- **State is readable while the machine is running.**
  MCW-specific target: signal values visible without opening Analyze; active paths distinguishable from idle ones.

- **Structure reads without interpretation.**
  MCW-specific target: pipeline shape recognizable from layout and role labels alone, not from reading every module name.

- **Parameter edits connect directly to visible output.**
  MCW-specific target: changing a key value or width produces an immediately visible effect in the running graph, not just in the inspector.

- **Bookkeeping is reduced, not hidden.**
  MCW-specific target: ergonomic improvements that cut repeated ceremony while keeping every policy decision visible in the graph.

## What This Does Not Mean

This note does **not** justify:
- hidden coercions
- automatic graph repair
- silent type adaptation
- invisible mismatch handling
- "smart" behavior that obscures the machine

MCW's glass-box honesty is the thing worth keeping. The experiential goal is to make that honesty feel alive, not to trade it away for surface smoothness.

## Priority Lens

When choosing among future bounded slices, prefer work that improves one or more of these:

1. **Live Readability** — Can the user tell what the machine is doing right now, without entering Analyze?

2. **Authoring Fluency** — Does building or rewiring the graph feel direct and confident, not ceremonial?

3. **Pipeline Legibility** — Can the user recognize the structure of the system at a glance?

4. **Mechanism Feel** — Does interacting with the graph feel like shaping a working machine, or like editing a document?

5. **Honest Ergonomics** — Does the slice reduce friction without hiding the policy or the data flow?

## Success Condition

This note is doing its job if future decisions can be justified in both of these ways at once:
- "this makes MCW more explicit and correct"
- "this makes MCW feel more like directly shaping a live machine"

A slice that satisfies only the first is necessary but not sufficient.
A slice that satisfies only the second is not acceptable.
