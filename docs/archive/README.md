# MCW Archive

This directory holds historical contracts and notes that are no longer part of the live restart surface.

## What Belongs Here

- shipped implementation contracts
- completed audits
- completed release-decision notes
- stale “next slice” docs that still matter as historical context but should not remain in the main navigation path

## What Should Stay Out

- core project-definition docs such as `PROJECT.md` and `ENGINE-V1-CONTRACT.md`
- canonical restart docs such as `ACTIVE-DOCS.md` and `IMPLEMENTATION-STATUS.md`
- genuinely active roadmap notes or live planning surfaces

## Archiving Workflow

1. Update the contract `Status:` line so it truthfully reflects source reality.
2. Make sure `IMPLEMENTATION-STATUS.md` no longer treats the item as open work.
3. Move the file into an appropriate dated folder under `docs/archive/`.
4. Update explicit references in restart/instruction docs if they still point to the root location.

The goal is to reduce navigation noise without erasing historical design context.
