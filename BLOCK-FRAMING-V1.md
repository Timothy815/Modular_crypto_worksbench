# Block Framing V1

Last updated: March 24, 2026

Status: Implemented, pending checkpoint review for `v1.16.0`.

## Purpose

This contract defines the first bounded framing milestone for MCW.

The goal is not to add cipher modes or message protocols in one jump.
The goal is to give MCW an honest visible vocabulary for block boundaries.

This slice should establish that MCW can represent:
- fixed-size block splitting
- explicit block rejoining
- visible padding to a target width

This is the missing vocabulary needed for:
- multi-block constructions
- later protocol-material modules such as IV and nonce inputs
- honest mode-building from visible parts instead of preset black boxes

## Architectural Decision

For the first framing milestone, block framing should stay on the existing `bits` signal domain.

That means:
- no new message-list or block-array signal type
- no multi-output module shape
- no executor changes for per-block emission

Instead, the first framing slice should work statelessly on one visible bit vector at a time.

The first milestone should prefer:
- splitting one fixed-width bit vector into a small fixed set of visible sub-block outputs
- rejoining those sub-blocks back into one visible bit vector
- padding one bit vector up to a target width

This slice should explicitly defer:
- true message-stream chunk emission
- per-block ticked iteration
- variable block counts inside one module instance
- unpadding rules that require richer message metadata

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- framing should appear as ordinary visible graph modules
- students should be able to wire blocks into existing rounds manually

2. **Analyze**
- split and join behavior should remain inspectable like existing transforms
- students should be able to see which bits went into which sub-block

3. **Guide / Challenge**
- at least one tutorial and one bounded exercise should teach why framing matters before protocol material arrives

This slice should not become:
- a hidden message scheduler
- a preset block-cipher mode library
- a generic list-processing system

## First Milestone

The first milestone should answer one question clearly:

**Can a student visibly split one bit message into fixed-size blocks, process those blocks, and rejoin them without hidden framing logic?**

The student should be able to:
- take a single visible bit vector
- split it into two explicit sub-blocks
- send those blocks through existing modules
- rejoin them into one visible output
- optionally pad a short input up to a required width

## Include

The first milestone should likely include a bounded set such as:
- `BitSplit`
- reuse of existing `BitJoin`
- one explicit padding primitive such as `BitPad`

Preference:
- start with the smallest honest split shape
- likely two outputs for the first split primitive:
  - `left`
  - `right`
- make widths explicit and inspectable

The first proof targets should likely include:
- a 16-bit input split into two 8-bit halves
- two visible block-local transforms
- a rejoined 16-bit output

## Exclude

This milestone should explicitly avoid:
- CBC / CTR / OFB preset modules
- block-mode chaining helpers
- variable-output chunkers
- tick-driven one-block-per-tick emission
- automatic iterator integration in the same slice
- protocol-material primitives in the same slice
- full unpadding semantics

## Visual / Teaching Principles

Prefer:
- framing that reads as visible structure, not hidden machinery
- explicit labels for block size and left/right halves
- simple first examples using fixed-width byte halves

Avoid:
- making framing depend on hidden metadata
- teaching padding and protocol state in the same first pass
- pretending that one long bit vector has implicit block structure without a framing module

## Suggested Teaching Additions

The first milestone should likely ship with:
- one tutorial on visible block boundaries
- one demo workspace such as:
  - `HexSource -> BitSplit -> two visible transforms -> BitJoin -> BitsToHex -> Output`
- one bounded challenge repairing either the split width or a padding parameter

## Success Criteria

This slice is successful when a student can:
- explain where one block ends and the next begins
- split one bit message into visible halves
- process those halves independently
- rejoin them into one output
- understand why protocol material and block modes should follow framing rather than precede it
