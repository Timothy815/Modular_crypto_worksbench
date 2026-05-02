# Hash Collision Challenge V1

Last updated: March 23, 2026

Status: Shipped as the `v1.8.0` bounded hash challenge milestone.

## Purpose

This contract defines the first post-`v1.7.0` hashing challenge slice for the Modular Cryptography Workbench.

The goal is not to turn hashing into formal collision analysis. The goal is to make one concrete truth teachable:
- tiny digest spaces collide
- collisions are easier to find in small teaching hashes than in real cryptographic hashes
- a hash can feel structurally strong and still live in a state space that guarantees overlap

This should feel like a laboratory exercise, not a proof-heavy theorem lesson.

## Product Boundary

This slice should connect three existing MCW surfaces:

1. **Build**
- the student should be able to inspect the toy hash construction being challenged
- the machine should remain explicit and visible

2. **Guide / Challenge**
- the student should receive a clear challenge prompt
- the challenge should explain what success means in plain language
- the challenge should preserve the student’s editable workbench state

3. **Cryptanalysis**
- the student should be able to compare two different inputs that land on the same digest
- the challenge may point them toward Avalanche Explorer or Analyze, but it should not require a new analysis system

This challenge should not begin as:
- a generic brute-force engine
- a collision-search framework for arbitrary hash families
- a statistical birthday-bound calculator

## First Challenge

The first challenge should be something like:

**Find A Collision**

Given:
- a small starter toy hash project
- a target input
- its digest

The student succeeds when:
- they produce a different 2-byte input
- that produces the same final digest

The challenge should make it explicit that:
- the second message must be different from the original
- matching the digest is the success condition

## Include

The first collision challenge should include:
- one seeded challenge built on an existing toy hash artifact
- one clear target message and target digest
- one simple success condition based on output equality plus input inequality
- challenge copy that explains why this is possible in a tiny digest space

The strongest first target is likely:
- `Toy Compression Hash`

Reason:
- it is already familiar
- it has a tiny fixed digest
- it is structurally simpler than the sponge for a first challenge

## Exclude

This first challenge should explicitly avoid:
- collision probability formulas as the main teaching surface
- generic search tooling for arbitrary user graphs
- real-hash branding or SHA comparisons
- Merkle trees, HMAC, KDF, password hashing, or signature workflows
- turning challenge mode into a separate execution model

## Visual / Teaching Principles

The student should be able to leave with this intuition:
- “A tiny digest means many different messages must eventually overlap.”

Prefer:
- clear target digest display
- side-by-side original vs candidate message comparison
- explicit statement that the two inputs differ
- optional nudges toward Analyze / Avalanche Explorer for interpretation

Avoid:
- making the challenge feel like blind guessing
- implying that a collision means the construction has no educational value
- leading with formal notation

## Challenge Shape

Expected workflow shape:
1. open the seeded challenge
2. inspect the target message and target digest
3. alter the message inputs
4. run/evaluate the current machine
5. see whether the new message collides with the target digest
6. optionally inspect why the digest matched despite different inputs

The challenge logic should remain in the existing guided-challenge/workbench layer.

## Success Criteria

This slice is successful when a student can:
- understand what a collision means in plain language
- find a second message with the same digest in a tiny teaching hash
- see clearly that the two inputs are different
- leave with a concrete intuition for why small digest spaces guarantee overlap
