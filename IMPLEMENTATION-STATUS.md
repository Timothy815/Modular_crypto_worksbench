# MCW — Implementation Status

Last updated: March 21, 2026

---

## Current State

The project has moved from planning-only to implementation scaffold.

Established and now available for other agents:
- implementation contract
- AI coordination protocol
- AI workstream ownership
- project toolchain scaffold
- engine core type definitions
- graph validation
- param validation against `paramSchema`
- iterative topological executor
- initial engine tests
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
- primitive module files under `src/engine/modules/`
- module definitions for:
  - `TextInput`
  - `KeyInput`
  - `BitSource`
  - `SymbolToBits`
  - `BitsToSymbol`
  - `XOR`
  - `Output`
- module unit tests

Should avoid for now:
- changing `src/engine/types.ts`
- changing executor semantics
- changing validation rules without coordination

### Gemini

Safe to begin:
- review `src/engine/validation.ts`
- review `src/engine/executor.ts`
- review failure modes and edge cases
- identify missing tests or incorrect assumptions

Best focus:
- whether validation coverage is sufficient
- whether executor assumptions are too loose
- whether the future runtime-state seam needs a stronger placeholder

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

The public-facing placeholder app and README have been identified as normalization targets and should not be treated as representative product work.

---

## Architect Notes

The current scaffold is intentionally narrow. It establishes shared interfaces and execution structure first so other workstreams can build on stable ground.

Architectural normalization added on March 21:
- package scripts aligned with contributor workflow
- contract aligned with record-based registry already used in code
- validator expanded to cover params as well as graph structure
- public template surfaces marked for replacement with MCW-specific content

The next integration milestone should be:

```text
TextInput -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

After that:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```
