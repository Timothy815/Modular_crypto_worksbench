# CLOCKED-ITERATOR-V1

Last updated: April 17, 2026

Status: Draft

## Purpose

Define the first bounded clock-controlled iterator slice for MCW as a **separate iterator family**, not as an option on the existing count-driven iterator.

This slice exists to let MCW express:
- repeated structure that advances one visible step at a time
- explicit pulse-controlled traversal through a bounded round bank
- live-machine behavior that still remains inspectable and deterministic

The goal is to make pulse-driven repeated structure feel like a real machine without collapsing the current iterator model into mixed semantics.

## Why This Slice Exists

MCW now has a clean authored iterator model:
- choose one eligible repeated body
- wrap it as a reusable `IteratorDef`
- set a bounded round count
- optionally override the round count per instance

That model is good at one thing:

**repeat this machine N times as explicit bounded structure**

What it does **not** express is a different class of machine behavior:
- advance one step per pulse
- visibly hold a current position
- wrap or stop according to an explicit traversal policy
- make staged progression feel live rather than pre-expanded-only

That is a real product need for:
- rotor stepping
- staged pulse-driven teaching demos
- visible round traversal
- “shape a live machine” interaction language

But it is **not** the same thing as the current iterator.

## Core Decision

V1 must introduce a **separate stepped iterator model** rather than bolting clock control onto the existing iterator.

The existing authored iterator remains:
- count-driven
- bounded
- statically repeated
- free of pulse traversal semantics

This new slice defines a different machine:
- pulse-driven advancement across a bounded repeated body
- visible current step state
- explicit wrap policy

This separation is required to preserve model clarity.

V1 also locks the following:
- **Model B**: cumulative traversal state
- explicit 1-bit `clock` input
- explicit end-of-bank policy set: `halt` or `wrap`
- **no reset input in V1**

## Product Problem

If MCW simply adds an optional clock/advance input to the current iterator, the resulting object becomes ambiguous:
- is it a bounded structural repeater
- or a live stepper
- or both depending on params

That ambiguity damages the product language.

The user should be able to tell from the card and definition what kind of machine they are using:
- **Iterator** = repeat this body N times
- **Clocked Iterator** = advance this bounded repeated machine one step per pulse

## Strategic Principle

**Separate structure from traversal.**

The existing iterator is a structural repeater.
The clocked iterator is a traversal machine.

Both may use repeated bodies, but they answer different questions:
- structural iterator: “how many rounds are in the machine”
- clocked iterator: “which round is active right now and when does it advance”

## V1 Shape

Introduce a new structured-definition kind or bounded equivalent surface with the following conceptual behavior:

- one repeated body definition
- one bounded round count
- one explicit pulse / advance input
- one visible current step index
- one explicit end-of-bank policy

Preferred user-facing language:
- `Clocked Iterator`
- `Stepped Iterator`
- `Advance-On-Pulse Iterator`

The final naming should prefer clarity over novelty.

For contract purposes, this document uses **Clocked Iterator**.

## Architecture Placement

The clocked iterator cannot be implemented as a plain `StatefulModuleDef`.

Reason:
- its repeated body is referenced by definition id
- it must evaluate that body through the registry at runtime
- current `StatefulModuleDef.advance` / `evaluate` signatures do not receive the registry

Therefore V1 must be implemented as:
- a **new union member** in `ModuleDefinition`
- with **dedicated executor handling**
- analogous in spirit to the current `evaluateIterator` path

Preferred shape:

```ts
interface ClockedIteratorDef {
  id: string;
  name: string;
  kind: 'clocked-iterator';
  inputs: [
    { name: 'in', type: SignalType },
    { name: 'clock', type: 'bits', kind: 'scalar' }
  ];
  outputs: [{ name: 'out', type: SignalType }];
  paramSchema: ParamSchema;
  roundDefId: string;
  roundCount: number;
  endPolicy: 'halt' | 'wrap';
  version: number;
}
```

The exact field names may differ, but the architectural placement must remain:
- dedicated definition kind
- dedicated executor path
- no silent overloading of the current iterator kind

## Include

V1 includes:

1. **Pulse-controlled step advancement**
- a visible `clock` input
- one pulse advances the iterator by exactly one step
- no pulse means no advancement

2. **Bounded round bank**
- the machine still has an explicit positive integer round count
- the repeated body is still one eligible `in -> out` body
- the repeated machine remains bounded and finite

3. **Visible current step state**
- the selected instance must show:
  - current step
  - total rounds
  - current traversal policy

4. **Explicit end-of-bank policy**
- choose exactly one of:
  - `halt`
  - `wrap`

V1 should not include more than these two.

5. **Reset behavior**
- V1 excludes reset as an input surface
- re-executing the workspace resets clocked iterator traversal state
- this is sufficient for V1 teaching demos

6. **One teaching demo**
- one small pulse-driven demo showing:
  - current position
  - visible advancement by pulses
  - wrap or halt behavior

## Exclude

Do not include in V1:
- `while` loops
- `until` loops
- signal-driven stop conditions beyond explicit end-of-bank policy
- hidden break / continue behavior
- nested clocked iterators
- recursion
- dynamic round count derived from wires
- arbitrary scheduler semantics
- body-local script behavior
- multi-policy dropdowns that hide traversal meaning

## Required Semantics

V1 must lock the following explicitly:

1. The machine is bounded by a positive integer round count
2. The machine advances only on explicit pulse / advance input
3. One pulse advances by exactly one step
4. Current position is visible live state
5. End-of-bank behavior is explicit and finite:
   - `halt`: stay at final position after the last valid advance
   - `wrap`: return to the first position after the last valid advance
6. No hidden “keep going until condition changes” semantics are allowed

### Clock signal rule

The `clock` input must be:
- `type: 'bits'`
- `kind: 'scalar'`
- interpreted using the same active-pulse semantics already used elsewhere in MCW

V1 should remain consistent with the current pulse language in the engine:
- an active one-bit pulse advances the machine
- this is not edge-history logic in V1

### Graph topology rule

The project graph remains acyclic.

Any inter-step feedback is internal to the clocked iterator’s executor semantics.
The visible project graph must not expose the clocked iterator as a graph cycle.

## Output Model

V1 explicitly chooses:

### Model B — Cumulative traversal state

- the machine holds an accumulated signal state
- advancement means “apply the repeated body once more to the accumulated state”
- output is the progressively transformed state after each step

This is the only V1 model in scope.

Model A is explicitly out of scope for this contract because it collapses into a stage-selector interpretation rather than a live stepped machine.

### Step-0 semantics

V1 must define step-0 behavior explicitly:

- `in` is the seed state
- before the first pulse, the machine is at step 0
- before the first pulse, output equals the seed `in`
- after the first valid pulse, output equals one body application of the seed
- each later valid pulse applies the body one more time to the accumulated output

This keeps the machine honest:
- `in` seeds traversal
- the machine then advances cumulatively

The `in` port does not act as a hidden per-tick reseed channel in V1.

## Body Eligibility

The repeated body should inherit the same V1 eligibility discipline as the current authored iterator:
- exactly one visible input named `in`
- exactly one visible output named `out`
- matching input/output signal shape
- no nested iterator bodies in V1 unless separately justified

This keeps the first slice bounded and aligned with the current iterator line.

### Signal-shape invariant

The repeated body must preserve signal shape exactly:
- input and output type must match
- input and output kind must match
- any width assumptions needed by the body must remain valid across repeated application

V1 validation must reject bodies that do not preserve the required traversal shape.

## State Visibility

The selected clocked iterator instance must show:
- body name
- round count
- current step index
- current accumulated output summary
- end-of-bank policy
- whether it is halted or still advanceable

This should align with existing live-state / inspector visibility patterns where possible.

If a canvas cue is used, it must remain quiet and bounded.

Good examples:
- `step 2 / 8`
- `halted at 8 / 8`
- `wrap`

Bad examples:
- constant animation
- persistent large badges on all cards
- a second inspector surface

## Reset Decision

V1 explicitly chooses:

### No reset input in V1

- current step and accumulated state initialize with execution start
- re-executing the workspace resets traversal state
- reset-port semantics are deferred to a later contract

## Relationship To Existing Work

This slice must remain compatible with:
- `ITERATOR-DEFINITION-AUTHORING-V1.md`
- `ITERATOR-WORKFLOW-POLISH-V1.md`
- `ITERATOR-CONTROL-V1.md`
- existing live-state and ticked execution surfaces

This slice explicitly supersedes the vague placeholder language in `ITERATOR-CONTROL-V1.md` only once semantics are locked and implemented.

## Risks

This is a high-leverage slice and also a risky one.

Primary risks:
- accidentally creating a hidden loop model
- making clock pulses feel like “re-run the graph” instead of “advance machine state”
- failing to distinguish structure from traversal
- introducing a live machine whose output meaning is unclear
- forcing implementation into the existing `StatefulModuleDef` path even though registry-aware body evaluation is required
- leaving accumulated-state storage underspecified

If the semantics are vague, the feature should not ship.

## Execution-State Rule

The implementation must track at least:
- current step index
- halted / wrapped traversal status as needed
- accumulated signal state

This state belongs to execution-layer mutable tick state, not to authored user intent.

It must not be represented as visible authored params in the definition-creation flow.

If hidden runtime params or equivalent execution-owned state are used internally, that must remain executor-owned and not appear as normal authored module parameters.

## Suggested First V1

If the goal is the safest strong first slice, the best V1 is:

- **Model B**: cumulative traversal state
- explicit scalar-bits `clock` input
- explicit `roundCount`
- explicit `halt` or `wrap`
- visible current step live state
- visible accumulated output summary
- **no reset in V1**

That is enough to make the machine feel live while staying bounded.

## Exit Condition

This contract is complete when:
- MCW has a separate, bounded definition for pulse-driven repeated traversal
- the current iterator remains structurally pure
- the output model is explicitly chosen
- end-of-bank policy is locked
- reset inclusion/exclusion is explicitly chosen
- the project can take this to implementation without drifting into vague “better loops” language
