import type { ExecutionResult, ModuleDef, ModuleInstance } from '../../engine/types';
import { formatParamValue, formatSignal, parseParamValue } from '../formatters';

interface ParameterInspectorProps {
  execution: ExecutionResult | null;
  executionError: string | null;
  moduleDef: ModuleDef | null;
  moduleInstance: ModuleInstance | null;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
}

export function ParameterInspector({
  execution,
  executionError,
  moduleDef,
  moduleInstance,
  onParamChange,
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

          <div className="param-list">
            {Object.values(moduleDef.paramSchema).length === 0 ? (
              <p className="empty-state">This module has no configurable parameters.</p>
            ) : (
              Object.values(moduleDef.paramSchema).map((field) => {
                const value =
                  moduleInstance.params[field.key] ?? field.defaultValue;

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

                const multiline =
                  field.kind === 'bits' || field.kind === 'wiring';

                return (
                  <label key={field.key} className="param-field">
                    <span>{field.label}</span>
                    {multiline ? (
                      <textarea
                        rows={field.kind === 'wiring' ? 3 : 2}
                        value={formatParamValue(value, field)}
                        onChange={(event) =>
                          onParamChange(
                            moduleInstance.id,
                            field.key,
                            parseParamValue(event.target.value, field),
                          )
                        }
                      />
                    ) : (
                      <input
                        type={field.kind === 'number' ? 'number' : 'text'}
                        value={formatParamValue(value, field)}
                        onChange={(event) =>
                          onParamChange(
                            moduleInstance.id,
                            field.key,
                            parseParamValue(event.target.value, field),
                          )
                        }
                      />
                    )}
                  </label>
                );
              })
            )}
          </div>

          {executionError ? (
            <p className="inspector-warning">
              Current edits make the graph invalid. Fix the parameter values to
              restore execution.
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
