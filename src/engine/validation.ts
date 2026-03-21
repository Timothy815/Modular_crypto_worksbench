import {
  type ModuleDef,
  type ModuleInstance,
  type ModuleParams,
  type ModuleRegistry,
  type ParamFieldDef,
  type Project,
  type ValidationIssue,
  type ValidationResult,
} from './types';

function findPort(def: ModuleDef, portName: string, direction: 'input' | 'output') {
  const ports = direction === 'input' ? def.inputs : def.outputs;
  return ports.find((port) => port.name === portName);
}

function buildModuleMaps(project: Project, registry: ModuleRegistry) {
  const issues: ValidationIssue[] = [];
  const instancesById = new Map<string, ModuleInstance>();
  const defsByInstanceId = new Map<string, ModuleDef>();

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

    // Validate parameters against schema
    for (const [key, fieldDef] of Object.entries(def.paramSchema)) {
      const value = moduleInstance.params[key];

      if (value === undefined || value === null) {
        if (fieldDef.required) {
          issues.push({
            code: 'invalid-params' as any,
            message: `Module "${moduleInstance.id}" is missing required parameter "${key}".`,
            moduleId: moduleInstance.id,
          });
        }
        continue;
      }

      // Type checking based on ParamKind
      let typeValid = true;
      switch (fieldDef.kind) {
        case 'number':
          typeValid = typeof value === 'number';
          break;
        case 'string':
          typeValid = typeof value === 'string';
          break;
        case 'boolean':
          typeValid = typeof value === 'boolean';
          break;
        case 'bits':
          typeValid = Array.isArray(value) && value.every((v) => typeof v === 'number');
          break;
        case 'wiring':
          // For V1, wiring is a string[] (letter permutation) or number[] (index permutation)
          typeValid = Array.isArray(value) && value.every((v) => typeof v === 'string' || typeof v === 'number');
          break;
        case 'select':
          typeValid = fieldDef.options?.some((opt) => opt.value === value) ?? false;
          if (!typeValid) {
            issues.push({
              code: 'invalid-params' as any,
              message: `Module "${moduleInstance.id}" has invalid value for select parameter "${key}".`,
              moduleId: moduleInstance.id,
            });
          }
          break;
      }

      if (!typeValid && fieldDef.kind !== 'select') {
        issues.push({
          code: 'invalid-params' as any,
          message: `Module "${moduleInstance.id}" parameter "${key}" expects type "${fieldDef.kind}", but got "${typeof value}".`,
          moduleId: moduleInstance.id,
        });
      }
    }
  }

  return { defsByInstanceId, instancesById, issues };
}

function validateParamValue(field: ParamFieldDef, value: unknown): ValidationIssue['code'] | null {
  switch (field.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
        ? null
        : 'invalid-param-type';
    case 'string':
      return typeof value === 'string' ? null : 'invalid-param-type';
    case 'boolean':
      return typeof value === 'boolean' ? null : 'invalid-param-type';
    case 'bits':
      return Array.isArray(value) && value.every((bit) => bit === 0 || bit === 1)
        ? null
        : 'invalid-param-type';
    case 'wiring':
      return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
        ? null
        : 'invalid-param-type';
    case 'select': {
      if (typeof value !== 'string') {
        return 'invalid-param-type';
      }

      if (!field.options || field.options.length === 0) {
        return null;
      }

      return field.options.some((option) => option.value === value)
        ? null
        : 'invalid-param-option';
    }
    default:
      return 'invalid-param-type';
  }
}

function validateParams(
  moduleInstance: ModuleInstance,
  def: ModuleDef,
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
      issues.push({
        code: validationCode,
        message:
          validationCode === 'invalid-param-option'
            ? `Module "${moduleInstance.id}" has invalid option "${String(value)}" for param "${field.key}".`
            : `Module "${moduleInstance.id}" has invalid value for param "${field.key}" of kind "${field.kind}".`,
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
      validateParams(moduleInstance, def, issues);
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
