# MCW — Codex Agent Context

Read `ACTIVE-DOCS.md` first for the current live documentation surface.
Read `PROJECT.md` for full project specification.
Read `ENGINE-V1-CONTRACT.md` for locked implementation decisions.
Read `IMPLEMENTATION-STATUS.md` for the authoritative shipped-feature record and safe-next-task guidance.
Read `EXPERIENTIAL-NORTH-STAR-V1.md` for the experiential standard all future slices are evaluated against: the workbench should feel like working on a live machine, not assembling a static diagram.

**Before starting any work:** verify in source that a contract is genuinely unshipped. AGENTS.md drifts; the code does not. `IMPLEMENTATION-STATUS.md` is the authoritative record.

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

All tags through `v2.0.0` are shipped on `main`.

| Tag | Milestone |
|---|---|
| `v0.2.0` | Primitive engine |
| `v0.4.0` | Minimal UI shell |
| `v0.5.0` | Composite workflow |
| `v1.0.0` | V1 milestone complete |
| `v1.13.0` | Builder workflow (multi-select, Tidy Layout, workspace library, composite unzip) |
| `v1.44.0` | Protocol handshakes |
| `v2.0.0` | Cryptographic Systems IDE boundary |

For current release policy, read `RELEASE-VERSIONING.md`.

### Recovery
Use `git log --oneline --graph` to understand history before any reset.

## Key Constraints

- Engine layer (`src/engine/`) has zero external dependencies — no UI, no persistence, no side effects
- Signals are typed — never silently coerce between domains
- All transformations are explicit — every domain conversion must be a visible module in the graph
- Composite modules are first-class — they behave identically to primitives
- Execution is deterministic — iterative topological order, synchronous, no side effects in `evaluate()`

## Core Types

```ts
type Signal = { type: 'symbol'; value: string } | { type: 'bits'; value: number[] };
type ModuleDef = { id, name, inputs, outputs, paramSchema, evaluate };
type ModuleInstance = { id, defId, params };
type Connection = { from: { moduleId, port }, to: { moduleId, port } };
type Project = { modules: ModuleInstance[], connections: Connection[] };
type ModuleRegistry = Record<string, ModuleDef>;
```

## Signal Domains (current)

Four signal domains exist:

| Domain | Value type | Notes |
|---|---|---|
| `symbol` | `string` | Text, single characters, or ASCII |
| `bits` | `number[]` | Array of 0/1 values, explicit width |
| `integer` | `string` (decimal) | Arbitrary-precision non-negative integer |
| `ec-point` | `EcPointSignalValue` | Affine point or infinity, with embedded curve descriptor |

Bridges between domains must always be explicit visible modules in the graph.

## Tech Stack

- TypeScript (strict mode), Vite + React 18+, Vitest
- Graph rendering: custom SVG/Canvas
- State: reducer-backed local UI state (`src/ui/store.ts`)
- Persistence: localStorage / IndexedDB

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
- Seeded-content tests in `starter-challenges.ts` catch demo/challenge drift

## Important Rules

- The engine must remain independent — never import from `ui/` or `persistence/` into `engine/`
- Validate signal types at port boundaries, not inside module logic
- No hidden conversions — if symbol-to-bit conversion is needed, it must be an explicit module in the graph
- All module `evaluate()` functions must be pure
- Check `ENGINE-V1-CONTRACT.md` for locked decisions before making implementation choices

## Current State (as of May 2026)

**`v2.0.0` is shipped.** MCW is a full cryptographic systems IDE.

**Post-`v2.0.0` additions on `main` (all shipped):**

- **REAL-SCALE-ARITHMETIC-SUBSTRATE-V1**: `bigint-hex` param kind added. `EcCurveDescriptor.p/a/b` now `bigint`. `Number.isSafeInteger` ceiling lifted from all ECC and field arithmetic modules. secp256k1 and P-256 operate at real scale.
- **NAMED-CURVE-SOURCES-V1**: `NamedCurveBasePoint` module with secp256k1 and P-256 presets. Inspector "Load Curve Preset" helper.
- **GF2-FIELD-ARITHMETIC-V1**: `GF2Mul` and `GF2Inv` over GF(2⁸) with configurable reduction polynomial (default AES 0x11B). Python export parity included. `Visible MixColumns` demo, tutorial, and challenge using NIST FIPS 197 test vector [D4,BF,5D,30] → [04,66,81,E5] — all four output bytes correct.

**Genuine next open work:**
Full visible AES round — SubBytes (GF2Inv + affine transform over GF(2⁸), XOR with 0x63) + ShiftRows (byte permutation) + AddRoundKey (XOR) to go with the already-shipped MixColumns. All math foundations are in place.

**Bundle guard:** `maxChunk` is 330 KiB. demo-data chunk is currently ~327 KiB. Watch this before adding more large demos.

## Key Contracts to Check Before Implementation

- `ENGINE-V1-CONTRACT.md` — locked engine decisions (always check)
- `ADVANCED-FOUNDRY-CLOCK-V1.md` — ticked execution decisions
- `docs/live/contracts/2026-05/REAL-WORLD-CRYPTO-CAPABILITY-ROADMAP-V1.md` — overall real-scale trajectory
- `docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md` — GF(2⁸) scope and AES path (historical context for next AES round slice)
- `docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md` — ECC line scope and bounds
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md` — long-range vocabulary direction

For any contract not listed here, check `ACTIVE-DOCS.md` for the current live contract directory.
