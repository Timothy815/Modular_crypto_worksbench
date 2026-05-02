import type { OutputSinkDefId } from '../engine/output-sinks';
import type { EcPointSignalValue, Signal } from '../engine/types';
import { validateAsciiSourceValue } from '../engine/modules/ascii-source';
import { formatEcPointAsHex, formatEcPointAsText } from '../engine/modules/ec-point';
import { validateHexSourceValue } from '../engine/modules/hex-source';
import { formatUnsignedIntegerAsHex } from '../engine/modules/integer-signal';
import { encodeBaudotText, validateBaudotText } from '../engine/modules/baudot-codec';

export type SinkRepresentation = 'text' | 'bits' | 'bytes' | 'hex' | 'ascii' | 'decimal' | 'point';

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

export function getRepresentationAvailability(bits: number[]): RepresentationAvailability {
  const len = bits.length;
  const canBytes = len > 0 && len % 8 === 0;
  const canHex = len > 0 && len % 4 === 0;
  let canAscii = canBytes;
  if (canAscii) {
    for (let i = 0; i < len; i += 8) {
      let byte = 0;
      for (let b = 0; b < 8; b += 1) {
        byte = (byte << 1) | bits[i + b];
      }
      if (byte > 0x7f) {
        canAscii = false;
        break;
      }
    }
  }
  return { bits: true, bytes: canBytes, hex: canHex, ascii: canAscii };
}

export function getUnavailableReason(
  rep: 'bits' | 'bytes' | 'hex' | 'ascii',
  bits: number[],
  availability: RepresentationAvailability,
): string | null {
  if (availability[rep]) {
    return null;
  }
  const len = bits.length;
  if (rep === 'bytes') {
    return `Width ${len} is not divisible by 8`;
  }
  if (rep === 'hex') {
    return `Width ${len} is not divisible by 4`;
  }
  if (len === 0 || len % 8 !== 0) {
    return `Width ${len} is not divisible by 8`;
  }
  return 'Contains non-ASCII bytes (> 0x7F)';
}

export function formatBitsAs(bits: number[], rep: 'bits' | 'bytes' | 'hex' | 'ascii'): string {
  const len = bits.length;
  if (rep === 'bits') {
    return bits.join('');
  }
  if (rep === 'bytes') {
    return groupBits(bits, 8);
  }
  if (rep === 'hex') {
    const nibbles: string[] = [];
    for (let i = 0; i < len; i += 4) {
      let nibble = 0;
      for (let b = 0; b < 4; b += 1) {
        nibble = (nibble << 1) | bits[i + b];
      }
      nibbles.push(nibble.toString(16).toUpperCase());
    }
    return nibbles.join('');
  }

  const chars: string[] = [];
  for (let i = 0; i < len; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b += 1) {
      byte = (byte << 1) | bits[i + b];
    }
    chars.push(String.fromCharCode(byte));
  }
  return chars.join('');
}

export function getSinkRepresentationOptions(
  sinkDefId: OutputSinkDefId | undefined,
  signal: Signal | undefined,
): SinkRepresentationOption[] {
  if (!sinkDefId || !signal) {
    return [];
  }

  if (sinkDefId === 'BitOutput') {
    return signal.type === 'bits' ? buildBitOptions(signal.value) : [];
  }

  if (sinkDefId === 'IntegerOutput') {
    return signal.type === 'integer' ? buildIntegerOutputOptions(signal.value) : [];
  }

  if (sinkDefId === 'PointOutput') {
    return signal.type === 'ec-point' ? buildPointOutputOptions(signal.value) : [];
  }

  if (signal.type !== 'symbol') {
    return [];
  }

  if (sinkDefId === 'HexOutput') {
    return buildHexOutputOptions(signal.value);
  }

  if (sinkDefId === 'BaudotOutput') {
    return buildBaudotOutputOptions(signal.value);
  }

  return buildTextOutputOptions(signal.value);
}

function buildBitOptions(bits: number[]): SinkRepresentationOption[] {
  const availability = getRepresentationAvailability(bits);
  return (['bits', 'bytes', 'hex', 'ascii'] as const).map((rep) => ({
    id: rep,
    label: rep.charAt(0).toUpperCase() + rep.slice(1),
    value: availability[rep] ? formatBitsAs(bits, rep) : '',
    available: availability[rep],
    reason: getUnavailableReason(rep, bits, availability),
  }));
}

function buildTextOutputOptions(text: string): SinkRepresentationOption[] {
  const asciiError = validateAsciiSourceValue(text);
  const bits = asciiError === null ? encodeAsciiText(text) : [];
  const availability = asciiError === null ? getRepresentationAvailability(bits) : null;

  return [
    {
      id: 'text',
      label: 'Text',
      value: text,
      available: true,
      reason: null,
    },
    {
      id: 'bits',
      label: 'Bits',
      value: asciiError === null ? formatBitsAs(bits, 'bits') : '',
      available: asciiError === null,
      reason: asciiError === null ? null : 'Requires 7-bit ASCII text',
    },
    {
      id: 'bytes',
      label: 'Bytes',
      value: asciiError === null && availability?.bytes ? formatBitsAs(bits, 'bytes') : '',
      available: asciiError === null && Boolean(availability?.bytes),
      reason:
        asciiError === null
          ? getUnavailableReason('bytes', bits, availability ?? getRepresentationAvailability([]))
          : 'Requires 7-bit ASCII text',
    },
    {
      id: 'hex',
      label: 'Hex',
      value: asciiError === null && availability?.hex ? formatBitsAs(bits, 'hex') : '',
      available: asciiError === null && Boolean(availability?.hex),
      reason:
        asciiError === null
          ? getUnavailableReason('hex', bits, availability ?? getRepresentationAvailability([]))
          : 'Requires 7-bit ASCII text',
    },
  ];
}

function buildHexOutputOptions(text: string): SinkRepresentationOption[] {
  const hexError = validateHexSourceValue(text);
  const bits = hexError === null ? hexToBits(normalizeHex(text)) : [];
  const availability = hexError === null ? getRepresentationAvailability(bits) : null;

  return [
    {
      id: 'hex',
      label: 'Hex',
      value: normalizeHex(text),
      available: true,
      reason: null,
    },
    {
      id: 'bits',
      label: 'Bits',
      value: hexError === null ? formatBitsAs(bits, 'bits') : '',
      available: hexError === null,
      reason: hexError === null ? null : 'Requires a valid even-length hexadecimal string',
    },
    {
      id: 'bytes',
      label: 'Bytes',
      value: hexError === null && availability?.bytes ? formatBitsAs(bits, 'bytes') : '',
      available: hexError === null && Boolean(availability?.bytes),
      reason:
        hexError === null
          ? getUnavailableReason('bytes', bits, availability ?? getRepresentationAvailability([]))
          : 'Requires a valid even-length hexadecimal string',
    },
    {
      id: 'ascii',
      label: 'ASCII',
      value: hexError === null && availability?.ascii ? formatBitsAs(bits, 'ascii') : '',
      available: hexError === null && Boolean(availability?.ascii),
      reason:
        hexError === null
          ? getUnavailableReason('ascii', bits, availability ?? getRepresentationAvailability([]))
          : 'Requires a valid even-length hexadecimal string',
    },
  ];
}

function buildBaudotOutputOptions(text: string): SinkRepresentationOption[] {
  const baudotError = validateBaudotText(text);
  const bits = baudotError === null ? encodeBaudotText(text) : [];
  const availability = baudotError === null ? getRepresentationAvailability(bits) : null;

  return [
    {
      id: 'text',
      label: 'Text',
      value: text,
      available: true,
      reason: null,
    },
    {
      id: 'bits',
      label: 'Bits',
      value: baudotError === null ? groupBits(bits, 5) : '',
      available: baudotError === null,
      reason: baudotError === null ? null : 'Requires valid Baudot letters-mode text',
    },
    {
      id: 'hex',
      label: 'Hex',
      value: baudotError === null && availability?.hex ? formatBitsAs(bits, 'hex') : '',
      available: baudotError === null && Boolean(availability?.hex),
      reason:
        baudotError === null
          ? getUnavailableReason('hex', bits, availability ?? getRepresentationAvailability([]))
          : 'Requires valid Baudot letters-mode text',
    },
  ];
}

function buildIntegerOutputOptions(value: string): SinkRepresentationOption[] {
  return [
    {
      id: 'decimal',
      label: 'Decimal',
      value,
      available: true,
      reason: null,
    },
    {
      id: 'hex',
      label: 'Hex',
      value: formatUnsignedIntegerAsHex(value),
      available: true,
      reason: null,
    },
  ];
}

function buildPointOutputOptions(signalValue: EcPointSignalValue): SinkRepresentationOption[] {
  return [
    {
      id: 'point',
      label: 'Point',
      value: formatEcPointAsText(signalValue),
      available: true,
      reason: null,
    },
    {
      id: 'hex',
      label: 'Hex',
      value: formatEcPointAsHex(signalValue),
      available: true,
      reason: null,
    },
  ];
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

function normalizeHex(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

function hexToBits(value: string): number[] {
  return value.split('').flatMap((digit) => {
    const nibble = Number.parseInt(digit, 16);
    return [3, 2, 1, 0].map((shift) => (nibble >> shift) & 1);
  });
}
