import { useMemo, useState } from 'react';

import {
  analyzeBitDifference,
  analyzeBitstreamRandomness,
  analyzeRoundDiffusion,
  analyzeSymbolSignal,
  bitsToAlphabetSymbol,
  bitsToAsciiText,
  buildCandidatePeriodChartEntries,
  analyzeVigenereColumns,
  bitsToHex,
  buildRoundDiffusionChartEntries,
  buildFrequencyGraphEntries,
  flipBitAtIndex,
  hexToBits,
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
  onSetTutorialStep,
  onFocusTutorialModule,
}: CryptanalysisPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);
  const [selectedShiftsByColumnKey, setSelectedShiftsByColumnKey] = useState<Record<string, number>>({});
  const [selectedRandomnessSinkId, setSelectedRandomnessSinkId] = useState<string>('');
  const analysis = analyzeSymbolSignal(
    ciphertext.trim().length > 0 ? { type: 'symbol', value: ciphertext } : null,
  );
  const availablePeriods = useMemo(
    () => analysis?.candidatePeriods.map((entry) => entry.period) ?? [],
    [analysis],
  );
  const effectivePeriod = availablePeriods.includes(selectedPeriod)
    ? selectedPeriod
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
      selectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, column.columnIndex)] ??
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
    columnAnalysis[selectedColumnIndex] ? selectedColumnIndex : 0;
  const activeColumn = columnAnalysis[effectiveColumnIndex] ?? null;
  const activeColumnShift =
    activeColumn
      ? selectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)] ??
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
  const baselineBits = useMemo(() => parseBitString(modernBaseline), [modernBaseline]);
  const flippableSource = useMemo(() => findFlippableProjectSource(project), [project]);
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

    const nextProject = cloneProject(project);
    const targetModule = nextProject.modules.find((moduleInstance) => moduleInstance.id === flippableSource.moduleId);
    if (!targetModule) {
      return null;
    }

    if (flippableSource.kind === 'bit-source') {
      targetModule.params.stream = variantInputBits;
      return nextProject;
    }

    if (flippableSource.kind === 'ascii-source') {
      targetModule.params.value = bitsToAsciiText(variantInputBits);
      return nextProject;
    }

    if (flippableSource.kind === 'text-symbol-bridge') {
      if (!variantBridgeSymbol) {
        return null;
      }

      targetModule.params.value = variantBridgeSymbol;
      return nextProject;
    }

    targetModule.params.value = bitsToHex(variantInputBits);
    return nextProject;
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
  const baselineOutputBits = useMemo(
    () => (execution ? getTerminalBits(execution) : null),
    [execution],
  );
  const variantOutputBits = useMemo(
    () => (variantExecution ? getTerminalBits(variantExecution) : null),
    [variantExecution],
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
    (option) => option.moduleId === selectedRandomnessSinkId,
  )
    ? selectedRandomnessSinkId
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

  return (
    <section className="panel comparison-panel cryptanalysis-panel">
      <div className="panel-head">
        <p className="panel-label">Cryptanalysis Workspace</p>
        <h2>
          {cryptanalysisMode === 'classical'
            ? 'Vigenere Analysis Lab'
            : cryptanalysisMode === 'modern'
              ? 'Avalanche Explorer'
              : 'Bitstream Randomness Lab'}
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
              </>
            ) : (
              <p className="comparison-copy">
                Round-aware diffusion appears when the active machine exposes iterator-style internal rounds in the analysis trace.
              </p>
            )}
          </div>
        </div>
      ) : cryptanalysisMode === 'randomness' ? (
        <div className="comparison-grid">
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
                        value={effectiveRandomnessSinkId}
                        onChange={(event) => setSelectedRandomnessSinkId(event.target.value)}
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
                    <div key={pair} className="randomness-transition-cell">
                      <span className="meta-label">{pair}</span>
                      <strong>{randomnessAnalysis?.transitionCounts[pair] ?? 0}</strong>
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
                  onClick={() => setSelectedPeriod(entry.period)}
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
                onChange={(event) => setSelectedPeriod(Number(event.target.value))}
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
                  onClick={() => setSelectedColumnIndex(column.columnIndex)}
                >
                  <span className="meta-label">Column {column.columnIndex + 1}</span>
                  <strong>{getSelectedKeyLetter(
                    column,
                    selectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, column.columnIndex)],
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
                selectedShiftsByColumnKey[getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)],
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
                  setSelectedShiftsByColumnKey((current) => {
                    const key = getColumnShiftKey(effectivePeriod, activeColumn.columnIndex);
                    const currentShift = current[key] ?? activeColumn.topShiftCandidates[0]?.shift ?? 0;
                    return { ...current, [key]: (currentShift + 25) % 26 };
                  })
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
                    setSelectedShiftsByColumnKey((current) => ({
                      ...current,
                      [getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)]: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  setSelectedShiftsByColumnKey((current) => {
                    const key = getColumnShiftKey(effectivePeriod, activeColumn.columnIndex);
                    const currentShift = current[key] ?? activeColumn.topShiftCandidates[0]?.shift ?? 0;
                    return { ...current, [key]: (currentShift + 1) % 26 };
                  })
                }
              >
                Shift Right
              </button>
              <button
                type="button"
                className="mini-action-button"
                onClick={() =>
                  setSelectedShiftsByColumnKey((current) => ({
                    ...current,
                    [getColumnShiftKey(effectivePeriod, activeColumn.columnIndex)]:
                      activeColumn.topShiftCandidates[0]?.shift ?? 0,
                  }))
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

function getTerminalBits(result: ExecutionResult): number[] | null {
  for (let index = result.trace.length - 1; index >= 0; index -= 1) {
    const traceEntry = result.trace[index];
    const outputSignal = Object.values(traceEntry.outputs).find((signal) => signal.type === 'bits') ?? null;
    if (outputSignal?.type === 'bits') {
      return outputSignal.value;
    }

    const inputSignal = Object.values(traceEntry.inputs).find((signal) => signal.type === 'bits') ?? null;
    if (inputSignal?.type === 'bits') {
      return inputSignal.value;
    }
  }

  return null;
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

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
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

function findFlippableProjectSource(project: Project) {
  for (const moduleInstance of project.modules) {
    if (moduleInstance.defId === 'BitSource' && Array.isArray(moduleInstance.params.stream)) {
      const bits = (moduleInstance.params.stream as number[]).map((bit) => (bit ? 1 : 0));
      return {
        moduleId: moduleInstance.id,
        moduleName: 'Bit Source',
        kind: 'bit-source' as const,
        bits,
      };
    }

    if (moduleInstance.defId === 'HexSource' && typeof moduleInstance.params.value === 'string') {
      return {
        moduleId: moduleInstance.id,
        moduleName: 'Hex Source',
        kind: 'hex-source' as const,
        bits: hexToBits(moduleInstance.params.value),
      };
    }

    if (moduleInstance.defId === 'AsciiSource' && typeof moduleInstance.params.value === 'string') {
      return {
        moduleId: moduleInstance.id,
        moduleName: 'ASCII Source',
        kind: 'ascii-source' as const,
        bits: moduleInstance.params.value
          .split('')
          .flatMap((char) => {
            const code = char.charCodeAt(0);
            return [7, 6, 5, 4, 3, 2, 1, 0].map((shift) => (code >> shift) & 1);
          }),
      };
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
        return {
          moduleId: moduleInstance.id,
          moduleName: 'Text Input',
          kind: 'text-symbol-bridge' as const,
          bits: symbolBits,
        };
      }
    }
  }

  return null;
}
