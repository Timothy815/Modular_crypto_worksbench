import { useEffect, useMemo, useRef, useState } from 'react';

import { isClockedIteratorDefinition } from '../../engine/composites';
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
import { buildLiveStateSummary } from '../live-state-display';
import {
  getSinkRepresentationOptions,
  type SinkRepresentation,
} from '../sink-representations';
import { buildStageSignalInspection } from '../stage-signal-inspection';
import {
  matchesModuleDomainTab,
  matchesModuleSearch,
} from '../module-library';
import { getModuleRoleDetail } from '../module-role-language';
import {
  getModuleInstanceIdValidationError,
  normalizeModuleInstanceIdCandidate,
} from '../module-instance-id';
import {
  buildParameterComparisonSummary,
} from '../parameter-comparison';
import type { TutorialStep } from '../tutorials';
import { InspectorAnalyzeView } from './inspector-analyze-view';
import { InspectorAnalyzeDetails } from './inspector-analyze-details';
import { InspectorCompareView, InspectorOutputSummary } from './inspector-analysis-output';
import { InspectorConfigureView } from './inspector-configure-view';
import type {
  ComparisonBaselineDocument,
  WorkbenchLayoutDirection,
  WorkbenchPortLayoutPreset,
  WorkbenchPortSide,
  WorkbenchPosition,
} from '../workbench-document';
import type { ExecutionComparison } from '../execution-compare';
import {
  getNodeOrientation,
  getPortSideForModulePort,
} from '../node-orientation';
import { getOrderedPorts } from '../port-ordering';
import { getIteratorRoundSummary } from '../iterator-workflow';
import type {
  VerificationCase,
  VerificationCaseResult,
  VerificationSourceOption,
} from '../verification-workflow';
import {
  getIssueTargetModuleId,
  getIteratorRoundOptions,
  getTraceEntries,
  getTransformationView,
  getSBoxAnalysisFromParams,
  getPermutationAnalysisFromParams,
  getToyPointMapAnalysis,
  getKeyedSBoxAnalysis,
  getAesConsequenceAnalysis,
  getLFSRAnalysis,
  getPlugboardAnalysis,
  getReflectorAnalysis,
  getModulusAnalysis,
  groupIssuesByTarget,
} from '../inspector-analysis';
import type { SBoxAnalysis, PermutationAnalysis, ToyPointMapAnalysis, KeyedSBoxAnalysis, AesConsequenceAnalysis, LFSRAnalysis, PlugboardAnalysis, ReflectorAnalysis, ModulusAnalysis } from '../inspector-analysis';
import { InspectorTabButton, PORT_SIDE_ORDER } from './inspector-controls';

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
  modulePosition?: WorkbenchPosition | null;
  layoutDirection?: WorkbenchLayoutDirection;
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
  onRotateModuleClockwise?: (moduleId: string) => void;
  onSetModulePortLayoutPreset?: (
    moduleId: string,
    preset: WorkbenchPortLayoutPreset | null,
  ) => void;
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
  onDuplicateModule?: (moduleId: string) => void;
  onReplaceModule?: (moduleId: string, nextDefId: string) => void;
  onRenameModuleInstance?: (moduleId: string, nextModuleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  canRenameModuleIds?: boolean;
  onUnzipComposite?: (moduleId: string) => void;
  onOpenCompositeInstanceDrilldown?: (moduleId: string) => void;
  onOpenCompositeDefinition?: (definitionId: string) => void;
  isReadOnlyMode?: boolean;
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

async function writeTextToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is unavailable.');
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
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
  modulePosition = null,
  layoutDirection = 'horizontal',
  selectedModuleIds,
  parameterClipboard,
  getParamDraft,
  onCopyParams,
  onApplyCopiedParams,
  onParamDraftChange,
  onParamChange,
  onSetModuleBypass,
  onRotateModuleClockwise,
  onSetModulePortLayoutPreset,
  onMoveModulePortOrder,
  onSetModulePortSide,
  onDuplicateModule,
  onReplaceModule,
  onRenameModuleInstance,
  onDeleteModule,
  canRenameModuleIds = true,
  onUnzipComposite,
  onOpenCompositeInstanceDrilldown,
  onOpenCompositeDefinition,
  isReadOnlyMode = false,
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
  const [expandedRawEditors, setExpandedRawEditors] = useState<Record<string, boolean>>({});
  const [sinkRepresentationsByModuleId, setSinkRepresentationsByModuleId] = useState<
    Record<string, SinkRepresentation>
  >({});
  const [activeOutputSummaryModuleId, setActiveOutputSummaryModuleId] = useState<string | null>(null);
  const [isOutputSummaryCollapsed, setIsOutputSummaryCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('mcw:inspector-output-collapsed') === 'true';
  });
  const [showCollectedOutput, setShowCollectedOutput] = useState(true);
  const [renameState, setRenameState] = useState<{
    moduleId: string | null;
    draft: string;
    error: string | null;
  }>({
    moduleId: null,
    draft: '',
    error: null,
  });
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');
  const [selectedReplacementDefId, setSelectedReplacementDefId] = useState<string>('');
  const [collapsedAnalyzeSections, setCollapsedAnalyzeSections] = useState({
    tick: false,
    selectedIssues: false,
    graphIssues: false,
    traceList: true,
    pinned: false,
    tutorial: true,
    transformation: false,
    toyPointMapProperties: false,
    keyedSBoxProperties: false,
    aesConsequenceProperties: false,
    sboxProperties: false,
    permutationProperties: false,
    lfsrProperties: false,
    plugboardProperties: false,
    reflectorProperties: false,
    modulusProperties: false,
  });
  const [permutationBlockSize, setPermutationBlockSize] = useState<number | null>(null);
  const [copiedStageSignalKey, setCopiedStageSignalKey] = useState<string | null>(null);
  const copiedStageSignalTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedStageSignalTimeoutRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(copiedStageSignalTimeoutRef.current);
      }
    };
  }, []);

  const markStageSignalCopied = (copyKey: string) => {
    setCopiedStageSignalKey(copyKey);
    if (copiedStageSignalTimeoutRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(copiedStageSignalTimeoutRef.current);
    }
    if (typeof window !== 'undefined') {
      copiedStageSignalTimeoutRef.current = window.setTimeout(() => {
        setCopiedStageSignalKey((current) => (current === copyKey ? null : current));
      }, 1600);
    }
  };

  const handleCopyStageSignal = async (copyKey: string, text: string | null) => {
    if (!text) {
      return;
    }
    try {
      await writeTextToClipboard(text);
      markStageSignalCopied(copyKey);
    } catch {
      setCopiedStageSignalKey(null);
    }
  };

  const toggleAnalyzeSection = (key: keyof typeof collapsedAnalyzeSections) => {
    setCollapsedAnalyzeSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };
  const liveStateSummary = useMemo(() => {
    if (
      !moduleDef ||
      !moduleInstance ||
      !isTickedMode ||
      tickCount <= 0 ||
      !tickedParamsByModule?.[moduleInstance.id]
    ) {
      return null;
    }

    const tickParams = tickedParamsByModule[moduleInstance.id]?.[currentTick];
    if (!tickParams) {
      return null;
    }

    return buildLiveStateSummary(
      moduleDef,
      moduleInstance,
      tickParams,
      currentTick > 0 ? tickedParamsByModule[moduleInstance.id]?.[currentTick - 1] : undefined,
    );
  }, [currentTick, isTickedMode, moduleDef, moduleInstance, tickCount, tickedParamsByModule]);
  const clockedIteratorLiveState = useMemo(() => {
    if (
      !moduleDef ||
      !isClockedIteratorDefinition(moduleDef) ||
      !moduleInstance ||
      !isTickedMode ||
      !tickedParamsByModule?.[moduleInstance.id]
    ) {
      return null;
    }

    const tickParams = tickedParamsByModule[moduleInstance.id]?.[currentTick];
    if (!tickParams) {
      return null;
    }

    const currentStep = typeof tickParams.__clockedIteratorCurrentStep === 'number'
      ? tickParams.__clockedIteratorCurrentStep
      : 0;
    const halted = tickParams.__clockedIteratorHalted === true;
    const accumulated = tickParams.__clockedIteratorAccumulated as
      | { type: 'bits'; value: number[] }
      | { type: 'symbol'; value: string }
      | undefined;
    const fallbackOutput = execution?.outputsByModuleId?.[moduleInstance.id]?.out as
      | { type: 'bits'; value: number[] }
      | { type: 'symbol'; value: string }
      | undefined;
    const visibleAccumulated = accumulated ?? fallbackOutput;

    const accumulatedText = !visibleAccumulated
      ? '—'
      : visibleAccumulated.type === 'bits'
        ? visibleAccumulated.value.join('')
        : visibleAccumulated.value;

    return {
      currentStep,
      halted,
      accumulatedText,
    };
  }, [currentTick, execution, isTickedMode, moduleDef, moduleInstance, tickedParamsByModule]);
  const replacementCandidates = useMemo(() => {
    if (!moduleDef) {
      return [];
    }

    return Object.values(registry)
      .filter(
        (definition) =>
          definition.id !== moduleDef.id &&
          (matchesModuleDomainTab(definition, 'all') || matchesModuleDomainTab(definition, 'composites')),
      )
      .filter((definition) => matchesModuleSearch(definition, replaceSearchQuery))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [moduleDef, registry, replaceSearchQuery]);
  const selectedReplacementDef =
    selectedReplacementDefId && replacementCandidates.some((candidate) => candidate.id === selectedReplacementDefId)
      ? registry[selectedReplacementDefId]
      : replacementCandidates[0] ?? null;
  const replacementConnectionSummary = useMemo(() => {
    if (!moduleDef || !moduleInstance || !selectedReplacementDef) {
      return null;
    }

    const currentInputPorts = new Map(
      moduleDef.inputs.map((port) => [port.name, `${port.type}:${port.kind ?? 'scalar'}`]),
    );
    const currentOutputPorts = new Map(
      moduleDef.outputs.map((port) => [port.name, `${port.type}:${port.kind ?? 'scalar'}`]),
    );
    const nextInputPorts = new Set(
      selectedReplacementDef.inputs.map((port) => `${port.name}:${port.type}:${port.kind ?? 'scalar'}`),
    );
    const nextOutputPorts = new Set(
      selectedReplacementDef.outputs.map((port) => `${port.name}:${port.type}:${port.kind ?? 'scalar'}`),
    );

    let retained = 0;
    let dropped = 0;
    for (const connection of project.connections) {
      if (connection.from.moduleId === moduleInstance.id) {
        const currentSignature = currentOutputPorts.get(connection.from.port);
        if (currentSignature && nextOutputPorts.has(`${connection.from.port}:${currentSignature}`)) {
          retained += 1;
        } else {
          dropped += 1;
        }
      } else if (connection.to.moduleId === moduleInstance.id) {
        const currentSignature = currentInputPorts.get(connection.to.port);
        if (currentSignature && nextInputPorts.has(`${connection.to.port}:${currentSignature}`)) {
          retained += 1;
        } else {
          dropped += 1;
        }
      }
    }

    return { retained, dropped };
  }, [moduleDef, moduleInstance, project.connections, selectedReplacementDef]);
  useEffect(() => {
    setReplaceSearchQuery('');
    setSelectedReplacementDefId('');
  }, [moduleDef?.id, moduleInstance?.id]);
  useEffect(() => {
    if (!selectedReplacementDefId && replacementCandidates[0]) {
      setSelectedReplacementDefId(replacementCandidates[0].id);
      return;
    }

    if (
      selectedReplacementDefId &&
      !replacementCandidates.some((candidate) => candidate.id === selectedReplacementDefId)
    ) {
      setSelectedReplacementDefId(replacementCandidates[0]?.id ?? '');
    }
  }, [replacementCandidates, selectedReplacementDefId]);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      'mcw:inspector-output-collapsed',
      isOutputSummaryCollapsed ? 'true' : 'false',
    );
  }, [isOutputSummaryCollapsed]);
  const analysisTrace = useMemo(
    () => execution?.analysisTrace ?? execution?.trace ?? [],
    [execution],
  );
  const tutorialTraceRef = useRef<HTMLLIElement | null>(null);
  const outputTrace = useMemo(() => {
    if (!execution) return undefined;
    const sinkModules = project.modules.filter((module) => isOutputSinkDefId(module.defId));
    for (const sinkModule of sinkModules) {
      const found = execution.trace.find((entry) => entry.moduleId === sinkModule.id);
      const signal = execution.outputsByModuleId[sinkModule.id]?.out ?? found?.inputs.in;
      if (found && signal) {
        return found;
      }
    }
    const fallbackOutputModuleId = sinkModules[0]?.id;
    if (fallbackOutputModuleId) {
      const found = execution.trace.find((entry) => entry.moduleId === fallbackOutputModuleId);
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

    return (
      outputSummaries.find(
        (summary) =>
          summary.signal !== null &&
          summary.effectiveRepresentationOption !== null &&
          summary.effectiveRepresentationOption.available,
      ) ??
      outputSummaries[0] ??
      null
    );
  }, [activeOutputSummaryModuleId, outputSummaries]);
  const hasCollectedOutput = isTickedMode && collectedOutput !== null;
  const selectedTrace =
    execution?.trace.find((entry) => entry.moduleId === moduleInstance?.id) ?? null;
  const stageSignalInspection = useMemo(
    () =>
      buildStageSignalInspection({
        execution,
        executionError,
        project,
        registry,
        moduleInstance,
        moduleDef,
        roleDetail: moduleDef ? getModuleRoleDetail(moduleDef) : null,
      }),
    [execution, executionError, moduleDef, moduleInstance, project, registry],
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
  const iteratorRoundSummary =
    moduleDef &&
    moduleInstance &&
    'kind' in moduleDef &&
    moduleDef.kind === 'iterator'
      ? getIteratorRoundSummary(moduleDef, moduleInstance.params)
      : null;
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
  const staticSBoxAnalysis: SBoxAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'SBox') {
      return null;
    }
    return getSBoxAnalysisFromParams(moduleInstance.params);
  }, [inspectorTab, moduleInstance]);
  const isPermutationModule =
    moduleInstance?.defId === 'Permutation' || moduleInstance?.defId === 'PermutationBits';
  const staticPermutationAnalysis: PermutationAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || !isPermutationModule || !moduleInstance) {
      return null;
    }
    return getPermutationAnalysisFromParams(
      moduleInstance.params,
      permutationBlockSize ?? undefined,
    );
  }, [inspectorTab, isPermutationModule, moduleInstance, permutationBlockSize]);
  const staticLFSRAnalysis: LFSRAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'LFSR' || !moduleInstance) return null;
    return getLFSRAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);
  const staticPlugboardAnalysis: PlugboardAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'Plugboard' || !moduleInstance) return null;
    return getPlugboardAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);
  const staticReflectorAnalysis: ReflectorAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'Reflector' || !moduleInstance) return null;
    return getReflectorAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);
  const staticModulusAnalysis: ModulusAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || !moduleInstance) return null;
    if (moduleInstance.defId !== 'ModExp' && moduleInstance.defId !== 'ModInverse') return null;
    return getModulusAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);
  const staticToyPointMapAnalysis: ToyPointMapAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'ToyPointMap' || !moduleInstance) {
      return null;
    }
    return getToyPointMapAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);
  const staticKeyedSBoxAnalysis: KeyedSBoxAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'KeyedSBox4' || !moduleInstance || !selectedTrace) {
      return null;
    }
    const keySignal = selectedTrace.inputs.key;
    if (selectedTrace.moduleId !== moduleInstance.id || selectedTrace.defId !== 'KeyedSBox4' || keySignal?.type !== 'bits') {
      return null;
    }
    return getKeyedSBoxAnalysis(keySignal.value);
  }, [inspectorTab, moduleInstance, selectedTrace]);
  const staticAesConsequenceAnalysis: AesConsequenceAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'AesConsequenceSummary' || !moduleInstance || !selectedTrace) {
      return null;
    }
    if (selectedTrace.moduleId !== moduleInstance.id || selectedTrace.defId !== 'AesConsequenceSummary') {
      return null;
    }
    const canonicalStage0 = selectedTrace.inputs.canonicalStage0;
    const perturbedStage0 = selectedTrace.inputs.perturbedStage0;
    const canonicalStage1 = selectedTrace.inputs.canonicalStage1;
    const perturbedStage1 = selectedTrace.inputs.perturbedStage1;
    if (
      canonicalStage0?.type !== 'bits' ||
      perturbedStage0?.type !== 'bits' ||
      canonicalStage1?.type !== 'bits' ||
      perturbedStage1?.type !== 'bits'
    ) {
      return null;
    }
    return getAesConsequenceAnalysis({
      stage0Label: moduleInstance.params.stage0Label,
      stage1Label: moduleInstance.params.stage1Label,
      ruleChanged: moduleInstance.params.ruleChanged,
      claimBoundary: moduleInstance.params.claimBoundary,
      canonicalStage0,
      perturbedStage0,
      canonicalStage1,
      perturbedStage1,
    });
  }, [inspectorTab, moduleInstance, selectedTrace]);
  const canBypassSelectedModule = moduleDef ? isBypassEligibleDefinition(moduleDef) : false;
  const orderedInputPorts = useMemo(
    () =>
      moduleDef
        ? getOrderedPorts(moduleDef.inputs, modulePosition?.inputOrder)
        : [],
    [moduleDef, modulePosition],
  );
  const orderedOutputPorts = useMemo(
    () =>
      moduleDef
        ? getOrderedPorts(moduleDef.outputs, modulePosition?.outputOrder)
        : [],
    [moduleDef, modulePosition],
  );
  const activePortLayoutPreset = modulePosition?.portLayoutPreset ?? null;
  const activeNodeOrientation = getNodeOrientation(modulePosition?.orientation, layoutDirection);
  const [draggingPortSide, setDraggingPortSide] = useState<{
    direction: 'input' | 'output';
    portName: string;
  } | null>(null);
  const inputPortsBySide = useMemo(
    () =>
      Object.fromEntries(
        PORT_SIDE_ORDER.map((side) => [
          side,
          orderedInputPorts.filter(
            (port) =>
              getPortSideForModulePort(modulePosition ?? undefined, activeNodeOrientation, 'in', port.name) ===
              side,
          ),
        ]),
      ) as Record<WorkbenchPortSide, typeof orderedInputPorts>,
    [activeNodeOrientation, modulePosition, orderedInputPorts],
  );
  const outputPortsBySide = useMemo(
    () =>
      Object.fromEntries(
        PORT_SIDE_ORDER.map((side) => [
          side,
          orderedOutputPorts.filter(
            (port) =>
              getPortSideForModulePort(modulePosition ?? undefined, activeNodeOrientation, 'out', port.name) ===
              side,
          ),
        ]),
      ) as Record<WorkbenchPortSide, typeof orderedOutputPorts>,
    [activeNodeOrientation, modulePosition, orderedOutputPorts],
  );
  const explicitInputPortSides = modulePosition?.inputPortSides ?? {};
  const explicitOutputPortSides = modulePosition?.outputPortSides ?? {};
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
  const isRawEditorExpanded = (moduleId: string, fieldKey: string) =>
    expandedRawEditors[`${moduleId}:${fieldKey}`] ?? false;

  const toggleRawEditor = (moduleId: string, fieldKey: string) => {
    const rawEditorKey = `${moduleId}:${fieldKey}`;
    setExpandedRawEditors((current) => ({
      ...current,
      [rawEditorKey]: !(current[rawEditorKey] ?? false),
    }));
  };

  const handleRenameDraftChange = (draft: string) => {
    setRenameState({
      moduleId: moduleInstance?.id ?? null,
      draft,
      error: null,
    });
  };

  const handleRenameSubmit = () => {
    if (!moduleInstance || !canRenameModuleIds || !onRenameModuleInstance) {
      return;
    }

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
  };

  return (
    <aside className="panel inspector-panel">
      <div className="panel-head">
        <p className="panel-label">Inspector</p>
        <h2>Inspector</h2>
      </div>

      <div className="inspector-tab-strip" role="tablist" aria-label="Inspector View">
        <InspectorTabButton
          icon="configure"
          label="Configure"
          active={inspectorTab === 'configure'}
          onClick={() => setInspectorTab('configure')}
        />
        <InspectorTabButton
          icon="analyze"
          label="Analyze"
          active={inspectorTab === 'analyze'}
          onClick={() => setInspectorTab('analyze')}
        />
        <InspectorTabButton
          icon="compare"
          label="Compare"
          active={inspectorTab === 'compare'}
          onClick={() => setInspectorTab('compare')}
        />
      </div>

      <InspectorOutputSummary
        isOutputSummaryCollapsed={isOutputSummaryCollapsed}
        setIsOutputSummaryCollapsed={setIsOutputSummaryCollapsed}
        hasCollectedOutput={hasCollectedOutput}
        showCollectedOutput={showCollectedOutput}
        setShowCollectedOutput={setShowCollectedOutput}
        collectedOutput={collectedOutput}
        validationIssuesCount={validationIssues.length}
        executionTraceCount={execution?.trace.length ?? 0}
        executionPresent={Boolean(execution)}
        isTickedMode={isTickedMode}
        outputSummaries={outputSummaries}
        activeOutputSummary={activeOutputSummary}
        setActiveOutputSummaryModuleId={setActiveOutputSummaryModuleId}
        setSinkRepresentationsByModuleId={setSinkRepresentationsByModuleId}
        tickHistoryByModule={tickHistoryByModule}
      />

      {inspectorTab === 'analyze' ? (
        <InspectorAnalyzeView
          execution={execution}
          moduleInstance={moduleInstance}
          isTickedMode={isTickedMode}
          currentTick={currentTick}
          tickCount={tickCount}
          tickedParamsByModule={tickedParamsByModule}
          tickHistoryByModule={tickHistoryByModule}
          collapsedAnalyzeSections={collapsedAnalyzeSections}
          toggleAnalyzeSection={toggleAnalyzeSection}
          canUseNestedStepper={canUseNestedStepper}
          effectiveStepperMode={effectiveStepperMode}
          effectiveNestedStepIndex={effectiveNestedStepIndex}
          traceEntries={traceEntries}
          steppedAnalysisEntry={steppedAnalysisEntry}
          steppedTrace={steppedTrace}
          stepIndex={stepIndex}
          setRequestedStepperMode={setRequestedStepperMode}
          setRequestedNestedStepIndex={setRequestedNestedStepIndex}
          onStepChange={onStepChange}
          probedModuleIds={probedModuleIds}
          onClearProbes={onClearProbes}
          onToggleProbe={onToggleProbe}
          tutorialStep={tutorialStep}
          tutorialTraceIndex={tutorialTraceIndex}
        />
      ) : null}

      <InspectorAnalyzeDetails
        inspectorTab={inspectorTab}
        transformationView={transformationView}
        staticSBoxAnalysis={staticSBoxAnalysis}
        staticPermutationAnalysis={staticPermutationAnalysis}
        permutationBlockSize={permutationBlockSize}
        setPermutationBlockSize={setPermutationBlockSize}
        staticLFSRAnalysis={staticLFSRAnalysis}
        staticPlugboardAnalysis={staticPlugboardAnalysis}
        staticReflectorAnalysis={staticReflectorAnalysis}
        staticModulusAnalysis={staticModulusAnalysis}
        staticToyPointMapAnalysis={staticToyPointMapAnalysis}
        staticKeyedSBoxAnalysis={staticKeyedSBoxAnalysis}
        staticAesConsequenceAnalysis={staticAesConsequenceAnalysis}
        activeLookupChunk={activeLookupChunk}
        effectiveLookupChunkIndex={effectiveLookupChunkIndex}
        setRequestedLookupChunkIndex={setRequestedLookupChunkIndex}
        collapsedAnalyzeSections={collapsedAnalyzeSections}
        toggleAnalyzeSection={toggleAnalyzeSection}
        groupedSelectedIssues={groupedSelectedIssues}
        groupedGlobalIssues={groupedGlobalIssues}
        executionError={executionError}
        validationIssues={validationIssues}
        selectedTrace={selectedTrace}
        selectedTraceOrder={selectedTraceOrder}
        analysisTrace={analysisTrace}
        roundFocusOptions={roundFocusOptions}
        effectiveFocusedRoundPath={effectiveFocusedRoundPath}
        setFocusedRoundPath={setFocusedRoundPath}
        effectiveTraceMode={effectiveTraceMode}
        setTraceMode={setTraceMode}
        traceEntries={traceEntries}
        execution={execution}
        steppedAnalysisEntry={steppedAnalysisEntry}
        steppedTrace={steppedTrace}
        effectiveStepperMode={effectiveStepperMode}
        moduleInstance={moduleInstance}
        tutorialStep={tutorialStep}
        tutorialTraceRef={tutorialTraceRef}
        onTraceHover={onTraceHover}
        setRequestedNestedStepIndex={setRequestedNestedStepIndex}
        onStepChange={onStepChange}
        onRequestFocusModule={onRequestFocusModule}
        onSelectIssueTarget={onSelectIssueTarget}
      />

      {moduleDef && moduleInstance && inspectorTab === 'configure' ? (
        <InspectorConfigureView
          stageSignalInspection={stageSignalInspection}
          copiedStageSignalKey={copiedStageSignalKey}
          onCopyStageSignal={handleCopyStageSignal}
          registry={registry}
          moduleDef={moduleDef}
          moduleInstance={moduleInstance}
          liveStateSummary={liveStateSummary}
          iteratorRoundSummary={iteratorRoundSummary}
          clockedIteratorLiveState={clockedIteratorLiveState}
          baselineModuleInstance={baselineModuleInstance}
          linkedRotorSourceInstance={linkedRotorSourceInstance}
          selectedTrace={selectedTrace}
          isReadOnlyMode={isReadOnlyMode}
          renameDraft={effectiveRenameDraft}
          renameInlineError={effectiveRenameError}
          renameValidationError={renameValidationError}
          onRenameDraftChange={handleRenameDraftChange}
          onRenameSubmit={handleRenameSubmit}
          canRenameModuleIds={canRenameModuleIds}
          canBypassSelectedModule={canBypassSelectedModule}
          bypassIneligibilityReason={bypassIneligibilityReason}
          parameterClipboard={parameterClipboard}
          onCopyParams={onCopyParams}
          onApplyCopiedParams={onApplyCopiedParams}
          compatibleParamApplyTargetIds={compatibleParamApplyTargetIds}
          selectedIncompatibleParamTargetCount={selectedIncompatibleParamTargetCount}
          onSetModuleBypass={onSetModuleBypass}
          onRotateModuleClockwise={onRotateModuleClockwise}
          onDuplicateModule={onDuplicateModule}
          onReplaceModule={onReplaceModule}
          selectedReplacementDef={selectedReplacementDef}
          replaceSearchQuery={replaceSearchQuery}
          onReplaceSearchQueryChange={setReplaceSearchQuery}
          replacementCandidates={replacementCandidates}
          onSelectedReplacementDefIdChange={setSelectedReplacementDefId}
          replacementConnectionSummary={replacementConnectionSummary}
          onOpenCompositeInstanceDrilldown={onOpenCompositeInstanceDrilldown}
          onUnzipComposite={onUnzipComposite}
          onDeleteModule={onDeleteModule}
          onOpenCompositeDefinition={onOpenCompositeDefinition}
          parameterComparisonSummary={parameterComparisonSummary}
          project={project}
          getParamDraft={getParamDraft}
          onParamDraftChange={onParamDraftChange}
          onParamChange={onParamChange}
          isRawEditorExpanded={isRawEditorExpanded}
          onToggleRawEditor={toggleRawEditor}
          onRequestFocusModule={onRequestFocusModule}
          activePortLayoutPreset={activePortLayoutPreset}
          onSetModulePortLayoutPreset={onSetModulePortLayoutPreset}
          draggingPortSide={draggingPortSide}
          onSetDraggingPortSide={setDraggingPortSide}
          inputPortsBySide={inputPortsBySide}
          outputPortsBySide={outputPortsBySide}
          explicitInputPortSides={explicitInputPortSides}
          explicitOutputPortSides={explicitOutputPortSides}
          orderedInputPorts={orderedInputPorts}
          orderedOutputPorts={orderedOutputPorts}
          onMoveModulePortOrder={onMoveModulePortOrder}
          onSetModulePortSide={onSetModulePortSide}
        />
      ) : (
        inspectorTab === 'configure' ? (
          <p className="empty-state">Select a module to inspect and edit its parameters.</p>
        ) : null
      )}

      {inspectorTab === 'compare' ? (
        <InspectorCompareView
          projectName={projectName}
          comparisonBaseline={comparisonBaseline}
          baselineOutput={baselineOutput}
          variantOutput={variantOutput}
          baselineExecutionError={baselineExecutionError}
          executionError={executionError}
          executionComparison={executionComparison}
          project={project}
          registry={registry}
          isTickedMode={isTickedMode}
          verificationSourceOptions={verificationSourceOptions}
          verificationCases={verificationCases}
          verificationResults={verificationResults}
          onCaptureBaseline={onCaptureBaseline}
          onClearBaseline={onClearBaseline}
          onAddVerificationCase={onAddVerificationCase}
          onImportVerificationCases={onImportVerificationCases}
          onRemoveVerificationCase={onRemoveVerificationCase}
          onClearVerificationCases={onClearVerificationCases}
        />
      ) : null}
    </aside>
  );
}
