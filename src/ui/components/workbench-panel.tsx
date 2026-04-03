import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

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
  getRecommendedAfterTargets,
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
import { getSequentialRole, getSequentialRoleLabel } from '../sequential-roles';
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
import type {
  WorkbenchAnnotation,
  WorkbenchConnectionLayout,
  WorkbenchLayoutDirection,
  WorkbenchPosition,
  WorkbenchRoutingMode,
  WorkspaceVersionDocument,
} from '../workbench-document';
import {
  getNodeOrientation,
  getPortSideForOrientation,
  isVerticalPortSide,
  type PortSide,
} from '../node-orientation';
import type { TutorialStep } from '../tutorials';
import {
  buildActiveAnalysisSignalByModuleId,
  buildExecutionSignalByModuleId,
  buildIncomingConnectionIndexByInputKey,
  buildModuleIssueCountById,
  formatVersionTimestamp,
  getAnchorPosition,
  getInputAnchorClassName,
  getOrthogonalPathData,
  getOrthogonalPendingPath,
  shouldClearOrthogonalBendOverride,
} from '../workbench-support';
const WorkbenchActions = lazy(() =>
  import('./workbench-actions').then((module) => ({
    default: module.WorkbenchActions,
  })),
);
const WorkbenchProjectContext = lazy(() =>
  import('./workbench-project-context').then((module) => ({
    default: module.WorkbenchProjectContext,
  })),
);

const NODE_WIDTH = CANVAS_NODE_WIDTH;
const NODE_HEIGHT = CANVAS_NODE_HEIGHT;
const PORT_GAP = 18;
const PORT_START_Y = 34;
const DEFAULT_CANVAS_VIEWPORT_HEIGHT = 520;
const MIN_CANVAS_VIEWPORT_HEIGHT = 360;
const MAX_CANVAS_VIEWPORT_HEIGHT = 1200;

interface PendingConnection {
  fromModuleId: string;
  fromPort: string;
  fromAnchor: { x: number; y: number };
  fromSide: PortSide;
  mouseX: number;
  mouseY: number;
  excludedConnectionIndex: number | null;
}

function getPortAnchorStyle(side: PortSide, portIndex: number): CSSProperties {
  const offset = PORT_START_Y + portIndex * PORT_GAP;
  if (side === 'top' || side === 'bottom') {
    return { left: `${offset}px` };
  }
  return { top: `${offset}px` };
}

function getConnectionPath(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetAnchor: { x: number; y: number },
  targetSide: PortSide,
) {
  const horizontal = !isVerticalPortSide(sourceSide) && !isVerticalPortSide(targetSide);
  const primaryDistance = horizontal
    ? Math.abs(targetAnchor.x - sourceAnchor.x)
    : Math.abs(targetAnchor.y - sourceAnchor.y);
  const bend = Math.max(56, primaryDistance * 0.42);

  const sourceControl = horizontal
    ? {
        x: sourceSide === 'right' ? sourceAnchor.x + bend : sourceAnchor.x - bend,
        y: sourceAnchor.y,
      }
    : {
        x: sourceAnchor.x,
        y: sourceSide === 'bottom' ? sourceAnchor.y + bend : sourceAnchor.y - bend,
      };

  const targetControl = horizontal
    ? {
        x: targetSide === 'left' ? targetAnchor.x - bend : targetAnchor.x + bend,
        y: targetAnchor.y,
      }
    : {
        x: targetAnchor.x,
        y: targetSide === 'top' ? targetAnchor.y - bend : targetAnchor.y + bend,
      };

  return `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceControl.x} ${sourceControl.y}, ${targetControl.x} ${targetControl.y}, ${targetAnchor.x} ${targetAnchor.y}`;
}

function getPendingConnectionPath(
  sourceAnchor: { x: number; y: number },
  sourceSide: PortSide,
  targetPoint: { x: number; y: number },
) {
  const primaryDistance = isVerticalPortSide(sourceSide)
    ? Math.abs(targetPoint.y - sourceAnchor.y)
    : Math.abs(targetPoint.x - sourceAnchor.x);
  const bend = Math.max(56, primaryDistance * 0.42);

  const sourceControl = isVerticalPortSide(sourceSide)
    ? {
        x: sourceAnchor.x,
        y: sourceSide === 'bottom' ? sourceAnchor.y + bend : sourceAnchor.y - bend,
      }
    : {
        x: sourceSide === 'right' ? sourceAnchor.x + bend : sourceAnchor.x - bend,
        y: sourceAnchor.y,
      };

  const targetControl = isVerticalPortSide(sourceSide)
    ? { x: targetPoint.x, y: targetPoint.y + (targetPoint.y >= sourceAnchor.y ? -bend : bend) }
    : { x: targetPoint.x + (targetPoint.x >= sourceAnchor.x ? -bend : bend), y: targetPoint.y };

  return `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceControl.x} ${sourceControl.y}, ${targetControl.x} ${targetControl.y}, ${targetPoint.x} ${targetPoint.y}`;
}

interface WorkbenchPanelProps {
  activeProject: DemoProject;
  title?: string;
  summary?: string;
  pipelineLabel?: string;
  activeProjectState: Project;
  layout: Record<string, WorkbenchPosition>;
  layoutDirection: WorkbenchLayoutDirection;
  routingMode: WorkbenchRoutingMode;
  connectionLayout: Record<string, WorkbenchConnectionLayout>;
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
  isObservationMode?: boolean;
  probedModuleIds?: string[];
  isTickedMode?: boolean;
  showTickControls?: boolean;
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
  onRequestArrangeSelection: (
    mode:
      | 'stage-row'
      | 'stage-column'
      | 'align-left'
      | 'align-right'
      | 'align-top'
      | 'align-bottom'
      | 'align-horizontal-center'
      | 'align-vertical-center'
      | 'distribute-horizontal'
      | 'distribute-vertical',
  ) => void;
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
  onSetConnectionOrthogonalBend: (
    connectionKey: string,
    axis: 'x' | 'y',
    value: number,
  ) => void;
  onClearConnectionOrthogonalBend: (connectionKey: string) => void;
  onExportDocument: () => void;
  onExportLabPack: () => void;
  onExportPython: () => void;
  onImportDocument: (file: File) => void;
  onImportLabPack: (file: File) => void;
  onTidyLayout: () => void;
  onSetLayoutDirection: (direction: WorkbenchLayoutDirection) => void;
  onSetRoutingMode: (mode: WorkbenchRoutingMode) => void;
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
  layoutDirection,
  routingMode,
  connectionLayout,
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
  isObservationMode = false,
  probedModuleIds = [],
  isTickedMode = false,
  showTickControls = true,
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
  onRequestArrangeSelection,
  onRequestRestoreVersion,
  requestedFocusModuleId = null,
  onWorkspaceFocusHandled,
  onSwitchProject,
  onAddConnection,
  onReplaceConnection,
  onRemoveConnection,
  onSetConnectionOrthogonalBend,
  onClearConnectionOrthogonalBend,
  onExportDocument,
  onExportLabPack,
  onExportPython,
  onImportDocument,
  onImportLabPack,
  onTidyLayout,
  onSetLayoutDirection,
  onSetRoutingMode,
  onSetTutorialStep,
  onSetTutorialNotesVisible,
  projects,
}: WorkbenchPanelProps) {
  const canvasSurfaceRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const importLabPackInputRef = useRef<HTMLInputElement | null>(null);
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
  const [hoveredConnectionIndex, setHoveredConnectionIndex] = useState<number | null>(null);
  const [bendDragState, setBendDragState] = useState<{
    connectionKey: string;
    axis: 'x' | 'y';
    autoValue: number;
    currentValue: number;
  } | null>(null);
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
  const [canvasViewportHeight, setCanvasViewportHeight] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_CANVAS_VIEWPORT_HEIGHT;
    }

    const rawValue = window.localStorage.getItem('mcw:canvas-viewport-height');
    const parsedValue = rawValue ? Number(rawValue) : NaN;
    if (!Number.isFinite(parsedValue)) {
      return DEFAULT_CANVAS_VIEWPORT_HEIGHT;
    }

    return Math.min(
      MAX_CANVAS_VIEWPORT_HEIGHT,
      Math.max(MIN_CANVAS_VIEWPORT_HEIGHT, parsedValue),
    );
  });
  const [canvasHeightResizeState, setCanvasHeightResizeState] = useState<{
    originY: number;
    originHeight: number;
  } | null>(null);
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
    () => getRecommendedAfterTargets(projects, activeProject),
    [activeProject, projects],
  );
  const effectiveLayout = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({
          ...layout,
          ...(dragState?.currentPositions ?? {}),
        }).map(([moduleId, position]) => [
          moduleId,
          moduleId in (dragState?.currentPositions ?? {})
            ? {
                ...layout[moduleId],
                ...position,
              }
            : position,
        ]),
      ) as Record<string, WorkbenchPosition>,
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
  const selectedConnectionKey =
    effectiveSelectedConnectionIndex !== null
      ? getConnectionComparisonKey(activeProjectState.connections[effectiveSelectedConnectionIndex])
      : null;
  const selectedConnectionHasManualPath = Boolean(
    selectedConnectionKey && connectionLayout[selectedConnectionKey]?.orthogonalBend,
  );

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
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('mcw:canvas-viewport-height', String(canvasViewportHeight));
  }, [canvasViewportHeight]);

  useEffect(() => {
    if (!canvasHeightResizeState || typeof window === 'undefined') {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const nextHeight = canvasHeightResizeState.originHeight + (event.clientY - canvasHeightResizeState.originY);
      setCanvasViewportHeight(
        Math.min(
          MAX_CANVAS_VIEWPORT_HEIGHT,
          Math.max(MIN_CANVAS_VIEWPORT_HEIGHT, nextHeight),
        ),
      );
    };

    const handlePointerUp = () => {
      setCanvasHeightResizeState(null);
      document.body.classList.remove('canvas-resizing');
    };

    document.body.classList.add('canvas-resizing');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.body.classList.remove('canvas-resizing');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [canvasHeightResizeState]);

  useEffect(() => {
    if (!dragState && !annotationDragState && !bendDragState && !selectionBox) {
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

      if (bendDragState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        setBendDragState((prev) =>
          prev
            ? {
                ...prev,
                currentValue: prev.axis === 'x' ? pointer.x : pointer.y,
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
      if (bendDragState) {
        if (
          shouldClearOrthogonalBendOverride({
            autoValue: bendDragState.autoValue,
            value: bendDragState.currentValue,
          })
        ) {
          onClearConnectionOrthogonalBend(bendDragState.connectionKey);
        } else {
          onSetConnectionOrthogonalBend(
            bendDragState.connectionKey,
            bendDragState.axis,
            bendDragState.currentValue,
          );
        }
      }
      setDragState(null);
      setAnnotationDragState(null);
      setBendDragState(null);
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
    bendDragState,
    dragState,
    effectiveLayout,
    layout,
    onClearConnectionOrthogonalBend,
    onMoveAnnotation,
    onMoveModule,
    onMoveModules,
    onSetConnectionOrthogonalBend,
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
    const orientation = getNodeOrientation(pos.orientation, layoutDirection);
    const sourceSide = getPortSideForOrientation(orientation, 'out');
    const anchor = getAnchorPosition(
      pos.x,
      pos.y,
      sourceSide,
      portIndex,
      NODE_WIDTH,
      NODE_HEIGHT,
      PORT_START_Y,
      PORT_GAP,
    );
    setConnectionFeedback(null);
    setPendingConnection({
      fromModuleId: moduleId,
      fromPort: portName,
      fromAnchor: anchor,
      fromSide: sourceSide,
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

    const sourceOrientation = getNodeOrientation(sourcePosition.orientation, layoutDirection);
    const sourceSide = getPortSideForOrientation(sourceOrientation, 'out');
    const sourceAnchor = getAnchorPosition(
      sourcePosition.x,
      sourcePosition.y,
      sourceSide,
      sourcePortIndex,
      NODE_WIDTH,
      NODE_HEIGHT,
      PORT_START_Y,
      PORT_GAP,
    );

    setConnectionFeedback(null);
    setPendingConnection({
      fromModuleId: connection.from.moduleId,
      fromPort: connection.from.port,
      fromAnchor: sourceAnchor,
      fromSide: sourceSide,
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

      <Suspense fallback={null}>
        <WorkbenchProjectContext
          isCompositeEditor={isCompositeEditor}
          isObservationMode={isObservationMode}
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
          isObservationMode={isObservationMode}
          layoutDirection={layoutDirection}
          routingMode={routingMode}
          canUndo={canUndo}
          canRedo={canRedo}
          selectedModuleIds={selectedModuleIds}
          effectiveSelectedConnectionIndex={effectiveSelectedConnectionIndex}
          selectedConnectionHasManualPath={selectedConnectionHasManualPath}
          showTutorialToggle={showTutorialToggle}
          tutorialNotesVisible={tutorialNotesVisible}
          onAddAnnotation={onAddAnnotation}
          onExportDocument={onExportDocument}
          onExportLabPack={onExportLabPack}
          onExportPython={onExportPython}
          onTidyLayout={onTidyLayout}
          onSetLayoutDirection={onSetLayoutDirection}
          onSetRoutingMode={onSetRoutingMode}
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
          onRequestArrangeSelection={onRequestArrangeSelection}
          onRequestDuplicateSelection={onRequestDuplicateSelection}
          onRequestDeleteSelection={onRequestDeleteSelection}
          onRequestDeleteWire={() => {
            if (effectiveSelectedConnectionIndex !== null) {
              onRemoveConnection(effectiveSelectedConnectionIndex);
              setSelectedConnectionIndex(null);
            }
          }}
          onRequestResetWirePath={() => {
            if (selectedConnectionKey) {
              onClearConnectionOrthogonalBend(selectedConnectionKey);
            }
          }}
          onRequestImport={() => importInputRef.current?.click()}
          onRequestImportLabPack={() => importLabPackInputRef.current?.click()}
          onRequestCreateComposite={onRequestCreateComposite}
          onToggleTutorialNotes={onSetTutorialNotesVisible}
        />
      </Suspense>
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
      <input
        ref={importLabPackInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onImportLabPack(file);
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
          {isObservationMode ? (
            <>
              Selected modules: <strong>{selectedModuleIds.length}</strong>. Use
              <strong> Shift-click</strong> or <strong> Cmd/Ctrl-click</strong> to compare internal modules inside this instance view.
            </>
          ) : (
            <>
              Selected modules: <strong>{selectedModuleIds.length}</strong>. Use
              <strong> Shift-click</strong>, <strong> Cmd/Ctrl-click</strong>, or drag on empty canvas
              to build a composite selection, then drag any selected module to move the group.
            </>
          )}
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

      {!isCompositeEditor && showTickControls ? (
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
                  <span className="meta-label">Collected</span> <strong>{collectedOutput}</strong>
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

      <div
        ref={canvasSurfaceRef}
        className="canvas-surface"
        style={{ height: `${canvasViewportHeight}px` }}
      >
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
              const sourcePort = sourceDef.outputs[sourceIndex];
              const connectionDomainTone =
                sourcePort?.type === 'bits'
                  ? 'bits'
                  : sourcePort?.type === 'symbol'
                    ? 'symbol'
                    : '';

              const sourceOrientation = getNodeOrientation(from.orientation, layoutDirection);
              const targetOrientation = getNodeOrientation(to.orientation, layoutDirection);
              const sourceSide = getPortSideForOrientation(sourceOrientation, 'out');
              const targetSide = getPortSideForOrientation(targetOrientation, 'in');
              const connectionKey = getConnectionComparisonKey(connection);
              const sourceAnchor = getAnchorPosition(
                from.x,
                from.y,
                sourceSide,
                sourceIndex,
                NODE_WIDTH,
                NODE_HEIGHT,
                PORT_START_Y,
                PORT_GAP,
              );
              const targetAnchor = getAnchorPosition(
                to.x,
                to.y,
                targetSide,
                targetIndex,
                NODE_WIDTH,
                NODE_HEIGHT,
                PORT_START_Y,
                PORT_GAP,
              );
              const orthogonalPathData =
                routingMode === 'orthogonal'
                  ? getOrthogonalPathData(
                      sourceAnchor,
                      sourceSide,
                      targetAnchor,
                      targetSide,
                      sourceIndex,
                      targetIndex,
                      bendDragState?.connectionKey === connectionKey
                        ? {
                            orthogonalBend: {
                              axis: bendDragState.axis,
                              value: bendDragState.currentValue,
                            },
                          }
                        : connectionLayout[connectionKey],
                    )
                  : null;
              const pathD =
                orthogonalPathData?.path ??
                getConnectionPath(sourceAnchor, sourceSide, targetAnchor, targetSide);
              const showConnectionLabel =
                hoveredConnectionIndex === connectionIndex ||
                effectiveSelectedConnectionIndex === connectionIndex;
              const midpointX = (sourceAnchor.x + targetAnchor.x) / 2;
              const midpointY = (sourceAnchor.y + targetAnchor.y) / 2;
              const sourceLabel = `${connection.from.moduleId}.${connection.from.port}`;
              const targetLabel = `${connection.to.moduleId}.${connection.to.port}`;
              const labelWidth = Math.max(sourceLabel.length, targetLabel.length) * 7 + 20;
              const labelHeight = 40;
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
                    connectionDomainTone ? `connection-group-domain-${connectionDomainTone}` : '',
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
                    onMouseEnter={() => setHoveredConnectionIndex(connectionIndex)}
                    onMouseLeave={() => setHoveredConnectionIndex(null)}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedConnectionIndex((current) =>
                        current === connectionIndex ? null : connectionIndex,
                      );
                    }}
                  />
                  <path d={pathD} />
                  {routingMode === 'orthogonal' &&
                  !isObservationMode &&
                  !isCompositeEditor &&
                  effectiveSelectedConnectionIndex === connectionIndex &&
                  orthogonalPathData?.bendHandle ? (
                    <circle
                      className={`connection-bend-handle connection-bend-handle-${orthogonalPathData.bendHandle.axis}`}
                      cx={orthogonalPathData.bendHandle.x}
                      cy={orthogonalPathData.bendHandle.y}
                      r={7}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        setBendDragState({
                          connectionKey,
                          axis: orthogonalPathData.bendHandle.axis,
                          autoValue: orthogonalPathData.bendHandle.autoValue,
                          currentValue: orthogonalPathData.bendHandle.value,
                        });
                      }}
                    />
                  ) : null}
                  {showConnectionLabel ? (
                    <g
                      className="connection-hover-label"
                      transform={`translate(${midpointX - labelWidth / 2} ${midpointY - labelHeight - 10})`}
                    >
                      <rect width={labelWidth} height={labelHeight} rx="10" ry="10" />
                      <text x={10} y={15}>
                        <tspan x={10} dy="0">
                          {sourceLabel}
                        </tspan>
                        <tspan x={10} dy="14">
                          {targetLabel}
                        </tspan>
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}

            {pendingConnection ? (() => {
              const { fromAnchor, fromSide, mouseX, mouseY } = pendingConnection;
              return (
                <path
                  className="pending-connection"
                  d={
                    routingMode === 'orthogonal'
                      ? getOrthogonalPendingPath(fromAnchor, fromSide, {
                          x: mouseX,
                          y: mouseY,
                        })
                      : getPendingConnectionPath(fromAnchor, fromSide, {
                          x: mouseX,
                          y: mouseY,
                        })
                  }
                />
              );
            })() : null}
          </svg>

          {activeProjectState.modules.map((moduleInstance) => {
            const position = effectiveLayout[moduleInstance.id] ?? { x: 24, y: 24 };
            const def = registry[moduleInstance.defId];
            const category = def ? getModuleCategory(def) : getModuleCategory(moduleInstance.defId);
            const orientation = getNodeOrientation(position.orientation, layoutDirection);
            const inputSide = getPortSideForOrientation(orientation, 'in');
            const outputSide = getPortSideForOrientation(orientation, 'out');
            const sequentialRole = isTickedMode
              ? getSequentialRole(moduleInstance.defId, def)
              : null;

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
                  ` graph-node-orientation-${orientation}` +
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
                    if (isObservationMode) {
                      setSelectedConnectionIndex(null);
                      onSelectModule(moduleInstance.id, false);
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
                  <div className="graph-node-meta-row">
                    <span className="graph-node-type">{moduleInstance.defId}</span>
                    {sequentialRole ? (
                      <span className={`graph-node-role-badge graph-node-role-badge-${sequentialRole}`}>
                        {getSequentialRoleLabel(sequentialRole)}
                      </span>
                    ) : null}
                  </div>
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

                <div
                  className={`graph-node-anchor-group graph-node-anchor-group-${inputSide}`}
                >
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
                          className={`${getInputAnchorClassName(
                            pendingConnection,
                            targetPortStates[inputKey],
                            hasIncomingConnection,
                          )} graph-port-anchor-${inputSide}`}
                          style={getPortAnchorStyle(inputSide, index)}
                          title={title}
                          onMouseEnter={() => setHoveredPortHintKey(`${moduleInstance.id}:in:${port.name}`)}
                          onMouseLeave={() =>
                            setHoveredPortHintKey((current) =>
                              current === `${moduleInstance.id}:in:${port.name}` ? null : current,
                            )
                          }
                          onMouseDown={(event) => {
                            if (isObservationMode || pendingConnection || !hasIncomingConnection) {
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
                          <span className="graph-port-label">{port.name}</span>
                        </span>
                      );
                    })()
                  ))}
                </div>

                <div
                  className={`graph-node-anchor-group graph-node-anchor-group-${outputSide}`}
                >
                  {(def?.outputs ?? []).map((port, index) => (
                    <span
                      key={port.name}
                      className={`${
                        pendingConnection?.fromModuleId === moduleInstance.id &&
                        pendingConnection.fromPort === port.name
                          ? 'graph-port-anchor graph-port-anchor-out graph-port-anchor-active'
                          : 'graph-port-anchor graph-port-anchor-out'
                      } graph-port-anchor-${outputSide}`}
                      style={getPortAnchorStyle(outputSide, index)}
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
                        if (isObservationMode) {
                          return;
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        startConnectionFromOutput(
                          moduleInstance.id,
                          port.name,
                          index,
                        );
                      }}
                    >
                      <span className="graph-port-label">{port.name}</span>
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
                  if (isObservationMode) {
                    return;
                  }
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
                    if (isObservationMode) {
                      return;
                    }
                    event.stopPropagation();
                    onRemoveAnnotation(annotation.id);
                  }}
                >
                  ×
                </button>
              </div>
              <textarea
                value={annotation.text}
                readOnly={isObservationMode}
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
      <button
        type="button"
        className="canvas-height-resize-handle"
        aria-label="Resize workbench height"
        title="Drag to resize workbench height"
        onPointerDown={(event) => {
          event.preventDefault();
          setCanvasHeightResizeState({
            originY: event.clientY,
            originHeight: canvasViewportHeight,
          });
        }}
      />

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
          <span className="meta-label">Validation</span>
          <strong>{validationIssues.length > 0 ? `${validationIssues.length} issues` : 'clean'}</strong>
        </div>
      </div>
    </section>
  );
}
