import { isCompositeDefinition, isIteratorDefinition } from '../engine/composites';
import type { ModuleDefinition } from '../engine/types';

export type ModuleLibrarySectionId =
  | 'inputs-outputs'
  | 'symbol-domain'
  | 'bit-domain'
  | 'transforms'
  | 'state-keystream'
  | 'bridges'
  | 'composites';

export interface ModuleLibrarySection {
  id: ModuleLibrarySectionId;
  title: string;
  description: string;
}

export type ModuleLibraryDomainTab = 'all' | 'symbol' | 'bit' | 'bridge' | 'composites';

interface PrimitiveLibraryMeta {
  sectionId: Exclude<ModuleLibrarySectionId, 'composites'>;
  purpose: string;
  detail: string;
  searchTerms: string[];
}

const PRIMITIVE_LIBRARY_META: Record<string, PrimitiveLibraryMeta> = {
  TextInput: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a single letter symbol into the graph.',
    detail: 'Use this when a graph should begin with a manually chosen symbol like A, M, or Z.',
    searchTerms: ['text', 'input', 'letter', 'symbol', 'message'],
  },
  KeyInput: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a single key letter for classical symbol workflows.',
    detail: 'Useful when a symbolic cipher needs a separate key-style input alongside plaintext.',
    searchTerms: ['key', 'input', 'letter', 'symbol'],
  },
  BitSource: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a fixed bit pattern for testing or simple round keys.',
    detail: 'Use this as a simple round key or fixed mask when experimenting in the bit domain.',
    searchTerms: ['bit', 'source', 'key', 'stream', 'bits'],
  },
  AsciiSource: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits ASCII text directly into the bit domain as bytes.',
    detail: 'Use this when a modern byte-oriented machine should begin from readable ASCII text instead of manually entered bits.',
    searchTerms: ['ascii', 'source', 'text', 'byte', 'input', 'bits'],
  },
  BaudotSource: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits teleprinter-era Baudot letters directly into the bit domain.',
    detail: 'Use this for historical 5-bit labs when you want explicit Baudot codewords instead of the generic alphabet bridge. This is the right starting point for teleprinter and Lorenz-style experiments.',
    searchTerms: ['baudot', 'teleprinter', 'ita2', 'source', 'letters', '5-bit'],
  },
  HexSource: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a hexadecimal value directly into the bit domain.',
    detail: 'Use this for byte-oriented labs when you want to paste hex test vectors instead of typing raw bits.',
    searchTerms: ['hex', 'source', 'byte', 'vector', 'bits', 'input'],
  },
  Clock: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a visible pulse stream that marks time in the graph.',
    detail: 'Use this when stateful modules should advance on explicit ticks instead of hidden timing.',
    searchTerms: ['clock', 'pulse', 'time', 'tick', 'timing'],
  },
  Output: {
    sectionId: 'inputs-outputs',
    purpose: 'Collects the final signal at the end of a graph.',
    detail: 'Place this at the end of a pipeline when you want a result to count as the output.',
    searchTerms: ['output', 'sink', 'result', 'final'],
  },
  BitOutput: {
    sectionId: 'inputs-outputs',
    purpose: 'Collects the final bit signal at the end of a graph.',
    detail: 'Use this when a bit-domain machine should end as bits instead of converting back into symbols.',
    searchTerms: ['bit output', 'output', 'sink', 'bits', 'final'],
  },
  Rotor: {
    sectionId: 'symbol-domain',
    purpose: 'Substitutes letters through a positional rotor wiring.',
    detail: 'A classical substitution component whose output changes with its configured position.',
    searchTerms: ['rotor', 'enigma', 'letter', 'symbol', 'substitution'],
  },
  Reflector: {
    sectionId: 'symbol-domain',
    purpose: 'Reflects a letter back through a paired symbolic wiring.',
    detail: 'A classical paired mapping used to bounce a symbol back through a symbolic path.',
    searchTerms: ['reflector', 'reflection', 'letter', 'symbol', 'enigma'],
  },
  XOR: {
    sectionId: 'bit-domain',
    purpose: 'Combines two bit streams with exclusive-or.',
    detail: 'Core bit-mixing primitive for masking, key addition, and reversible combining.',
    searchTerms: ['xor', 'combine', 'mask', 'bits', 'key mixing'],
  },
  Permutation: {
    sectionId: 'transforms',
    purpose: 'Reorders bit positions according to a configured pattern.',
    detail: 'A diffusion-style transform that shuffles bit positions without changing their values.',
    searchTerms: ['permutation', 'permute', 'reorder', 'shuffle', 'bits'],
  },
  BitShifter: {
    sectionId: 'transforms',
    purpose: 'Shifts or rotates bits left and right.',
    detail: 'Use this to move bit positions or perform circular rotations within a bit vector.',
    searchTerms: ['shift', 'rotate', 'bits', 'circular', 'left', 'right'],
  },
  SBox: {
    sectionId: 'transforms',
    purpose: 'Substitutes each fixed-width bit chunk through a lookup table.',
    detail: 'A nonlinear substitution block. A 16-entry table gives 4-bit substitution, while a 256-entry table gives 8-bit substitution.',
    searchTerms: ['sbox', 's-box', 'substitute', 'nibble', 'byte', 'nonlinear', 'bits'],
  },
  LFSR: {
    sectionId: 'state-keystream',
    purpose: 'Generates a deterministic keystream from a seed and tap pattern.',
    detail: 'A simple keystream generator that expands a register state into a repeatable bit stream.',
    searchTerms: ['lfsr', 'keystream', 'stream', 'register', 'feedback', 'bits'],
  },
  SymbolToBits: {
    sectionId: 'bridges',
    purpose: 'Converts one letter symbol into a 5-bit representation.',
    detail: 'Use this when a symbolic pipeline needs to cross into bit-based transforms.',
    searchTerms: ['bridge', 'convert', 'encode', 'symbol', 'bits'],
  },
  BitsToAscii: {
    sectionId: 'bridges',
    purpose: 'Converts 8-bit bytes back into ASCII text.',
    detail: 'Use this to return a byte-domain machine back to readable ASCII when the byte values stay within 7-bit ASCII range.',
    searchTerms: ['bridge', 'ascii', 'decode', 'bits', 'byte', 'text'],
  },
  BitsToBaudot: {
    sectionId: 'bridges',
    purpose: 'Converts 5-bit Baudot codewords back into teleprinter text.',
    detail: 'Use this to decode letters-mode Baudot streams after bit-domain transforms or historical keying experiments such as Lorenz-style teleprinter masking.',
    searchTerms: ['bridge', 'baudot', 'ita2', 'decode', 'bits', 'teleprinter'],
  },
  BitsToSymbol: {
    sectionId: 'bridges',
    purpose: 'Converts a 5-bit value back into a letter symbol.',
    detail: 'Use this to return from bit-based transforms back into a symbolic result.',
    searchTerms: ['bridge', 'convert', 'decode', 'bits', 'symbol'],
  },
  BitsToHex: {
    sectionId: 'bridges',
    purpose: 'Converts a bit signal into hexadecimal text.',
    detail: 'Use this when a bit-domain machine should end as hex so students can compare byte-oriented results directly.',
    searchTerms: ['bridge', 'hex', 'encode', 'bits', 'byte', 'output'],
  },
};

export const MODULE_LIBRARY_SECTIONS: ModuleLibrarySection[] = [
  {
    id: 'inputs-outputs',
    title: 'Inputs & Outputs',
    description: 'Start and end points for signals entering or leaving the graph.',
  },
  {
    id: 'symbol-domain',
    title: 'Symbol Domain',
    description: 'Classical letter-based modules such as rotors and reflectors.',
  },
  {
    id: 'bit-domain',
    title: 'Bit Domain',
    description: 'Core bitwise operators for combining binary signals.',
  },
  {
    id: 'transforms',
    title: 'Transforms',
    description: 'Structural bit manipulations such as shifting, permutation, and substitution.',
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
    title: 'Reusable',
    description: 'Reusable composites and bounded iterators authored from workbench round structures.',
  },
];

export function getModuleLibrarySectionId(definition: ModuleDefinition): ModuleLibrarySectionId {
  if (isCompositeDefinition(definition) || isIteratorDefinition(definition)) {
    return 'composites';
  }

  return PRIMITIVE_LIBRARY_META[definition.id]?.sectionId ?? 'transforms';
}

export function getModulePurpose(definition: ModuleDefinition): string {
  if (isCompositeDefinition(definition)) {
    return `Reusable composite with ${definition.inputs.length} input${definition.inputs.length === 1 ? '' : 's'} and ${definition.outputs.length} output${definition.outputs.length === 1 ? '' : 's'}.`;
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
    return 'Reusable module captured from a workbench subgraph. Open it to inspect or edit its internals.';
  }
  if (isIteratorDefinition(definition)) {
    return definition.roundKeyWidth
      ? 'Reusable bounded round chain that auto-unrolls one round definition a fixed number of times and splits a visible key bus into one sub-key per round.'
      : 'Reusable bounded round chain that auto-unrolls one round definition a fixed number of times.';
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
      ? ['composite', 'reusable', 'iterator', 'round chain']
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
    case 'symbol':
      return sectionId === 'symbol-domain' || definition.id === 'TextInput' || definition.id === 'KeyInput';
    case 'bit':
      return sectionId === 'bit-domain' || sectionId === 'transforms' || sectionId === 'state-keystream';
    case 'bridge':
      return sectionId === 'bridges';
    default:
      return true;
  }
}
