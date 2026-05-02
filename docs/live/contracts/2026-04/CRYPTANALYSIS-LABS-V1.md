## Cryptanalysis Labs V1

Last updated: April 24, 2026

## Purpose

Make MCW’s cryptanalysis tools easier to understand and trust by attaching them to a small set of concrete guided labs.

This slice is intended to solve a specific product problem:

- the current cryptanalysis tools are real and increasingly capable
- some users still do not know when to use which tool or how to interpret what they see
- the missing piece is often not more control surface, but a concrete investigative path

The goal is to turn abstract panels into anchored exercises.

## Problem

Right now cryptanalysis in MCW can feel like:

- a panel full of metrics without a clear reason to run them
- a tool that answers a question only after the user already knows what to ask
- a surface whose instructional value depends too much on free-form explanation

This creates a usability gap:

- the product exposes more analysis power than some users can immediately operationalize
- the gap is especially visible in `Modern`, `Randomness`, and `Key Schedule` analysis

## User Value

This slice should let a user:

- open a concrete lab and understand why a given analysis exists
- compare a weak construction to a stronger construction and see what changed in the analysis output
- learn what a result means without needing a separate manual first

The user should leave with:

- a clearer sense of when to use each analysis tool
- a more concrete interpretation of the tool’s output
- a repeatable machine-centered exercise instead of generic prose

## Scope

V1 is intentionally narrow.

It should:

- stay inside the existing learning / tutorial / demo system
- introduce a small set of cryptanalysis-focused labs
- tie each lab to one existing analysis surface
- use concrete MCW projects or project variants as the learning substrate

V1 should not:

- redesign the entire tutorial framework
- add a notebook system
- add assessment or grading logic
- attempt to cover every cryptanalysis tool
- replace existing panel help text entirely

## V1 Shape

V1 should ship exactly three labs:

1. `Avalanche Lab`
2. `Key Schedule Lab`
3. `Randomness Lab`

Each lab should be bounded and purpose-built.

The labs should feel like:

- guided investigations of a live machine

not:

- encyclopedia pages
- static lessons detached from the workbench

## Lab State Boundary

Cryptanalysis labs should be treated as a distinct guided-learning state.

That means:

- entering a cryptanalysis lab should explicitly switch the active workspace into `cryptanalysis` mode
- cryptanalysis labs should not try to coexist with an unrelated build/tutorial flow in the same active learning surface
- V1 should avoid dual competing tutorial cards or mixed instructional states

The experience should feel like:

- now we are investigating this machine through analysis

not:

- a build tutorial and a cryptanalysis walkthrough competing for attention at once

## Lab 1: Avalanche Lab

This lab should teach:

- what one-bit avalanche is trying to reveal
- why one impressive flip is not enough
- how to read batch sweep results

The lab should use:

- one weaker modern construction
- one stronger or revised modern construction

The machine pair should demonstrate, at minimum:

- the weaker machine shows visibly uneven batch-sweep spread across input positions, not just uniformly low diffusion everywhere
- the stronger machine shows a noticeably healthier average spread and a tighter weakest/strongest range than the weaker machine

The lab should walk the user through:

1. inspect a single-bit flip result
2. run the batch sweep
3. compare weakest and strongest inputs
4. compare the weak and stronger machine variants

The lab should answer, in substance:

- did one good example fool me
- is the machine broadly diffusive or only occasionally impressive

## Lab 2: Key Schedule Lab

This lab should teach:

- that plaintext diffusion and key evolution are different questions
- how adjacent round-key differences should be read
- how to interpret weak versus broad master-key-bit spread through round-key stages

The lab should use:

- a key schedule with visibly weaker evolution
- a revised key schedule with clearer round-to-round change

The machine pair should demonstrate, at minimum:

- the weaker schedule shows only modest adjacent round-key differences for at least the early stage pairs
- the weaker schedule’s key-bit flip sweep stalls or spreads weakly into later selected stages
- the stronger schedule shows broader adjacent round-key differences and more visible spread into later stages

The lab should walk the user through:

1. choose the master-key source
2. choose and order explicit round-key outputs
3. inspect adjacent round-key differences
4. run the key-bit flip sweep
5. compare weak and stronger schedule variants

The lab should answer, in substance:

- are my round keys actually evolving
- is a master-key bit spreading through the schedule or stalling early

## Lab 3: Randomness Lab

This lab should teach:

- what the randomness surface can and cannot say
- how obvious bias, repetition, and short-cycle structure appear
- why “looks random enough” is not the same as “cryptographically strong”

The lab should use:

- one visibly weak stream source or repeating pattern
- one healthier comparative stream

The machine pair should demonstrate, at minimum:

- the weaker stream shows at least one obvious detectable artifact such as bias, repetition, or lopsided transitions
- the healthier stream reduces those obvious artifacts enough to create a meaningful comparison
- the healthier stream is still not framed as “secure” or “proven random”

The lab should walk the user through:

1. inspect monobit balance
2. inspect run behavior
3. inspect transition and pattern heatmaps
4. compare weak and healthier streams

The lab should answer, in substance:

- what kinds of structure the randomness tools are good at surfacing
- what those tools still do not prove

## Required Behaviors

V1 should provide:

1. an obvious path from the learning surface into each lab
2. a lab-specific project or project variant with the required analysis shape already exposed
3. short, explicit investigation steps tied to the actual panel controls the user should use
4. a small conclusion or interpretation step that explains what the user just observed

The labs should rely on the real shipped tools.

They should not fake results or hardcode screenshots in place of live analysis.

Prepared lab projects must already expose the required analysis shape.

That means:

- required sources are already present
- required sinks are already wired and analyzable
- the lab does not spend its investigation phase on basic setup or rescue wiring

## Visual / Interaction Shape

The safest V1 shape is:

- each lab appears as a guided tutorial or guided tutorial branch
- each lab points the user at a prepared project or prepared comparison variant
- each lab step references a specific control or result area in the active cryptanalysis surface

The experience should stay compact and progressive.

A good V1 pattern is:

1. short framing
2. do one concrete thing
3. observe one concrete result
4. compare against a second machine or variant
5. summarize what changed

For V1, the comparison model should be explicit:

- prefer single-canvas comparison when feasible
- weak and stronger variants should live in one prepared project or one prepared lab surface
- the user should inspect variant A, then variant B, without a mid-lab project switch when avoidable

V1 should avoid relying on project swapping as the main comparison mechanism.

## Supported Artifact Strategy

V1 should reuse existing MCW artifacts wherever possible:

- demo projects
- starter tutorials
- saved machine variants if already available

If a lab needs a second “stronger” variant, it should come from:

- a second prepared project
- or a prepared branch in the tutorial flow

V1 should not require the user to build the weaker and stronger machines from scratch before the lab becomes useful.

When feasible, V1 should prefer a prepared single-project comparison over a tutorial that swaps the user between separate projects.

The labs should also be discoverable from inside the relevant analysis surfaces.

That means:

- the `Modern` analysis surface should offer a path into the Avalanche Lab
- the `Key Schedule` analysis surface should offer a path into the Key Schedule Lab
- the `Randomness` analysis surface should offer a path into the Randomness Lab

The user should not need to back out to a separate learning surface just to find the corresponding lab.

## Copy Principles

Keep the labs observational and evidence-first.

Good phrasing:

- `This weak schedule changes only a little between early round keys.`
- `The batch sweep shows that some input positions still spread poorly.`
- `This stream hides obvious bias better, but the panel still does not prove security.`

Bad phrasing:

- `This cipher is secure.`
- `This random source is safe.`
- `This analysis proves the machine is strong.`

The labs should teach interpretation, not hand out verdicts.

The conclusion step should be short authored interpretation copy tied to the intended observation pattern.

It should not be:

- generated live verdict text
- a proof-like conclusion inferred from the machine

It should be:

- a compact explanation of what this class of result usually means and why the comparison mattered

## Non-Goals

V1 is not:

- a full cryptanalysis curriculum
- a new experiment notebook
- a scoring or grading system
- a full rewrite of cryptanalysis panel copy
- a full demo-library overhaul

## Likely Implementation Direction

The safest implementation path is:

1. add three cryptanalysis labs to the existing tutorial / guided-lab system
2. back them with prepared projects or prepared machine variants
3. point each step directly at the existing live analysis surface
4. keep the instructional copy short and tool-specific

The `Key Schedule Lab` depends on the finalized manual-selection key-schedule analysis surface:

- explicit master-key source selection
- explicit terminal output selection
- explicit stage ordering

V1 should assume that surface is already stabilized before Lab 2 ships.

This should improve interpretation without inventing a new product area.

## Success Criteria

This slice is successful when:

1. a user can enter the Avalanche, Key Schedule, and Randomness tools through a concrete lab rather than only through abstract panels
2. each lab makes the intended analytical question obvious before the user runs the tool
3. each lab shows at least one meaningful weak-versus-stronger comparison
4. the labs feel like guided machine investigation, not detached reading material
