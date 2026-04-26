# BitSelect V1 — Compression Permutation

## Status

Unshipped. Proposed for implementation.

## Purpose

Add a `BitSelect` primitive that maps an arbitrary ordered subset of input bits to a smaller output — a compression permutation. This fills the gap between `Permutation` (n → n, every bit used) and `BitWindow` (n → m, contiguous slice only). It makes DES-style key schedule steps expressible in the workbench for the first time.

## The Gap

MCW currently has:
- `Permutation` — n bits → n bits, full reordering, every input used exactly once
- `BitWindow` — n bits → m bits, but only contiguous ranges (start + width)

What is missing is a primitive that selects **arbitrary, non-contiguous** bits from an input and emits them in a specified order, with the remaining input bits discarded. This is called a **compression permutation** or **selection permutation** in the literature.

The canonical example is DES:
- **PC-1** — 64-bit key → 56 bits (drops the 8 parity bits, reorders the rest)
- **PC-2** — 56 bits → 48 bits (selects the round subkey from the shifted key register)

Without `BitSelect`, a DES key schedule is inexpressible as an honest graph. With it, the entire key schedule from key input to round subkeys becomes a visible chain of explicit selection steps.

## Strategic Principle

**Selection must remain a visible, explicit transform — not a hidden slice mode on `Permutation`.**

That means:
- the output width is determined entirely by how many positions are listed in the selection table
- every listed position must be within the input bounds
- no position may be listed twice (each bit selected at most once)
- dropped bits are simply not in the output — there is no "null" output port for discarded bits

## V1 Scope

V1 ships **one new primitive with validation and an Analyze transformation view**, plus one demo and one tutorial showing a DES-style key selection step. No full DES implementation is required or intended.

## Included

- `BitSelect` primitive on `bits`
- ordered selection table parameter (`order`: array of zero-based input bit indices)
- output width equals `order.length`, strictly less than input width
- static validation:
  - all indices within input bounds (when input width is knowable)
  - no duplicate indices
  - output width must be strictly less than input width (otherwise use `Permutation`)
- Analyze transformation view showing input grid, selected positions highlighted, output grid
- one demo workspace: **Visible Key Selection**
- one tutorial: **Dropping Bits on Purpose**
- one challenge: **Repair the Key Selection**
- learning-sequence placement after `BitWindow` and before any DES-depth follow-on

## Explicitly Excluded

Do not include in V1:
- a full DES key schedule workspace (that belongs in a follow-on or expansion pack)
- a `PermutationChoice` alias or DES-specific naming on the primitive itself
- multi-output fan-out from a single selection step
- a "keep discarded bits" secondary output port
- variable-width dynamic selection driven by a runtime signal

## Primitive Shape

```
BitSelect
  input:  bits (any width n)
  output: bits (width = order.length, must be < n)
  params:
    order: number[]   — ordered list of zero-based input bit indices
```

Evaluation: `output[i] = input[order[i]]` for each i in 0..order.length-1.

Validation (static, when input width is knowable):
- every index in `order` is in range `[0, inputWidth - 1]`
- no index appears more than once in `order`
- `order.length < inputWidth` (use `Permutation` if equal)

Validation (always):
- `order.length > 0`

## Analyze Transformation View

Kind: `selection` (or reuse `routing` with a compressing variant)

Show:
- input lane: all n input bit positions, with selected positions highlighted
- selection order: the ordered list of selected indices
- output lane: the m output bit positions mapped from the selected inputs

Consequence text should explain that dropped bits are permanently lost at this step — this is how key selection strips parity, extracts subkeys, or narrows a bus to the bits that matter.

## Candidate Teaching Surface

### Demo Workspace — Visible Key Selection
- one `Key` or `BitSource` of width 16 or 32
- one `BitSelect` that drops some bits and reorders the rest
- one `BitOutput` showing the result
- a second path showing `BitWindow` on the same source for contrast
- the graph should make the difference between contiguous slicing and arbitrary selection visible

### Tutorial — Dropping Bits on Purpose
- step 1: identify the full input bus and count the bits
- step 2: inspect which positions the selection table picks and which it drops
- step 3: explain why DES drops parity bits at PC-1 rather than just ignoring them
- step 4: compare `BitSelect` vs `BitWindow` — when do you need non-contiguous selection?

### Challenge — Repair the Key Selection
- a working selection step is broken by corrupting two or three entries in the `order` table
- learner restores the correct selection table so the output matches the reference

## Core Rules

1. **Selection must be explicit and inspectable**
   - the `order` array is the entire transform — no hidden stride, no implicit grouping
   - the Analyze view should make the input-to-output mapping visually obvious

2. **Output width is derived, not separately specified**
   - `order.length` determines output width automatically
   - no separate `outputWidth` param that could get out of sync

3. **Validation must be static where possible**
   - when upstream width is knowable, out-of-range indices are a build-time error
   - duplicate indices are always a build-time error regardless of width availability

4. **The primitive stays bounded**
   - one input, one output, one ordered index list
   - no multi-output splitting, no mask semantics, no runtime-driven selection

## Success Criteria

V1 is successful if:
- a DES PC-1 or PC-2 step can be expressed as a single `BitSelect` module with the correct index table
- out-of-range and duplicate indices produce clear validation errors
- the Analyze view makes it visually obvious which input bits were kept and which were dropped
- learners can distinguish `BitSelect` (arbitrary non-contiguous selection) from `BitWindow` (contiguous slice) and `Permutation` (full reordering)

## Likely Follow-Ons

- a full DES key schedule expansion-pack workspace once `BitSelect` and `BitShifter` rotation are confirmed sufficient
- a `LeftHalf` / `RightHalf` convenience alias if classroom use shows the 28-bit split pattern is repeated enough to warrant it
- deeper DES or PRESENT teaching labs once the primitive vocabulary is proven in classroom use

## Explicitly Avoid Next

Do not turn this into:
- a full DES implementation shipped as a single opaque module
- a multi-output "split and select" compound operation
- a runtime-driven selector (that is `Mux` / `Demux` territory)
- hidden bit-dropping behavior on any existing primitive
