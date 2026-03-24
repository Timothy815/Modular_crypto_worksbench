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

- Resume from current `main`
- `v1.1.0` and `v1.2.0` are already shipped
- `v1.3.0` is already shipped
- `v1.4.0` is already shipped
- `v1.5.0` is already shipped
- `v1.6.0` is already shipped
- `v1.7.0` is already shipped
- `v1.8.0` is already shipped
- `v1.9.0` is already shipped
- `v1.10.0` is already shipped
- `v1.11.0` is already shipped
- `v1.12.0` is already shipped
- Current `main` is beyond the first tactile primitive authoring milestone and should treat rotor realism as a new bounded decision, not assumed scope

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
- `PARAM-FORWARDING-V1.md` for explicit exposed-internal controls on composites and iterators
- `TRANSFORMATION-VISUALIZATION-V1.md` for the shipped first primitive transformation milestone
- `SBOX-TRANSFORMATION-V1.md` for the shipped first lookup/substitution visual family

Near-term follow-ups:
- decide whether advanced rotor realism should deepen next or remain deferred after classroom feedback
- keep advanced rotor realism explicitly on the future docket:
  - `ringOffset` separate from `position`
  - notch / turnover behavior
  - double-step logic
  - reversible rotation direction
  - flipped insertion
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
