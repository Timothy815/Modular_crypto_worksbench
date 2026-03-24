# Modular Cryptography Workbench

Modular Cryptography Workbench (MCW) is a visual cryptographic construction environment built around typed signal-flow graphs.

Instead of selecting a prebuilt cipher, users assemble machines from parts:
- symbol-domain modules such as rotors and reflectors
- bit-domain modules such as XOR, LFSR, SBox, Permutation, and BitShifter
- explicit bridge modules such as `SymbolToBits` and `BitsToSymbol`

The goal is to make cryptographic structure visible. MCW is designed as a workshop, not a museum.

## Current State

The repository has shipped through `v1.7.0`.

`main` is now positioned to frame/tag **`v1.8.0`** around the first bounded **Hash Collision Challenge** slice.

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
- first bounded hash collision challenge:
  - seeded `Find A Hash Collision` challenge
  - same-digest / different-input success rule
  - collision-aware challenge status copy
  - `HexSource` `-1 / +1` stepping for manual exploration
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
- `HASH-COLLISION-CHALLENGE-V1.md`: active direction for the first post-`v1.7.0` hash weakness challenge
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

1. Tag and frame **`v1.8.0`** around the first bounded hash collision challenge
2. Keep performance/bundle size under watch as inspector and analysis surfaces continue to grow
3. Decide what follows the first collision challenge: sponge collision, deeper analysis guidance, or polish
4. Defer deeper transformation playback/animation until classroom feedback justifies it
5. Avoid scope creep into brute-force tooling, birthday-bound calculators, famous-hash comparisons, or KDF/Merkle-style structures before a new contract says otherwise
