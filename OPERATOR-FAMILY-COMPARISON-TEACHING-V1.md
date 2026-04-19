# OPERATOR-FAMILY-COMPARISON-TEACHING-V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

Define one bounded teaching follow-on after:

- `BRIDGE-FAMILY-COMPARISON-TEACHING-V1.md`
- `MISMATCH-POLICY-COMPARISON-TEACHING-V1.md`

This slice adds one compact comparison surface for core bit-domain operators.

The teaching goal is:

**show how different operators change the same visible input words in different ways.**

---

## Product Problem

MCW already has good operator-focused labs such as `Beyond XOR`, but those labs teach one composed machine.

What is still missing is the simpler comparison question:

- what changes if I choose XOR instead of AND?
- how is modular addition different from boolean combination?
- what kind of move is a rotate compared with a combiner?

That comparison belongs on one canvas with the same shared inputs feeding sibling operator branches.

---

## Strategic Principle

**Teach operator choice through side-by-side branches, not prose alone.**

That means:

- one shared pair of source words
- several sibling operator branches
- one output per branch

The workspace should read as:

- same visible operands
- different operator decision
- different resulting word

---

## Include

V1 includes exactly:

1. one compact seeded demo project showing:
   - shared `HexSource(left)` and `HexSource(right)` operands
   - `XOR`, `AND`, and `AddMod` as sibling two-input operator branches
   - `BitShifter` as one unary sibling branch on the left word
   - `BitsToHex -> HexOutput` on every branch
2. one matching starter tutorial
3. one short implementation-status note

---

## Exclude

Do not include:

- a longer composed round
- mismatch helpers
- bridge comparisons
- a challenge
- hidden math summaries

This slice is about operator choice, not larger machine architecture.

---

## Exit Condition

This slice is complete when:

- the seeded project validates and executes
- the tutorial explains the difference between boolean combination, arithmetic combination, and structural movement
- a user can compare operator outcomes directly on one canvas

