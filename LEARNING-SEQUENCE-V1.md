# Learning Sequence V1

Last updated: March 25, 2026

Status: Active contract.

## Purpose

This contract defines the first bounded sequencing framework for MCW demos, tutorials, and challenges.

The goal is not to turn MCW into a locked course.
The goal is to give the teaching surface a visible, logical progression so new users are guided instead of overwhelmed.

MCW should continue to support free exploration.
But the default learning experience should suggest an order that builds vocabulary and confidence in a sensible way.

## Why Now

MCW now has enough teaching artifacts that a new user can feel like a kid in a candy store:
- many demos
- many tutorials
- many guided challenges
- multiple vocabulary families across classical and modern lines

That freedom is valuable, but without structure it creates three problems:
- new users do not know where to start
- later labs can appear before the concepts they depend on
- the library feels like a pile of interesting experiences instead of a coherent machine language

The next honest step is not more content.
The next honest step is a visible suggested path through the content that already exists and through all future content.

## Product Goal

The teaching surface should feel like:
- **guided, not rigid**
- **ordered, not locked**
- **coherent, not flat**

Users should be able to:
- follow a recommended progression
- understand why one lab appears before another
- still jump ahead if they want
- return to the suggested path without losing context

## Core Decision

MCW should support **two concurrent learning modes**:

1. **Suggested Path**
- the primary recommended progression
- ordered by conceptual dependency and cognitive load
- visible in demos, tutorials, and challenges

2. **Free Explore**
- the existing library-style freedom
- users may open anything at any time
- the product should still show where that item sits in the suggested path

This contract is about the **Suggested Path** and the metadata needed to support it.

## Learning Spine

The first suggested path should be organized into stages.

### Stage 1 — Foundations
- explicit signals
- simple transforms
- visible outputs

### Stage 2 — Classical Symbol Machines
- symbolic substitution
- reflection
- visible order changes

### Stage 3 — Modern Bit Machines
- boolean and word transforms
- byte-round style labs

### Stage 4 — State And Control
- clocks
- stateful modules
- comparisons and gates

### Stage 5 — Framing And Protocol Context
- block boundaries
- protocol material
- explicit key routing

### Stage 6 — Streams And Scheduling
- irregular clocking
- selection
- routing

### Stage 7 — Rotor Realism And Mechanized Systems
- ring settings
- turnover
- explicit double-step logic

### Stage 8 — Message Structure And Composition
- symbol permutation
- symbol/message slicing
- compositional message structure

### Stage 9 — Advanced Arithmetic And Number Theory
- arithmetic expansion
- bounded number theory
- RSA-style foundational demos

This list is a suggested backbone, not a prison.
Future additions should fit somewhere on this spine rather than appearing as isolated content.

## Required Metadata

Every demo, tutorial, and challenge should gain sequencing metadata over time.

The minimum target model is:
- `stage`
- `order`
- `core`
- `recommendedAfter`

Where:
- `stage` places the item on the learning spine
- `order` gives the position within the stage
- `core` says whether the item is part of the main path or an optional side lab
- `recommendedAfter` names the earlier items that best prepare the learner

This metadata should support:
- sorting by suggested order
- showing `Recommended next`
- showing `Best after X`
- showing whether something is core or optional

## Sequencing Rules

Future content should follow these rules:

1. New items must be assigned to a stage.
2. New items must declare whether they are core or optional.
3. New items should prefer one clear dependency story.
4. Main-path items should build from concrete to abstract.
5. Optional items should not silently become prerequisites for later core content.

## UI Expectations

The first UI slice for this contract should be modest.

It does not need:
- a giant LMS layer
- hard prerequisites
- account-based course tracking

It should eventually provide:
- a visible **Suggested Path** grouping
- simple stage labels on demos/tutorials/challenges
- a lightweight **Recommended Next** hint
- optional/core labeling

## What To Avoid

Avoid:
- turning the workbench into a rigid classroom syllabus
- flattening everything into one huge alphabetical list
- letting side labs silently become required for the main path
- adding so much sequencing machinery that authoring new content becomes painful

## Success Criteria

This contract is successful when:
- a first-time user can tell where to begin
- the content library feels ordered rather than random
- future teaching additions have an obvious place in the progression
- advanced users can still jump freely without losing the suggested path
