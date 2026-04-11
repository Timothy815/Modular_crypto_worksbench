import { isCompositeDefinition, isIteratorDefinition } from '../engine/composites';
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
  'BitsToAsciiChar',
  'HexDigitToBits',
  'BitsToHexDigit',
  'SymbolToBits',
  'BitsToSymbol',
  'AsciiSequenceToBits',
  'HexSequenceToBits',
  'BitsToAscii',
  'BitsToHex',
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
    case 'BitsToAsciiChar':
    case 'HexDigitToBits':
    case 'BitsToHexDigit':
    case 'SymbolToBits':
    case 'BitsToSymbol':
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
