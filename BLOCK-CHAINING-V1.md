# Block Chaining V1

## Status

Shipped in `v1.39.0`.

## Purpose

Deepen MCW's framing and symmetric-construction language so it can express visible block-to-block dependence, not just one isolated framed block at a time.

This slice exists to solve the next strategic product gap after `v1.38.0` and now frames the local `v1.39.0` slice:
- block framing is shipped
- protocol-material sources are shipped
- iterators and keyed-round distribution are shipped
- recursive key-schedule depth is shipped
- MCW still cannot teach a simple chained multi-block construction honestly without falling back to prose or hidden mode assumptions

The goal is not to ship a full mode library.
The goal is to add one bounded, inspectable chaining teaching surface that proves MCW can represent "this block depends on the previous block" explicitly.

## Strategic Principle

**Block-to-block dependence must remain visible signal flow, not hidden mode behavior.**

That means:
- each block boundary should still be inspectable
- the chaining value should appear as an explicit signal on the canvas
- learners should be able to point to the exact connection that makes block 2 depend on block 1
- no monolithic mode preset should hide the structural lesson

## Why Now

MCW now has:
- `BitSplit`, `BitPad`, and `BitJoin`
- `IV`, `Nonce`, and `Salt`
- explicit keyed-round and iterator infrastructure
- recursive key-schedule depth for per-round key evolution
- enough builder ergonomics to support larger multi-block teaching graphs

That means the next honest step is not another builder slice and not authenticated encryption.
The next honest step is a bounded block-chaining vocabulary slice.

## V1 Scope

V1 should stay bounded to **one explicit chained multi-block teaching scenario where a later block depends visibly on earlier block output or state**.

Primary user story:
- start with a padded or fixed-width message split into visible blocks
- inspect an explicit IV or chaining seed
- watch the first block be mixed with the seed before processing
- watch the second block depend on the first block's processed output
- understand why changing the seed or first block changes later output

## Included

- one bounded block-chaining demo workspace
- one guided tutorial explaining visible chaining across at least two blocks
- one challenge that breaks one visible chaining edge, seed, or routing step and asks the learner to repair it
- reuse of shipped framing and protocol-material foundations wherever possible
- reuse of shipped transforms and keyed-round infrastructure wherever possible
- explicit compatibility with Analyze and challenge comparison surfaces
- learning-sequence placement after `Recursive Key Schedule` and before any future integrity/authentication teaching

## Explicitly Excluded

Do not include in V1:
- a monolithic `CBC`, `CTR`, `OFB`, or `GCM` module
- full block-mode family coverage in one slice
- hidden executor-side block scheduling or message-array semantics
- authenticated encryption, MAC, or HMAC teaching
- generalized byte/word helper expansion in the same slice
- feedback cycles in the graph
- automatic multi-block iteration magic beyond the visible teaching surface

## Candidate Teaching Surface

### Demo Workspace
- **Visible Block Chaining**
  - one message source padded or fixed to two visible blocks
  - one visible `IV` source as the initial chaining value
  - explicit split into block 1 and block 2
  - block 1 mixed with the IV before a bounded transform
  - block 2 mixed with block 1's processed output before the same bounded transform
  - final outputs showing that later-block behavior depends on earlier-block output
  - the expected shape is a flat visible two-block chaining graph, not a black-box mode wrapper and not a new message-list abstraction

### Tutorial
- **Why The Next Block Depends On The Last**
  - step 1: identify the visible block boundaries
  - step 2: identify the IV or initial chaining seed
  - step 3: inspect the first block's processing path
  - step 4: inspect how the second block consumes the first block's processed output
  - step 5: compare what changes when the seed or first block changes

### Challenge
- **Repair the Chaining Path**
  - break one visible seed, chaining edge, or block-routing step
  - learner restores it so the later block output matches the reference machine again

## Core Rules

1. **The chaining path must stay explicit**
   - later-block dependence must be visible on the graph
   - no hidden mode semantics in executor code or module params

2. **The first move stays bounded**
   - one scenario
   - one demo
   - one tutorial
   - one challenge
   - no full "modes of operation" package

3. **Existing groundwork should be honored**
   - build on shipped framing and protocol-material vocabulary
   - prefer ordinary visible transforms over new special-case modules
   - do not replace visible chaining with a preset mode node

4. **Teaching clarity matters more than mode completeness**
   - V1 should prove block-to-block dependence honestly
   - it does not need to cover every famous mode or production nuance

## Success Criteria

V1 is successful if:
- MCW can teach visible block-to-block dependence using shipped framing and protocol-material foundations
- learners can identify the seed value and the chaining edge that makes block 2 depend on block 1
- changing the first block or IV materially changes later-block output in an inspectable way
- the slice prepares for later integrity/authentication or broader mode follow-ons without introducing hidden magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- a second bounded chaining/mode scenario if the first one proves classroom value
- bounded byte/word-oriented helpers if chaining examples prove they are needed
- integrity/authentication teaching after chaining is comfortably expressible
- stronger protocol orchestration only if it stays visible and inspectable

## Explicitly Avoid Next

Do not turn this into:
- a preset block-mode library
- hidden feedback or message-scheduler machinery
- authenticated-encryption by stealth
- a generic "cipher orchestration" system
- a byte/word-expansion bundle disguised as a chaining slice

Keep the first move narrow, multi-block, and explicit.
