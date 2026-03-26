import type { Signal } from '../engine/types';
import { validateAsciiSourceValue } from '../engine/modules/ascii-source';
import { validateHexSourceValue } from '../engine/modules/hex-source';
import { validateBaudotText, encodeBaudotText } from '../engine/modules/baudot-codec';

export type SinkRepresentation =
  | 'bits'
  | 'bytes'
  | 'hex'
  | 'ascii'
  | 'text'
  | 'asciiBits'
  | 'asciiHex'
  | 'hexBits'
  | 'baudotBits'
  | 'symbolBits';

export interface RepresentationAvailability {
  bits: true;
  bytes: boolean;
  hex: boolean;
  ascii: boolean;
}

export interface SinkRepresentationOption {
  id: SinkRepresentation;
  label: string;
  value: string;
  available: boolean;
  reason: string | null;
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
      for (let b = 0; b < 8; b += 1) byte = (byte << 1) | bits[i + b];
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
  rep: 'bits' | 'bytes' | 'hex' | 'ascii',
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
export function formatBitsAs(bits: number[], rep: 'bits' | 'bytes' | 'hex' | 'ascii'): string {
  const len = bits.length;
  if (rep === 'bits') return bits.join('');
  if (rep === 'bytes') {
    return groupBits(bits, 8);
  }
  if (rep === 'hex') {
    const nibbles: string[] = [];
    for (let i = 0; i < len; i += 4) {
      let nib = 0;
      for (let b = 0; b < 4; b += 1) nib = (nib << 1) | bits[i + b];
      nibbles.push(nib.toString(16).toUpperCase());
    }
    return nibbles.join('');
  }
  const chars: string[] = [];
  for (let i = 0; i < len; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b += 1) byte = (byte << 1) | bits[i + b];
    chars.push(String.fromCharCode(byte));
  }
  return chars.join('');
}

export function getSinkRepresentationOptions(signal: Signal | undefined): SinkRepresentationOption[] {
  if (!signal) {
    return [];
  }

  if (signal.type === 'bits') {
    const bits = signal.value;
    const availability = getRepresentationAvailability(bits);
    return (['bits', 'bytes', 'hex', 'ascii'] as const).map((rep) => ({
      id: rep,
      label: rep.charAt(0).toUpperCase() + rep.slice(1),
      value: availability[rep] ? formatBitsAs(bits, rep) : '',
      available: availability[rep],
      reason: getUnavailableReason(rep, bits, availability),
    }));
  }

  const text = signal.value;
  const options: SinkRepresentationOption[] = [
    {
      id: 'text',
      label: 'Text',
      value: text,
      available: true,
      reason: null,
    },
  ];

  if (validateAsciiSourceValue(text) === null) {
    const asciiBits = encodeAsciiText(text);
    options.push({
      id: 'asciiBits',
      label: 'ASCII Bits',
      value: groupBits(asciiBits, 8),
      available: true,
      reason: null,
    });
    options.push({
      id: 'asciiHex',
      label: 'ASCII Hex',
      value: encodeAsciiHex(text),
      available: true,
      reason: null,
    });
  }

  if (validateHexSourceValue(text) === null) {
    const normalizedHex = normalizeHex(text);
    options.push({
      id: 'hexBits',
      label: 'Hex Bits',
      value: groupBits(hexToBits(normalizedHex), 4),
      available: true,
      reason: null,
    });
  }

  if (validateBaudotText(text) === null) {
    options.push({
      id: 'baudotBits',
      label: 'Baudot Bits',
      value: groupBits(encodeBaudotText(text), 5),
      available: true,
      reason: null,
    });
  }

  if (/^[A-Z]$/i.test(text)) {
    options.push({
      id: 'symbolBits',
      label: 'Symbol Bits',
      value: encodeAlphabetSymbolBits(text.toUpperCase()).join(''),
      available: true,
      reason: null,
    });
  }

  return options;
}

function groupBits(bits: number[], width: number): string {
  const joined = bits.join('');
  if (joined.length === 0) {
    return '';
  }
  return joined.match(new RegExp(`.{1,${width}}`, 'g'))?.join(' ') ?? joined;
}

function encodeAsciiText(value: string): number[] {
  return value.split('').flatMap((char) => {
    const code = char.charCodeAt(0);
    return [7, 6, 5, 4, 3, 2, 1, 0].map((shift) => (code >> shift) & 1);
  });
}

function encodeAsciiHex(value: string): string {
  return value
    .split('')
    .map((char) => char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}

function normalizeHex(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

function hexToBits(value: string): number[] {
  return value.split('').flatMap((digit) => {
    const nibble = Number.parseInt(digit, 16);
    return [3, 2, 1, 0].map((shift) => (nibble >> shift) & 1);
  });
}

function encodeAlphabetSymbolBits(char: string): number[] {
  const index = char.charCodeAt(0) - 65;
  return [4, 3, 2, 1, 0].map((shift) => (index >> shift) & 1);
}
