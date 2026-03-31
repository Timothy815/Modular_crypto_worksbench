# BITSTREAM-RANDOMNESS-LAB-V1

## 1. Purpose

Add a bounded bitstream-analysis teaching surface that helps users inspect whether a visible output stream merely *looks noisy* or actually survives a small set of simple statistical checks.

This is not a claim of cryptographic security.
It is a "glass box" laboratory for:

- bit-balance inspection
- run-pattern inspection
- transition-pattern inspection
- short-period / repetition inspection
- comparing weak and less-weak visible generators built from existing MCW parts

The product goal is to help students answer:

- "Why does this stream look random at first glance?"
- "What simple evidence suggests it is still predictable or structurally weak?"
- "How do visible design choices change the stream without automatically making it secure?"

---

## 2. Product Position

This slice belongs to the existing PRNG teaching line.

It should reinforce the current manual claim:

- educational model
- not cryptographically secure

It should not introduce:

- a secure RNG badge
- a NIST STS clone
- a general-purpose statistics dashboard

The point is not to certify randomness.
The point is to make obvious weaknesses measurable and teachable.

---

## 3. V1 Design Principles

### 3.1 Workspace-first

V1 should build on the already-shipped PRNG workspaces:

- plain LFSR
- predictability lab
- gated keystream
- majority-clocked keystream
- filtered keystream
- routed-clock keystream

Do not add a new generator primitive for this slice.

### 3.2 Bounded tests only

V1 should include only a small number of interpretable checks.

Every metric must be explainable to a student in one short paragraph.

### 3.3 Visible evidence, not verdicts

The UI should present measurements and plain-language interpretation.

Do not reduce the entire result to one "random / not random" badge.

### 3.4 Bitstream-specific

This slice is for bit-domain output streams.

Do not try to unify it with classical letter-frequency analysis.

### 3.5 No security claims

All copy must stay explicit:

- passing these checks does not prove security
- failing these checks often reveals obvious weakness

---

## 4. Required V1 Shape

V1 must ship:

1. a bounded bitstream-analysis helper layer in the UI
2. a compact analysis view for bitstream-producing projects
3. support for reading the active bit-domain output stream from existing PRNG workspaces
4. a small set of deterministic metrics:
   - monobit balance
   - run-length summary
   - transition counts (`00`, `01`, `10`, `11`)
   - lag-1 autocorrelation summary
   - repeated-window hint
5. plain-language interpretation text for each metric
6. at least one comparison-ready seeded demo path that uses the current PRNG labs
7. one tutorial that explains how to read the metrics
8. one challenge that asks the user to identify a weak stream pattern
9. one manual entry for the new lab
10. a sink selector when the active workspace exposes more than one bit-domain output sink

---

## 5. Scope

### In Scope

- analyzing a visible output bitstream
- summarizing simple statistics for that bitstream
- explaining what those statistics suggest
- comparing existing PRNG teaching workspaces
- giving students a bounded "random-looking vs structurally weak" workflow

### Out of Scope

- no new CSPRNG primitive
- no secure RNG claim
- no NIST STS implementation
- no p-values or heavyweight formal test suite
- no entropy certification badge
- no arbitrary file import of external random datasets in V1

---

## 6. V1 Metrics

These should be the core V1 measurements.

### 6.1 Monobit Balance

Show:

- total number of `0` bits
- total number of `1` bits
- absolute imbalance
- percent split

Teaching point:

- a stream that is heavily biased is obviously weak
- a 50/50 split alone does not prove strength

### 6.2 Run-Length Summary

Show:

- longest run of `0`
- longest run of `1`
- counts of short runs grouped by length

Teaching point:

- extreme runs can reveal bias or structure
- ordinary-looking runs still do not imply security

### 6.3 Transition Counts

Show counts for:

- `00`
- `01`
- `10`
- `11`

Teaching point:

- some generators visibly favor holding or flipping
- transition imbalance can reveal structural dependence

### 6.4 Lag-1 Autocorrelation Summary

Show:

- how often adjacent bits are equal
- how often adjacent bits differ

Teaching point:

- strong local dependence can indicate a weak generator rhythm

### 6.5 Repeated-Window Hint

For a small fixed window size set:

- 4
- 8

Show:

- repeated windows that occur more than once
- or a short plain-language note that no repeated windows were found in the sampled stream

Teaching point:

- short repeated windows do not automatically prove a full period
- but they can reveal obvious cycling or structure

Implementation bound:

- V1 should scan exact repeated windows of length 4 and 8 only
- the repeated-window scan must cap the analyzed sample to the first 1024 bits

---

## 7. UI Shape

This should live inside the existing analysis/cryptanalysis world, not as a new shell.

Recommended shape:

- a third bounded `randomness` mode inside the existing Cryptanalysis panel

The UI must remain compact and readable.

The output should be:

- one target sink selector when needed
- one visible sampled bitstream
- a few metric cards
- one short interpretation sentence per card

No giant dashboard.

The UI should also:

- warn when the sampled stream is shorter than 64 bits
- recompute live on execution or tick changes
- prioritize the meaning of each metric over the metric name itself

---

## 8. Teaching Content

V1 should include:

### 8.1 One tutorial

Something like:

- `Reading A Keystream`

This tutorial should explicitly say:

- "balanced" does not mean "secure"
- "irregular" does not mean "hard to predict"
- a stream can pass one simple check and still fail others badly

### 8.2 One challenge

Something like:

- `Find The Weak Stream`

The challenge should require the student to inspect the randomness-lab output and identify a stream with an obvious weakness such as:

- strong bias
- repeated short window
- suspicious transition pattern

### 8.3 Manual support

The manual should explain:

- what the lab measures
- what it does not prove
- why this is useful in PRNG teaching

---

## 9. Good Seed Targets

V1 should build on the already-shipped PRNG workspaces rather than inventing new ones.

Recommended comparison set:

- `keystream`
- `gated-keystream`
- `majority-keystream`
- `filtered-keystream`

Optional:

- `routed-clock-keystream`

The point is to compare multiple visibly different constructions under the same bounded measurements.

---

## 10. Success Condition

This slice is successful if a student can:

1. open an existing PRNG workspace
2. inspect the output bitstream in the randomness lab
3. explain at least one measurable weakness or structural clue
4. explain why "looks noisy" is not enough

---

## 11. Non-Goals

- No claim that a generator is cryptographically secure
- No certification language
- No heavyweight formal randomness suite
- No new secure-random primitive
- No cloud dataset sharing in this slice

---

## 12. Final Product Framing

`BITSTREAM-RANDOMNESS-LAB-V1` makes MCW better at teaching the difference between visible complexity and actual unpredictability by giving existing keystream workspaces a bounded, interpretable bitstream-analysis surface.
