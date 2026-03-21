# MCW — Implementation Status

Last updated: March 21, 2026

---

## Current State

The project has completed the minimal UI milestone on `main` and has now entered the composite-module groundwork phase on `feature/composite-groundwork`.

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
- initial engine-facing composite type layer
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
- use the latest safe checkpoint on `feature/composite-groundwork`: `7d8bf3c`
- expose composite library entries in the palette
- allow composite definitions to be placed in the workbench, not just primitives
- make the inspector render composite definitions safely
- keep the first composite UI proof narrow and end-to-end

Should avoid for now:
- reopening the engine execution model without a concrete blocker
- starting subgraph-to-composite authoring UI yet
- hiding domain boundaries for convenience

### Gemini

Safe to begin:
- review the live composite app integration on `feature/composite-groundwork`
- critique the first composite UI proof once placement is enabled
- identify any risk in the registry synthesis path before authoring UI begins

Best focus:
- whether reusable composite definitions remain cleanly separated from workbench UI metadata
- whether persistence and import/export are sound enough for reusable classroom artifacts
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
Composite groundwork -> reusable composition -> deeper execution visibility
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

Active branch:
- `feature/composite-groundwork`

Composite groundwork branch currently includes:
- `COMPOSITE-V1-CONTRACT.md`
- engine composite type surface in `src/engine/composites.ts`
- composite-definition validation
- composite library persistence shape
- executable composite support in the engine
- composite library in app state
- effective registry synthesis (`primitives + composites`)
- app execution wired to the synthesized registry

Latest safe checkpoint for resume:
- branch: `feature/composite-groundwork`
- commit: `7d8bf3c`
- message: `Wire composite library into app registry flow`

Next intended milestone:
- minimal composite UI proof
- expose composite entries in the palette
- allow placing a composite instance into a graph
- prove it executes in the live workbench
