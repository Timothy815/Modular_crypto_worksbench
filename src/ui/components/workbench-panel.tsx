import type { ExecutionResult, Project } from '../../engine/types';
import type { DemoProject } from '../demo-projects';

interface WorkbenchPanelProps {
  activeProject: DemoProject;
  activeProjectState: Project;
  execution: ExecutionResult | null;
  executionError: string | null;
  selectedModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onSwitchProject: (projectId: string) => void;
  projects: DemoProject[];
}

export function WorkbenchPanel({
  activeProject,
  activeProjectState,
  execution,
  executionError,
  selectedModuleId,
  onSelectModule,
  onSwitchProject,
  projects,
}: WorkbenchPanelProps) {
  return (
    <section className="panel canvas-panel">
      <div className="panel-head">
        <p className="panel-label">Workbench</p>
        <h2>Demo Graphs</h2>
      </div>

      <div className="project-switcher">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={project.id === activeProject.id ? 'switch-chip active' : 'switch-chip'}
            onClick={() => onSwitchProject(project.id)}
          >
            {project.name}
          </button>
        ))}
      </div>

      <p className="project-summary">{activeProject.summary}</p>
      <p className="mono-line">{activeProject.pipeline}</p>

      <div className="graph-strip">
        {activeProjectState.modules.map((moduleInstance) => (
          <button
            key={moduleInstance.id}
            type="button"
            className={
              moduleInstance.id === selectedModuleId
                ? 'graph-node graph-node-selected'
                : 'graph-node'
            }
            onClick={() => onSelectModule(moduleInstance.id)}
          >
            <span className="graph-node-type">{moduleInstance.defId}</span>
            <strong>{moduleInstance.id}</strong>
          </button>
        ))}
      </div>

      {executionError ? (
        <div className="execution-error">
          <span className="meta-label">Execution Error</span>
          <strong>{executionError}</strong>
        </div>
      ) : null}

      <div className="graph-meta">
        <div>
          <span className="meta-label">Modules</span>
          <strong>{activeProjectState.modules.length}</strong>
        </div>
        <div>
          <span className="meta-label">Connections</span>
          <strong>{activeProjectState.connections.length}</strong>
        </div>
        <div>
          <span className="meta-label">Execution Order</span>
          <strong>{execution ? execution.order.join(' -> ') : 'blocked'}</strong>
        </div>
      </div>
    </section>
  );
}
