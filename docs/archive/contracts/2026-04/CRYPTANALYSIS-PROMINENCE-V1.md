# CRYPTANALYSIS-PROMINENCE-V1

Status: Shipped on `main`.

Owner: Codex
Scope: UI / Navigation / Product Coherence

## Why

Cryptanalysis is now a meaningful MCW pillar:
- classical analysis workflow
- modern avalanche analysis
- verification-adjacent reasoning
- teaching surfaces already tied to cryptanalytic interpretation

But in the current shell it still reads as secondary.

Tutorial and Challenge appear as peer tabs in the learning dock.
Cryptanalysis does not.

Instead, cryptanalysis is reached through the broader workspace-mode model, which makes it feel more hidden than the actual importance of the feature justifies.

The result is a product-signaling mismatch:
- Tutorial and Challenge look first-class in the local learning/analysis area
- Cryptanalysis feels like a mode detour rather than a peer destination

## Goal

Raise cryptanalysis to equal local prominence with Tutorial and Challenge.

The learning/analysis area should make these three destinations feel like peer surfaces:
- Tutorial
- Challenge
- Cryptanalysis

This is a navigation and prominence refinement, not a cryptanalysis-feature expansion.

## Product Boundary

This slice should refine how users reach the existing cryptanalysis surface.

It should not:
- redesign the overall workspace-mode architecture
- remove the existing `Build / Guide / Cryptanalysis` shell concept unless implementation proves that simplification is a direct byproduct
- add a new cryptanalysis family
- add a new detached-window model
- merge cryptanalysis into tutorial/challenge content

Cryptanalysis should gain equal footing, not lose its identity.

## Required V1 Shape

1. The local learning/analysis navigation area must present `Tutorial`, `Challenge`, and `Cryptanalysis` as peer choices.
2. Cryptanalysis must no longer feel hidden behind tutorial-local controls.
3. The refinement must preserve the conceptual distinction:
   - tutorials teach by walkthrough
   - challenges teach by target solving
   - cryptanalysis teaches by evidence and analysis
4. The new navigation model must remain understandable on first use.
5. The refinement must stay bounded to navigation/presence, not become a full shell rewrite.

## Preferred V1 Direction

The likely best shape is:
- keep the existing top-level workspace model intact
- refine the local dock/navigation surface so `Tutorial`, `Challenge`, and `Cryptanalysis` appear as equal tabs or peer selectors
- when `Cryptanalysis` is selected there, render the existing cryptanalysis panel in the same local footing as the tutorial/challenge surfaces

This should make the three surfaces feel like siblings without requiring a new global architecture.

## UX Rules

- Cryptanalysis must be discoverable without requiring the user to infer that it lives behind a different mental model than Tutorial and Challenge.
- The selected state should be visually obvious.
- The navigation labels should be literal and unsurprising.
- The solution should reduce structural confusion, not add a second competing navigation model.

## Non-Goals

- No new cryptanalysis computations
- No cryptanalysis content rewrite
- No tutorial/challenge rewrite
- No new multi-window behavior
- No broad workspace-shell redesign

## Success Condition

This slice is successful if:
- users can find cryptanalysis as easily as tutorials and challenges
- cryptanalysis reads as a first-class analysis surface
- the local navigation feels more coherent
- MCW’s learning/analysis area better reflects the actual product importance of cryptanalysis

## Notes

This is a product-signaling fix.

The goal is not to make cryptanalysis bigger.
The goal is to stop making it look smaller than it is.
