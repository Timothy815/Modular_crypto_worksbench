# ITERATOR-WORKFLOW-POLISH-V1

Last updated: April 17, 2026

Status: Shipped on `main`

## Purpose

Define the next bounded iterator follow-on after `ITERATOR-DEFINITION-AUTHORING-V1.md`.

This slice is not about new loop semantics.
It is about making authored iterators:
- easier to read
- easier to parameterize per instance
- easier to teach on canvas

The goal is to make iterator wrappers feel complete as visible machine structure before MCW opens any stronger iterator-control line.

## Why This Slice Exists

MCW can now author real iterator definitions:
- choose an eligible body
- wrap it as an `IteratorDef`
- save it into the reusable library
- instantiate it as a first-class structure

That closes the authoring gap.

What still feels incomplete is the workflow around the authored iterator once it exists:
- the distinction between definition default count and instance override is not yet prominent enough
- the body relationship is visible, but not yet especially legible on the card/workflow surface
- there is no small end-to-end iterator teaching demo that shows the authored wrapper in use

This slice closes that usability and teaching gap without changing execution semantics.

## Product Problem

Right now a user can create an iterator definition, but the next questions are still slightly too implicit:
- how many rounds does this instance actually run
- is that count coming from the definition or from this instance
- what body is being repeated
- how should I teach or inspect the wrapper-versus-body relationship

The engine already supports bounded iteration.
The product now needs a cleaner workflow language around that bounded iteration.

## Core Decision

V1 stays strictly within the existing iterator execution model.

This slice includes:
- stronger per-instance count visibility
- clearer wrapper/body visibility
- one bounded iterator micro demo

This slice does **not** include:
- `while` semantics
- signal-driven stop conditions
- `continue` / `break`
- nested iterators
- round-local editor drill-through work

## Relationship To Existing Work

This slice builds directly on:
- `ITERATOR-DEFINITION-AUTHORING-V1.md`
- the current `IteratorDef` engine shape
- existing instance parameter override behavior for `iterationCount`
- current inspector and workbench card surfaces

This slice must remain compatible with:
- `ITERATOR-CONTROL-V1.md`
- `CONDITIONAL-IF-ELSE-DEFINITION-V1.md`
- `PRIMITIVE-MICRO-DEMOS-V3.md`

This slice is explicitly the last bounded iterator usability step before any future control-semantics contract.

## Include

V1 includes exactly three things:

1. **Per-instance count visibility**
- when an iterator instance is selected, show:
  - definition default count
  - current resolved instance count
  - whether the current value is inherited or overridden
- if an instance override exists, the wording must make that explicit

2. **Wrapper/body visibility polish**
- make the repeated body relationship easier to read in the selected-instance surface
- clearly name:
  - iterator definition name
  - repeated body name
  - default rounds
- keep this read-only in V1

3. **One iterator micro demo**
- ship one small, self-explanatory example showing:
  - a visible repeated body
  - an authored iterator wrapper using that body
  - a selected iterator instance with count visibility
- the demo should answer: “what is an iterator wrapper doing here?”

## Exclude

Do not include in V1:
- `while` iterator behavior
- signal-wait or condition-driven stop behavior
- visible `continue` / `stop` ports
- new executor semantics
- nested iterators
- automatic body editing from the iterator card
- iterator-specific trace/analyze rewrites
- multiple new demos

## Authoring / UX Rules

1. The selected iterator instance must show both the definition-level default and the currently resolved count
2. The UI must clearly distinguish:
   - inherited count
   - per-instance override
3. The repeated body name must remain visible on the selected iterator surface
4. V1 remains read-only with respect to the body relationship
5. Any override wording must describe the current state, not imply a new execution mode
6. The micro demo must stay small enough to read without opening a larger flagship workspace

## Inspector Guidance

When an iterator instance is selected, the inspector should read approximately like:

- `Iterator definition: Rotor Sweep Iterator`
- `Body: Rotor Step Round`
- `Default rounds: 8`
- `Resolved rounds: 8`

If overridden:

- `Default rounds: 8`
- `Resolved rounds: 12`
- `Instance override active`

The exact phrasing may differ, but the distinction must be explicit.

## Card / Canvas Guidance

This slice may add one bounded iterator-specific canvas cue if needed, but only if it improves comprehension without adding clutter.

Good examples:
- a small `×8` style count cue on selected iterator cards
- a quiet “body: X” sublabel in an existing details surface

Bad examples:
- permanently dense badges on all iterator cards
- a second inspector surface
- a full expanded inline editor on the card

## Micro Demo Shape

The demo should be small and visually honest.

Preferred shape:
- one simple single-input / single-output round body
- one authored iterator wrapper
- one source
- one sink

The demo’s teaching objective is not “advanced iteration.”
It is:
- what gets repeated
- where the count lives
- how the wrapper relates to the body

## Suggested Demo

One good candidate is:

`BitSource -> authored iterator wrapper of a simple repeatable bit transform -> BitOutput`

Or:

`TextInput -> authored iterator wrapper of a simple symbol-preserving round -> TextOutput`

The exact demo should prefer the smallest machine that makes the wrapper/body distinction obvious.

## Non-Goals

This slice must not quietly expand into stronger iterator control.

Specifically, do not add:
- signal-selectable stopping
- dynamic count derived from wires
- condition ports
- partial unrolling UI
- iterator-local state machine semantics

If MCW wants signal-driven iterator control later, that must proceed through a separate contract under the existing `ITERATOR-CONTROL-V1.md` line.

## Implementation Bias

Prefer reusing existing surfaces over inventing new ones:
- parameter inspector
- selected details
- micro demo registry

Do not add a new iterator authoring surface just to explain count resolution.

## Exit Condition

This contract is complete when all of the following are true:
- an authored iterator instance clearly shows default versus resolved rounds
- the repeated body relationship is easy to read without ambiguity
- one shipped micro demo makes the wrapper/body model obvious
- no new iterator execution semantics were introduced

## Best Follow-On

After this slice, the next iterator contract should be a real control-semantics contract, not more wrapper polish.

That follow-on would likely be:
- a bounded `while` / signal-stop iterator decision contract
- or a tighter revision of `ITERATOR-CONTROL-V1.md`

But only after the authored bounded iterator workflow feels complete.
