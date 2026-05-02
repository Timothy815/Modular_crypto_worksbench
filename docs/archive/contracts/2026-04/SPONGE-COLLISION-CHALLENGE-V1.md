# Sponge Collision Challenge V1

Last updated: March 23, 2026

Status: Shipped as the `v1.9.0` sponge-collision follow-on milestone.

## Purpose

This contract defines the second bounded hash-collision challenge slice for the Modular Cryptography Workbench.

The goal is to extend the collision lesson from the simpler compression hash to a more structurally interesting sponge-style teaching hash.

This slice should teach:
- collisions are still inevitable in tiny digest spaces even when the internal structure is richer
- absorb/mix/squeeze structure changes how the machine behaves, but it does not remove finite-state overlap
- finding a collision in a sponge should feel harder and more exploratory than in the compression hash

This should remain a laboratory exercise, not a formal collision-analysis system.

## Product Boundary

This slice should reuse the exact same major surfaces as the first collision challenge:

1. **Build**
- the student can inspect the sponge construction directly
- the machine remains explicit and visible

2. **Guide / Challenge**
- one seeded challenge
- one clear success definition
- challenge wording that explains what differs from the compression case

3. **Cryptanalysis / Analyze**
- optional nudges toward Avalanche Explorer and transformation views
- no new analysis subsystem

This should not become:
- a generalized collision-search framework
- an automated sponge search tool
- a probability or birthday-bound calculator

## First Challenge

The first sponge collision challenge should be something like:

**Find A Sponge Collision**

Given:
- the `Toy Sponge Hash`
- a seeded target input
- its digest

The student succeeds when:
- they produce a different 2-byte input
- that produces the same final digest

The challenge should make it explicit that:
- the input must change
- the digest must stay the same
- this is expected to feel harder than the compression-hash challenge

## Include

The first sponge collision challenge should include:
- one seeded challenge based on `Toy Sponge Hash`
- the same bounded success rule already proven by the first collision challenge
- challenge copy that distinguishes sponge collision hunting from compression collision hunting
- hints that push the student toward structural reasoning, not blind clicking alone

## Exclude

This slice should explicitly avoid:
- automatic collision search
- exposing internal sponge state as a new challenge-only surface
- second-system challenge logic
- probability dashboards or security-score framing
- comparisons to SHA-3 or real sponge constructions

## Visual / Teaching Principles

The student should be able to leave with this intuition:
- “A richer internal structure changes how collisions emerge, but a tiny digest still guarantees overlap.”

Prefer:
- challenge wording that contrasts sponge vs compression
- hints that encourage checking absorb/mix/squeeze structure in Analyze
- letting the student feel the extra search difficulty without making the task opaque

Avoid:
- implying that the sponge is “secure” because it feels more complex
- turning the challenge into random guessing with no interpretive guidance

## Success Criteria

This slice is successful when a student can:
- find a second input with the same digest on the toy sponge
- recognize that the task feels harder than the compression-hash collision
- leave with a stronger intuition that internal structure and digest size are different questions
