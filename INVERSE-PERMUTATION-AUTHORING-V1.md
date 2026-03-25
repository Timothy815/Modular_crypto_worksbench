# Inverse Permutation Authoring V1

## Status

Shipped in `v1.30.0` as a bounded post-`v1.29.0` authoring follow-on.

## Purpose

Add a direct authoring helper that builds the inverse of the current permutation mapping.

This slice exists to support a common teaching and construction move:
- build an encrypt-side permutation
- then derive the exact permutation needed to undo it on the decrypt side

The goal is not to broaden the permutation family.
The goal is to reduce manual error when students or builders need the inverse routing of a mapping they already authored.

## Scope

V1 covers only:
- `Permutation`
- `SymbolPermutation`

The helper should appear in the existing permutation editor UI as:
- `Build Inverse`

It should:
- read the current mapping
- compute the inverse mapping
- replace the current order with that inverse

## Why Now

MCW already has:
- tactile permutation authoring
- symbol-domain and bit-domain permutation modules
- visible encrypt/decrypt style experiments where inversion matters

Without an inverse helper, users must:
- manually calculate the inverse mapping
- or reconstruct it by trial and error

That is unnecessary friction for a concept that should be mathematically clear and visually immediate.

## Core Rule

This helper must compute the **true inverse mapping**, not a visual reversal.

It is distinct from:
- `Reset To Reverse`
- mirror-like order reversal
- arbitrary pattern helpers

The UI must preserve that distinction.

## V1 Behavior

For a valid one-to-one permutation order:
- `Build Inverse` computes the routing that undoes the current mapping
- the result replaces the current order in the editor and raw CSV field

Examples:
- if the current order is `3,0,4,1,2`
- the inverse should become `1,3,4,0,2`

That means:
- applying the original permutation
- then applying the inverse permutation
- restores the original ordering

## Included

- helper logic shared by bit and symbol permutation authoring
- one UI button in the existing permutation editor
- at least one regression test proving the helper computes the true inverse

## Excluded

Do not include in V1:
- S-Box inverse helpers
- reflector inverse helpers
- rotor inverse helpers
- mirror/reverse-order redesign
- new teaching artifacts just for this helper

Why:
- `Permutation` and `SymbolPermutation` are guaranteed one-to-one authoring contexts
- S-Boxes would require bijection-specific handling and a different teaching story

## Success Criteria

V1 is successful if:
- both permutation editors expose `Build Inverse`
- the helper computes the mathematically correct inverse
- the distinction from `Reset To Reverse` remains clear
- the feature reduces manual decrypt-path authoring friction without widening scope

## Explicitly Avoid Next

Do not treat this helper as justification for:
- a general “mirror” operation
- inverse helpers across all routing-like modules
- a broader authoring-suite release

Keep it as one small, precise permutation-authoring improvement.
