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
- a released minimal editor UI on `main` at `v0.4.0`
- an active composite-module groundwork branch at `feature/composite-groundwork`

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
- multi-agent coordination and implementation contract

Active next steps:
- composite definition model
- composite persistence/library layer
- composite validation and execution semantics
- minimal composite UI proof

## Key Documents

- `PROJECT.md`: product vision and full specification
- `ENGINE-V1-CONTRACT.md`: locked implementation decisions for the current engine slice
- `COMPOSITE-V1-CONTRACT.md`: locked direction for the composite groundwork branch
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

The current editor milestone already supports adding, deleting, moving, and connecting modules.

The next meaningful product milestones are:

```text
save/load projects -> reusable composition -> deeper execution visibility
```

The canonical hybrid reference pipeline remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```
