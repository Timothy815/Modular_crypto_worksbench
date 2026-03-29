# FIRST-SESSION-ONBOARDING-V1

Status: Implemented

Owner: Codex
Scope: Onboarding / Guide / Manual / Learning Flow

## Why

MCW now has real depth:
- guided demos
- tutorials
- challenges
- verification
- Python export with parity
- a user manual
- an AI toolkit

That is good product maturity, but it also means the first-session burden is now higher.

A new user can successfully use MCW today, but only if they already understand where to begin and which surfaces matter first. The product still assumes too much self-orientation.

The next honest product move is not another major primitive. It is a bounded onboarding slice that helps a new user:
- start in the right place
- understand the main workflow surfaces
- know what to do next
- reach one successful early outcome quickly

This is the strongest leverage point because it improves the usefulness of everything already shipped.

## Goal

Add a bounded first-session onboarding layer that helps a new user get from opening MCW to completing one meaningful early workflow without confusion.

The first milestone should make it easier to:
- identify the recommended starting workspace
- understand the difference between Build, Guide, Cryptanalysis, Verification, Export, and Resources
- move from demo to tutorial to challenge to manual without guessing
- know what the next recommended action is after finishing an early task

## Product Boundary

This slice is:
- onboarding-first
- workflow-oriented
- user-guidance focused
- built on already-shipped surfaces

It is not:
- a shell redesign
- a new tutorial engine
- a replacement for the user manual
- a new primitive or analysis line
- a generalized recommendation system

The right framing is:
- make the first five to ten minutes legible
- reduce scan cost
- improve transition between existing product surfaces

## Required V1 Shape

1. V1 should add one explicit in-product `Start Here` onboarding entrypoint.
2. That entrypoint should clearly explain:
   - what MCW is for
   - where a new user should begin
   - what the primary early workflow is
3. V1 should define one recommended first-session path built from existing surfaces:
   - open the recommended starter demo
   - enter the matching tutorial
   - attempt the matching challenge
   - consult the manual if needed
   - use verification or comparison to confirm the result
4. V1 should provide short, explicit guidance on the major workflow surfaces:
   - Build
   - Guide
   - Cryptanalysis
   - Verification / Compare
   - Export
   - Resources
5. V1 should add at least one clear “what to do next” handoff after the starter path completes.
6. The onboarding copy must remain concise and action-oriented rather than becoming a second manual.
7. V1 should reuse existing demos, tutorials, challenges, and manual entries rather than authoring a large new body of parallel content.
8. The onboarding path should point to the earliest learning item, not an advanced arithmetic or protocol machine.

## Preferred V1 Direction

The likely best first shape is:
- one `Start Here` card or action in the existing learning/help area
- one short recommended path centered on the first core starter workspace
- one compact workflow summary such as:
  - `Open Demo`
  - `Follow Tutorial`
  - `Try Challenge`
  - `Check With Verification`
  - `Read The Manual If You Need Context`

The strongest first-session target is probably:
- the earliest bridge/foundation workspace
- plus its tutorial and challenge pair

The point is not to teach every feature at once. The point is to help the user achieve one small successful loop and then continue intentionally.

## UX Rules

- The onboarding surface should be visible enough that a new user can find it without reading the manual first.
- The language should be plain and operational, not aspirational.
- The onboarding copy should tell the user what to click or open next, not just describe product concepts abstractly.
- The handoff between demo, tutorial, challenge, manual, and verification should feel like one coherent path rather than five unrelated destinations.
- The onboarding surface should not bury Cryptanalysis or Verification; it should place them in the workflow honestly, even if they are not the first action.

## Teaching Rules

- The onboarding path must not imply that finishing one starter loop means the user has “learned MCW.”
- The onboarding copy should distinguish:
  - authoring
  - guided learning
  - analysis
  - verification
  - export
- The path should emphasize that MCW is a systems IDE, not a black-box cipher picker.
- The first session should end with one visible success condition, such as:
  - matching output
  - a passing verification bit
  - a repaired challenge

## Non-Goals

- No new engine behavior
- No new primitive modules
- No new detached-window infrastructure
- No full onboarding wizard
- No account/profile-based progress tracking
- No automatic adaptive recommendations
- No long-form manual duplication

## Success Condition

This slice is successful if:
- a new user can find `Start Here` quickly
- complete one recommended demo/tutorial/challenge loop
- understand where the manual and verification surfaces fit
- and answer, after the first session:
  - where do I build?
  - where do I get guided help?
  - where do I verify behavior?
  - where do I export?

## Notes

This should come before another major primitive expansion.

MCW already has enough capability for strong first sessions. The bottleneck is now orientation and flow, not raw feature count.

The next honest usability move is:
- first-session clarity
- visible workflow guidance
- stronger transitions between existing surfaces
