# MCW — Modern Primitives V1 Contract

This contract defines the first bounded primitive-expansion milestone after guided challenges.

The goal is not to dump dozens of modules into the library at once. The goal is to prove that the
current engine, editor, analysis, break, and challenge workflows scale cleanly to a more modern
bit-domain vocabulary.

---

## Goal

Deliver the first modern-symmetric primitive pack for MCW.

The first `modern-primitives` milestone should make it possible to build and teach simple
bit-domain machines that go beyond XOR and fixed bit sources.

The target outcome is not "AES in one branch." The target outcome is:
- richer bit-domain composition
- clearer proof that MCW supports modern cryptographic structure
- a foundation for later challenge content and mini-cipher demonstrations

---

## Non-Goals

This milestone does **not** yet need to include:
- a full DES or AES implementation
- round-key schedules
- performance optimization for large cipher networks
- byte-domain support
- stateful synchronous clock systems
- automated challenge generation for the new modules

If a proposed feature requires those, it is too large for this slice.

---

## Product Definition

V1 modern primitive expansion should answer three questions:

1. **Can MCW express more than rotor/XOR bridge demos?**
2. **Can students see classic modern-cipher building blocks directly in the graph?**
3. **Do the current editor/analysis/challenge systems remain usable with these modules?**

This is a capability-expansion milestone, not a final cryptosystem milestone.

---

## Required V1 Capabilities

### 1. First Modern Primitive Pack

The first pack should likely include:
- `Permutation`
- `BitShifter`
- `LFSR`
- `SBox`

These four together give MCW:
- routing
- diffusion-like movement
- keystream flavor
- substitution

That is enough to build convincing mini modern examples.

### 2. Param Schemas That Fit the Existing UI

Each new primitive must define clean `paramSchema` metadata that works with the current inspector.

If a primitive is impossible to use sanely without a custom editor, note that explicitly and either:
- defer the module
- or keep the first parameter shape simple enough for the current UI

### 3. Validation That Remains Honest

New modules must preserve the core MCW rule:
- explicit ports
- explicit types
- explicit parameter structure

The validator should catch malformed modern-module params with the same discipline used for
rotor wiring and existing bit arrays.

### 4. At Least One End-to-End Modern Demo

The branch should add at least one demo graph showing the new modules in use.

Good examples:
- simple substitution-permutation toy network
- xor + lfsr stream toy machine
- permutation + s-box transformation chain

The point is to prove that the workbench experience remains coherent with the new modules.

### 5. Classroom Compatibility

The new modules should be teachable.

That means:
- names should be explicit
- params should be legible
- outputs should remain interpretable in the existing analysis surfaces

Avoid "black box crypto" modules that hide all structure.

---

## Execution / Engine Constraints

The primitive-expansion milestone must preserve current engine rules:
- pure `evaluate()`
- synchronous deterministic execution
- no UI imports in engine
- no special-case execution mode for modern modules

Modern primitives should be ordinary `ModuleDef`s living inside the same registry model.

---

## UI Constraints

The UI should stay disciplined while the module library grows.

That means:
- primitive names remain readable
- palette categories remain scannable
- analysis surfaces still make sense with these modules

If adding a primitive reveals a real inspector or palette limitation, record it clearly rather than
working around it with ad hoc behavior.

---

## Recommended V1 Scope

The first implementation should likely include:

1. `Permutation`
2. `BitShifter`
3. `LFSR`
4. `SBox`
5. one demo project using at least two of them together

This is enough to justify the milestone.

---

## Recommended Implementation Order

1. Implement the simplest modern primitives first
   - `Permutation`
   - `BitShifter`

2. Add focused tests for each

3. Implement `LFSR`
   - keep the first version parameterized but still synchronous and stateless by deriving its
     output from explicit params

4. Implement `SBox`
   - keep its parameter format explicit and testable

5. Add one modern demo graph

6. Review whether the current inspector is still sufficient

Only after that should the branch consider more ambitious cipher families.

---

## Definition of Done

The `modern-primitives` V1 milestone is done when:

- the modern primitive pack is implemented and tested
- the modules are available in the live workbench
- at least one demo graph uses them coherently
- the current analysis/challenge surfaces still work on the new graphs
- the branch proves that MCW can teach modern bit-domain structure, not just classical and bridge examples

That will be enough to justify the first modern primitive expansion milestone.
