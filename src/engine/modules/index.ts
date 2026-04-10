import type { ModuleRegistry } from '../types';
import { TextInput } from './text-input';
import { SymbolSequenceInput } from './symbol-sequence-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { BitSequenceInput } from './bit-sequence-input';
import { AsciiSource } from './ascii-source';
import { AsciiSequenceInput } from './ascii-sequence-input';
import { AsciiSequenceToTicked } from './ascii-sequence-to-ticked';
import { AsciiCharToBits } from './ascii-char-to-bits';
import { TickedSymbolsToSequence } from './ticked-symbols-to-sequence';
import { TickedBitsToSequence } from './ticked-bits-to-sequence';
import { BaudotSource } from './baudot-source';
import { HexSource } from './hex-source';
import { HexSequenceInput } from './hex-sequence-input';
import { HexDigitToBits } from './hex-digit-to-bits';
import { IV } from './iv';
import { Nonce } from './nonce';
import { SymbolToBits } from './symbol-to-bits';
import { Salt } from './salt';
import { BitsToAscii } from './bits-to-ascii';
import { BitsToAsciiChar } from './bits-to-ascii-char';
import { BitsToBaudot } from './bits-to-baudot';
import { BitsToSymbol } from './bits-to-symbol';
import { BitsToHex } from './bits-to-hex';
import { BitsToHexDigit } from './bits-to-hex-digit';
import {
  PolluxControlledFractionation,
  PolluxFractionation,
  PolluxInverse,
} from './pollux-fractionation';
import { HexToAscii } from './hex-to-ascii';
import { AsciiToHex } from './ascii-to-hex';
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
import { MultiRouter } from './multi-router';
import { GreaterThan } from './greater-than';
import { Counter } from './counter';
import { Equals } from './equals';
import { AtLeast } from './at-least';
import { Gate } from './gate';
import { Output } from './output';
import { TextOutput } from './text-output';
import { HexOutput } from './hex-output';
import { BaudotOutput } from './baudot-output';
import { BitOutput } from './bit-output';
import { Rotor } from './rotor';
import { RotorReverse } from './rotor-reverse';
import { Reflector } from './reflector';
import { Plugboard } from './plugboard';
import { Permutation } from './permutation';
import { SymbolPermutation } from './symbol-permutation';
import { SymbolWindow } from './symbol-window';
import { RepeatSymbolToLength } from './repeat-symbol-to-length';
import { TruncateSymbolSequence } from './truncate-symbol-sequence';
import { SymbolSequenceToTicked } from './symbol-sequence-to-ticked';
import { BitsSequenceToTicked } from './bits-sequence-to-ticked';
import { BitShifter } from './bit-shifter';
import { ByteRotate } from './byte-rotate';
import { ByteSwap } from './byte-swap';
import { BitJoin } from './bit-join';
import { BitSplit } from './bit-split';
import { BitPad } from './bit-pad';
import { BitUnpad } from './bit-unpad';
import { BitWindow } from './bit-window';
import { RepeatBitsToLength } from './repeat-bits-to-length';
import { BroadcastBits } from './broadcast-bits';
import { TruncateBitsSequence } from './truncate-bits-sequence';
import { PadBitsSequence } from './pad-bits-sequence';
import { LFSR } from './lfsr';
import { SBox } from './s-box';
import { Clock } from './clock';

export {
  TextInput,
  SymbolSequenceInput,
  KeyInput,
  BitSource,
  BitSequenceInput,
  AsciiSource,
  AsciiSequenceInput,
  AsciiSequenceToTicked,
  AsciiCharToBits,
  TickedSymbolsToSequence,
  TickedBitsToSequence,
  BaudotSource,
  HexSource,
  HexSequenceInput,
  HexDigitToBits,
  IV,
  Nonce,
  SymbolToBits,
  Salt,
  BitsToAscii,
  BitsToAsciiChar,
  BitsToBaudot,
  BitsToSymbol,
  BitsToHex,
  BitsToHexDigit,
  PolluxFractionation,
  PolluxControlledFractionation,
  PolluxInverse,
  HexToAscii,
  AsciiToHex,
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
  MultiRouter,
  GreaterThan,
  Counter,
  Equals,
  AtLeast,
  Gate,
  Output,
  TextOutput,
  HexOutput,
  BaudotOutput,
  BitOutput,
  Rotor,
  RotorReverse,
  Reflector,
  Plugboard,
  Permutation,
  SymbolPermutation,
  SymbolWindow,
  RepeatSymbolToLength,
  TruncateSymbolSequence,
  SymbolSequenceToTicked,
  BitsSequenceToTicked,
  BitShifter,
  ByteRotate,
  ByteSwap,
  BitJoin,
  BitSplit,
  BitPad,
  BitUnpad,
  BitWindow,
  RepeatBitsToLength,
  BroadcastBits,
  TruncateBitsSequence,
  PadBitsSequence,
  LFSR,
  SBox,
  Clock,
};

export const V1_REGISTRY: ModuleRegistry = {
  [TextInput.id]: TextInput,
  [SymbolSequenceInput.id]: SymbolSequenceInput,
  [KeyInput.id]: KeyInput,
  [BitSource.id]: BitSource,
  [BitSequenceInput.id]: BitSequenceInput,
  [AsciiSource.id]: AsciiSource,
  [AsciiSequenceInput.id]: AsciiSequenceInput,
  [AsciiSequenceToTicked.id]: AsciiSequenceToTicked,
  [AsciiCharToBits.id]: AsciiCharToBits,
  [TickedSymbolsToSequence.id]: TickedSymbolsToSequence,
  [TickedBitsToSequence.id]: TickedBitsToSequence,
  [BaudotSource.id]: BaudotSource,
  [HexSource.id]: HexSource,
  [HexSequenceInput.id]: HexSequenceInput,
  [HexDigitToBits.id]: HexDigitToBits,
  [IV.id]: IV,
  [Nonce.id]: Nonce,
  [SymbolToBits.id]: SymbolToBits,
  [Salt.id]: Salt,
  [BitsToAscii.id]: BitsToAscii,
  [BitsToAsciiChar.id]: BitsToAsciiChar,
  [BitsToBaudot.id]: BitsToBaudot,
  [BitsToSymbol.id]: BitsToSymbol,
  [BitsToHex.id]: BitsToHex,
  [BitsToHexDigit.id]: BitsToHexDigit,
  [PolluxFractionation.id]: PolluxFractionation,
  [PolluxControlledFractionation.id]: PolluxControlledFractionation,
  [PolluxInverse.id]: PolluxInverse,
  [HexToAscii.id]: HexToAscii,
  [AsciiToHex.id]: AsciiToHex,
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
  [MultiRouter.id]: MultiRouter,
  [GreaterThan.id]: GreaterThan,
  [Counter.id]: Counter,
  [Equals.id]: Equals,
  [AtLeast.id]: AtLeast,
  [Gate.id]: Gate,
  [Output.id]: Output,
  [TextOutput.id]: TextOutput,
  [HexOutput.id]: HexOutput,
  [BaudotOutput.id]: BaudotOutput,
  [BitOutput.id]: BitOutput,
  [Rotor.id]: Rotor,
  [RotorReverse.id]: RotorReverse,
  [Reflector.id]: Reflector,
  [Plugboard.id]: Plugboard,
  [Permutation.id]: Permutation,
  [SymbolPermutation.id]: SymbolPermutation,
  [SymbolWindow.id]: SymbolWindow,
  [RepeatSymbolToLength.id]: RepeatSymbolToLength,
  [TruncateSymbolSequence.id]: TruncateSymbolSequence,
  [SymbolSequenceToTicked.id]: SymbolSequenceToTicked,
  [BitsSequenceToTicked.id]: BitsSequenceToTicked,
  [BitShifter.id]: BitShifter,
  [ByteRotate.id]: ByteRotate,
  [ByteSwap.id]: ByteSwap,
  [BitJoin.id]: BitJoin,
  [BitSplit.id]: BitSplit,
  [BitPad.id]: BitPad,
  [BitUnpad.id]: BitUnpad,
  [BitWindow.id]: BitWindow,
  [RepeatBitsToLength.id]: RepeatBitsToLength,
  [BroadcastBits.id]: BroadcastBits,
  [TruncateBitsSequence.id]: TruncateBitsSequence,
  [PadBitsSequence.id]: PadBitsSequence,
  [LFSR.id]: LFSR,
  [SBox.id]: SBox,
  [Clock.id]: Clock,
};
