# BitRemap Editor V1 — BitExpand Primitive + Shared Tactile Wire Editor

## Status

Unshipped. Proposed for implementation.

## Purpose

Add a `BitExpand` primitive for expansion permutations (output larger than input, duplicate indices allowed), and build a shared tactile wire editor component that serves both `BitExpand` and `BitSelect`. Retrofit `BitSelect` to use the same editor in the same slice, so both primitives ship with identical interaction quality.

## The Gap

`BitSelect` shipped with a raw CSV param for the selection order. It works, but authoring a DES PC-1 table by typing `57,49,41,33,25,...` is error-prone and opaque. The Permutation, Rotor, Reflector, and Plugboard editors all have tactile wire interfaces where the mapping is visible and clickable. `BitSelect` and the forthcoming `BitExpand` should have the same quality.

Additionally, `BitExpand` does not exist yet. It is the complement to `BitSelect`:
- `BitSelect` — compression permutation: n inputs → m outputs where m < n, no duplicate indices, dropped bits are gone
- `BitExpand` — expansion permutation: n inputs → m outputs where m > n, duplicate indices allowed, some input bits feed multiple output positions

The canonical example of `BitExpand` is the DES **E-expansion**, which maps 32 bits → 48 bits by repeating 16 boundary bits. Without `BitExpand`, an honest DES round function is inexpressible in the workbench.

## Strategic Principle

**Tactile authoring is not cosmetic — it is part of the teaching.** When a student can see all 32 input positions on the left and 48 output slots on the right, and physically wire position 32 to both slot 1 and slot 48, they understand what "expansion permutation" means at a glance. That understanding does not come from reading a number list.

The wire editor must be designed once, for both primitives, from the start. A single `BitRemapEditor` component handles both semantics:
- For `BitSelect`: each input position can feed at most one output slot (duplicate click is a no-op or removes the wire)
- For `BitExpand`: each input position can feed multiple output slots (duplicate click is allowed)

The distinction between the two modes is a single prop on the shared component.

## V1 Scope

V1 ships:
1. `BitExpand` engine primitive with full validation and Analyze transformation view
2. `BitRemapEditor` shared component (Option A pick-list style — see Interaction Model below)
3. `BitSelect` retrofitted to use `BitRemapEditor` (CSV stays as sync'd fallback)
4. Optional `inputWidth` hint param added to both `BitSelect` and `BitExpand`
5. Demo workspace, tutorial, and challenge for `BitExpand`

## Included

- `BitExpand` primitive on `bits`:
  - one `bits` input
  - one `bits` output
  - `order` param: comma-separated list of zero-based input bit indices, repeats allowed
  - `inputWidth` optional hint param (integer ≥ 1): pre-declares input width so the editor renders before a live connection arrives
  - output width = `order.length`, must be strictly greater than input width
  - static validation: all indices within input bounds (when input width is knowable), at least one repeated index required (otherwise use `Permutation` or `BitSelect`)
- `inputWidth` optional hint param added to `BitSelect` with the same semantics
- `BitRemapEditor` component (shared, see below)
- `BitSelect` configure tab updated to use `BitRemapEditor` as primary authoring surface
- `BitExpand` configure tab uses `BitRemapEditor` from day one
- Analyze transformation view for `BitExpand` (reuses the routing view pattern, colored wires, shows repeated positions visually)
- one demo workspace: **Visible Key Expansion**
- one tutorial: **Repeating Bits on Purpose**
- one challenge: **Repair the E-Expansion**
- learning-sequence placement after `visible-key-selection`

## Explicitly Excluded

Do not include in V1:
- a full DES round function workspace (that belongs in a follow-on expansion pack)
- dynamic runtime-driven expansion (where a signal selects which bits to repeat)
- a `BitRemap` unified primitive that collapses `BitSelect` and `BitExpand` into one module — they have different validation rules and different teaching meanings; keep them separate
- multi-output fan-out ports (expansion stays single-output, wiring-layer fan-out is separate)
- drag-to-reorder output slots inside the editor (Option A appends; CSV edit is the reorder path for V1)

## Primitive Shape — BitExpand

```
BitExpand
  input:  bits (any width n)
  output: bits (width = order.length, must be > n)
  params:
    order:      string   — comma-separated zero-based input bit indices, repeats allowed
    inputWidth: number?  — optional visual hint; not used in evaluate()
```

Evaluation: `output[i] = input[order[i]]` for each i in 0..order.length-1.

Validation (static, when input width is knowable):
- every index in `order` is in range `[0, inputWidth - 1]`
- `order.length > inputWidth` (use `Permutation` if equal, `BitSelect` if less)

Validation (always):
- `order.length > 0`

## inputWidth Param — BitSelect Update

```
BitSelect (updated)
  params (additions only):
    inputWidth: number?  — optional visual hint; not used in evaluate()
```

The `inputWidth` hint does not affect evaluation or static validation against live connection widths. It only tells the editor how many input dots to render before a connection arrives. If the live connection provides a different width at runtime, the editor uses the live width and ignores `inputWidth`.

## Interaction Model — BitRemapEditor (Option A: Pick-List)

The editor has two zones:

**Input lane (left column)**
- One numbered dot per input position (count = `inputWidth` hint if set, else live connection width, else a small default like 8)
- Each dot shows its zero-based index
- Dots are colored using `getPermutationWireColor(index)` — same color palette as Permutation and Rotor editors
- For `BitSelect`: a dot grays out once it has been selected (already in the output list)
- For `BitExpand`: a dot shows a count badge if selected more than once (e.g. ×2)

**Output sequence (right column)**
- One chip per entry in the current `order` list, in order
- Each chip shows: output slot index (0-based position in output), source input index, colored to match the source dot
- Chips can be removed individually with an × button
- Chips display in a scrollable vertical list if the selection is long

**Wire canvas (center SVG)**
- Curved colored lines from each input dot to each output chip, matching the Permutation/Rotor wire style
- For `BitExpand`: multiple lines can originate from one input dot (one per usage)
- Wire opacity and rendering matches the existing `permutation-wire-editor` CSS class so it is visually consistent with all other wire editors

**Interaction**
- Click an input dot → arms it (highlights it, shows "Armed input N" status)
- While armed, click any input dot again → appends that input to the output sequence, adds a chip, draws a wire
  - For `BitSelect`: clicking an already-selected dot de-arms without appending (no duplicates)
  - For `BitExpand`: clicking any dot (including already-selected ones) always appends
- Click the × on a chip → removes that output slot from the sequence (re-indexes all chips after it)
- Click an armed dot again → de-arms without appending
- **Clear All** button → resets `order` to empty
- CSV field below the editor → always in sync with the visual state, editable directly as a power-user fallback

**Status line** (above the editor, matches Rotor/Permutation style)
- At rest: "N input positions · M output slots selected"
- Armed: "Armed input N — click any input to append to output"
- For `BitExpand`: "Armed input N — click any input to append (repeats allowed)"

## CSS

Reuse the existing `permutation-wire-editor`, `permutation-wire-lane`, `permutation-wire-canvas`, `permutation-port`, and `permutation-wire-lane-label` classes wherever layout is identical. Add new classes only where the asymmetric (n→m) layout requires them:
- `.remap-editor` — wrapper; extends `permutation-wire-editor` layout for asymmetric widths
- `.remap-output-chip` — individual output slot chip in the right column
- `.remap-output-chip-remove` — the × button inside each chip
- `.remap-input-dot-count` — the ×N badge on an over-selected input dot (BitExpand only)
- `.remap-output-sequence` — scrollable container for the output chip list

## Analyze Transformation View — BitExpand

Reuse the existing `routing` kind view from `getBitSelectTransformation`, adapted for expansion:
- Input lane: all n input positions, with a count badge on positions used more than once
- Output lane: all m output positions mapped from their source input positions
- Summary line: "Expands N input bits to M output bits. X input positions appear more than once."
- Copy: explains that expansion permutations copy boundary bits so downstream modules (like XOR with a round key) can operate on a wider surface without losing the source bit

## Candidate Teaching Surface

### Demo Workspace — Visible Key Expansion
- one `HexSource` of width 8 (representing a small input word)
- one `BitExpand` that maps 8 bits → 12 bits by repeating the two boundary bits at each end
- one `BitSelect` on the same source for contrast (8 → 6, dropping two middle bits)
- `BitOutput` sinks showing both results
- the graph should make visually obvious that BitExpand adds output positions while BitSelect removes them
- layout: source centered, BitExpand branch above, BitSelect branch below

### Tutorial — Repeating Bits on Purpose
- step 1: identify the input bus and count its positions
- step 2: inspect the BitExpand order list — find the positions that appear twice
- step 3: explain why DES repeats boundary bits: the expanded 48-bit block XORs with a 48-bit round subkey, so the repeated boundary bits participate in two different subkey bits — creating inter-bit diffusion at the round boundary
- step 4: compare BitExpand against BitSelect — one grows the output, one shrinks it; both drop the CSV and use wires
- step 5: open Analyze on BitExpand to see the repeated-wire routing view

### Challenge — Repair the E-Expansion
- a working 8→12 BitExpand has two boundary entries deleted from the order list (output becomes 8→10)
- learner restores the two missing repeated positions so the output width is 12 again and matches the reference
- hints: "Count the output chips — you need 12", "The first and last input positions should appear twice"

## Core Rules

1. **One editor component, two semantic modes**
   - `allowRepeats` prop on `BitRemapEditor` — false for `BitSelect`, true for `BitExpand`
   - no other behavioral difference; all interaction, CSS, and wire rendering is shared

2. **Output width is always derived, never set separately**
   - `order.length` is the output width for both primitives
   - no `outputWidth` param; the editor's output chip count is the source of truth

3. **inputWidth is a hint, not a constraint**
   - it does not affect evaluate() or static width validation against live connections
   - it only affects the editor's render before a connection arrives
   - if a live connection provides a different width, the editor adapts and ignores the hint

4. **CSV stays as a sync'd fallback, not the primary surface**
   - the CSV field is always visible below the wire editor
   - edits to the CSV immediately update the wire display
   - edits to the wire display immediately update the CSV
   - neither is hidden or read-only

5. **Visual consistency with existing wire editors**
   - same color palette (`getPermutationWireColor`)
   - same wire style (SVG lines with endpoint circles)
   - same armed/hover/drag affordances as Rotor and Permutation editors
   - students who have used any other wire editor in MCW should find BitRemapEditor immediately familiar

## Success Criteria

V1 is successful if:
- a student can build a DES E-expansion-style mapping by clicking input dots without typing a single number
- a student can look at the wire editor and immediately identify which input positions are being repeated (BitExpand) or dropped (BitSelect)
- the Analyze tab's routing view shows the expansion wires including repeated connections
- the CSV fallback stays in sync with every wire edit so power users are never blocked
- `BitSelect` and `BitExpand` feel like siblings in the module palette — same interaction, different validation rule

## Likely Follow-Ons

- **DES Round Function expansion pack** — once `BitExpand` ships, a full DES E-expansion step is expressible and the first honest DES round becomes a named expansion-pack workspace
- **Rotor editor unification** — the Rotor wire editor could be migrated to share the `BitRemapEditor` component as a long-term refactor; not in V1 scope
- **Drag-to-reorder output chips** — V1 uses CSV editing as the reorder path; a later slice could add drag handles on chips if classroom use shows it is needed

## Explicitly Avoid Next

Do not turn this into:
- a general-purpose graph-level wire router
- a runtime-signal-driven expansion (that is `Mux`/`Demux` territory)
- a `BitRemap` mega-primitive that collapses BitSelect and BitExpand
- hidden expansion behavior on any existing primitive
- an editor that requires drag-and-drop to be usable (click-to-arm must work without drag)
