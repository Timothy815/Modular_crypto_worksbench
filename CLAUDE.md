# MCW — Claude Code Context

Read AI-COLLABORATION-CONTINUITY.md first for the standing team roles, reviewer workflow, and restart expectations.
Read PROJECT.md for full project specification.
Read ENGINE-V1-CONTRACT.md for locked implementation decisions.
Read ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md before starting work on iterative-round abstractions or key-schedule groundwork.
Read KEY-SCHEDULE-GROUNDWORK-V1.md before extending iterator-aware key distribution or round-key generation.
Read CRYPTANALYSIS-WORKSPACE-V1.md before starting work on the post-v1.3 cryptanalysis workspace.
Read MODERN-ANALYSIS-V1.md before starting work on the post-v1.4 modern-analysis line.
Read HASHING-V1.md before starting work on the hashing line.
Read HASH-COLLISION-CHALLENGE-V1.md before starting work on the first post-`v1.7.0` hashing challenge slice.
Read SPONGE-COLLISION-CHALLENGE-V1.md before starting work on the bounded sponge-collision follow-on.
Read POST-COLLISION-INTERPRETATION-V1.md before extending the collision-teaching line beyond the shipped nudges/comparison slice.
Read CUSTOM-SBOX-AUTHORING-V1.md before starting work on editable substitution-table authoring.
Read SBOX-TABLE-TRANSFORMS-V1.md before starting work on bounded transform operations for authored `SBox` tables.
Read POLLUX-FRACTIONATION-V1.md before starting work on classical fractionation, homophonic encoding, or Pollux-style bit-to-symbol disguise primitives.
Read POLLUX-INVERSE-V1.md before starting work on inverse Pollux decoding, Pollux round-trip workflows, or symbol-to-bit recovery using known Pollux alphabets.
Read POLLUX-ROUNDTRIP-CONTENT-V1.md before starting work on Pollux demo/tutorial/challenge/manual follow-ons that teach explicit encode/decode round-trips.
Read PRNG-TEACHING-WORKSPACE-V1.md before starting work on bounded PRNG teaching demos, visible generator comparison workspaces, or any broader “what makes a generator good or bad” educational slice.
Read TRANSFORMATION-VISUALIZATION-V1.md before starting work on primitive-level drill-down or transformation-legibility features.
Read SBOX-TRANSFORMATION-V1.md before starting work on the first S-Box transformation view.
Read CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md before starting work on new primitive-language families, operator/control expansion, or long-range roadmap framing.
Read CRYPTO-OPERATORS-V1.md before starting work on the first post-`v1.13.0` operator-expansion slice.
Read CONTROL-PRIMITIVES-V1.md before starting work on counters, triggers, gates, or explicit conditional machine behavior.
Read BLOCK-FRAMING-V1.md before starting work on block splitting, padding, rejoining, or framing follow-ons.
Read BLOCK-CHAINING-V1.md before starting work on visible multi-block dependence, chaining, or mode-teaching follow-ons.
Read BYTE-ORIENTED-PRIMITIVES-V1.md before starting work on byte/word structure helpers, endianness transforms, or modern word-level follow-ons.
Read INTEGRITY-AUTHENTICATION-V1.md before starting work on visible tamper detection, MAC-style teaching, or authentication follow-ons.
Read AEAD-FOUNDATIONS-V1.md before starting work on authenticated-encryption composition, associated-data teaching, or combined confidentiality+integrity follow-ons.
Read DIGITAL-SIGNATURE-FOUNDATIONS-V1.md before starting work on visible signing, asymmetric authentication, or signature/verification follow-ons.
Read PROTOCOL-HANDSHAKES-V1.md before starting work on visible transcript composition, handshake teaching, or post-signature systems-level follow-ons.
Read MCW-V2-SANITY-PASS.md before starting work on post-`v1.44.0` product framing, library reorganization, or large-workspace cohesion follow-ons.
Read MCW-V2-SANITY-AUDIT.md before deciding what post-`v1.44.0` cohesion issue is actually highest leverage.
Read LEARNING-SEQUENCE-V2.md before extending the late learning spine or reorganizing the post-number-theory teaching surface.
Read PALETTE-COHERENCE-V1.md before reorganizing the primitive palette, module-library sections, or palette-facing domain-tab coherence.
Read LARGE-WORKSPACE-UX-TRIAGE-V1.md before changing large-workspace orientation, workspace-level navigation, or bounded canvas-orientation aids.
Read LARGE-WORKSPACE-UX-AUDIT.md before deciding whether large-workspace usability justifies anything broader than the current bounded landmarks fix.
Read V2.0-READINESS.md before debating whether MCW should still be treated as a late-`v1.x` project.
Read V2.0-READINESS-AUDIT.md before proposing extra pre-`v2.0` blocker work.
Read V2.0-RELEASE-CONTRACT.md before reframing the project’s major-version boundary.
Read V2.0-RELEASE-NOTES.md for the official meaning of `v2.0.0`.
Read SYSTEMS-IDE-COHERENCE-V1.md before reframing MCW’s global north star, reordering major product lines by product identity rather than local leverage, or proposing a coherence-first consolidation pass after the recent Python-export and multi-window milestones.
Read VERIFIED-MACHINE-COHERENCE-V1.md before reframing compare/trace/export as a unified verification story, defining what “verified” should mean in MCW, or proposing trust-first follow-on work after the current Python-export and multi-window milestones.
Read VERIFIED-MACHINE-WORKFLOW-V1.md before extending compare/analyze into a first-class verification station, adding known-answer verification cases, or proposing pass/fail reference checking against the current workspace.
Read VERIFIED-MACHINE-TICKED-WORKFLOW-V1.md before extending the verification station into temporal/ticked machines, adding bounded multi-tick known-answer verification cases, or proposing tick-aware first-divergence trust workflows for stateful machines.
Read EXPORT-ENGINE-PARITY-WORKFLOW-V1.md before adding a user-facing export-vs-engine trust workflow, generating parity-check artifacts for exported Python, or proposing engine/export behavior-checking beyond the current internal parity tests.
Read KNOWN-VECTOR-IMPORT-V1.md before adding bulk known-answer case input, vector paste/import workflows, or classroom-oriented verification-case acceleration inside the existing verification station.
Read USER-MANUAL-V1.md before adding a first-class user manual surface, searchable in-product help, a Resources-linked manual window, or structured manual/index content for onboarding and feature lookup.
Read AI-TOOLKIT-V1.md before adding an AI-facing toolkit package, a Resources-linked external-LLM handoff bundle, prompt scaffolds for MCW JSON generation, or any broader “AI assistant for layout generation” product surface.
Read CRYPTANALYSIS-VISUALS-V1.md before expanding the existing cryptanalysis workspace with new charts, stronger statistical visualizations, or bounded modern/classical analysis legibility upgrades.
Read CRYPTANALYSIS-PROMINENCE-V1.md before changing how cryptanalysis is reached relative to Tutorial and Challenge, promoting cryptanalysis to peer local-navigation footing, or reframing the learning/analysis dock structure.
Read V2.1-AUTHORING-POWER-PLAN.md before proposing the first post-`v2.0.0` builder-power line.
Read REPEATED-STRUCTURE-AUTHORING-V1.md before changing same-workspace cluster duplication, repeated-structure authoring, or first-wave `v2.1` builder acceleration.
Read SELECTED-CLUSTER-OPERATIONS-V1.md before changing drag-box selection, selected-cluster deletion, or the second bounded `v2.1` authoring-power slice.
Read WORKSPACE-HISTORY-V1.md before changing workspace-local undo/redo, reducer history, or bounded authoring safety nets.
Read WORKSPACE-VERSIONING-V1.md before changing named workspace checkpoints, restore points, or longer-horizon workspace recovery.
Read WORKSPACE-VISIBILITY-NAVIGATION-V1.md before changing zoom, fit/reset view, or trace-driven workspace focus recovery.
Read CONNECTION-AUTHORING-ERGONOMICS-V1.md before changing direct rewiring, input-connection replacement, or first-wave wire-editing ergonomics.
Read PARAMETER-AUTHORING-ERGONOMICS-V1.md before changing bulk parameter application, parameter clipboard behavior, or first-wave inspector tuning ergonomics.
Read PARAMETER-COMPARISON-ERGONOMICS-V1.md before changing selected-sibling parameter comparison, inline divergence chips, or inspector-local comparison summaries.
Read PRIMITIVE-MICRO-DEMOS-V1.md before changing primitive-local `Try Demo` actions, micro-demo registry behavior, or palette-local seeded examples.
Read PRIMITIVE-MICRO-DEMOS-V2.md before extending primitive-local micro demos into timing, state, or framing examples.
Read PRIMITIVE-MICRO-DEMOS-V3.md before extending primitive-local micro demos into rotor traversal or reverse-path examples.
Read WIRE-LEGIBILITY-ERGONOMICS-V1.md before changing wire selection, one-hop connection emphasis, or workspace-level path legibility behavior.
Read TRACE-WORKSPACE-BRIDGING-V1.md before changing active trace emphasis in the workspace, one-hop step-context highlighting, or trace/workspace visual bridging behavior.
Read COMPOSITE-REUSE-ERGONOMICS-V1.md before changing composite promotion clarity, composite boundary workflow, or composite-reuse ergonomics.
Read WORKSPACE-COMPARISON-ERGONOMICS-V1.md before changing saved-version workspace comparison, structural diff overlays, or current-vs-baseline comparison behavior.
Read MULTIWAY-ROUTING-V1.md before proposing multi-way case-switch routing, indexed output selection, or multi-output control-flow primitives.
Read CONDITIONAL-COMPOSITION-V1.md before proposing explicit finite branch composition, if/else style graph behavior, or bounded conditional graph structure.
Read ITERATOR-CONTROL-V1.md before proposing stronger iterator control, bounded repeated-condition behavior, or iterator-level control-flow extensions.
Read ROTOR-REVERSE-PATH-V1.md before proposing reverse rotor traversal, inverse rotor signal paths, or historically faithful forward / reflect / reverse rotor behavior.
Read LINKED-ROTOR-PAIRING-V1.md before changing how `Rotor` and `RotorReverse` share state, stepping ownership, or linked forward/reverse rotor behavior.
Read ROTOR-DRIVEN-STEPPING-V1.md before proposing rotor-driven stepping, rotor-control submachines, or SIGABA-style stepping behavior.
Read ROTOR-CONTROL-BANK-V1.md before proposing visible control-bank rotor patterns, SIGABA-like authored stepping, or one-bank-drives-another rotor mechanics.
Read PYTHON-EXPORT-V1.md before proposing workspace-to-code export, standalone Python generation, or implementation-oriented codegen lines.
Read PYTHON-EXPORT-FOUNDATIONS-V1.md before extending the shipped stateless Python export slice, broadening the supported module subset, or changing export compatibility/parity behavior.
Read PYTHON-EXPORT-EXPANSION-V1.md before extending Python export support beyond the foundations subset toward stateless modern-construction primitives such as `SBox`, `AddMod`, `SubMod`, and `Modulo`.
Read PYTHON-EXPORT-EXPANSION-V2.md before extending Python export support further across stateless arithmetic, control, or byte-structure primitives such as `Majority`, `GreaterThan`, `MulMod`, `ByteRotate`, `ByteSwap`, or `BitUnpad`.
Read PYTHON-EXPORT-EXPANSION-V3.md before extending Python export support further across stateless protocol-material or symbol-structure primitives such as `KeyInput`, `IV`, `Nonce`, `Salt`, `SymbolPermutation`, or `SymbolWindow`.
Read PYTHON-EXPORT-EXPANSION-V4.md before extending Python export support further across stateless Baudot bridge/sink support such as `BitsToBaudot` or `BaudotOutput`, or before beginning the transition to stateful export.
Read PYTHON-EXPORT-STATEFUL-FOUNDATIONS-V1.md before extending the shipped stateful/ticked Python export slice, changing exported `Clock`/`Counter` tick-loop parity, or broadening temporal export toward rotors, `LFSR`, or other stateful families.
Read PYTHON-EXPORT-STATEFUL-EXPANSION-V1.md before extending the shipped `LFSR` temporal Python export bridge, changing keystream-style state export behavior, or broadening stateful export from `Clock`/`Counter`/`LFSR` toward the rotor family.
Read PYTHON-EXPORT-ROTOR-FOUNDATIONS-V1.md before extending the shipped forward-`Rotor` Python export slice, changing rotor traversal/turnover/clock-gated parity behavior, or broadening stateful export toward `RotorReverse`, linked pairs, reflector return paths, or control-bank behavior.
Read PYTHON-EXPORT-ROTOR-RETURN-PATH-V1.md before extending Python export into `Reflector`/`RotorReverse`, implementing linked forward/reverse rotor return-path export, or broadening historical-machine export toward control-bank or broader multi-rotor behavior.
Read PYTHON-EXPORT-ROTOR-CONTROL-V1.md before extending Python export toward turnover-driven multi-rotor stepping, rotor-control teaching paths, or broader historical-machine control behavior short of full structured-machine export.
Read PYTHON-EXPORT-COMPOSITE-FOUNDATIONS-V1.md before extending Python export into first-class composite helpers, structured-machine export, or broader export support that preserves authored submachine boundaries rather than flattening them away.
Read PYTHON-EXPORT-ITERATOR-FOUNDATIONS-V1.md before extending Python export into first-class iterator helpers, bounded repeated-round machine export, or broader structured export that preserves iterator round boundaries and key-bus slicing behavior.
Read PYTHON-EXPORT-STRUCTURED-COMPATIBILITY-V1.md before loosening the current structured export boundary, allowing iterator-containing composites, or changing Python export compatibility behavior for nested/recursive structured cases.
Read PYTHON-EXPORT-FULL-COVERAGE-AUDIT-V1.md before claiming near-complete Python export coverage, choosing the next export-completeness milestone, or broadening the export line without an explicit gap audit.
Read PYTHON-EXPORT-COVERAGE-MAP-V1.md before choosing the next Python export implementation target after the audit, especially when deciding between remaining primitive/runtime gaps and broader recursive structured export.
Read PYTHON-EXPORT-PLUGBOARD-V1.md before extending Python export into `Plugboard`, changing the remaining Enigma-class primitive export gap, or widening the historical-machine export line beyond the current bounded target.
Read PYTHON-EXPORT-NESTED-COMPOSITES-V1.md before extending Python export into nested composite helper generation, recursive composite structure, or broader mixed recursive structure export.
Read PYTHON-EXPORT-ITERATOR-CONTAINING-COMPOSITES-V1.md before extending Python export into composites whose bodies contain iterator helpers, loosening the current mixed-structure export boundary, or broadening toward generalized recursive composite/iterator export.
Read PYTHON-EXPORT-NESTED-ITERATORS-V1.md before extending Python export into iterator round definitions that are themselves iterators, nested iterator helper generation, or broader generalized recursive export beyond common authored machine shapes.
Read PYTHON-EXPORT-GENERALIZED-MIXED-RECURSION-V1.md before claiming full structural completeness for Python export, extending helper generation across the remaining mixed recursive composite/iterator cases, or changing the current boundary between explicit helper export and hidden runtime behavior.
Read PYTHON-EXPORT-V1-COMPLETE.md before describing the current Python export leg as complete, summarizing what is now fully covered, or framing the remaining export work as productization rather than ordinary capability gaps.
Read PYTHON-EXPORT-RUNTIME-LIBRARY-V1.md before changing Python export from the current self-contained one-file artifact into a reusable runtime-library plus generated-workspace split.
Read PYTHON-EXPORT-RUNTIME-LIBRARY-FOUNDATIONS-V1.md before implementing the first two-file runtime-library export slice, changing emitted artifact layout, or moving reusable helper/runtime code out of the generated workspace file.
Read PYTHON-EXPORT-RUNTIME-SURFACE-V1.md before reshaping the public surface of `mcw_runtime.py`, changing workspace/runtime provenance headers, or tightening the intended stable API boundary of the two-file Python export.
Read PYTHON-EXPORT-DELIVERY-UX-V1.md before changing how two-file Python exports are handed off to the user, bundling runtime/workspace artifacts together, or refining the delivery UX of the split runtime export.
Read V2.1-NEXT-DOCKET.md before reordering the current near-future priorities across builder power, Python export expansion, UI refactoring, or multi-window workspace support.
Read WORKBENCH-MENU-CLEANUP-V1.md before reorganizing the workbench control strip, grouping workspace actions into dropdown categories, or reframing the top workbench shell around intent-based menus.
Read INSPECTOR-REFACTOR-V1.md before restructuring `parameter-inspector.tsx`, moving more inspector logic into helper modules, or beginning a larger inspector decomposition pass.
Read WORKBENCH-REFACTOR-V1.md before restructuring `workbench-panel.tsx`, moving more workbench helper logic into extracted modules, or beginning a larger workbench decomposition pass.
Read STAGE-ASSEMBLY-ERGONOMICS-V1.md before changing selected stage-row / stage-column layout actions or broader stage-oriented builder-power assembly helpers.
Read CLUSTER-BOUNDARY-PORT-AUTHORING-V1.md before changing inferred composite boundary-port capture, adding capture-time boundary controls, or expanding composite-boundary authoring behavior.
Read MULTI-WINDOW-WORKSPACE-V1.md before extending the shipped detachable `Palette` / `Inspector` windows, broadening multi-tab workspace surfaces, or changing the host-authoritative synchronization model.
Read MULTI-WINDOW-WORKSPACE-V2.md before extending the shipped detachable `Learning` window, splitting tutorials and challenges apart, or broadening the detached learning surface toward cryptanalysis or other panes.
Read MULTI-WINDOW-TABBED-WINDOWS-V1.md before extending the shipped tabbed detached-window groupings, broadening the `Windows` control surface, or allowing detached combinations beyond `Palette`, `Inspector`, and `Learning`.
Read MULTI-WINDOW-DETACHED-POLISH-V1.md before extending the shipped detached-window polish pass, broadening grouped-window naming/title behavior further, or turning the `Windows` surface into something more than a bounded refinement of the current tabbed-window model.
Read MULTI-WINDOW-COMBINED-VIEWS-V1.md before extending the shipped `tabs` / `combined` detached presentation modes, broadening ordered combined pane stacks beyond `Palette`, `Inspector`, and `Learning`, or turning combined detached windows into a richer layout engine.
Read MULTI-WINDOW-SPLIT-VIEWS-V1.md before extending the shipped detached `split` presentation mode, changing resizable horizontal detached pane pairs, or widening the current `tabs` / `combined` / `split` model toward broader split-tree layout composition.
Read APP-SHELL-REFACTOR-V1.md before extracting more `App.tsx` panel-routing or challenge-capture logic, or beginning a larger App-shell decomposition pass.
Read STORE-REFACTOR-V1.md before restructuring `src/ui/store.ts`, moving more workspace-history/versioning behavior into helper modules, or beginning a larger reducer decomposition pass.
Read PROTOCOL-MATERIAL-V1.md before starting work on IV, nonce, salt, or protocol-input sources.
Read SYMBOL-STRUCTURE-V1.md before starting work on symbol/message slicing, symbol windows, or post-permutation message-structure follow-ons.
Read LEARNING-SEQUENCE-V1.md before restructuring the teaching library, adding staged progression, or changing how demos/tutorials/challenges are ordered.
Read ARITHMETIC-EXPANSION-V1.md before starting work on modular multiplication, strict comparison, unpadding, or number-theoretic follow-ons.
Read NUMBER-THEORETIC-V1.md before starting work on modular exponentiation, modular inverse, or number-theoretic follow-ons.
Read BYPASS-V1.md before adding instance-level transform bypass, mute/solo behavior, or “turn this module off” controls.
Read INVERSE-PERMUTATION-AUTHORING-V1.md before extending permutation-editor helpers, inverse mapping tools, or decrypt-path permutation authoring.
Read BRIDGE-ERGONOMICS-V1.md before changing raw bit entry, byte-oriented bridges, or reversible/lossy bridge guidance.
Read OUTPUT-SINKS-V1.md before changing sink semantics, adding sink-specific outputs, or broadening output interpretation rules.
Read V1-POLISH-AND-TUTORIALS.md before starting work on `feature/v1-polish-and-tutorials`.
Read IMPLEMENTATION-STATUS.md for the latest safe checkpoint and handoff notes.

## Project: Modular Cryptography Workbench

A visual, composable cryptographic construction environment — a "cryptographic erector set" inspired by modular synthesizers. Cryptography as a signal-processing system: data flows through typed transformation modules connected in a DAG.

## Repository

- **Remote:** `git@github.com:Timothy815/Modular_crypto_worksbench.git`
- **GitHub Pages:** https://timothy815.github.io/Modular_crypto_worksbench/
- **Deployment:** GitHub Actions workflow in `.github/workflows/deploy.yml` — auto-deploys on push to `main`
- **Vite base path:** `/Modular_crypto_worksbench/` (required for GitHub Pages subdirectory hosting)

## Git Workflow & Branching Strategy

### Commit Rules
- Commit messages: imperative mood (e.g., "Add XOR module")
- Always run `npx vitest run` and `npm run build` before committing
- Do not push broken builds to `main`

### Branch Strategy
- **`main`** — stable, deployable. All pushes trigger GitHub Pages deployment.
- **Feature branches** — `feature/<name>` for new work (e.g., `feature/primitive-modules`, `feature/ui-editor`)
- **Merge to `main`** when tests pass and work is complete

### When to Create a Branch
Create a new branch at these checkpoints:
1. **Before starting a new sprint backlog step** (e.g., `feature/primitive-modules`, `feature/validation`)
2. **Before any risky or experimental change** — anything that touches `types.ts`, `executor.ts`, or `validation.ts` in a non-additive way
3. **Before UI work begins** — the transition from engine-only to UI is a major boundary
4. **Before adding stateful execution** — this will be the hardest architectural evolution

### Tags (Logical Checkpoints)
Tag `main` at these milestones so we can return to known-good states:
- `v0.1.0` — Engine infrastructure complete (types, validation, executor)
- `v0.2.0` — All V1 primitive modules implemented and tested
- `v0.3.0` — Reference hybrid pipeline passing end-to-end
- `v0.4.0` — Minimal UI functional
- `v0.5.0` — Composite workflow working
- `v0.6.0` — Analysis visibility and stepping working
- `v0.7.0` — Break workflows working
- `v0.8.0` — Guided challenges working
- `v1.0.0` — V1 milestone complete (all features in ENGINE-V1-CONTRACT.md)

### Recovery
If something goes wrong, these tags provide safe rollback points. Use `git log --oneline --graph` to understand history before any reset.

## Key Concepts

- **One unified system, multiple signal domains** — symbol and bits are domains within the same engine, connected by explicit bridge/conversion modules
- **Definition vs Instance vs Runtime** — three distinct data layers
- **Persistence is foundational** — composition creates identity
- **Iterative topological execution** — precomputed order, each module evaluates once per run, deterministic
- **No implicit conversion** — domain transitions require explicit conversion modules

## Key Constraints

- **Engine layer (`src/engine/`) has zero external dependencies** — no UI, no persistence, no side effects
- **Signals are typed** (`symbol` or `bits`) — never silently coerce between domains
- **All transformations are explicit** — every domain conversion must be a visible module in the graph
- **Composite modules are first-class** — they behave identically to primitives
- **Execution is deterministic** — topological sort, synchronous, no side effects in `evaluate()`

## Core Types

```ts
type Signal = { type: 'symbol'; value: string } | { type: 'bits'; value: number[] };
type ModuleDef = { id, name, inputs, outputs, paramSchema, evaluate };
type ModuleInstance = { id, defId, params };
type Connection = { from: { moduleId, port }, to: { moduleId, port } };
type Project = { modules: ModuleInstance[], connections: Connection[] };
type ModuleRegistry = Record<string, ModuleDefinition>;
```

## Tech Stack

- TypeScript (strict mode), Vite + React 18+, Vitest
- Graph rendering: React Flow or custom SVG/Canvas
- State: reducer-backed local UI state (`src/ui/store.ts`) for the current editor slice
- Persistence: localStorage / IndexedDB, JSON serialization

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
- Build check: `npm run build`
- Engine modules need unit tests for all signal type combinations
- Graph execution tested with known-answer vectors
- Composite modules tested for equivalence with expanded graphs

## Development Phases

1. **Engine First** — data models, module evaluation, graph traversal, tests
2. **Minimal UI** — manual module placement, connections, run + display
3. **Usability** — richer connection UX, save/load, inspector polish, theme work
4. **Composition** — composite modules, local library, versioning
5. **Analysis** — step-through, signal tracing, issue surfacing
6. **Break Workflows** — comparison, mutation experiments, eventually break/challenge tooling
7. **Guided Challenges** — classroom tasks, success checks, explainable failure
8. **Modern Primitives** — bit-domain expansion beyond XOR and static sources
9. **V1 Polish & Tutorials** — walkthroughs, finish polish, and classroom-ready guidance

## Current Resume Point

- Resume from current `main` at `v2.0.0`, with the next active line being `v2.1` authoring power
- The first bounded post-`v2.0` contract is `REPEATED-STRUCTURE-AUTHORING-V1.md`
- The next bounded follow-on after that is `SELECTED-CLUSTER-OPERATIONS-V1.md`
- The current active safety slice after cluster operations is `WORKSPACE-HISTORY-V1.md`
- The current checkpointing slice after that is `WORKSPACE-VERSIONING-V1.md`
- The current workspace-visibility slice after that is `WORKSPACE-VISIBILITY-NAVIGATION-V1.md`
- The current connection-authoring slice after that is `CONNECTION-AUTHORING-ERGONOMICS-V1.md`
- The current parameter-authoring slice after that is `PARAMETER-AUTHORING-ERGONOMICS-V1.md`
- The current parameter-comparison slice after that is `PARAMETER-COMPARISON-ERGONOMICS-V1.md`
- The current primitive-legibility slice after that is `PRIMITIVE-MICRO-DEMOS-V1.md`
- The current primitive-legibility expansion after that is `PRIMITIVE-MICRO-DEMOS-V2.md`
- The current shipped primitive-expansion slice after that is `MULTIWAY-ROUTING-V1.md`
- `v1.1.0` through `v1.12.0` are already shipped
- `v1.13.0` is now the builder-workflow milestone:
  - multi-select group movement
  - graph-aware `Tidy Layout`
  - blank and saved/deletable personal workspaces
  - composite unzip back into editable internals
- `v1.14.0` is now the cryptographic-operators milestone:
  - `AND`, `OR`, `NOT`
  - `AddMod`, `SubMod`, `Modulo`
  - explicit big-endian fixed-width arithmetic on `bits`
  - width-aware validation for the new operator family
  - `Beyond XOR` demo/tutorial/challenge
- `v1.15.0` is now the control-primitives milestone:
  - `Counter`
  - `Equals`
  - `AtLeast`
  - `Gate`
  - explicit one-bit control semantics on `bits`
  - `Counter Pulse Gate` demo/tutorial/challenge
  - Analyze transformation views for `Equals`, `AtLeast`, and `Gate`
- `v1.16.0` is now the block-framing milestone:
  - `BitSplit` (one `bits` input → two `bits` outputs: `left`/`right`, explicit `leftWidth` param)
  - `BitPad` (one `bits` input → one `bits` output, target width, pad side, pad bit)
  - reuse of existing `BitJoin` for block rejoining
  - width-aware validation for split and pad parameters
  - `Split Transform Rejoin` and `Pad and Split` demo workspaces
  - `Visible Block Boundaries` and `Padding Before Splitting` tutorials
  - `Repair the Split Width` and `Repair the Pad Width` challenges
  - Analyze transformation views for `BitSplit` and `BitPad`
- `v1.17.0` is now the protocol-material milestone:
  - `IV`
  - `Nonce`
  - `Salt`
  - source-only protocol-material helper with shared width-aware validation
  - explicit reject-if-too-long behavior and right-padding for short hex values
  - `Protocol Material Mixer` demo workspace
  - `Protocol Material Is Context` tutorial
  - `Repair the IV` challenge
- `v1.18.0` is now the stream-cipher milestone:
  - `Majority`
  - strict 1-bit width validation for majority inputs
  - Analyze transformation view for `Majority`
  - `Majority-Clocked Keystream` demo workspace
  - `The Majority-Clocked Keystream` tutorial
  - `Repair the Majority Vote` challenge
- `v1.19.0` is now the advanced-rotor milestone:
  - `Rotor` now separates `position` from `ringOffset`
  - `notches` and visible 1-bit `turnover`
  - temporal `clock` edges for stateful-module advance
  - `Advanced Rotor Stepping` demo workspace
  - `Advanced Rotor Stepping` tutorial
  - `Repair the Rotor Notch` challenge
- `v1.20.0` is now the second stream-cipher milestone:
  - `Mux`
  - strict 1-bit selector validation
  - Analyze transformation view for `Mux`
  - `Filtered Keystream` demo workspace
  - `The Filtered Keystream` tutorial
  - `Repair the Filter Selector` challenge
- `v1.21.0` is now the third stream-cipher milestone:
  - `Demux`
  - strict 1-bit routing validation
  - Analyze transformation view for `Demux`
  - `Routed Clock Keystream` demo workspace
  - `The Routed Clock Keystream` tutorial
  - `Repair the Routed Clock` challenge
- `v1.22.0` is now the symbol-permutation milestone:
  - `SymbolPermutation`
  - strict one-to-one symbol-order validation
  - Analyze transformation view for `SymbolPermutation`
  - `Visible Symbol Scramble` demo workspace
  - `Visible Symbol Scramble` tutorial
  - `Repair the Symbol Order` challenge
- `v1.23.0` is now the key-routing milestone:
  - `BitWindow`
  - explicit `start` / `width` sub-key extraction from one visible key bus
  - static out-of-range window validation when upstream width is knowable
  - Analyze transformation view for `BitWindow`
  - `Visible Sub-Key Bus` demo workspace
  - `Visible Sub-Key Bus` tutorial
  - `Repair the Key Window` challenge
- `v1.24.0` is now the symbol-structure milestone:
  - `SymbolWindow`
  - explicit `start` / `width` contiguous symbol-message extraction
  - static out-of-range window validation when input symbol length is knowable
  - Analyze transformation view for `SymbolWindow`
  - `Visible Message Window` demo workspace
  - `Visible Message Window` tutorial
  - `Repair the Message Window` challenge
- `v1.25.0` is now the arithmetic-expansion milestone:
  - `MulMod` (modular multiplication on equal-width bit words)
  - `GreaterThan` (strict comparison emitting 1-bit control)
  - `BitUnpad` (strip padding to recover original width)
  - Analyze transformation view for `GreaterThan` (reuses compare view)
  - `Multiply Compare Unpad` demo workspace
  - `Multiply Compare Unpad` tutorial
  - `Repair the Unpad Width` challenge
- `v1.26.0` is now the number-theoretic foundations milestone:
  - `ModExp` (modular exponentiation via repeated squaring)
  - `ModInverse` (modular multiplicative inverse via extended Euclidean algorithm)
  - modulus-vs-width static validation for both modules
  - `Toy RSA` demo workspace
  - `Key Schedule Workshop` demo workspace
  - `Toy RSA Round-Trip` tutorial
  - `Key Schedule Workshop` tutorial
  - `Repair the RSA Exponent` challenge
  - `Repair the Key Rotation` challenge
- `v1.27.0` is now the transformation-view consolidation milestone:
  - Analyze transformation views for `MulMod`, `ModExp`, `ModInverse`, and `BitUnpad`
  - `arithmetic` view kind for number-word operations (shows expression, bit-level input/output grid)
  - `unpad` view kind for strip operations (mirrors the existing `pad` view)
  - `GreaterThan` compare view text corrected to show strict `A > B` semantics
- `v1.28.0` is now the teaching-pathfinding and hardening milestone:
  - seeded teaching-content audit coverage
  - routed-clock width-validation correction for routed control demos/challenges
  - first shipped learning-sequence UI:
    - stage-aware ordering
    - `Core Path` / `Optional`
    - `Best after`
    - `Recommended next`
- `v1.29.0` is now the bounded bypass milestone:
  - instance-level `bypass` on an explicit allow-list of eligible one-input / one-output same-domain modules
  - validation rejection for ineligible bypass
  - visible inspector toggle and canvas bypass badge
  - `Bypass Workshop` demo/tutorial/challenge
- `v1.30.0` is now the inverse-permutation authoring milestone:
  - `Build Inverse` helper for `Permutation` and `SymbolPermutation`
  - editor-side construction of the true inverse mapping, distinct from reverse order
  - explanatory UI hint clarifying that inverse undoes the current routing
- `v1.31.0` is now the bridge-ergonomics milestone:
  - permissive raw `BitSource` entry for continuous, spaced, or bracketed `0/1` text
  - grouped bit preview in the structured bits editor
  - direct `HexToAscii` bridge for readable 7-bit ASCII byte decoding from hex text
- `v1.32.0` is now the bridge-ergonomics-v2 milestone:
  - `AsciiToHex` bridge (symbol → symbol, 7-bit ASCII to uppercase hex)
  - sink-only output representation views for `Output` and `BitOutput`
  - Bits / Bytes / Hex / ASCII tabs with strict availability rules and explanation messaging
- `v1.33.0` is now the reversible-authoring milestone:
  - `Normalize Reciprocal Pairs` helper for `Plugboard`
  - `Normalize Reciprocal Pairs` helper for `Reflector`
  - exact reciprocal/involutive normalization helpers in the engine layer
  - editor-side teaching copy clarifying that these mappings already undo themselves
- `v1.34.0` is now the workspace-housekeeping milestone:
  - workspace-local module instance renaming with atomic reference updates
  - `Duplicate Workspace` for independent local copies
  - reset tutorial/challenge/tick session state on duplicate
  - conservative module-ID validation and unzip cleanup support
- `v1.35.0` is now the composite-port-hints milestone:
  - contextual composite/iterator boundary hints on hover
  - target-module-only input hints during live connection drag
  - quiet canvas at rest with no always-on labels or interface mutation
- `v1.36.0` is now the cross-workspace-clipboard milestone:
  - `Copy Selected Cluster` and `Paste Selected Cluster` for local workspace-to-workspace fragment reuse
  - selected modules only, internal-only connections, and relative layout preservation
  - fresh pasted IDs with immediate local divergence and no linked/library/system-clipboard semantics
- `v1.37.0` is now the diffie-hellman milestone:
  - visible `Diffie-Hellman Key Exchange` demo built from explicit `ModExp` paths
  - `Visible Shared Secret` tutorial placed after `Toy RSA Round-Trip`
  - `Repair the Shared Secret` challenge for restoring a matching shared-secret derivation
- `v1.38.0` is now the key-schedule-depth milestone:
  - visible `Recursive Key Schedule` demo with a three-step key ladder feeding the shipped keyed iterator
  - `One Round Key Becomes The Next` tutorial placed after `Key Schedule Workshop`
  - `Repair the Next Round Key` challenge for restoring a later-round derivation step
- `v1.39.0` is now the block-chaining milestone:
  - visible `Visible Block Chaining` demo with explicit IV seeding and block-to-block dependence
  - `Why The Next Block Depends On The Last` tutorial placed after `Recursive Key Schedule`
  - `Repair the Chaining Path` challenge for restoring the visible chaining edge into block 2
- `v1.40.0` is now the byte-oriented-primitives milestone:
  - `ByteRotate` and `ByteSwap` helpers with strict multiple-of-8 width validation
  - `Visible Byte Order` demo comparing byte-order reversal and byte-granularity rotation against `BitShifter`
  - `When Bits Become Bytes` tutorial placed after `Visible Block Chaining`
  - `Repair the Byte Order` challenge for restoring the explicit byte-order branch
- `v1.41.0` is now the integrity-authentication milestone:
  - visible `Visible Tamper Check` demo with readable sender/receiver message paths and explicit keyed tag recomputation
  - `Why Integrity Is Not Secrecy` tutorial placed after `Visible Byte Order`
  - `Repair the Tamper Check` challenge for restoring the receiver-side verification context
- `v1.42.0` is now the aead-foundations milestone:
  - visible `Visible Authenticated Encryption` demo with minimal encryption, explicit Encrypt-then-MAC tagging, receiver-side verification, and recovered plaintext
  - `Encrypting Is Not Enough` tutorial placed after `Visible Tamper Check`
  - `Repair the Protected Message` challenge for restoring authentication of the ciphertext path
- `v1.43.0` is now the digital-signature-foundations milestone:
  - visible `Visible Signature Verification` demo with private signing, public verification, and explicit pass/fail comparison
  - `Signing Is Not Encrypting` tutorial placed after `Encrypting Is Not Enough`
  - `Repair the Signature` challenge for restoring the public verification exponent
- `v1.44.0` is now the protocol-handshakes milestone:
  - visible `Visible Secure Handshake` demo with compact public exchange, signature verification, shared-key derivation, and one later protected message
  - `From Handshake To Protected Message` tutorial placed after `Signing Is Not Encrypting`
  - `Repair the Handshake` challenge for restoring the derived-key routing into the protection step

What is shipped on `main`:
- all V1 engine, UI, and workflow milestones
- signal probing and analysis hardening
- ticked/stateful execution engine and UI
- Build / Guide workspace mode (per-project, persisted)
- advanced modern foundry and multi-format bridges
- historical teleprinter / Lorenz teaching loops
- constrained iterators, key-bus distribution, depth tuning
- nested composite/iterator analysis and Feistel teaching loop
- lightweight text cryptanalysis in Compare
- dedicated Cryptanalysis workspace and Vigenere workshop flow
- modern-analysis Avalanche Explorer and guided Avalanche tutorial
- first bounded hashing foundations, demos, and tutorials
- parameter forwarding on reusable architectures
- transformation views for `Permutation`, `BitShifter`, `XOR`, and `SBox`
- Hashing V1 milestone framing through `v1.7.0`
- first two bounded hash collision challenges:
  - compression-hash collision
  - sponge-hash collision
  - project-aware challenge ownership
  - sponge-hash digest-path correction with audit-style regression tests
- first bounded post-collision interpretation slice:
  - side-by-side original vs colliding message comparison
  - post-success nudges into `Analyze` and `Modern Cryptanalysis`
  - internal-divergence helper based on `analysisTrace`
  - sponge-hardening asymmetry fix removing the paired-step shortcut
  - bundle/performance guardrails and build-time chunk budget enforcement
- first bounded tactile primitive authoring slice:
  - `SBox` grid editor with synced raw CSV
  - `Permutation` wire editor with synced raw CSV fallback
  - `Reflector` socket-pair editor with involution-safe pairing
  - `Rotor` wire editor with runtime-centered anchors and dotted endpoints
  - reflector validation hardening
- first bounded block-framing vocabulary:
  - `BitSplit` and `BitPad` primitives on `bits`
  - width-aware validation for split and pad parameters
  - `Split Transform Rejoin` and `Pad and Split` demos, `Visible Block Boundaries` and `Padding Before Splitting` tutorials, `Repair the Split Width` and `Repair the Pad Width` challenges
  - Analyze transformation views for `BitSplit` and `BitPad`
- first bounded protocol-material vocabulary:
  - `IV`, `Nonce`, and `Salt` source modules on `bits`
  - shared width-aware validation and explicit reject-if-too-long behavior
  - `Protocol Material Mixer` demo, `Protocol Material Is Context` tutorial, and `Repair the IV` challenge
- first bounded stream-cipher vocabulary:
  - `Majority`
  - strict 1-bit width validation for the three vote inputs
  - `Majority-Clocked Keystream` demo, `The Majority-Clocked Keystream` tutorial, and `Repair the Majority Vote` challenge
  - Analyze transformation view for `Majority`
- first bounded advanced-rotor realism vocabulary:
  - `ringOffset`, `notches`, and visible `turnover` on `Rotor`
  - temporal `clock` handling for stateful advance edges
  - explicit turnover-driven double-step wiring via `Clock`, `OR`, and `Gate`
  - `Advanced Rotor Stepping` demo/tutorial/challenge
- shipped advanced-rotor reverse-path follow-on:
  - `RotorReverse` for explicit inverse traversal through the active rotor wiring
  - historically faithful `Rotor -> Reflector -> RotorReverse` graph structure
  - `Rotor Return Path` demo/tutorial
- second bounded stream-cipher vocabulary:
  - `Mux`
  - strict 1-bit selector validation
  - `Filtered Keystream` demo, `The Filtered Keystream` tutorial, and `Repair the Filter Selector` challenge
  - Analyze transformation view for `Mux`
- first bounded symbol/message-structure vocabulary:
  - `SymbolWindow` for contiguous symbol-domain extraction
  - static out-of-range window validation when input length is knowable
  - `Visible Message Window` demo, tutorial, and `Repair the Message Window` challenge
  - Analyze transformation view for `SymbolWindow`
- first bounded arithmetic-expansion vocabulary:
  - `MulMod` for modular multiplication on equal-width bit words
  - `GreaterThan` for strict comparison emitting 1-bit control
  - `BitUnpad` for stripping padding to recover original width
  - `Multiply Compare Unpad` demo, tutorial, and `Repair the Unpad Width` challenge
- first bounded number-theoretic foundations vocabulary:
  - `ModExp` for modular exponentiation via repeated squaring
  - `ModInverse` for modular multiplicative inverse via extended Euclidean algorithm
  - `Toy RSA` and `Key Schedule Workshop` demos, tutorials, and challenges

Key contracts to check before implementation:
- `ENGINE-V1-CONTRACT.md` for engine decisions
- `ADVANCED-FOUNDRY-CLOCK-V1.md` for ticked execution decisions (especially §7 for deferred work)
- `ITERATIVE-ROUNDS-AND-KEYSCHEDULES-V1.md` for bounded iterator decisions
- `KEY-SCHEDULE-GROUNDWORK-V1.md` for explicit round-key decisions
- `CRYPTANALYSIS-WORKSPACE-V1.md` for product boundary and first-slice scope
- `MODERN-ANALYSIS-V1.md` for the first post-`v1.4.0` visual analysis milestone
- `HASHING-V1.md` for the current hashing line and scope boundary
- `HASH-COLLISION-CHALLENGE-V1.md` for the first bounded post-hashing milestone challenge slice
- `SPONGE-COLLISION-CHALLENGE-V1.md` for the shipped sponge-collision follow-on
- `POST-COLLISION-INTERPRETATION-V1.md` for the shipped first interpretation milestone after the collision challenges
- `CUSTOM-SBOX-AUTHORING-V1.md` for the shipped substitution-table authoring slice
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md` for the new long-range language/roadmap framing
- `CRYPTO-OPERATORS-V1.md` for the shipped first bounded operator-expansion line
- `CONTROL-PRIMITIVES-V1.md` for the shipped first bounded control/counter/gate line
- `BLOCK-FRAMING-V1.md` for the shipped first bounded block-framing vocabulary
- `PROTOCOL-MATERIAL-V1.md` for the shipped first bounded protocol-input slice
- `ADVANCED-ROTOR-REALISM-V1.md` for the shipped first bounded rotor-realism slice
- `STREAM-CIPHER-V2.md` for the shipped second bounded stream-machine slice
- `ARITHMETIC-EXPANSION-V1.md` for the shipped first bounded arithmetic-expansion line
- `NUMBER-THEORETIC-V1.md` for the shipped first bounded number-theoretic foundations
- `DIFFIE-HELLMAN-V1.md` for the shipped second asymmetric teaching scenario built from visible `ModExp` paths
- `KEY-SCHEDULE-DEPTH-V1.md` for the shipped symmetric-construction follow-on after key-bus groundwork
- `BLOCK-CHAINING-V1.md` for the framed bounded multi-block dependence slice after framing, protocol material, and key-schedule depth
- `BYTE-ORIENTED-PRIMITIVES-V1.md` for the framed bounded modern-construction slice after visible block chaining
- `INTEGRITY-AUTHENTICATION-V1.md` for the framed bounded teaching slice after hashing, chaining, and byte/word structure
- `AEAD-FOUNDATIONS-V1.md` for the framed bounded composition slice after standalone integrity/authentication
- `DIGITAL-SIGNATURE-FOUNDATIONS-V1.md` for the framed bounded asymmetric-authentication slice after AEAD foundations
- `PROTOCOL-HANDSHAKES-V1.md` for the framed bounded systems-level slice after the completed asymmetric-foundations phase
- `MCW-V2-SANITY-PASS.md` for the next proposed product-level cohesion pass after the first systems-composition checkpoint
- `BYPASS-V1.md` for the shipped bounded instance-level bypass line
- `INVERSE-PERMUTATION-AUTHORING-V1.md` for the shipped bounded inverse-permutation authoring slice
- `BRIDGE-ERGONOMICS-V1.md` for the shipped bounded bridge/usability slice
- `BRIDGE-ERGONOMICS-V2.md` for the shipped second bridge/representation slice
- `CROSS-WORKSPACE-CLIPBOARD-V1.md` for the shipped local fragment-reuse builder slice
- `PARAM-FORWARDING-V1.md` for explicit exposed-internal controls on composites and iterators
- `TRANSFORMATION-VISUALIZATION-V1.md` for the shipped first primitive transformation milestone
- `SBOX-TRANSFORMATION-V1.md` for the shipped first lookup/substitution visual family

Near-term follow-ups:
- treat the next phase as expressive machine-language growth, not just the next isolated feature
- continue from shipped primitive and auth foundations toward the next bounded systems-level language family
- treat a `v2.0` sanity/framing pass as the next product-level checkpoint after the first systems-composition milestone, not as a replacement for it
- keep future rotor follow-ons bounded:
  - reversible rotation direction
  - flipped insertion
  - deeper rotor-bank realism only if it remains explicit
- plan tutorials and challenges alongside any new primitive family so the language and teaching layers grow together
- treat `WORKBENCH-ERGONOMICS-V1.md`, `WORKSPACE-LIBRARY-V1.md`, and `COMPOSITE-UNZIP-V1.md` as shipped first-milestone builder foundations
- avoid widening workspace library into sharing/folders or unzip into bulk/iterator expansion without a new contract
- keep hashing connected to the modern-analysis and transformation-visualization surfaces
- keep bundle growth inside the new guardrails
- monitor challenge-induced project switching in classroom use before adding warnings
- avoid opening a second transformation-visualization slice before classroom feedback

## When Working on This Project

- Always check `ENGINE-V1-CONTRACT.md` for locked decisions before implementation
- The engine must remain independent — if you need to import from `ui/` or `persistence/` into `engine/`, stop and rethink
- Prefer small, focused modules — each primitive does one transformation
- Validate signal types at port boundaries, not inside module logic
- Remember: this is an educational tool for a cybersecurity teacher's classroom
