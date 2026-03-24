# MCW — Cryptographic Vocabulary Roadmap

Status: Active strategic roadmap after `v1.16.0`.

This document reframes MCW as a cryptographic systems IDE:
- not a code generator
- not just a simulator
- not just a teaching visualizer

The core product direction is a construction environment where users can express cryptographic systems from explicit parts, inspect them, mutate them, test them, and teach from them.

The long-range goal is:

> if a cryptographic mechanism can be described as an explicit machine, MCW should eventually have the vocabulary to build it honestly

That includes:
- classical ciphers
- mechanized rotor and teleprinter systems
- stream ciphers
- block ciphers
- hash and sponge constructions
- pseudorandom generators
- key schedulers
- modern protocol ingredients such as IVs, nonces, counters, and salts
- eventually number-theoretic and public-key systems

---

## Product Boundary

This roadmap is about expressive machine vocabulary.

It is not a commitment to:
- add every historical or modern algorithm as a preset
- collapse the workbench into a generic node editor
- hide cryptographic structure behind smart black-box helpers
- add property scorers or theorem surfaces before the construction language exists

MCW stays strongest when:
- signal domains remain explicit
- transformations remain visible
- cryptographic behavior is constructed from honest parts

---

## Strategic Goal

MCW should become a full cryptographic erector set with enough primitive vocabulary to express:

1. **Transformation**
   - substitution
   - permutation
   - shifting/rotation
   - mixing
   - domain conversion

2. **State**
   - counters
   - clocks
   - stateful stepping
   - feedback registers
   - carried state across rounds/ticks

3. **Control**
   - comparisons
   - threshold / equality checks
   - triggers and pulses
   - gates / mux / demux
   - conditional advancement

4. **Framing**
   - chunking into blocks
   - joining blocks
   - padding / unpadding
   - message-boundary handling

5. **Protocol Inputs**
   - key
   - IV
   - nonce
   - salt
   - counter material

6. **Arithmetic / Algebra**
   - XOR and boolean operators
   - modular arithmetic
   - finite-field style operations later
   - inversion helpers where structurally honest

7. **Composition**
   - round structure
   - key schedules
   - reusable composite architectures
   - unzip / modify / recombine workflows

8. **Interrogation**
   - analysis
   - comparison
   - guided challenges
   - mutation experiments
   - testable teaching loops

---

## Missing Vocabulary Families

The current product is strong enough for:
- classical substitution/transposition teaching
- rotor and reflector-style machines
- bit-domain toy constructions
- modern toy rounds
- LFSR / clocked labs
- hashing and collision teaching
- explicit machine authoring and composition

It is not yet fully expressive.

The most important missing families are listed below. Families that have already shipped their first milestone are marked; remaining items within those families are still open.

### 1. Operator Vocabulary — *first milestone shipped in `v1.14.0`*

Shipped:
- `AND`, `OR`, `NOT`
- `AddMod`, `SubMod`, `Modulo`
- `Equals`, `Gate`

Still open over time:
- `Mux` / demux
- `GreaterThan` / richer threshold-style checks
- inversion helpers where structurally honest

### 2. Control / Trigger Vocabulary — *first milestone shipped in `v1.15.0`*

Shipped:
- `Counter`
- `Equals`, `AtLeast`
- `Gate` (one-bit control semantics)

Still open over time:
- explicit trigger / pulse modules
- condition-to-pulse conversion
- conditional stepping / advance control
- modular wrap / rollover helpers

### 3. Stream-Cipher Vocabulary

Current groundwork exists:
- `Clock`
- `LFSR`
- ticked execution
- explicit XOR output mixing

Still needed over time:
- richer combiner functions
- register-bank patterns
- filtered/irregular clocking control
- explicit keystream split/use patterns

### 4. Block / Framing Vocabulary — *first milestone shipped in `v1.16.0`*

Shipped:
- `BitSplit` (split one bit vector into left/right halves)
- `BitPad` (pad to target width)
- reuse of existing `BitJoin` for rejoining

Still open over time:
- unpad
- explicit chaining helpers
- message-boundary handling beyond single-vector framing

### 5. Symbol- and Message-Level Permutation Vocabulary

Needed additions likely include:
- symbol permutation analogous to bit permutation
- invert / reverse-permutation helpers where appropriate
- copy-and-invert authoring helpers for reversible designs

### 6. Advanced Rotor Realism

Already identified and should remain on the roadmap:
- `ringOffset` separate from `position`
- notch / turnover behavior
- double-step logic
- reversible rotation direction
- flipped insertion

### 7. Protocol Material Primitives

Needed additions likely include:
- `Nonce`
- `Salt`
- `IV`
- explicit counter sources
- key-material shaping helpers

### 8. Number-Theoretic / Asymmetric Foundations

Longer-term family, but must remain legible as a future destination:
- modular multiplication
- modular exponentiation
- inverse
- gcd / related arithmetic helpers
- finite-field and group-operation families later

---

## Roadmap Shape

The roadmap should not expand as one giant feature wave.

It should progress through bounded vocabulary lines, each with:
- primitives
- one or two demo workspaces
- one tutorial
- one guided challenge or analysis exercise where appropriate

### Phase 1 — Operator And Control Foundations — *shipped*

Shipped in `v1.14.0` and `v1.15.0`:
- `CRYPTO-OPERATORS-V1.md` — `AND`, `OR`, `NOT`, `AddMod`, `SubMod`, `Modulo`
- `CONTROL-PRIMITIVES-V1.md` — `Counter`, `Equals`, `AtLeast`, `Gate`
- `Beyond XOR` demo/tutorial/challenge
- `Counter Pulse Gate` demo/tutorial/challenge
- Analyze transformation views for `Equals`, `AtLeast`, and `Gate`

### Phase 2 — Mechanized And Stream Expressiveness

Purpose:
- let the workbench express richer stateful machines

Likely bounded slices:
- `ADVANCED-ROTOR-REALISM-V1.md`
- `STREAM-CIPHER-V1.md`

Likely deliverables:
- ring settings, turnover, double-step, direction control
- irregular clocking support
- better keystream machine examples

Teaching additions:
- rotor stepping tutorial
- stream combiner tutorial
- guided challenge around predicting / modifying stepping behavior

### Phase 3 — Block And Framing Foundations — *first slice shipped*

Shipped in `v1.16.0`:
- `BLOCK-FRAMING-V1.md` — `BitSplit`, `BitPad`, reuse of `BitJoin`
- `Split Transform Rejoin` and `Pad and Split` demo workspaces
- `Visible Block Boundaries` and `Padding Before Splitting` tutorials
- `Repair the Split Width` and `Repair the Pad Width` challenges
- Analyze transformation views for `BitSplit` and `BitPad`

Still open:
- `SYMBOL-PERMUTATION-V1.md`
- unpad semantics
- message-level permutation / inverse-permutation authoring

### Phase 4 — Scheduler And Protocol Inputs

Purpose:
- support real multi-round architectures and protocol context

Likely bounded slices:
- `KEY-SCHEDULE-V2.md`
- `PROTOCOL-MATERIAL-V1.md`

Likely deliverables:
- more expressive key schedule construction
- nonce / salt / IV sources
- explicit per-round/per-block material routing

Teaching additions:
- round-key evolution tutorial
- IV/nonce misuse teaching challenge

### Phase 5 — Number Theory And Public-Key Foundations

Purpose:
- open the path toward asymmetric systems without abandoning explicit structure

Likely bounded slices:
- `NUMBER-THEORETIC-OPERATORS-V1.md`
- `PUBLIC-KEY-FOUNDATIONS-V1.md`

Likely deliverables:
- modular arithmetic family
- inverses / exponentiation groundwork
- simple public-key teaching demos later

Teaching additions:
- modular arithmetic tutorial
- public-key intuition labs only after the operator family is stable

---

## Tutorials And Challenges Standard

Every major vocabulary line should add teaching support, not just primitives.

The standard should be:

1. **One tutorial**
   - introduce the new primitive family honestly

2. **One demo workspace**
   - show the family in context

3. **One guided challenge or mutation exercise**
   - confirm understanding through use, not just observation

Examples:
- operator family:
  - build a modular adder or gated mixer
- control family:
  - create a pulse when a counter hits a threshold
- stream family:
  - build a keystream combiner and observe irregular clocking
- block family:
  - chunk and rejoin a message with explicit padding
- protocol family:
  - compare correct and incorrect nonce/IV handling

---

## What To Avoid

To protect the product identity, avoid:
- turning MCW into a preset catalog instead of a construction system
- adding huge black-box modules that hide structure
- adding scoring dashboards before the construction language is ready
- chasing full realism in one subdomain while the shared vocabulary remains weak
- jumping to public-key demos before operator and control foundations exist

---

## Current Conclusion

The roadmap is now validated through shipped foundations in three phases:
- Phase 1: `CRYPTO-OPERATORS-V1.md` and `CONTROL-PRIMITIVES-V1.md` (shipped in `v1.14.0` / `v1.15.0`)
- Phase 3: `BLOCK-FRAMING-V1.md` (shipped in `v1.16.0`)

The next strategic direction after `v1.16.0` should be:

> keep expanding MCW into a fully expressive cryptographic machine language

The clearest next move is not “which algorithm next?”

It is:
- block/framing vocabulary is now shipped — framing exists as a foundation for protocol-material work
- introduce protocol-material primitives now that framing gives them a real structural role
- keep advanced rotor realism as a bounded follow-on, not the whole roadmap
- keep tutorials and challenges shipping alongside the new language

That is the path from:
- strong teaching workbench

to:
- genuinely special cryptographic systems IDE
