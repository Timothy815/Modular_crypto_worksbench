# STATEFUL-MODULE-LIVE-STATE-V1

Last updated: April 8, 2026

Status: Drafted for review before implementation

## Purpose

Define a bounded temporal-transparency slice so stateful modules show their current runtime state, not just their configured starting parameters.

The goal is not to redesign execution or add a timeline system.
The goal is to make ticking and state evolution visibly legible in the same glass-box way MCW already makes structure legible.

## Why Now

MCW can already express stateful mechanisms such as:
- rotors
- counters
- iterators
- LFSR / PRNG-style modules
- other tick-driven state holders

But the product still hides too much temporal truth:
- the workspace often shows where a module starts, not where it is now
- a user cannot always tell whether a stateful module advanced on the last tick
- rotor landing position after several steps is not obvious enough
- the role of the clock primitive remains under-explained in practice because the effect of ticking is not always visible on the mechanism itself

This weakens MCW's glass-box promise in the temporal dimension.

## Product Goal

For stateful modules, the user should be able to answer:
- where did it start?
- where is it now?
- did it move?

without needing to infer that indirectly from downstream output alone.

## Core Decision

This slice introduces **read-only live-state visibility** for stateful modules.

It does **not** introduce:
- live-state editing
- a time scrubber
- a new execution model
- mandatory animation

## Scope

This contract is limited to visible state readouts for modules that already maintain step-dependent state.

Good V1 targets include:
- rotors
- counters
- iterators
- LFSR / PRNG-style stepping modules
- similar tick-driven state holders already present in MCW

This slice may include:
- compact current-state readouts on the workspace card
- clearer current-state presentation in the inspector
- bounded “advanced on last tick” or equivalent state-change cues where they can be derived honestly

## Required Behaviors

1. A stateful module must expose its current live state distinctly from its configured start state.
2. Live state must update as ticked execution advances.
3. If no ticked execution has occurred yet, the UI must clearly fall back to configured/start state instead of implying a later state.
4. The presentation must remain read-only in V1.
5. V1 must make current state visible without requiring the Analyze tab.
6. If a module did not advance on the most recent tick, the UI must not imply that it did.
7. V1 must not change execution semantics.
8. V1 should read from existing execution/tick state where possible rather than requiring new engine behavior.
9. The live-state treatment must remain compact enough not to overwhelm the node card.
10. Non-stateful modules must not be burdened with fake or empty live-state chrome.

## Product Shape

Good bounded V1 examples:
- Rotor:
  - configured start position
  - current live position
  - optionally a small cue that it advanced on the latest tick, if that can be shown honestly
- Counter:
  - configured start value
  - current value
- Iterator:
  - current index
  - current emitted item, if appropriate

The exact presentation may vary by module type, but the product shape must stay:
- compact
- truthful
- visibly distinct from configuration

## Explicit Non-Goals

Do not include:
- direct editing of current live state
- time scrubbing or replay controls
- animation-heavy state visualizations
- a separate timeline panel
- hidden derived state that is not already represented by execution/tick state
- a requirement that every module render extra card chrome

## Success Criteria

This contract is successful when:
- a user can see the current state of a stateful module directly
- a rotor’s current landing position is visible after ticking
- the difference between configured start state and current live state is clear
- MCW becomes more temporally transparent without bloating the workspace or inspector
