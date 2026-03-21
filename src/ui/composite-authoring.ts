import type { CompositeLibraryEntry, CompositePortBinding } from '../engine/composites';
import type { Connection, ModuleRegistry, Project } from '../engine/types';
import { validateCompositeDef } from '../engine/validation';

interface CreateCompositeFromSelectionArgs {
  project: Project;
  registry: ModuleRegistry;
  name: string;
  id: string;
  selectedModuleIds: string[];
}

export interface CreateCompositeResult {
  ok: boolean;
  entry?: CompositeLibraryEntry;
  error?: string;
}

export function createCompositeFromSelection({
  project,
  registry,
  name,
  id,
  selectedModuleIds,
}: CreateCompositeFromSelectionArgs): CreateCompositeResult {
  const trimmedName = name.trim();
  const trimmedId = id.trim();

  if (!trimmedName) {
    return { ok: false, error: 'Composite name is required.' };
  }

  if (!trimmedId) {
    return { ok: false, error: 'Composite id is required.' };
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmedId)) {
    return {
      ok: false,
      error: 'Composite id must start with a letter and use only letters, numbers, underscores, or hyphens.',
    };
  }

  if (registry[trimmedId]) {
    return {
      ok: false,
      error: `A module definition named "${trimmedId}" already exists.`,
    };
  }

  const selectedIdSet = new Set(selectedModuleIds);
  if (selectedIdSet.size === 0) {
    return { ok: false, error: 'Select at least one module to create a composite.' };
  }

  const selectedModules = project.modules
    .filter((moduleInstance) => selectedIdSet.has(moduleInstance.id))
    .map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    }));

  if (selectedModules.length === 0) {
    return { ok: false, error: 'Selected modules were not found in the current project.' };
  }

  const internalConnections = project.connections
    .filter(
      (connection) =>
        selectedIdSet.has(connection.from.moduleId) &&
        selectedIdSet.has(connection.to.moduleId),
    )
    .map(cloneConnection);

  const incomingBoundaryConnections = project.connections.filter(
    (connection) =>
      !selectedIdSet.has(connection.from.moduleId) &&
      selectedIdSet.has(connection.to.moduleId),
  );
  const outgoingBoundaryConnections = project.connections.filter(
    (connection) =>
      selectedIdSet.has(connection.from.moduleId) &&
      !selectedIdSet.has(connection.to.moduleId),
  );

  const inputBindings: CompositePortBinding[] = [];
  const outputBindings: CompositePortBinding[] = [];
  const inputs = buildBoundaryPorts(
    incomingBoundaryConnections,
    registry,
    'input',
    inputBindings,
    selectedModules,
  );
  const outputs = buildBoundaryPorts(
    outgoingBoundaryConnections,
    registry,
    'output',
    outputBindings,
    selectedModules,
  );

  if (inputs.length === 0 && outputs.length === 0) {
    return {
      ok: false,
      error: 'Selection must expose at least one boundary port to become a reusable composite.',
    };
  }

  const entry: CompositeLibraryEntry = {
    id: trimmedId,
    name: trimmedName,
    version: 1,
    definition: {
      id: trimmedId,
      name: trimmedName,
      kind: 'composite',
      version: 1,
      inputs,
      outputs,
      paramSchema: {},
      project: {
        modules: selectedModules,
        connections: internalConnections,
      },
      inputBindings,
      outputBindings,
    },
  };

  const validation = validateCompositeDef(entry.definition, {
    ...registry,
    [entry.id]: entry.definition,
  });

  if (!validation.ok) {
    return {
      ok: false,
      error: validation.issues[0]?.message ?? 'Composite definition is invalid.',
    };
  }

  return { ok: true, entry };
}

function buildBoundaryPorts(
  boundaryConnections: Connection[],
  registry: ModuleRegistry,
  direction: 'input' | 'output',
  bindings: CompositePortBinding[],
  selectedModules: Project['modules'],
) {
  const ports: Array<{ name: string; type: 'symbol' | 'bits' }> = [];
  const usedNames = new Set<string>();
  const seenInternalPorts = new Set<string>();

  for (const connection of boundaryConnections) {
    const targetModuleId =
      direction === 'input' ? connection.to.moduleId : connection.from.moduleId;
    const targetPortName =
      direction === 'input' ? connection.to.port : connection.from.port;
    const internalKey = `${targetModuleId}:${targetPortName}`;

    if (seenInternalPorts.has(internalKey)) {
      continue;
    }

    seenInternalPorts.add(internalKey);

    const moduleInstance = selectedModules.find((candidate) => candidate.id === targetModuleId);
    if (!moduleInstance) {
      continue;
    }

    const def = registry[moduleInstance.defId];
    const portDef = direction === 'input'
      ? def?.inputs.find((port) => port.name === targetPortName)
      : def?.outputs.find((port) => port.name === targetPortName);

    if (!def || !portDef) {
      continue;
    }

    const externalPort = createUniquePortName(
      `${moduleInstance.id}_${targetPortName}`,
      usedNames,
    );

    ports.push({
      name: externalPort,
      type: portDef.type,
    });
    bindings.push({
      externalPort,
      internalModuleId: targetModuleId,
      internalPort: targetPortName,
    });
  }

  return ports;
}

function createUniquePortName(base: string, usedNames: Set<string>) {
  let candidate = sanitizePortName(base);
  let index = 2;

  while (usedNames.has(candidate)) {
    candidate = `${sanitizePortName(base)}_${index}`;
    index += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function sanitizePortName(value: string) {
  return value.replace(/[^A-Za-z0-9_]+/g, '_');
}

function cloneConnection(connection: Connection): Connection {
  return {
    from: { ...connection.from },
    to: { ...connection.to },
  };
}
