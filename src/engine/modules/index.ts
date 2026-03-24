import type { ModuleRegistry } from '../types';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { AsciiSource } from './ascii-source';
import { BaudotSource } from './baudot-source';
import { HexSource } from './hex-source';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToAscii } from './bits-to-ascii';
import { BitsToBaudot } from './bits-to-baudot';
import { BitsToSymbol } from './bits-to-symbol';
import { BitsToHex } from './bits-to-hex';
import { XOR } from './xor';
import { Output } from './output';
import { BitOutput } from './bit-output';
import { Rotor } from './rotor';
import { Reflector } from './reflector';
import { Plugboard } from './plugboard';
import { Permutation } from './permutation';
import { BitShifter } from './bit-shifter';
import { BitJoin } from './bit-join';
import { LFSR } from './lfsr';
import { SBox } from './s-box';
import { Clock } from './clock';

export {
  TextInput,
  KeyInput,
  BitSource,
  AsciiSource,
  BaudotSource,
  HexSource,
  SymbolToBits,
  BitsToAscii,
  BitsToBaudot,
  BitsToSymbol,
  BitsToHex,
  XOR,
  Output,
  BitOutput,
  Rotor,
  Reflector,
  Plugboard,
  Permutation,
  BitShifter,
  BitJoin,
  LFSR,
  SBox,
  Clock,
};

export const V1_REGISTRY: ModuleRegistry = {
  [TextInput.id]: TextInput,
  [KeyInput.id]: KeyInput,
  [BitSource.id]: BitSource,
  [AsciiSource.id]: AsciiSource,
  [BaudotSource.id]: BaudotSource,
  [HexSource.id]: HexSource,
  [SymbolToBits.id]: SymbolToBits,
  [BitsToAscii.id]: BitsToAscii,
  [BitsToBaudot.id]: BitsToBaudot,
  [BitsToSymbol.id]: BitsToSymbol,
  [BitsToHex.id]: BitsToHex,
  [XOR.id]: XOR,
  [Output.id]: Output,
  [BitOutput.id]: BitOutput,
  [Rotor.id]: Rotor,
  [Reflector.id]: Reflector,
  [Plugboard.id]: Plugboard,
  [Permutation.id]: Permutation,
  [BitShifter.id]: BitShifter,
  [BitJoin.id]: BitJoin,
  [LFSR.id]: LFSR,
  [SBox.id]: SBox,
  [Clock.id]: Clock,
};
