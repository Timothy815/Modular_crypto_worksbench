# MCW State Of The Union

Last updated: April 29, 2026
Status: Active review note

## Executive Read

MCW is no longer just a visual cipher construction toy.

On `main`, it is already a substantial educational cryptography IDE with four real strengths:
- explicit machine construction
- reusable structure authoring
- live inspection and cryptanalysis
- guided classroom content

The product’s main risk has shifted.

It is not “there is too little here.”
It is:
- the shipped capability set is hard to summarize accurately
- some documentation still reflects an older, smaller product
- several surfaces are now strong enough that they need sharper framing and curation, not just more raw feature count

## What The Product Is Good At Right Now

### 1. It makes cryptographic structure visible

This remains the clearest product strength.

MCW already supports:
- explicit modules and typed signals
- visible bridge points
- reusable round / iterator / conditional structure
- visible signal sinks
- live intermediate inspection

The workbench is not merely decorative. It now gives students multiple ways to see what a machine is doing while it is still on the bench.

### 2. It has real analysis depth

This is stronger than the repo memory currently suggests.

The product now includes:
- modern, classical, randomness, key-schedule, and output-statistics cryptanalysis surfaces
- round-contribution analysis
- saved analysis cases
- property panels for several important primitive families
- stronger-than-expected S-box analysis

This matters because MCW is now teaching not only “how to build a machine” but also “how to interrogate one.”

### 3. It has become a real teaching environment, not just an engine demo

The combination of:
- tutorials
- challenges
- micro demos
- flagship labs
- Enigma content
- lab-pack infrastructure

means MCW is already usable in a classroom-shaped way.

It is not yet a polished curriculum platform, but it is clearly beyond “developer toy plus a few examples.”

### 4. Its reusable-definition story is now substantive

Composites, iterators, clocked iterators, conditionals, and multi-conditionals give the product a serious authoring vocabulary.

That is one of the clearest signs that MCW is becoming an actual systems IDE rather than just a flat primitive board.

## Where The Product Is Still Weak

### 1. The documentation and status surface are not trustworthy enough

This is the immediate operational problem.

A fresh session can still be misled into thinking:
- `Output Statistics` is unbuilt
- `Stage Inspection` is still pending
- S-box analysis is shallower than it really is
- pack infrastructure is hypothetical

That wastes planning cycles and makes prioritization noisier than it needs to be.

### 2. Some advanced surfaces are ahead of their explanatory framing

This is especially true for:
- output statistics
- some S-box property language
- stronger cryptanalysis surfaces generally

The product increasingly has the power to show interesting numbers.
The next challenge is making sure those numbers teach the right lesson instead of creating false confidence.

### 3. Curated product layers lag behind the engine and UI capability

The mechanism exists for things like lab packs, but the more polished “productized” layer often does not.

Examples:
- generic lab-pack import/export exists
- curated cipher-pack experience is not yet clearly formalized

This is a recurring pattern: the infrastructure often lands before the surface is fully framed.

### 4. The product identity is strong, but the boundaries still need active maintenance

MCW can now plausibly drift in several directions:
- classroom teaching platform
- cryptanalysis playground
- crypto systems IDE
- export/verification workbench

That is not bad, but it means every next slice has to be chosen more carefully.
The main risk now is incoherence through accumulation.

## What MCW Most Needs Next

### Immediate priority: documentation truthfulness

Before another large feature phase, MCW needs:
- a code-first capabilities baseline
- a reset implementation-status surface
- clearer separation between `shipped`, `partial`, and `idea`

Without that, roadmap conversations keep restarting from the wrong mental model.

### Near-term product priority: curation over raw expansion

The strongest next moves are probably not more generic surface area.
They are:
- sharper framing of what the existing analysis tools mean
- curated entry points into the strongest learning paths
- better baseline docs for teachers, students, and future agents

### Substantive feature priority: choose features that deepen reasoning, not just inventory

The best next features are the ones that improve:
- inspection honesty
- testability
- comparative reasoning
- classroom legibility

Examples of good fits:
- honest S-box follow-ons if real gaps remain
- pack/product curation
- output-statistics rigor pass
- tighter comparison / attribution teaching

## Bottom Line

MCW is already a serious product.

Not “serious” in the sense of production cryptography.
Serious in the sense that:
- it has a coherent machine model
- it supports real experimentation
- it supports reusable structure
- it supports guided learning
- it supports substantive analysis

The product is no longer fighting to prove that it can do interesting things.
It now needs to prove that it can describe itself truthfully, teach responsibly, and prioritize coherently.

That is a better problem to have.
