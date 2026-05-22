import {
  isCompositeDefinition,
  type CompositeLibraryEntry,
} from '../engine/composites';
import { cloneProject } from './project-clone';

export function createUserOwnedReusableDuplicate(
  entry: CompositeLibraryEntry,
  library: CompositeLibraryEntry[],
  workspaceId?: string,
): CompositeLibraryEntry {
  const nextId = createDuplicateReusableId(entry.id, new Set(library.map((candidate) => candidate.id)));
  const nextName = createDuplicateReusableName(
    entry.name,
    new Set(library.map((candidate) => candidate.name)),
  );

  if (isCompositeDefinition(entry.definition)) {
    return {
      ...entry,
      id: nextId,
      name: nextName,
      source: 'user',
      scope: workspaceId ? 'workspace' : entry.scope ?? 'personal',
      workspaceId: workspaceId ?? (entry.scope === 'workspace' ? entry.workspaceId : undefined),
      definition: {
        ...entry.definition,
        id: nextId,
        name: nextName,
        project: cloneProject(entry.definition.project),
        layout: entry.definition.layout
          ? Object.fromEntries(
              Object.entries(entry.definition.layout).map(([moduleId, position]) => [
                moduleId,
                { ...position },
              ]),
            )
          : undefined,
        inputBindings: entry.definition.inputBindings.map((binding) => ({ ...binding })),
        outputBindings: entry.definition.outputBindings.map((binding) => ({ ...binding })),
      },
    };
  }

  return {
    ...entry,
    id: nextId,
    name: nextName,
    source: 'user',
    scope: workspaceId ? 'workspace' : entry.scope ?? 'personal',
    workspaceId: workspaceId ?? (entry.scope === 'workspace' ? entry.workspaceId : undefined),
    definition: {
      ...entry.definition,
      id: nextId,
      name: nextName,
    },
  };
}

export function renameReusableDisplayName(
  entry: CompositeLibraryEntry,
  nextName: string,
): CompositeLibraryEntry {
  const normalizedName = nextName.trim();
  if (!normalizedName || normalizedName === entry.name) {
    return entry;
  }

  if (isCompositeDefinition(entry.definition)) {
    return {
      ...entry,
      name: normalizedName,
      definition: {
        ...entry.definition,
        name: normalizedName,
      },
    };
  }

  return {
    ...entry,
    name: normalizedName,
    definition: {
      ...entry.definition,
      name: normalizedName,
    },
  };
}

export function createWorkspaceScopedReusableEntry(
  entry: CompositeLibraryEntry,
  workspaceId: string,
): CompositeLibraryEntry {
  return {
    ...entry,
    source: 'user',
    scope: 'workspace',
    workspaceId,
  };
}

export function createPersonalReusablePromotionCopy(
  entry: CompositeLibraryEntry,
  library: CompositeLibraryEntry[],
): { entry: CompositeLibraryEntry; hadConflict: boolean } {
  const existingIds = new Set(library.map((candidate) => candidate.id));
  const existingNames = new Set(
    library
      .filter((candidate) => candidate.source !== 'built-in' && (candidate.scope ?? 'personal') === 'personal')
      .map((candidate) => candidate.name),
  );

  const hasConflict =
    library.some(
      (candidate) =>
        candidate.source !== 'built-in' &&
        (candidate.scope ?? 'personal') === 'personal' &&
        candidate.id === entry.id,
    );

  const nextId = hasConflict
    ? createDuplicateReusableId(entry.id, existingIds)
    : entry.id;
  const nextName = hasConflict
    ? createDuplicateReusableName(entry.name, existingNames)
    : entry.name;

  const promoted = isCompositeDefinition(entry.definition)
    ? {
        ...entry,
        id: nextId,
        name: nextName,
        source: 'user' as const,
        scope: 'personal' as const,
        workspaceId: undefined,
        definition: {
          ...entry.definition,
          id: nextId,
          name: nextName,
          project: cloneProject(entry.definition.project),
          layout: entry.definition.layout
            ? Object.fromEntries(
                Object.entries(entry.definition.layout).map(([moduleId, position]) => [
                  moduleId,
                  { ...position },
                ]),
              )
            : undefined,
          inputBindings: entry.definition.inputBindings.map((binding) => ({ ...binding })),
          outputBindings: entry.definition.outputBindings.map((binding) => ({ ...binding })),
        },
      }
    : {
        ...entry,
        id: nextId,
        name: nextName,
        source: 'user' as const,
        scope: 'personal' as const,
        workspaceId: undefined,
        definition: {
          ...entry.definition,
          id: nextId,
          name: nextName,
        },
      };

  return { entry: promoted, hadConflict: hasConflict };
}


export function createDuplicateReusableId(sourceId: string, existingIds: Set<string>) {
  const baseId = `${sourceId}Custom`;
  let candidate = baseId;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${baseId}${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function createDuplicateReusableName(sourceName: string, existingNames: Set<string>) {
  const baseName = `${sourceName} Custom`;
  let candidate = baseName;
  let suffix = 2;

  while (existingNames.has(candidate)) {
    candidate = `${baseName} ${suffix}`;
    suffix += 1;
  }

  return candidate;
}
