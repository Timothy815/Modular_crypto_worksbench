# PYTHON-EXPORT-FOUNDATIONS-V1

Last updated: March 27, 2026

Status: Implemented on `main`

---

## Purpose

Define the first bounded implementation slice for exporting an MCW workspace as standalone executable Python.

This contract is the tactical follow-on to:
- `PYTHON-EXPORT-V1.md`

That earlier document records why Python export matters strategically.
This document defines the first slice that is actually safe to build.

---

## Product Goal

Allow a user to export one compatible workspace as one readable standalone Python file that reproduces MCW's normal stateless execution for a bounded supported subset of primitives.

This is **Python export foundations**, not full workspace code generation.

---

## Strategic Position

This slice is important because it begins the transition from:
- visible design and simulation

to:
- visible design plus executable artifact generation

But V1 must stay very narrow.

The first export line should prove:
- artifact shape
- execution parity
- compatibility checking
- a maintainable code-generation structure

It should not try to prove total module coverage.

---

## Core Question

What is the smallest Python export slice that proves MCW can generate faithful external code without forcing a runtime or architecture rewrite?

---

## Required V1 Shape

V1 must export:
- one workspace
- to one standalone `.py` file
- for one stateless execution pass
- over one bounded primitive-only subset

The generated file must:
- contain the runtime helper functions it needs
- contain the graph execution code
- contain one `main()` entrypoint
- print sink outputs to stdout

The output should be readable, topological, and explicit rather than heavily optimized or obfuscated.

---

## Supported V1 Subset

V1 supports only stateless primitive modules from these families:

### Sources / Sinks
- `TextInput`
- `AsciiSource`
- `BitSource`
- `HexSource`
- `Output`
- `TextOutput`
- `BitsToAscii`
- `BitOutput`
- `HexOutput`

### Bridges
- `SymbolToBits`
- `BitsToSymbol`
- `BitsToHex`
- `HexToAscii`
- `AsciiToHex`

### Bit / Control Primitives
- `XOR`
- `AND`
- `OR`
- `NOT`
- `Gate`
- `Equals`
- `AtLeast`
- `Mux`
- `Demux`
- `MultiRouter`

### Structural Bit Transforms
- `Permutation`
- `BitJoin`
- `BitSplit`
- `BitPad`
- `BitWindow`
- `BitShifter`

This list is intentionally narrow.
It is a curated V1 subset, not a promise that every stateless primitive is included.

Later stateless subset growth after this foundations slice is tracked in:
- `PYTHON-EXPORT-EXPANSION-V1.md`

---

## Explicit V1 Exclusions

V1 must exclude:

### Stateful / Ticked Modules
- `Clock`
- `Counter`
- `Rotor`
- `RotorReverse`
- `LFSR`

### Advanced Primitive Families
- `Reflector`
- `Plugboard`
- `SBox`
- `ModExp`
- `ModInverse`
- `MulMod`
- other arithmetic families not listed in the supported subset

### Structured Definitions
- composites
- iterators

### Other Engine Features
- bypass behavior
- ticked execution
- tick slicing
- linked rotor param shadowing

If a workspace contains any unsupported module or feature, export must fail clearly before file generation.

---

## Execution Parity Rule

V1 parity target is:
- `executeProject()`

V1 parity does **not** target:
- `executeTickedProject()`

For supported workspaces, the generated Python program must produce output equivalent to MCW's normal stateless execution for the same project params and connections.

The first slice should prefer exact output equivalence over clever Python style.

Export requires:
- normal MCW graph validation to pass
- compatibility checking for the supported export subset to pass

If graph validation fails, V1 must report validation issues first rather than attempting compatibility-only export.

---

## Artifact Shape

V1 produces:
- one standalone `.py` file

That file should contain:
1. small Python helpers for the supported primitive subset
2. embedded workspace data or explicit variable assignments derived from the workspace
3. one topologically ordered `run()` function that executes the graph
4. one `main()` function that invokes `run()` and prints sink outputs

V1 should not generate:
- a Python package
- multiple backend files
- external runtime dependencies
- pip-install requirements

Python stdlib only.

V1 should target:
- Python `3.8+`

The generated code must avoid newer syntax that would unnecessarily narrow compatibility.

---

## Readability Requirement

Generated Python should be structurally readable:
- helper functions should have primitive-family names
- topological execution should be legible line by line
- intermediate values should be named after module IDs or stable derived identifiers
- no minification
- no encoded blobs

The generated code should look like a direct executable rendering of the workspace, not a compressed serialization payload.

### Identifier Sanitization

Module instance IDs and any derived variable names must be sanitized into valid Python identifiers:
- replace non-alphanumeric characters with `_`
- collapse repeated `_` where practical
- prefix with `m_` if the identifier would otherwise start with a digit

Exported file names should be sanitized similarly, then suffixed with `.py`.

---

## Export Entry Surface

V1 should expose one export action from the active workspace UI.

Recommended surface:
- workspace actions area, near existing JSON import/export affordances

User flow:
1. user clicks `Export Python`
2. compatibility check runs
3. if compatible, download one `.py` file
4. if incompatible, show a clear report and do not emit code

### Sink Output Format

V1 should print sink outputs in a stable text format:
- symbol sinks print plain string values
- bit sinks print space-free binary strings such as `10110001`
- hex sinks print uppercase hex strings

Each sink should print on its own line using:
- `<module_id>: <value>`

The printed `<module_id>` should use the original MCW module instance ID, not the sanitized Python identifier.

---

## Compatibility Check

Before export, MCW must run an explicit compatibility check.

The compatibility report should identify:
- unsupported modules by instance ID and `defId`
- unsupported structured definitions such as composites or iterators
- unsupported stateful/ticked features

V1 must not do partial export.
V1 must not silently skip modules.
V1 must not generate placeholders that appear valid.

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- one `Export Python` action in the workspace actions area
- explicit graph validation before export
- explicit compatibility rejection for unsupported modules, composites, iterators, bypass, and stateful/ticked behavior
- one standalone `.py` download with embedded helpers and topological `run()` execution
- sink printing in the locked `<module_id>: <value>` format
- parity coverage against `executeProject()` via Python subprocess tests when `python3` is available

Implemented engine surface:
- `src/engine/codegen/python.ts`

Implemented UI surface:
- workspace-local `Export Python` download action near JSON export

Failure should be clear and blocking.

The compatibility check may later gain warning tiers, but V1 should treat unsupported modules or unsupported features as blocking failures.

---

## Test Strategy

V1 must include parity tests that:
- build one or more supported stateless projects
- export them to Python
- execute the generated Python
- compare produced sink outputs against `executeProject()`

At least one test should cover:
- bridge behavior
- one control primitive
- one structural transform

The point of V1 is not just file generation.
It is faithful external execution for the supported subset.

Parity tests should:
- spawn a `python3` subprocess
- skip gracefully if `python3` is unavailable on the test machine
- compare parsed sink outputs against `executeProject()` sink outputs for the same workspace

---

## Scope

Include:
- compatibility checking for the V1 subset
- one-file Python generation
- readable generated runtime helpers for the supported subset
- parity tests against MCW stateless execution
- one UI export entrypoint

Exclude:
- stateful export
- composite or iterator export
- optimization passes
- multiple target languages
- generalized plugin backends
- production-hardening claims

---

## Non-Goals

This slice should explicitly avoid:
- exporting every MCW machine
- pretending stateless export solves rotor/stateful systems
- generating Python that hides the original graph structure
- broad build-system integration
- packaging MCW as a full compiler toolchain

---

## Generated Code Sketch

For a simple pipeline such as:
- `BitSource -> XOR -> BitOutput`

the generated code should look structurally like:

```python
def xor_bits(a, b):
    return [left ^ right for left, right in zip(a, b)]

def run():
    m_source = [1, 0, 1, 1]
    m_mask = [0, 1, 0, 1]
    m_xor = xor_bits(m_source, m_mask)
    return {"out": m_xor}

def main():
    outputs = run()
    print("out: " + "".join(str(bit) for bit in outputs["out"]))

if __name__ == "__main__":
    main()
```

The final implementation does not need to match this sketch exactly, but it should stay comparably readable and topological.

---

## Success Criteria

This slice is successful when:
- one compatible stateless workspace can be exported as one runnable Python file
- incompatible workspaces fail with a clear compatibility report
- generated outputs match `executeProject()` for the supported subset
- the generated code is readable enough to inspect as an artifact
- the codegen structure is clean enough to extend in later export slices

---

## Recommendation

This is the correct first implementation contract for the Python export line.

It should be built as:
- **stateless**
- **primitive-only**
- **single-file**
- **parity-tested**

Not as:
- full export coverage
- a stateful runtime mirror
- or a broad codegen framework on the first pass
