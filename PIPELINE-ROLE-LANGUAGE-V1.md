# PIPELINE-ROLE-LANGUAGE-V1

Last updated: April 11, 2026

Status: Draft

## Purpose

Define a bounded UI-language slice that makes pipeline roles legible across the workbench without redesigning the entire module library.

The goal is for users to recognize at a glance whether a module is acting as:
- source
- bridge
- operator
- mismatch helper
- collector
- sink

This contract is about language and lightweight presentation, not engine behavior.

Implementation note:
- this contract is the implementation vehicle for the merged role/cueing pass
- `SEQUENCE-VS-TICK-CUEING-V1` should be treated as the temporal-shape subsection of this work, not as a separate standalone implementation

## Product Problem

MCW now has the right building blocks, but they still read too much like a flat set of primitives.

A user can often understand what a module does in isolation.
What is still harder is seeing what role that module is playing in a larger workflow.

Examples:
- `AsciiSequenceToTicked` is not just a bridge; it is a **time-shape bridge**
- `TickedBitsToSequence` is not just a bridge; it is a **collector**
- `RepeatBitsToMatch` is not just a sequence primitive; it is a **mismatch repair helper**
- `RequireSymbolLengthMatch` is not just validation; it is a **strict mismatch assertion helper**

The module library already has solid purpose/detail copy and sectioning.
The missing piece is a small, explicit pipeline-role language that users can learn once and then reuse everywhere.

## Why Now

This should come after:
- pipeline micro demo expansion
- sequence-vs-tick cueing
- reference-length ergonomics planning

because those slices define the workflows and ambiguity that this language needs to clarify.

The product now has enough pipeline structure that role labels will help rather than confuse.

## Core Question

Can MCW add clearer pipeline role language without making the UI feel over-labeled or taxonomic for its own sake?

## Strategic Principle

**Label role, not ontology.**

That means:
- say what the module is doing in the workflow
- avoid turning the UI into a textbook classification system
- use a small stable vocabulary
- reuse the same labels across the module library, Quick Start, and inspector where it helps

## Include

This slice should include lightweight role-language improvements in:
- module library cards
- Quick Start pipeline micro demo descriptions where useful
- inspector summaries for selected modules
- possibly minimal chip/badge treatment in narrow places where role disambiguation is high-value

## Exclude

Do not include in V1:
- a full module-library reorganization
- a second navigation model
- large permanent canvas labels
- color-coding every module by role
- a complex many-level taxonomy
- engine metadata expansion beyond what is needed for bounded UI role labeling

## Locked Role Vocabulary

V1 should use a small fixed role set:
- `Source`
- `Bridge`
- `Operator`
- `Mismatch Helper`
- `Collector`
- `Sink`

Optional bounded sub-role language may be shown in detail copy, but the main visible role vocabulary should stay fixed.

Examples:
- `Bridge: whole -> one per tick`
- `Bridge: representation`
- `Mismatch Helper: repeat to match`
- `Mismatch Helper: require exact match`
- `Collector: one per tick -> whole`

## Core Rules

1. **One visible primary role per module surface**
- a module may have nuanced behavior, but the UI should choose one primary role label where the label is shown
- when a module plausibly fits more than one role, the earliest-stage / input-most role wins
- example: `HexSource` reads as a `Source`, not as a `Bridge`, because the user encounters it first as a graph entry point

2. **Role labels must help workflow reading**
- the label is there to answer “what part does this play in the machine?”
- not “what abstract category could this belong to in theory?”

3. **The vocabulary must remain small**
- six primary roles is enough for V1
- avoid extra families like `Normalizer`, `Temporal Adapter`, `Shape Adapter`, `Recovery Tool` unless a later slice proves they are truly necessary

4. **Mismatch helpers stay explicit**
- repeat / truncate / pad / require helpers should be visibly read as one family of workflow tools
- their policy stays in the detail copy and module name
- the detail copy should distinguish repair helpers from strict assertion helpers
- recommended sub-role wording:
  - `Mismatch Helper: repair`
  - `Mismatch Helper: require`

5. **Collectors must read differently from bridges**
- this is a high-value distinction
- `TickedBitsToSequence` and `TickedSymbolsToSequence` should not read like generic bridges only

## Recommended Surface Behavior

### 1. Module library

Each module card should remain compact, but bridge and mismatch-heavy entries should gain a small explicit role cue.

Examples:
- `Role: Bridge`
- `Role: Mismatch Helper`
- `Role: Collector`

The current section structure remains.
This is a role overlay, not a replacement.
Temporal-shape wording such as `whole -> one per tick` or `one per tick -> whole` should occupy the same role-label system, not appear as a second independent taxonomy.

### 2. Inspector

When a module is selected, the inspector should be able to say:
- `Role: Collector`
- `Role: Bridge`
- `Role: Mismatch Helper`

This is especially helpful for:
- sequence-to-ticked modules
- ticked-to-sequence modules
- reference-driven match helpers
- scalar representation bridges

### 3. Quick Start pipeline demos

Pipeline demo summaries should preferentially use the same role vocabulary.

Example:
- “repeats a visible ASCII key with a mismatch helper, bridges both branches into bits one character at a time, XORs them, then collects the running result”

This gives the demos and the library the same teaching language.

## Recommended Detail Grammar

The primary role should be short.
The detail copy should explain the sub-role.

Good examples:
- `Role: Bridge`
  - `whole sequence -> one per tick`
- `Role: Collector`
  - `one per tick -> whole sequence`
- `Role: Mismatch Helper`
  - `repeat to visible reference length`
- `Role: Mismatch Helper`
  - `require exact visible reference length`
- `Role: Operator`
  - `bitwise XOR over equal-width words`

Bad examples:
- long role labels such as `Temporal Sequence Rematerialization Primitive`
- labels that duplicate the full module description

## Expected File Scope

Likely files in scope:
- `src/ui/module-library.ts`
- `src/ui/components/parameter-inspector.tsx`
- `src/ui/components/quick-start-panel.tsx`
- possibly `src/ui/pipeline-micro-demos.ts`
- focused tests if needed
- `README.md`
- `IMPLEMENTATION-STATUS.md`

This slice should stay UI-local.

## Success Criteria

This slice is successful when:
- users can identify bridge, collector, mismatch-helper, and sink roles more quickly
- pipeline demos and module library entries share the same role language
- the UI feels clearer without becoming busier
- the sequence pipeline reads more like a visible machine and less like an unsorted list of primitives

## Explicitly Avoid Next

Do not let this become:
- a full information architecture redesign
- a role-based filter matrix with many overlapping classes
- a heavy permanent canvas annotation layer
- a substitute for better demos or better cueing

This slice is the final presentation-language pass after the more structural ergonomics work is locked.
