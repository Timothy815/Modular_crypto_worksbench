# AES Local Consequence Analysis V1

Last updated: May 16, 2026
Status: Shipped on feature/aes-column-perturbation

---

## Purpose

Add the next bounded AES interpretation slice for MCW so students can read what changed, where it changed, and how far it spread when one bounded AES rule is perturbed, without drifting into generic cryptanalysis or inflated security claims.

This slice follows already-shipped AES work on `main`, plus one immediately preceding AES slice that is currently complete on the feature branch and should be merged before this work starts:

- [GF2 Field Arithmetic V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md)
- [AES Round Composite V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AES-ROUND-COMPOSITE-V1.md)
- [AES Row/Column Perturbation V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AES-ROW-COLUMN-PERTURBATION-V1.md)
- [AES Column Perturbation V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AES-COLUMN-PERTURBATION-V1.md)
- [Keyed S-Box Authoring V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/KEYED-SBOX-AUTHORING-V1.md)

It is not a new AES authoring slice.
It is not a generic cryptanalysis mode.
It is not a multi-round diffusion study.

It is one bounded consequence-reading slice: given an already-shipped bounded AES perturbation board, make the local structural consequence more legible as a live machine fact.

For scheduling honesty:

- `AES Row Perturbation` is already shipped on `main`
- `AES Column Perturbation` is complete and tested on `feature/aes-column-perturbation`, and this slice should not start until that branch is merged or carried forward together

---

## Why This Slice Exists

MCW's AES line is now strong in two ways:

- the machine is visible
- the machine is controllable in bounded ways

Students can now:

- inspect the canonical round
- perturb one ShiftRows rule
- perturb one MixColumns coefficient rule
- select one bounded keyed S-box variant

That is real progress.
But the remaining gap is now clearer:

- the boards show that outputs changed
- they do not yet explain the local consequence as strongly as they should

The next highest-value improvement is not another perturbation surface.
It is better interpretation of the surfaces already shipped.

Students should be able to answer:

- which stage diverged first
- how many bytes changed at that stage
- whether the change is local substitution, local routing, or local diffusion
- how later stages propagated that change

without the product implying a broader security claim than the board actually supports.

---

## Scope

### In scope

- one bounded AES consequence-analysis surface family reused across the two round-style AES perturbation boards:
  - `AES Row Perturbation`
  - `AES Column Perturbation`
- one new summary-module pattern with a custom Analyze/details view for those boards
- one tutorial focused on reading consequence on `AES Row Perturbation`, with the same summary pattern then applied to `AES Column Perturbation`
- bounded board-wiring, copy, and inspector changes needed to support that summary view
- bounded test coverage for the named stage-difference facts

### Out of scope

- new AES perturbation families
- new keyed S-box variants
- full multi-round avalanche analysis
- generic cryptanalysis-panel expansion
- freeform “compare any two arbitrary projects” infrastructure
- keyed S-box consequence reading in V1
- new claims about security, resistance, or breakability beyond the named local consequence facts

---

## Strategic Principle

V1 must separate three different things:

- the structural edit
- the visible state consequence
- the cryptographic claim boundary

The product is successful only if a student can read:

- what rule changed
- which stage first reflects that change
- how many visible bytes differ at each named stage
- what the board does and does not prove

It is not successful if it only says:

- “the outputs differ”
- “the cipher changed”
- “diffusion happened”

without showing where and how.

---

## Required Product Behavior

### 1. The consequence surface must use one explicit architectural home

V1 must use one summary-module pattern:

- one small board-resident summary module per supported AES perturbation board
- that summary module receives the already-exposed canonical and perturbed checkpoint signals as inputs
- its custom Analyze/details view renders the consequence card

Committed V1 port shape:

- the summary module is present in each supported board by default
- it is not a palette-first student-added teaching aid in V1
- it accepts one pair of `bits` inputs per committed checkpoint
- `AES Row Perturbation` wiring:
  - `canonicalStage0`, `perturbedStage0` = 128-bit ShiftRows states
  - `canonicalStage1`, `perturbedStage1` = 128-bit final round states
- `AES Column Perturbation` wiring:
  - `canonicalStage0`, `perturbedStage0` = 128-bit post-MixColumns states
  - `canonicalStage1`, `perturbedStage1` = 128-bit final round states
- the module must fail validation if any required checkpoint input is missing or not 128 bits wide

This keeps the surface:

- live with the current board state
- attached to the board as a real machine object
- inside an already-shipped MCW architectural pattern

V1 must not introduce:

- floating workspace decorations
- tutorial-only cards
- a new generic dock panel

### 2. The consequence surface must attach to already-shipped AES boards

V1 should not introduce a new standalone AES artifact just to host the explanation.

The consequence-reading surface must attach to existing shipped bounded AES boards, starting with:

- `AES Row Perturbation`
- `AES Column Perturbation`

### 3. The first divergence must be machine-visible

For each supported board, the product must explicitly name the first visible stage where the canonical and perturbed branches diverge.

Committed V1 values:

- row perturbation: first divergence at `ShiftRows`
- column perturbation: first divergence at `post-MixColumns`

The surface must not require the student to infer the first divergence by scanning raw outputs manually.

### 4. Stage-local difference counts must be visible

For each supported board, V1 must expose a bounded visible difference summary at the named stages.

Preferred minimum form:

- stage label
- whether the canonical and perturbed states match
- how many bytes or nibbles differ at that stage

Committed V1 counts:

- `AES Row Perturbation`
  - `ShiftRows`: `4` changed bytes
  - final round output: `16` changed bytes
- `AES Column Perturbation`
  - `post-MixColumns`: `4` changed bytes
  - final round output: `4` changed bytes

This remains bounded to the specific shipped comparison surfaces already present in the boards.

### 5. Difference language must stay local and honest

The product must describe:

- local substitution consequence
- local routing consequence
- local diffusion consequence

It must not slide into:

- “more secure”
- “less secure”
- “AES is broken”
- “this proves avalanche”

unless a separate, already-shipped analysis surface explicitly proves that narrower property.

### 6. The surface must remain live

When the bounded perturbation changes, the consequence surface must update live with it.

This slice is not a hard-coded annotation card.
It must read the actual current board state.

### 7. The shape must stay bounded

V1 should read only the named canonical and perturbed checkpoints already present in the boards.

Do not turn this into:

- arbitrary project differencing
- a generic graph diff engine
- a new all-purpose analysis dashboard

---

## Recommended Surface Shape

The strongest V1 shape is one local consequence card rendered in the Analyze/details view of the new board-resident summary module on each supported AES perturbation board.

Recommended content block:

- one short “rule changed” sentence
- one “first divergence appears at” line
- one compact stage table:
  - checkpoint
  - match / differ
- count of changed bytes or nibbles
- one short “what this does not prove” sentence

The “rule changed” sentence is per-board authored copy, not computed from signals.
The live-derived part of the card is the first-divergence label, match/differ state, and changed-byte counts.

Committed checkpoint inputs by board:

- `AES Row Perturbation`
  - `ShiftRows`
  - final round output
- `AES Column Perturbation`
  - `post-MixColumns`
  - final round output

---

## Data / Content Guidance

V1 must start from already-shipped known-answer surfaces rather than inventing new AES vectors.

Vector provenance for V1 must be explicit:

- `AES Row Perturbation` values are already locked in `src/ui/seeded-content.test.ts` on `main`
- `AES Column Perturbation` values are already locked in `src/ui/seeded-content.test.ts` on `feature/aes-column-perturbation` and should be treated as prerequisites for this slice
- do not re-derive or silently replace these values during implementation

Named current facts:

- `AES Row Perturbation`
  - canonical ShiftRows state: `D4BF5D30E0B452AEB84111F11E2798E5`
  - perturbed ShiftRows state: `D4275D30E0BF52AEB8B411F11E4198E5`
  - canonical final output: `A49C7FF2689F352B6B5BEA43026A5049`
  - perturbed final output: `17B7E76A75893E206FAA1FB6A8A6362F`
- `AES Column Perturbation`
  - canonical post-MixColumns: `046681E5E0CB199A48F8D37A2806264C`
  - perturbed post-MixColumns: `BB6681E554CB199A09F8D37A0F06264C`
  - canonical final output: `A49C7FF2689F352B6B5BEA43026A5049`
  - perturbed final output: `1B9C7FF2DC9F352B2A5BEA43256A5049`
The product copy should treat these as concrete consequence facts, not as optional examples.

---

## Tutorial

Ship one tutorial focused on reading consequence on `AES Row Perturbation`.

Recommended shape:

1. show that the canonical and perturbed branches share the same inputs
2. point at the exact rule that changed
3. identify `ShiftRows` as the first divergence stage explicitly
4. read the `ShiftRows` changed-byte count
5. read the final-output changed-byte count
6. state explicitly:
   - the rule changed
   - the visible state changed
   - this does not by itself prove cryptographic quality or failure

The tutorial should point back to `AES Row Perturbation`, `AES Column Perturbation`, and `AES Round (Full)` rather than re-teaching AES from scratch.

The tutorial should also note the contrast that makes the column board informative:

- row perturbation grows from `4` changed bytes at `ShiftRows` to `16` at final output
- column perturbation stays at `4` changed bytes from `post-MixColumns` through final output because `AddRoundKey` injects key material byte-wise but does not add new cross-byte diffusion

---

## Implementation Notes

### 1. Use one summary-module pattern for both supported boards

The implementation should introduce one bounded AES consequence-summary module definition whose only job is to consume already-exposed canonical and perturbed checkpoint signals and provide a custom Analyze/details consequence card.

Do not build two unrelated explanation systems for row and column perturbation in V1.

### 2. Prefer deriving from already-exposed board checkpoints

Do not add new internal AES checkpoints unless a shipped board is missing the one required to tell the consequence story honestly.

### 3. Keep difference counting pure and testable

If V1 needs helper logic to count differing bytes or nibbles between two hex states, place it in pure testable code rather than inline UI logic.

### 4. Reuse the existing analysis tone

The wording should stay aligned with the S-box rigor pass and ECC rigor pass:

- factual
- local
- non-inflated

### 5. Defer keyed S-box consequence reading cleanly

Keyed S-box consequence reading remains a good follow-on, but it should not be forced into the round-style summary-module architecture in V1.

---

## Testing Requirements

1. `npx vitest run` must pass
2. `npm run build` must pass
3. the consequence surface must name `ShiftRows` as the first divergence stage for `AES Row Perturbation` and `post-MixColumns` as the first divergence stage for `AES Column Perturbation`
4. the difference-count helper logic must reproduce:
   - `AES Row Perturbation`: `4` changed bytes at `ShiftRows`, `16` changed bytes at final output
   - `AES Column Perturbation`: `4` changed bytes at `post-MixColumns`, `4` changed bytes at final output
5. the difference-count helper must also be tested on at least one additional non-committed input pair whose changed-byte count differs from the seeded board count, so the implementation cannot pass by hard-coding `4` or `16`
6. the summary-module Analyze/details view must render from the live current board signals rather than from hard-coded copy

---

## Success Criteria

This slice is successful when:

1. a student can open the shipped AES perturbation boards, select the consequence-summary module, and immediately see where divergence begins
2. the product gives a bounded count of changed bytes or nibbles at the named stages
3. the explanation stays machine-local and does not inflate into generic security language
4. the consequence surface updates live with the current bounded perturbation state, including the zero-difference case when the perturbed rule is restored to the canonical rule
5. the boards feel easier to read, not just more heavily annotated

---

## Likely Follow-On

If this slice ships cleanly, then reassess the AES line again before adding more authoring power.

The likely follow-on is not automatically another perturbation surface.
It may be:

- one bounded keyed-S-box consequence-reading slice
- or a return to ECC if AES then feels sufficiently controllable and interpretable
