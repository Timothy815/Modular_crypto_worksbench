# Operator Manual And Learning Discovery V1

Last updated: June 7, 2026
Status: Proposed

---

## Problem Statement

Replace MCW's current manual shape with a real operator manual and explicitly align it with Atlas so new users can:

- learn how to operate MCW's core workflows
- find the right demo, tutorial, challenge, or flagship lab intentionally
- understand where the product's instructional surfaces live
- use the workbench efficiently without already knowing the product vocabulary

MCW currently has several useful instructional surfaces:

- the User Manual
- the Learning dock
- Atlas
- tutorials
- challenges
- demos
- pipeline micro demos

But the navigation model across those surfaces is still fragmented.

Today, a new user who asks questions like:

- "How do I create a composite?"
- "How do I build an iterator from a round?"
- "Where are the flagship labs?"
- "Which board should I open first for AES?"
- "What is the difference between a demo, tutorial, and challenge?"

does not get a strong answer from the manual itself.

The current manual has three core failures:

1. it is **reference-first instead of workflow-first**
2. it is **feature-descriptive instead of task-instructional**
3. it is **weakly connected to learning discovery surfaces**

V1 must treat the manual as an **operator guide and route-finder first**, and only secondarily as a reference.

That means the primary questions the manual must answer are:

- what should I do first?
- how do I perform this task?
- where do I go to learn this topic?
- which learning surface should I use next?

Only after that should it answer:

- what is this module?
- what does this term mean?
- what are the supported shortcuts?

The manual succeeds only if a user can accomplish real orientation and navigation tasks without already thinking like an internal developer.

---

## Scope

### In scope

- redesigning the User Manual information architecture around user tasks and product navigation
- explicitly defining the relationship between Manual and Atlas
- adding a new workflow-oriented manual structure
- adding manual entries that explain core authoring workflows
- adding manual entries that help users find learning content intentionally
- introducing a bounded taxonomy for major learning/discovery families such as flagship labs
- reducing or reorganizing current glossary-style content so it no longer dominates the manual
- using existing shipped demos/tutorials/challenges/Atlas content as destinations rather than duplicating them wholesale
- updating manual TOC / sidebar structure to reflect the new information architecture
- bounded search/index support for the new structure
- tests for manual rendering, TOC ordering, and task-language search/index coverage

### Out of scope

- rewriting every demo, tutorial, or challenge body
- replacing Atlas with the manual
- building a full progress-tracking or prerequisite system
- introducing personalized recommendations
- creating an exhaustive training curriculum engine
- turning the manual into a giant prose dump
- fully eliminating reference material
- adding new manual-to-product deep-link or launch infrastructure
- redesigning Atlas itself
- adding a dedicated lab-pack-sharing manual workflow in this slice

---

## Required Product Outcome

After this slice, the manual must function as:

1. a **start-here guide**
2. a **how-to guide for core workflows**
3. a **navigator into learning content**
4. a **bounded reference appendix**

It must no longer read primarily like:

- a dictionary
- a registry dump
- a feature-note archive

---

## Required Product Behavior

### 1. The manual must have a task-first top level structure

The top-level manual structure must be organized around user intent, not around implementation categories.

The required top-level shape for V1 is:

1. `Start Here`
2. `Core Workflows`
3. `Find Learning Content`
4. `Reference`

Equivalent final labels are acceptable if they preserve the same meaning.

What is not acceptable:

- leading with primitive reference or feature glossary sections
- making workflow guidance a minor subsection buried under feature notes
- treating search as the primary substitute for structure

### 2. The manual must answer "how do I do this?" for real MCW tasks

V1 must include explicit operator guidance for at least the following practical workflows:

- creating a composite from selection
- creating an iterator from an existing round/body
- creating a clocked iterator
- opening, saving, and saving-as local workspace documents
- saving versions and restoring versions
- using the reusable library at a practical level
- promoting a reusable to the personal library
- using Analyze / Inspector for practical inspection
- understanding the difference between Build, Guide, and Challenge mode
- switching between Build, Guide, and Challenge from an already-open board
- using the Verification Station with known vectors or captured cases
- exporting to Python and understanding parity verification
- finding and using Atlas

These should be written as concrete operational guidance, not as abstract feature descriptions.

The guidance does not need to be long.
It does need to be explicit enough that a new user can follow it.

### 3. The manual must explicitly direct users into learning surfaces

The manual must stop behaving as if it alone should teach everything in-place.

For V1, `route users` means:

- name the exact destination the user should open
- place that destination under the correct discovery heading
- include enough one-sentence framing that the user can choose intentionally

V1 does **not** require new manual launch buttons or deep links.
If low-cost internal linking already exists, it may be used, but named destination references are the required baseline.

For appropriate topics, it must route users toward the right learning surface:

- Atlas
- full demos
- tutorials
- challenges
- flagship labs

Examples:

- if the user wants a first conceptual tour, the manual should direct them to a defined "start here" set of learning items
- if the user wants to understand AES visually, the manual should point to the right boards
- if the user wants repair-style practice, the manual should point to the right challenge family

The manual is allowed to summarize these surfaces.
It must not pretend that prose entries alone are an adequate replacement.

### 4. Atlas and Manual must have explicitly different jobs

V1 must clearly separate:

- **Manual** = operator guide + route-finder
- **Atlas** = concept/discovery map of learning content

For clarity: Atlas is the shipped always-visible `Atlas` tab in the Learning dock that groups and launches learning boards from a discovery-first surface.

The manual must explain what Atlas is for and when to use it.

Atlas should remain the content-map surface.
The manual should point into it deliberately.

This contract does not require a full Atlas redesign, but it does require the manual to stop acting like Atlas does not exist.

### 5. The manual must introduce a bounded learning-content taxonomy

The product needs a simple, explicit vocabulary for learning content families so users can intentionally browse by intent.

V1 must define and expose a bounded taxonomy that covers at least:

- `Start Here`
- `Flagship Labs`
- `Tutorials`
- `Challenges`
- `Full Demos`
- `Pipeline Micro Demos`

Additional bounded categories are acceptable if useful, such as:

- `AES`
- `ECC`
- `Classical`
- `Protocols`

But V1 must not turn into a giant uncontrolled tag system.

The most important missing category explicitly called out by product need is:

- `Flagship Labs`

Users must have an obvious way to find all flagship labs.

For V1, `Flagship Labs` means the numbered capstone learning lines that combine guided construction/inspection with repair, verification, and export/parity trust work.

The current required flagship inventory is:

- `Classical Flagship Lab`
  - `[LAB-1.1] Rotor Return Path`
  - `[LAB-1.2] Advanced Rotor Stepping`
  - `[LAB-1.3] Prove The Mechanical Cipher`
  - linked repair challenges: `[LAB-1.2A] Repair the Rotor Notch`, `[LAB-1.2B] Repair Ring Setting Versus Position`
- `Modern Flagship Lab`
  - `[LAB-2.1] Byte S-Box Round`
  - `[LAB-2.2] Feistel Network`
  - `[LAB-2.3] The Avalanche Effect`
  - `[LAB-2.4] Prove The Modern Round`
  - linked repair challenges: `[LAB-2.1A] Repair the Permutation`, `[LAB-2.1B] Repair the S-Box Transform`, `[LAB-2.2A] Repair the Feistel Bus`

Other learning assets may be important, but they are not required to be classified as `Flagship Labs` in V1.

The shipped AES primitive repair challenges are **not** `Flagship Labs` in V1.
They should appear under the AES domain route in `Find Learning Content` as a repair-challenges family.

### 6. The manual must stop making reference content the dominant reading path

Primitive/module reference material may remain, but it must be clearly secondary.

This means at least:

- the reference area appears after operator/workflow/discovery guidance
- the TOC and section ordering do not front-load long primitive dictionaries
- workflow entries use plain language and route users onward when appropriate

It is acceptable for V1 to preserve much of the current reference content while demoting it structurally.

It is not acceptable for the reference appendix to remain the practical center of the manual.

### 7. The manual must help users understand learning-surface differences

V1 must include explicit explanation of what the main learning surfaces are for:

- Demo
- Tutorial
- Challenge
- Atlas

The user should be able to understand:

- when to open a demo
- when to use a tutorial
- when to use a challenge
- when Atlas is the better starting point

This is a major current product-legibility gap and must be addressed directly.

### 8. Search and index must support the new operator model

The manual search/index may remain simple, but the content feeding it must support real user tasks.

That means search/index coverage must include phrases such as:

- create composite
- create iterator
- flagship labs
- save version
- restore snapshot
- Atlas
- challenge
- tutorial
- AES
- ECC

V1 does not require sophisticated search ranking, but it does require task-language discoverability.

---

## Recommended Information Architecture

### A. Start Here

Purpose:
- first contact
- orientation
- where to begin

Required entry shapes:

- What MCW is
- Where to start as a new user
- How the main surfaces fit together
- What Atlas is for
- What demos/tutorials/challenges are for

### B. Core Workflows

Purpose:
- practical how-to guidance

Required workflow entries:

- Create a composite
- Create an iterator
- Create a clocked iterator
- Use the reusable library
- Save/open/save-as a workspace
- Save and restore versions
- Use Analyze / Inspector
- Use Build / Guide / Challenge modes
- Use the Verification Station
- Export to Python and verify parity

These should use clear action-oriented titles rather than passive feature names.

Examples of good titles:

- `How To Create A Composite`
- `How To Create An Iterator From A Round`
- `How To Reopen A Local Workspace File`

Examples of weak titles:

- `Composite Architecture`
- `Iterator Overview`
- `Persistence Notes`

### C. Find Learning Content

Purpose:
- route users toward the correct learning artifact

Required entry families:

- Start Here boards
- Flagship Labs
- Tutorial families
- Challenge families
- Atlas usage guidance
- domain-oriented routes such as AES and ECC where shipped content already exists

A single named discovery entry per domain such as `AES` or `ECC` is sufficient for V1.
V1 does not require an exhaustive board-by-board catalog inside the manual.

At minimum, this section must let a user answer:

- where are the flagship labs?
- where should I go for AES?
- where should I go for ECC?
- where are repair challenges?
- where should I start if I want a guided first experience?

### D. Reference

Purpose:
- keep bounded detailed material available without dominating the manual

Allowed content:

- shortcuts
- module families
- terminology
- lower-level feature notes

The reference section may be substantial.
It must no longer be the primary reading path.

---

## UI / UX Guidance

### Manual sidebar / TOC

The TOC should reflect the new architecture and read as a guide, not a dump.

It should privilege:

- major operator sections
- workflow sections
- learning-discovery sections

Reference-heavy areas should be visibly secondary.

### Search behavior

Search should work on practical language, not only exact feature names.

The manual is allowed to stay relatively compact if search and routing work well.

### Routing behavior

V1 resolves routing in the simplest implementation-guiding way:

- the manual must use explicit named destination references
- the manual does not need new launch controls or deep links
- the manual may use existing internal anchors or low-cost links if they already fit the architecture

The required behavior is that a user can read a manual entry and know exactly which board, tutorial, challenge, or Atlas surface to open next.

---

## Content Guidance

V1 must prefer:

- concise action language
- visible route-finding cues
- "what to do next" guidance
- naming the actual product surfaces the user should open

V1 must reduce:

- prose that merely restates a feature exists
- passive implementation trivia
- reference material that does not help a user operate the tool
- long primitive descriptions in the primary reading path

The standard is not "more text."
The standard is "more useful text."

---

## Relationship To Existing Content

The current `USER_MANUAL_SECTIONS` content should be treated as raw material, not as a final architecture that must be preserved.

It is acceptable and recommended to:

- split current entries
- rename them
- move them
- condense them
- replace glossary-like entries with workflow entries
- demote large primitive reference sections

For the existing long primitive/module reference material, the required V1 treatment is:

- keep the useful factual content
- move it under `Reference`
- condense or regroup it where helpful
- stop presenting it as the manual's practical front door

This slice does not require deleting the primitive reference.
It does require demoting it.

For currently shipped non-flagship learning entries that already exist in the manual, V1 should place them intentionally rather than letting them drift:

- the existing PRNG labs and Bitstream Randomness Lab should move under `Find Learning Content`
- they should be presented as named learning/discovery entries, not left buried in feature-description sections
- they do not need to be elevated to `Flagship Labs` in this slice

The product should preserve useful factual content where it helps, but it should not preserve the current structure merely because it already exists.

---

## Acceptance Criteria

This slice is successful only if all of the following are true:

1. the top-level TOC presents `Start Here`, `Core Workflows`, and `Find Learning Content` before `Reference`
2. the manual contains explicit workflow entries for composite creation, iterator creation, and Python export/parity
3. the manual contains a dedicated `Flagship Labs` discovery entry that names both the Classical and Modern flagship lines
4. the manual contains an explicit explanation of Atlas versus Demo versus Tutorial versus Challenge
5. primitive/module reference content is present under `Reference` rather than leading the manual
6. manual search/index coverage includes task-language terms such as `create composite`, `create iterator`, `flagship labs`, `Atlas`, and `parity`
7. a reader can identify the exact next destination to open for at least one AES route, one ECC route, and one flagship-lab route without already knowing internal vocabulary (human review at release)

---

## Risks To Avoid

### 1. Rewriting everything without improving usefulness

This slice is not a prose-expansion exercise.
If the manual gets longer but not more actionable, it has failed.

### 2. Duplicating Atlas badly

The manual should route into Atlas and learning content, not become a second clumsy copy of Atlas.

### 3. Preserving the old dictionary shape under new labels

If the structure is still fundamentally "long reference list plus search," the slice has failed even if headings change.

### 4. Creating an uncontrolled taxonomy

The learning-content categories must stay bounded and product-meaningful.

### 5. Hiding practical workflows behind abstract wording

Tasks like creating composites and iterators must be named directly.

---

## Suggested Implementation Shape

The likely clean implementation path is:

1. define the new manual information architecture as a concrete content model
2. rewrite the top-level manual sections to reflect operator/discovery/reference layering
3. add workflow entries for the highest-value product tasks
4. add learning-discovery entries including flagship-lab routing
5. demote or reorganize primitive reference content
6. update TOC and search/index output to match the new structure
7. verify that the new manual complements Atlas rather than competing with it

This may require changing:

- `manual-content.ts`
- `manual-window.tsx`
- shared manual TOC/search styling
