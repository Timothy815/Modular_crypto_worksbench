import { useEffect, useRef, useState, type CSSProperties } from 'react';

import type { ExecutionResult, ModuleRegistry, Project } from '../../engine/types';
import type { DemoProject } from '../demo-projects';

const NODE_WIDTH = 132;
const PORT_GAP = 18;
const PORT_START_Y = 34;

function getAnchorPosition(
  x: number,
  y: number,
  side: 'left' | 'right',
  portIndex: number,
) {
  return {
    x: side === 'left' ? x : x + NODE_WIDTH,
    y: y + PORT_START_Y + portIndex * PORT_GAP,
  };
}

interface WorkbenchPanelProps {
  activeProject: DemoProject;
  activeProjectState: Project;
  layout: Record<string, { x: number; y: number }>;
  execution: ExecutionResult | null;
  executionError: string | null;
  registry: ModuleRegistry;
  selectedModuleId: string | null;
  onMoveModule: (moduleId: string, x: number, y: number) => void;
  onSelectModule: (moduleId: string) => void;
  onSwitchProject: (projectId: string) => void;
  projects: DemoProject[];
}

export function WorkbenchPanel({
  activeProject,
  activeProjectState,
  layout,
  execution,
  executionError,
  registry,
  selectedModuleId,
  onMoveModule,
  onSelectModule,
  onSwitchProject,
  projects,
}: WorkbenchPanelProps) {
  const canvasSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{
    moduleId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);

  const canvasWidth = Math.max(
    980,
    ...Object.values(layout).map((position) => position.x + 180),
  );
  const canvasHeight = Math.max(
    360,
    ...Object.values(layout).map((position) => position.y + 140),
  );

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    function handlePointerMove(event: MouseEvent) {
      const activeDrag = dragState;
      if (!activeDrag) {
        return;
      }

      const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
      const canvasSurface = canvasSurfaceRef.current;
      if (!canvasRect || !canvasSurface) {
        return;
      }

      const nextX = Math.max(
        16,
        event.clientX - canvasRect.left + canvasSurface.scrollLeft - activeDrag.pointerOffsetX,
      );
      const nextY = Math.max(
        16,
        event.clientY - canvasRect.top + canvasSurface.scrollTop - activeDrag.pointerOffsetY,
      );
      onMoveModule(activeDrag.moduleId, nextX, nextY);
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [dragState, onMoveModule]);

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

      <div ref={canvasSurfaceRef} className="canvas-surface">
        <div
          className="graph-canvas"
          style={
            {
              '--canvas-width': `${canvasWidth}px`,
              '--canvas-height': `${canvasHeight}px`,
            } as CSSProperties
          }
        >
          <svg
            className="graph-connections"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="none"
          >
            {activeProjectState.connections.map((connection) => {
              const from = layout[connection.from.moduleId];
              const to = layout[connection.to.moduleId];
              const sourceDef = registry[
                activeProjectState.modules.find(
                  (moduleInstance) => moduleInstance.id === connection.from.moduleId,
                )?.defId ?? ''
              ];
              const targetDef = registry[
                activeProjectState.modules.find(
                  (moduleInstance) => moduleInstance.id === connection.to.moduleId,
                )?.defId ?? ''
              ];

              if (!from || !to || !sourceDef || !targetDef) {
                return null;
              }

              const sourceIndex = Math.max(
                0,
                sourceDef.outputs.findIndex((port) => port.name === connection.from.port),
              );
              const targetIndex = Math.max(
                0,
                targetDef.inputs.findIndex((port) => port.name === connection.to.port),
              );

              const sourceSide = from.x <= to.x ? 'right' : 'left';
              const targetSide = from.x <= to.x ? 'left' : 'right';
              const sourceAnchor = getAnchorPosition(from.x, from.y, sourceSide, sourceIndex);
              const targetAnchor = getAnchorPosition(to.x, to.y, targetSide, targetIndex);
              const horizontalDistance = Math.abs(targetAnchor.x - sourceAnchor.x);
              const bend = Math.max(56, horizontalDistance * 0.42);
              const sourceControlX =
                sourceSide === 'right' ? sourceAnchor.x + bend : sourceAnchor.x - bend;
              const targetControlX =
                targetSide === 'left' ? targetAnchor.x - bend : targetAnchor.x + bend;

              return (
                <path
                  key={`${connection.from.moduleId}:${connection.from.port}-${connection.to.moduleId}:${connection.to.port}`}
                  d={`M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceControlX} ${sourceAnchor.y}, ${targetControlX} ${targetAnchor.y}, ${targetAnchor.x} ${targetAnchor.y}`}
                />
              );
            })}
          </svg>

          {activeProjectState.modules.map((moduleInstance) => {
            const position = layout[moduleInstance.id] ?? { x: 24, y: 24 };
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
                onMouseDown={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  onSelectModule(moduleInstance.id);
                  setDragState({
                    moduleId: moduleInstance.id,
                    pointerOffsetX: event.clientX - rect.left,
                    pointerOffsetY: event.clientY - rect.top,
                  });
                }}
              >
                <div className="graph-node-anchor-group graph-node-anchor-group-in">
                  {(def?.inputs ?? []).map((port, index) => (
                    <span
                      key={port.name}
                      className="graph-port-anchor graph-port-anchor-in"
                      style={{ top: `${PORT_START_Y + index * PORT_GAP}px` }}
                      title={`${port.name}: ${port.type}`}
                    >
                      <span className="graph-port-dot" />
                      <span className="graph-port-label">IN</span>
                    </span>
                  ))}
                </div>

                <div className="graph-node-anchor-group graph-node-anchor-group-out">
                  {(def?.outputs ?? []).map((port, index) => (
                    <span
                      key={port.name}
                      className="graph-port-anchor graph-port-anchor-out"
                      style={{ top: `${PORT_START_Y + index * PORT_GAP}px` }}
                      title={`${port.name}: ${port.type}`}
                    >
                      <span className="graph-port-label">OUT</span>
                      <span className="graph-port-dot" />
                    </span>
                  ))}
                </div>

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
