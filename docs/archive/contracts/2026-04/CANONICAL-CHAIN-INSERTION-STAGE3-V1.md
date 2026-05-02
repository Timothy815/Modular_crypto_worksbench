# Canonical Chain Insertion Stage 3 V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

This contract defines the next bounded follow-on after:

- `CANONICAL-CHAIN-INSERTION-V1.md`
- `CANONICAL-CHAIN-INSERTION-STAGE2A-V1.md`
- `CANONICAL-CHAIN-INSERTION-STAGE2B-V1.md`

Stage 3 introduces the first **reference-dependent canonical chain**.

The goal is to remove ceremony for the most common explicit alignment path in MCW:

- a visible source sequence
- a visible reference sequence
- one mismatch helper
- one bridge chain into the bit domain

without guessing the reference source and without collapsing the helper policy into a hidden convenience node.

---

## Product Problem

Stages 1, 2A, and 2B solved the linear canonical chains:

- quick add from a dragged output
- earlier discovery while hovering an empty input
- repair offers inside the mismatch popup

But a common workflow is still more expensive than it should be:

- the user has a key-like symbol sequence
- the user has a visible message-like symbol sequence that should define the target length
- the user wants the explicit chain:
  - `RepeatSymbolToMatch`
  - `AsciiSequenceToTicked`
  - `AsciiCharToBits`
- the user must currently place three modules and wire three edges, including the visible reference branch

That graph is honest and should stay honest.

The missing follow-on is:

**let the user insert this exact explicit reference-aware chain in one bounded action sequence, while making the required reference choice visible and intentional.**

---

## Strategic Principle

**Reference-dependent chains must never infer the reference.**

That means:

- the reference source must be chosen explicitly by the user
- the inserted graph must still contain a visible mismatch helper node
- the policy must stay in the node name (`RepeatSymbolToMatch`)
- the final graph must be ordinary modules and ordinary wires on canvas
- the user must be able to see both the data source and the chosen reference branch immediately after insertion

This is not:

- auto-picking the nearest sequence
- hidden graph inspection to guess “the message branch”
- a generic normalize-to-match macro
- a free-form reference wizard

---

## V1 Product Shape

Stage 3 adds one new canonical chain and one explicit second-step chooser.

### New chain

**Label:** `Expand key -> bit words (choose reference)`

**Modules inserted:**

- `RepeatSymbolToMatch`
- `AsciiSequenceToTicked`
- `AsciiCharToBits`

**Expected source shape:**

- source output must be `symbol`, `sequence`

**Result shape:**

- final output is `bits`, `scalar`

**Required extra attachment:**

- `RepeatSymbolToMatch.reference` must be connected to a user-chosen visible `symbol`, `sequence` output

---

## Surface

V1 adds this chain in **one place only**:

### Pending-connection quick add with explicit reference follow-up

Flow:

1. the user drags from a `symbol`, `sequence` output and releases on empty canvas
2. the quick-add popup may show `Expand key -> bit words (choose reference)`
3. if chosen, MCW enters a temporary `choose reference` follow-up state instead of guessing
4. the user clicks a visible compatible reference output on the canvas
5. MCW inserts the chain as one atomic action:
   - source -> `RepeatSymbolToMatch.in`
   - chosen reference -> `RepeatSymbolToMatch.reference`
   - `RepeatSymbolToMatch` -> `AsciiSequenceToTicked` -> `AsciiCharToBits`
6. the follow-up state exits immediately

No other surfaces are included in this slice.

Hovered-input strips and mismatch-repair popup offers for reference-dependent chains are deferred until this interaction proves cleanly.

---

## Matching Rules

### Rule 1 — The chain may appear only for the source shape it actually supports

The option appears only when the dragged source output is:

- `type: 'symbol'`
- `kind: 'sequence'`

### Rule 2 — The reference must be a real visible compatible output

The chooser may accept only canvas outputs that are:

- visible in the current workspace
- `type: 'symbol'`
- `kind: 'sequence'`
- not the just-inserted chain, because the chain does not exist yet

No off-canvas, implicit, or inferred reference is allowed.

### Rule 3 — The system may highlight compatible references, but not choose one

During the temporary follow-up state, MCW may:

- highlight compatible reference outputs
- dim incompatible outputs
- show a short instruction such as `Choose visible reference sequence`

MCW may not:

- preselect a reference
- auto-complete on hover
- pick the only available candidate automatically

### Rule 4 — Cancellation must be clean

If the user cancels or clicks nowhere valid:

- no modules are inserted
- no partial chain is left behind
- the UI returns to the ordinary idle state

### Rule 5 — Insertion stays atomic

Once the user chooses the reference, the entire insertion is committed as one undoable action.

There must never be an intermediate state where the chain is inserted without its reference wire.

### Rule 6 — Placement stays linear and readable

The inserted modules are placed as a short forward lane beginning at the invocation point using the same deterministic Stage 1 placement rules.

The reference wire is added from the chosen visible output to `RepeatSymbolToMatch.reference`.

Stage 3 does not attempt to reroute the reference branch specially.

### Rule 7 — Policy remains visually authoritative

The graph must still show the real policy node:

- `RepeatSymbolToMatch`

The chain must not be labeled or presented as if it were a generic “auto expand” feature.

---

## Include

- one new canonical chain: `Expand key -> bit words (choose reference)`
- one explicit reference-selection follow-up state attached to pending-connection quick add
- visual highlighting of compatible reference outputs during that follow-up state
- one atomic insert action that includes both the chain modules and the chosen reference attachment
- no engine changes

---

## Exclude From V1

- any automatic reference inference
- any reference-dependent chain offers in hovered-input strips
- any reference-dependent chain offers in mismatch-repair popups
- any bits-domain repeat-to-match chain in this slice
- any width-parameterized or policy-parameterized chain synthesis
- any new helper primitive for reference anchoring
- any new mismatch policy beyond the already-shipped `RepeatSymbolToMatch`

---

## Store / UI Requirements

### New temporary UI state

V1 will require a bounded temporary state for the follow-up chooser, conceptually:

- pending source attachment
- chosen chain id
- compatible reference shape
- popup anchor / invocation position

This is UI-only state.
It is not persisted into the project document.

### New atomic action payload

The existing chain insertion path must be extended so one action can add:

- the inserted chain modules
- the internal chain connections
- the source attachment
- the chosen reference attachment

in one history step.

---

## First Implementation Shape

The clean first implementation is:

- reuse the existing pending-connection quick-add surface
- add one reference-aware chain option to the chain registry with metadata marking it as `requiresReferenceChoice: true`
- after selection, reuse the canvas to collect the explicit reference output choice
- commit the final graph through one store action

This keeps the new work inside the already-shipped chain insertion architecture instead of opening a second authoring system.

---

## Why This Slice Matters

This is the first place where canonical chain insertion meets a real branch.

If MCW can ship this slice cleanly, it proves that:

- reference-dependent convenience can stay explicit
- the product can reduce ceremony without guessing structure
- the most common repeated-key authoring path can become materially faster while preserving the glass-box model

That is the correct boundary before considering any broader reference-aware chain family.

---

## Best Next Follow-On

Only after this slice is proven cleanly should MCW consider either of these:

- Stage 3B — hovered-input or mismatch-popup offers for this same reference-aware chain
- a bits-domain sibling such as `Repeat bits -> bit words (choose reference)` if there is real repeated use and the reference-choice interaction is already stable
