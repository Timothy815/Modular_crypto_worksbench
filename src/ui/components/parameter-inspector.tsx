import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { isCompositeDefinition } from '../../engine/composites';
import { getBypassIneligibilityReason, isBypassEligibleDefinition } from '../../engine/bypass';
import { isOutputSinkDefId } from '../../engine/output-sinks';
import type {
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleDefinition,
  ModuleRegistry,
  ModuleInstance,
  Project,
  ValidationIssue,
} from '../../engine/types';
import { BitsEditor } from './editors/bits-editor';
import { WiringEditor } from './editors/wiring-editor';
import { formatParamValue, formatSignal, parseParamValue } from '../formatters';
import {
  getSinkRepresentationOptions,
  type SinkRepresentation,
} from '../sink-representations';
import {
  getModuleInstanceIdValidationError,
  normalizeModuleInstanceIdCandidate,
} from '../module-instance-id';
import {
  areParameterValuesEqual,
  buildParameterComparisonSummary,
} from '../parameter-comparison';
import type { TutorialStep } from '../tutorials';
import { ComparisonPanel } from './comparison-panel';
import type { ComparisonBaselineDocument } from '../workbench-document';
import type { ExecutionComparison } from '../execution-compare';
import type {
  VerificationCase,
  VerificationCaseResult,
  VerificationSourceOption,
} from '../verification-workflow';
import {
  buildInversePermutationOrder,
  buildIdentityPermutationOrder,
  buildReversePermutationOrder,
  serializePermutationOrder,
  swapPermutationOrderPositions,
} from '../../engine/modules/permutation';
import {
  buildIdentityPlugboardWiring,
  normalizePlugboardReciprocalWiring,
  pairPlugboardLetters,
  serializePlugboardWiring,
  unpairPlugboardLetter,
} from '../../engine/modules/plugboard';
import {
  normalizeReflectorReciprocalWiring,
  pairReflectorLetters,
  serializeReflectorWiring,
} from '../../engine/modules/reflector';
import {
  serializeRotorWiring,
  swapRotorWiringTargets,
} from '../../engine/modules/rotor';
import {
  serializeSBoxTable,
  swapSBoxEntry,
} from '../../engine/modules/s-box';
import {
  buildPairStyles,
  formatIteratorRoundLabel,
  formatLinkedRotorFieldValue,
  formatParameterComparisonChipLabel,
  formatSBoxAxisLabel,
  formatSBoxHexValue,
  getDisplayTraceModuleId,
  getEditablePermutationOrder,
  getEditablePlugboardWiring,
  getEditableReflectorWiring,
  getEditableRotorWiring,
  getEditableSBoxTable,
  getIssueTargetModuleId,
  getIteratorRoundOptions,
  getIteratorRoundPath,
  getNestedTracePath,
  getPairKey,
  getPermutationWireColor,
  getTopLevelTraceModuleId,
  getTraceEntries,
  getTransformationView,
  groupIssuesByTarget,
  isSimplePermutationOrder,
  measureWireLayout,
  PERMUTATION_EDITOR_HEADER_OFFSET,
  PERMUTATION_EDITOR_PORT_GAP,
  PERMUTATION_EDITOR_PORT_HEIGHT,
  stepHexString,
} from '../inspector-analysis';
import {
  countSBoxFixedPoints,
  getSBoxGridColumn,
  getSBoxGridColumns,
  getSBoxGridRow,
  generateSBoxTable,
  invertSBoxTable,
  isSBoxInvolution,
  rotateSBoxColumn,
  rotateSBoxRow,
  swapSBoxColumns,
  swapSBoxRows,
  SBOX_GENERATION_SIZES,
  SBOX_GENERATION_PRESETS,
} from '../sbox-transforms';

interface ParameterInspectorProps {
  execution: ExecutionResult | null;
  registry: ModuleRegistry;
  executionError: string | null;
  validationIssues: ValidationIssue[];
  stepIndex: number | null;
  project: Project;
  tutorialStep: TutorialStep | null;
  projectName: string;
  comparisonBaseline: ComparisonBaselineDocument | null;
  executionComparison: ExecutionComparison | null;
  baselineOutput: string;
  variantOutput: string;
  verificationSourceOptions: VerificationSourceOption[];
  verificationCases: VerificationCase[];
  verificationResults: VerificationCaseResult[];
  baselineExecutionError: string | null;
  baselineModuleInstance: ModuleInstance | null;
  moduleDef: ModuleDefinition | null;
  moduleInstance: ModuleInstance | null;
  selectedModuleIds: string[];
  parameterClipboard: {
    sourceModuleId: string;
    sourceDefId: string;
    params: Record<string, unknown>;
    paramKeys: string[];
  } | null;
  getParamDraft: (moduleId: string, key: string) => string | undefined;
  onCopyParams: (moduleId: string) => void;
  onApplyCopiedParams: (
    sourceModuleId: string,
    sourceDefId: string,
    targetModuleIds: string[],
    params: Record<string, unknown>,
    paramKeys: string[],
  ) => void;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
  onSetModuleBypass: (moduleId: string, bypass: boolean) => void;
  onRenameModuleInstance?: (moduleId: string, nextModuleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  canRenameModuleIds?: boolean;
  onUnzipComposite?: (moduleId: string) => void;
  onSelectIssueTarget: (moduleId: string) => void;
  onTraceHover: (moduleId: string | null) => void;
  onStepChange: (nextIndex: number | null) => void;
  onActiveAnalysisTraceChange?: (entry: ExecutionTraceEntry | null) => void;
  onRequestFocusModule?: (moduleId: string) => void;
  onCaptureBaseline: () => void;
  onClearBaseline: () => void;
  onAddVerificationCase: (
    sourceModuleId: string,
    inputValue: string,
    tickCount?: number | null,
  ) => string | null;
  onImportVerificationCases: (cases: VerificationCase[]) => void;
  onRemoveVerificationCase: (caseId: string) => void;
  onClearVerificationCases: () => void;
  probedModuleIds: string[];
  isTickedMode?: boolean;
  currentTick?: number;
  tickCount?: number;
  tickedParamsByModule?: Record<string, Record<string, unknown>[]> | null;
  tickHistoryByModule?: Record<string, string[]> | null;
  collectedOutput?: string | null;
  onToggleProbe: (moduleId: string) => void;
  onClearProbes: () => void;
}

export function ParameterInspector({
  execution,
  registry,
  executionError,
  validationIssues,
  stepIndex,
  project,
  tutorialStep,
  projectName,
  comparisonBaseline,
  executionComparison,
  baselineOutput,
  variantOutput,
  verificationSourceOptions,
  verificationCases,
  verificationResults,
  baselineExecutionError,
  baselineModuleInstance,
  moduleDef,
  moduleInstance,
  selectedModuleIds,
  parameterClipboard,
  getParamDraft,
  onCopyParams,
  onApplyCopiedParams,
  onParamDraftChange,
  onParamChange,
  onSetModuleBypass,
  onRenameModuleInstance,
  onDeleteModule,
  canRenameModuleIds = true,
  onUnzipComposite,
  onSelectIssueTarget,
  onTraceHover,
  onStepChange,
  onActiveAnalysisTraceChange,
  onRequestFocusModule,
  onCaptureBaseline,
  onClearBaseline,
  onAddVerificationCase,
  onImportVerificationCases,
  onRemoveVerificationCase,
  onClearVerificationCases,
  probedModuleIds,
  isTickedMode = false,
  currentTick = 0,
  tickCount = 0,
  tickedParamsByModule = null,
  tickHistoryByModule = null,
  collectedOutput = null,
  onToggleProbe,
  onClearProbes,
}: ParameterInspectorProps) {
  const [traceMode, setTraceMode] = useState<'focused' | 'upstream' | 'downstream' | 'full'>('focused');
  const [inspectorTab, setInspectorTab] = useState<'configure' | 'analyze' | 'compare'>('configure');
  const [focusedRoundPath, setFocusedRoundPath] = useState<string>('all');
  const [requestedStepperMode, setRequestedStepperMode] = useState<'top-level' | 'nested'>('top-level');
  const [requestedNestedStepIndex, setRequestedNestedStepIndex] = useState<number | null>(null);
  const [requestedLookupChunkIndex, setRequestedLookupChunkIndex] = useState(0);
  const [sinkRepresentationsByModuleId, setSinkRepresentationsByModuleId] = useState<
    Record<string, SinkRepresentation>
  >({});
  const [activeOutputSummaryModuleId, setActiveOutputSummaryModuleId] = useState<string | null>(null);
  const [draggedPermutationInputIndex, setDraggedPermutationInputIndex] = useState<number | null>(null);
  const [draggedRotorInputIndex, setDraggedRotorInputIndex] = useState<number | null>(null);
  const [selectedPlugboardLetter, setSelectedPlugboardLetter] = useState<string | null>(null);
  const [selectedReflectorLetter, setSelectedReflectorLetter] = useState<string | null>(null);
  const [reciprocityNote, setReciprocityNote] = useState<{
    moduleId: string;
    text: string;
  } | null>(null);
  const [requestedSBoxEditIndex, setRequestedSBoxEditIndex] = useState(0);
  const [sboxGenerateSize, setSboxGenerateSize] = useState(16);
  const [renameState, setRenameState] = useState<{
    moduleId: string | null;
    draft: string;
    error: string | null;
  }>({
    moduleId: null,
    draft: '',
    error: null,
  });
  const permutationInputLaneRef = useRef<HTMLDivElement | null>(null);
  const permutationOutputLaneRef = useRef<HTMLDivElement | null>(null);
  const permutationInputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const permutationOutputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rotorInputLaneRef = useRef<HTMLDivElement | null>(null);
  const rotorOutputLaneRef = useRef<HTMLDivElement | null>(null);
  const rotorInputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rotorOutputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [permutationWireLayout, setPermutationWireLayout] = useState<{
    height: number;
    inputYs: number[];
    outputYs: number[];
  } | null>(null);
  const [rotorWireLayout, setRotorWireLayout] = useState<{
    height: number;
    inputYs: number[];
    outputYs: number[];
  } | null>(null);
  const analysisTrace = useMemo(
    () => execution?.analysisTrace ?? execution?.trace ?? [],
    [execution],
  );
  const tutorialTraceRef = useRef<HTMLLIElement | null>(null);
  const outputTrace = useMemo(() => {
    if (!execution) return undefined;
    const outputModuleId = project.modules.find(
      (m) => isOutputSinkDefId(m.defId),
    )?.id;
    if (outputModuleId) {
      const found = execution.trace.find((entry) => entry.moduleId === outputModuleId);
      if (found) return found;
    }
    return execution.trace.at(-1);
  }, [execution, project.modules]);
  const outputSignal = outputTrace?.inputs.in;
  const outputSummaries = useMemo(() => {
    const sinkModules = project.modules.filter((module) => isOutputSinkDefId(module.defId));
    const summaries = sinkModules.map((module) => {
      const traceEntry = execution?.trace.find((entry) => entry.moduleId === module.id);
      const signal = execution?.outputsByModuleId[module.id]?.out ?? traceEntry?.inputs.in;
      const sinkDefId = isOutputSinkDefId(module.defId) ? module.defId : undefined;
      const representationOptions = getSinkRepresentationOptions(sinkDefId, signal);
      const preferredRepresentation = sinkRepresentationsByModuleId[module.id] ?? 'bits';
      const effectiveRepresentation = representationOptions.some(
        (option) => option.id === preferredRepresentation && option.available,
      )
        ? preferredRepresentation
        : representationOptions[0]?.id ?? 'bits';
      const effectiveRepresentationOption =
        representationOptions.find((option) => option.id === effectiveRepresentation) ?? null;

      return {
        moduleId: module.id,
        signal,
        representationOptions,
        effectiveRepresentation,
        effectiveRepresentationOption,
      };
    });

    if (summaries.length > 0) {
      return summaries;
    }

    const fallbackOptions = outputTrace && isOutputSinkDefId(outputTrace.defId)
      ? getSinkRepresentationOptions(outputTrace.defId, outputSignal)
      : [];
    const fallbackPreferred = sinkRepresentationsByModuleId.__fallback ?? 'bits';
    const fallbackRepresentation = fallbackOptions.some(
      (option) => option.id === fallbackPreferred && option.available,
    )
      ? fallbackPreferred
      : fallbackOptions[0]?.id ?? 'bits';
    const fallbackRepresentationOption =
      fallbackOptions.find((option) => option.id === fallbackRepresentation) ?? null;

    return [
      {
        moduleId: outputTrace?.moduleId ?? 'output',
        signal: outputSignal,
        representationOptions: fallbackOptions,
        effectiveRepresentation: fallbackRepresentation,
        effectiveRepresentationOption: fallbackRepresentationOption,
      },
    ];
  }, [execution, outputSignal, outputTrace, project.modules, sinkRepresentationsByModuleId]);
  const activeOutputSummary = useMemo(() => {
    if (outputSummaries.length === 0) {
      return null;
    }

    if (
      activeOutputSummaryModuleId &&
      outputSummaries.some((summary) => summary.moduleId === activeOutputSummaryModuleId)
    ) {
      return (
        outputSummaries.find((summary) => summary.moduleId === activeOutputSummaryModuleId) ?? null
      );
    }

    return outputSummaries[0] ?? null;
  }, [activeOutputSummaryModuleId, outputSummaries]);
  const selectedTrace = execution?.trace.find(
    (entry) => entry.moduleId === moduleInstance?.id,
  );
  const linkedRotorSourceInstance = useMemo(() => {
    if (moduleDef?.id !== 'RotorReverse' || !moduleInstance) {
      return null;
    }

    const linkedRotorId = moduleInstance.params.linkedRotorId;
    if (typeof linkedRotorId !== 'string' || linkedRotorId.trim().length === 0) {
      return null;
    }

    return (
      project.modules.find(
        (candidate) => candidate.id === linkedRotorId && candidate.defId === 'Rotor',
      ) ?? null
    );
  }, [moduleDef?.id, moduleInstance, project.modules]);
  const selectedTraceOrder = selectedTrace
    ? (execution?.order.findIndex((moduleId) => moduleId === selectedTrace.moduleId) ?? -1) + 1
    : null;
  const selectedIssues = moduleInstance
    ? validationIssues.filter((issue) => getIssueTargetModuleId(issue) === moduleInstance.id)
    : [];
  const globalIssues = moduleInstance
    ? validationIssues.filter((issue) => !selectedIssues.includes(issue))
    : validationIssues;
  const effectiveRenameDraft =
    moduleInstance && renameState.moduleId === moduleInstance.id
      ? renameState.draft
      : moduleInstance?.id ?? '';
  const effectiveRenameError =
    moduleInstance && renameState.moduleId === moduleInstance.id ? renameState.error : null;
  const renameValidationError = useMemo(() => {
    if (!moduleInstance) {
      return null;
    }

    return getModuleInstanceIdValidationError(
      effectiveRenameDraft,
      project.modules.map((projectModule) => projectModule.id),
      moduleInstance.id,
    );
  }, [effectiveRenameDraft, moduleInstance, project.modules]);
  const compatibleParamApplyTargetIds = useMemo(() => {
    if (!moduleInstance || !moduleDef || !parameterClipboard) {
      return [];
    }

    if (
      parameterClipboard.sourceModuleId !== moduleInstance.id ||
      parameterClipboard.sourceDefId !== moduleDef.id
    ) {
      return [];
    }

    return selectedModuleIds.filter((moduleId) => {
      if (moduleId === moduleInstance.id) {
        return false;
      }

      const targetModule = project.modules.find((projectModule) => projectModule.id === moduleId);
      return targetModule?.defId === moduleDef.id;
    });
  }, [moduleDef, moduleInstance, parameterClipboard, project.modules, selectedModuleIds]);
  const selectedIncompatibleParamTargetCount = useMemo(() => {
    if (!moduleInstance || !moduleDef || compatibleParamApplyTargetIds.length === 0) {
      return 0;
    }

    const nonSourceSelectionCount = selectedModuleIds.filter((moduleId) => moduleId !== moduleInstance.id).length;
    return Math.max(0, nonSourceSelectionCount - compatibleParamApplyTargetIds.length);
  }, [compatibleParamApplyTargetIds.length, moduleDef, moduleInstance, selectedModuleIds]);
  const parameterComparisonSummary = useMemo(
    () =>
      buildParameterComparisonSummary({
        project,
        moduleDef,
        moduleInstance,
        selectedModuleIds,
      }),
    [moduleDef, moduleInstance, project, selectedModuleIds],
  );
  const groupedSelectedIssues = groupIssuesByTarget(selectedIssues);
  const groupedGlobalIssues = groupIssuesByTarget(globalIssues);

  const effectiveTraceMode = selectedTrace ? traceMode : 'full';
  const roundFocusOptions = useMemo(
    () =>
      moduleDef && 'kind' in moduleDef && moduleDef.kind === 'iterator' && moduleInstance
        ? getIteratorRoundOptions(analysisTrace, moduleInstance.id)
        : [],
    [analysisTrace, moduleDef, moduleInstance],
  );
  const effectiveFocusedRoundPath =
    focusedRoundPath !== 'all' && roundFocusOptions.some((option) => option.path === focusedRoundPath)
      ? focusedRoundPath
      : 'all';
  const traceEntries = getTraceEntries({
    execution,
    project,
    selectedModuleId: moduleInstance?.id ?? null,
    traceMode: effectiveTraceMode,
    focusedRoundPath: effectiveFocusedRoundPath,
  });
  const canUseNestedStepper =
    Boolean(moduleDef && 'kind' in moduleDef && moduleDef.kind === 'iterator' && moduleInstance) &&
    traceEntries.some((entry) => entry.moduleId.startsWith(`${moduleInstance?.id}/`));
  const effectiveStepperMode = canUseNestedStepper ? requestedStepperMode : 'top-level';
  const steppedTrace = stepIndex !== null ? execution?.trace[stepIndex] ?? null : null;
  const steppedAnalysisEntry =
    effectiveStepperMode === 'nested' && requestedNestedStepIndex !== null
      ? traceEntries[
          requestedNestedStepIndex >= 0 && requestedNestedStepIndex < traceEntries.length
            ? requestedNestedStepIndex
            : Math.max(0, traceEntries.length - 1)
        ] ?? null
      : null;
  const effectiveNestedStepIndex =
    effectiveStepperMode === 'nested' && requestedNestedStepIndex !== null
      ? requestedNestedStepIndex >= 0 && requestedNestedStepIndex < traceEntries.length
        ? requestedNestedStepIndex
        : traceEntries.length > 0
          ? traceEntries.length - 1
          : null
      : null;
  const tutorialTraceEntry = tutorialStep?.focusModuleId
    ? execution?.trace.find((entry) => entry.moduleId === tutorialStep.focusModuleId) ?? null
    : null;
  const tutorialTraceIndex = tutorialTraceEntry
    ? (execution?.trace.findIndex((entry) => entry.moduleId === tutorialTraceEntry.moduleId) ?? -1) + 1
    : null;
  const activeTransformationEntry =
    inspectorTab === 'analyze'
      ? effectiveStepperMode === 'nested'
        ? steppedAnalysisEntry
        : selectedTrace
      : null;
  const transformationView = activeTransformationEntry
    ? getTransformationView(activeTransformationEntry, project, registry)
    : null;
  const canBypassSelectedModule = moduleDef ? isBypassEligibleDefinition(moduleDef) : false;
  const bypassIneligibilityReason =
    moduleDef && !canBypassSelectedModule ? getBypassIneligibilityReason(moduleDef) : null;
  const effectiveLookupChunkIndex =
    transformationView?.kind === 'lookup'
      ? transformationView.chunks[
          requestedLookupChunkIndex >= 0 &&
          requestedLookupChunkIndex < transformationView.chunks.length
            ? requestedLookupChunkIndex
            : 0
        ]?.index ?? 0
      : 0;
  const activeLookupChunk =
    transformationView?.kind === 'lookup'
      ? transformationView.chunks.find((chunk) => chunk.index === effectiveLookupChunkIndex) ?? null
      : null;
  const editableSelectedPermutationOrder = useMemo(() => {
    if ((moduleDef?.id !== 'Permutation' && moduleDef?.id !== 'SymbolPermutation') || !moduleInstance) {
      return null;
    }

    const field = moduleDef.paramSchema.order;
    return getEditablePermutationOrder(
      moduleInstance.params.order ?? field?.defaultValue ?? '',
    );
  }, [moduleDef, moduleInstance]);
  const editableSelectedRotorWiring = useMemo(() => {
    if ((moduleDef?.id !== 'Rotor' && moduleDef?.id !== 'RotorReverse') || !moduleInstance) {
      return null;
    }

    const field = moduleDef.paramSchema.wiring;
    return getEditableRotorWiring(
      moduleInstance.params.wiring ?? field?.defaultValue ?? '',
    );
  }, [moduleDef, moduleInstance]);
  const editableSelectedPermutationOrderKey = editableSelectedPermutationOrder?.join(',') ?? '';
  const editableSelectedRotorWiringKey = editableSelectedRotorWiring?.join(',') ?? '';

  useLayoutEffect(() => {
    if (!editableSelectedPermutationOrder) {
      return;
    }

    const measure = () => {
      const layout = measureWireLayout(
        permutationInputLaneRef.current,
        permutationOutputLaneRef.current,
        permutationInputRefs.current,
        permutationOutputRefs.current,
      );
      setPermutationWireLayout(layout);
    };

    const frameId = window.requestAnimationFrame(measure);

    const observer =
      typeof ResizeObserver !== 'undefined' &&
      permutationInputLaneRef.current &&
      permutationOutputLaneRef.current
        ? new ResizeObserver(() => measure())
        : null;

    if (observer && permutationInputLaneRef.current && permutationOutputLaneRef.current) {
      observer.observe(permutationInputLaneRef.current);
      observer.observe(permutationOutputLaneRef.current);
    }

    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editableSelectedPermutationOrder, editableSelectedPermutationOrderKey]);

  useLayoutEffect(() => {
    if (!editableSelectedRotorWiring) {
      return;
    }

    const measure = () => {
      const layout = measureWireLayout(
        rotorInputLaneRef.current,
        rotorOutputLaneRef.current,
        rotorInputRefs.current,
        rotorOutputRefs.current,
      );
      setRotorWireLayout(layout);
    };

    const frameId = window.requestAnimationFrame(measure);

    const observer =
      typeof ResizeObserver !== 'undefined' &&
      rotorInputLaneRef.current &&
      rotorOutputLaneRef.current
        ? new ResizeObserver(() => measure())
        : null;

    if (observer && rotorInputLaneRef.current && rotorOutputLaneRef.current) {
      observer.observe(rotorInputLaneRef.current);
      observer.observe(rotorOutputLaneRef.current);
    }

    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editableSelectedRotorWiring, editableSelectedRotorWiringKey]);

  useEffect(() => {
    if (inspectorTab !== 'analyze' || !tutorialTraceRef.current) {
      return;
    }

    tutorialTraceRef.current.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [inspectorTab, tutorialStep?.id, tutorialTraceEntry?.moduleId]);

  useEffect(() => {
    if (!onActiveAnalysisTraceChange) {
      return;
    }

    if (inspectorTab !== 'analyze' || !execution) {
      onActiveAnalysisTraceChange(null);
      return;
    }

    onActiveAnalysisTraceChange(
      effectiveStepperMode === 'nested' ? steppedAnalysisEntry : steppedTrace,
    );
  }, [
    execution,
    inspectorTab,
    onActiveAnalysisTraceChange,
    effectiveStepperMode,
    steppedAnalysisEntry,
    steppedTrace,
  ]);

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
    <aside className="panel inspector-panel">
      <div className="panel-head">
        <p className="panel-label">Inspector</p>
        <h2>Selection + Trace</h2>
      </div>

      <label className="inspector-section-select">
        <span className="meta-label">Section</span>
        <select
          value={inspectorTab}
          onChange={(event) =>
            setInspectorTab(event.target.value as 'configure' | 'analyze' | 'compare')
          }
        >
          <option value="configure">Configure</option>
          <option value="analyze">Analyze</option>
          <option value="compare">Compare</option>
        </select>
      </label>

      <div className="trace-summary inspector-output-summary">
        <span className="meta-label">
          {isTickedMode ? 'Output Summary' : 'Outputs'}
        </span>
        <p className="trace-summary-subtitle">
          {validationIssues.length > 0
            ? `${validationIssues.length} validation issue${validationIssues.length === 1 ? '' : 's'} blocking execution`
            : execution
              ? `${execution.trace.length} module${execution.trace.length === 1 ? '' : 's'} executed`
              : 'Execution is waiting for a valid graph'}
        </p>
        {isTickedMode && collectedOutput !== null && outputSummaries.length <= 1 ? (
          <p className="trace-summary-subtitle">Collected output: <strong>{collectedOutput}</strong></p>
        ) : null}
        {outputSummaries.length > 1 ? (
          <div className="inspector-output-switcher">
            {outputSummaries.map((summary) => (
              <button
                key={`output-summary-switch-${summary.moduleId}`}
                type="button"
                className={`inspector-output-switch${activeOutputSummary?.moduleId === summary.moduleId ? ' active' : ''}`}
                onClick={() => setActiveOutputSummaryModuleId(summary.moduleId)}
              >
                {summary.moduleId}
              </button>
            ))}
          </div>
        ) : null}
        {activeOutputSummary ? (
          <div className="inspector-output-list">
            <div key={`output-summary-${activeOutputSummary.moduleId}`} className="inspector-output-card">
              <div className="inspector-output-card-head">
                <strong>{activeOutputSummary.moduleId}</strong>
                {outputSummaries.length > 1 ? (
                  <span className="content-status-chip">
                    Sink {outputSummaries.findIndex((summary) => summary.moduleId === activeOutputSummary.moduleId) + 1} / {outputSummaries.length}
                  </span>
                ) : null}
              </div>
              <code>{formatSignal(activeOutputSummary.signal)}</code>
              {activeOutputSummary.effectiveRepresentationOption ? (
                <div className="sink-representation">
                  <span className="meta-label">Interpret Output As</span>
                  <p className="sink-rep-note">Observational views only. These do not change the graph.</p>
                  <div className="sink-rep-tabs">
                    {activeOutputSummary.representationOptions.map((option) => (
                      <button
                        key={`output-summary-${activeOutputSummary.moduleId}-${option.id}`}
                        type="button"
                        className={`sink-rep-tab${activeOutputSummary.effectiveRepresentation === option.id ? ' active' : ''}${!option.available ? ' unavailable' : ''}`}
                        onClick={() =>
                          option.available &&
                          setSinkRepresentationsByModuleId((current) => ({
                            ...current,
                            [activeOutputSummary.moduleId]: option.id,
                          }))
                        }
                        disabled={!option.available}
                        title={option.reason ?? option.label}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="sink-rep-value">
                    <code>{activeOutputSummary.effectiveRepresentationOption.value}</code>
                  </div>
                </div>
              ) : null}
              {isTickedMode && tickHistoryByModule?.[activeOutputSummary.moduleId]?.length ? (
                <p className="sink-rep-note">
                  {tickHistoryByModule[activeOutputSummary.moduleId].length} tick sample(s) available for this sink.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {inspectorTab === 'analyze' && isTickedMode && tickCount > 0 && moduleInstance ? (
        <section className="analysis-section tick-state-section">
          <span className="meta-label">Tick State</span>
          <p className="tick-state-summary">
            Viewing tick <strong>{currentTick + 1}</strong> of <strong>{tickCount}</strong>
          </p>
          {tickedParamsByModule?.[moduleInstance.id] ? (() => {
            const tickParams = tickedParamsByModule[moduleInstance.id]?.[currentTick];
            if (!tickParams) return null;
            const entries = Object.entries(tickParams);
            if (entries.length === 0) return null;
            return (
              <ul className="tick-param-list">
                {entries.map(([key, value]) => (
                  <li key={key} className="tick-param-entry">
                    <span className="tick-param-key">{key}</span>
                    <span className="tick-param-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </li>
                ))}
              </ul>
            );
          })() : null}
          {tickHistoryByModule?.[moduleInstance.id]?.length ? (() => {
            const history = tickHistoryByModule[moduleInstance.id];
            const start = Math.max(0, currentTick - 4);
            const visibleHistory = history.slice(start, currentTick + 1);
            if (visibleHistory.length <= 1) {
              return null;
            }

            return (
              <>
                <p className="tick-history-summary">Recent output history</p>
                <div className="tick-history-row">
                  {visibleHistory.map((value, index) => (
                    <span
                      key={`${moduleInstance.id}-inspector-history-${start + index}`}
                      className={
                        start + index === currentTick
                          ? 'tick-history-chip active'
                          : 'tick-history-chip'
                      }
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </>
            );
          })() : null}
        </section>
      ) : null}

     {inspectorTab === 'analyze' && execution && execution.trace.length > 0 ? (
        <section className="analysis-section">
          <div className="stepper-head">
            <span className="meta-label">Step-Through</span>
            <div className="stepper-controls">
              {canUseNestedStepper ? (
                <div className="trace-mode-toggle">
                  <button
                    type="button"
                    className={
                      effectiveStepperMode === 'top-level'
                        ? 'trace-mode-button active'
                        : 'trace-mode-button'
                    }
                    onClick={() => setRequestedStepperMode('top-level')}
                  >
                    Top-Level
                  </button>
                  <button
                    type="button"
                    className={
                      effectiveStepperMode === 'nested'
                        ? 'trace-mode-button active'
                        : 'trace-mode-button'
                    }
                    onClick={() => setRequestedStepperMode('nested')}
                  >
                    Nested
                  </button>
                </div>
              ) : null}
              <div className="stepper-actions">
              <button
                type="button"
                className="trace-mode-button"
                disabled={
                  effectiveStepperMode === 'nested'
                    ? effectiveNestedStepIndex === null || effectiveNestedStepIndex <= 0
                    : stepIndex === null || stepIndex <= 0
                }
                onClick={() => {
                  if (effectiveStepperMode === 'nested') {
                    setRequestedNestedStepIndex(
                      effectiveNestedStepIndex === null
                        ? 0
                        : Math.max(0, effectiveNestedStepIndex - 1),
                    );
                    return;
                  }

                  onStepChange(stepIndex === null ? 0 : Math.max(0, stepIndex - 1));
                }}
              >
                Prev
              </button>
              <button
                type="button"
                className="trace-mode-button"
                onClick={() => {
                  if (effectiveStepperMode === 'nested') {
                    setRequestedNestedStepIndex(
                      effectiveNestedStepIndex === null
                        ? 0
                        : Math.min(traceEntries.length - 1, effectiveNestedStepIndex + 1),
                    );
                    return;
                  }

                  onStepChange(
                    stepIndex === null
                      ? 0
                      : Math.min(execution.trace.length - 1, stepIndex + 1),
                  );
                }}
              >
                {effectiveStepperMode === 'nested'
                  ? effectiveNestedStepIndex === null
                    ? 'Start'
                    : 'Next'
                  : stepIndex === null
                    ? 'Start'
                    : 'Next'}
              </button>
              <button
                type="button"
                className="trace-mode-button"
                disabled={
                  effectiveStepperMode === 'nested'
                    ? effectiveNestedStepIndex === null
                    : stepIndex === null
                }
                onClick={() => {
                  if (effectiveStepperMode === 'nested') {
                    setRequestedNestedStepIndex(null);
                    return;
                  }

                  onStepChange(null);
                }}
              >
                Reset
              </button>
              </div>
            </div>
          </div>

          <div className="selected-trace">
            <span className="meta-label">Current Step</span>
            {effectiveStepperMode === 'nested' ? (
              steppedAnalysisEntry ? (
                <>
                  <p className="selected-trace-order">
                    Nested step {effectiveNestedStepIndex! + 1} of {traceEntries.length}
                  </p>
                  <p>
                    module: <strong>{getDisplayTraceModuleId(steppedAnalysisEntry)}</strong> (
                    {steppedAnalysisEntry.defId})
                  </p>
                  {getIteratorRoundPath(steppedAnalysisEntry) ? (
                    <p>
                      round:{' '}
                      <strong>
                        {formatIteratorRoundLabel(getIteratorRoundPath(steppedAnalysisEntry) ?? '')}
                      </strong>
                    </p>
                  ) : null}
                  <p>
                    inputs:{' '}
                    {Object.entries(steppedAnalysisEntry.inputs)
                      .map(([, signal]) => formatSignal(signal))
                      .join(' | ') || 'none'}
                  </p>
                  <p>
                    outputs:{' '}
                    {Object.entries(steppedAnalysisEntry.outputs)
                      .map(([, signal]) => formatSignal(signal))
                      .join(' | ') || 'none'}
                  </p>
                </>
              ) : (
                <p className="empty-state">
                  Start stepping to walk the visible nested analysis trace one internal module at a
                  time.
                </p>
              )
            ) : steppedTrace ? (
              <>
                <p className="selected-trace-order">
                 Step {stepIndex! + 1} of {execution.trace.length}
                </p>
                <p>
                  module: <strong>{steppedTrace.moduleId}</strong> ({steppedTrace.defId})
                </p>
                <p>
                  inputs:{' '}
                  {Object.entries(steppedTrace.inputs)
                    .map(([, signal]) => formatSignal(signal))
                    .join(' | ') || 'none'}
                </p>
                <p>
                  outputs:{' '}
                  {Object.entries(steppedTrace.outputs)
                    .map(([, signal]) => formatSignal(signal))
                    .join(' | ') || 'none'}
                </p>
              </>
            ) : (
              <p className="empty-state">
               Start stepping to walk the execution order one module at a time.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && probedModuleIds.length > 0 ? (
        <section className="analysis-section probe-section">
          <div className="probe-head">
            <span className="meta-label">Pinned Signals</span>
            <button
              type="button"
              className="trace-mode-button"
              aria-label="Clear all signal probes"
              onClick={onClearProbes}
            >
              Clear All
            </button>
          </div>
          <ul className="probe-list">
            {probedModuleIds.map((probedId) => {
              const probeTrace: ExecutionTraceEntry | undefined = execution?.trace.find(
                (entry) => entry.moduleId === probedId,
              );
              return (
                <li key={probedId} className="probe-card">
                  <div className="probe-card-head">
                    <strong>{probedId}</strong>
                    <button
                      type="button"
                      className="probe-unpin-button"
                      aria-label={`Unpin signal probe for ${probedId}`}
                      title="Unpin"
                      onClick={() => onToggleProbe(probedId)}
                    >
                      {'\u2715'}
                    </button>
                  </div>
                  {probeTrace ? (
                    <>
                      <p>
                        in:{' '}
                        {Object.entries(probeTrace.inputs)
                          .map(([, signal]) => formatSignal(signal))
                          .join(' | ') || 'none'}
                      </p>
                      <p>
                        out:{' '}
                        {Object.entries(probeTrace.outputs)
                          .map(([, signal]) => formatSignal(signal))
                          .join(' | ') || 'none'}
                      </p>
                    </>
                  ) : (
                    <p className="empty-state">Not in current execution</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && tutorialStep ? (
        <section className="analysis-section tutorial-analysis-section">
          <span className="meta-label">Tutorial Focus</span>
          <div className="tutorial-analysis-card">
            <strong>{tutorialStep.title}</strong>
            <p>{tutorialStep.body}</p>
            {tutorialStep.focusModuleId ? (
              <p className="tutorial-analysis-target">
                Focus module: <strong>{tutorialStep.focusModuleId}</strong>
                {tutorialTraceIndex ? ` • Trace step ${tutorialTraceIndex}` : ''}
              </p>
            ) : (
              <p className="tutorial-analysis-target">
                This step explains the machine at a higher level instead of a single module.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && transformationView ? (
        <section className="analysis-section transformation-section">
          <span className="meta-label">Transformation</span>
          <div className="transformation-card">
            <div className="transformation-card-head">
              <strong>{transformationView.title}</strong>
              <span>
                {getDisplayTraceModuleId(transformationView.entry)} ({transformationView.entry.defId})
              </span>
            </div>
            <p className="transformation-copy">
              {transformationView.copy}
            </p>
            {transformationView.kind === 'routing' ? (
              <>
                {transformationView.configLabel && transformationView.configValue ? (
                  <div className="transformation-order">
                    <span className="meta-label">{transformationView.configLabel}</span>
                    <code>{transformationView.configValue}</code>
                  </div>
                ) : null}
                <div className="transformation-routing-head">
                  <span className="meta-label">Input</span>
                  <span className="meta-label">{transformationView.middleLabel}</span>
                  <span className="meta-label">Output</span>
                </div>
                <div className="transformation-routing">
                  <div className="transformation-lane">
                    <div className="transformation-lane-cells">
                      {transformationView.inputLane.map((row) => (
                        <div key={`input-${row.inputIndex}`} className="transformation-lane-cell">
                          <span className="transformation-index">{row.inputIndex}</span>
                          <strong>{row.inputValue}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className="transformation-wire-canvas"
                    aria-hidden="true"
                    style={{ height: `${transformationView.svgHeight}px` }}
                  >
                    <svg
                      viewBox={`0 0 220 ${transformationView.svgHeight}`}
                      preserveAspectRatio="none"
                    >
                      {transformationView.rows.map((row) =>
                        row.kind === 'line' ? (
                          <line
                            key={`wire-${row.inputIndex}-${row.outputIndex}`}
                            x1="18"
                            y1={row.inputY}
                            x2="202"
                            y2={row.outputY}
                            stroke={row.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.92"
                          />
                        ) : (
                          <g key={`fill-${row.outputIndex}`}>
                            <line
                              x1="18"
                              y1={row.outputY}
                              x2="202"
                              y2={row.outputY}
                              stroke={row.color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray="7 6"
                              opacity="0.88"
                            />
                            <text
                              x="110"
                              y={row.outputY - 6}
                              textAnchor="middle"
                              className="transformation-wire-label"
                            >
                              0-fill
                            </text>
                          </g>
                        ),
                      )}
                    </svg>
                  </div>
                  <div className="transformation-lane transformation-output-lane">
                    <div className="transformation-lane-cells">
                      {transformationView.outputLane.map((row) => (
                        <div
                          key={`output-${row.outputIndex}`}
                          className={
                            row.kind === 'fill'
                              ? 'transformation-lane-cell transformation-output-cell transformation-output-fill'
                              : 'transformation-lane-cell transformation-output-cell'
                          }
                        >
                          <span className="transformation-index">{row.outputIndex}</span>
                          <strong>{row.outputValue}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : transformationView.kind === 'xor' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>same {'->'} 0, different {'->'} 1</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input A</span>
                    <span className="meta-label">Input B</span>
                    <span className="meta-label">Compare</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`xor-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.aBit}</span>
                      <span className="xor-grid-bit">{row.bBit}</span>
                      <span
                        className={
                          row.resultBit === 1
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {row.explanation}
                      </span>
                      <span
                        className={
                          row.resultBit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {row.resultBit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'compare' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.ruleLabel}</span>
                  <code>{transformationView.ruleValue}</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Unsigned Words</span>
                  <code>
                    A = {transformationView.leftValue} · B = {transformationView.rightValue} · out = {transformationView.outputBit}
                  </code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input A</span>
                    <span className="meta-label">Input B</span>
                    <span className="meta-label">Compare</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`compare-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.aBit}</span>
                      <span className="xor-grid-bit">{row.bBit}</span>
                      <span
                        className={
                          row.explanation === 'different'
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {row.explanation}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'gate' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Control</span>
                  <code>
                    {transformationView.controlValue.join('') || '[]'} {'->'} {transformationView.active ? 'open' : 'closed'}
                  </code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Gate</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`gate-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.inputBit}</span>
                      <span
                        className={
                          transformationView.active
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {transformationView.active ? 'pass' : 'block'}
                      </span>
                      <span
                        className={
                          row.outputBit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {row.outputBit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'majority' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>at least 2 active gives 1, otherwise 0</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Active Count</span>
                  <code>{transformationView.activeCount} / 3 gives {transformationView.outputBit}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Bit</span>
                    <span className="meta-label">State</span>
                  </div>
                  {transformationView.inputs.map((input) => (
                    <div key={`majority-${input.label}`} className="xor-grid-row">
                      <span className="xor-grid-index">{input.label}</span>
                      <span
                        className={
                          input.bit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {input.bit}
                      </span>
                      <span
                        className={
                          input.bit === 1
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {input.bit === 1 ? 'active' : 'inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'mux' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>select = 0 {'->'} a · select = 1 {'->'} b</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Chosen Input</span>
                  <code>{transformationView.chosenInput} gives {transformationView.outputBit}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Bit</span>
                    <span className="meta-label">State</span>
                  </div>
                  {[
                    { label: 'select', bit: transformationView.selectBit, chosen: false },
                    { label: 'a', bit: transformationView.aBit, chosen: transformationView.chosenInput === 'a' },
                    { label: 'b', bit: transformationView.bBit, chosen: transformationView.chosenInput === 'b' },
                  ].map((input) => (
                    <div key={`mux-${input.label}`} className="xor-grid-row">
                      <span className="xor-grid-index">{input.label}</span>
                      <span
                        className={
                          input.bit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {input.bit}
                      </span>
                      <span
                        className={
                          input.chosen
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {input.label === 'select' ? 'control' : input.chosen ? 'chosen' : 'ignored'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'demux' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>select = 0 {'->'} a · select = 1 {'->'} b</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Chosen Output</span>
                  <code>{transformationView.chosenOutput} receives {transformationView.inputBit}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Lane</span>
                    <span className="meta-label">Bit</span>
                    <span className="meta-label">State</span>
                  </div>
                  {[
                    { label: 'select', bit: transformationView.selectBit, active: false, state: 'control' },
                    { label: 'in', bit: transformationView.inputBit, active: false, state: 'source' },
                    { label: 'a', bit: transformationView.outputABit, active: transformationView.chosenOutput === 'a', state: transformationView.chosenOutput === 'a' ? 'routed' : 'zeroed' },
                    { label: 'b', bit: transformationView.outputBBit, active: transformationView.chosenOutput === 'b', state: transformationView.chosenOutput === 'b' ? 'routed' : 'zeroed' },
                  ].map((row) => (
                    <div key={`demux-${row.label}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.label}</span>
                      <span className={row.bit === 1 ? 'xor-grid-bit xor-grid-bit-active' : 'xor-grid-bit'}>
                        {row.bit}
                      </span>
                      <span className={row.active ? 'xor-grid-compare xor-grid-compare-different' : 'xor-grid-compare'}>
                        {row.state}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'split' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Split Point</span>
                  <code>leftWidth = {transformationView.leftWidth}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Block</span>
                  </div>
                  {transformationView.inputBits.map((bit, index) => (
                    <div key={`split-${index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{index}</span>
                      <span
                        className={
                          index < transformationView.leftWidth
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {bit}
                      </span>
                      <span
                        className={
                          index < transformationView.leftWidth
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {index < transformationView.leftWidth ? 'left' : 'right'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'pad' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Target Width</span>
                  <code>{transformationView.targetWidth} bits</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Pad</span>
                  <code>{transformationView.padCount} × {transformationView.padBit} on {transformationView.side}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Output</span>
                    <span className="meta-label">Source</span>
                  </div>
                  {transformationView.outputBits.map((bit, index) => {
                    const isPad = transformationView.side === 'left'
                      ? index < transformationView.padCount
                      : index >= transformationView.inputBits.length;
                    return (
                      <div key={`pad-${index}`} className="xor-grid-row">
                        <span className="xor-grid-index">{index}</span>
                        <span
                          className={
                            isPad
                              ? 'xor-grid-bit'
                              : 'xor-grid-bit xor-grid-bit-active'
                          }
                        >
                          {bit}
                        </span>
                        <span
                          className={
                            isPad
                              ? 'xor-grid-compare'
                              : 'xor-grid-compare xor-grid-compare-different'
                          }
                        >
                          {isPad ? 'pad' : 'original'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : transformationView.kind === 'arithmetic' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.operationLabel}</span>
                  <code>{transformationView.operationExpression}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.outputBits.map((bit, index) => (
                    <div key={`arith-${index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{index}</span>
                      <span className="xor-grid-bit">
                        {index < transformationView.inputBits.length ? transformationView.inputBits[index] : '-'}
                      </span>
                      <span
                        className={
                          index < transformationView.inputBits.length && bit !== transformationView.inputBits[index]
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {bit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'unpad' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Original Width</span>
                  <code>{transformationView.originalWidth} bits</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Strip</span>
                  <code>{transformationView.strippedCount} bit{transformationView.strippedCount === 1 ? '' : 's'} from {transformationView.side}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Source</span>
                  </div>
                  {transformationView.inputBits.map((bit, index) => {
                    const isKept = transformationView.side === 'left'
                      ? index >= transformationView.strippedCount
                      : index < transformationView.outputBits.length;
                    return (
                      <div key={`unpad-${index}`} className="xor-grid-row">
                        <span className="xor-grid-index">{index}</span>
                        <span
                          className={
                            isKept
                              ? 'xor-grid-bit xor-grid-bit-active'
                              : 'xor-grid-bit'
                          }
                        >
                          {bit}
                        </span>
                        <span
                          className={
                            isKept
                              ? 'xor-grid-compare xor-grid-compare-different'
                              : 'xor-grid-compare'
                          }
                        >
                          {isKept ? 'kept' : 'stripped'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Chunk Width</span>
                  <code>{transformationView.chunkWidth} bits</code>
                </div>
                {transformationView.chunks.length > 1 ? (
                  <div className="sbox-chunk-selector">
                    {transformationView.chunks.map((chunk) => (
                      <button
                        key={`sbox-chunk-${chunk.index}`}
                        type="button"
                        className={
                          chunk.index === effectiveLookupChunkIndex
                            ? 'sbox-chunk-chip active'
                            : 'sbox-chunk-chip'
                        }
                        onClick={() => setRequestedLookupChunkIndex(chunk.index)}
                      >
                        Chunk {chunk.index + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
                {activeLookupChunk ? (
                  <div className="sbox-view">
                    <div
                      className="sbox-table-wrap"
                      style={{ gridTemplateColumns: `56px repeat(${transformationView.gridColumns}, minmax(0, 1fr))` }}
                    >
                      <span className="sbox-table-corner" />
                      {Array.from({ length: transformationView.gridColumns }, (_, columnIndex) => (
                        <span
                          key={`sbox-col-${columnIndex}`}
                          className={
                            transformationView.usesHexGrid &&
                            columnIndex === activeLookupChunk.inputValue % transformationView.gridColumns
                              ? 'sbox-table-header active'
                              : 'sbox-table-header'
                          }
                        >
                          {formatSBoxAxisLabel(columnIndex, transformationView.gridColumns)}
                        </span>
                      ))}
                      {transformationView.table.map((value, index) => (
                        <Fragment key={`sbox-cell-wrap-${index}`}>
                          {index % transformationView.gridColumns === 0 ? (
                            <span
                              className={
                                transformationView.usesHexGrid &&
                                Math.floor(index / transformationView.gridColumns) ===
                                  Math.floor(activeLookupChunk.inputValue / transformationView.gridColumns)
                                  ? 'sbox-table-header sbox-table-row-header active'
                                  : 'sbox-table-header sbox-table-row-header'
                              }
                            >
                              {formatSBoxAxisLabel(
                                Math.floor(index / transformationView.gridColumns),
                                transformationView.gridColumns,
                              )}
                            </span>
                          ) : null}
                          <div
                            key={`sbox-cell-${index}`}
                            className={
                              index === activeLookupChunk.inputValue
                                ? 'sbox-table-cell active'
                                : transformationView.usesHexGrid &&
                                    (Math.floor(index / transformationView.gridColumns) ===
                                      Math.floor(activeLookupChunk.inputValue / transformationView.gridColumns) ||
                                      index % transformationView.gridColumns ===
                                        activeLookupChunk.inputValue % transformationView.gridColumns)
                                  ? 'sbox-table-cell context'
                                : 'sbox-table-cell'
                            }
                            title={`table[${index}] = ${value}`}
                          >
                            <strong className="sbox-table-value">{formatSBoxAxisLabel(value, transformationView.gridColumns)}</strong>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div className="sbox-lookup-banner">
                      <span className="meta-label">Active Lookup</span>
                      <strong className="sbox-lookup-index">
                        {transformationView.usesHexGrid
                          ? `table[0x${formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.chunkWidth)}] = 0x${formatSBoxHexValue(activeLookupChunk.outputValue, transformationView.chunkWidth)}`
                          : `table[${activeLookupChunk.inputValue}] = ${activeLookupChunk.outputValue}`}
                      </strong>
                      {transformationView.usesHexGrid ? (
                        <p className="comparison-copy">
                          Hex <strong>{formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.chunkWidth)}</strong> means row{' '}
                          <strong>{formatSBoxAxisLabel(Math.floor(activeLookupChunk.inputValue / transformationView.gridColumns), transformationView.gridColumns)}</strong>{' '}
                          and column{' '}
                          <strong>{formatSBoxAxisLabel(activeLookupChunk.inputValue % transformationView.gridColumns, transformationView.gridColumns)}</strong>.
                        </p>
                      ) : null}
                    </div>
                    <div className="sbox-detail-row">
                      <div className="sbox-detail-chip">
                        <span className="meta-label">Input Chunk</span>
                        <strong className="sbox-bits">{activeLookupChunk.inputBits.join('')}</strong>
                        <span className="sbox-detail-metric">
                          {transformationView.usesHexGrid
                            ? `hex ${formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.chunkWidth)} · decimal ${activeLookupChunk.inputValue}`
                            : `decimal ${activeLookupChunk.inputValue}`}
                        </span>
                      </div>
                      <div className="sbox-detail-chip">
                        <span className="meta-label">Output Chunk</span>
                        <strong className="sbox-bits">{activeLookupChunk.outputBits.join('')}</strong>
                        <span className="sbox-detail-metric">
                          {transformationView.usesHexGrid
                            ? `hex ${formatSBoxHexValue(activeLookupChunk.outputValue, transformationView.chunkWidth)} · decimal ${activeLookupChunk.outputValue}`
                            : `decimal ${activeLookupChunk.outputValue}`}
                        </span>
                      </div>
                    </div>
                    <div className="sbox-chunk-grid">
                      {transformationView.chunks.map((chunk) => (
                        <button
                          key={`sbox-summary-${chunk.index}`}
                          type="button"
                          className={
                            chunk.index === effectiveLookupChunkIndex
                              ? 'sbox-chunk-summary active'
                              : 'sbox-chunk-summary'
                          }
                          onClick={() => setRequestedLookupChunkIndex(chunk.index)}
                        >
                          <span className="meta-label">Chunk {chunk.index + 1}</span>
                          <p className="comparison-copy">
                            {chunk.inputBits.join('')} ({chunk.inputValue}) {'->'} {chunk.outputBits.join('')} ({chunk.outputValue})
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
            <p className="transformation-summary">
              {transformationView.kind === 'lookup' && activeLookupChunk
                ? `Input chunk ${activeLookupChunk.inputBits.join('')} is index ${activeLookupChunk.inputValue}. The substitution table maps ${activeLookupChunk.inputValue} to ${activeLookupChunk.outputValue}, so the output chunk becomes ${activeLookupChunk.outputBits.join('')}.`
                : transformationView.summary}
            </p>
          </div>
        </section>
      ) : null}

      {moduleDef && moduleInstance && inspectorTab === 'configure' ? (
        <section className="inspector-section">
          <span className="meta-label">Selected Module</span>
          <strong className="selected-module-name">{moduleInstance.id}</strong>
          <p className="selected-module-type">{moduleDef.id}</p>
          {'kind' in moduleDef ? (
            moduleDef.kind === 'composite' ? (
              <p className="selected-module-kind">Composite definition</p>
            ) : moduleDef.kind === 'iterator' ? (
              <p className="selected-module-kind">
                Iterator definition
                {typeof moduleDef.roundKeyWidth === 'number'
                  ? ` • ${moduleDef.roundKeyWidth}-bit round keys`
                  : ''}
              </p>
            ) : null
          ) : null}
          <div className="param-field selected-module-rename-field">
            <span>Module ID</span>
            <input
              type="text"
              value={effectiveRenameDraft}
              onChange={(event) => {
                setRenameState({
                  moduleId: moduleInstance.id,
                  draft: event.target.value,
                  error: null,
                });
              }}
              placeholder="round-1-mixer"
              spellCheck={false}
              disabled={!canRenameModuleIds || !onRenameModuleInstance}
            />
            <p className="comparison-copy">
              Workspace-local ID. Use letters, numbers, hyphens, or underscores.
            </p>
            {effectiveRenameError || renameValidationError ? (
              <p className="field-error">{effectiveRenameError ?? renameValidationError}</p>
            ) : null}
            {!canRenameModuleIds ? (
              <p className="comparison-copy">
                Rename is unavailable while editing a reusable composite definition.
              </p>
            ) : null}
          </div>
          <div className="selected-module-actions">
            {Object.values(moduleDef.paramSchema).length > 0 ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() => onCopyParams(moduleInstance.id)}
              >
                Copy Params
              </button>
            ) : null}
            {parameterClipboard &&
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
                Apply Params To Selected
              </button>
            ) : null}
            {canRenameModuleIds && onRenameModuleInstance ? (
              <button
                type="button"
                className="mini-action-button"
                disabled={
                  normalizeModuleInstanceIdCandidate(effectiveRenameDraft) === moduleInstance.id ||
                  Boolean(renameValidationError)
                }
                onClick={() => {
                  const nextModuleId = normalizeModuleInstanceIdCandidate(effectiveRenameDraft);
                  const validationError = getModuleInstanceIdValidationError(
                    nextModuleId,
                    project.modules.map((projectModule) => projectModule.id),
                    moduleInstance.id,
                  );
                  if (validationError) {
                    setRenameState({
                      moduleId: moduleInstance.id,
                      draft: effectiveRenameDraft,
                      error: validationError,
                    });
                    return;
                  }

                  onRenameModuleInstance(moduleInstance.id, nextModuleId);
                  setRenameState({
                    moduleId: nextModuleId,
                    draft: nextModuleId,
                    error: null,
                  });
                }}
              >
                Rename Module
              </button>
            ) : null}
            {canBypassSelectedModule ? (
              <button
                type="button"
                className={moduleInstance.bypass ? 'mini-action-button' : 'mini-action-button'}
                onClick={() => onSetModuleBypass(moduleInstance.id, !moduleInstance.bypass)}
              >
                {moduleInstance.bypass ? 'Disable Bypass' : 'Enable Bypass'}
              </button>
            ) : null}
            {isCompositeDefinition(moduleDef) && onUnzipComposite ? (
              <button
                type="button"
                className="primitive-add-button"
                onClick={() => onUnzipComposite(moduleInstance.id)}
              >
                Unzip Composite
              </button>
            ) : null}
            <button
              type="button"
              className="delete-module-button"
              onClick={() => onDeleteModule(moduleInstance.id)}
            >
              Delete Module
            </button>
          </div>
          {parameterClipboard &&
          parameterClipboard.sourceModuleId === moduleInstance.id &&
          parameterClipboard.sourceDefId === moduleDef.id ? (
            <div className="content-selector-card">
              <p className="comparison-copy">
                Copied parameter set from <strong>{moduleInstance.id}</strong>. Apply will target{' '}
                <strong>{compatibleParamApplyTargetIds.length}</strong> selected {moduleDef.id}{' '}
                module{compatibleParamApplyTargetIds.length === 1 ? '' : 's'}.
              </p>
              {selectedIncompatibleParamTargetCount > 0 ? (
                <p className="comparison-copy">
                  {selectedIncompatibleParamTargetCount} selected module
                  {selectedIncompatibleParamTargetCount === 1 ? '' : 's'} will be skipped because
                  they are not {moduleDef.id} instances.
                </p>
              ) : null}
            </div>
          ) : null}

          {canBypassSelectedModule ? (
            <div className="content-selector-card">
              <p className="comparison-copy">
                Bypass keeps this module in the graph but passes its single input straight through unchanged.
              </p>
              <div className="content-selector-meta">
                <span className="content-status-chip">
                  {moduleInstance.bypass ? 'Bypass Active' : 'Bypass Off'}
                </span>
                <span className="content-status-chip">
                  Eligible: one-input / one-output / same-domain
                </span>
              </div>
            </div>
          ) : null}
          {bypassIneligibilityReason ? (
            <div className="content-selector-card">
              <p className="comparison-copy">
                Bypass unavailable: {bypassIneligibilityReason}
              </p>
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
            {Object.values(moduleDef.paramSchema).length === 0 ? (
              <p className="empty-state">This module has no configurable parameters.</p>
            ) : (
              Object.values(moduleDef.paramSchema).map((field) => {
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
                const baselineValue =
                  baselineModuleInstance?.params[field.key] ?? field.defaultValue;
                const draftValue = getParamDraft(moduleInstance.id, field.key);
                const renderedValue =
                  draftValue ?? formatParamValue(value, field);
                const parsedDraft =
                  draftValue !== undefined ? parseParamValue(draftValue, field) : null;
                const fieldError = parsedDraft && !parsedDraft.ok ? parsedDraft.error : null;
                const isForwardedParam =
                  isCompositeDefinition(moduleDef) &&
                  (moduleDef.forwardedParams ?? []).some(
                    (binding) => binding.externalParam === field.key,
                  );

                if (moduleDef.id === 'RotorReverse' && field.key === 'linkedRotorId') {
                  const rotorOptions = project.modules.filter((candidate) => candidate.defId === 'Rotor');

                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      <select
                        value={String(moduleInstance.params[field.key] ?? '')}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.value)
                        }
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
                        Mirrored from the linked forward rotor. Edit the forward rotor to change this value.
                      </p>
                    </label>
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
                    (moduleDef.id === 'Rotor' || moduleDef.id === 'RotorReverse') && field.key === 'wiring';
                  const isPlugboardWiringField =
                    moduleDef.id === 'Plugboard' && field.key === 'wiring';
                  const isReflectorWiringField =
                    moduleDef.id === 'Reflector' && field.key === 'wiring';

                  if (isRotorWiringField) {
                    const rotorWiring = getEditableRotorWiring(value);
                    const baselineRotorWiring = getEditableRotorWiring(baselineValue);
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    const rotorSvgHeight =
                      rotorWireLayout?.height ??
                      (rotorWiring
                        ? rotorWiring.length * PERMUTATION_EDITOR_PORT_HEIGHT +
                          Math.max(0, rotorWiring.length - 1) * PERMUTATION_EDITOR_PORT_GAP
                        : 0);

                    return (
                      <label key={field.key} className="param-field">
                        {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                        {baselineRotorWiring && !areParameterValuesEqual(value, baselineValue) ? (
                          <span className="baseline-chip">
                            Baseline: {serializeRotorWiring(baselineRotorWiring)}
                          </span>
                        ) : null}
                        {rotorWiring ? (
                          <div className="permutation-editor">
                            <div className="permutation-editor-meta">
                              <span className="content-status-chip">
                                Drag an input wire onto an output letter to replug the rotor wiring
                              </span>
                              <span className="content-status-chip">
                                Position stays separate from the authored wiring
                              </span>
                            </div>
                            <div className="permutation-wire-editor">
                              <div className="permutation-wire-lane" ref={rotorInputLaneRef}>
                                <span className="meta-label permutation-wire-lane-label">Input</span>
                                {alphabet.map((letter, inputIndex) => (
                                  <button
                                    key={`rotor-input-${letter}`}
                                    type="button"
                                    ref={(node) => {
                                      rotorInputRefs.current[inputIndex] = node;
                                    }}
                                    draggable
                                    className={
                                      draggedRotorInputIndex === inputIndex
                                        ? 'permutation-port permutation-port-input active'
                                        : 'permutation-port permutation-port-input'
                                    }
                                    onDragStart={() => setDraggedRotorInputIndex(inputIndex)}
                                    onDragEnd={() => setDraggedRotorInputIndex(null)}
                                  >
                                    <strong className="permutation-slot-value">{letter}</strong>
                                  </button>
                                ))}
                              </div>
                              <div
                                className="permutation-wire-canvas"
                                aria-hidden="true"
                                style={{ height: `${rotorSvgHeight}px` }}
                              >
                                <svg
                                  viewBox={`0 0 220 ${rotorSvgHeight}`}
                                  preserveAspectRatio="none"
                                >
                                  {rotorWiring.map((targetLetter, inputIndex) => {
                                    const y1 =
                                      rotorWireLayout?.inputYs[inputIndex] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        inputIndex *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const y2 =
                                      rotorWireLayout?.outputYs[alphabet.indexOf(targetLetter)] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        alphabet.indexOf(targetLetter) *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const color = getPermutationWireColor(inputIndex);

                                    return (
                                      <g key={`rotor-wire-${inputIndex}`}>
                                        <line
                                          x1="18"
                                          y1={y1}
                                          x2="202"
                                          y2={y2}
                                          stroke={color}
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          opacity="0.92"
                                        />
                                        <circle cx="18" cy={y1} r="4" fill={color} opacity="0.98" />
                                        <circle cx="202" cy={y2} r="4" fill={color} opacity="0.98" />
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>
                              <div className="permutation-wire-lane" ref={rotorOutputLaneRef}>
                                <span className="meta-label permutation-wire-lane-label">Output</span>
                                {alphabet.map((outputLetter) => {
                                  const sourceInputIndex = rotorWiring.findIndex(
                                    (entry) => entry === outputLetter,
                                  );

                                  return (
                                    <button
                                      key={`rotor-output-${outputLetter}`}
                                      type="button"
                                      ref={(node) => {
                                        rotorOutputRefs.current[alphabet.indexOf(outputLetter)] = node;
                                      }}
                                      className="permutation-port permutation-port-output"
                                      onDragOver={(event) => event.preventDefault()}
                                      onDrop={(event) => {
                                        event.preventDefault();
                                        if (draggedRotorInputIndex === null) {
                                          return;
                                        }

                                        const nextWiring = swapRotorWiringTargets(
                                          rotorWiring,
                                          draggedRotorInputIndex,
                                          sourceInputIndex,
                                        );
                                        const serialized = serializeRotorWiring(nextWiring);
                                        setDraggedRotorInputIndex(null);
                                        onParamDraftChange(moduleInstance.id, field.key, serialized);
                                        onParamChange(moduleInstance.id, field.key, nextWiring);
                                      }}
                                    >
                                      <strong className="permutation-slot-value">{outputLetter}</strong>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <label className="param-field permutation-editor-raw">
                              <span>Raw Wiring</span>
                              <textarea
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
                          </div>
                        ) : (
                          <>
                            <WiringEditor
                              field={field}
                              value={value}
                              renderedValue={renderedValue}
                              moduleId={moduleInstance.id}
                              onParamDraftChange={onParamDraftChange}
                              onParamChange={onParamChange}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </>
                        )}
                      </label>
                    );
                  }

                  if (isPlugboardWiringField) {
                    const plugboardWiring = getEditablePlugboardWiring(value);
                    const baselinePlugboardWiring = getEditablePlugboardWiring(baselineValue);
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    const plugboardPairStyles = plugboardWiring
                      ? buildPairStyles(plugboardWiring, { includeSelfPairs: false })
                      : {};
                    const activePlugboardPairs = plugboardWiring
                      ? alphabet.filter((letter, index) => plugboardWiring[index] !== letter).length / 2
                      : 0;
                    const canUnpairSelectedPlugboardLetter =
                      plugboardWiring &&
                      selectedPlugboardLetter &&
                      plugboardWiring[alphabet.indexOf(selectedPlugboardLetter)] !== selectedPlugboardLetter;

                    return (
                      <label key={field.key} className="param-field">
                        {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                        {baselinePlugboardWiring && !areParameterValuesEqual(value, baselineValue) ? (
                          <span className="baseline-chip">
                            Baseline: {serializePlugboardWiring(baselinePlugboardWiring)}
                          </span>
                        ) : null}
                        {plugboardWiring ? (
                          <div className="reflector-editor">
                            <div className="reflector-editor-meta">
                              <span className="content-status-chip">
                                Click one letter, then another, to pair them. Unpaired letters pass straight through.
                              </span>
                              <span className="content-status-chip">
                                Active pairs: {activePlugboardPairs}
                              </span>
                              <span className="content-status-chip">
                                Selected: {selectedPlugboardLetter ?? 'none'}
                              </span>
                            </div>
                            <p className="comparison-copy">
                              Plugboard is reciprocal: every valid swap already undoes itself. The helper below confirms
                              and normalizes that reciprocal structure.
                            </p>
                            <div className="permutation-editor-actions">
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() => {
                                  const nextWiring = buildIdentityPlugboardWiring();
                                  const serialized = serializePlugboardWiring(nextWiring);
                                  setSelectedPlugboardLetter(null);
                                  onParamDraftChange(moduleInstance.id, field.key, serialized);
                                  onParamChange(moduleInstance.id, field.key, nextWiring);
                                }}
                              >
                                Reset To Identity
                              </button>
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() => {
                                  const nextWiring = normalizePlugboardReciprocalWiring(plugboardWiring);
                                  const serialized = serializePlugboardWiring(nextWiring);
                                  setSelectedPlugboardLetter(null);
                                  setReciprocityNote({
                                    moduleId: moduleInstance.id,
                                    text:
                                      'Plugboard is self-reciprocal: the reciprocal mapping is identical to the current valid pairing.',
                                  });
                                  onParamDraftChange(moduleInstance.id, field.key, serialized);
                                  onParamChange(moduleInstance.id, field.key, nextWiring);
                                }}
                              >
                                Normalize Reciprocal Pairs
                              </button>
                              <button
                                type="button"
                                className="mini-action-button"
                                disabled={!canUnpairSelectedPlugboardLetter}
                                onClick={() => {
                                  if (!selectedPlugboardLetter) {
                                    return;
                                  }

                                  const nextWiring = unpairPlugboardLetter(
                                    plugboardWiring,
                                    selectedPlugboardLetter,
                                  );
                                  const serialized = serializePlugboardWiring(nextWiring);
                                  setSelectedPlugboardLetter(null);
                                  onParamDraftChange(moduleInstance.id, field.key, serialized);
                                  onParamChange(moduleInstance.id, field.key, nextWiring);
                                }}
                              >
                                Unpair Selected
                              </button>
                            </div>
                            {reciprocityNote?.moduleId === moduleInstance.id && moduleDef.id === 'Plugboard' ? (
                              <p className="comparison-copy">{reciprocityNote.text}</p>
                            ) : null}
                            <div className="reflector-editor-grid">
                              {alphabet.map((letter, index) => {
                                const partner = plugboardWiring[index];
                                const pairKey =
                                  partner === letter ? null : getPairKey(letter, partner);

                                return (
                                  <button
                                    key={`plugboard-socket-${letter}`}
                                    type="button"
                                    style={pairKey ? plugboardPairStyles[pairKey] : undefined}
                                    className={
                                      selectedPlugboardLetter === letter
                                        ? 'reflector-socket active'
                                        : partner === letter
                                          ? 'reflector-socket reflector-socket-self'
                                          : 'reflector-socket'
                                    }
                                    onClick={() => {
                                      if (selectedPlugboardLetter === null) {
                                        setSelectedPlugboardLetter(letter);
                                        return;
                                      }

                                      if (selectedPlugboardLetter === letter) {
                                        setSelectedPlugboardLetter(null);
                                        return;
                                      }

                                      const nextWiring = pairPlugboardLetters(
                                        plugboardWiring,
                                        selectedPlugboardLetter,
                                        letter,
                                      );
                                      const serialized = serializePlugboardWiring(nextWiring);
                                      setSelectedPlugboardLetter(null);
                                      onParamDraftChange(moduleInstance.id, field.key, serialized);
                                      onParamChange(moduleInstance.id, field.key, nextWiring);
                                    }}
                                  >
                                    <span className="meta-label">Socket</span>
                                    <strong className="reflector-socket-letter">{letter}</strong>
                                    {partner === letter ? (
                                      <>
                                        <span className="reflector-socket-chip reflector-socket-chip-self">
                                          Pass Through
                                        </span>
                                        <span className="reflector-socket-pair">
                                          Unpaired <strong>{letter}</strong> remains itself
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="reflector-socket-chip">
                                          {getPairKey(letter, partner).replace('-', ' ↔ ')}
                                        </span>
                                        <span className="reflector-socket-pair">
                                          Paired with <strong>{partner}</strong>
                                        </span>
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <label className="param-field reflector-editor-raw">
                              <span>Raw Wiring</span>
                              <textarea
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
                          </div>
                        ) : (
                          <>
                            <WiringEditor
                              field={field}
                              value={value}
                              renderedValue={renderedValue}
                              moduleId={moduleInstance.id}
                              onParamDraftChange={onParamDraftChange}
                              onParamChange={onParamChange}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </>
                        )}
                      </label>
                    );
                  }

                  if (isReflectorWiringField) {
                    const reflectorWiring = getEditableReflectorWiring(value);
                    const baselineReflectorWiring = getEditableReflectorWiring(baselineValue);
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    const reflectorPairStyles = reflectorWiring
                      ? buildPairStyles(reflectorWiring)
                      : {};

                    return (
                      <label key={field.key} className="param-field">
                        {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                        {baselineReflectorWiring && !areParameterValuesEqual(value, baselineValue) ? (
                          <span className="baseline-chip">
                            Baseline: {serializeReflectorWiring(baselineReflectorWiring)}
                          </span>
                        ) : null}
                        {reflectorWiring ? (
                          <div className="reflector-editor">
                            <div className="reflector-editor-meta">
                              <span className="content-status-chip">
                                Click one letter, then another, to re-pair the sockets
                              </span>
                              <span className="content-status-chip">
                                Selected: {selectedReflectorLetter ?? 'none'}
                              </span>
                            </div>
                            <p className="comparison-copy">
                              Reflector is involutive: every valid pair already maps back to itself. The helper below
                              confirms and normalizes that reciprocal wiring.
                            </p>
                            <div className="permutation-editor-actions">
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() => {
                                  const nextWiring = normalizeReflectorReciprocalWiring(reflectorWiring);
                                  const serialized = serializeReflectorWiring(nextWiring);
                                  setSelectedReflectorLetter(null);
                                  setReciprocityNote({
                                    moduleId: moduleInstance.id,
                                    text:
                                      'Reflector is self-reciprocal: the reciprocal mapping is identical to the current valid pairing.',
                                  });
                                  onParamDraftChange(moduleInstance.id, field.key, serialized);
                                  onParamChange(moduleInstance.id, field.key, nextWiring);
                                }}
                              >
                                Normalize Reciprocal Pairs
                              </button>
                            </div>
                            {reciprocityNote?.moduleId === moduleInstance.id && moduleDef.id === 'Reflector' ? (
                              <p className="comparison-copy">{reciprocityNote.text}</p>
                            ) : null}
                            <div className="reflector-editor-grid">
                              {alphabet.map((letter, index) => (
                                <button
                                  key={`reflector-socket-${letter}`}
                                  type="button"
                                  style={reflectorPairStyles[getPairKey(letter, reflectorWiring[index])]}
                                  className={
                                    selectedReflectorLetter === letter
                                      ? 'reflector-socket active'
                                      : 'reflector-socket'
                                  }
                                  onClick={() => {
                                    if (selectedReflectorLetter === null) {
                                      setSelectedReflectorLetter(letter);
                                      return;
                                    }

                                    if (selectedReflectorLetter === letter) {
                                      setSelectedReflectorLetter(null);
                                      return;
                                    }

                                    const nextWiring = pairReflectorLetters(
                                      reflectorWiring,
                                      selectedReflectorLetter,
                                      letter,
                                    );
                                    const serialized = serializeReflectorWiring(nextWiring);
                                    setSelectedReflectorLetter(null);
                                    onParamDraftChange(moduleInstance.id, field.key, serialized);
                                    onParamChange(moduleInstance.id, field.key, nextWiring);
                                  }}
                                >
                                  <span className="meta-label">Socket</span>
                                  <strong className="reflector-socket-letter">{letter}</strong>
                                  <span className="reflector-socket-chip">
                                    {getPairKey(letter, reflectorWiring[index]).replace('-', ' ↔ ')}
                                  </span>
                                  <span className="reflector-socket-pair">
                                    Paired with <strong>{reflectorWiring[index]}</strong>
                                  </span>
                                </button>
                              ))}
                            </div>
                            <label className="param-field reflector-editor-raw">
                              <span>Raw Wiring</span>
                              <textarea
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
                          </div>
                        ) : (
                          <>
                            <WiringEditor
                              field={field}
                              value={value}
                              renderedValue={renderedValue}
                              moduleId={moduleInstance.id}
                              onParamDraftChange={onParamDraftChange}
                              onParamChange={onParamChange}
                            />
                            {fieldError ? <p className="field-error">{fieldError}</p> : null}
                          </>
                        )}
                      </label>
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
                  const editableTable = getEditableSBoxTable(value);
                  const baselineTable = getEditableSBoxTable(baselineValue);
                  const selectedEntryIndex =
                    editableTable && editableTable.length > 0
                      ? Math.min(Math.max(0, requestedSBoxEditIndex), editableTable.length - 1)
                      : 0;
                  const selectedEntryValue = editableTable?.[selectedEntryIndex] ?? 0;
                  const usesHexGrid = editableTable?.length === 256;
                  const gridColumns = editableTable ? getSBoxGridColumns(editableTable.length) : 4;
                  const selectedRow = getSBoxGridRow(selectedEntryIndex, gridColumns);
                  const selectedColumn = getSBoxGridColumn(selectedEntryIndex, gridColumns);
                  const rowCount = editableTable ? Math.ceil(editableTable.length / gridColumns) : 0;
                  const applyNextTable = (nextTable: number[]) => {
                    const serialized = serializeSBoxTable(nextTable);
                    onParamDraftChange(moduleInstance.id, field.key, serialized);
                    onParamChange(moduleInstance.id, field.key, serialized);
                  };

                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {baselineTable && !areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {baselineTable.length} entries
                        </span>
                      ) : null}
                      {editableTable ? (
                        <div className="sbox-editor">
                          <div className="sbox-editor-actions">
                            <span className="meta-label">Generate</span>
                            <div className="sbox-generate-controls">
                              <select
                                value={String(sboxGenerateSize)}
                                onChange={(event) => setSboxGenerateSize(Number(event.target.value))}
                              >
                                {SBOX_GENERATION_SIZES.map((size) => (
                                  <option key={size.entryCount} value={size.entryCount}>
                                    {size.label}
                                  </option>
                                ))}
                              </select>
                              {SBOX_GENERATION_PRESETS.map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  className="mini-action-button"
                                  onClick={() =>
                                    applyNextTable(generateSBoxTable(sboxGenerateSize, preset.id))
                                  }
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="sbox-editor-actions">
                            <span className="meta-label">Transform</span>
                            <div className="sbox-generate-controls">
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() =>
                                  applyNextTable(
                                    rotateSBoxRow(editableTable, selectedRow, gridColumns, 'left'),
                                  )
                                }
                              >
                                Rotate Row Left
                              </button>
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() =>
                                  applyNextTable(
                                    rotateSBoxRow(editableTable, selectedRow, gridColumns, 'right'),
                                  )
                                }
                              >
                                Rotate Row Right
                              </button>
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() =>
                                  applyNextTable(
                                    rotateSBoxColumn(editableTable, selectedColumn, gridColumns, 'up'),
                                  )
                                }
                              >
                                Rotate Column Up
                              </button>
                              <button
                                type="button"
                                className="mini-action-button"
                                onClick={() =>
                                  applyNextTable(
                                    rotateSBoxColumn(editableTable, selectedColumn, gridColumns, 'down'),
                                  )
                                }
                              >
                                Rotate Column Down
                              </button>
                            </div>
                          </div>
                          <div className="sbox-editor-actions">
                            <span className="meta-label">Analyze</span>
                            <div className="sbox-generate-controls">
                              <span className="content-status-chip">
                                {countSBoxFixedPoints(editableTable)} fixed point{countSBoxFixedPoints(editableTable) === 1 ? '' : 's'}
                              </span>
                              <span className="content-status-chip">
                                {isSBoxInvolution(editableTable) ? 'Involution (self-inverse)' : 'Not an involution'}
                              </span>
                              <button
                                type="button"
                                className="mini-action-button"
                                title="Build the table that undoes this substitution"
                                onClick={() => applyNextTable(invertSBoxTable(editableTable))}
                              >
                                Build Inverse
                              </button>
                            </div>
                          </div>
                          <div className="sbox-editor-meta">
                            <span className="content-status-chip">{editableTable.length} entries</span>
                            <span className="content-status-chip">
                              Safe edit mode swaps entries so the table stays a valid permutation
                            </span>
                            <span className="content-status-chip">
                              Active row {formatSBoxAxisLabel(selectedRow, gridColumns)} · column{' '}
                              {formatSBoxAxisLabel(selectedColumn, gridColumns)}
                            </span>
                          </div>
                          <div
                            className="sbox-editor-grid"
                            style={{ gridTemplateColumns: `56px repeat(${gridColumns}, minmax(0, 1fr))` }}
                          >
                            <span className="sbox-table-corner" />
                            {Array.from({ length: gridColumns }, (_, columnIndex) => (
                              <span key={`sbox-editor-col-${columnIndex}`} className="sbox-table-header">
                                {formatSBoxAxisLabel(columnIndex, gridColumns)}
                              </span>
                            ))}
                            {editableTable.map((entryValue, index) => (
                              <Fragment key={`sbox-editor-cell-wrap-${index}`}>
                                {index % gridColumns === 0 ? (
                                  <span
                                    className={
                                      Math.floor(index / gridColumns) === selectedRow
                                        ? 'sbox-table-header sbox-table-row-header active'
                                        : 'sbox-table-header sbox-table-row-header'
                                    }
                                  >
                                    {formatSBoxAxisLabel(Math.floor(index / gridColumns), gridColumns)}
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  className={
                                    index === selectedEntryIndex
                                      ? 'sbox-table-cell active sbox-editor-cell'
                                      : Math.floor(index / gridColumns) === selectedRow ||
                                          index % gridColumns === selectedColumn
                                        ? 'sbox-table-cell context sbox-editor-cell'
                                      : 'sbox-table-cell sbox-editor-cell'
                                  }
                                  onClick={() => setRequestedSBoxEditIndex(index)}
                                  title={`table[${index}] = ${entryValue}`}
                                >
                                  <strong className="sbox-table-value">
                                    {formatSBoxAxisLabel(entryValue, gridColumns)}
                                  </strong>
                                </button>
                              </Fragment>
                            ))}
                          </div>
                          <div className="sbox-editor-detail">
                            <div className="sbox-detail-chip">
                              <span className="meta-label">Selected Entry</span>
                              <strong className="sbox-bits">
                                {usesHexGrid
                                  ? `table[0x${formatSBoxHexValue(selectedEntryIndex, 8)}]`
                                  : `table[${selectedEntryIndex}]`}
                              </strong>
                              <span className="sbox-detail-metric">
                                {usesHexGrid
                                  ? `current output 0x${formatSBoxHexValue(selectedEntryValue, 8)} · decimal ${selectedEntryValue}`
                                  : `current output ${selectedEntryValue}`}
                              </span>
                            </div>
                            <label className="param-field sbox-editor-select">
                              <span>Swap selected entry with value</span>
                              <select
                                value={String(selectedEntryValue)}
                                onChange={(event) => {
                                  const nextEntryValue = Number(event.target.value);
                                  applyNextTable(
                                    swapSBoxEntry(editableTable, selectedEntryIndex, nextEntryValue),
                                  );
                                }}
                              >
                                {editableTable.map((_, optionValue) => (
                                  <option key={`sbox-editor-option-${optionValue}`} value={optionValue}>
                                    {usesHexGrid
                                      ? `0x${formatSBoxHexValue(optionValue, 8)} · ${optionValue}`
                                      : optionValue}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="param-field sbox-editor-select">
                              <span>Swap selected row with</span>
                              <select
                                value={String(selectedRow)}
                                onChange={(event) => {
                                  const nextRow = Number(event.target.value);
                                  applyNextTable(
                                    swapSBoxRows(editableTable, selectedRow, nextRow, gridColumns),
                                  );
                                }}
                              >
                                {Array.from({ length: rowCount }, (_, rowIndex) => (
                                  <option key={`sbox-editor-row-${rowIndex}`} value={rowIndex}>
                                    {usesHexGrid
                                      ? `row 0x${formatSBoxAxisLabel(rowIndex, gridColumns)}`
                                      : `row ${rowIndex}`}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="param-field sbox-editor-select">
                              <span>Swap selected column with</span>
                              <select
                                value={String(selectedColumn)}
                                onChange={(event) => {
                                  const nextColumn = Number(event.target.value);
                                  applyNextTable(
                                    swapSBoxColumns(
                                      editableTable,
                                      selectedColumn,
                                      nextColumn,
                                      gridColumns,
                                    ),
                                  );
                                }}
                              >
                                {Array.from({ length: gridColumns }, (_, columnIndex) => (
                                  <option key={`sbox-editor-column-${columnIndex}`} value={columnIndex}>
                                    {usesHexGrid
                                      ? `column 0x${formatSBoxAxisLabel(columnIndex, gridColumns)}`
                                      : `column ${columnIndex}`}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <label className="param-field sbox-editor-raw">
                            <span>Raw CSV Table</span>
                            <textarea
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
                        </div>
                      ) : (
                        <>
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
                          <p className="field-error">
                            {fieldError ?? 'S-Box editor is unavailable until the table parses again.'}
                          </p>
                        </>
                      )}
                    </label>
                  );
                }

                const isPermutationOrderField =
                  (moduleDef.id === 'Permutation' || moduleDef.id === 'SymbolPermutation') &&
                  field.key === 'order' &&
                  field.kind === 'string';

                if (isPermutationOrderField) {
                  const editableOrder = getEditablePermutationOrder(value);
                  const baselineOrder = getEditablePermutationOrder(baselineValue);
                  const canUseVisualPermutationEditor =
                    editableOrder ? isSimplePermutationOrder(editableOrder) : false;
                  const permutationSvgHeight =
                    permutationWireLayout?.height ??
                    (editableOrder && canUseVisualPermutationEditor
                      ? editableOrder.length * PERMUTATION_EDITOR_PORT_HEIGHT +
                        Math.max(0, editableOrder.length - 1) * PERMUTATION_EDITOR_PORT_GAP
                      : 0);

                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {baselineOrder && !areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {serializePermutationOrder(baselineOrder)}
                        </span>
                      ) : null}
                      {editableOrder ? (
                        <div className="permutation-editor">
                          <div className="permutation-editor-actions">
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => {
                                const nextValue = serializePermutationOrder(
                                  buildIdentityPermutationOrder(editableOrder.length),
                                );
                                onParamDraftChange(moduleInstance.id, field.key, nextValue);
                                onParamChange(moduleInstance.id, field.key, nextValue);
                              }}
                            >
                              Reset To Identity
                            </button>
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => {
                                const nextValue = serializePermutationOrder(
                                  buildReversePermutationOrder(editableOrder.length),
                                );
                                onParamDraftChange(moduleInstance.id, field.key, nextValue);
                                onParamChange(moduleInstance.id, field.key, nextValue);
                              }}
                            >
                              Reset To Reverse
                            </button>
                            <button
                              type="button"
                              className="mini-action-button"
                              title="Build the permutation that undoes the current routing"
                              onClick={() => {
                                const nextValue = serializePermutationOrder(
                                  buildInversePermutationOrder(editableOrder),
                                );
                                onParamDraftChange(moduleInstance.id, field.key, nextValue);
                                onParamChange(moduleInstance.id, field.key, nextValue);
                              }}
                            >
                              Build Inverse
                            </button>
                          </div>
                          <div className="permutation-editor-meta">
                            <span className="content-status-chip">{editableOrder.length} output slots</span>
                            <span className="content-status-chip">
                              {canUseVisualPermutationEditor
                                ? 'Drag an input wire onto an output slot to replug the routing'
                                : 'Raw CSV remains available until the permutation order parses again'}
                            </span>
                          </div>
                          {canUseVisualPermutationEditor ? (
                            <div className="permutation-wire-editor">
                              <div className="permutation-wire-lane" ref={permutationInputLaneRef}>
                                {editableOrder.map((_, inputIndex) => (
                                  <button
                                    key={`perm-input-${inputIndex}`}
                                    type="button"
                                    ref={(node) => {
                                      permutationInputRefs.current[inputIndex] = node;
                                    }}
                                    draggable
                                    className={
                                      draggedPermutationInputIndex === inputIndex
                                        ? 'permutation-port permutation-port-input active'
                                        : 'permutation-port permutation-port-input'
                                    }
                                    onDragStart={() => setDraggedPermutationInputIndex(inputIndex)}
                                    onDragEnd={() => setDraggedPermutationInputIndex(null)}
                                  >
                                    <span className="meta-label">Input</span>
                                    <strong className="permutation-slot-value">{inputIndex}</strong>
                                  </button>
                                ))}
                              </div>
                              <div
                                className="permutation-wire-canvas"
                                aria-hidden="true"
                                style={{ height: `${permutationSvgHeight}px` }}
                              >
                                <svg
                                  viewBox={`0 0 220 ${permutationSvgHeight}`}
                                  preserveAspectRatio="none"
                                >
                                  {editableOrder.map((inputIndex, outputIndex) => {
                                    const y1 =
                                      permutationWireLayout?.inputYs[inputIndex] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        inputIndex *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const y2 =
                                      permutationWireLayout?.outputYs[outputIndex] ??
                                      (PERMUTATION_EDITOR_HEADER_OFFSET +
                                        PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                                        outputIndex *
                                          (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                                    const color = getPermutationWireColor(inputIndex);

                                    return (
                                      <g key={`perm-wire-${outputIndex}`}>
                                        <line
                                          x1="18"
                                          y1={y1}
                                          x2="202"
                                          y2={y2}
                                          stroke={color}
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          opacity="0.92"
                                        />
                                        <circle cx="18" cy={y1} r="4" fill={color} opacity="0.98" />
                                        <circle cx="202" cy={y2} r="4" fill={color} opacity="0.98" />
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>
                              <div className="permutation-wire-lane" ref={permutationOutputLaneRef}>
                                {editableOrder.map((inputIndex, outputIndex) => (
                                  <button
                                    key={`perm-output-${outputIndex}`}
                                    type="button"
                                    ref={(node) => {
                                      permutationOutputRefs.current[outputIndex] = node;
                                    }}
                                    className="permutation-port permutation-port-output"
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      if (draggedPermutationInputIndex === null) {
                                        return;
                                      }

                                      const sourceOutputIndex = editableOrder.findIndex(
                                        (entry) => entry === draggedPermutationInputIndex,
                                      );
                                      if (sourceOutputIndex < 0) {
                                        setDraggedPermutationInputIndex(null);
                                        return;
                                      }

                                      const nextOrder = swapPermutationOrderPositions(
                                        editableOrder,
                                        sourceOutputIndex,
                                        outputIndex,
                                      );
                                      const serialized = serializePermutationOrder(nextOrder);
                                      setDraggedPermutationInputIndex(null);
                                      onParamDraftChange(moduleInstance.id, field.key, serialized);
                                      onParamChange(moduleInstance.id, field.key, serialized);
                                    }}
                                  >
                                    <span className="meta-label">Output {outputIndex}</span>
                                    <strong className="permutation-slot-value">Input {inputIndex}</strong>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          <label className="param-field permutation-editor-raw">
                            <span>Raw CSV Order</span>
                            <textarea
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
                        </div>
                      ) : (
                        <>
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
                          <p className="field-error">
                            {fieldError ?? 'Permutation editor is unavailable until the order parses again.'}
                          </p>
                        </>
                      )}
                    </label>
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
                    {isHexSourceValueField ? (
                      <div className="param-stepper-row">
                        <button
                          type="button"
                          className="mini-action-button"
                          disabled={Boolean(fieldError)}
                          onClick={() => {
                            const nextValue = stepHexString(String(value ?? field.defaultValue ?? ''), -1);
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
                            const nextValue = stepHexString(String(value ?? field.defaultValue ?? ''), 1);
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

        </section>
      ) : (
        inspectorTab === 'configure' ? (
          <p className="empty-state">Select a module to inspect and edit its parameters.</p>
        ) : null
      )}

      {inspectorTab === 'analyze' && selectedIssues.length > 0 ? (
        <section className="analysis-section">
          <span className="meta-label">Selected Issues</span>
          <ul className="issue-list">
            {groupedSelectedIssues.map((group, index) => (
              <li
                key={`${group.targetModuleId ?? 'global'}-${index}`}
                className={group.targetModuleId ? 'issue-card issue-card-actionable' : 'issue-card'}
                onClick={() => {
                  if (group.targetModuleId) {
                    onSelectIssueTarget(group.targetModuleId);
                  }
                }}
              >
                <strong>{group.title}</strong>
                {group.targetModuleId ? (
                  <span className="issue-target-chip">{group.targetModuleId}</span>
                ) : null}
                <p>{group.messages.join(' ')}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inspectorTab === 'analyze' && executionError ? (
        <p className={validationIssues.length > 0 ? 'inspector-warning' : 'inspector-runtime-error'}>
          {validationIssues.length > 0
            ? 'Current edits make the graph invalid. Resolve the issues below to restore execution.'
            : `Execution failed even though the graph is valid. ${executionError}`}
        </p>
     ) : inspectorTab === 'analyze' && selectedTrace ? (
        <div className="selected-trace">
          <span className="meta-label">Selected Trace</span>
          <p className="selected-trace-order">
            Step {selectedTraceOrder ?? '?'} of{' '}
            {analysisTrace.length}
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

      {inspectorTab === 'analyze' && globalIssues.length > 0 ? (
        <section className="analysis-section">
          <span className="meta-label">Graph Issues</span>
          <ul className="issue-list">
            {groupedGlobalIssues.map((group, index) => (
              <li
                key={`${group.targetModuleId ?? 'global'}-${index}`}
                className={group.targetModuleId ? 'issue-card issue-card-actionable' : 'issue-card'}
                onClick={() => {
                  if (group.targetModuleId) {
                    onSelectIssueTarget(group.targetModuleId);
                  }
                }}
              >
                <strong>{group.title}</strong>
                {group.targetModuleId ? (
                  <span className="issue-target-chip">{group.targetModuleId}</span>
                ) : null}
                <p>{group.messages.join(' ')}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inspectorTab === 'analyze' ? (
      <div className="trace-toolbar">
        <span className="meta-label">Execution Trace</span>
        <div className="trace-toolbar-controls">
          {roundFocusOptions.length > 0 ? (
            <label className="trace-round-select">
              <span className="meta-label">Focus Round</span>
              <select
                value={effectiveFocusedRoundPath}
                onChange={(event) => setFocusedRoundPath(event.target.value)}
              >
                <option value="all">All Rounds</option>
                {roundFocusOptions.map((option) => (
                  <option key={option.path} value={option.path}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="trace-mode-toggle">
          <button
            type="button"
            className={effectiveTraceMode === 'focused' ? 'trace-mode-button active' : 'trace-mode-button'}
            disabled={!selectedTrace}
            onClick={() => setTraceMode('focused')}
          >
            Focused
          </button>
          <button
            type="button"
            className={effectiveTraceMode === 'full' ? 'trace-mode-button active' : 'trace-mode-button'}
            onClick={() => setTraceMode('full')}
          >
            Full
          </button>
          <button
            type="button"
            className={effectiveTraceMode === 'upstream' ? 'trace-mode-button active' : 'trace-mode-button'}
            disabled={!selectedTrace}
            onClick={() => setTraceMode('upstream')}
          >
            Upstream
          </button>
          <button
            type="button"
            className={effectiveTraceMode === 'downstream' ? 'trace-mode-button active' : 'trace-mode-button'}
            disabled={!selectedTrace}
            onClick={() => setTraceMode('downstream')}
          >
            Downstream
          </button>
          </div>
        </div>
      </div>
      ) : null}

      {inspectorTab === 'analyze' ? (
      <ol className="trace-list">
        {traceEntries.map((entry, analysisIndex) => {
          const isNested = (entry.depth ?? 0) > 0;
          const topLevelModuleId = getTopLevelTraceModuleId(entry);
          const nestedPath = getNestedTracePath(entry);
          const roundPath = getIteratorRoundPath(entry);
          const previousRoundPath =
            analysisIndex > 0 ? getIteratorRoundPath(traceEntries[analysisIndex - 1]) : null;
          const isRoundBoundary = roundPath !== null && roundPath !== previousRoundPath;
          const traceIndex = analysisTrace.findIndex(
            (traceEntry) => traceEntry.moduleId === entry.moduleId,
          );
          const topLevelIndex = execution?.trace.findIndex(
            (traceEntry) => traceEntry.moduleId === topLevelModuleId,
          ) ?? -1;

          return (
          <li
            key={entry.moduleId}
            ref={entry.moduleId === tutorialStep?.focusModuleId ? tutorialTraceRef : null}
            className={
              effectiveStepperMode === 'nested' && steppedAnalysisEntry?.moduleId === entry.moduleId
                ? entry.moduleId === tutorialStep?.focusModuleId
                  ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped trace-card-tutorial`
                  : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped`
                : topLevelModuleId === steppedTrace?.moduleId
                ? entry.moduleId === tutorialStep?.focusModuleId
                  ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped trace-card-tutorial`
                  : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped`
                : entry.moduleId === tutorialStep?.focusModuleId
                ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-tutorial`
                : topLevelModuleId === moduleInstance?.id
                ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-active`
                : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''}`
            }
            style={{ marginLeft: `${Math.max(0, (entry.depth ?? 0) * 14)}px` }}
            onMouseEnter={() => onTraceHover(topLevelModuleId)}
            onMouseLeave={() => onTraceHover(null)}
            onClick={() => {
              if (effectiveStepperMode === 'nested') {
                setRequestedNestedStepIndex(analysisIndex);
              } else {
                onStepChange(topLevelIndex >= 0 ? topLevelIndex : null);
              }

              onRequestFocusModule?.(topLevelModuleId);
            }}
          >
            <div className="trace-head">
              <div className="trace-head-labels">
                <strong>{getDisplayTraceModuleId(entry)}</strong>
                <div className="trace-chip-row">
                  {isNested ? (
                    <span className="trace-nested-chip">Inside {topLevelModuleId}</span>
                  ) : null}
                  {roundPath ? (
                    <span className="trace-round-chip">{formatIteratorRoundLabel(roundPath)}</span>
                  ) : null}
                </div>
              </div>
              <div className="trace-head-actions">
                <span>
                  #{traceIndex >= 0 ? traceIndex + 1 : analysisIndex + 1} {entry.defId}
                </span>
                <button
                  type="button"
                  className="trace-focus-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRequestFocusModule?.(topLevelModuleId);
                  }}
                >
                  Focus In Workspace
                </button>
              </div>
            </div>
            {nestedPath ? <p className="trace-nested-path">{nestedPath}</p> : null}
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
          );
        })}
      </ol>
      ) : null}

      {inspectorTab === 'compare' ? (
        <section className="analysis-section">
          <ComparisonPanel
            embedded
            projectName={projectName}
            baseline={comparisonBaseline}
            baselineOutput={baselineOutput}
            variantOutput={variantOutput}
            baselineError={baselineExecutionError}
            variantError={executionError}
            comparison={executionComparison}
            project={project}
            registry={registry}
            onCaptureBaseline={onCaptureBaseline}
            onClearBaseline={onClearBaseline}
            isTickedMode={isTickedMode}
            verificationSourceOptions={verificationSourceOptions}
            verificationCases={verificationCases}
            verificationResults={verificationResults}
            onAddVerificationCase={onAddVerificationCase}
            onImportVerificationCases={onImportVerificationCases}
            onRemoveVerificationCase={onRemoveVerificationCase}
            onClearVerificationCases={onClearVerificationCases}
          />
        </section>
      ) : null}
    </aside>
  );
}
