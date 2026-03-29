# POLLUX-FRACTIONATION-V1

Status: Implemented

Owner: Codex
Scope: Classical Cryptanalysis / Historical Bridges / Encoding Experimentation

## Why

MCW already teaches explicit bridges between symbols and bits.

What it does not yet teach clearly is a classical fractionation idea:
- one underlying signal category can be represented by multiple surface symbols
- the representation layer itself can disguise frequency and make direct reading harder

That is the conceptual territory of Pollux-style encipherment and related homophonic fractionation ideas.

In MCW, the cleanest honest version of that idea is:
- a visible bit-domain fractionation primitive
- where `0` and `1` do not each map to one fixed output symbol
- but instead map into disjoint allowed symbol sets

This is valuable because it teaches an important distinction:
- concealment or statistical disguise is not the same thing as diffusion
- representation-level randomness is not the same thing as structural mixing

## Goal

Add a first bounded fractionation primitive that lets users encode a bitstream into a symbol stream using disjoint symbol sets for `0` and `1`.

The first milestone should make it possible to:
- define one allowed symbol set for zero bits
- define one allowed symbol set for one bits
- encode a bitstream into symbols using those sets
- study how the resulting output changes readability and frequency without overstating security claims

This slice should teach Pollux-style fractionation honestly, not pretend to deliver a modern diffusion primitive.

## Product Boundary

This slice belongs conceptually with the classical / historical-bridge line, even if the primitive consumes bits.

It should not be framed as:
- a modern block-cipher diffusion primitive
- a replacement for permutation/mixing rounds
- a generic random obfuscation framework
- a hidden stochastic black box

The right framing is:
- classical fractionation
- homophonic-style representation
- explicit bit-to-symbol disguise

## Required V1 Shape

1. The primitive must accept a `bits` input and emit a `symbol` output.
2. The primitive must expose:
   - one allowed output set for `0`
   - one allowed output set for `1`
3. The two sets must be non-empty and strictly disjoint.
4. The primitive must preserve bit order; it changes representation, not sequence structure.
5. The selection rule must be explicit.
6. V1 must emit exactly one output symbol per input bit, so an input width of `N` always yields a symbol string of length `N`.
7. The V1 selection rule must be deterministic round-robin within the current input word:
   - each encountered `0` advances only the zero-set cursor
   - each encountered `1` advances only the one-set cursor
   - both cursors start from a reproducible default at the start of each evaluation
8. V1 must not rely on hidden ambient randomness.
9. The primitive must make it clear which symbols correspond to zero-set vs one-set membership.
10. Engine-level validation must reject any configuration where the two sets overlap.
11. The teaching surface must explicitly distinguish:
   - fractionation / disguise
   - diffusion / mixing
12. The primitive must remain usable inside the existing trace / analysis / challenge workflows.

## Preferred V1 Direction

The likely best first shape is:
- a deterministic fractionation primitive
- with two editable symbol lists:
  - `zeroAlphabet`
  - `oneAlphabet`
- and a visible bounded selection rule that cycles within each set as matching bits are consumed

That keeps the first slice:
- reproducible
- exportable
- analyzable
- easy to explain

If later work wants explicit randomness, it should come as a follow-on with visible random-source inputs rather than hidden internal choice.

## Why Classical Rather Than Modern

Even though the primitive consumes bits, the teaching meaning is classical.

This feature primarily teaches:
- homophonic disguise
- fractionation
- frequency masking
- representation-layer concealment

It does not primarily teach:
- avalanche
- round diffusion
- nonlinear modern substitution structure

So the correct home is the classical / bridge teaching line, not the modern-round line.

## Teaching Rules

- The UI and docs must not imply that this primitive "improves diffusion."
- The product should state plainly that this is a representation/disguise technique.
- The transformation/analyze surface should make the zero-set and one-set membership visible.
- The comparison/cryptanalysis angle should be:
  - how the visible output distribution changes
  - how direct symbol interpretation becomes harder
  - what information still survives structurally

## Non-Goals

- No claim of strong modern security
- No hidden random-number generator in V1
- No generalized many-class fractionation language beyond the binary case
- No Morse-specific full teaching line in the first slice
- No full Pollux-machine preset in the first slice
- No automatic statistical scorer that declares the output "good"

## Success Condition

This slice is successful if:
- a user can feed bits into the primitive
- define disjoint symbol sets for zeros and ones
- see a resulting symbol stream that reflects those sets
- understand that the output is more disguised but not more diffused
- use MCW's existing analysis surfaces to study the difference between concealment and mixing

## Notes

This is best treated as a classical fractionation primitive implemented honestly in MCW's typed graph model.

The important conceptual message is:
- one bit value can map to many visible symbols
- that can flatten direct frequency clues
- but it is not the same thing as the structural spreading performed by modern diffusion layers
