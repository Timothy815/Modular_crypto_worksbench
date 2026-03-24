# Workspace Library V1

Last updated: March 24, 2026

Status: Shipped in `v1.13.0`.

## Purpose

This contract defines the first bounded slice for user-owned workspaces and reusable saved build spaces.

The goal is not to create a full project-management suite.
The goal is to let users:
- start from a blank workspace for pure building
- save their own workspaces intentionally
- revisit those workspaces as persistent entries alongside the product's shipped demos

This slice should make MCW feel more like a real laboratory and less like a fixed gallery of demos.

## Product Boundary

This slice should reuse existing MCW concepts:

1. **Projects / Persistence**
- user workspaces should remain ordinary projects under the existing persistence model
- they should not require a second incompatible save format

2. **Demo / Library Navigation**
- user-owned workspaces should sit alongside shipped demos in a clearly separated collection
- shipped demos must remain protected from accidental overwrite

3. **Build Workflow**
- blank workspace creation should be a first-class entry point
- saving a current workspace into a named user collection should be straightforward

This slice should not become:
- cloud sync
- multi-user collaboration
- folder hierarchies / nested collections
- version-control semantics inside the UI

## First Milestone

The first milestone should answer one question clearly:

**Can a user create, save, and revisit their own build spaces without depending on shipped demos?**

The user should be able to:
- create a blank workspace
- name and save a workspace
- reopen it later from a persistent user-owned collection
- distinguish clearly between product demos and personal workspaces

## Include

The first milestone should likely include:
- one or more blank workspace starting points
- a user workspace collection distinct from built-in demos
- save/update behavior for the current workspace
- rename and delete for user-owned workspaces
- persistence through reloads under the existing local-storage/document system

Prefer a simple personal library over a broad project dashboard.

## Exclude

This milestone should explicitly avoid:
- cloud accounts
- branching/history UI
- workspace sharing links
- template marketplaces
- importing arbitrary external project packs as the main workflow

## Visual / Teaching Principles

Prefer:
- a clear distinction between shipped examples and personal experiments
- blank-space creation that feels intentional and inviting
- named saved workspaces that encourage iterative building

Avoid:
- hiding user work behind the demo gallery
- forcing users to overwrite demos to keep their work
- introducing organizational complexity before it is needed

## Success Criteria

This slice is successful when a user can:
- start from a blank build space
- save a workspace they are building
- return to that workspace later from a persistent personal collection
- treat MCW as an ongoing construction lab instead of a one-session sandbox
