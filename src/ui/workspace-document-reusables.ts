import {
  isBuiltInCompositeLibraryEntry,
  isClockedIteratorDefinition,
  isCompositeDefinition,
  isConditionalDefinition,
  isIteratorDefinition,
  isMultiConditionalDefinition,
  type ClockedIteratorDef,
  type CompositeDef,
  type CompositeLibraryEntry,
  type ConditionalDef,
  type IteratorDef,
  type MultiConditionalDef,
} from '../engine/composites';
import type { Project } from '../engine/types';
import type { CompositeLibraryDocument, WorkbenchDocument } from './workbench-document';

interface PreparedWorkbenchDocumentImport {
  document: WorkbenchDocument;
  reusableEntriesToAdd: CompositeLibraryEntry[];
}

export function buildEmbeddedCompositeLibraryForProject(
  project: Project,
  compositeLibrary: CompositeLibraryEntry[],
): CompositeLibraryDocument | undefined {
  const reusableById = new Map(
    compositeLibrary
      .filter((entry) => !isBuiltInCompositeLibraryEntry(entry))
      .map((entry) => [entry.id, entry]),
  );
  const visited = new Set<string>();
  const orderedIds: string[] = [];

  for (const moduleInstance of project.modules) {
    collectReusableDependencies(moduleInstance.defId, reusableById, visited, orderedIds);
  }

  if (orderedIds.length === 0) {
    return undefined;
  }

  return {
    version: 1,
    entries: orderedIds
      .map((id) => reusableById.get(id))
      .filter((entry): entry is CompositeLibraryEntry => Boolean(entry))
      .map(cloneReusableEntry),
  };
}

export function prepareWorkbenchDocumentImport(
  document: WorkbenchDocument,
  existingCompositeLibrary: CompositeLibraryEntry[],
  targetWorkspaceId: string,
): PreparedWorkbenchDocumentImport {
  if (!document.embeddedCompositeLibrary || document.embeddedCompositeLibrary.entries.length === 0) {
    return {
      document: cloneWorkbenchDocument(document),
      reusableEntriesToAdd: [],
    };
  }

  const existingById = new Map(existingCompositeLibrary.map((entry) => [entry.id, entry]));
  const embeddedById = new Map(
    document.embeddedCompositeLibrary.entries.map((entry) => [entry.id, entry]),
  );
  const usedIds = new Set(existingCompositeLibrary.map((entry) => entry.id));
  const idMap = new Map<string, string>();
  const reusableEntriesToAdd: CompositeLibraryEntry[] = [];

  const materializeEntry = (originalId: string): string => {
    const existingMapped = idMap.get(originalId);
    if (existingMapped) {
      return existingMapped;
    }

    const originalEntry = embeddedById.get(originalId);
    if (!originalEntry) {
      idMap.set(originalId, originalId);
      return originalId;
    }

    const dependencyMap = new Map<string, string>();
    for (const dependencyId of getImmediateReusableDependencyIds(originalEntry.definition, embeddedById)) {
      dependencyMap.set(dependencyId, materializeEntry(dependencyId));
    }

    const rewrittenAtOriginalId = rewriteReusableEntry(
      originalEntry,
      originalEntry.id,
      dependencyMap,
    );
    const existingEntry = existingById.get(originalId);
    const hasConflict =
      !!existingEntry && !entriesAreEquivalent(existingEntry, rewrittenAtOriginalId);

    const resolvedId = hasConflict
      ? createUniqueReusableId(originalId, usedIds)
      : originalId;

    const finalEntry = localizeImportedReusableEntry(rewriteReusableEntry(
      originalEntry,
      resolvedId,
      dependencyMap,
    ), targetWorkspaceId);

    idMap.set(originalId, resolvedId);

    if (!existingEntry || hasConflict) {
      reusableEntriesToAdd.push(finalEntry);
      existingById.set(finalEntry.id, finalEntry);
      usedIds.add(finalEntry.id);
    }

    return resolvedId;
  };

  const nextProject = cloneProject(document.project);
  for (const moduleInstance of nextProject.modules) {
    if (embeddedById.has(moduleInstance.defId)) {
      moduleInstance.defId = materializeEntry(moduleInstance.defId);
    }
  }

  const nextEmbeddedLibrary =
    reusableEntriesToAdd.length > 0
      ? {
          version: 1 as const,
          entries: reusableEntriesToAdd.map(cloneReusableEntry),
        }
      : document.embeddedCompositeLibrary;

  return {
    document: {
      ...cloneWorkbenchDocument(document),
      project: nextProject,
      ...(nextEmbeddedLibrary ? { embeddedCompositeLibrary: nextEmbeddedLibrary } : {}),
    },
    reusableEntriesToAdd,
  };
}

function collectReusableDependencies(
  defId: string,
  reusableById: Map<string, CompositeLibraryEntry>,
  visited: Set<string>,
  orderedIds: string[],
) {
  if (visited.has(defId)) {
    return;
  }

  const entry = reusableById.get(defId);
  if (!entry) {
    return;
  }

  visited.add(defId);
  for (const dependencyId of getImmediateReusableDependencyIds(entry.definition, reusableById)) {
    collectReusableDependencies(dependencyId, reusableById, visited, orderedIds);
  }
  orderedIds.push(defId);
}

export function getImmediateReusableDependencyIds(
  definition:
    | CompositeDef
    | IteratorDef
    | ClockedIteratorDef
    | ConditionalDef
    | MultiConditionalDef,
  reusableById: Map<string, CompositeLibraryEntry>,
) {
  if (isCompositeDefinition(definition)) {
    return definition.project.modules
      .map((moduleInstance) => moduleInstance.defId)
      .filter((defId) => reusableById.has(defId));
  }

  if (isIteratorDefinition(definition) || isClockedIteratorDefinition(definition)) {
    return reusableById.has(definition.roundDefId) ? [definition.roundDefId] : [];
  }

  if (isConditionalDefinition(definition)) {
    return [definition.thenDefId, definition.elseDefId].filter((defId) => reusableById.has(defId));
  }

  if (isMultiConditionalDefinition(definition)) {
    return definition.branchDefIds.filter((defId) => reusableById.has(defId));
  }

  return [];
}

function rewriteReusableEntry(
  entry: CompositeLibraryEntry,
  nextId: string,
  dependencyMap: Map<string, string>,
): CompositeLibraryEntry {
  const cloned = cloneReusableEntry(entry);
  cloned.id = nextId;
  cloned.definition.id = nextId;

  if (isCompositeDefinition(cloned.definition)) {
    cloned.definition.project.modules = cloned.definition.project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
      defId: dependencyMap.get(moduleInstance.defId) ?? moduleInstance.defId,
    }));
    return cloned;
  }

  if (isIteratorDefinition(cloned.definition) || isClockedIteratorDefinition(cloned.definition)) {
    cloned.definition.roundDefId =
      dependencyMap.get(cloned.definition.roundDefId) ?? cloned.definition.roundDefId;
    return cloned;
  }

  if (isConditionalDefinition(cloned.definition)) {
    cloned.definition.thenDefId =
      dependencyMap.get(cloned.definition.thenDefId) ?? cloned.definition.thenDefId;
    cloned.definition.elseDefId =
      dependencyMap.get(cloned.definition.elseDefId) ?? cloned.definition.elseDefId;
    return cloned;
  }

  if (isMultiConditionalDefinition(cloned.definition)) {
    cloned.definition.branchDefIds = cloned.definition.branchDefIds.map(
      (branchDefId) => dependencyMap.get(branchDefId) ?? branchDefId,
    );
  }

  return cloned;
}

function localizeImportedReusableEntry(
  entry: CompositeLibraryEntry,
  workspaceId: string,
): CompositeLibraryEntry {
  if (entry.source === 'built-in') {
    return entry;
  }

  if (entry.scope === 'personal') {
    return entry;
  }

  return {
    ...entry,
    source: 'user',
    scope: 'workspace',
    workspaceId,
  };
}

function createUniqueReusableId(baseId: string, usedIds: Set<string>) {
  const normalizedBase =
    baseId
      .trim()
      .replace(/[^A-Za-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'ImportedReusable';
  let candidate = `${normalizedBase}-imported`;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${normalizedBase}-imported-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function entriesAreEquivalent(left: CompositeLibraryEntry, right: CompositeLibraryEntry) {
  return JSON.stringify(normalizeReusableEntry(left)) === JSON.stringify(normalizeReusableEntry(right));
}

function normalizeReusableEntry(entry: CompositeLibraryEntry) {
  const cloned = cloneReusableEntry(entry);
  cloned.source = cloned.source ?? 'user';
  if (cloned.source !== 'built-in') {
    cloned.scope = cloned.scope ?? 'personal';
  }
  return cloned;
}

function cloneProject(project: Project): Project {
  return {
    modules: project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    })),
    connections: project.connections.map((connection) => ({
      from: { ...connection.from },
      to: { ...connection.to },
    })),
  };
}

function cloneReusableEntry(entry: CompositeLibraryEntry): CompositeLibraryEntry {
  const source = entry.source ?? 'user';
  const scope = source === 'built-in' ? undefined : entry.scope ?? 'personal';
  if (isCompositeDefinition(entry.definition)) {
    return {
      ...entry,
      source,
      ...(scope ? { scope } : {}),
      ...(scope === 'workspace' && entry.workspaceId ? { workspaceId: entry.workspaceId } : { workspaceId: undefined }),
      definition: {
        ...entry.definition,
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
        forwardedParams: entry.definition.forwardedParams?.map((binding) => ({ ...binding })),
      },
    };
  }

  return {
    ...entry,
    source,
    ...(scope ? { scope } : {}),
    ...(scope === 'workspace' && entry.workspaceId ? { workspaceId: entry.workspaceId } : { workspaceId: undefined }),
    definition: {
      ...entry.definition,
      ...(isMultiConditionalDefinition(entry.definition)
        ? { branchDefIds: [...entry.definition.branchDefIds] }
        : {}),
    },
  };
}

function cloneWorkbenchDocument(document: WorkbenchDocument): WorkbenchDocument {
  return {
    version: 1,
    project: cloneProject(document.project),
    ui: {
      layout: Object.fromEntries(
        Object.entries(document.ui.layout).map(([moduleId, position]) => [moduleId, { ...position }]),
      ),
      annotations: document.ui.annotations.map((annotation) => ({ ...annotation })),
      stageLabels: document.ui.stageLabels?.map((stageLabel) => ({ ...stageLabel })),
      groupBoxes: document.ui.groupBoxes?.map((groupBox) => ({ ...groupBox })),
      guideRails: document.ui.guideRails?.map((guideRail) => ({ ...guideRail })),
      showFurniture: document.ui.showFurniture,
      showOverviewNavigator: document.ui.showOverviewNavigator,
      showGrid: document.ui.showGrid,
      snapToGrid: document.ui.snapToGrid,
      snapToGuides: document.ui.snapToGuides,
      layoutDirection: document.ui.layoutDirection,
      routingMode: document.ui.routingMode,
      wireColorMode: document.ui.wireColorMode,
      connectionLayout: document.ui.connectionLayout
        ? Object.fromEntries(
            Object.entries(document.ui.connectionLayout).map(([key, layout]) => [
              key,
              {
                ...(layout.orthogonalBend ? { orthogonalBend: { ...layout.orthogonalBend } } : {}),
                ...(layout.orthogonalAnchors
                  ? { orthogonalAnchors: layout.orthogonalAnchors.map((anchor) => ({ ...anchor })) }
                  : {}),
                ...(layout.orthogonalLanePreference
                  ? { orthogonalLanePreference: layout.orthogonalLanePreference }
                  : {}),
                ...(layout.colorOverride ? { colorOverride: layout.colorOverride } : {}),
              },
            ]),
          )
        : undefined,
    },
    embeddedCompositeLibrary: document.embeddedCompositeLibrary
      ? {
          version: 1,
          entries: document.embeddedCompositeLibrary.entries.map(cloneReusableEntry),
        }
      : undefined,
  };
}
