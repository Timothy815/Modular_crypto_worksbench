# ITERATOR-DEFINITION-AUTHORING-V1

Last updated: April 16, 2026

Status: Draft

## Purpose

Define the first implementation-ready iterator authoring slice for MCW as a **real reusable iterator definition flow** that mirrors the current conditional authoring experience.

This slice exists to let a user:
- select a visible machine body
- wrap it as an iterator definition
- get a first-class iterator card back in the workspace and library
- open and inspect that iterator definition like other structured definitions
- edit its bounded repetition count without changing iterator execution semantics

## Why This V1 Exists

MCW already has iterator definitions in the engine.

The current engine shape is stable:
- `IteratorDef`
- `roundDefId`
- `iterationCount`
- optional `roundKeyWidth`

What MCW does **not** yet provide cleanly is the same authored-definition experience now available for conditionals:
- choose a body explicitly
- create a real reusable wrapper
- reopen that wrapper later as a first-class structure

Right now iterators are present as shipped architectures and reusable definitions, but the product does not yet present iterator creation as a symmetric user-facing authoring flow in the same way conditionals now read as authored machine structure.

This slice closes that asymmetry.

## Product Problem

MCW can now express structured definition kinds such as:
- composites
- iterators
- binary conditionals
- multi-conditionals

Conditionals now feel like authored machine structure:
- a user chooses branch bodies
- creates a wrapper definition
- sees a resulting card
- reopens it later

Iterators should feel similarly explicit.

Without that, repeated machine structure is available but not yet authored with the same clarity as other structured reusable forms.

## Core Decision

V1 will support exactly one iterator authoring form:

- choose one existing reusable or primitive machine body
- wrap it as a new `IteratorDef`
- set a bounded `iterationCount`
- expose it as a real reusable iterator definition

This slice is **authoring parity**, not a new iterator execution model.

## Strategic Principle

**Authoring comes before stronger control.**

This V1 should make iterators feel like explicit reusable machine wrappers.

It must **not** quietly drift into:
- `while` loops
- hidden continue / break logic
- unbounded repetition
- script-like control flow

Those are separate control-semantics questions and require their own bounded follow-on contract.

## Relationship To Existing Work

This slice builds on:
- the current iterator engine shape in [src/engine/composites.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/composites.ts)
- the shipped conditional definition flow in `CONDITIONAL-IF-ELSE-DEFINITION-V1.md`
- the current reusable-definition surfaces in the palette, inspector, and composite library

This slice must stay compatible with:
- `ITERATOR-CONTROL-V1.md`
- `CONDITIONAL-IF-ELSE-DEFINITION-V1.md`
- existing built-in iterator architectures
- existing iterator trace/analyze support

This slice must **not** claim to solve:
- iterator stop conditions
- iterator continue inputs
- iterator-local control semantics
- per-round hidden parameter mutation

## V1 Shape

Introduce a user-facing authoring flow that creates a real `IteratorDef` with the existing engine structure:

```ts
interface IteratorDef {
  id: string;
  name: string;
  kind: 'iterator';
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  roundDefId: string;
  iterationCount: number;
  roundKeyWidth?: number;
  version: number;
}
```

### Required authoring rule

The iterator body is one selected definition.

For V1, the selected body may be:
- a primitive `ModuleDef`
- a `CompositeDef`
- a `ConditionalDef`
- a `MultiConditionalDef`

V1 should **not** allow:
- an iterator whose body is another iterator

That keeps the first authoring slice bounded and avoids immediately widening into nested iterator semantics.

## Include

V1 includes:

1. **Iterator creation flow**
- create a new iterator definition from a selected primitive or reusable definition
- let the user supply:
  - name
  - id
  - bounded `iterationCount`

2. **Real reusable result**
- save the authored iterator into the reusable library
- surface it in the palette as an iterator definition
- allow it to be instantiated like other reusable structures

3. **Inspector visibility**
- when selected, clearly show:
  - iterator definition
  - repeated body definition
  - configured `iterationCount`
  - optional `roundKeyWidth` if present

4. **Open / inspect workflow**
- allow opening or drilling into the repeated body in a way that matches existing structured-definition workflows
- keep the repeated body explicit and inspectable

5. **Bounded validation**
- reject invalid iterator id / name authoring inputs
- reject missing selected body
- reject body definitions that are not allowed by V1
- reject nested-iterator body selection in V1
- reject invalid `iterationCount` values

6. **At least one teaching surface**
- one seeded example or micro demo showing:
  - a chosen body
  - the authored iterator wrapper
  - a visible result card

## Exclude

Do not include in V1:
- `while` or `until` execution
- visible `continue` / `stop` ports on iterator definitions
- hidden break / continue semantics
- nested iterators
- iterator-specific clock semantics
- iterator-specific branch policy semantics
- per-round UI editing of unrolled rounds
- unbounded repetition
- executor rewrites beyond what is needed to accept the authored definition through existing paths

## Authoring Rules

Validation and UI must enforce all of the following:

1. A new iterator definition must target exactly one body definition
2. The selected body definition must be known in the registry
3. The selected body definition may not itself be an iterator in V1
4. The new iterator id must be unique within the reusable-definition library
5. `iterationCount` must be a positive integer
6. The new iterator must inherit the repeated body’s external input/output interface directly
7. The new iterator must not invent extra control ports in V1

## Why Direct Interface Inheritance Is Preferred

The first iterator authoring slice should remain mechanically simple.

That means:
- external iterator inputs mirror the body inputs
- external iterator outputs mirror the body outputs
- the iterator wrapper contributes bounded repetition only

This is preferred because it:
- keeps the authored wrapper honest
- avoids introducing a second port-binding model
- preserves the existing iterator execution shape
- makes the resulting iterator card read as “this body, repeated N times”

## UX Expectations

When the interaction is working correctly:
- a user can select a primitive or reusable machine body
- choose “Create Iterator”
- provide a name, id, and repetition count
- get a new iterator definition back in the library
- place that iterator into the workspace as a first-class card
- inspect it later and still see which body it repeats

The result should feel materially similar to current conditional authoring:
- explicit structure
- explicit wrapper
- explicit reopenability

## Likely UI Surfaces In Scope

Likely files and surfaces:
- `src/App.tsx`
- `src/ui/store.ts`
- `src/ui/components/primitive-palette.tsx`
- `src/ui/components/parameter-inspector.tsx`
- reusable-definition save/create dialogs
- starter or micro demo surface under `src/ui/`

Possible engine touch points:
- validation of authored iterator creation path
- reusable library entry creation / serialization

The engine’s underlying iterator execution model should remain unchanged in V1.

## Recommended Test Set

V1 should ship with tests for:

1. iterator creation from a primitive body
2. iterator creation from a composite body
3. iterator creation from a conditional body
4. rejection of nested iterator body selection
5. rejection of zero / negative / non-integer `iterationCount`
6. saved iterator reappears in reusable library and palette
7. authored iterator instance executes identically to the same body repeated under the current iterator semantics

## Non-Goals

This slice is not trying to:
- make iterators smarter
- make iterators unbounded
- make iterators conditional in their own execution policy
- solve visible stop conditions
- solve signal-driven repetition
- collapse iterators into scripting

## Explicit Follow-On Boundary

If MCW later wants signal-driven iterator control, that must be a separate bounded contract.

That later slice should be framed as something like:
- `BOUNDED-ITERATOR-CONTINUE-CONTROL-V1`

And it should require:
- explicit bounded maximum iteration count
- explicit visible control input
- explicit trace evidence for why repetition stopped

It must not be merged into this authoring slice.

## Success Criteria

This slice is successful if:
- users can author a new iterator definition from a chosen body definition
- the result behaves like a real reusable iterator card
- the repeated body remains explicit and inspectable
- the slice achieves iterator/conditional authoring parity without changing iterator semantics

## Final Boundary

The first iterator improvement should make iterators feel like authored machine structure, not like hidden loop machinery.

This V1 is about **definition authoring parity**.

Stronger iterator control comes later, in a separate bounded slice.
