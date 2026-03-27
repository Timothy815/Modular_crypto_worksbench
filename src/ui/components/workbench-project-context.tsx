import type { DemoProject } from '../demo-projects';
import {
  getFirstLearningItemInGroup,
  getLearningGroupLabel,
  getLearningStageLabel,
  isCoreLearningItem,
} from '../learning-sequence';
import type { LearningStage } from '../learning-sequence';
import type { WorkspaceComparisonSummary } from '../workspace-comparison';
import { getConnectionComparisonKey } from '../workspace-comparison';
import type { WorkspaceLandmark, } from '../workspace-landmarks';
import type { WorkspaceVersionDocument } from '../workbench-document';

interface WorkbenchProjectContextProps {
  isCompositeEditor: boolean;
  activeProject: DemoProject;
  activeProjectGroup: string;
  activeProjectStage: LearningStage;
  activeProjectRecommendedAfter: string[];
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
  workspaceComparison: WorkspaceComparisonSummary | null;
  activeComparisonVersion: WorkspaceVersionDocument | null;
  comparisonVersionId: string | null;
  onSwitchProject: (projectId: string) => void;
  onJumpToModule: (moduleId: string) => void;
  onRequestRestoreVersion: (versionId: string) => void;
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
  workspaceComparison,
  activeComparisonVersion,
  comparisonVersionId,
  onSwitchProject,
  onJumpToModule,
  onRequestRestoreVersion,
  onSetComparisonVersionId,
  formatVersionTimestamp,
}: WorkbenchProjectContextProps) {
  if (isCompositeEditor) {
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
          <select value={activeProject.id} onChange={(event) => onSwitchProject(event.target.value)}>
            {visibleProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="project-context-card project-context-card-wide">
        <strong>{activeProject.name}</strong>
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
          <p className="comparison-copy">
            Best after: <strong>{activeProjectRecommendedAfter.join(', ')}</strong>
          </p>
        ) : null}
        {showWorkspaceLandmarks ? (
          <div className="workspace-landmarks-card">
            <strong>Workspace Landmarks</strong>
            <p>
              Large graphs can start off-screen. Jump directly to visible sources, protocol context,
              and outputs.
            </p>
            {renderLandmarkGroup('Protocol & Timing', workspaceLandmarks.context, onJumpToModule)}
            {renderLandmarkGroup('Sources', workspaceLandmarks.sources, onJumpToModule)}
            {renderLandmarkGroup('Outputs', workspaceLandmarks.outputs, onJumpToModule)}
          </div>
        ) : null}
        {workspaceVersions.length > 0 ? (
          <div className="workspace-versions-card">
            <strong>Saved Versions</strong>
            <p>Restore an intentional workspace checkpoint without replacing undo/redo.</p>
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
