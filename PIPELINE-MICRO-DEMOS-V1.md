# PIPELINE-MICRO-DEMOS-V1

Last updated: April 10, 2026

Status: Draft

## Purpose

This contract defines the first bounded **end-to-end pipeline micro-demo** slice for MCW.

The goal is to complement the existing primitive-local `Try Demo` system with a small set of compact, editable workspaces that demonstrate how newly shipped bridge and mismatch helpers compose into honest working pipelines.

## Product Problem

MCW now has a strong local vocabulary for:
- sequence sources
- sequence-to-ticked bridges
- ticked-to-sequence collectors
- representation-to-operational bridges
- explicit mismatch repair helpers
- explicit strict mismatch assertion helpers

Primitive-local micro demos prove each piece in isolation.
What they do not yet prove is:
- how these pieces compose into a correct working path
- where strictness belongs versus where repair belongs
- how to stay honest while moving between representation and operational domains

That leaves a real teaching gap:
- users can see the bricks
- users still need the smallest honest machines that show how the bricks fit together

## Core Question

Can MCW add a small end-to-end micro-demo layer for sequence and bridge workflows without turning the product into a second full tutorial library?

## Strategic Principle

**Teach one complete composition pattern at a time.**

That means:
- each pipeline micro demo should answer one “how do I build this correctly?” question
- each example should stay much smaller than a flagship lab
- the examples should be fully editable normal workspaces
- they should focus on composition truth, not broad lesson narration

## Why Now

This is the right next move because the recent sequence and mismatch slices are now structurally complete enough to justify end-to-end examples:
- `STRUCTURED-SEQUENCE-SIGNAL-MODEL-V1`
- `BIT-AND-HEX-SEQUENCE-BRIDGES-V1`
- `REPRESENTATION-TO-OPERATIONAL-BRIDGES-V1`
- `TICKED-TO-SEQUENCE-COLLECTORS-V1`
- `REPEAT-TO-MATCH-V1`
- `TRUNCATE-TO-MATCH-V1`
- `PAD-TO-MATCH-V1`
- `REQUIRE-LENGTH-MATCH-V1`

Without composition examples, this line remains technically powerful but unnecessarily easy to misuse.

## Locked V1 Pipeline Set

V1 is locked to **4-6 compact workflows** in the sequence / bridge / mismatch space.

The recommended first set is:
1. ASCII repeated-key XOR pipeline
2. strict match before XOR pipeline
3. truncate-to-block pipeline
4. pad-to-block pipeline
5. representation round-trip pipeline

If a sixth demo is added, it should remain in the same family:
6. hex-authored repeated-key or nibble-stream XOR pipeline

## Include

The first slice should include:
- one new bounded registry for pipeline micro demos
- one small editable seeded workspace per locked workflow
- a clear launch path from the workbench UI
- pipeline labels that state the full composition shape
- examples that visibly use the new sequence, bridge, and mismatch modules rather than hiding the policy in downstream operators

## Exclude

Do not include in V1:
- a new broad lesson browser
- long tutorial prose attached to each demo
- challenge scaffolding for each pipeline micro demo
- every possible bridge combination
- protocol-scale labs
- cryptanalysis-oriented demos
- multi-step onboarding flows

## Relationship To Existing Work

This slice is a complement to the primitive micro-demo line:
- `PRIMITIVE-MICRO-DEMOS-V1`
- `PRIMITIVE-MICRO-DEMOS-V2`
- `PRIMITIVE-MICRO-DEMOS-V3`

The distinction should stay clear:
- primitive micro demos answer “what does this tool do?”
- pipeline micro demos answer “how do these tools compose into one honest working path?”

This slice should not replace the main demo/tutorial/challenge libraries.

## Core Rules

1. **Examples must stay end-to-end but small**
- each workspace should show a complete path from source through transformation to visible output or collection
- the graph should remain compact enough to read without becoming a full lab

2. **Each example teaches one composition truth**
- repeated-key alignment
- strict mismatch assertion
- block clipping
- block padding
- representation round-trip

3. **The graph must stay honest**
- no hidden conversion
- no hidden mismatch repair
- no silent operator flexibility
- bridge and mismatch choices must remain visible on-canvas

4. **Examples must remain editable normal workspaces**
- once opened, a pipeline micro demo behaves exactly like any other workspace
- no special runtime or demo-only execution path is allowed

5. **This is not a second flagship-demo library**
- keep the surface bounded
- do not let it expand into full teaching sequences in V1

## Recommended Implementation Shape

The strongest V1 shape is:
- a dedicated pipeline-micro-demo registry adjacent to the existing primitive micro-demo data
- one bounded launcher surface, likely in the workbench or palette-adjacent teaching/discovery UI
- seeded project documents with concise names, summaries, and pipeline labels

Reason:
- the composition examples are a different teaching object than primitive-local demos
- separating the registries preserves conceptual clarity
- the existing seeded-workspace model is already the right infrastructure

## Expected File Scope

Primary files likely in scope:
- a new pipeline-micro-demo registry/helper under `src/ui/`
- workbench or palette-adjacent launcher UI
- focused tests for registry coverage and workspace loading

Supporting files may include:
- `src/ui/demo-projects.ts`
- `src/ui/components/quick-start-panel.tsx`
- `src/ui/components/primitive-palette.tsx`
- `README.md`
- `IMPLEMENTATION-STATUS.md`
- `CLAUDE.md`

This slice should not require engine-layer changes.

## Recommended V1 Demo Shapes

### 1. ASCII repeated-key XOR

Recommended shape:
- `AsciiSequenceInput(message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(a)`
- `AsciiSequenceInput(key) -> RepeatSymbolToMatch(reference=message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(b)`
- `XOR -> TickedBitsToSequence -> BitOutput`

Purpose:
- proves repeated-key alignment honestly
- proves the ASCII bridge path into operational `bits`
- proves collection back into a whole visible result

### 2. Strict match before XOR

Recommended shape:
- `AsciiSequenceInput(message) -> RequireSymbolLengthMatch(reference=key) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(a)`
- `AsciiSequenceInput(key) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(b)`

Purpose:
- teaches the difference between repair and assertion
- localizes mismatch failure to the graph location that expresses the premise

### 3. Truncate-to-block

Recommended shape:
- `BitSequenceInput(longBuffer) -> TruncateBitsToMatch(reference=block, side=left) -> BitsSequenceToTicked(wordWidth=8) -> XOR(a)`
- `BitSequenceInput(block) -> BitsSequenceToTicked(wordWidth=8) -> XOR(b)`

Purpose:
- teaches explicit clipping before a fixed-width transform

### 4. Pad-to-block

Recommended shape:
- `BitSequenceInput(shortBuffer) -> PadBitsToMatch(reference=block, side=right, padBit=0) -> BitsSequenceToTicked(wordWidth=8) -> XOR(a)`
- `BitSequenceInput(block) -> BitsSequenceToTicked(wordWidth=8) -> XOR(b)`

Purpose:
- teaches explicit extension before a fixed-width transform

### 5. Representation round-trip

Recommended shape:
- `AsciiSequenceInput -> AsciiSequenceToBits -> BitsToHex -> HexOutput`
- and one reverse-visible path
- `HexSequenceInput -> BitsToAscii -> TextOutput`

Purpose:
- proves that representation forms are not dead ends
- teaches the canonical bit-domain model by example

## Success Criteria

This slice is successful when:
- MCW gains a small set of compact end-to-end examples for the new sequence/bridge/mismatch line
- users can see correct composition patterns without having to infer them from isolated primitive demos
- the examples remain honest, compact, and editable
- the main demo/tutorial/challenge libraries remain the larger system-level teaching surfaces

## Validation Expectations

This slice should add focused tests for:
- registry coverage of the locked V1 pipeline set
- preserving the intended end-to-end structural shape of each example
- keeping repair and strict-assertion examples semantically honest
- ensuring launched workspaces remain ordinary editable projects

## Explicitly Avoid Next

Do not let this become:
- a full tutorial rewrite
- a second flagship lab library
- a giant bridge-combination catalog
- a substitute for the main learning sequence

Keep the first move about compact composition truth only.
