# Palette Coherence V1

Last updated: March 27, 2026

Status: Shipped on `main`.

## Purpose

This contract defines the first bounded pass on primitive-library coherence after the learning-path reorganization work.

The goal is not to redesign the whole UI.
The goal is to make the module library read more like the product MCW has become, and less like a raw engine inventory.

## Why Now

The recent pathfinding work improved the teaching-library side of the product:
- later demos, tutorials, and challenges are better staged
- the late arc is no longer collapsed into one terminal learning bucket
- selectors now show stage-aware group labels and respect suggested order

But the primitive palette still lags behind that product framing.

Right now the module library still compresses too much into broad buckets such as:
- `Inputs & Outputs`
- `Bit Domain`
- `Transforms`

That causes three problems:
- protocol/context modules still read like generic inputs
- structural/founding modules and later-purpose modules sit beside each other without enough guidance
- the library teaches the implementation substrate more clearly than the product-level vocabulary family

## Product Goal

The primitive palette should help users answer:
- what kind of machine part is this?
- why would I use it?
- where does it belong in the product’s explicit-machine language?

The palette should feel:
- guided, not encyclopedic
- honest, not magical
- product-shaped, not merely engine-shaped

## Core Decision

This pass should revise **palette organization and wording**, not capability.

That means:
- section names may change
- section membership may change
- section descriptions and module copy may change

That does **not** mean:
- new primitives
- nested folder trees
- a new search system
- a visual redesign detached from clarity

## Current Friction

Examples of the current mismatch:
- `IV`, `Nonce`, and `Salt` still appear as generic input modules even though they are explicit protocol/context material
- `ModExp` and `Equals` both read as generic `Bit Domain` items despite teaching very different vocabulary families
- `BitSplit`, `BitPad`, `BitWindow`, `ByteRotate`, `ByteSwap`, and `SBox` all collapse into `Transforms`, even though some are framing/structure tools and others are round-function ingredients

The current palette is usable.
It is not yet coherent enough for the product scale MCW now has.

## Scope

This contract is limited to:
- `src/ui/module-library.ts`
- palette-facing section organization
- palette-facing descriptions and naming
- `ModuleLibrarySectionId`
- `MODULE_LIBRARY_SECTIONS`
- any affected tab/filter logic in `matchesModuleDomainTab`
- any small supporting tests needed for the new classification behavior

This contract may include:
- revised section ids if needed
- revised section titles
- revised section descriptions
- reassignment of shipped primitives into more honest sections
- stronger wording for protocol/context modules and later-arc arithmetic/verification modules

## Desired Shape

The resulting palette should better distinguish at least:
- sources / sinks
- protocol/context material
- symbolic machine parts
- bitwise operators and comparisons
- structure/framing tools
- state/stream machinery
- bridges
- composites/iterators

Exact final labels do not have to match those words exactly.
But the palette should stop implying that all non-symbol primitives belong in one generic technical bucket.

The palette should have no more than **10 top-level sections**.
If the natural classification would produce more, merge families rather than splitting further.

Avoid singleton or tiny sections unless the distinction is materially important to product clarity.

## Required Behaviors

1. **Preserve search**
- search should remain at least as effective as today

2. **Preserve explicit-machine philosophy**
- sectioning should clarify visible structure, not hide it

3. **Preserve compositional honesty**
- do not create section names that imply black-box algorithms or presets

4. **Prefer bounded moves**
- revise only what noticeably improves product clarity

5. **Preserve immutable primitive ids**
- `definition.id` values must not change
- this slice may change only section assignment, display copy, and related palette metadata

6. **Keep ordering deterministic**
- modules within each section must retain a stable, intentional ordering

7. **Treat this as metadata-only**
- `evaluate()` behavior, runtime semantics, and parameter schemas are out of scope

8. **Preserve tab consistency**
- domain tabs are not being redesigned in this slice
- they must remain coherent with the revised section structure

## Non-Goals

Do not include:
- new demo/tutorial/challenge content
- new primitive modules
- workspace navigation changes
- tutorial or challenge selector changes unrelated to the palette
- a generic visual refresh
- deep palette nesting or multi-level taxonomy sprawl
- a parallel redesign of the domain-tab model

## Success Criteria

This contract is successful when:
- protocol/context modules feel visibly distinct from generic raw inputs
- framing/structure tools feel distinct from round-function ingredients
- the palette reads more like a cryptographic systems workbench and less like a flat node catalog
- users can infer more of a primitive’s role before opening its parameter editor
- `IV`, `Nonce`, and `Salt` no longer share a `sectionId` with generic raw source/sink modules such as `TextInput`, `KeyInput`, `BitSource`, `Output`, or `BitOutput`

## Suggested Validation Questions

After implementation, validate:
- do `IV`, `Nonce`, and `Salt` now read like protocol/context material?
- do number-theoretic and verification-flavored primitives still feel lost inside generic bitwise groupings?
- do framing/structure tools now feel easier to discover as a family?
- did search and quick primitive lookup remain simple?
- do existing saved projects still load normally without any migration behavior?

## What To Avoid

Avoid:
- a giant taxonomic rewrite
- overfitting the palette to one teaching sequence
- duplicating the learning-library stage model inside the primitive palette
- changing names so aggressively that existing users cannot find familiar parts

## Persistence Note

This slice assumes section classification is UI metadata only and is not persisted in saved workspace or project state.

If implementation reveals that section ids are persisted or externally depended on in a way that would require migration, stop and revise scope before proceeding.

## Search Note

Reassigned primitives should:
- retain all existing search terms
- gain section-family search vocabulary where that materially improves discoverability

## Relationship To Recent Work

This contract follows:
- `MCW-V2-SANITY-PASS.md`
- `MCW-V2-SANITY-AUDIT.md`
- `LEARNING-SEQUENCE-V2.md`

Those slices improved the teaching-library map.
This slice improves the primitive-library map.

## Likely Milestone

If implemented cleanly, this is a good candidate for:
- `v1.47.0` — Palette Coherence V1
