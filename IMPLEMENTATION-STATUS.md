# MCW — Implementation Status

Last updated: March 22, 2026

---

## Current State

The project has shipped all V1 milestones through `v1.0.1` on `main`, plus a post-v1
advanced foundry slice (`feature/advanced-foundry-clock`, now merged) that adds stateful
ticked execution and a Build / Guide workspace mode.

Current `main` HEAD: `d5364bd` (Add build and guide workspace modes)

Established and shipped:
- implementation contract and AI coordination protocol
- engine core type definitions, graph validation, param validation
- iterative topological executor
- V1 primitive module set (symbol + bit domains, bridges, modern primitives)
- hybrid reference pipeline tests
- reducer-backed UI shell with visual workbench canvas
- add / delete / move / connect editor fundamentals
- module-role color coding in palette and canvas
- structured parameter editors for `bits` and `wiring`
- workbench persistence (autosave/restore + JSON import/export)
- sticky-note annotations
- dark mode token groundwork
- reusable composite workflows (composite V1 contract)
- analysis/debugging visibility and step-through execution
- signal-path trace filtering
- comparison-first break workflows
- guided challenges
- modern primitive expansion (LFSR, SBox, Permutation, BitShifter)
- tutorial walkthrough system with reducer-backed session state
- signal probing (pin/unpin live module I/O in Analyze tab)
- ticked execution engine (`StatefulModuleDef`, `TickSliceableModuleDef`, `executeTickedProject`)
- per-tick source slicing (TextInput, BitSource) and `deriveTickCount`
- ticked execution UI (tick bar, scrubber, collected output, per-tick inspector state)
- Build / Guide workspace mode (per-project, persisted)
- GitHub Pages deployment workflow

---

## Locked In Code

The following decisions are reflected in shipped code:
- iterative topological execution (V1: stateless; V1.1+: ticked stateful wrapper)
- required graph validation before execution
- minimal `ParamSchema`
- `advance` is pure and opt-in per module (Rotor ships with advance)
- `tickSlice` / `tickLength` are module-provided, not executor-provided
- composite statefulness is explicitly deferred (composites containing stateful modules treated as stateless)
- workspace mode (`'build' | 'guide'`) gates tutorial overlays without clearing tutorial state

---

## Stable Releases on `main`

| Tag | Milestone |
|---|---|
| `v0.2.0` | Primitive engine |
| `v0.4.0` | Minimal UI shell |
| `v0.5.0` | Composite workflow |
| `v0.6.0` | Analysis visibility |
| `v0.7.0` | Break workflow |
| `v0.8.0` | Guided challenges |
| `v1.0.0` | V1 milestone complete |
| `v1.0.1` | Post-v1 polish (probes, analysis hardening, header compact) |

Post-v1.0.1 work merged to `main` (not yet tagged):
- Advanced foundry clock (ticked execution engine + UI)
- Build / Guide workspace mode

---

## Safe Next Tasks

### Claude

Safe to begin:
- tutorial content deepening (more walkthroughs, composite-aware tutorials)
- conditional clocking / Enigma double-stepping (engine follow-up from clock contract §7)
- composite statefulness (follow-up from ADVANCED-FOUNDRY-CLOCK-V1.md §7.1)
- tick-trace performance optimization (follow-up from §7.2)
- UI polish: tick mode visual refinements, state timeline visualization

Should avoid for now:
- feedback loops / cycles in the graph
- async or real-time execution
- custom scripting for advance functions
- turning tutorials into grading/account systems

### Gemini

Safe to begin:
- review the merged Build / Guide mode for gating completeness
- review ticked execution contract and implementation for correctness
- critique whether workspace mode naming is clear for classroom use
- evaluate whether the tutorial panel is the right home for the mode switch

Best focus:
- whether Build / Guide mode correctly separates learning from building
- whether ticked execution UI is honest and pedagogically clear
- whether the codebase is ready for a `v1.1.0` tag

---

## Current Verification State

Available checks:
- `npm test` — 109 tests, 11 test files
- `npm run lint`
- `npm run build`

All three pass as of `d5364bd`.

---

## Architect Notes

The canonical hybrid reference machine remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

### Near-Term Roadmap

1. **Tag `v1.1.0`** — after Gemini reviews the advanced foundry + workspace mode slices
2. **Tutorial content deepening** — more walkthroughs, per-project guidance
3. **Conditional clocking** — Enigma double-stepping as a clock contract follow-up
4. **Composite statefulness** — recursive advance through composite internals
5. **Authored tutorials** — composable tutorial definitions that work with custom composites

### Key Contracts

| Contract | Status |
|---|---|
| `ENGINE-V1-CONTRACT.md` | Locked, shipped |
| `COMPOSITE-V1-CONTRACT.md` | Locked, shipped |
| `BREAK-V1-CONTRACT.md` | Locked, shipped |
| `GUIDED-CHALLENGES-V1-CONTRACT.md` | Locked, shipped |
| `MODERN-PRIMITIVES-V1-CONTRACT.md` | Locked, shipped |
| `V1-POLISH-AND-TUTORIALS.md` | Locked, shipped |
| `ADVANCED-FOUNDRY-CLOCK-V1.md` | Locked, shipped (engine + UI slices) |
| `ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md` | Draft, next major branch anchor |
| `KEY-SCHEDULE-GROUNDWORK-V1.md` | Draft, explicit sub-key injection anchor |
