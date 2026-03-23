# MCW — Implementation Status

Last updated: March 22, 2026

---

## Current State

The project has shipped through `v1.2.0` on `main`.

Current `main` is now in the `v1.3.0` release-framing phase around the
**Cipher Architecture** milestone.

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
- stateful composite ticking support
- challenge capture / export workflow
- sequential challenge evaluation and divergence reporting
- advanced modern foundry primitives and labs
- multi-format bridges (`HexSource`, `BitsToHex`, `AsciiSource`, `BitsToAscii`)
- historical bridges and Lorenz-style labs
- constrained iterators and key-bus distribution
- nested analysis for composites and iterators
- Feistel round / iterator teaching loop
- GitHub Pages deployment workflow

---

## Locked In Code

The following decisions are reflected in shipped code:
- iterative topological execution (V1: stateless; V1.1+: ticked stateful wrapper)
- required graph validation before execution
- minimal `ParamSchema`
- `advance` is pure and opt-in per module (Rotor ships with advance)
- `tickSlice` / `tickLength` are module-provided, not executor-provided
- workspace mode (`'build' | 'guide'`) gates tutorial overlays without clearing tutorial state
- iterator execution is bounded, linear, and auto-unrolled
- round-key distribution is explicit signal flow, not hidden executor mutation
- nested trace visibility is hoisted into `analysisTrace`, not hidden inside black-box execution

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
| `v1.1.0` | Ticked execution, stateful foundry, sequential labs |
| `v1.2.0` | Modern foundry, bridges, dependent clocking |

Post-`v1.2.0` work merged to `main` (current `v1.3.0` framing line):
- cipher architecture groundwork
- constrained iterators
- key-bus distribution
- depth tuning
- nested analysis focus/grouping/stepping
- Feistel round and iterator labs

---

## Safe Next Tasks

### Claude

Safe to begin:
- `v1.3.0` cleanup and release framing
- architecture tutorial/content polish tying together iterators, key buses, and Feistel
- nested-analysis/canvas polish that improves depth readability without changing engine semantics
- milestone docs / release note cleanup

Should avoid for now:
- feedback loops / cycles in the graph
- async or real-time execution
- custom scripting for advance functions
- hidden iterator/key-schedule magic
- opening another major capability branch before `v1.3.0` framing is complete

### Gemini

Safe to begin:
- review whether the Cipher Architecture line is ready for `v1.3.0`
- evaluate iterator / key-bus / Feistel UX completeness
- critique nested-analysis clarity at depth
- confirm there are no remaining medium/high-severity architectural gaps before release framing

Best focus:
- whether `v1.3.0` is now a clean stopping point
- whether any remaining friction is polish-only or still architectural
- whether the modern cipher teaching loop feels complete enough for a named release

---

## Current Verification State

Available checks:
- `npm test`
- `npm run lint`
- `npm run build`

All three pass as of the current `main` release-framing line.

---

## Architect Notes

The canonical hybrid reference machine remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

### Near-Term Roadmap

1. **Frame `v1.3.0`** — the Cipher Architecture release
2. **Final cleanup/polish** — nested-step visibility, modern architecture tutorial, wording cleanup
3. **Tag `v1.3.0`** — after final review confirms no remaining architectural gap
4. **Post-`v1.3.0` direction** — likely cryptanalysis, richer authored content, or another bounded analysis surface

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
| `ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md` | Active, implemented as bounded iterator groundwork |
| `KEY-SCHEDULE-GROUNDWORK-V1.md` | Active, implemented as explicit key-bus groundwork |
