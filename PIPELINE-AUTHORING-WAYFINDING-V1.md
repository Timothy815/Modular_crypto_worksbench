# PIPELINE-AUTHORING-WAYFINDING-V1

Last updated: April 11, 2026

Status: Draft

## Purpose

Define a bounded UI-language and guidance slice that helps users recognize common pipeline shapes without auto-building the graph for them.

This is not a wizard.
This is not a recipe engine.
This is not hidden graph synthesis.

It is a wayfinding layer for the workflows MCW already supports well.

## Product Problem

MCW now has:
- explicit sequence sources
- explicit whole-to-tick bridges
- explicit representation bridges
- explicit mismatch helpers
- explicit collectors
- end-to-end pipeline micro demos
- role-language cues in the palette and inspector

That means the basic pieces are present and the role language is improving.

What is still missing is compositional confidence.

A user still has to ask:
- what is the normal shape of an ASCII repeated-key XOR pipeline?
- when do I need a collector?
- when do I need a whole-sequence bridge versus a scalar bridge?
- how should I think about mismatch helpers in relation to the operator?

The product has the right parts but still asks users to invent the workflow grammar themselves.

## Core Question

Can MCW make common pipeline patterns easier to recognize without turning those patterns into hidden automation?

## Strategic Principle

**Teach pipeline shape, do not synthesize pipeline shape.**

That means:
- guide the user toward the correct visible modules
- show common stage orderings
- keep the graph explicit
- avoid one-click recipe generation in V1

## Relationship To Existing Work

This slice builds directly on:
- `PIPELINE-MICRO-DEMOS-V1`
- `PIPELINE-MICRO-DEMOS-V2`
- `PIPELINE-ROLE-LANGUAGE-V1`
- `SEQUENCE-VS-TICK-CUEING-V1`

This is the next teaching-language layer after the product has enough explicit pieces to deserve one.

## Include

V1 should include bounded wayfinding in the existing UI surfaces:

1. **Quick Start**
- short pipeline-pattern summaries attached to the shipped micro demos
- emphasis on workflow question answered, not on module inventory

2. **Primitive palette / library help**
- small “commonly used in” language for key bridges, collectors, and mismatch helpers
- examples:
  - `Often follows whole-sequence sources before XOR`
  - `Usually ends a ticked operator branch before a sink`

3. **Inspector guidance for selected modules**
- one short workflow note for modules that frequently cause authoring uncertainty
- examples:
  - `Typical use: whole message -> bridge -> XOR -> collector`
  - `Typical use: reference anchor before repeat or require`

## Exclude

Do not include in V1:
- one-click graph generation
- an “insert missing bridge” button
- automatic suggestions that modify the graph
- template-driven modal wizards
- a second full tutorial system
- free-form recommendation AI inside the product shell

## Target Module Families

Wayfinding language should focus on the modules most likely to benefit:
- `AsciiSequenceToTicked`
- `BitsSequenceToTicked`
- `TickedBitsToSequence`
- `TickedSymbolsToSequence`
- `AsciiCharToBits`
- `BitsToAsciiChar`
- `BitsToHexDigit`
- `Repeat*ToMatch`
- `Truncate*ToMatch`
- `Pad*ToMatch`
- `Require*LengthMatch`

Do not try to add wayfinding copy to every primitive in the product.

## Recommended Pattern Language

The wording should stay short and reusable.

Good pattern examples:
- `Typical path: whole sequence -> one per tick -> operator -> collector`
- `Typical path: message + repeated key -> bit bridge -> XOR -> collected output`
- `Use before a strict-width operator`
- `Use after a ticked branch when you need the whole result again`

Bad pattern examples:
- full tutorial prose on palette cards
- step-by-step algorithm explanations inside the inspector
- recommendations that sound like hidden policy advice

## Core Rules

1. **Wayfinding must describe common usage, not imply mandatory usage**
- say “typical path,” not “required path”

2. **Guidance must preserve explicit graph authorship**
- no auto-insertion
- no silent corrections

3. **The language should reuse the role vocabulary**
- source
- bridge
- operator
- mismatch helper
- collector
- sink

4. **Wayfinding should answer a workflow question**
- not just restate the module description

5. **Only apply it where uncertainty is common**
- this should be a scalpel, not a blanket

## Likely UI Shapes

Good bounded examples:
- a short “Typical path” line in expanded palette help
- a one-line workflow hint in the inspector below the role summary
- a small Quick Start caption that explains the demo in role language

Bad examples:
- always-on paragraphs on every card
- a separate recommendation sidebar
- colorful flow diagrams embedded in the inspector

## Success Criteria

This slice is successful when:
- users can compose common pipelines with fewer false starts
- the product teaches common graph shapes without hiding them
- bridges, mismatch helpers, and collectors feel easier to place correctly
- the UI still feels disciplined rather than instructional overload

## Explicitly Avoid Next

Do not let this become:
- a hidden recipe engine
- a second tutorial framework
- a substitute for better demos

This slice is about wayfinding language only.
