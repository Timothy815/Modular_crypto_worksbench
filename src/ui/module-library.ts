import { isCompositeDefinition } from '../engine/composites';
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
  searchTerms: string[];
}

const PRIMITIVE_LIBRARY_META: Record<string, PrimitiveLibraryMeta> = {
  TextInput: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a single letter symbol into the graph.',
    searchTerms: ['text', 'input', 'letter', 'symbol', 'message'],
  },
  KeyInput: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a single key letter for classical symbol workflows.',
    searchTerms: ['key', 'input', 'letter', 'symbol'],
  },
  BitSource: {
    sectionId: 'inputs-outputs',
    purpose: 'Emits a fixed bit pattern for testing or simple round keys.',
    searchTerms: ['bit', 'source', 'key', 'stream', 'bits'],
  },
  Output: {
    sectionId: 'inputs-outputs',
    purpose: 'Collects the final signal at the end of a graph.',
    searchTerms: ['output', 'sink', 'result', 'final'],
  },
  Rotor: {
    sectionId: 'symbol-domain',
    purpose: 'Substitutes letters through a positional rotor wiring.',
    searchTerms: ['rotor', 'enigma', 'letter', 'symbol', 'substitution'],
  },
  Reflector: {
    sectionId: 'symbol-domain',
    purpose: 'Reflects a letter back through a paired symbolic wiring.',
    searchTerms: ['reflector', 'reflection', 'letter', 'symbol', 'enigma'],
  },
  XOR: {
    sectionId: 'bit-domain',
    purpose: 'Combines two bit streams with exclusive-or.',
    searchTerms: ['xor', 'combine', 'mask', 'bits', 'key mixing'],
  },
  Permutation: {
    sectionId: 'transforms',
    purpose: 'Reorders bit positions according to a configured pattern.',
    searchTerms: ['permutation', 'permute', 'reorder', 'shuffle', 'bits'],
  },
  BitShifter: {
    sectionId: 'transforms',
    purpose: 'Shifts or rotates bits left and right.',
    searchTerms: ['shift', 'rotate', 'bits', 'circular', 'left', 'right'],
  },
  SBox: {
    sectionId: 'transforms',
    purpose: 'Substitutes each 4-bit nibble through a lookup table.',
    searchTerms: ['sbox', 's-box', 'substitute', 'nibble', 'nonlinear', 'bits'],
  },
  LFSR: {
    sectionId: 'state-keystream',
    purpose: 'Generates a deterministic keystream from a seed and tap pattern.',
    searchTerms: ['lfsr', 'keystream', 'stream', 'register', 'feedback', 'bits'],
  },
  SymbolToBits: {
    sectionId: 'bridges',
    purpose: 'Converts one letter symbol into a 5-bit representation.',
    searchTerms: ['bridge', 'convert', 'encode', 'symbol', 'bits'],
  },
  BitsToSymbol: {
    sectionId: 'bridges',
    purpose: 'Converts a 5-bit value back into a letter symbol.',
    searchTerms: ['bridge', 'convert', 'decode', 'bits', 'symbol'],
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
    title: 'Composites',
    description: 'Reusable modules authored from workbench subgraphs.',
  },
];

export function getModuleLibrarySectionId(definition: ModuleDefinition): ModuleLibrarySectionId {
  if (isCompositeDefinition(definition)) {
    return 'composites';
  }

  return PRIMITIVE_LIBRARY_META[definition.id]?.sectionId ?? 'transforms';
}

export function getModulePurpose(definition: ModuleDefinition): string {
  if (isCompositeDefinition(definition)) {
    return `Reusable composite with ${definition.inputs.length} input${definition.inputs.length === 1 ? '' : 's'} and ${definition.outputs.length} output${definition.outputs.length === 1 ? '' : 's'}.`;
  }

  return (
    PRIMITIVE_LIBRARY_META[definition.id]?.purpose ??
    'Reusable primitive module for cryptographic graph experiments.'
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
    ...(isCompositeDefinition(definition)
      ? ['composite', 'reusable']
      : PRIMITIVE_LIBRARY_META[definition.id]?.searchTerms ?? []),
  ];

  return candidates.some((candidate) => candidate.toLowerCase().includes(normalized));
}

export function matchesModuleDomainTab(
  definition: ModuleDefinition,
  tab: ModuleLibraryDomainTab,
): boolean {
  if (tab === 'all') {
    return !isCompositeDefinition(definition);
  }

  if (tab === 'composites') {
    return isCompositeDefinition(definition);
  }

  if (isCompositeDefinition(definition)) {
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
