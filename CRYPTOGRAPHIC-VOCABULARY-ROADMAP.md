# MCW — Cryptographic Vocabulary Roadmap

Status: Active strategic roadmap after `v1.44.0`.

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

### 1. Operator Vocabulary — *first milestone shipped in `v1.14.0`, expanded in `v1.25.0`*

Shipped:
- `AND`, `OR`, `NOT`
- `AddMod`, `SubMod`, `Modulo`
- `MulMod` (v1.25.0)
- `Equals`, `Gate`
- `GreaterThan` (v1.25.0)

Still open over time:
- `Mux` / demux
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

Shipped so far:
- `Majority` for visible voting / irregular clocking
- `Mux` for visible selector / filter behavior
- `Demux` for visible routing / scheduling behavior

Still needed over time:
- richer combiner functions
- register-bank patterns
- explicit keystream split/use patterns

### 4. Block / Framing Vocabulary — *first milestone shipped in `v1.16.0`, expanded in `v1.25.0`*

Shipped:
- `BitSplit` (split one bit vector into left/right halves)
- `BitPad` (pad to target width)
- `BitUnpad` (strip padding to recover original width) (v1.25.0)
- reuse of existing `BitJoin` for rejoining

Shipped follow-ons:
- `Visible Block Chaining` demo, `Why The Next Block Depends On The Last` tutorial, and `Repair the Chaining Path` challenge — shipped in `v1.39.0`
- `ByteRotate`, `ByteSwap`, `Visible Byte Order`, `When Bits Become Bytes`, and `Repair the Byte Order` — shipped in `v1.40.0`
- `Visible Tamper Check`, `Why Integrity Is Not Secrecy`, and `Repair the Tamper Check` — shipped in `v1.41.0`
- `Visible Authenticated Encryption`, `Encrypting Is Not Enough`, and `Repair the Protected Message` — framed in `v1.42.0`
- the modern symmetric-composition arc from chaining through AEAD is now coherently shipped/framed across `v1.39.0`–`v1.42.0`

### 5. Symbol- and Message-Level Structure Vocabulary — *first milestone shipped in `v1.22.0`, second milestone shipped in `v1.24.0`*

Shipped:
- `SymbolPermutation` (v1.22.0)
- `SymbolWindow` (v1.24.0)

Still open over time:
- invert / reverse-permutation helpers where appropriate
- copy-and-invert authoring helpers for reversible designs
- broader message-level permutation patterns beyond one bounded reorder primitive

### 6. Advanced Rotor Realism — *first milestone shipped in `v1.19.0`*

Shipped:
- `ringOffset` separate from `position`
- notch / turnover behavior
- double-step logic

Still open over time:
- reversible rotation direction
- flipped insertion

### 7. Protocol Material Primitives — *first milestone shipped in `v1.17.0`*

Shipped in `v1.17.0`:
- `PROTOCOL-MATERIAL-V1.md` — `IV`, `Nonce`, `Salt`
- `Protocol Material Mixer` demo workspace
- `Protocol Material Is Context` tutorial
- `Repair the IV` challenge

Still open:
- explicit counter sources (if later justified beyond shipped `Counter`)
- key-material shaping helpers
- stronger protocol-context teaching lines after classroom use

### 8. Key-Routing / Schedule Vocabulary — *first milestone shipped in `v1.23.0`*

Current groundwork exists:
- `ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md`
- `KEY-SCHEDULE-GROUNDWORK-V1.md`
- explicit key-bus and keyed-round teaching artifacts

Shipped so far:
- `BitWindow` for visible contiguous sub-key extraction from one key bus
- `Recursive Key Schedule` demo, `One Round Key Becomes The Next` tutorial, and `Repair the Next Round Key` challenge — shipped in `v1.38.0`

### 9. Bridge Ergonomics / Encoding Boundaries

Current groundwork exists:
- `BitSource`
- `BitsToAscii` / `AsciiSource`
- `BitsToHex` / `HexSource`
- `BitsToBaudot` / `BaudotSource`
- symbol-domain bridges

Still needed over time:
- easier arbitrary-width raw-bit entry
- clearer byte grouping expectations for ASCII workflows
- clearer distinction between reversible byte/codeword bridges and lossy alphabet bridges
- tighter authoring ergonomics before opening a broader UTF-8-specific slice

Still needed over time:
- later iterator-aware key distribution only if it stays inspectable
- richer schedule-construction patterns beyond the shipped recursive three-key ladder

### 10. Number-Theoretic / Asymmetric Foundations — *first slice shipped, second asymmetric teaching slice shipped*

First slice shipped in `v1.25.0` and `v1.26.0`:
- modular multiplication (`MulMod`) — shipped in `v1.25.0`
- modular exponentiation (`ModExp`) — shipped in `v1.26.0`
- modular inverse (`ModInverse`) — shipped in `v1.26.0`
- `Toy RSA` and `Key Schedule Workshop` demos/tutorials/challenges
- `Diffie-Hellman Key Exchange` demo, `Visible Shared Secret` tutorial, and `Repair the Shared Secret` challenge — shipped in `v1.37.0`

Still open:
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

### Phase 2 — Mechanized And Stream Expressiveness — *first slices shipped*

Purpose:
- let the workbench express richer stateful machines

Likely bounded slices:
- `ADVANCED-ROTOR-REALISM-V1.md`
- `STREAM-CIPHER-V1.md`

Shipped in `v1.18.0`:
- `STREAM-CIPHER-V1.md` first slice:
  - `Majority`
  - `Majority-Clocked Keystream` demo workspace
  - `The Majority-Clocked Keystream` tutorial
  - `Repair the Majority Vote` challenge

Shipped in `v1.20.0`:
- `STREAM-CIPHER-V2.md` second slice:
  - `Mux`
  - `Filtered Keystream` demo workspace
  - `The Filtered Keystream` tutorial
  - `Repair the Filter Selector` challenge

Shipped in `v1.21.0`:
- `STREAM-CIPHER-V3.md` third slice:
  - `Demux`
  - `Routed Clock Keystream` demo workspace
  - `The Routed Clock Keystream` tutorial
  - `Repair the Routed Clock` challenge

Shipped in `v1.19.0`:
- `ADVANCED-ROTOR-REALISM-V1.md` first slice:
  - `ringOffset`
  - `notches`
  - visible `turnover`
  - `Advanced Rotor Stepping` demo workspace
  - `Advanced Rotor Stepping` tutorial
  - `Repair the Rotor Notch` challenge

Still open:
- richer stream combiners / filter functions
- rotor direction control / flipped insertion follow-ons
- better keystream machine examples beyond the first routing/filtering loops

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

Shipped in `v1.25.0`:
- `BitUnpad` (inverse of `BitPad`)
- `Multiply Compare Unpad` demo/tutorial/challenge

Still open:
- message-level permutation / inverse-permutation authoring

### Phase 4 — Scheduler, Key Routing, And Protocol Inputs — *first slices shipped*

Purpose:
- support real multi-round architectures and protocol context

Likely bounded slices:
- `KEY-SCHEDULE-V2.md`
- `PROTOCOL-MATERIAL-V1.md` (shipped in `v1.17.0`)

Shipped in `v1.17.0`:
- nonce / salt / IV sources
- first protocol-material demo/tutorial/challenge line

Shipped in `v1.23.0`:
- `KEY-SCHEDULE-V2.md` first slice:
  - `BitWindow`
  - `Visible Sub-Key Bus` demo workspace
  - `Visible Sub-Key Bus` tutorial
  - `Repair the Key Window` challenge

Still open:
- more expressive key schedule construction
- explicit per-round/per-block material routing

Teaching additions:
- round-key evolution tutorial
- IV/nonce misuse teaching challenge

### Phase 5 — Number Theory And Public-Key Foundations — *foundations shipped*

Purpose:
- open the path toward asymmetric systems without abandoning explicit structure

Shipped in `v1.25.0`:
- `MulMod` — modular multiplication on equal-width bit words
- `GreaterThan` — strict comparison emitting 1-bit control

Shipped in `v1.26.0`:
- `ModExp` — modular exponentiation via repeated squaring
- `ModInverse` — modular multiplicative inverse via extended Euclidean algorithm
- `Toy RSA` demo/tutorial/challenge
- `Key Schedule Workshop` demo/tutorial/challenge

Shipped in `v1.37.0`:
- `Diffie-Hellman Key Exchange` demo
- `Visible Shared Secret` tutorial
- `Repair the Shared Secret` challenge

Framed in `v1.43.0`:
- `Visible Signature Verification` demo
- `Signing Is Not Encrypting` tutorial
- `Repair the Signature` challenge

Still open:
- gcd / related arithmetic helpers
- finite-field and group-operation families later
- certificate / trust-chain teaching after standalone signatures and first handshake composition are individually clear

Teaching additions:
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

The roadmap is now validated through shipped foundations across all five phases, through a completed modern symmetric-composition arc, through a completed asymmetric-foundations arc, and through a first systems-composition checkpoint:
- Phase 1: `CRYPTO-OPERATORS-V1.md` and `CONTROL-PRIMITIVES-V1.md` (shipped in `v1.14.0` / `v1.15.0`)
- Phase 2: `STREAM-CIPHER-V1.md`, `STREAM-CIPHER-V2.md`, `STREAM-CIPHER-V3.md`, and `ADVANCED-ROTOR-REALISM-V1.md` shipped slices (`v1.18.0` / `v1.20.0` / `v1.21.0` / `v1.19.0`)
- Phase 3: `BLOCK-FRAMING-V1.md` (shipped in `v1.16.0`) and `ARITHMETIC-EXPANSION-V1.md` (shipped in `v1.25.0`)
- Phase 4: `PROTOCOL-MATERIAL-V1.md` and `KEY-SCHEDULE-V2.md` first slices (shipped in `v1.17.0` / `v1.23.0`)
- Phase 5: `NUMBER-THEORETIC-V1.md` first slice (`v1.26.0`), `DIFFIE-HELLMAN-V1.md` (`v1.37.0`), and `DIGITAL-SIGNATURE-FOUNDATIONS-V1.md` (`v1.43.0`) now cover asymmetric confidentiality, agreement, and authentication
- Modern symmetric composition: block chaining, byte/word structure, integrity/authentication, and AEAD-style composition (`v1.39.0` / `v1.40.0` / `v1.41.0` / `v1.42.0`)
- Systems composition: `PROTOCOL-HANDSHAKES-V1.md` (`v1.44.0`) shows one compact handshake-to-message transcript built from shipped parts

The next strategic direction after `v1.44.0` should be:

> keep expanding MCW into a fully expressive cryptographic machine language

The clearest next move is no longer another missing concept family.
It is a product-level sanity pass that protects the usability and coherence of what has already been built:

- a `v2.0` framing / cohesion checkpoint

From there, later follow-ons can stay bounded:
- certificate / trust-chain teaching only after standalone signatures and first handshake composition are individually clear
- later trust/auth infrastructure only if classroom use proves the need
- stronger symmetric/auth refinements only if classroom use proves the need

The immediate next bounded contract should therefore be organizational rather than cryptographic:

- `MCW-V2-SANITY-PASS.md`

The discipline should remain the same:
- block/framing, protocol-material, stream vocabulary, rotor-realism, modern symmetric composition, and first asymmetric foundations are now shipped
- keep deeper stream-combiner follow-ons bounded rather than turning the stream line into preset sprawl
- keep protocol-material follow-ons bounded rather than jumping to mode presets
- keep future rotor follow-ons bounded rather than turning mechanized realism into hidden helpers
- keep post-AEAD trust/authentication work bounded rather than jumping straight to protocol suites
- keep usability/teaching helpers like bypass instance-local and honest rather than widening them into universal hidden rewiring
- keep tutorials and challenges shipping alongside the new language

That is the path from:
- strong teaching workbench

to:
- genuinely special cryptographic systems IDE
