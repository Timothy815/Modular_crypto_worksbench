# Symbol Permutation V1

Last updated: March 24, 2026

Status: Proposed.

## Purpose

This contract defines the first bounded symbol/message permutation slice after shipped:
- block framing (`v1.16.0`)
- protocol material (`v1.17.0`)
- stream-machine routing/filtering (`v1.18.0` / `v1.20.0` / `v1.21.0`)
- advanced rotor realism (`v1.19.0`)

The goal is not to add preset transposition ciphers as opaque modules.
The goal is to give MCW an honest, visible symbol-level rearrangement primitive analogous to the shipped bit-level `Permutation`.

This slice should establish that MCW can represent:
- explicit reordering of a finite symbol sequence
- the difference between symbol permutation and substitution
- message-level rearrangement as visible graph structure rather than hidden text processing

## Why Now

MCW already ships:
- symbol-domain sources and outputs
- rotors, reflectors, and plugboards
- bit-domain `Permutation`
- block framing for `bits`
- modern and classical bridges

What it does not yet ship is a direct symbol-domain equivalent of `Permutation`.
That leaves a real expressive gap:
- students can rearrange bit positions visibly
- but cannot rearrange symbol positions with the same explicitness

The next honest step is one bounded symbol-permutation primitive, not a catalog of classical transposition presets.

## Architectural Decision

For the first symbol-permutation milestone:
- stay inside the existing `symbol` domain
- mirror the successful shape of the shipped bit-level `Permutation`
- keep the primitive explicit and finite
- avoid hidden normalization, blockification, or auto-padding behavior

This slice should:
- add one direct symbol-routing primitive
- keep symbol order changes inspectable in Build and Analyze
- make inversion/reversal a future decision, not a first-slice requirement

This slice should not:
- add named transposition ciphers as presets
- add auto-chunking or message scheduling
- add hidden fillers or padding for short text
- widen into full classical transposition families

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- students should be able to reorder a known-width symbol sequence explicitly
- the routing should remain legible on the graph and in the parameter editor

2. **Analyze**
- the symbol-permutation primitive should get the same compact transformation legibility as bit-level `Permutation`
- no separate classical-analysis subsystem is needed for V1

3. **Guide / Challenge**
- at least one tutorial should teach the difference between substitution and permutation at the symbol level
- at least one demo should show a message being reordered and then restored or interpreted
- at least one challenge should require repairing a wrong symbol ordering

## First Milestone

The first milestone should answer one question clearly:

**Can a student build and explain a visible symbol-order transformation without reducing it to a preset transposition cipher?**

The student should be able to:
- explain which symbol moved where
- predict the output order from the wiring/parameter mapping
- contrast symbol permutation with substitution and with bit permutation

## Include

### Primitive addition

- `SymbolPermutation`
  - one `symbol` input
  - one `symbol` output
  - explicit permutation/wiring parameter analogous to shipped bit-level `Permutation`
  - validates one-to-one symbol-index routing for a fixed sequence width when knowable

Why this primitive:
- it is structurally honest
- it reuses a vocabulary students already understand from bit-level permutation
- it fills a real cross-domain language gap
- it strengthens classical/message-level expression without preset sprawl

### Explicit machine patterns

This milestone should also ship one or two bounded demos/composites using already-shipped parts plus `SymbolPermutation`:
- a visible symbol-scramble machine where positions are rearranged but symbols are unchanged
- a contrast lab showing substitution vs permutation on the same input text

These should be assembled from explicit modules, not hidden behind a named transposition module.

## Exclude

This milestone should explicitly avoid:
- preset rail-fence / columnar / route-cipher modules
- automatic inverse-generation helpers unless they prove necessary
- multi-block message permutation abstractions
- filler/null-symbol management
- cryptanalysis tooling specific to transposition families

## Relationship To Existing Modules

This slice builds directly on shipped foundations:
- `Permutation` already shows visible position routing in the `bits` domain
- classical symbol machines already show substitution and stepping
- `SymbolPermutation` would add the missing idea that whole-symbol positions can be rearranged explicitly

The value of this slice is not "more classical presets."
The value is that MCW gains a direct symbol-order word in the machine language.

## Visual / Teaching Principles

Prefer:
- short, readable permutations students can reason through mentally
- direct contrasts between substitution and permutation
- examples where the same symbols appear in a different order, making the operation unmistakable

Avoid:
- long opaque message scramblers in the first slice
- hiding the reorder logic inside a composite while claiming the graph is explicit
- teaching historical transposition lore before the mechanics are clear

## Suggested Teaching Additions

The first milestone should likely ship with:

### Demo workspace

- `Visible Symbol Scramble`
  - `TextInput -> SymbolPermutation -> Output`
  - makes it obvious that order changes while symbols stay the same

### Tutorial

One tutorial (4-6 steps) teaching:
- what a symbol permutation does
- how it differs from substitution
- how it differs from bit-level permutation
- how to read the permutation mapping

### Challenge

One bounded challenge such as:
- a symbol-scramble machine with two indices swapped incorrectly
- the student must restore the correct ordering so the output matches a reference

## Success Criteria

This slice is successful when a student can:
- explain symbol permutation as reordering rather than symbol replacement
- predict the output order from the mapping
- contrast symbol permutation with substitution and bit permutation
- see symbol rearrangement as explicit machine structure rather than as a preset cipher label
