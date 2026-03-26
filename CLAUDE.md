# MCW — Claude Code Context

Read PROJECT.md for full project specification.
Read ENGINE-V1-CONTRACT.md for locked implementation decisions.
Read ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md before starting work on iterative-round abstractions or key-schedule groundwork.
Read KEY-SCHEDULE-GROUNDWORK-V1.md before extending iterator-aware key distribution or round-key generation.
Read CRYPTANALYSIS-WORKSPACE-V1.md before starting work on the post-v1.3 cryptanalysis workspace.
Read MODERN-ANALYSIS-V1.md before starting work on the post-v1.4 modern-analysis line.
Read HASHING-V1.md before starting work on the hashing line.
Read HASH-COLLISION-CHALLENGE-V1.md before starting work on the first post-`v1.7.0` hashing challenge slice.
Read SPONGE-COLLISION-CHALLENGE-V1.md before starting work on the bounded sponge-collision follow-on.
Read POST-COLLISION-INTERPRETATION-V1.md before extending the collision-teaching line beyond the shipped nudges/comparison slice.
Read CUSTOM-SBOX-AUTHORING-V1.md before starting work on editable substitution-table authoring.
Read TRANSFORMATION-VISUALIZATION-V1.md before starting work on primitive-level drill-down or transformation-legibility features.
Read SBOX-TRANSFORMATION-V1.md before starting work on the first S-Box transformation view.
Read CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md before starting work on new primitive-language families, operator/control expansion, or long-range roadmap framing.
Read CRYPTO-OPERATORS-V1.md before starting work on the first post-`v1.13.0` operator-expansion slice.
Read CONTROL-PRIMITIVES-V1.md before starting work on counters, triggers, gates, or explicit conditional machine behavior.
Read BLOCK-FRAMING-V1.md before starting work on block splitting, padding, rejoining, or framing follow-ons.
Read PROTOCOL-MATERIAL-V1.md before starting work on IV, nonce, salt, or protocol-input sources.
Read SYMBOL-STRUCTURE-V1.md before starting work on symbol/message slicing, symbol windows, or post-permutation message-structure follow-ons.
Read LEARNING-SEQUENCE-V1.md before restructuring the teaching library, adding staged progression, or changing how demos/tutorials/challenges are ordered.
Read ARITHMETIC-EXPANSION-V1.md before starting work on modular multiplication, strict comparison, unpadding, or number-theoretic follow-ons.
Read NUMBER-THEORETIC-V1.md before starting work on modular exponentiation, modular inverse, or number-theoretic follow-ons.
Read BYPASS-V1.md before adding instance-level transform bypass, mute/solo behavior, or “turn this module off” controls.
Read INVERSE-PERMUTATION-AUTHORING-V1.md before extending permutation-editor helpers, inverse mapping tools, or decrypt-path permutation authoring.
Read BRIDGE-ERGONOMICS-V1.md before changing raw bit entry, byte-oriented bridges, or reversible/lossy bridge guidance.
Read V1-POLISH-AND-TUTORIALS.md before starting work on `feature/v1-polish-and-tutorials`.
Read IMPLEMENTATION-STATUS.md for the latest safe checkpoint and handoff notes.

## Project: Modular Cryptography Workbench

A visual, composable cryptographic construction environment — a "cryptographic erector set" inspired by modular synthesizers. Cryptography as a signal-processing system: data flows through typed transformation modules connected in a DAG.

## Repository

- **Remote:** `git@github.com:Timothy815/Modular_crypto_worksbench.git`
- **GitHub Pages:** https://timothy815.github.io/Modular_crypto_worksbench/
- **Deployment:** GitHub Actions workflow in `.github/workflows/deploy.yml` — auto-deploys on push to `main`
- **Vite base path:** `/Modular_crypto_worksbench/` (required for GitHub Pages subdirectory hosting)

## Git Workflow & Branching Strategy

### Commit Rules
- Commit messages: imperative mood (e.g., "Add XOR module")
- Always run `npx vitest run` and `npm run build` before committing
- Do not push broken builds to `main`

### Branch Strategy
- **`main`** — stable, deployable. All pushes trigger GitHub Pages deployment.
- **Feature branches** — `feature/<name>` for new work (e.g., `feature/primitive-modules`, `feature/ui-editor`)
- **Merge to `main`** when tests pass and work is complete

### When to Create a Branch
Create a new branch at these checkpoints:
1. **Before starting a new sprint backlog step** (e.g., `feature/primitive-modules`, `feature/validation`)
2. **Before any risky or experimental change** — anything that touches `types.ts`, `executor.ts`, or `validation.ts` in a non-additive way
3. **Before UI work begins** — the transition from engine-only to UI is a major boundary
4. **Before adding stateful execution** — this will be the hardest architectural evolution

### Tags (Logical Checkpoints)
Tag `main` at these milestones so we can return to known-good states:
- `v0.1.0` — Engine infrastructure complete (types, validation, executor)
- `v0.2.0` — All V1 primitive modules implemented and tested
- `v0.3.0` — Reference hybrid pipeline passing end-to-end
- `v0.4.0` — Minimal UI functional
- `v0.5.0` — Composite workflow working
- `v0.6.0` — Analysis visibility and stepping working
- `v0.7.0` — Break workflows working
- `v0.8.0` — Guided challenges working
- `v1.0.0` — V1 milestone complete (all features in ENGINE-V1-CONTRACT.md)

### Recovery
If something goes wrong, these tags provide safe rollback points. Use `git log --oneline --graph` to understand history before any reset.

## Key Concepts

- **One unified system, multiple signal domains** — symbol and bits are domains within the same engine, connected by explicit bridge/conversion modules
- **Definition vs Instance vs Runtime** — three distinct data layers
- **Persistence is foundational** — composition creates identity
- **Iterative topological execution** — precomputed order, each module evaluates once per run, deterministic
- **No implicit conversion** — domain transitions require explicit conversion modules

## Key Constraints

- **Engine layer (`src/engine/`) has zero external dependencies** — no UI, no persistence, no side effects
- **Signals are typed** (`symbol` or `bits`) — never silently coerce between domains
- **All transformations are explicit** — every domain conversion must be a visible module in the graph
- **Composite modules are first-class** — they behave identically to primitives
- **Execution is deterministic** — topological sort, synchronous, no side effects in `evaluate()`

## Core Types

```ts
type Signal = { type: 'symbol'; value: string } | { type: 'bits'; value: number[] };
type ModuleDef = { id, name, inputs, outputs, paramSchema, evaluate };
type ModuleInstance = { id, defId, params };
type Connection = { from: { moduleId, port }, to: { moduleId, port } };
type Project = { modules: ModuleInstance[], connections: Connection[] };
type ModuleRegistry = Record<string, ModuleDefinition>;
```

## Tech Stack

- TypeScript (strict mode), Vite + React 18+, Vitest
- Graph rendering: React Flow or custom SVG/Canvas
- State: reducer-backed local UI state (`src/ui/store.ts`) for the current editor slice
- Persistence: localStorage / IndexedDB, JSON serialization

## Architecture

```
src/engine/    — Pure simulation logic (types, modules, graph, executor, composite)
src/ui/        — React visual interface
src/persistence/ — Serialization and storage
src/utils/     — Shared helpers
```

## Code Style

- Strict TypeScript, no `any`
- `interface` over `type` for objects; discriminated unions for signals
- Files: `kebab-case.ts` | Types: `PascalCase` | Functions: `camelCase` | Constants: `UPPER_SNAKE_CASE`
- Pure functions in engine — side effects only in UI and persistence layers

## Testing

- Run tests: `npx vitest run`
- Build check: `npm run build`
- Engine modules need unit tests for all signal type combinations
- Graph execution tested with known-answer vectors
- Composite modules tested for equivalence with expanded graphs

## Development Phases

1. **Engine First** — data models, module evaluation, graph traversal, tests
2. **Minimal UI** — manual module placement, connections, run + display
3. **Usability** — richer connection UX, save/load, inspector polish, theme work
4. **Composition** — composite modules, local library, versioning
5. **Analysis** — step-through, signal tracing, issue surfacing
6. **Break Workflows** — comparison, mutation experiments, eventually break/challenge tooling
7. **Guided Challenges** — classroom tasks, success checks, explainable failure
8. **Modern Primitives** — bit-domain expansion beyond XOR and static sources
9. **V1 Polish & Tutorials** — walkthroughs, finish polish, and classroom-ready guidance

## Current Resume Point

- Resume from current `main` at `v1.31.0`
- `v1.1.0` through `v1.12.0` are already shipped
- `v1.13.0` is now the builder-workflow milestone:
  - multi-select group movement
  - graph-aware `Tidy Layout`
  - blank and saved/deletable personal workspaces
  - composite unzip back into editable internals
- `v1.14.0` is now the cryptographic-operators milestone:
  - `AND`, `OR`, `NOT`
  - `AddMod`, `SubMod`, `Modulo`
  - explicit big-endian fixed-width arithmetic on `bits`
  - width-aware validation for the new operator family
  - `Beyond XOR` demo/tutorial/challenge
- `v1.15.0` is now the control-primitives milestone:
  - `Counter`
  - `Equals`
  - `AtLeast`
  - `Gate`
  - explicit one-bit control semantics on `bits`
  - `Counter Pulse Gate` demo/tutorial/challenge
  - Analyze transformation views for `Equals`, `AtLeast`, and `Gate`
- `v1.16.0` is now the block-framing milestone:
  - `BitSplit` (one `bits` input → two `bits` outputs: `left`/`right`, explicit `leftWidth` param)
  - `BitPad` (one `bits` input → one `bits` output, target width, pad side, pad bit)
  - reuse of existing `BitJoin` for block rejoining
  - width-aware validation for split and pad parameters
  - `Split Transform Rejoin` and `Pad and Split` demo workspaces
  - `Visible Block Boundaries` and `Padding Before Splitting` tutorials
  - `Repair the Split Width` and `Repair the Pad Width` challenges
  - Analyze transformation views for `BitSplit` and `BitPad`
- `v1.17.0` is now the protocol-material milestone:
  - `IV`
  - `Nonce`
  - `Salt`
  - source-only protocol-material helper with shared width-aware validation
  - explicit reject-if-too-long behavior and right-padding for short hex values
  - `Protocol Material Mixer` demo workspace
  - `Protocol Material Is Context` tutorial
  - `Repair the IV` challenge
- `v1.18.0` is now the stream-cipher milestone:
  - `Majority`
  - strict 1-bit width validation for majority inputs
  - Analyze transformation view for `Majority`
  - `Majority-Clocked Keystream` demo workspace
  - `The Majority-Clocked Keystream` tutorial
  - `Repair the Majority Vote` challenge
- `v1.19.0` is now the advanced-rotor milestone:
  - `Rotor` now separates `position` from `ringOffset`
  - `notches` and visible 1-bit `turnover`
  - temporal `clock` edges for stateful-module advance
  - `Advanced Rotor Stepping` demo workspace
  - `Advanced Rotor Stepping` tutorial
  - `Repair the Rotor Notch` challenge
- `v1.20.0` is now the second stream-cipher milestone:
  - `Mux`
  - strict 1-bit selector validation
  - Analyze transformation view for `Mux`
  - `Filtered Keystream` demo workspace
  - `The Filtered Keystream` tutorial
  - `Repair the Filter Selector` challenge
- `v1.21.0` is now the third stream-cipher milestone:
  - `Demux`
  - strict 1-bit routing validation
  - Analyze transformation view for `Demux`
  - `Routed Clock Keystream` demo workspace
  - `The Routed Clock Keystream` tutorial
  - `Repair the Routed Clock` challenge
- `v1.22.0` is now the symbol-permutation milestone:
  - `SymbolPermutation`
  - strict one-to-one symbol-order validation
  - Analyze transformation view for `SymbolPermutation`
  - `Visible Symbol Scramble` demo workspace
  - `Visible Symbol Scramble` tutorial
  - `Repair the Symbol Order` challenge
- `v1.23.0` is now the key-routing milestone:
  - `BitWindow`
  - explicit `start` / `width` sub-key extraction from one visible key bus
  - static out-of-range window validation when upstream width is knowable
  - Analyze transformation view for `BitWindow`
  - `Visible Sub-Key Bus` demo workspace
  - `Visible Sub-Key Bus` tutorial
  - `Repair the Key Window` challenge
- `v1.24.0` is now the symbol-structure milestone:
  - `SymbolWindow`
  - explicit `start` / `width` contiguous symbol-message extraction
  - static out-of-range window validation when input symbol length is knowable
  - Analyze transformation view for `SymbolWindow`
  - `Visible Message Window` demo workspace
  - `Visible Message Window` tutorial
  - `Repair the Message Window` challenge
- `v1.25.0` is now the arithmetic-expansion milestone:
  - `MulMod` (modular multiplication on equal-width bit words)
  - `GreaterThan` (strict comparison emitting 1-bit control)
  - `BitUnpad` (strip padding to recover original width)
  - Analyze transformation view for `GreaterThan` (reuses compare view)
  - `Multiply Compare Unpad` demo workspace
  - `Multiply Compare Unpad` tutorial
  - `Repair the Unpad Width` challenge
- `v1.26.0` is now the number-theoretic foundations milestone:
  - `ModExp` (modular exponentiation via repeated squaring)
  - `ModInverse` (modular multiplicative inverse via extended Euclidean algorithm)
  - modulus-vs-width static validation for both modules
  - `Toy RSA` demo workspace
  - `Key Schedule Workshop` demo workspace
  - `Toy RSA Round-Trip` tutorial
  - `Key Schedule Workshop` tutorial
  - `Repair the RSA Exponent` challenge
  - `Repair the Key Rotation` challenge
- `v1.27.0` is now the transformation-view consolidation milestone:
  - Analyze transformation views for `MulMod`, `ModExp`, `ModInverse`, and `BitUnpad`
  - `arithmetic` view kind for number-word operations (shows expression, bit-level input/output grid)
  - `unpad` view kind for strip operations (mirrors the existing `pad` view)
  - `GreaterThan` compare view text corrected to show strict `A > B` semantics
- `v1.28.0` is now the teaching-pathfinding and hardening milestone:
  - seeded teaching-content audit coverage
  - routed-clock width-validation correction for routed control demos/challenges
  - first shipped learning-sequence UI:
    - stage-aware ordering
    - `Core Path` / `Optional`
    - `Best after`
    - `Recommended next`
- `v1.29.0` is now the bounded bypass milestone:
  - instance-level `bypass` on an explicit allow-list of eligible one-input / one-output same-domain modules
  - validation rejection for ineligible bypass
  - visible inspector toggle and canvas bypass badge
  - `Bypass Workshop` demo/tutorial/challenge
- `v1.30.0` is now the inverse-permutation authoring milestone:
  - `Build Inverse` helper for `Permutation` and `SymbolPermutation`
  - editor-side construction of the true inverse mapping, distinct from reverse order
  - explanatory UI hint clarifying that inverse undoes the current routing
- `v1.31.0` is now the bridge-ergonomics milestone:
  - permissive raw `BitSource` entry for continuous, spaced, or bracketed `0/1` text
  - grouped bit preview in the structured bits editor
  - direct `HexToAscii` bridge for readable 7-bit ASCII byte decoding from hex text

What is shipped on `main`:
- all V1 engine, UI, and workflow milestones
- signal probing and analysis hardening
- ticked/stateful execution engine and UI
- Build / Guide workspace mode (per-project, persisted)
- advanced modern foundry and multi-format bridges
- historical teleprinter / Lorenz teaching loops
- constrained iterators, key-bus distribution, depth tuning
- nested composite/iterator analysis and Feistel teaching loop
- lightweight text cryptanalysis in Compare
- dedicated Cryptanalysis workspace and Vigenere workshop flow
- modern-analysis Avalanche Explorer and guided Avalanche tutorial
- first bounded hashing foundations, demos, and tutorials
- parameter forwarding on reusable architectures
- transformation views for `Permutation`, `BitShifter`, `XOR`, and `SBox`
- Hashing V1 milestone framing through `v1.7.0`
- first two bounded hash collision challenges:
  - compression-hash collision
  - sponge-hash collision
  - project-aware challenge ownership
  - sponge-hash digest-path correction with audit-style regression tests
- first bounded post-collision interpretation slice:
  - side-by-side original vs colliding message comparison
  - post-success nudges into `Analyze` and `Modern Cryptanalysis`
  - internal-divergence helper based on `analysisTrace`
  - sponge-hardening asymmetry fix removing the paired-step shortcut
  - bundle/performance guardrails and build-time chunk budget enforcement
- first bounded tactile primitive authoring slice:
  - `SBox` grid editor with synced raw CSV
  - `Permutation` wire editor with synced raw CSV fallback
  - `Reflector` socket-pair editor with involution-safe pairing
  - `Rotor` wire editor with runtime-centered anchors and dotted endpoints
  - reflector validation hardening
- first bounded block-framing vocabulary:
  - `BitSplit` and `BitPad` primitives on `bits`
  - width-aware validation for split and pad parameters
  - `Split Transform Rejoin` and `Pad and Split` demos, `Visible Block Boundaries` and `Padding Before Splitting` tutorials, `Repair the Split Width` and `Repair the Pad Width` challenges
  - Analyze transformation views for `BitSplit` and `BitPad`
- first bounded protocol-material vocabulary:
  - `IV`, `Nonce`, and `Salt` source modules on `bits`
  - shared width-aware validation and explicit reject-if-too-long behavior
  - `Protocol Material Mixer` demo, `Protocol Material Is Context` tutorial, and `Repair the IV` challenge
- first bounded stream-cipher vocabulary:
  - `Majority`
  - strict 1-bit width validation for the three vote inputs
  - `Majority-Clocked Keystream` demo, `The Majority-Clocked Keystream` tutorial, and `Repair the Majority Vote` challenge
  - Analyze transformation view for `Majority`
- first bounded advanced-rotor realism vocabulary:
  - `ringOffset`, `notches`, and visible `turnover` on `Rotor`
  - temporal `clock` handling for stateful advance edges
  - explicit turnover-driven double-step wiring via `Clock`, `OR`, and `Gate`
  - `Advanced Rotor Stepping` demo/tutorial/challenge
- second bounded stream-cipher vocabulary:
  - `Mux`
  - strict 1-bit selector validation
  - `Filtered Keystream` demo, `The Filtered Keystream` tutorial, and `Repair the Filter Selector` challenge
  - Analyze transformation view for `Mux`
- first bounded symbol/message-structure vocabulary:
  - `SymbolWindow` for contiguous symbol-domain extraction
  - static out-of-range window validation when input length is knowable
  - `Visible Message Window` demo, tutorial, and `Repair the Message Window` challenge
  - Analyze transformation view for `SymbolWindow`
- first bounded arithmetic-expansion vocabulary:
  - `MulMod` for modular multiplication on equal-width bit words
  - `GreaterThan` for strict comparison emitting 1-bit control
  - `BitUnpad` for stripping padding to recover original width
  - `Multiply Compare Unpad` demo, tutorial, and `Repair the Unpad Width` challenge
- first bounded number-theoretic foundations vocabulary:
  - `ModExp` for modular exponentiation via repeated squaring
  - `ModInverse` for modular multiplicative inverse via extended Euclidean algorithm
  - `Toy RSA` and `Key Schedule Workshop` demos, tutorials, and challenges

Key contracts to check before implementation:
- `ENGINE-V1-CONTRACT.md` for engine decisions
- `ADVANCED-FOUNDRY-CLOCK-V1.md` for ticked execution decisions (especially §7 for deferred work)
- `ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md` for bounded iterator decisions
- `KEY-SCHEDULE-GROUNDWORK-V1.md` for explicit round-key decisions
- `CRYPTANALYSIS-WORKSPACE-V1.md` for product boundary and first-slice scope
- `MODERN-ANALYSIS-V1.md` for the first post-`v1.4.0` visual analysis milestone
- `HASHING-V1.md` for the current hashing line and scope boundary
- `HASH-COLLISION-CHALLENGE-V1.md` for the first bounded post-hashing milestone challenge slice
- `SPONGE-COLLISION-CHALLENGE-V1.md` for the shipped sponge-collision follow-on
- `POST-COLLISION-INTERPRETATION-V1.md` for the shipped first interpretation milestone after the collision challenges
- `CUSTOM-SBOX-AUTHORING-V1.md` for the shipped substitution-table authoring slice
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md` for the new long-range language/roadmap framing
- `CRYPTO-OPERATORS-V1.md` for the shipped first bounded operator-expansion line
- `CONTROL-PRIMITIVES-V1.md` for the shipped first bounded control/counter/gate line
- `BLOCK-FRAMING-V1.md` for the shipped first bounded block-framing vocabulary
- `PROTOCOL-MATERIAL-V1.md` for the shipped first bounded protocol-input slice
- `ADVANCED-ROTOR-REALISM-V1.md` for the shipped first bounded rotor-realism slice
- `STREAM-CIPHER-V2.md` for the shipped second bounded stream-machine slice
- `ARITHMETIC-EXPANSION-V1.md` for the shipped first bounded arithmetic-expansion line
- `NUMBER-THEORETIC-V1.md` for the shipped first bounded number-theoretic foundations
- `BYPASS-V1.md` for the shipped bounded instance-level bypass line
- `INVERSE-PERMUTATION-AUTHORING-V1.md` for the shipped bounded inverse-permutation authoring slice
- `BRIDGE-ERGONOMICS-V1.md` for the shipped bounded bridge/usability slice
- `PARAM-FORWARDING-V1.md` for explicit exposed-internal controls on composites and iterators
- `TRANSFORMATION-VISUALIZATION-V1.md` for the shipped first primitive transformation milestone
- `SBOX-TRANSFORMATION-V1.md` for the shipped first lookup/substitution visual family

Near-term follow-ups:
- treat the next phase as expressive machine-language growth, not just the next isolated feature
- continue from shipped operator/control/framing/protocol-material/stream/rotor foundations toward the next missing language family
- keep future rotor follow-ons bounded:
  - reversible rotation direction
  - flipped insertion
  - deeper rotor-bank realism only if it remains explicit
- plan tutorials and challenges alongside any new primitive family so the language and teaching layers grow together
- treat `WORKBENCH-ERGONOMICS-V1.md`, `WORKSPACE-LIBRARY-V1.md`, and `COMPOSITE-UNZIP-V1.md` as shipped first-milestone builder foundations
- avoid widening workspace library into sharing/folders or unzip into bulk/iterator expansion without a new contract
- keep hashing connected to the modern-analysis and transformation-visualization surfaces
- keep bundle growth inside the new guardrails
- monitor challenge-induced project switching in classroom use before adding warnings
- avoid opening a second transformation-visualization slice before classroom feedback

## When Working on This Project

- Always check `ENGINE-V1-CONTRACT.md` for locked decisions before implementation
- The engine must remain independent — if you need to import from `ui/` or `persistence/` into `engine/`, stop and rethink
- Prefer small, focused modules — each primitive does one transformation
- Validate signal types at port boundaries, not inside module logic
- Remember: this is an educational tool for a cybersecurity teacher's classroom
