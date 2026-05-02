import {
  isCompositeDefinition,
  type CompositeDef,
  type CompositeLibraryEntry,
  type CompositePortBinding,
} from '../engine/composites';
import type { Connection, ModuleParams, ModuleRegistry, Project, SignalType } from '../engine/types';
import { validateCompositeDef } from '../engine/validation';

interface CreateCompositeFromSelectionArgs {
  project: Project;
  registry: ModuleRegistry;
  name: string;
  id: string;
  selectedModuleIds: string[];
  excludedBoundaryPortKeys?: string[];
  portNameOverrides?: Record<string, string>;
  purpose?: string;
}

interface ReplaceSelectionWithCompositeArgs {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
  entry: CompositeLibraryEntry;
  selectedModuleIds: string[];
}

interface UnzipCompositeInstanceArgs {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
  entry: CompositeLibraryEntry;
  moduleId: string;
  moduleParams?: ModuleParams;
}

export interface CreateCompositeResult {
  ok: boolean;
  entry?: CompositeLibraryEntry;
  error?: string;
}

export interface CompositeSelectionPreview {
  ok: boolean;
  moduleCount: number;
  internalConnectionCount: number;
  inputs: Array<{ name: string; type: SignalType }>;
  outputs: Array<{ name: string; type: SignalType }>;
  inputCandidates: CompositeBoundaryPortPreview[];
  outputCandidates: CompositeBoundaryPortPreview[];
  error?: string;
}

export interface CompositeBoundaryPortPreview {
  key: string;
  name: string;
  type: SignalType;
  internalModuleId: string;
  internalPort: string;
  included: boolean;
}

export interface ReplaceSelectionResult {
  ok: boolean;
  project?: Project;
  layout?: Record<string, { x: number; y: number }>;
  compositeInstanceId?: string;
  error?: string;
}

export interface UnzipCompositeResult {
  ok: boolean;
  project?: Project;
  layout?: Record<string, { x: number; y: number }>;
  selectedModuleIds?: string[];
  error?: string;
}

export function createCompositeFromSelection({
  project,
  registry,
  name,
  id,
  selectedModuleIds,
  excludedBoundaryPortKeys = [],
  portNameOverrides = {},
  purpose,
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

  const selection = deriveCompositeSelection({
    project,
    registry,
    selectedModuleIds,
    excludedBoundaryPortKeys,
    portNameOverrides,
  });

  if (!selection.ok || !selection.selectedModules || !selection.internalConnections) {
    return { ok: false, error: selection.error };
  }

  const trimmedPurpose = purpose?.trim();
  const definition: CompositeDef = {
    id: trimmedId,
    name: trimmedName,
    kind: 'composite',
    version: 1,
    inputs: selection.inputs,
    outputs: selection.outputs,
    paramSchema: {},
    project: {
      modules: selection.selectedModules,
      connections: selection.internalConnections,
    },
    inputBindings: selection.inputBindings,
    outputBindings: selection.outputBindings,
    ...(trimmedPurpose ? { purpose: trimmedPurpose } : {}),
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

export function previewCompositeSelection({
  project,
  registry,
  selectedModuleIds,
  excludedBoundaryPortKeys = [],
  portNameOverrides = {},
}: Pick<
  CreateCompositeFromSelectionArgs,
  'project' | 'registry' | 'selectedModuleIds' | 'excludedBoundaryPortKeys' | 'portNameOverrides'
>): CompositeSelectionPreview {
  const selection = deriveCompositeSelection({
    project,
    registry,
    selectedModuleIds,
    excludedBoundaryPortKeys,
    portNameOverrides,
  });

  return {
    ok: selection.ok,
    moduleCount: selection.selectedModules?.length ?? 0,
    internalConnectionCount: selection.internalConnections?.length ?? 0,
    inputs: selection.inputs,
    outputs: selection.outputs,
    inputCandidates: selection.inputCandidates,
    outputCandidates: selection.outputCandidates,
    error: selection.error,
  };
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

export function unzipCompositeInstance({
  project,
  layout,
  entry,
  moduleId,
  moduleParams = {},
}: UnzipCompositeInstanceArgs): UnzipCompositeResult {
  const definition = entry.definition;

  if (!isCompositeDefinition(definition)) {
    return { ok: false, error: 'Only composite definitions can be unzipped into the workspace.' };
  }

  const compositeModule = project.modules.find((moduleInstance) => moduleInstance.id === moduleId);
  if (!compositeModule || compositeModule.defId !== entry.id) {
    return { ok: false, error: 'Selected composite instance was not found in the current project.' };
  }

  const resolvedInternalProject = applyForwardedCompositeParams(definition, moduleParams);
  const existingModuleIds = new Set(project.modules.map((moduleInstance) => moduleInstance.id));
  const internalIdMap = new Map<string, string>();

  for (const internalModule of resolvedInternalProject.modules) {
    internalIdMap.set(
      internalModule.id,
      createDerivedModuleInstanceId(existingModuleIds, moduleId, internalModule.id),
    );
  }

  const unaffectedModules = project.modules
    .filter((moduleInstance) => moduleInstance.id !== moduleId)
    .map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    }));
  const unaffectedConnections = project.connections
    .filter(
      (connection) =>
        connection.from.moduleId !== moduleId && connection.to.moduleId !== moduleId,
    )
    .map(cloneConnection);
  const incomingBoundaryConnections = project.connections.filter(
    (connection) => connection.to.moduleId === moduleId,
  );
  const outgoingBoundaryConnections = project.connections.filter(
    (connection) => connection.from.moduleId === moduleId,
  );

  const internalModules = resolvedInternalProject.modules.map((internalModule) => ({
    ...internalModule,
    id: internalIdMap.get(internalModule.id) ?? internalModule.id,
    params: { ...internalModule.params },
  }));
  const internalConnections = resolvedInternalProject.connections.map((connection) => ({
    from: {
      moduleId: internalIdMap.get(connection.from.moduleId) ?? connection.from.moduleId,
      port: connection.from.port,
    },
    to: {
      moduleId: internalIdMap.get(connection.to.moduleId) ?? connection.to.moduleId,
      port: connection.to.port,
    },
  }));

  const rewiredIncoming = incomingBoundaryConnections.map((connection) => {
    const binding = definition.inputBindings.find(
      (candidate) => candidate.externalPort === connection.to.port,
    );
    if (!binding) {
      return null;
    }
    return {
      from: { ...connection.from },
      to: {
        moduleId: internalIdMap.get(binding.internalModuleId) ?? binding.internalModuleId,
        port: binding.internalPort,
      },
    };
  });
  const rewiredOutgoing = outgoingBoundaryConnections.map((connection) => {
    const binding = definition.outputBindings.find(
      (candidate) => candidate.externalPort === connection.from.port,
    );
    if (!binding) {
      return null;
    }
    return {
      from: {
        moduleId: internalIdMap.get(binding.internalModuleId) ?? binding.internalModuleId,
        port: binding.internalPort,
      },
      to: { ...connection.to },
    };
  });

  if (
    rewiredIncoming.some((connection) => connection === null) ||
    rewiredOutgoing.some((connection) => connection === null)
  ) {
    return {
      ok: false,
      error: 'Unable to reconnect the composite boundary bindings while unzipping.',
    };
  }

  const compositePosition = layout[moduleId] ?? { x: 80, y: 80 };
  const unzippedLayout = buildUnzippedLayout(
    definition,
    internalModules.map((internalModule) => internalModule.id),
    internalIdMap,
    compositePosition,
  );

  return {
    ok: true,
    project: {
      modules: [...unaffectedModules, ...internalModules],
      connections: [
        ...unaffectedConnections,
        ...internalConnections,
        ...(rewiredIncoming as Connection[]),
        ...(rewiredOutgoing as Connection[]),
      ],
    },
    layout: {
      ...Object.fromEntries(
        Object.entries(layout).filter(([candidateModuleId]) => candidateModuleId !== moduleId),
      ),
      ...unzippedLayout,
    },
    selectedModuleIds: internalModules.map((internalModule) => internalModule.id),
  };
}

function buildBoundaryPorts(
  boundaryConnections: Connection[],
  registry: ModuleRegistry,
  direction: 'input' | 'output',
  bindings: CompositePortBinding[],
  candidates: CompositeBoundaryPortPreview[],
  selectedModules: Project['modules'],
  excludedBoundaryPortKeys: Set<string>,
  portNameOverrides: Record<string, string> = {},
) {
  const ports: Array<{ name: string; type: SignalType }> = [];
  const usedNames = new Set<string>();
  const seenInternalPorts = new Set<string>();

  for (const connection of boundaryConnections) {
    const targetModuleId =
      direction === 'input' ? connection.to.moduleId : connection.from.moduleId;
    const targetPortName =
      direction === 'input' ? connection.to.port : connection.from.port;
    const internalKey = `${targetModuleId}:${targetPortName}`;
    const boundaryPortKey = `${direction}:${internalKey}`;

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

    const overrideName = portNameOverrides[boundaryPortKey]?.trim();
    const baseName = overrideName
      ? sanitizePortName(overrideName) || `${moduleInstance.id}_${targetPortName}`
      : `${moduleInstance.id}_${targetPortName}`;
    const externalPort = createUniquePortName(baseName, usedNames);

    const included = !excludedBoundaryPortKeys.has(boundaryPortKey);
    candidates.push({
      key: boundaryPortKey,
      name: externalPort,
      type: portDef.type,
      internalModuleId: targetModuleId,
      internalPort: targetPortName,
      included,
    });

    if (!included) {
      continue;
    }

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

function deriveCompositeSelection({
  project,
  registry,
  selectedModuleIds,
  excludedBoundaryPortKeys = [],
  portNameOverrides = {},
}: Pick<
  CreateCompositeFromSelectionArgs,
  'project' | 'registry' | 'selectedModuleIds' | 'excludedBoundaryPortKeys' | 'portNameOverrides'
>): {
  ok: boolean;
  selectedModules?: Project['modules'];
  internalConnections?: Project['connections'];
  inputBindings: CompositePortBinding[];
  outputBindings: CompositePortBinding[];
  inputs: Array<{ name: string; type: SignalType }>;
  outputs: Array<{ name: string; type: SignalType }>;
  inputCandidates: CompositeBoundaryPortPreview[];
  outputCandidates: CompositeBoundaryPortPreview[];
  error?: string;
} {
  const excludedBoundaryPortKeySet = new Set(excludedBoundaryPortKeys);
  const selectedIdSet = new Set(selectedModuleIds);
  if (selectedIdSet.size === 0) {
    return {
      ok: false,
      inputBindings: [],
      outputBindings: [],
      inputs: [],
      outputs: [],
      inputCandidates: [],
      outputCandidates: [],
      error: 'Select at least one module to create a composite.',
    };
  }

  const selectedModules = project.modules
    .filter((moduleInstance) => selectedIdSet.has(moduleInstance.id))
    .map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    }));

  if (selectedModules.length === 0) {
    return {
      ok: false,
      inputBindings: [],
      outputBindings: [],
      inputs: [],
      outputs: [],
      inputCandidates: [],
      outputCandidates: [],
      error: 'Selected modules were not found in the current project.',
    };
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
  const inputCandidates: CompositeBoundaryPortPreview[] = [];
  const outputCandidates: CompositeBoundaryPortPreview[] = [];
  const inputs = buildBoundaryPorts(
    incomingBoundaryConnections,
    registry,
    'input',
    inputBindings,
    inputCandidates,
    selectedModules,
    excludedBoundaryPortKeySet,
    portNameOverrides,
  );
  const outputs = buildBoundaryPorts(
    outgoingBoundaryConnections,
    registry,
    'output',
    outputBindings,
    outputCandidates,
    selectedModules,
    excludedBoundaryPortKeySet,
    portNameOverrides,
  );

  if (inputs.length === 0 && outputs.length === 0) {
    return {
      ok: false,
      selectedModules,
      internalConnections,
      inputBindings,
      outputBindings,
      inputs,
      outputs,
      inputCandidates,
      outputCandidates,
      error: 'Selection must include at least one boundary port to become a reusable composite.',
    };
  }

  return {
    ok: true,
    selectedModules,
    internalConnections,
    inputBindings,
    outputBindings,
    inputs,
    outputs,
    inputCandidates,
    outputCandidates,
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

function createDerivedModuleInstanceId(
  existingModuleIds: Set<string>,
  compositeModuleId: string,
  internalModuleId: string,
) {
  const base = `${compositeModuleId}-${internalModuleId}`
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .toLowerCase();
  let candidate = base;
  let index = 2;
  while (existingModuleIds.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  existingModuleIds.add(candidate);
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

function applyForwardedCompositeParams(
  def: CompositeDef,
  params: ModuleParams,
): Project {
  if (!def.forwardedParams?.length) {
    return def.project;
  }

  const forwardedByModuleId = new Map<string, Record<string, unknown>>();
  for (const binding of def.forwardedParams) {
    const value = params[binding.externalParam];
    if (value === undefined) {
      continue;
    }

    forwardedByModuleId.set(binding.internalModuleId, {
      ...(forwardedByModuleId.get(binding.internalModuleId) ?? {}),
      [binding.internalParamKey]: value,
    });
  }

  return {
    modules: def.project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: forwardedByModuleId.has(moduleInstance.id)
        ? {
            ...moduleInstance.params,
            ...forwardedByModuleId.get(moduleInstance.id),
          }
        : { ...moduleInstance.params },
    })),
    connections: def.project.connections.map(cloneConnection),
  };
}

function buildUnzippedLayout(
  definition: CompositeDef,
  internalModuleIds: string[],
  internalIdMap: Map<string, string>,
  compositePosition: { x: number; y: number },
) {
  const baseLayout = definition.layout;
  if (!baseLayout || Object.keys(baseLayout).length === 0) {
    return Object.fromEntries(
      internalModuleIds.map((internalModuleId, index) => [
        internalModuleId,
        {
          x: compositePosition.x + (index % 3) * 180,
          y: compositePosition.y + Math.floor(index / 3) * 120,
        },
      ]),
    );
  }

  const sourcePositions = Object.values(baseLayout);
  const minX = Math.min(...sourcePositions.map((position) => position.x));
  const minY = Math.min(...sourcePositions.map((position) => position.y));
  const maxX = Math.max(...sourcePositions.map((position) => position.x));
  const maxY = Math.max(...sourcePositions.map((position) => position.y));
  const centerX = Math.round((minX + maxX) / 2);
  const centerY = Math.round((minY + maxY) / 2);
  const offsetX = compositePosition.x - centerX;
  const offsetY = compositePosition.y - centerY;

  return Object.fromEntries(
    Object.entries(baseLayout).map(([internalModuleId, position]) => [
      internalIdMap.get(internalModuleId) ?? internalModuleId,
      {
        x: position.x + offsetX,
        y: position.y + offsetY,
      },
    ]),
  );
}
