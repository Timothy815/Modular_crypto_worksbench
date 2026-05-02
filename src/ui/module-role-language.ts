import { isClockedIteratorDefinition, isCompositeDefinition, isIteratorDefinition } from '../engine/composites';
import type { ModuleDefinition } from '../engine/types';

export type ModuleWorkflowRole =
  | 'Source'
  | 'Bridge'
  | 'Operator'
  | 'Mismatch Helper'
  | 'Collector'
  | 'Sink';

export interface ModuleRoleSummary {
  role: ModuleWorkflowRole;
  detail: string;
  typicalPath?: string;
}

const SOURCE_MODULE_IDS = new Set([
  'TextInput',
  'SymbolSequenceInput',
  'KeyInput',
  'BitSource',
  'BitSequenceInput',
  'AsciiSource',
  'AsciiSequenceInput',
  'BaudotSource',
  'HexSource',
  'HexSequenceInput',
  'PointSource',
  'IV',
  'Nonce',
  'Salt',
  'Clock',
]);

const SINK_MODULE_IDS = new Set([
  'Output',
  'TextOutput',
  'HexOutput',
  'BaudotOutput',
  'BitOutput',
  'IntegerOutput',
  'PointOutput',
]);

const COLLECTOR_MODULE_IDS = new Set([
  'TickedBitsToSequence',
  'TickedSymbolsToSequence',
]);

const MISMATCH_REQUIRE_MODULE_IDS = new Set([
  'RequireSymbolLengthMatch',
  'RequireBitsLengthMatch',
]);

const MISMATCH_REPAIR_MODULE_IDS = new Set([
  'RepeatSymbolToLength',
  'RepeatBitsToLength',
  'RepeatSymbolToMatch',
  'RepeatBitsToMatch',
  'TruncateSymbolSequence',
  'TruncateBitsSequence',
  'TruncateSymbolToMatch',
  'TruncateBitsToMatch',
  'PadBitsSequence',
  'PadBitsToMatch',
  'PadSymbolToMatch',
]);

const BRIDGE_MODULE_IDS = new Set([
  'SymbolSequenceToTicked',
  'AsciiSequenceToTicked',
  'BitsSequenceToTicked',
  'AsciiCharToBits',
  'BitsToInteger',
  'IntegerToBits',
  'BitsToAsciiChar',
  'HexDigitToBits',
  'BitsToHexDigit',
  'SymbolToBits',
  'BitsToSymbol',
  'AsciiSequenceToBits',
  'HexSequenceToBits',
  'BitsToAscii',
  'BitsToHex',
  'PointOnCurve',
]);

const TYPICAL_PATH: Record<string, string> = {
  AsciiSequenceToTicked:
    'Typical path: whole ASCII source → this bridge → AsciiCharToBits → operator → collector',
  BitsSequenceToTicked:
    'Typical path: whole bit or hex source → this bridge → operator → collector',
  TickedBitsToSequence:
    'Typical path: ticked operator output → this collector → representation bridge or sink',
  TickedSymbolsToSequence:
    'Typical path: ticked symbol operator → this collector → sink',
  AsciiCharToBits:
    'Typical path: after AsciiSequenceToTicked, before a bitwise operator like XOR',
  BitsToInteger:
    'Typical path: visible bit word → this bridge → integer-domain inspection or integer sink',
  IntegerToBits:
    'Typical path: integer-domain value → this bridge → bit-domain operator or bit sink',
  PointOnCurve:
    'Typical path: PointSource or point operator → this checker → BitOutput to verify visible curve membership',
  BitsToAsciiChar:
    'Typical path: after a ticked bit operator, before TickedSymbolsToSequence',
  BitsToHexDigit:
    'Typical path: after a ticked bit operator to display each output word as a hex digit',
  RepeatSymbolToMatch:
    'Typical path: key source → this mismatch helper → AsciiSequenceToTicked → AsciiCharToBits → operator',
  RepeatBitsToMatch:
    'Typical path: short bit key → this mismatch helper → BitsSequenceToTicked → operator',
  TruncateSymbolToMatch:
    'Typical path: overlong symbol input → this mismatch helper → bridge → operator',
  TruncateBitsToMatch:
    'Typical path: overlong bit buffer → this mismatch helper → bridge → operator',
  PadSymbolToMatch:
    'Typical path: short symbol input → this mismatch helper → bridge → operator',
  PadBitsToMatch:
    'Typical path: short bit buffer → this mismatch helper → bridge → operator',
  RequireSymbolLengthMatch:
    'Stops the graph loudly if symbol lengths differ. Use when a mismatch must never proceed silently — place a repair mismatch helper upstream if normalization is the intent instead.',
  RequireBitsLengthMatch:
    'Stops the graph loudly if bit widths differ. Use when a mismatch must never proceed silently — place a repair mismatch helper upstream if normalization is the intent instead.',
};

function getBridgeDetail(definition: ModuleDefinition): string {
  switch (definition.id) {
    case 'SymbolSequenceToTicked':
    case 'AsciiSequenceToTicked':
      return 'whole sequence -> one per tick';
    case 'BitsSequenceToTicked':
      return 'whole sequence -> fixed-width word per tick';
    case 'AsciiCharToBits':
    case 'BitsToInteger':
    case 'IntegerToBits':
    case 'BitsToAsciiChar':
    case 'HexDigitToBits':
    case 'BitsToHexDigit':
    case 'SymbolToBits':
    case 'BitsToSymbol':
    case 'PointOnCurve':
      return 'scalar representation bridge';
    case 'AsciiSequenceToBits':
    case 'HexSequenceToBits':
    case 'BitsToAscii':
    case 'BitsToHex':
      return 'whole-sequence representation bridge';
    default:
      return 'visible domain or shape bridge';
  }
}

function withTypicalPath(summary: Omit<ModuleRoleSummary, 'typicalPath'>, id: string): ModuleRoleSummary {
  const typicalPath = TYPICAL_PATH[id];
  return typicalPath ? { ...summary, typicalPath } : summary;
}

export function getModuleRoleSummary(definition: ModuleDefinition): ModuleRoleSummary {
  if (isCompositeDefinition(definition)) {
    return {
      role: 'Operator',
      detail: 'reusable composite workflow stage',
    };
  }

  if (isIteratorDefinition(definition)) {
    return {
      role: 'Operator',
      detail: 'bounded round architecture stage',
    };
  }

  if (isClockedIteratorDefinition(definition)) {
    return {
      role: 'Operator',
      detail: 'pulse-driven bounded round machine',
    };
  }

  if (SINK_MODULE_IDS.has(definition.id)) {
    return {
      role: 'Sink',
      detail: 'final endpoint for the visible result',
    };
  }

  if (COLLECTOR_MODULE_IDS.has(definition.id)) {
    return withTypicalPath({ role: 'Collector', detail: 'one per tick -> whole sequence' }, definition.id);
  }

  if (MISMATCH_REQUIRE_MODULE_IDS.has(definition.id)) {
    return withTypicalPath(
      { role: 'Mismatch Helper', detail: 'require exact visible reference length' },
      definition.id,
    );
  }

  if (MISMATCH_REPAIR_MODULE_IDS.has(definition.id)) {
    return withTypicalPath(
      { role: 'Mismatch Helper', detail: 'repair visible reference length mismatch' },
      definition.id,
    );
  }

  if (SOURCE_MODULE_IDS.has(definition.id)) {
    return {
      role: 'Source',
      detail: definition.id.includes('SequenceInput') ? 'whole sequence source' : 'graph entry point',
    };
  }

  if (BRIDGE_MODULE_IDS.has(definition.id)) {
    return withTypicalPath({ role: 'Bridge', detail: getBridgeDetail(definition) }, definition.id);
  }

  return {
    role: 'Operator',
    detail: 'visible transformation stage',
  };
}

export function getModuleRole(definition: ModuleDefinition): ModuleWorkflowRole {
  return getModuleRoleSummary(definition).role;
}

export function getModuleRoleDetail(definition: ModuleDefinition): string {
  return getModuleRoleSummary(definition).detail;
}

export function getModuleTypicalPath(definition: ModuleDefinition): string | undefined {
  return getModuleRoleSummary(definition).typicalPath;
}

export function getModuleDomainSignature(definition: ModuleDefinition): string {
  const inputTypes = [...new Set(definition.inputs.map((p) => p.type))];
  const outputTypes = [...new Set(definition.outputs.map((p) => p.type))];
  const inStr = inputTypes.length === 0 ? '·' : inputTypes.join('+');
  const outStr = outputTypes.length === 0 ? '·' : outputTypes.join('+');
  return `${inStr} → ${outStr}`;
}

const CHAINS_WITH: Record<string, { before?: string[]; after?: string[] }> = {
  TextInput: { after: ['AsciiSequenceToTicked', 'RepeatSymbolToMatch'] },
  AsciiSource: { after: ['AsciiSequenceToTicked', 'RepeatSymbolToMatch'] },
  KeyInput: { after: ['AsciiSequenceToTicked', 'RepeatSymbolToMatch', 'SymbolToBits'] },
  BitSource: { after: ['BitsSequenceToTicked', 'XOR', 'ConstantBit'] },
  HexSource: { after: ['BitsSequenceToTicked', 'XOR'] },
  ConstantBit: { after: ['Conditional', 'Gate', 'Mux', 'Demux'] },
  Clock: { after: ['Rotor', 'Counter', 'LFSR', 'Gate'] },
  AsciiSequenceToTicked: {
    before: ['TextInput', 'AsciiSource', 'KeyInput'],
    after: ['AsciiCharToBits', 'SymbolPermutation', 'SymbolToBits'],
  },
  BitsSequenceToTicked: {
    before: ['BitSource', 'HexSource'],
    after: ['XOR', 'SBox', 'Permutation'],
  },
  AsciiCharToBits: {
    before: ['AsciiSequenceToTicked'],
    after: ['XOR', 'Permutation', 'SBox'],
  },
  BitsToInteger: {
    before: ['BitSource', 'HexSource', 'BitJoin', 'TickedBitsToSequence'],
    after: ['IntegerOutput', 'IntegerToBits', 'FieldAdd', 'FieldSub', 'FieldMul', 'FieldInverse'],
  },
  IntegerToBits: {
    before: ['BitsToInteger', 'FieldAdd', 'FieldSub', 'FieldMul', 'FieldInverse'],
    after: ['BitOutput', 'Permutation', 'XOR'],
  },
  FieldAdd: {
    before: ['BitsToInteger', 'FieldSub', 'FieldMul'],
    after: ['IntegerOutput', 'IntegerToBits', 'FieldMul'],
  },
  FieldSub: {
    before: ['BitsToInteger', 'FieldAdd', 'FieldMul'],
    after: ['IntegerOutput', 'IntegerToBits', 'FieldAdd'],
  },
  FieldMul: {
    before: ['BitsToInteger', 'FieldInverse'],
    after: ['IntegerOutput', 'IntegerToBits', 'FieldAdd'],
  },
  FieldInverse: {
    before: ['BitsToInteger'],
    after: ['FieldMul', 'IntegerOutput'],
  },
  PointSource: {
    after: ['PointNegate', 'PointAdd', 'PointDouble', 'ScalarMultiply', 'PointOnCurve', 'PointOutput'],
  },
  PointOnCurve: {
    before: ['PointSource', 'PointNegate', 'PointAdd', 'PointDouble', 'ScalarMultiply'],
    after: ['BitOutput'],
  },
  PointNegate: {
    before: ['PointSource'],
    after: ['PointAdd', 'PointOutput', 'PointOnCurve'],
  },
  PointAdd: {
    before: ['PointSource', 'PointNegate', 'PointDouble', 'ScalarMultiply'],
    after: ['PointOutput', 'PointOnCurve'],
  },
  PointDouble: {
    before: ['PointSource', 'PointAdd', 'ScalarMultiply'],
    after: ['PointOutput', 'PointOnCurve'],
  },
  ScalarMultiply: {
    before: ['BitsToInteger', 'PointSource'],
    after: ['PointOutput', 'PointOnCurve', 'PointAdd'],
  },
  BitsToAsciiChar: {
    before: ['XOR', 'SBox', 'Permutation'],
    after: ['TickedSymbolsToSequence'],
  },
  BitsToHex: {
    before: ['TickedBitsToSequence'],
    after: ['Output', 'TextOutput'],
  },
  TickedBitsToSequence: {
    before: ['XOR', 'SBox', 'Permutation', 'BitShifter'],
    after: ['BitsToHex', 'BitsToAscii', 'BitOutput', 'HexOutput'],
  },
  TickedSymbolsToSequence: {
    before: ['BitsToAsciiChar'],
    after: ['Output', 'TextOutput'],
  },
  XOR: {
    before: ['AsciiCharToBits', 'BitsSequenceToTicked', 'BitSource'],
    after: ['BitsToAsciiChar', 'TickedBitsToSequence', 'BitOutput'],
  },
  SBox: {
    before: ['AsciiCharToBits', 'BitsSequenceToTicked'],
    after: ['Permutation', 'BitsToAsciiChar', 'XOR'],
  },
  Permutation: {
    before: ['AsciiCharToBits', 'BitsSequenceToTicked', 'SBox'],
    after: ['XOR', 'BitsToAsciiChar', 'TickedBitsToSequence'],
  },
  RepeatSymbolToMatch: {
    before: ['KeyInput', 'TextInput'],
    after: ['AsciiSequenceToTicked'],
  },
  RepeatBitsToMatch: {
    before: ['BitSource'],
    after: ['BitsSequenceToTicked'],
  },
  Conditional: {
    before: ['ConstantBit'],
    after: ['Output', 'TextOutput', 'BitOutput'],
  },
};

export function getModuleChainsBefore(definition: ModuleDefinition): string[] {
  return CHAINS_WITH[definition.id]?.before ?? [];
}

export function getModuleChainsAfter(definition: ModuleDefinition): string[] {
  return CHAINS_WITH[definition.id]?.after ?? [];
}
