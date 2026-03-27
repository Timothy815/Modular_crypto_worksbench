# LINKED-ROTOR-PAIRING-V1

Last updated: March 27, 2026

Status: Implemented on `main`

---

## Purpose

Define a bounded follow-on to `ROTOR-REVERSE-PATH-V1` so that a visible `RotorReverse` can be mechanically tied to one visible forward `Rotor`.

The goal is to preserve MCW's DAG-safe two-node representation while making the pair behave more like one physical rotor:
- one forward traversal face
- one reverse traversal face
- one shared rotor state

This is meant to improve rotor honesty and reduce user burden, not to redesign the rotor family broadly.

---

## Problem

`ROTOR-REVERSE-PATH-V1` introduced `RotorReverse` as a separate primitive so MCW could express:
- `Rotor -> Reflector -> RotorReverse`

That solved the inverse-traversal problem cleanly inside the current DAG executor.

But the current shape still has an important weakness:
- `Rotor` and `RotorReverse` are separate module instances
- they only stay synchronized if the user manually keeps their params aligned
- if both are stepped, the user must wire both deliberately
- they do not yet read as one mechanical rotor split across two visible graph locations

This is still less honest than a real rotor machine, where the same physical rotor is traversed in both directions.

---

## Core Question

Can MCW keep `Rotor` and `RotorReverse` as separate visible nodes for DAG safety while making them behave as one shared rotor identity?

---

## Strategic Principle

**Two visible faces, one mechanical state.**

That means:
- keep the forward and reverse traversal graph-visible
- do not collapse the pair into hidden internal magic
- do not require users to manually synchronize two copies of the same rotor state

---

## Recommended Product Shape

The first slice should keep both primitives:
- `Rotor`
- `RotorReverse`

But `RotorReverse` should gain an explicit link to one existing forward `Rotor`.

That link should make `RotorReverse` a dependent reverse face of the forward rotor, not an independently authored second rotor.

---

## Desired V1 Behavior

For the first linked-pairing slice:
- `RotorReverse` must reference one specific `Rotor` instance in the same workspace
- the linked pair must share:
  - `wiring`
  - `position`
  - `ringOffset`
  - `notches`
- `RotorReverse` must compute reverse traversal from the linked forward rotor's live state
- `RotorReverse` must not maintain an independent rotor state lifecycle
- if the linked forward rotor advances, the reverse traversal face reflects that automatically
- turnover semantics should continue to reflect the linked rotor state rather than a second independent state

In product terms:
- two visible modules
- one rotor identity

---

## Recommended V1 Interaction Model

V1 should prefer explicit linking over implicit name matching.

Recommended shape:
- `RotorReverse` gets a required `linkedRotorId` parameter
- `linkedRotorId` should be represented in V1 as a validated `string` param, not a new param kind
- the inspector should present that link as a deliberate pairing choice
- invalid or missing links should surface as validation issues

This keeps the behavior inspectable and avoids hidden inference.

---

## Scope

Include:
- one bounded linking mechanism from `RotorReverse` to `Rotor`
- validation for valid/invalid pairings
- engine/runtime behavior where reverse traversal derives from the linked rotor state
- inspector support for creating and viewing the link
- at least one existing rotor teaching surface updated to use the linked model honestly

Exclude:
- rotor-driven stepping / SIGABA-style control
- broad rotor-family redesign
- one-node cyclic rotor reuse in the executor
- hidden automatic pairing by spatial proximity or naming convention
- multi-rotor grouped control systems

---

## Non-Goals

This slice should explicitly avoid:
- making the executor cyclic
- introducing shared arbitrary state between unrelated modules
- turning `RotorReverse` into a generic symbolic slave primitive
- bundling a full historical-machine package
- redesigning Enigma as a preset-only concept

---

## Technical Direction

### Recommended Resolution Mechanism

V1 should use **executor-time param shadowing**, not a new evaluator signature and not signal-based state forwarding.

That means:
- `RotorReverse` keeps its own static module definition and ports
- during execution, if a valid `linkedRotorId` is present, the reverse rotor evaluates using the linked forward rotor's current params as the state truth
- the `evaluate()` signature does not change
- no general cross-module param reads are introduced as a reusable engine-wide feature

This is an intentional bounded exception for the linked rotor pair, not a precedent for arbitrary module-to-module state sharing.

### Execution Order

The link does **not** create a new topological dependency.

Reason:
- `RotorReverse` does not need the linked forward rotor to execute first in order to obtain state
- it only needs access to that linked rotor instance's current params for the current tick / run
- those params exist independently of output-flow ordering

So:
- graph order remains determined only by explicit connections
- the rotor link is a validation/runtime pairing constraint, not a signal-flow edge

### Stepping Ownership

Only the forward `Rotor` owns the shared state lifecycle.

That means:
- a linked `RotorReverse` must not advance independently
- if `RotorReverse` has a `clock` input in V1, it should be ignored when linked
- a linked reverse rotor's `advance` behavior is effectively a no-op
- only the linked forward `Rotor` may change shared rotor position over time

The likely implementation shape is:
- keep `Rotor` and `RotorReverse` as separate graph nodes
- preserve the existing DAG execution model
- resolve reverse traversal by shadowing linked forward-rotor params at execution time instead of using the reverse node's authored params
- keep this bounded to the rotor pair only

This should be done in a way that stays explicit at the graph/validation layer and does not leak UI concerns into the engine.

---

## Validation Expectations

The slice should validate:
- linked rotor target exists
- linked target is actually a `Rotor`
- self-link or reverse-to-reverse link is rejected
- chained reverse links are rejected
- broken links fail clearly
- if a linked forward rotor is renamed, `linkedRotorId` must update atomically with that rename
- reverse traversal output changes correctly when the linked forward rotor position changes
- existing unlinked `RotorReverse` workspaces must continue to work in V1 for backward compatibility

---

## Inspector Expectations

When linked:
- `RotorReverse` should show the linked rotor relationship clearly
- rotor-state fields (`wiring`, `position`, `ringOffset`, `notches`) should display as read-only mirrored state
- editing of shared rotor state should happen on the forward `Rotor`, not on the linked reverse face
- a `Go to Linked Rotor` style shortcut is a good V1 affordance if low-cost

This keeps the model legible in larger workspaces and avoids the impression that both faces can be edited independently.

---

## Teaching Surface

At least one existing rotor-realism teaching surface should be updated to reflect the linked model honestly.

Strong candidates:
- `Rotor Return Path`
- the hybrid reference path

The point is to make the product story match the new model visibly.

---

## Success Criteria

This slice is successful when:
- users no longer have to manually synchronize `Rotor` and `RotorReverse`
- `RotorReverse` still remains graph-visible as the reverse traversal face
- the linked pair behaves like one mechanical rotor identity
- DAG safety is preserved
- the slice stays clearly separate from rotor-driven stepping

---

## Recommendation

This should be treated as the next rotor follow-on after `ROTOR-REVERSE-PATH-V1`.

It directly resolves the main conceptual weakness of the current reverse-rotor model without forcing a risky execution-architecture rewrite.
