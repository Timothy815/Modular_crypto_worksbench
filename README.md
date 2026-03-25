# Modular Cryptography Workbench

Modular Cryptography Workbench (MCW) is a visual cryptographic construction environment built around typed signal-flow graphs.

Instead of selecting a prebuilt cipher, users assemble machines from parts:
- symbol-domain modules such as rotors and reflectors
- bit-domain modules such as XOR, LFSR, SBox, Permutation, and BitShifter
- explicit bridge modules such as `SymbolToBits` and `BitsToSymbol`

The goal is to make cryptographic structure visible. MCW is designed as a workshop, not a museum.

## Current State

The repository has shipped through `v1.23.0`.

`main` now includes the completed first milestone of **key-routing / schedule vocabulary**:
- new primitive:
  - `BitWindow`
- explicit `start` / `width` sub-key extraction from one visible key bus
- static out-of-range window validation when upstream width is knowable
- Analyze transformation view for `BitWindow`
- `Visible Sub-Key Bus` demo workspace
- `Visible Sub-Key Bus` tutorial
- `Repair the Key Window` challenge

Current unshipped checkpoint on `main`:
- `443072c` — first bounded **symbol/message structure** slice
- new primitive:
  - `SymbolWindow`
- explicit contiguous `symbol`-domain `start` / `width` extraction
- Analyze transformation view for `SymbolWindow`
- `Visible Message Window` demo workspace
- `Visible Message Window` tutorial
- `Repair the Message Window` challenge

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
- `SYMBOL-STRUCTURE-V1.md`: proposed first bounded post-permutation symbol/message-structure slice for visible contiguous submessage extraction
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
2. Continue the primitive-language phase beyond shipped stream, rotor, symbol-permutation, and key-routing foundations:
   the next bounded decision should stay within shared vocabulary growth rather than preset-building
   Immediate focus:
   `SYMBOL-STRUCTURE-V1.md`
3. Keep future rotor follow-ons bounded:
   reversible rotation direction, flipped insertion, and deeper rotor-bank realism should remain explicit sub-slices rather than spilling into convenience presets
4. Add one tutorial plus one demo/challenge whenever a major new primitive family ships so the language grows with teaching support
5. Keep performance/bundle size under watch now that builder workflow and tactile editors both sit behind the guardrails
6. Monitor classroom use of workspace library and composite unzip before widening them into sharing, folders, or bulk-expansion tooling
7. Monitor challenge-induced project switching in classroom use before adding warning dialogs
8. Avoid scope creep into brute-force tooling, birthday-bound calculators, famous-hash comparisons, or premature asymmetric demos before the underlying vocabulary exists
