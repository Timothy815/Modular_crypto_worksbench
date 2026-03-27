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
import {
  isCompositePortHintEligible,
  shouldShowCompositePortHint,
} from '../composite-port-hints';
import type { DemoProject } from '../demo-projects';
import {
  compareLearningItems,
  getRecommendedAfterTitles,
  getSortedLearningGroups,
  inferLearningStage,
} from '../learning-sequence';
import { getModuleCategory } from '../module-categories';
import {
  getModulesInSelectionBox,
  normalizeSelectionBoxRect,
  CANVAS_NODE_HEIGHT,
  CANVAS_NODE_WIDTH,
} from '../canvas-selection';
import {
  findIncomingConnectionIndex,
  getTargetPortState,
  type TargetPortState,
} from '../connection-authoring';
import { deriveConnectionLegibilityState } from '../wire-legibility';
import { compareWorkspaceToVersion, getConnectionComparisonKey } from '../workspace-comparison';
import {
  deriveWorkspaceLandmarks,
  isLargeWorkspace,
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
import {
  buildActiveAnalysisSignalByModuleId,
  buildExecutionSignalByModuleId,
  buildIncomingConnectionIndexByInputKey,
  buildModuleIssueCountById,
  formatVersionTimestamp,
  getAnchorPosition,
  getInputAnchorClassName,
} from '../workbench-support';
import { WorkbenchActions } from './workbench-actions';
import { WorkbenchProjectContext } from './workbench-project-context';

const NODE_WIDTH = CANVAS_NODE_WIDTH;
const NODE_HEIGHT = CANVAS_NODE_HEIGHT;
const PORT_GAP = 18;
const PORT_START_Y = 34;

interface PendingConnection {
  fromModuleId: string;
  fromPort: string;
  fromAnchor: { x: number; y: number };
  mouseX: number;
  mouseY: number;
  excludedConnectionIndex: number | null;
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
  onReplaceConnection: (
    removeConnectionIndices: number[],
    fromModuleId: string,
    fromPort: string,
    toModuleId: string,
    toPort: string,
  ) => void;
  onRemoveConnection: (connectionIndex: number) => void;
  onExportDocument: () => void;
  onExportPython: () => void;
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
  onReplaceConnection,
  onRemoveConnection,
  onExportDocument,
  onExportPython,
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
    currentPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [annotationDragState, setAnnotationDragState] = useState<{
    annotationId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);
  const [selectedConnectionIndex, setSelectedConnectionIndex] = useState<number | null>(null);
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
  const [comparisonVersionId, setComparisonVersionId] = useState<string | null>(null);
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
  const activeComparisonVersion = useMemo(
    () =>
      comparisonVersionId
        ? workspaceVersions.find((version) => version.id === comparisonVersionId) ?? null
        : null,
    [comparisonVersionId, workspaceVersions],
  );

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
  const effectiveLayout = useMemo(
    () => ({
      ...layout,
      ...(dragState?.currentPositions ?? {}),
    }),
    [dragState?.currentPositions, layout],
  );
  const workspaceLandmarks = useMemo(
    () => deriveWorkspaceLandmarks(activeProjectState, registry, effectiveLayout),
    [activeProjectState, effectiveLayout, registry],
  );
  const incomingConnectionIndexByInputKey = useMemo(
    () => buildIncomingConnectionIndexByInputKey(activeProjectState.connections),
    [activeProjectState.connections],
  );
  const workspaceComparison = useMemo(
    () =>
      activeComparisonVersion
        ? compareWorkspaceToVersion(activeProjectState, activeComparisonVersion)
        : null,
    [activeComparisonVersion, activeProjectState],
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
  const effectiveSelectedConnectionIndex =
    selectedConnectionIndex !== null &&
    selectedConnectionIndex >= 0 &&
    selectedConnectionIndex < activeProjectState.connections.length
      ? selectedConnectionIndex
      : null;

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
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  currentPositions: {
                    [prev.moduleId]: { x: nextX, y: nextY },
                  },
                }
              : null,
          );
        } else {
          const deltaX = nextX - dragState.anchorStartX;
          const deltaY = nextY - dragState.anchorStartY;
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  currentPositions: Object.fromEntries(
                    prev.moduleIds.map((moduleId) => {
                      const initialPosition = prev.initialPositions[moduleId];
                      return [
                        moduleId,
                        {
                          x: Math.max(16, initialPosition.x + deltaX),
                          y: Math.max(16, initialPosition.y + deltaY),
                        },
                      ];
                    }),
                  ),
                }
              : null,
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
        setAnnotationDragState((prev) =>
          prev
            ? {
                ...prev,
                currentX: nextX,
                currentY: nextY,
              }
            : null,
        );
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
      if (dragState) {
        const nextPositions = dragState.currentPositions;
        if (dragState.moduleIds.length <= 1) {
          const nextPosition = nextPositions[dragState.moduleId];
          const initialPosition = dragState.initialPositions[dragState.moduleId];
          if (
            nextPosition &&
            initialPosition &&
            (nextPosition.x !== initialPosition.x || nextPosition.y !== initialPosition.y)
          ) {
            onMoveModule(dragState.moduleId, nextPosition.x, nextPosition.y);
          }
        } else if (
          Object.entries(nextPositions).some(([moduleId, position]) => {
            const initialPosition = dragState.initialPositions[moduleId];
            return (
              initialPosition &&
              (position.x !== initialPosition.x || position.y !== initialPosition.y)
            );
          })
        ) {
          onMoveModules(nextPositions);
        }
      }

      if (annotationDragState) {
        if (
          annotationDragState.currentX !== annotationDragState.initialX ||
          annotationDragState.currentY !== annotationDragState.initialY
        ) {
          onMoveAnnotation(
            annotationDragState.annotationId,
            annotationDragState.currentX,
            annotationDragState.currentY,
          );
        }
      }

      if (selectionBox) {
        const selectedModuleIds = getModulesInSelectionBox({
          moduleIds: activeProjectState.modules.map((moduleInstance) => moduleInstance.id),
          layout: effectiveLayout,
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
    effectiveLayout,
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
          pendingConnection.excludedConnectionIndex,
        );
      }
    }

    return nextStates;
  }, [activeProjectState, pendingConnection, registry]);

  const moduleIssueCountById = useMemo(() => buildModuleIssueCountById(validationIssues), [validationIssues]);

  const executionSignalByModuleId = useMemo(() => buildExecutionSignalByModuleId(execution), [execution]);

  const activeAnalysisSignalByModuleId = useMemo(
    () => buildActiveAnalysisSignalByModuleId(activeAnalysisTraceEntry, activeAnalysisOwnerModuleId),
    [activeAnalysisOwnerModuleId, activeAnalysisTraceEntry],
  );
  const traceFocusedModuleId = activeAnalysisOwnerModuleId ?? steppedModuleId ?? null;

  function startConnectionFromOutput(
    moduleId: string,
    portName: string,
    portIndex: number,
  ) {
    setSelectedConnectionIndex(null);
    const pos = layout[moduleId];
    if (!pos) return;
    const anchor = getAnchorPosition(pos.x, pos.y, 'right', portIndex, NODE_WIDTH, PORT_START_Y, PORT_GAP);
    setConnectionFeedback(null);
    setPendingConnection({
      fromModuleId: moduleId,
      fromPort: portName,
      fromAnchor: anchor,
      mouseX: anchor.x,
      mouseY: anchor.y,
      excludedConnectionIndex: null,
    });
  }

  function startConnectionRewireFromInput(moduleId: string, portName: string) {
    setSelectedConnectionIndex(null);
    const connectionIndex = findIncomingConnectionIndex(activeProjectState, moduleId, portName);
    if (connectionIndex < 0) {
      return;
    }

    const connection = activeProjectState.connections[connectionIndex];
    const sourcePosition = layout[connection.from.moduleId];
    const sourceInstance = activeProjectState.modules.find(
      (moduleInstance) => moduleInstance.id === connection.from.moduleId,
    );
    const sourceDef = sourceInstance ? registry[sourceInstance.defId] : undefined;
    const sourcePortIndex = sourceDef
      ? sourceDef.outputs.findIndex((port) => port.name === connection.from.port)
      : -1;

    if (!sourcePosition || !sourceDef || sourcePortIndex < 0) {
      return;
    }

    const sourceAnchor = getAnchorPosition(
      sourcePosition.x,
      sourcePosition.y,
      'right',
      sourcePortIndex,
      NODE_WIDTH,
      PORT_START_Y,
      PORT_GAP,
    );

    setConnectionFeedback(null);
    setPendingConnection({
      fromModuleId: connection.from.moduleId,
      fromPort: connection.from.port,
      fromAnchor: sourceAnchor,
      mouseX: sourceAnchor.x,
      mouseY: sourceAnchor.y,
      excludedConnectionIndex: connectionIndex,
    });
  }

  function completeConnectionOnInput(moduleId: string, portName: string) {
    if (!pendingConnection) return;
    const targetState = targetPortStates[`${moduleId}:${portName}`];
    if (!targetState?.valid) {
      setConnectionFeedback(targetState?.reason ?? 'Connection blocked.');
      return;
    }

    const removeConnectionIndices = [
      pendingConnection.excludedConnectionIndex,
      targetState?.replaceConnectionIndex ?? null,
    ].filter((index): index is number => index !== null);

    if (removeConnectionIndices.length > 0) {
      onReplaceConnection(
        removeConnectionIndices,
        pendingConnection.fromModuleId,
        pendingConnection.fromPort,
        moduleId,
        portName,
      );
    } else {
      onAddConnection(
        pendingConnection.fromModuleId,
        pendingConnection.fromPort,
        moduleId,
        portName,
      );
    }
    setConnectionFeedback(null);
    setPendingConnection(null);
    setSelectedConnectionIndex(null);
  }

  function jumpToModule(moduleId: string) {
    const position = effectiveLayout[moduleId];
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
    setSelectedConnectionIndex(null);
    onSelectModule(moduleId, false);
  }

  useEffect(() => {
    if (!requestedFocusModuleId) {
      return;
    }

    const position = effectiveLayout[requestedFocusModuleId];
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
  }, [effectiveLayout, onSelectModule, onWorkspaceFocusHandled, requestedFocusModuleId, workspaceZoom]);

  return (
    <section className={challengeSolved ? 'panel canvas-panel canvas-panel-success' : 'panel canvas-panel'}>
      <div className="panel-head">
        <p className="panel-label">Workbench</p>
        <h2>{title ?? 'Demo Graphs'}</h2>
      </div>

      <WorkbenchProjectContext
        isCompositeEditor={isCompositeEditor}
        activeProject={activeProject}
        activeProjectGroup={activeProjectGroup}
        activeProjectStage={activeProjectStage}
        activeProjectRecommendedAfter={activeProjectRecommendedAfter}
        projects={projects}
        projectGroups={projectGroups}
        projectCountByGroup={projectCountByGroup}
        visibleProjects={visibleProjects}
        summary={summary}
        pipelineLabel={pipelineLabel}
        showWorkspaceLandmarks={showWorkspaceLandmarks}
        workspaceLandmarks={workspaceLandmarks}
        workspaceVersions={workspaceVersions}
        workspaceComparison={workspaceComparison}
        activeComparisonVersion={activeComparisonVersion}
        comparisonVersionId={comparisonVersionId}
        onSwitchProject={onSwitchProject}
        onJumpToModule={jumpToModule}
        onRequestRestoreVersion={onRequestRestoreVersion}
        onSetComparisonVersionId={setComparisonVersionId}
        formatVersionTimestamp={formatVersionTimestamp}
      />

      <WorkbenchActions
        isCompositeEditor={isCompositeEditor}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedModuleIds={selectedModuleIds}
        effectiveSelectedConnectionIndex={effectiveSelectedConnectionIndex}
        showTutorialToggle={showTutorialToggle}
        tutorialNotesVisible={tutorialNotesVisible}
        onAddAnnotation={onAddAnnotation}
        onExportDocument={onExportDocument}
        onExportPython={onExportPython}
        onTidyLayout={onTidyLayout}
        onRequestUndo={onRequestUndo}
        onRequestRedo={onRequestRedo}
        onZoomOut={() => setWorkspaceZoom((currentZoom) => getNextWorkspaceZoom(currentZoom, 'out'))}
        onZoomIn={() => setWorkspaceZoom((currentZoom) => getNextWorkspaceZoom(currentZoom, 'in'))}
        onResetView={() => {
          setWorkspaceZoom(DEFAULT_WORKSPACE_ZOOM);
          canvasSurfaceRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
        }}
        onFitView={fitWorkspaceView}
        onRequestSaveVersion={onRequestSaveVersion}
        onRequestDuplicateSelection={onRequestDuplicateSelection}
        onRequestDeleteSelection={onRequestDeleteSelection}
        onRequestDeleteWire={() => {
          if (effectiveSelectedConnectionIndex !== null) {
            onRemoveConnection(effectiveSelectedConnectionIndex);
            setSelectedConnectionIndex(null);
          }
        }}
        onRequestImport={() => importInputRef.current?.click()}
        onRequestCreateComposite={onRequestCreateComposite}
        onToggleTutorialNotes={onSetTutorialNotesVisible}
      />
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
          {pendingConnection.excludedConnectionIndex !== null ? 'Rewiring' : 'Wiring from'}{' '}
          <strong>{pendingConnection.fromModuleId}.{pendingConnection.fromPort}</strong>.
          Valid inputs glow teal. Replacement targets glow gold. Invalid targets glow red.
        </p>
      ) : connectionFeedback ? (
        <p className="connection-status connection-status-warning">{connectionFeedback}</p>
      ) : effectiveSelectedConnectionIndex !== null &&
        activeProjectState.connections[effectiveSelectedConnectionIndex] ? (
        <p className="selection-status">
          Selected wire:{' '}
          <strong>
            {activeProjectState.connections[effectiveSelectedConnectionIndex].from.moduleId}.
            {activeProjectState.connections[effectiveSelectedConnectionIndex].from.port}
          </strong>{' '}
          -&gt;{' '}
          <strong>
            {activeProjectState.connections[effectiveSelectedConnectionIndex].to.moduleId}.
            {activeProjectState.connections[effectiveSelectedConnectionIndex].to.port}
          </strong>
          . Use <strong>Delete Wire</strong> to remove it.
        </p>
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
            setSelectedConnectionIndex(null);
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
              const from = effectiveLayout[connection.from.moduleId];
              const to = effectiveLayout[connection.to.moduleId];
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
              const sourceAnchor = getAnchorPosition(
                from.x,
                from.y,
                sourceSide,
                sourceIndex,
                NODE_WIDTH,
                PORT_START_Y,
                PORT_GAP,
              );
              const targetAnchor = getAnchorPosition(
                to.x,
                to.y,
                targetSide,
                targetIndex,
                NODE_WIDTH,
                PORT_START_Y,
                PORT_GAP,
              );
              const horizontalDistance = Math.abs(targetAnchor.x - sourceAnchor.x);
              const bend = Math.max(56, horizontalDistance * 0.42);
              const sourceControlX =
                sourceSide === 'right' ? sourceAnchor.x + bend : sourceAnchor.x - bend;
              const targetControlX =
                targetSide === 'left' ? targetAnchor.x - bend : targetAnchor.x + bend;

              const pathD = `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceControlX} ${sourceAnchor.y}, ${targetControlX} ${targetAnchor.y}, ${targetAnchor.x} ${targetAnchor.y}`;
              const legibilityState = deriveConnectionLegibilityState({
                connection,
                connectionIndex,
                selectedConnectionIndex: effectiveSelectedConnectionIndex,
                focusedModuleId: selectedModuleId,
                traceFocusedModuleId,
              });

              return (
                <g
                  key={`${connection.from.moduleId}:${connection.from.port}-${connection.to.moduleId}:${connection.to.port}`}
                  className={[
                    'connection-group',
                    validationIssues.some(
                      (issue) =>
                        issue.connection?.from.moduleId === connection.from.moduleId &&
                        issue.connection?.from.port === connection.from.port &&
                        issue.connection?.to.moduleId === connection.to.moduleId &&
                        issue.connection?.to.port === connection.to.port,
                    )
                      ? 'connection-group-invalid'
                      : '',
                    legibilityState.selected ? 'connection-group-selected' : '',
                    legibilityState.emphasized ? 'connection-group-emphasized' : '',
                    legibilityState.traceEmphasized ? 'connection-group-trace' : '',
                    legibilityState.dimmed ? 'connection-group-dimmed' : '',
                    workspaceComparison
                      ? workspaceComparison.currentConnectionStatusByKey[getConnectionComparisonKey(connection)] === 'added'
                        ? 'connection-group-compare-added'
                        : 'connection-group-compare-unchanged'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <path
                    className="connection-hit-area"
                    d={pathD}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedConnectionIndex((current) =>
                        current === connectionIndex ? null : connectionIndex,
                      );
                    }}
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
            const position = effectiveLayout[moduleInstance.id] ?? { x: 24, y: 24 };
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
                  ((moduleIssueCountById[moduleInstance.id] ?? 0) > 0 ? ' graph-node-invalid' : '') +
                  (workspaceComparison
                    ? workspaceComparison.currentModuleStatusById[moduleInstance.id] === 'added'
                      ? ' graph-node-compare-added'
                      : ' graph-node-compare-unchanged'
                    : '')
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
                      setSelectedConnectionIndex(null);
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
                      setSelectedConnectionIndex(null);
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
                      currentPositions: Object.fromEntries(
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
                        setSelectedConnectionIndex(null);
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
                    (() => {
                      const inputKey = `${moduleInstance.id}:${port.name}`;
                      const incomingConnectionIndex = incomingConnectionIndexByInputKey[inputKey];
                      const hasIncomingConnection = incomingConnectionIndex !== undefined;
                      const title = isCompositePortHintEligible(def)
                        ? undefined
                        : hasIncomingConnection
                          ? `${port.name}: ${port.type} (drag to rewire)`
                          : `${port.name}: ${port.type}`;

                      return (
                        <span
                          key={port.name}
                          className={getInputAnchorClassName(
                            pendingConnection,
                            targetPortStates[inputKey],
                            hasIncomingConnection,
                          )}
                          style={{ top: `${PORT_START_Y + index * PORT_GAP}px` }}
                          title={title}
                          onMouseEnter={() => setHoveredPortHintKey(`${moduleInstance.id}:in:${port.name}`)}
                          onMouseLeave={() =>
                            setHoveredPortHintKey((current) =>
                              current === `${moduleInstance.id}:in:${port.name}` ? null : current,
                            )
                          }
                          onMouseDown={(event) => {
                            if (pendingConnection || !hasIncomingConnection) {
                              return;
                            }
                            event.preventDefault();
                            event.stopPropagation();
                            startConnectionRewireFromInput(moduleInstance.id, port.name);
                          }}
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
                      );
                    })()
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

          {tutorialStep?.focusModuleId && effectiveLayout[tutorialStep.focusModuleId] ? (() => {
            const focusPos = effectiveLayout[tutorialStep.focusModuleId];
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
            (() => {
              const annotationX =
                annotationDragState?.annotationId === annotation.id
                  ? annotationDragState.currentX
                  : annotation.x;
              const annotationY =
                annotationDragState?.annotationId === annotation.id
                  ? annotationDragState.currentY
                  : annotation.y;

              return (
            <div
              key={annotation.id}
              className="canvas-annotation"
              style={{ left: `${annotationX}px`, top: `${annotationY}px` }}
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
                    initialX: annotation.x,
                    initialY: annotation.y,
                    currentX: annotation.x,
                    currentY: annotation.y,
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
              );
            })()
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
