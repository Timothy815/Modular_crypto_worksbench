# REQUIRE-LENGTH-MATCH-WORKFLOW-POLISH-V1

Last updated: April 11, 2026

Status: Shipped

## Purpose

Define a bounded workflow-polish slice around strict mismatch helpers so “fail fast” behavior reads as intentional and educational rather than abrupt or opaque.

This slice is not about changing the semantics of `Require*LengthMatch`.
The semantics are already correct.

This slice is about making that correctness easier to understand at the moment it matters.

## Product Problem

MCW now has a strong mismatch family:
- repair helpers:
  - `Repeat*ToMatch`
  - `Truncate*ToMatch`
  - `Pad*ToMatch`
- strict helpers:
  - `RequireSymbolLengthMatch`
  - `RequireBitsLengthMatch`

That is the right architecture.

But strict helpers create a special moment in the product:
- the graph is explicit
- the machine refuses to proceed
- the user must understand why this refusal is correct

If that moment is under-explained, the product feels brittle.
If it is explained well, the product feels rigorous.

## Core Question

Can MCW make strict mismatch failure feel more legible and intentional without weakening strictness or drifting into automatic repair?

## Strategic Principle

**A strict helper should stop the graph loudly, clearly, and locally.**

That means:
- the blocking module should be easy to identify
- the reason should be concrete
- the nearby alternatives should remain visible
- the product should not silently suggest a hidden fix

## Relationship To Existing Work

This slice builds on:
- `REQUIRE-LENGTH-MATCH-V1`
- `PIPELINE-MICRO-DEMOS-V1`
- `PIPELINE-MICRO-DEMOS-V2`
- `PIPELINE-ROLE-LANGUAGE-V1`

This is the workflow-polish follow-on after the strict helpers already exist and have micro demos.

## Relationship To `PIPELINE-ROLE-LANGUAGE-V1`

`PIPELINE-ROLE-LANGUAGE-V1` already gives this module family the primary role label:
- `Role: Mismatch Helper`

This shipped slice extends that language with strict-helper-specific wording such as:
- `require exact visible reference length`
- `Strict length check`
- local failure-state explanation

Do not replace the existing role label.
Extend it.

## Include

V1 includes bounded improvements in:

1. **Inspector clarity**
- make the selected strict helper clearly read as:
  - `Role: Mismatch Helper`
  - `require exact visible reference length`
- make mismatch outcomes concrete in local wording

2. **Validation/runtime message quality**
- length mismatch messages should be plain, domain-native, and directional
- examples:
  - `input has 6 characters; reference has 8 characters — input is 2 characters shorter`
  - `input has 24 bits; reference has 32 bits — input is 8 bits shorter`

3. **Failure-local workflow hints**
- small bounded hints such as:
  - `If you want visible normalization instead, a repair helper upstream can align lengths before this point`
- this must remain descriptive, not automatic, and must not imply that the strict helper is misplaced

4. **Focused primitive micro demos**
- extend one symbol-domain strict-helper micro demo and one bit-domain strict-helper micro demo so the failure is the point of the lesson
- each demo should show:
  - one strict branch that blocks on mismatch
  - one visible repair-helper alternative branch beside it
  - local sink endpoints that make the contrast legible

## Exclude

Do not include in V1:
- auto-repair suggestions inserted into the graph
- automatic conversion from require to repeat/truncate/pad
- hidden fallback behavior
- a generic “fix this for me” action

## Core Rules

1. **Strict helpers remain strict**
- no behavioral softening
- no permissive mode

2. **Messages must be local and actionable**
- say what mismatched
- say by how much
- say where the user can make a visible decision

3. **Repair vs require must remain distinct**
- repair helpers adjust the graph result
- require helpers refuse to continue
- the UI should reinforce this distinction explicitly

4. **The graph remains the authority**
- hints may name likely upstream helpers
- hints may not rewrite the graph or collapse the choice

5. **Hints must describe alternatives as design choices, not corrections**
- good: `If you want visible normalization instead, a repair helper upstream can align lengths before this point.`
- bad: `Try a repair helper instead.`
- the require helper stopping the graph is correct behavior; hint language must not undermine that

## Recommended UI Language

Good examples:
- `Strict length check`
- `Execution stopped here because lengths do not match`
- `If you want visible normalization instead, a repair helper upstream can align lengths before this point`
- `This helper does not repeat, pad, or truncate`

Bad examples:
- `Maybe fix automatically`
- `Mismatch corrected`
- `Recommended fix applied`

## Likely Surfaces

Likely files/surfaces in scope:
- strict-helper inspector summaries
- local validation issue copy
- runtime/trace issue presentation
- focused strict-helper primitive micro demo copy

This should stay UI-local unless a tiny message-formatting helper is justified.

## Success Criteria

This slice is successful when:
- users understand why a strict helper blocked the graph
- strict mismatch failure feels educational rather than arbitrary
- the distinction between repair and require becomes more obvious
- MCW stays explicit and rigorous without becoming punitive

## Explicitly Avoid Next

Do not let this become:
- a graph repair system
- a hidden recommendation engine
- a softening of strict semantics

This is a workflow-polish slice only.
