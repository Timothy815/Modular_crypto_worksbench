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
    return {
      role: 'Collector',
      detail: 'one per tick -> whole sequence',
    };
  }

  if (MISMATCH_REQUIRE_MODULE_IDS.has(definition.id)) {
    return {
      role: 'Mismatch Helper',
      detail: 'require exact visible reference length',
    };
  }

  if (MISMATCH_REPAIR_MODULE_IDS.has(definition.id)) {
    return {
      role: 'Mismatch Helper',
      detail: 'repair visible reference length mismatch',
    };
  }

  if (SOURCE_MODULE_IDS.has(definition.id)) {
    return {
      role: 'Source',
      detail: definition.id.includes('SequenceInput') ? 'whole sequence source' : 'graph entry point',
    };
  }

  if (BRIDGE_MODULE_IDS.has(definition.id)) {
    return {
      role: 'Bridge',
      detail: getBridgeDetail(definition),
    };
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
