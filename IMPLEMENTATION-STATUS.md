# MCW — Implementation Status

Last updated: March 21, 2026

---

## Current State

The project has shipped the composite and analysis milestones on `main` and has now entered the
first `Build / Analyze / Break` product phase on `feature/break-workflows`.

Established and now available for other agents:
- implementation contract
- AI coordination protocol
- AI workstream ownership
- project toolchain scaffold
- engine core type definitions
- graph validation
- param validation against `paramSchema`
- iterative topological executor
- V1 primitive module set
- hybrid reference pipeline tests
- released minimal UI shell on `main` (`v0.4.0`)
- reducer-backed UI state
- visual workbench canvas
- add / delete / move / connect editor fundamentals
- module-role color coding in palette and canvas
- structured parameter editors for `bits` and `wiring`
- workbench persistence (autosave/restore + JSON import/export)
- sticky-note annotations stored as UI metadata
- composite V1 contract
- first-class composite workflow
- analysis/debugging visibility workflow
- step-through execution and signal-path trace filtering
- `BREAK-V1-CONTRACT.md`
- GitHub Pages deployment workflow

---

## Files Added

Project and coordination:
- `ENGINE-V1-CONTRACT.md`
- `AI-COORDINATION.md`
- `AI-WORKSTREAMS.md`
- `IMPLEMENTATION-STATUS.md`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `.gitignore`

Engine scaffold:
- `src/engine/types.ts`
- `src/engine/validation.ts`
- `src/engine/executor.ts`
- `src/engine/index.ts`
- `src/engine/modules/index.ts`
- `src/engine/validation.test.ts`
- `src/engine/executor.test.ts`

---

## Locked In Code

The following decisions are no longer just prose; they are reflected in the scaffold:
- iterative topological execution
- stateless V1 module evaluation
- required graph validation before execution
- minimal `ParamSchema`
- architect-owned engine core files

---

## Safe Next Tasks

### Claude

Safe to begin:
- use the current branch `feature/break-workflows`
- read `BREAK-V1-CONTRACT.md` first
- continue from the latest comparison-first break workflow checkpoint
- keep the break workflow comparison-focused, not attack-automation focused

Should avoid for now:
- introducing brute-force or automated cryptanalysis too early
- mutating the core engine contract unless strictly required
- letting the comparison UI drift into a generic diff tool

### Gemini

Safe to begin:
- review the current comparison-first break workflow checkpoint
- critique whether the branch is ready for richer divergence visualization or merge-readiness cleanup

Best focus:
- whether the break workflow remains educational and explicit
- whether comparison logic stays engine-adjacent rather than engine-invasive
- whether the UI communicates mutation and divergence clearly

---

## Current Verification State

Available checks:
- `npm test`
- `npm run lint`
- `npm run build`

Architect expectation for all future changes:
- tests pass
- lint passes
- build passes

The UI is now representative product work, though it remains an early editor slice rather than the final product.

---

## Architect Notes

The current scaffold is intentionally narrow. It establishes shared interfaces and execution structure first so other workstreams can build on stable ground.

Architectural normalization added on March 21:
- package scripts aligned with contributor workflow
- contract aligned with record-based registry already used in code
- validator expanded to cover params as well as graph structure
- public template surfaces replaced with MCW-specific content

The next product milestone should be:

```text
Build / Analyze / Break -> comparison-first break workflows
```

The canonical hybrid reference machine remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

---

## Current Branch Status

Stable releases on `main`:
- `v0.2.0` — primitive engine milestone
- `v0.4.0` — minimal UI shell milestone
- `v0.5.0` — composite workflow milestone
- `v0.6.0` — analysis visibility milestone

Active branch:
- `feature/break-workflows`

Break workflow branch currently includes:
- `BREAK-V1-CONTRACT.md`
- `src/ui/execution-compare.ts`
- execution comparison proof tests
- baseline capture from the live workbench
- reducer-backed and persisted comparison baseline state
- baseline-vs-variant comparison summary
- baseline value visibility next to changed params
- extracted comparison panel
- first-divergence canvas highlighting

Latest safe checkpoint for resume:
- branch: `feature/break-workflows`
- commit: `fd8ab61` — `Unify break baseline state and mutation visibility`

Latest local working state before next checkpoint:
- extracted `comparison-panel.tsx`
- side-by-side divergent signal display
- divergence highlight on the affected canvas node
- verification clean: `npm test`, `npm run lint`, `npm run build`

Next intended milestone:
- checkpoint the comparison-visibility pass
- update branch docs and handoff notes
- then choose between Gemini review and merge-readiness cleanup
