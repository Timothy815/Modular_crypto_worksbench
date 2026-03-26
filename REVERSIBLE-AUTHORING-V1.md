# Reversible Authoring V1

## Status

Proposed bounded follow-on after the shipped bridge-ergonomics and output-sinks work.

## Purpose

Strengthen MCW as a machine-building environment by making reciprocal and undo-path construction easier where the math is exact.

MCW already has one successful reversible-authoring slice:
- `Build Inverse` for `Permutation`
- `Build Inverse` for `SymbolPermutation`

That proved the broader product value:
- students and builders often need to construct the path that undoes an earlier transform
- when the inverse rule is mathematically clean, the workbench should help
- when the inverse rule is ambiguous, the workbench should stay explicit and manual

This line exists to define the next bounded reversible-authoring family without collapsing into auto-magic.

## Strategic Principle

**Only automate reversal when the reverse construction is exact, structural, and teachable.**

That means:
- the helper must produce the mathematically correct reciprocal or inverse form
- the user should still see and own the resulting structure
- the helper must not guess between multiple plausible meanings
- the helper must not silently widen into whole-machine auto-decryption

## Why Now

Recent work has made the system much easier to inspect:
- bridge ergonomics is stronger
- output inspection is more versatile
- output sinks now declare endpoint intent more clearly

That is the right foundation for reversible authoring.
Users can now read their outputs more honestly.
The next step is to make certain reversible constructions less error-prone to build.

## Product Boundary

This is an authoring line, not an execution-model line.

It should improve:
- `Configure`
- editor helpers
- exact structural derivation of reciprocal mappings

It should not change:
- signal typing
- executor semantics
- runtime behavior of already-valid machines

## V1 Scope

V1 should stay bounded to **reciprocal symbolic wirings** where the reverse rule is exact and already central to the teaching model.

Primary target modules:
- `Reflector`
- `Plugboard`

These are the right first targets because they already obey reciprocal pairing rules:
- if `A -> G`, then `G -> A`
- the relationship is explicit and involutive
- the “reverse” form is not a guess

## First Milestone

The first milestone should answer one question clearly:

**Can a student author reciprocal symbolic wirings with less friction while preserving exact reversibility by construction?**

The student should be able to:
- see that plugboard and reflector structure is pair-based
- derive or normalize reciprocal pair structure without manual bookkeeping
- keep the wiring valid while editing
- understand that reciprocal authoring is different from arbitrary substitution

## Included

The first milestone should likely include:
- bounded reciprocal-authoring helpers for:
  - `Reflector`
  - `Plugboard`
- helper actions that preserve reciprocal pairing exactly
- synchronized raw wiring / tactile editor state
- tests proving the helpers never produce broken half-pairs or non-reciprocal mappings
- brief UI wording that clarifies these are reciprocal-authoring helpers, not generic pattern generators

## Explicitly Excluded

Do not include in V1:
- S-Box inverse helpers
- rotor “reverse traversal” helpers
- automatic decrypt-path generation for whole pipelines
- mirror helpers
- generic “reverse any module” behavior
- graph-level auto-construction of reciprocal machines

Why:
- those cases either require bijectivity checks, machine-level context, or ambiguous interpretation
- they deserve separate contracts if pursued at all

## Candidate Helper Shapes

The contract intentionally does not lock the UI too early, but acceptable helper patterns would include:
- reciprocal normalization from valid pair edits
- pair-preserving swap helpers
- exact “complete the reciprocal half” behavior where the missing partner is structurally determined

Unacceptable helper patterns would include:
- guessing intended pairs from arbitrary text
- generating “nice-looking” wirings
- replacing the tactile editor with opaque automation

## Teaching Value

This line should reinforce:
- reciprocity is a structural rule, not a convenience feature
- some cryptographic components are reversible because of how they are wired
- authoring a reciprocal mapping is a different task from authoring a one-way substitution table

## Success Criteria

V1 is successful if:
- reflector and plugboard authoring become less error-prone
- reciprocal structure remains visible and explicit
- no hidden whole-machine automation is introduced
- the helpers feel like bounded construction aids, not smart black boxes

## Likely Follow-Ons

Possible later slices, only if still justified:
- bijective S-Box inverse authoring in a dedicated contract
- stronger decrypt-path authoring guidance for composites
- rotor-direction or reverse-traversal semantics in a separate rotor-realism slice

## Explicitly Avoid Next

Do not let “reversible authoring” become a blanket excuse for:
- auto-generating decryptors
- inferring machine intent from partial graphs
- widening every reciprocal property into one release

Keep the first move small, exact, and structural.
