import { useMemo, useState } from 'react';

import { analyzeSymbolSignal, analyzeVigenereColumns } from '../cryptanalysis';
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
            Next slices will add repeated-pattern evidence, candidate key lengths, column views,
            shift scoring, and plaintext reconstruction.
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
            <div className="comparison-diff-row">
              {columnAnalysis.map((column) => (
                <div key={column.columnIndex} className="comparison-diff-card">
                  <span className="meta-label">Column {column.columnIndex + 1}</span>
                  <strong>{column.letterCount} letters</strong>
                  <p className="comparison-copy">
                    IOC:{' '}
                    <strong>
                      {column.indexOfCoincidence !== null
                        ? column.indexOfCoincidence.toFixed(3)
                        : 'n/a'}
                    </strong>
                  </p>
                  <p className="comparison-copy">
                    Top letters:{' '}
                    <strong>{formatTopLetters(column.topLetters)}</strong>
                  </p>
                  <p className="comparison-copy">
                    Best shifts:{' '}
                    <strong>{formatShiftCandidates(column.topShiftCandidates)}</strong>
                  </p>
                  <p className="comparison-copy">
                    Slice: <strong>{truncateText(column.text, 18)}</strong>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="comparison-copy">
              Choose a candidate period to split the ciphertext into Vigenere columns.
            </p>
          )}
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

function formatShiftCandidates(
  entries: { keyLetter: string; score: number; preview: string }[],
) {
  if (entries.length === 0) {
    return 'n/a';
  }

  return entries
    .map((entry) => `${entry.keyLetter} (${entry.score.toFixed(1)}): ${entry.preview}`)
    .join(' | ');
}
