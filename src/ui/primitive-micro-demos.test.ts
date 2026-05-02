import { describe, expect, it } from 'vitest';

import { getPrimitiveMicroDemo, PRIMITIVE_MICRO_DEMOS } from './primitive-micro-demos';

describe('primitive micro demos', () => {
  it('is bounded to the locked primitive demo sets plus active primitive expansions', () => {
    expect(PRIMITIVE_MICRO_DEMOS.map((entry) => entry.defId)).toEqual([
      'Mux',
      'Demux',
      'Gate',
      'Equals',
      'AtLeast',
      'Majority',
      'Clock',
      'Counter',
      'BitSplit',
      'BitPad',
      'BitJoin',
      'SBox',
      'PolluxFractionation',
      'PolluxControlledFractionation',
      'LFSR',
      'MultiRouter',
      'MultiSelector',
      'MultiCondSwitch4',
      'Rotor',
      'RotorReverse',
      'SymbolSequenceInput',
      'AsciiSequenceInput',
      'RepeatSymbolToLength',
      'RepeatSymbolToMatch',
      'PadSymbolToMatch',
      'RequireSymbolLengthMatch',
      'TruncateSymbolSequence',
      'TruncateSymbolToMatch',
      'SymbolSequenceToTicked',
      'AsciiSequenceToTicked',
      'AsciiCharToBits',
      'AsciiSequenceToBits',
      'BitsToAscii',
      'BitsToHex',
      'AsciiToHex',
      'SymbolToBits',
      'BitsToSymbol',
      'HexToAscii',
      'HexSequenceToBits',
      'TickedSymbolsToSequence',
      'TickedBitsToSequence',
      'BitSequenceInput',
      'RepeatBitsToMatch',
      'PadBitsToMatch',
      'RequireBitsLengthMatch',
      'TruncateBitsSequence',
      'TruncateBitsToMatch',
      'PadBitsSequence',
      'HexSequenceInput',
      'HexDigitToBits',
      'BitsSequenceToTicked',
      'BitsToAsciiChar',
      'BitsToHexDigit',
      'ByteRoundIterator',
      'ClockedByteRoundIterator',
      'ConditionalBranchDemo',
      'BitSelect',
      'BitExpand',
      'ScalarMultiply',
      'PointOrder',
      'PointEquals',
    ]);
  });

  it('returns seeded demos only for eligible primitives', () => {
    expect(getPrimitiveMicroDemo('Mux')?.name).toBe('Mux Micro Demo');
    expect(getPrimitiveMicroDemo('Demux')?.name).toBe('Demux Micro Demo');
    expect(getPrimitiveMicroDemo('Counter')?.name).toBe('Counter Micro Demo');
    expect(getPrimitiveMicroDemo('SBox')?.name).toBe('S-Box Micro Demo');
    expect(getPrimitiveMicroDemo('PolluxFractionation')?.name).toBe('Pollux Fractionation Micro Demo');
    expect(getPrimitiveMicroDemo('PolluxControlledFractionation')?.name).toBe(
      'Controlled Pollux Fractionation Micro Demo',
    );
    expect(getPrimitiveMicroDemo('LFSR')?.name).toBe('LFSR Micro Demo');
    expect(getPrimitiveMicroDemo('MultiRouter')?.name).toBe('Multi Router Micro Demo');
    expect(getPrimitiveMicroDemo('MultiSelector')?.name).toBe('Multi Selector Micro Demo');
    expect(getPrimitiveMicroDemo('MultiCondSwitch4')?.name).toBe('Multi-Cond Switch 4 Micro Demo');
    expect(getPrimitiveMicroDemo('Rotor')?.name).toBe('Rotor Micro Demo');
    expect(getPrimitiveMicroDemo('RotorReverse')?.name).toBe('Rotor Reverse Micro Demo');
    expect(getPrimitiveMicroDemo('SymbolSequenceInput')?.name).toBe('Symbol Sequence Input Micro Demo');
    expect(getPrimitiveMicroDemo('AsciiSequenceInput')?.name).toBe('ASCII Sequence Input Micro Demo');
    expect(getPrimitiveMicroDemo('RepeatSymbolToLength')?.name).toBe(
      'Repeat Symbol To Length Micro Demo',
    );
    expect(getPrimitiveMicroDemo('RepeatSymbolToMatch')?.name).toBe(
      'Repeat Symbol To Match Micro Demo',
    );
    expect(getPrimitiveMicroDemo('PadSymbolToMatch')?.name).toBe(
      'Pad Symbol To Match Micro Demo',
    );
    expect(getPrimitiveMicroDemo('RequireSymbolLengthMatch')?.name).toBe(
      'Require Symbol Length Match Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TruncateSymbolSequence')?.name).toBe(
      'Truncate Symbol Sequence Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TruncateSymbolToMatch')?.name).toBe(
      'Truncate Symbol To Match Micro Demo',
    );
    expect(getPrimitiveMicroDemo('SymbolSequenceToTicked')?.name).toBe(
      'Symbol Sequence To Ticked Micro Demo',
    );
    expect(getPrimitiveMicroDemo('AsciiSequenceToTicked')?.name).toBe(
      'ASCII Sequence To Ticked Micro Demo',
    );
    expect(getPrimitiveMicroDemo('AsciiCharToBits')?.name).toBe(
      'ASCII Char To Bits Micro Demo',
    );
    expect(getPrimitiveMicroDemo('AsciiSequenceToBits')?.name).toBe(
      'ASCII Sequence To Bits Micro Demo',
    );
    expect(getPrimitiveMicroDemo('BitsToAscii')?.name).toBe(
      'Bits To ASCII Micro Demo',
    );
    expect(getPrimitiveMicroDemo('BitsToHex')?.name).toBe(
      'Bits To Hex Micro Demo',
    );
    expect(getPrimitiveMicroDemo('AsciiToHex')?.name).toBe(
      'ASCII To Hex Micro Demo',
    );
    expect(getPrimitiveMicroDemo('SymbolToBits')?.name).toBe(
      'Symbol To Bits Micro Demo',
    );
    expect(getPrimitiveMicroDemo('BitsToSymbol')?.name).toBe(
      'Bits To Symbol Micro Demo',
    );
    expect(getPrimitiveMicroDemo('HexToAscii')?.name).toBe(
      'Hex To ASCII Micro Demo',
    );
    expect(getPrimitiveMicroDemo('HexSequenceToBits')?.name).toBe(
      'Hex Sequence To Bits Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TickedSymbolsToSequence')?.name).toBe(
      'Ticked Symbols To Sequence Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TickedBitsToSequence')?.name).toBe(
      'Ticked Bits To Sequence Micro Demo',
    );
    expect(getPrimitiveMicroDemo('BitSequenceInput')?.name).toBe('Bit Sequence Input Micro Demo');
    expect(getPrimitiveMicroDemo('RepeatBitsToMatch')?.name).toBe('Repeat Bits To Match Micro Demo');
    expect(getPrimitiveMicroDemo('PadBitsToMatch')?.name).toBe('Pad Bits To Match Micro Demo');
    expect(getPrimitiveMicroDemo('RequireBitsLengthMatch')?.name).toBe(
      'Require Bits Length Match Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TruncateBitsSequence')?.name).toBe(
      'Truncate Bits Sequence Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TruncateBitsToMatch')?.name).toBe(
      'Truncate Bits To Match Micro Demo',
    );
    expect(getPrimitiveMicroDemo('PadBitsSequence')?.name).toBe(
      'Pad Bits Sequence Micro Demo',
    );
    expect(getPrimitiveMicroDemo('HexSequenceInput')?.name).toBe('Hex Sequence Input Micro Demo');
    expect(getPrimitiveMicroDemo('HexDigitToBits')?.name).toBe('Hex Digit To Bits Micro Demo');
    expect(getPrimitiveMicroDemo('BitsSequenceToTicked')?.name).toBe(
      'Bits Sequence To Ticked Micro Demo',
    );
    expect(getPrimitiveMicroDemo('BitsToAsciiChar')?.name).toBe(
      'Bits To ASCII Char Micro Demo',
    );
    expect(getPrimitiveMicroDemo('BitsToHexDigit')?.name).toBe(
      'Bits To Hex Digit Micro Demo',
    );
    expect(getPrimitiveMicroDemo('ByteRoundIterator')?.name).toBe(
      'Byte Round Iterator Micro Demo',
    );
    expect(getPrimitiveMicroDemo('ClockedByteRoundIterator')?.name).toBe(
      'Clocked Byte Round Iterator Micro Demo',
    );
    expect(getPrimitiveMicroDemo('ConditionalBranchDemo')?.name).toBe(
      'Conditional Branch Demo Micro Demo',
    );
    expect(getPrimitiveMicroDemo('ScalarMultiply')?.name).toBe('Scalar Multiply Micro Demo');
    expect(getPrimitiveMicroDemo('PointOrder')?.name).toBe('Point Order Micro Demo');
    expect(getPrimitiveMicroDemo('PointEquals')?.name).toBe('Point Equals Micro Demo');
    expect(getPrimitiveMicroDemo('XOR')).toBeNull();
  });

  it('keeps the focal primitive first so the opened workspace anchors on it', () => {
    for (const entry of PRIMITIVE_MICRO_DEMOS) {
      expect(entry.document.project.modules[0]?.defId).toBe(entry.defId);
    }
  });

  it('defaults timing and state micro demos to ticked mode only for the locked V2 runtime set', () => {
    expect(getPrimitiveMicroDemo('Clock')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('Counter')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('LFSR')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('MultiRouter')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('Rotor')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('RotorReverse')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('SymbolSequenceToTicked')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('AsciiSequenceToTicked')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('TickedSymbolsToSequence')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('TickedBitsToSequence')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('BitsSequenceToTicked')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('ClockedByteRoundIterator')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('BitSplit')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('BitPad')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('BitJoin')?.defaultTickedMode).toBeUndefined();
  });

  it('keeps the rotor micro demo focused on one stepped forward traversal path', () => {
    const demo = getPrimitiveMicroDemo('Rotor');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'Rotor',
      'TextInput',
      'Clock',
      'TextOutput',
    ]);
  });

  it('keeps the rotor reverse micro demo focused on one stepped linked return path', () => {
    const demo = getPrimitiveMicroDemo('RotorReverse');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'RotorReverse',
      'TextInput',
      'Clock',
      'Rotor',
      'Reflector',
      'TextOutput',
    ]);
  });

  it('keeps the sequence bridge example honest about whole-sequence input and ticked output', () => {
    const bridge = getPrimitiveMicroDemo('SymbolSequenceToTicked');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'SymbolSequenceToTicked',
      'SymbolSequenceInput',
      'Clock',
      'TextOutput',
    ]);
  });

  it('keeps the symbol truncate example honest about explicit mismatch repair', () => {
    const bridge = getPrimitiveMicroDemo('TruncateSymbolSequence');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'TruncateSymbolSequence',
      'SymbolSequenceInput',
      'TextOutput',
    ]);
  });

  it('keeps the symbol repeat-to-match example honest about visible reference-driven repetition', () => {
    const bridge = getPrimitiveMicroDemo('RepeatSymbolToMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'RepeatSymbolToMatch',
      'SymbolSequenceInput',
      'SymbolSequenceInput',
      'TextOutput',
    ]);
  });

  it('keeps the symbol pad-to-match example honest about visible reference-driven padding', () => {
    const bridge = getPrimitiveMicroDemo('PadSymbolToMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'PadSymbolToMatch',
      'SymbolSequenceInput',
      'SymbolSequenceInput',
      'TextOutput',
    ]);
  });

  it('keeps the symbol require-length-match example honest about visible strict matching', () => {
    const bridge = getPrimitiveMicroDemo('RequireSymbolLengthMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'RequireSymbolLengthMatch',
      'RepeatSymbolToMatch',
      'SymbolSequenceInput',
      'SymbolSequenceInput',
      'TextOutput',
      'TextOutput',
    ]);
  });

  it('keeps the symbol truncate-to-match example honest about visible reference-driven truncation', () => {
    const bridge = getPrimitiveMicroDemo('TruncateSymbolToMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'TruncateSymbolToMatch',
      'SymbolSequenceInput',
      'SymbolSequenceInput',
      'TextOutput',
    ]);
  });

  it('keeps the ASCII sequence bridge example honest about whole-sequence input and ticked output', () => {
    const bridge = getPrimitiveMicroDemo('AsciiSequenceToTicked');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'AsciiSequenceToTicked',
      'AsciiSequenceInput',
      'Clock',
      'TextOutput',
    ]);
  });

  it('keeps the ASCII char bridge example honest about ticked character to bit-word conversion', () => {
    const bridge = getPrimitiveMicroDemo('AsciiCharToBits');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'AsciiCharToBits',
      'AsciiSequenceToTicked',
      'AsciiSequenceInput',
      'Clock',
      'BitOutput',
    ]);
  });

  it('keeps the ASCII whole-sequence bridge honest about direct sequence-to-buffer conversion', () => {
    const bridge = getPrimitiveMicroDemo('AsciiSequenceToBits');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'AsciiSequenceToBits',
      'AsciiSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the bits-to-ASCII whole-buffer bridge honest about direct decode to text', () => {
    const bridge = getPrimitiveMicroDemo('BitsToAscii');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitsToAscii',
      'BitSequenceInput',
      'TextOutput',
    ]);
  });

  it('keeps the bits-to-hex whole-buffer bridge honest about direct encode to hex', () => {
    const bridge = getPrimitiveMicroDemo('BitsToHex');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitsToHex',
      'BitSequenceInput',
      'HexOutput',
    ]);
  });

  it('keeps the ASCII-to-hex whole-buffer bridge honest about direct sequence encoding', () => {
    const bridge = getPrimitiveMicroDemo('AsciiToHex');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'AsciiToHex',
      'AsciiSequenceInput',
      'HexOutput',
    ]);
  });

  it('keeps the symbol-to-bits scalar bridge honest about direct alphabet encoding', () => {
    const bridge = getPrimitiveMicroDemo('SymbolToBits');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'SymbolToBits',
      'TextInput',
      'BitOutput',
    ]);
  });

  it('keeps the bits-to-symbol scalar bridge honest about direct alphabet decoding', () => {
    const bridge = getPrimitiveMicroDemo('BitsToSymbol');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitsToSymbol',
      'BitSource',
      'TextOutput',
    ]);
  });

  it('keeps the hex-to-ASCII whole-buffer bridge honest about direct sequence decoding', () => {
    const bridge = getPrimitiveMicroDemo('HexToAscii');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'HexToAscii',
      'SymbolSequenceInput',
      'TextOutput',
    ]);
  });

  it('keeps the hex-sequence-to-bits whole-buffer bridge honest about direct sequence-to-buffer conversion', () => {
    const bridge = getPrimitiveMicroDemo('HexSequenceToBits');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'HexSequenceToBits',
      'SymbolSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the symbol collector example honest about ticked input and collected output', () => {
    const bridge = getPrimitiveMicroDemo('TickedSymbolsToSequence');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'TickedSymbolsToSequence',
      'TextInput',
      'Clock',
      'TextOutput',
    ]);
  });

  it('keeps the bit collector example honest about ticked input and collected output', () => {
    const bridge = getPrimitiveMicroDemo('TickedBitsToSequence');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'TickedBitsToSequence',
      'BitSource',
      'Clock',
      'BitOutput',
    ]);
  });

  it('keeps the bit sequence bridge example honest about whole-sequence input and ticked output', () => {
    const bridge = getPrimitiveMicroDemo('BitsSequenceToTicked');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitsSequenceToTicked',
      'BitSequenceInput',
      'Clock',
      'BitOutput',
    ]);
  });

  it('keeps the hex digit bridge example honest about scalar hex-to-bits conversion', () => {
    const bridge = getPrimitiveMicroDemo('HexDigitToBits');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'HexDigitToBits',
      'TextInput',
      'BitOutput',
    ]);
  });

  it('keeps the bits-to-ASCII-char example honest about ticked byte decoding and collection', () => {
    const bridge = getPrimitiveMicroDemo('BitsToAsciiChar');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitsToAsciiChar',
      'TickedSymbolsToSequence',
      'BitsSequenceToTicked',
      'BitSequenceInput',
      'Clock',
      'TextOutput',
    ]);
  });

  it('keeps the bits-to-hex-digit example honest about the main hex sequence path', () => {
    const bridge = getPrimitiveMicroDemo('BitsToHexDigit');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'BitsToHexDigit',
      'TickedSymbolsToSequence',
      'XOR',
      'BitSource',
      'BitsSequenceToTicked',
      'HexSequenceInput',
      'Clock',
      'TextOutput',
    ]);
  });

  it('keeps the bit truncate example honest about explicit mismatch repair', () => {
    const bridge = getPrimitiveMicroDemo('TruncateBitsSequence');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'TruncateBitsSequence',
      'BitSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the bit repeat-to-match example honest about visible reference-driven repetition', () => {
    const bridge = getPrimitiveMicroDemo('RepeatBitsToMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'RepeatBitsToMatch',
      'BitSequenceInput',
      'BitSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the bit pad-to-match example honest about visible reference-driven padding', () => {
    const bridge = getPrimitiveMicroDemo('PadBitsToMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'PadBitsToMatch',
      'BitSequenceInput',
      'BitSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the bit truncate-to-match example honest about visible reference-driven truncation', () => {
    const bridge = getPrimitiveMicroDemo('TruncateBitsToMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'TruncateBitsToMatch',
      'BitSequenceInput',
      'BitSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the bit pad example honest about explicit mismatch repair', () => {
    const bridge = getPrimitiveMicroDemo('PadBitsSequence');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'PadBitsSequence',
      'BitSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the bit require-length-match example honest about visible strict matching', () => {
    const bridge = getPrimitiveMicroDemo('RequireBitsLengthMatch');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'RequireBitsLengthMatch',
      'PadBitsToMatch',
      'BitSequenceInput',
      'BitSequenceInput',
      'BitOutput',
      'BitOutput',
    ]);
  });

  it('keeps the conditional branch demo honest: focal conditional first, one select bit, one data input, one output', () => {
    const demo = getPrimitiveMicroDemo('ConditionalBranchDemo');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'ConditionalBranchDemo',
      'BitSource',
      'BitSource',
      'BitOutput',
    ]);
    // select is a 1-bit scalar control
    const selectModule = demo?.document.project.modules.find((m) => m.id === 'select');
    expect(selectModule?.params?.stream).toEqual([1]);
    // input is an 8-bit value
    const inputModule = demo?.document.project.modules.find((m) => m.id === 'input');
    expect(inputModule?.params?.stream).toHaveLength(8);
  });

  it('keeps the rotor reverse example structurally honest', () => {
    const rotorReverse = getPrimitiveMicroDemo('RotorReverse');
    expect(rotorReverse?.document.project.modules.map((module) => module.defId)).toEqual([
      'RotorReverse',
      'TextInput',
      'Clock',
      'Rotor',
      'Reflector',
      'TextOutput',
    ]);
  });

  it('keeps the iterator wrapper demo honest about body-versus-wrapper comparison', () => {
    const demo = getPrimitiveMicroDemo('ByteRoundIterator');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'ByteRoundIterator',
      'ByteRoundComposite',
      'BitSource',
      'BitOutput',
      'BitOutput',
    ]);
  });

  it('keeps the clocked iterator demo honest about visible pulse-driven traversal', () => {
    const demo = getPrimitiveMicroDemo('ClockedByteRoundIterator');
    expect(demo?.document.project.modules.map((module) => module.defId)).toEqual([
      'ClockedByteRoundIterator',
      'BitSequenceInput',
      'Clock',
      'BitOutput',
    ]);
  });
});
