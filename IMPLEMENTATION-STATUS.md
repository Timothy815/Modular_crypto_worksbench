# MCW — Implementation Status

Last updated: March 21, 2026

---

## Current State

The project has moved well beyond scaffold status.

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
- reducer-backed UI state
- visual workbench canvas
- add / delete / move / connect editor fundamentals
- module-role color coding in palette and canvas
- structured parameter editors for `bits` and `wiring`
- workbench persistence (autosave/restore + JSON import/export)
- sticky-note annotations stored as UI metadata
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
- extract `BitsEditor` and `WiringEditor` into dedicated UI components
- normalize merge-readiness and milestone docs for the current UI branch
- begin theme-token groundwork for dark mode
- improve note/layout UX if needed

Should avoid for now:
- changing `src/engine/types.ts`
- changing executor semantics
- hiding domain boundaries for convenience

### Gemini

Safe to begin:
- review persistence-format boundaries between engine `Project` and UI layout metadata
- review annotation model and whether it stays properly outside the engine
- identify merge-readiness risks before `v0.4.0`

Best focus:
- whether layout, annotations, and project data remain cleanly separated
- whether persistence and import/export are sound enough for classroom use
- whether the UI is staying aligned with the product-teaching goals

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
Persistence UI -> composite workflows -> deeper execution visibility
```

The canonical hybrid reference machine remains:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

---

## Current Branch Status

Stable engine milestone on `main`:
- tag `v0.2.0`

Active UI branch:
- `feature/minimal-ui-shell`

UI branch currently includes:
- visual workbench canvas
- reducer-backed UI state
- node movement
- collapsible palette / inspector
- parameter inspector driven by `paramSchema`
- add/delete module controls
- refactored node DOM with separate body/port hit areas
- port-to-port connection creation (drag output to input)
- connection deletion (click existing connection)
- UI-side connection validation and target highlighting
- color-coded modules by functional role (source, operator, bridge, sink)
- structured editors for `bits` and `wiring`
- workbench persistence with local autosave/restore
- JSON import/export
- sticky-note annotations stored in UI metadata
- improved module placement (new nodes appear in visible area)

Completed UI milestones (March 21, 2026):
- node DOM refactored for separate body/port interaction
- connection creation and deletion implemented
- connection validation and highlighting implemented
- module category color-coding added
- structured parameter editors added
- persistence document boundary added
- sticky-note annotations added
- module placement fixed to stay within visible canvas

Next intended UI milestone:
- extract structured editors into dedicated components
- dark mode via theme tokens
- prepare `feature/minimal-ui-shell` for merge to `main` and `v0.4.0`
