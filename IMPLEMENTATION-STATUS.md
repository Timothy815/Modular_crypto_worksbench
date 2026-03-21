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
- tighten connection-editing UX in `src/ui/components/workbench-panel.tsx`
- add UI-side target-port validation and highlighting
- improve parameter editors for `bits` and `wiring`
- begin persistence UI groundwork once editor interactions are stable

Should avoid for now:
- changing `src/engine/types.ts`
- changing executor semantics
- hiding domain boundaries for convenience

### Gemini

Safe to begin:
- review connection-editing behavior and invalid-target handling
- review persistence-format boundaries between engine `Project` and UI layout metadata
- identify editor UX risks before persistence and composite work

Best focus:
- whether the editor blocks invalid graph mutations early enough
- whether layout and project data remain cleanly separated
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
- color-coded modules by functional role (source, operator, bridge, sink)
- improved module placement (new nodes appear in visible area)

Completed UI milestones (March 21, 2026):
- node DOM refactored for separate body/port interaction
- connection creation and deletion implemented
- module category color-coding added
- module placement fixed to stay within visible canvas

Next intended UI milestone:
- tighten connection validation / target highlighting
- persistence UI (save/load projects + layout)
- structured editors for `bits` and `wiring` params
- dark mode via theme tokens
- prepare `feature/minimal-ui-shell` for merge to `main` and `v0.4.0`
