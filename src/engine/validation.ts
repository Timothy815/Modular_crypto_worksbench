import {
  type ConnectionEndpoint,
  type ModuleDefinition,
  type ModuleInstance,
  type ModuleParams,
  type ModuleRegistry,
  type ParamFieldDef,
  type Project,
  type ValidationIssue,
  type ValidationResult,
} from './types';
import {
  isCompositeDefinition,
  isIteratorDefinition,
  type CompositeDef,
  type CompositePortBinding,
  type IteratorDef,
} from './composites';
import { validateAsciiSourceValue } from './modules/ascii-source';
import { validateBaudotSourceValue } from './modules/baudot-source';
import { validateHexSourceValue } from './modules/hex-source';
import { validatePermutationOrderParam } from './modules/permutation';
import { validateSBoxTableParam } from './modules/s-box';

function findPort(def: ModuleDefinition, portName: string, direction: 'input' | 'output') {
  const ports = direction === 'input' ? def.inputs : def.outputs;
  return ports.find((port) => port.name === portName);
}

function buildModuleMaps(project: Project, registry: ModuleRegistry) {
  const issues: ValidationIssue[] = [];
  const instancesById = new Map<string, ModuleInstance>();
  const defsByInstanceId = new Map<string, ModuleDefinition>();

  for (const moduleInstance of project.modules) {
    if (instancesById.has(moduleInstance.id)) {
      issues.push({
        code: 'duplicate-module-id',
        message: `Duplicate module instance id "${moduleInstance.id}".`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    instancesById.set(moduleInstance.id, moduleInstance);

    const def = registry[moduleInstance.defId];
    if (!def) {
      issues.push({
        code: 'unknown-module-def',
        message: `Module instance "${moduleInstance.id}" references unknown definition "${moduleInstance.defId}".`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    defsByInstanceId.set(moduleInstance.id, def);
  }

  return { defsByInstanceId, instancesById, issues };
}

function validateParamValue(field: ParamFieldDef, value: unknown): ValidationIssue['code'] | null {
  switch (field.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'invalid-param-type';
    case 'string':
      return typeof value === 'string' ? null : 'invalid-param-type';
    case 'boolean':
      return typeof value === 'boolean' ? null : 'invalid-param-type';
    case 'bits':
      return Array.isArray(value) && value.every((bit) => bit === 0 || bit === 1)
        ? null
        : 'invalid-param-type';
    case 'wiring': {
      // Must be an array of 26 unique uppercase letters
      if (!Array.isArray(value) || value.length !== 26) return 'invalid-wiring';
      if (!value.every((entry) => typeof entry === 'string' && entry.length === 1 && /^[A-Z]$/.test(entry))) {
        return 'invalid-wiring';
      }
      const unique = new Set(value);
      if (unique.size !== 26) return 'invalid-wiring';
      return null;
    }
    case 'select': {
      if (typeof value !== 'string') return 'invalid-param-type';
      if (!field.options || field.options.length === 0) return null;
      return field.options.some((option) => option.value === value) ? null : 'invalid-param-option';
    }
    default:
      return 'invalid-param-type';
  }
}

function getModuleSpecificParamMessage(
  def: ModuleDefinition,
  field: ParamFieldDef,
  value: unknown,
): string | null {
  if (isCompositeDefinition(def)) {
    return null;
  }

  if (isIteratorDefinition(def)) {
    if (field.key === 'iterationCount') {
      return typeof value === 'number' && Number.isInteger(value) && value > 0
        ? null
        : 'Iteration count must be a positive integer';
    }

    return null;
  }

  if (def.id === 'Permutation' && field.key === 'order') {
    return validatePermutationOrderParam(value);
  }

  if (def.id === 'SBox' && field.key === 'table') {
    return validateSBoxTableParam(value);
  }

  if (def.id === 'HexSource' && field.key === 'value') {
    return validateHexSourceValue(value);
  }

  if (def.id === 'AsciiSource' && field.key === 'value') {
    return validateAsciiSourceValue(value);
  }

  if (def.id === 'BaudotSource' && field.key === 'value') {
    return validateBaudotSourceValue(value);
  }

  return null;
}

function validateParams(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  const schemaKeys = new Set(Object.keys(def.paramSchema));
  const params = moduleInstance.params as ModuleParams;

  for (const field of Object.values(def.paramSchema)) {
    const value = params[field.key];

    if (value === undefined) {
      if (field.required) {
        issues.push({
          code: 'missing-required-param',
          message: `Module "${moduleInstance.id}" is missing required param "${field.key}".`,
          moduleId: moduleInstance.id,
        });
      }
      continue;
    }

    const validationCode = validateParamValue(field, value);
    if (validationCode) {
      let message = `Module "${moduleInstance.id}" has invalid value for param "${field.key}" of kind "${field.kind}".`;

      if (validationCode === 'invalid-param-option') {
        message = `Module "${moduleInstance.id}" has invalid option "${String(value)}" for param "${field.key}".`;
      } else if (validationCode === 'invalid-wiring') {
        message = `Module "${moduleInstance.id}" parameter "${field.key}" must be an array of 26 unique uppercase letters.`;
      }

      issues.push({
        code: validationCode,
        message,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    const moduleSpecificMessage = getModuleSpecificParamMessage(def, field, value);
    if (moduleSpecificMessage) {
      issues.push({
        code: 'invalid-param-type',
        message: `Module "${moduleInstance.id}" parameter "${field.key}" is invalid. ${moduleSpecificMessage}`,
        moduleId: moduleInstance.id,
      });
    }
  }

  for (const key of Object.keys(params)) {
    if (!schemaKeys.has(key)) {
      issues.push({
        code: 'unknown-param',
        message: `Module "${moduleInstance.id}" provided unknown param "${key}".`,
        moduleId: moduleInstance.id,
      });
    }
  }

  if (isCompositeDefinition(def) && def.forwardedParams?.length) {
    validateForwardedParamValues(moduleInstance, def, registry, issues);
  }
}

export function validateProject(project: Project, registry: ModuleRegistry): ValidationResult {
  const { defsByInstanceId, instancesById, issues } = buildModuleMaps(project, registry);
  const inboundEdgeKeys = new Set<string>();
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const moduleInstance of project.modules) {
    adjacency.set(moduleInstance.id, []);
    indegree.set(moduleInstance.id, 0);

    const def = defsByInstanceId.get(moduleInstance.id);
    if (def) {
      validateParams(moduleInstance, def, registry, issues);
    }
  }

  for (const connection of project.connections) {
    const sourceDef = defsByInstanceId.get(connection.from.moduleId);
    const targetDef = defsByInstanceId.get(connection.to.moduleId);

    if (!instancesById.has(connection.from.moduleId)) {
      issues.push({
        code: 'unknown-module-instance',
        message: `Connection source references unknown module "${connection.from.moduleId}".`,
        connection,
      });
      continue;
    }

    if (!instancesById.has(connection.to.moduleId)) {
      issues.push({
        code: 'unknown-module-instance',
        message: `Connection target references unknown module "${connection.to.moduleId}".`,
        connection,
      });
      continue;
    }

    if (!sourceDef || !targetDef) {
      continue;
    }

    const sourcePort = findPort(sourceDef, connection.from.port, 'output');
    if (!sourcePort) {
      issues.push({
        code: 'unknown-port',
        message: `Unknown output port "${connection.from.port}" on module "${connection.from.moduleId}".`,
        moduleId: connection.from.moduleId,
        connection,
      });
      continue;
    }

    const targetPort = findPort(targetDef, connection.to.port, 'input');
    if (!targetPort) {
      issues.push({
        code: 'unknown-port',
        message: `Unknown input port "${connection.to.port}" on module "${connection.to.moduleId}".`,
        moduleId: connection.to.moduleId,
        connection,
      });
      continue;
    }

    const inboundKey = `${connection.to.moduleId}:${connection.to.port}`;
    if (inboundEdgeKeys.has(inboundKey)) {
      issues.push({
        code: 'duplicate-input-connection',
        message: `Input "${connection.to.port}" on module "${connection.to.moduleId}" has more than one incoming connection.`,
        moduleId: connection.to.moduleId,
        connection,
      });
      continue;
    }

    inboundEdgeKeys.add(inboundKey);

    if (sourcePort.type !== targetPort.type) {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Signal type mismatch from "${connection.from.moduleId}.${connection.from.port}" to "${connection.to.moduleId}.${connection.to.port}".`,
        connection,
      });
      continue;
    }

    adjacency.get(connection.from.moduleId)?.push(connection.to.moduleId);
    indegree.set(
      connection.to.moduleId,
      (indegree.get(connection.to.moduleId) ?? 0) + 1,
    );
  }

  const ready = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([moduleId]) => moduleId);
  let visitedCount = 0;

  while (ready.length > 0) {
    const moduleId = ready.shift();
    if (!moduleId) {
      continue;
    }

    visitedCount += 1;

    for (const neighbor of adjacency.get(moduleId) ?? []) {
      const nextDegree = (indegree.get(neighbor) ?? 0) - 1;
      indegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        ready.push(neighbor);
      }
    }
  }

  if (visitedCount !== project.modules.length) {
    issues.push({
      code: 'cycle-detected',
      message: 'The project graph contains a cycle and cannot be executed as a DAG.',
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function validateCompositeDef(
  composite: CompositeDef,
  registry: ModuleRegistry,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const projectValidation = validateProject(composite.project, registry);
  issues.push(...projectValidation.issues);

  validateExternalPorts(composite, issues);
  validateCompositeBindings(
    composite,
    composite.inputBindings,
    'input',
    registry,
    issues,
  );
  validateCompositeBindings(
    composite,
    composite.outputBindings,
    'output',
    registry,
    issues,
  );
  validateForwardedParams(composite, registry, issues);

  return {
    ok: issues.length === 0,
    issues,
  };
}

function validateForwardedParams(
  composite: CompositeDef,
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  const seenKeys = new Set<string>();

  for (const binding of composite.forwardedParams ?? []) {
    if (seenKeys.has(binding.externalParam)) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards duplicate external param "${binding.externalParam}".`,
      });
      continue;
    }
    seenKeys.add(binding.externalParam);

    const externalField = composite.paramSchema[binding.externalParam];
    if (!externalField) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards unknown external param "${binding.externalParam}".`,
      });
      continue;
    }

    const internalModule = composite.project.modules.find(
      (moduleInstance) => moduleInstance.id === binding.internalModuleId,
    );
    if (!internalModule) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" to unknown internal module "${binding.internalModuleId}".`,
      });
      continue;
    }

    const targetDef = registry[internalModule.defId];
    if (!targetDef) {
      issues.push({
        code: 'unknown-module-def',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" through unknown definition "${internalModule.defId}".`,
      });
      continue;
    }

    const targetField = targetDef.paramSchema[binding.internalParamKey];
    if (!targetField) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" to missing internal param "${binding.internalModuleId}.${binding.internalParamKey}".`,
      });
      continue;
    }

    if (externalField.kind !== targetField.kind) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" with kind "${externalField.kind}" to incompatible target kind "${targetField.kind}".`,
      });
    }
  }
}

function validateForwardedParamValues(
  moduleInstance: ModuleInstance,
  composite: CompositeDef,
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  for (const binding of composite.forwardedParams ?? []) {
    const value = moduleInstance.params[binding.externalParam];
    if (value === undefined) {
      continue;
    }

    const internalModule = composite.project.modules.find(
      (candidate) => candidate.id === binding.internalModuleId,
    );
    if (!internalModule) {
      continue;
    }

    const targetDef = registry[internalModule.defId];
    if (!targetDef) {
      continue;
    }

    const targetField = targetDef.paramSchema[binding.internalParamKey];
    if (!targetField) {
      continue;
    }

    const validationCode = validateParamValue(targetField, value);
    if (validationCode) {
      issues.push({
        code: validationCode,
        message: `Module "${moduleInstance.id}" has invalid forwarded value for "${binding.externalParam}" targeting "${binding.internalModuleId}.${binding.internalParamKey}".`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    const moduleSpecificMessage = getModuleSpecificParamMessage(targetDef, targetField, value);
    if (moduleSpecificMessage) {
      issues.push({
        code: 'invalid-param-type',
        message: `Module "${moduleInstance.id}" forwarded param "${binding.externalParam}" is invalid for target "${binding.internalModuleId}.${binding.internalParamKey}". ${moduleSpecificMessage}`,
        moduleId: moduleInstance.id,
      });
    }
  }
}

export function validateIteratorDef(
  iterator: IteratorDef,
  registry: ModuleRegistry,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const roundDef = registry[iterator.roundDefId];
  const hasKeyBus = iterator.roundKeyWidth !== undefined;

  if (!roundDef) {
    issues.push({
      code: 'unknown-module-def',
      message: `Iterator "${iterator.id}" references unknown round definition "${iterator.roundDefId}".`,
    });
  } else {
    if (isIteratorDefinition(roundDef) && roundDef.id === iterator.id) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Iterator "${iterator.id}" cannot reference itself as its round definition.`,
      });
    }

    const expectedInputCount = hasKeyBus ? 2 : 1;

    if (roundDef.inputs.length !== expectedInputCount || roundDef.outputs.length !== 1) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Iterator "${iterator.id}" requires a round definition with exactly ${expectedInputCount} input${expectedInputCount === 1 ? '' : 's'} and one output.`,
      });
    } else if (
      roundDef.inputs[0]?.name !== 'in' ||
      roundDef.outputs[0]?.name !== 'out' ||
      (hasKeyBus && roundDef.inputs[1]?.name !== 'key')
    ) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Iterator "${iterator.id}" currently requires round ports named "in"${hasKeyBus ? ', "key",' : ' and'} "out".`,
      });
    } else if (roundDef.inputs[0]?.type !== roundDef.outputs[0]?.type) {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Iterator "${iterator.id}" requires a round definition whose input and output types match.`,
      });
    } else if (hasKeyBus && roundDef.inputs[1]?.type !== 'bits') {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Iterator "${iterator.id}" requires its round key port to use bits signals.`,
      });
    } else if (
      iterator.inputs.length !== expectedInputCount ||
      iterator.outputs.length !== 1 ||
      iterator.inputs[0]?.name !== 'in' ||
      (hasKeyBus && iterator.inputs[1]?.name !== 'key') ||
      iterator.outputs[0]?.name !== 'out' ||
      iterator.inputs[0]?.type !== roundDef.inputs[0]?.type ||
      (hasKeyBus && iterator.inputs[1]?.type !== 'bits') ||
      iterator.outputs[0]?.type !== roundDef.outputs[0]?.type
    ) {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Iterator "${iterator.id}" must expose one input and one output matching its round definition.`,
      });
    }
  }

  if (!Number.isInteger(iterator.iterationCount) || iterator.iterationCount < 1) {
    issues.push({
      code: 'invalid-param-type',
      message: `Iterator "${iterator.id}" must declare a positive integer iteration count.`,
    });
  }

  if (
    hasKeyBus &&
    (!Number.isInteger(iterator.roundKeyWidth) || (iterator.roundKeyWidth ?? 0) < 1)
  ) {
    issues.push({
      code: 'invalid-param-type',
      message: `Iterator "${iterator.id}" must declare a positive integer round key width when key distribution is enabled.`,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

function validateExternalPorts(
  composite: CompositeDef,
  issues: ValidationIssue[],
) {
  const seen = new Set<string>();

  for (const port of [...composite.inputs, ...composite.outputs]) {
    if (seen.has(port.name)) {
      issues.push({
        code: 'duplicate-external-port',
        message: `Composite "${composite.id}" exposes duplicate external port "${port.name}".`,
      });
      continue;
    }

    seen.add(port.name);
  }
}

function validateCompositeBindings(
  composite: CompositeDef,
  bindings: CompositePortBinding[],
  direction: 'input' | 'output',
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  const externalPorts = direction === 'input' ? composite.inputs : composite.outputs;
  const usedExternalPorts = new Set<string>();

  for (const binding of bindings) {
    const externalPort = externalPorts.find((port) => port.name === binding.externalPort);
    if (!externalPort) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" binding references unknown external ${direction} port "${binding.externalPort}".`,
      });
      continue;
    }

    if (usedExternalPorts.has(binding.externalPort)) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" binds external ${direction} port "${binding.externalPort}" more than once.`,
      });
      continue;
    }

    usedExternalPorts.add(binding.externalPort);

    const endpoint: ConnectionEndpoint =
      direction === 'input'
        ? { moduleId: binding.internalModuleId, port: binding.internalPort }
        : { moduleId: binding.internalModuleId, port: binding.internalPort };
    const internalPort = findInternalBoundPort(
      composite.project,
      endpoint,
      direction,
      registry,
    );

    if (!internalPort) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" binding references unknown internal ${direction} port "${binding.internalModuleId}.${binding.internalPort}".`,
        moduleId: binding.internalModuleId,
      });
      continue;
    }

    if (internalPort.type !== externalPort.type) {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Composite "${composite.id}" has mismatched types between external port "${binding.externalPort}" and internal port "${binding.internalModuleId}.${binding.internalPort}".`,
        moduleId: binding.internalModuleId,
      });
    }
  }
}

function findInternalBoundPort(
  project: Project,
  endpoint: ConnectionEndpoint,
  direction: 'input' | 'output',
  registry: ModuleRegistry,
) {
  const moduleInstance = project.modules.find(
    (candidate) => candidate.id === endpoint.moduleId,
  );
  if (!moduleInstance) {
    return null;
  }

  const def = registry[moduleInstance.defId];
  if (!def) {
    return null;
  }

  return findPort(def, endpoint.port, direction);
}
