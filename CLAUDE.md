# MCW — Claude Code Context

Read PROJECT.md for full project specification.
Read ENGINE-V1-CONTRACT.md for locked implementation decisions.
Read ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md before starting work on iterative-round abstractions or key-schedule groundwork.
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

- Resume from `main` at `d5364bd`
- All V1 milestones shipped through `v1.0.1`
- Post-v1 advanced foundry slice merged (ticked execution + Build/Guide mode)

What is shipped on `main`:
- all V1 engine, UI, and workflow milestones
- signal probing and analysis hardening
- ticked/stateful execution engine and UI
- Build / Guide workspace mode (per-project, persisted)

Key contracts to check before implementation:
- `ENGINE-V1-CONTRACT.md` for engine decisions
- `ADVANCED-FOUNDRY-CLOCK-V1.md` for ticked execution decisions (especially §7 for deferred work)

Near-term follow-ups:
- tag `v1.1.0` after Gemini review
- tutorial content deepening
- conditional clocking (Enigma double-stepping)
- composite statefulness (recursive advance)
- authored tutorials for custom composites

## When Working on This Project

- Always check `ENGINE-V1-CONTRACT.md` for locked decisions before implementation
- The engine must remain independent — if you need to import from `ui/` or `persistence/` into `engine/`, stop and rethink
- Prefer small, focused modules — each primitive does one transformation
- Validate signal types at port boundaries, not inside module logic
- Remember: this is an educational tool for a cybersecurity teacher's classroom
