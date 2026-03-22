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
- released UI/editor milestones on `main` through `v0.9.0`
- an active v1 polish/tutorial branch at `feature/v1-polish-and-tutorials`

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
- guided challenges
- multi-agent coordination and implementation contract

Active next steps:
- modern bit-domain primitive expansion
- first modern demo graphs
- proving MCW can teach beyond XOR/bridge-era examples

## Key Documents

- `PROJECT.md`: product vision and full specification
- `ENGINE-V1-CONTRACT.md`: locked implementation decisions for the current engine slice
- `COMPOSITE-V1-CONTRACT.md`: locked direction for the composite groundwork branch
- `BREAK-V1-CONTRACT.md`: locked direction for the first break-workflows branch
- `GUIDED-CHALLENGES-V1-CONTRACT.md`: locked direction for the first classroom challenge branch
- `MODERN-PRIMITIVES-V1-CONTRACT.md`: locked direction for the first modern primitive expansion branch
- `V1-POLISH-AND-TUTORIALS.md`: locked direction for the final v1 finish branch
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
interrogating modules, comparing broken variants against captured baselines, and running guided
classroom challenges.

The active branch is now turning the shipped workbench into a final v1 educational product:
- guided walkthroughs/tutorials
- shell and panel polish
- classroom-ready finish quality

The first proof on this branch now includes:
- branch contract
- seeded tutorial definitions
- reducer-backed tutorial session state
- first walkthrough panel in the app shell

The next meaningful product milestones after this branch are:

```text
build -> analyze -> break -> guided challenge -> modern primitive expansion -> v1 polish/tutorials
```

The canonical hybrid reference pipeline remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```
