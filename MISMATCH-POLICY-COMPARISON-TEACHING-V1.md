# MISMATCH-POLICY-COMPARISON-TEACHING-V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

Define one bounded teaching follow-on after:

- `REFERENCE-AWARE-CHAIN-TEACHING-V1.md`
- `STRICT-LENGTH-POLICY-TEACHING-V1.md`
- `HEX-BLOCK-PATH-TEACHING-V1.md`

This slice adds one compact comparison surface for the whole mismatch-helper family.

The teaching goal is:

**show `Require`, `Repeat`, `Truncate`, and `Pad` as four explicit graph policies applied to the same reference idea.**

---

## Product Problem

MCW now has several good small teaching slices:

- one for visible repeated-key repair
- one for visible strict matching
- one for hex block normalization

What is still missing is a direct policy comparison surface.

A user can now learn each helper one at a time, but not yet answer the higher-order question:

- when do I choose `require` instead of `repeat`?
- when is `truncate` the honest move?
- when is `pad` the honest move?

That comparison belongs in one workspace, not in four separate panels.

---

## Strategic Principle

**Teach the family as a decision grammar.**

That means:

- one shared message/reference branch
- four sibling policy branches
- one output per branch
- no hidden fallback between them

The workspace should read as:

- same kind of problem
- four different visible decisions

---

## Include

V1 includes exactly:

1. one compact seeded demo project showing:
   - one message/reference sequence
   - one equal-length key through `RequireSymbolLengthMatch`
   - one shorter key through `RepeatSymbolToMatch`
   - one longer key through `TruncateSymbolToMatch`
   - one shorter key through `PadSymbolToMatch`
   - visible text outputs for all four branches
2. one matching starter tutorial
3. one short implementation-status note

---

## Exclude

Do not include:

- bit-domain branches
- XOR or other operators
- ticking
- a challenge
- automatic branch comparison logic

This slice is a policy comparison surface, not an execution-depth demo.

---

## Exit Condition

This slice is complete when:

- the seeded project validates and executes
- all four policy branches are visible at once
- the tutorial makes the difference between assertion, extension, clipping, and padding legible without leaving the canvas

