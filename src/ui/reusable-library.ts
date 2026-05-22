import { isCompositeDefinition, type CompositeLibraryEntry } from '../engine/composites';
import { cloneProject } from './project-clone';

export function createUserOwnedReusableDuplicate(
  entry: CompositeLibraryEntry,
  library: CompositeLibraryEntry[],
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
