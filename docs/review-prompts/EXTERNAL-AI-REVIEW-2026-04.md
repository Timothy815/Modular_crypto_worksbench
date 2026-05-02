# External AI Review Prompt — April 2026
## For: Codex / Gemini
## Topic: Recent Product Work + Cipher Expansion Packs

---

## Context: What This Project Is

**Modular Cryptography Workbench (MCW)** is a visual, composable cryptographic construction environment built for a cybersecurity teacher's classroom. The mental model is a modular synthesizer for cryptography: students add modules to a canvas, wire them together, and watch data flow through transformations in real time.

The core engine is a typed signal-processing DAG:
- Signals are either `symbol` (text domain) or `bits` (binary domain)
- Every transformation is a visible module — no implicit conversion, no hidden logic
- Composite modules (iterators, round functions) are first-class and behave identically to primitives
- Execution is deterministic: topological sort, synchronous, one evaluation per run

The user-facing surface has three primary modes:
1. **Build** — add modules, wire connections, run, observe output
2. **Guide** — tutorial steps that walk a student through a pre-built workspace
3. **Challenge** — a broken workspace the student must repair to match a target output

The project is live at a GitHub Pages URL and is used in classroom settings. The teacher audience ranges from students new to cryptography to students studying for CompTIA Security+ / CySA+.

---

## What Has Recently Shipped

The following slices landed in the last several commits. Each is described at the level of what it added and why.

---

### 1. Cryptographic Analysis Expansions for the Analyze Tab

**What:** Added structured property analysis panels for four module families that previously had no visual analysis beyond basic signal display:

- **LFSR** — now surfaces degree, theoretical max period, actual period, whether the polynomial is primitive, and an all-zeros seed warning
- **Plugboard** — now surfaces active pair count, fixed-point count, wired positions, and lists active pairs visually
- **Reflector** — now surfaces whether the wiring is a valid involution, lists all pairs, flags any self-mapping violations
- **Modulus** — now surfaces whether the modulus is prime, the group order (φ(n)), and small factor warnings that indicate weak keys

Each analysis panel also includes a **consequence section**: a short plain-English explanation of what the property means for security. For example: "A plugboard with many fixed points is weaker because it leaves more letters unmapped — fewer swaps means less confusion for an attacker trying brute-force cribs."

**Why it was added:** The Analyze tab already had deep analysis for S-boxes (differential characteristics, linearity) and Permutations (fixed points, cycle structure). The four new families were inconsistent gaps — the modules existed but had no teaching surface beyond raw signal display.

---

### 2. S-Box and Permutation Cryptographic Analysis

**What:** Earlier slice (now shipped) added the first advanced analysis views:

- **S-Box** — differential characteristic table, linearity spectrum, fixed points, branch number
- **Permutation** — cycle structure, fixed point count, order of the permutation

These are the foundational analysis tools that the LFSR/Plugboard/Reflector/Modulus additions above build on stylistically.

---

### 3. BitSelect — Compression Permutation Primitive

**What:** A new `bits`-domain primitive that takes n input bits and emits m < n output bits in a specified order, permanently dropping the rest.

- `order` param: comma-separated zero-based input indices, no duplicates allowed
- `inputWidth` optional hint param: tells the editor how many dots to render before a live connection arrives
- Output width is always derived from `order.length` — no separate output-width param
- Static validation rejects out-of-range indices and duplicate indices
- Analyze transformation view shows a routing wire diagram with explicit gaps for dropped positions

**Teaching context:** This is how DES PC-1 works — a 64-bit key drops 8 parity bits and reorders the remaining 56 bits. The module makes that selection step explicit, visible, and auditable rather than hiding it inside a black-box cipher definition.

---

### 4. BitExpand — Expansion Permutation Primitive

**What:** The complement to BitSelect. Takes n input bits and emits m > n output bits by allowing duplicate indices — some input positions feed multiple output slots.

- Same `order` param shape as BitSelect, but duplicate indices are allowed (and are the point)
- `inputWidth` hint param with same semantics as BitSelect
- Output width derived from `order.length`
- Static validation rejects out-of-range indices but explicitly allows repeats
- Analyze transformation view shows repeated-wire routing: one input dot can have multiple output wires

**Teaching context:** This is the DES E-expansion — 32-bit half-block becomes 48 bits by repeating the 16 boundary bits. Without this primitive, an honest DES round function is inexpressible. With it, the inter-round diffusion created by boundary repetition becomes visually inspectable.

---

### 5. BitRemapEditor — Shared Tactile Wire Editor

**What:** A shared React component that provides a visual, clickable wire editor for both BitSelect and BitExpand. Replaces raw CSV editing as the primary authoring surface.

Interaction model (Option A: pick-list):
- Left column: numbered input dots, colored by `getPermutationWireColor(index)`
- Right column: output chip list (one chip per output slot, with a × remove button)
- Center: SVG wire canvas — colored lines from input dots to output chips
- Click an input dot to arm it; click again to append that input to the output sequence
- For BitSelect: already-selected dots disable when another is armed (no repeats)
- For BitExpand: all dots remain clickable; a count badge (×2, ×3) shows repeated positions
- Clear All button; CSV textarea below always in sync as a power-user fallback

Visual design follows the existing Permutation and Rotor wire editors exactly — same color palette, same wire endpoint circles, same armed/active port styles. A student who has used any other wire editor in MCW will find this immediately familiar.

**Why it matters pedagogically:** Authoring a DES PC-1 mapping by typing 57 comma-separated numbers is error-prone and teaches nothing. Clicking 56 dots in order, watching colored wires appear, and seeing gaps where parity bits were dropped — that teaches the compression permutation. The editor makes the operation legible during authoring, not just during inspection.

---

### 6. Demo, Tutorial, Challenge, and Micro-Demos

For both BitSelect and BitExpand, the following teaching content shipped alongside the primitives:

**BitSelect:**
- Demo: *Visible Key Selection* — one 16-bit key bus feeds both a BitWindow (contiguous slice) and a BitSelect (parity-drop), so the contrast is visible on canvas
- Tutorial: *Dropping Bits on Purpose* — 5 steps covering compression permutation, DES PC-1 analogy, BitWindow vs BitSelect contrast, and Analyze tab routing view
- Challenge: *Repair the Key Selection* — broken order includes position 7 (parity bit) instead of skipping it; student restores the correct selection
- Micro-demo: minimal 8→6 pipeline showing basic compression behavior

**BitExpand:**
- Demo: *Visible Key Expansion* — 4-bit source through BitExpand that repeats two boundary bits, producing a 6-bit output
- Tutorial: *Repeating Bits on Purpose* — 5 steps covering expansion output width, duplicate index semantics, DES E-expansion context, and Analyze routing view
- Challenge: *Repair the E-Expansion* — broken order replaces one boundary repeat with a non-boundary bit; student restores the correct boundary duplication
- Micro-demo: minimal 4→6 pipeline showing basic expansion behavior

---

## Product Quality Review Questions

Please review the recent work above and give honest feedback on the following:

**1. Teaching coherence**
Does the progression from BitSelect → BitExpand → BitRemapEditor → tutorial/challenge feel like a coherent teaching arc? Is there a gap between what the modules teach individually and what a student needs to understand DES or a similar cipher at the round level?

**2. Analyze tab depth**
The new LFSR/Plugboard/Reflector/Modulus panels add consequence language. Is that framing (property → consequence → implication for attack surface) the right model for a classroom context? What might be missing or over-explained?

**3. Tactile editor design**
The click-to-arm → click-to-append interaction model was chosen over drag-and-drop to remain keyboard/mobile-accessible. Is there a discoverability problem — will students know to click twice? What would you change about the interaction model if you were designing this from scratch?

**4. BitSelect vs BitExpand identity**
Both primitives use the same `order` param shape. The only semantic difference is whether duplicates are allowed. Is keeping them as two separate modules (rather than one configurable `BitRemap` module) the right call for a teaching tool? Argue both sides.

**5. Demo workspace quality**
The BitExpand demo is currently a simple 3-module pipeline (source → expand → output). The contract proposed something more ambitious: a split layout showing BitExpand above and BitSelect below from the same source, making the contrast explicit on canvas. The shipped version is simpler. Is the simpler version adequate, or does the contrast view serve a pedagogical purpose worth the added complexity?

**6. Learning sequence positioning**
BitSelect is at position 112, BitExpand at 113. These come after BitWindow (110) and before key-schedule content (120+). Is that the right neighborhood? A student who has just learned about contiguous bit slicing (BitWindow) then learns non-contiguous dropping (BitSelect) then learns expansion (BitExpand) — does that sequence build intuition in the right order?

**7. Coverage gaps**
After BitSelect and BitExpand, what is the next most important primitive or teaching surface the tool is missing for a student who wants to understand DES, AES, or ChaCha20 at the round level? Be specific about what is missing, not just what cipher it belongs to.

---

## Expansion Pack Idea Review

The following is the proposed design for an "expansion pack" system. Please review it on its own merits.

---

### Concept Summary

**Cipher Expansion Packs** are importable, prebuilt workspace bundles. Rather than constructing a cipher from scratch, a student imports a pack and receives:
- a complete working cipher graph (or a representative sub-graph)
- a guided tutorial that walks the dissection path
- optionally, a challenge that asks the learner to break, repair, or compare something

The key design principle: **packs are curated content, not new engine features.** The workspace JSON format already exists. A pack is a versioned bundle of workspace + tutorial + challenge that imports cleanly into the existing library system.

This is a different learning mode: **dissection-first** rather than construction-first. Students who want to understand *why* Enigma's reflector is a vulnerability, or *how* RC4's byte-0 bias emerges, or *what* makes Trivium's feedback pattern stronger than a single LFSR have no way today to start from a working reference machine and pull threads.

---

### V1 Scope: Enigma Only

V1 ships one expansion pack: **Enigma**. Rationale:
- Every component (Rotor, RotorReverse, Reflector, Plugboard, Clock, Gate) is already shipped
- The MCW graph *is* the machine — no abstraction required
- The known weaknesses (self-reciprocal reflector, no letter encrypts to itself, plugboard fixed points) are all already surfaced by the existing Analyze tab
- The historical attack story (Bombe, cribs, no self-encryption) maps directly to observable graph properties

Included in the Enigma pack:
- Three-rotor configuration with explicit stepping
- Plugboard and reflector wired to historical defaults
- Tutorial: *Why Enigma Could Be Broken* (trace signal path → observe self-reciprocal property → change plugboard → explain Bombe approach)
- Challenge: *Break the Crib* — a weakened Enigma with an obvious fixed-point plugboard; learner corrects it

---

### Two-Tier Architecture

**Tier 1 (buildable now):** Ciphers that can be faithfully represented with existing MCW primitives.
**Tier 2 (blocked on new primitives):** Ciphers that need one or more new primitive families first.

Tier 2 examples:

| Cipher | Blocking Primitive |
|---|---|
| DES key schedule | `BitSelect` + `BitExpand` (now shipped) |
| Trivium | Cross-register LFSR feedback |
| RC4 | Mutable array / swap state |
| AES round | GF(2⁸) multiply for MixColumns |
| ChaCha20 quarter-round | 32-bit word rotation + addition mod 2³² |

---

### Import Flow

A pack imports via one action from the workspace library panel. The import:
- adds each workspace to the user's local workspace list with a clear provenance label
- registers tutorials and challenges against the imported workspace IDs
- does not overwrite existing workspaces with the same name without confirmation

No cloud registry, no remote download, no pack sharing between users in V1.

---

### Expansion Pack Review Questions

**1. Is dissection-first a meaningful addition to the construction-first model, or does it risk creating passive consumers?**
The concern is that students who load a pre-built Enigma graph might just read the tutorial without internalizing how the machine works. Does the challenge ("Break the Crib") mitigate this enough? What would you add to force active engagement with a dissection-first workspace?

**2. Enigma as the V1 choice**
Is Enigma the right first cipher for a classroom expansion pack? Consider: it is historical, well-documented, visually interesting, and fully buildable from existing primitives. But it may also be intimidating (three rotors, plugboard, reflector) and its weaknesses may require more Analyze-tab literacy than beginning students have. Would you pick a different cipher for V1? If so, which one and why?

**3. Import format and provenance**
The proposed import format is a JSON bundle containing workspaces, tutorials, and challenges. The import registers these against local workspace IDs. What can go wrong? What edge cases in the import flow are most likely to confuse a classroom user (teacher or student)?

**4. The Tier 2 dependency chain**
DES key schedule is now Tier 1 (both BitSelect and BitExpand have shipped). Does it make sense to prioritize a DES Key Schedule pack immediately as the second expansion pack? Or should the Enigma pack ship and gather classroom feedback before building a more complex follow-on?

**5. Pack as content vs pack as feature**
The design says "packs are content, not engine features." This is a deliberate constraint. But consider: to import a pack, users need an import button, a provenance label, conflict detection, and format validation. That is a non-trivial UI slice. Does the "content not features" framing underestimate the implementation cost of the import flow? What is the smallest viable import experience?

**6. Long-term risk**
If MCW ships 5-10 expansion packs over the next year, what is the maintenance burden? Each pack's workspace JSON is coupled to the module schema — if a module's params change, does the pack break? How would you design the pack format to be resilient to schema evolution?

**7. Missing from the concept**
What is the most important thing missing from the expansion pack design as described? Consider: classroom logistics (sharing a pack with a class of 30 students), discoverability (how does a student find packs they have not imported yet), and reset semantics (can a student re-import a pack to restore a broken workspace to its original state).

---

## Tone and Format Requested

Please be direct and specific. This tool is used by a working teacher, not a product team with a roadmap committee. Vague praise is not useful. Specific observations, named gaps, and concrete alternative suggestions are what would actually help.

If you think something was implemented wrong — the interaction model, the teaching framing, the module split — say so plainly and explain why.

If you think the expansion pack idea is premature or low-priority relative to other gaps in the tool, say so.

Aim for 600–1000 words total across all questions. Not every question needs equal space — weight your response toward the observations you consider most consequential.
