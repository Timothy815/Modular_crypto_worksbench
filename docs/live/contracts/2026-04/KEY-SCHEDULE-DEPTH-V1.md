# Key Schedule Depth V1

## Status

Shipped in `v1.38.0`.

## Purpose

Deepen MCW's symmetric-construction language so it can express iterative key derivation where round key `N` depends visibly on round key `N-1`, not just on static windows cut from one master key.

This slice exists to solve the largest remaining expressiveness gap after `v1.37.0`:
- iterators are shipped
- explicit key-bus groundwork is shipped
- `BitWindow` is shipped
- `Key Schedule Workshop` proves a first two-round derivation pattern
- MCW still cannot teach a deeper recursive key schedule honestly without excessive manual wiring

The goal is not full AES key expansion.
The goal is to add one bounded, inspectable key-schedule depth slice that makes iterative round-key derivation teachable.

## Strategic Principle

**Round keys must remain visible signal flow, not hidden iterator mutation.**

That means:
- later round keys should be derived by ordinary graph structure
- students should be able to point to the exact transform that turns round key `N` into round key `N+1`
- the derivation path should stay compatible with Analyze, tutorials, and challenges
- no hidden executor-side param injection

## Why Now

MCW now has:
- reusable rounds
- bounded iterators
- explicit key-bus distribution
- one visible sub-key extraction primitive (`BitWindow`)
- one first-pass key-schedule demo
- enough builder ergonomics to manage larger teaching graphs comfortably

That means the next missing step is not more builder polish and not another asymmetric follow-on.
It is deeper symmetric-construction vocabulary.

## V1 Scope

V1 should stay bounded to **one explicit teaching surface where later round keys are derived from earlier round keys by visible graph logic**.

Primary user story:
- start from one master key
- derive round key 1 visibly
- derive round key 2 from round key 1 visibly
- inspect how each derivation step changes the key material
- see distinct round keys feeding distinct keyed rounds without hidden automation

## Included

- one bounded key-schedule demo workspace beyond the shipped two-round workshop
- one guided tutorial explaining recursive or chained round-key derivation
- one challenge that breaks one visible derivation step and asks the learner to repair it
- visible round-by-round key flow where a later key depends on an earlier derived key
- reuse of shipped primitives and shipped iterator/key-bus foundations wherever possible
- explicit compatibility with Analyze and challenge comparison surfaces
- learning-sequence placement after `Key Schedule Workshop` and before any future block-mode teaching

## Explicitly Excluded

Do not include in V1:
- hidden per-round key injection inside iterators
- a black-box `KeySchedule` primitive
- AES-specific key expansion as a special case
- automatic round-constant generation unless it is itself a visible module already present on the canvas
- full block mode / chaining semantics
- MAC, HMAC, or authenticated-encryption teaching
- generalized byte/word vocabulary expansion unless review proves a tiny helper is unavoidable

## Candidate Teaching Surface

### Demo Workspace
- **Recursive Key Schedule**
  - one master key source
  - visible derivation of round key 1
  - visible derivation of round key 2 from round key 1
  - visible derivation of round key 3 from round key 2
  - the expected shape is a flat visible key-schedule graph whose derived round keys are joined into one bus, feeding the shipped `KeyedByteRoundIterator` for the data path
  - final outputs showing that different derived keys materially change later rounds

### Tutorial
- **One Round Key Becomes The Next**
  - step 1: identify the master key
  - step 2: inspect the first derivation transform
  - step 3: inspect how the next round key depends on the prior one
  - step 4: compare how later rounds consume different keys

### Challenge
- **Repair the Next Round Key**
  - break one visible derivation transform, constant, or routing step
  - learner restores it so later-round output matches the reference machine again

## Core Rules

1. **The derivation path must stay explicit**
   - round key `N+1` must be visibly computed from prior material
   - no hidden executor mutation or secret param rewriting

2. **The first move stays bounded**
   - one demo
   - one tutorial
   - one challenge
   - no full cipher-suite expansion

3. **Existing groundwork should be honored**
   - build on shipped iterators, key buses, and `BitWindow`
   - do not replace those foundations with a black-box abstraction

4. **Schedule depth matters more than schedule realism**
   - V1 should prove recursive derivation honestly
   - it does not need to replicate a production key schedule exactly

## Success Criteria

V1 is successful if:
- MCW can teach a later round key depending visibly on an earlier derived round key
- learners can identify where each round key comes from
- different keyed rounds consume different visible sub-keys
- the slice reduces the current “manual wiring wall” for deeper symmetric-construction teaching
- the design prepares for later chaining or block-mode work without introducing hidden magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- block-to-block chaining or mode vocabulary
- bounded byte/word-oriented helpers if schedule depth proves they are needed
- stronger round-constant or schedule-helper vocabulary
- integrity/authentication teaching lines after chaining is expressive enough

## Explicitly Avoid Next

Do not turn this into:
- hidden iterator-aware key mutation
- a special-case AES authoring system
- full block-mode simulation in the same slice
- MAC/HMAC/authenticated-encryption in the same slice
- generic workflow automation disguised as cryptographic vocabulary

Keep the first move explicit, recursive, and inspectable.
