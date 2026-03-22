import { isCompositeDefinition } from '../engine/composites';
import type { ModuleDefinition } from '../engine/types';

export type ModuleCategory = 'source' | 'operator' | 'bridge' | 'sink' | 'composite';

const CATEGORY_MAP: Record<string, ModuleCategory> = {
  TextInput: 'source',
  KeyInput: 'source',
  BitSource: 'source',
  LFSR: 'source',
  Rotor: 'operator',
  Reflector: 'operator',
  XOR: 'operator',
  Permutation: 'operator',
  BitShifter: 'operator',
  SymbolToBits: 'bridge',
  BitsToSymbol: 'bridge',
  Output: 'sink',
};

export function getModuleCategory(definitionOrDefId: ModuleDefinition | string): ModuleCategory {
  if (
    typeof definitionOrDefId !== 'string' &&
    isCompositeDefinition(definitionOrDefId)
  ) {
    return 'composite';
  }

  const defId = typeof definitionOrDefId === 'string' ? definitionOrDefId : definitionOrDefId.id;
  return CATEGORY_MAP[defId] ?? 'operator';
}
