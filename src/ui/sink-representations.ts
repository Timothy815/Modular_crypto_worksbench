/**
 * Pure helpers for sink output representation views.
 * Converts raw bit arrays into human-readable formats.
 */

export type SinkRepresentation = 'bits' | 'bytes' | 'hex' | 'ascii';

export interface RepresentationAvailability {
  bits: true;
  bytes: boolean;
  hex: boolean;
  ascii: boolean;
}

/** Determine which representations are available for a given bit array. */
export function getRepresentationAvailability(bits: number[]): RepresentationAvailability {
  const len = bits.length;
  const canBytes = len > 0 && len % 8 === 0;
  const canHex = len > 0 && len % 4 === 0;
  let canAscii = canBytes;
  if (canAscii) {
    for (let i = 0; i < len; i += 8) {
      let byte = 0;
      for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
      if (byte > 0x7f) {
        canAscii = false;
        break;
      }
    }
  }
  return { bits: true, bytes: canBytes, hex: canHex, ascii: canAscii };
}

/** Explain why a representation is unavailable. Returns null if available. */
export function getUnavailableReason(
  rep: SinkRepresentation,
  bits: number[],
  availability: RepresentationAvailability,
): string | null {
  if (availability[rep]) return null;
  const len = bits.length;
  if (rep === 'bytes') return `Width ${len} is not divisible by 8`;
  if (rep === 'hex') return `Width ${len} is not divisible by 4`;
  if (rep === 'ascii') {
    if (len === 0 || len % 8 !== 0) return `Width ${len} is not divisible by 8`;
    return 'Contains non-ASCII bytes (> 0x7F)';
  }
  return null;
}

/** Format a bit array into the given representation string. */
export function formatBitsAs(bits: number[], rep: SinkRepresentation): string {
  const len = bits.length;
  if (rep === 'bits') return bits.join('');
  if (rep === 'bytes') {
    const bytes: string[] = [];
    for (let i = 0; i < len; i += 8) {
      let byte = 0;
      for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
      bytes.push(byte.toString());
    }
    return `[${bytes.join(', ')}]`;
  }
  if (rep === 'hex') {
    const nibbles: string[] = [];
    for (let i = 0; i < len; i += 4) {
      let nib = 0;
      for (let b = 0; b < 4; b++) nib = (nib << 1) | bits[i + b];
      nibbles.push(nib.toString(16).toUpperCase());
    }
    return nibbles.join('');
  }
  // ascii
  const chars: string[] = [];
  for (let i = 0; i < len; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
    chars.push(String.fromCharCode(byte));
  }
  return chars.join('');
}
