import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import type { ModuleDefinition } from '../../engine/types';
import type {
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleRegistry,
  Project,
  ValidationIssue,
} from '../../engine/types';
import { isOutputSinkDefId } from '../../engine/output-sinks';
import { validateProject } from '../../engine/validation';
import {
  isCompositePortHintEligible,
  shouldShowCompositePortHint,
} from '../composite-port-hints';
import type { DemoProject } from '../demo-projects';
import {
  compareLearningItems,
  getFirstLearningItemInGroup,
  getLearningGroupLabel,
  getLearningStageLabel,
  getRecommendedAfterTitles,
  getSortedLearningGroups,
  inferLearningStage,
  isCoreLearningItem,
} from '../learning-sequence';
import { getModuleCategory } from '../module-categories';
import {
  getModulesInSelectionBox,
  normalizeSelectionBoxRect,
  CANVAS_NODE_HEIGHT,
  CANVAS_NODE_WIDTH,
} from '../canvas-selection';
import {
  deriveWorkspaceLandmarks,
  isLargeWorkspace,
  type WorkspaceLandmark,
} from '../workspace-landmarks';
import {
  DEFAULT_WORKSPACE_ZOOM,
  getCanvasViewportPoint,
  getFitWorkspaceZoom,
  getModuleFocusScrollPosition,
  getNextWorkspaceZoom,
} from '../workspace-viewport';
import type { WorkbenchAnnotation, WorkspaceVersionDocument } from '../workbench-document';
import type { TutorialStep } from '../tutorials';

const NODE_WIDTH = CANVAS_NODE_WIDTH;
const NODE_HEIGHT = CANVAS_NODE_HEIGHT;
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
  activeAnalysisTraceEntry?: ExecutionTraceEntry | null;
  activeAnalysisOwnerModuleId?: string | null;
  divergenceModuleId?: string | null;
  tutorialStep?: TutorialStep | null;
  tutorialTitle?: string | null;
  tutorialStepIndex?: number;
  tutorialStepCount?: number;
  showTutorialToggle?: boolean;
  tutorialNotesVisible?: boolean;
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
  onMoveModules: (positions: Record<string, { x: number; y: number }>) => void;
  onAddAnnotation: () => void;
  onMoveAnnotation: (annotationId: string, x: number, y: number) => void;
  onUpdateAnnotationText: (annotationId: string, text: string) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  onSelectModule: (moduleId: string, additive?: boolean) => void;
  onSelectModules: (moduleIds: string[], additive?: boolean) => void;
  onRequestCreateComposite: () => void;
  onRequestDuplicateSelection: () => void;
  onRequestDeleteSelection: () => void;
  onRequestUndo: () => void;
  onRequestRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  workspaceVersions: WorkspaceVersionDocument[];
  onRequestSaveVersion: () => void;
  onRequestRestoreVersion: (versionId: string) => void;
  requestedFocusModuleId?: string | null;
  onWorkspaceFocusHandled?: () => void;
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
  onTidyLayout: () => void;
  onSetTutorialStep?: (stepIndex: number) => void;
  onSetTutorialNotesVisible?: (visible: boolean) => void;
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
  activeAnalysisTraceEntry = null,
  activeAnalysisOwnerModuleId = null,
  divergenceModuleId = null,
  tutorialStep = null,
  tutorialTitle = null,
  tutorialStepIndex = 0,
  tutorialStepCount = 0,
  showTutorialToggle = false,
  tutorialNotesVisible = true,
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
  onMoveModules,
  onAddAnnotation,
  onMoveAnnotation,
  onUpdateAnnotationText,
  onRemoveAnnotation,
  onSelectModule,
  onSelectModules,
  onRequestCreateComposite,
  onRequestDuplicateSelection,
  onRequestDeleteSelection,
  onRequestUndo,
  onRequestRedo,
  canUndo,
  canRedo,
  workspaceVersions,
  onRequestSaveVersion,
  onRequestRestoreVersion,
  requestedFocusModuleId = null,
  onWorkspaceFocusHandled,
  onSwitchProject,
  onAddConnection,
  onRemoveConnection,
  onExportDocument,
  onImportDocument,
  onTidyLayout,
  onSetTutorialStep,
  onSetTutorialNotesVisible,
  projects,
}: WorkbenchPanelProps) {
  const canvasSurfaceRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [dragState, setDragState] = useState<{
    moduleId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
    anchorStartX: number;
    anchorStartY: number;
    moduleIds: string[];
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [annotationDragState, setAnnotationDragState] = useState<{
    annotationId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    additive: boolean;
  } | null>(null);
  const [hoveredCompositeHintModuleId, setHoveredCompositeHintModuleId] = useState<string | null>(
    null,
  );
  const [hoveredPortHintKey, setHoveredPortHintKey] = useState<string | null>(null);
  const [workspaceZoom, setWorkspaceZoom] = useState(DEFAULT_WORKSPACE_ZOOM);
  const projectGroups = useMemo(
    () => getSortedLearningGroups(projects),
    [projects],
  );
  const projectCountByGroup = useMemo(
    () =>
      Object.fromEntries(
        projectGroups.map((group) => [
          group,
          projects.filter((project) => (project.group ?? 'Other') === group).length,
        ]),
      ),
    [projectGroups, projects],
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
    () =>
      projects
        .filter((project) => (project.group ?? 'Other') === activeProjectGroup)
        .sort(compareLearningItems),
    [activeProjectGroup, projects],
  );
  const activeProjectStage = inferLearningStage(activeProject);
  const activeProjectRecommendedAfter = useMemo(
    () => getRecommendedAfterTitles(projects, activeProject),
    [activeProject, projects],
  );
  const workspaceLandmarks = useMemo(
    () => deriveWorkspaceLandmarks(activeProjectState, registry, layout),
    [activeProjectState, layout, registry],
  );
  const showWorkspaceLandmarks = useMemo(
    () =>
      isLargeWorkspace(activeProjectState)
      && (
        workspaceLandmarks.context.length > 0
        || workspaceLandmarks.sources.length > 0
        || workspaceLandmarks.outputs.length > 0
      ),
    [activeProjectState, workspaceLandmarks],
  );

  const formatVersionTimestamp = (savedAt: string) => {
    const date = new Date(savedAt);
    return Number.isNaN(date.getTime()) ? savedAt : date.toLocaleString();
  };

  function getCanvasPointerFromClient(clientX: number, clientY: number) {
    const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
    const canvasSurface = canvasSurfaceRef.current;
    if (!canvasRect || !canvasSurface) {
      return null;
    }

    return getCanvasViewportPoint({
      clientX,
      clientY,
      canvasLeft: canvasRect.left,
      canvasTop: canvasRect.top,
      scrollLeft: canvasSurface.scrollLeft,
      scrollTop: canvasSurface.scrollTop,
      zoom: workspaceZoom,
    });
  }

  function fitWorkspaceView() {
    const canvasSurface = canvasSurfaceRef.current;
    if (!canvasSurface) {
      return;
    }

    setWorkspaceZoom(
      getFitWorkspaceZoom({
        viewportWidth: canvasSurface.clientWidth,
        viewportHeight: canvasSurface.clientHeight,
        canvasWidth,
        canvasHeight,
      }),
    );
    canvasSurface.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    if (!dragState && !annotationDragState && !selectionBox) {
      return undefined;
    }

    function handlePointerMove(event: MouseEvent) {
      const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
      const canvasSurface = canvasSurfaceRef.current;
      if (!canvasRect || !canvasSurface) {
        return;
      }

      if (dragState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        const nextX = Math.max(16, pointer.x - dragState.pointerOffsetX);
        const nextY = Math.max(16, pointer.y - dragState.pointerOffsetY);
        if (dragState.moduleIds.length <= 1) {
          onMoveModule(dragState.moduleId, nextX, nextY);
        } else {
          const deltaX = nextX - dragState.anchorStartX;
          const deltaY = nextY - dragState.anchorStartY;
          onMoveModules(
            Object.fromEntries(
              dragState.moduleIds.map((moduleId) => {
                const initialPosition = dragState.initialPositions[moduleId];
                return [
                  moduleId,
                  {
                    x: Math.max(16, initialPosition.x + deltaX),
                    y: Math.max(16, initialPosition.y + deltaY),
                  },
                ];
              }),
            ),
          );
        }
      }

      if (annotationDragState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        const nextX = Math.max(16, pointer.x - annotationDragState.pointerOffsetX);
        const nextY = Math.max(16, pointer.y - annotationDragState.pointerOffsetY);
        onMoveAnnotation(annotationDragState.annotationId, nextX, nextY);
      }

      if (selectionBox) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        setSelectionBox((prev) =>
          prev
            ? {
                ...prev,
                currentX: pointer.x,
                currentY: pointer.y,
              }
            : null,
        );
      }
    }

    function handlePointerUp() {
      if (selectionBox) {
        const selectedModuleIds = getModulesInSelectionBox({
          moduleIds: activeProjectState.modules.map((moduleInstance) => moduleInstance.id),
          layout,
          box: normalizeSelectionBoxRect(selectionBox),
        });
        onSelectModules(selectedModuleIds, selectionBox.additive);
      }
      setDragState(null);
      setAnnotationDragState(null);
      setSelectionBox(null);
    }

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [
    activeProjectState.modules,
    annotationDragState,
    dragState,
    layout,
    onMoveAnnotation,
    onMoveModule,
    onMoveModules,
    onSelectModules,
    selectionBox,
    workspaceZoom,
  ]);

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
      const pointer = getCanvasViewportPoint({
        clientX: event.clientX,
        clientY: event.clientY,
        canvasLeft: canvasRect.left,
        canvasTop: canvasRect.top,
        scrollLeft: canvasSurface.scrollLeft,
        scrollTop: canvasSurface.scrollTop,
        zoom: workspaceZoom,
      });

      setPendingConnection((prev) =>
        prev
          ? {
              ...prev,
              mouseX: pointer.x,
              mouseY: pointer.y,
            }
          : null,
      );
    }

    function handleConnectionUp() {
      setPendingConnection(null);
      setHoveredCompositeHintModuleId(null);
    }

    window.addEventListener('mousemove', handleConnectionMove);
    window.addEventListener('mouseup', handleConnectionUp);

    return () => {
      window.removeEventListener('mousemove', handleConnectionMove);
      window.removeEventListener('mouseup', handleConnectionUp);
    };
  }, [pendingConnection, workspaceZoom]);

  function renderCompositePortHint({
    definition,
    moduleId,
    direction,
    portName,
    portType,
  }: {
    definition: ModuleDefinition | undefined;
    moduleId: string;
    direction: 'in' | 'out';
    portName: string;
    portType: string;
  }) {
    if (
      !shouldShowCompositePortHint({
        definition,
        direction,
        pendingConnection: Boolean(pendingConnection),
        hoveredHintModuleId: hoveredCompositeHintModuleId,
        hoveredPortHintKey,
        moduleId,
        portName,
      })
    ) {
      return null;
    }

    return (
      <span
        className={
          direction === 'in'
            ? 'graph-port-hint graph-port-hint-in'
            : 'graph-port-hint graph-port-hint-out'
        }
      >
        {portName}: {portType}
      </span>
    );
  }

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

  const activeAnalysisSignalByModuleId = useMemo(() => {
    if (!activeAnalysisTraceEntry || !activeAnalysisOwnerModuleId) {
      return {};
    }

    const primaryOutput = Object.values(activeAnalysisTraceEntry.outputs)[0] ?? null;
    const signal = primaryOutput ?? activeAnalysisTraceEntry.inputs.in ?? null;
    if (!signal) {
      return {};
    }

    return {
      [activeAnalysisOwnerModuleId]: signal,
    } as Record<string, ExecutionTraceEntry['inputs'][string] | null>;
  }, [activeAnalysisOwnerModuleId, activeAnalysisTraceEntry]);

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

  function jumpToModule(moduleId: string) {
    const position = layout[moduleId];
    const canvasSurface = canvasSurfaceRef.current;
    if (!position || !canvasSurface) {
      return;
    }

    const target = getModuleFocusScrollPosition({
      moduleX: position.x,
      moduleY: position.y,
      viewportWidth: canvasSurface.clientWidth,
      viewportHeight: canvasSurface.clientHeight,
      zoom: workspaceZoom,
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT,
    });

    canvasSurface.scrollTo({
      left: target.left,
      top: target.top,
      behavior: 'smooth',
    });
    onSelectModule(moduleId, false);
  }

  useEffect(() => {
    if (!requestedFocusModuleId) {
      return;
    }

    const position = layout[requestedFocusModuleId];
    const canvasSurface = canvasSurfaceRef.current;
    if (!position || !canvasSurface) {
      return;
    }

    const target = getModuleFocusScrollPosition({
      moduleX: position.x,
      moduleY: position.y,
      viewportWidth: canvasSurface.clientWidth,
      viewportHeight: canvasSurface.clientHeight,
      zoom: workspaceZoom,
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT,
    });

    canvasSurface.scrollTo({
      left: target.left,
      top: target.top,
      behavior: 'smooth',
    });
    onSelectModule(requestedFocusModuleId, false);
    onWorkspaceFocusHandled?.();
  }, [layout, onSelectModule, onWorkspaceFocusHandled, requestedFocusModuleId, workspaceZoom]);

  function renderLandmarkGroup(title: string, landmarks: WorkspaceLandmark[]) {
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
              onClick={() => jumpToModule(landmark.moduleId)}
              title={`${landmark.moduleId} (${landmark.defId})`}
            >
              {landmark.label}
            </button>
          ))}
        </div>
      </div>
    );
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
              <span className="content-status-chip">
                {isCoreLearningItem(activeProject) ? 'Core Path' : 'Optional'}
              </span>
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
                {renderLandmarkGroup('Protocol & Timing', workspaceLandmarks.context)}
                {renderLandmarkGroup('Sources', workspaceLandmarks.sources)}
                {renderLandmarkGroup('Outputs', workspaceLandmarks.outputs)}
              </div>
            ) : null}
            {workspaceVersions.length > 0 ? (
              <div className="workspace-versions-card">
                <strong>Saved Versions</strong>
                <p>
                  Restore an intentional workspace checkpoint without replacing undo/redo.
                </p>
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
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
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
              onClick={onTidyLayout}
            >
              Tidy Layout
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onRequestUndo}
              disabled={!canUndo}
            >
              Undo
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onRequestRedo}
              disabled={!canRedo}
            >
              Redo
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={() => setWorkspaceZoom((currentZoom) => getNextWorkspaceZoom(currentZoom, 'out'))}
            >
              Zoom Out
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={() => setWorkspaceZoom((currentZoom) => getNextWorkspaceZoom(currentZoom, 'in'))}
            >
              Zoom In
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={() => {
                setWorkspaceZoom(DEFAULT_WORKSPACE_ZOOM);
                canvasSurfaceRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
              }}
            >
              Reset View
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={fitWorkspaceView}
            >
              Fit View
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onRequestSaveVersion}
            >
              Save Version
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onRequestDuplicateSelection}
              disabled={selectedModuleIds.length === 0}
            >
              Duplicate Cluster
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onRequestDeleteSelection}
              disabled={selectedModuleIds.length === 0}
            >
              Delete Cluster
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
        {showTutorialToggle ? (
          <button
            type="button"
            className="mini-action-button"
            onClick={() => onSetTutorialNotesVisible?.(!tutorialNotesVisible)}
          >
            {tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
          </button>
        ) : null}
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
          <strong>
            {tutorialTitle ? `${tutorialTitle} — ` : ''}
            {tutorialStep.title}
            {tutorialStepCount > 0 ? ` (${tutorialStepIndex + 1}/${tutorialStepCount})` : ''}
          </strong>
          <p>{tutorialStep.body}</p>
          {tutorialStep.focusModuleId ? (
            <p className="tutorial-step-target">
              Focus: <strong>{tutorialStep.focusModuleId}</strong>
            </p>
          ) : null}
          <div className="tutorial-step-actions">
            {onSetTutorialStep && tutorialStepCount > 0 ? (
              <>
                <button
                  type="button"
                  className="mini-action-button"
                  disabled={tutorialStepIndex <= 0}
                  onClick={() => onSetTutorialStep(Math.max(0, tutorialStepIndex - 1))}
                >
                  &lt;&lt;
                </button>
                <button
                  type="button"
                  className="mini-action-button"
                  disabled={tutorialStepIndex >= tutorialStepCount - 1}
                  onClick={() => onSetTutorialStep(Math.min(tutorialStepCount - 1, tutorialStepIndex + 1))}
                >
                  &gt;&gt;
                </button>
              </>
            ) : null}
            {showTutorialToggle ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() => onSetTutorialNotesVisible?.(!tutorialNotesVisible)}
              >
                Hide
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {selectedModuleIds.length > 0 ? (
        <p className="selection-status">
          Selected modules: <strong>{selectedModuleIds.length}</strong>. Use
          <strong> Shift-click</strong>, <strong> Cmd/Ctrl-click</strong>, or drag on empty canvas
          to build a composite selection, then drag any selected module to move the group.
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
          className="graph-viewport"
          style={{
            width: `${canvasWidth * workspaceZoom}px`,
            height: `${canvasHeight * workspaceZoom}px`,
          }}
        >
        <div
          className="graph-canvas"
          style={
            {
              '--canvas-width': `${canvasWidth}px`,
              '--canvas-height': `${canvasHeight}px`,
              '--workspace-zoom': workspaceZoom,
            } as CSSProperties
          }
          onMouseDown={(event) => {
            if (isCompositeEditor || pendingConnection || event.target !== event.currentTarget) {
              return;
            }

            const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
            if (!pointer) {
              return;
            }

            event.preventDefault();
            setSelectionBox({
              startX: pointer.x,
              startY: pointer.y,
              currentX: pointer.x,
              currentY: pointer.y,
              additive: event.shiftKey || event.metaKey || event.ctrlKey,
            });
          }}
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
                  (moduleInstance.bypass ? ' graph-node-bypassed' : '') +
                  (selectedModuleIds.includes(moduleInstance.id) ? ' graph-node-selected' : '') +
                  (moduleInstance.id === selectedModuleId ? ' graph-node-primary-selected' : '') +
                  (moduleInstance.id === hoveredTraceModuleId ? ' graph-node-trace-hovered' : '') +
                  (moduleInstance.id === steppedModuleId ||
                  moduleInstance.id === activeAnalysisOwnerModuleId
                    ? ' graph-node-stepped'
                    : '') +
                  (moduleInstance.id === divergenceModuleId ? ' graph-node-divergence' : '') +
                  (moduleInstance.id === tutorialStep?.focusModuleId ? ' graph-node-tutorial-focus' : '') +
                  (probedModuleIds.includes(moduleInstance.id) ? ' graph-node-probed' : '') +
                  ((moduleIssueCountById[moduleInstance.id] ?? 0) > 0 ? ' graph-node-invalid' : '')
                }
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
              >
                <div
                  className="graph-node-body"
                  onMouseEnter={() => {
                    if (pendingConnection && def) {
                      setHoveredCompositeHintModuleId(moduleInstance.id);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredCompositeHintModuleId((current) =>
                      current === moduleInstance.id ? null : current,
                    );
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
                    if (!pointer) return;
                    const isAdditiveSelection = event.shiftKey || event.metaKey || event.ctrlKey;
                    if (isAdditiveSelection) {
                      onSelectModule(moduleInstance.id, true);
                      return;
                    }
                    const isDraggingExistingSelection =
                      selectedModuleIds.length > 1 &&
                      selectedModuleIds.includes(moduleInstance.id);
                    const draggedModuleIds = isDraggingExistingSelection
                      ? selectedModuleIds
                      : [moduleInstance.id];
                    if (!isDraggingExistingSelection) {
                      onSelectModule(moduleInstance.id, false);
                    }
                    setDragState({
                      moduleId: moduleInstance.id,
                      pointerOffsetX: pointer.x - position.x,
                      pointerOffsetY: pointer.y - position.y,
                      anchorStartX: position.x,
                      anchorStartY: position.y,
                      moduleIds: draggedModuleIds,
                      initialPositions: Object.fromEntries(
                        draggedModuleIds.map((draggedModuleId) => [
                          draggedModuleId,
                          layout[draggedModuleId] ?? { x: 24, y: 24 },
                        ]),
                      ),
                    });
                  }}
                >
                  <span className="graph-node-type">{moduleInstance.defId}</span>
                  <strong>{moduleInstance.id}</strong>
                  {moduleInstance.id === tutorialStep?.focusModuleId ? (
                    <span className="graph-node-tutorial-badge">Tutorial</span>
                  ) : null}
                  {moduleInstance.bypass ? (
                    <span className="graph-node-bypass-badge">Bypass</span>
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
                  {isTickedMode && isOutputSinkDefId(moduleInstance.defId) ? (() => {
                    const signal = executionSignalByModuleId[moduleInstance.id];
                    if (!signal) return null;
                    const value = signal.type === 'symbol' ? signal.value : `[${signal.value.join(',')}]`;
                    return (
                      <span className="graph-node-tick-state" title={`current value = ${value}`}>
                        {value}
                      </span>
                    );
                  })() : null}
                  {activeAnalysisTraceEntry && moduleInstance.id === activeAnalysisOwnerModuleId ? (() => {
                    const signal = activeAnalysisSignalByModuleId[moduleInstance.id];
                    if (!signal) return null;
                    const value = signal.type === 'symbol' ? signal.value : `[${signal.value.join(',')}]`;
                    const nestedModuleName =
                      activeAnalysisTraceEntry.moduleId.split('/').at(-1) ?? activeAnalysisTraceEntry.moduleId;
                    return (
                      <span
                        className="graph-node-tick-state"
                        title={`analysis step ${nestedModuleName} = ${value}`}
                      >
                        {nestedModuleName}: {value}
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
                      title={
                        isCompositePortHintEligible(def) ? undefined : `${port.name}: ${port.type}`
                      }
                      onMouseEnter={() => setHoveredPortHintKey(`${moduleInstance.id}:in:${port.name}`)}
                      onMouseLeave={() =>
                        setHoveredPortHintKey((current) =>
                          current === `${moduleInstance.id}:in:${port.name}` ? null : current,
                        )
                      }
                      onMouseUp={() =>
                        completeConnectionOnInput(moduleInstance.id, port.name)
                      }
                    >
                      {renderCompositePortHint({
                        definition: def,
                        moduleId: moduleInstance.id,
                        direction: 'in',
                        portName: port.name,
                        portType: port.type,
                      })}
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
                      title={
                        isCompositePortHintEligible(def) ? undefined : `${port.name}: ${port.type}`
                      }
                      onMouseEnter={() => setHoveredPortHintKey(`${moduleInstance.id}:out:${port.name}`)}
                      onMouseLeave={() =>
                        setHoveredPortHintKey((current) =>
                          current === `${moduleInstance.id}:out:${port.name}` ? null : current,
                        )
                      }
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
                      {renderCompositePortHint({
                        definition: def,
                        moduleId: moduleInstance.id,
                        direction: 'out',
                        portName: port.name,
                        portType: port.type,
                      })}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {selectionBox ? (() => {
            const box = normalizeSelectionBoxRect(selectionBox);
            return (
              <div
                className="graph-selection-box"
                style={{
                  left: `${box.left}px`,
                  top: `${box.top}px`,
                  width: `${Math.max(1, box.right - box.left)}px`,
                  height: `${Math.max(1, box.bottom - box.top)}px`,
                }}
              />
            );
          })() : null}

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
                  const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
                  if (!pointer) {
                    return;
                  }

                  setAnnotationDragState({
                    annotationId: annotation.id,
                    pointerOffsetX: pointer.x - annotation.x,
                    pointerOffsetY: pointer.y - annotation.y,
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
