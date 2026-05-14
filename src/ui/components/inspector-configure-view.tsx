import {
  isClockedIteratorDefinition,
  isCompositeDefinition,
  isConditionalDefinition,
} from '../../engine/composites';
import { ECC_CURVE_PARAM_MODULE_IDS, NAMED_CURVE_REGISTRY } from '../../engine/modules/named-curve';
import type {
  ExecutionTraceEntry,
  ModuleDefinition,
  ModuleRegistry,
  ModuleInstance,
  PortDef,
  Project,
} from '../../engine/types';
import { BitsEditor } from './editors/bits-editor';
import { WiringEditor } from './editors/wiring-editor';
import { formatParamValue, parseParamValue } from '../formatters';
import { buildLiveStateSummary } from '../live-state-display';
import { getModuleDetail, getModulePurpose } from '../module-library';
import { getModuleRole, getModuleRoleDetail, getModuleTypicalPath } from '../module-role-language';
import { areParameterValuesEqual, buildParameterComparisonSummary } from '../parameter-comparison';
import { getIteratorRoundSummary } from '../iterator-workflow';
import {
  BitRemapEditor,
  PermutationOrderEditor,
  PlugboardEditor,
  ReflectorEditor,
  RotorWiringEditor,
  SBoxEditor,
} from './structured-editors';
import type { WorkbenchPortLayoutPreset, WorkbenchPortSide } from '../workbench-document';
import { formatLinkedRotorFieldValue, formatParameterComparisonChipLabel, stepHexString } from '../inspector-analysis';
import { buildStageSignalInspection, serializeStageSignalForClipboard } from '../stage-signal-inspection';
import { InspectorIcon, InspectorIconButton, PORT_SIDE_ORDER, ScrubNumberInput } from './inspector-controls';

function getStageSignalRepresentationLabel(
  representation: 'text' | 'bits' | 'bytes' | 'hex' | 'ascii' | 'decimal' | 'point',
) {
  switch (representation) {
    case 'decimal':
      return 'Decimal';
    case 'text':
      return 'Text';
    case 'bits':
      return 'Bits';
    case 'bytes':
      return 'Bytes';
    case 'hex':
      return 'Hex';
    case 'ascii':
      return 'ASCII';
    case 'point':
      return 'Point';
    default:
      return representation;
  }
}

function getStageSignalTypeLabel(
  signalType: 'symbol' | 'bits' | 'integer' | 'ec-point' | null,
  signalLength: number | null,
) {
  if (!signalType) {
    return null;
  }
  const base =
    signalType === 'bits'
      ? 'Bit signal'
      : signalType === 'integer'
        ? 'Integer signal'
        : signalType === 'ec-point'
          ? 'EC point signal'
          : 'Symbol signal';
  return signalLength !== null ? `${base} • ${signalLength}` : base;
}

function getCompatibleSBoxShape(nextInputBits: string, nextOutputBits: string) {
  if (nextInputBits === '4') {
    return { inputBits: '4', outputBits: '4' } as const;
  }

  if (nextInputBits === '6') {
    return { inputBits: '6', outputBits: '4' } as const;
  }

  if (nextInputBits === '8' && nextOutputBits === '8') {
    return { inputBits: '8', outputBits: '8' } as const;
  }

  if (nextOutputBits === '8') {
    return { inputBits: '8', outputBits: '8' } as const;
  }

  return { inputBits: '8', outputBits: '4' } as const;
}

interface ParameterClipboard {
  sourceModuleId: string;
  sourceDefId: string;
  params: Record<string, unknown>;
  paramKeys: string[];
}

interface ReplacementConnectionSummary {
  retained: number;
  dropped: number;
}

interface ConfigureDraggingPortSide {
  direction: 'input' | 'output';
  portName: string;
}

type ConfigureWorkbenchPort = PortDef;

interface InspectorConfigureViewProps {
  stageSignalInspection: ReturnType<typeof buildStageSignalInspection>;
  copiedStageSignalKey: string | null;
  onCopyStageSignal: (copyKey: string, text: string | null) => void | Promise<void>;
  registry: ModuleRegistry;
  moduleDef: ModuleDefinition;
  moduleInstance: ModuleInstance;
  liveStateSummary: ReturnType<typeof buildLiveStateSummary>;
  iteratorRoundSummary: ReturnType<typeof getIteratorRoundSummary> | null;
  clockedIteratorLiveState: {
    currentStep: number;
    halted: boolean;
    accumulatedText: string;
  } | null;
  baselineModuleInstance: ModuleInstance | null;
  linkedRotorSourceInstance: ModuleInstance | null;
  selectedTrace: ExecutionTraceEntry | null;
  isReadOnlyMode: boolean;
  renameDraft: string;
  renameInlineError: string | null;
  renameValidationError: string | null;
  onRenameDraftChange: (draft: string) => void;
  onRenameSubmit: () => void;
  canRenameModuleIds: boolean;
  canBypassSelectedModule: boolean;
  bypassIneligibilityReason: string | null;
  parameterClipboard: ParameterClipboard | null;
  onCopyParams: (moduleId: string) => void;
  onApplyCopiedParams: (
    sourceModuleId: string,
    sourceDefId: string,
    targetModuleIds: string[],
    params: Record<string, unknown>,
    paramKeys: string[],
  ) => void;
  compatibleParamApplyTargetIds: string[];
  selectedIncompatibleParamTargetCount: number;
  onSetModuleBypass: (moduleId: string, bypass: boolean) => void;
  onRotateModuleClockwise?: (moduleId: string) => void;
  onDuplicateModule?: (moduleId: string) => void;
  onReplaceModule?: (moduleId: string, nextDefId: string) => void;
  selectedReplacementDef: ModuleDefinition | null;
  replaceSearchQuery: string;
  onReplaceSearchQueryChange: (query: string) => void;
  replacementCandidates: ModuleDefinition[];
  onSelectedReplacementDefIdChange: (nextDefId: string) => void;
  replacementConnectionSummary: ReplacementConnectionSummary | null;
  onOpenCompositeInstanceDrilldown?: (moduleId: string) => void;
  onUnzipComposite?: (moduleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onOpenCompositeDefinition?: (definitionId: string) => void;
  parameterComparisonSummary: ReturnType<typeof buildParameterComparisonSummary> | null;
  project: Project;
  getParamDraft: (moduleId: string, key: string) => string | undefined;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
  isRawEditorExpanded: (moduleId: string, fieldKey: string) => boolean;
  onToggleRawEditor: (moduleId: string, fieldKey: string) => void;
  onRequestFocusModule?: (moduleId: string) => void;
  activePortLayoutPreset: WorkbenchPortLayoutPreset | null;
  onSetModulePortLayoutPreset?: (
    moduleId: string,
    preset: WorkbenchPortLayoutPreset | null,
  ) => void;
  draggingPortSide: ConfigureDraggingPortSide | null;
  onSetDraggingPortSide: (value: ConfigureDraggingPortSide | null) => void;
  inputPortsBySide: Record<WorkbenchPortSide, ConfigureWorkbenchPort[]>;
  outputPortsBySide: Record<WorkbenchPortSide, ConfigureWorkbenchPort[]>;
  explicitInputPortSides: Record<string, WorkbenchPortSide | undefined>;
  explicitOutputPortSides: Record<string, WorkbenchPortSide | undefined>;
  orderedInputPorts: ConfigureWorkbenchPort[];
  orderedOutputPorts: ConfigureWorkbenchPort[];
  onMoveModulePortOrder?: (
    moduleId: string,
    direction: 'input' | 'output',
    portName: string,
    delta: -1 | 1,
  ) => void;
  onSetModulePortSide?: (
    moduleId: string,
    direction: 'input' | 'output',
    portName: string,
    side: WorkbenchPortSide | null,
  ) => void;
}

export function InspectorConfigureView({
  stageSignalInspection,
  copiedStageSignalKey,
  onCopyStageSignal,
  registry,
  moduleDef,
  moduleInstance,
  liveStateSummary,
  iteratorRoundSummary,
  clockedIteratorLiveState,
  baselineModuleInstance,
  linkedRotorSourceInstance,
  selectedTrace,
  isReadOnlyMode,
  renameDraft,
  renameInlineError,
  renameValidationError,
  onRenameDraftChange,
  onRenameSubmit,
  canRenameModuleIds,
  canBypassSelectedModule,
  bypassIneligibilityReason,
  parameterClipboard,
  onCopyParams,
  onApplyCopiedParams,
  compatibleParamApplyTargetIds,
  selectedIncompatibleParamTargetCount,
  onSetModuleBypass,
  onRotateModuleClockwise,
  onDuplicateModule,
  onReplaceModule,
  selectedReplacementDef,
  replaceSearchQuery,
  onReplaceSearchQueryChange,
  replacementCandidates,
  onSelectedReplacementDefIdChange,
  replacementConnectionSummary,
  onOpenCompositeInstanceDrilldown,
  onUnzipComposite,
  onDeleteModule,
  onOpenCompositeDefinition,
  parameterComparisonSummary,
  project,
  getParamDraft,
  onParamDraftChange,
  onParamChange,
  isRawEditorExpanded,
  onToggleRawEditor,
  onRequestFocusModule,
  activePortLayoutPreset,
  onSetModulePortLayoutPreset,
  draggingPortSide,
  onSetDraggingPortSide,
  inputPortsBySide,
  outputPortsBySide,
  explicitInputPortSides,
  explicitOutputPortSides,
  orderedInputPorts,
  orderedOutputPorts,
  onMoveModulePortOrder,
  onSetModulePortSide,
}: InspectorConfigureViewProps) {
  const renderParameterComparisonChip = (fieldKey: string) => {
    const fieldComparison = parameterComparisonSummary?.fieldsByKey[fieldKey];
    if (!fieldComparison) {
      return null;
    }

    return (
      <span
        className={
          fieldComparison.status === 'aligned'
            ? 'parameter-comparison-chip parameter-comparison-chip-aligned'
            : 'parameter-comparison-chip parameter-comparison-chip-divergent'
        }
      >
        {formatParameterComparisonChipLabel(fieldComparison)}
      </span>
    );
  };

  const renderParamFieldLabel = (
    fieldLabel: string,
    fieldKey: string,
    isForwardedParam: boolean,
  ) => (
    <span className="param-field-label">
      <span className="param-field-label-text">{fieldLabel}</span>
      {isForwardedParam ? <span className="forwarded-param-chip">Forwarded</span> : null}
      {renderParameterComparisonChip(fieldKey)}
    </span>
  );

  return (
    <section className="inspector-section">
      {stageSignalInspection ? (
        <div className="inspector-stage-signal-card">
          <span className="meta-label">Stage Inspection</span>
          {stageSignalInspection.traceMessage ? (
            <p className="comparison-copy">{stageSignalInspection.traceMessage}</p>
          ) : null}
          {stageSignalInspection.display ? (
            <div className="inspector-stage-signal-value">
              <code>{stageSignalInspection.display.value || '∅'}</code>
              {stageSignalInspection.alternateDisplay ? (
                <p className="comparison-copy inspector-stage-signal-alternate">
                  <span className="meta-label">
                    {getStageSignalRepresentationLabel(
                      stageSignalInspection.alternateDisplay.representation,
                    )}
                  </span>{' '}
                  <code>{stageSignalInspection.alternateDisplay.value || '∅'}</code>
                </p>
              ) : null}
              <div className="inspector-stage-signal-meta">
                <span className="content-status-chip">
                  {getStageSignalRepresentationLabel(stageSignalInspection.display.representation)}
                </span>
                {getStageSignalTypeLabel(
                  stageSignalInspection.signalType,
                  stageSignalInspection.signalLength,
                ) ? (
                  <span className="content-status-chip">
                    {getStageSignalTypeLabel(
                      stageSignalInspection.signalType,
                      stageSignalInspection.signalLength,
                    )}
                  </span>
                ) : null}
                {stageSignalInspection.selectedPortName && stageSignalInspection.selectedPortDirection ? (
                  <span className="content-status-chip">
                    {stageSignalInspection.selectedPortDirection === 'output'
                      ? 'Observed output'
                      : 'Observed input'}
                    : {stageSignalInspection.selectedPortName}
                  </span>
                ) : null}
              </div>
              <div className="inspector-stage-signal-actions">
                <button
                  type="button"
                  className="mini-action-button"
                  onClick={() =>
                    void onCopyStageSignal(
                      'display',
                      serializeStageSignalForClipboard(stageSignalInspection.signal, 'display'),
                    )
                  }
                >
                  {copiedStageSignalKey === 'display' ? 'Copied' : 'Copy Value'}
                </button>
                {stageSignalInspection.signal?.type === 'bits' ? (
                  <button
                    type="button"
                    className="mini-action-button"
                    onClick={() =>
                      void onCopyStageSignal(
                        'bits',
                        serializeStageSignalForClipboard(stageSignalInspection.signal, 'bits'),
                      )
                    }
                  >
                    {copiedStageSignalKey === 'bits' ? 'Copied' : 'Copy Bits'}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          <p className="comparison-copy">{stageSignalInspection.roleDetail}</p>
          <div className="inspector-stage-provenance">
            <span className="meta-label">Immediate Inputs</span>
            {stageSignalInspection.parents.length > 0 ? (
              <ul className="inspector-stage-parent-list">
                {stageSignalInspection.parents.map((parent) => (
                  <li key={`${parent.moduleId}:${parent.port}`} className="inspector-stage-parent-item">
                    <strong>{parent.moduleId}</strong>{' '}
                    <span className="meta-label">{parent.defName}</span>
                    <span className="comparison-copy">
                      Arrives on <code>{parent.port}</code>
                      {parent.isBypassed ? ' • currently bypassed' : ''}
                    </span>
                    {parent.display ? (
                      <code className="inspector-stage-parent-signal">{parent.display.value || '∅'}</code>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="comparison-copy">
                No immediate visible input stage is available at this authored level.
              </p>
            )}
          </div>
          <div className="inspector-stage-comparison">
            <span className="meta-label">Direct Comparison</span>
            {stageSignalInspection.comparison ? (
              <>
                <p className="comparison-copy">
                  {stageSignalInspection.comparison.status === 'changed'
                    ? 'This stage changes the signal'
                    : 'This stage leaves the signal unchanged'}{' '}
                  compared with <strong>{stageSignalInspection.comparison.moduleId}</strong>{' '}
                  <span className="meta-label">{stageSignalInspection.comparison.defName}</span> on{' '}
                  <code>{stageSignalInspection.comparison.port}</code>.
                </p>
                <div className="inspector-stage-comparison-grid">
                  <div>
                    <span className="meta-label">Current</span>
                    <code>{stageSignalInspection.comparison.currentDisplay?.value || '∅'}</code>
                  </div>
                  <div>
                    <span className="meta-label">Previous</span>
                    <code>{stageSignalInspection.comparison.previousDisplay?.value || '∅'}</code>
                  </div>
                </div>
              </>
            ) : (
              <p className="comparison-copy">
                No simple same-width previous-stage comparison is available for this selection.
              </p>
            )}
          </div>
        </div>
      ) : null}
      <span className="meta-label">Module</span>
      <strong className="selected-module-name">{moduleInstance.id}</strong>
      <p className="selected-module-type">{moduleDef.id}</p>
      <div className="inspector-module-role-summary">
        <span className="content-status-chip">Role: {getModuleRole(moduleDef)}</span>
        <p className="comparison-copy">{getModuleRoleDetail(moduleDef)}</p>
        {getModuleTypicalPath(moduleDef) ? (
          <p className="comparison-copy inspector-typical-path">
            <span className="meta-label">Typical path</span> {getModuleTypicalPath(moduleDef)}
          </p>
        ) : null}
      </div>
      {'kind' in moduleDef ? (
        moduleDef.kind === 'composite' ? (
          <p className="selected-module-kind">Composite definition</p>
        ) : moduleDef.kind === 'iterator' ? (
          <>
            <p className="selected-module-kind">
              Iterator definition
              {typeof moduleDef.roundKeyWidth === 'number'
                ? ` • ${moduleDef.roundKeyWidth}-bit round keys`
                : ''}
            </p>
            <p className="comparison-copy">
              Body:{' '}
              <strong>{registry[moduleDef.roundDefId]?.name ?? moduleDef.roundDefId}</strong>{' '}
              <span className="meta-label">({moduleDef.roundDefId})</span>
            </p>
            <p className="comparison-copy">
              Default rounds: <strong>{moduleDef.iterationCount}</strong>
            </p>
            {iteratorRoundSummary ? (
              <>
                <p className="comparison-copy">
                  Resolved rounds: <strong>{iteratorRoundSummary.resolvedRounds}</strong>
                </p>
                <p className="comparison-copy">
                  {iteratorRoundSummary.hasInstanceOverride ? (
                    <>
                      <span className="meta-label">Instance override active</span>{' '}
                      <strong>
                        ({iteratorRoundSummary.defaultRounds} → {iteratorRoundSummary.resolvedRounds})
                      </strong>
                    </>
                  ) : (
                    <>
                      <span className="meta-label">Using definition default</span>{' '}
                      <strong>({iteratorRoundSummary.defaultRounds})</strong>
                    </>
                  )}
                </p>
              </>
            ) : null}
          </>
        ) : isClockedIteratorDefinition(moduleDef) ? (
          <>
            <p className="selected-module-kind">Clocked iterator definition</p>
            <p className="comparison-copy">
              Body:{' '}
              <strong>{registry[moduleDef.roundDefId]?.name ?? moduleDef.roundDefId}</strong>{' '}
              <span className="meta-label">({moduleDef.roundDefId})</span>
            </p>
            <p className="comparison-copy">
              Round bank: <strong>{moduleDef.roundCount}</strong> • End policy:{' '}
              <strong>{moduleDef.endPolicy}</strong>
            </p>
            {clockedIteratorLiveState ? (
              <>
                <p className="comparison-copy">
                  Current step:{' '}
                  <strong>
                    {clockedIteratorLiveState.currentStep} / {moduleDef.roundCount}
                  </strong>
                  {clockedIteratorLiveState.halted ? ' • halted' : ''}
                </p>
                <p className="comparison-copy">
                  Accumulated output: <strong>{clockedIteratorLiveState.accumulatedText}</strong>
                </p>
              </>
            ) : null}
          </>
        ) : null
      ) : null}
      {liveStateSummary ? (
        <div className="inspector-live-state-summary" title={liveStateSummary.title}>
          <span className="meta-label">Live State</span>
          <code className="inspector-live-state-value">
            {liveStateSummary.label} {liveStateSummary.displayText}
          </code>
        </div>
      ) : null}
      {isReadOnlyMode ? (
        <div className="param-field selected-module-rename-field">
          <span>Module ID</span>
          <code>{moduleInstance.id}</code>
          <p className="comparison-copy">Read-only inside the selected composite instance.</p>
        </div>
      ) : (
        <div className="param-field selected-module-rename-field">
          <span>Module ID</span>
          <input
            type="text"
            value={renameDraft}
            onChange={(event) => onRenameDraftChange(event.target.value)}
            placeholder="round-1-mixer"
            spellCheck={false}
            disabled={!canRenameModuleIds}
          />
          <p className="comparison-copy">
            Local ID. Use letters, numbers, hyphens, or underscores.
          </p>
          {renameInlineError || renameValidationError ? (
            <p className="field-error">{renameInlineError ?? renameValidationError}</p>
          ) : null}
          {!canRenameModuleIds ? (
            <p className="comparison-copy">
              Rename is unavailable while editing a reusable composite.
            </p>
          ) : null}
        </div>
      )}
      <div className="selected-module-actions">
        {!isReadOnlyMode && Object.values(moduleDef.paramSchema).some((field) => !field.hidden) ? (
          <InspectorIconButton
            icon="copy"
            label="Copy Params"
            onClick={() => onCopyParams(moduleInstance.id)}
          />
        ) : null}
        {!isReadOnlyMode &&
        parameterClipboard &&
        parameterClipboard.sourceModuleId === moduleInstance.id &&
        parameterClipboard.sourceDefId === moduleDef.id ? (
          <button
            type="button"
            className="mini-action-button"
            disabled={compatibleParamApplyTargetIds.length === 0}
            onClick={() =>
              onApplyCopiedParams(
                parameterClipboard.sourceModuleId,
                parameterClipboard.sourceDefId,
                compatibleParamApplyTargetIds,
                parameterClipboard.params,
                parameterClipboard.paramKeys,
              )
            }
          >
            Apply To Selected
          </button>
        ) : null}
        {!isReadOnlyMode && canRenameModuleIds ? (
          <InspectorIconButton icon="rename" label="Rename Module" onClick={onRenameSubmit} />
        ) : null}
        {!isReadOnlyMode && canBypassSelectedModule ? (
          <InspectorIconButton
            icon="bypass"
            label={moduleInstance.bypass ? 'Disable Bypass' : 'Enable Bypass'}
            onClick={() => onSetModuleBypass(moduleInstance.id, !moduleInstance.bypass)}
          />
        ) : null}
        {!isReadOnlyMode && onRotateModuleClockwise ? (
          <InspectorIconButton
            icon="rotate"
            label="Rotate 90°"
            onClick={() => onRotateModuleClockwise(moduleInstance.id)}
          />
        ) : null}
        {!isReadOnlyMode && onDuplicateModule ? (
          <InspectorIconButton
            icon="duplicate"
            label="Duplicate Module"
            onClick={() => onDuplicateModule(moduleInstance.id)}
          />
        ) : null}
        {!isReadOnlyMode && onReplaceModule ? (
          <button
            type="button"
            className="mini-action-button"
            onClick={() => {
              if (selectedReplacementDef) {
                onReplaceModule(moduleInstance.id, selectedReplacementDef.id);
              }
            }}
            disabled={!selectedReplacementDef}
          >
            Replace with…
          </button>
        ) : null}
        {!isReadOnlyMode &&
        (isCompositeDefinition(moduleDef) || isConditionalDefinition(moduleDef)) &&
        onOpenCompositeInstanceDrilldown ? (
          <button
            type="button"
            className="mini-action-button"
            title="Open selected composite instance (Enter)"
            onClick={() => onOpenCompositeInstanceDrilldown(moduleInstance.id)}
          >
            Open Instance
          </button>
        ) : null}
        {!isReadOnlyMode && isCompositeDefinition(moduleDef) && onUnzipComposite ? (
          <button
            type="button"
            className="primitive-add-button"
            title="Unzip selected composite instance (Cmd/Ctrl+Shift+U)"
            onClick={() => onUnzipComposite(moduleInstance.id)}
          >
            Unzip Composite
          </button>
        ) : null}
        {!isReadOnlyMode ? (
          <InspectorIconButton
            icon="delete"
            label="Delete Module"
            tone="danger"
            onClick={() => onDeleteModule(moduleInstance.id)}
          />
        ) : null}
        {isReadOnlyMode && isCompositeDefinition(moduleDef) && onOpenCompositeDefinition ? (
          <button
            type="button"
            className="mini-action-button"
            onClick={() => onOpenCompositeDefinition(moduleDef.id)}
          >
            Edit Shared Definition
          </button>
        ) : null}
      </div>
      {!isReadOnlyMode && onReplaceModule ? (
        <div className="content-selector-card">
          <div className="param-field">
            <label className="param-field-label" htmlFor="replace-module-search">
              <span className="param-field-label-text">Replace With</span>
            </label>
            <input
              id="replace-module-search"
              type="search"
              value={replaceSearchQuery}
              onChange={(event) => onReplaceSearchQueryChange(event.target.value)}
              placeholder="Search modules by name, role, or purpose"
            />
          </div>
          <div className="param-field">
            <label className="param-field-label" htmlFor="replace-module-select">
              <span className="param-field-label-text">Candidate</span>
            </label>
            <select
              id="replace-module-select"
              value={selectedReplacementDef?.id ?? ''}
              onChange={(event) => onSelectedReplacementDefIdChange(event.target.value)}
            >
              {replacementCandidates.length > 0 ? (
                replacementCandidates.map((definition) => (
                  <option key={definition.id} value={definition.id}>
                    {definition.name} ({definition.id})
                  </option>
                ))
              ) : (
                <option value="">No matching modules</option>
              )}
            </select>
          </div>
          {selectedReplacementDef ? (
            <>
              <div className="content-selector-meta">
                <span className="content-status-chip">
                  Role: {getModuleRole(selectedReplacementDef)}
                </span>
                <span className="content-status-chip">
                  {selectedReplacementDef.inputs.length} in · {selectedReplacementDef.outputs.length} out
                </span>
              </div>
              <p className="comparison-copy">{getModulePurpose(selectedReplacementDef)}</p>
              <p className="comparison-copy">{getModuleDetail(selectedReplacementDef)}</p>
            </>
          ) : (
            <p className="comparison-copy">No replacement candidates match the current search.</p>
          )}
          {replacementConnectionSummary ? (
            <p className="comparison-copy">
              Replacement keeps <strong>{replacementConnectionSummary.retained}</strong> connection
              {replacementConnectionSummary.retained === 1 ? '' : 's'} and removes{' '}
              <strong>{replacementConnectionSummary.dropped}</strong> incompatible connection
              {replacementConnectionSummary.dropped === 1 ? '' : 's'}.
            </p>
          ) : null}
        </div>
      ) : null}
      {!isReadOnlyMode &&
      parameterClipboard &&
      parameterClipboard.sourceModuleId === moduleInstance.id &&
      parameterClipboard.sourceDefId === moduleDef.id ? (
        <div className="content-selector-card">
          <p className="comparison-copy">
            Copied parameter set from <strong>{moduleInstance.id}</strong>. Apply will target{' '}
            <strong>{compatibleParamApplyTargetIds.length}</strong> selected {moduleDef.id} module
            {compatibleParamApplyTargetIds.length === 1 ? '' : 's'}.
          </p>
          {selectedIncompatibleParamTargetCount > 0 ? (
            <p className="comparison-copy">
              {selectedIncompatibleParamTargetCount} selected module
              {selectedIncompatibleParamTargetCount === 1 ? '' : 's'} will be skipped because they
              are not {moduleDef.id} instances.
            </p>
          ) : null}
        </div>
      ) : null}

      {!isReadOnlyMode && canBypassSelectedModule ? (
        <div className="content-selector-card">
          <p className="comparison-copy">
            Bypass keeps this module in the graph but passes its single input straight through
            unchanged.
          </p>
          <div className="content-selector-meta">
            <span className="content-status-chip">
              {moduleInstance.bypass ? 'Bypass Active' : 'Bypass Off'}
            </span>
            <span className="content-status-chip">Eligible: one-input / one-output / same-domain</span>
          </div>
        </div>
      ) : null}
      {!isReadOnlyMode && bypassIneligibilityReason ? (
        <div className="content-selector-card">
          <p className="comparison-copy">Bypass unavailable: {bypassIneligibilityReason}</p>
        </div>
      ) : null}
      {parameterComparisonSummary ? (
        <div className="content-selector-card parameter-comparison-summary-card">
          <p className="comparison-copy">
            Selected sibling comparison anchored to <strong>{moduleInstance.id}</strong>.
          </p>
          <div className="content-selector-meta">
            <span className="content-status-chip">
              {parameterComparisonSummary.siblingModuleIds.length} same-definition sibling
              {parameterComparisonSummary.siblingModuleIds.length === 1 ? '' : 's'}
            </span>
            <span className="content-status-chip">
              {parameterComparisonSummary.alignedFieldCount} aligned field
              {parameterComparisonSummary.alignedFieldCount === 1 ? '' : 's'}
            </span>
            <span className="content-status-chip">
              {parameterComparisonSummary.divergentFieldCount} divergent field
              {parameterComparisonSummary.divergentFieldCount === 1 ? '' : 's'}
            </span>
          </div>
          {parameterComparisonSummary.siblingModuleIds.length > 0 ? (
            <p className="comparison-copy">
              Comparing against <strong>{parameterComparisonSummary.siblingModuleIds.join(', ')}</strong>.
            </p>
          ) : null}
          {parameterComparisonSummary.incompatibleSelectedCount > 0 ? (
            <p className="comparison-copy">
              {parameterComparisonSummary.incompatibleSelectedCount} selected module
              {parameterComparisonSummary.incompatibleSelectedCount === 1 ? '' : 's'} skipped because
              they are not {moduleDef.id} instances.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="param-list">
        {Object.values(moduleDef.paramSchema).filter((field) => !field.hidden).length === 0 ? (
          <p className="empty-state">This module has no configurable parameters.</p>
        ) : (
          Object.values(moduleDef.paramSchema)
            .filter((field) => !field.hidden)
            .map((field) => {
              const isReadOnlyLinkedRotorField =
                moduleDef.id === 'RotorReverse' &&
                Boolean(linkedRotorSourceInstance) &&
                (field.key === 'wiring' ||
                  field.key === 'position' ||
                  field.key === 'ringOffset' ||
                  field.key === 'notches');
              const value = isReadOnlyLinkedRotorField
                ? linkedRotorSourceInstance?.params[field.key] ?? field.defaultValue
                : moduleInstance.params[field.key] ?? field.defaultValue;
              const baselineValue = baselineModuleInstance?.params[field.key] ?? field.defaultValue;
              const draftValue = getParamDraft(moduleInstance.id, field.key);
              const renderedValue = draftValue ?? formatParamValue(value, field);
              const parsedDraft =
                draftValue !== undefined ? parseParamValue(draftValue, field) : null;
              const fieldError = parsedDraft && !parsedDraft.ok ? parsedDraft.error : null;
              const isForwardedParam =
                isCompositeDefinition(moduleDef) &&
                (moduleDef.forwardedParams ?? []).some(
                  (binding) => binding.externalParam === field.key,
                );

              if (isReadOnlyMode) {
                return (
                  <div key={field.key} className="param-field param-field-read-only">
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    <code>{formatParamValue(value, field)}</code>
                  </div>
                );
              }

              if (moduleDef.id === 'RotorReverse' && field.key === 'linkedRotorId') {
                const rotorOptions = project.modules.filter((candidate) => candidate.defId === 'Rotor');

                return (
                  <label key={field.key} className="param-field">
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    <select
                      value={String(moduleInstance.params[field.key] ?? '')}
                      onChange={(event) => onParamChange(moduleInstance.id, field.key, event.target.value)}
                    >
                      <option value="">Unlinked</option>
                      {rotorOptions.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.id}
                        </option>
                      ))}
                    </select>
                    {linkedRotorSourceInstance ? (
                      <div className="param-stepper-row">
                        <span className="content-status-chip">
                          Mirroring rotor state from {linkedRotorSourceInstance.id}
                        </span>
                        {onRequestFocusModule ? (
                          <button
                            type="button"
                            className="mini-action-button"
                            onClick={() => onRequestFocusModule(linkedRotorSourceInstance.id)}
                          >
                            Go To Linked Rotor
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {fieldError ? <p className="field-error">{fieldError}</p> : null}
                  </label>
                );
              }

              if (isReadOnlyLinkedRotorField) {
                return (
                  <label key={field.key} className="param-field">
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    {!areParameterValuesEqual(value, baselineValue) ? (
                      <span className="baseline-chip">
                        Baseline: {formatParamValue(baselineValue, field)}
                      </span>
                    ) : null}
                    <div className="readonly-param-value">
                      {formatLinkedRotorFieldValue(field.key, value)}
                    </div>
                    <p className="meta-copy">
                      Mirrored from the linked forward rotor. Edit the forward rotor to change this
                      value.
                    </p>
                  </label>
                );
              }

              if (!isReadOnlyMode && field.key === 'p' && ECC_CURVE_PARAM_MODULE_IDS.has(moduleDef.id)) {
                const curvePresetBlock = (
                  <div key="__curve-preset" className="param-field param-curve-preset">
                    <span className="param-field-label">
                      <span className="param-field-label-text">Load curve preset</span>
                    </span>
                    <select
                      value=""
                      onChange={(event) => {
                        const curveName = event.target.value;
                        if (!curveName) return;
                        const entry = NAMED_CURVE_REGISTRY[curveName];
                        if (!entry) return;
                        onParamChange(moduleInstance.id, 'p', entry.p);
                        onParamChange(moduleInstance.id, 'a', entry.a);
                        onParamChange(moduleInstance.id, 'b', entry.b);
                      }}
                    >
                      <option value="">— select to fill p, a, b —</option>
                      {Object.entries(NAMED_CURVE_REGISTRY).map(([curveName, entry]) => (
                        <option key={curveName} value={curveName}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                    <p className="meta-copy">
                      Fills the field parameters below from a standard curve definition. You can
                      verify or change any value after loading.
                    </p>
                  </div>
                );

                return (
                  <>
                    {curvePresetBlock}
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {!areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <input
                        type="text"
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
                  </>
                );
              }

              if (field.kind === 'boolean') {
                return (
                  <label key={field.key} className="param-field">
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    {!areParameterValuesEqual(value, baselineValue) ? (
                      <span className="baseline-chip">
                        Baseline: {formatParamValue(baselineValue, field)}
                      </span>
                    ) : null}
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
                const isSBoxWidthField =
                  moduleDef.id === 'SBox' &&
                  (field.key === 'inputBits' || field.key === 'outputBits');

                return (
                  <label key={field.key} className="param-field">
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    {!areParameterValuesEqual(value, baselineValue) ? (
                      <span className="baseline-chip">
                        Baseline: {formatParamValue(baselineValue, field)}
                      </span>
                    ) : null}
                    <select
                      value={String(value)}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        if (!isSBoxWidthField) {
                          onParamChange(moduleInstance.id, field.key, nextValue);
                          return;
                        }

                        const nextInputBits =
                          field.key === 'inputBits'
                            ? nextValue
                            : String(moduleInstance.params.inputBits ?? '4');
                        const nextOutputBits =
                          field.key === 'outputBits'
                            ? nextValue
                            : String(moduleInstance.params.outputBits ?? '4');
                        const compatibleShape = getCompatibleSBoxShape(nextInputBits, nextOutputBits);

                        onParamChange(moduleInstance.id, 'inputBits', compatibleShape.inputBits);
                        onParamChange(moduleInstance.id, 'outputBits', compatibleShape.outputBits);
                      }}
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
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    {!areParameterValuesEqual(value, baselineValue) ? (
                      <span className="baseline-chip">
                        Baseline: {formatParamValue(baselineValue, field)}
                      </span>
                    ) : null}
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
                const isRotorWiringField =
                  (moduleDef.id === 'Rotor' || moduleDef.id === 'RotorReverse') &&
                  field.key === 'wiring';
                const isPlugboardWiringField =
                  moduleDef.id === 'Plugboard' && field.key === 'wiring';
                const isReflectorWiringField =
                  moduleDef.id === 'Reflector' && field.key === 'wiring';

                if (isRotorWiringField) {
                  return (
                    <RotorWiringEditor
                      key={field.key}
                      label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      field={field}
                      moduleId={moduleInstance.id}
                      moduleParams={moduleInstance.params}
                      value={value}
                      baselineValue={baselineValue}
                      renderedValue={renderedValue}
                      fieldError={fieldError ?? null}
                      isReadOnlyMode={isReadOnlyMode}
                      rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                      onToggleRawEditor={() => onToggleRawEditor(moduleInstance.id, field.key)}
                      onParamDraftChange={onParamDraftChange}
                      onParamChange={onParamChange}
                    />
                  );
                }

                if (isPlugboardWiringField) {
                  return (
                    <PlugboardEditor
                      key={field.key}
                      label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      field={field}
                      moduleId={moduleInstance.id}
                      moduleParams={moduleInstance.params}
                      value={value}
                      baselineValue={baselineValue}
                      renderedValue={renderedValue}
                      fieldError={fieldError ?? null}
                      isReadOnlyMode={isReadOnlyMode}
                      rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                      onToggleRawEditor={() => onToggleRawEditor(moduleInstance.id, field.key)}
                      onParamDraftChange={onParamDraftChange}
                      onParamChange={onParamChange}
                    />
                  );
                }

                if (isReflectorWiringField) {
                  return (
                    <ReflectorEditor
                      key={field.key}
                      label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      field={field}
                      moduleId={moduleInstance.id}
                      moduleParams={moduleInstance.params}
                      value={value}
                      baselineValue={baselineValue}
                      renderedValue={renderedValue}
                      fieldError={fieldError ?? null}
                      isReadOnlyMode={isReadOnlyMode}
                      rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                      onToggleRawEditor={() => onToggleRawEditor(moduleInstance.id, field.key)}
                      onParamDraftChange={onParamDraftChange}
                      onParamChange={onParamChange}
                    />
                  );
                }

                return (
                  <label key={field.key} className="param-field">
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    {!areParameterValuesEqual(value, baselineValue) ? (
                      <span className="baseline-chip">
                        Baseline: {formatParamValue(baselineValue, field)}
                      </span>
                    ) : null}
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

              const isSBoxTableField =
                moduleDef.id === 'SBox' &&
                field.key === 'table' &&
                field.kind === 'string';

              if (isSBoxTableField) {
                return (
                  <SBoxEditor
                    key={field.key}
                    label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    field={field}
                    moduleId={moduleInstance.id}
                    moduleParams={moduleInstance.params}
                    value={value}
                    baselineValue={baselineValue}
                    renderedValue={renderedValue}
                    fieldError={fieldError ?? null}
                    isReadOnlyMode={isReadOnlyMode}
                    rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                    onToggleRawEditor={() => onToggleRawEditor(moduleInstance.id, field.key)}
                    onParamDraftChange={onParamDraftChange}
                    onParamChange={onParamChange}
                  />
                );
              }

              const isPermutationOrderField =
                (moduleDef.id === 'Permutation' || moduleDef.id === 'SymbolPermutation') &&
                field.key === 'order' &&
                field.kind === 'string';

              if (isPermutationOrderField) {
                return (
                  <PermutationOrderEditor
                    key={field.key}
                    label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    field={field}
                    moduleId={moduleInstance.id}
                    moduleParams={moduleInstance.params}
                    value={value}
                    baselineValue={baselineValue}
                    renderedValue={renderedValue}
                    fieldError={fieldError ?? null}
                    isReadOnlyMode={isReadOnlyMode}
                    rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                    onToggleRawEditor={() => onToggleRawEditor(moduleInstance.id, field.key)}
                    onParamDraftChange={onParamDraftChange}
                    onParamChange={onParamChange}
                    renderToolButton={({ icon, label, onClick }) => (
                      <InspectorIconButton icon={icon} label={label} onClick={onClick} />
                    )}
                  />
                );
              }

              const isBitRemapOrderField =
                (moduleDef.id === 'BitSelect' || moduleDef.id === 'BitExpand') &&
                field.key === 'order' &&
                field.kind === 'string';

              if (isBitRemapOrderField) {
                const bitRemapInputWidthHint =
                  typeof moduleInstance.params.inputWidth === 'number'
                    ? moduleInstance.params.inputWidth
                    : null;
                const bitRemapLiveInputWidth =
                  selectedTrace?.inputs?.in?.type === 'bits'
                    ? selectedTrace.inputs.in.value.length
                    : null;
                return (
                  <BitRemapEditor
                    key={field.key}
                    label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    field={field}
                    moduleId={moduleInstance.id}
                    value={value}
                    renderedValue={renderedValue}
                    fieldError={fieldError ?? null}
                    isReadOnlyMode={isReadOnlyMode}
                    rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                    onToggleRawEditor={() => onToggleRawEditor(moduleInstance.id, field.key)}
                    onParamDraftChange={onParamDraftChange}
                    onParamChange={onParamChange}
                    allowRepeats={moduleDef.id === 'BitExpand'}
                    inputWidthHint={bitRemapInputWidthHint}
                    liveInputWidth={bitRemapLiveInputWidth}
                  />
                );
              }

              const isHexSourceValueField =
                moduleDef.id === 'HexSource' &&
                field.key === 'value' &&
                field.kind === 'string';

              return (
                <label key={field.key} className="param-field">
                  {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                  {!areParameterValuesEqual(value, baselineValue) ? (
                    <span className="baseline-chip">
                      Baseline: {formatParamValue(baselineValue, field)}
                    </span>
                  ) : null}
                  {field.kind === 'number' ? (
                    <ScrubNumberInput
                      renderedValue={renderedValue}
                      onRawChange={(rawValue) => {
                        onParamDraftChange(moduleInstance.id, field.key, rawValue);
                        const parsed = parseParamValue(rawValue, field);
                        if (parsed.ok) {
                          onParamChange(moduleInstance.id, field.key, parsed.value);
                        }
                      }}
                    />
                  ) : (
                    <input
                      type="text"
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
                  )}
                  {isHexSourceValueField ? (
                    <div className="param-stepper-row">
                      <button
                        type="button"
                        className="mini-action-button"
                        disabled={Boolean(fieldError)}
                        onClick={() => {
                          const nextValue = stepHexString(
                            String(value ?? field.defaultValue ?? ''),
                            -1,
                          );
                          onParamDraftChange(moduleInstance.id, field.key, nextValue);
                          onParamChange(moduleInstance.id, field.key, nextValue);
                        }}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        className="mini-action-button"
                        disabled={Boolean(fieldError)}
                        onClick={() => {
                          const nextValue = stepHexString(
                            String(value ?? field.defaultValue ?? ''),
                            1,
                          );
                          onParamDraftChange(moduleInstance.id, field.key, nextValue);
                          onParamChange(moduleInstance.id, field.key, nextValue);
                        }}
                      >
                        +1
                      </button>
                    </div>
                  ) : null}
                  {fieldError ? <p className="field-error">{fieldError}</p> : null}
                </label>
              );
            })
        )}
      </div>

      <div className="selected-ports">
        {onSetModulePortLayoutPreset ? (
          <div className="port-layout-presets">
            <span className="meta-label">Port Layout</span>
            <div className="port-layout-preset-controls">
              <button
                type="button"
                className={`port-layout-preset-button${activePortLayoutPreset === null ? ' active' : ''}`}
                aria-pressed={activePortLayoutPreset === null}
                title="Default port layout"
                onClick={() => onSetModulePortLayoutPreset(moduleInstance.id, null)}
              >
                <InspectorIcon name="ports-default" />
                <span>Default</span>
              </button>
              <button
                type="button"
                className={`port-layout-preset-button${activePortLayoutPreset === 'horizontal' ? ' active' : ''}`}
                aria-pressed={activePortLayoutPreset === 'horizontal'}
                title="Inputs left, outputs right"
                onClick={() => onSetModulePortLayoutPreset(moduleInstance.id, 'horizontal')}
              >
                <InspectorIcon name="ports-horizontal" />
                <span>Horizontal</span>
              </button>
              <button
                type="button"
                className={`port-layout-preset-button${activePortLayoutPreset === 'vertical' ? ' active' : ''}`}
                aria-pressed={activePortLayoutPreset === 'vertical'}
                title="Inputs top, outputs bottom"
                onClick={() => onSetModulePortLayoutPreset(moduleInstance.id, 'vertical')}
              >
                <InspectorIcon name="ports-vertical" />
                <span>Vertical</span>
              </button>
            </div>
          </div>
        ) : null}
        {onSetModulePortSide ? (
          <div className="port-side-authoring">
            <span className="meta-label">Port Sides</span>
            <div className="port-side-sections">
              <div className="port-side-section">
                <span className="meta-label">Inputs</span>
                <div className="port-side-grid">
                  {PORT_SIDE_ORDER.map((side) => (
                    <div
                      key={`input-${side}`}
                      className={`port-side-bin${
                        draggingPortSide?.direction === 'input' ? ' port-side-bin-targetable' : ''
                      }`}
                      onDragOver={(event) => {
                        if (draggingPortSide?.direction !== 'input') {
                          return;
                        }
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (draggingPortSide?.direction !== 'input') {
                          return;
                        }
                        event.preventDefault();
                        onSetModulePortSide(moduleInstance.id, 'input', draggingPortSide.portName, side);
                        onSetDraggingPortSide(null);
                      }}
                    >
                      <span className="port-side-bin-label">{side}</span>
                      <div className="port-side-chip-list">
                        {inputPortsBySide[side].map((port) => (
                          <span
                            key={`${side}-input-${port.name}`}
                            className={`port-side-chip${
                              draggingPortSide?.direction === 'input' &&
                              draggingPortSide.portName === port.name
                                ? ' dragging'
                                : ''
                            }`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', port.name);
                              onSetDraggingPortSide({ direction: 'input', portName: port.name });
                            }}
                            onDragEnd={() => onSetDraggingPortSide(null)}
                          >
                            <span className="port-side-chip-name">{port.name}</span>
                            {explicitInputPortSides[port.name] ? (
                              <button
                                type="button"
                                className="port-side-chip-reset"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onSetModulePortSide(moduleInstance.id, 'input', port.name, null);
                                }}
                              >
                                Auto
                              </button>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="port-side-section">
                <span className="meta-label">Outputs</span>
                <div className="port-side-grid">
                  {PORT_SIDE_ORDER.map((side) => (
                    <div
                      key={`output-${side}`}
                      className={`port-side-bin${
                        draggingPortSide?.direction === 'output' ? ' port-side-bin-targetable' : ''
                      }`}
                      onDragOver={(event) => {
                        if (draggingPortSide?.direction !== 'output') {
                          return;
                        }
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (draggingPortSide?.direction !== 'output') {
                          return;
                        }
                        event.preventDefault();
                        onSetModulePortSide(
                          moduleInstance.id,
                          'output',
                          draggingPortSide.portName,
                          side,
                        );
                        onSetDraggingPortSide(null);
                      }}
                    >
                      <span className="port-side-bin-label">{side}</span>
                      <div className="port-side-chip-list">
                        {outputPortsBySide[side].map((port) => (
                          <span
                            key={`${side}-output-${port.name}`}
                            className={`port-side-chip${
                              draggingPortSide?.direction === 'output' &&
                              draggingPortSide.portName === port.name
                                ? ' dragging'
                                : ''
                            }`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', port.name);
                              onSetDraggingPortSide({ direction: 'output', portName: port.name });
                            }}
                            onDragEnd={() => onSetDraggingPortSide(null)}
                          >
                            <span className="port-side-chip-name">{port.name}</span>
                            {explicitOutputPortSides[port.name] ? (
                              <button
                                type="button"
                                className="port-side-chip-reset"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onSetModulePortSide(moduleInstance.id, 'output', port.name, null);
                                }}
                              >
                                Auto
                              </button>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className="port-group">
          <span className="meta-label">Inputs</span>
          {moduleDef.inputs.length === 0 ? (
            <p className="empty-state">No input ports</p>
          ) : (
            <ul className="port-list">
              {orderedInputPorts.map((port, index) => (
                <li key={port.name}>
                  <div className="port-list-entry">
                    <div className="port-list-copy">
                      <strong>{port.name}</strong>
                      <span>{port.type}</span>
                    </div>
                    {onMoveModulePortOrder && orderedInputPorts.length > 1 ? (
                      <div className="port-order-controls">
                        <InspectorIconButton
                          icon="move-up"
                          label={`Move ${port.name} up`}
                          onClick={() => onMoveModulePortOrder(moduleInstance.id, 'input', port.name, -1)}
                          disabled={index === 0}
                        />
                        <InspectorIconButton
                          icon="move-down"
                          label={`Move ${port.name} down`}
                          onClick={() => onMoveModulePortOrder(moduleInstance.id, 'input', port.name, 1)}
                          disabled={index === orderedInputPorts.length - 1}
                        />
                      </div>
                    ) : null}
                  </div>
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
              {orderedOutputPorts.map((port, index) => (
                <li key={port.name}>
                  <div className="port-list-entry">
                    <div className="port-list-copy">
                      <strong>{port.name}</strong>
                      <span>{port.type}</span>
                    </div>
                    {onMoveModulePortOrder && orderedOutputPorts.length > 1 ? (
                      <div className="port-order-controls">
                        <InspectorIconButton
                          icon="move-up"
                          label={`Move ${port.name} up`}
                          onClick={() => onMoveModulePortOrder(moduleInstance.id, 'output', port.name, -1)}
                          disabled={index === 0}
                        />
                        <InspectorIconButton
                          icon="move-down"
                          label={`Move ${port.name} down`}
                          onClick={() => onMoveModulePortOrder(moduleInstance.id, 'output', port.name, 1)}
                          disabled={index === orderedOutputPorts.length - 1}
                        />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
