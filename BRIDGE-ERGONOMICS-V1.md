# Bridge Ergonomics V1

## Status

Proposed as the next bounded bridge/usability follow-on after `v1.30.0`.

## Purpose

Make raw bit entry and byte-oriented bridge workflows easier to author correctly.

This slice exists because MCW's current bridge layer is functionally capable but still too clunky for fast experimentation:
- entering arbitrary raw bit strings is awkward
- users should not have to hand-group bits into bytes before decoding
- the difference between reversible byte bridges and lossy alphabet bridges is not visible enough

The goal is not to redesign every encoding path at once.
The goal is to make the existing bit/ASCII/hex bridge layer feel intentional and trustworthy.

## Why Now

MCW now has:
- explicit symbol, bits, hex, ASCII, and Baudot bridges
- stronger permutation authoring and decrypt-path tooling
- more users building toy encrypt/decrypt machines that expose bridge rough edges quickly

The next friction point is not a missing cipher primitive.
It is the ergonomics of getting data into and out of the bit domain without unnecessary manual formatting.

## V1 Scope

V1 should stay bounded to:
- better manual raw-bit entry
- clearer byte-oriented decoding expectations
- clearer reversibility boundaries across bridge modules
- one small convenience bridge where it removes unnecessary byte-routing friction

The first implementation target should be:
- improved `BitSource` input ergonomics for arbitrary-width bit strings
- direct `HexToAscii` convenience for readable byte-text inspection

That includes:
- accepting continuous bit strings such as `0100000101000010`
- accepting spaced bit strings such as `01000001 01000010`
- preserving normalized storage as one raw bit vector
- showing grouped preview where helpful without requiring grouped input

## Core Rules

1. **Input should be permissive; decoding should stay strict**
   - users may type continuous or spaced bit strings
   - downstream decoders still enforce their own width rules
   - example: `BitsToAscii` still requires total width divisible by `8`

2. **Grouping is a presentation concern, not a typing burden**
   - byte grouping should be previewed visually
   - users should not be forced to hand-insert separators just to satisfy the UI

3. **Reversible and lossy bridges must be distinguishable**
   - ASCII byte bridges should be described as byte-oriented and reversible when widths are valid
   - alphabet-symbol bridges should be described honestly when they collapse a larger bit space into a smaller symbol set

4. **Do not over-solve text encoding in V1**
   - ASCII is the right first byte-text bridge to tighten
   - UTF-8 may become a later bounded follow-on, but not in this first ergonomics slice

## Included

- one bounded `BitSource` ergonomics pass for arbitrary-width binary input
- one bounded `HexToAscii` bridge convenience
- grouped preview and normalization behavior where it improves authoring clarity
- bridge copy/help text improvements for byte-group expectations and reversibility boundaries
- at least one regression test covering permissive raw-bit input parsing

## Excluded

Do not include in V1:
- a generic UTF family rollout
- automatic re-packing of arbitrary bit streams into multiple semantic encodings
- universal “decode anything” bridge behavior
- hidden padding or truncation to force invalid widths into ASCII
- a full bridge-library redesign
- new teleprinter/baudot state machinery

## First Implementation Target

The first slice should make this feel natural:

```text
BitSource("0100000101000010") -> BitsToAscii -> Output
```

And equally natural:

```text
BitSource("01000001 01000010") -> BitsToAscii -> Output
```

Both should decode as the same underlying bit vector.

## Success Criteria

V1 is successful if:
- users can paste arbitrary-width binary text into `BitSource` without hand-formatting pain
- `BitsToAscii` workflows feel byte-aware instead of brittle
- bridge modules communicate clearly when a path is reversible vs. representationally lossy
- no new hidden coercion or auto-fixing behavior is introduced

## Follow-Ons

Possible later slices, only if still justified:
- UTF-8-specific byte/text bridge support
- stronger raw-bit input/output authoring helpers beyond `BitSource`
- clearer reversible-codeword bridges for full 5-bit spaces
