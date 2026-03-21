import type {
  ExecutionResult,
  ModuleDefinition,
  ModuleInstance,
  ValidationIssue,
} from '../../engine/types';
import { BitsEditor } from './editors/bits-editor';
import { WiringEditor } from './editors/wiring-editor';
import { formatParamValue, formatSignal, parseParamValue } from '../formatters';

interface ParameterInspectorProps {
  execution: ExecutionResult | null;
  executionError: string | null;
  validationIssues: ValidationIssue[];
  moduleDef: ModuleDefinition | null;
  moduleInstance: ModuleInstance | null;
  getParamDraft: (moduleId: string, key: string) => string | undefined;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
  onDeleteModule: (moduleId: string) => void;
}

export function ParameterInspector({
  execution,
  executionError,
  validationIssues,
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
  const selectedTraceOrder = selectedTrace
    ? (execution?.order.findIndex((moduleId) => moduleId === selectedTrace.moduleId) ?? -1) + 1
    : null;
  const selectedIssues = moduleInstance
    ? validationIssues.filter(
        (issue) =>
          issue.moduleId === moduleInstance.id ||
          issue.connection?.from.moduleId === moduleInstance.id ||
          issue.connection?.to.moduleId === moduleInstance.id,
      )
    : [];
  const globalIssues = moduleInstance
    ? validationIssues.filter((issue) => !selectedIssues.includes(issue))
    : validationIssues;

  return (
    <aside className="panel inspector-panel">
      <div className="panel-head">
        <p className="panel-label">Inspector</p>
        <h2>Selection + Trace</h2>
      </div>

      <div className="trace-summary">
        <span className="meta-label">Final Input To Output</span>
        <strong>{formatSignal(outputTrace?.inputs.in)}</strong>
        <p className="trace-summary-subtitle">
          {validationIssues.length > 0
            ? `${validationIssues.length} validation issue${validationIssues.length === 1 ? '' : 's'} blocking execution`
            : execution
              ? `${execution.trace.length} module${execution.trace.length === 1 ? '' : 's'} executed`
              : 'Execution is waiting for a valid graph'}
        </p>
      </div>

      {moduleDef && moduleInstance ? (
        <section className="inspector-section">
          <span className="meta-label">Selected Module</span>
          <strong className="selected-module-name">{moduleInstance.id}</strong>
          <p className="selected-module-type">{moduleDef.id}</p>
          {'kind' in moduleDef && moduleDef.kind === 'composite' ? (
            <p className="selected-module-kind">Composite definition</p>
          ) : null}
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
                  return (
                    <label key={field.key} className="param-field">
                      <span>{field.label}</span>
                      <BitsEditor
                        field={field}
                        value={value}
                        renderedValue={renderedValue}
                        moduleId={moduleInstance.id}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                if (field.kind === 'wiring') {
                  return (
                    <label key={field.key} className="param-field">
                      <span>{field.label}</span>
                      <WiringEditor
                        field={field}
                        value={value}
                        renderedValue={renderedValue}
                        moduleId={moduleInstance.id}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
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

          {selectedIssues.length > 0 ? (
            <div className="analysis-section">
              <span className="meta-label">Selected Issues</span>
              <ul className="issue-list">
                {selectedIssues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`} className="issue-card">
                    <strong>{humanizeIssueCode(issue.code)}</strong>
                    <p>{issue.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {executionError ? (
            <p className="inspector-warning">
              {validationIssues.length > 0
                ? 'Current edits make the graph invalid. Resolve the issues below to restore execution.'
                : executionError}
            </p>
          ) : selectedTrace ? (
            <div className="selected-trace">
              <span className="meta-label">Selected Trace</span>
              <p className="selected-trace-order">
                Step {selectedTraceOrder ?? '?'} of{' '}
                {execution?.order.length ?? 0}
              </p>
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

      {globalIssues.length > 0 ? (
        <section className="analysis-section">
          <span className="meta-label">Graph Issues</span>
          <ul className="issue-list">
            {globalIssues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="issue-card">
                <strong>{humanizeIssueCode(issue.code)}</strong>
                <p>{issue.message}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ol className="trace-list">
        {(execution?.trace ?? []).map((entry, index) => (
          <li
            key={entry.moduleId}
            className={
              entry.moduleId === moduleInstance?.id
                ? 'trace-card trace-card-active'
                : 'trace-card'
            }
          >
            <div className="trace-head">
              <strong>{entry.moduleId}</strong>
              <span>
                #{index + 1} {entry.defId}
              </span>
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

function humanizeIssueCode(code: ValidationIssue['code']) {
  return code
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
