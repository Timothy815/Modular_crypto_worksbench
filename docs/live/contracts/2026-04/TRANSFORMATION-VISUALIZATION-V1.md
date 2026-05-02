# Transformation Visualization V1

Last updated: March 23, 2026

## Purpose

This contract defines a future line for making module behavior legible at the level of transformation, not just structure or output.

MCW already makes machines:
- buildable
- inspectable
- analyzable

The next pedagogical gap is process visibility.

A student can currently see:
- the machine graph
- the module boundaries
- the baseline and variant outputs
- the round-level diffusion shape

But in many cases the student still cannot see, concretely enough:
- what a module just did
- how the input arrangement became the output arrangement
- why a transformation matters

Transformation Visualization V1 exists to close that gap.

## Product Boundary

This line is not a replacement for existing analysis or graph inspection.

It should sit alongside the current surfaces:

1. **Build**
- still owns graph construction and module placement

2. **Analyze / Cryptanalysis**
- still owns trace inspection, avalanche, round diffusion, and baseline-vs-variant comparison

3. **Transformation Visualization**
- should explain what a selected module is doing between input and output
- should be drill-down oriented
- should make local operations concrete without requiring expert vocabulary first

This line should make the workbench more legible, not more abstract.

## Problem Statement

The current product is stronger at:
- visible structure
- visible state differences
- controlled experiments

It is weaker at:
- showing the operation itself
- teaching what a primitive means in motion
- helping a student follow the causal path from one local state to the next

Examples:
- a permutation changes bits, but the remapping is not yet obvious enough
- a shift or rotate changes arrangement, but the movement is not yet clearly shown
- an S-Box changes chunks, but the learner cannot yet see how chunks enter, map, and leave
- XOR changes aligned bit pairs, but the operation is often inferred from output rather than seen directly

## First Milestone

The first milestone should be **Primitive Transformation Views**.

The first goal is not to animate everything in the system.
The first goal is to make a small set of high-value primitives concretely understandable.

Recommended first primitive set:
- `Permutation`
- `BitShifter`
- `XOR`
- `SBox`
- `BitJoin`

These are the best first targets because they are foundational, already heavily used, and often pedagogically opaque to beginners.

## Include

The first milestone should include:
- a selected-module transformation panel
- explicit input view
- explicit output view
- a transformation-specific middle explanation
- plain-language explanation of what changed
- support for both normal analysis and cryptanalysis contexts where relevant

Primitive-specific examples:

1. **Permutation**
- show original bit positions
- show destination positions
- show where each bit moved

2. **BitShifter**
- show original positions
- show shifted/rotated positions
- distinguish rotate from zero-fill shift

3. **XOR**
- show aligned input pairs
- show output result
- explain that differing bits produce `1`, matching bits produce `0`

4. **SBox**
- show chunk entering the box
- show chunk width
- show lookup index / row-level explanation in a teaching-friendly way
- show output chunk leaving

5. **BitJoin**
- show two incoming groups
- show the resulting concatenated output

## Exclude

The first milestone should explicitly avoid:
- trying to visualize every primitive at once
- turning the experience into a dense specification browser
- leading with formal proofs or terminology-heavy math
- requiring animation for correctness
- deeply nested automatic playback of whole pipelines before the single-module views are solid

Animation can help, but V1 should succeed even if the first slice is mostly stepwise and static with light motion.

## Visual Principles

The core rule is:
- the student should be able to answer “what just happened?” by looking

Prefer:
- position mapping
- chunk grouping
- aligned before/after views
- arrows, overlays, and highlighted moved segments
- light animation only when it increases clarity

Avoid:
- decorative motion without explanation
- long textual definitions before the visual evidence
- purely numeric or table-only explanation where a shape or mapping would be clearer

## Relationship To Existing Lines

This line should strengthen existing milestones instead of competing with them.

1. **Modern Analysis**
- avalanche shows that change spreads
- transformation views should explain how local modules contribute to that spread

2. **Hashing**
- hash demos should eventually let students step into absorb, mix, compress, and squeeze operations

3. **Parameter Forwarding**
- exposed controls become more meaningful when the student can also see the transformation they are changing

This is a legibility layer across the product, not a separate product.

## Likely First Product Shape

The most likely first product shape is:
- select a module in Analyze
- open a transformation panel
- view:
  - input
  - operation-specific mapping
  - output
  - short “what changed” explanation

This should work first for single-step module understanding before trying to narrate full-machine execution.

## Implementation Sequence

1. Lock the transformation-visualization contract.
2. Tighten tutorial wording and “what to look for” guidance in existing content.
3. Add a bounded first transformation panel for one primitive.
4. Extend that panel to a small core primitive set.
5. Only after that, decide whether deeper animation or multi-module playback is warranted.

## Success Criteria

This line is successful when a beginner can:
- select a primitive
- see its input and output clearly
- understand what the primitive did without prior jargon
- connect that local transformation to the larger machine behavior

It is especially successful if a student can answer:
- what moved?
- what combined?
- what was substituted?
- why did the output look different?

without needing the teacher to fill in the missing mental picture first.
