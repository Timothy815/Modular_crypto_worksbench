import { useMemo, useState } from 'react';

import {
  analyzeBitDifference,
  analyzeRoundDiffusion,
  analyzeSymbolSignal,
  analyzeVigenereColumns,
  bitsToHex,
  buildFrequencyGraphEntries,
  flipBitAtIndex,
  hexToBits,
  parseBitString,
  reconstructVigenereCandidate,
} from '../cryptanalysis';
import type { CryptanalysisMode } from '../cryptanalysis-mode';
import { runDemoProject } from '../demo-projects';
import { validateProject } from '../../engine/validation';
import type { ExecutionResult, ModuleRegistry, Project, Signal } from '../../engine/types';
import { cloneProject } from '../store';
import type { WorkspaceMode } from '../workspace-mode';

interface CryptanalysisPanelProps {
  projectName: string;
  project: Project;
  registry: ModuleRegistry;
  execution: ExecutionResult | null;
  ciphertext: string;
  cryptanalysisMode: CryptanalysisMode;
  modernBaseline: string;
  modernFlipBit: number;
  workspaceMode: WorkspaceMode;
  onSetWorkspaceMode: (mode: WorkspaceMode) => void;
  onSetCryptanalysisMode: (mode: CryptanalysisMode) => void;
  onCiphertextChange: (value: string) => void;
  onModernBaselineChange: (value: string) => void;
  onModernFlipBitChange: (value: number) => void;
}

export function CryptanalysisPanel({
  projectName,
  project,
  registry,
  execution,
  ciphertext,
  cryptanalysisMode,
  modernBaseline,
  modernFlipBit,
  workspaceMode,
  onSetWorkspaceMode,
  onSetCryptanalysisMode,
  onCiphertextChange,
  onModernBaselineChange,
  onModernFlipBitChange,
}: CryptanalysisPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);
  const [selectedShiftsByColumnKey, setSelectedShiftsByColumnKey] = useState<Record<string, number>>({});
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
  const inputDifference = useMemo(
    () => analyzeBitDifference(effectiveInputBits, variantInputBits),
    [effectiveInputBits, variantInputBits],
  );
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

    targetModule.params.value = bitsToHex(variantInputBits);
    return nextProject;
  }, [flippableSource, project, variantInputBits]);
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
  const roundDiffusion = useMemo(
    () => analyzeRoundDiffusion(execution, variantExecution),
    [execution, variantExecution],
  );
  const hasBitDomainOutput = baselineOutputBits !== null;
  const showModernCompatibilityCallout = !flippableSource || !hasBitDomainOutput;

  return (
    <section className="panel comparison-panel cryptanalysis-panel">
      <div className="panel-head">
        <p className="panel-label">Cryptanalysis Workspace</p>
        <h2>{cryptanalysisMode === 'classical' ? 'Vigenere Analysis Lab' : 'Avalanche Explorer'}</h2>
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
      </div>

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
                Supported source paths currently begin from <strong>BitSource</strong> or <strong>HexSource</strong>.
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
                  {' '}| kind <strong>{flippableSource.kind === 'bit-source' ? 'BitSource' : 'HexSource'}</strong>
                </p>
                <p className="comparison-copy">
                  The explorer is now flipping a real project input bit and re-running the machine.
                </p>
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
            <span className="meta-label">Bit Flip Control</span>
            <strong>Flip one bit and inspect the difference pattern</strong>
            {effectiveInputBits.length > 0 ? (
              <>
                <div className="cryptanalysis-shift-control-row">
                  <button
                    type="button"
                    className="mini-action-button"
                    onClick={() => onModernFlipBitChange(Math.max(0, effectiveModernFlipBit - 1))}
                  >
                    Bit Left
                  </button>
                  <label className="param-field cryptanalysis-shift-slider">
                    <span>Flip Bit {effectiveModernFlipBit + 1}</span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, baselineBits.length - 1)}
                      step={1}
                      value={effectiveModernFlipBit}
                      onChange={(event) => onModernFlipBitChange(Number(event.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    className="mini-action-button"
                    onClick={() =>
                      onModernFlipBitChange(Math.min(baselineBits.length - 1, effectiveModernFlipBit + 1))
                    }
                  >
                    Bit Right
                  </button>
                </div>
                <p className="comparison-copy">
                  Baseline length: <strong>{effectiveInputBits.length}</strong> bits
                  {' '}| changed input bits <strong>{inputDifference.changedCount}</strong>
                  {' '}| changed percent <strong>{(inputDifference.changedPercent * 100).toFixed(1)}%</strong>
                </p>
              </>
            ) : (
              <p className="comparison-copy">
                Enter at least one bit to start the Avalanche Explorer.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Input Difference View</span>
            <strong>See the changed source position directly</strong>
            {effectiveInputBits.length > 0 ? (
              <div className="modern-bit-grid">
                <BitStripRow label="Baseline" bits={inputDifference.baselineBits} />
                <BitStripRow label="Variant" bits={inputDifference.variantBits} changedFlags={inputDifference.changedFlags} />
                <BitStripRow label="Changed" bits={inputDifference.changedFlags.map((changed) => (changed ? 1 : 0))} changedFlags={inputDifference.changedFlags} emphasis="changed" />
              </div>
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
                This project needs a supported bit source and a bit-domain output path before the machine-aware avalanche view can render.
              </p>
            )}
          </div>

          <div className="comparison-card comparison-card-wide">
            <span className="meta-label">Round-Aware Diffusion</span>
            <strong>Watch the change spread across internal rounds</strong>
            {roundDiffusion.length > 0 ? (
              <>
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
                <div className="modern-round-diffusion-list">
                  {roundDiffusion.map((entry) => (
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
                          style={{ width: `${Math.max(entry.changedPercent * 100, 2)}%` }}
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
            <div className="cryptanalysis-list">
              {analysis.candidatePeriods.map((entry) => (
                <p key={entry.period} className="comparison-copy">
                  <strong>Period {entry.period}</strong>
                  {' '}| avg IOC{' '}
                  <strong>
                    {entry.averageIndexOfCoincidence !== null
                      ? entry.averageIndexOfCoincidence.toFixed(3)
                      : 'n/a'}
                  </strong>
                  {' '}| supporting distances <strong>{entry.supportingDistanceCount}</strong>
                </p>
              ))}
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

function getTerminalBits(result: ExecutionResult): number[] | null {
  const terminalTrace = result.trace.at(-1) ?? null;
  const terminalInput = terminalTrace?.inputs.in ?? null;
  const terminalOutput =
    terminalTrace && Object.values(terminalTrace.outputs)[0]
      ? (Object.values(terminalTrace.outputs)[0] as Signal)
      : null;
  const signal = terminalOutput ?? terminalInput ?? null;

  return signal?.type === 'bits' ? signal.value : null;
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
  }

  return null;
}
