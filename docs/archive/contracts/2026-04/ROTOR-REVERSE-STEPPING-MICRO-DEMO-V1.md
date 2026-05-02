# ROTOR-REVERSE-STEPPING-MICRO-DEMO-V1

Status: Shipped on `main`

## Purpose

Add one bounded follow-on to the shipped `RotorReverse` primitive micro demo:

- keep the existing palette-local `Try Demo` surface
- keep the forward / reflect / reverse structure intact
- upgrade the `RotorReverse` micro demo so the linked forward rotor visibly steps in ticked mode

## Why

The shipped `RotorReverse` micro demo already answers the structural question:

- why does a reflected signal need an inverse return path?

But it does not yet answer the next live-state question:

- how does the reverse path stay honest when the linked forward rotor position changes over time?

That is a small live-state legibility issue, not a larger rotor-realism-lab issue.

## Include

- keep the `RotorReverse` micro demo in the primitive `Try Demo` registry
- change it into a small ticked path:
  - `TextInput -> Rotor -> Reflector -> RotorReverse -> TextOutput`
  - plus one visible `Clock -> Rotor.clock` on the linked forward rotor only
- default the `RotorReverse` micro demo to ticked mode
- use a repeated input such as `AAAA` so the linked state change is visible against stable input

## Exclude

- no new launcher
- no second clock input on `RotorReverse`
- no multi-rotor machine
- no new reflector behavior
- no new rotor semantics
- no tutorial/challenge conversion

## Acceptance

This slice is complete when:

- palette `Try Demo` for `RotorReverse` opens a small ticked workspace
- stepping the workspace shows that `RotorReverse` depends on the linked forward rotor’s evolving state
- the micro demo remains much smaller than the rotor-realism labs

