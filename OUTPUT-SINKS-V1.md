# Output Sinks V1

## Status

Proposed bounded follow-on after the shipped bridge-ergonomics milestones.

## Purpose

Make final output intent explicit.

MCW currently has:
- `Output` for generic `symbol` results
- `BitOutput` for `bits`
- stronger sink-side representation views for inspection

That inspection layer is useful, but it also exposed a real product boundary:
- a final `symbol` result can currently mean plain text, hex text, baudot text, or a single alphabet symbol
- the inspector can infer possible interpretations
- but inference is not the same as declared endpoint intent

This slice exists to make final output semantics explicit instead of relying on content-shaped guesses.

## Strategic Principle

**A final sink should declare what kind of result it is meant to be.**

That means:
- graph construction remains explicit
- output semantics should be visible in the node itself
- inspector views may still help interpret the result
- but they should no longer carry the whole burden of guessing what the output “really is”

## Why Now

The recent sink-inspection expansion improved usability, but it also showed a limitation:
- `3A` at a generic `Output` might be literal text
- or intended hex
- or something else

MCW is strongest when that distinction is explicit.

This is the right moment to strengthen the sink layer before adding more interpretation heuristics.

## V1 Scope

V1 should stay bounded to explicit sink semantics for the most common output families.

Primary targets:
- `TextOutput`
- `HexOutput`
- `BaudotOutput`
- keep existing `BitOutput`

Treatment of existing generic `Output`:
- keep it for compatibility in V1
- describe it as a generic symbol sink
- do not silently retarget existing projects

## Core Rules

1. **Sink semantics must be declared by the graph**
   - if a machine ends in hex, it should be able to say so with a hex-specific sink
   - if it ends in baudot, it should be able to say so with a baudot-specific sink

2. **Inspector views remain observational**
   - sink-specific views may still offer alternate lenses
   - but the primary sink identity should be explicit

3. **No hidden reinterpretation of existing projects**
   - existing `Output` projects must remain valid
   - V1 should not rewrite or auto-migrate saved graphs

4. **Do not over-proliferate sinks**
   - add only semantically meaningful sink types
   - do not create a sink for every formatting whim

## Included

- new explicit sink modules for:
  - text
  - hex
  - baudot
- palette/category cleanup so sinks are visibly grouped as sinks
- minimal inspector/output adjustments needed to honor sink identity
- compatibility for existing `Output` and `BitOutput`
- tests proving sink-specific expectations and compatibility behavior

## Excluded

Do not include in V1:
- sink auto-migration for old projects
- UTF-8-specific sinks
- Base64 sinks
- wire-level representation semantics
- copy/export/download helpers
- persistent output view preferences
- changes to the underlying signal-type system

## Proposed Sink Set

### `Output`
- keep as generic `symbol` sink for compatibility
- treat as “generic symbol/text” rather than “typed text”

### `BitOutput`
- keep as explicit final `bits` sink

### `TextOutput`
- explicit final readable text sink

### `HexOutput`
- explicit final hex-text sink

### `BaudotOutput`
- explicit final baudot-text sink

## Success Criteria

V1 is successful if:
- final output intent becomes more legible in the graph itself
- users no longer have to rely only on inferred meaning at the sink
- the sink palette becomes easier to understand
- old projects remain valid
- the change stays bounded and non-destructive

## Follow-Ons

Possible later slices, only if still justified:
- sink-specific teaching artifacts
- deprecation plan for overly-generic `Output`, if ever warranted
- broader typed representation surfaces after classroom use
