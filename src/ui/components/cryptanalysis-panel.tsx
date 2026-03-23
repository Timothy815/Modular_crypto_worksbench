import { useMemo, useState } from 'react';

import {
  analyzeSymbolSignal,
  analyzeVigenereColumns,
  buildFrequencyGraphEntries,
  reconstructVigenereCandidate,
} from '../cryptanalysis';
import type { WorkspaceMode } from '../workspace-mode';

interface CryptanalysisPanelProps {
  projectName: string;
  ciphertext: string;
  workspaceMode: WorkspaceMode;
  onSetWorkspaceMode: (mode: WorkspaceMode) => void;
  onCiphertextChange: (value: string) => void;
}

export function CryptanalysisPanel({
  projectName,
  ciphertext,
  workspaceMode,
  onSetWorkspaceMode,
  onCiphertextChange,
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

  return (
    <section className="panel comparison-panel cryptanalysis-panel">
      <div className="panel-head">
        <p className="panel-label">Cryptanalysis Workspace</p>
        <h2>Vigenere Analysis Lab</h2>
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
          Standalone ciphertext investigation for {projectName}. This first shell keeps discovery
          work separate from Compare while the full Vigenere workflow comes in.
        </p>
      </div>

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
            </div>
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
    </section>
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
