import { getReusableScope, isBuiltInCompositeLibraryEntry, type CompositeLibraryEntry } from '../engine/composites';
import type { Project } from '../engine/types';
import { getImmediateReusableDependencyIds } from './workspace-document-reusables';

export interface ReusableReferenceProject {
  id: string;
  name: string;
  project: Project;
}

export interface ReusablePlacedReference {
  projectId: string;
  projectName: string;
  count: number;
}

export interface ReusableDefinitionReference {
  id: string;
  name: string;
  scope: 'built-in' | 'workspace' | 'personal';
  scopeLabel: 'Built-In' | 'This Workspace' | 'Workspace Local' | 'Personal Library';
}

export interface ReusableReferenceSummary {
  placedReferences: ReusablePlacedReference[];
  definitionReferences: ReusableDefinitionReference[];
  placedCount: number;
  definitionReferenceCount: number;
  compactSummary: string;
  deleteBlockReason: string | null;
}

export function buildReusableReferenceSummaries(
  compositeLibrary: CompositeLibraryEntry[],
  projects: ReusableReferenceProject[],
  activeWorkspaceId: string,
): Record<string, ReusableReferenceSummary> {
  return Object.fromEntries(
    compositeLibrary.map((entry) => [
      entry.id,
      buildReusableReferenceSummary(entry.id, compositeLibrary, projects, activeWorkspaceId),
    ]),
  );
}

export function buildReusableReferenceSummary(
  reusableId: string,
  compositeLibrary: CompositeLibraryEntry[],
  projects: ReusableReferenceProject[],
  activeWorkspaceId: string,
): ReusableReferenceSummary {
  const reusableById = new Map(compositeLibrary.map((entry) => [entry.id, entry]));
  const placedReferences = projects
    .map((project) => ({
      projectId: project.id,
      projectName: project.name,
      count: project.project.modules.filter((moduleInstance) => moduleInstance.defId === reusableId).length,
    }))
    .filter((reference) => reference.count > 0);
  const definitionReferences = compositeLibrary
    .filter((entry) => entry.id !== reusableId)
    .filter((entry) => getImmediateReusableDependencyIds(entry.definition, reusableById).includes(reusableId))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      scope: getReusableScope(entry),
      scopeLabel: getReusableReferenceScopeLabel(entry, activeWorkspaceId),
    }));
  const placedCount = placedReferences.reduce((sum, reference) => sum + reference.count, 0);
  const definitionReferenceCount = definitionReferences.length;

  return {
    placedReferences,
    definitionReferences,
    placedCount,
    definitionReferenceCount,
    compactSummary: formatReferenceSummary(placedCount, definitionReferenceCount),
    deleteBlockReason: formatDeleteBlockReason(placedCount, definitionReferenceCount),
  };
}

function getReusableReferenceScopeLabel(
  entry: CompositeLibraryEntry,
  activeWorkspaceId: string,
): ReusableDefinitionReference['scopeLabel'] {
  if (isBuiltInCompositeLibraryEntry(entry)) {
    return 'Built-In';
  }

  if ((entry.scope ?? 'personal') === 'personal') {
    return 'Personal Library';
  }

  return entry.workspaceId === activeWorkspaceId ? 'This Workspace' : 'Workspace Local';
}

function formatReferenceSummary(placedCount: number, definitionReferenceCount: number) {
  if (placedCount === 0 && definitionReferenceCount === 0) {
    return 'No saved-local references';
  }

  const parts: string[] = [];
  if (placedCount > 0) {
    parts.push(`Placed ${placedCount} time${placedCount === 1 ? '' : 's'} in saved local work`);
  }
  if (definitionReferenceCount > 0) {
    parts.push(`Referenced by ${definitionReferenceCount} reusable${definitionReferenceCount === 1 ? '' : 's'}`);
  }

  return parts.join(' · ');
}

function formatDeleteBlockReason(placedCount: number, definitionReferenceCount: number) {
  if (placedCount > 0 && definitionReferenceCount > 0) {
    return 'Delete unavailable while this reusable is placed in saved local work and referenced by another reusable.';
  }
  if (placedCount > 0) {
    return 'Delete unavailable while this reusable is placed in saved local work.';
  }
  if (definitionReferenceCount > 0) {
    return 'Delete unavailable while another reusable references this reusable.';
  }
  return null;
}
