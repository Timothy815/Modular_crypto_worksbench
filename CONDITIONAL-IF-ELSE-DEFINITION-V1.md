# CONDITIONAL-IF-ELSE-DEFINITION-V1

Last updated: April 11, 2026

Status: Shipped on `main`.

## Purpose

Define the first implementation-ready conditional-composition slice for MCW as one bounded explicit `if / else` definition form.

This slice exists to make finite branch structure visible and honest without:
- hidden execution of inactive branches
- general-purpose control flow
- policy drift into scripting

## Why This V1 Exists

`CONDITIONAL-COMPOSITION-V1` correctly captured the product need, but it remained only a strategic note.

The implementation constraint is now clear:
- MCW already has local routing primitives such as `Mux`, `Demux`, and `MultiRouter`
- those primitives are useful for visible signal routing
- they do **not** solve higher-level conditional composition, because under the current executor every connected branch still evaluates

That means an honest conditional-composition V1 must be an engine-level definition kind, not a cosmetic wrapper around existing routing.

## Product Problem

MCW can already express:
- local routing
- local gating
- explicit counters and threshold logic

What it still cannot express honestly is:
- one explicit branch definition when `select = 0`
- a different explicit branch definition when `select = 1`
- guaranteed non-execution of the inactive branch

Without that, larger control-rich machines are forced to fake branch structure with always-live parallel graphs.

## Core Decision

V1 will support exactly one conditional-composition form:

- binary `if / else`
- one explicit `select` input
- two explicit branch definitions
- identical external branch interfaces
- only the selected branch executes

This is the narrowest engine slice that creates real conditional composition without pretending routing alone already provides it.

## Strategic Principle

**Selection must be visible, finite, and execution-honest.**

That means:
- the condition is a visible graph input
- branch structure is visible in the definition
- inactive branches do not evaluate
- the executor does not simulate hidden parallel work and then discard it

## V1 Shape

Introduce a new definition kind:

```ts
interface ConditionalDef {
  id: string;
  name: string;
  kind: 'conditional';
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  thenDefId: string;
  elseDefId: string;
  version: number;
}
```

### Required interface rules

- `inputs` must include a reserved `select` input port
- `select` must be:
  - `type: 'bits'`
  - `kind: 'scalar'`
  - width exactly 1 at runtime
- all non-`select` external inputs are forwarded unchanged to the active branch
- external outputs come only from the active branch

### Branch definition rules

`thenDefId` and `elseDefId` must each resolve to an existing module definition in the registry.

For V1, each branch definition may be:
- a primitive `ModuleDef`
- a `CompositeDef`
- an `IteratorDef`

Branch definitions must have identical external interfaces:
- same non-`select` input ports by name, order, type, and kind
- same output ports by name, order, type, and kind

They do **not** need to share the same internal implementation.

## Why This Shape Is Preferred

This shape is intentionally narrower than “arbitrary nested project per branch.”

It is preferred because it:
- reuses the existing composite and iterator system
- avoids inventing a second nested-project binding model
- lets users build branch fragments as ordinary reusable composites first
- lets the executor evaluate exactly one child definition at runtime

In other words:
- branch internals stay explicit
- conditional selection stays explicit
- the engine change stays bounded

## Include

V1 includes:

1. **Engine definition support**
- add `ConditionalDef`
- include it in `ModuleDefinition`
- add a type guard in `src/engine/composites.ts` or the appropriate engine surface

2. **Validation**
- unknown `thenDefId` / `elseDefId` must fail validation
- branch interface mismatch must fail validation
- missing reserved `select` input must fail validation
- wrong `select` port type/kind must fail validation

3. **Executor support**
- evaluate only the selected child definition
- forward non-`select` inputs to the selected child definition
- surface outputs from the selected child definition
- do not evaluate the inactive child definition

4. **Trace honesty**
- execution trace must make the chosen branch visible
- inactive-branch execution entries must not appear

5. **Bounded teaching surface**
- at least one engine-level test proving inactive branch non-execution
- at least one micro demo or seeded example showing visible binary branch selection between two different explicit composites

## Exclude

Do not include in V1:
- `case` / `switch`
- more than two branches
- free-form nested branch editors in the UI
- arbitrary per-branch nested project authoring
- implicit branch fallthrough
- hidden default branches
- branch-local external port remapping rules beyond shared identical interfaces
- branch output merging semantics
- conditional-specific clock or scheduler semantics

## Validation Rules

Validation must enforce all of the following:

1. `thenDefId` resolves to a known definition
2. `elseDefId` resolves to a known definition
3. `thenDefId` and `elseDefId` are not the same empty/unknown reference
4. external `inputs` include `select`
5. `select` is `bits`, `scalar`
6. branch non-`select` input interface matches the conditional external input interface exactly
7. branch output interface matches the conditional external output interface exactly
8. conditional definitions may not target themselves directly as `thenDefId` or `elseDefId`

The self-reference rule is required to avoid immediate recursive definition loops.

## Runtime Rules

At runtime:

- `select = [0]` chooses `elseDefId`
- `select = [1]` chooses `thenDefId`

Any other shape must fail explicitly:
- empty bit array
- multi-bit array
- non-bit signal

Suggested error language:
- `Conditional select must be exactly one bit`

## Trace Rules

The analysis / trace surface should remain honest about which branch ran.

V1 does not require a large new UI for this.

It does require:
- the executed child definition to appear in trace or analysis in a way that makes the selected branch legible
- no trace entries from the inactive branch

If a tiny trace metadata addition is needed, keep it local and explicit.

## Engine Surfaces Likely In Scope

Likely files:
- `src/engine/types.ts`
- `src/engine/composites.ts`
- `src/engine/validation.ts`
- `src/engine/executor.ts`
- `src/engine/executor.test.ts`
- `src/engine/validation.test.ts`

Possible seeded/demo surface:
- one bounded micro demo file under `src/ui/`

## Recommended Test Set

V1 should ship with tests for:

1. **Else branch selected**
- `select = [0]`
- only else branch evaluates
- output matches else branch behavior

2. **Then branch selected**
- `select = [1]`
- only then branch evaluates
- output matches then branch behavior

3. **Inactive branch does not run**
- use instrumentation counters in a test registry
- verify only one child definition is evaluated

4. **Interface mismatch validation**
- mismatched branch outputs reject
- mismatched branch inputs reject

5. **Invalid select shape**
- reject `[]`
- reject `[0, 1]`
- reject symbol select input

6. **Composite child parity**
- `thenDefId` and/or `elseDefId` may point at composites and still execute correctly

## Teaching Surface Recommendation

The first demo should stay small and structural.

Preferred shape:
- one visible control bit source
- one visible data source
- one “then” composite
- one “else” composite
- one sink

The point of the demo is not cryptographic sophistication.
The point is to prove:
- selection is explicit
- branches are explicit
- only one branch runs

## Relationship To Existing Work

This slice builds on:
- `CONDITIONAL-COMPOSITION-V1`
- `MULTIWAY-ROUTING-V1`
- the existing composite / iterator engine model

This slice intentionally stays separate from:
- routing primitives
- generic programming-language control flow
- iterator control and loop semantics

## Success Criteria

This slice is successful when:
- MCW can represent one explicit binary conditional definition honestly
- only the active branch executes
- branch structure remains visible and finite
- the engine change is bounded enough that larger future control structures can build on it without redoing the model

## Explicitly Avoid Next

Do not let V1 drift into:
- `switch` / `case` before binary `if / else` is proven
- nested branch authoring UI before the engine model is stable
- conditional execution of arbitrary graph fragments with hidden binding rules
- hidden branch simulation followed by output masking

## Recommended Next Decision After V1

If this slice lands cleanly, the next question can be asked honestly:

- should MCW support multi-way conditional definitions
- or is binary explicit conditionals plus existing `MultiRouter` already enough for the next product stage

That question should only be opened after V1 proves the executor model.
