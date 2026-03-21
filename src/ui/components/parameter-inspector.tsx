import type { ExecutionResult, ModuleDef, ModuleInstance } from '../../engine/types';
import { formatParamValue, formatSignal, parseParamValue } from '../formatters';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface ParameterInspectorProps {
  execution: ExecutionResult | null;
  executionError: string | null;
  moduleDef: ModuleDef | null;
  moduleInstance: ModuleInstance | null;
  getParamDraft: (moduleId: string, key: string) => string | undefined;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
  onDeleteModule: (moduleId: string) => void;
}

export function ParameterInspector({
  execution,
  executionError,
  moduleDef,
  moduleInstance,
  getParamDraft,
  onParamDraftChange,
  onParamChange,
  onDeleteModule,
}: ParameterInspectorProps) {
  const outputTrace = execution?.trace.at(-1);
  const selectedTrace = execution?.trace.find(
    (entry) => entry.moduleId === moduleInstance?.id,
  );

  return (
    <aside className="panel inspector-panel">
      <div className="panel-head">
        <p className="panel-label">Inspector</p>
        <h2>Selection + Trace</h2>
      </div>

      <div className="trace-summary">
        <span className="meta-label">Final Input To Output</span>
        <strong>{formatSignal(outputTrace?.inputs.in)}</strong>
      </div>

      {moduleDef && moduleInstance ? (
        <section className="inspector-section">
          <span className="meta-label">Selected Module</span>
          <strong className="selected-module-name">{moduleInstance.id}</strong>
          <p className="selected-module-type">{moduleDef.id}</p>
          <button
            type="button"
            className="delete-module-button"
            onClick={() => onDeleteModule(moduleInstance.id)}
          >
            Delete Module
          </button>

          <div className="param-list">
            {Object.values(moduleDef.paramSchema).length === 0 ? (
              <p className="empty-state">This module has no configurable parameters.</p>
            ) : (
              Object.values(moduleDef.paramSchema).map((field) => {
                const value =
                  moduleInstance.params[field.key] ?? field.defaultValue;
                const draftValue = getParamDraft(moduleInstance.id, field.key);
                const renderedValue =
                  draftValue ?? formatParamValue(value, field);
                const parsedDraft =
                  draftValue !== undefined ? parseParamValue(draftValue, field) : null;
                const fieldError = parsedDraft && !parsedDraft.ok ? parsedDraft.error : null;

                if (field.kind === 'boolean') {
                  return (
                    <label key={field.key} className="param-field">
                      <span>{field.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.checked)
                        }
                      />
                    </label>
                  );
                }

                if (field.kind === 'select') {
                  return (
                    <label key={field.key} className="param-field">
                      <span>{field.label}</span>
                      <select
                        value={String(value)}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.value)
                        }
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.kind === 'bits') {
                  const bits = getBitsEditorValue(renderedValue, value);

                  return (
                    <label key={field.key} className="param-field">
                      <span>{field.label}</span>
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
                                  moduleInstance.id,
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
                                moduleInstance.id,
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
                                moduleInstance.id,
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
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                if (field.kind === 'wiring') {
                  const wiringEntries = getWiringEditorValue(renderedValue, value);

                  return (
                    <label key={field.key} className="param-field">
                      <span>{field.label}</span>
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
                                    moduleInstance.id,
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
                        <p className="structured-param-preview">
                          {wiringEntries.join(' ')}
                        </p>
                      </div>
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="param-field">
                    <span>{field.label}</span>
                    <input
                      type={field.kind === 'number' ? 'number' : 'text'}
                      value={renderedValue}
                      onChange={(event) => {
                        const rawValue = event.target.value;
                        onParamDraftChange(moduleInstance.id, field.key, rawValue);
                        const parsed = parseParamValue(rawValue, field);
                        if (parsed.ok) {
                          onParamChange(moduleInstance.id, field.key, parsed.value);
                        }
                      }}
                    />
                    {fieldError ? <p className="field-error">{fieldError}</p> : null}
                  </label>
                );
              })
            )}
          </div>

          <div className="selected-ports">
            <div className="port-group">
              <span className="meta-label">Inputs</span>
              {moduleDef.inputs.length === 0 ? (
                <p className="empty-state">No input ports</p>
              ) : (
                <ul className="port-list">
                  {moduleDef.inputs.map((port) => (
                    <li key={port.name}>
                      <strong>{port.name}</strong>
                      <span>{port.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="port-group">
              <span className="meta-label">Outputs</span>
              {moduleDef.outputs.length === 0 ? (
                <p className="empty-state">No output ports</p>
              ) : (
                <ul className="port-list">
                  {moduleDef.outputs.map((port) => (
                    <li key={port.name}>
                      <strong>{port.name}</strong>
                      <span>{port.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {executionError ? (
            <p className="inspector-warning">
              Current edits make the graph invalid. Fix parameter values or graph
              data to restore execution.
            </p>
          ) : selectedTrace ? (
            <div className="selected-trace">
              <span className="meta-label">Selected Trace</span>
              <p>
                inputs:{' '}
                {Object.entries(selectedTrace.inputs)
                  .map(([, signal]) => formatSignal(signal))
                  .join(' | ') || 'none'}
              </p>
              <p>
                outputs:{' '}
                {Object.entries(selectedTrace.outputs)
                  .map(([, signal]) => formatSignal(signal))
                  .join(' | ') || 'none'}
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="empty-state">Select a module to inspect and edit its parameters.</p>
      )}

      <ol className="trace-list">
        {(execution?.trace ?? []).map((entry) => (
          <li key={entry.moduleId} className="trace-card">
            <div className="trace-head">
              <strong>{entry.moduleId}</strong>
              <span>{entry.defId}</span>
            </div>
            <p>
              inputs:{' '}
              {Object.entries(entry.inputs)
                .map(([, signal]) => formatSignal(signal))
                .join(' | ') || 'none'}
            </p>
            <p>
              outputs:{' '}
              {Object.entries(entry.outputs)
                .map(([, signal]) => formatSignal(signal))
                .join(' | ') || 'none'}
            </p>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function applyStructuredParamChange(
  moduleId: string,
  key: string,
  rawValue: string,
  field: ModuleDef['paramSchema'][string],
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
