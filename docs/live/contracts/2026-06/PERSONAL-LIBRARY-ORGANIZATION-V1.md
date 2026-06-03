# Personal Library Organization V1

Last updated: June 3, 2026
Status: Shipped

## Scope

Add a bounded organization layer for promoted personal-library reusables without turning MCW into a package manager.

This slice adds personal-library tags only:

- personal reusable entries may carry `personalTags`
- tags are normalized, deduplicated, persisted, and exported with personal-library entries
- the reusable palette exposes a Personal Tags filter
- personal reusable cards show their tags and provide a lightweight comma-separated tag editor

## Boundaries

This slice does not add folders, ownership transfer, recursive dependency organization, package manifests, or automatic retargeting. Workspace-local reusables remain workspace-local, and promotion remains copy-based.

## Verification

- `npx vitest run src/ui/reusable-library.test.ts`
- `npx vitest run`
- `npm run build`
