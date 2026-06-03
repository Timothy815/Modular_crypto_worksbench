import {
  isClockedIteratorDefinition,
  isConditionalDefinition,
  isCompositeDefinition,
  isIteratorDefinition,
  isMultiConditionalDefinition,
  type CompositeLibraryEntry,
} from '../engine/composites';
import { cloneProject } from './project-clone';
import { getImmediateReusableDependencyIds } from './workspace-document-reusables';

export interface PromoteWithDependenciesPreview {
  rootEntry: CompositeLibraryEntry;
  dependencyCandidates: CompositeLibraryEntry[];
  selectedEntryIds: string[];
  excludedImmediateDependencyIds: string[];
  unresolvedTransitiveWorkspaceDependencyIds: string[];
  warningMessages: string[];
}

export interface PromoteWithDependenciesResult {
  promotedEntries: CompositeLibraryEntry[];
  hadConflict: boolean;
}

export function normalizeReusablePersonalTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    const normalized = tag.trim().replace(/\s+/g, ' ');
    const normalizedKey = normalized.toLowerCase();
    if (!normalized || seen.has(normalizedKey)) {
      continue;
    }
    seen.add(normalizedKey);
    normalizedTags.push(normalized);
  }

  return normalizedTags.sort((left, right) => left.localeCompare(right));
}

export function parseReusablePersonalTagDraft(draft: string): string[] {
  return normalizeReusablePersonalTags(draft.split(','));
}

export function updateReusablePersonalTags(
  entry: CompositeLibraryEntry,
  tags: readonly string[],
): CompositeLibraryEntry {
  const personalTags = normalizeReusablePersonalTags(tags);
  if (personalTags.length === 0) {
    const { personalTags: _personalTags, ...entryWithoutTags } = entry;
    return entryWithoutTags;
  }

  return {
    ...entry,
    personalTags,
  };
}

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

export function buildPromoteWithDependenciesPreview(
  rootEntry: CompositeLibraryEntry,
  library: CompositeLibraryEntry[],
  activeWorkspaceId: string,
  selectedDependencyIds: string[],
): PromoteWithDependenciesPreview {
  const reusableById = new Map(library.map((entry) => [entry.id, entry]));
  const dependencyCandidates = getImmediateReusableDependencyIds(rootEntry.definition, reusableById)
    .map((dependencyId) => reusableById.get(dependencyId))
    .filter(
      (entry): entry is CompositeLibraryEntry =>
        Boolean(
          entry &&
            entry.source !== 'built-in' &&
            (entry.scope ?? 'personal') === 'workspace' &&
            entry.workspaceId === activeWorkspaceId,
        ),
    );
  const selectedDependencyIdSet = new Set(selectedDependencyIds);
  const selectedEntryIds = [rootEntry.id, ...dependencyCandidates
    .filter((entry) => selectedDependencyIdSet.has(entry.id))
    .map((entry) => entry.id)];
  const excludedImmediateDependencyIds = dependencyCandidates
    .filter((entry) => !selectedDependencyIdSet.has(entry.id))
    .map((entry) => entry.id);
  const selectedEntryIdSet = new Set(selectedEntryIds);
  const unresolvedTransitiveWorkspaceDependencyIds = Array.from(
    new Set(
      selectedEntryIds.flatMap((entryId) => {
        const entry = reusableById.get(entryId);
        if (!entry) {
          return [];
        }
        return getImmediateReusableDependencyIds(entry.definition, reusableById).filter((dependencyId) => {
          const dependency = reusableById.get(dependencyId);
          return Boolean(
            dependency &&
              dependency.source !== 'built-in' &&
              (dependency.scope ?? 'personal') === 'workspace' &&
              dependency.workspaceId === activeWorkspaceId &&
              !selectedEntryIdSet.has(dependencyId),
          );
        });
      }),
    ),
  );

  const warningMessages: string[] = [];
  if (excludedImmediateDependencyIds.length > 0) {
    warningMessages.push('Excluded dependencies remain workspace-local.');
  }
  if (unresolvedTransitiveWorkspaceDependencyIds.length > 0) {
    warningMessages.push(
      'Included dependencies still have further workspace-local dependencies outside this selected set.',
    );
  }

  return {
    rootEntry,
    dependencyCandidates,
    selectedEntryIds,
    excludedImmediateDependencyIds,
    unresolvedTransitiveWorkspaceDependencyIds,
    warningMessages,
  };
}

export function promoteReusableWithSelectedDependencies(
  rootEntry: CompositeLibraryEntry,
  library: CompositeLibraryEntry[],
  selectedDependencyIds: string[],
  activeWorkspaceId: string,
): PromoteWithDependenciesResult {
  const preview = buildPromoteWithDependenciesPreview(
    rootEntry,
    library,
    activeWorkspaceId,
    selectedDependencyIds,
  );
  const selectedEntries = preview.selectedEntryIds
    .map((entryId) => library.find((entry) => entry.id === entryId))
    .filter((entry): entry is CompositeLibraryEntry => Boolean(entry));

  const existingIds = new Set(library.map((entry) => entry.id));
  const existingPersonalNames = new Set(
    library
      .filter((entry) => entry.source !== 'built-in' && (entry.scope ?? 'personal') === 'personal')
      .map((entry) => entry.name),
  );
  const idMap = new Map<string, string>();
  const nameMap = new Map<string, string>();
  let hadConflict = false;

  for (const entry of selectedEntries) {
    const personalConflict = library.some(
      (candidate) =>
        candidate.source !== 'built-in' &&
        (candidate.scope ?? 'personal') === 'personal' &&
        candidate.id === entry.id,
    );
    const nextId = personalConflict ? createDuplicateReusableId(entry.id, existingIds) : entry.id;
    const nextName = personalConflict ? createDuplicateReusableName(entry.name, existingPersonalNames) : entry.name;
    hadConflict = hadConflict || personalConflict;
    idMap.set(entry.id, nextId);
    nameMap.set(entry.id, nextName);
    existingIds.add(nextId);
    existingPersonalNames.add(nextName);
  }

  const promotedEntries = selectedEntries.map((entry) =>
    rewriteReusableForPromotion(entry, idMap, nameMap),
  );

  return { promotedEntries, hadConflict };
}

function rewriteReusableForPromotion(
  entry: CompositeLibraryEntry,
  idMap: Map<string, string>,
  nameMap: Map<string, string>,
): CompositeLibraryEntry {
  const nextId = idMap.get(entry.id) ?? entry.id;
  const nextName = nameMap.get(entry.id) ?? entry.name;

  if (isCompositeDefinition(entry.definition)) {
    return {
      ...entry,
      id: nextId,
      name: nextName,
      source: 'user',
      scope: 'personal',
      workspaceId: undefined,
      definition: {
        ...entry.definition,
        id: nextId,
        name: nextName,
        project: {
          ...cloneProject(entry.definition.project),
          modules: entry.definition.project.modules.map((moduleInstance) => ({
            ...moduleInstance,
            params: { ...moduleInstance.params },
            defId: idMap.get(moduleInstance.defId) ?? moduleInstance.defId,
          })),
        },
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

  if (isIteratorDefinition(entry.definition) || isClockedIteratorDefinition(entry.definition)) {
    return {
      ...entry,
      id: nextId,
      name: nextName,
      source: 'user',
      scope: 'personal',
      workspaceId: undefined,
      definition: {
        ...entry.definition,
        id: nextId,
        name: nextName,
        roundDefId: idMap.get(entry.definition.roundDefId) ?? entry.definition.roundDefId,
      },
    };
  }

  if (isConditionalDefinition(entry.definition)) {
    return {
      ...entry,
      id: nextId,
      name: nextName,
      source: 'user',
      scope: 'personal',
      workspaceId: undefined,
      definition: {
        ...entry.definition,
        id: nextId,
        name: nextName,
        thenDefId: idMap.get(entry.definition.thenDefId) ?? entry.definition.thenDefId,
        elseDefId: idMap.get(entry.definition.elseDefId) ?? entry.definition.elseDefId,
      },
    };
  }

  if (isMultiConditionalDefinition(entry.definition)) {
    return {
      ...entry,
      id: nextId,
      name: nextName,
      source: 'user',
      scope: 'personal',
      workspaceId: undefined,
      definition: {
        ...entry.definition,
        id: nextId,
        name: nextName,
        branchDefIds: entry.definition.branchDefIds.map(
          (branchDefId) => idMap.get(branchDefId) ?? branchDefId,
        ),
      },
    };
  }

  return {
    ...entry,
    id: nextId,
    name: nextName,
    source: 'user',
    scope: 'personal',
    workspaceId: undefined,
    definition: {
      ...(entry.definition as Record<string, unknown>),
      id: nextId,
      name: nextName,
    },
  } as CompositeLibraryEntry;
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
