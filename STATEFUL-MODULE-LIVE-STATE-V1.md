# STATEFUL-MODULE-LIVE-STATE-V1

Last updated: April 8, 2026

Status: Shipped on `main`.

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

## What Already Exists

MCW already partially surfaces temporal state in two incomplete ways:
- workspace cards already show rotor position in ticked mode through a hard-coded path
- the inspector can expose tick-param detail in a generic list

This contract does **not** start from zero.
It formalizes and generalizes that partial behavior so stateful live-state visibility stops depending on one-off module-specific checks.

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
- LFSR / PRNG-style stepping modules
- similar tick-driven state holders whose current live state already appears in top-level tick params

Iterator state is explicitly deferred from V1.
Iterator internal stepping state is nested and is not currently exposed in the same top-level tick-param path as the simpler state holders above.

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
11. V1 must not add more ad hoc per-module-id card rendering checks for live state.
12. V1 must define a single mechanism for identifying which top-level tick param is the live-state field to display.

## Live-State Key Mechanism

V1 should identify displayable live state through an explicit declaration rather than by hard-coded module-id checks.

The preferred shape is:
- a bounded module-definition-level declaration such as `liveStateDisplayKey`
- or an equivalent centralized mapping with the same product effect

The important contract rule is:
- the UI must know which top-level tick param represents current live state
- without guessing from all params
- and without piling up scattered module-id-specific rendering logic

V1 should only target modules whose current live state is already represented as a top-level tick param.

## Start / Now Visual Language

V1 must distinguish:
- configured start state
- current live state

The bounded visual rule for V1 should be:
- start state comes from the configured module params
- live state comes from the current tick's declared live-state key
- if start and live state are the same, the UI may show only one value
- if they differ, the UI should show a compact before/after readout such as `A -> D` or `0 -> 3`

This can appear:
- on the workspace card
- in the inspector
- or in both

But the distinction itself must be consistent.

## Advancement Cue

If the product shows an "advanced last tick" style cue, it must be computed honestly.

The bounded V1 rule is:
- if `currentTick === 0`, no advancement cue is shown
- otherwise, a module is considered to have advanced only if the current live-state value differs from the prior tick's live-state value

If this cue cannot be derived honestly for a module in V1, the cue should be omitted rather than guessed.

## Product Shape

Good bounded V1 examples:
- Rotor:
  - configured start position
  - current live position
  - optionally a small cue that it advanced on the latest tick, if that can be shown honestly
- Counter:
  - configured start value
  - current value

The exact presentation may vary by module type, but the product shape must stay:
- compact
- truthful
- visibly distinct from configuration

Iterator live state is a follow-on.
It should be handled in a later contract once iterator-internal stepping state is surfaced through a bounded execution/result path.

## Explicit Non-Goals

Do not include:
- direct editing of current live state
- time scrubbing or replay controls
- animation-heavy state visualizations
- a separate timeline panel
- hidden derived state that is not already represented by execution/tick state
- a requirement that every module render extra card chrome
- iterator-internal sub-state plumbing in V1

## Success Criteria

This contract is successful when:
- a user can see the current state of a stateful module directly
- a rotor’s current landing position is visible after ticking
- the difference between configured start state and current live state is clear
- MCW becomes more temporally transparent without bloating the workspace or inspector
