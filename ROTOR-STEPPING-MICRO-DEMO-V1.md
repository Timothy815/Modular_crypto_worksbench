# ROTOR-STEPPING-MICRO-DEMO-V1

Status: Shipped on `main`

## Purpose

Add one bounded follow-on to the shipped primitive rotor micro demos:

- keep the existing palette-local `Try Demo` surface
- keep `RotorReverse` as the structural return-path micro demo
- upgrade the `Rotor` micro demo so it shows visible stepping state in ticked mode

## Why

The shipped `Rotor` micro demo already answers:

- what does a forward rotor do by itself?

But it does not yet answer the next immediate question users have once they open it:

- why does the same repeated input letter produce changing output in a rotor machine?

That is a live-state question, not a larger rotor-realism-lab question.

## Include

- keep the `Rotor` micro demo in the primitive `Try Demo` registry
- change it from a static single-letter path to a small ticked path:
  - `TextInput -> Rotor -> TextOutput`
  - plus one visible `Clock -> Rotor.clock`
- default the `Rotor` micro demo to ticked mode
- use a repeated input such as `AAAA` so rotor position change is visible against stable input

## Exclude

- no new micro-demo launcher
- no `RotorReverse` redesign
- no multi-rotor machine
- no reflector addition to the forward rotor micro demo
- no new rotor semantics
- no tutorial/challenge conversion

## Acceptance

This slice is complete when:

- palette `Try Demo` for `Rotor` opens a small ticked workspace
- stepping the workspace makes `Rotor.position` visibly matter
- the micro demo still stays much smaller than the rotor-realism labs

