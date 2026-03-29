# POLLUX-INVERSE-V1

Status: Implemented

Owner: Codex
Scope: Classical Cryptanalysis / Historical Bridges / Pollux Round-Trip

## Why

`PolluxFractionation` currently teaches the forward direction of Pollux-style disguise:
- `bits -> symbol`
- one visible symbol per source bit
- disjoint symbol sets for `0` and `1`

That is useful as a fractionation teaching primitive, but incomplete as a working historical bridge.

If MCW wants Pollux to function as more than a one-way disguise demonstration, it also needs the inverse direction:
- take a symbol stream that was encoded with known Pollux alphabets
- recover the original bit stream explicitly

This matters because it unlocks:
- round-trip Pollux labs
- visible encode/decode workflows
- classroom exercises based on recovery, not just disguise
- cleaner challenges and historical comparison work

## Goal

Add a bounded inverse Pollux primitive that decodes a symbol stream back into bits using the same disjoint `zeroAlphabet` and `oneAlphabet` sets used by the forward fractionation primitive.

The first milestone should make it possible to:
- feed a Pollux-style symbol stream into the graph
- configure the known zero and one symbol sets
- recover the original bit stream in order
- round-trip a visible Pollux encode/decode path inside MCW

## Product Boundary

This slice is:
- classical
- explicit
- deterministic
- reversible

It is not:
- a probabilistic decoder
- a fuzzy classifier
- a modern security primitive
- a hidden lookup service

The right framing is:
- inverse fractionation
- visible Pollux recovery
- honest symbol-to-bit decoding with known alphabets

## Required V1 Shape

1. The primitive must accept a `symbol` input and emit a `bits` output.
2. The primitive must expose:
   - `zeroAlphabet`
   - `oneAlphabet`
3. The two alphabets must be non-empty and strictly disjoint.
4. The primitive must preserve symbol order; it changes representation, not sequence structure.
5. V1 must emit exactly one output bit per input symbol, so an input symbol string of length `N` yields a bit output width of `N`.
6. Engine-level validation must reject any configuration where the two alphabets overlap.
7. Runtime evaluation must fail clearly if an input symbol appears in neither alphabet.
8. Runtime evaluation must not silently coerce unknown symbols into either set.
9. The teaching surface must make it clear that decoding depends entirely on known set membership.
10. The primitive must remain usable inside existing trace, compare, verification, and Python export workflows.
11. V1 should round-trip cleanly with the shipped forward `PolluxFractionation` primitive when both use the same alphabets.
12. Runtime evaluation must fail atomically if an input symbol is found in neither alphabet, so decode never silently shortens or drifts the bitstream.
13. Decode must use the same uppercase normalization rule as forward Pollux before checking alphabet membership.
14. The inverse primitive should share alphabet parsing and disjointness logic with the forward Pollux implementation rather than duplicating independent parsing rules.

## Preferred V1 Direction

The likely best first shape is:
- `PolluxInverse` or `InversePolluxFractionation`
- two editable symbol-list params matching the forward primitive
- direct membership-based decoding:
  - symbol in zero set => output bit `0`
  - symbol in one set => output bit `1`

That keeps the slice:
- symmetric with the forward primitive
- easy to teach
- easy to export
- easy to verify

## Teaching Rules

- The UI and docs must state plainly that Pollux decode is only as good as the known alphabets.
- The product must not imply that Pollux recovery is “breaking” a secure system; it is decoding with the agreed representation sets.
- The product must make it clear that inverse Pollux decodes by set membership only; symbol order within each alphabet is irrelevant to recovery.
- The analysis angle should emphasize:
  - visible membership sets
  - reversible disguise
  - the difference between representation concealment and structural secrecy

## Non-Goals

- No probabilistic or frequency-based Pollux cracking workflow in V1
- No support for overlapping or weighted alphabets
- No hidden fallback for unknown symbols
- No generalized many-class inverse fractionation beyond the binary case
- No claim that Pollux round-tripping is a modern secure channel

## Success Condition

This slice is successful if:
- a user can encode bits into Pollux symbols with the forward primitive
- decode those symbols back into the original bit sequence with the inverse primitive
- see the round-trip explicitly in the graph
- build `BitSource -> PolluxFractionation -> PolluxInverse -> Equals` and observe a clean round-trip
- and understand that the disguise layer is reversible once the two symbol sets are known

## Notes

This should come before any controlled-selection or selector-driven Pollux follow-on.

The more important next step is round-trip usability:
- forward disguise
- inverse recovery
- explicit encode/decode comparison

Only after that should MCW consider a later follow-on for externally controlled symbol selection within the Pollux alphabets.
