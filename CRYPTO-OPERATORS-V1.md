# Cryptographic Operators V1

Last updated: March 24, 2026

Status: Shipped in `v1.14.0`.

## Purpose

This contract defines the first bounded operator-expansion milestone after `v1.13.0`.

The goal is not to add abstract math for its own sake.
The goal is to strengthen the machine language so MCW can express more cryptographic structure honestly.

This slice should establish that:
- `XOR` is not the only meaningful operator in the workbench
- operators are part of the grammar of cryptographic construction
- modern, mechanized, and eventually public-key systems need explicit arithmetic and boolean vocabulary

This should remain a bounded language-building slice, not a giant algebra lab.

## Architectural Decision

For this first operator milestone, arithmetic operators should stay on the existing `bits` signal domain.

That means:
- `ADD mod N`
- `SUB mod N`
- `Modulo`

should interpret `bits` signals as fixed-width unsigned words rather than introducing a new `number` signal type.

This decision is intentional.

It preserves:
- compatibility with the current engine and analysis surfaces
- the existing explicit bit-level teaching model
- momentum toward richer symmetric, mechanized, and stream-oriented constructions

It also avoids prematurely expanding the type system before MCW clearly needs number-theoretic primitives.

This slice should therefore treat arithmetic as:
- fixed-width
- explicit
- bounded
- word-oriented, not arbitrary-precision

The first operator milestone should not add a new signal domain.

### Consequences Of This Decision

The contract for arithmetic operators should be:
- inputs are `bits`
- both inputs must have equal width where binary arithmetic is used
- outputs are `bits`
- the module description must state that the input vectors are interpreted as fixed-width unsigned integers
- arithmetic interpretation should use big-endian unsigned bit order (`index 0 = MSB`)
- binary arithmetic modules should reject mismatched input widths at graph-validation time when possible, and always reject them at execution time

Preferred first behavior:
- `ADD mod N` and `SUB mod N` use modulus `2^width`
- `Modulo` accepts a bounded explicit modulus param but still operates on a fixed-width `bits` word

This keeps numeric interpretation visible without introducing hidden coercion.

### Explicit Deferral

A true `number` signal type should be deferred until MCW begins serious work on:
- number-theoretic operator families
- modular multiplication / exponentiation
- public-key foundations

That is the point where the extra signal-domain complexity becomes justified.

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- new operators should appear as ordinary first-class primitives
- they should compose with existing bit-domain and bridge modules
- they should work naturally inside composites, iterators, and authored machines
- arithmetic operators should remain explicitly word-oriented over `bits`, not silently numeric over a new hidden domain

2. **Analyze**
- new operators should remain inspectable like existing explicit transformations
- they should not introduce black-box executor behavior

3. **Guide / Challenge**
- at least one tutorial and one bounded exercise should make the new operator family teachable

This slice should not become:
- a theorem prover
- a symbolic algebra environment
- a property-scoring suite
- a giant number-theory drop all at once

## First Milestone

The first milestone should answer one question clearly:

**Can a student use a small, coherent operator family to build machines that go beyond XOR-only logic?**

The student should be able to:
- place and connect new operators naturally
- understand each operator’s local behavior
- observe the consequences in existing analysis surfaces
- reuse those operators inside composites and demos

## Include

The first milestone should likely include a bounded set such as:
- `AND`
- `OR`
- `NOT`
- `ADD mod N`
- `SUB mod N`
- `Modulo`

Strong preference:
- one coherent family of boolean and modular operators
- explicit width / parameter handling
- ordinary validation and analysis compatibility
- no hidden introduction of a new signal type

Prefer operators that unlock immediately useful constructions:
- modern toy round functions
- counters and control logic groundwork
- simple PRNG / keystream experiments later

## Exclude

This milestone should explicitly avoid:
- a new `number` signal type
- carry / overflow helper ports in this first slice
- decimal or numeric helper outputs in the engine layer
- modular multiplication in the same slice
- exponentiation
- finite-field arithmetic families
- public-key arithmetic
- automatic inverse generation for every operation
- giant property dashboards

## Visual / Teaching Principles

Prefer:
- operators that read as obvious machine parts
- explicit parameterization when width or modulus matters
- compatibility with transformation/analysis surfaces where honest
- one tutorial that shows why these operators matter beyond `XOR`

Avoid:
- overloading one operator to do too many things
- hidden coercions between symbol and bits domains
- introducing “math power” without a clear teaching use

## Suggested Teaching Additions

The first milestone should likely ship with:
- one tutorial introducing boolean vs modular operators in cryptographic machines
- one demo workspace that uses the new operators in a round, mixer, or toy PRNG context
- one bounded challenge or mutation exercise showing how changing an operator changes behavior

## Success Criteria

This slice is successful when a student can:
- build a machine that depends on more than `XOR`
- understand the role of each operator in local signal flow
- inspect the machine without hidden math
- see the operator family as part of the cryptographic language, not an arbitrary grab bag
