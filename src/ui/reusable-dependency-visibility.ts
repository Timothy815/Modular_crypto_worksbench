import {
  getReusableScope,
  isBuiltInCompositeLibraryEntry,
  type CompositeLibraryEntry,
} from '../engine/composites';
import { getImmediateReusableDependencyIds } from './workspace-document-reusables';

export type ReusableDependencyScopeLabel =
  | 'Built-In'
  | 'This Workspace'
  | 'Workspace Local'
  | 'Personal Library';

export interface ImmediateReusableDependencySummary {
  id: string;
  name: string;
  scope: 'built-in' | 'workspace' | 'personal';
  scopeLabel: ReusableDependencyScopeLabel;
}

export interface ReusableDependencyVisibility {
  immediateDependencies: ImmediateReusableDependencySummary[];
  builtInCount: number;
  workspaceCount: number;
  personalCount: number;
  hasWorkspaceLocalDependencies: boolean;
  summary: string;
  promotionWarning: string | null;
}

export function getReusableDependencyVisibility(
  entry: CompositeLibraryEntry,
  compositeLibrary: CompositeLibraryEntry[],
  activeWorkspaceId: string,
): ReusableDependencyVisibility {
  const reusableById = new Map(compositeLibrary.map((candidate) => [candidate.id, candidate]));
  const immediateDependencies = getImmediateReusableDependencyIds(entry.definition, reusableById)
    .map((dependencyId) => reusableById.get(dependencyId))
    .filter((dependency): dependency is CompositeLibraryEntry => Boolean(dependency))
    .map((dependency) => ({
      id: dependency.id,
      name: dependency.name,
      scope: getReusableScope(dependency),
      scopeLabel: getReusableScopeLabel(dependency, activeWorkspaceId),
    }));

  const builtInCount = immediateDependencies.filter((dependency) => dependency.scope === 'built-in').length;
  const workspaceCount = immediateDependencies.filter((dependency) => dependency.scope === 'workspace').length;
  const personalCount = immediateDependencies.filter((dependency) => dependency.scope === 'personal').length;
  const hasWorkspaceLocalDependencies = workspaceCount > 0;

  return {
    immediateDependencies,
    builtInCount,
    workspaceCount,
    personalCount,
    hasWorkspaceLocalDependencies,
    summary: formatDependencySummary({ builtInCount, workspaceCount, personalCount }),
    promotionWarning: hasWorkspaceLocalDependencies
      ? [
          'Promoting this reusable does not promote its workspace-local dependencies.',
          'The personal-library copy will still rely on workspace-local internals in this workspace.',
        ].join(' ')
      : null,
  };
}

function getReusableScopeLabel(
  entry: CompositeLibraryEntry,
  activeWorkspaceId: string,
): ReusableDependencyScopeLabel {
  if (isBuiltInCompositeLibraryEntry(entry)) {
    return 'Built-In';
  }

  if ((entry.scope ?? 'personal') === 'personal') {
    return 'Personal Library';
  }

  return entry.workspaceId === activeWorkspaceId ? 'This Workspace' : 'Workspace Local';
}

function formatDependencySummary(counts: {
  builtInCount: number;
  workspaceCount: number;
  personalCount: number;
}) {
  const total = counts.builtInCount + counts.workspaceCount + counts.personalCount;
  if (total === 0 || (counts.builtInCount > 0 && counts.workspaceCount === 0 && counts.personalCount === 0)) {
    return 'Depends on built-ins only';
  }

  const parts: string[] = [];
  if (counts.workspaceCount > 0) {
    parts.push(formatCount(counts.workspaceCount, 'workspace reusable'));
  }
  if (counts.personalCount > 0) {
    parts.push(formatCount(counts.personalCount, 'personal-library reusable'));
  }
  if (counts.builtInCount > 0 && counts.workspaceCount + counts.personalCount > 0) {
    parts.push(formatCount(counts.builtInCount, 'built-in reusable'));
  }

  if (parts.length === 1) {
    return `Depends on ${parts[0]}`;
  }

  if (parts.length === 2) {
    return `Depends on ${parts[0]} and ${parts[1]}`;
  }

  return `Depends on ${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`;
}

function formatCount(count: number, label: string) {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}
