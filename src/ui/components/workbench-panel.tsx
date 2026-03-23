import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import type {
  ExecutionResult,
  ModuleRegistry,
  Project,
  ValidationIssue,
} from '../../engine/types';
import { validateProject } from '../../engine/validation';
import type { DemoProject } from '../demo-projects';
import { getModuleCategory } from '../module-categories';
import type { WorkbenchAnnotation } from '../workbench-document';
import type { TutorialStep } from '../tutorials';

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
  fromAnchor: { x: number; y: number };
  mouseX: number;
  mouseY: number;
}

interface TargetPortState {
  valid: boolean;
  reason: string | null;
}

interface WorkbenchPanelProps {
  activeProject: DemoProject;
  title?: string;
  summary?: string;
  pipelineLabel?: string;
  activeProjectState: Project;
  layout: Record<string, { x: number; y: number }>;
  annotations: WorkbenchAnnotation[];
  execution: ExecutionResult | null;
  executionError: string | null;
  validationIssues: ValidationIssue[];
  registry: ModuleRegistry;
  selectedModuleId: string | null;
  selectedModuleIds: string[];
  hoveredTraceModuleId?: string | null;
  steppedModuleId?: string | null;
  divergenceModuleId?: string | null;
  tutorialStep?: TutorialStep | null;
  challengeSolved?: boolean;
  isCompositeEditor?: boolean;
  probedModuleIds?: string[];
  isTickedMode?: boolean;
  tickCount?: number;
  currentTick?: number;
  collectedOutput?: string | null;
  tickedParamsByModule?: Record<string, Record<string, unknown>[]> | null;
  tickHistoryByModule?: Record<string, string[]> | null;
  onSetTickedMode?: (enabled: boolean) => void;
  onSetCurrentTick?: (tick: number) => void;
  isTickPlaybackActive?: boolean;
  tickPlaybackSpeedMs?: number;
  onSetTickPlaybackActive?: (active: boolean) => void;
  onSetTickPlaybackSpeed?: (speedMs: number) => void;
  onToggleProbe?: (moduleId: string) => void;
  onMoveModule: (moduleId: string, x: number, y: number) => void;
  onAddAnnotation: () => void;
  onMoveAnnotation: (annotationId: string, x: number, y: number) => void;
  onUpdateAnnotationText: (annotationId: string, text: string) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  onSelectModule: (moduleId: string, additive?: boolean) => void;
  onRequestCreateComposite: () => void;
  onSwitchProject: (projectId: string) => void;
  onAddConnection: (
    fromModuleId: string,
    fromPort: string,
    toModuleId: string,
    toPort: string,
  ) => void;
  onRemoveConnection: (connectionIndex: number) => void;
  onExportDocument: () => void;
  onImportDocument: (file: File) => void;
  projects: DemoProject[];
}

export function WorkbenchPanel({
  activeProject,
  title,
  summary,
  pipelineLabel,
  activeProjectState,
  layout,
  annotations,
  execution,
  executionError,
  validationIssues,
  registry,
  selectedModuleId,
  selectedModuleIds,
  hoveredTraceModuleId = null,
  steppedModuleId = null,
  divergenceModuleId = null,
  tutorialStep = null,
  challengeSolved = false,
  isCompositeEditor = false,
  probedModuleIds = [],
  isTickedMode = false,
  tickCount = 0,
  currentTick = 0,
  collectedOutput = null,
  tickedParamsByModule = null,
  tickHistoryByModule = null,
  onSetTickedMode,
  onSetCurrentTick,
  isTickPlaybackActive = false,
  tickPlaybackSpeedMs = 500,
  onSetTickPlaybackActive,
  onSetTickPlaybackSpeed,
  onToggleProbe,
  onMoveModule,
  onAddAnnotation,
  onMoveAnnotation,
  onUpdateAnnotationText,
  onRemoveAnnotation,
  onSelectModule,
  onRequestCreateComposite,
  onSwitchProject,
  onAddConnection,
  onRemoveConnection,
  onExportDocument,
  onImportDocument,
  projects,
}: WorkbenchPanelProps) {
  const canvasSurfaceRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [dragState, setDragState] = useState<{
    moduleId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);
  const [annotationDragState, setAnnotationDragState] = useState<{
    annotationId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);
  const projectGroups = useMemo(
    () => [...new Set(projects.map((project) => project.group ?? 'Other'))],
    [projects],
  );
  const activeProjectGroup = activeProject.group ?? 'Other';

  const canvasWidth = Math.max(
    980,
    ...Object.values(layout).map((position) => position.x + 180),
  );
  const canvasHeight = Math.max(
    360,
    ...Object.values(layout).map((position) => position.y + 140),
  );

  const visibleProjects = useMemo(
    () => projects.filter((project) => (project.group ?? 'Other') === activeProjectGroup),
    [activeProjectGroup, projects],
  );

  useEffect(() => {
    if (!dragState && !annotationDragState) {
      return undefined;
    }

    function handlePointerMove(event: MouseEvent) {
      const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
      const canvasSurface = canvasSurfaceRef.current;
      if (!canvasRect || !canvasSurface) {
        return;
      }

      if (dragState) {
        const nextX = Math.max(
          16,
          event.clientX - canvasRect.left + canvasSurface.scrollLeft - dragState.pointerOffsetX,
        );
        const nextY = Math.max(
          16,
          event.clientY - canvasRect.top + canvasSurface.scrollTop - dragState.pointerOffsetY,
        );
        onMoveModule(dragState.moduleId, nextX, nextY);
      }

      if (annotationDragState) {
        const nextX = Math.max(
          16,
          event.clientX -
            canvasRect.left +
            canvasSurface.scrollLeft -
            annotationDragState.pointerOffsetX,
        );
        const nextY = Math.max(
          16,
          event.clientY -
            canvasRect.top +
            canvasSurface.scrollTop -
            annotationDragState.pointerOffsetY,
        );
        onMoveAnnotation(annotationDragState.annotationId, nextX, nextY);
      }
    }

    function handlePointerUp() {
      setDragState(null);
      setAnnotationDragState(null);
    }

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [annotationDragState, dragState, onMoveAnnotation, onMoveModule]);

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

  const targetPortStates = useMemo(() => {
    if (!pendingConnection) {
      return {};
    }

    const nextStates: Record<string, TargetPortState> = {};

    for (const moduleInstance of activeProjectState.modules) {
      const targetDef = registry[moduleInstance.defId];
      if (!targetDef) {
        continue;
      }

      for (const inputPort of targetDef.inputs) {
        nextStates[`${moduleInstance.id}:${inputPort.name}`] = getTargetPortState(
          activeProjectState,
          registry,
          pendingConnection.fromModuleId,
          pendingConnection.fromPort,
          moduleInstance.id,
          inputPort.name,
        );
      }
    }

    return nextStates;
  }, [activeProjectState, pendingConnection, registry]);

  const moduleIssueCountById = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const issue of validationIssues) {
      if (issue.moduleId) {
        counts[issue.moduleId] = (counts[issue.moduleId] ?? 0) + 1;
      }
      if (issue.connection) {
        counts[issue.connection.from.moduleId] =
          (counts[issue.connection.from.moduleId] ?? 0) + 1;
        counts[issue.connection.to.moduleId] =
          (counts[issue.connection.to.moduleId] ?? 0) + 1;
      }
    }

    return counts;
  }, [validationIssues]);

  const executionSignalByModuleId = useMemo(() => {
    if (!execution) {
      return {};
    }

    return Object.fromEntries(
      execution.trace.map((entry) => {
        const primaryOutput = Object.values(entry.outputs)[0] ?? null;
        return [entry.moduleId, primaryOutput ?? entry.inputs.in ?? null];
      }),
    ) as Record<string, ExecutionResult['trace'][number]['inputs'][string] | null>;
  }, [execution]);

  function startConnectionFromOutput(
    moduleId: string,
    portName: string,
    portIndex: number,
  ) {
    const pos = layout[moduleId];
    if (!pos) return;
    const anchor = getAnchorPosition(pos.x, pos.y, 'right', portIndex);
    setConnectionFeedback(null);
    setPendingConnection({
      fromModuleId: moduleId,
      fromPort: portName,
      fromAnchor: anchor,
      mouseX: anchor.x,
      mouseY: anchor.y,
    });
  }

  function completeConnectionOnInput(moduleId: string, portName: string) {
    if (!pendingConnection) return;
    const targetState = targetPortStates[`${moduleId}:${portName}`];
    if (!targetState?.valid) {
      setConnectionFeedback(targetState?.reason ?? 'Connection blocked.');
      return;
    }

    onAddConnection(
      pendingConnection.fromModuleId,
      pendingConnection.fromPort,
      moduleId,
      portName,
    );
    setConnectionFeedback(null);
    setPendingConnection(null);
  }

  return (
    <section className={challengeSolved ? 'panel canvas-panel canvas-panel-success' : 'panel canvas-panel'}>
      <div className="panel-head">
        <p className="panel-label">Workbench</p>
        <h2>{title ?? 'Demo Graphs'}</h2>
      </div>

      {!isCompositeEditor ? (
        <div className="project-selector-stack">
          <div className="content-filter-row project-selector-row">
            <label className="project-selector">
              <span className="meta-label">Group</span>
              <select
                value={activeProjectGroup}
                onChange={(event) => {
                  const nextGroup = event.target.value;
                  const firstProject = projects.find(
                    (project) => (project.group ?? 'Other') === nextGroup,
                  );
                  if (firstProject && firstProject.id !== activeProject.id) {
                    onSwitchProject(firstProject.id);
                  }
                }}
              >
                {projectGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label className="project-selector">
              <span className="meta-label">Demo Graph</span>
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
          </div>
          <div className="project-context-card project-context-card-wide">
            <strong>{activeProject.name}</strong>
            <p>{summary ?? activeProject.summary}</p>
            <code>{pipelineLabel ?? activeProject.pipeline}</code>
          </div>
        </div>
      ) : null}

      <div className="project-actions">
        {!isCompositeEditor ? (
          <>
            <button
              type="button"
              className="mini-action-button"
              onClick={onAddAnnotation}
            >
              Add Note
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onExportDocument}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={() => importInputRef.current?.click()}
            >
              Import JSON
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="mini-action-button"
          onClick={onRequestCreateComposite}
          disabled={selectedModuleIds.length === 0}
        >
          Create Composite
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportDocument(file);
            }
            event.target.value = '';
          }}
        />
      </div>

      {tutorialStep ? (
        <div className="tutorial-step-banner">
          <span className="meta-label">Tutorial Step</span>
          <strong>{tutorialStep.title}</strong>
          <p>{tutorialStep.body}</p>
          {tutorialStep.focusModuleId ? (
            <p className="tutorial-step-target">
              Focus: <strong>{tutorialStep.focusModuleId}</strong>
            </p>
          ) : null}
        </div>
      ) : null}
      {selectedModuleIds.length > 0 ? (
        <p className="selection-status">
          Selected modules: <strong>{selectedModuleIds.length}</strong>. Use
          <strong> Shift-click</strong> or <strong> Cmd/Ctrl-click</strong> to
          build a composite selection.
        </p>
      ) : null}
      {pendingConnection ? (
        <p className="connection-status">
          Wiring from <strong>{pendingConnection.fromModuleId}.{pendingConnection.fromPort}</strong>.
          Valid inputs glow teal. Invalid targets glow red.
        </p>
      ) : connectionFeedback ? (
        <p className="connection-status connection-status-warning">{connectionFeedback}</p>
      ) : null}

      {!isCompositeEditor ? (
        <div className="tick-bar">
          <label className="tick-bar-toggle">
            <input
              type="checkbox"
              checked={isTickedMode}
              onChange={(e) => onSetTickedMode?.(e.target.checked)}
            />
            <span>Ticked Mode</span>
          </label>
          {isTickedMode && tickCount > 0 ? (
            <>
              <span className="tick-bar-label">
                Tick {currentTick + 1} / {tickCount}
              </span>
              <input
                type="range"
                className="tick-bar-slider"
                min={0}
                max={tickCount - 1}
                value={currentTick}
                onChange={(e) => onSetCurrentTick?.(Number(e.target.value))}
                aria-label="Tick scrubber"
              />
              <button
                type="button"
                className="mini-action-button"
                disabled={currentTick <= 0 || isTickPlaybackActive}
                onClick={() => onSetCurrentTick?.(currentTick - 1)}
                aria-label="Previous tick"
              >
                Prev
              </button>
              <button
                type="button"
                className="mini-action-button"
                disabled={tickCount <= 1 || currentTick >= tickCount - 1}
                onClick={() => onSetTickPlaybackActive?.(!isTickPlaybackActive)}
                aria-label={isTickPlaybackActive ? 'Pause tick playback' : 'Play tick playback'}
              >
                {isTickPlaybackActive ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="mini-action-button"
                disabled={currentTick >= tickCount - 1 || isTickPlaybackActive}
                onClick={() => onSetCurrentTick?.(currentTick + 1)}
                aria-label="Next tick"
              >
                Next
              </button>
              <label className="tick-bar-speed">
                <span className="tick-bar-label">Speed</span>
                <input
                  type="range"
                  className="tick-bar-speed-slider"
                  min={100}
                  max={1500}
                  step={100}
                  value={tickPlaybackSpeedMs}
                  onChange={(e) => onSetTickPlaybackSpeed?.(Number(e.target.value))}
                  aria-label="Tick playback speed"
                />
                <span className="tick-bar-label">{(tickPlaybackSpeedMs / 1000).toFixed(1)}s</span>
              </label>
              {collectedOutput !== null ? (
                <span className="tick-bar-collected">
                  <span className="meta-label">Output</span> <strong>{collectedOutput}</strong>
                </span>
              ) : null}
            </>
          ) : isTickedMode ? (
            <span className="tick-bar-label tick-bar-label-muted">
              No tick-sliceable sources in graph
            </span>
          ) : null}
        </div>
      ) : null}

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
                  className={
                    validationIssues.some(
                      (issue) =>
                        issue.connection?.from.moduleId === connection.from.moduleId &&
                        issue.connection?.from.port === connection.from.port &&
                        issue.connection?.to.moduleId === connection.to.moduleId &&
                        issue.connection?.to.port === connection.to.port,
                    )
                      ? 'connection-group connection-group-invalid'
                      : 'connection-group'
                  }
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
            const category = def ? getModuleCategory(def) : getModuleCategory(moduleInstance.defId);

            return (
              <div
                key={moduleInstance.id}
                className={
                  `graph-node graph-node-${category}` +
                  (selectedModuleIds.includes(moduleInstance.id) ? ' graph-node-selected' : '') +
                  (moduleInstance.id === selectedModuleId ? ' graph-node-primary-selected' : '') +
                  (moduleInstance.id === hoveredTraceModuleId ? ' graph-node-trace-hovered' : '') +
                  (moduleInstance.id === steppedModuleId ? ' graph-node-stepped' : '') +
                  (moduleInstance.id === divergenceModuleId ? ' graph-node-divergence' : '') +
                  (moduleInstance.id === tutorialStep?.focusModuleId ? ' graph-node-tutorial-focus' : '') +
                  (probedModuleIds.includes(moduleInstance.id) ? ' graph-node-probed' : '') +
                  ((moduleIssueCountById[moduleInstance.id] ?? 0) > 0 ? ' graph-node-invalid' : '')
                }
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
              >
                <div
                  className="graph-node-body"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
                    const canvasSurface = canvasSurfaceRef.current;
                    if (!canvasRect || !canvasSurface) return;

                    onSelectModule(
                      moduleInstance.id,
                      event.shiftKey || event.metaKey || event.ctrlKey,
                    );
                    setDragState({
                      moduleId: moduleInstance.id,
                      pointerOffsetX: event.clientX - canvasRect.left + canvasSurface.scrollLeft - position.x,
                      pointerOffsetY: event.clientY - canvasRect.top + canvasSurface.scrollTop - position.y,
                    });
                  }}
                >
                  <span className="graph-node-type">{moduleInstance.defId}</span>
                  <strong>{moduleInstance.id}</strong>
                  {moduleInstance.id === tutorialStep?.focusModuleId ? (
                    <span className="graph-node-tutorial-badge">Tutorial</span>
                  ) : null}
                  {(moduleIssueCountById[moduleInstance.id] ?? 0) > 0 ? (
                    <span className="graph-node-issue-badge">
                      {moduleIssueCountById[moduleInstance.id]}
                    </span>
                  ) : null}
                  {onToggleProbe ? (
                    <button
                      type="button"
                      className={
                        probedModuleIds.includes(moduleInstance.id)
                          ? 'graph-node-probe-button probed'
                          : 'graph-node-probe-button'
                      }
                      aria-label={
                        probedModuleIds.includes(moduleInstance.id)
                          ? `Unpin signal probe for ${moduleInstance.id}`
                          : `Pin signal probe for ${moduleInstance.id}`
                      }
                      title={
                        probedModuleIds.includes(moduleInstance.id)
                          ? 'Unpin signal probe'
                          : 'Pin signal probe'
                      }
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleProbe(moduleInstance.id);
                      }}
                    >
                      {probedModuleIds.includes(moduleInstance.id) ? '\u25C9' : '\u25CB'}
                    </button>
                  ) : null}
                  {isTickedMode && tickedParamsByModule?.[moduleInstance.id] && tickCount > 0 ? (() => {
                    const tickParams = tickedParamsByModule[moduleInstance.id]?.[currentTick];
                    if (!tickParams) return null;
                    const positionValue = tickParams.position;
                    if (positionValue !== undefined) {
                      return (
                        <span className="graph-node-tick-state" title={`position = ${positionValue}`}>
                          pos {String(positionValue)}
                        </span>
                      );
                    }
                    if (moduleInstance.defId !== 'BaudotSource') return null;
                    const currentCharacter =
                      typeof tickParams.value === 'string' && tickParams.value.length > 0
                        ? tickParams.value
                        : null;
                    if (!currentCharacter) return null;
                    return (
                      <span className="graph-node-tick-state" title={`current character = ${currentCharacter}`}>
                        char {currentCharacter}
                      </span>
                    );
                  })() : null}
                  {isTickedMode && (moduleInstance.defId === 'Output' || moduleInstance.defId === 'BitOutput') ? (() => {
                    const signal = executionSignalByModuleId[moduleInstance.id];
                    if (!signal) return null;
                    const value = signal.type === 'symbol' ? signal.value : `[${signal.value.join(',')}]`;
                    return (
                      <span className="graph-node-tick-state" title={`current value = ${value}`}>
                        {value}
                      </span>
                    );
                  })() : null}
                  {isTickedMode && tickHistoryByModule?.[moduleInstance.id]?.length ? (() => {
                    const history = tickHistoryByModule[moduleInstance.id];
                    const start = Math.max(0, currentTick - 4);
                    const visibleHistory = history.slice(start, currentTick + 1);
                    if (visibleHistory.length <= 1) {
                      return null;
                    }

                    return (
                      <div className="graph-node-history" title="Recent tick history">
                        {visibleHistory.map((value, index) => (
                          <span
                            key={`${moduleInstance.id}-history-${start + index}`}
                            className={
                              start + index === currentTick
                                ? 'graph-node-history-chip active'
                                : 'graph-node-history-chip'
                            }
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    );
                  })() : null}
                  <div className="graph-node-ports">
                    <span>{def?.inputs.length ?? 0} in</span>
                    <span>{def?.outputs.length ?? 0} out</span>
                  </div>
                </div>

                <div className="graph-node-anchor-group graph-node-anchor-group-in">
                  {(def?.inputs ?? []).map((port, index) => (
                    <span
                      key={port.name}
                      className={getInputAnchorClassName(
                        pendingConnection,
                        targetPortStates[`${moduleInstance.id}:${port.name}`],
                      )}
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
                      className={
                        pendingConnection?.fromModuleId === moduleInstance.id &&
                        pendingConnection.fromPort === port.name
                          ? 'graph-port-anchor graph-port-anchor-out graph-port-anchor-active'
                          : 'graph-port-anchor graph-port-anchor-out'
                      }
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

          {tutorialStep?.focusModuleId && layout[tutorialStep.focusModuleId] ? (() => {
            const focusPos = layout[tutorialStep.focusModuleId];
            const CALLOUT_WIDTH = 240;
            const placeRight = focusPos.x + NODE_WIDTH + 18 + CALLOUT_WIDTH < canvasWidth;
            const placeBelow = focusPos.y < canvasHeight / 2;
            return (
              <div
                className="tutorial-canvas-callout"
                style={{
                  left: placeRight
                    ? `${focusPos.x + NODE_WIDTH + 18}px`
                    : `${focusPos.x - CALLOUT_WIDTH - 18}px`,
                  top: placeBelow
                    ? `${focusPos.y - 6}px`
                    : undefined,
                  bottom: placeBelow
                    ? undefined
                    : `${canvasHeight - focusPos.y - 6}px`,
                }}
              >
                <span className="meta-label">Tutorial Focus</span>
                <strong>{tutorialStep.title}</strong>
                <p>{tutorialStep.body}</p>
              </div>
            );
          })() : null}

          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="canvas-annotation"
              style={{ left: `${annotation.x}px`, top: `${annotation.y}px` }}
            >
              <div
                className="canvas-annotation-handle"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
                  const canvasSurface = canvasSurfaceRef.current;
                  if (!canvasRect || !canvasSurface) {
                    return;
                  }

                  setAnnotationDragState({
                    annotationId: annotation.id,
                    pointerOffsetX:
                      event.clientX - canvasRect.left + canvasSurface.scrollLeft - annotation.x,
                    pointerOffsetY:
                      event.clientY - canvasRect.top + canvasSurface.scrollTop - annotation.y,
                  });
                }}
              >
                Note
                <button
                  type="button"
                  className="annotation-delete-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveAnnotation(annotation.id);
                  }}
                >
                  ×
                </button>
              </div>
              <textarea
                value={annotation.text}
                onChange={(event) =>
                  onUpdateAnnotationText(annotation.id, event.target.value)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {executionError ? (
        <div className="execution-error">
          <span className="meta-label">
            {validationIssues.length > 0 ? 'Validation Blocking Execution' : 'Execution Error'}
          </span>
          <strong>
            {validationIssues.length > 0
              ? validationIssues[0]?.message ?? executionError
              : executionError}
          </strong>
          {validationIssues.length > 1 ? (
            <p className="execution-error-detail">
              {validationIssues.length - 1} more issue{validationIssues.length === 2 ? '' : 's'} listed in the inspector.
            </p>
          ) : null}
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
        <div>
          <span className="meta-label">Validation</span>
          <strong>{validationIssues.length > 0 ? `${validationIssues.length} issues` : 'clean'}</strong>
        </div>
      </div>
    </section>
  );
}

function getInputAnchorClassName(
  pendingConnection: PendingConnection | null,
  targetState: TargetPortState | undefined,
) {
  if (!pendingConnection) {
    return 'graph-port-anchor graph-port-anchor-in';
  }

  if (targetState?.valid) {
    return 'graph-port-anchor graph-port-anchor-in graph-port-droppable graph-port-valid';
  }

  return 'graph-port-anchor graph-port-anchor-in graph-port-droppable graph-port-invalid';
}

function getTargetPortState(
  project: Project,
  registry: ModuleRegistry,
  fromModuleId: string,
  fromPort: string,
  toModuleId: string,
  toPort: string,
): TargetPortState {
  if (fromModuleId === toModuleId) {
    return {
      valid: false,
      reason: 'A module cannot connect directly to its own input.',
    };
  }

  const sourceInstance = project.modules.find((moduleInstance) => moduleInstance.id === fromModuleId);
  const targetInstance = project.modules.find((moduleInstance) => moduleInstance.id === toModuleId);
  if (!sourceInstance || !targetInstance) {
    return {
      valid: false,
      reason: 'Connection references a missing module.',
    };
  }

  const sourceDef = registry[sourceInstance.defId];
  const targetDef = registry[targetInstance.defId];
  if (!sourceDef || !targetDef) {
    return {
      valid: false,
      reason: 'Connection references a missing module definition.',
    };
  }

  const sourcePortDef = sourceDef.outputs.find((port) => port.name === fromPort);
  const targetPortDef = targetDef.inputs.find((port) => port.name === toPort);
  if (!sourcePortDef || !targetPortDef) {
    return {
      valid: false,
      reason: 'Connection references an unknown port.',
    };
  }

  if (sourcePortDef.type !== targetPortDef.type) {
    return {
      valid: false,
      reason: `Expected ${targetPortDef.type} input, but source provides ${sourcePortDef.type}.`,
    };
  }

  if (
    project.connections.some(
      (connection) =>
        connection.from.moduleId === fromModuleId &&
        connection.from.port === fromPort &&
        connection.to.moduleId === toModuleId &&
        connection.to.port === toPort,
    )
  ) {
    return {
      valid: false,
      reason: 'That connection already exists.',
    };
  }

  if (
    project.connections.some(
      (connection) =>
        connection.to.moduleId === toModuleId &&
        connection.to.port === toPort,
    )
  ) {
    return {
      valid: false,
      reason: 'Each input port may only accept one incoming connection.',
    };
  }

  const candidateProject: Project = {
    modules: project.modules,
    connections: [
      ...project.connections,
      {
        from: { moduleId: fromModuleId, port: fromPort },
        to: { moduleId: toModuleId, port: toPort },
      },
    ],
  };
  const validation = validateProject(candidateProject, registry);
  if (validation.issues.some((issue) => issue.code === 'cycle-detected')) {
    return {
      valid: false,
      reason: 'That connection would introduce a cycle.',
    };
  }

  return {
    valid: true,
    reason: null,
  };
}
