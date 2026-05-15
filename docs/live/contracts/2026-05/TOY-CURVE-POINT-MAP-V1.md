# Toy-Curve Point Map V1

Last updated: May 14, 2026
Status: Shipped

---

## Purpose

Add the first bounded curve-map visualization for MCW so students can see one small finite-field elliptic curve as a visible set of points, not only as coordinate pairs flowing through point primitives.

This slice follows:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Elliptic-Curve Point Mechanics V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ELLIPTIC-CURVE-POINT-MECHANICS-V1.md)
- [Scalar Multiplication V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/SCALAR-MULTIPLICATION-V1.md)
- [Visible Double-And-Add V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-DOUBLE-AND-ADD-V1.md)

It is not a real-analysis curve plot.
It is not a generic charting layer.
It is not a new ECC protocol slice.

It is a bounded visibility slice: make one small pedagogical finite-field curve feel like a visible landscape students can inspect, highlight, and perturb.

---

## Why This Slice Exists

MCW's ECC line is now structurally honest:

- visible point construction
- visible point addition and doubling
- visible scalar multiplication
- visible ECDH
- visible point order and subgroup teaching
- visible Schnorr-style signing
- visible double-and-add

But the current visibility is still mostly algebraic and signal-flow based.

Students can see:

- coordinates
- curve parameters
- repeated point action
- equality checks

They cannot yet see:

- the full finite-field point set for one toy curve
- where a chosen point sits relative to the other valid points
- how repeated point action walks through that visible point set

That leaves a real product gap. ECC is inspectable, but it is still less intuitively graspable than MCW's best permutation, S-box, and AES surfaces.

The missing payoff is:

- one visible point map
- one highlighted selected point
- one visible walk such as `P`, `2P`, `3P`, `4P`
- one explicit reminder that this is a finite-field point set, not a smooth Euclidean curve drawing

Without that, ECC remains legible but not yet intuitive enough.

---

## Scope

### In scope

- one new `ToyPointMap` module whose params declare the toy curve, selected point, and bounded walk length
- one bounded curve-map visualization surface for one toy short-Weierstrass curve over a small prime field
- one flagship demo that pairs the point map with already-shipped point mechanics or scalar-multiplication content
- one tutorial explaining how to read the map honestly
- one repair or perturbation challenge built from that map
- bounded inspector/manual/library copy updates if needed
- highlighting a small set of selected points on the map such as:
  - `P`
  - `2P`
  - `3P`
  - `4P`
  - or another explicitly documented bounded repeated-action sequence
- bounded control over the selected toy-curve point and bounded scalar/repetition count

### Out of scope

- real-number curve drawing
- named real-world curve plotting
- arbitrary large-prime curve visualization
- a generic graphing subsystem
- animated protocol playback across all ECC boards
- replacing shipped point outputs or inspectors
- ECDH changes
- Schnorr changes
- ECDSA

---

## Required Product Behavior

### 1. The product must show the finite-field point set honestly

The visualization must present one small pedagogical curve as a finite set of valid affine points over `mod p`.

It must not imply:

- a continuous real curve
- Euclidean line geometry for finite-field addition
- that this picture scales directly to secp256k1 or P-256

The product should say plainly that this is a finite-field point map for one small visible curve.

### 2. The surface must connect visible points to shipped ECC mechanics

The map should not be a detached poster.

A student should be able to connect the highlighted points on the map to already-shipped ECC work such as:

- one visible point `P`
- one doubled point `2P`
- one repeated-action path such as `3P`, `4P`, or `5P`
- one equality or order-related consequence already expressible in the workbench

### 3. The map must privilege reading and orientation over decorative plotting

The first question the map should answer is:

- which points are valid on this curve
- which one is selected
- where the visible repeated-action path moves next

It should not become:

- a generic visual theme piece
- a dense theorem panel
- a pseudo-geometric tangent-line story that is false in this setting

### 4. The slice must keep perturbation and control

At minimum, a student should be able to:

- change the selected visible point within the bounded toy-curve regime
- change the bounded scalar or walk length
- see the highlighted walk or selected points update
- use the challenge to observe what happens when the highlighted path or chosen point is wrong

### 5. The product must say what this does not prove

The map must say clearly:

- it is one toy finite-field curve
- it is for intuition and structure
- it does not certify real-world ECC safety
- it does not show the geometric line-intersection story used in some real-number intuition treatments

### 6. The slice must stay bounded to a small readable curve

V1 should use one already-shipped toy-curve regime where:

- the full point set is small enough to render legibly
- the repeated-action walk is short enough to follow
- the existing point demos and tutorials already have continuity value

Do not make curve choice or point-set size a free-for-all in V1.

---

## Recommended Surface Shape

### Flagship demo

Ship one main demo:

- `Toy Curve Point Map`

Architectural home for V1:

- the point-map surface lives in the inspector as a custom analyze/details view for one new `ToyPointMap` module
- the demo workspace includes that module in the signal-flow board alongside already-shipped ECC primitives
- the map is not a new free-floating workspace furniture object and not a standalone panel system

`ToyPointMap` should follow the established MCW pattern of:

- normal module presence in the workspace
- normal output ports where they help machine-check the surrounding board
- richer interpretation in the inspector analyze/details surface

Recommended shape:

- one visible curve descriptor
- one visible selected point source or selected-point param set
- one bounded scalar or step-count control
- one `ToyPointMap` module selected in the workspace so its inspector analyze view shows the full valid affine point set for that curve
- one clear highlight for the selected point
- one bounded repeated-action highlight path showing the next few multiples of that point
- one adjacent signal-flow branch using shipped ECC modules to compute the same points or agreement checks
- one machine-checked agreement path using `PointEquals`, not only a visual side-by-side comparison

The board should read as:

- visible point set
- visible selected point
- visible walk through the set
- visible agreement with shipped point mechanics

not as an isolated graphic.

The point-map module derives its highlighted walk from its own declared params, matching the adjacent signal-flow branch by construction. The agreement is structural, not a reactive spatial binding to whichever nearby modules happen to be rendered beside it.

V1 should acknowledge one inspector-model constraint explicitly:

- the full point-map visualization is visible when `ToyPointMap` is selected in the inspector
- the adjacent agreement branch remains visible in the workspace at the same time
- students may need to inspect the map and the neighboring equality modules in turn rather than seeing every detail in one fused surface

This is acceptable for V1. Do not invent a new pinned-inspector or floating-analysis system just for this slice.

### Module port interface

`ToyPointMap` should have bounded output ports so the neighboring branch can machine-check agreement rather than relying on human visual comparison alone.

Recommended V1 outputs:

- `selectedPoint: ec-point`
- `walk3: ec-point`

Purpose:

- `selectedPoint` lets the board wire the selected visible point into the surrounding ECC branch
- `walk3` gives the board one concrete repeated-action checkpoint that can be compared against shipped `ScalarMultiply` with scalar `3`

This is intentionally bounded. V1 does not need one output port for every visible multiple in the highlighted walk.

### Visualization semantics

V1 should render points as discrete finite-field locations on an integer grid.

It should not draw:

- a smooth continuous curve line
- tangent or secant lines as if the finite-field board were Euclidean

If any background scaffold is shown, it should reinforce:

- discrete field coordinates
- modular coordinate labels

not analog geometry.

The point at infinity is part of the group story but has no affine grid location. V1 should represent it explicitly in the inspector view as a labeled non-affine result in the highlighted walk when the bounded repeated-action path reaches it, rather than trying to place it on the coordinate map.

### Highlighting

The surface should make it easy to distinguish:

- all valid curve points
- the currently selected point
- the bounded repeated-action path

Recommended visual distinction:

- one neutral style for all valid points
- one stronger style for the selected point
- one ordered path style for `P`, `2P`, `3P`, ... up to the bounded visible step count

The selected point should be controlled by the `ToyPointMap` module params in V1, not by freeform clicking on arbitrary dots. This keeps the interaction model consistent with existing module-driven MCW authoring and keeps the visualization anchored to explicit machine state.

Recommended V1 param representation:

- explicit integer params `selectedX` and `selectedY`
- explicit integer param `walkLength`

Why:

- it keeps the chosen point transparent to the student
- it matches existing MCW param editing patterns
- it makes the repair challenge an explicit param correction rather than a hidden UI gesture

The module should fail visibly if `selectedX` and `selectedY` do not identify a real point on the declared toy curve.

### Expected implementation path

Preferred order:

1. derive the finite set of valid affine points for one bounded toy curve
2. render them on a discrete coordinate map
3. overlay selected-point and repeated-action highlights
4. pair the map with shipped point primitives rather than inventing new ECC math

If a helper is needed, it should be narrow and visualization-oriented, not a new ECC capability primitive.

Do not add:

- a generic plotting framework
- a black-box "curve viewer" detached from point mechanics
- an always-on geometry animation system

---

## Teaching Requirements

### Tutorial

Ship one tutorial:

- `How To Read A Toy ECC Point Map`

It should walk through:

1. why this surface shows a finite-field point set rather than a continuous curve
2. how to identify which visible coordinate pairs are valid points on the chosen curve
3. how one selected point `P` becomes a bounded repeated-action path such as `P`, `2P`, `3P`, `4P`
4. how that path connects back primarily to the already-shipped `Visible Scalar Multiplication` board, with only brief secondary references to `PointAdd`, `PointDouble`, or `PointOrder` if needed
5. one short paragraph stating what this map does not prove about real-world ECC

The tutorial should reuse one concrete curve and one concrete selected point.

### Challenge

Ship one repair or perturbation challenge:

- `Repair The Point Walk`

Primary V1 break:

- the `ToyPointMap` params declare the selected point as `(5, 11)` instead of `(5, 6)`, so the highlighted `3P` checkpoint lands on a valid curve point but not on the intended third multiple for the default board

The challenge should teach:

- the path is determined by exact repeated point action
- one wrong choice changes the visible walk
- the map is not decorative; it is tied to real point mechanics

Do not frame the challenge as:

- "fix ECC security"
- "repair cryptography"

Frame it as:

- restoring the intended visible point walk
- restoring the selected point params so the bounded repeated-action path becomes correct again

### Micro demo

Ship at least one small supporting demo that reinforces one local identity such as:

- `2P` on the map matches `PointDouble`
- `3P` on the map matches `P + 2P`
- the highlighted walk agrees with shipped `ScalarMultiply` for one bounded scalar

---

## Data / Content Guidance

V1 should prefer the same small pedagogical curve already used in the shipped toy-curve ECC line unless a stronger readability reason is documented.

Default V1 curve:

- `p = 17`
- `a = 2`
- `b = 3`

This curve has `21` valid affine points, which is small enough to render legibly on a `17 x 17` coordinate grid while still giving the repeated-action path room to move.

The default selected point should also come from that same line so students can move between:

- point mechanics
- scalar multiplication
- visible double-and-add
- the point map

Recommended principle:

- choose a point whose first few multiples stay readable and nontrivial
- choose a bounded step count that shows both movement and eventual structural repetition if possible

Recommended default selected point and walk:

- selected point `P = (5, 6)`
- bounded visible walk through `P`, `2P`, `3P`, `4P`, and `5P`

Do not choose:

- a trivial one-step walk
- a point set so dense that the map becomes a dot cloud with no instructional value

---

## Implementation Notes

### 1. Start from shipped ECC truth

This slice should explain already-shipped point mechanics, not replace them.

The highlighted walk should come from shipped ECC arithmetic, not from a separate visualization-only rule set.

### 2. Keep the map discrete

This is a finite-field teaching surface.

The rendering model should stay aligned with:

- integer coordinate positions
- explicit modular field bounds

Do not smuggle in continuous-curve intuition as if it were the same object.

### 3. Bounded derivation belongs in pure logic, not inline UI code

Because V1 is intentionally limited to one small toy curve, deriving the full valid affine point set is acceptable as long as the derivation lives in a pure testable function under `src/engine/` or a shared pure utility layer rather than directly inside the React component.

Do not turn that into an unbounded arbitrary-curve plotter in V1.

### 4. Pair the map with a machine branch

The best version of this slice is not map-only.

Pair the point map with one small adjacent branch of shipped ECC primitives so students can see:

- coordinate-level point mechanics
- and map-level point location

in one board.

### 5. This is the ECC analogue of explicit structure surfaces elsewhere in MCW

The design principle is the same one MCW already uses well in AES and S-box work:

- make structure visible
- let students perturb it
- let them observe what changes

Do not use that analogy as permission to absorb a broad AES perturbation pass into this contract.

---

## Testing Requirements

At minimum:

1. the flagship `Toy Curve Point Map` workspace executes without validation/runtime errors
2. the rendered or derived visible point set for the named default curve `y^2 = x^3 + 2x + 3 (mod 17)` matches the actual `21` valid affine points on that curve
3. the highlighted default repeated-action path agrees with shipped ECC arithmetic for the named default point and bounded step count
4. the repair challenge is actually broken before repair and fixed after the intended edit
5. `npx vitest run` passes
6. `npm run build` passes

If a visualization helper is introduced, it should have direct bounded coverage for:

- point-set derivation correctness
- selected-point highlight correctness
- repeated-action path correctness

---

## Success Criteria

This slice is successful when:

1. a student can open one ECC board and see the full valid point set for one toy curve
2. the board clearly distinguishes all valid points, the selected point, and the bounded repeated-action path
3. the map is visibly tied back to shipped point mechanics rather than floating as a detached illustration
4. the tutorial teaches finite-field honesty instead of fake Euclidean geometry
5. the challenge proves that changing the selected point or visible walk changes the map in a traceable way
6. no new ECC protocol capability is added as part of this slice

---

## Likely Next Steps

After this slice, the next two honest follow-ons are likely:

1. an AES structure-perturbation slice
   - making row/column structure more visibly authorable and perturbable
2. a deeper ECC rigor or failure-mode slice
   - such as nonce misuse or subgroup/cofactor pitfalls

But neither should land before MCW has one honest toy-curve map that makes ECC feel less abstract than coordinate pairs alone.
