# Canonical Chain Insertion Stage 2B V1

Last updated: April 18, 2026

Status: Draft

---

## Purpose

This contract defines the next bounded follow-on after:

- `CANONICAL-CHAIN-INSERTION-V1.md`
- `CANONICAL-CHAIN-INSERTION-STAGE2A-V1.md`

Stage 2B adds one narrow ceremony-reduction surface:

**when a connection attempt fails because the graph needs a known explicit bridge / collector chain, MCW may offer that already-shipped canonical chain directly inside the existing mismatch-repair popup.**

The goal is not to auto-fix the graph.

The goal is to let the user choose the honest full repair path at the exact moment the mismatch is already explicit.

---

## Product Problem

Stage 1 solved:

- fast insertion of a known chain after dragging from an output and releasing on empty canvas

Stage 2A solves:

- earlier discoverability while hovering an unconnected input port

But there is still a distinct moment of friction:

- the user tries to connect two visible ports directly
- the connection is rejected for an explicit domain / kind reason
- the popup can already explain the missing bridge or collector
- the user still has to close that loop manually by reopening quick add and rebuilding the known repair chain

That is honest, but still too much ceremony in the narrow cases where the repair path is already canonical and already shipped.

The missing follow-on is:

**let the mismatch-repair popup offer the explicit known-good chain itself, without widening the chain registry and without guessing any hidden reference source.**

---

## Strategic Principle

**Repair suggestions may compress authoring steps only after the mismatch is already explicit.**

That means:

- the user must already have attempted a specific connection
- the popup must still explain why the direct connection is invalid
- any chain option must remain visible, named, and intentionally chosen
- the inserted result must still be ordinary modules and ordinary wires on canvas
- the chain set must remain bounded to already-shipped linear chains

This is not:

- silent graph rewriting
- automatic repair on drop
- reference inference
- free-form synthesis from arbitrary error text
- generic “fix my graph” automation

---

## V1 Product Shape

When a direct connection attempt fails and the existing repair popup already knows:

- the source output shape
- the target input expectation

the popup may show a small `Common repair chains` section.

That section lists only canonical chains whose:

- `startPortShape` matches the actual source output
- `endPortShape` matches the target input expectation

Clicking one option inserts the same explicit chain shape used by Stage 1, attaches its head to the attempted source, and attaches its tail to the attempted target.

The popup remains an explanation surface first and an insertion surface second.

---

## Surface

This slice adds one surface only:

### Mismatch-repair popup chain offers

- appears only after a failed attempted connection
- reuses the existing mismatch / bridge-guidance popup instead of creating a second popup system
- lists only canonical chains that solve the exact visible mismatch
- disappears when the popup is dismissed

No other surfaces are included in this slice.

---

## Chain Set

This slice reuses the existing shipped Stage 1 chain registry exactly:

- `ASCII sequence -> bit words`
- `Collect ticked bits -> ASCII`
- `Collect ticked bits -> hex`

No new chains are added here.

In particular:

- no single-module shortcuts are added
- no reference-dependent chains are added
- no width-parameterized chains are added
- no mismatch-family chains like `Repeat*ToMatch` are added through this surface

---

## Matching Rules

### Rule 1 — Match from the actual failed connection pair

The popup may offer a chain only when the product already knows both:

- the actual source port shape (`type`, `kind`)
- the required target port shape (`type`, `kind`)

This slice is keyed from the concrete failed connection pair, not from vague nearby graph context.

### Rule 2 — A chain must solve the whole visible mismatch

A chain may appear only when its:

- `startPortShape` matches the source output exactly
- `endPortShape` matches the target input exactly

If a chain only solves half the mismatch, it must not appear in this surface.

This same whole-pair rule also applies to bridge offers shown in the popup:

- a bridge option may appear only if its real input shape matches the attempted source exactly
- and its real output shape matches the attempted target exactly

### Rule 3 — Suggestions remain additive

The popup’s existing explanatory language and single-bridge guidance remain visible.

`Common repair chains` is an additional section, not a replacement for the explanation text.

### Rule 4 — No hidden reference inference

If a repair path would require choosing a third visible branch as a `reference`, that path is out of scope.

This is why:

- `Expand key -> ticked bit words`
- `Repeat*ToMatch`-driven repair chains

do not appear in Stage 2B.

### Rule 5 — Reuse Stage 1 insertion behavior

Clicking a mismatch-repair chain option must use the same atomic `insertChain` path and deterministic placement rules already shipped in Stage 1.

The only difference is that Stage 2B attaches:

- the chain head to the attempted source output
- the chain tail to the attempted target input

No second chain-insertion action is introduced.

### Rule 6 — Keep the chain list short

If no canonical chains solve the exact mismatch, the `Common repair chains` section does not render.

If more than one chain matches, show them in alphabetical label order.

Do not turn the popup into a scrolling chooser.

### Rule 7 — The popup must still teach first

The mismatch explanation must remain visible even when a chain option is offered.

The user should still be able to read:

- what failed
- why it failed
- which bridge / collector family is involved

before choosing the chain.

---

## Include

- one `Common repair chains` section inside the existing mismatch-repair popup
- reuse of the existing canonical chain registry
- reuse of the existing atomic `insertChain` insertion path
- explicit attachment from attempted source to inserted chain head
- explicit attachment from inserted chain tail to attempted target
- no engine changes

---

## Exclude From V1

- any automatic repair on failed drop
- reference-dependent chain offers
- mismatch-family chain offers that require a third visible reference source
- any new chain registry entries
- any free-form synthesis from error language
- any chain option that solves only part of the mismatch
- hovered-port chain strips outside the popup

---

## Attachment Semantics

Stage 2B must stay narrower than general chain authoring.

The popup may only offer chains for mismatches where the full repaired path is linear:

```text
source -> [inserted chain] -> target
```

That means:

- one source output
- one target input
- no extra branch inputs
- no inferred references

This keeps the feature honest and deterministic.

---

## Relationship to Stage 3

Stage 2B is still not true Stage 3.

It only reuses already-shipped linear chains on a stricter surface.

The next real boundary after Stage 2A / 2B is:

### Stage 3 — Reference-dependent chain offers

That future slice would cover chains such as:

- `Expand key -> ticked bit words`
- other mismatch-repair paths that require selecting a visible `reference` branch

Stage 3 must not open until there is a concrete graph-proximity and reference-selection rule that avoids hidden magic.

---

## Best Next Follow-On

After Stage 2B, the next coherent follow-on would be:

- `CANONICAL-CHAIN-INSERTION-STAGE3-V1`

That contract should solve one problem only:

**how to offer a reference-dependent repair chain without guessing the wrong visible reference source.**

Until that rule exists, Stage 3 should remain closed.

---

## Why This Slice Matters

Stage 1 made canonical chains fast after an intentional quick-add gesture.

Stage 2A makes those same chains visible earlier while hovering likely target ports.

Stage 2B completes the linear authoring line:

- the user tries the direct connection
- the product explains the exact mismatch
- the product can now offer the honest full explicit repair path right there

That is the right next step because it removes repeated repair ceremony exactly where the user has already proven intent, while still keeping the graph fully explicit and stopping short of reference-driven automation.
