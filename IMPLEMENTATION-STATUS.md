# MCW — Implementation Status

Last updated: March 27, 2026

---

## Current State

The latest shipped tag is `v2.0.0`.
Current development now carries:
- the proposed post-`v1.44.0` `v2.0` sanity-pass contract
- the completed `v2.0` sanity audit deliverable
- implemented bounded follow-on passes:
  - `LEARNING-SEQUENCE-V2.md`
  - selector/pathfinding polish on `main`
  - `PALETTE-COHERENCE-V1.md`
- completed release-boundary decisions:
  - `V2.0-READINESS.md`
  - `V2.0-READINESS-AUDIT.md`
  - `V2.0-RELEASE-CONTRACT.md`
  - `V2.0-RELEASE-NOTES.md`
- post-`v2.0.0` authoring-power planning:
  - `V2.1-AUTHORING-POWER-PLAN.md`
  - `REPEATED-STRUCTURE-AUTHORING-V1.md`
  - `SELECTED-CLUSTER-OPERATIONS-V1.md`
  - `WORKSPACE-HISTORY-V1.md`
  - `WORKSPACE-VERSIONING-V1.md`
  - `WORKSPACE-VISIBILITY-NAVIGATION-V1.md`
  - `CONNECTION-AUTHORING-ERGONOMICS-V1.md`
  - `PARAMETER-AUTHORING-ERGONOMICS-V1.md`
  - `PARAMETER-COMPARISON-ERGONOMICS-V1.md`
  - `PRIMITIVE-MICRO-DEMOS-V1.md`

Current `main` is now positioned beyond three recent milestones.
Those shipped:
- first bounded number-theoretic vocabulary:
  - `ModExp` (modular exponentiation via repeated squaring)
  - `ModInverse` (modular multiplicative inverse via extended Euclidean algorithm)
- first key-schedule demonstration using existing primitives:
  - two-round key derivation from one master key via rotation and XOR
- number-theoretic teaching surface:
  - `Toy RSA` demo workspace
  - `Key Schedule Workshop` demo workspace
  - `Toy RSA Round-Trip` tutorial
  - `Key Schedule Workshop` tutorial
  - `Repair the RSA Exponent` challenge
  - `Repair the Key Rotation` challenge
- teaching pathfinding and hardening:
  - seeded teaching-content audit test
  - routed-clock width-validation fix for routed control demos
  - first shipped learning-sequence UI with stage/core/best-after guidance
- bounded bypass:
  - instance-level bypass for an explicit allow-list of eligible one-input / one-output same-domain modules
  - validation rejection for ineligible bypass attempts
  - visible inspector toggle and canvas bypass badge
  - `Bypass Workshop` demo/tutorial/challenge
- inverse permutation authoring:
  - `Build Inverse` helper for `Permutation` and `SymbolPermutation`
  - editor-side construction of the true inverse mapping, distinct from reverse order
  - explanatory UI hint clarifying that inverse undoes the current routing
- bridge ergonomics:
  - permissive raw `BitSource` entry for continuous, spaced, or bracketed `0/1` text
  - grouped bit preview in the structured bits editor
  - direct `HexToAscii` bridge for readable 7-bit ASCII byte decoding from hex text
- bridge ergonomics V2:
  - `AsciiToHex` bridge (symbol → symbol, 7-bit ASCII to uppercase hex)
  - sink-only output representation views for `Output` and `BitOutput`
  - Bits / Bytes / Hex / ASCII tabs with strict availability rules and explanation messaging
- reversible authoring:
  - `Normalize Reciprocal Pairs` helper for `Plugboard` and `Reflector`
  - exact reciprocal/involutive normalization helpers in the engine layer
  - editor-side reciprocity guidance for reciprocal symbolic wirings
- workspace housekeeping:
  - workspace-local module instance renaming with atomic updates for graph/layout/selection/drafts/probes
  - `Duplicate Workspace` for independent local copies with reset tutorial/challenge/tick session state
  - predictable copy naming and conservative module-ID validation
- composite port hints:
  - contextual composite/iterator boundary hints on hover
  - target-module-only input hints during live connection drag
  - quiet canvas at rest with no always-on labels or interface mutation
- cross-workspace clipboard:
  - `Copy Selected Cluster` and `Paste Selected Cluster` for local fragment reuse across workspaces
  - selected modules only, internal-only connections, and relative layout preservation
  - fresh pasted IDs with immediate local divergence and no linked/library/system-clipboard semantics
- Diffie-Hellman teaching follow-on:
  - `Diffie-Hellman Key Exchange` demo built from explicit `ModExp` public/secret derivation paths
  - `Visible Shared Secret` tutorial staged after `Toy RSA Round-Trip`
  - `Repair the Shared Secret` challenge for restoring a matching shared-secret derivation
- key-schedule depth follow-on:
  - `Recursive Key Schedule` demo with visible recursive key derivation feeding a keyed iterator
  - `One Round Key Becomes The Next` tutorial staged after `Key Schedule Workshop`
  - `Repair the Next Round Key` challenge for restoring a later-round derivation step
- block-chaining follow-on:
  - `Visible Block Chaining` demo with explicit IV seeding and block-to-block dependence
  - `Why The Next Block Depends On The Last` tutorial staged after `Recursive Key Schedule`
  - `Repair the Chaining Path` challenge for restoring the visible chaining edge into block 2
- byte-oriented modern-construction follow-on:
  - `ByteRotate` and `ByteSwap` helpers with strict multiple-of-8 width validation
  - `Visible Byte Order` demo comparing byte-order reversal and byte-granularity rotation
  - `When Bits Become Bytes` tutorial staged after `Visible Block Chaining`
  - `Repair the Byte Order` challenge for restoring the explicit byte-order branch
- integrity / authentication follow-on:
  - `Visible Tamper Check` demo with explicit keyed tag recomputation and `Equals` verification
  - `Why Integrity Is Not Secrecy` tutorial
  - `Repair the Tamper Check` challenge
- authenticated-encryption composition follow-on:
  - `Visible Authenticated Encryption` demo with visible Encrypt-then-MAC structure and receiver-side verification
  - `Encrypting Is Not Enough` tutorial
  - `Repair the Protected Message` challenge
- asymmetric-authentication follow-on:
  - `Visible Signature Verification` demo with private signing and public verification
  - `Signing Is Not Encrypting` tutorial
  - `Repair the Signature` challenge
- systems-composition follow-on:
  - `Visible Secure Handshake` demo with visible exchange, verification, derived-key handoff, and one protected message
  - `From Handshake To Protected Message` tutorial
  - `Repair the Handshake` challenge

The already-shipped protocol-material, block-framing, and symbol/message permutation foundations remain in place:
- protocol inputs:
  - `IV`
  - `Nonce`
  - `Salt`
- framing:
  - `BitSplit`, `BitPad`, and reuse of `BitJoin`
- symbol/message permutation:
  - `SymbolPermutation`

The next strategic direction remains broader than any one subdomain:
- treat MCW explicitly as a **cryptographic systems IDE**
- expand the machine language so it can express more of cryptography honestly
- ship tutorials and challenges alongside each new vocabulary family

The next most important product-level task is:
- ship the first bounded `v2.1` builder-power slice:
  - same-workspace repeated-structure authoring / cluster duplication

The next bounded follow-on after that is:
- cluster operations:
  - drag-box selection on empty canvas
  - explicit selected-cluster deletion

The current active authoring-safety slice after cluster operations is:
- workspace-local undo / redo history

The current checkpointing follow-on after that is:
- named workspace versions / restore points
- explicit save/list/restore workflow per workspace

The current workspace-visibility follow-on after that is:
- bounded zoom controls
- reset / fit view
- explicit execution-trace focus jumps into the live workspace

The current connection-authoring follow-on after that is:
- drag from occupied inputs to rewire existing single-input connections
- atomic replace/retarget behavior with undo/redo-safe history
- explicit replacement vs blocked-target feedback during live connection drag

The current parameter-authoring follow-on after that is:
- copy the current module’s resolved params from the inspector
- apply that param set to other explicitly selected same-definition modules
- clear conflicting drafts on affected targets
- keep one bulk-apply action as one undo/redo step

The current parameter-comparison follow-on after that is:
- compare the current inspector target against explicitly selected same-definition siblings
- show aligned vs divergent fields inline in the inspector
- keep the selected module as the comparison anchor

The current primitive-legibility follow-on after that is:
- palette-local `Try Demo` actions for a bounded set of opaque primitives
- minimal seeded examples opened as new local editable workspaces
- no second demo library and no tutorial/challenge duplication

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
| `v1.20.0` | Stream Cipher Filtering |
| `v1.21.0` | Stream Cipher Routing |
| `v1.22.0` | Symbol Permutation |
| `v1.23.0` | Key Routing |
| `v1.24.0` | Symbol Structure |
| `v1.25.0` | Arithmetic Expansion |
| `v1.26.0` | Number-Theoretic Foundations |
| `v1.27.0` | Transformation View Consolidation |
| `v1.28.0` | Teaching Pathfinding And Hardening |
| `v1.29.0` | Bounded Bypass |
| `v1.30.0` | Inverse Permutation Authoring |
| `v1.31.0` | Bridge Ergonomics |
| `v1.32.0` | Bridge Ergonomics V2 |
| `v1.33.0` | Reversible Authoring |
| `v1.34.0` | Workspace Housekeeping |
| `v1.35.0` | Composite Port Hints |
| `v1.36.0` | Cross-Workspace Clipboard |
| `v1.37.0` | Diffie-Hellman |
| `v1.38.0` | Key Schedule Depth |
| `v1.39.0` | Block Chaining |
| `v1.40.0` | Byte-Oriented Primitives |
| `v1.41.0` | Integrity / Authentication |
| `v1.42.0` | AEAD Foundations |
| `v1.43.0` | Digital Signature Foundations |
| `v1.44.0` | Protocol Handshakes |
| `v1.45.0` | Learning Sequence V2 |
| `v1.46.0` | Learning Path Selector Polish |
| `v1.47.0` | Palette Coherence V1 |
| `v1.48.0` | Large Workspace Orientation |
| `v2.0.0` | Cryptographic Systems IDE boundary |

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

Strategic direction after `v1.13.0` (validated through `v1.26.0`):
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

Post-`v1.19.0` work merged to `main`:
- bounded second stream-cipher slice:
  - `Mux`
  - strict 1-bit selector validation
  - Analyze-tab transformation view for `Mux`
  - `Filtered Keystream` demo workspace
  - `The Filtered Keystream` tutorial
  - `Repair the Filter Selector` challenge

Post-`v1.20.0` work merged to `main`:
- bounded third stream-cipher slice:
  - `Demux`
  - strict 1-bit routing validation
  - Analyze-tab transformation view for `Demux`
  - `Routed Clock Keystream` demo workspace
  - `The Routed Clock Keystream` tutorial
  - `Repair the Routed Clock` challenge

Post-`v1.21.0` work merged to `main`:
- bounded symbol-permutation slice:
  - `SymbolPermutation`
  - strict one-to-one symbol-order validation
  - Analyze-tab transformation view for `SymbolPermutation`
  - `Visible Symbol Scramble` demo workspace
  - `Visible Symbol Scramble` tutorial
  - `Repair the Symbol Order` challenge

Post-`v1.22.0` work merged to `main`:
- bounded key-routing slice:
  - `BitWindow`
  - explicit `start` / `width` sub-key extraction from one visible key bus
  - static out-of-range key-window validation
  - Analyze-tab transformation view for `BitWindow`
  - `Visible Sub-Key Bus` demo workspace
  - `Visible Sub-Key Bus` tutorial
  - `Repair the Key Window` challenge

Post-`v1.23.0` work merged to `main`:
- bounded symbol/message-structure slice:
  - `SymbolWindow`
  - explicit contiguous `symbol`-domain `start` / `width` extraction
  - static out-of-range symbol-window validation when input length is knowable
  - Analyze-tab transformation view for `SymbolWindow`
  - `Visible Message Window` demo workspace
  - `Visible Message Window` tutorial
  - `Repair the Message Window` challenge

Post-`v1.24.0` work merged to `main`:
- bounded arithmetic-expansion slice:
  - `MulMod` (modular multiplication on equal-width bit words)
  - `GreaterThan` (strict comparison emitting 1-bit control)
  - `BitUnpad` (strip padding to recover original width)
  - Analyze-tab transformation view for `GreaterThan` (reuses compare view)
  - `Multiply Compare Unpad` demo workspace
  - `Multiply Compare Unpad` tutorial
  - `Repair the Unpad Width` challenge

Post-`v1.25.0` work merged to `main`:
- bounded number-theoretic foundations slice:
  - `ModExp` (modular exponentiation via repeated squaring, explicit modulus param)
  - `ModInverse` (modular multiplicative inverse via extended Euclidean algorithm, explicit modulus param)
  - modulus-vs-width static validation for both modules
  - `Toy RSA` demo workspace (visible encrypt/decrypt round-trip with toy key pair)
  - `Key Schedule Workshop` demo workspace (two-round key derivation from one master key)
  - `Toy RSA Round-Trip` tutorial
  - `Key Schedule Workshop` tutorial
  - `Repair the RSA Exponent` challenge
  - `Repair the Key Rotation` challenge

Post-`v1.26.0` work merged to `main`:
- transformation-view consolidation:
  - Analyze-tab `arithmetic` view kind for `MulMod`, `ModExp`, and `ModInverse`
  - Analyze-tab `unpad` view kind for `BitUnpad` (mirrors the existing `pad` view)
  - `GreaterThan` compare view corrected from `A >= B` to strict `A > B` semantics
- builder and teaching-surface hardening:
  - staged learning-sequence ordering
  - bounded instance-level bypass
  - inverse-permutation authoring
  - bridge ergonomics follow-ons
  - reversible authoring helpers
  - workspace rename / duplicate / clipboard
  - composite port hints
- second asymmetric validation surface:
  - `Diffie-Hellman Key Exchange`
  - `Visible Shared Secret`
  - `Repair the Shared Secret`

---

## Safe Next Tasks

### Claude

Safe to begin:
- help shape a bounded `v2.0` sanity/framing pass after the completed systems-composition phase
- help pressure-test whether the next post-handshake move should be organizational/teaching cohesion rather than more vocabulary
- help review which still-open backlog items actually deserve a new contract after classroom use
- help keep the roadmap honest about what is still missing versus what is now shipped
- help identify where a later `v2.0` sanity/framing pass should sit once the next systems-level direction is clearer

Should avoid for now:
- feedback loops / cycles in the graph
- async or real-time execution
- custom scripting for advance functions
- hidden iterator/key-schedule magic
- treating hashing as a black-box algorithm picker instead of an explicit teaching surface

### Gemini

Safe to begin:
- review whether the next move after the framed `v1.44.0` handshake milestone should be a `v2.0` cohesion pass
- help pressure-test the roadmap sequence from completed systems composition into trust, classroom deployment, or deepening work
- review what teaching-library and palette/library organization work should accompany a `v2.0` pass
- help keep the post-builder product direction tied to expressive machine language rather than generic tooling

Best focus:
- whether the next move should prioritize organization, curriculum framing, and scale management over new vocabulary
- whether future trust/auth work should stay structure-centered instead of collapsing into wrappers, PKI bundles, or protocol presets
- how to use a `v2.0` pass to close out the expansion arc cleanly before any certificate/trust-chain work

---

## Current Verification State

Available checks:
- `npm test`
- `npm run lint`
- `npm run build`

All three passed at `v1.44.0` implementation framing.

---

## Architect Notes

The canonical hybrid reference machine remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

### Near-Term Roadmap

1. **Treat MCW as a cryptographic systems IDE** — optimize future roadmap choices around expressive machine vocabulary, not just isolated features
2. **Use a `v2.0` pass to consolidate the product after the first systems-level milestone** — prioritize library coherence, curriculum framing, and honest scaling before opening a new concept family
3. **Keep future rotor follow-ons bounded** — reversible rotation direction, flipped insertion, and deeper rotor-bank realism should remain explicit sub-slices, not convenience presets
4. **Establish a suggested learning path across demos/tutorials/challenges** — future teaching content should fit a visible stage/order spine rather than accumulating as a flat library
5. **Treat workspace library and unzip as shipped foundations** — avoid widening them immediately into folders, sharing, bulk expansion, or cloud sync
6. **Keep the new bundle-size guardrails healthy** — treat regressions as release-blocking debt, not background noise
7. **Monitor challenge-induced project switching in classroom use** before adding warning dialogs
8. **Defer deeper transformation playback/animation** until classroom feedback justifies a second visualization slice
9. **If bypass lands, keep it bounded** — instance-local, visibly disabled, and limited to modules where identity pass-through is honest
10. **Tighten bridge ergonomics before adding broad new encodings** — make raw bit entry and byte-oriented bridges feel natural before opening a UTF-8 follow-on

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
| `STREAM-CIPHER-V2.md` | Shipped in `v1.20.0` as second bounded stream-machine slice for visible selector/filter behavior via `Mux` |
| `STREAM-CIPHER-V3.md` | Shipped in `v1.21.0` as third bounded stream-machine slice for visible routing/scheduling behavior via `Demux` |
| `SYMBOL-PERMUTATION-V1.md` | Shipped in `v1.22.0` as first bounded symbol/message permutation slice for visible symbol-order routing |
| `KEY-SCHEDULE-V2.md` | Shipped in `v1.23.0` as first bounded post-groundwork key-routing slice for visible sub-key extraction from one key bus |
| `SYMBOL-STRUCTURE-V1.md` | Shipped in `v1.24.0` as first bounded post-permutation symbol/message-structure slice for visible contiguous submessage extraction |
| `LEARNING-SEQUENCE-V1.md` | First milestone shipped in `v1.28.0` — staged ordering contract now visible in demos, tutorials, and challenges |
| `ARITHMETIC-EXPANSION-V1.md` | Shipped in `v1.25.0` as first bounded arithmetic-expansion slice for modular multiplication, strict comparison, and unpadding |
| `NUMBER-THEORETIC-V1.md` | Shipped in `v1.26.0` as first bounded number-theoretic foundations slice for modular exponentiation and modular inverse |
| `DIFFIE-HELLMAN-V1.md` | Shipped in `v1.37.0` as bounded number-theoretic follow-on for visible shared-secret agreement |
| `KEY-SCHEDULE-DEPTH-V1.md` | Shipped in `v1.38.0` as bounded iterative/recursive round-key derivation depth |
| `BLOCK-CHAINING-V1.md` | Framed for `v1.39.0` as the bounded framing/symmetric-construction follow-on for visible block-to-block dependence |
| `BYTE-ORIENTED-PRIMITIVES-V1.md` | Framed for `v1.40.0` as the bounded modern-construction follow-on for explicit byte/word structure helpers |
| `INTEGRITY-AUTHENTICATION-V1.md` | Framed for `v1.41.0` as the bounded modern-teaching follow-on for visible tamper detection and authenticator comparison |
| `AEAD-FOUNDATIONS-V1.md` | Framed for `v1.42.0` as the bounded composition follow-on for visible authenticated-encryption-style structure |
| `DIGITAL-SIGNATURE-FOUNDATIONS-V1.md` | Framed for `v1.43.0` as the bounded asymmetric-authentication follow-on for visible signing and verification |
| `PROTOCOL-HANDSHAKES-V1.md` | Framed for `v1.44.0` as the bounded systems-level follow-on for visible handshake / transcript composition |
| `MCW-V2-SANITY-PASS.md` | Proposed post-`v1.44.0` as the next product-level cohesion pass after the completed systems-composition checkpoint |
| `MCW-V2-SANITY-AUDIT.md` | Completed audit deliverable: the product still holds, but the late library/pathfinding model now needs one bounded follow-on |
| `LEARNING-SEQUENCE-V2.md` | Implemented on local `main` as the bounded late-stage pathfinding and library-reorganization follow-on after the sanity audit |
| `BYPASS-V1.md` | Shipped in `v1.29.0` — bounded instance-level bypass for eligible one-in/one-out same-domain modules |
| `INVERSE-PERMUTATION-AUTHORING-V1.md` | Shipped in `v1.30.0` — bounded authoring follow-on for deriving inverse mappings in bit and symbol permutation editors |
| `BRIDGE-ERGONOMICS-V1.md` | Shipped in `v1.31.0` — bounded bridge/usability follow-on for easier raw-bit entry and clearer byte-oriented bridge behavior |
| `ADVANCED-ROTOR-REALISM-V1.md` | Shipped in `v1.19.0` as bounded rotor-realism slice for ring setting, turnover, and double-step behavior |
| `PARAM-FORWARDING-V1.md` | Active, implemented as first exposed-internal control slice |
| `TRANSFORMATION-VISUALIZATION-V1.md` | Shipped as the `v1.6.0` first primitive legibility slice |
| `SBOX-TRANSFORMATION-V1.md` | Shipped as the `v1.6.0` lookup/substitution visual family |
