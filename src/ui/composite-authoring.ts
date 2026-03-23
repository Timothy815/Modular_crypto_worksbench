import {
  isCompositeDefinition,
  type CompositeDef,
  type CompositeLibraryEntry,
  type CompositePortBinding,
} from '../engine/composites';
import type { Connection, ModuleRegistry, Project } from '../engine/types';
import { validateCompositeDef } from '../engine/validation';

interface CreateCompositeFromSelectionArgs {
  project: Project;
  registry: ModuleRegistry;
  name: string;
  id: string;
  selectedModuleIds: string[];
}

interface ReplaceSelectionWithCompositeArgs {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
  entry: CompositeLibraryEntry;
  selectedModuleIds: string[];
}

export interface CreateCompositeResult {
  ok: boolean;
  entry?: CompositeLibraryEntry;
  error?: string;
}

export interface ReplaceSelectionResult {
  ok: boolean;
  project?: Project;
  layout?: Record<string, { x: number; y: number }>;
  compositeInstanceId?: string;
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

  const definition: CompositeDef = {
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
  };

  const entry: CompositeLibraryEntry = {
    id: trimmedId,
    name: trimmedName,
    version: 1,
    source: 'user',
    definition,
  };

  const validation = validateCompositeDef(definition, {
    ...registry,
    [entry.id]: definition,
  });

  if (!validation.ok) {
    return {
      ok: false,
      error: validation.issues[0]?.message ?? 'Composite definition is invalid.',
    };
  }

  return { ok: true, entry };
}

export function replaceSelectionWithComposite({
  project,
  layout,
  entry,
  selectedModuleIds,
}: ReplaceSelectionWithCompositeArgs): ReplaceSelectionResult {
  const definition = entry.definition;

  if (!isCompositeDefinition(definition)) {
    return { ok: false, error: 'Only composite definitions can replace a selected subgraph.' };
  }

  const selectedIdSet = new Set(selectedModuleIds);
  if (selectedIdSet.size === 0) {
    return { ok: false, error: 'Select at least one module to replace.' };
  }

  const selectedModules = project.modules.filter((moduleInstance) => selectedIdSet.has(moduleInstance.id));
  if (selectedModules.length === 0) {
    return { ok: false, error: 'Selected modules were not found in the current project.' };
  }

  const compositeInstanceId = createModuleInstanceId(project, entry.id);
  const unaffectedModules = project.modules
    .filter((moduleInstance) => !selectedIdSet.has(moduleInstance.id))
    .map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    }));
  const unaffectedConnections = project.connections
    .filter(
      (connection) =>
        !selectedIdSet.has(connection.from.moduleId) &&
        !selectedIdSet.has(connection.to.moduleId),
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

  const rewiredIncoming = incomingBoundaryConnections.map((connection) => {
    const binding = definition.inputBindings.find(
      (candidate: CompositePortBinding) =>
        candidate.internalModuleId === connection.to.moduleId &&
        candidate.internalPort === connection.to.port,
    );
    if (!binding) {
      return null;
    }

    return {
      from: { ...connection.from },
      to: { moduleId: compositeInstanceId, port: binding.externalPort },
    };
  });
  const rewiredOutgoing = outgoingBoundaryConnections.map((connection) => {
    const binding = definition.outputBindings.find(
      (candidate: CompositePortBinding) =>
        candidate.internalModuleId === connection.from.moduleId &&
        candidate.internalPort === connection.from.port,
    );
    if (!binding) {
      return null;
    }

    return {
      from: { moduleId: compositeInstanceId, port: binding.externalPort },
      to: { ...connection.to },
    };
  });

  if (rewiredIncoming.some((connection) => connection === null) || rewiredOutgoing.some((connection) => connection === null)) {
    return {
      ok: false,
      error: 'Unable to reconnect all boundary ports when replacing the selection.',
    };
  }

  const centroid = getSelectionCentroid(selectedModules, layout);

  return {
    ok: true,
    compositeInstanceId,
    project: {
      modules: [
        ...unaffectedModules,
        {
          id: compositeInstanceId,
          defId: entry.id,
          params: {},
        },
      ],
      connections: [
        ...unaffectedConnections,
        ...(rewiredIncoming as Connection[]),
        ...(rewiredOutgoing as Connection[]),
      ],
    },
    layout: {
      ...Object.fromEntries(
        Object.entries(layout).filter(([moduleId]) => !selectedIdSet.has(moduleId)),
      ),
      [compositeInstanceId]: centroid,
    },
  };
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

function createModuleInstanceId(project: Project, defId: string) {
  const prefix = defId.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  let index = 1;
  let candidate = `${prefix}-${index}`;

  while (project.modules.some((moduleInstance) => moduleInstance.id === candidate)) {
    index += 1;
    candidate = `${prefix}-${index}`;
  }

  return candidate;
}

function getSelectionCentroid(
  modules: Project['modules'],
  layout: Record<string, { x: number; y: number }>,
) {
  const positions = modules
    .map((moduleInstance) => layout[moduleInstance.id])
    .filter((position): position is { x: number; y: number } => Boolean(position));

  if (positions.length === 0) {
    return { x: 80, y: 80 };
  }

  const x = Math.round(positions.reduce((sum, position) => sum + position.x, 0) / positions.length);
  const y = Math.round(positions.reduce((sum, position) => sum + position.y, 0) / positions.length);

  return { x, y };
}
