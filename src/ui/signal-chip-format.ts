import type { Signal } from '../engine/types';

const MAX_BITS = 8;
const MAX_SYMBOL_CHARS = 10;

export function formatSignalChip(signal: Signal): string {
  if (signal.type === 'bits') {
    const { value } = signal;
    if (value.length === 0) return '\u2205'; // ∅
    if (value.length === 1) return value[0].toString();
    const str = value.slice(0, MAX_BITS).join('');
    return value.length > MAX_BITS ? `${str}\u2026` : str;
  }
  const { value } = signal;
  if (value.length === 0) return '\u2205'; // ∅
  return value.length > MAX_SYMBOL_CHARS ? `${value.slice(0, MAX_SYMBOL_CHARS)}\u2026` : value;
}
