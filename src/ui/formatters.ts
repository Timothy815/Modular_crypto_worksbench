import type { ParamFieldDef, Signal } from '../engine/types';
import { formatEcPointAsText } from '../engine/modules/ec-point';

export interface ParsedParamResult {
  ok: boolean;
  value?: unknown;
  error?: string;
}

export function formatSignal(signal: Signal | undefined): string {
  if (!signal) {
    return 'n/a';
  }

  return signal.type === 'symbol'
    ? signal.value
    : signal.type === 'bits'
      ? `[${signal.value.join(', ')}]`
      : signal.type === 'integer'
        ? signal.value
        : formatEcPointAsText(signal.value);
}

function truncateHex(hex: string, keep = 6): string {
  if (hex.length <= keep * 2 + 2) return hex;
  return `${hex.slice(0, keep)}…${hex.slice(-keep)}`;
}

/** Compact variant for trace/step contexts where space is limited. */
export function formatSignalCompact(signal: Signal | undefined): string {
  if (!signal) return 'n/a';

  if (signal.type === 'ec-point') {
    if (signal.value.kind === 'infinity') return '∞';
    const xHex = BigInt(signal.value.x).toString(16).toUpperCase();
    const yHex = BigInt(signal.value.y).toString(16).toUpperCase();
    return `(0x${truncateHex(xHex)}, 0x${truncateHex(yHex)})`;
  }

  return formatSignal(signal);
}

export function formatParamValue(value: unknown, field: ParamFieldDef): string {
  if (value === undefined) {
    return String(field.defaultValue ?? '');
  }

  if (field.kind === 'bits' && Array.isArray(value)) {
    return value.join(', ');
  }

  if (field.kind === 'wiring' && Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
}

export function parseParamValue(rawValue: string, field: ParamFieldDef): ParsedParamResult {
  switch (field.kind) {
    case 'number':
      if (rawValue.trim() === '') {
        return { ok: true, value: field.defaultValue };
      }

      if (!Number.isFinite(Number(rawValue))) {
        return { ok: false, error: 'Enter a valid finite number.' };
      }

      return { ok: true, value: Number(rawValue) };
    case 'boolean':
      return { ok: true, value: rawValue === 'true' };
    case 'bits': {
      const normalized = rawValue
        .trim()
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .trim();
      if (normalized === '') {
        return { ok: false, error: 'Enter bits as 0/1 values or a continuous bit string.' };
      }

      const compactBinary = normalized.replace(/[\s,]+/g, '');
      const parts =
        compactBinary.length > 0 && /^[01]+$/.test(compactBinary)
          ? compactBinary.split('')
          : normalized.split(/[\s,]+/).filter(Boolean);
      if (parts.length === 0) {
        return { ok: false, error: 'Enter bits as 0/1 values or a continuous bit string.' };
      }

      const parsed = parts.map((part) => Number(part));
      if (!parsed.every((value) => value === 0 || value === 1)) {
        return { ok: false, error: 'Bits must be 0 or 1.' };
      }

      return { ok: true, value: parsed };
    }
    case 'wiring': {
      const parts = rawValue
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((part) => part.toUpperCase());

      if (parts.length !== 26) {
        return { ok: false, error: 'Wiring must contain exactly 26 letters.' };
      }

      if (!parts.every((part) => /^[A-Z]$/.test(part))) {
        return { ok: false, error: 'Wiring entries must be single uppercase letters A-Z.' };
      }

      if (new Set(parts).size !== 26) {
        return { ok: false, error: 'Wiring must be a permutation with no duplicates.' };
      }

      return { ok: true, value: parts };
    }
    case 'bigint-hex': {
      const stripped = rawValue.trim().replace(/^0x/i, '');
      if (stripped === '') {
        return { ok: false, error: 'Enter a hex value (e.g. 11 for 17).' };
      }
      if (!/^[0-9a-fA-F]+$/.test(stripped)) {
        return { ok: false, error: 'Enter a valid hex string (digits 0-9, A-F).' };
      }
      return { ok: true, value: stripped.toUpperCase() };
    }
    case 'select':
      return { ok: true, value: rawValue };
    case 'string':
    default:
      return { ok: true, value: rawValue };
  }
}
