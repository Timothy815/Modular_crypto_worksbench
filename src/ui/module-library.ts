import { isCompositeDefinition, isIteratorDefinition } from '../engine/composites';
import type { ModuleDefinition } from '../engine/types';

export type ModuleLibrarySectionId =
  | 'inputs-outputs'
  | 'protocol-context'
  | 'symbol-domain'
  | 'bit-logic'
  | 'number-theory'
  | 'framing-routing'
  | 'word-diffusion'
  | 'state-keystream'
  | 'bridges'
  | 'composites';

export interface ModuleLibrarySection {
  id: ModuleLibrarySectionId;
  title: string;
  description: string;
}

export type ModuleLibraryDomainTab =
  | 'all'
  | 'inputs'
  | 'outputs'
  | 'symbol'
  | 'bit'
  | 'bridge'
  | 'composites';

interface PrimitiveLibraryMeta {
  sectionId: Exclude<ModuleLibrarySectionId, 'composites'>;
  sortOrder: number;
  purpose: string;
  detail: string;
  searchTerms: string[];
}

const PRIMITIVE_LIBRARY_META: Record<string, PrimitiveLibraryMeta> = {
  TextInput: {
    sectionId: 'inputs-outputs',
    sortOrder: 10,
    purpose: 'Emits a single letter symbol into the graph.',
    detail: 'Use this when a graph should begin with a manually chosen symbol like A, M, or Z.',
    searchTerms: ['text', 'input', 'letter', 'symbol', 'message'],
  },
  KeyInput: {
    sectionId: 'inputs-outputs',
    sortOrder: 20,
    purpose: 'Emits a single key letter for classical symbol workflows.',
    detail: 'Useful when a symbolic cipher needs a separate key-style input alongside plaintext.',
    searchTerms: ['key', 'input', 'letter', 'symbol'],
  },
  BitSource: {
    sectionId: 'inputs-outputs',
    sortOrder: 30,
    purpose: 'Emits a fixed bit pattern for testing or simple round keys.',
    detail: 'Use this as a simple round key or fixed mask when experimenting in the bit domain. Raw bit text like 01000001 01000010 is accepted directly, without forcing manual byte separators.',
    searchTerms: ['bit', 'source', 'key', 'stream', 'bits'],
  },
  AsciiSource: {
    sectionId: 'inputs-outputs',
    sortOrder: 40,
    purpose: 'Emits ASCII text directly into the bit domain as bytes.',
    detail: 'Use this when a modern byte-oriented machine should begin from readable ASCII text instead of manually entered bits.',
    searchTerms: ['ascii', 'source', 'text', 'byte', 'input', 'bits'],
  },
  BaudotSource: {
    sectionId: 'inputs-outputs',
    sortOrder: 50,
    purpose: 'Emits teleprinter-era Baudot letters directly into the bit domain.',
    detail: 'Use this for historical 5-bit labs when you want explicit Baudot codewords instead of the generic alphabet bridge. This is the right starting point for teleprinter and Lorenz-style experiments.',
    searchTerms: ['baudot', 'teleprinter', 'ita2', 'source', 'letters', '5-bit'],
  },
  HexSource: {
    sectionId: 'inputs-outputs',
    sortOrder: 60,
    purpose: 'Emits a hexadecimal value directly into the bit domain.',
    detail: 'Use this for byte-oriented labs when you want to paste hex test vectors instead of typing raw bits.',
    searchTerms: ['hex', 'source', 'byte', 'vector', 'bits', 'input'],
  },
  IV: {
    sectionId: 'protocol-context',
    sortOrder: 10,
    purpose: 'Emits a visible initialization vector as a fixed-width bit word.',
    detail: 'Use this when a block or stream construction should show its initialization material explicitly instead of hiding it inside a generic source.',
    searchTerms: ['iv', 'initialization vector', 'source', 'protocol', 'bits', 'context', 'nonce material'],
  },
  Nonce: {
    sectionId: 'protocol-context',
    sortOrder: 20,
    purpose: 'Emits a visible nonce as a fixed-width bit word.',
    detail: 'Use this when a machine should carry uniqueness material explicitly in the graph rather than treating it as an unnamed hex constant.',
    searchTerms: ['nonce', 'source', 'protocol', 'unique', 'bits', 'context', 'protocol input'],
  },
  Salt: {
    sectionId: 'protocol-context',
    sortOrder: 30,
    purpose: 'Emits a visible salt as a fixed-width bit word.',
    detail: 'Use this when a hashing or key-derivation lab should distinguish salt material from message or key inputs.',
    searchTerms: ['salt', 'source', 'protocol', 'hash', 'bits', 'context', 'derivation input'],
  },
  Clock: {
    sectionId: 'protocol-context',
    sortOrder: 40,
    purpose: 'Emits a visible pulse stream that marks time in the graph.',
    detail: 'Use this when stateful modules should advance on explicit ticks instead of hidden timing.',
    searchTerms: ['clock', 'pulse', 'time', 'tick', 'timing', 'control input'],
  },
  Counter: {
    sectionId: 'state-keystream',
    sortOrder: 10,
    purpose: 'Counts active clock pulses into a visible fixed-width bit word.',
    detail: 'Use this when a machine should track explicit state over time instead of hiding it in prose or code.',
    searchTerms: ['counter', 'count', 'state', 'clock', 'ticks', 'control', 'state machine'],
  },
  Output: {
    sectionId: 'inputs-outputs',
    sortOrder: 70,
    purpose: 'Collects a generic symbol result at the end of a graph.',
    detail: 'Compatibility sink for symbol results when you do not want to declare a more specific endpoint format.',
    searchTerms: ['output', 'sink', 'result', 'final'],
  },
  TextOutput: {
    sectionId: 'inputs-outputs',
    sortOrder: 80,
    purpose: 'Collects final text output with text-first inspection semantics.',
    detail: 'Use this when a symbolic pipeline should end as readable text while still allowing byte-oriented inspection lenses in Analyze.',
    searchTerms: ['text output', 'output', 'sink', 'text', 'ascii', 'final'],
  },
  HexOutput: {
    sectionId: 'inputs-outputs',
    sortOrder: 90,
    purpose: 'Collects final hexadecimal text with hex-first inspection semantics.',
    detail: 'Use this when a symbolic pipeline should end as hex text and the inspector should treat that result as bytes instead of plain prose.',
    searchTerms: ['hex output', 'output', 'sink', 'hex', 'bytes', 'final'],
  },
  BaudotOutput: {
    sectionId: 'inputs-outputs',
    sortOrder: 100,
    purpose: 'Collects final Baudot text with teleprinter-aware inspection semantics.',
    detail: 'Use this when a historical 5-bit pipeline should end as Baudot text rather than generic symbols.',
    searchTerms: ['baudot output', 'output', 'sink', 'teleprinter', 'ita2', 'final'],
  },
  BitOutput: {
    sectionId: 'inputs-outputs',
    sortOrder: 110,
    purpose: 'Collects the final bit signal at the end of a graph.',
    detail: 'Use this when a bit-domain machine should end as bits instead of converting back into symbols.',
    searchTerms: ['bit output', 'output', 'sink', 'bits', 'final'],
  },
  Rotor: {
    sectionId: 'symbol-domain',
    sortOrder: 10,
    purpose: 'Substitutes letters through a rotor wiring with separate position, ring setting, and turnover state.',
    detail: 'A classical substitution component whose mapping changes with position while exposing turnover as visible machine logic.',
    searchTerms: ['rotor', 'enigma', 'letter', 'symbol', 'substitution', 'ring setting', 'notch', 'turnover'],
  },
  RotorReverse: {
    sectionId: 'symbol-domain',
    sortOrder: 15,
    purpose: 'Traverses the inverse of a rotor’s active wiring while keeping the same visible rotor state model.',
    detail: 'Use this after a reflector when a machine should show the historical reverse leg explicitly instead of faking it with a second forward rotor.',
    searchTerms: ['rotor reverse', 'reverse rotor', 'enigma', 'inverse traversal', 'return path', 'symbol', 'turnover'],
  },
  Plugboard: {
    sectionId: 'symbol-domain',
    sortOrder: 20,
    purpose: 'Swaps selected letter pairs while leaving unpaired letters unchanged.',
    detail: 'A self-reciprocal entry/exit mapping layer for rotor-style machines. Unpaired letters pass straight through, and every valid pair already undoes itself.',
    searchTerms: ['plugboard', 'pairing', 'swap', 'letter', 'symbol', 'steckerbrett'],
  },
  Reflector: {
    sectionId: 'symbol-domain',
    sortOrder: 30,
    purpose: 'Reflects a letter back through a paired symbolic wiring.',
    detail: 'A self-reciprocal paired mapping used to bounce a symbol back through a symbolic path. Every valid pair already maps back to itself.',
    searchTerms: ['reflector', 'reflection', 'letter', 'symbol', 'enigma'],
  },
  XOR: {
    sectionId: 'bit-logic',
    sortOrder: 10,
    purpose: 'Combines two bit streams with exclusive-or.',
    detail: 'Core bit-mixing primitive for masking, key addition, and reversible combining.',
    searchTerms: ['xor', 'combine', 'mask', 'bits', 'key mixing', 'logic'],
  },
  AND: {
    sectionId: 'bit-logic',
    sortOrder: 20,
    purpose: 'Combines two bit streams with bitwise AND.',
    detail: 'Useful for masking and local bit selection in toy round functions and control logic.',
    searchTerms: ['and', 'mask', 'bits', 'boolean', 'operator', 'logic'],
  },
  OR: {
    sectionId: 'bit-logic',
    sortOrder: 30,
    purpose: 'Combines two bit streams with bitwise OR.',
    detail: 'Useful for local bit merging in visible boolean constructions.',
    searchTerms: ['or', 'merge', 'bits', 'boolean', 'operator', 'logic'],
  },
  NOT: {
    sectionId: 'bit-logic',
    sortOrder: 40,
    purpose: 'Flips each bit in a bit stream.',
    detail: 'Useful when a machine should invert a visible bit pattern without changing its width.',
    searchTerms: ['not', 'invert', 'flip', 'bits', 'boolean', 'operator', 'logic'],
  },
  AddMod: {
    sectionId: 'bit-logic',
    sortOrder: 50,
    purpose: 'Adds two equal-width bit words modulo 2^n.',
    detail: 'Interprets each bit vector as a fixed-width unsigned word and wraps on overflow.',
    searchTerms: ['add', 'mod', 'addition', 'arx', 'word', 'bits', 'operator', 'word arithmetic'],
  },
  SubMod: {
    sectionId: 'bit-logic',
    sortOrder: 60,
    purpose: 'Subtracts one equal-width bit word from another modulo 2^n.',
    detail: 'Interprets each bit vector as a fixed-width unsigned word and wraps on underflow.',
    searchTerms: ['sub', 'subtract', 'mod', 'word', 'bits', 'operator', 'word arithmetic'],
  },
  ModExp: {
    sectionId: 'number-theory',
    sortOrder: 10,
    purpose: 'Raises a bit word to a power modulo a given modulus.',
    detail: 'Computes base^exp mod modulus using repeated squaring. The first step toward public-key teaching: students can see exponentiation as an explicit graph operation.',
    searchTerms: ['modexp', 'exponentiation', 'power', 'rsa', 'diffie-hellman', 'mod', 'bits', 'number theory', 'modular arithmetic'],
  },
  ModInverse: {
    sectionId: 'number-theory',
    sortOrder: 20,
    purpose: 'Computes the modular multiplicative inverse of a bit word.',
    detail: 'Finds a^(-1) mod modulus using the extended Euclidean algorithm. Throws if no inverse exists. Essential for RSA key derivation.',
    searchTerms: ['inverse', 'modinverse', 'extended euclidean', 'rsa', 'mod', 'bits', 'number theory', 'modular arithmetic'],
  },
  Modulo: {
    sectionId: 'number-theory',
    sortOrder: 30,
    purpose: 'Reduces one fixed-width bit word by an explicit modulus.',
    detail: 'Interprets the bit vector as an unsigned word and returns the remainder in the same width.',
    searchTerms: ['modulo', 'remainder', 'mod', 'word', 'bits', 'operator', 'modular arithmetic'],
  },
  MulMod: {
    sectionId: 'number-theory',
    sortOrder: 40,
    purpose: 'Multiplies two equal-width bit words modulo 2^n.',
    detail: 'Interprets each bit vector as a fixed-width unsigned word and wraps on overflow. The first step toward number-theoretic expressiveness.',
    searchTerms: ['mul', 'multiply', 'mod', 'multiplication', 'arx', 'word', 'bits', 'operator', 'number theory', 'modular arithmetic'],
  },
  Majority: {
    sectionId: 'bit-logic',
    sortOrder: 70,
    purpose: 'Emits a 1-bit result when at least two of three 1-bit inputs are active.',
    detail: 'Useful for visible stream-control and irregular-clocking logic where three control bits should vote on whether a pulse is active.',
    searchTerms: ['majority', 'vote', 'control', 'stream', 'clocking', 'bits', 'operator', 'logic'],
  },
  Mux: {
    sectionId: 'bit-logic',
    sortOrder: 80,
    purpose: 'Selects one of two 1-bit inputs using a visible 1-bit control input.',
    detail: 'Useful for filtered keystream machines where one control bit chooses which candidate bit continues forward.',
    searchTerms: ['mux', 'select', 'selector', 'filter', 'stream', 'bits', 'operator', 'logic'],
  },
  Demux: {
    sectionId: 'bit-logic',
    sortOrder: 90,
    purpose: 'Routes one 1-bit input into one of two visible outputs using a 1-bit control input.',
    detail: 'Useful for routed-clock and scheduler-style stream machines where control decides which downstream path becomes active.',
    searchTerms: ['demux', 'route', 'routing', 'scheduler', 'stream', 'clock', 'bits', 'operator', 'logic'],
  },
  MultiRouter: {
    sectionId: 'framing-routing',
    sortOrder: 60,
    purpose: 'Routes one bit word into one of several visible outputs using an indexed control word.',
    detail: 'Use this when a graph should show an explicit finite switch/case style route decision instead of composing multiple binary routing layers by hand.',
    searchTerms: ['multi router', 'router', 'switch', 'case', 'routing', 'scheduler', 'counter', 'demux', 'bits', 'routing'],
  },
  GreaterThan: {
    sectionId: 'bit-logic',
    sortOrder: 100,
    purpose: 'Emits a one-bit control signal when the first bit word is strictly greater than the second.',
    detail: 'Useful for strict-comparison pulses and asymmetric threshold logic where "at least" is not enough.',
    searchTerms: ['greater than', 'compare', 'threshold', 'control', 'pulse', 'bits', 'logic'],
  },
  Equals: {
    sectionId: 'bit-logic',
    sortOrder: 110,
    purpose: 'Emits a one-bit control signal when two equal-width bit words match exactly.',
    detail: 'Useful for exact-match pulses such as “fire when the counter reaches this word.”',
    searchTerms: ['equals', 'compare', 'match', 'control', 'pulse', 'bits', 'logic'],
  },
  AtLeast: {
    sectionId: 'bit-logic',
    sortOrder: 120,
    purpose: 'Emits a one-bit control signal when one bit word reaches or exceeds another.',
    detail: 'Useful for threshold-style level control once a visible count or word has crossed a boundary.',
    searchTerms: ['at least', 'threshold', 'compare', 'control', 'bits', 'logic'],
  },
  Gate: {
    sectionId: 'bit-logic',
    sortOrder: 130,
    purpose: 'Passes a bit signal only when the control input receives an active pulse.',
    detail: 'Useful for visible pulse gating, conditional clocking, and making state-dependent flow explicit.',
    searchTerms: ['gate', 'pulse', 'control', 'clock', 'conditional', 'bits', 'logic'],
  },
  Permutation: {
    sectionId: 'word-diffusion',
    sortOrder: 10,
    purpose: 'Reorders bit positions according to a configured pattern.',
    detail: 'A diffusion-style transform that shuffles bit positions without changing their values.',
    searchTerms: ['permutation', 'permute', 'reorder', 'shuffle', 'bits', 'diffusion'],
  },
  SymbolPermutation: {
    sectionId: 'symbol-domain',
    sortOrder: 40,
    purpose: 'Reorders symbol positions according to a configured pattern.',
    detail: 'A message-level transform that shuffles symbol order without changing the symbols themselves.',
    searchTerms: ['symbol permutation', 'permute', 'reorder', 'shuffle', 'symbol', 'message', 'transposition'],
  },
  SymbolWindow: {
    sectionId: 'symbol-domain',
    sortOrder: 50,
    purpose: 'Extracts one contiguous symbol window from a larger visible message.',
    detail: 'Use this when one visible symbol message should feed different submessages into different branches without hidden chunking logic.',
    searchTerms: ['symbol window', 'message window', 'slice', 'submessage', 'extract', 'symbol', 'message'],
  },
  BitShifter: {
    sectionId: 'word-diffusion',
    sortOrder: 20,
    purpose: 'Shifts or rotates bits left and right.',
    detail: 'Use this to move bit positions or perform circular rotations within a bit vector.',
    searchTerms: ['shift', 'rotate', 'bits', 'circular', 'left', 'right', 'word transform'],
  },
  ByteRotate: {
    sectionId: 'word-diffusion',
    sortOrder: 30,
    purpose: 'Rotates whole-byte groups left or right within one bit word.',
    detail: 'Use this when a machine should rotate at byte granularity with strict multiple-of-8 width expectations instead of a raw bit-count rotation.',
    searchTerms: ['byte rotate', 'word rotate', 'rotate', 'bytes', 'word', 'endianness', 'word transform'],
  },
  ByteSwap: {
    sectionId: 'word-diffusion',
    sortOrder: 40,
    purpose: 'Reverses the byte order within one bit word.',
    detail: 'Use this when a machine should make byte order explicit instead of manually splitting and rejoining byte lanes in reverse order.',
    searchTerms: ['byte swap', 'endianness', 'bytes', 'reverse', 'word', 'byte order', 'word transform'],
  },
  BitJoin: {
    sectionId: 'framing-routing',
    sortOrder: 10,
    purpose: 'Concatenates two bit signals into one longer bit vector.',
    detail: 'Use this when a machine splits a bit block into branches and later needs to rejoin the ordered halves explicitly.',
    searchTerms: ['join', 'concat', 'concatenate', 'combine', 'bits', 'feistel', 'framing', 'routing'],
  },
  BitSplit: {
    sectionId: 'framing-routing',
    sortOrder: 20,
    purpose: 'Splits one bit vector into two halves at a specified width.',
    detail: 'Use this to divide a bit block into explicit left and right sub-blocks for independent processing before rejoining.',
    searchTerms: ['split', 'divide', 'half', 'block', 'framing', 'bits', 'feistel', 'routing'],
  },
  BitPad: {
    sectionId: 'framing-routing',
    sortOrder: 30,
    purpose: 'Pads a bit vector to a target width with zeros or ones.',
    detail: 'Use this when a short bit vector needs to reach a required block size before entering a fixed-width transform.',
    searchTerms: ['pad', 'padding', 'extend', 'fill', 'block', 'width', 'bits', 'framing'],
  },
  BitUnpad: {
    sectionId: 'framing-routing',
    sortOrder: 40,
    purpose: 'Strips padding from a bit vector to recover the original width.',
    detail: 'Use this after a padded transform when you need to discard the added bits and return to the original signal width.',
    searchTerms: ['unpad', 'strip', 'trim', 'remove', 'padding', 'block', 'width', 'bits', 'framing'],
  },
  BitWindow: {
    sectionId: 'framing-routing',
    sortOrder: 50,
    purpose: 'Extracts one contiguous bit window from a larger key bus or bit vector.',
    detail: 'Use this when one visible key bus should feed different sub-keys into different rounds without hiding the routing in iterator magic.',
    searchTerms: ['window', 'slice', 'sub-key', 'key bus', 'extract', 'bits', 'schedule', 'framing', 'routing'],
  },
  SBox: {
    sectionId: 'word-diffusion',
    sortOrder: 50,
    purpose: 'Substitutes each fixed-width bit chunk through a lookup table.',
    detail: 'A nonlinear substitution block. A 16-entry table gives 4-bit substitution, while a 256-entry table gives 8-bit substitution.',
    searchTerms: ['sbox', 's-box', 'substitute', 'nibble', 'byte', 'nonlinear', 'bits', 'diffusion', 'substitution'],
  },
  LFSR: {
    sectionId: 'state-keystream',
    sortOrder: 20,
    purpose: 'Generates a deterministic keystream from a seed and tap pattern.',
    detail: 'A simple keystream generator that expands a register state into a repeatable bit stream.',
    searchTerms: ['lfsr', 'keystream', 'stream', 'register', 'feedback', 'bits', 'state machine'],
  },
  SymbolToBits: {
    sectionId: 'bridges',
    sortOrder: 10,
    purpose: 'Converts one letter symbol into a 5-bit representation.',
    detail: 'Use this when a symbolic pipeline needs to cross into bit-based transforms.',
    searchTerms: ['bridge', 'convert', 'encode', 'symbol', 'bits'],
  },
  BitsToAscii: {
    sectionId: 'bridges',
    sortOrder: 20,
    purpose: 'Converts 8-bit bytes back into ASCII text.',
    detail: 'Use this to return a byte-domain machine back to readable ASCII when the byte values stay within 7-bit ASCII range.',
    searchTerms: ['bridge', 'ascii', 'decode', 'bits', 'byte', 'text'],
  },
  BitsToBaudot: {
    sectionId: 'bridges',
    sortOrder: 30,
    purpose: 'Converts 5-bit Baudot codewords back into teleprinter text.',
    detail: 'Use this to decode letters-mode Baudot streams after bit-domain transforms or historical keying experiments such as Lorenz-style teleprinter masking.',
    searchTerms: ['bridge', 'baudot', 'ita2', 'decode', 'bits', 'teleprinter'],
  },
  BitsToSymbol: {
    sectionId: 'bridges',
    sortOrder: 40,
    purpose: 'Converts a 5-bit value back into a letter symbol.',
    detail: 'Use this to return from bit-based transforms back into a symbolic result.',
    searchTerms: ['bridge', 'convert', 'decode', 'bits', 'symbol'],
  },
  PolluxFractionation: {
    sectionId: 'bridges',
    sortOrder: 45,
    purpose: 'Encodes each input bit into one visible symbol drawn from disjoint zero/one symbol sets.',
    detail: 'A bounded Pollux-style fractionation bridge. It disguises bit values at the representation layer without claiming modern diffusion or mixing.',
    searchTerms: ['pollux', 'fractionation', 'homophonic', 'bridge', 'bits', 'symbol', 'classical', 'disguise'],
  },
  PolluxControlledFractionation: {
    sectionId: 'bridges',
    sortOrder: 46,
    purpose: 'Encodes each input bit into one visible symbol chosen from disjoint zero/one sets by an explicit selector bitstream.',
    detail: 'A selector-driven Pollux bridge. Use a clocked or pseudo-random-looking bit source to vary which visible symbol represents each 0 or 1 without hiding the choice logic inside the primitive.',
    searchTerms: ['pollux', 'controlled', 'selector', 'homophonic', 'fractionation', 'bridge', 'bits', 'symbol', 'lfsr', 'clock', 'counter'],
  },
  PolluxInverse: {
    sectionId: 'bridges',
    sortOrder: 47,
    purpose: 'Decodes Pollux-style symbols back into bits using known zero/one symbol sets.',
    detail: 'The inverse bounded Pollux bridge. It recovers the original bit stream by checking which visible alphabet each symbol belongs to.',
    searchTerms: ['pollux', 'inverse', 'decode', 'homophonic', 'bridge', 'symbol', 'bits', 'classical'],
  },
  BitsToHex: {
    sectionId: 'bridges',
    sortOrder: 50,
    purpose: 'Converts a bit signal into hexadecimal text.',
    detail: 'Use this when a bit-domain machine should end as hex so students can compare byte-oriented results directly.',
    searchTerms: ['bridge', 'hex', 'encode', 'bits', 'byte', 'output'],
  },
  HexToAscii: {
    sectionId: 'bridges',
    sortOrder: 60,
    purpose: 'Decodes hexadecimal byte text directly into ASCII.',
    detail: 'Use this when readable ASCII already exists as hex bytes and you want the decoded text without routing through Hex Source and Bits → ASCII. Only 7-bit ASCII byte values (`00`-`7F`) are accepted.',
    searchTerms: ['bridge', 'hex', 'ascii', 'decode', 'bytes', 'text'],
  },
  AsciiToHex: {
    sectionId: 'bridges',
    sortOrder: 70,
    purpose: 'Encodes ASCII text into uppercase hexadecimal byte text.',
    detail: 'Use this when an ASCII string should be represented as hex bytes for inspection or further processing. Only 7-bit ASCII characters are accepted. For example, AB becomes 4142.',
    searchTerms: ['bridge', 'ascii', 'hex', 'encode', 'bytes', 'text'],
  },
};

export const MODULE_LIBRARY_SECTIONS: ModuleLibrarySection[] = [
  {
    id: 'inputs-outputs',
    title: 'Inputs & Outputs',
    description: 'Start and end points for signals entering or leaving the graph.',
  },
  {
    id: 'protocol-context',
    title: 'Protocol & Timing',
    description: 'Visible context material such as IVs, nonces, salts, and clocks.',
  },
  {
    id: 'symbol-domain',
    title: 'Symbol Machines',
    description: 'Classical letter-domain modules and message-level symbolic transforms.',
  },
  {
    id: 'bit-logic',
    title: 'Bit Logic',
    description: 'Bitwise, control, and word-operator primitives for visible machine logic.',
  },
  {
    id: 'number-theory',
    title: 'Modular Arithmetic',
    description: 'Number-theoretic operators for modular reduction, inversion, and exponentiation.',
  },
  {
    id: 'framing-routing',
    title: 'Framing & Routing',
    description: 'Width, slicing, padding, and bus-routing tools for visible bit structure.',
  },
  {
    id: 'word-diffusion',
    title: 'Word & Diffusion',
    description: 'Bit and byte transforms for rotation, substitution, and diffusion-style rearrangement.',
  },
  {
    id: 'state-keystream',
    title: 'State & Keystream',
    description: 'Generators and stateful sources for running modern toy rounds.',
  },
  {
    id: 'bridges',
    title: 'Bridges',
    description: 'Converters between letter-symbol and bit representations.',
  },
  {
    id: 'composites',
    title: 'Composites',
    description: 'Composite and iterator architecture modules authored from workbench graph structures.',
  },
];

export function getModuleLibrarySectionId(definition: ModuleDefinition): ModuleLibrarySectionId {
  if (isCompositeDefinition(definition) || isIteratorDefinition(definition)) {
    return 'composites';
  }

  return PRIMITIVE_LIBRARY_META[definition.id]?.sectionId ?? 'word-diffusion';
}

export function getModuleLibrarySortOrder(definition: ModuleDefinition): number {
  if (isCompositeDefinition(definition) || isIteratorDefinition(definition)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return PRIMITIVE_LIBRARY_META[definition.id]?.sortOrder ?? Number.MAX_SAFE_INTEGER - 1;
}

export function getModulePurpose(definition: ModuleDefinition): string {
  if (isCompositeDefinition(definition)) {
    return `Composite module with ${definition.inputs.length} input${definition.inputs.length === 1 ? '' : 's'} and ${definition.outputs.length} output${definition.outputs.length === 1 ? '' : 's'}.`;
  }
  if (isIteratorDefinition(definition)) {
    return `Bounded iterator repeating "${definition.roundDefId}" for ${definition.iterationCount} round${definition.iterationCount === 1 ? '' : 's'}${definition.roundKeyWidth ? ` with a ${definition.roundKeyWidth}-bit key per round` : ''}.`;
  }

  return (
    PRIMITIVE_LIBRARY_META[definition.id]?.purpose ??
    'Reusable primitive module for cryptographic graph experiments.'
  );
}

export function getModuleDetail(definition: ModuleDefinition): string {
  if (isCompositeDefinition(definition)) {
    return 'Composite module captured from a workbench subgraph. Open it to inspect or edit its internals.';
  }
  if (isIteratorDefinition(definition)) {
    return definition.roundKeyWidth
      ? 'Bounded iterator that auto-unrolls one round definition a fixed number of times and splits a visible key bus into one sub-key per round.'
      : 'Bounded iterator that auto-unrolls one round definition a fixed number of times.';
  }

  return (
    PRIMITIVE_LIBRARY_META[definition.id]?.detail ??
    'Cryptographic building block for constructing, analyzing, and comparing machine behavior.'
  );
}

export function matchesModuleSearch(definition: ModuleDefinition, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const candidates = [
    definition.id,
    definition.name,
    getModulePurpose(definition),
    ...((isCompositeDefinition(definition) || isIteratorDefinition(definition))
      ? ['composite', 'iterator', 'round chain', 'architecture']
      : PRIMITIVE_LIBRARY_META[definition.id]?.searchTerms ?? []),
  ];

  return candidates.some((candidate) => candidate.toLowerCase().includes(normalized));
}

export function matchesModuleDomainTab(
  definition: ModuleDefinition,
  tab: ModuleLibraryDomainTab,
): boolean {
  if (tab === 'all') {
    return !isCompositeDefinition(definition) && !isIteratorDefinition(definition);
  }

  if (tab === 'composites') {
    return isCompositeDefinition(definition) || isIteratorDefinition(definition);
  }

  if (isCompositeDefinition(definition) || isIteratorDefinition(definition)) {
    return false;
  }

  const sectionId = getModuleLibrarySectionId(definition);

  switch (tab) {
    case 'inputs':
      return [
        'TextInput',
        'KeyInput',
        'BitSource',
        'AsciiSource',
        'BaudotSource',
        'HexSource',
        'IV',
        'Nonce',
        'Salt',
        'Clock',
      ].includes(definition.id);
    case 'outputs':
      return [
        'Output',
        'TextOutput',
        'HexOutput',
        'BaudotOutput',
        'BitOutput',
      ].includes(definition.id);
    case 'symbol':
      return sectionId === 'symbol-domain' || definition.id === 'TextInput' || definition.id === 'KeyInput';
    case 'bit':
      return sectionId === 'bit-logic'
        || sectionId === 'number-theory'
        || sectionId === 'framing-routing'
        || sectionId === 'word-diffusion'
        || sectionId === 'state-keystream';
    case 'bridge':
      return sectionId === 'bridges';
    default:
      return true;
  }
}
