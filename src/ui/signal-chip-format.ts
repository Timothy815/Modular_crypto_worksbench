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
  if (signal.type === 'integer') {
    const { value } = signal;
    if (value.length === 0) return '\u2205';
    return value.length > MAX_SYMBOL_CHARS ? `${value.slice(0, MAX_SYMBOL_CHARS)}\u2026` : value;
  }
  const { value } = signal;
  if (value.length === 0) return '\u2205'; // ∅
  return value.length > MAX_SYMBOL_CHARS ? `${value.slice(0, MAX_SYMBOL_CHARS)}\u2026` : value;
}

export interface SignalChipDetail {
  primary: string;
  hex: string | null;
  decimal: string | null;
  meta: string;
}

export function buildSignalChipDetail(signal: Signal): SignalChipDetail {
  if (signal.type === 'bits') {
    const { value } = signal;
    if (value.length === 0) {
      return { primary: '\u2205', hex: null, decimal: null, meta: '0 bits' };
    }

    // Group by 8 (bytes) when ≥8 bits, otherwise by 4 (nibbles)
    const groupSize = value.length >= 8 ? 8 : 4;
    const groups: string[] = [];
    for (let i = 0; i < value.length; i += groupSize) {
      groups.push(value.slice(i, i + groupSize).join(''));
    }
    const primary = groups.join(' ');

    // Hex: pad to nearest nibble boundary, cap at 128 bits
    let hex: string | null = null;
    if (value.length <= 128) {
      const padCount = value.length % 4 === 0 ? 0 : 4 - (value.length % 4);
      const padded = [...Array(padCount).fill(0), ...value];
      const nibbles: string[] = [];
      for (let i = 0; i < padded.length; i += 4) {
        nibbles.push(padded.slice(i, i + 4).join(''));
      }
      hex = '0x' + nibbles.map((n) => parseInt(n, 2).toString(16).toUpperCase()).join('');
    }

    // Decimal: only for ≤32 bits
    const decimal = value.length <= 32 ? String(parseInt(value.join(''), 2)) : null;

    const meta = `${value.length} bit${value.length === 1 ? '' : 's'}`;
    return { primary, hex, decimal, meta };
  }

  if (signal.type === 'integer') {
    const { value } = signal;
    return {
      primary: value,
      hex: null,
      decimal: value,
      meta: `${value.length} digit${value.length === 1 ? '' : 's'}`,
    };
  }

  const { value } = signal;
  if (value.length === 0) {
    return { primary: '\u2205', hex: null, decimal: null, meta: '0 chars' };
  }
  return {
    primary: value,
    hex: null,
    decimal: null,
    meta: `${value.length} char${value.length === 1 ? '' : 's'}`,
  };
}
