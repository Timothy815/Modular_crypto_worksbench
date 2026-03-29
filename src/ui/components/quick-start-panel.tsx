import { FIRST_SESSION_QUICK_START, QUICK_START_SURFACES } from '../quick-start';

interface QuickStartPanelProps {
  currentProjectId: string;
  selectedTutorialId: string | null;
  selectedChallengeId: string | null;
  starterChallengeSolved: boolean;
  onOpenProject: (projectId: string) => void;
  onOpenTutorialPath: (projectId: string, tutorialId: string) => void;
  onOpenChallenge: (challengeId: string) => void;
  onOpenManual: () => void;
  onOpenCryptanalysis: () => void;
}

export function QuickStartPanel({
  currentProjectId,
  selectedTutorialId,
  selectedChallengeId,
  starterChallengeSolved,
  onOpenProject,
  onOpenTutorialPath,
  onOpenChallenge,
  onOpenManual,
  onOpenCryptanalysis,
}: QuickStartPanelProps) {
  const starterProjectOpen = currentProjectId === FIRST_SESSION_QUICK_START.projectId;
  const starterTutorialOpen = selectedTutorialId === FIRST_SESSION_QUICK_START.tutorialId;
  const starterChallengeOpen = selectedChallengeId === FIRST_SESSION_QUICK_START.challengeId;

  return (
    <section className="panel comparison-panel quick-start-panel">
      <div className="panel-head">
        <p className="panel-label">Quick Start</p>
        <h2>Start Here</h2>
        <p className="comparison-copy">
          MCW is a systems IDE for building visible cryptographic machines. Your first loop should be:
          open the starter demo, follow the matching tutorial, repair the matching challenge, then
          confirm the machine behaves correctly.
        </p>
      </div>

      <div className="content-selector-card quick-start-status-card">
        <p className="comparison-copy">
          Recommended first path: <strong>Bridge demo</strong>, then <strong>Bridge Walkthrough</strong>,
          then <strong>Repair the Bridge Key</strong>.
        </p>
        <div className="content-selector-meta">
          <span className={`content-status-chip ${starterProjectOpen ? 'tutorial-completed-chip' : ''}`}>
            Demo {starterProjectOpen ? 'open' : 'not open'}
          </span>
          <span className={`content-status-chip ${starterTutorialOpen ? 'tutorial-completed-chip' : ''}`}>
            Tutorial {starterTutorialOpen ? 'selected' : 'not selected'}
          </span>
          <span className={`content-status-chip ${starterChallengeOpen ? 'tutorial-completed-chip' : ''}`}>
            Challenge {starterChallengeOpen ? 'selected' : 'not selected'}
          </span>
          <span className={`content-status-chip ${starterChallengeSolved ? 'tutorial-completed-chip' : 'tutorial-in-progress-chip'}`}>
            {starterChallengeSolved ? 'Starter loop passed' : 'Solve the starter challenge to finish the loop'}
          </span>
        </div>
      </div>

      <div className="comparison-actions quick-start-actions">
        <button
          type="button"
          className="mini-action-button"
          onClick={() => onOpenProject(FIRST_SESSION_QUICK_START.projectId)}
        >
          Open Demo
        </button>
        <button
          type="button"
          className="mini-action-button"
          onClick={() =>
            onOpenTutorialPath(
              FIRST_SESSION_QUICK_START.projectId,
              FIRST_SESSION_QUICK_START.tutorialId,
            )
          }
        >
          Open Tutorial
        </button>
        <button
          type="button"
          className="mini-action-button"
          onClick={() => onOpenChallenge(FIRST_SESSION_QUICK_START.challengeId)}
        >
          Open Challenge
        </button>
        <button type="button" className="mini-action-button" onClick={onOpenManual}>
          Open Manual
        </button>
        <button type="button" className="mini-action-button" onClick={onOpenCryptanalysis}>
          Open Cryptanalysis
        </button>
      </div>

      <div className="comparison-grid">
        <div className="comparison-card comparison-card-wide quick-start-flow-card">
          <span className="meta-label">First 10 Minutes</span>
          <ol className="quick-start-step-list">
            <li>Open the Bridge demo so you can see one explicit symbol-to-bits-to-symbol machine.</li>
            <li>Switch to the Bridge tutorial and step through the graph in Guide mode.</li>
            <li>Open the matching challenge and repair the machine until it matches the reference again.</li>
            <li>
              Use the Inspector <strong>Compare</strong> tab or the challenge success banner to confirm the
              machine now matches expected behavior.
            </li>
            <li>Use the manual if a term is unfamiliar, then move to Byte Round as the next recommended tutorial.</li>
          </ol>
        </div>

        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">Where Things Live</span>
          <div className="quick-start-surface-list">
            {QUICK_START_SURFACES.map((surface) => (
              <div key={surface.id} className="quick-start-surface-row">
                <strong>{surface.title}</strong>
                <p className="comparison-copy">{surface.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">What To Do Next</span>
          <p className="comparison-copy">
            After the starter loop passes, the next clean move is <strong>Byte Round</strong>. It keeps
            the graph small but introduces modern substitution and permutation without jumping all the
            way into multi-round systems.
          </p>
          <div className="comparison-actions">
            <button
              type="button"
              className="mini-action-button"
              onClick={() =>
                onOpenTutorialPath(
                  FIRST_SESSION_QUICK_START.nextProjectId,
                  FIRST_SESSION_QUICK_START.nextTutorialId,
                )
              }
            >
              Open Next Tutorial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
