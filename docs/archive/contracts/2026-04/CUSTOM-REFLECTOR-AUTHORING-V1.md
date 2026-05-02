# Custom Reflector Authoring V1

Last updated: March 24, 2026

Status: Shipped in `v1.12.0`.

## Purpose

This contract defines the first bounded authoring slice for custom `Reflector` work.

The goal is not to turn MCW into a full historical rotor-machine design environment in one step.
The goal is to let a teacher or student directly author a reflector's paired wiring inside the workbench and immediately see how that changes symbol routing.

This slice should teach:
- a reflector is a paired wiring map, not a hidden lookup
- every connection must be involutive:
  - if `A -> G`, then `G -> A`
- reflector authoring should feel tactile, like pairing sockets on a plugboard

This should remain an educational authoring surface, not a general symbolic-graph editor.

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Configure**
- the `Reflector` wiring param must become realistically editable in the inspector
- a tactile pairing editor should be the primary workflow
- raw wiring entry should remain available as a secondary exact-input path

2. **Analyze**
- when reflector visualization arrives later, it should reuse the same pairing language
- this slice does not need to invent a second parallel metaphor

3. **Build / Guide**
- authored reflectors should behave like ordinary module params in existing Enigma-style projects
- the feature should support direct experimentation in the canonical rotor/reflector teaching pipeline

This slice should not become:
- full rotor-machine authoring all at once
- historical model presets as the primary feature
- cryptanalytic scoring of reflector quality
- a canvas-level cable editor

## First Milestone

The first milestone should answer one question clearly:

**Can a student directly pair a valid reflector wiring and immediately see how that changes the machine?**

The student should be able to:
- pair letters through a tactile editor
- keep the reflector involutive and duplicate-free
- see which letters are already paired
- re-run the machine and observe the changed routing behavior

## Include

The first milestone should likely include:
- a bounded pairing editor for `Reflector.wiring`
- one-to-one pairing behavior by construction
- immediate invalid-state feedback for raw wiring edits
- a raw wiring path that stays synchronized with the tactile editor
- one or two safe reset helpers, such as:
  - identity is not allowed
  - reset to a seeded teaching reflector

Prefer explicit pairing actions over free-form letter entry.

## Exclude

This milestone should explicitly avoid:
- rotor stepping behavior
- ring settings
- notch logic
- whole-machine historical presets as the primary focus
- Enigma-brand historical simulation scope creep

## Visual / Teaching Principles

Prefer:
- a plugboard / socket-pair feel
- obvious reciprocal pairing
- letter chips or sockets that make “already paired” visible
- raw wiring as a secondary precision tool

Avoid:
- forcing the user to type 26 letters as the main experience
- allowing impossible half-pairs
- hiding the involutive rule until validation time

## Success Criteria

This slice is successful when a student can:
- open a `Reflector` in `Configure`
- pair letters through a tactile editor
- understand whether the reflector is valid
- re-run the machine and see the changed symbolic routing
- leave with a better intuition for how reflector wiring differs from one-way substitution
