# STATEFUL-FAMILY-COMPARISON-TEACHING-V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

Define one bounded teaching follow-on after:

- `OPERATOR-FAMILY-COMPARISON-TEACHING-V1.md`
- `CLOCKED-ITERATOR-V1.md`

This slice adds one compact comparison surface for core stateful timing-oriented modules.

The teaching goal is:

**show the difference between emitting time, counting time, generating evolving state, and traversing structure over time.**

---

## Product Problem

MCW now has comparison surfaces for:

- mismatch policy
- bridge family
- operator family

What is still missing is a direct stateful comparison surface.

Users can learn `Clock`, `Counter`, `LFSR`, and a clocked iterator in separate demos, but not yet on one canvas where the timing relationship is obvious.

---

## Strategic Principle

**Teach stateful roles through one shared rhythm source.**

That means:

- one visible `Clock`
- sibling branches driven by that same pulse
- one output per branch

The workspace should read as:

- time source
- time counter
- evolving keystream state
- structural traversal state

---

## Include

V1 includes exactly:

1. one compact seeded demo project showing:
   - `Clock -> BitOutput`
   - `Clock -> Counter -> BitOutput`
   - `Clock -> LFSR -> BitOutput`
   - `Clock + BitSequenceInput -> ClockedByteRoundIterator -> BitOutput`
2. one matching starter tutorial
3. one short implementation-status note

---

## Exclude

Do not include:

- gated clocks
- multiple control registers
- keystream masking with XOR
- a challenge
- nested iterator explanation

This slice is about stateful role comparison, not larger temporal machines.

---

## Exit Condition

This slice is complete when:

- the seeded project validates and executes
- the tutorial distinguishes clock emission, counting, keystream state, and structural traversal clearly
- a user can read the stateful family on one canvas without jumping through multiple demos

