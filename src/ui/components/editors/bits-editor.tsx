import type { ParamFieldDef } from '../../../engine/types';
import { parseParamValue } from '../../formatters';

interface BitsEditorProps {
  field: ParamFieldDef;
  value: unknown;
  renderedValue: string;
  moduleId: string;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
}

export function BitsEditor({
  field,
  value,
  renderedValue,
  moduleId,
  onParamDraftChange,
  onParamChange,
}: BitsEditorProps) {
  const bits = getBitsEditorValue(renderedValue, value);

  return (
    <div className="bits-editor">
      <div className="bits-chip-list">
        {bits.map((bit, index) => (
          <button
            key={`${field.key}:${index}`}
            type="button"
            className={bit === 1 ? 'bit-chip active' : 'bit-chip'}
            onClick={() => {
              const nextBits = bits.map((entry, entryIndex) =>
                entryIndex === index ? (entry === 1 ? 0 : 1) : entry,
              );
              applyStructuredParamChange(
                moduleId,
                field.key,
                nextBits.join(', '),
                field,
                onParamDraftChange,
                onParamChange,
              );
            }}
          >
            {bit}
          </button>
        ))}
      </div>
      <div className="bits-editor-actions">
        <button
          type="button"
          className="mini-action-button"
          onClick={() => {
            const nextBits = [...bits, 0];
            applyStructuredParamChange(
              moduleId,
              field.key,
              nextBits.join(', '),
              field,
              onParamDraftChange,
              onParamChange,
            );
          }}
        >
          Add Bit
        </button>
        <button
          type="button"
          className="mini-action-button"
          onClick={() => {
            const nextBits = bits.length > 1 ? bits.slice(0, -1) : [0];
            applyStructuredParamChange(
              moduleId,
              field.key,
              nextBits.join(', '),
              field,
              onParamDraftChange,
              onParamChange,
            );
          }}
        >
          Remove Last
        </button>
      </div>
      <p className="structured-param-preview">{bits.join(' ')}</p>
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

function getBitsEditorValue(renderedValue: string, value: unknown): number[] {
  const parsed = parseParamValue(renderedValue, {
    key: 'bits',
    label: 'Bits',
    kind: 'bits',
    defaultValue: [],
  });
  if (parsed.ok && Array.isArray(parsed.value)) {
    return parsed.value as number[];
  }

  if (Array.isArray(value) && value.every((entry) => entry === 0 || entry === 1)) {
    return value as number[];
  }

  return [0];
}
