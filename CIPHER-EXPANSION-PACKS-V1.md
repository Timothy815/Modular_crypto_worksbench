# Cipher Expansion Packs V1

## Status

Unshipped. Proposed for implementation.

## Purpose

Provide importable prebuilt workspace bundles — "expansion packs" — that let students load a complete known cipher (or known-broken cipher) as a live workbench graph, then dissect, modify, and experiment with it. This is a different learning mode from construction: **dissection-first**, starting from a working machine and pulling threads rather than building up from primitives.

## The Gap

MCW's current teaching surface is entirely construction-driven: students add modules, wire connections, and observe behavior. This is powerful but leaves a real gap: students who want to understand *why* Enigma's reflector is a vulnerability, *how* RC4's byte-0 bias emerges, or *what* makes Trivium's feedback pattern stronger than a single LFSR have no way to start from a working reference machine and explore it interactively.

Expansion packs fill this gap by shipping curated workspace files that:
- represent a complete or representative cipher graph
- include a guided tutorial that walks the dissection path
- optionally include a challenge that asks the learner to break, repair, or compare something specific

## Strategic Principle

**Expansion packs are content, not new engine features.** The workspace JSON format is already the right primitive. A pack is a versioned bundle of workspace + tutorial + challenge that imports cleanly into the existing library system. No new signal types, no new execution semantics, no hidden modules are required.

The value is the *curation* — knowing which primitives to combine, in what order, with what tutorial framing, to make a cipher legible.

## Two-Tier Architecture

### Tier 1 — Buildable Now
Ciphers that can be faithfully represented using only existing MCW primitives. These can ship immediately.

### Tier 2 — Requires New Primitives First
Ciphers that need one or more new primitive families before an honest graph is possible. These should wait for the matching primitive slice to ship, then the expansion pack ships alongside it as its flagship teaching surface.

Tier 2 packs should be contracted separately alongside the primitive slices that enable them.

## V1 Scope

V1 ships **one Tier 1 expansion pack: Enigma**. Enigma is the strongest candidate because:
- every component (Rotor, RotorReverse, Reflector, Plugboard, Clock, Gate) is already shipped
- the MCW graph *is* the machine — no abstraction required
- the weaknesses (self-reciprocal reflector, no letter maps to itself, plugboard fixed points) are all surfaced by the existing Analyze tab
- the historical attack story (Bombe, cribs, no self-encryption) maps directly to observable graph properties

No other Tier 1 ciphers are required for V1. Additional packs should each be a follow-on slice.

## Included

- one importable Enigma workspace: **Enigma Machine**
  - three-rotor configuration with explicit stepping
  - plugboard and reflector wired to historical defaults
  - clearly labeled module IDs
  - clean layout with visible signal flow left-to-right
- one guided tutorial: **Why Enigma Could Be Broken**
  - step 1: trace the path from input letter through plugboard → rotor stack → reflector → return
  - step 2: observe that no letter ever encrypts to itself (self-reciprocal property)
  - step 3: change the plugboard and observe what changes and what does not
  - step 4: explain how the Bombe exploited this constraint using cribs
  - step 5: compare a maximum-fixed-point plugboard vs a zero-fixed-point plugboard in the Analyze tab
- one challenge: **Break the Crib**
  - a weakened Enigma configuration with an obvious fixed-point plugboard
  - learner identifies which plugboard pairs to correct so no letter maps to itself
- import flow: accessible from the workspace library panel — one button to add the pack to the local workspace list
- learning-sequence placement: after `Advanced Rotor Stepping` tutorial and before any future Lorenz or SZ42 follow-on

## Import Format

An expansion pack is a JSON bundle containing:
```
{
  "packId": string,
  "packVersion": string,
  "label": string,
  "description": string,
  "workspaces": WorkspaceExport[],   // one or more named workspaces
  "tutorials": TutorialDef[],        // matching tutorial steps
  "challenges": ChallengeDef[]       // matching challenges
}
```

The import action:
- adds each workspace to the user's local workspace list with a clear provenance label
- registers tutorials and challenges against the imported workspace IDs
- does not overwrite any existing workspace with the same name without confirmation

## Explicitly Excluded from V1

- RC4, AES, ChaCha20, Salsa20, Trivium, DES — these require new primitives or are Tier 2
- a cloud-hosted pack registry or remote download flow
- automatic pack updates or versioning sync
- pack sharing between users
- a general-purpose "module preset library" that replaces the existing module palette
- known-broken cipher challenges that require primitives not yet shipped (e.g. RC4 bias analysis)

## Tier 2 Candidates (Future Slices)

These should each be a separate contract paired with the primitive slice that enables them:

| Cipher | Blocking Primitive | Notes |
|---|---|---|
| DES (key schedule) | `BitSelect` | PC-1 / PC-2 steps require compression permutation |
| Trivium | `BitSelect` or richer LFSR cross-feedback | Three cross-coupled registers with non-contiguous taps |
| RC4 | Mutable array / swap state | Needs engine support for stateful array mutation |
| AES round | GF(2⁸) multiply | MixColumns requires field arithmetic not yet in engine |
| ChaCha20 quarter-round | 32-bit word rotation, addition mod 2³² | Needs explicit word-width arithmetic |

## Core Rules

1. **Packs are curated content, not engine extensions**
   - no new signal types, no new execution semantics
   - any cipher that cannot be expressed honestly with existing primitives must wait for those primitives

2. **Every pack teaches a specific cryptographic lesson**
   - the workspace is the vehicle, not the product
   - the tutorial should answer "what makes this cipher interesting, weak, or strong?"
   - the challenge should make the learner *do* something with the insight

3. **Honest representation over completeness**
   - a toy Enigma with correct structure is better than a claimed-complete Enigma with hidden magic
   - label simplified parameters clearly rather than silently approximating

4. **The import flow must be frictionless**
   - one action from the library panel
   - no manual JSON editing required
   - clear provenance so users know which workspaces came from packs vs their own work

## Success Criteria

V1 is successful if:
- a student can import the Enigma pack in one action and immediately explore a working Enigma graph
- the tutorial leads the student from observation to the insight that no letter maps to itself
- the Analyze tab's Plugboard and Reflector Properties sections surface the relevant metrics without any additional steps
- the challenge produces a correct understanding of the fixed-point weakness, not just a correct answer

## Likely Follow-Ons

- **DES Key Schedule** pack once `BitSelect` ships — PC-1, PC-2, and 16-round subkey derivation as a visible chain
- **Trivium** pack once cross-register LFSR feedback is expressible
- **Known-Broken RC4** pack once mutable array state is feasible — focusing on the byte-0 bias demonstration
- a lightweight pack-browser UI once three or more packs exist and the import-by-name flow becomes unwieldy

## Explicitly Avoid Next

Do not turn this into:
- a full cipher simulator that replaces the workbench with a preset-driven interface
- a remote pack store with automatic updates
- a claim that MCW "supports AES" or "supports ChaCha20" before the honest graph is possible
- a teaching shortcut that hides complexity the workbench should be making visible
