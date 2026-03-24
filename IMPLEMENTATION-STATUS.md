# MCW — Implementation Status

Last updated: March 24, 2026

---

## Current State

The project has shipped through `v1.19.0` on `main`.

Current `main` is now positioned beyond the first completed advanced-rotor milestone.
That milestone shipped:
- first bounded rotor-realism vocabulary:
  - `ringOffset`
  - `notches`
  - visible `turnover`
- temporal `clock` handling for stateful-module advance edges
- explicit turnover-driven double-step wiring using `Clock`, `OR`, and `Gate`
- first rotor-realism teaching surface:
  - `Advanced Rotor Stepping` demo workspace
  - `Advanced Rotor Stepping` tutorial
  - `Repair the Rotor Notch` challenge

The already-shipped protocol-material and block-framing foundations remain in place:
- protocol inputs:
  - `IV`
  - `Nonce`
  - `Salt`
- framing:
  - `BitSplit`, `BitPad`, and reuse of `BitJoin`

The next strategic direction remains broader than any one subdomain:
- treat MCW explicitly as a **cryptographic systems IDE**
- expand the machine language so it can express more of cryptography honestly
- ship tutorials and challenges alongside each new vocabulary family

The next most important missing vocabulary families are:
- deeper stream-combiner / filter-function follow-ons after the first majority slice
- symbol/message permutation and scheduler follow-ons after the shipped rotor-realism slice

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
- first hashing foundations
- parameter forwarding
- primitive transformation visualization
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
| `v1.5.0` | Modern Analysis |
| `v1.6.0` | Transformation Visualization Phase 1 |
| `v1.7.0` | Hashing V1 |
| `v1.8.0` | Hash Collision Challenge |
| `v1.9.0` | Sponge Collision Challenge |
| `v1.10.0` | Collision Interpretation Foundations |
| `v1.11.0` | Collision Interpretation Helper |
| `v1.12.0` | Tactile Primitive Authoring |
| `v1.13.0` | Builder Workflow |
| `v1.14.0` | Cryptographic Operators |
| `v1.15.0` | Control Primitives |
| `v1.16.0` | Block Framing |
| `v1.17.0` | Protocol Material |
| `v1.18.0` | Stream Cipher Foundations |
| `v1.19.0` | Advanced Rotor Realism |

Post-`v1.4.0` work merged to `main`:
- Modern Analysis contract framing
- `Classical / Modern` cryptanalysis sub-modes
- Avalanche Explorer
- machine-aware output difference for supported bit/hex source paths
- round-aware diffusion summaries and progression matrix
- compatibility callouts for unsupported project shapes
- `The Avalanche Effect` tutorial
- hashing identified as a future scope line and backlog item

Post-`v1.5.0` work merged to `main`:
- Hashing V1 contract framing
- parameter forwarding contract + first implementation slice
- toy compression hash and toy sponge hash teaching artifacts
- hash-focused demos and tutorials
- primitive transformation visualization:
  - `Permutation`
  - `BitShifter`
  - `XOR`
  - `SBox`
- iterator-aware nested transformation resolution
- SBox table-first lookup view with decimal/hex bridge

Post-`v1.8.0` work merged to `main`:
- bounded sponge-collision follow-on
- `Find A Sponge Collision` challenge
- challenge ownership by `projectId`
- project-correct challenge selection/reset/import behavior
- sponge digest-path correction using folded rate + capacity contribution
- audit-style regression tests for hash output spread and adjacent-repeat sanity

Post-`v1.9.0` work merged to `main`:
- bounded post-collision interpretation follow-on
- side-by-side original vs colliding message comparison in hash collision challenges
- post-success interpretation nudges into `Analyze` and `Modern Cryptanalysis`
- sponge absorb asymmetry fix to remove sampled paired `(+k,+k)` digest preservation
- sampled symmetry-regression tests for toy sponge hardening
- lazy-loaded secondary panels
- React vendor chunk split
- build-time bundle-size guard

Post-`v1.10.0` work merged to `main`:
- first `analysisTrace`-based internal-divergence helper for hash collision challenges
- guided source modules skipped when locating first internal divergence
- compact `Internal Divergence` card in the collision success flow
- regression coverage for the new interpretation signal

Post-`v1.11.0` work merged to `main`:
- bounded tactile primitive authoring across four families:
  - `SBox`
  - `Permutation`
  - `Reflector`
  - `Rotor`
- synced raw CSV / wiring fallbacks for all four editors
- reflector-specific validation hardening for non-involutive and self-mapping wirings
- runtime-measured rotor/permutation wire anchors with dotted endpoints
- future rotor-realism line explicitly kept on the roadmap

Post-`v1.12.0` work merged to `main`:
- bounded builder workflow slice:
  - multi-select group movement
  - graph-aware `Tidy Layout`
  - blank workspaces and saved/deletable personal workspace library
  - composite unzip with forwarded-param carry-through
  - dark-mode-safe reflector and plugboard pair rendering

Strategic direction after `v1.13.0` (validated through `v1.19.0`):
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md` now frames MCW as a cryptographic systems IDE
- the next roadmap focus is expressive primitive language growth rather than only choosing the next isolated feature line
- Phase 1 foundations are now shipped through:
  - `CRYPTO-OPERATORS-V1.md`
  - `CONTROL-PRIMITIVES-V1.md`

Post-`v1.13.0` work merged to `main`:
- bounded operator-expansion slice:
  - `AND`, `OR`, `NOT`
  - `AddMod`, `SubMod`, `Modulo`
  - explicit big-endian bit-word arithmetic decision
  - width-aware validation for the new equal-width operator family
  - `Beyond XOR` demo workspace
  - `Beyond XOR` tutorial
  - `Repair the Word Mask` challenge

Post-`v1.14.0` work merged to `main`:
- bounded control-primitives slice:
  - `Counter`
  - `Equals`
  - `AtLeast`
  - `Gate`
  - explicit one-bit control semantics on `bits`
  - width-aware validation for control comparisons and counter params
  - `Counter Pulse Gate` demo workspace
  - `Counters, Conditions, and Pulses` tutorial
  - `Repair the Control Threshold` challenge
  - Analyze-tab transformation views for `Equals`, `AtLeast`, and `Gate`

Post-`v1.15.0` work merged to `main`:
- bounded block-framing slice:
  - `BitSplit` (one `bits` input → two `bits` outputs: `left`/`right`, explicit `leftWidth` param)
  - `BitPad` (one `bits` input → one `bits` output, target width, pad side, pad bit)
  - reuse of existing `BitJoin` for block rejoining
  - width-aware validation for `BitSplit` leftWidth and `BitPad` targetWidth
  - `Split Transform Rejoin` and `Pad and Split` demo workspaces
  - `Visible Block Boundaries` and `Padding Before Splitting` tutorials
  - `Repair the Split Width` and `Repair the Pad Width` challenges
  - Analyze-tab transformation views for `BitSplit` and `BitPad`

Post-`v1.16.0` work merged to `main`:
- bounded protocol-material slice:
  - `IV`
  - `Nonce`
  - `Salt`
  - source-only protocol-material helper with shared width-aware validation
  - explicit reject-if-too-long behavior and right-padding for short hex values
  - `Protocol Material Mixer` demo workspace
  - `Protocol Material Is Context` tutorial
  - `Repair the IV` challenge

Post-`v1.17.0` work merged to `main`:
- bounded stream-cipher slice:
  - `Majority`
  - strict 1-bit width validation for majority inputs
  - Analyze-tab transformation view for `Majority`
  - `Majority-Clocked Keystream` demo workspace
  - `The Majority-Clocked Keystream` tutorial
  - `Repair the Majority Vote` challenge

Post-`v1.18.0` work merged to `main`:
- bounded advanced-rotor slice:
  - `Rotor` now separates `position` from `ringOffset`
  - visible `notches` and 1-bit `turnover` output
  - `clock` inputs into stateful modules treated as temporal advance edges rather than same-tick DAG edges
  - explicit turnover-driven stepping and middle-rotor double-step via `Clock`, `OR`, and `Gate`
  - `Advanced Rotor Stepping` demo workspace
  - `Advanced Rotor Stepping` tutorial
  - `Repair the Rotor Notch` challenge

---

## Safe Next Tasks

### Claude

Safe to begin:
- help assess whether the primitive language is missing a foundational family
- help pressure-test the operator/control roadmap against product scope
- help keep rotor realism as one bounded sub-line inside the broader vocabulary roadmap
- help pressure-test the shipped builder workflow as a daily-use construction surface
- help review future tutorial/challenge additions that accompany new vocabulary lines

Should avoid for now:
- feedback loops / cycles in the graph
- async or real-time execution
- custom scripting for advance functions
- hidden iterator/key-schedule magic
- treating hashing as a black-box algorithm picker instead of an explicit teaching surface

### Gemini

Safe to begin:
- review whether the vocabulary roadmap is coherent and well-sequenced
- review what should follow the now-shipped operator/control/framing/protocol-material foundation
- help keep the new builder workflow connected to future language growth
- help pressure-test future bounded rotor/reflector follow-ons against the broader vocabulary plan
- review what tutorial/challenge support should accompany each new primitive family

Best focus:
- which language family should follow the shipped protocol-material foundation
- whether advanced rotor realism or a second stream-combiner slice should come next
- whether advanced rotor realism should wait until the broader vocabulary is stronger

---

## Current Verification State

Available checks:
- `npm test`
- `npm run lint`
- `npm run build`

All three passed on the most recent advanced-rotor slice.

---

## Architect Notes

The canonical hybrid reference machine remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

### Near-Term Roadmap

1. **Treat MCW as a cryptographic systems IDE** — optimize future roadmap choices around expressive machine vocabulary, not just isolated features
2. **Continue the primitive-language roadmap beyond shipped stream and rotor foundations** — the clearest remaining language families are deeper stream-combiner follow-ons, symbol/message permutation, and scheduler/key-routing work
   Immediate contract:
   `STREAM-CIPHER-V2.md`
3. **Keep future rotor follow-ons bounded** — reversible rotation direction, flipped insertion, and deeper rotor-bank realism should remain explicit sub-slices, not convenience presets
4. **Treat workspace library and unzip as shipped foundations** — avoid widening them immediately into folders, sharing, bulk expansion, or cloud sync
5. **Keep the new bundle-size guardrails healthy** — treat regressions as release-blocking debt, not background noise
6. **Monitor challenge-induced project switching in classroom use** before adding warning dialogs
7. **Defer deeper transformation playback/animation** until classroom feedback justifies a second visualization slice

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
| `HASHING-V1.md` | Shipped as the `v1.7.0` first hashing milestone contract |
| `HASH-COLLISION-CHALLENGE-V1.md` | Shipped as the `v1.8.0` first bounded hash weakness challenge |
| `SPONGE-COLLISION-CHALLENGE-V1.md` | Shipped as the `v1.9.0` sponge-collision follow-on |
| `POST-COLLISION-INTERPRETATION-V1.md` | First milestone shipped in `v1.11.0` — nudges, message comparison, and first internal-divergence helper delivered |
| `CUSTOM-SBOX-AUTHORING-V1.md` | Shipped in `v1.12.0` as bounded substitution-table authoring |
| `CUSTOM-PERMUTATION-AUTHORING-V1.md` | Shipped in `v1.12.0` as bounded tactile routing authoring |
| `CUSTOM-REFLECTOR-AUTHORING-V1.md` | Shipped in `v1.12.0` as bounded paired reflector authoring |
| `WORKBENCH-ERGONOMICS-V1.md` | Shipped in `v1.13.0` as bounded workbench usability improvements |
| `WORKSPACE-LIBRARY-V1.md` | Shipped in `v1.13.0` as bounded blank/save/delete user workspace management |
| `COMPOSITE-UNZIP-V1.md` | Shipped in `v1.13.0` as bounded inverse-composition for one composite instance |
| `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md` | Active strategic roadmap for growing MCW into a fully expressive cryptographic systems IDE |
| `CRYPTO-OPERATORS-V1.md` | Shipped in `v1.14.0` as bounded boolean and fixed-width word arithmetic expansion |
| `CONTROL-PRIMITIVES-V1.md` | Shipped in `v1.15.0` as bounded counter/compare/gate control vocabulary |
| `BLOCK-FRAMING-V1.md` | Shipped in `v1.16.0` as bounded block-framing vocabulary for visible splitting, rejoining, and padding |
| `PROTOCOL-MATERIAL-V1.md` | Shipped in `v1.17.0` as bounded protocol-input vocabulary for IV, nonce, and salt sources |
| `STREAM-CIPHER-V1.md` | Shipped in `v1.18.0` as bounded stream-machine slice for visible majority logic and irregular clocking |
| `STREAM-CIPHER-V2.md` | Proposed — second bounded stream-machine slice for visible selector/filter behavior via `Mux` |
| `ADVANCED-ROTOR-REALISM-V1.md` | Shipped in `v1.19.0` as bounded rotor-realism slice for ring setting, turnover, and double-step behavior |
| `PARAM-FORWARDING-V1.md` | Active, implemented as first exposed-internal control slice |
| `TRANSFORMATION-VISUALIZATION-V1.md` | Shipped as the `v1.6.0` first primitive legibility slice |
| `SBOX-TRANSFORMATION-V1.md` | Shipped as the `v1.6.0` lookup/substitution visual family |
