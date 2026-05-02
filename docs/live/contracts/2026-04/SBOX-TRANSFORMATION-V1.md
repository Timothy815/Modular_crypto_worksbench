# SBox Transformation V1

Last updated: March 23, 2026

## Purpose

This contract defines the first `SBox` transformation view inside the Inspector `Analyze` surface.

The first transformation-visualization slice already explains:
- routing (`Permutation`)
- shifting / wrapping (`BitShifter`)
- pairwise mixing (`XOR`)

The remaining pedagogical gap is **substitution**.

`SBox` is the first high-value primitive where the student needs to see:
- that a group of bits is treated as one unit
- that the unit becomes a lookup index
- that the lookup returns a new grouped value
- that the output is not a reorder, shift, or pairwise comparison

This view exists to make substitution concrete instead of magical.

## Product Boundary

This is a **single-primitive transformation view**.

It is not:
- a whole-pipeline animation
- a full cryptanalysis tool
- a complete table browser

It should live in the same home as the existing transformation views:
- Inspector
- `Analyze`
- selected module

The user should not have to switch to a new workspace just to understand `SBox`.

## Core Teaching Goal

A student should be able to answer:
- what chunk went in?
- what number does that chunk mean?
- which table entry was used?
- what chunk came out?
- why is this different from permutation or XOR?

without needing prior vocabulary beyond the view itself.

## First View Shape

The first `SBox` view should show one chunked substitution step clearly.

Minimum shape:

1. **Input Chunk**
- show the input bits grouped by S-Box width
- for V1, a single selected chunk is enough if multiple chunks exist

2. **Input Index**
- show the chunk’s decimal value
- example:
  - `1011`
  - `11`

3. **Lookup**
- show that the decimal index selects one table entry
- do not render a giant unreadable wall of numbers
- instead:
  - show the active entry
  - and enough surrounding context to make “lookup” feel real

4. **Output Value**
- show the selected output value in decimal
- show the output bits for that value

5. **Plain-Language Summary**
- example shape:
  - `Input chunk 1011 is index 11. The substitution table maps 11 to 12, so the output chunk becomes 1100.`

## Include

The first `SBox` transformation view should include:
- chunk boundaries
- chunk width
- binary input chunk
- decimal input index
- active table mapping
- decimal output value
- binary output chunk
- a short summary sentence

If the selected signal contains multiple chunks:
- show all chunk groups at a glance
- but allow one active chunk to be the explanation focus

## Exclude

The first `SBox` view should explicitly avoid:
- rendering the full table as a giant dense matrix if it hurts legibility
- trying to visualize every chunk simultaneously at full explanatory depth
- introducing cryptanalytic jargon
- pretending the table has meaning beyond substitution
- animation-heavy table traversal

V1 should explain lookup, not dramatize it.

## Visual Principles

The visual language should be different from routing and XOR.

Routing answers:
- where did it go?

XOR answers:
- how did these two positions compare?

`SBox` should answer:
- what grouped value was replaced with what other grouped value?

Prefer:
- chunk cards
- binary + decimal pairing
- one highlighted lookup row
- visible “index -> value” mapping

Avoid:
- wire diagrams for substitution
- treating each bit as independent when the primitive is chunk-based
- forcing the learner to scan the whole table first

## Multi-Chunk Rule

If the input width contains multiple `SBox` chunks:
- the panel should still acknowledge all chunk groups
- but V1 may focus on the first chunk by default

Later improvements may allow:
- clicking different chunks
- stepping chunk-by-chunk

That is not required for V1.

## Relationship To Existing Lines

This is the next logical step after the first transformation trio.

It strengthens:

1. **Modern Analysis**
- avalanche shows that substitutions contribute to spread
- the `SBox` view explains the local substitution event itself

2. **Hashing**
- hash and sponge rounds often include substitution before further mixing
- the student should be able to inspect that substitution directly

3. **Feistel / SP Teaching**
- `SBox` is the main remaining “black box” in those labs

## Implementation Shape

The implementation should add a third transformation-view family.

Current families:
- routing
- pairwise comparison

New family:
- lookup / substitution

Likely model:
- `LookupTransformationView`

Likely fields:
- entry
- chunkWidth
- chunks
- activeChunkIndex
- inputBits
- inputValue
- outputValue
- outputBits
- summary

## Success Criteria

This view is successful when a beginner can look at it and understand:
- the `SBox` consumes grouped bits
- the group is interpreted as a number
- the number selects a table entry
- the selected value becomes a new output chunk

It is especially successful if the student stops describing `SBox` as “magic” and starts describing it as:
- `lookup-based substitution`
