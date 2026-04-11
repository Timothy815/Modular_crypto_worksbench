# Primitive Micro Demos V2

Last updated: March 27, 2026

Status: Shipped on `main`.

## Purpose

This contract defines the second bounded primitive micro-demo expansion set for MCW.

The goal is to extend the primitive-local `Try Demo` system to a small set of timing, state, and framing primitives whose behavior becomes much clearer when viewed in isolation.

## Product Problem

`PRIMITIVE-MICRO-DEMOS-V1` addressed first-wave control/comparison selectors:
- `Mux`
- `Demux`
- `Gate`
- `Equals`
- `AtLeast`
- `Majority`

The next legibility gap is in primitives that are foundational to explicit-machine timing, state, and framing but are still slightly opaque until a user sees one tiny working example.

This shows up in questions like:
- what exactly does `Clock` emit over time?
- how does `Counter` wrap when width is bounded?
- what does `BitSplit` actually do to one input word?
- how do `BitPad` and `BitJoin` behave in the smallest visible graph?
- what does `LFSR` look like as a visible stateful source before it appears in a larger stream machine?

## Core Question

Can MCW extend primitive-local micro demos to timing/state/framing tools without losing the bounded, palette-local character of the system?

## Strategic Principle

**Expand by concept family, not by completeness.**

That means:
- V2 should add one coherent family of primitives
- this is not permission to cover every remaining primitive
- the palette-local `Try Demo` model should remain unchanged

## Locked Primitive Set

V2 is locked to:
- `Clock`
- `Counter`
- `BitSplit`
- `BitPad`
- `BitJoin`
- `LFSR`

## Include

The first slice should include:
- one seeded micro demo for each locked primitive
- continued use of the existing palette-local `Try Demo` action
- new local editable workspace copies when a micro demo is opened
- minimal examples that focus on one behavior only

## Exclude

Do not include in V2:
- micro demos for arithmetic or public-key primitives
- micro demos for large transformation editors like `SBox`, `Permutation`, or `Rotor`
- inspector-local launch surfaces
- a grouped browser of all micro demos
- any change to the main demo/tutorial/challenge library

## Core Rules

1. **V1 behavior stays intact**
- V2 expands the existing registry
- it does not change the interaction model introduced in `PRIMITIVE-MICRO-DEMOS-V1`

2. **Each example teaches one focal behavior**
- `Clock`: visible pulse emission
- `Counter`: width-bounded pulse counting and wraparound
- `BitSplit`: one word becomes left/right outputs
- `BitPad`: one word becomes a padded word
- `BitJoin`: visible rejoining of two explicit halves
- `LFSR`: visible stateful output over ticks

3. **Examples stay minimal**
- no extra concept unless required for visible input/output
- no system-level teaching narrative in V2

4. **Timing/state examples default to ticked mode**
- `Clock`, `Counter`, and `LFSR` examples must open in ticked mode by default
- framing examples should remain unticked unless timing is essential

## Recommended Implementation Shape

The strongest V2 shape is likely:
- extend the existing micro-demo registry in place
- add one seeded document per locked primitive
- preserve the same workspace-copy creation flow used in V1

Reason:
- the product already has the right primitive-local launch path
- the bounded expansion should feel additive, not like a redesign

## Expected File Scope

Primary files likely in scope:
- `src/ui/primitive-micro-demos.ts`
- `src/ui/primitive-micro-demos.test.ts`

Supporting files may include:
- `PRIMITIVE-MICRO-DEMOS-V2.md`
- `README.md`
- `IMPLEMENTATION-STATUS.md`
- `CLAUDE.md`

This slice should not require engine-layer changes.

## Minimal Example Shapes

Recommended minimal examples:
- `Clock -> BitOutput`
- `Clock -> Counter -> BitOutput`
- `BitSource -> BitSplit -> BitOutput(left/right)`
- `BitSource -> BitPad -> BitOutput`
- `BitSource(left/right) -> BitJoin -> BitOutput`
- `Clock -> LFSR -> BitOutput`

These are examples of shape, not exact required layouts.

## Success Criteria

This slice is successful when:
- the locked V2 primitive set gains palette-local `Try Demo` availability
- each micro demo stays visibly centered on one primitive behavior
- `Clock`, `Counter`, and `LFSR` open in ticked mode by default, while framing demos remain unticked
- the main teaching libraries remain unchanged

## Validation Expectations

This slice should add focused tests for:
- registry coverage of the locked V2 primitive set
- ticked-mode defaults for timing/state examples where applicable
- preserving the one-primitive focal structure of each example

## Explicitly Avoid Next

Do not let this become:
- a “complete the rest of the palette” sweep
- a transformation-editor micro-demo project
- a second teaching hierarchy

Keep the second move about timing, state, and framing legibility only.
