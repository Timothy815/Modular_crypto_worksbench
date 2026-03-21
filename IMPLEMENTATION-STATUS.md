# MCW — Implementation Status

Last updated: March 21, 2026

---

## Current State

The project has now shipped the composite, analysis, and first break-workflow milestones on `main`
through `v0.7.0`, and has started the first classroom-facing challenge phase on
`feature/guided-challenges`.

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
- comparison-first break workflow on `main` (`v0.7.0`)
- `GUIDED-CHALLENGES-V1-CONTRACT.md`
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
- use the current branch `feature/guided-challenges`
- read `GUIDED-CHALLENGES-V1-CONTRACT.md` first
- keep the first challenge workflow narrow and classroom-facing
- reuse existing comparison and analysis surfaces instead of inventing a separate scoring system

Should avoid for now:
- introducing user accounts, grades, or LMS-like systems too early
- mutating the core engine contract unless strictly required
- letting challenge UI become a generic quiz layer detached from machine structure

### Gemini

Safe to begin:
- review the `GUIDED-CHALLENGES-V1-CONTRACT.md` framing
- critique whether the first challenge workflow stays explicit, inspectable, and educational

Best focus:
- whether challenge checking stays engine-adjacent rather than engine-invasive
- whether the UI communicates task, success, and failure clearly
- whether the branch remains aligned with the classroom use case

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
Build / Analyze / Break -> guided challenges
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
- `v0.7.0` — break workflow milestone

Active branch:
- `feature/guided-challenges`

Guided challenges branch currently includes:
- `GUIDED-CHALLENGES-V1-CONTRACT.md`
- challenge definition and evaluation helpers
- starter challenge seed data
- challenge evaluation proof tests
- first challenge panel in the app shell
- challenge status and target-behavior checking
- load-challenge-start workflow

Latest safe checkpoint for resume:
- branch: `feature/guided-challenges`
- current local branch created from `main` after `v0.7.0`

Next intended milestone:
- checkpoint the first guided-challenge proof
- decide whether to add richer challenge state/persistence next
- then ask Gemini to review the classroom-workflow architecture
