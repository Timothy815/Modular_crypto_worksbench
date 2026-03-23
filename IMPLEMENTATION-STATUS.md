# MCW — Implementation Status

Last updated: March 23, 2026

---

## Current State

The project has shipped through `v1.4.0` on `main`.

Current `main` is now in `v1.5.0` cleanup/framing around the
**Modern Analysis** milestone.

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
- lightweight cryptanalysis instrumentation in Compare
- dedicated cryptanalysis workspace mode
- Vigenere cryptanalysis workflow
- modern analysis workflow
- `v1.4.0` release framing and tutorial pass
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
- cryptanalysis workspace state is persisted separately from engine project state

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
| `v1.3.0` | Cipher architecture |
| `v1.4.0` | Cryptanalysis workspace |

Post-`v1.4.0` work merged to `main`:
- Modern Analysis contract framing
- `Classical / Modern` cryptanalysis sub-modes
- Avalanche Explorer
- machine-aware output difference for supported bit/hex source paths
- round-aware diffusion summaries and progression matrix
- compatibility callouts for unsupported project shapes
- `The Avalanche Effect` tutorial
- hashing identified as a future scope line and backlog item

Next branch framing after `v1.5.0`:
- define Hashing V1 as a product contract
- then widen modern-analysis breadth across more supported project shapes

---

## Safe Next Tasks

### Claude

Safe to begin:
- define the first hashing contract
- then widen modern-analysis support across more project families
- keep hashing visually aligned with the existing modern-analysis line

Should avoid for now:
- feedback loops / cycles in the graph
- async or real-time execution
- custom scripting for advance functions
- hidden iterator/key-schedule magic
- treating hashing as a black-box algorithm picker instead of an explicit teaching surface

### Gemini

Safe to begin:
- review whether Hashing V1 is the right next product contract
- help choose the best first modern-analysis breadth slice after `v1.5.0`
- help keep hashing and modern analysis connected instead of fragmenting the product

Best focus:
- whether Hashing V1 has the right scope boundary
- what the first hashing teaching artifact should look like
- which modern-analysis breadth slice should land before hashing implementation

---

## Current Verification State

Available checks:
- `npm test`
- `npm run lint`
- `npm run build`

All three pass as of the shipped `v1.5.0` line.

---

## Architect Notes

The canonical hybrid reference machine remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

### Near-Term Roadmap

1. **Define Hashing V1** — lock hashing into the product roadmap
2. **Widen modern-analysis breadth** — support more project/source/output shapes
3. **Choose the first hashing teaching artifact**
4. **Then implement hashing on top of the broader modern-analysis base**

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
| `CRYPTANALYSIS-WORKSPACE-V1.md` | Locked, implemented as the `v1.4.0` workspace boundary |
| `MODERN-ANALYSIS-V1.md` | Active, implemented as the `v1.5.0` modern-analysis line |
| `HASHING-V1.md` | Active, defines the future hashing line |
| `PARAM-FORWARDING-V1.md` | Active, defines explicit exposed-internal controls for reusable architectures |
