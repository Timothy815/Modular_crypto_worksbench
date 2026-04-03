# Primitive Micro Demos V3

Last updated: March 27, 2026

Status: Shipped on `main`.

## Purpose

This contract defines the third bounded primitive micro-demo expansion set for MCW.

The goal is to extend the palette-local `Try Demo` system to the rotor family so users can inspect:
- forward rotor traversal in isolation
- explicit reflector-driven return traversal using `RotorReverse`

without sending those users straight into larger rotor-realism demos.

## Product Problem

The existing main demo library now has:
- `Advanced Rotor Stepping`
- `Rotor Return Path`

Those are the correct system-level teaching surfaces, but they are larger than necessary for a user who only wants to answer:
- what does a forward rotor do by itself?
- what changes when a reflected signal comes back through `RotorReverse`?

That makes rotor legibility a good fit for the primitive-local micro-demo system.

## Core Question

Can MCW extend primitive-local micro demos into the rotor family without turning the palette into a second historical-demo library?

## Strategic Principle

**Teach one rotor behavior at a time.**

That means:
- one forward rotor micro demo
- one explicit reverse-path micro demo
- no broad rotor-catalog rollout

## Locked Primitive Set

V3 is locked to:
- `Rotor`
- `RotorReverse`

## Include

The first slice should include:
- one seeded micro demo for `Rotor`
- one seeded micro demo for `RotorReverse`
- continued use of the existing palette-local `Try Demo` action
- new local editable workspace copies when a micro demo is opened
- minimal examples that stay centered on rotor traversal

## Exclude

Do not include in V3:
- inspector-local launch surfaces
- a grouped browser of all micro demos
- a full Enigma machine micro-demo bundle
- broader stepping/control lessons already covered by `Advanced Rotor Stepping`
- `Plugboard` or reflector-only micro demos in the same slice

## Core Rules

1. **The existing `Try Demo` flow stays intact**
- V3 expands the current registry
- it does not change the interaction model

2. **Each example teaches one focal rotor behavior**
- `Rotor`: forward traversal through the active wiring
- `RotorReverse`: return traversal through `Rotor -> Reflector -> RotorReverse`

3. **Examples stay minimal**
- no stepping logic unless required to make the path readable
- no extra historical-machine layers beyond what is needed for the focal behavior

4. **The reverse-path example must stay honest**
- the `RotorReverse` demo must include:
  - one forward `Rotor`
  - one `Reflector`
  - one `RotorReverse`
- it must not fake the reverse leg with a second forward rotor

## Recommended Implementation Shape

The strongest V3 shape is:
- extend the existing micro-demo registry in place
- add one seeded document for `Rotor`
- add one seeded document for `RotorReverse`
- keep the examples unticked by default

Reason:
- the rotor traversal story is structural, not timing-first
- the user should be able to inspect the path immediately without entering ticked mode

## Expected File Scope

Primary files likely in scope:
- `src/ui/primitive-micro-demos.ts`
- `src/ui/primitive-micro-demos.test.ts`

Supporting files may include:
- `PRIMITIVE-MICRO-DEMOS-V3.md`
- `README.md`
- `IMPLEMENTATION-STATUS.md`
- `CLAUDE.md`

This slice should not require new engine work.

## Minimal Example Shapes

Recommended minimal examples:
- `TextInput -> Rotor -> TextOutput`
- `TextInput -> Rotor -> Reflector -> RotorReverse -> TextOutput`

These are examples of shape, not exact required layouts.

## Success Criteria

This slice is successful when:
- `Rotor` and `RotorReverse` gain palette-local `Try Demo` availability
- the forward rotor micro demo stays focused on one visible substitution path
- the reverse rotor micro demo shows a real forward / reflect / reverse structure
- the main teaching libraries remain unchanged

## Validation Expectations

This slice should add focused tests for:
- registry coverage of the locked V3 primitive set
- preserving the one-primitive focal anchor of each example
- keeping the rotor reverse example structurally honest

## Explicitly Avoid Next

Do not let this become:
- a full rotor family micro-demo sweep
- a replacement for rotor-realism tutorials
- a broad historical-machine teaching system

Keep the move about rotor traversal legibility only.
