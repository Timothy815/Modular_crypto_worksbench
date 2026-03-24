# Advanced Rotor Realism V1

Last updated: March 24, 2026

Status: Shipped in `v1.19.0`.

## Purpose

This contract defines the first bounded rotor-realism slice after shipped:
- operators (`v1.14.0`)
- control primitives (`v1.15.0`)
- block framing (`v1.16.0`)
- protocol material (`v1.17.0`)
- stream-cipher foundations (`v1.18.0`)

The goal is not to turn MCW into a museum of one machine.
The goal is to give the existing rotor line enough realism to explain the historically important stepping and alignment behaviors that students expect to see.

This slice should establish that MCW can represent:
- rotor position and ring setting as distinct concepts
- notch / turnover behavior as visible machine logic
- double-step behavior as an explicit consequence of rotor control, not hidden folklore

## Why Now

MCW already ships:
- `Rotor`
- `Reflector`
- `Plugboard`
- `Clock`
- `Counter`
- `Equals`
- `AtLeast`
- `Gate`

That is enough to build classical rotor-style machines, but it still falls short of the behaviors that make those machines historically and pedagogically distinctive.

The next honest step is not to deepen stream ciphers again immediately.
The next honest step is to make rotor stepping realism visible using the control vocabulary that now exists.

## Architectural Decision

For the first rotor-realism milestone:
- keep the existing symbol-domain rotor line intact
- add realism in a bounded way
- preserve visible stepping logic and avoid hidden executor magic
- prefer a small extension of `Rotor` plus explicit stepping demonstrations over a large family of special-case modules

This slice should:
- separate `ringOffset` from `position`
- define notch / turnover behavior clearly
- make double-step behavior observable and teachable

This slice should not:
- introduce a giant “authentic Enigma” black box
- add arbitrary historical presets as hard-coded modules
- hide turnover inside undocumented runtime behavior

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- students should be able to see and edit rotor position, ring offset, and notch behavior
- rotor stepping rules should remain legible rather than hidden behind a mode switch

2. **Analyze**
- the consequences of ring setting and turnover should be inspectable
- no giant new analysis subsystem is needed for V1

3. **Guide / Challenge**
- at least one tutorial should teach why ring setting is not the same thing as position
- at least one demo should show visible turnover / double-step behavior
- at least one challenge should require repairing a rotor-realism parameter or stepping rule

## First Milestone

The first milestone should answer one question clearly:

**Can a student build and observe a rotor machine where stepping realism explains the output, rather than being hand-waved in prose?**

The student should be able to:
- change `ringOffset` separately from `position`
- observe when a notch causes turnover
- observe the double-step pattern as a visible machine consequence

## Include

The first milestone should include:

### Rotor realism additions

- `ringOffset`
  - explicit rotor parameter
  - distinct from visible rotor `position`
  - affects signal mapping without pretending to be the same thing as rotor position

- notch / turnover behavior
  - one or more explicit notch positions in rotor params
  - a clear rule for when turnover happens
  - behavior should be documented in contract language before implementation

- double-step behavior
  - enough rotor interaction logic to demonstrate the historically important middle-rotor double-step pattern
  - should be visible in stepped execution and teaching artifacts

### Teaching additions

- one demo workspace:
  - a bounded Enigma-style machine that makes stepping realism visible

- one tutorial:
  - ring setting vs position
  - turnover
  - double-step

- one bounded challenge:
  - repair a wrong ring setting, notch, or stepping setup

## Exclude

This milestone should explicitly avoid:
- named historical machine presets as opaque modules
- arbitrary rotor catalogs bundled into engine logic
- plugboard/reflector redesign in the same slice
- bulk historical UX/theme work
- rotor-bank management systems
- unrelated stream-combiner follow-ons in this same slice

## Relationship To Existing Modules

This slice builds directly on shipped foundations:
- `Rotor`, `Reflector`, and `Plugboard` keep the symbol-domain machine legible
- `Clock` and stepped execution make movement visible over time
- shipped control vocabulary gives the product the language to explain conditional stepping honestly

The value of this slice is not “more rotor options.”
The value is that a historically famous machine becomes more structurally truthful inside the workbench.

## Visual / Teaching Principles

Prefer:
- visible parameter distinctions (`position` vs `ringOffset`)
- visible stepping sequences over prose-only descriptions
- a small number of historically meaningful behaviors done clearly

Avoid:
- cramming every historical rotor quirk into V1
- hiding double-step behavior inside undocumented runtime shortcuts
- letting rotor realism monopolize the broader roadmap

## Shipped Teaching Additions

### Demo workspace

- `Advanced Rotor Stepping`
  - bounded Enigma-style path
  - enough rotors to show turnover and double-step behavior
  - stepped execution should make the motion readable tick by tick

### Tutorial

- `Advanced Rotor Stepping`
  - teaches:
- rotor position vs ring setting
- what a notch does
- why turnover matters
- why the double-step is surprising but real

### Challenge

- `Repair the Rotor Notch`
  - restores the stepping pattern by repairing a wrong turnover letter in the middle rotor

## Shipped Notes

`v1.19.0` delivered the first bounded realism slice by:
- extending `Rotor` with `ringOffset`, `notches`, and visible `turnover`
- keeping rotor advance local rather than introducing a hidden rotor-bank manager
- treating `clock` connections into stateful modules as temporal advance edges rather than same-tick DAG dependencies
- using explicit `Clock`, `Gate`, and `OR` wiring to demonstrate turnover and the middle-rotor double-step

## Success Criteria

This slice is successful when a student can:
- explain the difference between rotor position and ring setting
- predict when turnover will happen
- observe and explain the double-step pattern
- understand that rotor realism is machine logic, not mythology
