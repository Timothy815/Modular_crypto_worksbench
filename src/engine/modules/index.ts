import type { ModuleRegistry } from '../types';
import { TextInput } from './text-input';
import { SymbolSequenceInput } from './symbol-sequence-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { ConstantBit } from './constant-bit';
import { BitSequenceInput } from './bit-sequence-input';
import { AsciiSource } from './ascii-source';
import { AsciiSequenceInput } from './ascii-sequence-input';
import { AsciiSequenceToBits } from './ascii-sequence-to-bits';
import { AsciiSequenceToTicked } from './ascii-sequence-to-ticked';
import { AsciiCharToBits } from './ascii-char-to-bits';
import { TickedSymbolsToSequence } from './ticked-symbols-to-sequence';
import { TickedBitsToSequence } from './ticked-bits-to-sequence';
import { BaudotSource } from './baudot-source';
import { HexSource } from './hex-source';
import { HexSequenceInput } from './hex-sequence-input';
import { HexSequenceToBits } from './hex-sequence-to-bits';
import { HexDigitToBits } from './hex-digit-to-bits';
import { IV } from './iv';
import { Nonce } from './nonce';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToInteger } from './bits-to-integer';
import { IntegerToBits } from './integer-to-bits';
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
import { FieldAdd } from './field-add';
import { FieldSub } from './field-sub';
import { FieldMul } from './field-mul';
import { FieldInverse } from './field-inverse';
import { PointSource } from './point-source';
import { PointOnCurve } from './point-on-curve';
import { PointNegate } from './point-negate';
import { PointAdd } from './point-add';
import { PointDouble } from './point-double';
import { PointOrder } from './point-order';
import { PointEquals } from './point-equals';
import { ScalarMultiply } from './scalar-multiply';
import { ModExp } from './mod-exp';
import { ModInverse } from './mod-inverse';
import { Modulo } from './modulo';
import { MulMod } from './mul-mod';
import { Majority } from './majority';
import { Mux } from './mux';
import { Demux } from './demux';
import { MultiRouter } from './multi-router';
import { MultiSelector } from './multi-selector';
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
import { IntegerOutput } from './integer-output';
import { PointOutput } from './point-output';
import { Rotor } from './rotor';
import { RotorReverse } from './rotor-reverse';
import { Reflector } from './reflector';
import { Plugboard } from './plugboard';
import { Permutation } from './permutation';
import { SymbolPermutation } from './symbol-permutation';
import { SymbolWindow } from './symbol-window';
import { RepeatSymbolToLength } from './repeat-symbol-to-length';
import { RepeatSymbolToMatch } from './repeat-symbol-to-match';
import { PadSymbolToMatch } from './pad-symbol-to-match';
import { RequireSymbolLengthMatch } from './require-symbol-length-match';
import { TruncateSymbolSequence } from './truncate-symbol-sequence';
import { TruncateSymbolToMatch } from './truncate-symbol-to-match';
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
import { BitSelect } from './bit-select';
import { BitExpand } from './bit-expand';
import { RepeatBitsToLength } from './repeat-bits-to-length';
import { RepeatBitsToMatch } from './repeat-bits-to-match';
import { PadBitsToMatch } from './pad-bits-to-match';
import { RequireBitsLengthMatch } from './require-bits-length-match';
import { BroadcastBits } from './broadcast-bits';
import { TruncateBitsSequence } from './truncate-bits-sequence';
import { TruncateBitsToMatch } from './truncate-bits-to-match';
import { PadBitsSequence } from './pad-bits-sequence';
import { LFSR } from './lfsr';
import { SBox } from './s-box';
import { Clock } from './clock';

export {
  TextInput,
  SymbolSequenceInput,
  KeyInput,
  BitSource,
  ConstantBit,
  BitSequenceInput,
  AsciiSource,
  AsciiSequenceInput,
  AsciiSequenceToBits,
  AsciiSequenceToTicked,
  AsciiCharToBits,
  TickedSymbolsToSequence,
  TickedBitsToSequence,
  BaudotSource,
  HexSource,
  HexSequenceInput,
  HexSequenceToBits,
  HexDigitToBits,
  IV,
  Nonce,
  SymbolToBits,
  BitsToInteger,
  IntegerToBits,
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
  FieldAdd,
  FieldSub,
  FieldMul,
  FieldInverse,
  PointSource,
  PointOnCurve,
  PointNegate,
  PointAdd,
  PointDouble,
  PointOrder,
  PointEquals,
  ScalarMultiply,
  ModExp,
  ModInverse,
  Modulo,
  MulMod,
  Majority,
  Mux,
  Demux,
  MultiRouter,
  MultiSelector,
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
  IntegerOutput,
  PointOutput,
  Rotor,
  RotorReverse,
  Reflector,
  Plugboard,
  Permutation,
  SymbolPermutation,
  SymbolWindow,
  RepeatSymbolToLength,
  RepeatSymbolToMatch,
  PadSymbolToMatch,
  RequireSymbolLengthMatch,
  TruncateSymbolSequence,
  TruncateSymbolToMatch,
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
  BitSelect,
  BitExpand,
  RepeatBitsToLength,
  RepeatBitsToMatch,
  PadBitsToMatch,
  RequireBitsLengthMatch,
  BroadcastBits,
  TruncateBitsSequence,
  TruncateBitsToMatch,
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
  [ConstantBit.id]: ConstantBit,
  [BitSequenceInput.id]: BitSequenceInput,
  [AsciiSource.id]: AsciiSource,
  [AsciiSequenceInput.id]: AsciiSequenceInput,
  [AsciiSequenceToBits.id]: AsciiSequenceToBits,
  [AsciiSequenceToTicked.id]: AsciiSequenceToTicked,
  [AsciiCharToBits.id]: AsciiCharToBits,
  [TickedSymbolsToSequence.id]: TickedSymbolsToSequence,
  [TickedBitsToSequence.id]: TickedBitsToSequence,
  [BaudotSource.id]: BaudotSource,
  [HexSource.id]: HexSource,
  [HexSequenceInput.id]: HexSequenceInput,
  [HexSequenceToBits.id]: HexSequenceToBits,
  [HexDigitToBits.id]: HexDigitToBits,
  [IV.id]: IV,
  [Nonce.id]: Nonce,
  [SymbolToBits.id]: SymbolToBits,
  [BitsToInteger.id]: BitsToInteger,
  [IntegerToBits.id]: IntegerToBits,
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
  [FieldAdd.id]: FieldAdd,
  [FieldSub.id]: FieldSub,
  [FieldMul.id]: FieldMul,
  [FieldInverse.id]: FieldInverse,
  [PointSource.id]: PointSource,
  [PointOnCurve.id]: PointOnCurve,
  [PointNegate.id]: PointNegate,
  [PointAdd.id]: PointAdd,
  [PointDouble.id]: PointDouble,
  [PointOrder.id]: PointOrder,
  [PointEquals.id]: PointEquals,
  [ScalarMultiply.id]: ScalarMultiply,
  [ModExp.id]: ModExp,
  [ModInverse.id]: ModInverse,
  [Modulo.id]: Modulo,
  [MulMod.id]: MulMod,
  [Majority.id]: Majority,
  [Mux.id]: Mux,
  [Demux.id]: Demux,
  [MultiRouter.id]: MultiRouter,
  [MultiSelector.id]: MultiSelector,
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
  [IntegerOutput.id]: IntegerOutput,
  [PointOutput.id]: PointOutput,
  [Rotor.id]: Rotor,
  [RotorReverse.id]: RotorReverse,
  [Reflector.id]: Reflector,
  [Plugboard.id]: Plugboard,
  [Permutation.id]: Permutation,
  [SymbolPermutation.id]: SymbolPermutation,
  [SymbolWindow.id]: SymbolWindow,
  [RepeatSymbolToLength.id]: RepeatSymbolToLength,
  [RepeatSymbolToMatch.id]: RepeatSymbolToMatch,
  [PadSymbolToMatch.id]: PadSymbolToMatch,
  [RequireSymbolLengthMatch.id]: RequireSymbolLengthMatch,
  [TruncateSymbolSequence.id]: TruncateSymbolSequence,
  [TruncateSymbolToMatch.id]: TruncateSymbolToMatch,
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
  [BitSelect.id]: BitSelect,
  [BitExpand.id]: BitExpand,
  [RepeatBitsToLength.id]: RepeatBitsToLength,
  [RepeatBitsToMatch.id]: RepeatBitsToMatch,
  [PadBitsToMatch.id]: PadBitsToMatch,
  [RequireBitsLengthMatch.id]: RequireBitsLengthMatch,
  [BroadcastBits.id]: BroadcastBits,
  [TruncateBitsSequence.id]: TruncateBitsSequence,
  [TruncateBitsToMatch.id]: TruncateBitsToMatch,
  [PadBitsSequence.id]: PadBitsSequence,
  [LFSR.id]: LFSR,
  [SBox.id]: SBox,
  [Clock.id]: Clock,
};
