import { Fragment, useMemo, useState } from 'react';

import {
  analyzeBitDifference,
  analyzeBitstreamRandomness,
  buildKeyScheduleAdjacentDifferences,
  buildKeyScheduleSweepSummary,
  analyzeRoundDiffusion,
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
}: CryptanalysisPanelProps) {
  const [caseDraftName, setCaseDraftName] = useState('');
  const [lastManualSweepSignature, setLastManualSweepSignature] = useState<string | null>(null);
  const [selectedKeySourceId, setSelectedKeySourceId] = useState<string | null>(null);
  const [selectedKeyStageIds, setSelectedKeyStageIds] = useState<string[]>([]);
  const [lastKeyScheduleRunSignature, setLastKeyScheduleRunSignature] = useState<string | null>(null);
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
  const variantInputBits = useMemo(
    () => flipBitAtIndex(effectiveInputBits, effectiveModernFlipBit),
    [effectiveInputBits, effectiveModernFlipBit],
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
  const variantExecution = useMemo(() => {
    if (!variantProject) {
      return null;
    }

    const validation = validateProject(variantProject, registry);
    if (!validation.ok) {
      return null;
    }

    try {
      return runDemoProject(variantProject, registry);
    } catch {
      return null;
    }
  }, [registry, variantProject]);
  const modernSinkOptions = useMemo(
    () => getBitstreamSinkOptions(project, execution, null, false),
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
  const roundDiffusion = useMemo(
    () => analyzeRoundDiffusion(execution, variantExecution),
    [execution, variantExecution],
  );
  const roundDiffusionChart = useMemo(
    () => buildRoundDiffusionChartEntries(roundDiffusion),
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
      project,
      registry,
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
            {outputDifference ? (
              <>
                <ModernFlipControl
                  bitLength={effectiveInputBits.length}
                  flipBit={effectiveModernFlipBit}
                  changedCount={outputDifference.changedCount}
                  changedPercent={outputDifference.changedPercent}
                  metricLabel="changed output bits"
                  onChange={onModernFlipBitChange}
                />
                {outputHexSummary ? (
                  <div className="cryptanalysis-output-summary-row">
                    <span className="content-status-chip">
                      Baseline Hex: <strong>{outputHexSummary.baseline}</strong>
                    </span>
                    <span className="content-status-chip">
                      Variant Hex: <strong>{outputHexSummary.variant}</strong>
                    </span>
                  </div>
                ) : null}
                <div className="modern-bit-grid">
                  <BitStripRow label="Baseline Out" bits={outputDifference.baselineBits} />
                  <BitStripRow label="Variant Out" bits={outputDifference.variantBits} changedFlags={outputDifference.changedFlags} />
                  <BitStripRow label="Changed Out" bits={outputDifference.changedFlags.map((changed) => (changed ? 1 : 0))} changedFlags={outputDifference.changedFlags} emphasis="changed" />
                </div>
                <p className="comparison-copy">
                  Changed output bits <strong>{outputDifference.changedCount}</strong>
                  {' '}| changed percent <strong>{(outputDifference.changedPercent * 100).toFixed(1)}%</strong>
                </p>
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

function getFlippableSourceKindLabel(kind: 'bit-source' | 'hex-source' | 'ascii-source' | 'text-symbol-bridge') {
  switch (kind) {
    case 'bit-source':
      return 'BitSource';
    case 'hex-source':
      return 'HexSource';
    case 'ascii-source':
      return 'AsciiSource';
    case 'text-symbol-bridge':
      return 'TextInput → SymbolToBits';
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
        moduleName: 'Bit Source',
        kind: 'bit-source' as const,
        bits,
      });
      continue;
    }

    if (moduleInstance.defId === 'HexSource' && typeof moduleInstance.params.value === 'string') {
      sources.push({
        moduleId: moduleInstance.id,
        moduleName: 'Hex Source',
        kind: 'hex-source' as const,
        bits: hexToBits(moduleInstance.params.value),
      });
      continue;
    }

    if (moduleInstance.defId === 'AsciiSource' && typeof moduleInstance.params.value === 'string') {
      sources.push({
        moduleId: moduleInstance.id,
        moduleName: 'ASCII Source',
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
          moduleName: 'Text Input',
          kind: 'text-symbol-bridge' as const,
          bits: symbolBits,
        });
      }
    }
  }

  return sources;
}
