# Canonical Chain Insertion Stage 3B V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

This contract defines the next bounded follow-on after `CANONICAL-CHAIN-INSERTION-STAGE3-V1.md`.

Stage 3B extends the first reference-aware canonical chain to one stricter surface:

**the mismatch-repair popup may offer the same reference-aware chain when the source and target already prove the linear head and tail of the chain, but the user must still choose the visible reference output explicitly.**

The goal is to reduce ceremony at the moment the user has already attempted the wrong direct connection, without inferring the missing reference branch.

---

## Product Problem

Stage 3 solved:

- pending-connection quick add can offer `Expand key -> bit words (choose reference)`
- the user can explicitly choose a visible reference output
- the inserted graph remains fully explicit

But there is still one repeated repair path that costs too many steps:

- the user directly connects a symbol-sequence key output into a bit-scalar target
- the connection fails
- the mismatch popup already knows the real source and target shapes
- the user still has to dismiss the popup and restart from quick add to choose the reference-aware chain

That is honest, but it still makes the common repeated-key repair path slower than it needs to be.

The missing follow-on is:

**let the mismatch-repair popup hand off directly into the already-shipped explicit reference chooser for this one known reference-aware chain.**

---

## Strategic Principle

**The popup may suggest the chain, but it still may not choose the reference.**

That means:

- the popup may only offer the chain when the actual failed source and target already match the chain head and tail
- selecting the chain must enter the same explicit reference-choice state shipped in Stage 3
- no reference source is guessed from nearby branches
- no partial chain is inserted before the user chooses the reference

This is not:

- automatic repair on failed drop
- hidden reference inference
- free-form mismatch-helper synthesis
- a broader “fix this graph” wizard

---

## Product Shape

When a failed attempted connection already has:

- source shape `symbol`, `sequence`
- target expectation `bits`, `scalar`

the mismatch-repair popup may show:

- ordinary bridge offers, if any exact bridge exists
- ordinary linear repair chains, if any exact chain exists
- the reference-aware chain:
  - `Expand key -> bit words (choose reference)`

Clicking that option must not insert anything immediately.

Instead, it must:

1. dismiss the mismatch popup
2. enter the same Stage 3 `choose reference` follow-up state
3. preserve the attempted source attachment
4. preserve the attempted target attachment
5. wait for the user to click a visible compatible reference output
6. commit the full repaired graph as one atomic action

---

## Surface

This slice adds one surface only:

### Reference-aware offer inside the mismatch-repair popup

- appears only after a failed attempted connection
- appears only when the failed source and target exactly match the reference-aware chain head and tail
- reuses the existing popup instead of creating a second repair UI
- reuses the existing Stage 3 reference-chooser state instead of creating a second chooser model

No other surfaces are included.

---

## Matching Rules

### Rule 1 — Match from the real failed pair

The option may appear only when:

- the attempted source exactly matches the chain `startPortShape`
- the attempted target exactly matches the chain `endPortShape`
- the chain is marked `requiresReferenceChoice`

### Rule 2 — The popup may suggest, but not complete

Choosing the option may only enter the existing explicit reference chooser.

It may not:

- auto-pick a reference
- insert the chain without a reference
- fall back to a guessed nearby symbol sequence

### Rule 3 — Target attachment must survive the handoff

The Stage 3 chooser previously handled:

- source attachment
- reference attachment

Stage 3B adds:

- preserved target attachment from the failed attempted connection

So after the user chooses the reference, the final action must add:

- source -> `RepeatSymbolToMatch.in`
- chosen reference -> `RepeatSymbolToMatch.reference`
- chain internals
- chain tail -> attempted target input

all in one history step.

### Rule 4 — Cancellation remains clean

If the user cancels from either:

- the popup
- the follow-up reference chooser

then:

- no chain is inserted
- no partial repair is left on canvas
- the graph returns to the ordinary idle state

### Rule 5 — Keep this slice narrow

This slice covers only the one already-shipped Stage 3 reference-aware chain.

It does not generalize reference-aware repair offers into a family.

---

## Include

- one reference-aware repair-chain offer inside the mismatch popup
- reuse of the existing Stage 3 reference chooser
- preserved target attachment across the popup -> chooser handoff
- one atomic final insert action
- no engine changes

---

## Exclude From V1

- hovered-input offers for reference-aware chains
- any source-less chooser flow
- any reference-dependent collector chains
- any bits-domain sibling in this slice
- any automatic selection of the only visible candidate
- any new chain registry entries beyond the Stage 3 chain already shipped

---

## Why This Slice Matters

This is the cleanest place to reuse the Stage 3 interaction.

The popup already knows the failed source and target.
The only missing input is the visible reference branch.

That makes Stage 3B the right bounded extension:

- smaller than a new hovered-input chooser model
- more direct than forcing the user to restart from quick add
- still fully explicit and glass-box honest

---

## Best Next Follow-On

Only after this slice is proven cleanly should MCW consider a truly broader Stage 3C question:

- whether hovered-input reference-aware offers are worth a second chooser model that must ask for both source and reference

That is a different complexity class and should not be bundled into 3B.
