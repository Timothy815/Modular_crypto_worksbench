# North Star Remaining Gaps — June 2026

Last updated: June 8, 2026
Status: Active planning reference

Related:
- [EXPERIENTIAL-NORTH-STAR-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/EXPERIENTIAL-NORTH-STAR-V1.md)
- [LIVE-MACHINE-FEEL-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/LIVE-MACHINE-FEEL-V1.md)
- [LIVE-MACHINE-FEEL-V1-COMPLETION-REPORT.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/LIVE-MACHINE-FEEL-V1-COMPLETION-REPORT.md)

---

## Current North Star Realization: ~85%

After LIVE-MACHINE-FEEL-V1, MCW is a genuinely strong tool. The explicit-and-correct
half has been strong for months. The "feels alive" half is now meaningfully realized:
signal chips, active path glow, error badges, port snap-preview, splice-on-wire, tick
pulse, domain legend, one-gesture framing. The foundational decisions are right.

What follows is an honest account of what remains — not a wish list, but specific
friction that still exists in the shipped tool as of June 8, 2026.

---

## Remaining Gaps by North Star Dimension

### Live Readability — ~90% ✓ (close enough)

**What's strong:** Signal chips on output ports, active/idle path glow, always-on
execution, error badges with category tooltip, jump-to-first-error navigation.

**What's left:**
- Error badges identify category but not location within the module. A user who sees
  "Type mismatch" still has to open Analyze to learn *which* input port has the
  mismatch and what type was expected vs. received. The badge is a first-pass signal,
  not a diagnosis. For simple graphs this is fine; on a dense board with multiple
  mismatched inputs it remains a hunt.
- No visual indication of which module is currently selected in the Analyze step-through.
  The trace follows execution order but the canvas doesn't emphasize which module
  Analyze is currently focused on unless the user opened it.

**Recommended next action:** Small — add port-level mismatch highlight to the error
badge tooltip (which specific port, what was expected, what arrived). This is derivable
from existing validation state without engine changes.

---

### Authoring Fluency — ~80% ✓ (good, some friction remains)

**What's strong:** Chip drag, port snap-preview with anti-hijack, splice-on-wire for
eligible one-in/one-out modules, multi-select, cross-workspace clipboard, UI-driven
composite authoring, mid-drag palette drop.

**What's left:**

**1. Port hit targets are still small on dense boards.**
Even with chip drag for output ports, *input* ports have no equivalent large hit target.
On a rotated node or a dense column of modules, connecting *to* an input still requires
precise pointer placement on the port dot. Chip drag only helps the source side.

**2. Splice-on-wire doesn't handle optional secondary ports.**
A module with one bits data input, one bits data output, and one optional bits key input
is ineligible for splice because the splice logic counts all data ports. The conservative
rule is correct (it was in the contract and both reviewers agreed), but in practice the
most common case for splice is exactly this: XOR, SBox, BitShifter — all have a second
input that's optional or can be added after splice. A V2 rule of "splice eligible if
exactly one *required* data input matches, regardless of optional port count" would
cover the majority of real use cases.

**3. Building a brand-new board from scratch still has a layout-ceremony phase.**
After wiring several modules, the user still needs to Tidy Layout or manually arrange
before the board reads as organized. The one-gesture frame+label helps *after* you've
organized, but the act of placing and connecting modules doesn't produce a naturally
readable layout. This is the deepest remaining gap and the hardest to close without
automatic layout (which violates north star constraints).

**Recommended priority:** Input port hit-target enlargement is low effort and closes
a real friction point. Splice V2 eligibility rule is medium effort, high classroom
value. Layout ceremony is a long-term problem without a clean bounded solution yet.

---

### Pipeline Legibility — ~85% ✓ (good)

**What's strong:** Wire domain legend, stage group boxes, on-canvas labels,
minimap, F-key one-gesture frame+label with auto-label hint, Tidy Layout, orthogonal
routing, wire coloring.

**What's left:**

**1. Auto-label hint only fires for categorically homogeneous selections.**
A selection of 16 SBox modules hints "S-Box". A selection of 4 SBox + 4 GF2Mul +
4 XOR (a MixColumns column) hints nothing because the categories are mixed — even
though a human recognizes the pattern immediately. This is architecturally correct
(the hint derives from category metadata, not graph topology), but it means the
boards where labeling matters most (complex multi-module operations) get no hint.

**2. The minimap has no error-state overlay.**
The minimap shows the canvas layout but does not reflect error badge locations.
On a 100+ module board, the minimap could usefully highlight which regions contain
broken modules — giving spatial orientation without panning.

**3. Group box hierarchy doesn't exist.**
You can create group boxes, but you can't nest them to express phase → stage →
operation hierarchy. The AES round board is a natural candidate: a "Round 1" box
containing a "SubBytes" box, a "ShiftRows" box, a "MixColumns" box, and an
"AddRoundKey" box. Currently all group boxes are flat. This is a meaningful
legibility gap for the most complex boards.

**Recommended priority:** Minimap error overlay is low effort, high value on dense
boards. Group box nesting is a meaningful architecture question — worth a contract
before implementation. Auto-label hint improvement requires topology analysis, which
the current architecture doesn't support; defer.

---

### Mechanism Feel — ~80% (meaningful gap remains)

**What's strong:** Tick pulse (wire mode + halo mode), always-on execution, parameter
changes produce immediate output, active path glow.

**What's left:**

**1. Tick pulse degrades to halo mode on the boards where it matters most.**
The AES round board, the ECC scalar multiply board, and the hash compression board all
have far more than 24 active wires per tick. On every one of MCW's flagship boards,
the tick pulse runs in halo mode, not wire mode. The halo is honest and bounded but
it gives much weaker temporal signal than the traveling wire pulse. This is the
correct conservative behavior per the contract, but it means the "feels like a live
machine" moment is most muted on the boards that are most impressive.

A potential improvement: make halo mode more informative by using domain-colored halos
(bits = blue halo, symbol = amber halo, etc.) rather than a generic glow. The user
could at least see *which domain* of signal is flowing through each module even in
halo mode.

**2. Wire drag still requires intent to begin.**
The snap-preview gives excellent feedback *once a drag is in progress*, but the act
of initiating a wire drag still requires deliberate pointer-down on a port dot or
chip. In Audulus, you feel like you can "grab" a cable anywhere near a port. MCW
requires you to find the source first, then drag. This is a fundamental authoring
loop difference that bounded improvements can narrow but probably can't fully close
without rethinking the connection initiation model.

**3. No visual feedback during module parameter edit.**
When you type a new hex value into a HexSource, the output chip updates when you
commit (always-on execution fires on render). But while you're typing — mid-edit —
the graph is static. There's no preview of what the output will be as you type.
This is a small but real "dead zone" in the feedback loop.

**Recommended priority:** Domain-colored halos in halo mode is low effort and closes
the most visible tick-pulse weakness. Mid-edit parameter preview requires understanding
the param draft → execution pipeline and is medium effort.

---

### Honest Ergonomics — ~90% ✓ (strong)

**What's strong:** Bridge suggestions on mismatch, domain coloring, structured editors
(SBox table, Permutation visual), control port exclusion in splice, explicit error
categories, wire metadata preservation in splice, anti-hijack snap.

**What's left:**

**1. Undo history is present but not visible.**
The user can undo actions but there's no indication of what the current undo stack
contains or how far back it goes. After a complex build session, "how many undos do
I have?" is a real question. This is ergonomic opacity, not a new feature.

**2. The verification workflow is powerful but not well-discovered.**
The verification station (known-vector import, PASS/FAIL with explanation, Python
export parity) is one of MCW's strongest features and is nearly invisible to new
users. The Quick Start and Atlas help, but a user who doesn't know to look for
verification won't find it. This is a discoverability problem, not a feature gap.

**3. The AI Toolkit export is not self-updating.**
`mcw-ai-toolkit.md` is a static file generated at build time. When new modules ship,
the toolkit needs a manual update. This is a maintenance discipline gap, not urgent,
but it will accumulate drift over time.

---

## Ranked Remaining Work

Ordered by impact-per-effort, grounded in the above assessment:

| # | Item | Effort | Impact | Dimension |
|---|---|---|---|---|
| 1 | Port-level mismatch detail in error badge tooltip | Low | High | Live Readability |
| 2 | Domain-colored halos in halo mode for tick pulse | Low | Medium | Mechanism Feel |
| 3 | Minimap error-state overlay | Low | Medium | Pipeline Legibility |
| 4 | Input port hit-target enlargement | Low | Medium | Authoring Fluency |
| 5 | Mid-edit parameter preview (draft execution) | Medium | Medium | Mechanism Feel |
| 6 | Splice V2: eligibility by required ports, not total ports | Medium | High | Authoring Fluency |
| 7 | Group box nesting (hierarchy) | Medium | High | Pipeline Legibility |
| 8 | Undo history visibility | Low | Low | Honest Ergonomics |
| 9 | Verification discoverability pass | Low | Medium | Honest Ergonomics |
| 10 | Layout ceremony reduction (new board authoring feel) | High | High | Authoring Fluency |

---

## What Should NOT Be the Next Focus

- **More curriculum content** — the teaching line is comprehensive. Adding demos and
  tutorials is not where the remaining leverage is.
- **Python export additions** — parity is complete. The 4 intentionally excluded modules
  are excluded for good reasons.
- **Another large UI refactor** — parameter-inspector.tsx and workbench-panel.tsx are
  large but functional. Refactoring without a clear behavior problem is premature.
- **AES decryption primitives** — InvSubBytes/InvShiftRows/InvMixColumns are genuinely
  absent, but the teaching story for AES encryption is now complete. Decryption is a
  follow-on with significant scope; it should be a fresh contract when the time is right.

---

## What the Next Contract Should Target

The highest-leverage bounded slice that satisfies both north star tests
("more explicit and correct" AND "more like a live machine") is the cluster of
items 1, 2, 3, and 4 from the ranked list above. All four are:
- Low effort individually
- Derivable from existing state without engine changes
- Directly addressing the remaining experiential gap

A contract named something like **CANVAS-FEEDBACK-REFINEMENT-V1** that bundles
port-level mismatch detail, domain-colored halos, minimap error overlay, and
input port hit-target enlargement would be coherent, bounded, and high value.

Items 6 and 7 (splice V2, group box nesting) are meaningful but require their own
contracts because each has genuine design decisions to make before implementation.

Item 10 (layout ceremony) is the deepest unsolved problem in the product and should
not be attempted without a careful contract that defines the boundaries clearly —
automatic layout is out of scope per the north star; what isn't ruled out is
smarter *default placement* when adding new modules.

---

## Summary

MCW is at ~85% of the north star. The product is ready for classroom use. The
remaining 15% is refinement, not architecture. The foundational decisions — typed
signals, explicit domain transitions, glass-box honesty, UI-driven composites,
ticked execution, live signal chips — are all right. Future work builds on a
solid base.

The most important discipline going forward is **verify in source before planning**.
Documentation drifts. The code does not.
