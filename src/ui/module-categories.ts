export type ModuleCategory = 'source' | 'operator' | 'bridge' | 'sink';

const CATEGORY_MAP: Record<string, ModuleCategory> = {
  TextInput: 'source',
  KeyInput: 'source',
  BitSource: 'source',
  Rotor: 'operator',
  Reflector: 'operator',
  XOR: 'operator',
  SymbolToBits: 'bridge',
  BitsToSymbol: 'bridge',
  Output: 'sink',
};

export function getModuleCategory(defId: string): ModuleCategory {
  return CATEGORY_MAP[defId] ?? 'operator';
}
