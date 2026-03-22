import type { ModuleRegistry } from '../types';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { AsciiSource } from './ascii-source';
import { HexSource } from './hex-source';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToAscii } from './bits-to-ascii';
import { BitsToSymbol } from './bits-to-symbol';
import { BitsToHex } from './bits-to-hex';
import { XOR } from './xor';
import { Output } from './output';
import { BitOutput } from './bit-output';
import { Rotor } from './rotor';
import { Reflector } from './reflector';
import { Permutation } from './permutation';
import { BitShifter } from './bit-shifter';
import { LFSR } from './lfsr';
import { SBox } from './s-box';
import { Clock } from './clock';

export {
  TextInput,
  KeyInput,
  BitSource,
  AsciiSource,
  HexSource,
  SymbolToBits,
  BitsToAscii,
  BitsToSymbol,
  BitsToHex,
  XOR,
  Output,
  BitOutput,
  Rotor,
  Reflector,
  Permutation,
  BitShifter,
  LFSR,
  SBox,
  Clock,
};

export const V1_REGISTRY: ModuleRegistry = {
  [TextInput.id]: TextInput,
  [KeyInput.id]: KeyInput,
  [BitSource.id]: BitSource,
  [AsciiSource.id]: AsciiSource,
  [HexSource.id]: HexSource,
  [SymbolToBits.id]: SymbolToBits,
  [BitsToAscii.id]: BitsToAscii,
  [BitsToSymbol.id]: BitsToSymbol,
  [BitsToHex.id]: BitsToHex,
  [XOR.id]: XOR,
  [Output.id]: Output,
  [BitOutput.id]: BitOutput,
  [Rotor.id]: Rotor,
  [Reflector.id]: Reflector,
  [Permutation.id]: Permutation,
  [BitShifter.id]: BitShifter,
  [LFSR.id]: LFSR,
  [SBox.id]: SBox,
  [Clock.id]: Clock,
};
