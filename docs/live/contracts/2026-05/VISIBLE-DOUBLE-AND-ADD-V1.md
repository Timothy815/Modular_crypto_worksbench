# Visible Double-And-Add V1

Last updated: May 14, 2026
Status: Shipped

---

## Purpose

Add the first fully visible scalar-multiplication construction board for MCW so a student can watch elliptic-curve scalar multiplication happen as a stepwise machine rather than only as a shipped primitive result.

This slice follows:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Scalar Multiplication V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/SCALAR-MULTIPLICATION-V1.md)
- [Visible ECDH V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-ECDH-V1.md)
- [Point Order And Subgroups V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/POINT-ORDER-AND-SUBGROUPS-V1.md)

It is not a new ECC protocol slice.
It is not an ECDSA slice.
It is not a geometry-only intuition slice.

It is the next visibility slice: take the already-shipped `ScalarMultiply` capability and make its repeated-action mechanism constructible and inspectable as a live machine.

---

## Why This Slice Exists

MCW's current ECC line is structurally honest:

- visible point construction
- visible point addition and doubling
- visible scalar multiplication
- visible ECDH
- visible point order
- visible Schnorr-style signing

But `ScalarMultiply` still lands closer to "inspectable primitive" than to "fully unpacked mechanism."

That is acceptable for the first capability pass.
It is not the end-state if MCW wants ECC to meet the same experiential bar as its best permutation, S-box, and AES teaching boards.

The missing product payoff is this:

- a student should be able to see a scalar broken into bits
- see the running addend get doubled
- see the accumulator either stay or absorb the current addend
- see the final accumulated point match the shipped `ScalarMultiply` output

Without that, ECC remains more legible than a black-box library but less visible than the rest of MCW at its best.

---

## Scope

### In scope

- one flagship `Visible Double-And-Add` demo workspace
- one tutorial walking a small scalar through each repeated-action step
- one repair challenge built from that workspace
- one primitive- or pipeline-level micro demo proving the visible construction agrees with shipped `ScalarMultiply`
- bounded inspector/manual/library copy updates if needed to connect this board to the existing ECC line
- reusing shipped point primitives (`PointAdd`, `PointDouble`, `PointEquals`, `ScalarMultiply`, visible point sources, integer/bit bridges)
- one bounded branch-selection surface for the accumulator choice on `ec-point` signals, unless a clean composite-only expression is demonstrated first

### Out of scope

- replacing `ScalarMultiply` with a new implementation
- changing the semantics of shipped `ScalarMultiply`
- ECDH changes
- Schnorr changes
- ECDSA
- new real-world curve claims
- a full scalar-multiplication trace engine for arbitrary-length scalars
- a generic ECC algorithm animator
- a broad AES variant-authoring slice

---

## Required Product Behavior

### 1. The board must make repeated point action mechanically visible

A student should be able to see:

- the current scalar bit
- the current running addend point
- the current accumulator point
- the doubled next addend
- the candidate "add this point" branch
- the final selected accumulator for that step

The board should not collapse those into a single opaque module consequence.

### 2. The construction must agree with shipped `ScalarMultiply`

The flagship board must end with a visible equality check against the shipped `ScalarMultiply` primitive on the same curve, same base point, and same scalar.

The product payoff is not just "here is another way to get a point."
It is "this explicit machine and the shipped primitive compute the same thing."

### 3. The scalar must stay student-editable and small enough to read

V1 should stay in a bounded, readable regime:

- a small pedagogical curve
- a visible base point
- a bounded scalar width such as 4 bits or 5 bits

The student must be able to change the visible scalar input and see the branch pattern change.

### 4. The board must privilege the machine over the formula

MCW should not turn this slice into a wall of algebra notation.

The experience should feel like:

- set the bits
- watch the repeated doubling/addition path
- compare the result

not like:

- read a theorem
- trust a diagram

### 5. The product must stay honest about what it is not showing

This board should say plainly:

- it is one visible small-scalar construction
- it shows the mechanism of repeated point action
- it does not prove production-safe ECC
- it does not claim that all practical implementations literally execute this exact visible shape

### 6. The slice must preserve authorability and perturbation

The workspace should not be a frozen museum piece.

At minimum, a student should be able to:

- change the visible scalar bits
- change the visible starting point/base point within the shipped toy-curve regime
- inspect what happens when a step is wired or selected incorrectly through the challenge

This is the same product value MCW already pursues in strong AES and S-box slices: the mechanism is not only displayed, it is modifiable and testable.

---

## Recommended Surface Shape

### Flagship demo

Ship one main demo:

- `Visible Double-And-Add`

Recommended shape:

- one visible point source `G`
- one visible bounded scalar input
- one visible bit decomposition path for that scalar
- one left-to-right sequence of step groups, one per scalar bit
- each step group showing:
  - incoming accumulator
  - incoming addend
  - the specific live scalar bit controlling that step
  - doubled addend
  - conditional add candidate
  - selected accumulator for the next step
- one shipped `ScalarMultiply` branch in parallel as the reference
- one `PointEquals` terminus comparing the explicit construction against `ScalarMultiply`

Each step group must receive its controlling bit from a dedicated live extraction of the decomposed scalar input, so changing the scalar input changes the visible branch pattern immediately.

The board should read as a live machine, not as a proof tree.

### Control / selection surface

Expected implementation order:

1. investigate whether a clean composite-only expression is possible without hiding the branch structure
2. otherwise use one narrow point-selection helper for choosing between two visible `ec-point` candidates

If a helper is added, it must stay narrow:

- two `ec-point` inputs
- one bit/select input
- one `ec-point` output

This would be wiring/control glue, not new ECC math capability.

Given the current shipped surface, this helper should be treated as the likely V1 path unless a clean composite-only point-selection board is actually demonstrated first.

Do not add:

- a black-box `DoubleAndAdd` primitive
- a generic protocol shell
- a hidden trace runtime

---

## Teaching Requirements

### Tutorial

Ship one tutorial:

- `How Scalar Multiplication Builds A Point`

It should walk through:

1. the visible scalar bits and visible base point
2. why the running addend is repeatedly doubled on the same curve
3. why a `1` bit absorbs the current addend and a `0` bit leaves the accumulator unchanged
4. why the final accumulated point matches shipped `ScalarMultiply`
5. one short paragraph connecting this visible construction to the already-shipped ECDH and Schnorr boards, pointing to those boards directly without re-teaching them here

The tutorial should reuse a concrete scalar and concrete visible step results.
It should not remain generic prose.

### Challenge

Ship one repair challenge:

- `Repair The Double-And-Add Path`

Primary V1 break:

- one bit-controlled selection step chooses the wrong candidate accumulator

Follow-on variants may later include:

- one doubling stage using the wrong incoming point
- one branch compare/equality leg wired to the wrong step output

The challenge should teach:

- a single local branch error changes the final point
- the student can trace that error through the repeated-action machine
- `ScalarMultiply` is not magic; it is sensitive to the exact control flow

Do not frame the challenge as:

- "fix ECC security"
- "repair cryptography"

Frame it as:

- repairing repeated point action
- restoring the intended branch/doubling sequence

### Micro demo

Ship at least one small supporting demo that proves one local identity such as:

- `2P by PointDouble equals 2P by visible double-and-add`
- `3P equals P + 2P`
- the explicit construction and `ScalarMultiply` agree for one bounded scalar

The micro demo should reinforce the mechanism, not restate the whole flagship board.

---

## Data / Content Guidance

V1 should prefer a single small pedagogical curve where:

- the point arithmetic stays readable
- infinity can still appear honestly when appropriate
- the repeated-action path can be followed on screen without giant coordinates

The flagship board should choose one concrete scalar by default and make its bit pattern legible.

Use the same small pedagogical curve already used by the shipped toy-curve ECC line unless a stronger readability reason is documented.

Recommended principle:

- default to a scalar with both `0` and `1` bits so the student sees both "skip add" and "do add" behavior in one run

Recommended default acceptance vector:

- scalar `5` (binary `101`) or another explicitly documented bounded scalar with both `0` and `1` bits
- the same default toy-curve base point used in the shipped scalar-multiplication teaching line

Do not choose a default scalar that makes every branch identical or trivial.

---

## Implementation Notes

### 1. This slice should start from shipped surfaces, not replace them

`ScalarMultiply` already exists and remains the canonical primitive.

The new board should be built to explain it, not to supersede it.

### 2. Reuse existing integer/bit bridge surfaces where possible

The current codebase already ships integer/bit bridge surfaces such as `IntegerToBits`, `BitsToInteger`, `BitWindow`, and related routing helpers.

Use those to keep the scalar decomposition visible before inventing new scalar plumbing.

### 3. A narrow point-selection helper is the expected V1 path unless a clean composite-only solution is demonstrated first

If existing generic conditionals/composites can safely express the branch choice on `ec-point` signals while keeping both candidate branches visible, prefer them.

If they cannot, one narrow point-selection helper should be added as glue for V1.

Do not let that helper turn into a generic hidden ECC controller.

### 4. Keep the board bounded

The point of this slice is legibility.

Do not build an arbitrary-length scalar-multiplication authoring environment in V1.
One bounded scalar width and one strong visible board is the right first move.

### 5. This is the ECC analogue of strong AES visibility, not an AES rewrite

The design principle here is the same one MCW already uses well in AES:

- explicit intermediate state
- student-editable structure
- ability to see what breaks when one stage is wrong

Do not use that analogy as permission to absorb AES authoring or perturbation work into this contract.

---

## Testing Requirements

At minimum:

1. the flagship `Visible Double-And-Add` workspace executes without validation/runtime errors
2. the explicit construction's final point equals the shipped `ScalarMultiply` output for the contract's named default acceptance vector
3. the repair challenge is actually broken before repair and fixed after the intended edit
4. any new narrow point-selection helper, if introduced, has direct unit coverage for both branch values and type mismatch handling
5. `npx vitest run` passes
6. `npm run build` passes

The agreement check must be legible through the existing `PointEquals` result path and a visible sink for that result.

---

## Success Criteria

This slice is successful when:

1. a student can open one ECC board and see scalar multiplication unfold as explicit repeated doubling and conditional addition
2. the board ends in a visible agreement check with shipped `ScalarMultiply`
3. the scalar bits are editable enough that the branch pattern can be changed on purpose
4. the tutorial explains why this matters for the already-shipped ECC protocol boards
5. the challenge proves that changing one branch or doubling step changes the final point in a traceable way
6. no new ECC protocol capability is added as part of this slice

---

## Likely Next Steps

After this slice, the next two honest follow-ons are likely:

1. an AES structure-perturbation slice
   - making row-rotation / column-diffusion structure more authorable and more obviously controllable in the same spirit
2. a deeper ECC rigor or failure-mode slice
   - such as nonce misuse or subgroup/cofactor pitfalls

But neither should land before scalar multiplication itself feels more like a live machine than a trusted primitive.

Do not use `ScalarLinearCombine` as a shortcut inside the visible construction path for this board.
The point of this slice is explicit repeated doubling and conditional addition, not another helper that compresses the mechanism back into one step.
