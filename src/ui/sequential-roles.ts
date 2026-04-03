import { isOutputSinkDefId } from '../engine/output-sinks';
import { isStatefulModule, type ModuleDefinition } from '../engine/types';

export type SequentialRole = 'state' | 'control' | 'observe';

const CONTROL_DEF_IDS = new Set([
  'Clock',
  'Gate',
  'Mux',
  'Demux',
  'Majority',
  'MultiRouter',
  'RotorDoubleStepControl',
  'RotorControlBankRouter',
]);

export function getSequentialRole(
  defId: string,
  definition: ModuleDefinition | null | undefined,
): SequentialRole | null {
  if (isOutputSinkDefId(defId)) {
    return 'observe';
  }

  if (definition && isStatefulModule(definition)) {
    return 'state';
  }

  if (CONTROL_DEF_IDS.has(defId)) {
    return 'control';
  }

  return null;
}

export function getSequentialRoleLabel(role: SequentialRole): string {
  switch (role) {
    case 'state':
      return 'State';
    case 'control':
      return 'Control';
    case 'observe':
      return 'Observe';
  }
}
