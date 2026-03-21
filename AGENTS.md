# MCW — Codex Agent Context

Read PROJECT.md for full project specification.

## Project: Modular Cryptography Workbench

A visual, composable cryptographic construction environment — a "cryptographic erector set" inspired by modular synthesizers. Cryptography as a signal-processing system: data flows through typed transformation modules connected in a DAG.

## Key Concepts

- **One unified system, multiple signal domains** — symbol and bits are domains within the same engine, connected by explicit bridge/conversion modules. Not two separate systems.
- **Definition vs Instance vs Runtime** — three distinct data layers. Definitions are blueprints, instances are placed modules, runtime state is ephemeral.
- **Persistence is foundational** — composition creates identity. Composite modules are versioned, projects bind to specific versions.
- **Pull-based execution** — request output from final node, recursively resolve inputs, topological sort, synchronous, deterministic.
- **No implicit conversion** — domain transitions require explicit conversion modules. This is a teaching feature.

## Key Constraints

- Engine layer (`src/engine/`) has zero external dependencies — no UI, no persistence, no side effects
- Signals are typed (`symbol` or `bits`) — never silently coerce between domains
- All transformations are explicit — every domain conversion must be a visible module in the graph
- Composite modules are first-class — they behave identically to primitives
- Execution is deterministic — topological sort, synchronous, no side effects in `evaluate()`

## Core Types

```ts
type Signal = { type: 'symbol'; value: string } | { type: 'bits'; value: number[] };
type ModuleDef = { id, name, inputs, outputs, params, evaluate };
type ModuleInstance = { id, defId, params };
type Connection = { from: { moduleId, port }, to: { moduleId, port } };
type Project = { modules: ModuleInstance[], connections: Connection[] };
```

## Tech Stack

- TypeScript (strict mode), Vite + React 18+, Vitest
- Graph rendering: React Flow or custom SVG/Canvas
- State: Zustand or React context
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
- Engine modules need unit tests for all signal type combinations
- Graph execution tested with known-answer vectors

## Development Phases

1. **Engine First** — data models, module evaluation, graph traversal, tests
2. **Minimal UI** — manual module placement, connections, run + display
3. **Usability** — drag-and-drop, save/load, inspector
4. **Composition** — composite modules, local library, versioning
5. **Expansion** — more modules, step-through, signal tracing, templates

## Important Rules

- The engine must remain independent — never import from `ui/` or `persistence/` into `engine/`
- Validate signal types at port boundaries, not inside module logic
- No hidden conversions — if symbol-to-bit conversion is needed, it must be an explicit `SymbolToBits` module in the graph
- All module `evaluate()` functions must be pure
- Check PROJECT.md for the full specification before making architectural decisions
