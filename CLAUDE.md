# MCW — Claude Code Context

Read `ACTIVE-DOCS.md` first for the current live documentation surface and archive policy.
Read `AI-COLLABORATION-CONTINUITY.md` for standing team roles, reviewer workflow, and restart expectations.
Read `PROJECT.md` for full project specification.
Read `ENGINE-V1-CONTRACT.md` for locked implementation decisions.
Read `IMPLEMENTATION-STATUS.md` for the authoritative shipped-feature record and safe-next-task guidance.
Read `EXPERIENTIAL-NORTH-STAR-V1.md` before proposing any slice that affects how the workbench feels to use.

Before starting work on any named slice or contract:
- check `ACTIVE-DOCS.md` and `IMPLEMENTATION-STATUS.md` first
- if the contract is not at repo root, search `docs/live/contracts/` or `docs/archive/`
- if the contract status says `Shipped`, `Completed`, `Closed`, `Superseded`, or `Recorded`, treat it as historical context, not open work
- if the contract has no clear status, **verify in source** before treating it as active — CLAUDE.md drifts; the code does not

For legacy contract lookup:
- use `rg --files -g '*.md' . docs/archive` to find the document
- prefer live root docs for active planning/context
- prefer `docs/archive/contracts/` for shipped historical implementation contracts

## Project: Modular Cryptography Workbench

A visual, composable cryptographic construction environment — a "cryptographic erector set" inspired by modular synthesizers. Cryptography as a signal-processing system: data flows through typed transformation modules connected in a DAG.

Educational tool for a cybersecurity teacher's classroom. MCW is now a cryptographic systems IDE: `Author / Understand / Verify / Export`.

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
- **Feature branches** — `feature/<name>` for risky or experimental changes

### Stable Release Tags

| Tag | Milestone |
|---|---|
| `v0.2.0` | Primitive engine |
| `v0.4.0` | Minimal UI shell |
| `v0.5.0` | Composite workflow |
| `v0.6.0` | Analysis visibility |
| `v0.7.0` | Break workflow |
| `v0.8.0` | Guided challenges |
| `v1.0.0` | V1 milestone complete |
| `v1.1.0` – `v1.12.0` | Ticked execution through tactile authoring |
| `v1.13.0` | Builder workflow (multi-select, Tidy Layout, workspace library, composite unzip) |
| `v1.14.0` – `v1.27.0` | Cryptographic operators through transformation-view consolidation |
| `v1.28.0` – `v1.44.0` | Teaching pathfinding through protocol handshakes |
| `v1.45.0` – `v1.48.0` | Learning sequence V2 through large workspace orientation |
| `v2.0.0` | Cryptographic Systems IDE boundary |

All tags through `v2.0.0` are shipped on `main`.

### Recovery
Use `git log --oneline --graph` to understand history before any reset.

## Key Concepts

- **One unified system, multiple signal domains** — symbol, bits, integer, and ec-point are four distinct signal domains within the same engine, connected by explicit bridge/conversion modules
- **Definition vs Instance vs Runtime** — three distinct data layers
- **Persistence is foundational** — composition creates identity
- **Iterative topological execution** — precomputed order, each module evaluates once per run, deterministic
- **No implicit conversion** — domain transitions require explicit conversion modules

## Key Constraints

- **Engine layer (`src/engine/`) has zero external dependencies** — no UI, no persistence, no side effects
- **Signals are typed** (`symbol`, `bits`, `integer`, or `ec-point`) — never silently coerce between domains
- **All transformations are explicit** — every domain conversion must be a visible module in the graph
- **Composite modules are first-class** — they behave identically to primitives
- **Execution is deterministic** — topological sort, synchronous, no side effects in `evaluate()`

## Core Types

```ts
type SignalType = 'symbol' | 'bits' | 'integer' | 'ec-point';
type Signal =
  | { type: 'symbol'; value: string }
  | { type: 'bits'; value: number[] }
  | { type: 'integer'; value: string }        // hex string, no 0x prefix
  | { type: 'ec-point'; value: EcPointSignalValue };  // affine {x,y} or infinity
type ModuleDef = { id, name, inputs, outputs, paramSchema, evaluate };
type ModuleInstance = { id, defId, params };
type Connection = { from: { moduleId, port }, to: { moduleId, port } };
type Project = { modules: ModuleInstance[], connections: Connection[] };
type ModuleRegistry = Record<string, ModuleDefinition>;
```

## Tech Stack

- TypeScript (strict mode), Vite + React 18+, Vitest
- Graph rendering: custom SVG/Canvas
- State: reducer-backed local UI state (`src/ui/store.ts`)
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
- Graph execution tested with known-answer vectors (NIST FIPS 197, etc.)
- Composite modules tested for equivalence with expanded graphs
- Seeded-content tests in `starter-challenges.ts` catch demo/challenge drift

## Current State (as of June 2026)

**`v2.0.0` is shipped.** MCW is a full cryptographic systems IDE with:
- complete primitive vocabulary through GF(2⁸) field arithmetic (`GF2Mul`, `GF2Inv`)
- full ECC teaching line: point mechanics, scalar multiplication, ECDH, Schnorr signatures
- full asymmetric teaching line: RSA, DH, AEAD, digital signatures, protocol handshakes
- Python export parity for all 149 primitives (4 intentionally excluded: AesConsequenceSummary, KeyedSBox4, PointSelector, ToyPointMap)
- substantial builder UX: orthogonal routing, stage group boxes, minimap, node rotation, alignment guides, Tidy Layout, multi-select, cross-workspace clipboard, wire coloring
- UI-driven composite authoring: select modules → Save as Composite → unzip; port name customization; validation
- verification station with known-vector import and export parity workflow
- multi-window detachable panels, shareable lab packs, instructor pilot pack

**Post-`v2.0.0` additions on `main` (through June 2026):**
- `REAL-SCALE-ARITHMETIC-SUBSTRATE-V1`: `bigint-hex` param kind, lifted `Number.isSafeInteger` ceiling
- `NAMED-CURVE-SOURCES-V1`: `NamedCurveBasePoint` with secp256k1 and P-256 presets
- `GF2-FIELD-ARITHMETIC-V1`: `GF2Mul` and `GF2Inv` over GF(2⁸) in the bits domain
- All four AES round operations individually visible with demos, tutorials, FIPS 197 vectors, and challenges: MixColumns, SubBytes, ShiftRows, AddRoundKey
- `AES-ROUND-COMPOSITE-V1`: `AesRound` composite (SubBytes→ShiftRows→MixColumns→AddRoundKey, bits[128] ports), FIPS 197 Appendix B verified
- `aes-4-round` demo: 4-round chained AES using `AesRound` composite with FIPS 197 key schedule
- `visible-aes-key-schedule` demo, tutorial, and `Repair the AES Rcon` challenge
- AES consequence boards: row-rotation perturbation, MixColumns-coefficient perturbation, local consequence analysis
- Keyed S-box authoring board with 2-bit key selection over explicit 4-bit table family
- GF2/AES Python export parity: `GF2Mul` and `GF2Inv` produce correct Python; FIPS 197 verify_parity.py passes
- Visible double-and-add ECC board; toy-curve point map
- All classical ciphers: Vigenere (encryption board + tutorial + challenge), columnar transposition
- Consequence boards: stream cipher IV reuse, CBC padding oracle, Schnorr nonce reuse, ECDH low-order point
- Hash teaching: SHA-256 round decomposition, toy sponge hash
- Protocol boards: TLS-adjacent handshake
- Student progress tracking with session report download
- Verification station: in-product PASS/FAIL explanation; student-first onboarding (Quick Start, Atlas, first-timer tips)
- Palette reorganization: `Elliptic Curves & Fields` section; optgroup filter dropdown
- EC point inspector: stacked card layout for real-scale coordinates; `formatSignalCompact` in trace/stepper contexts
- F-key shortcut: frame selection or frame workspace
- 16 built-in composites in `STARTER_COMPOSITE_LIBRARY` (AesRound, Feistel, Hash, Sponge, Enigma helpers, and more)
- 149 engine modules, 111 demos, 112 tutorials, 83 challenges

**Genuine next open work (verified against source June 2026):**
- AES decryption primitives (`InvSubBytes`, `InvShiftRows`, `InvMixColumns`) — not in engine; no decrypt path exists
- Full 10-round AES-128 (current `aes-4-round` demo stops at 4 rounds; final round also differs — no MixColumns)
- Bundle headroom is tight: `maxChunk` is at 450 KiB with demo-data near the ceiling — any large new demo risks hitting the guard

**Bundle guard:** `maxChunk` is 450 KiB. demo-data chunk sits near the ceiling. Watch before adding more large demos.

## Key Contracts to Check Before Implementation

- `ENGINE-V1-CONTRACT.md` — locked engine decisions (always check)
- `ADVANCED-FOUNDRY-CLOCK-V1.md` — ticked execution decisions
- `ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md` — bounded iterator decisions
- `docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md` — GF(2⁸) scope and AES path (shipped; use as historical context for the next AES composite slice)
- `docs/live/contracts/2026-05/REAL-WORLD-CRYPTO-CAPABILITY-ROADMAP-V1.md` — overall real-scale trajectory
- `docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md` — ECC line scope and bounds
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md` — long-range language direction
- `HASHING-V1.md` — hashing line scope boundary
- `HASH-COLLISION-CHALLENGE-V1.md` / `SPONGE-COLLISION-CHALLENGE-V1.md` — collision challenge bounds

For any contract not listed here, check `ACTIVE-DOCS.md` for the current live contract directory.

## When Working on This Project

- Always check `ENGINE-V1-CONTRACT.md` for locked decisions before implementation
- The engine must remain independent — if you need to import from `ui/` or `persistence/` into `engine/`, stop and rethink
- Prefer small, focused modules — each primitive does one transformation
- Validate signal types at port boundaries, not inside module logic
- Verify in source that a contract is unshipped before implementing — IMPLEMENTATION-STATUS.md is authoritative
- Remember: this is an educational tool for a cybersecurity teacher's classroom
