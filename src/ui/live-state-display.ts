import type { ModuleDefinition, ModuleInstance, ModuleParams, StatefulModuleDef } from '../engine/types';

const ROTOR_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
type LiveStateDisplayFormat = 'default' | 'bits' | 'rotor-position' | undefined;

export interface LiveStateSummary {
  label: string;
  startText: string;
  currentText: string;
  previousText: string | null;
  displayText: string;
  title: string;
  changedFromStart: boolean;
  advancedSinceLastTick: boolean;
}

function getStatefulLiveStateDef(def: ModuleDefinition | undefined): StatefulModuleDef | null {
  if (!def || !('advance' in def) || typeof def.advance !== 'function') {
    return null;
  }

  return def as StatefulModuleDef;
}

function formatRotorPosition(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return String(value);
  }

  const normalized = ((Math.trunc(value) % ROTOR_ALPHABET.length) + ROTOR_ALPHABET.length) % ROTOR_ALPHABET.length;
  return ROTOR_ALPHABET[normalized] ?? String(value);
}

function formatBitsValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join('');
  }

  return String(value);
}

function formatDisplayValue(
  value: unknown,
  format: LiveStateDisplayFormat,
) {
  if (value === undefined) {
    return '';
  }

  switch (format) {
    case 'rotor-position':
      return formatRotorPosition(value);
    case 'bits':
      return formatBitsValue(value);
    default:
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      if (value && typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
  }
}

function compactDisplayText(text: string) {
  if (text.length <= 12) {
    return text;
  }

  return `${text.slice(0, 5)}…${text.slice(-4)}`;
}

export function buildLiveStateSummary(
  def: ModuleDefinition | undefined,
  moduleInstance: ModuleInstance,
  tickParams: ModuleParams | undefined,
  previousTickParams: ModuleParams | undefined,
): LiveStateSummary | null {
  const statefulDef = getStatefulLiveStateDef(def);
  const liveStateDisplay = statefulDef?.liveStateDisplay;
  if (!liveStateDisplay || !tickParams) {
    return null;
  }

  const currentValue = tickParams[liveStateDisplay.key];
  if (currentValue === undefined) {
    return null;
  }

  const startValue = moduleInstance.params[liveStateDisplay.key];
  const previousValue = previousTickParams?.[liveStateDisplay.key];
  const startText = formatDisplayValue(startValue, liveStateDisplay.format);
  const currentText = formatDisplayValue(currentValue, liveStateDisplay.format);
  const previousText =
    previousValue === undefined ? null : formatDisplayValue(previousValue, liveStateDisplay.format);
  const changedFromStart = startText !== currentText;
  const advancedSinceLastTick = previousText !== null && previousText !== currentText;
  const displayText = changedFromStart
    ? `${compactDisplayText(startText)} -> ${compactDisplayText(currentText)}`
    : compactDisplayText(currentText);
  const title = changedFromStart
    ? `${liveStateDisplay.label}: ${startText} -> ${currentText}`
    : `${liveStateDisplay.label}: ${currentText}`;

  return {
    label: liveStateDisplay.label,
    startText,
    currentText,
    previousText,
    displayText,
    title,
    changedFromStart,
    advancedSinceLastTick,
  };
}
