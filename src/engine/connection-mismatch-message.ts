import type { PortKind, SignalType } from './types';

function getTypeMismatchSuggestion(sourceType: SignalType, targetType: SignalType) {
  if (sourceType === 'symbol' && targetType === 'bits') {
    return ' Insert an explicit bridge: AsciiCharToBits for one character per tick, SymbolToBits for a lookup-table mapping, or HexDigitToBits for one hex digit.';
  }

  if (sourceType === 'bits' && targetType === 'symbol') {
    return ' Insert an explicit bridge: BitsToAsciiChar for one 8-bit word per tick, BitsToHexDigit for one 4-bit word, or BitsToSymbol for a lookup-table mapping.';
  }

  return '';
}

function getKindMismatchSuggestion(signalType: SignalType, sourceKind: PortKind, targetKind: PortKind) {
  if (sourceKind === 'sequence' && targetKind === 'scalar') {
    if (signalType === 'bits') {
      return ' This input wants one bit word per tick, not a whole bit buffer. Insert BitsSequenceToTicked.';
    }

    return ' This input wants one symbol per tick, not a whole sequence. Insert SymbolSequenceToTicked or AsciiSequenceToTicked.';
  }

  if (sourceKind === 'scalar' && targetKind === 'sequence') {
    if (signalType === 'bits') {
      return ' This input wants a whole bit sequence, not one word per tick. Insert TickedBitsToSequence.';
    }

    return ' This input wants a whole symbol sequence, not one symbol per tick. Insert TickedSymbolsToSequence.';
  }

  return '';
}

export function formatSignalTypeMismatchMessage(
  sourceLabel: string,
  targetLabel: string,
  sourceType: SignalType,
  targetType: SignalType,
) {
  return `Signal type mismatch from "${sourceLabel}" (${sourceType}) to "${targetLabel}" (${targetType}).${getTypeMismatchSuggestion(sourceType, targetType)}`;
}

export function formatSignalKindMismatchMessage(
  sourceLabel: string,
  targetLabel: string,
  signalType: SignalType,
  sourceKind: PortKind,
  targetKind: PortKind,
) {
  return `Signal kind mismatch from "${sourceLabel}" (${sourceKind}) to "${targetLabel}" (${targetKind}).${getKindMismatchSuggestion(signalType, sourceKind, targetKind)}`;
}
