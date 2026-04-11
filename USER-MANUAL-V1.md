# USER-MANUAL-V1

Status: Shipped on `main`.

Owner: Codex
Scope: UI / Product Surface / Documentation

## Why

MCW has reached the point where new users cannot be expected to discover the product only by exploring the interface.

The tool now includes:
- a dense authoring surface
- a significant inspector and compare surface
- detached multi-window behavior
- Python export and verification workflows
- tutorials and challenges

Those are valuable, but they are no longer self-explanatory to a first-time user.

MCW now needs a first-class user manual surface:
- inside the product
- easy to open
- searchable
- extendable as the product grows

## Goal

Add a user-manual entry point in the existing `Resources` surface that opens a dedicated manual window with:
- a table of contents
- search
- an index
- extendable manual content designed to grow with the product

The manual should help a new user quickly learn:
- what the major surfaces are
- where important controls live
- how the common workflows work

## Non-Goals

- No full external docs site
- No markdown CMS or publishing pipeline in V1
- No generic wiki/editor inside the app
- No context-aware AI assistant
- No attempt to document every primitive exhaustively in the first slice
- No replacement for tutorials/challenges
- No new `DetachedPanelKind` for the manual in V1
- No BroadcastChannel synchronization for the manual window
- No live content editing inside the manual viewer
- No per-primitive exhaustive reference in V1

## Required V1 Shape

1. The `Resources` surface must include a `User Manual` action.
2. That action must open a standalone browser window via `window.open()`, not an external website and not a new detached multi-window pane.
3. The manual surface must support:
   - a visible table of contents
   - text search across titles, bodies, and index terms
4. A curated alphabetical index should be included in V1 only as a distinct lookup aid for known feature names and topics.
5. The manual content model must be structured and extendable rather than one large hard-coded blob.
6. The manual must be oriented around product use, not only cryptographic theory.
7. The first V1 content set must prioritize:
   - getting started
   - workspace layout / workbench basics
   - palette / inspector / learning surfaces
   - save / version / import / export
   - detached windows / combined / split use
   - verification station basics
8. The manual should be searchable by feature names and user-intent phrasing where practical.
9. The table of contents and index should both be visible, understandable navigation tools, not hidden implementation details.
10. The surface should be designed so future manual sections can be added without redesigning the viewer.
11. The manual must respect the current light/dark theme at open time, without adding live cross-window theme synchronization.
12. This must remain a bounded help/documentation feature, not a new generalized content-management system.

## Content Model

The manual should be authored as structured internal content with stable sections and entries.

Expected V1 shape:
- top-level sections
- subsection entries
- index terms / aliases
- searchable titles and bodies

The content model should support future additions such as:
- new workflow pages
- feature-specific reference pages
- troubleshooting pages

### Content Data Shape

V1 content must live in one typed TypeScript data module.

Expected shape:
- `ManualSection[]`
- each section has:
  - `id`
  - `title`
  - `summary`
  - `entries`
- each entry has:
  - `id`
  - `title`
  - `body`
  - `indexTerms`

No markdown parsing, external file loading, dynamic fetching, or CMS behavior in V1.

## Primary V1 Topics

### Getting Started

- what MCW is
- how to read the workspace
- how to pick a starting demo/tutorial

### Workbench Basics

- selecting modules and wires
- moving around the workspace
- grouped workbench controls
- save / restore / versions

### Core Surfaces

- palette
- inspector
- tutorials and challenges
- compare / verification

### Multi-Window Use

- detaching panes
- tabbed detached windows
- combined and split detached views
- returning panes to main

### Export And Verification

- JSON export/import
- Python export bundle
- `verify_parity.py`
- verification station basics

## UX Rules

- The manual must feel like product help, not like a raw dump of internal notes.
- Search should be fast and forgiving.
- The table of contents should help orientation.
- The index should help lookup when users know a feature name but not where it lives.
- The manual should be useful to someone seeing MCW for the first time.

## Content Density

Each V1 entry should be concise product-oriented prose meant for orientation and lookup.

The manual should explain:
- what a surface is for
- where to find it
- how it fits into the common workflow

Detailed exhaustive primitive-by-primitive reference is explicitly deferred.

## Success Condition

This slice is successful if:
- a new user can find the manual from `Resources` without coaching
- they can search for common feature terms and find the right section quickly
- the manual gives a clear overview of where important features live
- the content model is obviously extendable for future product growth

## Notes

This is a user-help/product-surface slice, not a tutorial replacement.

Tutorials and challenges teach by doing.
The manual should teach by orientation and lookup.

That distinction matters.
