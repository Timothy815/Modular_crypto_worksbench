import type { ModuleRegistry } from '../types';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { AsciiSource } from './ascii-source';
import { BaudotSource } from './baudot-source';
import { HexSource } from './hex-source';
import { IV } from './iv';
import { Nonce } from './nonce';
import { SymbolToBits } from './symbol-to-bits';
import { Salt } from './salt';
import { BitsToAscii } from './bits-to-ascii';
import { BitsToBaudot } from './bits-to-baudot';
import { BitsToSymbol } from './bits-to-symbol';
import { BitsToHex } from './bits-to-hex';
import { XOR } from './xor';
import { AND } from './and';
import { OR } from './or';
import { NOT } from './not';
import { AddMod } from './add-mod';
import { SubMod } from './sub-mod';
import { ModExp } from './mod-exp';
import { ModInverse } from './mod-inverse';
import { Modulo } from './modulo';
import { MulMod } from './mul-mod';
import { Majority } from './majority';
import { Mux } from './mux';
import { Demux } from './demux';
import { GreaterThan } from './greater-than';
import { Counter } from './counter';
import { Equals } from './equals';
import { AtLeast } from './at-least';
import { Gate } from './gate';
import { Output } from './output';
import { BitOutput } from './bit-output';
import { Rotor } from './rotor';
import { Reflector } from './reflector';
import { Plugboard } from './plugboard';
import { Permutation } from './permutation';
import { SymbolPermutation } from './symbol-permutation';
import { SymbolWindow } from './symbol-window';
import { BitShifter } from './bit-shifter';
import { BitJoin } from './bit-join';
import { BitSplit } from './bit-split';
import { BitPad } from './bit-pad';
import { BitUnpad } from './bit-unpad';
import { BitWindow } from './bit-window';
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
  IV,
  Nonce,
  SymbolToBits,
  Salt,
  BitsToAscii,
  BitsToBaudot,
  BitsToSymbol,
  BitsToHex,
  XOR,
  AND,
  OR,
  NOT,
  AddMod,
  SubMod,
  ModExp,
  ModInverse,
  Modulo,
  MulMod,
  Majority,
  Mux,
  Demux,
  GreaterThan,
  Counter,
  Equals,
  AtLeast,
  Gate,
  Output,
  BitOutput,
  Rotor,
  Reflector,
  Plugboard,
  Permutation,
  SymbolPermutation,
  SymbolWindow,
  BitShifter,
  BitJoin,
  BitSplit,
  BitPad,
  BitUnpad,
  BitWindow,
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
  [IV.id]: IV,
  [Nonce.id]: Nonce,
  [SymbolToBits.id]: SymbolToBits,
  [Salt.id]: Salt,
  [BitsToAscii.id]: BitsToAscii,
  [BitsToBaudot.id]: BitsToBaudot,
  [BitsToSymbol.id]: BitsToSymbol,
  [BitsToHex.id]: BitsToHex,
  [XOR.id]: XOR,
  [AND.id]: AND,
  [OR.id]: OR,
  [NOT.id]: NOT,
  [AddMod.id]: AddMod,
  [SubMod.id]: SubMod,
  [ModExp.id]: ModExp,
  [ModInverse.id]: ModInverse,
  [Modulo.id]: Modulo,
  [MulMod.id]: MulMod,
  [Majority.id]: Majority,
  [Mux.id]: Mux,
  [Demux.id]: Demux,
  [GreaterThan.id]: GreaterThan,
  [Counter.id]: Counter,
  [Equals.id]: Equals,
  [AtLeast.id]: AtLeast,
  [Gate.id]: Gate,
  [Output.id]: Output,
  [BitOutput.id]: BitOutput,
  [Rotor.id]: Rotor,
  [Reflector.id]: Reflector,
  [Plugboard.id]: Plugboard,
  [Permutation.id]: Permutation,
  [SymbolPermutation.id]: SymbolPermutation,
  [SymbolWindow.id]: SymbolWindow,
  [BitShifter.id]: BitShifter,
  [BitJoin.id]: BitJoin,
  [BitSplit.id]: BitSplit,
  [BitPad.id]: BitPad,
  [BitUnpad.id]: BitUnpad,
  [BitWindow.id]: BitWindow,
  [LFSR.id]: LFSR,
  [SBox.id]: SBox,
  [Clock.id]: Clock,
};
