# WIRING-CEREMONY-MICRO-DEMO-V1

Last updated: April 21, 2026

Status: Shipped on `main`

## Purpose

Define one bounded **micro demo** that teaches the new wiring-ceremony reduction features as a compact, editable canvas workflow.

This is not a flagship lab, tutorial chain, or large onboarding rewrite.

It is a single small workspace whose job is to answer:

**How do I build and revise a tiny machine quickly using the newer canvas-authoring gestures?**

## Why Now

MCW now has a stronger wiring and placement language than the teaching surface currently reflects.

Users can now:
- drag a module from the palette directly onto the canvas
- drag from an output port into empty canvas space and quick-add a compatible module
- click once to arm a connection and complete it on a distant input
- replace a selected module in place from the inspector
- edit a small set of common parameters directly on the node card

Those interactions are real product power, but they are still discoverability-fragile.

This demo should make them visible without turning them into hidden magic.

## Core Question

Can MCW seed one compact, honest workspace that demonstrates the new wiring gestures directly on canvas, without requiring the user to read a contract or a long tutorial first?

## Strategic Principle

**Teach the authoring loop by letting the user perform it.**

That means:
- one small machine
- one screen at normal zoom
- one or two visible edits per new gesture
- no hidden automation
- no detached prose surface required to understand the point

## Relationship To Existing Work

This slice sits on top of the already-shipped ceremony-reduction features from:
- `WIRING-CEREMONY-REDUCTION-V1`
- `CANVAS-QUICK-ADD-V1`
- `CONNECTION-AUTHORING-ERGONOMICS-V1`

It should also align with:
- `FIRST-SESSION-ONBOARDING-V1`
- `PRIMITIVE-MICRO-DEMOS-V3`
- `PIPELINE-MICRO-DEMOS-V2`

This slice does **not** replace those lines.

Its role is narrower:
- show the newer canvas editing language in one compact machine
- give users a place to feel the gestures directly

## Recommended Demo Shape

Use a very small repeated-key XOR style machine, because it naturally exercises placement, bridging, parameter editing, and rewiring in a bounded space.

Recommended seeded graph:
- `AsciiSequenceInput(message)`
- `AsciiSequenceInput(key)`
- `RepeatSymbolToMatch`
- `AsciiSequenceToTicked`
- `AsciiCharToBits`
- `XOR`
- `TickedBitsToSequence`
- `BitsToHex`
- `HexOutput`

The seeded machine should start complete and working.

The point is not to make the user build everything from zero.

The point is to give them a working machine where the next obvious actions can be:
- drag in one more module from the palette
- replace one module in place
- quick-add a compatible module from a port
- rewire by click-arming a connection
- edit one short value directly on-canvas

## Include

This slice should include:
- one new micro demo in the existing micro-demo system
- a compact seeded layout that fits on one screen at normal zoom
- a short title and summary focused on authoring, not theory
- 2-4 short on-canvas notes or equivalent visible prompts
- at least one obvious action for each of these interactions:
  - palette drag-to-canvas placement
  - port-to-empty-canvas quick-add
  - click-to-connect
  - replace in place
  - inline canvas parameter edit

## Exclude

Do not include:
- a new tutorial subsystem
- a challenge
- a large walkthrough panel
- hidden action sequencing
- automatic progression to another workspace
- a second registry just for authoring demos

## Core Rules

1. **The machine must remain real**
- the workspace must still be a valid cryptographic or pipeline-shaped machine
- do not create a fake “interaction sandbox” with meaningless modules

2. **The gestures must be teachable from the canvas itself**
- the user should not have to open the manual first
- the notes should point to actions, not explain the whole theory

3. **The seeded layout must stay compact**
- one screen at ordinary laptop zoom
- keep the graph shallow and readable

4. **The demo must not depend on hidden state**
- if the user changes a value, rewires a path, or replaces a module, the resulting graph should still be inspectable in the normal MCW way

5. **Notes should describe intent, not dictate every click**
- good: “Try dragging a new bridge from the palette into the open space above the XOR path.”
- bad: “Move your mouse 40 pixels left, then click the third card.”

## Suggested Interaction Beats

The recommended visible beats are:

### Beat 1 — Direct placement
- show an open patch of canvas with a note inviting the user to drag a module from the palette directly into that space

### Beat 2 — Quick add from a port
- leave one output path where the next likely move is to drag from an output into empty canvas and use Quick Add

### Beat 3 — Click to connect
- leave one pair of nearby but unconnected modules where click-arming an output is the easiest clean finish

### Beat 4 — Replace in place
- identify one module that can be swapped for a related alternative without changing the rest of the machine shape

### Beat 5 — Inline edit
- use at least one source or control module that supports on-card value editing

## Naming Guidance

Use a name that signals authoring ergonomics, not just crypto structure.

Good examples:
- `Fast Wiring XOR Builder`
- `Canvas Authoring XOR Micro Demo`
- `Quick Wiring Repeated-Key XOR`

Avoid names that sound like a contract title:
- `Wiring Ceremony Reduction Demo`
- `Canvas Ergonomics Example`

## Success Criteria

This slice is successful if:
- a user can discover the new authoring gestures by interacting with one compact workspace
- the demo feels like a real machine, not a fake controls test
- the workspace remains understandable at a glance
- the result reduces first-contact friction for the newer canvas gestures

## Non-Goals

This slice is not trying to:
- fully teach MCW
- replace tutorials
- replace the manual
- cover every wiring gesture exhaustively
- introduce any new engine, store, or execution behavior

## Implementation Notes

This should likely be implemented by extending the existing micro-demo registry and seeded-content helpers rather than creating any new launch surface.

The safest path is:
1. seed one compact working workspace
2. add bounded notes or prompts
3. verify that each targeted gesture is realistically usable in that layout

## Final Boundary

The workbench should remain an explicit instrument.

This demo exists to make the faster playing technique visible, not to make the machine automatic.

---

## Outcome

This micro demo is now shipped through the existing pipeline micro-demo registry as:
- `Canvas Authoring XOR Builder`
- defined in `src/ui/pipeline-micro-demos.ts`

Shipped behavior includes:
- a compact repeated-key XOR machine that fits on one screen at ordinary zoom
- visible on-canvas prompts for drag-to-place, quick-add, click-to-connect, replace in place, and inline param editing
- a real working machine rather than a fake interaction sandbox
