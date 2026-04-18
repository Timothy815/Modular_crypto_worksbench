# Canonical Chain Insertion V1

Last updated: April 17, 2026

Status: Tightened draft

---

## Purpose

This contract defines a bounded ceremony-reduction slice for MCW:

**allow the user to insert a small explicit chain of already-known modules in one action when the next move is obvious, without hiding any structure or inferring any invisible behavior.**

The goal is not auto-wiring the machine.

The goal is to remove repetitive placement and wiring work for the handful of bridge and collector chains that users now build over and over again.

---

## Product Problem

Recent work improved discovery and diagnosis:

- palette cards now surface role and typical-path language
- hovered input ports now bias likely sources and bridges to the top of the palette
- live connection rejection now explains the missing bridge or collector explicitly

This means the user is increasingly told the correct next move.

But in the most common workflows, **knowing the next move is still not the same as expressing it quickly**.

Examples:

- `AsciiSequenceInput -> AsciiSequenceToTicked -> AsciiCharToBits`
- `HexSequenceInput -> BitsSequenceToTicked`
- `ticked bits -> TickedBitsToSequence -> BitsToHex`
- `short key -> Repeat*ToMatch -> bridge`

Today, even when the user already understands the graph shape, they still need to:

1. add the first module
2. add the second module
3. wire the first edge
4. add the third module
5. wire the second edge
6. often reposition the inserted modules

That is honest, but it is still too much ceremony for a chain the product already treats as canonical.

---

## Core Question

Can MCW let the user insert a small, explicit, predeclared bridge/collector chain from the current graph context in one action, while still keeping every module and connection fully visible and editable on the canvas?

---

## Strategic Principle

**Compress repetition, not structure.**

That means:

- the resulting modules must still be real modules on the canvas
- the resulting wires must still be real wires in the graph
- the system may offer only a bounded set of known-good chains
- the system must not silently convert domains, kinds, or widths
- the user must still choose the chain intentionally

This is not:

- hidden coercion
- “auto-fix” graph rewriting
- free-form macro recording
- policy inference from arbitrary graph intent

---

## V1 Product Shape

V1 introduces **canonical chain insertion** as a bounded authoring affordance.

From certain existing surfaces, MCW may offer a short list of **explicit named chain options**. Choosing one inserts all modules in that chain and wires them immediately.

Each option must:

- have a stable human-readable label
- correspond to an explicit fixed snapshot shape
- declare its start and end port expectations
- place real modules into the graph
- preserve MCW’s glass-box model

---

## V1 Surface

V1 surfaces canonical chain insertion in **one place only**:

### Pending-connection quick add

When a user drags from an output port and releases on empty canvas space, the existing quick-add popup may show:

- single-module insertion options
- canonical chain insertion options

Chain options should appear before the long tail of individual modules when they are a strong fit for the source signal.

This is the only V1 entry point.

Hovered-port chain strips and mismatch-repair chain offers are deferred to a follow-on once the quick-add surface has proven the interaction model cleanly.

---

## V1 Canonical Chain Set

V1 should stay narrow.

Only chains that are already canonical in docs, demos, or the existing pipeline starters should be included.

In V1, a **chain must insert at least two modules**. Single-module shortcuts stay in the ordinary quick-add flow.

### Chain A — ASCII sequence to bit words

**Label:** `ASCII sequence -> bit words`

**Modules inserted:**

- `AsciiSequenceToTicked`
- `AsciiCharToBits`

**Expected source shape:**

- source output must be `symbol`, `sequence`

**Result shape:**

- final output is `bits`, `scalar`

**Typical use:**

- message or key text entering XOR / S-box / permutation paths

---

### Chain D — collect ticked bits to hex

**Label:** `Collect ticked bits -> hex`

**Modules inserted:**

- `TickedBitsToSequence`
- `BitsToHex`

**Expected source shape:**

- source output must be `bits`, `scalar`

**Result shape:**

- final output is `symbol`, `sequence`

**Typical use:**

- showing a ticked bit workflow as a final hex buffer

**Boundary note:**

- this chain ends at the representation bridge `BitsToHex`
- it does **not** include a final sink like `HexOutput`

---

### Chain E — collect ticked bits to ASCII

**Label:** `Collect ticked bits -> ASCII`

**Modules inserted:**

- `TickedBitsToSequence`
- `BitsToAscii`

**Expected source shape:**

- source output must be `bits`, `scalar`

**Result shape:**

- final output is `symbol`, `sequence`

**Typical use:**

- recovering readable text after ticked bit-domain processing

**Boundary note:**

- this chain ends at the representation bridge `BitsToAscii`
- it does **not** include a final sink like `TextOutput`

---

---

## Interaction Rules

### Rule 1 — The user must choose the chain explicitly

No chain may be inserted automatically as a side effect of a failed connection or search result.

### Rule 2 — All inserted modules must be visible immediately

The chain must appear on canvas as ordinary nodes with ordinary wires. No collapsed “macro ghost” view is allowed in V1.

### Rule 3 — A chain must be inserted as one undoable action

The history model should treat one chain insertion as a single atomic step.

### Rule 4 — V1 uses only predeclared fixed chain shapes

No free-form chain synthesis. No dynamic assembly from arbitrary role guesses.

### Rule 5 — Port compatibility must remain explicit

If the source signal does not satisfy the chain’s expected start shape, that chain option must not appear.

### Rule 6 — Inserted modules inherit only their normal defaults

V1 must not infer parameters like:

- width
- wrap policy
- remainder mode
- pad value

unless the contract for that chain explicitly declares such a choice.

### Rule 7 — Placement should be deterministic and readable

The inserted chain should appear as a short forward lane beginning at the invocation point, using the same placement conventions as starter chains and `insertModuleAndConnect`.

No auto-layout ripple is introduced in V1.

### Rule 8 — Chain options rank above equivalent single-module shortcuts

When a canonical chain is the honest full next step, it should appear before nearby single-module options in the quick-add list.

### Rule 9 — Multiple matching chains stay separate

If more than one chain matches the same source shape, show them as distinct named options.

In V1, present matching chains in alphabetical label order.

---

## Chain Registry Shape

Each chain is defined as a plain TypeScript object with the shape:

```ts
{
  id: string;
  label: string;
  description: string;
  startPortShape: { type: 'bits' | 'symbol'; kind: 'scalar' | 'sequence' };
  endPortShape: { type: 'bits' | 'symbol'; kind: 'scalar' | 'sequence' };
  modules: { defId: string; params: Record<string, unknown> }[];
}
```

Placement is deterministic:

- modules are laid out in one forward lane
- spacing uses the standard module width plus the standard horizontal gap
- no layout ripple or reflow is performed

## Expected Reuse of Existing Infrastructure

V1 should build on what MCW already has:

- `PIPELINE_STARTERS` snapshot model for fixed chain shapes
- `insertStarterChain` / clipboard-snapshot insertion patterns for multi-module placement
- `insertModuleAndConnect` patterns for preserving source-context wiring
- existing quick-add / pending-connection popup for context-sensitive insertion
- existing palette wayfinding metadata for deciding which chains belong near which contexts

The preferred implementation direction is:

- represent each canonical chain as a small snapshot-like definition
- adapt it to the current insertion context
- connect the source output to the first inserted module
- leave the final inserted module’s output exposed for the next move

Chain insertion dispatches a single `insertChain` action to the store.

That action carries the full list of module instances, layout positions, and connections to be added.

The history model treats the insertion as one atomic step. No per-module dispatch sequence is used in V1.

---

## Include

- a bounded V1 chain registry
- explicit labels and descriptions for each chain
- chain insertion from the pending-connection quick-add popup
- atomic undo/redo
- stable deterministic placement
- no engine changes

---

## Exclude From V1

- automatic chain insertion without user choice
- chain insertion for arbitrary graph patterns
- single-module shortcuts in the chain registry
- free-form “record this as a favorite chain”
- parameter inference from downstream width requirements
- hidden reference creation
- hovered-port chain strips
- mismatch-repair chain offers
- bidirectional chain insertion from input ports backward through the graph
- chain insertion that rewires existing downstream modules automatically
- chain insertion that replaces existing modules in place

---

## Best First Implementation Order

If implemented in stages, the recommended order is:

### Stage 1

Support quick-add insertion for:

- `ASCII sequence -> bit words`
- `Collect ticked bits -> hex`
- `Collect ticked bits -> ASCII`

These are the cleanest linear chains and avoid reference wiring or width-inference ambiguity.

### Stage 2

Potential follow-ons after Stage 1 proves the interaction:

- hovered-port `Common chains` strip
- mismatch-repair popup chain offers
- reference-dependent chains like `Expand key -> ticked bit words`

Reference-dependent chains remain out of scope until a concrete graph-proximity rule exists for selecting a visible `reference` source without hidden magic.

---

## Why This Slice Matters

MCW is now increasingly good at telling the user what explicit move is needed next.

The next friction point is that the user still has to build the same small explicit move repeatedly by hand.

Canonical chain insertion solves exactly that problem:

- it removes repetition
- it preserves explicit structure
- it teaches the intended pipeline grammar by example
- it does not compromise the glass-box model

This is the right next ceremony-reduction move after:

- palette wayfinding
- compatibility highlighting
- explicit mismatch guidance
