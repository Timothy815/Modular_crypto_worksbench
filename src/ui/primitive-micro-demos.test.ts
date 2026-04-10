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
      'Rotor',
      'RotorReverse',
      'SymbolSequenceInput',
      'AsciiSequenceInput',
      'RepeatSymbolToLength',
      'TruncateSymbolSequence',
      'SymbolSequenceToTicked',
      'AsciiSequenceToTicked',
      'AsciiCharToBits',
      'AsciiSequenceToBits',
      'BitsToAscii',
      'BitsToHex',
      'AsciiToHex',
      'HexToAscii',
      'TickedSymbolsToSequence',
      'TickedBitsToSequence',
      'BitSequenceInput',
      'TruncateBitsSequence',
      'PadBitsSequence',
      'HexSequenceInput',
      'HexDigitToBits',
      'BitsSequenceToTicked',
      'BitsToAsciiChar',
      'BitsToHexDigit',
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
    expect(getPrimitiveMicroDemo('Rotor')?.name).toBe('Rotor Micro Demo');
    expect(getPrimitiveMicroDemo('RotorReverse')?.name).toBe('Rotor Reverse Micro Demo');
    expect(getPrimitiveMicroDemo('SymbolSequenceInput')?.name).toBe('Symbol Sequence Input Micro Demo');
    expect(getPrimitiveMicroDemo('AsciiSequenceInput')?.name).toBe('ASCII Sequence Input Micro Demo');
    expect(getPrimitiveMicroDemo('RepeatSymbolToLength')?.name).toBe(
      'Repeat Symbol To Length Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TruncateSymbolSequence')?.name).toBe(
      'Truncate Symbol Sequence Micro Demo',
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
    expect(getPrimitiveMicroDemo('HexToAscii')?.name).toBe(
      'Hex To ASCII Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TickedSymbolsToSequence')?.name).toBe(
      'Ticked Symbols To Sequence Micro Demo',
    );
    expect(getPrimitiveMicroDemo('TickedBitsToSequence')?.name).toBe(
      'Ticked Bits To Sequence Micro Demo',
    );
    expect(getPrimitiveMicroDemo('BitSequenceInput')?.name).toBe('Bit Sequence Input Micro Demo');
    expect(getPrimitiveMicroDemo('TruncateBitsSequence')?.name).toBe(
      'Truncate Bits Sequence Micro Demo',
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
    expect(getPrimitiveMicroDemo('SymbolSequenceToTicked')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('AsciiSequenceToTicked')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('TickedSymbolsToSequence')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('TickedBitsToSequence')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('BitsSequenceToTicked')?.defaultTickedMode).toBe(true);
    expect(getPrimitiveMicroDemo('BitSplit')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('BitPad')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('BitJoin')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('Rotor')?.defaultTickedMode).toBeUndefined();
    expect(getPrimitiveMicroDemo('RotorReverse')?.defaultTickedMode).toBeUndefined();
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

  it('keeps the hex-to-ASCII whole-buffer bridge honest about direct sequence decoding', () => {
    const bridge = getPrimitiveMicroDemo('HexToAscii');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'HexToAscii',
      'SymbolSequenceInput',
      'TextOutput',
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

  it('keeps the bit pad example honest about explicit mismatch repair', () => {
    const bridge = getPrimitiveMicroDemo('PadBitsSequence');
    expect(bridge?.document.project.modules.map((module) => module.defId)).toEqual([
      'PadBitsSequence',
      'BitSequenceInput',
      'BitOutput',
    ]);
  });

  it('keeps the rotor reverse example structurally honest', () => {
    const rotorReverse = getPrimitiveMicroDemo('RotorReverse');
    expect(rotorReverse?.document.project.modules.map((module) => module.defId)).toEqual([
      'RotorReverse',
      'TextInput',
      'Rotor',
      'Reflector',
      'TextOutput',
    ]);
  });
});
