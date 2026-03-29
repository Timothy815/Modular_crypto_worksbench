# Modular Cryptography Workbench

Modular Cryptography Workbench (MCW) is a visual cryptographic construction environment built around typed signal-flow graphs.

Instead of selecting a prebuilt cipher, users assemble machines from parts:
- symbol-domain modules such as rotors and reflectors
- bit-domain modules such as XOR, LFSR, SBox, Permutation, and BitShifter
- explicit bridge modules such as `SymbolToBits` and `BitsToSymbol`

The goal is to make cryptographic structure visible. MCW is designed as a workshop, not a museum.

## Current State

The latest shipped release checkpoint is `v2.1.0`.
The previous major boundary was `v2.0.0`, which marked the "Cryptographic Systems IDE" transition.

The `v2.1.0` checkpoint consolidates:
- first-session onboarding
- user manual and instructor pilot support
- AI toolkit handoff resources
- cryptanalysis visibility and visuals
- Pollux, S-box, and PRNG teaching-line expansion
- flagship classical and modern lab sequences
- verification explainability

The next active development line after `v2.1.0` is still the broader builder-power / authoring-power line. The first bounded follow-on target remains:
- same-workspace repeated-structure authoring
- duplicate a selected visible cluster nearby
- preserve internal topology and params
- keep the duplicate fully local, explicit, and immediately editable

The next bounded follow-on after that is:
- cluster operations
- drag-box selection on empty canvas
- explicit delete-selected-cluster workflow

The current active safety slice after that is:
- workspace-local undo / redo

The current explicit north-star check after the major Python-export and multi-window advances is:
- `SYSTEMS-IDE-COHERENCE-V1.md`
- a bounded product-shaping pass for deciding what MCW most clearly is now
- intended to protect product identity as breadth increases

The current explicit trust/coherence follow-on after that is:
- `VERIFIED-MACHINE-COHERENCE-V1.md`
- a bounded verification/trust pass for deciding what “verified” should mean in MCW
- intended to turn compare, trace, and export into a clearer user trust story

The current implementation-ready trust follow-on after that is:
- `VERIFIED-MACHINE-WORKFLOW-V1.md`
- now shipped as the first bounded verification-station refinement inside the compare/analyze line
- lets users run baseline-backed stateless known-answer cases against the current workspace with first-divergence reporting

The next bounded trust follow-on after that is now explicitly recorded as:
- `VERIFIED-MACHINE-TICKED-WORKFLOW-V1.md`
- now shipped as the bounded temporal/ticked follow-on to the verification station
- adds explicit tick-count cases, collected-output pass/fail, and first divergence by tick/module

The next export/trust follow-on after that is now explicitly recorded as:
- `EXPORT-ENGINE-PARITY-WORKFLOW-V1.md`
- now shipped as the first bounded engine-vs-export trust workflow
- Python export now includes a standalone `verify_parity.py` artifact that runs the active verification cases against the exported workspace locally

The next bounded verification/trust refinement after that is now explicitly recorded as:
- `KNOWN-VECTOR-IMPORT-V1.md`
- now shipped as the first bounded known-answer case import accelerator for the verification station
- adds source-scoped vector paste, preview/validation, deterministic sink targeting, and baseline-free pass/fail behavior without widening into a standards bundle or generic test harness

The next bounded workbench-shell refinement after that is now explicitly recorded as:
- `WORKBENCH-MENU-CLEANUP-V1.md`
- now shipped as a grouped-dropdown cleanup pass for the crowded workbench control strip
- reorganizes workbench actions into `View`, `Edit`, `Project`, and `Import/Export` categories while preserving existing command behavior

The next bounded product-help refinement after that is now explicitly recorded as:
- `USER-MANUAL-V1.md`
- now shipped as a first-class user-manual surface from `Resources`
- opens a standalone manual window with structured content, table of contents, search, and a curated index

The next bounded AI-facing handoff refinement after that is now explicitly recorded as:
- `AI-TOOLKIT-V1.md`
- now shipped as a `Resources` entry for downloading a single-file external-LLM toolkit prompt pack
- includes live primitive inventory, actual JSON/interface shapes, explicit connection rules, and minimal examples for workspace/challenge generation without embedding a chatbot inside the product

The next bounded cryptanalysis legibility refinement after that is now explicitly recorded as:
- `CRYPTANALYSIS-VISUALS-V1.md`
- now active as the current cryptanalysis legibility refinement
- first phase ships a round diffusion chart and clickable candidate-period comparison inside the existing cryptanalysis workspace
- keeps later frequency-confidence and influence-heatmap work explicitly bounded rather than widening into a generic statistics dashboard

The next bounded cryptanalysis navigation refinement after that is now explicitly recorded as:
- `CRYPTANALYSIS-PROMINENCE-V1.md`
- targets equal local footing for `Tutorial`, `Challenge`, and `Cryptanalysis`
- focuses on navigation prominence rather than new cryptanalysis capability

The current checkpointing follow-on after that is:
- named workspace versions / restore points
- explicit `Save Version` and `Restore` workflow per workspace

The current workspace-navigation follow-on after that is:
- bounded zoom in / zoom out
- reset / fit view recovery
- trace-driven focus jumps back into the visible workspace

The current connection-authoring follow-on after that is:
- direct rewiring from occupied inputs
- atomic replacement of single-input wires
- clear replacement vs blocked target feedback
- undo/redo-safe one-wire retargeting

The current parameter-authoring follow-on after that is:
- `Copy Params` from the current inspector target
- `Apply Params To Selected` for same-definition sibling modules
- explicit skip reporting for incompatible selections
- one-step undo/redo for bulk parameter application

The current parameter-comparison follow-on after that is:
- compare the current inspector target against selected same-definition siblings
- show aligned vs divergent fields inline in the inspector
- keep the selected module as the comparison anchor

The current primitive-legibility follow-on after that is:
- palette-local `Try Demo` actions for a bounded set of opaque primitives
- minimal seeded examples opened as new local editable workspaces
- no second demo library

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
- visible case-switch / staged routing without hidden control flow

The current near-future control-structure items after that are:
- bounded conditional composition for explicit finite branch structure
- stronger iterator control as a later bounded repetition/control line
- both explicitly separated from general programming-language behavior

The current shipped advanced-rotor follow-on after that is:
- explicit reverse traversal through rotor wiring via `RotorReverse`
- historically faithful visible `Rotor -> Reflector -> RotorReverse` signal paths
- `Rotor Return Path` demo/tutorial as the first bounded reverse-traversal teaching surface
- palette-local rotor micro demos for `Rotor` and `RotorReverse`

The current linked-rotor follow-on after that is:
- `RotorReverse` can link to one forward `Rotor` via `linkedRotorId`
- linked reverse traversal mirrors the forward rotor's live state instead of requiring manual synchronization
- only the forward rotor owns stepping state; linked reverse faces do not advance independently

The current shipped rotor-driven-stepping follow-on after that is:
- one bounded reusable rotor-control pattern built from explicit pulse flow
- shipped as built-in `RotorDoubleStepControl`
- used to package reusable middle-rotor double-step behavior without hiding the graph logic
- kept separate from generic control-flow or executor redesign

The current shipped rotor-control follow-on after that is:
- one bounded visible control-bank pattern where one rotor bank contributes stepping pulses for another
- shipped as built-in `RotorControlBankRouter`
- demonstrated in the `Rotor Control Bank` teaching surface
- kept SIGABA-like in spirit only, and separate from hidden scheduling and executor redesign

The current near-future strategic export item after that is:
- bounded Python export foundations for turning a workspace into standalone executable code
- treated as a major future product line, not just a utility add-on

The current implementation-ready export follow-on after that is:
- stateless-only Python export foundations
- primitive-only supported subset
- one standalone `.py` artifact
- explicit compatibility rejection for unsupported modules

That export foundations slice is now shipped on `main`:
- one `Export Python` action in the workspace actions area
- stateless primitive-only compatibility checking before download
- one standalone `.py` artifact with embedded helper runtime and topological execution
- parity-tested against MCW `executeProject()` for the supported subset

The first careful Python export expansion is now also shipped:
- `SBox` export support
- `AddMod`, `SubMod`, and `Modulo` export support
- parity-tested substitution and modular-arithmetic export paths

The second careful Python export expansion is now also shipped:
- `Majority`, `GreaterThan`, and `MulMod` export support
- `ByteRotate`, `ByteSwap`, and `BitUnpad` export support
- parity-tested control/arithmetic and byte-structure export paths

The third careful Python export expansion is now also shipped:
- `KeyInput`, `IV`, `Nonce`, and `Salt` export support
- `SymbolPermutation` and `SymbolWindow` export support
- parity-tested protocol-material and symbol-structure export paths

The fourth careful Python export expansion is now also shipped:
- `BitsToBaudot` and `BaudotOutput` export support
- parity-tested stateless Baudot decoding export path

The first bounded stateful export frontier is now shipped:
- `PYTHON-EXPORT-STATEFUL-FOUNDATIONS-V1.md`
- a first bounded ticked export slice for `Clock` and `Counter`
- one explicit exported tick loop with parity against `executeTickedProject()`
- stable per-tick sink output lines in `tick <n> | <module_id>: <value>` form
- deliberately kept separate from rotor, LFSR, and broader temporal runtime expansion

The next careful stateful export follow-on is now explicitly recorded as:
- `PYTHON-EXPORT-STATEFUL-EXPANSION-V1.md`
- add `LFSR` as the first cryptographically meaningful temporal export primitive beyond `Clock` and `Counter`
- keep rotor-family export out of scope until after this bridge slice proves cleanly

That `LFSR` stateful export bridge is now also shipped:
- exported temporal Python now supports `LFSR`
- parity-tested for direct keystream emission and logic-influencing ticked use
- still deliberately below rotor-family temporal runtime complexity

The next careful stateful export frontier is now explicitly recorded as:
- `PYTHON-EXPORT-ROTOR-FOUNDATIONS-V1.md`
- add bounded forward `Rotor` export as the first rotor-family temporal runtime slice
- keep `RotorReverse`, linked rotor pairing, reflector return paths, and control-bank scheduling out of scope
- treat this as the next major step toward eventual MCW-to-Python execution parity

That rotor export foundations slice is now also shipped:
- exported temporal Python now supports bounded forward `Rotor`
- parity-tested for stepping symbol output, turnover-driven downstream behavior, and clock-gated stepping
- generated Python now includes short systematic comments naming each exported module block
- `RotorReverse`, linked rotor pairing, reflector return paths, and rotor control-bank scheduling remain deferred

The next careful rotor export frontier is now explicitly recorded as:
- `PYTHON-EXPORT-ROTOR-RETURN-PATH-V1.md`
- add bounded `Reflector` and `RotorReverse` export as the first honest return-path historical-machine slice
- keep rotor control-bank scheduling and broader multi-rotor export out of scope
- preserve visible linked forward/reverse rotor behavior in generated Python instead of collapsing it into a hidden machine object

That rotor return-path export slice is now also shipped:
- exported temporal Python now supports bounded `Reflector` + `RotorReverse`
- linked reverse traversal reads the live forward rotor state object directly
- parity-tested for plain return-path output, stepped return-path output, and linked reverse turnover used downstream

That rotor-control export slice is now also shipped:
- `PYTHON-EXPORT-ROTOR-CONTROL-V1.md`
- exported temporal Python now supports bounded turnover-driven multi-rotor stepping parity
- generated Python now records explicit step flags during evaluation and applies advances in a final tick-end pass
- parity-tested for direct turnover stepping, gated turnover stepping, and a double-step-style three-rotor path

That structured-machine export slice is now also shipped:
- `PYTHON-EXPORT-COMPOSITE-FOUNDATIONS-V1.md`
- exported Python now supports first-class helper-function composite export for depth-1 composite bodies
- shipped and user-authored composites now preserve authored submachine boundaries in generated Python
- parity-tested for stateless shipped composites, user-authored forwarded-param composites, and temporal composites with supported internals

The next structured-machine export frontier is now explicitly recorded as:
- `PYTHON-EXPORT-ITERATOR-FOUNDATIONS-V1.md`
- add first-class helper-function iterator export for bounded repeated-round machines
- preserve visible round boundaries, key-bus slicing, and iteration-count override behavior in generated Python
- keep nested iterators and iterator-containing composites out of scope for the first slice

That iterator export foundations slice is now also shipped:
- exported Python now supports first-class helper-function iterator export for bounded repeated-round machines
- iterator helpers preserve visible round boundaries, explicit round chaining, key-bus slicing, and instance-level iteration-count override parity
- parity-tested for shipped iterators, keyed iterators, and temporal iterators with supported round definitions

The next structured-machine export follow-on is now also shipped:
- `PYTHON-EXPORT-ITERATOR-EXPANSION-V1.md`
- broader iterator export coverage now explicitly parity-proven across higher-value shipped iterator families:
  - `FeistelRoundIterator`
  - `HashDigestRoundIterator`
  - `SpongeMixRoundIterator`
- nested iterators, iterator-containing composites, and generalized recursive structured export remain out of scope

That structured export compatibility tightening is now also shipped:
- `PYTHON-EXPORT-STRUCTURED-COMPATIBILITY-V1.md`
- the compatibility layer now explicitly rejects iterator-containing composites and remaining unsupported structured recursion
- the remaining structured export boundary is now enforced in code and tests, not just in planning docs

The next Python export milestone is now explicitly recorded as:
- `PYTHON-EXPORT-FULL-COVERAGE-AUDIT-V1.md`
- audit the remaining gap between what MCW can execute and what Python export can emit
- classify unsupported cases by real blocker type before choosing the next completeness slice

That audit is now also shipped:
- `PYTHON-EXPORT-COVERAGE-MAP-V1.md`
- the primitive registry baseline is now mapped explicitly against current Python export support
- the remaining primitive gaps are now identified as:
  - `BaudotSource`
  - `ModExp`
  - `ModInverse`
  - `Plugboard`
- the remaining structured gaps are now identified primarily as recursive/nested structured export rather than broad primitive deficiency

The next Python export implementation slice is now explicitly recorded as:
- `PYTHON-EXPORT-PLUGBOARD-V1.md`
- close the remaining obvious Enigma-class primitive gap in current export coverage
- keep the slice bounded to `Plugboard` itself, without widening into broader historical-machine redesign

That `Plugboard` export slice is now also shipped:
- `PYTHON-EXPORT-PLUGBOARD-V1.md`
- exported Python now supports bounded `Plugboard` parity
- parity-tested for both direct `Plugboard` use and a plugboard-plus-rotor historical-machine path
- the remaining primitive gaps are now:
  - `BaudotSource`
  - `ModExp`
  - `ModInverse`

That `BaudotSource` export slice is now also shipped:
- `PYTHON-EXPORT-BAUDOT-SOURCE-V1.md`
- exported Python now supports both stateless and tick-sliced `BaudotSource` parity
- the remaining primitive gaps are now:
  - `ModExp`
  - `ModInverse`

That `ModExp` export slice is now also shipped:
- `PYTHON-EXPORT-MODEXP-V1.md`
- exported Python now supports bounded modular-exponentiation parity
- the remaining primitive gap is now:
  - `ModInverse`

That `ModInverse` export slice is now also shipped:
- `PYTHON-EXPORT-MODINVERSE-V1.md`
- exported Python now supports bounded modular-inverse parity
- the primitive registry line is now fully covered by Python export
- the next export frontier is now structural rather than primitive/runtime completion

That nested composite export slice is now also shipped:
- `PYTHON-EXPORT-NESTED-COMPOSITES-V1.md`
- exported Python now supports bounded nested composite helper generation
- helper definitions are emitted leaf-first, preserve local scope isolation, and drill forwarded params through nested composite calls
- iterator-containing composites and generalized mixed recursive structure remain out of scope in this slice

That mixed-structure export slice is now also shipped:
- `PYTHON-EXPORT-ITERATOR-CONTAINING-COMPOSITES-V1.md`
- exported Python now supports composites whose bodies contain already-supported iterator helpers
- generated helper names are namespaced for internal iterator instances, composite helpers route iterator sub-state explicitly, and forwarded composite params can control internal iterator `iterationCount`
- iterator-round-as-iterator behavior and generalized mixed recursive export remain out of scope in this slice

The next structural export frontier is now explicitly recorded as:
- `PYTHON-EXPORT-NESTED-ITERATORS-V1.md`
- the next bounded structural slice is iterator round definitions that are themselves already-supported iterators
- generalized recursive mixed export remains out of scope beyond that slice

That nested iterator export slice is now also shipped:
- `PYTHON-EXPORT-NESTED-ITERATORS-V1.md`
- exported Python now supports iterator round definitions that are themselves already-supported iterators
- generated Python now includes definition-level nested iterator helpers, explicit nested iterator state routing, and parity-tested stateless, keyed, and temporal nested iterator workspaces
- generalized recursive mixed export remains out of scope beyond this slice

The next structural export frontier is now explicitly recorded as:
- `PYTHON-EXPORT-GENERALIZED-MIXED-RECURSION-V1.md`
- the next bounded structural slice is the remaining helper-expressible mixed recursive structure across composites and iterators
- runtime-library splitting remains a later productization step, not the next completeness slice

That generalized mixed-recursion export slice is now also shipped:
- `PYTHON-EXPORT-GENERALIZED-MIXED-RECURSION-V1.md`
- exported Python now supports the remaining helper-expressible mixed recursive structure across composites and iterators
- parity now holds for newly unlocked mixed recursive stateless and temporal workspaces without introducing a hidden interpreter
- the Python export leg is now structurally complete for common authored machine shapes

The next Python export frontier is now productization:
- `PYTHON-EXPORT-RUNTIME-LIBRARY-V1.md`
- the next deliberate step is the reusable `mcw_runtime.py` split plus separate generated workspace implementation file
- this is now a productization move, not a remaining coverage blocker
- `PYTHON-EXPORT-V1-COMPLETE.md`
- records that the current self-contained one-file Python export leg has reached its first real completeness milestone
- `PYTHON-EXPORT-RUNTIME-LIBRARY-FOUNDATIONS-V1.md`
- now ships the first bounded two-file runtime-library productization slice
- exported Python now emits `mcw_runtime.py` plus a separate generated workspace file while preserving parity
- `PYTHON-EXPORT-RUNTIME-SURFACE-V1.md`
- now ships the next bounded product-surface refinement slice for `mcw_runtime.py` and generated workspace headers/import expectations
- exported Python now declares a deliberate runtime public surface and clearer workspace provenance/runtime dependency headers
- `PYTHON-EXPORT-DELIVERY-UX-V1.md`
- now ships the next bounded export-productization slice for reliable two-file handoff and artifact delivery clarity
- Python export now hands off one flat ZIP archive containing `mcw_runtime.py`, the generated workspace file, and `verify_parity.py`

The future Python export architecture note after that is now explicitly recorded as:
- `PYTHON-EXPORT-RUNTIME-LIBRARY-V1.md`
- records the future split between a reusable `mcw_runtime.py` library surface and a separate generated workspace implementation file
- keeps the current single-file exporter as the correct bounded foundations architecture for now
- treats the runtime/library split as a future deliberate productization step, not an ad hoc exporter rewrite

That bounded multi-window workspace slice is now also shipped:
- `MULTI-WINDOW-WORKSPACE-V1.md`
- detachable `Palette` and `Inspector` windows
- host-authoritative live synchronization across windows
- docked copies hidden in the main window while detached copies are active

The first follow-on for that line is now also shipped:
- `MULTI-WINDOW-WORKSPACE-V2.md`
- one detachable `Learning` window
- tutorials and challenges kept together as the existing tabbed learning surface
- host-authoritative live synchronization preserved for tutorial/challenge interactions

The next bounded multi-window refinement is now also shipped:
- `MULTI-WINDOW-TABBED-WINDOWS-V1.md`
- detached windows can now grow into tab groups for `Palette`, `Inspector`, and `Learning`
- tabs can return individually to the main window without disturbing the rest of the detached group
- window-management actions now live on a clearer dedicated `Windows` surface instead of being mixed into the crowded workspace dropdown

That detached-window polish pass is now also shipped:
- `MULTI-WINDOW-DETACHED-POLISH-V1.md`
- detached windows now use clearer grouped labels in the `Windows` surface
- browser window titles now track the active tab and grouped context more deliberately
- detached shell identity and action wording are more polished without widening the pane model

The next multi-window expansion is now recorded:
- `MULTI-WINDOW-COMBINED-VIEWS-V1.md`
- allows one detached window to show multiple supported panes simultaneously
- keeps the pane family bounded to `Palette`, `Inspector`, and `Learning`
- treats combined visible mode as the next deliberate expansion, not a jump to a generalized docking system

That combined-view expansion is now also shipped:
- `MULTI-WINDOW-COMBINED-VIEWS-V1.md`
- detached windows can now switch between `tabs` and `combined` presentation modes
- combined mode shows an ordered visible stack of supported panes with per-pane move up/down controls
- the pane family remains bounded to `Palette`, `Inspector`, and `Learning`

That split-view expansion is now also shipped:
- `MULTI-WINDOW-SPLIT-VIEWS-V1.md`
- detached windows now support `tabs`, `combined`, and bounded `split` presentation modes
- split mode shows exactly two visible panes side by side with host-authoritative left/right selection and bounded width resizing
- the pane family remains bounded to `Palette`, `Inspector`, and `Learning`

The next maintenance follow-on is now also shipped:
- `APP-SHELL-REFACTOR-V1.md`
- extracted the main tutorial/challenge surface into `src/ui/components/learning-dock.tsx`
- extracted challenge-capture draft defaults into `src/ui/challenge-capture.ts`

The next reducer-maintenance follow-on is now also shipped:
- `STORE-REFACTOR-V1.md`
- extracted pure workspace history/versioning helpers into `src/ui/workspace-state-support.ts`
- reduced inline snapshot/version burden inside `src/ui/store.ts`

The current ranked near-future order is:
1. continue the `v2.1` builder-power line
2. expand Python export carefully
3. refactor the largest UI surfaces, especially the inspector
4. then take the first bounded `MULTI-WINDOW-WORKSPACE-V1` slice

That UI-maintenance line is now underway on `main`:
- the first bounded inspector refactor extracted pure analysis logic into `src/ui/inspector-analysis.ts`
- `parameter-inspector.tsx` now carries less non-rendering responsibility without changing behavior
- the first bounded workbench refactor extracted `workbench-project-context.tsx`, `workbench-actions.tsx`, and `workbench-support.ts`
- `workbench-panel.tsx` now carries less top-surface and helper responsibility without changing behavior

The current builder-power follow-on now also includes:
- `Arrange Selected Stage Row`
- `Stack Selected Stage Column`
- selection-scoped stage assembly tools for repeated rounds, banks, and visible multi-stage fragments

The builder-power line now also includes:
- `CLUSTER-BOUNDARY-PORT-AUTHORING-V1.md`
- explicit include/exclude control over inferred composite boundary ports during capture
- a tighter path from visible selected fragment to clean reusable composite shell

`main` now includes the completed first milestone of **number-theoretic foundations**:
- new primitives:
  - `ModExp` (modular exponentiation via repeated squaring)
  - `ModInverse` (modular multiplicative inverse via extended Euclidean algorithm)
- `Toy RSA` demo workspace (visible encrypt/decrypt round-trip)
- `Key Schedule Workshop` demo workspace (two-round key derivation from one master key)
- `Toy RSA Round-Trip` and `Key Schedule Workshop` tutorials
- `Repair the RSA Exponent` and `Repair the Key Rotation` challenges

Recent shipped follow-ons after `v1.27.0`:
- `v1.28.0` Teaching Pathfinding And Hardening:
  - seeded teaching-content audit coverage
  - routed-clock validation fix
  - first shipped learning-sequence UI with stage/core/best-after guidance
- `v1.29.0` Bounded Bypass:
  - instance-level bypass for an explicit allow-list of eligible one-input / one-output same-domain modules
  - visible inspector toggle and canvas bypass badge
  - `Bypass Workshop` demo/tutorial/challenge
- `v1.30.0` Inverse Permutation Authoring:
  - `Build Inverse` helper for `Permutation` and `SymbolPermutation`
  - editor-side construction of the true inverse mapping, distinct from reverse order
  - explanatory UI hint clarifying that inverse undoes the current routing
- `v1.31.0` Bridge Ergonomics:
  - permissive raw `BitSource` entry for continuous, spaced, or bracketed `0/1` text
  - grouped bit preview in the structured bits editor
  - direct `HexToAscii` bridge for readable 7-bit ASCII byte decoding from hex text
- `v1.32.0` Bridge Ergonomics V2:
  - `AsciiToHex` bridge (symbol → symbol, 7-bit ASCII to uppercase hex)
  - sink-only output representation views for `Output` and `BitOutput`
  - Bits / Bytes / Hex / ASCII tabs with strict availability rules and explanation messaging
- `v1.33.0` Reversible Authoring:
  - `Normalize Reciprocal Pairs` helper for `Plugboard` and `Reflector`
  - exact reciprocal/involutive normalization helpers in the engine layer
  - editor-side reciprocity teaching copy clarifying that these mappings already undo themselves
- `v1.34.0` Workspace Housekeeping:
  - workspace-local module instance renaming with atomic reference updates
  - `Duplicate Workspace` for independent local copies with reset session state
  - conservative module-ID validation and unzip-cleanup support
- `v1.35.0` Composite Port Hints:
  - contextual composite/iterator port hints on hover
  - target-module-only input hints during live connection drag
  - no always-on labels, no primitive-wide rollout, no interface mutation
- `v1.36.0` Cross-Workspace Clipboard:
  - `Copy Selected Cluster` and `Paste Selected Cluster` for local workspace-to-workspace fragment reuse
  - selected modules only, internal-only connections, and relative layout preservation
  - fresh pasted IDs, immediate local divergence, and no linked/library/system-clipboard semantics
- `v1.37.0` Diffie-Hellman:
  - visible `Diffie-Hellman Key Exchange` demo built from explicit `ModExp` paths
  - `Visible Shared Secret` tutorial placed after `Toy RSA Round-Trip`
  - `Repair the Shared Secret` challenge for matching shared-secret derivation
- `v1.38.0` Key Schedule Depth:
  - visible `Recursive Key Schedule` demo with a three-step key ladder
  - `One Round Key Becomes The Next` tutorial placed after `Key Schedule Workshop`
  - `Repair the Next Round Key` challenge for restoring a later-round derivation step
- `v1.39.0` Block Chaining:
  - visible `Visible Block Chaining` demo with explicit IV seeding and block-to-block dependence
  - `Why The Next Block Depends On The Last` tutorial placed after `Recursive Key Schedule`
  - `Repair the Chaining Path` challenge for restoring the visible chaining edge into block 2
- `v1.40.0` Byte-Oriented Primitives:
  - new `ByteRotate` and `ByteSwap` helpers with strict multiple-of-8 validation
  - `Visible Byte Order` demo comparing byte-order reversal and byte-granularity rotation against raw bit rotation
  - `When Bits Become Bytes` tutorial and `Repair the Byte Order` challenge
- `v1.41.0` Integrity / Authentication:
  - visible `Visible Tamper Check` demo with readable sender/receiver message paths and explicit keyed tag recomputation
  - `Why Integrity Is Not Secrecy` tutorial placed after `Visible Byte Order`
  - `Repair the Tamper Check` challenge for restoring the receiver-side verification context
- `v1.42.0` AEAD Foundations:
  - visible `Visible Authenticated Encryption` demo with minimal encryption, explicit Encrypt-then-MAC tagging, receiver-side verification, and recovered plaintext
  - `Encrypting Is Not Enough` tutorial placed after `Visible Tamper Check`
  - `Repair the Protected Message` challenge for restoring authentication of the ciphertext path
- `v1.43.0` Digital Signature Foundations:
  - visible `Visible Signature Verification` demo with private-key signing, public verification, and explicit pass/fail comparison
  - `Signing Is Not Encrypting` tutorial placed after `Encrypting Is Not Enough`
  - `Repair the Signature` challenge for restoring the public verification exponent
- `v1.44.0` Protocol Handshakes:
  - visible `Visible Secure Handshake` demo with public exchange, signature verification, shared-key derivation, and one later protected message
  - `From Handshake To Protected Message` tutorial placed after `Signing Is Not Encrypting`
  - `Repair the Handshake` challenge for restoring the derived-key routing into the protected-message step

Shipped stream, rotor, protocol/framing, and symbol/message permutation foundations remain in place:
- stream-machine expressiveness:
  - `Majority`
  - `Mux`
  - `Demux`
- advanced rotor realism:
  - `ringOffset`, `notches`, visible `turnover`
- protocol inputs:
  - `IV`, `Nonce`, `Salt`
- framing:
  - `BitSplit`, `BitPad`, and reuse of existing `BitJoin`
- symbol/message permutation:
  - `SymbolPermutation`

Implemented and shipped:
- engine core types, graph validation, iterative topological executor
- V1 primitive modules (symbol + bit domains, bridges, modern primitives)
- ticked/stateful execution engine (rotor stepping, per-tick source slicing)
- reducer-backed UI shell with visual workbench canvas
- draggable modules, port-to-port connections, structured parameter editors
- reusable composite workflows
- analysis visibility, step-through execution, signal probing
- comparison-first break workflows
- guided challenges and tutorial walkthroughs
- Build / Guide workspace mode (freeform building vs. tutorial-guided learning)
- ticked execution UI (tick bar, scrubber, collected output, per-tick state display)
- advanced modern foundry labs (byte rounds, keystreams, gated clocking)
- multi-format bridges (hex, ASCII, Baudot)
- constrained iterators and explicit key-bus distribution
- nested analysis for composite and iterator internals
- Feistel round / iterator teaching loop
- dedicated Cryptanalysis workspace mode
- Vigenere analysis workflow:
  - IOC and n-gram summaries
  - repeated-fragment / Kasiski-style evidence
  - candidate key-length estimation
  - period-based column analysis
  - graph-and-slide frequency matching
  - candidate plaintext reconstruction
- `Breaking the Unbreakable` tutorial
- modern analysis workflow:
  - `Classical / Modern` cryptanalysis sub-modes
  - Avalanche Explorer
  - aligned bit-difference strips
  - machine-aware output difference for supported bit/hex source paths
  - round-aware diffusion summaries and progression matrix
- `The Avalanche Effect` tutorial
- hashing foundations:
  - toy compression hash
  - toy sponge hash
  - hash-focused demos and guided tutorials
  - exposed internal controls for digest/mix behavior via parameter forwarding
- transformation visualization workflow in Inspector `Analyze`:
  - `Permutation`
  - `BitShifter`
  - `XOR`
  - `SBox`
  - iterator-aware nested transformation resolution
- `v1.4.0` release framing and workspace polish
- `v1.5.0` Modern Analysis milestone
- `v1.6.0` Transformation Visualization Phase 1 milestone
- `v1.7.0` Hashing V1 milestone
- `v1.8.0` Hash Collision Challenge milestone
- `v1.9.0` Sponge Collision Challenge milestone
- `v1.10.0` Collision Interpretation Foundations milestone
- `v1.11.0` Hash Autopsy milestone (Internal Divergence Helper)
- `v1.14.0` Cryptographic Operators milestone
- `v1.15.0` Control Primitives milestone
- `v1.16.0` Block Framing milestone
- `v1.17.0` Protocol Material milestone
- `v1.18.0` Stream Cipher Foundations milestone
- `v1.19.0` Advanced Rotor Realism milestone
- `v1.20.0` Stream Cipher Filtering milestone
- `v1.21.0` Stream Cipher Routing milestone
- `v1.22.0` Symbol Permutation milestone
- `v1.23.0` Key Routing milestone
- `v1.24.0` Symbol Structure milestone
- `v1.25.0` Arithmetic Expansion milestone
- `v1.26.0` Number-Theoretic Foundations milestone
- `v1.27.0` Transformation View Consolidation milestone
- `v1.28.0` Teaching Pathfinding And Hardening milestone
- `v1.29.0` Bounded Bypass milestone
- first bounded hash collision challenge:
  - seeded `Find A Hash Collision` challenge
  - same-digest / different-input success rule
  - collision-aware challenge status copy
  - `HexSource` `-1 / +1` stepping for manual exploration
- sponge collision follow-on:
  - seeded `Find A Sponge Collision` challenge
  - challenge ownership by `projectId`
  - project-correct challenge selection/reset/import behavior
  - corrected sponge digest extraction using folded rate + capacity contribution
  - audit-style hash-spread regression tests
- first bounded post-collision interpretation follow-on:
  - side-by-side original vs current message comparison for hash collision challenges
  - post-success interpretation nudges into `Analyze` and `Modern Cryptanalysis`
  - internal-divergence helper showing the first internal trace split after the guided inputs
  - hardened sponge absorb path with asymmetric right-input preparation
  - sampled symmetry-regression tests for paired input shifts
- tactile primitive authoring:
  - `SBox` grid editor with reset helpers and synced raw CSV
  - `Permutation` wire editor for simple one-to-one routing with synced raw CSV fallback
  - `Reflector` socket-pair editor with shared pair styling and synced raw wiring
  - `Rotor` wire editor with runtime-centered anchors and dotted endpoints
- builder workflow ergonomics:
  - multi-select group movement
  - graph-aware `Tidy Layout`
  - blank and saved personal workspaces under `My Workspaces`
  - deletion for user-owned workspaces only
  - instance-level composite unzip with forwarded-param carry-through
- bundle/performance guardrails:
  - lazy-loaded secondary panels
  - React vendor chunk split
  - build-time bundle-size check
- workbench persistence and JSON import/export
- dark mode
- GitHub Pages deployment

## Key Documents

- `PROJECT.md`: product vision and full specification
- `ENGINE-V1-CONTRACT.md`: locked implementation decisions for the engine
- `COMPOSITE-V1-CONTRACT.md`: locked direction for composite modules
- `BREAK-V1-CONTRACT.md`: locked direction for break workflows
- `GUIDED-CHALLENGES-V1-CONTRACT.md`: locked direction for classroom challenges
- `MODERN-PRIMITIVES-V1-CONTRACT.md`: locked direction for modern primitive expansion
- `V1-POLISH-AND-TUTORIALS.md`: locked direction for v1 polish and tutorials
- `ADVANCED-FOUNDRY-CLOCK-V1.md`: locked direction for ticked/stateful execution
- `CRYPTANALYSIS-WORKSPACE-V1.md`: locked direction for the dedicated cryptanalysis workspace
- `MODERN-ANALYSIS-V1.md`: shipped direction for the post-`v1.4.0` modern-analysis line
- `HASHING-V1.md`: shipped first hashing milestone contract and scope boundary
- `HASH-COLLISION-CHALLENGE-V1.md`: shipped first bounded hash weakness challenge
- `SPONGE-COLLISION-CHALLENGE-V1.md`: shipped sponge-collision follow-on and sponge-hash correction slice
- `POST-COLLISION-INTERPRETATION-V1.md`: shipped first milestone for understanding why colliding messages still differ internally
- `CUSTOM-SBOX-AUTHORING-V1.md`: shipped bounded authoring slice for editable substitution-table design inside the workbench
- `SBOX-TABLE-TRANSFORMS-V1.md`: shipped bounded follow-on for visible row/column transforms on authored `SBox` tables
- `CUSTOM-PERMUTATION-AUTHORING-V1.md`: shipped bounded tactile authoring slice for editable routing/permutation design inside the workbench
- `CUSTOM-REFLECTOR-AUTHORING-V1.md`: shipped bounded tactile authoring slice for paired reflector wiring inside the workbench
- `POLLUX-FRACTIONATION-V1.md`: shipped bounded classical fractionation / homophonic-encoding primitive for disjoint bit-to-symbol output sets
- `POLLUX-INVERSE-V1.md`: shipped bounded inverse Pollux primitive for symbol-to-bit recovery using known zero/one alphabets
- `POLLUX-ROUNDTRIP-CONTENT-V1.md`: implemented Pollux round-trip teaching content slice covering sender/receiver demo flow, repair challenge, and manual support
- `FIRST-SESSION-ONBOARDING-V1.md`: implemented bounded onboarding slice for a visible `Start Here` path, first-session workflow guidance, and clearer transitions between demo, tutorial, challenge, verification, and manual surfaces
- `FLAGSHIP-LAB-CLASSICAL-V1.md`: shipped classroom-first classical flagship sequence built from the rotor / Enigma-style line, linked challenges, verification, export/parity trust handoff, and searchable lab-numbered demos
- `FLAGSHIP-LAB-MODERN-V1.md`: shipped classroom-first modern flagship sequence built from the visible round / S-box / diffusion line, linked analysis, verification, export/parity trust handoff, and searchable lab-numbered demos
- `VERIFICATION-EXPLAINABILITY-V1.md`: shipped bounded compare/verification interpretation pass for clearer failure classes, next-step guidance, and more classroom-readable trust language
- `INSTRUCTOR-PILOT-PACK-V1.md`: shipped instructor-facing pilot resource with search, TOC, index, and concrete guidance for running first classroom trials with the flagship labs
- `PRNG-TEACHING-WORKSPACE-V1.md`: shipped bounded teaching-workspace line for comparing visible pseudo-random generator constructions without making CSPRNG claims
- `WORKBENCH-ERGONOMICS-V1.md`: shipped bounded workbench-usability slice for multi-select, group movement, and one-click cleanup
- `WORKSPACE-LIBRARY-V1.md`: shipped bounded workspace-management slice for blank build spaces and saved personal collections
- `WORKSPACE-RENAME-V1.md`: shipped bounded housekeeping slice for workspace-local module instance renaming
- `WORKSPACE-DUPLICATE-V1.md`: shipped bounded housekeeping slice for whole-workspace duplication
- `COMPOSITE-PORT-HINTS-V1.md`: shipped bounded UI slice for contextual composite boundary port hints
- `COMPOSITE-UNZIP-V1.md`: shipped bounded inverse-composition slice for expanding a composite instance back into editable modules
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md`: active strategic roadmap for growing MCW into a fully expressive cryptographic systems IDE
- `CRYPTO-OPERATORS-V1.md`: shipped first foundational operator-expansion slice for boolean and fixed-width word arithmetic
- `CONTROL-PRIMITIVES-V1.md`: shipped first bounded counter/compare/gate slice for condition-driven machines
- `BLOCK-FRAMING-V1.md`: shipped first post-Phase-1 framing slice for visible block boundaries, rejoining, and padding
- `PROTOCOL-MATERIAL-V1.md`: shipped first bounded protocol-input slice for IV, nonce, and salt sources
- `STREAM-CIPHER-V1.md`: shipped first bounded stream-machine slice for visible majority logic and irregular clocking
- `STREAM-CIPHER-V2.md`: shipped second bounded stream-machine slice for visible selector/filter behavior via `Mux`
- `STREAM-CIPHER-V3.md`: shipped third bounded stream-machine slice for visible routing/scheduling behavior via `Demux`
- `SYMBOL-PERMUTATION-V1.md`: shipped first bounded symbol/message permutation slice for visible symbol-order routing
- `KEY-SCHEDULE-V2.md`: shipped first bounded post-groundwork key-routing slice for visible sub-key extraction from one key bus
- `SYMBOL-STRUCTURE-V1.md`: shipped first bounded post-permutation symbol/message-structure slice for visible contiguous submessage extraction
- `LEARNING-SEQUENCE-V1.md`: first shipped sequencing milestone for suggested ordering across demos, tutorials, and challenges
- `ARITHMETIC-EXPANSION-V1.md`: shipped first bounded arithmetic-expansion slice for modular multiplication, strict comparison, and unpadding
- `NUMBER-THEORETIC-V1.md`: shipped first bounded number-theoretic foundations slice for modular exponentiation and modular inverse
- `DIFFIE-HELLMAN-V1.md`: shipped bounded number-theoretic follow-on for visible shared-secret agreement
- `KEY-SCHEDULE-DEPTH-V1.md`: shipped bounded symmetric-construction follow-on for visible recursive round-key derivation
- `BLOCK-CHAINING-V1.md`: framed bounded `v1.39.0` follow-on for visible block-to-block dependence
- `BYTE-ORIENTED-PRIMITIVES-V1.md`: framed bounded `v1.40.0` follow-on for explicit byte/word structure helpers
- `INTEGRITY-AUTHENTICATION-V1.md`: framed bounded `v1.41.0` follow-on for visible tamper detection and authenticator comparison
- `AEAD-FOUNDATIONS-V1.md`: framed bounded `v1.42.0` follow-on for visible authenticated-encryption-style composition
- `DIGITAL-SIGNATURE-FOUNDATIONS-V1.md`: framed bounded `v1.43.0` follow-on for visible signing and verification
- `PROTOCOL-HANDSHAKES-V1.md`: framed bounded `v1.44.0` follow-on for visible handshake / transcript composition
- `MCW-V2-SANITY-PASS.md`: proposed post-`v1.44.0` product-level cohesion pass for library organization, scale management, and curriculum framing
- `BYPASS-V1.md`: shipped bounded usability slice for visible instance-level bypass on eligible one-in/one-out modules
- `INVERSE-PERMUTATION-AUTHORING-V1.md`: shipped bounded authoring follow-on for deriving inverse mappings in bit and symbol permutation editors
- `BRIDGE-ERGONOMICS-V1.md`: shipped bounded bridge/usability follow-on for easier raw-bit entry and clearer byte-oriented bridge behavior
- `ADVANCED-ROTOR-REALISM-V1.md`: shipped first bounded rotor-realism slice for ring setting, turnover, and double-step behavior
- `PARAM-FORWARDING-V1.md`: active direction for explicit exposed-internal controls on reusable architectures
- `TRANSFORMATION-VISUALIZATION-V1.md`: shipped first milestone for primitive-level transformation legibility and drill-down views
- `SBOX-TRANSFORMATION-V1.md`: shipped first lookup/substitution visual family contract
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

## The Canonical Pipeline

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

In ticked mode, the rotor advances per character and TextInput emits one character per tick — a full Enigma-style stepping pipeline.

## Near-Term Roadmap

1. Treat MCW explicitly as a **cryptographic systems IDE** and grow the primitive language toward full expressive coverage, not just isolated feature branches
2. Continue the primitive-language phase beyond shipped stream, rotor, symbol-permutation, key-routing, and symbol-structure foundations:
   the next bounded decision should stay within shared vocabulary growth rather than preset-building
3. Keep future rotor follow-ons bounded:
   reversible rotation direction, flipped insertion, and deeper rotor-bank realism should remain explicit sub-slices rather than spilling into convenience presets
4. Add one tutorial plus one demo/challenge whenever a major new primitive family ships so the language grows with teaching support
5. Add each new teaching artifact to a visible suggested learning stage so the library feels ordered rather than flat
6. Keep performance/bundle size under watch now that builder workflow and tactile editors both sit behind the guardrails
7. Monitor classroom use of workspace library and composite unzip before widening them into sharing, folders, or bulk-expansion tooling
8. Monitor challenge-induced project switching in classroom use before adding warning dialogs
9. Avoid scope creep into brute-force tooling, birthday-bound calculators, famous-hash comparisons, or premature asymmetric demos before the underlying vocabulary exists
10. Keep the shipped bypass line bounded to honest one-in/one-out same-domain modules rather than widening it into universal mute/solo behavior
11. Tighten bridge ergonomics before opening a broad new encoding family — make raw bit entry and byte-oriented bridges feel natural before considering UTF-8 follow-ons
12. Treat a `v2.0` sanity/framing pass as the next product-level checkpoint now that the first systems-composition slice is framed, but keep it focused on organization, cohesion, and close-out rather than restarting vocabulary sprawl
