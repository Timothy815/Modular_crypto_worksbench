import { analyzeSymbolSignal } from '../cryptanalysis';
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
  const analysis = analyzeSymbolSignal(
    ciphertext.trim().length > 0 ? { type: 'symbol', value: ciphertext } : null,
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
