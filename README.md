# Modular Cryptography Workbench

Modular Cryptography Workbench (MCW) is a visual cryptographic construction environment built around typed signal-flow graphs.

Instead of selecting a prebuilt cipher, users assemble machines from parts:
- symbol-domain modules such as rotors and reflectors
- bit-domain modules such as XOR and key sources
- explicit bridge modules such as `SymbolToBits` and `BitsToSymbol`

The goal is to make cryptographic structure visible. MCW is designed as a workshop, not a museum.

## Current State

The repository now has:
- a stable engine milestone
- released UI/editor milestones on `main` through `v0.6.0`
- an active break-workflows branch at `feature/break-workflows`

Implemented and locked so far:
- engine core types
- graph validation
- iterative topological executor
- V1 primitive modules
- hybrid reference pipeline tests
- reducer-backed minimal UI shell
- draggable visual workbench
- palette-driven module creation
- port-to-port connection editing
- structured parameter editors
- workbench persistence and JSON import/export
- sticky-note annotations
- dark mode token groundwork
- reusable composite workflows
- analysis visibility and step-through execution
- multi-agent coordination and implementation contract

Active next steps:
- comparison-first break workflows
- baseline vs variant execution comparison
- mutation visibility inside the inspector
- first-divergence analysis and canvas highlighting

## Key Documents

- `PROJECT.md`: product vision and full specification
- `ENGINE-V1-CONTRACT.md`: locked implementation decisions for the current engine slice
- `COMPOSITE-V1-CONTRACT.md`: locked direction for the composite groundwork branch
- `BREAK-V1-CONTRACT.md`: locked direction for the first break-workflows branch
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

## Short-Term Goal

The current shipped workbench already supports adding, deleting, moving, connecting, composing,
and interrogating modules.

The active branch is now extending that into comparison-first break workflows:
- capture the current workbench as a baseline
- mutate the live graph as a variant
- compare outputs and first divergence
- surface changed params and divergent nodes clearly

The next meaningful product milestones after this branch are:

```text
build -> analyze -> break
```

The canonical hybrid reference pipeline remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```
