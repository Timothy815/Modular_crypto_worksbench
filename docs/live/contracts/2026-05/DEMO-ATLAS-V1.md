# Demo Atlas V1

Last updated: May 14, 2026
Status: Shipped

---

## Purpose

Add a new always-visible `Atlas` tab to the Learning dock, adjacent to `Quick Start`, that lists, groups, explains, and launches MCW demos from a discovery-first surface.

The current Demo menu should remain in place.
This slice does not replace it.

The new atlas surface exists for a different job:
- the Demo menu stays a fast operator surface
- the Demo Atlas becomes an explicit concept map and guided index

This slice is about discoverability, orientation, and product legibility.
It is not a demo-authoring slice.
It is not a taxonomy perfection pass.
It is not a new learning-mode system.

---

## Why This Slice Exists

MCW now has enough demos, tutorials, challenges, primitive micro demos, and pipeline micro demos that the current launch surfaces favor users who already know the product vocabulary.

That is good for speed once a user is oriented.
It is weak for first contact.

A new user currently has to infer:
- what the demo families are
- how they relate to one another
- which boards are foundational versus advanced
- where to start if they want “AES,” “ECC,” “rotors,” or “hashes”

The product needs one explicit surface that says:
- here is the shape of the demo library
- here is what each section teaches
- here is how to launch the right board from a place of context rather than guesswork

This should feel more like a product/concept map than a dropdown menu.

---

## Scope

### In scope

- One new always-visible `Atlas` tab added to the Learning dock, adjacent to `Quick Start`, lazy-loaded using the same pattern as the existing dock panels
- Search across the shipped demo surfaces that belong in the atlas
- Full demos and pipeline micro demos as the V1 content surface
- Clear grouping of demos by concept family or teaching family
- Short explanatory copy for each section explaining what that family is for
- Launch actions from atlas entries into the existing workspace-opening flow
- Enough metadata on each atlas entry to help a user choose intentionally
- A bounded “start here” or “recommended first boards” area for unfamiliar users
- Tests for search/grouping behavior and launch wiring

### Out of scope

- Replacing or removing the current Demo menu
- Rewriting the whole Quick Start surface
- Reclassifying every learning object in the product
- Creating a new prerequisite engine or progress-tracking system
- Adding new demos just to populate the atlas
- Primitive micro demos (excluded in V1 due to keying model mismatch and missing launch-path parity in the Learning dock)
- Building a second full tutorial browser
- Turning this into a giant prose manual
- Adding multi-filter faceted search in V1 if simple text search is sufficient

---

## Core Product Decision

V1 should treat the atlas as a **discovery surface**, not as a new curriculum engine.

That means:
- it may include soft guidance like `Start Here`, `Good first board`, or `Pairs well with`
- it should not require a locked sequence
- it should not duplicate every tutorial/challenge panel in-place
- it should point into existing opening flows rather than reimplement them

The user should be able to:
1. scan the shape of the demo library
2. understand what each family is about
3. search by concept or demo name
4. open the board they want

---

## Required Product Behavior

### 1. The existing Demo menu stays

The current fast-launch demo surface should remain available and keep its current job.

This contract does not treat the atlas as a replacement.
The atlas is additive and discovery-oriented.

### 2. The atlas must explain sections, not just list demos

Each major section must include a short explanation of what that family teaches.

Examples of acceptable section framing:
- classical systems and rotor-style machines
- modern round structure and AES building blocks
- elliptic-curve foundations and visible protocol structure
- micro demos for isolated primitive understanding

The exact final section names may differ, but the surface must read as a concept map, not as an alphabetical dump.

### 3. The atlas must be searchable

V1 must include one obvious text search field.

Search should be case-insensitive and permit partial matches.

Search should match at least:
- demo names
- short summaries
- section labels
- a bounded set of explicit keywords or concept tags if needed

In V1, chips and recommendation flags are display-only and are not part of the search index.

The goal is that a user can search for terms like:
- `AES`
- `ECC`
- `rotor`
- `hash`
- `Diffie-Hellman`
- `S-box`

and find the right launch entries without already knowing the exact board title.

### 4. Atlas entries must explain enough to support intentional choice

Each atlas entry should show at minimum:
- demo name
- one short summary of what it demonstrates
- its family/section
- an open action

V1 should also include one or more of:
- `Good first board`
- `Advanced`
- `Uses ticked mode`
- `Pairs with tutorial/challenge`

But the page must stay compact enough to browse.

### 5. The atlas must include a bounded starting path for unfamiliar users

V1 should include a small top-of-page or early-page entry area that helps a first-time user orient.

This can be something like:
- `Start Here`
- `Recommended first boards`
- `If you want to understand MCW quickly, begin with…`

Entries with `core: true` in `LearningSequenceMeta` are the canonical source for `Start Here` recommendations unless an explicit editorial override list is provided.

This does not need to be adaptive or personalized.
It does need to exist.

### 6. Launching from the atlas must use existing open flows

The atlas should open the selected board through the same underlying mechanisms already used for demo opening.

Do not create a second incompatible launch path.

### 7. The atlas must stay honest about what it covers

V1 should focus on the shipped demonstration surfaces that a user would reasonably expect under “demos.”

It should not silently blur together:
- full demos
- pipeline micro demos
- tutorials
- challenges

If V1 includes more than one of those families, it must label them clearly.

Recommended V1 shape:
- full demos as the primary atlas content
- pipeline micro demos in a clearly marked `Pipeline Micro Demos` section

Label vocabulary in V1 should be explicit:
- main atlas sections use the editorial atlas section labels
- pipeline micro demos use `Pipeline Micro Demo`
- do not use `demo` as an unlabeled catch-all for both

Tutorials and challenges may be referenced by atlas entries, but V1 does not need to become a full tutorial/challenge browser.

---

## Recommended Surface Shape

V1 should look roughly like:

1. **Intro / Start Here**
- short explanation of what the atlas is
- a few recommended first boards

2. **Search**
- one search bar with immediate filtering

3. **Sectioned map**
- each section has:
  - title
  - one short “what this family teaches” description
  - cards or rows for the demos in that family

4. **Entry cards or rows**
- title
- summary
- maybe one or two compact chips
- open action

Possible section families:
- Foundations / first boards
- Classical ciphers and rotors
- Modern blocks, rounds, and hashes
- Public-key and ECC
- Pipeline micro demos

The exact categories may be adjusted to fit the shipped content, but they must privilege user understanding over internal implementation history.

---

## Data / Metadata Guidance

V1 should prefer deriving the atlas from existing demo definitions plus one bounded metadata layer, not from a hand-maintained second catalog that will drift immediately.

The atlas section map is a new explicit editorial mapping layer.
It does not mechanically reuse the existing `group` field values from `demo-projects.ts`.
Implementation must define and commit that atlas-to-existing-demo mapping as a concrete artifact before implementing the Atlas UI.

Acceptable approaches:
- extend existing demo metadata with section/summary/keywords/recommended flags
- create one local atlas metadata map keyed by demo id

Avoid:
- duplicating full demo definitions
- hardcoding a second source of truth for launch behavior

The atlas metadata should be intentionally small:
- section
- summary
- keywords
- optional recommendation flags
- optional links to related tutorial/challenge ids

---

## Include / Exclude Guidance For V1 Content

V1 should include:
- the main shipped demo boards
- the shipped pipeline micro demos as a separately labeled compact family

V1 should not try to absorb every supporting resource into one mega-surface.

Specifically:
- do not inline full tutorial steps
- do not inline full challenge instructions
- do not add essay-length explanations per demo

This is a launch-and-orient surface.

---

## Testing Requirements

V1 should include:

1. Atlas rendering tests
- the atlas renders sectioned content from the chosen metadata source

2. Search tests
- searching filters the visible entries appropriately
- search works across at least title and summary

3. Launch wiring tests
- opening from the atlas uses the existing demo-open flow

4. Atlas coverage test
- every entry in `demoProjects` appears in at least one atlas section
- every pipeline micro demo appears in at least one atlas section
- any ungrouped entry should fail the test and force an explicit editorial decision

5. Stability checks
- `npx vitest run` passes
- `npm run build` passes

If the atlas becomes large enough to affect bundle behavior, run the existing bundle guard and keep any increase justified and bounded. The demo-data chunk is already near the current ceiling, so atlas metadata should stay intentionally small or split cleanly enough not to create accidental bundle spillover.

---

## Success Criteria

This slice is successful when:

1. A new user can reach the `Atlas` tab in the Learning dock
2. The atlas reads like a concept map, not just a list
3. Users can search and find demos by idea, not only by exact title
4. Users can open demos from the atlas without a parallel launch system
5. The existing Demo menu remains intact and useful
6. The atlas improves discovery without turning into a second manual

---

## Explicitly Avoid

Do not let this become:
- a replacement for the Demo menu
- a curriculum engine
- a huge manual rewrite
- a taxonomic perfection project
- a stealth redesign of Quick Start, Learning, and Resources all at once

This is one bounded discovery and orientation slice.
