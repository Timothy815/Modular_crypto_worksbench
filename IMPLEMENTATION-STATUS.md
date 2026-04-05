# MCW — Implementation Status

Last updated: April 4, 2026

---

## Current State

The latest shipped release checkpoint is `v2.1.0`.
The previous major boundary was `v2.0.0`.

`v2.1.0` now includes:
- first-session onboarding
- user manual
- instructor pilot pack
- AI toolkit
- cryptanalysis visibility and visualization improvements
- Pollux fractionation and inverse round-trip teaching line
- S-box authoring and table transforms
- PRNG teaching workspaces
- flagship classical and modern lab sequences
- verification explainability

Current `main` now also includes later post-`v2.1.0` follow-ons:
- `SHAREABLE-LAB-PACKS-V1.md`
- `BITSTREAM-RANDOMNESS-LAB-V1.md`
- `CRYPTANALYSIS-PROMINENCE-V1.md`
- `SEQUENTIAL-STATE-AUTHORING-V1.md`
- `SBOX-GENERATION-WORKFLOW-V1.md`
- `UI-ARCHITECTURE-STABILIZATION-V1.md`

The older `v2.1` builder-power / maintainability queue is now largely already present on `main`:
- `REPEATED-STRUCTURE-AUTHORING-V1.md`
- `SELECTED-CLUSTER-OPERATIONS-V1.md`
- `WORKSPACE-HISTORY-V1.md`
- `WORKSPACE-VERSIONING-V1.md`
- `WORKSPACE-VISIBILITY-NAVIGATION-V1.md`
- `CONNECTION-AUTHORING-ERGONOMICS-V1.md`
- `PARAMETER-AUTHORING-ERGONOMICS-V1.md`
- `PARAMETER-COMPARISON-ERGONOMICS-V1.md`
- `INSPECTOR-REFACTOR-V1.md`
- `WORKBENCH-REFACTOR-V1.md`
- `STORE-REFACTOR-V1.md`
- `APP-SHELL-REFACTOR-V1.md`
- `UI-ARCHITECTURE-STABILIZATION-V1.md`

Current active sequencing should now be read as:
- choose the next product-facing slice from the remaining unshipped contracts
- keep future work explicit, bounded, and evidence-driven

The next dense-workspace node-legibility slice is now shipped as:
- `PORT-ORDER-AUTHORING-V1.md`
- a bounded per-instance port-order authoring pass for reducing local crossings and card clutter
- keeps the work in workspace UI metadata only and stops short of per-port side placement or engine-level port-definition changes

The next dense-workspace node-legibility follow-on is now also shipped as:
- `PORT-SIDE-LAYOUT-PRESETS-V1.md`
- a bounded per-instance visual port posture pass with `Default`, `Horizontal`, and `Vertical`
- keeps the work in workspace UI metadata only and stops short of arbitrary per-port side placement

The next dense-workspace node-legibility candidate after that is now also shipped as:
- `PER-PORT-SIDE-AUTHORING-V1.md`
- a bounded per-instance individual-port side assignment pass with `Left`, `Right`, `Top`, and `Bottom`
- now solves real local crossover cases without drifting into arbitrary per-port free placement

The next dense-workspace signal-reading candidate after that is now also shipped as:
- `BOUNDED-WIRE-DIRECTION-CUES-V1.md`
- a bounded active-only wire-direction pass for hovered, selected, and traced wires
- now improves path reading without turning the canvas into a permanently arrowed traffic map

The next dense-workspace wire-authoring candidate is now:
- `MULTI-ANCHOR-ORTHOGONAL-WIRE-AUTHORING-V1.md`
- a bounded selected-wire multi-anchor authoring model for orthogonal paths
- intended to feel closer to drawing while staying grid-snapped, orthogonal, and UI-only

Another shipped bounded readability slice after that is:
- `COMPOSITE-INSTANCE-DRILLDOWN-V1.md`
- instance-scoped composite inspection in a transient drill-down view
- explicitly read/trace/analyze first, with no instance override model in V1

The product-shaping north-star note is now also shipped:
- `SYSTEMS-IDE-COHERENCE-V1.md`
- defines MCW as a visual cryptographic systems IDE
- makes `Author / Understand / Verify / Export` the clearest core pillar set
- treats future prioritization as a coherence question rather than a novelty question

The next wire-legibility follow-on after node rotation and wire labels/colors is now shipped:
- `ORTHOGONAL-WIRE-ROUTING-V1.md`
- a bounded workspace-level `Curved` / `Orthogonal` routing slice
- ships deterministic right-angle paths in workspace UI metadata with no freeform bend-point editing in V1

The next bounded routing-control follow-on after that is now shipped:
- `MANUAL-WIRE-BEND-EDITING-V1.md`
- a bounded orthogonal-wire bend-editing slice
- ships per-connection bend overrides in workspace UI metadata only and stops short of arbitrary path editing

The next local graph-layout follow-on now shipped is:
- `SELECTED-CLUSTER-ALIGNMENT-V1.md`
- a bounded selected-cluster alignment/distribution slice
- now adds explicit align/distribute actions while keeping layout cleanup local to the visible selection and stopping short of a full diagramming toolbar

The next large-workspace readability slice now shipped after that is:
- `STAGE-GROUP-BOXES-V1.md`
- a bounded visual grouping-region slice for rounds, banks, phases, and feedback areas
- keeps grouping purely visual and stored only in workspace UI metadata

The next large-workspace navigation slice now shipped after that is:
- `MINIMAP-OVERVIEW-NAVIGATOR-V1.md`
- a bounded overview navigator with viewport tracking and click-to-pan navigation
- keeps visibility persisted per workspace as UI metadata only

The next workbench-chrome refinement after that is now shipped as:
- `WORKBENCH-QUICK-ACTIONS-V1.md`
- a bounded quick-access strip for high-frequency canvas controls
- keeps grouped dropdown menus intact as the full fallback path

The next manual-layout refinement after that is now shipped as:
- `SOFT-GRID-SNAP-V1.md`
- adds per-workspace soft grid visibility and optional snap-to-grid placement
- keeps the first slice bounded to module placement only

The next orthogonal-routing follow-on after that is now shipped as:
- `WIRE-LANE-PREFERENCE-V1.md`
- a bounded per-connection lane-bias slice for orthogonal auto routing
- keeps the slice in workspace UI metadata only and stops short of pathfinding or arbitrary wire editing

The next structured-layout follow-on after that is now shipped as:
- `GUIDE-RAILS-V1.md`
- a bounded visual guide-rail slice for horizontal and vertical workspace alignment aids
- keeps rails in workspace UI metadata only with no snapping solver or graph semantics in V1

The next guide-rail follow-on after that is now shipped as:
- `GUIDE-SNAP-V1.md`
- a bounded snap-to-guides slice for module placement and dragging
- keeps the slice focused on nearby rail alignment with no solver, wire snapping, or note/group-box snapping

The next readability follow-on after that is now shipped as:
- `ON-CANVAS-STAGE-LABELS-V1.md`
- a bounded stage-label slice for lightweight on-canvas rounds, outputs, and feedback markers

The next interaction-coherence follow-on after that is now shipped as:
- `WORKSPACE-POLISH-V2.md`
- a bounded workspace polish pass for calmer stage-label affordances and more context-sensitive quick actions
- keeps the labels visual-only and intentionally lighter than notes or group boxes

The next drag-feedback follow-on after that is now shipped as:
- `DRAG-ALIGNMENT-GUIDES-V1.md`
- a bounded visual drag-guide pass for temporary module and guide-rail alignment cues
- keeps the slice visual-only with no new persistence or snapping semantics

The next guide/stage snap follow-on after that is now shipped as:
- `GUIDE-STAGE-SNAP-EXPANSION-V1.md`
- a bounded snap expansion for stage-label anchors and group-box edge/center lines
- keeps the slice focused on module placement and drag cues with no solver or wire snapping

The next workspace coherence follow-on after that is now shipped as:
- `WORKSPACE-POLISH-V3.md`
- a bounded polish pass for clearer quick-action grouping and quieter non-selected layout furniture
- keeps the slice UI-only with no new layout semantics or persistence

The next wire-legibility follow-on after that is now shipped as:
- `WIRE-COLOR-CUSTOMIZATION-V1.md`
- a bounded workspace-level wire-color mode slice for `domain`, `neutral`, and `high-contrast`
- keeps the slice in workspace UI metadata only and establishes the base modes for later per-wire overrides

The next wire-legibility follow-on after that is now shipped as:
- `ARBITRARY-WIRE-COLORING-V1.md`
- a bounded per-connection recoloring slice using a curated palette
- keeps the slice in workspace UI metadata only and preserves selected/trace/error emphasis as authoritative

The next wire-legibility polish follow-on after that is now shipped as:
- `WIRE-POLISH-V1.md`
- a bounded toolbar/menu clarity pass for current selected-wire path, lane, and color state
- keeps the slice UI-only and avoids new routing or color semantics

The next wire-readability follow-on after that is now shipped as:
- `SELECTED-WIRE-DETAILS-V1.md`
- a bounded selected-wire details card for source, target, and current state
- keeps the slice UI-only and avoids adding a second inspector surface

The next workspace-readability symmetry follow-on after that is now shipped as:
- `LAYOUT-FURNITURE-DETAILS-V1.md`
- a bounded details-card pass for selected stage labels, group boxes, and guide rails
- keeps the slice UI-only and adjacent to the existing layout tools

The next selection-coherence follow-on after that is now shipped as:
- `SELECTION-DETAILS-UNIFICATION-V1.md`
- a bounded shared selection-details section for wires and layout furniture
- keeps the slice UI-only and preserves existing selection behavior

The next workspace-chrome simplification follow-on after that is now shipped as:
- `WORKBENCH-CONTROL-SIMPLIFICATION-V1.md`
- a bounded trim pass for duplicated high-frequency menu entries
- keeps menus focused on lower-frequency structure, version, and import/export actions

The next bounded discovery candidate is now:
- `SEARCH-FIRST-PALETTE-V1.md`
- a search-first primitive-discovery pass inside the existing palette surface
- intended to reduce scroll-heavy lookup without widening into a global command palette

The next structured-primitive inspector follow-ons after that are now shipped as:
- `PERMUTATION-INSPECTOR-POLISH-V1.md`
- `ROTOR-INSPECTOR-POLISH-V1.md`
- `STRUCTURED-EDITOR-UNIFICATION-V1.md`
- together they move permutation and rotor authoring toward direct visual manipulation and align the structured primitive editors under a shared inspector language

Current `main` now also includes:
- Python export foundations:
  - one workspace-local `Export Python` action beside JSON export
  - stateless primitive-only compatibility gating
  - one standalone `.py` artifact with embedded helper runtime and topological `run()`
  - parity coverage against `executeProject()` for supported workspaces
- Python export expansion:
  - `SBox`
  - `AddMod`
  - `SubMod`
  - `Modulo`
  - parity-tested substitution and modular-arithmetic export paths
- Python export expansion v2:
  - `Majority`
  - `GreaterThan`
  - `MulMod`
  - `ByteRotate`
  - `ByteSwap`
  - `BitUnpad`
  - parity-tested control/arithmetic and byte-structure export paths
- Python export expansion v3:
  - `KeyInput`
  - `IV`
  - `Nonce`
  - `Salt`
  - `SymbolPermutation`
  - `SymbolWindow`
  - parity-tested protocol-material and symbol-structure export paths
- Python export expansion v4:
  - `BitsToBaudot`
  - `BaudotOutput`
  - parity-tested stateless Baudot decoding export path
- stateful export foundations:
  - `PYTHON-EXPORT-STATEFUL-FOUNDATIONS-V1.md`
  - first bounded ticked export slice shipped for `Clock` and `Counter`
  - one explicit exported tick loop with parity against `executeTickedProject()`
  - per-tick sink output lines in stable `tick <n> | <module_id>: <value>` form
  - intended as the proving ground for readable temporal Python export before rotor or LFSR support
- next careful stateful export follow-on:
  - `PYTHON-EXPORT-STATEFUL-EXPANSION-V1.md`
  - shipped `LFSR` as the first cryptographically meaningful temporal export primitive beyond `Clock` and `Counter`
  - parity-tested for direct keystream emission and logic-influencing ticked use
  - still keeps rotor-family export out of scope after this bridge slice
- next careful rotor-family export frontier:
  - `PYTHON-EXPORT-ROTOR-FOUNDATIONS-V1.md`
  - records bounded forward `Rotor` export as the next temporal runtime target
  - keeps `RotorReverse`, linked pairing, reflector return paths, and control-bank scheduling out of scope
  - treats rotor export as the next serious move toward eventual MCW execution parity in Python
  - now shipped with parity coverage for stepping symbol output, turnover-driven downstream behavior, and clock-gated stepping
  - generated Python now includes short systematic comments naming each exported module block
- next careful rotor return-path export frontier:
  - `PYTHON-EXPORT-ROTOR-RETURN-PATH-V1.md`
  - records bounded `Reflector` + `RotorReverse` export as the next honest historical-machine slice
  - keeps rotor control-bank scheduling and broader multi-rotor export out of scope
  - preserves explicit linked forward/reverse rotor behavior in generated Python rather than collapsing it into a hidden machine object
  - now shipped with parity coverage for plain return-path output, stepped return-path output, and linked reverse turnover used downstream
- rotor-control export:
  - `PYTHON-EXPORT-ROTOR-CONTROL-V1.md`
  - shipped bounded turnover-driven multi-rotor stepping export as the next historical-machine slice
  - generated Python now records explicit step flags during evaluation and applies advances in a final tick-end pass
  - parity-tested for direct turnover stepping, gated turnover stepping, and a double-step-style three-rotor path
- structured-machine export:
  - `PYTHON-EXPORT-COMPOSITE-FOUNDATIONS-V1.md`
  - shipped first-class helper-function composite export for depth-1 composite bodies
  - preserves authored submachine boundaries in generated Python instead of flattening them away
  - parity-tested for stateless shipped composites, user-authored forwarded-param composites, and temporal composites with supported internals
- next structured-machine export frontier:
  - `PYTHON-EXPORT-ITERATOR-FOUNDATIONS-V1.md`
  - shipped first-class helper-function iterator export for bounded repeated-round machines
  - preserves visible round boundaries, explicit round chaining, key-bus slicing, and iteration-count override behavior in generated Python
  - parity-tested for shipped iterators, keyed iterators, and temporal iterators with supported round definitions
  - keeps nested iterators and iterator-containing composites out of scope for the first slice
- next structured-machine export follow-on:
  - `PYTHON-EXPORT-ITERATOR-EXPANSION-V1.md`
  - shipped broader iterator export coverage across higher-value shipped iterator families:
    - `FeistelRoundIterator`
    - `HashDigestRoundIterator`
    - `SpongeMixRoundIterator`
  - parity-proven within the existing helper-function iterator export architecture
  - keeps nested iterators, iterator-containing composites, and generalized recursive structured export out of scope
- structured export compatibility tightening:
  - `PYTHON-EXPORT-STRUCTURED-COMPATIBILITY-V1.md`
  - shipped explicit compatibility rejection for iterator-containing composites and remaining unsupported structured recursion
  - aligns the code-level compatibility walk with the documented structured export boundary
- next Python export milestone:
  - `PYTHON-EXPORT-FULL-COVERAGE-AUDIT-V1.md`
  - now shipped as documentation-only audit work
  - records one explicit coverage map for what MCW can already export versus what remains unsupported
  - classifies the remaining export gaps before choosing the next completeness implementation slice
- Python export coverage map:
  - `PYTHON-EXPORT-COVERAGE-MAP-V1.md`
  - uses `src/engine/modules/index.ts` as the primitive baseline
  - identifies remaining primitive gaps as `BaudotSource`, `ModExp`, and `ModInverse`
  - identifies recursive structured export as the primary remaining structural frontier
- next Python export implementation slice:
  - `PYTHON-EXPORT-PLUGBOARD-V1.md`
  - now shipped as the next audit-ranked primitive/runtime gap
  - exported Python now supports bounded `Plugboard` parity
  - parity-tested for direct `Plugboard` use and a plugboard-plus-rotor historical-machine path
- next Python export implementation slice after that:
  - `PYTHON-EXPORT-BAUDOT-SOURCE-V1.md`
  - now shipped as the next audit-ranked primitive/runtime gap
  - exported Python now supports stateless and tick-sliced `BaudotSource` parity
- next Python export implementation slice after that:
  - `PYTHON-EXPORT-MODEXP-V1.md`
  - now shipped as the next audit-ranked primitive/runtime gap
  - exported Python now supports bounded modular-exponentiation parity
- next Python export implementation slice after that:
  - `PYTHON-EXPORT-MODINVERSE-V1.md`
  - now shipped as the final primitive/runtime gap in the current registry line
  - exported Python now supports bounded modular-inverse parity
  - the primitive registry line is now fully covered by Python export
- next structural export frontier:
  - `PYTHON-EXPORT-NESTED-COMPOSITES-V1.md`
  - now shipped as the first bounded recursive-structure export slice
  - exported Python now supports bounded nested composite helper generation with leaf-first helper ordering and multi-level forwarded-param drilling
  - parity-tested for shipped, user-authored, and temporal nested composite workspaces
  - keeps iterator-containing composites and generalized mixed recursive structure out of scope for the first recursive step
- next structural mixed export frontier:
  - `PYTHON-EXPORT-ITERATOR-CONTAINING-COMPOSITES-V1.md`
  - now shipped as the next bounded mixed-structure slice
  - exported Python now supports composites whose bodies contain already-supported iterator helpers
  - helper names for internal iterator instances are namespaced, composite helpers route iterator sub-state explicitly, and forwarded composite params can control internal iterator `iterationCount`
  - parity-tested for shipped, user-authored, and temporal iterator-containing composite workspaces
  - keeps iterator round definitions that are themselves iterators and generalized mixed recursive export out of scope for the first mixed slice
- next structural iterator-recursive frontier:
  - `PYTHON-EXPORT-NESTED-ITERATORS-V1.md`
  - now shipped as the next bounded iterator-recursive slice
  - exported Python now supports iterator round definitions that are themselves already-supported iterators
  - generated Python now includes definition-level iterator helpers, explicit nested iterator state routing, and recursive compatibility checks for iterator-definition cycles
  - parity-tested for user-authored, keyed, and temporal nested iterator workspaces
  - keeps generalized recursive mixed export out of scope beyond this slice
- next structural completeness frontier:
  - `PYTHON-EXPORT-GENERALIZED-MIXED-RECURSION-V1.md`
  - now shipped as the final structural-completeness slice for the current Python export leg
  - exported Python now supports the remaining helper-expressible mixed recursive structure across composites and iterators
  - parity-tested for newly unlocked mixed recursive stateless and temporal workspaces
  - completes common authored machine coverage without introducing a hidden interpreter
- future Python export architecture note:
  - `PYTHON-EXPORT-RUNTIME-LIBRARY-V1.md`
  - now represents the next Python export frontier as a productization step rather than a coverage blocker
  - records the future split between a reusable `mcw_runtime.py` library surface and a separate generated workspace implementation file
  - keeps the current self-contained one-file export as the correct bounded foundations architecture for now
- Python export completion checkpoint:
  - `PYTHON-EXPORT-V1-COMPLETE.md`
  - records that the current self-contained Python export leg reached its first real completeness milestone
  - frames the remaining export work as productization rather than ordinary coverage
- next Python export productization slice:
  - `PYTHON-EXPORT-RUNTIME-LIBRARY-FOUNDATIONS-V1.md`
  - shipped the first bounded two-file runtime-library export contract
  - exported Python now emits `mcw_runtime.py` plus a separate generated workspace file
  - keeps parity and helper-based generation as the non-negotiable constraints
- next Python export product-surface refinement slice:
  - `PYTHON-EXPORT-RUNTIME-SURFACE-V1.md`
  - shipped the first bounded runtime-surface/API-shaping follow-on for `mcw_runtime.py`
  - keeps machine coverage and artifact count unchanged while refining public surface and provenance
  - adds explicit runtime `__all__` surface and clearer generated workspace dependency/version headers
- next Python export delivery/productization slice:
  - `PYTHON-EXPORT-DELIVERY-UX-V1.md`
  - shipped the first bounded delivery-UX follow-on for the two-file Python export handoff
  - now superseded slightly by the later parity workflow, which adds `verify_parity.py` to the bundle
  - Python export now hands off one flat ZIP archive containing the runtime file, workspace file, and parity script at the root level
- stage assembly ergonomics:
  - `Arrange Selected Stage Row` for horizontal staged fragments
  - `Stack Selected Stage Column` for vertical bank / ladder fragments
  - selection-scoped, reducer-backed layout reshaping with one-step undo/redo

Current near-future sequencing is now explicit:
- continue the `v2.1` builder-power line first

The next explicit north-star check is now recorded as shipped:
- `SYSTEMS-IDE-COHERENCE-V1.md`
- completed the bounded product-shaping pass for deciding what MCW most clearly is now
- treats future prioritization as a coherence question rather than a novelty question

The next explicit verification/trust check is now also recorded:
- `VERIFIED-MACHINE-COHERENCE-V1.md`
- now shipped as the bounded trust/coherence note for defining what “verified” should mean inside MCW
- treats compare, trace, verification cases, known vectors, and export parity as one trust story

The next workspace-legibility exploration now also recorded is:
- `WORKSPACE-LAYOUT-DIRECTION-V1.md`
- shipped per-workspace horizontal/vertical layout direction with direction-aware tidy and add-module placement
- keeps the slice bounded to layout, tidy, and navigation behavior only

The next advanced node/wire legibility exploration now also recorded is:
- `NODE-ROTATION-WIRE-LEGIBILITY-V1.md`
- proposes per-instance port orientation for hybrid local layouts after the workspace-direction foundation
- locks upright node labels/content in V1 while keeping wire colors, hover endpoint labels, and more precise routing as later bounded follow-ons

The next implementation-ready verification slice is now also recorded:
- `VERIFIED-MACHINE-WORKFLOW-V1.md`
- defines the first bounded compare-surface refinement for known-answer verification cases
- now shipped as the first bounded verification-station workflow
- baseline-backed stateless verification cases now support explicit input/expected-output checks with first-divergence reporting

The next bounded verification slice after that is now also recorded:
- `VERIFIED-MACHINE-TICKED-WORKFLOW-V1.md`
- now shipped as the bounded temporal/ticked verification follow-on
- adds explicit tick-count cases, collected-output pass/fail, and first-divergence reporting by tick/module

The next export/trust slice after that is now also recorded:
- `EXPORT-ENGINE-PARITY-WORKFLOW-V1.md`
- now shipped as the first bounded engine-vs-export trust workflow
- Python export now includes a standalone `verify_parity.py` artifact that runs the active verification cases against the exported workspace locally
- next bounded verification/trust refinement after that:
  - `KNOWN-VECTOR-IMPORT-V1.md`
  - now shipped as the first bounded known-answer case import accelerator for the verification station
  - adds source-scoped vector paste, preview/validation, deterministic sink targeting, and baseline-free pass/fail behavior without widening into a standards bundle or generic test harness
- next bounded workbench-shell refinement after that:
  - `WORKBENCH-MENU-CLEANUP-V1.md`
  - now shipped as a grouped-dropdown cleanup pass for the crowded workbench control area
  - reorganizes workbench actions into bounded `View`, `Edit`, `Project`, and `Import/Export` categories
  - keeps the refinement organizational: clearer categories, one-line fit in most desktop widths, and no expansion of workbench capability
- next bounded product-help refinement after that:
  - `USER-MANUAL-V1.md`
  - now shipped as a first-class user-manual surface reachable from `Resources`
  - opens a standalone manual window with structured content, table of contents, search, and a curated index
- next bounded AI-facing handoff refinement after that:
  - `AI-TOOLKIT-V1.md`
  - now shipped as a `Resources`-linked single-file toolkit prompt pack for external LLM prompting
  - includes live primitive inventory from the registry, actual workspace/challenge interface shapes, explicit connection rules, and minimal JSON examples for workspace/challenge generation without embedding a chatbot or provider integration in MCW
- next bounded cryptanalysis legibility refinement after that:
  - `CRYPTANALYSIS-VISUALS-V1.md`
  - now fully shipped as the bounded cryptanalysis legibility refinement
  - includes the round diffusion chart, clickable candidate-period comparison, frequency confidence view, and bounded influence heatmap inside the existing cryptanalysis workspace
  - keeps the entire pass bounded rather than widening into a generic chart suite
- next bounded cryptanalysis navigation refinement after that:
  - `CRYPTANALYSIS-PROMINENCE-V1.md`
  - records a local-navigation/product-signaling pass to give `Tutorial`, `Challenge`, and `Cryptanalysis` equal footing
  - focuses on discoverability and peer-tab prominence rather than new analysis capability
- expand Python export carefully second
- refactor the largest UI surfaces third
- keep multi-window workspace support as a deliberate next-tier priority after those lines

Current `main` now also includes the first bounded multi-window slice:
- `MULTI-WINDOW-WORKSPACE-V1.md`
- detachable `Palette` and `Inspector` windows
- host-authoritative live synchronization over a bounded window bridge
- docked copies hidden in the main window while detached copies are active

Current `main` now also includes the first multi-window follow-on:
- `MULTI-WINDOW-WORKSPACE-V2.md`
- one detachable `Learning` window
- tutorials and challenges kept together as the existing tabbed learning surface
- host-authoritative synchronization preserved for tutorial/challenge interactions

Current `main` now also includes the next bounded multi-window refinement slice:
- `MULTI-WINDOW-TABBED-WINDOWS-V1.md`
- activates tabbed detached windows for `Palette`, `Inspector`, and `Learning`
- allows tabs to return individually to the main window while preserving the rest of the detached group
- moves detached-window actions onto a clearer dedicated `Windows` control surface

Current `main` now also includes that detached-window polish slice:
- `MULTI-WINDOW-DETACHED-POLISH-V1.md`
- adds clearer window labels and grouped naming in the `Windows` surface
- updates detached browser titles to track active tab plus grouped context
- keeps the multi-window line inside polish and product-surface refinement rather than broader expansion

Next multi-window expansion is now recorded:
- `MULTI-WINDOW-COMBINED-VIEWS-V1.md`
- allows one detached window to show multiple supported panes simultaneously
- keeps the pane family bounded to `Palette`, `Inspector`, and `Learning`
- treats combined visible mode as the next deliberate expansion rather than a generalized docking jump

Current `main` now also includes that combined-view expansion:
- `MULTI-WINDOW-COMBINED-VIEWS-V1.md`
- adds a per-window `tabs` / `combined` presentation mode
- allows visible ordered pane stacks inside one detached window
- preserves host-authoritative synchronization without widening into a freeform layout engine

Current `main` now also includes that split-view expansion:
- `MULTI-WINDOW-SPLIT-VIEWS-V1.md`
- detached windows now support `tabs`, `combined`, and bounded `split` presentation modes
- split mode shows exactly two visible panes side by side with host-authoritative left/right selection and bounded width resizing
- keeps the pane family bounded to `Palette`, `Inspector`, and `Learning` without widening into arbitrary split trees

Current `main` now also includes the first App-shell maintenance slice:
- `APP-SHELL-REFACTOR-V1.md`
- extracted the main tutorial/challenge rendering surface into `src/ui/components/learning-dock.tsx`
- extracted challenge-capture draft defaults into `src/ui/challenge-capture.ts`

Current `main` now also includes the first reducer-maintenance slice:
- `STORE-REFACTOR-V1.md`
- extracted pure workspace history/versioning helpers into `src/ui/workspace-state-support.ts`
- reduced inline snapshot/versioning responsibility inside `src/ui/store.ts`

The next recommended builder-power follow-on is now shipped:
- `CLUSTER-BOUNDARY-PORT-AUTHORING-V1.md`
- explicit include/exclude control over inferred composite boundary ports during capture
- intended as the next structural throughput improvement after stage assembly and composite reuse ergonomics

Current `main` now also includes the first inspector-maintenance slice:
- `INSPECTOR-REFACTOR-V1.md`
- extracted pure analysis helpers in `src/ui/inspector-analysis.ts`
- reduced non-rendering responsibility inside `src/ui/components/parameter-inspector.tsx`

Current `main` now also includes the first workbench-maintenance slice:
- `WORKBENCH-REFACTOR-V1.md`
- extracted project/context rendering in `src/ui/components/workbench-project-context.tsx`
- extracted workspace action rendering in `src/ui/components/workbench-actions.tsx`
- extracted pure workbench helpers in `src/ui/workbench-support.ts`
- reduced top-surface and helper responsibility inside `src/ui/components/workbench-panel.tsx`

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

The current primitive-legibility expansion after that is:
- timing, state, and framing micro demos for `Clock`, `Counter`, `BitSplit`, `BitPad`, `BitJoin`, and `LFSR`
- ticked-mode defaults only for the timing/state subset
- the same palette-local `Try Demo` flow introduced in V1

The current workspace-legibility follow-on after that is:
- direct single-wire selection in the workspace
- one-hop connection emphasis for the selected node
- de-emphasis of unrelated wires to make dense local structure easier to read
- explicit `Delete Wire` action instead of destructive wire-click removal

The current trace/workspace bridging follow-on after that is:
- one active trace node at a time emphasized in the workspace
- one-hop incoming / outgoing wire emphasis for the active step context
- trace emphasis kept distinct from direct wire selection and node-selection legibility

The current next ergonomics slice after that is:
- composite creation / reuse workflow clarity
- real pre-create preview of inferred composite boundary ports in the create dialog
- clearer reusable composite / iterator summaries in the palette library flow

The current final comparison-oriented ergonomics slice after that is:
- compare the current workspace against one saved version baseline
- structural comparison only: modules and connections
- added / removed / unchanged structure surfaced in the live workspace and summary card

The current shipped primitive-expansion follow-on after that is:
- `MultiRouter` as a bounded `1 -> N` indexed routing primitive
- fixed visible outputs `out0` through `out7` with bounded `routeCount` (`2`, `4`, or `8`)
- palette-local counter-driven micro demo for visible staged routing
- visible case-switch / counter-driven staged routing without hidden control flow

The current near-future control-structure items after that are:
- bounded conditional composition for explicit finite branch structure
- stronger iterator control as a later bounded repetition/control line
- both explicitly kept separate from general programming-language drift

The current shipped advanced-rotor follow-on after that is:
- explicit reverse traversal through rotor wiring via `RotorReverse`
- historically faithful visible `Rotor -> Reflector -> RotorReverse` signal paths
- `Rotor Return Path` demo/tutorial as the first bounded reverse-traversal teaching surface
- palette-local rotor micro demos for `Rotor` and `RotorReverse`

The current linked-rotor follow-on after that is:
- `RotorReverse` can link to one forward `Rotor` via `linkedRotorId`
- linked reverse traversal mirrors the forward rotor's live `wiring`, `position`, `ringOffset`, and `notches`
- only the forward rotor owns stepping state; linked reverse faces do not advance independently
- rotor-realism demos and micro demos now use the linked model honestly

The current shipped rotor-driven-stepping follow-on after that is:
- one bounded reusable rotor-control pattern built from explicit pulse flow
- shipped as built-in `RotorDoubleStepControl`
- applied to the `Advanced Rotor Stepping` teaching surface as reusable middle-rotor double-step logic
- explicitly kept separate from generic control-flow or executor redesign

The current shipped rotor-control follow-on after that is:
- one bounded visible control-bank pattern where one rotor bank contributes stepping pulses for another
- shipped as built-in `RotorControlBankRouter`
- demonstrated in the `Rotor Control Bank` teaching surface
- explicitly SIGABA-like in spirit only, and still separate from hidden scheduling or executor redesign

The current near-future strategic export item after that is:
- bounded Python export foundations for turning a workspace into standalone executable code
- explicitly treated as a major future product line rather than a casual utility feature

The current implementation-ready export follow-on after that is:
- stateless-only Python export foundations
- primitive-only supported subset
- one standalone `.py` artifact
- explicit compatibility rejection for unsupported modules

The next follow-on for this line, if revisited later, should stay separate from the shipped first two slices:
- broader multi-window / multi-tab support for additional surfaces
- likely cryptanalysis or other later surfaces only after the host-synchronization model proves durable

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

Immediate bounded next product slice:
- `LOCAL-WIRE-TIDY-V1.md`
- focus on selection-scoped cleanup for dense subgraphs without disturbing the whole workspace
- keep the work layout-local and history-safe, with no routing rewrite or graph-semantics change

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

1. **Choose the next slice from the remaining unshipped contracts** rather than from the already-shipped authoring-power queue
2. **Treat the remaining unshipped product-facing contracts as the real next choice set** rather than older stale “next” labels
3. **Keep language growth explicit and bounded** — future additions should stay machine-centered, not drift into black-box presets or pseudo-security claims
4. **Use real classroom feedback to choose between the remaining product-shaping contracts** — MCW now has enough onboarding, labs, pilot support, and sharing to benefit more from evidence than speculation
5. **Keep bundle-size and interaction-density guardrails healthy** as teaching, analysis, and portability surfaces continue to expand

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
| `SBOX-TABLE-TRANSFORMS-V1.md` | Shipped bounded follow-on for visible row/column transforms on authored `SBox` tables |
| `SBOX-GENERATION-WORKFLOW-V1.md` | Shipped bounded workflow slice for faster dimension-first S-box creation with visible generation presets and continued use of the existing editor and transform surfaces |
| `CUSTOM-PERMUTATION-AUTHORING-V1.md` | Shipped in `v1.12.0` as bounded tactile routing authoring |
| `CUSTOM-REFLECTOR-AUTHORING-V1.md` | Shipped in `v1.12.0` as bounded paired reflector authoring |
| `POLLUX-FRACTIONATION-V1.md` | Shipped bounded classical fractionation / homophonic-encoding primitive for disjoint bit-to-symbol output sets |
| `POLLUX-INVERSE-V1.md` | Shipped bounded inverse Pollux primitive for symbol-to-bit recovery using known zero/one alphabets |
| `POLLUX-ROUNDTRIP-CONTENT-V1.md` | Implemented Pollux round-trip teaching-content slice for explicit encode/decode demo flow, alphabet-agreement repair challenge, and manual support |
| `FIRST-SESSION-ONBOARDING-V1.md` | Implemented bounded onboarding slice for visible `Start Here` guidance, first-session workflow orientation, and stronger handoffs between existing learning/help surfaces |
| `FLAGSHIP-LAB-CLASSICAL-V1.md` | Shipped classroom-first classical flagship sequence built from the rotor / Enigma-style line, linked challenges, verification, export/parity trust handoff, and searchable lab-numbered demos |
| `FLAGSHIP-LAB-MODERN-V1.md` | Shipped classroom-first modern flagship sequence built from the visible round / S-box / diffusion line, linked analysis, verification, export/parity trust handoff, and searchable lab-numbered demos |
| `VERIFICATION-EXPLAINABILITY-V1.md` | Shipped bounded compare/verification interpretation pass for clearer failure classes, next-step guidance, and more classroom-readable trust language |
| `INSTRUCTOR-PILOT-PACK-V1.md` | Shipped instructor-facing pilot resource with search, TOC, index, and concrete guidance for running first classroom trials with the flagship labs |
| `SHAREABLE-LAB-PACKS-V1.md` | Shipped bounded portability/distribution slice for exporting and importing verified local lab packs without a cloud backend |
| `BITSTREAM-RANDOMNESS-LAB-V1.md` | Shipped bounded PRNG-analysis follow-on with a randomness mode in Cryptanalysis, sink selection, low-confidence sample warnings, live bitstream metrics, and teaching content for reading weak visible streams honestly |
| `SEQUENTIAL-STATE-AUTHORING-V1.md` | Shipped bounded language-strengthening follow-on for derived ticked-mode `State` / `Control` / `Observe` role badges with no project-model or export changes |
| `UI-ARCHITECTURE-STABILIZATION-V1.md` | Shipped bounded maintainability slice for extracting import/export, learning/verification, and detached-window orchestration pressure out of `App.tsx` without changing product behavior or reducer ownership |
| `PRNG-TEACHING-WORKSPACE-V1.md` | Shipped bounded teaching-workspace line for comparing visible pseudo-random generator constructions without making CSPRNG claims |
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
