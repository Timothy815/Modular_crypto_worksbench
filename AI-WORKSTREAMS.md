# MCW — AI Workstreams

This document assigns the initial workstreams for the first engine slice.

---

## Active Roles

### Codex — Architect

Owns:
- `ENGINE-V1-CONTRACT.md`
- `AI-COORDINATION.md`
- `AI-WORKSTREAMS.md`
- `src/engine/types.ts`
- `src/engine/validation.ts`
- `src/engine/executor.ts`
- project scaffold decisions that affect all agents

Responsibilities:
- lock the implementation contract
- create the core engine interfaces
- define validation boundaries
- define executor behavior
- keep cross-agent work aligned

### Claude — Module Implementer

Suggested ownership:
- `src/engine/modules/`
- primitive module definitions
- module-level tests for those primitives

Suggested first tasks after architect scaffold lands:
- implement `TextInput`
- implement `KeyInput`
- implement `BitSource`
- implement `SymbolToBits`
- implement `BitsToSymbol`
- implement `XOR`
- implement `Output`
- then implement `Rotor`
- then implement `Reflector`

Constraints:
- do not redefine shared engine core types
- do not change executor semantics without coordination
- use the architect-owned types and validation model

### Gemini — Reviewer / Systems Critic

Suggested ownership:
- review executor semantics
- review validation coverage
- inspect edge cases and future extensibility seams
- identify missing tests or architectural drift

Suggested first tasks after architect scaffold lands:
- review `validation.ts`
- review `executor.ts`
- challenge failure modes
- review whether the state seam is sufficient without infecting V1

---

## Current Sequence

1. Codex establishes scaffold and core engine contract in code.
2. Claude implements primitive modules against those interfaces.
3. Gemini reviews the architecture and catches risks before the surface area grows.
4. Codex integrates any required adjustments and keeps the contract coherent.

---

## Integration Boundaries

These boundaries should hold unless deliberately revised:

- `types.ts` defines the shared language.
- `validation.ts` rejects structurally invalid graphs before execution.
- `executor.ts` assumes validated input and performs deterministic iterative execution.
- module files should focus on module behavior, not graph orchestration.

---

## Ready Signals

Claude can start primitive module work once:
- `src/engine/types.ts` exists
- `src/engine/modules/` exists
- the module definition contract is stable enough to target

Gemini can start review once:
- `src/engine/validation.ts` exists
- `src/engine/executor.ts` exists
- at least one end-to-end execution path is representable

---

## Short-Term Goal

Reach a tested engine slice that can represent and execute:

```text
TextInput -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

Then expand to:

```text
TextInput -> Rotor -> Reflector -> Rotor -> SymbolToBits -> XOR -> BitsToSymbol -> Output
```

The first goal proves the general engine. The second proves the hybrid-machine vision.
