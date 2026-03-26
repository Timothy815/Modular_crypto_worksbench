import { isCompositeDefinition, isIteratorDefinition } from '../engine/composites';
import type { ModuleDefinition } from '../engine/types';

export type ModuleCategory = 'source' | 'operator' | 'bridge' | 'sink' | 'composite';

const CATEGORY_MAP: Record<string, ModuleCategory> = {
  TextInput: 'source',
  KeyInput: 'source',
  BitSource: 'source',
  AsciiSource: 'source',
  BaudotSource: 'source',
  HexSource: 'source',
  IV: 'source',
  Nonce: 'source',
  Salt: 'source',
  LFSR: 'source',
  Clock: 'source',
  Counter: 'source',
  Rotor: 'operator',
  Reflector: 'operator',
  Plugboard: 'operator',
  XOR: 'operator',
  AND: 'operator',
  OR: 'operator',
  NOT: 'operator',
  AddMod: 'operator',
  SubMod: 'operator',
  ModExp: 'operator',
  ModInverse: 'operator',
  Modulo: 'operator',
  MulMod: 'operator',
  Majority: 'operator',
  Mux: 'operator',
  Demux: 'operator',
  GreaterThan: 'operator',
  Equals: 'operator',
  AtLeast: 'operator',
  Gate: 'operator',
  Permutation: 'operator',
  SymbolPermutation: 'operator',
  SymbolWindow: 'operator',
  BitShifter: 'operator',
  BitJoin: 'operator',
  BitSplit: 'operator',
  BitPad: 'operator',
  BitUnpad: 'operator',
  BitWindow: 'operator',
  SBox: 'operator',
  SymbolToBits: 'bridge',
  BitsToAscii: 'bridge',
  BitsToBaudot: 'bridge',
  BitsToSymbol: 'bridge',
  BitsToHex: 'bridge',
  HexToAscii: 'bridge',
  AsciiToHex: 'bridge',
  Output: 'sink',
  BitOutput: 'sink',
};

export function getModuleCategory(definitionOrDefId: ModuleDefinition | string): ModuleCategory {
  if (
    typeof definitionOrDefId !== 'string' &&
    (isCompositeDefinition(definitionOrDefId) || isIteratorDefinition(definitionOrDefId))
  ) {
    return 'composite';
  }

  const defId = typeof definitionOrDefId === 'string' ? definitionOrDefId : definitionOrDefId.id;
  return CATEGORY_MAP[defId] ?? 'operator';
}
