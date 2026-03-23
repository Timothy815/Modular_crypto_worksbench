# Parameter Forwarding V1

Last updated: March 24, 2026

## Purpose

This contract defines the first bounded way for composites and iterators to expose selected internal controls to the outside world.

The goal is to reduce the "black box" feel of reusable architecture modules without destroying the clarity of abstraction.

Parameter Forwarding V1 should let a student:
- change a meaningful internal knob from the outer inspector
- observe how that change affects execution and analysis
- keep the reusable object intact as a reusable object

This is not a license for arbitrary deep editing through the outer shell.

## Product Problem

Today, a reusable composite or iterator can hide high-value teaching controls:
- round count
- rotor direction
- internal permutation order
- shift amount
- digest-depth or mixing-depth controls

If those controls are buried inside the reusable object, a student must:
- duplicate the object
- open internals
- edit implementation details

That is too much friction for ordinary exploration.

MCW needs a middle layer between:
- fully sealed reusable objects
- fully open internal editing

That middle layer is explicit parameter forwarding.

## Core Principle

Parameter forwarding should behave like function arguments.

The reusable definition explicitly says:
- which internal parameters are exposed
- what the outside label is
- what type the outside control has
- where the forwarded value lands internally

Only explicitly forwarded parameters are editable from the outside.

This preserves:
- inspectability
- abstraction
- safety
- pedagogical intent

## Include

Parameter Forwarding V1 should include:
- explicit external parameter definitions for composites and iterators
- a mapping from exposed parameter keys to internal targets
- inspector editing for forwarded parameters
- validation that forwarded targets exist and type-check cleanly
- runtime application of forwarded values before execution

Good first examples:
- expose `iterationCount` as `Round Count`
- expose an internal rotor direction mode
- expose an internal permutation order
- expose an internal digest-round count

## Exclude

Parameter Forwarding V1 should explicitly avoid:
- arbitrary editing of any internal module parameter from the outside
- nested forwarding through multiple layers in the first slice
- forwarding of layout or UI-only metadata
- magic auto-discovery of "interesting" internal params
- hidden mutation of built-in architecture modules without an explicit contract

If a control is not forwarded, it is not externally editable.

## Data Model

The engine-facing shape should remain explicit.

Conceptually:

```ts
interface ForwardedParamTarget {
  internalModuleId: string;
  internalParamKey: string;
}

interface ForwardedParamDef extends ParamFieldDef {
  source: ForwardedParamTarget;
}

interface CompositeDef {
  ...
  paramSchema: ParamSchema;
  forwardedParams?: ForwardedParamDef[];
}
```

Equivalent iterator support is acceptable if it is modeled differently internally, as long as:
- the exposed parameter is explicit
- the target is explicit
- the mapping is serializable

Exact naming may change during implementation.

The important thing is that forwarding is:
- declaration-based
- typed
- explicit

## UI Model

Externally forwarded parameters should appear in the normal inspector, not in a separate hidden system.

From the student’s perspective:
- a reusable object can have normal visible params
- some of those params are forwarded into internals

The UI may later show a hint such as:
- `Exposed Internal Control`
- or `Forwarded`

But V1 does not need a heavy visual treatment if the behavior is clear.

## Runtime Model

At execution time:
1. the reusable definition is resolved
2. explicit forwarded params from the instance are applied to the targeted internal module params
3. the internal graph executes normally

This should happen without mutating the original built-in definition object permanently.

Important rule:
- forwarding changes execution inputs
- it does not rewrite the canonical built-in reusable definition

Iterator note:
- iterators may use a slightly different application path than composites
- for iterator-style forwarding, a forwarded instance param may override definition-level fields such as `iterationCount` at evaluation time
- this still must not mutate the canonical `IteratorDef`

## Validation Rules

Forwarded params must validate before runtime:
- the internal target module must exist
- the target internal param key must exist
- the forwarded param kind must be compatible with the target param kind
- forwarded keys must be unique
- labels must be sensible for inspector use
- forwarded values must satisfy the target module's own param validation rules

Validation should fail if:
- a forwarded target points to a missing internal module
- a forwarded target points to a missing internal param
- a forwarded param kind disagrees with the target param kind
- a forwarded value would be invalid if it were set directly on the target param

Important rule:
- forwarding must not create a bypass around existing target-module param validation

## Built-In Architecture Policy

Built-in architecture modules should remain:
- non-removable
- non-destructively editable as definitions

But they may expose selected forwarded controls intentionally.

This is the right compromise:
- students can experiment with meaningful knobs
- the shipped artifact stays intact

If a student wants deeper changes, the correct path remains:
- `Duplicate As Custom Composite`

When a built-in or custom reusable object is duplicated:
- its forwarding definitions should duplicate with it
- the duplicate should preserve the same exposed controls unless the student edits the definition later

## Teaching Guidance

Forwarding should be used for meaningful controls, not everything.

Good forwarded controls:
- round count
- rotor direction
- internal mode toggle
- compression depth
- visible key-bus width when that concept is already explicit

Bad forwarded controls:
- every internal param just because it exists
- low-value internal constants that clutter the inspector
- controls that hide the lesson instead of clarifying it

## First Implementation Targets

The first implementation slice should prove the model with a few high-value targets:
1. a hash or iterator artifact with a forwarded round-count control
2. one directional or mode-like control inside a reusable artifact
3. validation + persistence working end-to-end

This should be enough to prove the contract without turning the system into a generic reflection engine.

## Success Criteria

Parameter Forwarding V1 is successful when:
- reusable objects feel less black-boxed
- students can tune key internal teaching controls from the outer inspector
- built-in artifacts remain protected
- the abstraction boundary stays explicit
- the implementation does not devolve into arbitrary internal mutation
