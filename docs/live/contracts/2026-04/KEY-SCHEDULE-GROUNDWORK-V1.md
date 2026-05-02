# MCW — Key Schedule Groundwork V1

**Status:** Draft for implementation
**Date:** March 22, 2026
**Purpose:** Define the smallest honest sub-key injection milestone after bounded iteration and nested analysis.

---

## 1. Goal

MCW can now express:
- reusable rounds
- bounded iterators
- nested analysis for repeated rounds

The next milestone is not "make iterators mutate hidden round params."
The next milestone is:

- make round-by-round sub-key flow explicit
- keep key material visible on the canvas
- prove that repeated-round ciphers can consume different keys without magic

---

## 2. Non-Negotiable Principles

### 2.1 No Hidden Per-Round Mutation

V1 key-schedule groundwork must not inject different round keys into an iterator through invisible executor behavior.

If round 2 uses a different key than round 1, students must still be able to answer:
- where each key comes from
- which round receives it
- what signal is mixed into the round

### 2.2 Round Key Flow Must Be Signal Flow

The first key-schedule slice treats sub-keys as ordinary signals.

That means the safe baseline is:

```text
data -> round(in)
key  -> round(key)
```

not:

```text
iterator secretly injects params for each internal round
```

### 2.3 Reuse Before Scheduling Automation

The first key-schedule slice should build on:
- reusable keyed round composites
- explicit stacked rounds on the canvas

Only after that proof exists should MCW discuss automated per-round key distribution.

### 2.4 Inspectability Still Wins

Any key-schedule step must remain compatible with:
- Analyze
- trace/probe surfaces
- challenges
- tutorials

If adding round keys makes the machine less inspectable than the unkeyed version, the design is wrong.

---

## 3. Product Definition

The first key-schedule milestone should let a student or teacher:

1. choose or build a keyed round
2. feed different visible sub-keys into different rounds
3. compare how changing one round key alters the final result
4. treat key scheduling as architecture, not hidden metadata

The target outcome is not a full AES key expansion studio yet.

The target outcome is:
- explicit sub-key injection
- clean educational value
- a stable bridge toward future iterator-aware key schedules

---

## 4. Required V1 Capabilities

### 4.1 Keyed Round Composite

At least one reusable round definition should expose:
- one primary data input
- one explicit key input
- one primary output

Example:

```text
in(bits) + key(bits) -> keyed round -> out(bits)
```

### 4.2 Visible Round-By-Round Keys

The first key-schedule proof must show at least two rounds that consume different sub-keys explicitly.

This should be readable directly from the canvas.

### 4.3 Challenge/Tutorial Compatibility

Keyed repeated-round machines must still work with:
- guided tutorials
- compare
- guided challenges

### 4.4 No Iterator Magic Yet

The first key-schedule slice does **not** require:
- iterator-level per-round key arrays
- hidden key distribution
- internal round param mutation
- automatic key expansion

That belongs to a later milestone.

---

## 5. Recommended Implementation Order

1. Add one reusable keyed round composite
2. Add one explicit stacked-round demo using different visible sub-keys
3. Add one tutorial
4. Add one challenge
5. Only after this proof, discuss iterator-aware key distribution

---

## 6. Definition Of Done

The first key-schedule groundwork milestone is done when:

- keyed rounds exist as reusable graph artifacts
- different sub-keys can be seen feeding different rounds
- challenge/tutorial flows remain coherent
- the design clearly prepares, but does not overclaim, future iterator-aware key scheduling

If the result depends on hidden per-round mutation, it is not done.
