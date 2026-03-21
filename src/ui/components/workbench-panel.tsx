import type { ExecutionResult, ModuleRegistry, Project } from '../../engine/types';
import type { DemoProject } from '../demo-projects';

interface WorkbenchPanelProps {
  activeProject: DemoProject;
  activeProjectState: Project;
  execution: ExecutionResult | null;
  executionError: string | null;
  registry: ModuleRegistry;
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
  registry,
  selectedModuleId,
  onSelectModule,
  onSwitchProject,
  projects,
}: WorkbenchPanelProps) {
  const canvasWidth = Math.max(
    980,
    ...Object.values(activeProject.layout).map((position) => position.x + 180),
  );
  const canvasHeight = Math.max(
    360,
    ...Object.values(activeProject.layout).map((position) => position.y + 140),
  );

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

      <div className="canvas-surface">
        <div
          className="graph-canvas"
          style={
            {
              '--canvas-width': `${canvasWidth}px`,
              '--canvas-height': `${canvasHeight}px`,
            } as React.CSSProperties
          }
        >
          <svg
            className="graph-connections"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="none"
          >
            {activeProjectState.connections.map((connection) => {
              const from = activeProject.layout[connection.from.moduleId];
              const to = activeProject.layout[connection.to.moduleId];

              if (!from || !to) {
                return null;
              }

              const x1 = from.x + 132;
              const y1 = from.y + 44;
              const x2 = to.x;
              const y2 = to.y + 44;
              const midX = (x1 + x2) / 2;

              return (
                <path
                  key={`${connection.from.moduleId}:${connection.from.port}-${connection.to.moduleId}:${connection.to.port}`}
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                />
              );
            })}
          </svg>

          {activeProjectState.modules.map((moduleInstance) => {
            const position = activeProject.layout[moduleInstance.id] ?? { x: 24, y: 24 };
            const def = registry[moduleInstance.defId];

            return (
              <button
                key={moduleInstance.id}
                type="button"
                className={
                  moduleInstance.id === selectedModuleId
                    ? 'graph-node graph-node-selected'
                    : 'graph-node'
                }
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                onClick={() => onSelectModule(moduleInstance.id)}
              >
                <span className="graph-node-type">{moduleInstance.defId}</span>
                <strong>{moduleInstance.id}</strong>
                <div className="graph-node-ports">
                  <span>{def?.inputs.length ?? 0} in</span>
                  <span>{def?.outputs.length ?? 0} out</span>
                </div>
              </button>
            );
          })}
        </div>
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
