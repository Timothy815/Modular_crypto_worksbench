# MCW V2 Sanity Audit

Last updated: March 26, 2026

Status: Completed audit of the proposed post-`v1.44.0` `v2.0` sanity-pass scope.

## Purpose

This audit evaluates the three pressure points named in `MCW-V2-SANITY-PASS.md` against the currently shipped workbench:
- learning-library hierarchy
- palette/category coherence
- large-workspace usability

The goal is to decide whether the current product mostly holds as-is, or whether one bounded follow-on contract is justified.

## Scope Reviewed

Reviewed product surfaces:
- learning-sequence helpers and stage/group ordering
- shipped demo/tutorial/challenge metadata
- workbench project selector and project context card
- tutorial selector and progression surface
- primitive palette sectioning and filtering
- first large composition demos, especially integrity/authentication and handshake-era workspaces

Primary code surfaces reviewed:
- `src/ui/learning-sequence.ts`
- `src/ui/module-library.ts`
- `src/ui/components/workbench-panel.tsx`
- `src/ui/components/tutorial-panel.tsx`
- `src/ui/demo-projects.ts`
- `src/ui/starter-tutorials.ts`
- `src/ui/starter-challenges.ts`

## Executive Result

The shipped product is still coherent enough to teach from.
The current problem is not that MCW has become unusable.

The real problem is that **the library’s classification model has fallen behind the product’s conceptual depth**.

The product now has a clear later arc:
- visible key derivation
- visible block dependence
- visible integrity checks
- visible authenticated encryption
- visible signatures
- visible handshake composition

But the current sequencing and grouping surfaces still compress too much of that later arc into broad buckets, especially:
- `Number Theory`
- `Stage 9 · Advanced Arithmetic`
- broad palette sections like `Bit Domain` and `Transforms`

That means the product’s machine language is stronger than the learner-facing map.

## Findings

### 1. Learning-library hierarchy: partially successful, now underspecified

What holds up:
- MCW already has a real sequencing system, not just a flat library.
- Demos, tutorials, and challenges all support `stage`, `order`, `core`, and `recommendedAfter`.
- The workbench and tutorial panel surface `Stage`, `Core Path`, and `Best after`.
- Cross-artifact sequencing is consistent enough that later labs can point back to earlier ones.

What no longer fits cleanly:
- `learning-sequence.ts` still ends at `advanced-arithmetic-and-number-theory`.
- That terminal stage now contains:
  - arithmetic expansion
  - number theory
  - hashing
  - cryptanalysis
  - signatures
  - the secure handshake
- The late product arc is therefore visible only as ordered items inside a broad terminal bucket, not as distinct teaching families.

Evidence:
- `Number Theory`, `Hash Foundations`, and `Cryptanalysis` all map into the same terminal stage in `src/ui/learning-sequence.ts`.
- `Visible Signature Verification` and `Visible Secure Handshake` are both grouped under `Number Theory` in demos, tutorials, and challenges.
- The handshake line does declare `recommendedAfter`, but it still lives in the same visible family as toy RSA and Diffie-Hellman.

Assessment:
- The first sequencing milestone succeeded.
- It no longer gives enough product-level shape to the late library.

### 2. Palette/category coherence: functionally usable, conceptually flattened

What holds up:
- The palette has search, domain tabs, and section descriptions.
- Primitive descriptions are generally strong and teaching-oriented.
- Composite handling is already separate and clear.

What no longer fits cleanly:
- The primitive library sections are still very broad:
  - `Inputs & Outputs`
  - `Symbol Domain`
  - `Bit Domain`
  - `Transforms`
  - `State & Keystream`
  - `Bridges`
- This means conceptually different families now sit beside each other with little product guidance:
  - `ModExp` and `Equals` are both in `Bit Domain`
  - `BitSplit`, `BitPad`, `BitWindow`, `ByteRotate`, and `SBox` are all in `Transforms`
  - `IV`, `Nonce`, and `Salt` still appear as generic inputs rather than visibly protocol-facing material

Assessment:
- The palette is not broken.
- But its current organization still reads like an engine vocabulary index, not a product map aligned to the later teaching arc.

### 3. Large-workspace usability: acceptable for first systems demos, not the main source of friction

What holds up:
- The workbench already supports:
  - group/workspace selection
  - project summary and pipeline context
  - `Tidy Layout`
  - annotations
  - tutorial focus and canvas callouts
  - multi-select movement
  - copy/paste of selected clusters
- The first large systems workspaces are still inspectable.
- The canvas has horizontal scrolling and explicit per-module structure, which fits MCW’s philosophy.

Evidence from shipped demo size:
- `visible-authenticated-encryption`: 37 modules
- `visible-secure-handshake`: 18 modules
- `visible-tamper-check`: 20 modules
- `recursive-key-schedule`: 19 modules

What is still weak:
- Large graphs remain mostly one flat canvas with scrolling.
- There is no second-level workspace organization surface beyond:
  - project grouping
  - tutorial focus
  - annotations
  - manual layout cleanup

Assessment:
- This is a real future pressure point.
- It is not yet the highest-leverage next fix.
- The current larger friction is discoverability and classification, not inability to inspect the graph at all.

## Decision

One bounded follow-on is justified.

That follow-on should be:
- **a learning-library / pathfinding reorganization pass**

That follow-on should not be:
- a broad canvas rewrite
- a minimap/zoom/navigation feature spree
- a new cryptographic concept family
- a new foldering/sharing/library-management system

## Why This Is The Right Next Slice

The strongest current mismatch is:
- the product already teaches a longer conceptual arc than the visible library structure communicates

In plain terms:
- the machine language expanded successfully
- the learner-facing map did not expand at the same rate

That mismatch appears:
- in stage naming
- in group naming
- in late-arc item placement
- in how the workbench selector exposes workspaces

It appears less strongly in:
- basic graph manipulation
- graph readability mechanics
- low-level module discoverability via search

## Recommended Follow-On

The next bounded contract should focus on:
- revising the late learning spine after the first systems-composition checkpoint
- separating later content families more honestly
- improving selector/pathfinding labels without restricting free exploration

The main product goal should be:
- make it obvious how learners move from arithmetic and number theory into integrity, authentication, and then systems composition

## Explicit Recommendation Against

Do not make the next slice:
- a generic “large workspace UX” milestone
- a minimap/zoom-first milestone
- a palette taxonomy rewrite in isolation

Those may still become justified later.
They are not the clearest next leverage point from this audit.

## Audit Outcome

Result:
- the `v2.0` sanity pass found one justified next contract
- that contract should be a bounded pathfinding/library-organization follow-on
- no broader redesign is justified by current evidence

The next file to create is:
- `LEARNING-SEQUENCE-V2.md`
