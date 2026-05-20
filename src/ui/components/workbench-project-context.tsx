import { useEffect, useMemo, useState } from 'react';

import type { DemoProject } from '../demo-projects';
import {
  getFirstLearningItemInGroup,
  getLearningGroupLabel,
  getLearningStageLabel,
  isCoreLearningItem,
} from '../learning-sequence';
import type { LearningStage } from '../learning-sequence';
import type { RecommendedLearningTarget } from '../learning-sequence';
import type { WorkspaceComparisonSummary } from '../workspace-comparison';
import { getConnectionComparisonKey } from '../workspace-comparison';
import type { WorkspaceLandmark, } from '../workspace-landmarks';
import type {
  AutosaveSnapshotDocument,
  WorkspaceExportStatus,
  WorkspaceFileBinding,
  WorkspaceVersionDocument,
} from '../workbench-document';
import { buildWorkspaceDurabilitySummary } from '../workspace-durability-ux';

interface WorkbenchProjectContextProps {
  isCompositeEditor: boolean;
  isObservationMode?: boolean;
  activeProject: DemoProject;
  activeProjectGroup: string;
  activeProjectStage: LearningStage;
  activeProjectRecommendedAfter: RecommendedLearningTarget[];
  projects: DemoProject[];
  projectGroups: string[];
  projectCountByGroup: Record<string, number>;
  visibleProjects: DemoProject[];
  summary?: string;
  pipelineLabel?: string;
  showWorkspaceLandmarks: boolean;
  workspaceLandmarks: {
    context: WorkspaceLandmark[];
    sources: WorkspaceLandmark[];
    outputs: WorkspaceLandmark[];
  };
  workspaceVersions: WorkspaceVersionDocument[];
  autosaveSnapshots: AutosaveSnapshotDocument[];
  workspaceComparison: WorkspaceComparisonSummary | null;
  activeComparisonVersion: WorkspaceVersionDocument | null;
  comparisonVersionId: string | null;
  persistenceWarning: string | null;
  lastDurableSaveAt: string | null;
  exportStatus: WorkspaceExportStatus | null;
  currentDocumentFingerprint: string | null;
  fileBinding: WorkspaceFileBinding | null;
  onSwitchProject: (projectId: string) => void;
  onJumpToModule: (moduleId: string) => void;
  onRequestRestoreVersion: (versionId: string) => void;
  onRequestRestoreAutosave: (snapshotId: string) => void;
  onSetComparisonVersionId: (versionId: string | null) => void;
  formatVersionTimestamp: (savedAt: string) => string;
}

function renderLandmarkGroup(
  title: string,
  landmarks: WorkspaceLandmark[],
  onJumpToModule: (moduleId: string) => void,
) {
  if (landmarks.length === 0) {
    return null;
  }

  return (
    <div className="workspace-landmark-group">
      <span className="meta-label">{title}</span>
      <div className="workspace-landmark-list">
        {landmarks.map((landmark) => (
          <button
            key={landmark.moduleId}
            type="button"
            className="workspace-landmark-button"
            onClick={() => onJumpToModule(landmark.moduleId)}
            title={`${landmark.moduleId} (${landmark.defId})`}
          >
            {landmark.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WorkbenchProjectContext({
  isCompositeEditor,
  isObservationMode = false,
  activeProject,
  activeProjectGroup,
  activeProjectStage,
  activeProjectRecommendedAfter,
  projects,
  projectGroups,
  projectCountByGroup,
  visibleProjects,
  summary,
  pipelineLabel,
  showWorkspaceLandmarks,
  workspaceLandmarks,
  workspaceVersions,
  autosaveSnapshots,
  workspaceComparison,
  activeComparisonVersion,
  comparisonVersionId,
  persistenceWarning,
  lastDurableSaveAt,
  exportStatus,
  currentDocumentFingerprint,
  fileBinding,
  onSwitchProject,
  onJumpToModule,
  onRequestRestoreVersion,
  onRequestRestoreAutosave,
  onSetComparisonVersionId,
  formatVersionTimestamp,
}: WorkbenchProjectContextProps) {
  const [projectSearch, setProjectSearch] = useState('');
  const [isSnapshotsViewOpen, setIsSnapshotsViewOpen] = useState(false);
  const [isProjectContextCollapsed, setIsProjectContextCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('mcw:project-context-collapsed') === 'true';
  });
  const normalizedProjectSearch = projectSearch.trim().toLowerCase();
  const searchMatchingProjects = useMemo(() => {
    if (!normalizedProjectSearch) {
      return [];
    }

    return projects.filter((project) => {
      const haystack = [
        project.id,
        project.name,
        project.group ?? '',
        project.summary,
        project.pipeline,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedProjectSearch);
    });
  }, [normalizedProjectSearch, projects]);
  const durabilitySummary = useMemo(
    () =>
      buildWorkspaceDurabilitySummary({
        persistenceWarning,
        autosaveSnapshots,
        exportStatus,
        currentFingerprint: currentDocumentFingerprint,
        fileBinding,
      }),
    [autosaveSnapshots, currentDocumentFingerprint, exportStatus, fileBinding, persistenceWarning],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      'mcw:project-context-collapsed',
      isProjectContextCollapsed ? 'true' : 'false',
    );
  }, [isProjectContextCollapsed]);

  if (isCompositeEditor || isObservationMode) {
    return null;
  }

  return (
    <div className="project-selector-stack">
      <div className="content-filter-row project-selector-row">
        <label className="project-selector">
          <span className="meta-label">Group</span>
          <select
            value={activeProjectGroup}
            onChange={(event) => {
              const nextGroup = event.target.value;
              const firstProject = getFirstLearningItemInGroup(projects, nextGroup);
              if (firstProject && firstProject.id !== activeProject.id) {
                onSwitchProject(firstProject.id);
              }
            }}
          >
            {projectGroups.map((group) => (
              <option key={group} value={group}>
                {getLearningGroupLabel(group, projectCountByGroup[group])}
              </option>
            ))}
          </select>
        </label>
        <label className="project-selector">
          <span className="meta-label">Workspace</span>
          <select
            value={activeProject.id}
            onChange={(event) => onSwitchProject(event.target.value)}
          >
            {visibleProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="project-selector">
          <span className="meta-label">Search</span>
          <input
            type="search"
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            placeholder="Name, concept, or pipeline"
          />
        </label>
      </div>
      {normalizedProjectSearch && searchMatchingProjects.length > 0 ? (
        <div className="project-context-card project-context-card-wide project-search-results-card">
          <strong>Matches</strong>
          <div className="project-search-results">
            {searchMatchingProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="project-search-result"
                onClick={() => {
                  onSwitchProject(project.id);
                  setProjectSearch('');
                }}
              >
                <span className="project-search-result-header">
                  <strong>{project.name}</strong>
                  <span className="content-status-chip">{project.group ?? 'misc'}</span>
                </span>
                <span className="project-search-result-summary">{project.summary}</span>
                <code>{project.pipeline}</code>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {normalizedProjectSearch && searchMatchingProjects.length === 0 ? (
        <div className="project-context-card project-context-card-wide">
          <strong>No matches</strong>
          <p>
            Try <code>rotor</code>, <code>sbox</code>, <code>pollux</code>, <code>hash</code>, or{' '}
            <code>double-step</code>.
          </p>
        </div>
      ) : null}
      <div className={`project-context-card project-context-card-wide${isProjectContextCollapsed ? ' collapsed' : ''}`}>
        <div className="project-context-card-head">
          <strong>{activeProject.name}</strong>
          <button
            type="button"
            className="collapse-toggle-button"
            aria-label={isProjectContextCollapsed ? 'Expand workspace details' : 'Collapse workspace details'}
            title={isProjectContextCollapsed ? 'Expand workspace details' : 'Collapse workspace details'}
            onClick={() => setIsProjectContextCollapsed((current) => !current)}
          >
            {isProjectContextCollapsed ? '+' : '\u2212'}
          </button>
        </div>
        {!isProjectContextCollapsed ? (
          <>
            <p>{summary ?? activeProject.summary}</p>
            <code>{pipelineLabel ?? activeProject.pipeline}</code>
            <div className="content-selector-meta">
              <span className="content-status-chip">{getLearningStageLabel(activeProjectStage)}</span>
              <span className="content-status-chip">
                Group: <strong>{activeProjectGroup}</strong>
              </span>
              <span className="content-status-chip">{isCoreLearningItem(activeProject) ? 'Core Path' : 'Optional'}</span>
            </div>
            {activeProjectRecommendedAfter.length > 0 ? (
              <div className="comparison-copy project-recommended-next">
                <span>
                  Best after:
                </span>
                <div className="project-recommended-next-list">
                  {activeProjectRecommendedAfter.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      className="project-recommended-next-button"
                      onClick={() => onSwitchProject(target.id)}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {showWorkspaceLandmarks ? (
              <div className="workspace-landmarks-card">
                <strong>Workspace Landmarks</strong>
                <p>Jump to visible sources, context, and outputs in large graphs.</p>
                {renderLandmarkGroup('Protocol & Timing', workspaceLandmarks.context, onJumpToModule)}
                {renderLandmarkGroup('Sources', workspaceLandmarks.sources, onJumpToModule)}
                {renderLandmarkGroup('Outputs', workspaceLandmarks.outputs, onJumpToModule)}
              </div>
            ) : null}
            <div className="workspace-versions-card">
              <strong>Workspace Durability</strong>
              <div className="workspace-version-list">
                <div className="workspace-version-item">
                  <div>
                    <strong>Current Safety</strong>
                    <p>{durabilitySummary.modeLabel}</p>
                    <p>
                      Last durable save:{' '}
                      <strong>{lastDurableSaveAt ? formatVersionTimestamp(lastDurableSaveAt) : 'Not recorded yet'}</strong>
                    </p>
                    {durabilitySummary.latestRecoverySnapshot ? (
                      <p>
                        Latest autosave:{' '}
                        <strong>{formatVersionTimestamp(durabilitySummary.latestRecoverySnapshot.savedAt)}</strong>
                      </p>
                    ) : (
                      <p>No recent autosave snapshot recorded yet.</p>
                    )}
                  </div>
                </div>
                <div className="workspace-version-item">
                  <div>
                    <strong>Document File</strong>
                    <p>
                      {fileBinding
                        ? fileBinding.status === 'confirmed'
                          ? `File-bound workspace: ${fileBinding.fileName}.`
                          : `Remembered file binding: ${fileBinding.fileName}. Reconfirm local file access on Save.`
                        : 'Browser-local workspace only.'}
                    </p>
                  </div>
                </div>
                <div className="workspace-version-item">
                  <div>
                    <strong>Recent Recovery</strong>
                    <p>
                      {durabilitySummary.latestRecoverySnapshot
                        ? `A local recovery snapshot is available from ${formatVersionTimestamp(
                            durabilitySummary.latestRecoverySnapshot.savedAt,
                          )}.`
                        : 'No recoverable local autosave is available yet for this workspace.'}
                    </p>
                    {autosaveSnapshots.length > 0 ? (
                      <button
                        type="button"
                        className="workspace-version-button"
                        onClick={() => setIsSnapshotsViewOpen((current) => !current)}
                      >
                        {isSnapshotsViewOpen ? 'Hide Snapshots' : `Open Snapshots (${autosaveSnapshots.length})`}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="workspace-version-item">
                  <div>
                    <strong>Portable Backup</strong>
                    <p>
                      {exportStatus?.lastExportedAt
                        ? `Last export: ${formatVersionTimestamp(exportStatus.lastExportedAt)}.`
                        : 'This workspace has not been exported yet.'}
                    </p>
                    {durabilitySummary.showExportReminder ? (
                      <p>
                        Local durability is active, but export is still the portable backup path. Use
                        Import/Export to create a JSON, lab-pack, or Python handoff after meaningful changes.
                      </p>
                    ) : fileBinding?.status === 'confirmed' ? (
                      <p>
                        This workspace is already file-backed. Save writes to its bound local file, and
                        Import/Export remains available for separate artifact handoff.
                      </p>
                    ) : (
                      <p>Portable backup is up to date with the latest exported workspace state.</p>
                    )}
                  </div>
                </div>
              </div>
              {persistenceWarning ? <p>{persistenceWarning}</p> : null}
              <details className="workspace-comparison-card">
                <summary>How local durability works</summary>
                <p>Durable local save is active when healthy.</p>
                <p>Recent autosave recovery is available in this same surface when snapshots exist.</p>
                <p>Export is still the portable backup path.</p>
                <p>If durable save is degraded, export sooner rather than later.</p>
              </details>
              <details className="workspace-comparison-card">
                <summary>How local workspace files work</summary>
                <p>Open Workspace opens a local workspace document as a file-backed workspace.</p>
                <p>Save writes back to the current bound file when file access is still confirmed.</p>
                <p>Save As creates or replaces the current file binding.</p>
                <p>Import Workspace is different: it loads an artifact into the current session and does not bind a file.</p>
                <p>Browser-local durability and recent recovery still protect the live workspace while you edit.</p>
              </details>
              {isSnapshotsViewOpen ? (
                <div className="workspace-comparison-card">
                  <strong>Recent Snapshots</strong>
                  <p>Restore a recent local snapshot only when you want to inspect or recover one.</p>
                  <div className="workspace-version-list">
                    {autosaveSnapshots.map((snapshot) => (
                      <div key={snapshot.id} className="workspace-version-item">
                        <div>
                          <strong>{snapshot.tickedMode ? 'Ticked Snapshot' : 'Workspace Snapshot'}</strong>
                          <p>{formatVersionTimestamp(snapshot.savedAt)}</p>
                        </div>
                        <button
                          type="button"
                          className="workspace-version-button"
                          onClick={() => onRequestRestoreAutosave(snapshot.id)}
                        >
                          Restore Snapshot
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {workspaceVersions.length > 0 ? (
          <div className="workspace-versions-card">
            <strong>Saved Versions</strong>
            <p>Restore a checkpoint without replacing undo/redo.</p>
            <div className="workspace-version-list">
              {[...workspaceVersions]
                .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
                .map((version) => (
                  <div key={version.id} className="workspace-version-item">
                    <div>
                      <strong>{version.name}</strong>
                      <p>{formatVersionTimestamp(version.savedAt)}</p>
                    </div>
                    <button
                      type="button"
                      className="workspace-version-button"
                      onClick={() => onRequestRestoreVersion(version.id)}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="workspace-version-button"
                      onClick={() => onSetComparisonVersionId(comparisonVersionId === version.id ? null : version.id)}
                    >
                      {comparisonVersionId === version.id ? 'Stop Compare' : 'Compare'}
                    </button>
                  </div>
                ))}
            </div>
            {workspaceComparison && activeComparisonVersion ? (
              <div className="workspace-comparison-card">
                <strong>Comparing To {activeComparisonVersion.name}</strong>
                <p>
                  Added modules: <strong>{workspaceComparison.addedModules.length}</strong> · Removed modules:{' '}
                  <strong>{workspaceComparison.removedModules.length}</strong> · Added wires:{' '}
                  <strong>{workspaceComparison.addedConnections.length}</strong> · Removed wires:{' '}
                  <strong>{workspaceComparison.removedConnections.length}</strong>
                </p>
                {workspaceComparison.removedModules.length > 0 ? (
                  <div className="workspace-comparison-list">
                    <span className="meta-label">Removed Modules</span>
                    <ul className="port-list">
                      {workspaceComparison.removedModules.map((moduleInstance) => (
                        <li key={`${moduleInstance.id}:${moduleInstance.defId}`}>
                          <strong>{moduleInstance.id}</strong>
                          <span>{moduleInstance.defId}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {workspaceComparison.removedConnections.length > 0 ? (
                  <div className="workspace-comparison-list">
                    <span className="meta-label">Removed Wires</span>
                    <ul className="port-list">
                      {workspaceComparison.removedConnections.map((connection) => (
                        <li key={getConnectionComparisonKey(connection)}>
                          <strong>{connection.from.moduleId}.{connection.from.port}</strong>
                          <span>-&gt; {connection.to.moduleId}.{connection.to.port}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
