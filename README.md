# Modular Cryptography Workbench

Modular Cryptography Workbench (MCW) is a visual cryptographic construction environment built around typed signal-flow graphs.

Instead of selecting a prebuilt cipher, users assemble machines from parts:
- symbol-domain modules such as rotors and reflectors
- bit-domain modules such as XOR, LFSR, SBox, Permutation, and BitShifter
- explicit bridge modules such as `SymbolToBits` and `BitsToSymbol`

The goal is to make cryptographic structure visible. MCW is designed as a workshop, not a museum.

## Current State

The latest shipped tag is `v2.0.0`.
Current development now begins from the `v2.0.0` product boundary, with the active `v2.1` line focused on authoring power.

The first bounded `v2.1` target is:
- same-workspace repeated-structure authoring
- duplicate a selected visible cluster nearby
- preserve internal topology and params
- keep the duplicate fully local, explicit, and immediately editable

The next bounded follow-on after that is:
- cluster operations
- drag-box selection on empty canvas
- explicit delete-selected-cluster workflow

The current active safety slice after that is:
- workspace-local undo / redo

The current checkpointing follow-on after that is:
- named workspace versions / restore points
- explicit `Save Version` and `Restore` workflow per workspace

The current workspace-navigation follow-on after that is:
- bounded zoom in / zoom out
- reset / fit view recovery
- trace-driven focus jumps back into the visible workspace

The current connection-authoring follow-on after that is:
- direct rewiring from occupied inputs
- atomic replacement of single-input wires
- clear replacement vs blocked target feedback
- undo/redo-safe one-wire retargeting

The current parameter-authoring follow-on after that is:
- `Copy Params` from the current inspector target
- `Apply Params To Selected` for same-definition sibling modules
- explicit skip reporting for incompatible selections
- one-step undo/redo for bulk parameter application

The current parameter-comparison follow-on after that is:
- compare the current inspector target against selected same-definition siblings
- show aligned vs divergent fields inline in the inspector
- keep the selected module as the comparison anchor

The current primitive-legibility follow-on after that is:
- palette-local `Try Demo` actions for a bounded set of opaque primitives
- minimal seeded examples opened as new local editable workspaces
- no second demo library

`main` now includes the completed first milestone of **number-theoretic foundations**:
- new primitives:
  - `ModExp` (modular exponentiation via repeated squaring)
  - `ModInverse` (modular multiplicative inverse via extended Euclidean algorithm)
- `Toy RSA` demo workspace (visible encrypt/decrypt round-trip)
- `Key Schedule Workshop` demo workspace (two-round key derivation from one master key)
- `Toy RSA Round-Trip` and `Key Schedule Workshop` tutorials
- `Repair the RSA Exponent` and `Repair the Key Rotation` challenges

Recent shipped follow-ons after `v1.27.0`:
- `v1.28.0` Teaching Pathfinding And Hardening:
  - seeded teaching-content audit coverage
  - routed-clock validation fix
  - first shipped learning-sequence UI with stage/core/best-after guidance
- `v1.29.0` Bounded Bypass:
  - instance-level bypass for an explicit allow-list of eligible one-input / one-output same-domain modules
  - visible inspector toggle and canvas bypass badge
  - `Bypass Workshop` demo/tutorial/challenge
- `v1.30.0` Inverse Permutation Authoring:
  - `Build Inverse` helper for `Permutation` and `SymbolPermutation`
  - editor-side construction of the true inverse mapping, distinct from reverse order
  - explanatory UI hint clarifying that inverse undoes the current routing
- `v1.31.0` Bridge Ergonomics:
  - permissive raw `BitSource` entry for continuous, spaced, or bracketed `0/1` text
  - grouped bit preview in the structured bits editor
  - direct `HexToAscii` bridge for readable 7-bit ASCII byte decoding from hex text
- `v1.32.0` Bridge Ergonomics V2:
  - `AsciiToHex` bridge (symbol → symbol, 7-bit ASCII to uppercase hex)
  - sink-only output representation views for `Output` and `BitOutput`
  - Bits / Bytes / Hex / ASCII tabs with strict availability rules and explanation messaging
- `v1.33.0` Reversible Authoring:
  - `Normalize Reciprocal Pairs` helper for `Plugboard` and `Reflector`
  - exact reciprocal/involutive normalization helpers in the engine layer
  - editor-side reciprocity teaching copy clarifying that these mappings already undo themselves
- `v1.34.0` Workspace Housekeeping:
  - workspace-local module instance renaming with atomic reference updates
  - `Duplicate Workspace` for independent local copies with reset session state
  - conservative module-ID validation and unzip-cleanup support
- `v1.35.0` Composite Port Hints:
  - contextual composite/iterator port hints on hover
  - target-module-only input hints during live connection drag
  - no always-on labels, no primitive-wide rollout, no interface mutation
- `v1.36.0` Cross-Workspace Clipboard:
  - `Copy Selected Cluster` and `Paste Selected Cluster` for local workspace-to-workspace fragment reuse
  - selected modules only, internal-only connections, and relative layout preservation
  - fresh pasted IDs, immediate local divergence, and no linked/library/system-clipboard semantics
- `v1.37.0` Diffie-Hellman:
  - visible `Diffie-Hellman Key Exchange` demo built from explicit `ModExp` paths
  - `Visible Shared Secret` tutorial placed after `Toy RSA Round-Trip`
  - `Repair the Shared Secret` challenge for matching shared-secret derivation
- `v1.38.0` Key Schedule Depth:
  - visible `Recursive Key Schedule` demo with a three-step key ladder
  - `One Round Key Becomes The Next` tutorial placed after `Key Schedule Workshop`
  - `Repair the Next Round Key` challenge for restoring a later-round derivation step
- `v1.39.0` Block Chaining:
  - visible `Visible Block Chaining` demo with explicit IV seeding and block-to-block dependence
  - `Why The Next Block Depends On The Last` tutorial placed after `Recursive Key Schedule`
  - `Repair the Chaining Path` challenge for restoring the visible chaining edge into block 2
- `v1.40.0` Byte-Oriented Primitives:
  - new `ByteRotate` and `ByteSwap` helpers with strict multiple-of-8 validation
  - `Visible Byte Order` demo comparing byte-order reversal and byte-granularity rotation against raw bit rotation
  - `When Bits Become Bytes` tutorial and `Repair the Byte Order` challenge
- `v1.41.0` Integrity / Authentication:
  - visible `Visible Tamper Check` demo with readable sender/receiver message paths and explicit keyed tag recomputation
  - `Why Integrity Is Not Secrecy` tutorial placed after `Visible Byte Order`
  - `Repair the Tamper Check` challenge for restoring the receiver-side verification context
- `v1.42.0` AEAD Foundations:
  - visible `Visible Authenticated Encryption` demo with minimal encryption, explicit Encrypt-then-MAC tagging, receiver-side verification, and recovered plaintext
  - `Encrypting Is Not Enough` tutorial placed after `Visible Tamper Check`
  - `Repair the Protected Message` challenge for restoring authentication of the ciphertext path
- `v1.43.0` Digital Signature Foundations:
  - visible `Visible Signature Verification` demo with private-key signing, public verification, and explicit pass/fail comparison
  - `Signing Is Not Encrypting` tutorial placed after `Encrypting Is Not Enough`
  - `Repair the Signature` challenge for restoring the public verification exponent
- `v1.44.0` Protocol Handshakes:
  - visible `Visible Secure Handshake` demo with public exchange, signature verification, shared-key derivation, and one later protected message
  - `From Handshake To Protected Message` tutorial placed after `Signing Is Not Encrypting`
  - `Repair the Handshake` challenge for restoring the derived-key routing into the protected-message step

Shipped stream, rotor, protocol/framing, and symbol/message permutation foundations remain in place:
- stream-machine expressiveness:
  - `Majority`
  - `Mux`
  - `Demux`
- advanced rotor realism:
  - `ringOffset`, `notches`, visible `turnover`
- protocol inputs:
  - `IV`, `Nonce`, `Salt`
- framing:
  - `BitSplit`, `BitPad`, and reuse of existing `BitJoin`
- symbol/message permutation:
  - `SymbolPermutation`

Implemented and shipped:
- engine core types, graph validation, iterative topological executor
- V1 primitive modules (symbol + bit domains, bridges, modern primitives)
- ticked/stateful execution engine (rotor stepping, per-tick source slicing)
- reducer-backed UI shell with visual workbench canvas
- draggable modules, port-to-port connections, structured parameter editors
- reusable composite workflows
- analysis visibility, step-through execution, signal probing
- comparison-first break workflows
- guided challenges and tutorial walkthroughs
- Build / Guide workspace mode (freeform building vs. tutorial-guided learning)
- ticked execution UI (tick bar, scrubber, collected output, per-tick state display)
- advanced modern foundry labs (byte rounds, keystreams, gated clocking)
- multi-format bridges (hex, ASCII, Baudot)
- constrained iterators and explicit key-bus distribution
- nested analysis for composite and iterator internals
- Feistel round / iterator teaching loop
- dedicated Cryptanalysis workspace mode
- Vigenere analysis workflow:
  - IOC and n-gram summaries
  - repeated-fragment / Kasiski-style evidence
  - candidate key-length estimation
  - period-based column analysis
  - graph-and-slide frequency matching
  - candidate plaintext reconstruction
- `Breaking the Unbreakable` tutorial
- modern analysis workflow:
  - `Classical / Modern` cryptanalysis sub-modes
  - Avalanche Explorer
  - aligned bit-difference strips
  - machine-aware output difference for supported bit/hex source paths
  - round-aware diffusion summaries and progression matrix
- `The Avalanche Effect` tutorial
- hashing foundations:
  - toy compression hash
  - toy sponge hash
  - hash-focused demos and guided tutorials
  - exposed internal controls for digest/mix behavior via parameter forwarding
- transformation visualization workflow in Inspector `Analyze`:
  - `Permutation`
  - `BitShifter`
  - `XOR`
  - `SBox`
  - iterator-aware nested transformation resolution
- `v1.4.0` release framing and workspace polish
- `v1.5.0` Modern Analysis milestone
- `v1.6.0` Transformation Visualization Phase 1 milestone
- `v1.7.0` Hashing V1 milestone
- `v1.8.0` Hash Collision Challenge milestone
- `v1.9.0` Sponge Collision Challenge milestone
- `v1.10.0` Collision Interpretation Foundations milestone
- `v1.11.0` Hash Autopsy milestone (Internal Divergence Helper)
- `v1.14.0` Cryptographic Operators milestone
- `v1.15.0` Control Primitives milestone
- `v1.16.0` Block Framing milestone
- `v1.17.0` Protocol Material milestone
- `v1.18.0` Stream Cipher Foundations milestone
- `v1.19.0` Advanced Rotor Realism milestone
- `v1.20.0` Stream Cipher Filtering milestone
- `v1.21.0` Stream Cipher Routing milestone
- `v1.22.0` Symbol Permutation milestone
- `v1.23.0` Key Routing milestone
- `v1.24.0` Symbol Structure milestone
- `v1.25.0` Arithmetic Expansion milestone
- `v1.26.0` Number-Theoretic Foundations milestone
- `v1.27.0` Transformation View Consolidation milestone
- `v1.28.0` Teaching Pathfinding And Hardening milestone
- `v1.29.0` Bounded Bypass milestone
- first bounded hash collision challenge:
  - seeded `Find A Hash Collision` challenge
  - same-digest / different-input success rule
  - collision-aware challenge status copy
  - `HexSource` `-1 / +1` stepping for manual exploration
- sponge collision follow-on:
  - seeded `Find A Sponge Collision` challenge
  - challenge ownership by `projectId`
  - project-correct challenge selection/reset/import behavior
  - corrected sponge digest extraction using folded rate + capacity contribution
  - audit-style hash-spread regression tests
- first bounded post-collision interpretation follow-on:
  - side-by-side original vs current message comparison for hash collision challenges
  - post-success interpretation nudges into `Analyze` and `Modern Cryptanalysis`
  - internal-divergence helper showing the first internal trace split after the guided inputs
  - hardened sponge absorb path with asymmetric right-input preparation
  - sampled symmetry-regression tests for paired input shifts
- tactile primitive authoring:
  - `SBox` grid editor with reset helpers and synced raw CSV
  - `Permutation` wire editor for simple one-to-one routing with synced raw CSV fallback
  - `Reflector` socket-pair editor with shared pair styling and synced raw wiring
  - `Rotor` wire editor with runtime-centered anchors and dotted endpoints
- builder workflow ergonomics:
  - multi-select group movement
  - graph-aware `Tidy Layout`
  - blank and saved personal workspaces under `My Workspaces`
  - deletion for user-owned workspaces only
  - instance-level composite unzip with forwarded-param carry-through
- bundle/performance guardrails:
  - lazy-loaded secondary panels
  - React vendor chunk split
  - build-time bundle-size check
- workbench persistence and JSON import/export
- dark mode
- GitHub Pages deployment

## Key Documents

- `PROJECT.md`: product vision and full specification
- `ENGINE-V1-CONTRACT.md`: locked implementation decisions for the engine
- `COMPOSITE-V1-CONTRACT.md`: locked direction for composite modules
- `BREAK-V1-CONTRACT.md`: locked direction for break workflows
- `GUIDED-CHALLENGES-V1-CONTRACT.md`: locked direction for classroom challenges
- `MODERN-PRIMITIVES-V1-CONTRACT.md`: locked direction for modern primitive expansion
- `V1-POLISH-AND-TUTORIALS.md`: locked direction for v1 polish and tutorials
- `ADVANCED-FOUNDRY-CLOCK-V1.md`: locked direction for ticked/stateful execution
- `CRYPTANALYSIS-WORKSPACE-V1.md`: locked direction for the dedicated cryptanalysis workspace
- `MODERN-ANALYSIS-V1.md`: shipped direction for the post-`v1.4.0` modern-analysis line
- `HASHING-V1.md`: shipped first hashing milestone contract and scope boundary
- `HASH-COLLISION-CHALLENGE-V1.md`: shipped first bounded hash weakness challenge
- `SPONGE-COLLISION-CHALLENGE-V1.md`: shipped sponge-collision follow-on and sponge-hash correction slice
- `POST-COLLISION-INTERPRETATION-V1.md`: shipped first milestone for understanding why colliding messages still differ internally
- `CUSTOM-SBOX-AUTHORING-V1.md`: shipped bounded authoring slice for editable substitution-table design inside the workbench
- `CUSTOM-PERMUTATION-AUTHORING-V1.md`: shipped bounded tactile authoring slice for editable routing/permutation design inside the workbench
- `CUSTOM-REFLECTOR-AUTHORING-V1.md`: shipped bounded tactile authoring slice for paired reflector wiring inside the workbench
- `WORKBENCH-ERGONOMICS-V1.md`: shipped bounded workbench-usability slice for multi-select, group movement, and one-click cleanup
- `WORKSPACE-LIBRARY-V1.md`: shipped bounded workspace-management slice for blank build spaces and saved personal collections
- `WORKSPACE-RENAME-V1.md`: shipped bounded housekeeping slice for workspace-local module instance renaming
- `WORKSPACE-DUPLICATE-V1.md`: shipped bounded housekeeping slice for whole-workspace duplication
- `COMPOSITE-PORT-HINTS-V1.md`: shipped bounded UI slice for contextual composite boundary port hints
- `COMPOSITE-UNZIP-V1.md`: shipped bounded inverse-composition slice for expanding a composite instance back into editable modules
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md`: active strategic roadmap for growing MCW into a fully expressive cryptographic systems IDE
- `CRYPTO-OPERATORS-V1.md`: shipped first foundational operator-expansion slice for boolean and fixed-width word arithmetic
- `CONTROL-PRIMITIVES-V1.md`: shipped first bounded counter/compare/gate slice for condition-driven machines
- `BLOCK-FRAMING-V1.md`: shipped first post-Phase-1 framing slice for visible block boundaries, rejoining, and padding
- `PROTOCOL-MATERIAL-V1.md`: shipped first bounded protocol-input slice for IV, nonce, and salt sources
- `STREAM-CIPHER-V1.md`: shipped first bounded stream-machine slice for visible majority logic and irregular clocking
- `STREAM-CIPHER-V2.md`: shipped second bounded stream-machine slice for visible selector/filter behavior via `Mux`
- `STREAM-CIPHER-V3.md`: shipped third bounded stream-machine slice for visible routing/scheduling behavior via `Demux`
- `SYMBOL-PERMUTATION-V1.md`: shipped first bounded symbol/message permutation slice for visible symbol-order routing
- `KEY-SCHEDULE-V2.md`: shipped first bounded post-groundwork key-routing slice for visible sub-key extraction from one key bus
- `SYMBOL-STRUCTURE-V1.md`: shipped first bounded post-permutation symbol/message-structure slice for visible contiguous submessage extraction
- `LEARNING-SEQUENCE-V1.md`: first shipped sequencing milestone for suggested ordering across demos, tutorials, and challenges
- `ARITHMETIC-EXPANSION-V1.md`: shipped first bounded arithmetic-expansion slice for modular multiplication, strict comparison, and unpadding
- `NUMBER-THEORETIC-V1.md`: shipped first bounded number-theoretic foundations slice for modular exponentiation and modular inverse
- `DIFFIE-HELLMAN-V1.md`: shipped bounded number-theoretic follow-on for visible shared-secret agreement
- `KEY-SCHEDULE-DEPTH-V1.md`: shipped bounded symmetric-construction follow-on for visible recursive round-key derivation
- `BLOCK-CHAINING-V1.md`: framed bounded `v1.39.0` follow-on for visible block-to-block dependence
- `BYTE-ORIENTED-PRIMITIVES-V1.md`: framed bounded `v1.40.0` follow-on for explicit byte/word structure helpers
- `INTEGRITY-AUTHENTICATION-V1.md`: framed bounded `v1.41.0` follow-on for visible tamper detection and authenticator comparison
- `AEAD-FOUNDATIONS-V1.md`: framed bounded `v1.42.0` follow-on for visible authenticated-encryption-style composition
- `DIGITAL-SIGNATURE-FOUNDATIONS-V1.md`: framed bounded `v1.43.0` follow-on for visible signing and verification
- `PROTOCOL-HANDSHAKES-V1.md`: framed bounded `v1.44.0` follow-on for visible handshake / transcript composition
- `MCW-V2-SANITY-PASS.md`: proposed post-`v1.44.0` product-level cohesion pass for library organization, scale management, and curriculum framing
- `BYPASS-V1.md`: shipped bounded usability slice for visible instance-level bypass on eligible one-in/one-out modules
- `INVERSE-PERMUTATION-AUTHORING-V1.md`: shipped bounded authoring follow-on for deriving inverse mappings in bit and symbol permutation editors
- `BRIDGE-ERGONOMICS-V1.md`: shipped bounded bridge/usability follow-on for easier raw-bit entry and clearer byte-oriented bridge behavior
- `ADVANCED-ROTOR-REALISM-V1.md`: shipped first bounded rotor-realism slice for ring setting, turnover, and double-step behavior
- `PARAM-FORWARDING-V1.md`: active direction for explicit exposed-internal controls on reusable architectures
- `TRANSFORMATION-VISUALIZATION-V1.md`: shipped first milestone for primitive-level transformation legibility and drill-down views
- `SBOX-TRANSFORMATION-V1.md`: shipped first lookup/substitution visual family contract
- `AI-COORDINATION.md`: multi-agent workflow rules
- `AI-WORKSTREAMS.md`: current ownership boundaries
- `IMPLEMENTATION-STATUS.md`: live execution status and handoff notes

## Development

Requirements:
- Node.js 20+

Commands:

```bash
npm install
npm test
npm run lint
npm run build
```

## Deployment

Pushes to `main` deploy automatically to GitHub Pages through `.github/workflows/deploy.yml`.

Published site:
- https://timothy815.github.io/Modular_crypto_worksbench/

## The Canonical Pipeline

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

In ticked mode, the rotor advances per character and TextInput emits one character per tick — a full Enigma-style stepping pipeline.

## Near-Term Roadmap

1. Treat MCW explicitly as a **cryptographic systems IDE** and grow the primitive language toward full expressive coverage, not just isolated feature branches
2. Continue the primitive-language phase beyond shipped stream, rotor, symbol-permutation, key-routing, and symbol-structure foundations:
   the next bounded decision should stay within shared vocabulary growth rather than preset-building
3. Keep future rotor follow-ons bounded:
   reversible rotation direction, flipped insertion, and deeper rotor-bank realism should remain explicit sub-slices rather than spilling into convenience presets
4. Add one tutorial plus one demo/challenge whenever a major new primitive family ships so the language grows with teaching support
5. Add each new teaching artifact to a visible suggested learning stage so the library feels ordered rather than flat
6. Keep performance/bundle size under watch now that builder workflow and tactile editors both sit behind the guardrails
7. Monitor classroom use of workspace library and composite unzip before widening them into sharing, folders, or bulk-expansion tooling
8. Monitor challenge-induced project switching in classroom use before adding warning dialogs
9. Avoid scope creep into brute-force tooling, birthday-bound calculators, famous-hash comparisons, or premature asymmetric demos before the underlying vocabulary exists
10. Keep the shipped bypass line bounded to honest one-in/one-out same-domain modules rather than widening it into universal mute/solo behavior
11. Tighten bridge ergonomics before opening a broad new encoding family — make raw bit entry and byte-oriented bridges feel natural before considering UTF-8 follow-ons
12. Treat a `v2.0` sanity/framing pass as the next product-level checkpoint now that the first systems-composition slice is framed, but keep it focused on organization, cohesion, and close-out rather than restarting vocabulary sprawl
