import type { ParamFieldDef } from '../../../engine/types';
import { parseParamValue } from '../../formatters';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface WiringEditorProps {
  field: ParamFieldDef;
  value: unknown;
  renderedValue: string;
  moduleId: string;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
}

export function WiringEditor({
  field,
  value,
  renderedValue,
  moduleId,
  onParamDraftChange,
  onParamChange,
}: WiringEditorProps) {
  const wiringEntries = getWiringEditorValue(renderedValue, value);

  return (
    <div className="wiring-editor">
      <div className="wiring-grid">
        {ALPHABET.map((sourceLetter, index) => (
          <label key={`${field.key}:${sourceLetter}`} className="wiring-cell">
            <span className="wiring-source">{sourceLetter}</span>
            <span className="wiring-arrow">→</span>
            <select
              value={wiringEntries[index] ?? sourceLetter}
              onChange={(event) => {
                const nextEntries = wiringEntries.slice();
                nextEntries[index] = event.target.value.toUpperCase();
                applyStructuredParamChange(
                  moduleId,
                  field.key,
                  nextEntries.join(', '),
                  field,
                  onParamDraftChange,
                  onParamChange,
                );
              }}
            >
              {ALPHABET.map((targetLetter) => (
                <option key={targetLetter} value={targetLetter}>
                  {targetLetter}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="structured-param-preview">{wiringEntries.join(' ')}</p>
    </div>
  );
}

function applyStructuredParamChange(
  moduleId: string,
  key: string,
  rawValue: string,
  field: ParamFieldDef,
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void,
  onParamChange: (moduleId: string, key: string, value: unknown) => void,
) {
  onParamDraftChange(moduleId, key, rawValue);
  const parsed = parseParamValue(rawValue, field);
  if (parsed.ok) {
    onParamChange(moduleId, key, parsed.value);
  }
}

function getWiringEditorValue(renderedValue: string, value: unknown): string[] {
  const parts = renderedValue
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((entry) => entry.toUpperCase())
    .slice(0, 26);

  if (parts.length === 26 && parts.every((entry) => /^[A-Z]$/.test(entry))) {
    return parts;
  }

  if (
    Array.isArray(value) &&
    value.length === 26 &&
    value.every((entry) => typeof entry === 'string' && /^[A-Z]$/.test(entry))
  ) {
    return value as string[];
  }

  return ALPHABET;
}
