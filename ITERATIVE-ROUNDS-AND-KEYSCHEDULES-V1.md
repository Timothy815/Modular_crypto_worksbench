# MCW — Iterative Rounds & Key Schedules V1 Contract

**Status:** Draft for implementation
**Date:** March 22, 2026
**Purpose:** Define the smallest honest iteration milestone after reusable round composites.

---

## 1. Goal

MCW can now express:
- a single byte-oriented round
- stacked repeated rounds on the canvas
- bounded packaged round chains as reusable composites

The next milestone is not "add loops everywhere." The next milestone is:

- make repeated round structure a first-class concept
- preserve explicit graph logic and inspectability
- prepare for future key-schedule work without hiding it inside a black box

This contract exists to prevent iteration support from turning into a magic execution mode.

---

## 2. Non-Negotiable Principles

### 2.1 No Hidden Cipher Loops

MCW must not gain a generic invisible `for` loop that swallows round behavior.

If a machine executes multiple rounds, students must still be able to answer:
- what is being repeated
- how many times it repeats
- what enters and exits each round

### 2.2 Reuse Before Automation

The first iteration milestone must build on reusable composites, not skip past them.

That means the canonical foundation is:
- one reusable round definition
- explicit repeated use of that definition
- only then a bounded abstraction on top

### 2.3 Engine Purity Holds

The engine remains:
- deterministic
- synchronous
- free of UI dependencies
- explicit about signal typing

Iteration support must not require hidden mutable runtime state beyond what the executor already supports.

### 2.4 Bounded, Linear, Inspectable

The first iteration abstraction must be:
- bounded by an explicit count
- linear feed-forward only
- built from a single reusable round definition
- compatible with trace/analysis/challenge surfaces

No branching, feedback, or dynamic control flow in V1.

---

## 3. Product Definition

The first iteration milestone should let a student or teacher:

1. define or choose one reusable round
2. apply it multiple times in sequence
3. inspect the multi-round structure honestly
4. compare repeated-round behavior against a hand-stacked equivalent

The target outcome is not a full AES authoring studio yet.

The target outcome is:
- a trustworthy repeated-round abstraction
- clear educational value
- a clean bridge toward future key schedules

---

## 4. Current Proven Baseline

The codebase already proves two important preconditions:

1. **Reusable round composite**
   - `ByteRoundComposite`

2. **Bounded packaged iteration by composition**
   - `IteratedByteRoundsComposite`
   - stacked-round and packaged-round demo/tutorial paths

These are the baseline artifacts the next branch must preserve.

They show that iteration is already possible by explicit composition.
The next milestone is about formalizing and extending that pattern carefully.

---

## 5. Required V1 Iteration Capabilities

### 5.1 One Repeated Unit

The first iteration abstraction may only repeat:
- one composite definition
- with one primary input path and one primary output path

This keeps the mental model simple:

```text
in -> round -> round -> round -> out
```

### 5.2 Explicit Iteration Count

The number of rounds must be explicit and visible.

Examples:
- `2`
- `4`
- `8`

The count must not be inferred from hidden engine state or external data.

### 5.3 Linear Feed-Forward Semantics

The repeated structure must behave like:

```text
round_0(input) -> round_1 -> round_2 -> ... -> round_n(output)
```

V1 does **not** include:
- conditional branches between rounds
- feedback loops
- round skipping
- data-dependent routing

### 5.4 Honest Analysis Surface

Even if the repeated structure is packaged, the system must retain a clear way to inspect:
- round count
- repeated definition identity
- final output

Future slices may add explicit per-round trace visualization, but V1 must not make repeated rounds opaque by design.

### 5.5 Challenge Compatibility

Repeated-round machines must still work with:
- compare
- guided challenges
- tutorials

If an iteration abstraction cannot survive challenge evaluation and divergence reporting, it is too magical for V1.

---

## 6. Key Schedule Boundary

Key schedules are strategically important, but they are **not** part of the first iteration primitive itself.

V1 should prepare for key schedules by keeping the repeated-round contract compatible with future sub-key injection.

But V1 does **not** yet require:
- one sub-key per round
- round-param forwarding
- dynamic internal parameter injection
- full AES/DES key expansion logic

The correct V1 stance is:
- repeated rounds first
- explicit key-schedule support later

---

## 7. Allowed V1 Shapes

The following are acceptable first implementations:

### Option A — Packaged Iterated Composite

A bounded composite whose internals explicitly contain:
- round 1
- round 2
- round 3
- ...

Pros:
- maximally honest
- already consistent with current composite execution
- low engine risk

Cons:
- not yet a true reusable iterator primitive

### Option B — Constrained Iterator Definition

A new definition kind or primitive that:
- references one reusable round definition
- stores an explicit count
- expands or evaluates as a linear repeated chain

Pros:
- more direct iteration abstraction

Cons:
- higher architectural risk
- requires stronger trace and validation guarantees

For V1, **Option A is the safer proof path** and should remain the baseline even if Option B is explored.

---

## 8. Explicit Non-Goals

This milestone does **not** include:
- arbitrary loop constructs
- user-authored branching control flow
- feedback/cycle semantics
- round-local mutable hidden state beyond existing module semantics
- fully general key schedule injection
- automatic AES/DES generation

If a proposal needs those, it belongs to a later milestone.

---

## 9. Recommended Implementation Order

1. Lock this contract
2. Preserve the current reusable-round and packaged-round groundwork
3. Decide whether the next proof step is:
   - stronger packaged iteration support
   - or a constrained iterator definition
4. Add one equivalence proof:
   - packaged repeated rounds
   - vs hand-stacked repeated rounds
5. Only after that, discuss sub-key scheduling

---

## 10. Definition of Done

The first iteration milestone is done when:

- repeated rounds are a clear first-class concept in-product
- the abstraction stays bounded and linear
- students can still inspect what is being repeated
- challenge/tutorial flows remain coherent
- the design clearly prepares, but does not overclaim, future key-schedule support

If the result hides too much or behaves unlike the explicit stacked graph, it is not done.
