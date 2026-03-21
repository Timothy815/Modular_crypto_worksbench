# MCW — Codex Agent Context

Read PROJECT.md for full project specification.
Read ENGINE-V1-CONTRACT.md for locked implementation decisions.

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
1. Before starting a new sprint backlog step (e.g., `feature/primitive-modules`, `feature/validation`)
2. Before any risky or experimental change — anything that touches `types.ts`, `executor.ts`, or `validation.ts` in a non-additive way
3. Before UI work begins — the transition from engine-only to UI is a major boundary
4. Before adding stateful execution — this will be the hardest architectural evolution

### Tags (Logical Checkpoints)
Tag `main` at these milestones for safe rollback points:
- `v0.1.0` — Engine infrastructure complete (types, validation, executor)
- `v0.2.0` — All V1 primitive modules implemented and tested
- `v0.3.0` — Reference hybrid pipeline passing end-to-end
- `v0.4.0` — Minimal UI functional
- `v0.5.0` — Save/load working
- `v1.0.0` — V1 milestone complete

### Recovery
If something goes wrong, tags provide safe rollback points. Use `git log --oneline --graph` to understand history before any reset.

## Key Constraints

- Engine layer (`src/engine/`) has zero external dependencies — no UI, no persistence, no side effects
- Signals are typed (`symbol` or `bits`) — never silently coerce between domains
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

## Tech Stack

- TypeScript (strict mode), Vite + React 18+, Vitest
- Graph rendering: React Flow or custom SVG/Canvas
- State: reducer-backed local UI state (`src/ui/store.ts`) for the current editor slice
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
- Graph execution tested with known-answer vectors

## Important Rules

- The engine must remain independent — never import from `ui/` or `persistence/` into `engine/`
- Validate signal types at port boundaries, not inside module logic
- No hidden conversions — if symbol-to-bit conversion is needed, it must be an explicit `SymbolToBits` module in the graph
- All module `evaluate()` functions must be pure
- Check ENGINE-V1-CONTRACT.md for locked decisions before making implementation choices
