import type { ModuleDefinition, ModuleInstance, Project } from '../engine/types';

export interface ParameterComparisonFieldStatus {
  key: string;
  totalSiblingCount: number;
  alignedSiblingCount: number;
  divergentSiblingCount: number;
  status: 'aligned' | 'divergent';
}

export interface ParameterComparisonSummary {
  siblingModuleIds: string[];
  incompatibleSelectedCount: number;
  alignedFieldCount: number;
  divergentFieldCount: number;
  fieldsByKey: Record<string, ParameterComparisonFieldStatus>;
}

interface BuildParameterComparisonSummaryArgs {
  project: Project;
  moduleDef: ModuleDefinition | null;
  moduleInstance: ModuleInstance | null;
  selectedModuleIds: string[];
}

export function buildParameterComparisonSummary({
  project,
  moduleDef,
  moduleInstance,
  selectedModuleIds,
}: BuildParameterComparisonSummaryArgs): ParameterComparisonSummary | null {
  if (!moduleDef || !moduleInstance) {
    return null;
  }

  const allSelectedSiblingIds = selectedModuleIds.filter((moduleId) => moduleId !== moduleInstance.id);
  if (allSelectedSiblingIds.length === 0) {
    return null;
  }

  const siblingModules = allSelectedSiblingIds
    .map((moduleId) => project.modules.find((projectModule) => projectModule.id === moduleId))
    .filter((entry): entry is ModuleInstance => entry !== undefined && entry.defId === moduleDef.id);

  const siblingModuleIds = siblingModules.map((entry) => entry.id);
  const incompatibleSelectedCount = Math.max(0, allSelectedSiblingIds.length - siblingModules.length);
  if (siblingModules.length === 0) {
    return {
      siblingModuleIds: [],
      incompatibleSelectedCount,
      alignedFieldCount: 0,
      divergentFieldCount: 0,
      fieldsByKey: {},
    };
  }

  const fieldStatuses = Object.values(moduleDef.paramSchema).map((field) => {
    const anchorValue = moduleInstance.params[field.key] ?? field.defaultValue;
    const alignedSiblingCount = siblingModules.filter((siblingModule) =>
      areParameterValuesEqual(siblingModule.params[field.key] ?? field.defaultValue, anchorValue),
    ).length;
    const divergentSiblingCount = siblingModules.length - alignedSiblingCount;
    const status = divergentSiblingCount > 0 ? 'divergent' : 'aligned';

    return {
      key: field.key,
      totalSiblingCount: siblingModules.length,
      alignedSiblingCount,
      divergentSiblingCount,
      status,
    } satisfies ParameterComparisonFieldStatus;
  });

  const alignedFieldCount = fieldStatuses.filter((fieldStatus) => fieldStatus.status === 'aligned').length;
  const divergentFieldCount = fieldStatuses.length - alignedFieldCount;

  return {
    siblingModuleIds,
    incompatibleSelectedCount,
    alignedFieldCount,
    divergentFieldCount,
    fieldsByKey: Object.fromEntries(fieldStatuses.map((fieldStatus) => [fieldStatus.key, fieldStatus])),
  };
}

export function areParameterValuesEqual(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => areParameterValuesEqual(value, right[index]))
    );
  }

  if (
    typeof left === 'object' &&
    left !== null &&
    typeof right === 'object' &&
    right !== null
  ) {
    const rightRecord = right as Record<string, unknown>;
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);

    return (
      leftEntries.length === rightEntries.length &&
      leftEntries.every(([key, value]) =>
        Object.prototype.hasOwnProperty.call(rightRecord, key) &&
        areParameterValuesEqual(value, rightRecord[key]),
      )
    );
  }

  return left === right;
}
