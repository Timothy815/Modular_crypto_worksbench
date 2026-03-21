import type { ParamFieldDef, Signal } from '../engine/types';

export function formatSignal(signal: Signal | undefined): string {
  if (!signal) {
    return 'n/a';
  }

  return signal.type === 'symbol'
    ? signal.value
    : `[${signal.value.join(', ')}]`;
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

export function parseParamValue(rawValue: string, field: ParamFieldDef): unknown {
  switch (field.kind) {
    case 'number':
      return rawValue === '' ? field.defaultValue : Number(rawValue);
    case 'boolean':
      return rawValue === 'true';
    case 'bits':
      return rawValue
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((part) => Number(part));
    case 'wiring':
      return rawValue
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((part) => part.toUpperCase());
    case 'select':
    case 'string':
    default:
      return rawValue;
  }
}
