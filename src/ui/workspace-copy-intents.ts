import {
  createUniqueWorkspaceId,
  createWorkspaceNameFromBase,
} from './workspace-artifacts';

export function promptForDuplicateWorkspace({
  sourceName,
  existingNames,
  usedIds,
}: {
  sourceName: string;
  existingNames: Set<string>;
  usedIds: Set<string>;
}) {
  const suggestedName = createWorkspaceNameFromBase(`${sourceName} Copy`, existingNames);
  const proposedName = window.prompt('Duplicate workspace as:', suggestedName);
  const name = proposedName?.trim();
  if (!name) {
    return null;
  }

  return {
    name,
    workspaceId: createUniqueWorkspaceId(name, usedIds),
  };
}

export function promptForCopiedClusterWorkspace({
  sourceName,
  existingNames,
  usedIds,
}: {
  sourceName: string;
  existingNames: Set<string>;
  usedIds: Set<string>;
}) {
  const suggestedName = createWorkspaceNameFromBase(`${sourceName} Cluster`, existingNames);
  const proposedName = window.prompt('Copy cluster to new workspace as:', suggestedName);
  const name = proposedName?.trim();
  if (!name) {
    return null;
  }

  return {
    name,
    workspaceId: createUniqueWorkspaceId(name, usedIds),
  };
}
