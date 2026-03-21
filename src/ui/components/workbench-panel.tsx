import { useEffect, useRef, useState, type CSSProperties } from 'react';

import type { ExecutionResult, ModuleRegistry, Project } from '../../engine/types';
import type { DemoProject } from '../demo-projects';
import { getModuleCategory } from '../module-categories';

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

interface PendingConnection {
  fromModuleId: string;
  fromPort: string;
  fromSide: 'left' | 'right';
  fromAnchor: { x: number; y: number };
  mouseX: number;
  mouseY: number;
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
  onAddConnection: (
    fromModuleId: string,
    fromPort: string,
    toModuleId: string,
    toPort: string,
  ) => void;
  onRemoveConnection: (connectionIndex: number) => void;
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
  onAddConnection,
  onRemoveConnection,
  projects,
}: WorkbenchPanelProps) {
  const canvasSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{
    moduleId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);

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

  useEffect(() => {
    if (!pendingConnection) {
      return undefined;
    }

    function handleConnectionMove(event: MouseEvent) {
      const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
      const canvasSurface = canvasSurfaceRef.current;
      if (!canvasRect || !canvasSurface) {
        return;
      }

      setPendingConnection((prev) =>
        prev
          ? {
              ...prev,
              mouseX:
                event.clientX - canvasRect.left + canvasSurface.scrollLeft,
              mouseY:
                event.clientY - canvasRect.top + canvasSurface.scrollTop,
            }
          : null,
      );
    }

    function handleConnectionUp() {
      setPendingConnection(null);
    }

    window.addEventListener('mousemove', handleConnectionMove);
    window.addEventListener('mouseup', handleConnectionUp);

    return () => {
      window.removeEventListener('mousemove', handleConnectionMove);
      window.removeEventListener('mouseup', handleConnectionUp);
    };
  }, [pendingConnection]);

  function startConnectionFromOutput(
    moduleId: string,
    portName: string,
    portIndex: number,
  ) {
    const pos = layout[moduleId];
    if (!pos) return;
    const anchor = getAnchorPosition(pos.x, pos.y, 'right', portIndex);
    setPendingConnection({
      fromModuleId: moduleId,
      fromPort: portName,
      fromSide: 'right',
      fromAnchor: anchor,
      mouseX: anchor.x,
      mouseY: anchor.y,
    });
  }

  function completeConnectionOnInput(moduleId: string, portName: string) {
    if (!pendingConnection) return;
    if (pendingConnection.fromModuleId === moduleId) return;
    onAddConnection(
      pendingConnection.fromModuleId,
      pendingConnection.fromPort,
      moduleId,
      portName,
    );
    setPendingConnection(null);
  }

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
            {activeProjectState.connections.map((connection, connectionIndex) => {
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

              const pathD = `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceControlX} ${sourceAnchor.y}, ${targetControlX} ${targetAnchor.y}, ${targetAnchor.x} ${targetAnchor.y}`;

              return (
                <g
                  key={`${connection.from.moduleId}:${connection.from.port}-${connection.to.moduleId}:${connection.to.port}`}
                  className="connection-group"
                >
                  <path
                    className="connection-hit-area"
                    d={pathD}
                    onClick={() => onRemoveConnection(connectionIndex)}
                  />
                  <path d={pathD} />
                </g>
              );
            })}

            {pendingConnection ? (() => {
              const { fromAnchor, mouseX, mouseY } = pendingConnection;
              const dx = Math.abs(mouseX - fromAnchor.x);
              const bend = Math.max(56, dx * 0.42);
              return (
                <path
                  className="pending-connection"
                  d={`M ${fromAnchor.x} ${fromAnchor.y} C ${fromAnchor.x + bend} ${fromAnchor.y}, ${mouseX - bend} ${mouseY}, ${mouseX} ${mouseY}`}
                />
              );
            })() : null}
          </svg>

          {activeProjectState.modules.map((moduleInstance) => {
            const position = layout[moduleInstance.id] ?? { x: 24, y: 24 };
            const def = registry[moduleInstance.defId];
            const category = getModuleCategory(moduleInstance.defId);

            return (
              <div
                key={moduleInstance.id}
                className={
                  `graph-node graph-node-${category}` +
                  (moduleInstance.id === selectedModuleId ? ' graph-node-selected' : '')
                }
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
              >
                <div
                  className="graph-node-body"
                  onClick={() => onSelectModule(moduleInstance.id)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
                    const canvasSurface = canvasSurfaceRef.current;
                    if (!canvasRect || !canvasSurface) return;

                    onSelectModule(moduleInstance.id);
                    setDragState({
                      moduleId: moduleInstance.id,
                      pointerOffsetX: event.clientX - canvasRect.left + canvasSurface.scrollLeft - position.x,
                      pointerOffsetY: event.clientY - canvasRect.top + canvasSurface.scrollTop - position.y,
                    });
                  }}
                >
                  <span className="graph-node-type">{moduleInstance.defId}</span>
                  <strong>{moduleInstance.id}</strong>
                  <div className="graph-node-ports">
                    <span>{def?.inputs.length ?? 0} in</span>
                    <span>{def?.outputs.length ?? 0} out</span>
                  </div>
                </div>

                <div className="graph-node-anchor-group graph-node-anchor-group-in">
                  {(def?.inputs ?? []).map((port, index) => (
                    <span
                      key={port.name}
                      className={
                        pendingConnection
                          ? 'graph-port-anchor graph-port-anchor-in graph-port-droppable'
                          : 'graph-port-anchor graph-port-anchor-in'
                      }
                      style={{ top: `${PORT_START_Y + index * PORT_GAP}px` }}
                      title={`${port.name}: ${port.type}`}
                      onMouseUp={() =>
                        completeConnectionOnInput(moduleInstance.id, port.name)
                      }
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
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        startConnectionFromOutput(
                          moduleInstance.id,
                          port.name,
                          index,
                        );
                      }}
                    >
                      <span className="graph-port-label">OUT</span>
                      <span className="graph-port-dot" />
                    </span>
                  ))}
                </div>
              </div>
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
