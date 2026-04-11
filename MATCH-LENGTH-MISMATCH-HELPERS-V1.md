# MATCH-LENGTH-MISMATCH-HELPERS-V1

Last updated: April 10, 2026

Status: Draft

## Purpose

Define the broader product family for **reference-driven mismatch helpers** that align one explicit sequence to the length of another explicit sequence.

The goal is to keep later ergonomic helpers coherent instead of adding one-off modules with unrelated naming and behavior.

This contract is not the first implementation slice.
It is the family-level framing that should follow the narrower `REPEAT-TO-MATCH-V1` line.

## Why Now

MCW now has two mismatch-helper styles:
- fixed target-length helpers
  - `RepeatSymbolToLength`
  - `RepeatBitsToLength`
  - `TruncateSymbolSequence`
  - `TruncateBitsSequence`
  - `PadBitsSequence`
- shipped reference-driven helpers
  - `RepeatSymbolToMatch`
  - `RepeatBitsToMatch`

Without a family contract, later additions risk becoming inconsistent in:
- naming
- inspector language
- validation behavior
- policy boundaries

The product needs one clear grammar for:
- match by repeating
- match by truncating
- match by padding
- fail unless explicitly repaired

## Product Goal

Users should be able to say:
- repeat this key to match that message
- truncate this stream to match that block
- pad this buffer to match that reference

using visible helpers whose names tell the truth.

The family should make it obvious that:
- the policy is explicit
- the reference contributes length, not transformed data
- the choice of policy remains on-canvas
- the user can choose either visible repair or visible fail-fast assertion

## Core Decision

Reference-driven mismatch handling is allowed only through **dedicated helper modules**.

Existing operator modules must remain strict.

That means this family is the ergonomic layer around mismatch alignment, while arithmetic and cryptographic modules remain policy-neutral.

## Family Shape

The intended family grammar is:

- `RepeatSymbolToMatch`
- `RepeatBitsToMatch`
- `TruncateSymbolToMatch`
- `TruncateBitsToMatch`
- `PadSymbolToMatch`
- `PadBitsToMatch`
- `RequireSymbolLengthMatch`
- `RequireBitsLengthMatch`

Not every member must ship in V1.
But the family naming and semantics should be locked before the line expands.

## Shared Family Rules

1. Every helper must be graph-visible.
2. Every helper must expose the chosen policy in its name.
3. Every helper must take:
   - `in`
   - `reference`
4. `reference` determines target length only.
5. For truncate-to-match helpers, output length equals `min(in.length, reference.length)`.
6. For repeat-to-match and pad-to-match helpers, output length must exactly equal `reference.length`, unless the helper is an explicit strict/error variant.
7. Ordering must always be preserved.
8. Existing operator modules must not silently adopt these policies.
9. Validation must reject scalar/sequence mismatches and domain mismatches.
10. Helpers must remain pure, deterministic, and exportable.
11. Inspector language should be consistent across the family.

## Policy Semantics

### Repeat-to-match

- repeat cyclically until the output reaches reference length
- if `in` is empty and reference is non-empty, error
- if reference is empty, output empty

### Truncate-to-match

- preserve ordering
- define preserved side explicitly:
  - left
  - right
- output length equals `min(in.length, reference.length)`
- if `in.length < reference.length`, output is the unchanged input (identity behavior)
- output length equals reference length only when truncation is actually needed
- users who need strict enforcement that lengths already match should use a later explicit strict/error helper such as `RequireSymbolLengthMatch` or `RequireBitsLengthMatch`

### Pad-to-match

- preserve ordering
- define pad side explicitly:
  - left
  - right
- define pad value explicitly:
  - symbol
  - bit
- output length equals `max(in.length, reference.length)`
- padding is applied only when `in.length < reference.length`
- if `in.length >= reference.length`, output is unchanged
- `PadSymbolToMatch` should use an explicit single-character string param for the pad character, with default value of space (` `)

## UX Guidance

All family members should use the same inspector structure:
- policy
- target source: `reference`
- current resolved length
- preview result when available

Suggested wording examples:
- `Policy: repeat cyclically to reference length`
- `Policy: truncate from the right to reference length`
- `Policy: left-pad with 0 to reference length`

This consistency matters for ergonomics.

## Product Boundary

This contract is about a coherent mismatch-helper family.

It is not about:
- hidden operator behavior
- downstream inference of policy
- generalized spreadsheets / sequence algebra
- automatic conversion between domains
- nested sequence containers

## Relationship To Existing Work

This family extends:
- `EXPLICIT-REPETITION-AND-BROADCAST-V1`
- `EXPLICIT-MISMATCH-POLICIES-V1`
- `REPEAT-TO-MATCH-V1`

It should preserve the same product values:
- explicit
- visible
- deterministic
- easy to teach

## Recommended Implementation Order

1. `REPEAT-TO-MATCH-V1`
   - `RepeatSymbolToMatch`
   - `RepeatBitsToMatch`
2. `TRUNCATE-TO-MATCH-V1`
3. `PAD-TO-MATCH-V1`
4. `REQUIRE-LENGTH-MATCH-V1`

That order is recommended because:
- repeat-to-match solves the most common key/message ergonomics problem first
- truncate/pad-to-match are lower-frequency but should follow the same family model
- require-length-match should land after the repair helpers so the family has an explicit strict companion instead of only downstream failure

## Explicit Non-Goals

Do not include:
- a generic `MatchLength` module with a free-form policy dropdown in V1
- hidden auto-selection of repeat vs truncate vs pad
- invisible reference-length derivation inside unrelated modules
- any behavior that makes `XOR` or similar modules appear magically flexible

## Success Criteria

This contract is successful when:
- the mismatch-helper family has one coherent naming and semantics model
- later ergonomic helpers can be added without ad hoc design drift
- MCW becomes easier to author in without becoming less honest about how mismatched structures were aligned
