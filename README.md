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
- released UI/editor milestones on `main` through `v0.7.0`
- an active guided-challenges branch at `feature/guided-challenges`

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
- comparison-first break workflows
- multi-agent coordination and implementation contract

Active next steps:
- classroom-facing guided challenges
- target behavior comparison for student machines
- first reusable challenge session flow
- explainable success/failure status in the workbench

## Key Documents

- `PROJECT.md`: product vision and full specification
- `ENGINE-V1-CONTRACT.md`: locked implementation decisions for the current engine slice
- `COMPOSITE-V1-CONTRACT.md`: locked direction for the composite groundwork branch
- `BREAK-V1-CONTRACT.md`: locked direction for the first break-workflows branch
- `GUIDED-CHALLENGES-V1-CONTRACT.md`: locked direction for the first classroom challenge branch
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
interrogating modules, and comparing broken variants against captured baselines.

The active branch is now extending that into guided challenges:
- present a clear classroom task
- compare a student machine against target behavior
- report success or failure in an explainable way
- reuse the existing build/analyze/break surfaces instead of hiding the machine

The first proof on this branch now includes:
- one seeded repair challenge
- a challenge panel with explicit prompt and status
- target-behavior checking against the live workbench

The next meaningful product milestones after this branch are:

```text
build -> analyze -> break -> guided challenge
```

The canonical hybrid reference pipeline remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```
