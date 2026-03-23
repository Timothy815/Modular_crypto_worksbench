# Modern Analysis V1

Last updated: March 23, 2026

## Purpose

This contract defines the first post-`v1.4.0` modern-analysis line for the Modular Cryptography Workbench.

The goal is to make modern cryptographic behavior visible in the same way the Vigenere workspace made classical cryptanalysis visible:
- graphs first
- intuition first
- statistics as support, not as the primary experience

This line should help students see diffusion, avalanche, and round-by-round spread in iterated bit-domain machines.

## Product Boundary

Modern analysis belongs in the dedicated `Cryptanalysis` workspace, not in `Compare`, except for lightweight summary metrics.

`Compare` remains appropriate for:
- quick baseline vs variant summaries
- compact scalar metrics
- small supporting previews

The `Cryptanalysis` workspace should own:
- full visual analysis surfaces
- interactive experiment controls
- graph-heavy exploratory workflows

## First Milestone

The first modern-analysis milestone is the **Avalanche Explorer**.

It should let a user:
- choose or provide a baseline bit-domain input
- flip one plaintext or key bit
- compare baseline and variant outputs visually
- see where changed bits appear
- understand how a small perturbation spreads

If round-level data is available, the same workflow should expose spread across intermediate rounds, not only final output.

## Include

The first milestone should include:
- baseline vs variant output comparison for bit outputs
- explicit one-bit flip controls
- changed-bit visualization as aligned strips, grids, or heatmaps
- simple summary metrics:
  - changed bit count
  - percent changed
- round-by-round diffusion visualization when the selected machine produces usable nested or ticked trace data

## Exclude

The first milestone should explicitly avoid:
- dense differential-cryptanalysis tables as the primary workflow
- linear-cryptanalysis tooling
- automated attack/search systems
- jargon-heavy math-first panels
- algorithm-specific solvers

Those may come later, but they are not the right first move.

## Visual Principles

The visual order of importance is:
1. difference shape
2. spread over time or rounds
3. compact supporting metrics

The student should be able to see:
- one changed bit becoming many
- whether diffusion is weak or strong
- which round causes major spread
- whether two constructions differ in avalanche quality

Prefer:
- heatmaps
- aligned bit strips
- per-round change bars
- compact visual comparisons

Avoid leading with:
- long numeric tables
- opaque scores without visible evidence

## Implementation Sequence

1. Add a modern-analysis contract and doc framing.
2. Extend the `Cryptanalysis` workspace with a modern-analysis section or mode.
3. Ship a bounded Avalanche Explorer:
   - baseline input
   - one-bit flip
   - output difference view
   - summary metrics
4. Add round-by-round diffusion views where the machine structure supports it.
5. Only after that, consider deeper modern analysis tools.

## Success Criteria

This line is successful when a student can:
- run a bit-domain machine
- flip one bit
- immediately see the output differences
- understand how diffusion changes across rounds
- compare two constructions visually without needing expert cryptanalysis vocabulary first
