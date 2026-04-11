# SEQUENCE-VS-TICK-CUEING-V1

Last updated: April 11, 2026

Status: Draft

## Purpose

Define a bounded UI ergonomics slice that makes the distinction between:
- **whole sequence**
- **per-tick scalar**

explicit at the exact surfaces where users currently get confused.

This slice is not about changing engine behavior.
It is about making the existing sequence model legible in the inspector, tick bar, and node-level runtime presentation.

## Product Problem

MCW now has the right architecture:
- explicit sequence sources
- explicit sequence-to-ticked bridges
- explicit ticked-to-sequence collectors
- explicit representation bridges
- explicit mismatch helpers

But the UI still makes users do too much interpretation.

Right now a user can still reasonably ask:
- is this module consuming one whole sequence or one value per tick?
- is this output showing the current scalar word or the fully collected result?
- is this bridge changing representation, time shape, or both?
- is this collector showing the current tick append or the accumulated sequence?

The model is correct.
The cues are not yet strong enough.

## Why Now

This should follow the pipeline demo expansion because:
- the demos create the real target workflows
- the same ambiguity will recur across those workflows unless the UI names it clearly
- this is now one of the highest-friction authoring misunderstandings in the product

The recent collected-output transcript bug is part of the same broader lesson:
- sequence-vs-tick state is now central enough that the UI must say exactly what kind of thing the user is looking at

## Core Question

Can MCW add stronger whole-sequence vs per-tick scalar cues without creating a noisy “type system lecture” in the UI?

## Strategic Principle

**Say the temporal shape where the user is already looking.**

That means:
- do not invent a new heavy explanation panel
- do not make users hover every module to understand the flow shape
- put the cue into existing summary surfaces
- keep the wording short, consistent, and visible

## Include

This slice should include bounded cueing improvements in:
- module library entry copy for bridges and collectors
- inspector output/trace summaries
- tick bar collected output summary
- node-card tick/runtime badges where appropriate

It may also include:
- short labels or chips that name the current shape explicitly
- consistent wording such as `whole sequence`, `one per tick`, `collected`, `fixed-width word`

## Exclude

Do not include in V1:
- new engine signal kinds
- validation changes
- automatic module grouping or graph inference
- large visual redesign of the inspector
- per-port type annotations rendered permanently on the canvas
- a new “mode explanation” side panel

## Primary Target Surfaces

### 1. Module library

Current library entries are already good, but they are still mostly descriptive.

V1 should strengthen them so users can immediately tell:
- sequence source
- sequence-to-ticked bridge
- ticked-to-sequence collector
- representation bridge
- mismatch helper

The key need is not more words.
It is more explicit role language.

### 2. Parameter inspector

The inspector should state whether the selected module is currently acting on:
- a whole sequence
- one scalar per tick
- one accumulated collected result

This matters most for:
- `AsciiSequenceToTicked`
- `BitsSequenceToTicked`
- `SymbolSequenceToTicked`
- `TickedSymbolsToSequence`
- `TickedBitsToSequence`
- `AsciiCharToBits`
- `BitsToAsciiChar`
- `BitsToHexDigit`

### 3. Tick bar / collected output summary

The current `Collected` label is too weak on its own.

V1 should make it obvious whether the user is seeing:
- the running collected whole output
- a per-tick sink value
- the final accumulated transcript so far

### 4. Node-card runtime badges

Node cards already show some live state and history.

For bridge and collector modules, V1 should consider one small bounded badge that tells the truth about role and temporal shape, for example:
- `whole -> tick`
- `tick -> whole`
- `8-bit / tick`
- `collecting`

This must remain restrained.

## Core Rules

1. **Use consistent vocabulary everywhere**
- `whole sequence`
- `one per tick`
- `fixed-width word`
- `collected sequence`
- `representation bridge`

Do not invent multiple competing phrases for the same concept.

2. **Say shape before detail**
- users need to know “what kind of thing is this?”
- only then do parameter details such as `wordWidth`, `wrap`, or `padBit` help

3. **Cues must be local to the module**
- the selected module should explain its own role
- do not require cross-panel reasoning to infer whether something is whole-sequence or ticked

4. **Do not over-label the canvas**
- the workbench must remain visually calm
- always-on labels should be short
- detailed wording belongs in inspector and library surfaces

5. **Collectors must be explicit about accumulation**
- the UI must not imply that a collector output is a fresh scalar on each tick
- use words such as `collected so far` or `running collected output`

## Recommended V1 Cue Grammar

The preferred short-form language is:

- sequence sources:
  - `whole sequence`
- sequence-to-ticked bridges:
  - `whole -> one per tick`
- ticked-to-sequence collectors:
  - `one per tick -> whole`
- scalar representation bridges:
  - `scalar bridge`
- whole-sequence representation bridges:
  - `whole-sequence bridge`
- fixed-width tick bridges:
  - `8-bit word per tick`
  - `4-bit word per tick`

This wording is intentionally plain.

## Recommended Inspector Behavior

For selected bridge and collector modules, the inspector should show a small role summary near the top, before parameter details.

Examples:
- `Role: bridge`
- `Shape: whole sequence -> one ASCII character per tick`
- `Role: collector`
- `Shape: one 8-bit word per tick -> collected whole bit sequence`

For outputs in ticked mode:
- if the visible summary is cumulative, label it as cumulative
- if the visible summary is per-tick, label it as per-tick

## Recommended Tick Bar Behavior

When ticked mode is active and there is a collected output summary, prefer wording such as:
- `Collected so far`
- `Running output`

Avoid the bare label `Collected` if no other cue explains that the value is cumulative.

If no collector is involved and the sink is genuinely per-tick, the wording should not imply accumulation.

## Recommended Node-Level Behavior

Node-level cues should be minimal.

Good bounded examples:
- collectors show `collecting`
- sequence-to-ticked bridges show `per tick`
- fixed-width tick bridges show `8b/tick` or `4b/tick`

Bad examples:
- full sentence labels on every card
- permanent duplicate type explanations on all modules

## Expected File Scope

Likely files in scope:
- `src/ui/module-library.ts`
- `src/ui/components/parameter-inspector.tsx`
- `src/ui/components/workbench-panel.tsx`
- `src/App.tsx`
- focused UI tests if needed
- `README.md`
- `IMPLEMENTATION-STATUS.md`

This slice should not require engine-layer changes.

## Success Criteria

This slice is successful when:
- users can tell whether a selected module is operating on a whole sequence or on one value per tick
- collector outputs are clearly understood as accumulated results
- bridge modules read more like workflow adapters and less like vague conversion primitives
- the canvas remains clean and the inspector becomes more immediately truthful

## Explicitly Avoid Next

Do not let this contract drift into:
- a general module taxonomy redesign
- graph-wide permanent labels
- new engine signal categories
- automatic workflow inference

This slice is only about making the current model read clearly.
