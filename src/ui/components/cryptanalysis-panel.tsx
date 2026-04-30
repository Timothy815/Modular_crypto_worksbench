import { Fragment, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';

import {
  analyzeBitDifference,
  analyzeBitstreamRandomness,
  buildKeyScheduleAdjacentDifferences,
  buildKeyScheduleSweepSummary,
  analyzeRoundDiffusion,
  buildRoundContributionSummary,
  analyzeSymbolSignal,
  buildAvalancheSweepSummary,
  buildInfluenceHeatmapColumnEntries,
  buildShiftConfidenceEntries,
  bitsToAlphabetSymbol,
  bitsToAsciiText,
  buildCandidatePeriodChartEntries,
  analyzeVigenereColumns,
  bitsToHex,
  buildRoundDiffusionChartEntries,
  buildFrequencyGraphEntries,
  flipBitAtIndex,
  hexToBits,
  type KeyScheduleStageSnapshot,
  parseBitString,
  reconstructVigenereCandidate,
  symbolToBits,
} from '../cryptanalysis';
import type { CryptanalysisMode } from '../cryptanalysis-mode';
import { runDemoProject } from '../demo-projects';
import type { GuidedTutorial, TutorialStep } from '../tutorials';
import { validateProject } from '../../engine/validation';
import type { ExecutionResult, ModuleRegistry, Project, TickedExecutionResult } from '../../engine/types';
import { cloneProject } from '../project-clone';
import type { WorkspaceMode } from '../workspace-mode';
import { collectTickedOutput } from '../execution-compare';
import { isOutputSinkDefId } from '../../engine/output-sinks';
import type { SavedAnalysisCase } from '../workbench-document';
import {
  computeOutputStatistics,
  generateNarrativeSummary,
  type OutputStatistics,
} from '../../engine/analysis/output-statistics';

const AVALANCHE_LAB_PROJECT_ID = 'avalanche-lab';
const AVALANCHE_LAB_TUTORIAL_ID = 'cryptanalysis-avalanche-lab';
const KEY_SCHEDULE_LAB_PROJECT_ID = 'key-schedule-lab';
const KEY_SCHEDULE_LAB_TUTORIAL_ID = 'cryptanalysis-key-schedule-lab';
const RANDOMNESS_LAB_PROJECT_ID = 'randomness-lab';
const RANDOMNESS_LAB_TUTORIAL_ID = 'cryptanalysis-randomness-lab';

type FlippableProjectSource =
  | {
      moduleId: string;
      moduleName: string;
      kind: 'bit-source';
      bits: number[];
    }
  | {
      moduleId: string;
      moduleName: string;
      kind: 'hex-source';
      bits: number[];
    }
  | {
      moduleId: string;
      moduleName: string;
      kind: 'ascii-source';
      bits: number[];
    }
  | {
      moduleId: string;
      moduleName: string;
      kind: 'text-symbol-bridge';
      bits: number[];
    }
  | {
      moduleId: string;
      moduleName: string;
      /** Bare TextInput (no SymbolToBits bridge) — swept A–Z */
      kind: 'symbol-source';
      bits: number[];
    };

interface CryptanalysisPanelProps {
  projectName: string;
  project: Project;
  registry: ModuleRegistry;
  execution: ExecutionResult | null;
  isTickedMode: boolean;
  tickedExecution: TickedExecutionResult | null;
  ciphertext: string;
  cryptanalysisMode: CryptanalysisMode;
  modernBaseline: string;
  modernFlipBit: number;
  modernSourceId: string | null;
  modernSinkId: string | null;
  randomnessSinkId: string | null;
  classicalSelectedPeriod: number;
  classicalSelectedColumnIndex: number;
  classicalSelectedShiftsByColumnKey: Record<string, number>;
  savedAnalysisCases: SavedAnalysisCase[];
  workspaceMode: WorkspaceMode;
  tutorial: GuidedTutorial | null;
  tutorialStep: TutorialStep | null;
  tutorialStepIndex: number;
  tutorialNotesVisible: boolean;
  onSetWorkspaceMode: (mode: WorkspaceMode) => void;
  onSetCryptanalysisMode: (mode: CryptanalysisMode) => void;
  onSetTutorialNotesVisible: (visible: boolean) => void;
  onCiphertextChange: (value: string) => void;
  onModernBaselineChange: (value: string) => void;
  onModernFlipBitChange: (value: number) => void;
  onModernSourceIdChange: (value: string | null) => void;
  onModernSinkIdChange: (value: string | null) => void;
  onRandomnessSinkIdChange: (value: string | null) => void;
  onClassicalSelectedPeriodChange: (value: number) => void;
  onClassicalSelectedColumnIndexChange: (value: number) => void;
  onClassicalSelectedShiftChange: (key: string, value: number) => void;
  onSaveAnalysisCase: (name: string) => void;
  onUpdateAnalysisCase: (caseId: string) => void;
  onRenameAnalysisCase: (caseId: string, name: string) => void;
  onDeleteAnalysisCase: (caseId: string) => void;
  onLoadAnalysisCase: (savedCase: SavedAnalysisCase) => void;
  onSetTutorialStep: (stepIndex: number) => void;
  onFocusTutorialModule: (moduleId: string) => void;
  onOpenTutorialPath: (projectId: string, tutorialId: string) => void;
}

export function CryptanalysisPanel({
  projectName,
  project,
  registry,
  execution,
  isTickedMode,
  tickedExecution,
  ciphertext,
  cryptanalysisMode,
  modernBaseline,
  modernFlipBit,
  modernSourceId,
  modernSinkId,
  randomnessSinkId,
  classicalSelectedPeriod,
  classicalSelectedColumnIndex,
  classicalSelectedShiftsByColumnKey,
  savedAnalysisCases,
  workspaceMode,
  tutorial,
  tutorialStep,
  tutorialStepIndex,
  tutorialNotesVisible,
  onSetWorkspaceMode,
  onSetCryptanalysisMode,
  onSetTutorialNotesVisible,
  onCiphertextChange,
  onModernBaselineChange,
  onModernFlipBitChange,
  onModernSourceIdChange,
  onModernSinkIdChange,
  onRandomnessSinkIdChange,
  onClassicalSelectedPeriodChange,
  onClassicalSelectedColumnIndexChange,
  onClassicalSelectedShiftChange,
  onSaveAnalysisCase,
  onUpdateAnalysisCase,
  onRenameAnalysisCase,
  onDeleteAnalysisCase,
  onLoadAnalysisCase,
  onSetTutorialStep,
  onFocusTutorialModule,
  onOpenTutorialPath,
}: CryptanalysisPanelProps) {
  const [caseDraftName, setCaseDraftName] = useState('');
  const [lastManualSweepSignature, setLastManualSweepSignature] = useState<string | null>(null);
  const [selectedKeySourceId, setSelectedKeySourceId] = useState<string | null>(null);
  const [selectedKeyStageIds, setSelectedKeyStageIds] = useState<string[]>([]);
  const [lastKeyScheduleRunSignature, setLastKeyScheduleRunSignature] = useState<string | null>(null);
  const [outputStatsSinkId, setOutputStatsSinkId] = useState<string | null>(null);
  const [outputStatsSourceId, setOutputStatsSourceId] = useState<string | null>(null);
  const [outputStatsSweepMode, setOutputStatsSweepMode] = useState<'value' | 'bitflip'>('bitflip');
  const [outputStatsResult, setOutputStatsResult] = useState<OutputStatistics | null>(null);
  const [outputStatsSymbolResult, setOutputStatsSymbolResult] = useState<{
    inputChars: string[];
    outputChars: (string | null)[];
    charFreq: Record<string, number>;
    isPermutation: boolean;
    selfMappings: string[];
  } | null>(null);
  const [outputStatsRunning, setOutputStatsRunning] = useState(false);
  const [outputStatsError, setOutputStatsError] = useState<string | null>(null);
  const [outputStatsKeyDep, setOutputStatsKeyDep] = useState<{
    confirmed: boolean | null;
    keyModuleFound: boolean;
    bitsChanged: number;
  } | null>(null);
  const outputStatsAbortRef = useRef(false);
  const variantExecTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [variantExecution, setVariantExecution] = useState<ExecutionResult | null>(null);
  // Cache the last valid output diff so strips never vanish when a single flip position
  // transiently fails validation (e.g. edge values in a Mark-II SPN).
  const lastValidOutputDiffRef = useRef<ReturnType<typeof analyzeBitDifference> | null>(null);
  const lastValidOutputHexRef = useRef<{ baseline: string; variant: string } | null>(null);
  const analysis = analyzeSymbolSignal(
    ciphertext.trim().length > 0 ? { type: 'symbol', value: ciphertext } : null,
  );
  const availablePeriods = useMemo(
    () => analysis?.candidatePeriods.map((entry) => entry.period) ?? [],
    [analysis],
  );
  const effectivePeriod = availablePeriods.includes(classicalSelectedPeriod)
    ? classicalSelectedPeriod
    : availablePeriods[0] ?? 1;
  const columnAnalysis = useMemo(
    () =>
      analysis
        ? analyzeVigenereColumns(analysis.normalizedText, effectivePeriod)
        : [],
    [analysis, effectivePeriod],
  );
  const candidateShifts = columnAnalysis.map(
    (column) =>
      classicalSelectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, column.columnIndex)] ??
      column.topShiftCandidates[0]?.shift ??
      0,
  );
  const candidate = useMemo(
    () =>
      analysis
        ? reconstructVigenereCandidate(analysis.normalizedText, candidateShifts)
        : { key: '', plaintext: '' },
    [analysis, candidateShifts],
  );
  const effectiveColumnIndex =
    columnAnalysis[classicalSelectedColumnIndex] ? classicalSelectedColumnIndex : 0;
  const activeColumn = columnAnalysis[effectiveColumnIndex] ?? null;
  const activeColumnShift =
    activeColumn
      ? classicalSelectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)] ??
        activeColumn.topShiftCandidates[0]?.shift ??
        0
      : 0;
  const activeGraphEntries = useMemo(
    () =>
      activeColumn
        ? buildFrequencyGraphEntries(activeColumn.text, activeColumnShift)
        : [],
    [activeColumn, activeColumnShift],
  );
  const activeShiftConfidence = useMemo(
    () => (activeColumn ? buildShiftConfidenceEntries(activeColumn.shiftCandidates) : []),
    [activeColumn],
  );
  const baselineBits = useMemo(() => parseBitString(modernBaseline), [modernBaseline]);
  const flippableSources = useMemo(() => findFlippableProjectSources(project), [project]);
  const effectiveModernSourceId = flippableSources.some(
    (source) => source.moduleId === modernSourceId,
  )
    ? modernSourceId
    : flippableSources[0]?.moduleId ?? '';
  const flippableSource =
    flippableSources.find((source) => source.moduleId === effectiveModernSourceId) ?? null;
  const projectSourceBits = useMemo(() => {
    if (!flippableSource) {
      return [];
    }

    if (flippableSource.kind === 'bit-source') {
      return [...flippableSource.bits];
    }

    return [...flippableSource.bits];
  }, [flippableSource]);
  const effectiveInputBits = flippableSource ? projectSourceBits : baselineBits;
  const effectiveModernFlipBit =
    effectiveInputBits.length > 0 ? Math.min(Math.max(0, modernFlipBit), effectiveInputBits.length - 1) : 0;
  // Defer the variant computation so slider/button clicks feel instant even when the render
  // tree is large. The slider thumb moves on the frame of the click; output updates follow.
  const deferredFlipBit = useDeferredValue(effectiveModernFlipBit);
  const variantInputBits = useMemo(
    () => flipBitAtIndex(effectiveInputBits, deferredFlipBit),
    [effectiveInputBits, deferredFlipBit],
  );
  const variantBridgeSymbol = useMemo(() => {
    if (flippableSource?.kind !== 'text-symbol-bridge') {
      return null;
    }

    return bitsToAlphabetSymbol(variantInputBits);
  }, [flippableSource, variantInputBits]);
  const inputDifference = useMemo(
    () => analyzeBitDifference(effectiveInputBits, variantInputBits),
    [effectiveInputBits, variantInputBits],
  );
  const inputHexSummary = useMemo(() => {
    if (effectiveInputBits.length === 0 || variantInputBits.length === 0) {
      return null;
    }

    if (effectiveInputBits.length % 4 !== 0 || variantInputBits.length % 4 !== 0) {
      return null;
    }

    return {
      baseline: bitsToHex(effectiveInputBits),
      variant: bitsToHex(variantInputBits),
    };
  }, [effectiveInputBits, variantInputBits]);
  const variantProject = useMemo(() => {
    if (!flippableSource) {
      return null;
    }

    return buildVariantProject(project, flippableSource, variantInputBits, variantBridgeSymbol);
  }, [flippableSource, project, variantBridgeSymbol, variantInputBits]);
  // Clear cached diffs when the source module changes so stale data from a different source
  // never shows under a newly selected source.
  const prevSourceIdRef = useRef<string | null>(null);
  if (flippableSource?.moduleId !== prevSourceIdRef.current) {
    prevSourceIdRef.current = flippableSource?.moduleId ?? null;
    lastValidOutputDiffRef.current = null;
    lastValidOutputHexRef.current = null;
  }

  useEffect(() => {
    if (variantExecTimeoutRef.current) clearTimeout(variantExecTimeoutRef.current);
    if (!variantProject) {
      setVariantExecution(null);
      return;
    }
    variantExecTimeoutRef.current = setTimeout(() => {
      const validation = validateProject(variantProject, registry);
      if (!validation.ok) { setVariantExecution(null); return; }
      try {
        setVariantExecution(runDemoProject(variantProject, registry));
      } catch {
        setVariantExecution(null);
      }
    }, 50);
    return () => { if (variantExecTimeoutRef.current) clearTimeout(variantExecTimeoutRef.current); };
  }, [variantProject, registry]);
  const modernSinkOptions = useMemo(
    () => getBitstreamSinkOptions(project, execution, null, false),
    [project, execution],
  );
  const outputStatsSymbolSinkOptions = useMemo(
    () => getSymbolSinkOptions(project, execution),
    [project, execution],
  );
  const effectiveModernSinkId = modernSinkOptions.some(
    (option) => option.moduleId === modernSinkId,
  )
    ? (modernSinkId ?? '')
    : modernSinkOptions[0]?.moduleId ?? '';
  const baselineOutputBits = useMemo(
    () => getBitSignalForSink(execution, effectiveModernSinkId),
    [execution, effectiveModernSinkId],
  );
  const variantOutputBits = useMemo(
    () => getBitSignalForSink(variantExecution, effectiveModernSinkId),
    [variantExecution, effectiveModernSinkId],
  );
  const outputDifference = useMemo(() => {
    if (!baselineOutputBits || !variantOutputBits) {
      return null;
    }

    return analyzeBitDifference(baselineOutputBits, variantOutputBits);
  }, [baselineOutputBits, variantOutputBits]);
  const outputHexSummary = useMemo(() => {
    if (!baselineOutputBits || !variantOutputBits) {
      return null;
    }

    if (baselineOutputBits.length === 0 || variantOutputBits.length === 0) {
      return null;
    }

    if (baselineOutputBits.length % 4 !== 0 || variantOutputBits.length % 4 !== 0) {
      return null;
    }

    return {
      baseline: bitsToHex(baselineOutputBits),
      variant: bitsToHex(variantOutputBits),
    };
  }, [baselineOutputBits, variantOutputBits]);
  // Keep last-valid values so the output strips never blank out on a transient failed position
  if (outputDifference !== null) lastValidOutputDiffRef.current = outputDifference;
  if (outputHexSummary !== null) lastValidOutputHexRef.current = outputHexSummary;
  const stableOutputDiff = outputDifference ?? lastValidOutputDiffRef.current;
  const stableOutputHex = outputHexSummary ?? lastValidOutputHexRef.current;
  const roundDiffusion = useMemo(
    () => analyzeRoundDiffusion(execution, variantExecution),
    [execution, variantExecution],
  );
  const roundDiffusionChart = useMemo(
    () => buildRoundDiffusionChartEntries(roundDiffusion),
    [roundDiffusion],
  );
  const roundContributionSummary = useMemo(
    () => buildRoundContributionSummary(roundDiffusion),
    [roundDiffusion],
  );
  const sweepSignature = useMemo(
    () =>
      JSON.stringify({
        project,
        sourceId: flippableSource?.moduleId ?? null,
        sinkId: effectiveModernSinkId,
        inputBits: effectiveInputBits,
      }),
    [project, flippableSource, effectiveModernSinkId, effectiveInputBits],
  );
  const requiresManualSweep = effectiveInputBits.length > 64;
  const hasFreshSweep = !requiresManualSweep || lastManualSweepSignature === sweepSignature;
  const sweepRows = useMemo(() => {
    if (!flippableSource || !baselineOutputBits || !effectiveModernSinkId) {
      return [];
    }

    if (requiresManualSweep && !hasFreshSweep) {
      return [];
    }

    return runAvalancheSweep(project, flippableSource, registry, baselineOutputBits, effectiveModernSinkId, effectiveInputBits.length);
  }, [
    baselineOutputBits,
    effectiveInputBits.length,
    effectiveModernSinkId,
    flippableSource,
    hasFreshSweep,
    project,
    registry,
    requiresManualSweep,
  ]);
  const influenceRows = useMemo(
    () => {
      if (!flippableSource || !baselineOutputBits || !effectiveModernSinkId) {
        return [];
      }
      // For large sources (same threshold as sweepRows) gate behind the manual sweep button
      // so we don't auto-run 64 project executions on every project/source change.
      if (requiresManualSweep && !hasFreshSweep) {
        return [];
      }

      return runAvalancheSweep(
        project,
        flippableSource,
        registry,
        baselineOutputBits,
        effectiveModernSinkId,
        Math.min(effectiveInputBits.length, 64),
      );
    },
    [
      baselineOutputBits,
      effectiveInputBits.length,
      effectiveModernSinkId,
      flippableSource,
      hasFreshSweep,
      project,
      registry,
      requiresManualSweep,
    ],
  );
  const influenceColumns = useMemo(
    () => buildInfluenceHeatmapColumnEntries(influenceRows.map((row) => row.changedFlags)),
    [influenceRows],
  );
  const sweepSummary = useMemo(
    () => buildAvalancheSweepSummary(sweepRows, effectiveInputBits.length),
    [sweepRows, effectiveInputBits.length],
  );
  const showInfluenceSweep =
    influenceRows.length > 0 && influenceColumns.length > 0;
  const keySourceOptions = useMemo(
    () => flippableSources.filter((source) => source.kind !== 'text-symbol-bridge'),
    [flippableSources],
  );
  // Determine whether the currently-selected output-stats source is symbol-domain
  const effectiveOutputStatsSourceId =
    outputStatsSourceId ?? flippableSources.find((s) => s.kind !== 'text-symbol-bridge')?.moduleId ?? null;
  const effectiveOutputStatsSweepSource =
    flippableSources.find((s) => s.moduleId === effectiveOutputStatsSourceId) ?? null;
  const outputStatsIsSymbolMode = effectiveOutputStatsSweepSource?.kind === 'symbol-source';
  const outputStatsActiveSinkOptions = outputStatsIsSymbolMode ? outputStatsSymbolSinkOptions : modernSinkOptions;

  const effectiveKeySourceId = keySourceOptions.some((source) => source.moduleId === selectedKeySourceId)
    ? selectedKeySourceId
    : keySourceOptions[0]?.moduleId ?? null;
  const selectedKeySource =
    keySourceOptions.find((source) => source.moduleId === effectiveKeySourceId) ?? null;
  const keyStageOptions = useMemo(
    () => getBitstreamSinkOptions(project, execution, null, false),
    [project, execution],
  );
  const effectiveSelectedKeyStageIds = useMemo(
    () =>
      selectedKeyStageIds.filter((moduleId) =>
        keyStageOptions.some((option) => option.moduleId === moduleId),
      ),
    [keyStageOptions, selectedKeyStageIds],
  );
  const orderedKeyStages = useMemo<KeyScheduleStageSnapshot[]>(
    () =>
      effectiveSelectedKeyStageIds.flatMap((moduleId) => {
        const option = keyStageOptions.find((candidate) => candidate.moduleId === moduleId);
        if (!option) {
          return [];
        }

        return [{
          moduleId: option.moduleId,
          label: option.label,
          bits: option.bits,
        }];
      }),
    [effectiveSelectedKeyStageIds, keyStageOptions],
  );
  const keyScheduleAdjacentDifferences = useMemo(
    () => buildKeyScheduleAdjacentDifferences(orderedKeyStages),
    [orderedKeyStages],
  );
  const keyScheduleRunSignature = useMemo(
    () =>
      JSON.stringify({
        project,
        sourceId: effectiveKeySourceId,
        orderedStageIds: effectiveSelectedKeyStageIds,
      }),
    [effectiveKeySourceId, effectiveSelectedKeyStageIds, project],
  );
  const keyScheduleHasFreshRun = lastKeyScheduleRunSignature === keyScheduleRunSignature;
  const keyScheduleSweepRows = useMemo(() => {
    if (!selectedKeySource || orderedKeyStages.length === 0 || !keyScheduleHasFreshRun) {
      return [];
    }

    return runKeyScheduleSweep(project, selectedKeySource, registry, orderedKeyStages);
  }, [keyScheduleHasFreshRun, orderedKeyStages, project, registry, selectedKeySource]);
  const keyScheduleSweepSummary = useMemo(
    () => buildKeyScheduleSweepSummary(keyScheduleSweepRows, orderedKeyStages),
    [keyScheduleSweepRows, orderedKeyStages],
  );
  const keyScheduleNotYetRun = lastKeyScheduleRunSignature === null;
  const keyScheduleStale =
    lastKeyScheduleRunSignature !== null && !keyScheduleHasFreshRun;
  const availableKeyStageOptions = useMemo(
    () =>
      keyStageOptions.filter(
        (option) => !effectiveSelectedKeyStageIds.includes(option.moduleId),
      ),
    [effectiveSelectedKeyStageIds, keyStageOptions],
  );
  const candidatePeriodChart = useMemo(
    () => (analysis ? buildCandidatePeriodChartEntries(analysis.candidatePeriods) : []),
    [analysis],
  );
  const hasBitDomainOutput = baselineOutputBits !== null;
  const showModernCompatibilityCallout = !flippableSource || !hasBitDomainOutput;
  const showTutorialCard = tutorial !== null && tutorialStep !== null;
  const randomnessSinkOptions = useMemo(
    () => getBitstreamSinkOptions(project, execution, tickedExecution, isTickedMode),
    [project, execution, tickedExecution, isTickedMode],
  );
  const effectiveRandomnessSinkId = randomnessSinkOptions.some(
    (option) => option.moduleId === randomnessSinkId,
  )
    ? (randomnessSinkId ?? '')
    : randomnessSinkOptions[0]?.moduleId ?? '';
  const activeRandomnessSink =
    randomnessSinkOptions.find((option) => option.moduleId === effectiveRandomnessSinkId) ?? null;
  const randomnessAnalysis = useMemo(
    () => (activeRandomnessSink ? analyzeBitstreamRandomness(activeRandomnessSink.bits) : null),
    [activeRandomnessSink],
  );
  const formattedRandomnessSample = useMemo(
    () => formatBitstreamSample(activeRandomnessSink?.bits ?? []),
    [activeRandomnessSink],
  );
  const sweepNotYetRun = requiresManualSweep && lastManualSweepSignature === null;
  const sweepStale = requiresManualSweep && lastManualSweepSignature !== null && !hasFreshSweep;

  return (
    <section className="panel comparison-panel cryptanalysis-panel">
      <div className="panel-head">
        <p className="panel-label">Cryptanalysis Workspace</p>
        <h2>
          {cryptanalysisMode === 'classical'
            ? 'Vigenere Analysis Lab'
            : cryptanalysisMode === 'modern'
              ? 'Avalanche Explorer'
              : cryptanalysisMode === 'randomness'
                ? 'Bitstream Randomness Lab'
                : cryptanalysisMode === 'output-stats'
                  ? 'Output Statistics'
                  : 'Key Schedule Analysis'}
        </h2>
        <div className="workspace-mode-switch" role="radiogroup" aria-label="Workspace mode">
          <button
            type="button"
            role="radio"
            aria-checked={workspaceMode === 'build'}
            className={workspaceMode === 'build' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
            onClick={() => onSetWorkspaceMode('build')}
          >
            Build
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={workspaceMode === 'guide'}
            className={workspaceMode === 'guide' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
            onClick={() => onSetWorkspaceMode('guide')}
          >
            Guide
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={workspaceMode === 'cryptanalysis'}
            className={workspaceMode === 'cryptanalysis' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
            onClick={() => onSetWorkspaceMode('cryptanalysis')}
          >
            Cryptanalysis
          </button>
        </div>
        <p className="comparison-copy">
          Standalone cryptanalysis for {projectName}. Compare stays compact; deeper investigation
          happens here.
        </p>
      </div>

      <div className="cryptanalysis-mode-switch" role="radiogroup" aria-label="Cryptanalysis mode">
        <button
          type="button"
          role="radio"
          aria-checked={cryptanalysisMode === 'classical'}
          className={cryptanalysisMode === 'classical' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
          onClick={() => onSetCryptanalysisMode('classical')}
        >
          Classical
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={cryptanalysisMode === 'modern'}
          className={cryptanalysisMode === 'modern' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
          onClick={() => onSetCryptanalysisMode('modern')}
        >
          Modern
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={cryptanalysisMode === 'randomness'}
          className={cryptanalysisMode === 'randomness' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
          onClick={() => onSetCryptanalysisMode('randomness')}
        >
          Randomness
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={cryptanalysisMode === 'key-schedule'}
          className={cryptanalysisMode === 'key-schedule' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
          onClick={() => onSetCryptanalysisMode('key-schedule')}
        >
          Key Schedule
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={cryptanalysisMode === 'output-stats'}
          className={cryptanalysisMode === 'output-stats' ? 'workspace-mode-chip active' : 'workspace-mode-chip'}
          onClick={() => onSetCryptanalysisMode('output-stats')}
        >
          Output Stats
        </button>
        {tutorial ? (
          <button
            type="button"
            className="workspace-mode-chip"
            onClick={() => onSetTutorialNotesVisible(!tutorialNotesVisible)}
          >
            {tutorialNotesVisible ? 'Hide Notes' : 'Show Notes'}
          </button>
        ) : null}
      </div>

      {showTutorialCard ? (
        <div className="comparison-card comparison-card-wide cryptanalysis-tutorial-card">
          <span className="meta-label">Guided Tutorial</span>
          <strong>
            {tutorial.title} — Step {tutorialStepIndex + 1} of {tutorial.steps.length}
          </strong>
          <p className="comparison-copy">{tutorialStep.body}</p>
          {tutorialStep.focusModuleId ? (
            <p className="comparison-copy">
              Step target: <strong>{tutorialStep.focusModuleId}</strong>
            </p>
          ) : null}
          <div className="comparison-actions">
            <button
              type="button"
              className="mini-action-button"
              disabled={tutorialStepIndex <= 0}
              onClick={() => onSetTutorialStep(Math.max(0, tutorialStepIndex - 1))}
            >
              Previous Step
            </button>
            <button
              type="button"
              className="mini-action-button"
              disabled={tutorialStepIndex >= tutorial.steps.length - 1}
              onClick={() => onSetTutorialStep(Math.min(tutorial.steps.length - 1, tutorialStepIndex + 1))}
            >
              Next Step
            </button>
            {tutorialStep.focusModuleId ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() => onFocusTutorialModule(tutorialStep.focusModuleId!)}
              >
                Focus Module
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {cryptanalysisMode === 'modern' ? (
        <div className="comparison-grid">
          <AnalysisCaseManager
            draftName={caseDraftName}
            savedCases={savedAnalysisCases.filter((savedCase) => savedCase.mode === 'modern')}
            modeLabel="Modern"
            onDraftNameChange={setCaseDraftName}
            onSave={() => {
              if (caseDraftName.trim().length === 0) {
                return;
              }
              onSaveAnalysisCase(caseDraftName.trim());
              setCaseDraftName('');
            }}
            onLoad={onLoadAnalysisCase}
            onUpdate={onUpdateAnalysisCase}
            onRename={onRenameAnalysisCase}
            onDelete={onDeleteAnalysisCase}
          />
          {showModernCompatibilityCallout ? (
            <div className="comparison-card comparison-card-wide cryptanalysis-modern-callout">
              <span className="meta-label">Modern Analysis Compatibility</span>
              <strong>
                {flippableSource
                  ? 'This project needs a bit-domain output path for full avalanche comparison.'
                  : 'This project needs a supported bit-domain source for full avalanche comparison.'}
              </strong>
              <p className="comparison-copy">
                Avalanche Explorer works best when the active machine exposes a real bit-domain input and output.
                  Supported source paths currently begin from <strong>BitSource</strong>, <strong>HexSource</strong>, <strong>AsciiSource</strong>, or a
                  single-letter <strong>TextInput → SymbolToBits</strong> bridge.
              </p>
              <p className="comparison-copy">
                Recommended projects right now: <strong>Feistel Network</strong>, <strong>Scheduled Byte Iterator</strong>,{' '}
                <strong>Hex Byte Round</strong>, or <strong>Byte S-Box Round</strong>.
              </p>
            </div>
          ) : null}

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Baseline Bits</span>
            <strong>
              {flippableSource
                ? `Using ${flippableSource.moduleName} from the active project`
                : 'Manual baseline input'}
            </strong>
            {flippableSource ? (
              <>
                <p className="comparison-copy">
                  Source module: <strong>{flippableSource.moduleId}</strong>
                  {' '}| kind <strong>{getFlippableSourceKindLabel(flippableSource.kind)}</strong>
                </p>
                <p className="comparison-copy">
                  The explorer is now flipping a real project input bit and re-running the machine.
                </p>
                {flippableSource.kind === 'text-symbol-bridge' && !variantBridgeSymbol ? (
                  <p className="comparison-copy">
                    This particular 5-bit flip lands outside <strong>A-Z</strong>, so the bridge has no honest symbol variant to execute.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <label className="param-field cryptanalysis-textarea-field">
                  <span>Baseline Input</span>
                  <textarea
                    value={modernBaseline}
                    onChange={(event) => onModernBaselineChange(event.target.value)}
                    placeholder="Example: 1011010010110100"
                    rows={4}
                    spellCheck={false}
                  />
                </label>
                <p className="comparison-copy">
                  No supported project source detected yet, so this view is using a manual bit baseline.
                </p>
              </>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Input Difference View</span>
            <strong>See the changed source position directly</strong>
            {effectiveInputBits.length > 0 ? (
              <>
                <ModernFlipControl
                  bitLength={effectiveInputBits.length}
                  flipBit={effectiveModernFlipBit}
                  changedCount={inputDifference.changedCount}
                  changedPercent={inputDifference.changedPercent}
                  onChange={onModernFlipBitChange}
                />
                {inputHexSummary ? (
                  <div className="cryptanalysis-output-summary-row">
                    <span className="content-status-chip">
                      Baseline Hex: <strong>{inputHexSummary.baseline}</strong>
                    </span>
                    <span className="content-status-chip">
                      Variant Hex: <strong>{inputHexSummary.variant}</strong>
                    </span>
                  </div>
                ) : null}
                <div className="modern-bit-grid">
                  <BitStripRow label="Baseline" bits={inputDifference.baselineBits} />
                  <BitStripRow label="Variant" bits={inputDifference.variantBits} changedFlags={inputDifference.changedFlags} />
                  <BitStripRow label="Changed" bits={inputDifference.changedFlags.map((changed) => (changed ? 1 : 0))} changedFlags={inputDifference.changedFlags} emphasis="changed" />
                </div>
              </>
            ) : (
              <p className="comparison-copy">
                The first modern view uses aligned bit strips so the difference shape is obvious at a glance.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Machine Output Difference</span>
            <strong>Compare real baseline vs variant outputs</strong>
            {flippableSources.length > 1 || modernSinkOptions.length > 1 ? (
              <div className="content-filter-row">
                {flippableSources.length > 1 ? (
                  <label className="param-field">
                    <span>Sweep Source</span>
                    <select
                      value={effectiveModernSourceId ?? ''}
                      onChange={(event) => onModernSourceIdChange(event.target.value)}
                    >
                      {flippableSources.map((source) => (
                        <option key={source.moduleId} value={source.moduleId}>
                          {source.moduleName} ({getFlippableSourceKindLabel(source.kind)})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {modernSinkOptions.length > 1 ? (
                  <label className="param-field">
                    <span>Analyze Sink</span>
                    <select
                      value={effectiveModernSinkId ?? ''}
                      onChange={(event) => onModernSinkIdChange(event.target.value)}
                    >
                      {modernSinkOptions.map((option) => (
                        <option key={option.moduleId} value={option.moduleId}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}
            {flippableSource && baselineOutputBits ? (
              <>
                <ModernFlipControl
                  bitLength={effectiveInputBits.length}
                  flipBit={effectiveModernFlipBit}
                  changedCount={stableOutputDiff?.changedCount ?? 0}
                  changedPercent={stableOutputDiff?.changedPercent ?? 0}
                  metricLabel="changed output bits"
                  onChange={onModernFlipBitChange}
                />
                <div className="comparison-actions">
                  <button
                    type="button"
                    className="mini-action-button"
                    title="Sweep every bit-flip variant, concatenate all outputs, and send to Classical Analysis"
                    onClick={() => {
                      const parts: string[] = [];
                      for (let i = 0; i < flippableSource.bits.length; i++) {
                        const vBits = flipBitAtIndex(flippableSource.bits, i);
                        const vProject = buildVariantProject(project, flippableSource, vBits);
                        if (!vProject) continue;
                        const validation = validateProject(vProject, registry);
                        if (!validation.ok) continue;
                        try {
                          const vExec = runDemoProject(vProject, registry);
                          const sym = getSymbolSignalForSink(vExec, effectiveModernSinkId);
                          if (sym) { parts.push(sym); continue; }
                          const bits = getBitSignalForSink(vExec, effectiveModernSinkId);
                          if (bits && bits.length >= 8) {
                            for (let j = 0; j + 7 < bits.length; j += 8) {
                              const byte = bits.slice(j, j + 8).reduce((acc, b, k) => acc | (b << (7 - k)), 0);
                              parts.push(String.fromCharCode(65 + (byte % 26)));
                            }
                          }
                        } catch { continue; }
                      }
                      if (parts.length > 0) {
                        onCiphertextChange(parts.join('').toUpperCase());
                        onSetCryptanalysisMode('classical');
                      }
                    }}
                  >
                    Sweep to Classical
                  </button>
                </div>
                {stableOutputDiff ? (
                  <>
                    {stableOutputHex ? (
                      <div className="cryptanalysis-output-summary-row">
                        <span className="content-status-chip">
                          Baseline Hex: <strong>{stableOutputHex.baseline}</strong>
                        </span>
                        <span className="content-status-chip">
                          Variant Hex: <strong>{stableOutputHex.variant}</strong>
                        </span>
                      </div>
                    ) : null}
                    <div className="modern-bit-grid">
                      <BitStripRow label="Baseline Out" bits={stableOutputDiff.baselineBits} />
                      <BitStripRow label="Variant Out" bits={stableOutputDiff.variantBits} changedFlags={stableOutputDiff.changedFlags} />
                      <BitStripRow label="Changed Out" bits={stableOutputDiff.changedFlags.map((changed) => (changed ? 1 : 0))} changedFlags={stableOutputDiff.changedFlags} emphasis="changed" />
                    </div>
                    <p className="comparison-copy">
                      Changed output bits <strong>{stableOutputDiff.changedCount}</strong>
                      {' '}| changed percent <strong>{(stableOutputDiff.changedPercent * 100).toFixed(1)}%</strong>
                    </p>
                  </>
                ) : (
                  <p className="comparison-copy">
                    {flippableSource.kind === 'text-symbol-bridge' && !variantBridgeSymbol
                      ? 'This flip produced a 5-bit code outside A–Z, so there is no valid symbol variant to run.'
                      : 'Variant output unavailable for this bit position — execution could not complete.'}
                  </p>
                )}
              </>
            ) : (
              <p className="comparison-copy">
                {flippableSource?.kind === 'text-symbol-bridge' && !variantBridgeSymbol
                  ? 'This flip produced a 5-bit code outside A-Z, so there is no valid symbol variant to run through SymbolToBits.'
                  : 'This project needs a supported bit source and a bit-domain output path before the machine-aware avalanche view can render.'}
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Batch Avalanche Sweep</span>
            <strong>Measure the whole input surface, not just one flip</strong>
            <div className="comparison-actions">
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  onOpenTutorialPath(AVALANCHE_LAB_PROJECT_ID, AVALANCHE_LAB_TUTORIAL_ID)
                }
              >
                Open Avalanche Lab
              </button>
            </div>
            <div className="cryptanalysis-output-summary-row">
              <span className="content-status-chip">
                Source: <strong>{flippableSource ? `${flippableSource.moduleName} (${getFlippableSourceKindLabel(flippableSource.kind)})` : 'n/a'}</strong>
              </span>
              <span className="content-status-chip">
                Sink: <strong>{effectiveModernSinkId || 'n/a'}</strong>
              </span>
              <span className="content-status-chip">
                Input bits: <strong>{effectiveInputBits.length}</strong>
              </span>
            </div>
            {requiresManualSweep ? (
              <div className="cryptanalysis-shift-control-row cryptanalysis-inline-flip-control">
                <button
                  type="button"
                  className="mini-action-button"
                  onClick={() => setLastManualSweepSignature(sweepSignature)}
                  disabled={!flippableSource || !baselineOutputBits || !effectiveModernSinkId}
                >
                  {sweepSummary ? 'Run Sweep Again' : 'Run Sweep'}
                </button>
                {sweepNotYetRun ? (
                  <span className="content-status-chip">
                    Full sweep is manual above 64 input bits.
                  </span>
                ) : sweepStale ? (
                  <span className="content-status-chip">
                    Sweep results are stale. Re-run to refresh.
                  </span>
                ) : (
                  <span className="content-status-chip">
                    Results match the current machine state.
                  </span>
                )}
              </div>
            ) : null}
            {sweepSummary ? (
              <>
                <div className="cryptanalysis-output-summary-row">
                  <span className="content-status-chip">
                    Flips: <strong>{sweepSummary.flipCount}</strong>
                  </span>
                  <span className="content-status-chip">
                    Min: <strong>{sweepSummary.minimumChangedCount}</strong>
                  </span>
                  <span className="content-status-chip">
                    Max: <strong>{sweepSummary.maximumChangedCount}</strong>
                  </span>
                  <span className="content-status-chip">
                    Avg: <strong>{sweepSummary.averageChangedCount.toFixed(3)}</strong>
                  </span>
                  <span className="content-status-chip">
                    Median: <strong>{sweepSummary.medianChangedCount.toFixed(3)}</strong>
                  </span>
                  <span className="content-status-chip">
                    Std Dev: <strong>{sweepSummary.standardDeviation.toFixed(3)}</strong>
                  </span>
                </div>
                <div className="comparison-grid">
                  <div className="comparison-card">
                    <span className="meta-label">Weakest Observed Inputs</span>
                    <strong>Up to 8 lowest-response bits</strong>
                    <div className="cryptanalysis-list">
                      {sweepSummary.weakestInputs.map((entry) => (
                        <p key={`weak-${entry.inputIndex}`} className="comparison-copy">
                          Bit <strong>{entry.inputIndex + 1}</strong>
                          {' '}| {entry.changedCount} changed bits
                          {' '}| {(entry.changedPercent * 100).toFixed(1)}%
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="comparison-card">
                    <span className="meta-label">Strongest Observed Inputs</span>
                    <strong>Up to 8 highest-response bits</strong>
                    <div className="cryptanalysis-list">
                      {sweepSummary.strongestInputs.map((entry) => (
                        <p key={`strong-${entry.inputIndex}`} className="comparison-copy">
                          Bit <strong>{entry.inputIndex + 1}</strong>
                          {' '}| {entry.changedCount} changed bits
                          {' '}| {(entry.changedPercent * 100).toFixed(1)}%
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                {sweepSummary.byteGroups.length > 0 ? (
                  <div className="comparison-card comparison-card-wide">
                    <span className="meta-label">Grouped Input Summary</span>
                    <strong>Average changed output bits by 8-bit input segment</strong>
                    <div className="cryptanalysis-list">
                      {sweepSummary.byteGroups.map((group) => (
                        <p key={`byte-group-${group.byteIndex}`} className="comparison-copy">
                          Byte {group.byteIndex + 1} (bits {group.startBitIndex + 1}-{group.endBitIndex + 1})
                          {' '}| avg {group.averageChangedCount.toFixed(3)} changed bits
                          {' '}| {(group.averageChangedPercent * 100).toFixed(1)}%
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="comparison-copy">
                {requiresManualSweep
                  ? 'Run the full single-bit sweep to see whether this machine is consistently diffusive or only impressive in a few cases.'
                  : 'This project needs a supported bit source and bit-domain sink before the full sweep can run.'}
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Round-Aware Diffusion</span>
            <strong>Watch the change spread across internal rounds</strong>
            {roundDiffusion.length > 0 ? (
              <>
                <ModernFlipControl
                  bitLength={effectiveInputBits.length}
                  flipBit={effectiveModernFlipBit}
                  changedCount={roundDiffusion[roundDiffusion.length - 1]?.changedCount ?? 0}
                  changedPercent={roundDiffusion[roundDiffusion.length - 1]?.changedPercent ?? 0}
                  metricLabel="changed digest bits"
                  onChange={onModernFlipBitChange}
                />
                <div className="modern-round-diffusion-matrix">
                  {roundDiffusion.map((entry) => (
                    <div key={entry.moduleId} className="modern-round-diffusion-matrix-row">
                      <div className="modern-round-diffusion-matrix-copy">
                        <span className="meta-label">R{entry.round}</span>
                        <strong>{entry.label}</strong>
                      </div>
                      <div className="modern-round-diffusion-matrix-strip">
                        {entry.changedFlags.map((changed, index) => (
                          <span
                            key={`${entry.moduleId}-${index}`}
                            className={changed ? 'modern-round-diffusion-matrix-cell active' : 'modern-round-diffusion-matrix-cell'}
                            title={`Round ${entry.round}, bit ${index + 1}: ${changed ? 'changed' : 'same'}`}
                          />
                        ))}
                      </div>
                      <div className="modern-round-diffusion-matrix-metric">
                        <strong>{entry.changedCount}</strong>
                        <span>{(entry.changedPercent * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modern-round-diffusion-chart" role="list" aria-label="Round diffusion chart">
                  {roundDiffusionChart.map((entry) => (
                    <div key={entry.moduleId} className="modern-round-diffusion-row">
                      <div className="modern-round-diffusion-copy">
                        <span className="meta-label">Round {entry.round}</span>
                        <strong>{entry.label}</strong>
                        <span className="comparison-copy">
                          {entry.changedCount} changed bits ({(entry.changedPercent * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="modern-round-diffusion-bar">
                        <div
                          className="modern-round-diffusion-fill"
                          style={{ width: `${entry.barPercent}%` }}
                          title={`${(entry.changedPercent * 100).toFixed(1)}% changed`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="comparison-card comparison-card-wide">
                  <span className="meta-label">Round Contribution</span>
                  <strong>See which rounds actually added new spread</strong>
                  <div className="cryptanalysis-output-summary-row">
                    <span className="content-status-chip">
                      Biggest gain:{' '}
                      <strong>
                        {roundContributionSummary.biggestGain
                          ? `Round ${roundContributionSummary.biggestGain.round}`
                          : 'n/a'}
                      </strong>
                    </span>
                    <span className="content-status-chip">
                      Delta:{' '}
                      <strong>
                        {roundContributionSummary.biggestGain
                          ? `${roundContributionSummary.biggestGain.deltaChangedCount >= 0 ? '+' : ''}${roundContributionSummary.biggestGain.deltaChangedCount} bits`
                          : 'n/a'}
                      </strong>
                    </span>
                    <span className="content-status-chip">
                      Plateau / regression rounds:{' '}
                      <strong>{roundContributionSummary.plateauOrRegressionRounds.length}</strong>
                    </span>
                  </div>
                  <div className="cryptanalysis-list">
                    {roundContributionSummary.entries.map((entry) => (
                      <p key={`round-contribution-${entry.moduleId}`} className="comparison-copy">
                        Round <strong>{entry.round}</strong> ({entry.label})
                        {' '}| cumulative <strong>{entry.changedCount}</strong> changed bits
                        {' '}({(entry.changedPercent * 100).toFixed(1)}%)
                        {' '}| delta <strong>{entry.deltaChangedCount >= 0 ? '+' : ''}{entry.deltaChangedCount}</strong>
                        {' '}bits ({entry.deltaChangedPercent >= 0 ? '+' : ''}{(entry.deltaChangedPercent * 100).toFixed(1)}%)
                      </p>
                    ))}
                  </div>
                  {roundContributionSummary.plateauOrRegressionRounds.length > 0 ? (
                    <p className="comparison-copy cryptanalysis-help-copy">
                      Diffusion plateaued or regressed at{' '}
                      <strong>
                        {roundContributionSummary.plateauOrRegressionRounds
                          .map((entry) => `Round ${entry.round}`)
                          .join(', ')}
                      </strong>.
                      {' '}That does not prove the machine is weak, but it does tell you these observed rounds added little new spread in this path.
                    </p>
                  ) : (
                    <p className="comparison-copy cryptanalysis-help-copy">
                      Every visible round added at least some new spread in this observed path. The question is now how much each round contributed, not just where the final total landed.
                    </p>
                  )}
                </div>
                <div className="modern-influence-heatmap-shell">
                  <span className="meta-label">Input-to-Output Influence</span>
                  <strong>
                    {showInfluenceSweep
                      ? 'See which output bits react when each input bit flips'
                      : 'Influence sweep is not available for this source path'}
                  </strong>
                  {showInfluenceSweep ? (
                    <>
                      <p className="comparison-copy cryptanalysis-help-copy">
                        Rows are flipped input positions. Columns are output bits. Brighter cells mean that output bit changed for that input flip more often in this bounded sweep.
                        {sweepRows.length > 64 ? ' The heatmap remains capped to the first 64 flips so the visual stays readable.' : ''}
                      </p>
                      <div className="modern-influence-column-summary" role="list" aria-label="Output influence totals">
                        {influenceColumns.map((column) => (
                          <div key={`influence-column-${column.outputIndex}`} className="modern-influence-column-card">
                            <span className="meta-label">Out {column.outputIndex + 1}</span>
                            <strong>{Math.round(column.activationShare * 100)}%</strong>
                            <span className="comparison-copy">
                              {column.activationCount} of {influenceRows.length} flips
                            </span>
                            <div className="modern-influence-column-bar">
                              <div
                                className="modern-influence-column-fill"
                                style={{ width: `${Math.max(column.activationShare * 100, column.activationCount > 0 ? 6 : 0)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="modern-influence-grid" role="table" aria-label="Input-to-output influence heatmap">
                        <div className="modern-influence-axis-corner" aria-hidden="true" />
                        {influenceColumns.map((column) => (
                          <div
                            key={`influence-col-head-${column.outputIndex}`}
                            className="modern-influence-axis modern-influence-axis-column"
                            role="columnheader"
                          >
                            <span className="meta-label">Output</span>
                            <strong>{column.outputIndex + 1}</strong>
                          </div>
                        ))}
                        {influenceRows.map((row) => (
                          <Fragment key={`influence-row-${row.inputIndex}`}>
                            <div className="modern-influence-axis modern-influence-axis-row" role="rowheader">
                              <span className="meta-label">Flip</span>
                              <strong>{row.inputIndex + 1}</strong>
                              <span className="comparison-copy">
                                {row.changedCount} bits
                              </span>
                            </div>
                            {influenceColumns.map((column) => {
                              const changed = row.changedFlags[column.outputIndex] ?? false;
                              return (
                                <div
                                  key={`influence-cell-${row.inputIndex}-${column.outputIndex}`}
                                  className={changed ? 'modern-influence-cell modern-influence-cell-active' : 'modern-influence-cell'}
                                  role="cell"
                                  title={`Input ${row.inputIndex + 1} -> output ${column.outputIndex + 1}: ${changed ? 'changed' : 'same'}`}
                                />
                              );
                            })}
                          </Fragment>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="comparison-copy cryptanalysis-help-copy">
                      The bounded influence heatmap currently needs a bit, hex, or ASCII source path plus a bit-domain output. Single-symbol `TextInput → SymbolToBits` paths remain out of scope for this sweep.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="comparison-copy">
                Round-aware diffusion appears when the active machine exposes iterator-style internal rounds in the analysis trace.
              </p>
            )}
          </div>
        </div>
      ) : cryptanalysisMode === 'key-schedule' ? (
        <div className="comparison-grid">
          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Key Schedule Surface</span>
            <strong>Analyze how the master key evolves into explicit round-key outputs</strong>
            <div className="comparison-actions">
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  onOpenTutorialPath(KEY_SCHEDULE_LAB_PROJECT_ID, KEY_SCHEDULE_LAB_TUTORIAL_ID)
                }
              >
                Open Key Schedule Lab
              </button>
            </div>
            <p className="comparison-copy">
              This surface is separate from plaintext avalanche. It only studies the selected master-key source and the ordered round-key outputs you expose explicitly at the machine boundary.
            </p>
            {keySourceOptions.length > 0 ? (
              <label className="param-field">
                <span>Master-Key Source</span>
                <select
                  value={effectiveKeySourceId ?? ''}
                  onChange={(event) => setSelectedKeySourceId(event.target.value || null)}
                >
                  {keySourceOptions.map((source) => (
                    <option key={source.moduleId} value={source.moduleId}>
                      {source.moduleName} ({getFlippableSourceKindLabel(source.kind)}) — {source.moduleId}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="comparison-copy">
                No analyzable key source is available yet. Expose a supported bit-domain source such as a BitSource, HexSource, or AsciiSource.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Round-Key Stage Picker</span>
            <strong>Choose explicit terminal outputs and order them manually</strong>
            {keyStageOptions.length > 0 ? (
              <>
                <div className="cryptanalysis-output-summary-row">
                  <span className="content-status-chip">
                    Available outputs: <strong>{keyStageOptions.length}</strong>
                  </span>
                  <span className="content-status-chip">
                    Selected stages: <strong>{orderedKeyStages.length}</strong>
                  </span>
                </div>
                {availableKeyStageOptions.length > 0 ? (
                  <div className="cryptanalysis-list">
                    {availableKeyStageOptions.map((option) => (
                      <p key={`available-stage-${option.moduleId}`} className="comparison-copy">
                        <strong>{option.label}</strong>
                        {' '}| {option.bits.length} bits
                        {' '}| {formatKeyStageValue(option.bits)}
                        <button
                          type="button"
                          className="mini-action-button"
                          onClick={() =>
                            setSelectedKeyStageIds((current) => [...current, option.moduleId])
                          }
                        >
                          Add
                        </button>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="comparison-copy">
                    All observable bit outputs are already in the ordered sequence below.
                  </p>
                )}
              </>
            ) : (
              <p className="comparison-copy">
                No analyzable round-key outputs are available yet. Expose explicit terminal bit-domain outputs to analyze this schedule.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Ordered Round-Key Sequence</span>
            <strong>User-defined order, no topology guesses</strong>
            {orderedKeyStages.length > 0 ? (
              <div className="cryptanalysis-list">
                {orderedKeyStages.map((stage, index) => (
                  <p key={`selected-stage-${stage.moduleId}`} className="comparison-copy">
                    <strong>{index + 1}. {stage.label}</strong>
                    {' '}| {stage.bits.length} bits
                    {' '}| {formatKeyStageValue(stage.bits)}
                    <button
                      type="button"
                      className="mini-action-button"
                      onClick={() =>
                        setSelectedKeyStageIds((current) => moveStageId(current, stage.moduleId, -1))
                      }
                      disabled={index === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="mini-action-button"
                      onClick={() =>
                        setSelectedKeyStageIds((current) => moveStageId(current, stage.moduleId, 1))
                      }
                      disabled={index >= orderedKeyStages.length - 1}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="mini-action-button"
                      onClick={() =>
                        setSelectedKeyStageIds((current) =>
                          current.filter((moduleId) => moduleId !== stage.moduleId),
                        )
                      }
                    >
                      Remove
                    </button>
                  </p>
                ))}
              </div>
            ) : (
              <p className="comparison-copy">
                Add explicit terminal outputs to define the round-key sequence you want to analyze.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Adjacent Round Difference</span>
            <strong>Check whether neighboring round keys are genuinely evolving</strong>
            {keyScheduleAdjacentDifferences.length > 0 ? (
              <div className="cryptanalysis-list">
                {keyScheduleAdjacentDifferences.map((entry) => (
                  <p
                    key={`adjacent-${entry.fromModuleId}-${entry.toModuleId}`}
                    className="comparison-copy"
                  >
                    <strong>{entry.fromLabel}</strong> → <strong>{entry.toLabel}</strong>
                    {entry.widthMismatch ? (
                      <> | width mismatch</>
                    ) : (
                      <>
                        {' '}| {entry.changedCount} changed bits
                        {' '}| {(100 * (entry.changedPercent ?? 0)).toFixed(1)}%
                      </>
                    )}
                  </p>
                ))}
              </div>
            ) : (
              <p className="comparison-copy">
                Select at least two ordered round-key outputs to compare adjacent evolution.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Key-Bit Flip Sweep</span>
            <strong>Flip one master-key bit at a time and watch each stage respond</strong>
            <div className="cryptanalysis-shift-control-row cryptanalysis-inline-flip-control">
              <button
                type="button"
                className="mini-action-button"
                onClick={() => setLastKeyScheduleRunSignature(keyScheduleRunSignature)}
                disabled={!selectedKeySource || orderedKeyStages.length === 0}
              >
                {keyScheduleSweepSummary ? 'Run Analysis Again' : 'Run Analysis'}
              </button>
              {keyScheduleNotYetRun ? (
                <span className="content-status-chip">
                  Configure a source and ordered stages, then run analysis.
                </span>
              ) : keyScheduleStale ? (
                <span className="content-status-chip">
                  Results are stale. Re-run after source, stage, order, or machine changes.
                </span>
              ) : (
                <span className="content-status-chip">
                  Results match the current key-schedule configuration.
                </span>
              )}
            </div>
            {keyScheduleSweepSummary ? (
              <>
                <div className="cryptanalysis-output-summary-row">
                  <span className="content-status-chip">
                    Key bits flipped: <strong>{keyScheduleSweepSummary.flipCount}</strong>
                  </span>
                  <span className="content-status-chip">
                    Stages analyzed: <strong>{keyScheduleSweepSummary.stageEntries.length}</strong>
                  </span>
                </div>
                <div className="cryptanalysis-list">
                  {keyScheduleSweepSummary.stageEntries.map((entry) => (
                    <p key={`stage-summary-${entry.moduleId}`} className="comparison-copy">
                      <strong>{entry.label}</strong>
                      {' '}| min {entry.minimumChangedCount}
                      {' '}| max {entry.maximumChangedCount}
                      {' '}| avg {entry.averageChangedCount.toFixed(3)} changed bits
                      {' '}| {(entry.averageChangedPercent * 100).toFixed(1)}%
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <p className="comparison-copy">
                This view stays manual in V1 so large key schedules do not execute on every configuration change.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Weak / Strong Stage Callouts</span>
            <strong>See where key-bit spread remains weak or becomes broad</strong>
            {keyScheduleSweepSummary ? (
              <div className="comparison-grid">
                <div className="comparison-card">
                  <span className="meta-label">Weakest Stages</span>
                  <strong>Lowest average response to key-bit flips</strong>
                  <div className="cryptanalysis-list">
                    {keyScheduleSweepSummary.weakestStages.map((entry) => (
                      <p key={`weak-stage-${entry.moduleId}`} className="comparison-copy">
                        <strong>{entry.label}</strong>
                        {' '}| avg {entry.averageChangedCount.toFixed(3)} bits
                        {' '}| {(entry.averageChangedPercent * 100).toFixed(1)}%
                      </p>
                    ))}
                  </div>
                </div>
                <div className="comparison-card">
                  <span className="meta-label">Strongest Stages</span>
                  <strong>Highest average response to key-bit flips</strong>
                  <div className="cryptanalysis-list">
                    {keyScheduleSweepSummary.strongestStages.map((entry) => (
                      <p key={`strong-stage-${entry.moduleId}`} className="comparison-copy">
                        <strong>{entry.label}</strong>
                        {' '}| avg {entry.averageChangedCount.toFixed(3)} bits
                        {' '}| {(entry.averageChangedPercent * 100).toFixed(1)}%
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="comparison-copy">
                Run the sweep to identify where the key schedule spreads master-key changes weakly or strongly.
              </p>
            )}
          </div>
        </div>
      ) : cryptanalysisMode === 'randomness' ? (
        <div className="comparison-grid">
          <AnalysisCaseManager
            draftName={caseDraftName}
            savedCases={savedAnalysisCases.filter((savedCase) => savedCase.mode === 'randomness')}
            modeLabel="Randomness"
            onDraftNameChange={setCaseDraftName}
            onSave={() => {
              if (caseDraftName.trim().length === 0) {
                return;
              }
              onSaveAnalysisCase(caseDraftName.trim());
              setCaseDraftName('');
            }}
            onLoad={onLoadAnalysisCase}
            onUpdate={onUpdateAnalysisCase}
            onRename={onRenameAnalysisCase}
            onDelete={onDeleteAnalysisCase}
          />
          {activeRandomnessSink ? (
            <>
              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Bitstream Source</span>
                <strong>
                  {activeRandomnessSink.label}
                  {' '}| {activeRandomnessSink.sourceLabel}
                </strong>
                <div className="comparison-actions">
                  <button
                    type="button"
                    className="mini-action-button"
                    onClick={() =>
                      onOpenTutorialPath(RANDOMNESS_LAB_PROJECT_ID, RANDOMNESS_LAB_TUTORIAL_ID)
                    }
                  >
                    Open Randomness Lab
                  </button>
                </div>
                {randomnessSinkOptions.length > 1 ? (
                  <div className="content-filter-row">
                    <label className="param-field">
                      <span>Analyze Sink</span>
                      <select
                        value={effectiveRandomnessSinkId ?? ''}
                        onChange={(event) => onRandomnessSinkIdChange(event.target.value)}
                      >
                        {randomnessSinkOptions.map((option) => (
                          <option key={option.moduleId} value={option.moduleId}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
                <div className="cryptanalysis-output-summary-row">
                  <span className="content-status-chip">
                    Sample bits: <strong>{randomnessAnalysis?.sampleBitCount ?? 0}</strong>
                  </span>
                  {randomnessAnalysis?.lowConfidence ? (
                    <span className="content-status-chip status-chip-warning">
                      Low confidence sample: <strong>under 64 bits</strong>
                    </span>
                  ) : null}
                </div>
                <p className="comparison-copy cryptanalysis-help-copy">
                  This lab measures visible stream structure. Passing one or two simple checks does not prove security.
                </p>
                <div className="randomness-sample-block">
                  <span className="meta-label">Sampled Stream</span>
                  <code>{formattedRandomnessSample || 'No visible bitstream yet.'}</code>
                </div>
              </div>

              <div className="comparison-card">
                <span className="meta-label">Balance</span>
                <strong>{getMonobitInterpretation(randomnessAnalysis)}</strong>
                <p className="comparison-copy">
                  0 bits <strong>{randomnessAnalysis?.zeroCount ?? 0}</strong>
                  {' '}| 1 bits <strong>{randomnessAnalysis?.oneCount ?? 0}</strong>
                </p>
                <p className="comparison-copy">
                  Split <strong>{formatPercent(randomnessAnalysis?.zeroShare ?? 0)}</strong> /{' '}
                  <strong>{formatPercent(randomnessAnalysis?.oneShare ?? 0)}</strong>
                  {' '}| imbalance <strong>{randomnessAnalysis?.imbalance ?? 0}</strong>
                </p>
                <p className="comparison-copy cryptanalysis-help-copy">
                  A balanced stream can still be easy to predict; this only rules out obvious bias.
                </p>
              </div>

              <div className="comparison-card">
                <span className="meta-label">Entropy</span>
                <strong>{getEntropyInterpretation(randomnessAnalysis)}</strong>
                <p className="comparison-copy">
                  Shannon entropy per bit{' '}
                  <strong>
                    {randomnessAnalysis?.entropyPerBit !== null && randomnessAnalysis
                      ? randomnessAnalysis.entropyPerBit.toFixed(3)
                      : 'n/a'}
                  </strong>
                  {' '}out of <strong>1.000</strong>
                </p>
                <p className="comparison-copy">
                  Entropy gap{' '}
                  <strong>
                    {randomnessAnalysis?.entropyGap !== null && randomnessAnalysis
                      ? randomnessAnalysis.entropyGap.toFixed(3)
                      : 'n/a'}
                  </strong>
                </p>
                <p className="comparison-copy cryptanalysis-help-copy">
                  This is a picture of bit balance only. High entropy here means the stream is not obviously biased, not that it is secure.
                </p>
              </div>

              <div className="comparison-card">
                <span className="meta-label">Runs</span>
                <strong>{getRunInterpretation(randomnessAnalysis)}</strong>
                <p className="comparison-copy">
                  Longest 0 run <strong>{randomnessAnalysis?.longestZeroRun ?? 0}</strong>
                  {' '}| longest 1 run <strong>{randomnessAnalysis?.longestOneRun ?? 0}</strong>
                </p>
                <div className="randomness-run-grid">
                  {randomnessAnalysis?.runLengthSummary.map((entry) => (
                    <div key={entry.lengthLabel} className="randomness-run-cell">
                      <span className="meta-label">Len {entry.lengthLabel}</span>
                      <strong>0:{entry.zeroRuns} / 1:{entry.oneRuns}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Transitions And Local Dependence</span>
                <strong>{getTransitionInterpretation(randomnessAnalysis)}</strong>
                <div className="randomness-transition-grid">
                  {(['00', '01', '10', '11'] as const).map((pair) => (
                    <div
                      key={pair}
                      className="randomness-transition-cell randomness-heat-cell"
                      style={buildHeatCellStyle(randomnessAnalysis?.transitionShares[pair] ?? 0)}
                    >
                      <span className="meta-label">{pair}</span>
                      <strong>{randomnessAnalysis?.transitionCounts[pair] ?? 0}</strong>
                      <span className="comparison-copy">{formatPercent(randomnessAnalysis?.transitionShares[pair] ?? 0)}</span>
                    </div>
                  ))}
                </div>
                <p className="comparison-copy">
                  Adjacent bits equal <strong>{randomnessAnalysis?.equalAdjacentCount ?? 0}</strong>
                  {' '}| different <strong>{randomnessAnalysis?.differentAdjacentCount ?? 0}</strong>
                </p>
                <p className="comparison-copy cryptanalysis-help-copy">
                  Lag-1 view: if adjacent bits hold far more often than they flip, the generator rhythm is probably too dependent on its previous state.
                </p>
              </div>

              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Short-Pattern Heatmap</span>
                <strong>{getHeatmapInterpretation(randomnessAnalysis)}</strong>
                <div className="randomness-heatmap-shell">
                  <div className="randomness-heatmap-legend" aria-hidden="true">
                    <span className="meta-label">Rare</span>
                    <div className="randomness-heatmap-legend-bar" />
                    <span className="meta-label">Dense</span>
                  </div>
                  <div className="randomness-heatmap-matrix" role="table" aria-label="3-bit pattern heatmap">
                    <div className="randomness-heatmap-corner" aria-hidden="true" />
                    {['00', '01', '10', '11'].map((suffix) => (
                      <div key={`heatmap-col-${suffix}`} className="randomness-heatmap-axis randomness-heatmap-axis-column" role="columnheader">
                        <span className="meta-label">Ends</span>
                        <strong>{suffix}</strong>
                      </div>
                    ))}
                    {['0', '1'].map((prefix) => (
                      <Fragment key={`heatmap-row-${prefix}`}>
                        <div className="randomness-heatmap-axis randomness-heatmap-axis-row" role="rowheader">
                          <span className="meta-label">Starts</span>
                          <strong>{prefix}</strong>
                        </div>
                        {['00', '01', '10', '11'].map((suffix) => {
                          const pattern = `${prefix}${suffix}`;
                          const cell = randomnessAnalysis?.patternHeatmap.find((entry) => entry.pattern === pattern);
                          return (
                            <div
                              key={pattern}
                              className="randomness-pattern-cell randomness-heat-cell"
                              style={buildHeatCellStyle(cell?.intensity ?? 0)}
                              role="cell"
                              title={`${pattern}: ${cell?.count ?? 0} windows (${formatPercent(cell?.share ?? 0)})`}
                            >
                              <span className="meta-label">{pattern}</span>
                              <strong>{cell?.count ?? 0}</strong>
                              <span className="comparison-copy">{formatPercent(cell?.share ?? 0)}</span>
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
                <p className="comparison-copy cryptanalysis-help-copy">
                  A uniform-looking heatmap is what students often imagine randomness should resemble. Bright clusters show which short patterns appear too often.
                </p>
              </div>

              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Repeated Windows</span>
                <strong>{getRepeatedWindowInterpretation(randomnessAnalysis)}</strong>
                <div className="randomness-repeat-grid">
                  {randomnessAnalysis?.repeatedWindowGroups.map((group) => (
                    <div key={group.size} className="randomness-repeat-card">
                      <span className="meta-label">Window {group.size}</span>
                      {group.matches.length > 0 ? (
                        <div className="cryptanalysis-list">
                          {group.matches.map((entry) => (
                            <p key={`${group.size}-${entry.window}`} className="comparison-copy">
                              <strong>{entry.window}</strong> repeats <strong>{entry.count}</strong> times
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="comparison-copy">No repeated {group.size}-bit windows found in the sampled stream.</p>
                      )}
                      {group.truncated ? (
                        <p className="comparison-copy cryptanalysis-help-copy">
                          Repeated-window scan capped at the first 1024 bits for responsiveness.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="comparison-card comparison-card-wide cryptanalysis-modern-callout">
              <span className="meta-label">Randomness Lab Compatibility</span>
              <strong>This project needs a bit-domain output sink before the randomness lab can measure it.</strong>
              <p className="comparison-copy">
                Use a workspace with a visible bitstream sink such as <strong>keystream</strong>, <strong>lfsr-predictability</strong>, <strong>gated-keystream</strong>, or <strong>majority-keystream</strong>.
              </p>
            </div>
          )}
        </div>
      ) : cryptanalysisMode === 'output-stats' ? (
        <div className="comparison-grid">
          {/* Permanent disclaimer */}
          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Before You Read These Results</span>
            <strong>Statistics measure the look of randomness, not the strength of a secret.</strong>
            <p className="comparison-copy cryptanalysis-help-copy">
              A Caesar cipher and ChaCha20 can both produce a flat frequency distribution at this sample size.
              Use these charts to understand what each test reveals — and what it misses.
            </p>
          </div>

          {/* Configuration + Run button */}
          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Configuration</span>
            <strong>Output sweep</strong>
            {flippableSources.filter((s) => s.kind !== 'text-symbol-bridge').length > 0 ? (
              <div className="content-filter-row">
                <label className="param-field">
                  <span>Sweep source</span>
                  <select
                    value={outputStatsSourceId ?? flippableSources.find((s) => s.kind !== 'text-symbol-bridge')?.moduleId ?? ''}
                    onChange={(event) => setOutputStatsSourceId(event.target.value)}
                  >
                    {flippableSources
                      .filter((s) => s.kind !== 'text-symbol-bridge')
                      .map((source) => (
                        <option key={source.moduleId} value={source.moduleId}>
                          {source.kind === 'symbol-source'
                            ? `${source.moduleName} (A\u2013Z)`
                            : `${source.moduleName} (${source.bits.length} bits)`}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            ) : null}
            {outputStatsActiveSinkOptions.length > 0 ? (
              <div className="content-filter-row">
                <label className="param-field">
                  <span>Observe output</span>
                  <select
                    value={outputStatsSinkId ?? outputStatsActiveSinkOptions[0]?.moduleId ?? ''}
                    onChange={(event) => setOutputStatsSinkId(event.target.value)}
                  >
                    {outputStatsActiveSinkOptions.map((option) => (
                      <option key={option.moduleId} value={option.moduleId}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            {/* Sweep mode selector */}
            {effectiveOutputStatsSweepSource?.kind !== 'symbol-source' && (
              <div className="content-filter-row">
                <label className="param-field">
                  <span>Sweep mode</span>
                  <select
                    value={outputStatsSweepMode}
                    onChange={(event) => setOutputStatsSweepMode(event.target.value as 'value' | 'bitflip')}
                  >
                    <option value="bitflip">Bit-flip variants — flip each input bit in turn (recommended for wide keys)</option>
                    <option value="value">Enumerate inputs — increment from 0 (best for narrow sources ≤8 bits)</option>
                  </select>
                </label>
              </div>
            )}
            {flippableSources.filter((s) => s.kind !== 'text-symbol-bridge').length === 0 || outputStatsActiveSinkOptions.length === 0 ? (
              <p className="comparison-copy">
                This workspace needs at least one sweepable source (BitSource, HexSource, AsciiSource, or TextInput) and at least one output sink.
              </p>
            ) : (
              <div className="comparison-actions">
                <button
                  type="button"
                  className="mini-action-button"
                  disabled={outputStatsRunning}
                  onClick={() => {
                    const effectiveSinkId =
                      outputStatsSinkId ?? outputStatsActiveSinkOptions[0]?.moduleId ?? null;
                    const sweepSource = effectiveOutputStatsSweepSource;

                    if (!sweepSource || !effectiveSinkId) {
                      setOutputStatsError('Select a source and sink to run analysis.');
                      return;
                    }

                    if (sweepSource.kind === 'text-symbol-bridge') {
                      setOutputStatsError('Text-bridge sources cannot be swept numerically. Use a BitSource or HexSource.');
                      return;
                    }

                    setOutputStatsRunning(true);
                    setOutputStatsError(null);
                    outputStatsAbortRef.current = false;

                    setTimeout(() => {
                      if (outputStatsAbortRef.current) return;

                      if (sweepSource.kind === 'symbol-source') {
                        // Symbol sweep: iterate A–Z, collect character outputs
                        const symbolResult = runSymbolSweep(project, sweepSource, registry, effectiveSinkId);
                        if (symbolResult.outputChars.filter((c) => c !== null).length < 1) {
                          setOutputStatsError('No symbol outputs collected. Check that the project runs and has a symbol output sink.');
                          setOutputStatsRunning(false);
                          return;
                        }
                        setOutputStatsSymbolResult(symbolResult);
                        setOutputStatsResult(null);
                        setOutputStatsKeyDep(null);
                        setOutputStatsRunning(false);
                        return;
                      }

                      let observations: number[][];
                      let outputWidth: number;
                      let errors: number;
                      let sampleKind: 'exhaustive' | 'sampled' | 'bit-flip';

                      if (outputStatsSweepMode === 'bitflip') {
                        // Bit-flip sweep: flip each source bit in turn, collect one output per flip.
                        // For a 128-bit key: 128 observations × 16 bytes = 2,048 byte values for
                        // scatter/entropy — enough for clear visual results.
                        const result = runBitFlipOutputSweep(project, sweepSource, registry, effectiveSinkId);
                        observations = result.observations;
                        outputWidth = result.outputWidth;
                        errors = result.errors;
                        sampleKind = 'bit-flip';
                      } else {
                        // Value sweep: increment input from 0 upward (up to 256 samples)
                        const sweepCount = Math.min(256, Math.pow(2, sweepSource.bits.length));
                        sampleKind = sweepCount === Math.pow(2, sweepSource.bits.length) ? 'exhaustive' : 'sampled';
                        const result = runOutputStatsSweep(project, sweepSource, registry, effectiveSinkId, sweepCount);
                        observations = result.observations;
                        outputWidth = result.outputWidth;
                        errors = result.errors;
                      }

                      if (observations.length < 8) {
                        setOutputStatsError(
                          `Too few successful observations (${observations.length} — ${errors} errors). Check that the project runs without errors.`,
                        );
                        setOutputStatsRunning(false);
                        return;
                      }

                      const keyDep = runKeyDependencyCheck(
                        project,
                        sweepSource,
                        registry,
                        effectiveSinkId,
                        execution,
                      );
                      setOutputStatsKeyDep(keyDep);

                      const stats = computeOutputStatistics(
                        observations,
                        outputWidth,
                        sampleKind,
                        keyDep.keyModuleFound ? keyDep.confirmed : null,
                      );
                      setOutputStatsResult(stats);
                      setOutputStatsSymbolResult(null);
                      setOutputStatsRunning(false);
                    }, 0);
                  }}
                >
                  {outputStatsRunning ? 'Running…' : (outputStatsResult ?? outputStatsSymbolResult) ? 'Re-run Analysis' : 'Run Analysis'}
                </button>
              </div>
            )}
            {outputStatsError ? (
              <p className="comparison-copy" style={{ color: 'var(--signal-warn)' }}>
                {outputStatsError}
              </p>
            ) : null}
            {outputStatsResult ? (
              <>
                <div className="cryptanalysis-output-summary-row">
                  <span className="content-status-chip">
                    {outputStatsResult.observationCount} observations
                    {outputStatsResult.isWideOutput ? ` → ${outputStatsResult.observationCount * Math.floor(outputStatsResult.outputWidth / 8)} bytes` : ''}
                  </span>
                  <span className="content-status-chip">
                    {outputStatsResult.sampleKind === 'exhaustive' ? 'exhaustive sweep' : outputStatsResult.sampleKind === 'bit-flip' ? 'bit-flip sweep' : 'value sweep'}
                  </span>
                  {outputStatsResult.isWideOutput ? (
                    <span className="content-status-chip status-chip-warning">projected bytes</span>
                  ) : null}
                  <span className={`content-status-chip ${getOutputStatsProfileChipClass(outputStatsResult.profileLabel)}`}>
                    {outputStatsResult.profileLabel}
                  </span>
                </div>
                {outputStatsResult.isWideOutput ? (
                  <p className="comparison-copy cryptanalysis-help-copy">
                    Wide outputs are projected into byte-sized units for the frequency, entropy, and correlation sections.
                    Those sections describe byte-level structure, not the full {outputStatsResult.outputWidth}-bit output word as one symbol.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          {/* Key dependency check */}
          {outputStatsKeyDep ? (
            <div className={`comparison-card comparison-card-wide ${
              outputStatsKeyDep.confirmed === false ? 'cryptanalysis-modern-callout' : ''
            }`}>
              <span className="meta-label">Key Dependency</span>
              {outputStatsKeyDep.confirmed === false ? (
                <>
                  <strong>The output does not change when the key changes.</strong>
                  <p className="comparison-copy">
                    Flipping the first bit of the detected key module produced identical output.
                    This workspace behaves like a scrambler, not a cipher — the statistics below
                    describe the output distribution, but without key dependency, any uniformity is
                    meaningless from a security standpoint.
                  </p>
                  <p className="comparison-copy cryptanalysis-help-copy">
                    Check that the key source module is connected to the cipher path.
                  </p>
                </>
              ) : outputStatsKeyDep.confirmed === true ? (
                <>
                  <strong>Confirmed — output changes with the key.</strong>
                  <p className="comparison-copy">
                    Flipping the first bit of the detected key module changed{' '}
                    <strong>{outputStatsKeyDep.bitsChanged}</strong> output bits.
                  </p>
                </>
              ) : !outputStatsKeyDep.keyModuleFound ? (
                <>
                  <strong>No key source detected.</strong>
                  <p className="comparison-copy">
                    No source module was found separate from the sweep source. A cipher requires
                    a key — without one, any statistical uniformity reflects the function's structure,
                    not a secret.
                  </p>
                </>
              ) : (
                <p className="comparison-copy">Key dependency check could not complete.</p>
              )}
            </div>
          ) : null}

          {/* Symbol sweep results (classical symbol-domain ciphers) */}
          {outputStatsSymbolResult ? (
            <>
              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Character Frequency</span>
                <strong>
                  {outputStatsSymbolResult.isPermutation
                    ? 'Perfect permutation — every letter maps to a different letter.'
                    : `Collision detected — ${26 - Object.keys(outputStatsSymbolResult.charFreq).length} letters missing from output.`}
                </strong>
                <p className="comparison-copy cryptanalysis-help-copy">
                  Each of the 26 input letters (A–Z) was fed to the cipher once.
                  A permutation cipher maps each input to a unique output,
                  producing a flat distribution. A flat distribution does not mean the cipher is strong —
                  a Caesar shift is also a permutation.
                </p>
                <div className="output-stats-balance-chart" role="img" aria-label="Character frequency bars">
                  {SYMBOL_SWEEP_ALPHABET.split('').map((ch) => {
                    const count = outputStatsSymbolResult.charFreq[ch] ?? 0;
                    return (
                      <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ flex: '0 0 18px', fontSize: 11, textAlign: 'right', color: 'var(--ink-secondary)', fontFamily: 'monospace' }}>{ch}</span>
                        <div className="output-stats-bar-track" style={{ flex: '1 1 auto' }}>
                          <div
                            className="output-stats-bar-fill"
                            style={{
                              width: `${count * 100}%`,
                              background: count === 0 ? 'var(--signal-error)' : count === 1 ? 'color-mix(in srgb, var(--accent) 82%, transparent)' : 'color-mix(in srgb, #d97706 70%, transparent)',
                            }}
                          />
                        </div>
                        <span style={{ flex: '0 0 16px', fontSize: 11, color: 'var(--ink-secondary)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Self-Mapping Check</span>
                {outputStatsSymbolResult.selfMappings.length === 0 ? (
                  <>
                    <strong>No letter maps to itself.</strong>
                    <p className="comparison-copy">
                      The Enigma was specifically designed so no letter could encrypt to itself.
                      This was both a mathematical consequence of the reflector and a known cryptographic weakness —
                      an intercepted message could never contain the original plaintext letter at the same position.
                    </p>
                  </>
                ) : (
                  <>
                    <strong>
                      {outputStatsSymbolResult.selfMappings.length === 1
                        ? `1 letter maps to itself: ${outputStatsSymbolResult.selfMappings[0]}`
                        : `${outputStatsSymbolResult.selfMappings.length} letters map to themselves: ${outputStatsSymbolResult.selfMappings.join(', ')}`}
                    </strong>
                    <p className="comparison-copy cryptanalysis-help-copy">
                      A letter mapping to itself is a fixed point in the permutation.
                      The original Enigma reflector was designed to prevent this, but not all substitution ciphers share that constraint.
                    </p>
                  </>
                )}
              </div>

              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Mapping Table</span>
                <strong>Input → Output for each letter</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: 4, marginTop: 10 }}>
                  {outputStatsSymbolResult.inputChars.map((ch, i) => {
                    const out = outputStatsSymbolResult.outputChars[i];
                    const isSelf = out === ch;
                    return (
                      <div
                        key={ch}
                        style={{
                          padding: '4px 6px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: isSelf
                            ? 'color-mix(in srgb, #d97706 12%, var(--surface-1))'
                            : out === null
                            ? 'color-mix(in srgb, var(--signal-error) 10%, var(--surface-1))'
                            : 'var(--surface-1)',
                          textAlign: 'center',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: 'var(--ink-secondary)' }}>{ch}</span>
                        <span style={{ color: 'var(--ink-secondary)', margin: '0 2px' }}>→</span>
                        <strong style={{ color: isSelf ? '#d97706' : out === null ? 'var(--signal-error)' : 'var(--ink)' }}>
                          {out ?? '?'}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {outputStatsResult ? (
            <>
              {/* Section 1: Byte Frequency */}
              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">
                  {outputStatsResult.analysisUnitLabel === 'projected byte' ? 'Byte Frequency' : 'Value Frequency'}
                  {getFrequencyValidityBadge(outputStatsResult.byteFrequency)}
                </span>
                <strong>
                  {outputStatsResult.byteFrequency.validity === 'coarse-buckets'
                    ? `${outputStatsResult.byteFrequency.bucketCount}-bucket coarse distribution`
                    : `${outputStatsResult.byteFrequency.bucketCount}-bucket distribution`}
                </strong>
                <p className="comparison-copy cryptanalysis-help-copy">
                  This section measures frequency imbalance only. A bijective cipher swept across all its inputs can look flat here, and a flat result does not distinguish a simple permutation from a strong cipher.
                </p>
                {outputStatsResult.byteFrequency.validity === 'coarse-buckets' ? (
                  <p className="comparison-copy cryptanalysis-help-copy">
                    The sample is too small for a trustworthy 256-bucket chi-squared test, so the engine grouped values into {outputStatsResult.byteFrequency.bucketCount} coarse buckets instead.
                    Read this as a rough shape check, not a full byte-frequency verdict.
                  </p>
                ) : null}
                <div className="output-stats-freq-chart" role="img" aria-label="Byte frequency histogram">
                  {renderFrequencyBars(
                    outputStatsResult.byteFrequency.counts,
                    outputStatsResult.byteFrequency.expectedCount,
                  )}
                </div>
                {outputStatsResult.byteFrequency.sampleValid ? (
                  <p className="comparison-copy">
                    χ² = <strong>{outputStatsResult.byteFrequency.chiSquared.toFixed(1)}</strong>
                    {' '}| p = <strong>{outputStatsResult.byteFrequency.chiSquaredPValue.toFixed(3)}</strong>
                    {' '}| max deviation bucket {outputStatsResult.byteFrequency.maxDeviationBucket}
                    {' '}({(outputStatsResult.byteFrequency.maxDeviationFraction * 100).toFixed(0)}% from expected)
                  </p>
                ) : (
                  <p className="comparison-copy cryptanalysis-help-copy">
                    Chi-squared is not applicable here because the expected count per bucket is too low.
                    Increase sweep count or use a narrower natural output unit if you need a stronger frequency test.
                  </p>
                )}
              </div>

              {/* Section 2: Bit Balance */}
              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">
                  Bit Balance
                  {getBitBalanceValidityBadge(outputStatsResult.bitBalance)}
                </span>
                <strong>
                  {(outputStatsResult.bitBalance.onesFraction * 100).toFixed(1)}% ones across all output bits
                </strong>
                <p className="comparison-copy cryptanalysis-help-copy">
                  A stuck bit position — one that is almost always 0 or always 1 — carries almost no information. This is a balance check only, not a randomness verdict.
                </p>
                <BitBalanceHeatmap fractions={outputStatsResult.bitBalance.perPositionFractions} />
                <p className="comparison-copy" style={{ marginTop: 10 }}>
                  Monobit p-value: <strong>
                    {outputStatsResult.bitBalance.sampleValid
                      ? outputStatsResult.bitBalance.monobitPValue.toFixed(4)
                      : 'n/a (insufficient sample)'}
                  </strong>
                  {' '}| ones fraction: <strong>{(outputStatsResult.bitBalance.onesFraction * 100).toFixed(1)}%</strong>
                </p>
              </div>

              {/* Section 3: Shannon Entropy */}
              <div className="comparison-card">
                <span className="meta-label">
                  {outputStatsResult.isWideOutput ? 'Byte Entropy (per projected byte)' : 'Value Entropy'}
                  {getEntropyValidityBadge(outputStatsResult.byteEntropy)}
                </span>
                <strong>
                  {outputStatsResult.byteEntropy.shannonEntropy.toFixed(3)} bits
                  {' '}/ {outputStatsResult.isWideOutput ? '8-bit' : `${outputStatsResult.outputWidth}-bit`} max
                </strong>
                {outputStatsResult.isWideOutput ? (
                  <p className="comparison-copy cryptanalysis-help-copy" style={{ marginTop: 4 }}>
                    Wide output analyzed at byte granularity — each {outputStatsResult.outputWidth}-bit cipher word contributes {Math.floor(outputStatsResult.outputWidth / 8)} byte values to this distribution.
                  </p>
                ) : null}
                {/* Gauge with reference markers */}
                {(() => {
                  const maxH = outputStatsResult.isWideOutput ? 8 : outputStatsResult.outputWidth;
                  const H = outputStatsResult.byteEntropy.shannonEntropy;
                  const pct = Math.min((H / maxH) * 100, 100);
                  const fillColor =
                    H / maxH > 0.92 ? 'rgba(64,168,255,0.85)' :
                    H / maxH > 0.70 ? 'rgba(200,140,40,0.85)' :
                                      'rgba(210,50,40,0.85)';
                  const markers: Array<{ val: number; label: string }> = maxH >= 7
                    ? [{ val: 0, label: '0' }, { val: 3.5 / maxH, label: '3.5\nEng' }, { val: 6.5 / maxH, label: '6.5' }, { val: 7.9 / maxH, label: '7.9\nAES' }, { val: 1, label: maxH.toFixed(0) }]
                    : [{ val: 0, label: '0' }, { val: 0.5, label: (maxH / 2).toFixed(0) }, { val: 1, label: maxH.toFixed(0) }];
                  return (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ position: 'relative', height: 20, borderRadius: 999, background: 'color-mix(in srgb, var(--surface-soft) 88%, var(--surface-1))', border: '1px solid var(--border)', overflow: 'visible' }}>
                        <div style={{ height: '100%', borderRadius: 999, width: `${pct.toFixed(1)}%`, background: fillColor, transition: 'width 0.4s ease' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', mixBlendMode: 'overlay' }}>
                            {H.toFixed(3)} bits
                          </span>
                        </div>
                      </div>
                      <div style={{ position: 'relative', height: 20, marginTop: 2 }}>
                        {markers.map(({ val, label }) => (
                          <span key={val} style={{
                            position: 'absolute',
                            left: `${(val * 100).toFixed(1)}%`,
                            transform: 'translateX(-50%)',
                            fontSize: 9,
                            color: 'var(--ink-secondary)',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre',
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}>{label}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <p className="comparison-copy" style={{ marginTop: 6 }}>
                  {(outputStatsResult.byteEntropy.entropyFraction * 100).toFixed(1)}% of max
                  {' '}· {outputStatsResult.byteEntropy.uniqueValueCount} of{' '}
                  {outputStatsResult.isWideOutput ? '256' : Math.min(Math.pow(2, outputStatsResult.outputWidth), 65536).toFixed(0)} distinct {outputStatsResult.isWideOutput ? 'byte values' : 'values'} seen
                </p>
                <p className="comparison-copy cryptanalysis-help-copy">
                  High entropy is descriptive only. It tells you the observed values are spread out, not that the source is unpredictable or secure.
                </p>
              </div>

              {/* Section 4: Sequential Correlation */}
              <div className="comparison-card">
                <span className="meta-label">
                  {outputStatsResult.analysisUnitLabel === 'projected byte' ? 'Adjacent-Byte Correlation' : 'Sequential Correlation'}
                  {getCorrelationValidityBadge(outputStatsResult.correlation)}
                </span>
                <strong>
                  r = {outputStatsResult.correlation.serialCorrelationCoefficient.toFixed(3)}
                  {Math.abs(outputStatsResult.correlation.serialCorrelationCoefficient) > 0.3 ? ' — linear structure detected' : ' — no obvious linear structure'}
                </strong>
                <p className="comparison-copy cryptanalysis-help-copy">
                  {outputStatsResult.isWideOutput
                    ? `Each dot = (byte[i], byte[i+1]) across ${outputStatsResult.correlation.valuePairs} consecutive projected bytes. This is only a lag-1 linear-dependence check.`
                    : 'Each dot = (output[i], output[i+1]). This is only a lag-1 linear-dependence check, so nonlinear or longer-range structure can still be present.'}
                </p>
                <ScatterCanvas
                  grid={outputStatsResult.correlation.scatterGrid}
                  gridSize={outputStatsResult.correlation.gridSize}
                />
                <p className="comparison-copy" style={{ fontSize: '0.7rem', color: 'var(--ink-secondary)', marginTop: 4 }}>
                  {outputStatsResult.isWideOutput
                    ? `${outputStatsResult.correlation.valuePairs} byte pairs · ${outputStatsResult.correlation.gridSize}×${outputStatsResult.correlation.gridSize} grid (${outputStatsResult.correlation.bucketDivisor} bytes/cell)`
                    : outputStatsResult.correlation.bucketDivisor > 1
                      ? `Values bucketed into ${outputStatsResult.correlation.gridSize}×${outputStatsResult.correlation.gridSize} grid (${outputStatsResult.correlation.valuePairs} pairs).`
                      : `${outputStatsResult.correlation.valuePairs} value pairs`}
                </p>
              </div>

              {/* Section 5: Runs Uniformity */}
              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">
                  Runs Uniformity
                  {getRunsValidityBadge(outputStatsResult.runs)}
                </span>
                <strong>
                  {outputStatsResult.runs.totalRuns} runs
                  {' '}(expected ~{outputStatsResult.runs.expectedRuns.toFixed(0)})
                </strong>
                <p className="comparison-copy cryptanalysis-help-copy">
                  In a random bit stream, half of all runs have length 1, a quarter have length 2, and so on.
                  Bars show observed (solid) vs expected geometric distribution (reference).
                </p>
                <div className="output-stats-runs-chart" role="img" aria-label="Run length distribution">
                  {renderRunsChart(
                    outputStatsResult.runs.runLengthCounts,
                    outputStatsResult.runs.expectedRunLengthCounts,
                  )}
                </div>
                <p className="comparison-copy">
                  Runs test p-value: <strong>
                    {outputStatsResult.runs.sampleValid
                      ? outputStatsResult.runs.runsTestPValue.toFixed(4)
                      : outputStatsResult.runs.prerequisitePasses
                        ? 'n/a (insufficient sample)'
                        : 'n/a (monobit prerequisite failed)'}
                  </strong>
                </p>
                {outputStatsResult.runs.validity === 'prerequisite-failed' ? (
                  <p className="comparison-copy cryptanalysis-help-copy">
                    The runs test is intentionally withheld when the monobit prerequisite fails. If the stream is already too imbalanced, run-count significance is not trustworthy.
                  </p>
                ) : null}
              </div>

              {/* Narrative summary */}
              <div className="comparison-card comparison-card-wide">
                <span className="meta-label">Summary</span>
                <strong>What this sample looks like</strong>
                <p className="comparison-copy">
                  {generateNarrativeSummary(outputStatsResult)}
                </p>
              </div>
            </>
          ) : !outputStatsRunning && !outputStatsSymbolResult ? (
            <div className="comparison-card comparison-card-wide">
              <span className="meta-label">Ready</span>
              <strong>Click Run Analysis to sweep the workspace.</strong>
              <p className="comparison-copy">
                {outputStatsIsSymbolMode
                  ? 'The engine will feed each letter A–Z through the cipher and map the full input→output substitution table.'
                  : outputStatsSweepMode === 'bitflip'
                    ? <>
                        Bit-flip sweep: flips each bit of your source in turn, collects one output per flip.
                        {' '}<strong>{effectiveOutputStatsSweepSource?.bits.length ?? 'N'} observations</strong>
                        {effectiveOutputStatsSweepSource && effectiveOutputStatsSweepSource.bits.length > 30
                          ? <> × {Math.floor(effectiveOutputStatsSweepSource.bits.length / 8)} bytes each = <strong>{Math.floor(effectiveOutputStatsSweepSource.bits.length / 8) * (effectiveOutputStatsSweepSource?.bits.length ?? 0)} byte values</strong> for entropy and scatter.</>
                          : '.'}
                      </>
                    : <>
                        The engine will run your workspace across{' '}
                        <strong>
                          {(() => {
                            const src = effectiveOutputStatsSweepSource;
                            if (!src) return 'N';
                            return Math.min(256, Math.pow(2, src.bits.length)).toFixed(0);
                          })()}
                        </strong>{' '}
                        distinct inputs, then compute bit balance, entropy, byte frequency, sequential correlation, and runs uniformity.
                      </>}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
      <div className="comparison-grid">
        <AnalysisCaseManager
          draftName={caseDraftName}
          savedCases={savedAnalysisCases.filter((savedCase) => savedCase.mode === 'classical')}
          modeLabel="Classical"
          onDraftNameChange={setCaseDraftName}
          onSave={() => {
            if (caseDraftName.trim().length === 0) {
              return;
            }
            onSaveAnalysisCase(caseDraftName.trim());
            setCaseDraftName('');
          }}
          onLoad={onLoadAnalysisCase}
          onUpdate={onUpdateAnalysisCase}
          onRename={onRenameAnalysisCase}
          onDelete={onDeleteAnalysisCase}
        />
        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Ciphertext Input</span>
          <label className="param-field cryptanalysis-textarea-field">
            <span>Paste Ciphertext</span>
            <textarea
              value={ciphertext}
              onChange={(event) => onCiphertextChange(event.target.value)}
              placeholder="LXFOPVEFRNHR"
              rows={8}
            />
          </label>
          <p className="comparison-copy">
            Use the evidence below to choose a likely period, then tune one column at a time by
            aligning its shifted letter frequencies with English.
          </p>
        </div>

        <div className="comparison-card">
          <span className="meta-label">Global Summary</span>
          <strong>
            {analysis ? `${analysis.letterCount} normalized letters` : 'No ciphertext loaded'}
          </strong>
          <p className="comparison-copy">
            Unique letters: <strong>{analysis ? analysis.uniqueLetterCount : 'n/a'}</strong>
          </p>
          <p className="comparison-copy">
            IOC:{' '}
            <strong>
              {analysis?.indexOfCoincidence !== null && analysis
                ? analysis.indexOfCoincidence.toFixed(3)
                : 'n/a'}
            </strong>
          </p>
          <p className="comparison-copy cryptanalysis-help-copy">
            For English text, IOC often trends toward <strong>0.067</strong>. Candidate periods
            whose column-average IOC rises toward that range deserve closer attention.
          </p>
          <p className="comparison-copy">
            Top letters: <strong>{formatTopLetters(analysis?.topLetters ?? [])}</strong>
          </p>
        </div>

        <div className="comparison-card">
          <span className="meta-label">N-Gram Snapshot</span>
          <strong>Fast evidence view</strong>
          <p className="comparison-copy">
            Top bigrams: <strong>{formatTopNGrams(analysis?.topBigrams ?? [])}</strong>
          </p>
          <p className="comparison-copy">
            Top trigrams: <strong>{formatTopNGrams(analysis?.topTrigrams ?? [])}</strong>
          </p>
          <p className="comparison-copy">
            Normalized preview:{' '}
            <strong>{analysis ? truncateText(analysis.normalizedText) : 'n/a'}</strong>
          </p>
        </div>

        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Repeated Fragment Evidence</span>
          <strong>Kasiski-style repetition hints</strong>
          {analysis && analysis.repeatedFragments.length > 0 ? (
            <div className="cryptanalysis-list">
              {analysis.repeatedFragments.map((entry) => (
                <p key={`${entry.fragment}-${entry.positions.join('-')}`} className="comparison-copy">
                  <strong>{entry.fragment}</strong> at {entry.positions.join(', ')}
                  {' '}| distances {entry.distances.join(', ')}
                </p>
              ))}
            </div>
          ) : (
            <p className="comparison-copy">
              No repeated fragments detected yet. Longer ciphertext usually gives stronger evidence.
            </p>
          )}
        </div>

        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Candidate Key Lengths</span>
          <strong>IOC plus repetition support</strong>
          {analysis && analysis.candidatePeriods.length > 0 ? (
            <div className="cryptanalysis-period-chart" role="list" aria-label="Candidate period comparison">
              {candidatePeriodChart.map((entry) => (
                <button
                  key={entry.period}
                  type="button"
                  className={
                    effectivePeriod === entry.period
                      ? 'cryptanalysis-period-row cryptanalysis-period-row-active'
                      : 'cryptanalysis-period-row'
                  }
                  onClick={() => onClassicalSelectedPeriodChange(entry.period)}
                >
                  <div className="cryptanalysis-period-copy">
                    <span className="meta-label">Period {entry.period}</span>
                    <strong>
                      IOC {entry.averageIndexOfCoincidence !== null
                        ? entry.averageIndexOfCoincidence.toFixed(3)
                        : 'n/a'}
                    </strong>
                    <span className="comparison-copy">
                      Support {entry.supportingDistanceCount}
                    </span>
                  </div>
                  <div className="cryptanalysis-period-bars">
                    <div className="cryptanalysis-period-bar-group">
                      <span className="cryptanalysis-period-bar-label">IOC</span>
                      <div className="cryptanalysis-period-bar-track">
                        <div
                          className="cryptanalysis-period-bar-fill cryptanalysis-period-bar-fill-ioc"
                          style={{ width: `${Math.max(entry.iocBarPercent, entry.averageIndexOfCoincidence ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                    <div className="cryptanalysis-period-bar-group">
                      <span className="cryptanalysis-period-bar-label">Support</span>
                      <div className="cryptanalysis-period-bar-track">
                        <div
                          className="cryptanalysis-period-bar-fill cryptanalysis-period-bar-fill-support"
                          style={{ width: `${Math.max(entry.supportBarPercent, entry.supportingDistanceCount > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <p className="comparison-copy cryptanalysis-help-copy">
                Click a candidate period to drive the column-analysis workflow below.
              </p>
            </div>
          ) : (
            <p className="comparison-copy">
              Enter more ciphertext to estimate candidate Vigenere periods.
            </p>
          )}
        </div>

        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Column Analysis</span>
          <div className="content-filter-row">
            <label className="param-field">
              <span>Inspect Period</span>
              <select
                value={effectivePeriod}
                onChange={(event) => onClassicalSelectedPeriodChange(Number(event.target.value))}
                disabled={availablePeriods.length === 0}
              >
                {availablePeriods.length === 0 ? (
                  <option value={1}>No candidates yet</option>
                ) : (
                  availablePeriods.map((period) => (
                    <option key={period} value={period}>
                      Period {period}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
          {columnAnalysis.length > 0 ? (
            <div className="cryptanalysis-column-summary-row">
              {columnAnalysis.map((column) => (
                <button
                  key={column.columnIndex}
                  type="button"
                  className={
                    effectiveColumnIndex === column.columnIndex
                      ? 'cryptanalysis-column-summary cryptanalysis-column-summary-active'
                      : 'cryptanalysis-column-summary'
                  }
                  onClick={() => onClassicalSelectedColumnIndexChange(column.columnIndex)}
                >
                  <span className="meta-label">Column {column.columnIndex + 1}</span>
                    <strong>{getSelectedKeyLetter(
                    column,
                    classicalSelectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, column.columnIndex)],
                  )}</strong>
                  <span className="cryptanalysis-column-summary-ioc">
                    IOC {column.indexOfCoincidence !== null
                      ? column.indexOfCoincidence.toFixed(3)
                      : 'n/a'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="comparison-copy">
              Choose a candidate period to split the ciphertext into Vigenere columns.
            </p>
          )}
        </div>

        {activeColumn ? (
          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Frequency Matching Workshop</span>
            <strong>
              Column {activeColumn.columnIndex + 1} with key letter {getSelectedKeyLetter(
                activeColumn,
                classicalSelectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)],
              )}
            </strong>
            <p className="comparison-copy">
              Slide the shift until the blue column frequencies line up with the amber English bars.
            </p>
            <div className="cryptanalysis-shift-control-row">
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  onClassicalSelectedShiftChange(
                    getColumnShiftKey(effectivePeriod, activeColumn.columnIndex),
                    (
                      (classicalSelectedShiftsByColumnKey[
                        getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)
                      ] ?? activeColumn.topShiftCandidates[0]?.shift ?? 0) + 25
                    ) % 26,
                  )
                }
              >
                Shift Left
              </button>
              <label className="param-field cryptanalysis-shift-slider">
                <span>
                  Shift {activeColumnShift} ({String.fromCharCode(65 + activeColumnShift)})
                </span>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={activeColumnShift}
                  onChange={(event) =>
                    onClassicalSelectedShiftChange(
                      getColumnShiftKey(effectivePeriod, activeColumn.columnIndex),
                      Number(event.target.value),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  onClassicalSelectedShiftChange(
                    getColumnShiftKey(effectivePeriod, activeColumn.columnIndex),
                    (
                      (classicalSelectedShiftsByColumnKey[
                        getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)
                      ] ?? activeColumn.topShiftCandidates[0]?.shift ?? 0) + 1
                    ) % 26,
                  )
                }
              >
                Shift Right
              </button>
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  onClassicalSelectedShiftChange(
                    getColumnShiftKey(effectivePeriod, activeColumn.columnIndex),
                    activeColumn.topShiftCandidates[0]?.shift ?? 0,
                  )
                }
              >
                Use Best Fit
              </button>
            </div>
            <p className="comparison-copy cryptanalysis-help-copy">
              Best fit suggestion:{' '}
              <strong>
                {activeColumn.topShiftCandidates[0]
                  ? `${activeColumn.topShiftCandidates[0].keyLetter} (${activeColumn.topShiftCandidates[0].score.toFixed(1)})`
                  : 'n/a'}
              </strong>
            </p>
            {activeShiftConfidence.length > 0 ? (
              <div className="cryptanalysis-shift-confidence" role="list" aria-label="Top shift confidence">
                {activeShiftConfidence.map((entry, index) => (
                  <div key={`shift-confidence-${entry.shift}`} className="cryptanalysis-shift-confidence-row">
                    <div className="cryptanalysis-shift-confidence-copy">
                      <span className="meta-label">
                        {index === 0 ? 'Best fit' : `Candidate ${index + 1}`}
                      </span>
                      <strong>
                        {entry.keyLetter} | shift {entry.shift}
                      </strong>
                      <span className="comparison-copy">
                        score {entry.score.toFixed(1)}
                        {index > 0 ? ` | +${entry.gapFromBest.toFixed(1)} from best` : ''}
                      </span>
                    </div>
                    <div className="cryptanalysis-shift-confidence-bar">
                      <div
                        className="cryptanalysis-shift-confidence-fill"
                        style={{ width: `${entry.fitPercent}%` }}
                        title={`Relative fit ${(entry.fitPercent).toFixed(1)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="cryptanalysis-frequency-chart">
              {activeGraphEntries.map((entry) => (
                <div key={entry.letter} className="cryptanalysis-frequency-column">
                  <div className="cryptanalysis-frequency-bars">
                    <div
                      className="cryptanalysis-frequency-bar cryptanalysis-frequency-bar-english"
                      style={{ height: `${Math.max(entry.english * 1440, 6)}px` }}
                      title={`English ${entry.letter}: ${(entry.english * 100).toFixed(1)}%`}
                    />
                    <div
                      className="cryptanalysis-frequency-bar cryptanalysis-frequency-bar-shifted"
                      style={{ height: `${Math.max(entry.shifted * 1440, 6)}px` }}
                      title={`Shifted ${entry.letter}: ${(entry.shifted * 100).toFixed(1)}%`}
                    />
                  </div>
                  <span className="cryptanalysis-frequency-label">{entry.letter}</span>
                </div>
              ))}
            </div>
            {activeShiftConfidence.length > 1 ? (
              <p className="comparison-copy cryptanalysis-help-copy">
                The confidence bars compare the top shifts using the existing chi-squared fit. A wide gap between the best and second-best fit usually means the column is easier to trust.
              </p>
            ) : null}
            <p className="comparison-copy">
              Column preview: <strong>{truncateText(activeColumn.text, 28)}</strong>
            </p>
          </div>
        ) : null}

        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Candidate Reconstruction</span>
          <div className="cryptanalysis-key-row">
            {candidate.key ? (
              candidate.key.split('').map((letter, index) => (
                <span key={`${letter}-${index}`} className="cryptanalysis-key-chip">
                  {letter}
                </span>
              ))
            ) : (
              <strong>No candidate key yet</strong>
            )}
          </div>
          <p className="comparison-copy">
            Plaintext preview:{' '}
            <strong>{candidate.plaintext ? truncateText(candidate.plaintext, 96) : 'n/a'}</strong>
          </p>
          <p className="comparison-copy">
            This preview reflects the currently chosen shift per column. It is meant to support
            hypothesis testing, not replace it.
          </p>
        </div>
      </div>
      )}
    </section>
  );
}

interface BitStripRowProps {
  label: string;
  bits: number[];
  changedFlags?: boolean[];
  emphasis?: 'default' | 'changed';
  compact?: boolean;
}

function BitStripRow({
  label,
  bits,
  changedFlags = [],
  emphasis = 'default',
  compact = false,
}: BitStripRowProps) {
  return (
    <div className={compact ? 'modern-bit-row modern-bit-row-compact' : 'modern-bit-row'}>
      <span className="meta-label modern-bit-row-label">{label}</span>
      <div className={compact ? 'modern-bit-strip modern-bit-strip-compact' : 'modern-bit-strip'}>
        {bits.map((bit, index) => {
          const changed = changedFlags[index] ?? false;
          return (
            <span
              key={`${label}-${index}`}
              className={[
                'modern-bit-cell',
                compact ? 'modern-bit-cell-compact' : '',
                bit === 1 ? 'modern-bit-cell-on' : 'modern-bit-cell-off',
                changed ? 'modern-bit-cell-changed' : '',
                emphasis === 'changed' ? 'modern-bit-cell-diff' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={`Bit ${index + 1}: ${bit}`}
            >
              {bit}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ModernFlipControl({
  bitLength,
  flipBit,
  changedCount,
  changedPercent,
  metricLabel = 'changed input bits',
  onChange,
}: {
  bitLength: number;
  flipBit: number;
  changedCount: number;
  changedPercent: number;
  metricLabel?: string;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <div className="cryptanalysis-shift-control-row cryptanalysis-inline-flip-control">
        <button
          type="button"
          className="mini-action-button"
          onClick={() => onChange(Math.max(0, flipBit - 1))}
        >
          Bit Left
        </button>
        <label className="param-field cryptanalysis-shift-slider">
          <span>Flip Bit {flipBit + 1}</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, bitLength - 1)}
            step={1}
            value={flipBit}
            onChange={(event) => onChange(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          className="mini-action-button"
          onClick={() => onChange(Math.min(bitLength - 1, flipBit + 1))}
        >
          Bit Right
        </button>
      </div>
      <p className="comparison-copy">
        Baseline length: <strong>{bitLength}</strong> bits
        {' '}| {metricLabel} <strong>{changedCount}</strong>
        {' '}| changed percent <strong>{(changedPercent * 100).toFixed(1)}%</strong>
      </p>
    </>
  );
}

function AnalysisCaseManager({
  draftName,
  savedCases,
  modeLabel,
  onDraftNameChange,
  onSave,
  onLoad,
  onUpdate,
  onRename,
  onDelete,
}: {
  draftName: string;
  savedCases: SavedAnalysisCase[];
  modeLabel: string;
  onDraftNameChange: (value: string) => void;
  onSave: () => void;
  onLoad: (savedCase: SavedAnalysisCase) => void;
  onUpdate: (caseId: string) => void;
  onRename: (caseId: string, name: string) => void;
  onDelete: (caseId: string) => void;
}) {
  return (
    <div className="comparison-card comparison-card-wide">
      <span className="meta-label">Saved Analysis Cases</span>
      <strong>{modeLabel} setups for this project</strong>
      <div className="content-filter-row">
        <label className="param-field">
          <span>Case Name</span>
          <input
            type="text"
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder={`${modeLabel} case`}
          />
        </label>
        <button
          type="button"
          className="mini-action-button"
          onClick={onSave}
          disabled={draftName.trim().length === 0}
        >
          Save Case
        </button>
      </div>
      {savedCases.length > 0 ? (
        <div className="cryptanalysis-list">
          {savedCases.map((savedCase) => (
            <div key={savedCase.id} className="cryptanalysis-output-summary-row">
              <span className="content-status-chip">
                <strong>{savedCase.name}</strong>
              </span>
              <button type="button" className="mini-action-button" onClick={() => onLoad(savedCase)}>
                Load
              </button>
              <button type="button" className="mini-action-button" onClick={() => onUpdate(savedCase.id)}>
                Update
              </button>
              <button
                type="button"
                className="mini-action-button"
                onClick={() => {
                  const nextName = window.prompt('Rename saved analysis case', savedCase.name);
                  if (nextName && nextName.trim().length > 0) {
                    onRename(savedCase.id, nextName.trim());
                  }
                }}
              >
                Rename
              </button>
              <button type="button" className="mini-action-button" onClick={() => onDelete(savedCase.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="comparison-copy">
          Save a setup here to return to the same analysis controls later without rebuilding them by hand.
        </p>
      )}
    </div>
  );
}

function formatTopLetters(entries: { letter: string; count: number; share: number }[]) {
  if (entries.length === 0) {
    return 'n/a';
  }

  return entries.map((entry) => `${entry.letter}:${entry.count}`).join(', ');
}

function formatTopNGrams(entries: { gram: string; count: number; share: number }[]) {
  if (entries.length === 0) {
    return 'n/a';
  }

  return entries.map((entry) => `${entry.gram}:${entry.count}`).join(', ');
}

function truncateText(value: string, maxLength = 48) {
  if (value.length === 0) {
    return 'n/a';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}…`;
}

function getColumnShiftKey(period: number, columnIndex: number) {
  return `${period}:${columnIndex}`;
}

function getSelectedKeyLetter(
  column: {
    shiftCandidates: { shift: number; keyLetter: string }[];
    topShiftCandidates: { shift: number; keyLetter: string }[];
  },
  selectedShift: number | undefined,
) {
  const effectiveShift = selectedShift ?? column.topShiftCandidates[0]?.shift ?? 0;
  return (
    column.shiftCandidates.find((entry) => entry.shift === effectiveShift)?.keyLetter ??
    column.topShiftCandidates[0]?.keyLetter ??
    '?'
  );
}

function getFlippableSourceKindLabel(kind: 'bit-source' | 'hex-source' | 'ascii-source' | 'text-symbol-bridge' | 'symbol-source') {
  switch (kind) {
    case 'bit-source':
      return 'BitSource';
    case 'hex-source':
      return 'HexSource';
    case 'ascii-source':
      return 'AsciiSource';
    case 'text-symbol-bridge':
      return 'TextInput → SymbolToBits';
    case 'symbol-source':
      return 'TextInput (A–Z)';
  }
}

function getBitSignalForSink(result: ExecutionResult | null, moduleId: string): number[] | null {
  if (!result) {
    return null;
  }

  const traceEntry =
    result.trace.find((entry) => entry.moduleId === moduleId && isOutputSinkDefId(entry.defId)) ?? null;
  const signal =
    result.outputsByModuleId[moduleId]?.out ??
    traceEntry?.outputs.out ??
    traceEntry?.inputs.in ??
    null;

  return signal?.type === 'bits' ? signal.value : null;
}

function getBitstreamSinkOptions(
  project: Project,
  execution: ExecutionResult | null,
  tickedExecution: TickedExecutionResult | null,
  isTickedMode: boolean,
) {
  return project.modules
    .filter((moduleInstance) => isOutputSinkDefId(moduleInstance.defId))
    .map((moduleInstance) => {
      if (isTickedMode && tickedExecution) {
        const firstTickBits = getBitSignalForSink(tickedExecution.ticks[0] ?? null, moduleInstance.id);
        if (!firstTickBits) {
          return null;
        }

        return {
          moduleId: moduleInstance.id,
          label: moduleInstance.id,
          bits: parseBitString(collectTickedOutput(tickedExecution, moduleInstance.id)),
          sourceLabel: 'collected ticked stream',
        };
      }

      const bits = getBitSignalForSink(execution, moduleInstance.id);
      if (!bits) {
        return null;
      }

      return {
        moduleId: moduleInstance.id,
        label: moduleInstance.id,
        bits,
        sourceLabel: 'current output snapshot',
      };
    })
    .filter((entry): entry is { moduleId: string; label: string; bits: number[]; sourceLabel: string } => entry !== null);
}

function formatBitstreamSample(bits: number[]): string {
  if (bits.length === 0) {
    return '';
  }

  return bits
    .map((bit) => String(bit))
    .join('')
    .match(/.{1,8}/g)
    ?.join(' ') ?? bits.join('');
}

function formatKeyStageValue(bits: number[]): string {
  if (bits.length === 0) {
    return 'empty';
  }

  if (bits.length % 4 === 0) {
    return `0x${bitsToHex(bits)}`;
  }

  return formatBitstreamSample(bits);
}

function moveStageId(stageIds: string[], moduleId: string, direction: -1 | 1): string[] {
  const currentIndex = stageIds.indexOf(moduleId);
  if (currentIndex === -1) {
    return stageIds;
  }

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= stageIds.length) {
    return stageIds;
  }

  const next = [...stageIds];
  [next[currentIndex], next[nextIndex]] = [next[nextIndex] ?? moduleId, next[currentIndex] ?? moduleId];
  return next;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function getOutputStatsProfileChipClass(label: OutputStatistics['profileLabel']) {
  switch (label) {
    case 'near-uniform sample':
      return '';
    case 'mixed sample':
      return 'status-chip-warning';
    case 'visible structure':
    case 'strong structure':
      return 'status-chip-error';
    case 'limited evidence':
    default:
      return 'status-chip-warning';
  }
}

function renderOutputStatsValidityBadge(label: string, tone: 'warning' | 'error' = 'warning') {
  return (
    <span
      className={
        tone === 'error'
          ? 'cryptanalysis-validity-badge cryptanalysis-validity-badge-error'
          : 'cryptanalysis-validity-badge'
      }
    >
      {' '}· {label}
    </span>
  );
}

function getFrequencyValidityBadge(stats: OutputStatistics['byteFrequency']) {
  if (stats.validity === 'valid') return null;
  if (stats.validity === 'coarse-buckets') return renderOutputStatsValidityBadge('coarse buckets');
  return renderOutputStatsValidityBadge('chi-squared not applicable');
}

function getBitBalanceValidityBadge(stats: OutputStatistics['bitBalance']) {
  return stats.validity === 'valid' ? null : renderOutputStatsValidityBadge('low sample');
}

function getEntropyValidityBadge(stats: OutputStatistics['byteEntropy']) {
  return stats.validity === 'valid' ? null : renderOutputStatsValidityBadge('descriptive only');
}

function getCorrelationValidityBadge(stats: OutputStatistics['correlation']) {
  return stats.validity === 'valid' ? null : renderOutputStatsValidityBadge('low sample');
}

function getRunsValidityBadge(stats: OutputStatistics['runs']) {
  if (stats.validity === 'valid') return null;
  if (stats.validity === 'prerequisite-failed') {
    return renderOutputStatsValidityBadge('prerequisite failed', 'error');
  }
  return renderOutputStatsValidityBadge('low sample');
}

function buildHeatCellStyle(intensity: number) {
  const safeIntensity = Math.max(0, Math.min(1, intensity));
  return {
    ['--heat-percent' as string]: `${(10 + safeIntensity * 75).toFixed(1)}%`,
    ['--heat-border-percent' as string]: `${(18 + safeIntensity * 70).toFixed(1)}%`,
    ['--heat-fill-percent' as string]: `${(safeIntensity * 100).toFixed(1)}%`,
  };
}

function getMonobitInterpretation(
  analysis: ReturnType<typeof analyzeBitstreamRandomness> | null,
): string {
  if (!analysis || analysis.sampleBitCount === 0) {
    return 'No bitstream captured yet';
  }

  if (analysis.imbalance >= Math.max(4, Math.ceil(analysis.sampleBitCount * 0.2))) {
    return 'This stream is visibly biased';
  }

  return 'Balance alone does not certify strength';
}

function getRunInterpretation(
  analysis: ReturnType<typeof analyzeBitstreamRandomness> | null,
): string {
  if (!analysis || analysis.sampleBitCount === 0) {
    return 'No run evidence yet';
  }

  if (Math.max(analysis.longestZeroRun, analysis.longestOneRun) >= 6) {
    return 'Long runs suggest obvious structure';
  }

  return 'Run lengths look ordinary, but that still proves little';
}

function getEntropyInterpretation(
  analysis: ReturnType<typeof analyzeBitstreamRandomness> | null,
): string {
  if (!analysis || analysis.sampleBitCount === 0 || analysis.entropyPerBit === null) {
    return 'No entropy evidence yet';
  }

  if (analysis.entropyPerBit < 0.92) {
    return 'Entropy is low enough to reveal obvious bias';
  }

  return 'Entropy looks high, but this only measures balance';
}

function getTransitionInterpretation(
  analysis: ReturnType<typeof analyzeBitstreamRandomness> | null,
): string {
  if (!analysis || analysis.sampleBitCount < 2) {
    return 'Not enough adjacent bits yet';
  }

  const holdCount = analysis.transitionCounts['00'] + analysis.transitionCounts['11'];
  const flipCount = analysis.transitionCounts['01'] + analysis.transitionCounts['10'];
  if (Math.abs(holdCount - flipCount) >= Math.max(3, Math.ceil((holdCount + flipCount) * 0.2))) {
    return 'Adjacent-bit rhythm is uneven';
  }

  return 'Transitions look mixed, but predictability may remain';
}

function getHeatmapInterpretation(
  analysis: ReturnType<typeof analyzeBitstreamRandomness> | null,
): string {
  if (!analysis || analysis.sampleBitCount < 3) {
    return 'Not enough short-pattern evidence yet';
  }

  const mostCommonShare = analysis.patternHeatmap.reduce(
    (best, cell) => Math.max(best, cell.share),
    0,
  );
  if (mostCommonShare >= 0.25) {
    return 'A few short patterns are dominating the stream';
  }

  return 'Short patterns are spread more evenly across the sample';
}

function getRepeatedWindowInterpretation(
  analysis: ReturnType<typeof analyzeBitstreamRandomness> | null,
): string {
  if (!analysis || analysis.sampleBitCount === 0) {
    return 'No repeated-window evidence yet';
  }

  if (analysis.repeatedWindowGroups.some((group) => group.matches.length > 0)) {
    return 'Repeated short windows suggest cycling or a short rhythm';
  }

  return 'No short exact repeats were found in this sample';
}

function buildVariantProject(
  project: Project,
  flippableSource: FlippableProjectSource,
  variantBits: number[],
  variantBridgeSymbol?: string | null,
): Project | null {
  const nextProject = cloneProject(project);
  const targetModule = nextProject.modules.find((moduleInstance) => moduleInstance.id === flippableSource.moduleId);
  if (!targetModule) {
    return null;
  }

  if (flippableSource.kind === 'bit-source') {
    targetModule.params.stream = variantBits;
    return nextProject;
  }

  if (flippableSource.kind === 'ascii-source') {
    targetModule.params.value = bitsToAsciiText(variantBits);
    return nextProject;
  }

  if (flippableSource.kind === 'text-symbol-bridge') {
    const effectiveSymbol = variantBridgeSymbol ?? bitsToAlphabetSymbol(variantBits);
    if (!effectiveSymbol) {
      return null;
    }

    targetModule.params.value = effectiveSymbol;
    return nextProject;
  }

  if (flippableSource.kind === 'symbol-source') {
    if (!variantBridgeSymbol) {
      return null;
    }
    targetModule.params.value = variantBridgeSymbol;
    return nextProject;
  }

  targetModule.params.value = bitsToHex(variantBits);
  return nextProject;
}

function runKeyScheduleSweep(
  project: Project,
  keySource: FlippableProjectSource,
  registry: ModuleRegistry,
  stages: KeyScheduleStageSnapshot[],
) {
  const rows: Array<{
    inputIndex: number;
    stageResults: Array<{
      moduleId: string;
      changedCount: number;
      changedPercent: number;
    }>;
  }> = [];

  for (let inputIndex = 0; inputIndex < keySource.bits.length; inputIndex += 1) {
    const variantBits = flipBitAtIndex(keySource.bits, inputIndex);
    const variantProject = buildVariantProject(project, keySource, variantBits);
    if (!variantProject) {
      continue;
    }

    const validation = validateProject(variantProject, registry);
    if (!validation.ok) {
      continue;
    }

    try {
      const variantExecution = runDemoProject(variantProject, registry);
      const stageResults = stages.flatMap((stage) => {
        const variantStageBits = getBitSignalForSink(variantExecution, stage.moduleId);
        if (!variantStageBits) {
          return [];
        }

        const difference = analyzeBitDifference(stage.bits, variantStageBits);
        return [{
          moduleId: stage.moduleId,
          changedCount: difference.changedCount,
          changedPercent: difference.changedPercent,
        }];
      });

      if (stageResults.length === 0) {
        continue;
      }

      rows.push({
        inputIndex,
        stageResults,
      });
    } catch {
      continue;
    }
  }

  return rows;
}

function runAvalancheSweep(
  project: Project,
  flippableSource: FlippableProjectSource,
  registry: ModuleRegistry,
  baselineOutputBits: number[],
  sinkModuleId: string,
  maxInputCount: number,
) {
  const rows: Array<{
    inputIndex: number;
    changedFlags: boolean[];
    changedCount: number;
    changedPercent: number;
  }> = [];

  for (let inputIndex = 0; inputIndex < maxInputCount; inputIndex += 1) {
    const sweepVariantBits = flipBitAtIndex(flippableSource.bits, inputIndex);
    const sweepProject = buildVariantProject(project, flippableSource, sweepVariantBits);
    if (!sweepProject) {
      continue;
    }

    const validation = validateProject(sweepProject, registry);
    if (!validation.ok) {
      continue;
    }

    try {
      const sweepExecution = runDemoProject(sweepProject, registry);
      const sweepOutputBits = getBitSignalForSink(sweepExecution, sinkModuleId);
      if (!sweepOutputBits) {
        continue;
      }

      const difference = analyzeBitDifference(baselineOutputBits, sweepOutputBits);
      rows.push({
        inputIndex,
        changedFlags: difference.changedFlags,
        changedCount: difference.changedCount,
        changedPercent: difference.changedPercent,
      });
    } catch {
      continue;
    }
  }

  return rows;
}

function findFlippableProjectSources(project: Project): FlippableProjectSource[] {
  const sources: FlippableProjectSource[] = [];

  for (const moduleInstance of project.modules) {
    if (moduleInstance.defId === 'BitSource' && Array.isArray(moduleInstance.params.stream)) {
      const bits = (moduleInstance.params.stream as number[]).map((bit) => (bit ? 1 : 0));
      sources.push({
        moduleId: moduleInstance.id,
        moduleName: moduleInstance.id,
        kind: 'bit-source' as const,
        bits,
      });
      continue;
    }

    if ((moduleInstance.defId === 'HexSource' || moduleInstance.defId === 'HexSequenceInput') && typeof moduleInstance.params.value === 'string') {
      sources.push({
        moduleId: moduleInstance.id,
        moduleName: moduleInstance.id,
        kind: 'hex-source' as const,
        bits: hexToBits(moduleInstance.params.value),
      });
      continue;
    }

    if (moduleInstance.defId === 'AsciiSource' && typeof moduleInstance.params.value === 'string') {
      sources.push({
        moduleId: moduleInstance.id,
        moduleName: moduleInstance.id,
        kind: 'ascii-source' as const,
        bits: moduleInstance.params.value
          .split('')
          .flatMap((char) => {
            const code = char.charCodeAt(0);
            return [7, 6, 5, 4, 3, 2, 1, 0].map((shift) => (code >> shift) & 1);
          }),
      });
      continue;
    }

    if (
      moduleInstance.defId === 'TextInput' &&
      typeof moduleInstance.params.value === 'string' &&
      moduleInstance.params.value.length === 1
    ) {
      const bridgeConnection = project.connections.find(
        (connection) =>
          connection.from.moduleId === moduleInstance.id &&
          connection.to.port === 'in' &&
          project.modules.some(
            (candidate) => candidate.id === connection.to.moduleId && candidate.defId === 'SymbolToBits',
          ),
      );
      const symbolBits = symbolToBits(moduleInstance.params.value);
      if (bridgeConnection && symbolBits) {
        sources.push({
          moduleId: moduleInstance.id,
          moduleName: moduleInstance.id,
          kind: 'text-symbol-bridge' as const,
          bits: symbolBits,
        });
      } else {
        sources.push({
          moduleId: moduleInstance.id,
          moduleName: moduleInstance.id,
          kind: 'symbol-source' as const,
          bits: symbolBits ?? new Array(5).fill(0),
        });
      }
    }
  }

  return sources;
}

// ── Output stats helpers ──────────────────────────────────────────────────────

function intToBits(value: number, width: number): number[] {
  return Array.from({ length: width }, (_, i) => (value >> (width - 1 - i)) & 1);
}

const SYMBOL_SWEEP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function runOutputStatsSweep(
  project: Project,
  sweepSource: FlippableProjectSource,
  registry: ModuleRegistry,
  sinkModuleId: string,
  sweepCount: number,
): { observations: number[][]; outputWidth: number; errors: number } {
  const observations: number[][] = [];
  let outputWidth = 0;
  let errors = 0;

  for (let i = 0; i < sweepCount; i += 1) {
    let variantProject: Project | null;
    if (sweepSource.kind === 'symbol-source') {
      const char = SYMBOL_SWEEP_ALPHABET[i] ?? null;
      if (!char) { errors += 1; continue; }
      variantProject = buildVariantProject(project, sweepSource, [], char);
    } else {
      const inputBits = intToBits(i, sweepSource.bits.length);
      variantProject = buildVariantProject(project, sweepSource, inputBits);
    }
    if (!variantProject) {
      errors += 1;
      continue;
    }

    const validation = validateProject(variantProject, registry);
    if (!validation.ok) {
      errors += 1;
      continue;
    }

    try {
      const result = runDemoProject(variantProject, registry);
      const outputBits = getBitSignalForSink(result, sinkModuleId);
      if (!outputBits || outputBits.length === 0) {
        errors += 1;
        continue;
      }
      outputWidth = outputBits.length;
      observations.push(outputBits);
    } catch {
      errors += 1;
    }
  }

  return { observations, outputWidth, errors };
}

/**
 * Bit-flip sweep: flip each source bit in turn, run the project, collect one output per flip.
 * For a 128-bit key this produces 128 observations × outputWidth bits each.
 * The engine's computeOutputStatistics then extracts byte-level values for entropy and scatter.
 */
function runBitFlipOutputSweep(
  project: Project,
  sweepSource: FlippableProjectSource,
  registry: ModuleRegistry,
  sinkModuleId: string,
): { observations: number[][]; outputWidth: number; errors: number } {
  const observations: number[][] = [];
  let outputWidth = 0;
  let errors = 0;

  for (let i = 0; i < sweepSource.bits.length; i++) {
    const variantBits = flipBitAtIndex(sweepSource.bits, i);
    const vProject = buildVariantProject(project, sweepSource, variantBits);
    if (!vProject) { errors++; continue; }
    const validation = validateProject(vProject, registry);
    if (!validation.ok) { errors++; continue; }
    try {
      const result = runDemoProject(vProject, registry);
      const outputBits = getBitSignalForSink(result, sinkModuleId);
      if (!outputBits || outputBits.length === 0) { errors++; continue; }
      outputWidth = outputBits.length;
      observations.push(outputBits);
    } catch { errors++; }
  }

  return { observations, outputWidth, errors };
}

function runKeyDependencyCheck(
  project: Project,
  sweepSource: FlippableProjectSource | null,
  registry: ModuleRegistry,
  sinkModuleId: string,
  execution: ExecutionResult | null,
): { confirmed: boolean | null; keyModuleFound: boolean; bitsChanged: number } {
  const allSources = findFlippableProjectSources(project);
  const keyCandidate =
    allSources.find(
      (s) => s.moduleId !== sweepSource?.moduleId && s.kind !== 'text-symbol-bridge',
    ) ?? null;

  if (!keyCandidate) {
    return { confirmed: null, keyModuleFound: false, bitsChanged: 0 };
  }

  const baselineOutput = getBitSignalForSink(execution, sinkModuleId);
  if (!baselineOutput) {
    return { confirmed: null, keyModuleFound: true, bitsChanged: 0 };
  }

  const variantKeyBits = flipBitAtIndex(keyCandidate.bits, 0);
  const variantProject = buildVariantProject(project, keyCandidate, variantKeyBits);
  if (!variantProject) {
    return { confirmed: null, keyModuleFound: true, bitsChanged: 0 };
  }

  const validation = validateProject(variantProject, registry);
  if (!validation.ok) {
    return { confirmed: null, keyModuleFound: true, bitsChanged: 0 };
  }

  try {
    const variantExecution = runDemoProject(variantProject, registry);
    const variantOutput = getBitSignalForSink(variantExecution, sinkModuleId);
    if (!variantOutput) {
      return { confirmed: null, keyModuleFound: true, bitsChanged: 0 };
    }
    const diff = analyzeBitDifference(baselineOutput, variantOutput);
    return { confirmed: diff.changedCount > 0, keyModuleFound: true, bitsChanged: diff.changedCount };
  } catch {
    return { confirmed: null, keyModuleFound: true, bitsChanged: 0 };
  }
}

// ── Output stats visual components ───────────────────────────────────────────

/** Canvas-based sequential-correlation heatmap (log1p heat accumulation). */
function ScatterCanvas({ grid, gridSize }: { grid: number[][]; gridSize: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const SIZE = 240;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cell = SIZE / Math.max(gridSize, 1);
    const maxVal = Math.max(1, ...grid.flatMap((r) => r));
    const img = ctx.createImageData(SIZE, SIZE);
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const count = grid[row]?.[col] ?? 0;
        const t = count > 0 ? Math.min(1, Math.log1p(count) / Math.log1p(maxVal)) : 0;
        const x0 = Math.floor(col * cell), y0 = Math.floor(row * cell);
        const x1 = Math.floor((col + 1) * cell), y1 = Math.floor((row + 1) * cell);
        for (let py = y0; py < y1; py++) {
          for (let px = x0; px < x1; px++) {
            const idx = (py * SIZE + px) * 4;
            if (count === 0) {
              img.data[idx] = 18; img.data[idx + 1] = 20; img.data[idx + 2] = 28; img.data[idx + 3] = 255;
            } else {
              // Warm amber-to-white ramp: low=deep amber, high=bright white
              img.data[idx]     = Math.round(50  + 205 * t);
              img.data[idx + 1] = Math.round(20  + 180 * t);
              img.data[idx + 2] = Math.round(0   + 120 * t);
              img.data[idx + 3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < gridSize; i++) {
      const pos = i * cell;
      ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(SIZE, pos); ctx.stroke();
    }
  }, [grid, gridSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', maxWidth: 240, imageRendering: 'pixelated', borderRadius: 6, border: '1px solid var(--border)' }}
          title="Sequential correlation heatmap — each cell = (output[i], output[i+1]) pair count"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        <span>x[i] → 0</span><span>x[i+1] (y-axis) →</span><span>max</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-secondary)' }}>
        <div style={{ width: 48, height: 8, borderRadius: 999, background: 'linear-gradient(90deg, #1a1420 0%, #c86400 50%, #ffffff 100%)', border: '1px solid var(--border)' }} />
        <span>dark = no pairs · bright = many pairs</span>
      </div>
    </div>
  );
}

/** Per-bit-position balance heatmap. Color encodes % of 1s: balanced=green, biased=red. */
function BitBalanceHeatmap({ fractions }: { fractions: number[] }) {
  const n = fractions.length;
  const cols = Math.min(n, 32);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, marginTop: 8 }}>
        {fractions.map((frac, i) => {
          const dev = Math.abs(frac - 0.5);
          // green=balanced, amber=moderate, red=biased
          const [r, g, b] =
            dev < 0.08  ? [40, 180, 100]  :
            dev < 0.2   ? [200, 160, 40]  :
                          [210, 50,  40];
          const alpha = 0.25 + dev * 1.4;
          return (
            <div
              key={i}
              title={`Bit ${i}: ${(frac * 100).toFixed(1)}% ones`}
              style={{
                height: 18,
                borderRadius: 3,
                backgroundColor: `rgba(${r},${g},${b},${Math.min(1, alpha).toFixed(2)})`,
                border: `1px solid rgba(${r},${g},${b},0.35)`,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--ink-secondary)' }}>
        <span>bit 0</span>
        {n > 1 && <span>bit {n - 1}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 10, color: 'var(--ink-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, backgroundColor: 'rgba(40,180,100,0.65)' }} />
          balanced (≈50%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, backgroundColor: 'rgba(210,50,40,0.80)' }} />
          biased
        </span>
      </div>
    </div>
  );
}

function renderFrequencyBars(counts: number[], expectedCount: number): React.ReactNode {
  const maxCount = Math.max(...counts, expectedCount * 1.5, 1);
  const expectedH = (expectedCount / maxCount) * 100;
  return (
    <div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 1, height: 100, marginTop: 8 }}>
        {/* Expected line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          bottom: `${expectedH}%`,
          borderTop: '1px dashed rgba(180,180,180,0.35)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        {counts.map((count, i) => {
          const height = (count / maxCount) * 100;
          const deviation = expectedCount > 0 ? Math.abs(count - expectedCount) / expectedCount : 0;
          const [r, g, b] =
            deviation > 0.5 ? [210, 50, 40] :
            deviation > 0.2 ? [200, 140, 40] :
                              [40, 180, 120];
          return (
            <div
              key={i}
              title={`Bucket ${i}: ${count} (expected ${expectedCount.toFixed(1)})`}
              style={{
                flex: 1,
                height: `${Math.max(height, count > 0 ? 1 : 0)}%`,
                backgroundColor: `rgba(${r},${g},${b},0.75)`,
                borderRadius: '1px 1px 0 0',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 10, color: 'var(--ink-secondary)', fontFamily: 'monospace' }}>
        <span>0x00</span><span>0x40</span><span>0x80</span><span>0xC0</span><span>0xFF</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 10, color: 'var(--ink-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 24, height: 1, borderTop: '1px dashed rgba(180,180,180,0.55)' }} />
          expected
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 10, borderRadius: 2, backgroundColor: 'rgba(40,180,120,0.75)' }} />
          flat
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 10, borderRadius: 2, backgroundColor: 'rgba(210,50,40,0.75)' }} />
          spike
        </span>
      </div>
    </div>
  );
}

function renderRunsChart(
  runLengthCounts: number[],
  expectedRunLengthCounts: number[],
): React.ReactNode {
  const labels = ['1', '2', '3', '4', '5', '6', '7', '8+'];
  const maxCount = Math.max(1, ...runLengthCounts, ...expectedRunLengthCounts.map((v) => Math.ceil(v)));
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 96, marginTop: 8 }}>
        {labels.map((label, i) => {
          const observed = runLengthCounts[i] ?? 0;
          const expected = expectedRunLengthCounts[i] ?? 0;
          const obsH = (observed / maxCount) * 88;
          const expH = (expected / maxCount) * 88;
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ position: 'relative', width: '100%', height: 88, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <div
                  title={`Length ${label}: ${observed} observed`}
                  style={{ flex: 1, height: Math.max(obsH, observed > 0 ? 2 : 0), backgroundColor: 'rgba(64,168,255,0.80)', borderRadius: '2px 2px 0 0' }}
                />
                <div
                  title={`Length ${label}: ${expected.toFixed(1)} expected`}
                  style={{ flex: 1, height: Math.max(expH, 1), backgroundColor: 'rgba(180,180,180,0.30)', borderRadius: '2px 2px 0 0', border: '1px dashed rgba(180,180,180,0.45)' }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--ink-secondary)', marginTop: 3 }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 10, color: 'var(--ink-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 10, borderRadius: 2, backgroundColor: 'rgba(64,168,255,0.80)' }} />
          observed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 10, borderRadius: 2, backgroundColor: 'rgba(180,180,180,0.30)', border: '1px dashed rgba(180,180,180,0.45)' }} />
          expected (random)
        </span>
      </div>
    </div>
  );
}

// ── Symbol sweep helpers ──────────────────────────────────────────────────────

function getSymbolSignalForSink(result: ExecutionResult | null, moduleId: string): string | null {
  if (!result) return null;
  const traceEntry =
    result.trace.find((entry) => entry.moduleId === moduleId && isOutputSinkDefId(entry.defId)) ?? null;
  const signal =
    result.outputsByModuleId[moduleId]?.out ??
    traceEntry?.outputs.out ??
    traceEntry?.inputs.in ??
    null;
  return signal?.type === 'symbol' ? signal.value : null;
}

function getSymbolSinkOptions(
  project: Project,
  execution: ExecutionResult | null,
): Array<{ moduleId: string; label: string }> {
  return project.modules
    .filter((m) => isOutputSinkDefId(m.defId))
    .flatMap((m) => {
      const sym = getSymbolSignalForSink(execution, m.id);
      if (sym === null) return [];
      return [{ moduleId: m.id, label: m.id }];
    });
}

function runSymbolSweep(
  project: Project,
  sweepSource: FlippableProjectSource,
  registry: ModuleRegistry,
  sinkModuleId: string,
): {
  inputChars: string[];
  outputChars: (string | null)[];
  charFreq: Record<string, number>;
  isPermutation: boolean;
  selfMappings: string[];
} {
  const inputChars: string[] = [];
  const outputChars: (string | null)[] = [];

  for (const ch of SYMBOL_SWEEP_ALPHABET) {
    inputChars.push(ch);
    const variantProject = buildVariantProject(project, sweepSource, [], ch);
    if (!variantProject) { outputChars.push(null); continue; }
    const validation = validateProject(variantProject, registry);
    if (!validation.ok) { outputChars.push(null); continue; }
    try {
      const result = runDemoProject(variantProject, registry);
      outputChars.push(getSymbolSignalForSink(result, sinkModuleId));
    } catch {
      outputChars.push(null);
    }
  }

  const charFreq: Record<string, number> = {};
  for (const out of outputChars) {
    if (out !== null && out.length > 0) {
      const key = out.toUpperCase();
      charFreq[key] = (charFreq[key] ?? 0) + 1;
    }
  }

  const validOutputs = outputChars.filter((c): c is string => c !== null);
  const uniqueOutputs = new Set(validOutputs.map((c) => c.toUpperCase()));
  const isPermutation = uniqueOutputs.size === inputChars.length && validOutputs.length === inputChars.length;

  const selfMappings = inputChars.filter((ch, i) => {
    const out = outputChars[i];
    return out !== null && out.toUpperCase() === ch.toUpperCase();
  });

  return { inputChars, outputChars, charFreq, isPermutation, selfMappings };
}
