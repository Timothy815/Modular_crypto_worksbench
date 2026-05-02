# REFERENCE-LENGTH-ERGONOMICS-V1

Last updated: April 11, 2026

Status: Superseded by `REFERENCE-LENGTH-ERGONOMICS-V2`

## Purpose

Define the next bounded ergonomics slice for **explicit reference-driven length bookkeeping**.

This contract is about making sequence normalization and alignment easier to author without hiding the chosen policy.

Current note:
- this V1 framing is retained for history
- active decision work should use `REFERENCE-LENGTH-ERGONOMICS-V2`

It does not replace the existing mismatch-helper family.
It builds on top of it.

## Product Problem

MCW now has the correct explicit mismatch grammar:
- `Repeat*ToMatch`
- `Truncate*ToMatch`
- `Pad*ToMatch`
- `Require*LengthMatch`

That is the right architecture.

The remaining friction is authoring overhead around reference-derived length information itself.

Users still run into cases where they want to say:
- use the length of this visible message here
- normalize both sides to the same visible block width
- prepare a decrypt path using the same explicit reference length policy as the encrypt path
- keep the policy visible without manually recreating the same accounting structure several times

The current system is honest but still asks for too much repetitive plumbing in some workflows.

## Why Now

This should follow:
- expanded end-to-end pipeline demos
- sequence-vs-tick cueing

because those slices make the real remaining friction concrete.

The goal here is not new engine power.
The goal is to reduce repeated authoring ceremony while preserving:
- visible reference inputs
- visible policy choice
- visible normalization order

## Core Question

Can MCW reduce sequence-length bookkeeping without inventing a hidden “auto-match” layer?

## Strategic Principle

**Derive length explicitly, never infer policy silently.**

That means:
- deriving or reusing visible reference length is good
- silently deciding whether to repeat, truncate, or pad is not
- helpers may reduce duplicated graph bookkeeping
- helpers may not make operators look magically flexible

## Relationship To Existing Work

This slice extends:
- `MATCH-LENGTH-MISMATCH-HELPERS-V1`
- `REPEAT-TO-MATCH-V1`
- `TRUNCATE-TO-MATCH-V1`
- `PAD-TO-MATCH-V1`
- `REQUIRE-LENGTH-MATCH-V1`
- `PIPELINE-MICRO-DEMOS-V2`

This is an ergonomics layer around those slices, not an alternative to them.

Current scheduling note:
- this slice is explicitly deferred until after `PIPELINE-MICRO-DEMOS-V2` ships and the merged role/cueing pass lands
- its necessity should be re-validated against real workflow feedback rather than assumed up front

## Include

V1 should include bounded helpers that make **reference-driven normalization** easier to author while keeping policy visible.

The strongest bounded candidates are:
1. a visible length-derivation helper if needed for workflows where the same reference drives multiple branches
2. inspector guidance that makes reused reference-derived normalization obvious

The exact implementation may be one helper or a very small family, but it must stay bounded.

## Exclude

Do not include in V1:
- a generic `AutoMatchLength` operator
- hidden fallback among repeat/truncate/pad
- downstream operator changes
- graph rewriting
- automatic multi-branch normalization inserted behind the scenes
- a generic expression language for lengths

## Core Design Boundary

The right kind of ergonomics is:
- explicit helper modules whose names say what they do
- shared visible reference inputs
- reduced duplication in common workflows

The wrong kind of ergonomics is:
- “just make XOR handle it”
- “normalize however needed”
- a single helper with a vague mode dropdown and no clear graph meaning

## Recommended V1 Product Shape

The only acceptable bounded V1 direction is an explicit length-derivation helper plus the existing policy helpers.

### Explicit length-derivation helper plus existing policy helpers

Candidates:
- `SymbolSequenceLengthRef`
- `BitsSequenceLengthRef`
- or one similarly bounded visible “reference length proxy” helper

Purpose:
- let one visible reference source drive multiple existing mismatch helpers without re-plumbing the same sequence path awkwardly

Important constraint:
- the policy still lives in `Repeat*ToMatch`, `Truncate*ToMatch`, `Pad*ToMatch`, or `Require*LengthMatch`
- this helper contributes length visibility only
- MCW already supports output fanout, so this helper must justify itself as a named reference anchor or organizational pass-through, not as a workaround for missing connection fanout
- this helper must remain a pass-through / named-anchor shape, not a new hidden length-signal type in disguise

## Core Rules

1. **Policy must remain explicit on the graph**
- the user must still choose repeat, truncate, pad, or require
- no helper may silently choose among those for them

2. **Reference contribution must remain visible**
- if a helper derives or reuses reference length, the user must be able to see which sequence is providing it
- a helper in this family must not introduce a new phantom length signal type

3. **Normalization order must stay readable**
- if a workflow requires truncate-then-pad, that sequence of decisions should still be legible
- do not compress genuinely different policies into one ambiguous box

4. **Helpers must compose with the existing family**
- this is not a replacement family
- it must feel like a convenience layer around the established mismatch grammar

5. **No operator semantics may change**
- `XOR`, `Permutation`, `SBox`, `AddMod`, and similar modules remain strict

## Recommended UI Language

Use wording like:
- `Reference length source`
- `Reuses visible reference length`
- `Policy remains explicit downstream`
- `Normalization policy: repeat`

Avoid wording like:
- `Auto-fix mismatch`
- `Smart align`
- `Handle lengths automatically`

## Likely Workflow Targets

This slice should specifically improve workflows such as:
- repeated-key ASCII encrypt/decrypt graphs with mirrored forward and reverse paths
- block-width normalization before XOR or Feistel-style round steps
- hex-authored visible block pipelines
- any graph where the same reference length must be reused across multiple branches

## Success Criteria

This slice is successful when:
- common normalization workflows require less duplicated bookkeeping
- the graph remains explicit about which policy is being applied
- users can still point to the module that made the mismatch decision
- MCW feels more ergonomic without feeling more magical
- and the value is strong enough to justify a new helper beyond ordinary fanout and composition

## Explicitly Avoid Next

Do not let this slice drift into:
- an automatic pipeline synthesizer
- hidden multi-policy resolution
- a generic sequence algebra language
- operator-level coercion

This is a bounded ergonomics layer only.
