import type { ModuleRegistry } from '../types';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToSymbol } from './bits-to-symbol';
import { XOR } from './xor';
import { Output } from './output';
import { Rotor } from './rotor';
import { Reflector } from './reflector';
import { Permutation } from './permutation';
import { BitShifter } from './bit-shifter';
import { LFSR } from './lfsr';
import { SBox } from './s-box';

export {
  TextInput,
  KeyInput,
  BitSource,
  SymbolToBits,
  BitsToSymbol,
  XOR,
  Output,
  Rotor,
  Reflector,
  Permutation,
  BitShifter,
  LFSR,
  SBox,
};

export const V1_REGISTRY: ModuleRegistry = {
  [TextInput.id]: TextInput,
  [KeyInput.id]: KeyInput,
  [BitSource.id]: BitSource,
  [SymbolToBits.id]: SymbolToBits,
  [BitsToSymbol.id]: BitsToSymbol,
  [XOR.id]: XOR,
  [Output.id]: Output,
  [Rotor.id]: Rotor,
  [Reflector.id]: Reflector,
  [Permutation.id]: Permutation,
  [BitShifter.id]: BitShifter,
  [LFSR.id]: LFSR,
  [SBox.id]: SBox,
};
