import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import type { ModuleDefinition, PortKind, SignalType } from '../../engine/types';
import type {
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleRegistry,
  Project,
  ValidationIssue,
} from '../../engine/types';
import { isTickSliceable } from '../../engine/types';
import { isOutputSinkDefId } from '../../engine/output-sinks';
import type { AutoWireMode } from '../autowire-selection';
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
import { getModuleCategory, MODULE_CATEGORY_LABELS } from '../module-categories';
import { buildLiveStateSummary } from '../live-state-display';
import { formatEcPointAsText } from '../../engine/modules/ec-point';
import { buildSignalChipDetail, formatSignalChip } from '../signal-chip-format';
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
  MAX_WORKSPACE_ZOOM,
  getCanvasViewportPoint,
  getModuleFocusScrollPosition,
  getNextWorkspaceZoom,
} from '../workspace-viewport';
import {
  getClampedMinimapViewportRect,
  getElasticWorkspaceWorldBounds,
} from '../workspace-bounds';
import type {
  AutosaveSnapshotDocument,
  WorkbenchAnnotation,
  WorkbenchConnectionColorOverride,
  WorkbenchConnectionLayout,
  WorkbenchGuideRail,
  WorkbenchGroupBox,
  WorkbenchGroupBoxVariant,
  WorkbenchLayoutDirection,
  WorkbenchPosition,
  WorkbenchRoutingMode,
  WorkbenchWireColorMode,
  WorkbenchStageLabel,
  WorkspaceExportStatus,
  WorkspaceFileBinding,
  WorkspaceSavedViewRegion,
  WorkspaceVersionDocument,
} from '../workbench-document';
import {
  getDefaultNodeOrientation,
  getNodeOrientation,
  getPortSideForModulePort,
  type PortSide,
} from '../node-orientation';
import type { TutorialStep } from '../tutorials';
import {
  buildActiveAnalysisSignalByModuleId,
  buildExecutionSignalByModuleId,
  buildIncomingConnectionIndexByInputKey,
  formatVersionTimestamp,
  getAnchorPosition,
  getModuleDragAlignmentGuides,
  getInputAnchorClassName,
  getOrthogonalPathData,
  getOrthogonalPendingPath,
  snapModulePositionToGuideRails,
  shouldClearOrthogonalBendOverride,
} from '../workbench-support';
import { formatParamValue, parseParamValue } from '../formatters';
import {
  buildInsertChainTemplates,
  getMatchingCanonicalChains,
  getMatchingCanonicalRepairChains,
  getMatchingReferenceAwareRepairChains,
  getPortKindSignature,
  type CanonicalChainDefinition,
} from '../canonical-chain-insertion';
import { isEditableShortcutTarget } from '../keyboard-shortcuts';
import {
  deriveCanvasModuleErrorStateById,
  handleSignalChipPointerDown,
  resolvePendingSnapTarget,
} from '../live-machine-feel-tier1';
import {
  deriveFirstBrokenModuleId,
  getSpliceEligiblePorts,
} from '../live-machine-feel-tier2';
import {
  buildSidePortGroups,
  formatInlineEditableValue,
  getConnectionPath,
  getNodeSizeClass,
  getNearestPointOnOrthogonalSegment,
  getOrderedModulePorts,
  getOrthogonalConnectionVisualOffset,
  getPendingConnectionPath,
  getPortAnchorStyle,
  getPortPlacementForModulePort,
  INLINE_EDITABLE_PARAM_SPECS,
  MINIMAP_HEIGHT,
  MINIMAP_PADDING,
  MINIMAP_WIDTH,
  MIN_GROUP_BOX_HEIGHT,
  MIN_GROUP_BOX_WIDTH,
  DEFAULT_CANVAS_VIEWPORT_HEIGHT,
  MIN_CANVAS_VIEWPORT_HEIGHT,
  MAX_CANVAS_VIEWPORT_HEIGHT,
  NODE_SIZE_CONFIGS,
  ANCHOR_INSERTION_HIT_TOLERANCE,
  snapCoordinateToGrid,
  snapPointToGrid,
  type NodeSizeClass,
  type NodeSizeConfig,
} from './workbench-canvas-geometry';
import {
  computeViewportForRect,
  createWorkspaceSavedViewRegion,
  MAX_WORKSPACE_SAVED_VIEW_REGIONS,
  type WorkspaceFrameRect,
  type WorkspaceViewState,
} from '../workspace-navigation';

const NODE_WIDTH = CANVAS_NODE_WIDTH;
const NODE_HEIGHT = CANVAS_NODE_HEIGHT;
const DOMAIN_LEGEND_ITEMS: Array<{
  domain: 'bits' | 'symbol' | 'integer' | 'ec-point';
  label: string;
}> = [
  { domain: 'bits', label: 'bits' },
  { domain: 'symbol', label: 'symbol' },
  { domain: 'integer', label: 'integer' },
  { domain: 'ec-point', label: 'ec-point' },
];

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
const CanvasQuickAdd = lazy(() =>
  import('./canvas-quick-add').then((module) => ({
    default: module.CanvasQuickAdd,
  })),
);


interface PendingConnection {
  fromModuleId: string;
  fromPort: string;
  fromAnchor: { x: number; y: number };
  fromSide: PortSide;
  mouseX: number;
  mouseY: number;
  excludedConnectionIndex: number | null;
  isDragging: boolean;
}

interface QuickAddState {
  canvasX: number;
  canvasY: number;
  clientX: number;
  clientY: number;
  mode: 'plain' | 'connect';
  pendingConnection?: {
    fromModuleId: string;
    fromPort: string;
    sourceType: SignalType;
    sourceKind: PortKind;
  };
}

interface PendingReferenceChainSelection {
  chain: CanonicalChainDefinition;
  canvasX: number;
  canvasY: number;
  sourceAttachment: {
    fromModuleId: string;
    fromPort: string;
  };
  targetAttachment?: {
    toModuleId: string;
    toPort: string;
  };
}


interface WorkbenchPanelProps {
  activeProject: DemoProject;
  title?: string;
  summary?: string;
  pipelineLabel?: string;
  activeProjectState: Project;
  theme: 'light' | 'dark';
  layout: Record<string, WorkbenchPosition>;
  layoutDirection: WorkbenchLayoutDirection;
  routingMode: WorkbenchRoutingMode;
  wireColorMode: WorkbenchWireColorMode;
  connectionLayout: Record<string, WorkbenchConnectionLayout>;
  annotations: WorkbenchAnnotation[];
  stageLabels: WorkbenchStageLabel[];
  groupBoxes: WorkbenchGroupBox[];
  guideRails: WorkbenchGuideRail[];
  showFurniture: boolean;
  showOverviewNavigator: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
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
  onDuplicateModule?: (moduleId: string) => void;
  onMoveModule: (moduleId: string, x: number, y: number) => void;
  onMoveModules: (positions: Record<string, { x: number; y: number }>) => void;
  onAddAnnotation: () => void;
  onAddStageLabel: () => void;
  onAddGroupBox: () => void;
  onAddGroupBoxFromSelection: () => void;
  onAddGuideRail: (axis: 'horizontal' | 'vertical') => void;
  onMoveGuideRail: (guideRailId: string, position: number) => void;
  onUpdateGuideRailTitle: (guideRailId: string, title: string) => void;
  onRemoveGuideRail: (guideRailId: string) => void;
  onMoveGroupBox: (groupBoxId: string, x: number, y: number) => void;
  onResizeGroupBox: (groupBoxId: string, width: number, height: number) => void;
  onUpdateGroupBoxTitle: (groupBoxId: string, title: string) => void;
  onSetGroupBoxVariant: (groupBoxId: string, variant: WorkbenchGroupBoxVariant) => void;
  onRemoveGroupBox: (groupBoxId: string) => void;
  onSetFurnitureVisible: (visible: boolean) => void;
  onSetOverviewNavigatorVisible: (visible: boolean) => void;
  onSetGridVisible: (visible: boolean) => void;
  onSetSnapToGrid: (enabled: boolean) => void;
  onSetSnapToGuides: (enabled: boolean) => void;
  onMoveAnnotation: (annotationId: string, x: number, y: number) => void;
  onUpdateAnnotationText: (annotationId: string, text: string) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  onMoveStageLabel: (stageLabelId: string, x: number, y: number) => void;
  onUpdateStageLabelText: (stageLabelId: string, text: string) => void;
  onRemoveStageLabel: (stageLabelId: string) => void;
  onSelectModule: (moduleId: string, additive?: boolean) => void;
  onSelectModules: (moduleIds: string[], additive?: boolean) => void;
  onRequestCreateComposite: () => void;
  onRequestCreateIterator: () => void;
  onRequestCreateClockedIterator: () => void;
  onRequestCreateConditional: () => void;
  onRequestCreateMultiConditional: () => void;
  onRequestAutoWire: (mode: AutoWireMode) => void;
  onRequestCopySelection: () => void;
  onRequestPasteSelection: () => void;
  onRequestDuplicateSelection: () => void;
  onRequestRepeatSelectionRight: () => void;
  onRequestCopySelectionToWorkspace: () => void;
  onRequestDeleteSelection: () => void;
  onRequestUndo: () => void;
  onRequestRedo: () => void;
  onToggleTheme: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canPasteSelection?: boolean;
  workspaceVersions: WorkspaceVersionDocument[];
  autosaveSnapshots: AutosaveSnapshotDocument[];
  persistenceWarning: string | null;
  lastDurableSaveAt: string | null;
  exportStatus: WorkspaceExportStatus | null;
  currentDocumentFingerprint: string | null;
  fileBinding: WorkspaceFileBinding | null;
  savedViewRegions: WorkspaceSavedViewRegion[];
  onRequestOpenWorkspace: () => void;
  onRequestSaveDocument: () => void;
  onRequestSaveDocumentAs: () => void;
  onRequestSaveWorkspaceToLibrary: () => void;
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
  onRequestRestoreAutosave: (snapshotId: string) => void;
  onSaveWorkspaceViewRegion: (region: WorkspaceSavedViewRegion) => void;
  onRemoveWorkspaceViewRegion: (regionId: string) => void;
  requestedFocusModuleId?: string | null;
  onWorkspaceFocusHandled?: () => void;
  onSwitchProject: (projectId: string) => void;
  showPaletteToggle?: boolean;
  isPaletteVisible?: boolean;
  onTogglePaletteVisible?: () => void;
  showInspectorToggle?: boolean;
  isInspectorVisible?: boolean;
  onToggleInspectorVisible?: () => void;
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
  onInsertBridgeConnection: (
    bridgeDefId: string,
    fromModuleId: string,
    fromPort: string,
    toModuleId: string,
    toPort: string,
    position: { x: number; y: number },
  ) => void;
  onSetConnectionOrthogonalBend: (
    connectionKey: string,
    axis: 'x' | 'y',
    value: number,
  ) => void;
  onSetConnectionOrthogonalAnchors: (
    connectionKey: string,
    anchors: Array<{ x: number; y: number }>,
  ) => void;
  onRemoveConnectionOrthogonalAnchor: (connectionKey: string, anchorIndex: number) => void;
  onClearConnectionOrthogonalBend: (connectionKey: string) => void;
  onClearConnectionOrthogonalPathEdits: (connectionKey: string) => void;
  onSetConnectionLanePreference: (
    connectionKey: string,
    preference: 'negative' | 'positive',
  ) => void;
  onClearConnectionLanePreference: (connectionKey: string) => void;
  onSetConnectionColorOverride: (
    connectionKey: string,
    color: WorkbenchConnectionColorOverride,
  ) => void;
  onClearConnectionColorOverride: (connectionKey: string) => void;
  onExportDocument: () => void;
  onExportLabPack: () => void;
  onExportPython: () => void;
  onImportDocument: (file: File) => void;
  onImportLabPack: (file: File) => void;
  onTidyLayout: () => void;
  onTidySelection: () => void;
  onSetLayoutDirection: (direction: WorkbenchLayoutDirection) => void;
  onSetRoutingMode: (mode: WorkbenchRoutingMode) => void;
  onSetWireColorMode: (mode: WorkbenchWireColorMode) => void;
  onSetTutorialStep?: (stepIndex: number) => void;
  onSetTutorialNotesVisible?: (visible: boolean) => void;
  onRenameModuleInstance: (moduleId: string, nextModuleId: string) => void;
  onUpdateModuleParam: (moduleId: string, key: string, value: unknown) => void;
  onAddModule: (moduleDef: ModuleDefinition, position: { x: number; y: number }) => void;
  activePaletteModuleDrag?: {
    moduleDef: ModuleDefinition | null;
    clientX: number;
    clientY: number;
    isActive: boolean;
    isOverCanvas: boolean;
  } | null;
  onClearPaletteModuleDrag?: () => void;
  paletteModuleDropRequest?: {
    requestId: number;
    clientX: number;
    clientY: number;
  } | null;
  onPaletteModuleDropRequestHandled?: () => void;
  onInsertModuleAndConnect: (
    moduleDef: ModuleDefinition,
    position: { x: number; y: number },
    fromModuleId: string,
    fromPort: string,
    toPort: string,
  ) => void;
  onInsertChain: (
    modules: Array<{ defId: string; params?: Record<string, unknown>; position: { x: number; y: number } }>,
    connections: Array<{ fromIndex: number; fromPort: string; toIndex: number; toPort: string }>,
    attach?: { fromModuleId: string; fromPort: string; toIndex: number; toPort: string },
    attachTarget?: { fromIndex: number; fromPort: string; toModuleId: string; toPort: string },
    attachInputs?: Array<{ fromModuleId: string; fromPort: string; toIndex: number; toPort: string }>,
  ) => void;
  onSpliceModuleOnConnection: (
    connectionIndex: number,
    moduleDef: ModuleDefinition,
    position: { x: number; y: number },
    inputPortName: string,
    outputPortName: string,
    anchorInsertIndex: number | null,
  ) => void;
  onPendingConnectionChange?: (
    info: { fromModuleId: string; fromPort: string; sourceType: SignalType; sourceKind: PortKind } | null,
  ) => void;
  onHoveredInputPortChange?: (
    info: { moduleId: string; defId?: string; port: string; type: SignalType; kind: PortKind } | null,
  ) => void;
  projects: DemoProject[];
}


export function WorkbenchPanel({
  activeProject,
  title,
  summary,
  pipelineLabel,
  activeProjectState,
  theme,
  layout,
  layoutDirection,
  routingMode,
  wireColorMode,
  connectionLayout,
  annotations,
  stageLabels,
  groupBoxes,
  guideRails,
  showFurniture,
  showOverviewNavigator,
  showGrid,
  snapToGrid,
  snapToGuides,
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
  onDuplicateModule,
  onMoveModule,
  onMoveModules,
  onAddAnnotation,
  onAddStageLabel,
  onAddGroupBox,
  onAddGroupBoxFromSelection,
  onAddGuideRail,
  onMoveGuideRail,
  onUpdateGuideRailTitle,
  onRemoveGuideRail,
  onMoveGroupBox,
  onResizeGroupBox,
  onUpdateGroupBoxTitle,
  onSetGroupBoxVariant,
  onRemoveGroupBox,
  onSetFurnitureVisible,
  onSetOverviewNavigatorVisible,
  onSetGridVisible,
  onSetSnapToGrid,
  onSetSnapToGuides,
  onMoveAnnotation,
  onUpdateAnnotationText,
  onRemoveAnnotation,
  onMoveStageLabel,
  onUpdateStageLabelText,
  onRemoveStageLabel,
  onSelectModule,
  onSelectModules,
  onRequestCreateComposite,
  onRequestCreateIterator,
  onRequestCreateClockedIterator,
  onRequestCreateConditional,
  onRequestCreateMultiConditional,
  onRequestAutoWire,
  onRequestCopySelection,
  onRequestPasteSelection,
  onRequestDuplicateSelection,
  onRequestRepeatSelectionRight,
  onRequestCopySelectionToWorkspace,
  onRequestDeleteSelection,
  onRequestUndo,
  onRequestRedo,
  onToggleTheme,
  canUndo,
  canRedo,
  canPasteSelection = false,
  workspaceVersions,
  autosaveSnapshots,
  persistenceWarning,
  lastDurableSaveAt,
  exportStatus,
  currentDocumentFingerprint,
  fileBinding,
  savedViewRegions,
  onRequestOpenWorkspace,
  onRequestSaveDocument,
  onRequestSaveDocumentAs,
  onRequestSaveWorkspaceToLibrary,
  onRequestSaveVersion,
  onRequestArrangeSelection,
  onRequestRestoreVersion,
  onRequestRestoreAutosave,
  onSaveWorkspaceViewRegion,
  onRemoveWorkspaceViewRegion,
  requestedFocusModuleId = null,
  onWorkspaceFocusHandled,
  onSwitchProject,
  showPaletteToggle = false,
  isPaletteVisible = false,
  onTogglePaletteVisible,
  showInspectorToggle = false,
  isInspectorVisible = false,
  onToggleInspectorVisible,
  onAddConnection,
  onReplaceConnection,
  onRemoveConnection,
  onInsertBridgeConnection,
  onSetConnectionOrthogonalBend,
  onSetConnectionOrthogonalAnchors,
  onRemoveConnectionOrthogonalAnchor,
  onClearConnectionOrthogonalBend,
  onClearConnectionOrthogonalPathEdits,
  onSetConnectionLanePreference,
  onClearConnectionLanePreference,
  onSetConnectionColorOverride,
  onClearConnectionColorOverride,
  onExportDocument,
  onExportLabPack,
  onExportPython,
  onImportDocument,
  onImportLabPack,
  onTidyLayout,
  onTidySelection,
  onSetLayoutDirection,
  onSetRoutingMode,
  onSetWireColorMode,
  onSetTutorialStep,
  onSetTutorialNotesVisible,
  onRenameModuleInstance,
  onUpdateModuleParam,
  onAddModule,
  activePaletteModuleDrag = null,
  onClearPaletteModuleDrag,
  paletteModuleDropRequest = null,
  onPaletteModuleDropRequestHandled,
  onInsertModuleAndConnect,
  onInsertChain,
  onSpliceModuleOnConnection,
  onPendingConnectionChange,
  onHoveredInputPortChange,
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
  const [stageLabelDragState, setStageLabelDragState] = useState<{
    stageLabelId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [selectedStageLabelId, setSelectedStageLabelId] = useState<string | null>(null);
  const [selectedGroupBoxId, setSelectedGroupBoxId] = useState<string | null>(null);
  const [groupBoxTitleEdit, setGroupBoxTitleEdit] = useState<{
    groupBoxId: string;
    value: string;
    originalTitle: string;
    untouchedHint: boolean;
    createdFromSelection: boolean;
  } | null>(null);
  const [pendingGroupBoxCreation, setPendingGroupBoxCreation] = useState<{
    mode: 'selection' | 'blank';
    previousIds: string[];
    hint: string;
  } | null>(null);
  const [selectedGuideRailId, setSelectedGuideRailId] = useState<string | null>(null);
  const [groupBoxDragState, setGroupBoxDragState] = useState<{
    groupBoxId: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [groupBoxResizeState, setGroupBoxResizeState] = useState<{
    groupBoxId: string;
    originX: number;
    originY: number;
    initialWidth: number;
    initialHeight: number;
    currentWidth: number;
    currentHeight: number;
  } | null>(null);
  const [guideRailDragState, setGuideRailDragState] = useState<{
    guideRailId: string;
    axis: 'horizontal' | 'vertical';
    pointerOffset: number;
    initialPosition: number;
    currentPosition: number;
  } | null>(null);
  const [inlineRename, setInlineRename] = useState<{ moduleId: string; value: string } | null>(null);
  const [inlineParamEdit, setInlineParamEdit] = useState<{
    moduleId: string;
    paramKey: string;
    value: string;
    error: string | null;
  } | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null);
  const [pendingReferenceChainSelection, setPendingReferenceChainSelection] =
    useState<PendingReferenceChainSelection | null>(null);
  const [showSignalChips, setShowSignalChips] = useState(true);
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const [pendingRepairInsertion, setPendingRepairInsertion] = useState<{
    fromModuleId: string;
    fromPort: string;
    toModuleId: string;
    toPort: string;
    sourceType: SignalType;
    sourceKind: PortKind;
    targetType: SignalType;
    targetKind: PortKind;
    x: number;
    y: number;
  } | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);
  const [selectedConnectionIndex, setSelectedConnectionIndex] = useState<number | null>(null);
  const [hoveredConnectionIndex, setHoveredConnectionIndex] = useState<number | null>(null);
  const [hoveredPendingTargetKey, setHoveredPendingTargetKey] = useState<string | null>(null);
  const [snapPendingTargetKey, setSnapPendingTargetKey] = useState<string | null>(null);
  const [rejectedPendingTargetKey, setRejectedPendingTargetKey] = useState<string | null>(null);
  const [bendDragState, setBendDragState] = useState<{
    connectionKey: string;
    axis: 'x' | 'y';
    autoValue: number;
    currentValue: number;
  } | null>(null);
  const [waypointModeConnectionKey, setWaypointModeConnectionKey] = useState<string | null>(null);
  const [selectedConnectionAnchorIndex, setSelectedConnectionAnchorIndex] = useState<number | null>(
    null,
  );
  const [anchorDragState, setAnchorDragState] = useState<{
    connectionKey: string;
    anchorIndex: number;
    currentX: number;
    currentY: number;
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

  const effectiveSelectedGroupBoxId = useMemo(
    () =>
      showFurniture &&
      selectedGroupBoxId &&
      groupBoxes.some((groupBox) => groupBox.id === selectedGroupBoxId)
        ? selectedGroupBoxId
        : null,
    [groupBoxes, selectedGroupBoxId, showFurniture],
  );
  const effectiveSelectedGuideRailId = useMemo(
    () =>
      showFurniture &&
      selectedGuideRailId &&
      guideRails.some((guideRail) => guideRail.id === selectedGuideRailId)
        ? selectedGuideRailId
        : null,
    [guideRails, selectedGuideRailId, showFurniture],
  );
  const effectiveSelectedStageLabelId = useMemo(
    () =>
      showFurniture &&
      selectedStageLabelId &&
      stageLabels.some((stageLabel) => stageLabel.id === selectedStageLabelId)
        ? selectedStageLabelId
        : null,
    [selectedStageLabelId, showFurniture, stageLabels],
  );
  const [canvasHeightResizeState, setCanvasHeightResizeState] = useState<{
    originY: number;
    originHeight: number;
  } | null>(null);
  const [viewportMetrics, setViewportMetrics] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 0,
    clientHeight: 0,
  });
  const [previousView, setPreviousView] = useState<WorkspaceViewState | null>(null);
  const pendingViewportRef = useRef<{ view: WorkspaceViewState; behavior: ScrollBehavior } | null>(
    null,
  );
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
  const authoredBounds = useMemo(() => {
    const maxModuleX = Math.max(
      0,
      ...Object.values(effectiveLayout).map((position) => position.x + 180),
    );
    const maxModuleY = Math.max(
      0,
      ...Object.values(effectiveLayout).map((position) => position.y + 140),
    );
    const maxAnnotationX = Math.max(
      0,
      ...annotations.map((annotation) =>
        (annotationDragState?.annotationId === annotation.id
          ? annotationDragState.currentX
          : annotation.x) + 260,
      ),
      ...stageLabels.map((stageLabel) =>
        (stageLabelDragState?.stageLabelId === stageLabel.id
          ? stageLabelDragState.currentX
          : stageLabel.x) + 220,
      ),
    );
    const maxAnnotationY = Math.max(
      0,
      ...annotations.map((annotation) =>
        (annotationDragState?.annotationId === annotation.id
          ? annotationDragState.currentY
          : annotation.y) + 170,
      ),
      ...stageLabels.map((stageLabel) =>
        (stageLabelDragState?.stageLabelId === stageLabel.id
          ? stageLabelDragState.currentY
          : stageLabel.y) + 56,
      ),
    );
    const maxGroupBoxX = Math.max(
      0,
      ...groupBoxes.map((groupBox) => {
        const x =
          groupBoxDragState?.groupBoxId === groupBox.id
            ? groupBoxDragState.currentX
            : groupBox.x;
        const width =
          groupBoxResizeState?.groupBoxId === groupBox.id
            ? groupBoxResizeState.currentWidth
            : groupBox.width;
        return x + width + 32;
      }),
    );
    const maxGroupBoxY = Math.max(
      0,
      ...groupBoxes.map((groupBox) => {
        const y =
          groupBoxDragState?.groupBoxId === groupBox.id
            ? groupBoxDragState.currentY
            : groupBox.y;
        const height =
          groupBoxResizeState?.groupBoxId === groupBox.id
            ? groupBoxResizeState.currentHeight
            : groupBox.height;
        return y + height + 32;
      }),
    );

    return {
      width: Math.max(980, maxModuleX, maxAnnotationX, maxGroupBoxX),
      height: Math.max(360, maxModuleY, maxAnnotationY, maxGroupBoxY),
    };
  }, [
    annotations,
    annotationDragState,
    effectiveLayout,
    groupBoxDragState,
    groupBoxResizeState,
    groupBoxes,
    stageLabels,
    stageLabelDragState,
  ]);
  const authoredCanvasWidth = authoredBounds.width;
  const authoredCanvasHeight = authoredBounds.height;
  const worldBounds = useMemo(
    () =>
      getElasticWorkspaceWorldBounds({
        authoredWidth: authoredCanvasWidth,
        authoredHeight: authoredCanvasHeight,
        viewportWidth: viewportMetrics.clientWidth,
        viewportHeight: Math.max(viewportMetrics.clientHeight, canvasViewportHeight),
      }),
    [authoredCanvasHeight, authoredCanvasWidth, canvasViewportHeight, viewportMetrics.clientHeight, viewportMetrics.clientWidth],
  );
  const canvasWidth = worldBounds.width;
  const canvasHeight = worldBounds.height;
  const dragAlignmentGuides = useMemo(() => {
    if (!dragState) {
      return [];
    }

    const anchorPosition = dragState.currentPositions[dragState.moduleId];
    if (!anchorPosition) {
      return [];
    }

    return getModuleDragAlignmentGuides(
      anchorPosition,
      dragState.moduleIds,
      layout,
      guideRails,
      stageLabels,
      groupBoxes,
      NODE_WIDTH,
      NODE_HEIGHT,
    );
  }, [dragState, guideRails, groupBoxes, layout, stageLabels]);
  const minimapMetrics = useMemo(() => {
    const availableWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
    const availableHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;
    const scale = Math.min(
      availableWidth / Math.max(1, authoredCanvasWidth),
      availableHeight / Math.max(1, authoredCanvasHeight),
    );
    const contentWidth = authoredCanvasWidth * scale;
    const contentHeight = authoredCanvasHeight * scale;
    return {
      scale,
      offsetX: (MINIMAP_WIDTH - contentWidth) / 2,
      offsetY: (MINIMAP_HEIGHT - contentHeight) / 2,
      contentWidth,
      contentHeight,
    };
  }, [authoredCanvasHeight, authoredCanvasWidth]);
  const minimapViewportRect = useMemo(() => {
    return getClampedMinimapViewportRect({
      authoredWidth: authoredCanvasWidth,
      authoredHeight: authoredCanvasHeight,
      scale: minimapMetrics.scale,
      offsetX: minimapMetrics.offsetX,
      offsetY: minimapMetrics.offsetY,
      scrollLeft: viewportMetrics.scrollLeft,
      scrollTop: viewportMetrics.scrollTop,
      clientWidth: viewportMetrics.clientWidth,
      clientHeight: viewportMetrics.clientHeight,
      zoom: workspaceZoom > 0 ? workspaceZoom : DEFAULT_WORKSPACE_ZOOM,
    });
  }, [authoredCanvasHeight, authoredCanvasWidth, minimapMetrics, viewportMetrics, workspaceZoom]);
  const workspaceLandmarks = useMemo(
    () => deriveWorkspaceLandmarks(activeProjectState, registry, effectiveLayout),
    [activeProjectState, effectiveLayout, registry],
  );
  const incomingConnectionIndexByInputKey = useMemo(
    () => buildIncomingConnectionIndexByInputKey(activeProjectState.connections),
    [activeProjectState.connections],
  );
  const nodeSizeByModuleId = useMemo(() => {
    const map: Record<string, { sizeClass: NodeSizeClass; config: NodeSizeConfig }> = {};
    for (const moduleInstance of activeProjectState.modules) {
      const def = registry[moduleInstance.defId];
      const totalPorts = def ? def.inputs.length + def.outputs.length : 0;
      const sizeClass = getNodeSizeClass(totalPorts);
      map[moduleInstance.id] = { sizeClass, config: NODE_SIZE_CONFIGS[sizeClass] };
    }
    return map;
  }, [activeProjectState.modules, registry]);
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
  const selectedConnectionWaypointMode =
    routingMode === 'orthogonal' &&
    selectedConnectionKey !== null &&
    waypointModeConnectionKey === selectedConnectionKey;
  const selectedConnectionAnchors =
    selectedConnectionKey !== null
      ? connectionLayout[selectedConnectionKey]?.orthogonalAnchors ?? []
      : [];
  const effectiveSelectedConnectionAnchorIndex =
    selectedConnectionAnchorIndex !== null &&
    selectedConnectionAnchorIndex >= 0 &&
    selectedConnectionAnchorIndex < selectedConnectionAnchors.length
      ? selectedConnectionAnchorIndex
      : null;
  const selectedConnectionHasManualPath = Boolean(
    selectedConnectionKey &&
      (connectionLayout[selectedConnectionKey]?.orthogonalBend ||
        (connectionLayout[selectedConnectionKey]?.orthogonalAnchors?.length ?? 0) > 0),
  );
  const selectedConnectionLanePreference =
    selectedConnectionKey
      ? connectionLayout[selectedConnectionKey]?.orthogonalLanePreference ?? null
      : null;
  const selectedConnectionColorOverride =
    selectedConnectionKey ? connectionLayout[selectedConnectionKey]?.colorOverride ?? null : null;
  const selectedConnection = useMemo(
    () =>
      effectiveSelectedConnectionIndex !== null
        ? activeProjectState.connections[effectiveSelectedConnectionIndex] ?? null
        : null,
    [activeProjectState.connections, effectiveSelectedConnectionIndex],
  );
  const selectedConnectionSourceLabel = selectedConnection
    ? `${selectedConnection.from.moduleId}.${selectedConnection.from.port}`
    : null;
  const selectedConnectionTargetLabel = selectedConnection
    ? `${selectedConnection.to.moduleId}.${selectedConnection.to.port}`
    : null;
  const selectedConnectionDomainTone = useMemo(() => {
    if (!selectedConnection) {
      return null;
    }

    const sourceModule = activeProjectState.modules.find(
      (moduleInstance) => moduleInstance.id === selectedConnection.from.moduleId,
    );
    const sourceDef = sourceModule ? registry[sourceModule.defId] : null;
    const sourcePort = sourceDef?.outputs.find((port) => port.name === selectedConnection.from.port);
    return sourcePort?.type ?? null;
  }, [activeProjectState.modules, registry, selectedConnection]);
  const selectedGroupBox = useMemo(
    () =>
      effectiveSelectedGroupBoxId
        ? groupBoxes.find((groupBox) => groupBox.id === effectiveSelectedGroupBoxId) ?? null
        : null,
    [effectiveSelectedGroupBoxId, groupBoxes],
  );
  const selectedModulesGroupBoxBounds = useMemo(() => {
    const selectedPositions = selectedModuleIds
      .map((moduleId) => effectiveLayout[moduleId])
      .filter((position): position is WorkbenchPosition => Boolean(position));
    if (selectedPositions.length === 0) {
      return null;
    }

    const minX = Math.min(...selectedPositions.map((position) => position.x));
    const maxX = Math.max(...selectedPositions.map((position) => position.x));
    const minY = Math.min(...selectedPositions.map((position) => position.y));
    const maxY = Math.max(...selectedPositions.map((position) => position.y));

    return {
      x: Math.max(16, minX - 36),
      y: Math.max(16, minY - 36),
      width: maxX - minX + CANVAS_NODE_WIDTH + 72,
      height: maxY - minY + CANVAS_NODE_HEIGHT + 72,
    };
  }, [effectiveLayout, selectedModuleIds]);
  const selectionCategoryHint = useMemo(() => {
    if (selectedModuleIds.length === 0) {
      return '';
    }

    const categories = new Set(
      selectedModuleIds
        .map((moduleId) =>
          activeProjectState.modules.find((moduleInstance) => moduleInstance.id === moduleId),
        )
        .filter((moduleInstance): moduleInstance is typeof activeProjectState.modules[number] => Boolean(moduleInstance))
        .map((moduleInstance) => getModuleCategory(registry[moduleInstance.defId] ?? moduleInstance.defId)),
    );

    if (categories.size !== 1) {
      return '';
    }

    const category = [...categories][0];
    return MODULE_CATEGORY_LABELS[category];
  }, [activeProjectState.modules, registry, selectedModuleIds]);
  const selectionAlreadyHasTightGroupBox = useMemo(() => {
    if (!selectedModulesGroupBoxBounds) {
      return false;
    }

    return groupBoxes.some(
      (groupBox) =>
        groupBox.x === selectedModulesGroupBoxBounds.x &&
        groupBox.y === selectedModulesGroupBoxBounds.y &&
        groupBox.width === selectedModulesGroupBoxBounds.width &&
        groupBox.height === selectedModulesGroupBoxBounds.height,
    );
  }, [groupBoxes, selectedModulesGroupBoxBounds]);
  const selectedGuideRail = useMemo(
    () =>
      effectiveSelectedGuideRailId
        ? guideRails.find((guideRail) => guideRail.id === effectiveSelectedGuideRailId) ?? null
        : null,
    [effectiveSelectedGuideRailId, guideRails],
  );
  useEffect(() => {
    if (!groupBoxTitleEdit) {
      return;
    }
    if (selectedGroupBoxId !== groupBoxTitleEdit.groupBoxId) {
      setGroupBoxTitleEdit(null);
    }
  }, [groupBoxTitleEdit, selectedGroupBoxId]);
  const selectedStageLabel = useMemo(
    () =>
      effectiveSelectedStageLabelId
        ? stageLabels.find((stageLabel) => stageLabel.id === effectiveSelectedStageLabelId) ?? null
        : null,
    [effectiveSelectedStageLabelId, stageLabels],
  );
  const selectedFurnitureKind = selectedGuideRail
    ? ('guide-rail' as const)
    : selectedGroupBox
      ? ('group-box' as const)
      : selectedStageLabel
        ? ('stage-label' as const)
        : null;
  const selectedFurnitureTitle = selectedGuideRail
    ? selectedGuideRail.title || 'Guide Rail'
    : selectedGroupBox
      ? selectedGroupBox.title || 'Group Box'
      : selectedStageLabel
        ? selectedStageLabel.text || 'Stage Label'
        : null;
  const selectedFurnitureDetailPrimary = selectedGuideRail
    ? `${selectedGuideRail.axis === 'vertical' ? 'Vertical' : 'Horizontal'} at ${Math.round(selectedGuideRail.position)}px`
    : selectedGroupBox
      ? `${selectedGroupBox.variant ?? 'neutral'} • ${Math.round(selectedGroupBox.width)}×${Math.round(selectedGroupBox.height)}`
      : selectedStageLabel
        ? `Position ${Math.round(selectedStageLabel.x)}, ${Math.round(selectedStageLabel.y)}`
        : null;
  const selectedFurnitureDetailSecondary = selectedGuideRail
    ? 'Drag to reposition'
    : selectedGroupBox
      ? `Position ${Math.round(selectedGroupBox.x)}, ${Math.round(selectedGroupBox.y)}`
      : selectedStageLabel
        ? 'Drag to reposition'
        : null;
  const selectedConnectionLaneAxis = useMemo(() => {
    if (routingMode !== 'orthogonal' || effectiveSelectedConnectionIndex === null) {
      return null;
    }

    const selectedConnection = activeProjectState.connections[effectiveSelectedConnectionIndex];
    const from = effectiveLayout[selectedConnection.from.moduleId];
    const sourceDef = registry[
      activeProjectState.modules.find((moduleInstance) => moduleInstance.id === selectedConnection.from.moduleId)
        ?.defId ?? ''
    ];

    if (!from || !sourceDef) {
      return null;
    }

    const sourceOrientation = getNodeOrientation(from.orientation, layoutDirection);
    const sourceSide = getPortSideForModulePort(
      from,
      sourceOrientation,
      'out',
      selectedConnection.from.port,
    );
    return sourceSide === 'left' || sourceSide === 'right' ? 'x' : 'y';
  }, [
    activeProjectState.connections,
    activeProjectState.modules,
    effectiveLayout,
    effectiveSelectedConnectionIndex,
    layoutDirection,
    registry,
    routingMode,
  ]);

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

  function getPaletteModulePlacement(
    moduleDef: ModuleDefinition,
    clientX: number,
    clientY: number,
  ) {
    const canvasRect = canvasSurfaceRef.current?.getBoundingClientRect();
    if (
      !canvasRect ||
      clientX < canvasRect.left ||
      clientX > canvasRect.right ||
      clientY < canvasRect.top ||
      clientY > canvasRect.bottom
    ) {
      return null;
    }

    const pointer = getCanvasPointerFromClient(clientX, clientY);
    if (!pointer) {
      return null;
    }

    const nodeSizeClass = getNodeSizeClass(moduleDef.inputs.length + moduleDef.outputs.length);
    const nodeSizeConfig = NODE_SIZE_CONFIGS[nodeSizeClass];
    const defaultOrientation = getDefaultNodeOrientation(layoutDirection);
    const spliceCandidates = activeProjectState.connections
      .map((connection, connectionIndex) => {
        const sourcePosition = effectiveLayout[connection.from.moduleId];
        const targetPosition = effectiveLayout[connection.to.moduleId];
        const sourceDef = registry[
          activeProjectState.modules.find((moduleInstance) => moduleInstance.id === connection.from.moduleId)
            ?.defId ?? ''
        ];
        const targetDef = registry[
          activeProjectState.modules.find((moduleInstance) => moduleInstance.id === connection.to.moduleId)?.defId ??
            ''
        ];
        if (!sourcePosition || !targetPosition || !sourceDef || !targetDef) {
          return null;
        }

        const sourcePort = sourceDef.outputs.find((port) => port.name === connection.from.port);
        if (!sourcePort) {
          return null;
        }

        const splicePorts = getSpliceEligiblePorts(moduleDef, sourcePort.type);
        if (!splicePorts) {
          return null;
        }

        const orderedSourcePorts = getOrderedModulePorts(sourceDef, sourcePosition, 'output');
        const orderedTargetPorts = getOrderedModulePorts(targetDef, targetPosition, 'input');
        const sourceOrientation = getNodeOrientation(sourcePosition.orientation, layoutDirection);
        const targetOrientation = getNodeOrientation(targetPosition.orientation, layoutDirection);
        const { side: sourceSide, sideIndex: sourceAnchorIndex } = getPortPlacementForModulePort(
          [],
          orderedSourcePorts,
          sourcePosition,
          sourceOrientation,
          'out',
          connection.from.port,
        );
        const { side: targetSide, sideIndex: targetAnchorIndex } = getPortPlacementForModulePort(
          orderedTargetPorts,
          [],
          targetPosition,
          targetOrientation,
          'in',
          connection.to.port,
        );
        const sourceSizeConfig =
          nodeSizeByModuleId[connection.from.moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
        const targetSizeConfig =
          nodeSizeByModuleId[connection.to.moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
        const sourceAnchor = getAnchorPosition(
          sourcePosition.x,
          sourcePosition.y,
          sourceSide,
          sourceAnchorIndex,
          sourceSizeConfig.width,
          sourceSizeConfig.height,
          sourceSizeConfig.portStartY,
          sourceSizeConfig.portGap,
        );
        const targetAnchor = getAnchorPosition(
          targetPosition.x,
          targetPosition.y,
          targetSide,
          targetAnchorIndex,
          targetSizeConfig.width,
          targetSizeConfig.height,
          targetSizeConfig.portStartY,
          targetSizeConfig.portGap,
        );

        let projection:
          | {
              x: number;
              y: number;
              distance: number;
              anchorInsertIndex: number | null;
            }
          | null = null;

        if (routingMode === 'orthogonal') {
          const orthogonalPathData = getOrthogonalPathData(
            sourceAnchor,
            sourceSide,
            targetAnchor,
            targetSide,
            Math.max(0, orderedSourcePorts.findIndex((port) => port.name === connection.from.port)),
            Math.max(0, orderedTargetPorts.findIndex((port) => port.name === connection.to.port)),
            connectionLayout[getConnectionComparisonKey(connection)],
          );
          const anchorPoints = orthogonalPathData.anchorHandles.map((anchor) => ({ x: anchor.x, y: anchor.y }));
          let anchorInsertIndex = 0;
          for (let index = 0; index < orthogonalPathData.points.length - 1; index += 1) {
            const start = orthogonalPathData.points[index];
            const end = orthogonalPathData.points[index + 1];
            const nearestPoint = getNearestPointOnOrthogonalSegment(pointer, { start, end });
            if (!projection || nearestPoint.distance < projection.distance) {
              projection = {
                x: nearestPoint.x,
                y: nearestPoint.y,
                distance: nearestPoint.distance,
                anchorInsertIndex,
              };
            }
            if (anchorPoints.some((anchor) => anchor.x === end.x && anchor.y === end.y)) {
              anchorInsertIndex += 1;
            }
          }
        } else {
          const horizontal = sourceSide === 'left' || sourceSide === 'right';
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

          let bestDistance = Number.POSITIVE_INFINITY;
          let bestPoint = sourceAnchor;
          const steps = 24;
          let previousPoint = sourceAnchor;
          for (let step = 1; step <= steps; step += 1) {
            const t = step / steps;
            const mt = 1 - t;
            const samplePoint = {
              x:
                mt * mt * mt * sourceAnchor.x +
                3 * mt * mt * t * sourceControl.x +
                3 * mt * t * t * targetControl.x +
                t * t * t * targetAnchor.x,
              y:
                mt * mt * mt * sourceAnchor.y +
                3 * mt * mt * t * sourceControl.y +
                3 * mt * t * t * targetControl.y +
                t * t * t * targetAnchor.y,
            };
            const segmentDx = samplePoint.x - previousPoint.x;
            const segmentDy = samplePoint.y - previousPoint.y;
            const segmentLengthSquared = segmentDx * segmentDx + segmentDy * segmentDy;
            if (segmentLengthSquared > 0) {
              const rawT =
                ((pointer.x - previousPoint.x) * segmentDx + (pointer.y - previousPoint.y) * segmentDy)
                / segmentLengthSquared;
              const clampedT = Math.max(0, Math.min(1, rawT));
              const projectedPoint = {
                x: previousPoint.x + segmentDx * clampedT,
                y: previousPoint.y + segmentDy * clampedT,
              };
              const distance = Math.hypot(pointer.x - projectedPoint.x, pointer.y - projectedPoint.y);
              if (distance < bestDistance) {
                bestDistance = distance;
                bestPoint = projectedPoint;
              }
            }
            previousPoint = samplePoint;
          }

          projection = {
            x: bestPoint.x,
            y: bestPoint.y,
            distance: bestDistance,
            anchorInsertIndex: null,
          };
        }

        if (!projection) {
          return null;
        }

        const position = {
          x: Math.max(16, Math.round(projection.x - nodeSizeConfig.width / 2)),
          y: Math.max(16, Math.round(projection.y - nodeSizeConfig.height / 2)),
        };
        const previewPosition = {
          x: position.x,
          y: position.y,
          orientation: defaultOrientation,
        };
        const orderedPreviewInputs = getOrderedModulePorts(moduleDef, previewPosition, 'input');
        const orderedPreviewOutputs = getOrderedModulePorts(moduleDef, previewPosition, 'output');
        const { side: previewInputSide, sideIndex: previewInputIndex } = getPortPlacementForModulePort(
          orderedPreviewInputs,
          [],
          previewPosition,
          defaultOrientation,
          'in',
          splicePorts.inputPortName,
        );
        const { side: previewOutputSide, sideIndex: previewOutputIndex } = getPortPlacementForModulePort(
          [],
          orderedPreviewOutputs,
          previewPosition,
          defaultOrientation,
          'out',
          splicePorts.outputPortName,
        );

        return {
          connectionIndex,
          connection,
          distance: projection.distance,
          anchorInsertIndex: projection.anchorInsertIndex,
          sourceAnchor,
          sourceSide,
          targetAnchor,
          targetSide,
          previewInputAnchor: getAnchorPosition(
            position.x,
            position.y,
            previewInputSide,
            previewInputIndex,
            nodeSizeConfig.width,
            nodeSizeConfig.height,
            nodeSizeConfig.portStartY,
            nodeSizeConfig.portGap,
          ),
          previewInputSide,
          previewOutputAnchor: getAnchorPosition(
            position.x,
            position.y,
            previewOutputSide,
            previewOutputIndex,
            nodeSizeConfig.width,
            nodeSizeConfig.height,
            nodeSizeConfig.portStartY,
            nodeSizeConfig.portGap,
          ),
          previewOutputSide,
          inputPortName: splicePorts.inputPortName,
          outputPortName: splicePorts.outputPortName,
          position,
        };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .filter((candidate) => candidate.distance <= 12)
      .sort((left, right) => left.distance - right.distance);

    const splicePreview = spliceCandidates.length === 1 ? spliceCandidates[0] : null;
    if (splicePreview) {
      return {
        nodeSizeClass,
        nodeSizeConfig,
        position: splicePreview.position,
        splicePreview,
      };
    }

    const rawPosition = {
      x: Math.max(16, pointer.x),
      y: Math.max(16, pointer.y),
    };
    const snappedPosition = snapToGuides
      ? snapModulePositionToGuideRails(
          snapToGrid ? snapPointToGrid(rawPosition) : rawPosition,
          guideRails,
          stageLabels,
          groupBoxes,
          nodeSizeConfig.width,
          nodeSizeConfig.height,
        )
      : snapToGrid
        ? snapPointToGrid(rawPosition)
        : rawPosition;

    return {
      nodeSizeClass,
      nodeSizeConfig,
      position: snappedPosition,
      splicePreview: null,
    };
  }

  function getCurrentViewportView(): WorkspaceViewState {
    return {
      scrollLeft: viewportMetrics.scrollLeft,
      scrollTop: viewportMetrics.scrollTop,
      zoom: workspaceZoom,
    };
  }

  function applyViewportView(
    view: WorkspaceViewState,
    options?: { behavior?: ScrollBehavior; rememberPrevious?: boolean },
  ) {
    const canvasSurface = canvasSurfaceRef.current;
    if (!canvasSurface) {
      return;
    }

    if (options?.rememberPrevious) {
      setPreviousView(getCurrentViewportView());
    }

    if (Math.abs(workspaceZoom - view.zoom) > 0.001) {
      pendingViewportRef.current = {
        view,
        behavior: options?.behavior ?? 'smooth',
      };
      setWorkspaceZoom(view.zoom);
      return;
    }

    canvasSurface.scrollTo({
      left: view.scrollLeft,
      top: view.scrollTop,
      behavior: options?.behavior ?? 'smooth',
    });
    syncViewportMetrics();
  }

  function fitWorkspaceView() {
    const canvasSurface = canvasSurfaceRef.current;
    if (!canvasSurface) {
      return;
    }

    const targetView = computeViewportForRect({
      rect: {
        left: 0,
        top: 0,
        right: authoredCanvasWidth,
        bottom: authoredCanvasHeight,
      },
      viewportWidth: canvasSurface.clientWidth,
      viewportHeight: canvasSurface.clientHeight,
      maxZoom: DEFAULT_WORKSPACE_ZOOM,
    });

    applyViewportView(targetView, { behavior: 'smooth', rememberPrevious: true });
  }

  function frameSelectionView() {
    const canvasSurface = canvasSurfaceRef.current;
    if (!canvasSurface || selectedModuleIds.length === 0) {
      return;
    }

    const rect = selectedModuleIds.reduce<WorkspaceFrameRect | null>((currentRect, moduleId) => {
      const position = effectiveLayout[moduleId];
      const size = nodeSizeByModuleId[moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
      if (!position) {
        return currentRect;
      }

      const nextRect: WorkspaceFrameRect = {
        left: position.x,
        top: position.y,
        right: position.x + size.width,
        bottom: position.y + size.height,
      };

      if (!currentRect) {
        return nextRect;
      }

      return {
        left: Math.min(currentRect.left, nextRect.left),
        top: Math.min(currentRect.top, nextRect.top),
        right: Math.max(currentRect.right, nextRect.right),
        bottom: Math.max(currentRect.bottom, nextRect.bottom),
      };
    }, null);

    if (!rect) {
      return;
    }

    const targetView = computeViewportForRect({
      rect,
      viewportWidth: canvasSurface.clientWidth,
      viewportHeight: canvasSurface.clientHeight,
      maxZoom: MAX_WORKSPACE_ZOOM,
    });

    applyViewportView(targetView, { behavior: 'smooth', rememberPrevious: true });
  }

  function returnToPreviousView() {
    if (!previousView) {
      return;
    }

    const target = previousView;
    setPreviousView(null);
    applyViewportView(target, { behavior: 'smooth' });
  }

  function syncViewportMetrics() {
    const canvasSurface = canvasSurfaceRef.current;
    if (!canvasSurface) {
      return;
    }

    setViewportMetrics({
      scrollLeft: canvasSurface.scrollLeft,
      scrollTop: canvasSurface.scrollTop,
      clientWidth: canvasSurface.clientWidth,
      clientHeight: canvasSurface.clientHeight,
    });
  }

  function panToMinimapPoint(clientX: number, clientY: number, smooth = false) {
    const canvasSurface = canvasSurfaceRef.current;
    const minimapElement = document.getElementById(`workbench-minimap-${activeProject.id}`);
    if (!canvasSurface || !minimapElement) {
      return;
    }

    const rect = minimapElement.getBoundingClientRect();
    const relativeX = Math.max(
      0,
      Math.min(minimapMetrics.contentWidth, clientX - rect.left - minimapMetrics.offsetX),
    );
    const relativeY = Math.max(
      0,
      Math.min(minimapMetrics.contentHeight, clientY - rect.top - minimapMetrics.offsetY),
    );
    const worldX = relativeX / minimapMetrics.scale;
    const worldY = relativeY / minimapMetrics.scale;

    canvasSurface.scrollTo({
      left: Math.max(0, worldX * workspaceZoom - canvasSurface.clientWidth / 2),
      top: Math.max(0, worldY * workspaceZoom - canvasSurface.clientHeight / 2),
      behavior: smooth ? 'smooth' : 'auto',
    });
    syncViewportMetrics();
  }

  useEffect(() => {
    const canvasSurface = canvasSurfaceRef.current;
    if (!canvasSurface) {
      return;
    }

    const update = () => {
      setViewportMetrics({
        scrollLeft: canvasSurface.scrollLeft,
        scrollTop: canvasSurface.scrollTop,
        clientWidth: canvasSurface.clientWidth,
        clientHeight: canvasSurface.clientHeight,
      });
    };

    update();
    canvasSurface.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      canvasSurface.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [canvasHeight, canvasViewportHeight, canvasWidth, workspaceZoom]);

  useEffect(() => {
    const pending = pendingViewportRef.current;
    const canvasSurface = canvasSurfaceRef.current;
    if (!pending || !canvasSurface) {
      return;
    }

    pendingViewportRef.current = null;
    canvasSurface.scrollTo({
      left: pending.view.scrollLeft,
      top: pending.view.scrollTop,
      behavior: pending.behavior,
    });
    syncViewportMetrics();
  }, [workspaceZoom]);

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
    if (
      !dragState &&
      !annotationDragState &&
      !stageLabelDragState &&
      !guideRailDragState &&
      !groupBoxDragState &&
      !groupBoxResizeState &&
      !bendDragState &&
      !anchorDragState &&
      !selectionBox
    ) {
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
          const snappedPosition = snapToGuides
            ? snapModulePositionToGuideRails(
              snapToGrid ? snapPointToGrid({ x: nextX, y: nextY }) : { x: nextX, y: nextY },
              guideRails,
              stageLabels,
              groupBoxes,
              NODE_WIDTH,
              NODE_HEIGHT,
            )
            : snapToGrid
              ? snapPointToGrid({ x: nextX, y: nextY })
              : { x: nextX, y: nextY };
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  currentPositions: {
                    [prev.moduleId]: snappedPosition,
                  },
                }
              : null,
          );
        } else {
          const anchorPosition = snapToGuides
            ? snapModulePositionToGuideRails(
              snapToGrid ? snapPointToGrid({ x: nextX, y: nextY }) : { x: nextX, y: nextY },
              guideRails,
              stageLabels,
              groupBoxes,
              NODE_WIDTH,
              NODE_HEIGHT,
            )
            : snapToGrid
              ? snapPointToGrid({ x: nextX, y: nextY })
              : { x: nextX, y: nextY };
          const deltaX = anchorPosition.x - dragState.anchorStartX;
          const deltaY = anchorPosition.y - dragState.anchorStartY;
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

      if (stageLabelDragState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        const nextX = Math.max(16, pointer.x - stageLabelDragState.pointerOffsetX);
        const nextY = Math.max(16, pointer.y - stageLabelDragState.pointerOffsetY);
        setStageLabelDragState((prev) =>
          prev
            ? {
                ...prev,
                currentX: nextX,
                currentY: nextY,
              }
            : null,
        );
      }

      if (groupBoxDragState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        const nextX = Math.max(16, pointer.x - groupBoxDragState.pointerOffsetX);
        const nextY = Math.max(16, pointer.y - groupBoxDragState.pointerOffsetY);
        setGroupBoxDragState((prev) =>
          prev
            ? {
                ...prev,
                currentX: nextX,
                currentY: nextY,
              }
            : null,
        );
      }

      if (guideRailDragState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        const nextPosition = Math.max(
          16,
          (guideRailDragState.axis === 'vertical' ? pointer.x : pointer.y) -
            guideRailDragState.pointerOffset,
        );
        setGuideRailDragState((prev) =>
          prev
            ? {
                ...prev,
                currentPosition: nextPosition,
              }
            : null,
        );
      }

      if (groupBoxResizeState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        setGroupBoxResizeState((prev) =>
          prev
            ? {
                ...prev,
                currentWidth: Math.max(MIN_GROUP_BOX_WIDTH, pointer.x - prev.originX),
                currentHeight: Math.max(MIN_GROUP_BOX_HEIGHT, pointer.y - prev.originY),
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

      if (anchorDragState) {
        const pointer = getCanvasViewportPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasLeft: canvasRect.left,
          canvasTop: canvasRect.top,
          scrollLeft: canvasSurface.scrollLeft,
          scrollTop: canvasSurface.scrollTop,
          zoom: workspaceZoom,
        });
        setAnchorDragState((prev) =>
          prev
            ? {
                ...prev,
                currentX: snapCoordinateToGrid(pointer.x),
                currentY: snapCoordinateToGrid(pointer.y),
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

      if (stageLabelDragState) {
        if (
          stageLabelDragState.currentX !== stageLabelDragState.initialX ||
          stageLabelDragState.currentY !== stageLabelDragState.initialY
        ) {
          onMoveStageLabel(
            stageLabelDragState.stageLabelId,
            stageLabelDragState.currentX,
            stageLabelDragState.currentY,
          );
        }
      }

      if (groupBoxDragState) {
        if (
          groupBoxDragState.currentX !== groupBoxDragState.initialX ||
          groupBoxDragState.currentY !== groupBoxDragState.initialY
        ) {
          onMoveGroupBox(
            groupBoxDragState.groupBoxId,
            groupBoxDragState.currentX,
            groupBoxDragState.currentY,
          );
        }
      }

      if (guideRailDragState) {
        if (guideRailDragState.currentPosition !== guideRailDragState.initialPosition) {
          onMoveGuideRail(guideRailDragState.guideRailId, guideRailDragState.currentPosition);
        }
      }

      if (groupBoxResizeState) {
        if (
          groupBoxResizeState.currentWidth !== groupBoxResizeState.initialWidth ||
          groupBoxResizeState.currentHeight !== groupBoxResizeState.initialHeight
        ) {
          onResizeGroupBox(
            groupBoxResizeState.groupBoxId,
            groupBoxResizeState.currentWidth,
            groupBoxResizeState.currentHeight,
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
      if (anchorDragState) {
        const currentAnchors = connectionLayout[anchorDragState.connectionKey]?.orthogonalAnchors ?? [];
        const nextAnchors = currentAnchors.map((anchor, index) =>
          index === anchorDragState.anchorIndex
            ? { x: anchorDragState.currentX, y: anchorDragState.currentY }
            : anchor,
        );
        onSetConnectionOrthogonalAnchors(anchorDragState.connectionKey, nextAnchors);
      }
      setDragState(null);
      setAnnotationDragState(null);
      setStageLabelDragState(null);
      setGuideRailDragState(null);
      setGroupBoxDragState(null);
      setGroupBoxResizeState(null);
      setBendDragState(null);
      setAnchorDragState(null);
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
    anchorDragState,
    bendDragState,
    connectionLayout,
    dragState,
    effectiveLayout,
    guideRailDragState,
    groupBoxes,
    groupBoxDragState,
    groupBoxResizeState,
    layout,
    onClearConnectionOrthogonalBend,
    onMoveAnnotation,
    onMoveStageLabel,
    onMoveGuideRail,
    onMoveGroupBox,
    onMoveModule,
    onMoveModules,
    onResizeGroupBox,
    onSetConnectionOrthogonalAnchors,
    onSetConnectionOrthogonalBend,
    onSelectModules,
    selectionBox,
    stageLabels,
    stageLabelDragState,
    guideRails,
    snapToGrid,
    snapToGuides,
    workspaceZoom,
  ]);

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
  const pendingTargetAnchors = useMemo(() => {
    if (!pendingConnection) {
      return [];
    }

    const anchors: Array<{
      key: string;
      anchor: { x: number; y: number };
      side: PortSide;
    }> = [];

    for (const moduleInstance of activeProjectState.modules) {
      const targetDef = registry[moduleInstance.defId];
      const position = effectiveLayout[moduleInstance.id];
      if (!targetDef || !position) {
        continue;
      }

      const orderedInputPorts = getOrderedModulePorts(targetDef, position, 'input');
      const orientation = getNodeOrientation(position.orientation, layoutDirection);
      orderedInputPorts.forEach((port) => {
        const { side: inputSide, sideIndex } = getPortPlacementForModulePort(
          orderedInputPorts,
          [],
          position,
          orientation,
          'in',
          port.name,
        );
        const targetSizeConfig = nodeSizeByModuleId[moduleInstance.id]?.config ?? NODE_SIZE_CONFIGS.standard;
        anchors.push({
          key: `${moduleInstance.id}:${port.name}`,
          anchor: getAnchorPosition(
            position.x,
            position.y,
            inputSide,
            sideIndex,
            targetSizeConfig.width,
            targetSizeConfig.height,
            targetSizeConfig.portStartY,
            targetSizeConfig.portGap,
          ),
          side: inputSide,
        });
      });
    }

    return anchors;
  }, [activeProjectState.modules, effectiveLayout, layoutDirection, nodeSizeByModuleId, pendingConnection, registry]);
  useEffect(() => {
    if (!pendingConnection || !pendingConnection.isDragging) {
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

      const snapResolution = resolvePendingSnapTarget({
        pointer,
        currentSnapTargetKey: snapPendingTargetKey,
        candidateAnchors: pendingTargetAnchors.map((candidate) => ({
          key: candidate.key,
          x: candidate.anchor.x,
          y: candidate.anchor.y,
        })),
        targetValidityByKey: Object.fromEntries(
          Object.entries(targetPortStates).map(([key, state]) => [key, Boolean(state?.valid)]),
        ),
      });

      setHoveredPendingTargetKey(snapResolution.hoveredTargetKey);
      setSnapPendingTargetKey(snapResolution.snapTargetKey);
      setRejectedPendingTargetKey(snapResolution.rejectedTargetKey);

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
      if (snapPendingTargetKey) {
        const [moduleId, portName] = snapPendingTargetKey.split(':');
        if (moduleId && portName) {
          completeConnectionOnInput(moduleId, portName);
          return;
        }
      }

      clearPendingConnectionUi();
    }

    window.addEventListener('mousemove', handleConnectionMove);
    window.addEventListener('mouseup', handleConnectionUp);

    return () => {
      window.removeEventListener('mousemove', handleConnectionMove);
      window.removeEventListener('mouseup', handleConnectionUp);
    };
  }, [
    pendingConnection,
    pendingTargetAnchors,
    snapPendingTargetKey,
    targetPortStates,
    workspaceZoom,
  ]);

  const pendingFromModuleId = pendingConnection?.fromModuleId ?? null;
  const pendingFromPort = pendingConnection?.fromPort ?? null;
  useEffect(() => {
    if (!onPendingConnectionChange) return;
    if (!pendingFromModuleId || !pendingFromPort) {
      onPendingConnectionChange(null);
      return;
    }
    const sourceInstance = activeProjectState.modules.find((m) => m.id === pendingFromModuleId);
    const sourceDef = sourceInstance ? registry[sourceInstance.defId] : null;
    const sourcePort = sourceDef?.outputs.find((p) => p.name === pendingFromPort);
    onPendingConnectionChange(
      sourcePort
        ? {
            fromModuleId: pendingFromModuleId,
            fromPort: pendingFromPort,
            sourceType: sourcePort.type,
            sourceKind: getPortKindSignature(sourcePort.kind),
          }
        : null,
    );
  }, [onPendingConnectionChange, pendingFromModuleId, pendingFromPort, activeProjectState, registry]);

  function clearPendingConnectionUi(clearConnection = true) {
    if (clearConnection) {
      setPendingConnection(null);
    }
    setConnectionFeedback(null);
    setHoveredPendingTargetKey(null);
    setSnapPendingTargetKey(null);
    setRejectedPendingTargetKey(null);
  }

  function commitGroupBoxTitleEdit(nextValue?: string) {
    if (!groupBoxTitleEdit) {
      return;
    }

    const groupBox = groupBoxes.find((entry) => entry.id === groupBoxTitleEdit.groupBoxId);
    if (!groupBox) {
      setGroupBoxTitleEdit(null);
      return;
    }

    const valueToCommit = nextValue ?? groupBoxTitleEdit.value;
    if (groupBox.title !== valueToCommit) {
      onUpdateGroupBoxTitle(groupBox.id, valueToCommit);
    }
    setGroupBoxTitleEdit(null);
  }

  function cancelGroupBoxTitleEdit() {
    if (!groupBoxTitleEdit) {
      return;
    }

    const nextValue =
      groupBoxTitleEdit.createdFromSelection && groupBoxTitleEdit.untouchedHint
        ? ''
        : groupBoxTitleEdit.originalTitle;
    const groupBox = groupBoxes.find((entry) => entry.id === groupBoxTitleEdit.groupBoxId);
    if (groupBox && groupBox.title !== nextValue) {
      onUpdateGroupBoxTitle(groupBox.id, nextValue);
    }
    setGroupBoxTitleEdit(null);
  }

  function clearReferenceChainSelection() {
    setPendingReferenceChainSelection(null);
  }

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.key !== 'Escape' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableShortcutTarget(event.target)
      ) {
        return;
      }

      if (quickAdd) {
        event.preventDefault();
        setQuickAdd(null);
        return;
      }

      if (pendingReferenceChainSelection) {
        event.preventDefault();
        clearReferenceChainSelection();
        return;
      }

      if (pendingRepairInsertion) {
        event.preventDefault();
        setPendingRepairInsertion(null);
        return;
      }

      if (groupBoxTitleEdit) {
        event.preventDefault();
        cancelGroupBoxTitleEdit();
        return;
      }

      if (pendingConnection) {
        event.preventDefault();
        clearPendingConnectionUi();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [groupBoxTitleEdit, pendingConnection, pendingReferenceChainSelection, pendingRepairInsertion, quickAdd]);

  // F key: frame selection (when modules selected) or fit whole workspace.
  // Uses a ref so the handler stays fresh without re-registering on every render.
  function handleFrameSelectionIntent() {
    if (selectionAlreadyHasTightGroupBox) {
      frameSelectionView();
      return;
    }

    setPendingGroupBoxCreation({
      mode: 'selection',
      previousIds: groupBoxes.map((groupBox) => groupBox.id),
      hint: selectionCategoryHint,
    });
    onAddGroupBoxFromSelection();
  }

  const frameKeyActionRef = useRef<() => void>(() => {});
  frameKeyActionRef.current = () => {
    if (selectedModuleIds.length > 0) {
      handleFrameSelectionIntent();
    } else {
      fitWorkspaceView();
    }
  };
  useEffect(() => {
    function handleFrameKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.key.toLowerCase() !== 'f' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableShortcutTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      frameKeyActionRef.current();
    }
    window.addEventListener('keydown', handleFrameKey);
    return () => window.removeEventListener('keydown', handleFrameKey);
  }, []);

  function isCompatibleReferenceOutput(port: {
    type: SignalType;
    kind?: PortKind;
  }) {
    if (!pendingReferenceChainSelection) {
      return false;
    }

    return (
      port.type === pendingReferenceChainSelection.chain.startPortShape.type &&
      getPortKindSignature(port.kind) === pendingReferenceChainSelection.chain.startPortShape.kind
    );
  }

  function commitReferenceAwareChainSelection(referenceModuleId: string, referencePort: string) {
    if (!pendingReferenceChainSelection) {
      return;
    }

    const { chain, canvasX, canvasY, sourceAttachment, targetAttachment } =
      pendingReferenceChainSelection;
    const templates = buildInsertChainTemplates({
      chain,
      canvasPosition: { x: canvasX, y: canvasY },
      layoutDirection,
    });
    onInsertChain(
      templates.modules,
      templates.connections,
      {
        fromModuleId: sourceAttachment.fromModuleId,
        fromPort: sourceAttachment.fromPort,
        toIndex: 0,
        toPort: 'in',
      },
      targetAttachment
        ? {
            fromIndex: templates.modules.length - 1,
            fromPort: 'out',
            toModuleId: targetAttachment.toModuleId,
            toPort: targetAttachment.toPort,
          }
        : undefined,
      [
        {
          fromModuleId: referenceModuleId,
          fromPort: referencePort,
          toIndex: 0,
          toPort: chain.referencePort ?? 'reference',
        },
      ],
    );
    clearReferenceChainSelection();
  }

  const pendingTargetSummary = useMemo(() => {
    if (!pendingConnection) {
      return null;
    }

    let validCount = 0;
    let replaceCount = 0;
    for (const targetState of Object.values(targetPortStates)) {
      if (!targetState.valid) {
        continue;
      }
      if (targetState.mode === 'replace') {
        replaceCount += 1;
      } else {
        validCount += 1;
      }
    }

    const hoveredTargetState = hoveredPendingTargetKey
      ? targetPortStates[hoveredPendingTargetKey] ?? null
      : null;

    return {
      validCount,
      replaceCount,
      hoveredTargetKey: hoveredPendingTargetKey,
      hoveredTargetState,
    };
  }, [hoveredPendingTargetKey, pendingConnection, targetPortStates]);
  const compatibleQuickAddOptions = useMemo(() => {
    if (quickAdd?.mode !== 'connect' || !quickAdd.pendingConnection) {
      return [];
    }

    const sourceType = quickAdd.pendingConnection.sourceType;
    const sourceKind = quickAdd.pendingConnection.sourceKind;
    const chainOptions = getMatchingCanonicalChains({
      sourceType,
      sourceKind,
      registry,
    }).map((chain) => ({
      id: `chain:${chain.id}`,
      label: chain.label,
      subtitle: chain.description,
      badge: 'Chain',
      onSelect: () => {
        if (chain.requiresReferenceChoice) {
          setPendingReferenceChainSelection({
            chain,
            canvasX: quickAdd.canvasX,
            canvasY: quickAdd.canvasY,
            sourceAttachment: {
              fromModuleId: quickAdd.pendingConnection!.fromModuleId,
              fromPort: quickAdd.pendingConnection!.fromPort,
            },
          });
          return;
        }

        const templates = buildInsertChainTemplates({
          chain,
          canvasPosition: { x: quickAdd.canvasX, y: quickAdd.canvasY },
          layoutDirection,
        });
        onInsertChain(templates.modules, templates.connections, {
          fromModuleId: quickAdd.pendingConnection!.fromModuleId,
          fromPort: quickAdd.pendingConnection!.fromPort,
          toIndex: 0,
          toPort: 'in',
        });
      },
    }));

    const moduleOptions = Object.values(registry)
      .map((definition) => {
        const compatiblePort =
          definition.inputs.find(
            (port) =>
              port.type === sourceType &&
              getPortKindSignature(port.kind) === sourceKind,
          ) ?? null;
        if (!compatiblePort) {
          return null;
        }

        return {
          id: definition.id,
          label: definition.name,
          subtitle: `Connect → ${compatiblePort.name}`,
          detailId: definition.id,
          onSelect: () => {
            onInsertModuleAndConnect(
              definition,
              { x: quickAdd.canvasX, y: quickAdd.canvasY },
              quickAdd.pendingConnection!.fromModuleId,
              quickAdd.pendingConnection!.fromPort,
              compatiblePort.name,
            );
          },
        };
      })
      .filter((option): option is {
        id: string;
        label: string;
        subtitle: string;
        detailId: string;
        onSelect: () => void;
      } => option !== null);

    return [...chainOptions, ...moduleOptions];
  }, [layoutDirection, onInsertChain, onInsertModuleAndConnect, quickAdd, registry]);

  useEffect(() => {
    if (
      !selectedConnectionWaypointMode ||
      !selectedConnectionKey ||
      effectiveSelectedConnectionAnchorIndex === null
    ) {
      return undefined;
    }
    const activeConnectionKey = selectedConnectionKey;
    const activeAnchorIndex = effectiveSelectedConnectionAnchorIndex;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        onRemoveConnectionOrthogonalAnchor(activeConnectionKey, activeAnchorIndex);
        setSelectedConnectionAnchorIndex(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onRemoveConnectionOrthogonalAnchor,
    selectedConnectionKey,
    selectedConnectionWaypointMode,
    effectiveSelectedConnectionAnchorIndex,
  ]);

  const canvasModuleErrorStateById = useMemo(
    () =>
      deriveCanvasModuleErrorStateById(
        activeProjectState,
        registry,
        validationIssues,
        execution,
      ),
    [activeProjectState, execution, registry, validationIssues],
  );
  const firstBrokenModuleId = useMemo(
    () =>
      deriveFirstBrokenModuleId({
        project: activeProjectState,
        executionOrder: execution?.order ?? null,
        canvasModuleErrorStateById,
      }),
    [activeProjectState, canvasModuleErrorStateById, execution],
  );

  const executionSignalByModuleId = useMemo(() => buildExecutionSignalByModuleId(execution), [execution]);

  const activeAnalysisSignalByModuleId = useMemo(
    () => buildActiveAnalysisSignalByModuleId(activeAnalysisTraceEntry, activeAnalysisOwnerModuleId),
    [activeAnalysisOwnerModuleId, activeAnalysisTraceEntry],
  );
  const traceFocusedModuleId = activeAnalysisOwnerModuleId ?? steppedModuleId ?? null;
  const traceNeighborModuleIds = useMemo(() => {
    if (!traceFocusedModuleId) return new Set<string>();
    const neighbors = new Set<string>();
    for (const connection of activeProjectState.connections) {
      if (connection.from.moduleId === traceFocusedModuleId) neighbors.add(connection.to.moduleId);
      if (connection.to.moduleId === traceFocusedModuleId) neighbors.add(connection.from.moduleId);
    }
    return neighbors;
  }, [traceFocusedModuleId, activeProjectState.connections]);
  const emphasizedConnectionPortKeys = useMemo(() => {
    const keys = new Set<string>();
    const candidateIndices = [
      hoveredConnectionIndex,
      effectiveSelectedConnectionIndex,
      ...activeProjectState.connections
        .map((connection, index) =>
          deriveConnectionLegibilityState({
            connection,
            connectionIndex: index,
            selectedConnectionIndex: effectiveSelectedConnectionIndex,
            focusedModuleId: selectedModuleId,
            traceFocusedModuleId,
          }).traceEmphasized
            ? index
            : null,
        )
        .filter((value): value is number => value !== null),
    ];

    candidateIndices.forEach((connectionIndex) => {
      if (connectionIndex === null || connectionIndex < 0) {
        return;
      }
      const connection = activeProjectState.connections[connectionIndex];
      if (!connection) {
        return;
      }
      keys.add(`out:${connection.from.moduleId}:${connection.from.port}`);
      keys.add(`in:${connection.to.moduleId}:${connection.to.port}`);
    });

    return keys;
  }, [
    activeProjectState.connections,
    effectiveSelectedConnectionIndex,
    hoveredConnectionIndex,
    selectedModuleId,
    traceFocusedModuleId,
  ]);

  function startConnectionFromOutput(
    moduleId: string,
    portName: string,
    clientX: number,
    clientY: number,
  ) {
    setSelectedConnectionIndex(null);
    const pos = layout[moduleId];
    if (!pos) return;
    const orientation = getNodeOrientation(pos.orientation, layoutDirection);
    const sourceDef = registry[
      activeProjectState.modules.find((moduleInstance) => moduleInstance.id === moduleId)?.defId ?? ''
    ];
    const orderedOutputPorts = sourceDef ? getOrderedModulePorts(sourceDef, pos, 'output') : [];
    const { side: sourceSide, sideIndex } = getPortPlacementForModulePort(
      [],
      orderedOutputPorts,
      pos,
      orientation,
      'out',
      portName,
    );
    const sourceSizeConfig = nodeSizeByModuleId[moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
    const anchor = getAnchorPosition(
      pos.x,
      pos.y,
      sourceSide,
      sideIndex,
      sourceSizeConfig.width,
      sourceSizeConfig.height,
      sourceSizeConfig.portStartY,
      sourceSizeConfig.portGap,
    );
    setConnectionFeedback(null);
    setHoveredPendingTargetKey(null);
    setSnapPendingTargetKey(null);
    setRejectedPendingTargetKey(null);
    setPendingConnection(null);

    const handleInitialPointerMove = (event: MouseEvent) => {
      const deltaX = event.clientX - clientX;
      const deltaY = event.clientY - clientY;
      if (deltaX * deltaX + deltaY * deltaY < 36) {
        return;
      }

      const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
      const targetPoint = pointer ?? anchor;
      setPendingConnection({
        fromModuleId: moduleId,
        fromPort: portName,
        fromAnchor: anchor,
        fromSide: sourceSide,
        mouseX: targetPoint.x,
        mouseY: targetPoint.y,
        excludedConnectionIndex: null,
        isDragging: true,
      });
      window.removeEventListener('mousemove', handleInitialPointerMove);
      window.removeEventListener('mouseup', handleInitialPointerUp);
    };

    const handleInitialPointerUp = () => {
      setPendingConnection({
        fromModuleId: moduleId,
        fromPort: portName,
        fromAnchor: anchor,
        fromSide: sourceSide,
        mouseX: anchor.x,
        mouseY: anchor.y,
        excludedConnectionIndex: null,
        isDragging: false,
      });
      window.removeEventListener('mousemove', handleInitialPointerMove);
      window.removeEventListener('mouseup', handleInitialPointerUp);
    };

    window.addEventListener('mousemove', handleInitialPointerMove);
    window.addEventListener('mouseup', handleInitialPointerUp);
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
    const orderedSourcePorts =
      sourceDef ? getOrderedModulePorts(sourceDef, sourcePosition, 'output') : [];
    const sourcePortIndex = sourceDef
      ? orderedSourcePorts.findIndex((port) => port.name === connection.from.port)
      : -1;

    if (!sourcePosition || !sourceDef || sourcePortIndex < 0) {
      return;
    }

    const sourceOrientation = getNodeOrientation(sourcePosition.orientation, layoutDirection);
    const { side: sourceSide, sideIndex: sourceAnchorIndex } = getPortPlacementForModulePort(
      [],
      orderedSourcePorts,
      sourcePosition,
      sourceOrientation,
      'out',
      connection.from.port,
    );
    const rewireSizeConfig = nodeSizeByModuleId[connection.from.moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
    const sourceAnchor = getAnchorPosition(
      sourcePosition.x,
      sourcePosition.y,
      sourceSide,
      sourceAnchorIndex,
      rewireSizeConfig.width,
      rewireSizeConfig.height,
      rewireSizeConfig.portStartY,
      rewireSizeConfig.portGap,
    );

    setConnectionFeedback(null);
    setHoveredPortHintKey(null);
    setHoveredPendingTargetKey(null);
    setSnapPendingTargetKey(null);
    setRejectedPendingTargetKey(null);
    setPendingConnection({
      fromModuleId: connection.from.moduleId,
      fromPort: connection.from.port,
      fromAnchor: sourceAnchor,
      fromSide: sourceSide,
      mouseX: sourceAnchor.x,
      mouseY: sourceAnchor.y,
      excludedConnectionIndex: connectionIndex,
      isDragging: true,
    });
  }

  function completeConnectionOnInput(moduleId: string, portName: string) {
    if (!pendingConnection) return;
    const targetState = targetPortStates[`${moduleId}:${portName}`];
    if (!targetState?.valid) {
      const sourceInstance = activeProjectState.modules.find((m) => m.id === pendingConnection.fromModuleId);
      const targetInstance = activeProjectState.modules.find((m) => m.id === moduleId);
      const sourceDef = sourceInstance ? registry[sourceInstance.defId] : null;
      const targetDef = targetInstance ? registry[targetInstance.defId] : null;
      const sourcePort = sourceDef?.outputs.find((p) => p.name === pendingConnection.fromPort);
      const targetPort = targetDef?.inputs.find((p) => p.name === portName);
      if (sourcePort && targetPort) {
        const sourcePos = effectiveLayout[pendingConnection.fromModuleId] ?? { x: 0, y: 0 };
        const targetPos = effectiveLayout[moduleId] ?? { x: 0, y: 0 };
        const sourceKind = getPortKindSignature(sourcePort.kind);
        const targetKind = getPortKindSignature(targetPort.kind);
        const bridgeKey = `${sourcePort.type}→${targetPort.type}`;
        const bridgeOptions = (BRIDGE_OPTIONS[bridgeKey] ?? []).filter(({ defId }) => {
          const optionDef = registry[defId];
          const optionInput = optionDef?.inputs[0];
          const optionOutput = optionDef?.outputs[0];
          return (
            optionInput &&
            optionOutput &&
            optionInput.type === sourcePort.type &&
            getPortKindSignature(optionInput.kind) === sourceKind &&
            optionOutput.type === targetPort.type &&
            getPortKindSignature(optionOutput.kind) === targetKind
          );
        });
        const chainOptions = getMatchingCanonicalRepairChains({
          sourceType: sourcePort.type,
          sourceKind,
          targetType: targetPort.type,
          targetKind,
          registry,
        });

        if (bridgeOptions.length > 0 || chainOptions.length > 0) {
          setPendingRepairInsertion({
            fromModuleId: pendingConnection.fromModuleId,
            fromPort: pendingConnection.fromPort,
            toModuleId: moduleId,
            toPort: portName,
            sourceType: sourcePort.type,
            sourceKind,
            targetType: targetPort.type,
            targetKind,
            x: Math.round((sourcePos.x + targetPos.x) / 2),
            y: Math.round((sourcePos.y + targetPos.y) / 2),
          });
          clearPendingConnectionUi();
          return;
        }
      }
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
    clearPendingConnectionUi();
    setSelectedConnectionIndex(null);
  }

  function commitInlineParamEdit(
    moduleId: string,
    definition: ModuleDefinition | null,
    currentParams: Record<string, unknown>,
  ) {
    if (!inlineParamEdit || inlineParamEdit.moduleId !== moduleId || !definition) {
      return;
    }

    const field = definition.paramSchema[inlineParamEdit.paramKey];
    if (!field) {
      setInlineParamEdit(null);
      return;
    }

    const parsed = parseParamValue(inlineParamEdit.value, field);
    if (!parsed.ok) {
      setInlineParamEdit((current) =>
        current && current.moduleId === moduleId
          ? { ...current, error: parsed.error ?? 'Invalid value.' }
          : current,
      );
      return;
    }

    const currentValue = currentParams[inlineParamEdit.paramKey] ?? field.defaultValue;
    if (parsed.value !== currentValue) {
      onUpdateModuleParam(moduleId, inlineParamEdit.paramKey, parsed.value);
    }
    setInlineParamEdit(null);
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

    applyViewportView(
      {
        scrollLeft: target.left,
        scrollTop: target.top,
        zoom: workspaceZoom,
      },
      { behavior: 'smooth', rememberPrevious: true },
    );
    setSelectedGuideRailId(null);
    setSelectedStageLabelId(null);
    setSelectedConnectionIndex(null);
    onSelectModule(moduleId, false);
  }

  function saveCurrentView(name: string) {
    onSaveWorkspaceViewRegion(createWorkspaceSavedViewRegion(name, getCurrentViewportView()));
  }

  function requestSaveCurrentView() {
    if (savedViewRegions.length >= MAX_WORKSPACE_SAVED_VIEW_REGIONS) {
      return;
    }

    const proposedName = window.prompt('Save current view as:', 'Round output');
    const normalized = proposedName?.trim();
    if (!normalized) {
      return;
    }
    saveCurrentView(normalized);
  }

  function recallSavedView(regionId: string) {
    const region = savedViewRegions.find((candidate) => candidate.id === regionId);
    if (!region) {
      return;
    }

    applyViewportView(
      {
        scrollLeft: region.scrollLeft,
        scrollTop: region.scrollTop,
        zoom: region.zoom,
      },
      { behavior: 'smooth', rememberPrevious: true },
    );
  }

  const canFrameSelection = selectedModuleIds.length > 0;

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

    applyViewportView(
      {
        scrollLeft: target.left,
        scrollTop: target.top,
        zoom: workspaceZoom,
      },
      { behavior: 'smooth', rememberPrevious: true },
    );
    onSelectModule(requestedFocusModuleId, false);
    onWorkspaceFocusHandled?.();
  }, [effectiveLayout, onSelectModule, onWorkspaceFocusHandled, requestedFocusModuleId, workspaceZoom]);

  const paletteModuleGhost = useMemo(() => {
    if (!activePaletteModuleDrag?.isActive || !activePaletteModuleDrag.moduleDef) {
      return null;
    }

    return getPaletteModulePlacement(
      activePaletteModuleDrag.moduleDef,
      activePaletteModuleDrag.clientX,
      activePaletteModuleDrag.clientY,
    );
  }, [activePaletteModuleDrag, getPaletteModulePlacement]);

  useEffect(() => {
    if (!pendingGroupBoxCreation) {
      return;
    }

    const nextGroupBox = groupBoxes.find(
      (groupBox) => !pendingGroupBoxCreation.previousIds.includes(groupBox.id),
    );
    if (!nextGroupBox) {
      return;
    }

    const initialTitle = pendingGroupBoxCreation.mode === 'selection' ? '' : nextGroupBox.title;
    if (nextGroupBox.title !== initialTitle) {
      onUpdateGroupBoxTitle(nextGroupBox.id, initialTitle);
    }
    setSelectedGroupBoxId(nextGroupBox.id);
    setSelectedGuideRailId(null);
    setSelectedStageLabelId(null);
    setGroupBoxTitleEdit({
      groupBoxId: nextGroupBox.id,
      value: pendingGroupBoxCreation.hint || initialTitle,
      originalTitle: initialTitle,
      untouchedHint: Boolean(pendingGroupBoxCreation.hint),
      createdFromSelection: pendingGroupBoxCreation.mode === 'selection',
    });
    setPendingGroupBoxCreation(null);
  }, [groupBoxes, onUpdateGroupBoxTitle, pendingGroupBoxCreation]);

  useEffect(() => {
    if (!activePaletteModuleDrag || !onClearPaletteModuleDrag) {
      return undefined;
    }

    const handlePointerUp = (event: MouseEvent) => {
      if (activePaletteModuleDrag.isActive && activePaletteModuleDrag.moduleDef) {
        const dropTarget = getPaletteModulePlacement(
          activePaletteModuleDrag.moduleDef,
          event.clientX,
          event.clientY,
        );
        if (dropTarget && !isCompositeEditor) {
          if (dropTarget.splicePreview) {
            onSpliceModuleOnConnection(
              dropTarget.splicePreview.connectionIndex,
              activePaletteModuleDrag.moduleDef,
              dropTarget.position,
              dropTarget.splicePreview.inputPortName,
              dropTarget.splicePreview.outputPortName,
              dropTarget.splicePreview.anchorInsertIndex,
            );
          } else {
            onAddModule(activePaletteModuleDrag.moduleDef, dropTarget.position);
          }
        }
      }

      onClearPaletteModuleDrag();
    };

    window.addEventListener('mouseup', handlePointerUp, true);
    return () => window.removeEventListener('mouseup', handlePointerUp, true);
  }, [
    activePaletteModuleDrag,
    getPaletteModulePlacement,
    isCompositeEditor,
    onAddModule,
    onSpliceModuleOnConnection,
    onClearPaletteModuleDrag,
  ]);

  useEffect(() => {
    if (
      !paletteModuleDropRequest ||
      !activePaletteModuleDrag?.moduleDef ||
      !onPaletteModuleDropRequestHandled
    ) {
      return;
    }

    const dropTarget = getPaletteModulePlacement(
      activePaletteModuleDrag.moduleDef,
      paletteModuleDropRequest.clientX,
      paletteModuleDropRequest.clientY,
    );
    if (dropTarget && !isCompositeEditor) {
      if (dropTarget.splicePreview) {
        onSpliceModuleOnConnection(
          dropTarget.splicePreview.connectionIndex,
          activePaletteModuleDrag.moduleDef,
          dropTarget.position,
          dropTarget.splicePreview.inputPortName,
          dropTarget.splicePreview.outputPortName,
          dropTarget.splicePreview.anchorInsertIndex,
        );
      } else {
        onAddModule(activePaletteModuleDrag.moduleDef, dropTarget.position);
      }
    }
    onPaletteModuleDropRequestHandled();
  }, [
    activePaletteModuleDrag,
    getPaletteModulePlacement,
    isCompositeEditor,
    onAddModule,
    onSpliceModuleOnConnection,
    onPaletteModuleDropRequestHandled,
    paletteModuleDropRequest,
  ]);

  function renderConnection(
    connection: Project['connections'][number],
    connectionIndex: number,
    layer: 'base' | 'overlay',
  ) {
    const isSelectedConnection = effectiveSelectedConnectionIndex === connectionIndex;
    if ((layer === 'base' && isSelectedConnection) || (layer === 'overlay' && !isSelectedConnection)) {
      return null;
    }

    const from = effectiveLayout[connection.from.moduleId];
    const to = effectiveLayout[connection.to.moduleId];
    const sourceDef = registry[
      activeProjectState.modules.find((moduleInstance) => moduleInstance.id === connection.from.moduleId)
        ?.defId ?? ''
    ];
    const targetDef = registry[
      activeProjectState.modules.find((moduleInstance) => moduleInstance.id === connection.to.moduleId)?.defId ??
        ''
    ];
    const orderedSourcePorts = sourceDef
      ? getOrderedModulePorts(sourceDef, from, 'output')
      : [];
    const orderedTargetPorts = targetDef
      ? getOrderedModulePorts(targetDef, to, 'input')
      : [];

    if (!from || !to || !sourceDef || !targetDef) {
      return null;
    }

    const sourceIndex = Math.max(
      0,
      orderedSourcePorts.findIndex((port) => port.name === connection.from.port),
    );
    const targetIndex = Math.max(
      0,
      orderedTargetPorts.findIndex((port) => port.name === connection.to.port),
    );
    const sourcePort = orderedSourcePorts[sourceIndex];
    const connectionDomainTone = sourcePort?.type ?? '';

    const sourceOrientation = getNodeOrientation(from.orientation, layoutDirection);
    const targetOrientation = getNodeOrientation(to.orientation, layoutDirection);
    const { side: sourceSide, sideIndex: sourceAnchorIndex } = getPortPlacementForModulePort(
      [],
      orderedSourcePorts,
      from,
      sourceOrientation,
      'out',
      connection.from.port,
    );
    const { side: targetSide, sideIndex: targetAnchorIndex } = getPortPlacementForModulePort(
      orderedTargetPorts,
      [],
      to,
      targetOrientation,
      'in',
      connection.to.port,
    );
    const connectionKey = getConnectionComparisonKey(connection);
    const connSourceConfig = nodeSizeByModuleId[connection.from.moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
    const connTargetConfig = nodeSizeByModuleId[connection.to.moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
    const sourceAnchor = getAnchorPosition(
      from.x,
      from.y,
      sourceSide,
      sourceAnchorIndex,
      connSourceConfig.width,
      connSourceConfig.height,
      connSourceConfig.portStartY,
      connSourceConfig.portGap,
    );
    const targetAnchor = getAnchorPosition(
      to.x,
      to.y,
      targetSide,
      targetAnchorIndex,
      connTargetConfig.width,
      connTargetConfig.height,
      connTargetConfig.portStartY,
      connTargetConfig.portGap,
    );
    const temporaryConnectionLayout =
      bendDragState?.connectionKey === connectionKey
        ? {
            ...(connectionLayout[connectionKey] ?? {}),
            orthogonalBend: {
              axis: bendDragState.axis,
              value: bendDragState.currentValue,
            },
          }
        : anchorDragState?.connectionKey === connectionKey
          ? {
              ...(connectionLayout[connectionKey] ?? {}),
              orthogonalAnchors: (
                connectionLayout[connectionKey]?.orthogonalAnchors ?? []
              ).map((anchor, index) =>
                index === anchorDragState.anchorIndex
                  ? { x: anchorDragState.currentX, y: anchorDragState.currentY }
                  : anchor,
              ),
            }
          : connectionLayout[connectionKey];
    const orthogonalPathData =
      routingMode === 'orthogonal'
        ? getOrthogonalPathData(
            sourceAnchor,
            sourceSide,
            targetAnchor,
            targetSide,
            sourceIndex,
            targetIndex,
            temporaryConnectionLayout,
          )
        : null;
    const pathD =
      orthogonalPathData?.path ?? getConnectionPath(sourceAnchor, sourceSide, targetAnchor, targetSide);
    const bendHandle = orthogonalPathData?.bendHandle ?? null;
    const legibilityState = deriveConnectionLegibilityState({
      connection,
      connectionIndex,
      selectedConnectionIndex: effectiveSelectedConnectionIndex,
      focusedModuleId: selectedModuleId,
      traceFocusedModuleId,
    });
    const isHoveredConnection = hoveredConnectionIndex === connectionIndex;
    const shouldShowDirectionCues =
      layer === 'overlay'
        ? isSelectedConnection
        : !isSelectedConnection && (isHoveredConnection || legibilityState.traceEmphasized);
    const directionCuePathId = `connection-direction-path-${layer}-${connectionIndex}`;
    const visualOffset =
      routingMode === 'orthogonal' && layer === 'base'
        ? getOrthogonalConnectionVisualOffset(sourceSide, sourceIndex, targetIndex)
        : null;

    return (
      <g
        key={`${layer}:${connection.from.moduleId}:${connection.from.port}-${connection.to.moduleId}:${connection.to.port}`}
        className={[
          'connection-group',
          `connection-group-wire-mode-${wireColorMode}`,
          connectionDomainTone ? `connection-group-domain-${connectionDomainTone}` : '',
          connectionLayout[connectionKey]?.colorOverride
            ? `connection-group-color-${connectionLayout[connectionKey]?.colorOverride}`
            : '',
          validationIssues.some(
            (issue) =>
              issue.connection?.from.moduleId === connection.from.moduleId &&
              issue.connection?.from.port === connection.from.port &&
              issue.connection?.to.moduleId === connection.to.moduleId &&
              issue.connection?.to.port === connection.to.port,
          )
            ? 'connection-group-invalid'
            : '',
          layer === 'overlay' ? 'connection-group-selected' : '',
          layer === 'base' && legibilityState.emphasized ? 'connection-group-emphasized' : '',
          layer === 'base' && legibilityState.traceEmphasized ? 'connection-group-trace' : '',
          layer === 'base' && legibilityState.dimmed ? 'connection-group-dimmed' : '',
          layer === 'base' && execution !== null && execution.outputsByModuleId[connection.from.moduleId]?.[connection.from.port] != null ? 'connection-group-live' : '',
          layer === 'base' && execution !== null && execution.outputsByModuleId[connection.from.moduleId]?.[connection.from.port] == null ? 'connection-group-idle' : '',
          layer === 'base' && paletteModuleGhost?.splicePreview?.connectionIndex === connectionIndex
            ? 'connection-group-splice-preview'
            : '',
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
          style={pendingConnection ? ({ pointerEvents: 'none' } as CSSProperties) : undefined}
          onMouseEnter={() => setHoveredConnectionIndex(connectionIndex)}
          onMouseLeave={() => setHoveredConnectionIndex(null)}
          onClick={(event) => {
            event.stopPropagation();
            if (
              routingMode === 'orthogonal' &&
              selectedConnectionWaypointMode &&
              isSelectedConnection &&
              orthogonalPathData &&
              (temporaryConnectionLayout?.orthogonalAnchors?.length ?? 0) < 4
            ) {
              const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
              if (pointer) {
                let bestSegment: (typeof orthogonalPathData.editableSegments)[number] | null = null;
                let bestProjection:
                  | {
                      x: number;
                      y: number;
                      distance: number;
                    }
                  | null = null;

                for (const segment of orthogonalPathData.editableSegments) {
                  const projection = getNearestPointOnOrthogonalSegment(pointer, segment);
                  if (
                    projection.distance <= ANCHOR_INSERTION_HIT_TOLERANCE &&
                    (!bestProjection || projection.distance < bestProjection.distance)
                  ) {
                    bestSegment = segment;
                    bestProjection = projection;
                  }
                }

                if (bestSegment && bestProjection) {
                  const nextAnchor = snapPointToGrid(bestProjection);
                  const currentAnchors = temporaryConnectionLayout?.orthogonalAnchors ?? [];
                  const nextAnchors = [...currentAnchors];
                  nextAnchors.splice(bestSegment.insertIndex, 0, nextAnchor);
                  onSetConnectionOrthogonalAnchors(connectionKey, nextAnchors);
                  setSelectedConnectionAnchorIndex(bestSegment.insertIndex);
                  return;
                }
              }
              return;
            }
            setSelectedGuideRailId(null);
            setSelectedGroupBoxId(null);
            setSelectedConnectionIndex((current) => (current === connectionIndex ? null : connectionIndex));
            setSelectedConnectionAnchorIndex(null);
          }}
        />
        <path
          className="connection-visible-underlay"
          d={pathD}
          style={
            visualOffset
              ? ({ transform: `translate(${visualOffset.x}px, ${visualOffset.y}px)` } as CSSProperties)
              : undefined
          }
        />
        <path
          className="connection-visible-path"
          id={shouldShowDirectionCues ? directionCuePathId : undefined}
          d={pathD}
          style={
            visualOffset
              ? ({ transform: `translate(${visualOffset.x}px, ${visualOffset.y}px)` } as CSSProperties)
              : undefined
          }
        />
        {shouldShowDirectionCues ? (
          (() => {
            const directionCueFill = isSelectedConnection
              ? theme === 'dark'
                ? '#ffd978'
                : '#8a5200'
              : !isSelectedConnection && legibilityState.traceEmphasized
                ? theme === 'dark'
                  ? '#b9ffbf'
                  : '#146c2e'
                : !isSelectedConnection && isHoveredConnection
                  ? theme === 'dark'
                    ? '#a9e7ff'
                    : '#0f5ea8'
                  : theme === 'dark'
                    ? '#f5f7fb'
                    : '#253247';
            const directionCueStroke = theme === 'dark' ? 'rgba(5, 8, 14, 0.96)' : 'rgba(255, 255, 255, 0.98)';

            return (
          <text
            className={[
              'connection-direction-cues',
              isSelectedConnection ? 'connection-direction-cues-selected' : '',
              !isSelectedConnection && isHoveredConnection ? 'connection-direction-cues-hovered' : '',
              !isSelectedConnection && legibilityState.traceEmphasized
                ? 'connection-direction-cues-trace'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            dy="-7"
            fill={directionCueFill}
            stroke={directionCueStroke}
            style={{
              fill: directionCueFill,
              stroke: directionCueStroke,
              strokeWidth: 3,
              paintOrder: 'stroke fill',
            }}
          >
            <textPath
              href={`#${directionCuePathId}`}
              startOffset="50%"
              textAnchor="middle"
              fill={directionCueFill}
              stroke={directionCueStroke}
              style={{
                fill: directionCueFill,
                stroke: directionCueStroke,
                strokeWidth: 3,
                paintOrder: 'stroke fill',
              }}
            >
              {'→   →   →'}
            </textPath>
          </text>
            );
          })()
        ) : null}
        {routingMode === 'orthogonal' &&
        !isObservationMode &&
        !isCompositeEditor &&
        isSelectedConnection &&
        !selectedConnectionWaypointMode &&
        bendHandle &&
        layer === 'overlay' ? (
          <circle
            className={`connection-bend-handle connection-bend-handle-${bendHandle.axis}`}
            cx={bendHandle.x}
            cy={bendHandle.y}
            r={7}
            onMouseDown={(event) => {
              event.stopPropagation();
              setBendDragState({
                connectionKey,
                axis: bendHandle.axis,
                autoValue: bendHandle.autoValue,
                currentValue: bendHandle.value,
              });
            }}
          />
        ) : null}
        {routingMode === 'orthogonal' &&
        !isObservationMode &&
        !isCompositeEditor &&
        isSelectedConnection &&
        selectedConnectionWaypointMode &&
        layer === 'overlay'
          ? orthogonalPathData?.anchorHandles.map((anchorHandle) => (
              <circle
                key={`anchor-${connectionKey}-${anchorHandle.index}`}
                className={`connection-anchor-handle${
                  effectiveSelectedConnectionAnchorIndex === anchorHandle.index
                    ? ' connection-anchor-handle-selected'
                    : ''
                }`}
                cx={anchorHandle.x}
                cy={anchorHandle.y}
                r={8}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  setSelectedConnectionAnchorIndex(anchorHandle.index);
                  setAnchorDragState({
                    connectionKey,
                    anchorIndex: anchorHandle.index,
                    currentX: anchorHandle.x,
                    currentY: anchorHandle.y,
                  });
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedConnectionAnchorIndex(anchorHandle.index);
                }}
              />
            ))
          : null}
      </g>
    );
  }

  const BRIDGE_OPTIONS: Record<string, Array<{ defId: string; label: string }>> = {
    'symbol→bits': [
      { defId: 'AsciiCharToBits', label: 'AsciiCharToBits — char → 8 bits' },
      { defId: 'HexDigitToBits', label: 'HexDigitToBits — hex char → 4 bits' },
    ],
    'bits→symbol': [
      { defId: 'BitsToAsciiChar', label: 'BitsToAsciiChar — 8 bits → char' },
      { defId: 'BitsToHex', label: 'BitsToHex — bits → hex string' },
    ],
  };

  function renderBridgeInsertionPopup() {
    if (!pendingRepairInsertion) return null;
    const {
      fromModuleId,
      fromPort,
      toModuleId,
      toPort,
      sourceType,
      sourceKind,
      targetType,
      targetKind,
      x,
      y,
    } = pendingRepairInsertion;
    const key = `${sourceType}→${targetType}`;
    const bridgeOptions = (BRIDGE_OPTIONS[key] ?? []).filter(({ defId }) => {
      const optionDef = registry[defId];
      const optionInput = optionDef?.inputs[0];
      const optionOutput = optionDef?.outputs[0];
      return (
        optionInput &&
        optionOutput &&
        optionInput.type === sourceType &&
        getPortKindSignature(optionInput.kind) === sourceKind &&
        optionOutput.type === targetType &&
        getPortKindSignature(optionOutput.kind) === targetKind
      );
    });
    const chainOptions = getMatchingCanonicalRepairChains({
      sourceType,
      sourceKind,
      targetType,
      targetKind,
      registry,
    });
    const referenceAwareChainOptions = getMatchingReferenceAwareRepairChains({
      sourceType,
      sourceKind,
      targetType,
      targetKind,
      registry,
    });
    const popupWidth = 260;
    const rowHeight = 28;
    const headerHeight = 32;
    const cancelHeight = 28;
    const bridgeSectionHeight = bridgeOptions.length > 0 ? 20 + bridgeOptions.length * rowHeight + 6 : 0;
    const chainSectionHeight = chainOptions.length > 0 ? 20 + chainOptions.length * rowHeight + 6 : 0;
    const referenceAwareChainSectionHeight =
      referenceAwareChainOptions.length > 0 ? 20 + referenceAwareChainOptions.length * rowHeight + 6 : 0;
    const popupHeight =
      headerHeight +
      bridgeSectionHeight +
      chainSectionHeight +
      referenceAwareChainSectionHeight +
      cancelHeight +
      12;

    return (
      <g
        className="bridge-insertion-popup"
        transform={`translate(${x - popupWidth / 2} ${y - popupHeight - 16})`}
      >
        <rect width={popupWidth} height={popupHeight} rx={10} ry={10} className="bridge-popup-bg" />
        <text x={popupWidth / 2} y={20} textAnchor="middle" className="bridge-popup-title">
          {`Repair connection`}
        </text>
        <line x1={8} y1={headerHeight} x2={popupWidth - 8} y2={headerHeight} className="bridge-popup-sep" />
        <text x={12} y={headerHeight + 15} className="bridge-popup-help-text">
          {`${fromModuleId}.${fromPort} (${sourceType}/${sourceKind}) → ${toModuleId}.${toPort} (${targetType}/${targetKind})`}
        </text>
        {(() => {
          let currentY = headerHeight + 22;
          const sections: ReactNode[] = [];

          if (bridgeOptions.length > 0) {
            sections.push(
              <text key="bridge-label" x={12} y={currentY + 11} className="bridge-popup-section-label">
                Common bridges
              </text>,
            );
            currentY += 16;
            bridgeOptions.forEach(({ defId, label }, index) => {
              const rowY = currentY + 4 + index * rowHeight;
              sections.push(
                <g
                  key={`bridge:${defId}`}
                  className="bridge-popup-option"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const sourcePos = effectiveLayout[fromModuleId] ?? { x: 0, y: 0 };
                    const targetPos = effectiveLayout[toModuleId] ?? { x: 0, y: 0 };
                    onInsertBridgeConnection(defId, fromModuleId, fromPort, toModuleId, toPort, {
                      x: Math.round((sourcePos.x + targetPos.x) / 2),
                      y: Math.round((sourcePos.y + targetPos.y) / 2),
                    });
                    setPendingRepairInsertion(null);
                  }}
                >
                  <rect x={8} y={rowY} width={popupWidth - 16} height={rowHeight - 4} rx={5} />
                  <text x={16} y={rowY + rowHeight - 11} className="bridge-popup-option-text">
                    {label}
                  </text>
                </g>,
              );
            });
            currentY += bridgeOptions.length * rowHeight + 6;
          }

          if (chainOptions.length > 0) {
            sections.push(
              <text key="chain-label" x={12} y={currentY + 11} className="bridge-popup-section-label">
                Common repair chains
              </text>,
            );
            currentY += 16;
            chainOptions.forEach((chain, index) => {
              const rowY = currentY + 4 + index * rowHeight;
              sections.push(
                <g
                  key={`chain:${chain.id}`}
                  className="bridge-popup-option"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const sourcePos = effectiveLayout[fromModuleId] ?? { x: 0, y: 0 };
                    const targetPos = effectiveLayout[toModuleId] ?? { x: 0, y: 0 };
                    const templates = buildInsertChainTemplates({
                      chain,
                      canvasPosition: {
                        x: Math.round((sourcePos.x + targetPos.x) / 2) - 120,
                        y: Math.round((sourcePos.y + targetPos.y) / 2),
                      },
                      layoutDirection,
                    });
                    onInsertChain(
                      templates.modules,
                      templates.connections,
                      {
                        fromModuleId,
                        fromPort,
                        toIndex: 0,
                        toPort: 'in',
                      },
                      {
                        fromIndex: templates.modules.length - 1,
                        fromPort: 'out',
                        toModuleId,
                        toPort,
                      },
                    );
                    setPendingRepairInsertion(null);
                  }}
                >
                  <rect x={8} y={rowY} width={popupWidth - 16} height={rowHeight - 4} rx={5} />
                  <text x={16} y={rowY + rowHeight - 11} className="bridge-popup-option-text">
                    {chain.label}
                  </text>
                </g>,
              );
            });
          }

          if (referenceAwareChainOptions.length > 0) {
            currentY += chainOptions.length > 0 ? chainOptions.length * rowHeight + 6 : 0;
            sections.push(
              <text key="reference-chain-label" x={12} y={currentY + 11} className="bridge-popup-section-label">
                Reference-aware repair chains
              </text>,
            );
            currentY += 16;
            referenceAwareChainOptions.forEach((chain, index) => {
              const rowY = currentY + 4 + index * rowHeight;
              sections.push(
                <g
                  key={`reference-chain:${chain.id}`}
                  className="bridge-popup-option"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const sourcePos = effectiveLayout[fromModuleId] ?? { x: 0, y: 0 };
                    const targetPos = effectiveLayout[toModuleId] ?? { x: 0, y: 0 };
                    setPendingReferenceChainSelection({
                      chain,
                      canvasX: Math.round((sourcePos.x + targetPos.x) / 2) - 120,
                      canvasY: Math.round((sourcePos.y + targetPos.y) / 2),
                      sourceAttachment: {
                        fromModuleId,
                        fromPort,
                      },
                      targetAttachment: {
                        toModuleId,
                        toPort,
                      },
                    });
                    setPendingRepairInsertion(null);
                  }}
                >
                  <rect x={8} y={rowY} width={popupWidth - 16} height={rowHeight - 4} rx={5} />
                  <text x={16} y={rowY + rowHeight - 11} className="bridge-popup-option-text">
                    {chain.label}
                  </text>
                </g>,
              );
            });
          } else if (chainOptions.length > 0) {
            currentY += chainOptions.length * rowHeight + 6;
          }

          return sections;
        })()}
        <line x1={8} y1={popupHeight - cancelHeight - 6} x2={popupWidth - 8} y2={popupHeight - cancelHeight - 6} className="bridge-popup-sep" />
        <g
          className="bridge-popup-cancel"
          onMouseDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
            setPendingRepairInsertion(null);
          }}
        >
          <rect x={8} y={popupHeight - cancelHeight + 2} width={popupWidth - 16} height={cancelHeight - 4} rx={5} />
          <text x={popupWidth / 2} y={popupHeight - 9} textAnchor="middle" className="bridge-popup-cancel-text">Cancel</text>
        </g>
      </g>
    );
  }

  function renderConnectionHoverLabel(connection: Project['connections'][number], connectionIndex: number) {
    if (
      hoveredConnectionIndex !== connectionIndex &&
      effectiveSelectedConnectionIndex !== connectionIndex
    ) {
      return null;
    }

    const from = effectiveLayout[connection.from.moduleId];
    const to = effectiveLayout[connection.to.moduleId];
    const sourceInstance = activeProjectState.modules.find(
      (moduleInstance) => moduleInstance.id === connection.from.moduleId,
    );
    const targetInstance = activeProjectState.modules.find(
      (moduleInstance) => moduleInstance.id === connection.to.moduleId,
    );
    const sourceDef = sourceInstance ? registry[sourceInstance.defId] : undefined;
    const targetDef = targetInstance ? registry[targetInstance.defId] : undefined;
    if (!from || !to || !sourceDef || !targetDef) {
      return null;
    }

    const orderedSourcePorts = getOrderedModulePorts(sourceDef, from, 'output');
    const orderedTargetPorts = getOrderedModulePorts(targetDef, to, 'input');
    const sourceOrientation = getNodeOrientation(from.orientation, layoutDirection);
    const targetOrientation = getNodeOrientation(to.orientation, layoutDirection);
    const { side: sourceSide, sideIndex: sourceAnchorIndex } = getPortPlacementForModulePort(
      [],
      orderedSourcePorts,
      from,
      sourceOrientation,
      'out',
      connection.from.port,
    );
    const { side: targetSide, sideIndex: targetAnchorIndex } = getPortPlacementForModulePort(
      orderedTargetPorts,
      [],
      to,
      targetOrientation,
      'in',
      connection.to.port,
    );

    const hoverSourceConfig = nodeSizeByModuleId[connection.from.moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
    const hoverTargetConfig = nodeSizeByModuleId[connection.to.moduleId]?.config ?? NODE_SIZE_CONFIGS.standard;
    const sourceAnchor = getAnchorPosition(
      from.x,
      from.y,
      sourceSide,
      sourceAnchorIndex,
      hoverSourceConfig.width,
      hoverSourceConfig.height,
      hoverSourceConfig.portStartY,
      hoverSourceConfig.portGap,
    );
    const targetAnchor = getAnchorPosition(
      to.x,
      to.y,
      targetSide,
      targetAnchorIndex,
      hoverTargetConfig.width,
      hoverTargetConfig.height,
      hoverTargetConfig.portStartY,
      hoverTargetConfig.portGap,
    );

    const midpointX = (sourceAnchor.x + targetAnchor.x) / 2;
    const midpointY = (sourceAnchor.y + targetAnchor.y) / 2;
    const sourceLabel = `${connection.from.moduleId}.${connection.from.port}`;
    const targetLabel = `${connection.to.moduleId}.${connection.to.port}`;

    const wireSig = showSignalChips && execution
      ? (execution.outputsByModuleId[connection.from.moduleId]?.[connection.from.port] ?? null)
      : null;
    const wireChipText = wireSig ? formatSignalChip(wireSig) : null;
    const wireChipDetail = wireSig ? buildSignalChipDetail(wireSig) : null;

    const portLabelWidth = Math.max(sourceLabel.length, targetLabel.length) * 7 + 20;
    const labelWidth = wireChipText ? Math.max(portLabelWidth, 150) : portLabelWidth;

    // Signal area: 8px top pad + 14px value + 12px hex + 12px meta + 8px bottom pad = 54px
    const chipAreaHeight = wireChipText ? 54 : 0;
    const severRowHeight = isObservationMode ? 0 : 28;
    const labelHeight = chipAreaHeight + (wireChipText ? 2 : 0) + 40 + severRowHeight;

    return (
      <g
        key={`hover-label:${connection.from.moduleId}:${connection.from.port}-${connection.to.moduleId}:${connection.to.port}`}
        className="connection-hover-label"
        transform={`translate(${midpointX - labelWidth / 2} ${midpointY - labelHeight - 24})`}
      >
        <rect width={labelWidth} height={labelHeight} rx="10" ry="10" />
        {wireChipText && wireChipDetail && wireSig ? (
          <>
            <rect
              x={8} y={8}
              width={labelWidth - 16} height={chipAreaHeight - 16}
              rx="6" ry="6"
              className={`connection-wire-value-chip connection-wire-value-chip-${wireSig.type}`}
            />
            <text className={`connection-wire-value-chip-text connection-wire-value-chip-text-${wireSig.type}`}>
              <tspan x={labelWidth / 2} y={22} textAnchor="middle" className="connection-wire-value-chip-value">
                {wireChipText}
              </tspan>
              {wireChipDetail.hex ? (
                <tspan x={labelWidth / 2} dy="13" textAnchor="middle" className="connection-wire-value-chip-detail">
                  {wireChipDetail.hex}
                </tspan>
              ) : null}
              <tspan x={labelWidth / 2} dy="13" textAnchor="middle" className="connection-wire-value-chip-meta">
                {wireChipDetail.meta}
              </tspan>
            </text>
            <line
              x1={8} y1={chipAreaHeight + 2}
              x2={labelWidth - 8} y2={chipAreaHeight + 2}
              className="connection-wire-value-separator"
            />
            <text x={10} y={chipAreaHeight + 18}>
              <tspan x={10} dy="0">{sourceLabel}</tspan>
              <tspan x={10} dy="14">{targetLabel}</tspan>
            </text>
          </>
        ) : (
          <text x={10} y={15}>
            <tspan x={10} dy="0">{sourceLabel}</tspan>
            <tspan x={10} dy="14">{targetLabel}</tspan>
          </text>
        )}
        {!isObservationMode ? (
          <>
            <line
              x1={8} y1={labelHeight - severRowHeight}
              x2={labelWidth - 8} y2={labelHeight - severRowHeight}
              className="connection-wire-value-separator"
            />
            <g
              className="connection-sever-btn"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveConnection(connectionIndex);
              }}
            >
              <rect x={8} y={labelHeight - severRowHeight + 4} width={labelWidth - 16} height={20} rx={4} />
              <text x={labelWidth / 2} y={labelHeight - severRowHeight + 18} textAnchor="middle">
                ✕ Sever
              </text>
            </g>
          </>
        ) : null}
      </g>
    );
  }

  return (
    <section className={challengeSolved ? 'panel canvas-panel canvas-panel-success' : 'panel canvas-panel'}>
      <div className="panel-head canvas-panel-head">
        <div className="canvas-panel-head-copy">
          <p className="panel-label">Workbench</p>
          <h2>{title ?? 'Demo Graphs'}</h2>
        </div>
        {showPaletteToggle || showInspectorToggle ? (
          <div className="canvas-panel-toggle-group" aria-label="Workbench side panels">
            {showPaletteToggle ? (
              <button
                type="button"
                className={`canvas-panel-toggle-button${isPaletteVisible ? ' active' : ''}`}
                aria-pressed={isPaletteVisible}
                title={isPaletteVisible ? 'Hide Tools' : 'Show Tools'}
                onClick={onTogglePaletteVisible}
              >
                Tools
              </button>
            ) : null}
            {showInspectorToggle ? (
              <button
                type="button"
                className={`canvas-panel-toggle-button${isInspectorVisible ? ' active' : ''}`}
                aria-pressed={isInspectorVisible}
                title={isInspectorVisible ? 'Hide Inspect' : 'Show Inspect'}
                onClick={onToggleInspectorVisible}
              >
                Inspect
              </button>
            ) : null}
          </div>
        ) : null}
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
          autosaveSnapshots={autosaveSnapshots}
          workspaceComparison={workspaceComparison}
          activeComparisonVersion={activeComparisonVersion}
          comparisonVersionId={comparisonVersionId}
          persistenceWarning={persistenceWarning}
          lastDurableSaveAt={lastDurableSaveAt}
          exportStatus={exportStatus}
          currentDocumentFingerprint={currentDocumentFingerprint}
          fileBinding={fileBinding}
          onSwitchProject={onSwitchProject}
          onJumpToModule={jumpToModule}
          onRequestRestoreVersion={onRequestRestoreVersion}
          onRequestRestoreAutosave={onRequestRestoreAutosave}
          onSetComparisonVersionId={setComparisonVersionId}
          formatVersionTimestamp={formatVersionTimestamp}
        />

        <WorkbenchActions
          isCompositeEditor={isCompositeEditor}
          isObservationMode={isObservationMode}
          theme={theme}
          layoutDirection={layoutDirection}
          routingMode={routingMode}
          wireColorMode={wireColorMode}
          showOverviewNavigator={showOverviewNavigator}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          snapToGuides={snapToGuides}
          canUndo={canUndo}
          canRedo={canRedo}
          canPasteSelection={canPasteSelection}
          selectedModuleIds={selectedModuleIds}
          selectedFurnitureKind={selectedFurnitureKind}
          selectedFurnitureTitle={selectedFurnitureTitle}
          selectedFurnitureDetailPrimary={selectedFurnitureDetailPrimary}
          selectedFurnitureDetailSecondary={selectedFurnitureDetailSecondary}
          effectiveSelectedConnectionIndex={effectiveSelectedConnectionIndex}
          selectedConnectionHasManualPath={selectedConnectionHasManualPath}
          selectedConnectionWaypointMode={selectedConnectionWaypointMode}
          selectedConnectionSourceLabel={selectedConnectionSourceLabel}
          selectedConnectionTargetLabel={selectedConnectionTargetLabel}
          selectedConnectionDomainTone={selectedConnectionDomainTone}
          selectedConnectionLaneAxis={selectedConnectionLaneAxis}
          selectedConnectionLanePreference={selectedConnectionLanePreference}
          selectedConnectionColorOverride={selectedConnectionColorOverride}
          furnitureVisible={showFurniture}
          tutorialNotesVisible={tutorialNotesVisible}
          onAddAnnotation={onAddAnnotation}
          onAddStageLabel={onAddStageLabel}
          onExportDocument={onExportDocument}
          onExportLabPack={onExportLabPack}
          onExportPython={onExportPython}
          onTidyLayout={onTidyLayout}
          onTidySelection={onTidySelection}
          onSetLayoutDirection={onSetLayoutDirection}
          onSetRoutingMode={onSetRoutingMode}
          onSetWireColorMode={onSetWireColorMode}
          onToggleOverviewNavigator={onSetOverviewNavigatorVisible}
          onToggleGrid={onSetGridVisible}
          onToggleSnapToGrid={onSetSnapToGrid}
          onToggleSnapToGuides={onSetSnapToGuides}
          onRequestUndo={onRequestUndo}
          onRequestRedo={onRequestRedo}
          onRequestOpenWorkspace={onRequestOpenWorkspace}
          onRequestSaveDocument={onRequestSaveDocument}
          onRequestSaveDocumentAs={onRequestSaveDocumentAs}
          onRequestSaveWorkspaceToLibrary={onRequestSaveWorkspaceToLibrary}
          onToggleTheme={onToggleTheme}
          onZoomOut={() => setWorkspaceZoom((currentZoom) => getNextWorkspaceZoom(currentZoom, 'out'))}
          onZoomIn={() => setWorkspaceZoom((currentZoom) => getNextWorkspaceZoom(currentZoom, 'in'))}
          onResetView={() => {
            setWorkspaceZoom(DEFAULT_WORKSPACE_ZOOM);
            canvasSurfaceRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
          }}
          onFitView={fitWorkspaceView}
          canFrameSelection={canFrameSelection}
          canReturnToPreviousView={previousView !== null}
          canJumpToFirstError={firstBrokenModuleId !== null}
          savedViewRegions={savedViewRegions}
          onRequestFrameWorkspace={fitWorkspaceView}
          onRequestFrameSelection={handleFrameSelectionIntent}
          onRequestReturnToPreviousView={returnToPreviousView}
          onRequestJumpToFirstError={() => {
            if (firstBrokenModuleId) {
              jumpToModule(firstBrokenModuleId);
            }
          }}
          onRequestSaveCurrentView={requestSaveCurrentView}
          onRequestRecallSavedView={recallSavedView}
          onRequestDeleteSavedView={onRemoveWorkspaceViewRegion}
          onRequestSaveVersion={onRequestSaveVersion}
          onRequestArrangeSelection={onRequestArrangeSelection}
          onRequestAddGroupBox={() => {
            setPendingGroupBoxCreation({
              mode: 'blank',
              previousIds: groupBoxes.map((groupBox) => groupBox.id),
              hint: '',
            });
            onAddGroupBox();
          }}
          onRequestAddGroupBoxFromSelection={() => {
            setPendingGroupBoxCreation({
              mode: 'selection',
              previousIds: groupBoxes.map((groupBox) => groupBox.id),
              hint: selectionCategoryHint,
            });
            onAddGroupBoxFromSelection();
          }}
          onRequestAddGuideRail={onAddGuideRail}
          onRequestCopySelection={onRequestCopySelection}
          onRequestPasteSelection={onRequestPasteSelection}
          onRequestDuplicateSelection={onRequestDuplicateSelection}
          onRequestRepeatSelectionRight={onRequestRepeatSelectionRight}
          onRequestCopySelectionToWorkspace={onRequestCopySelectionToWorkspace}
          onRequestDeleteSelection={onRequestDeleteSelection}
          onRequestDeleteWire={() => {
            if (effectiveSelectedConnectionIndex !== null) {
              onRemoveConnection(effectiveSelectedConnectionIndex);
              setSelectedConnectionIndex(null);
              setSelectedConnectionAnchorIndex(null);
              setWaypointModeConnectionKey(null);
            }
          }}
          onRequestToggleWireWaypointMode={() => {
            if (!selectedConnectionKey || routingMode !== 'orthogonal') {
              return;
            }
            setSelectedConnectionAnchorIndex(null);
            setWaypointModeConnectionKey((current) =>
              current === selectedConnectionKey ? null : selectedConnectionKey,
            );
          }}
          onRequestResetWirePath={() => {
            if (selectedConnectionKey) {
              onClearConnectionOrthogonalPathEdits(selectedConnectionKey);
              setSelectedConnectionAnchorIndex(null);
              setWaypointModeConnectionKey(null);
            }
          }}
          onRequestSetWireLanePreference={(preference) => {
            if (selectedConnectionKey) {
              onSetConnectionLanePreference(selectedConnectionKey, preference);
            }
          }}
          onRequestClearWireLanePreference={() => {
            if (selectedConnectionKey) {
              onClearConnectionLanePreference(selectedConnectionKey);
            }
          }}
          onRequestSetWireColorOverride={(color) => {
            if (selectedConnectionKey) {
              onSetConnectionColorOverride(selectedConnectionKey, color);
            }
          }}
          onRequestClearWireColorOverride={() => {
            if (selectedConnectionKey) {
              onClearConnectionColorOverride(selectedConnectionKey);
            }
          }}
          onRequestImport={() => importInputRef.current?.click()}
          onRequestImportLabPack={() => importLabPackInputRef.current?.click()}
          onRequestCreateComposite={onRequestCreateComposite}
          onRequestCreateIterator={onRequestCreateIterator}
          onRequestCreateClockedIterator={onRequestCreateClockedIterator}
          onRequestCreateConditional={onRequestCreateConditional}
          onRequestCreateMultiConditional={onRequestCreateMultiConditional}
          onRequestAutoWire={onRequestAutoWire}
          onToggleFurnitureVisible={onSetFurnitureVisible}
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
          <span className="meta-label">Step</span>
          <strong>
            {tutorialTitle ? `${tutorialTitle} — ` : ''}
            {tutorialStep.title}
            {tutorialStepCount > 0 ? ` (${tutorialStepIndex + 1}/${tutorialStepCount})` : ''}
          </strong>
          {tutorialNotesVisible ? (
            <>
              <p>{tutorialStep.body}</p>
              {tutorialStep.focusModuleId ? (
                <p className="tutorial-step-target">
                  Focus: <strong>{tutorialStep.focusModuleId}</strong>
                </p>
              ) : null}
            </>
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
            {onSetTutorialNotesVisible ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() => onSetTutorialNotesVisible?.(!tutorialNotesVisible)}
              >
                {tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {selectedModuleIds.length > 0 ? (
        <p className="selection-status">
          {isObservationMode ? (
            <>
              <strong>{selectedModuleIds.length}</strong> selected. Use
              <strong> Shift-click</strong> or <strong> Cmd/Ctrl-click</strong> to compare.
            </>
          ) : (
            <>
              <strong>{selectedModuleIds.length}</strong> selected. Use
              <strong> Shift-click</strong>, <strong> Cmd/Ctrl-click</strong>, or drag canvas to add;
              drag to move.
            </>
          )}
        </p>
      ) : null}
      {pendingConnection ? (
        <p className="connection-status">
          <span className="connection-status-summary">
            <span className="connection-status-source">
              {pendingConnection.excludedConnectionIndex !== null ? 'Rewiring' : 'Wiring from'}{' '}
              <strong>{pendingConnection.fromModuleId}.{pendingConnection.fromPort}</strong>.
            </span>
            {pendingTargetSummary ? (
              <span className="connection-status-chips">
                <span className="connection-status-chip connection-status-chip-valid">
                  {pendingTargetSummary.validCount} valid
                </span>
                <span className="connection-status-chip connection-status-chip-replace">
                  {pendingTargetSummary.replaceCount} replace
                </span>
              </span>
            ) : null}
          </span>
          <span className="connection-status-detail">
            {pendingTargetSummary?.hoveredTargetKey && pendingTargetSummary.hoveredTargetState ? (
              <>
                Target{' '}
                <strong>{pendingTargetSummary.hoveredTargetKey.replace(':', '.')}</strong>{' '}
                {pendingTargetSummary.hoveredTargetState.valid
                  ? pendingTargetSummary.hoveredTargetState.mode === 'replace'
                    ? 'will replace the existing connection.'
                    : 'ready to connect.'
                  : pendingTargetSummary.hoveredTargetState.reason ?? 'blocked.'}
              </>
            ) : (
              <>Teal = connect &bull; Gold = replace &bull; Red = blocked</>
            )}
          </span>
        </p>
      ) : connectionFeedback ? (
        <p className="connection-status connection-status-warning">{connectionFeedback}</p>
      ) : effectiveSelectedConnectionIndex !== null &&
        activeProjectState.connections[effectiveSelectedConnectionIndex] ? (
        <p className="selection-status">
          Wire:{' '}
          <strong>
            {activeProjectState.connections[effectiveSelectedConnectionIndex].from.moduleId}.
            {activeProjectState.connections[effectiveSelectedConnectionIndex].from.port}
          </strong>{' '}
          -&gt;{' '}
          <strong>
            {activeProjectState.connections[effectiveSelectedConnectionIndex].to.moduleId}.
            {activeProjectState.connections[effectiveSelectedConnectionIndex].to.port}
          </strong>
          . <strong>Delete Wire</strong> removes it.
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
                title="Previous tick ([)"
              >
                Prev
              </button>
              <button
                type="button"
                className="mini-action-button"
                disabled={tickCount <= 1 || currentTick >= tickCount - 1}
                onClick={() => onSetTickPlaybackActive?.(!isTickPlaybackActive)}
                aria-label={isTickPlaybackActive ? 'Pause tick playback' : 'Play tick playback'}
                title={isTickPlaybackActive ? 'Pause tick playback (Space)' : 'Play tick playback (Space)'}
              >
                {isTickPlaybackActive ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="mini-action-button"
                disabled={currentTick >= tickCount - 1 || isTickPlaybackActive}
                onClick={() => onSetCurrentTick?.(currentTick + 1)}
                aria-label="Next tick"
                title="Next tick (])"
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
              No sources
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="canvas-surface-shell">
      <div
        ref={canvasSurfaceRef}
        className="canvas-surface"
        style={{ height: `${canvasViewportHeight}px` }}
      >
        <div
          className="graph-viewport"
          style={
            {
              width: `${canvasWidth * workspaceZoom}px`,
              height: `${Math.max(canvasHeight * workspaceZoom, canvasViewportHeight)}px`,
              '--workspace-zoom': workspaceZoom,
            } as CSSProperties
          }
        >
        {showGrid ? <div className="graph-grid-overlay" /> : null}
        <div
          className={`graph-canvas${pendingConnection ? ' graph-canvas-wiring-active' : ''}${
            effectiveSelectedConnectionIndex !== null ? ' graph-canvas-has-selected-connection' : ''
          }${traceFocusedModuleId !== null ? ' graph-canvas-has-active-trace' : ''}`}
          style={
            {
              '--canvas-width': `${canvasWidth}px`,
              '--canvas-height': `${canvasHeight}px`,
              '--workspace-zoom': workspaceZoom,
            } as CSSProperties
          }
          onMouseDown={(event) => {
            if (quickAdd) { setQuickAdd(null); }
            if (pendingReferenceChainSelection) {
              clearReferenceChainSelection();
              return;
            }
            if (pendingRepairInsertion) { setPendingRepairInsertion(null); return; }
            if (pendingConnection && !pendingConnection.isDragging && event.target === event.currentTarget) {
              setPendingConnection(null);
              return;
            }
            if (isCompositeEditor || pendingConnection || event.target !== event.currentTarget) {
              return;
            }

            const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
            if (!pointer) {
              return;
            }

            event.preventDefault();
            setSelectedGroupBoxId(null);
            setSelectedGuideRailId(null);
            setSelectedStageLabelId(null);
            setSelectedConnectionIndex(null);
            setSelectionBox({
              startX: pointer.x,
              startY: pointer.y,
              currentX: pointer.x,
              currentY: pointer.y,
              additive: event.shiftKey || event.metaKey || event.ctrlKey,
            });
          }}
          onDoubleClick={(event) => {
            if (pendingReferenceChainSelection) {
              clearReferenceChainSelection();
              return;
            }
            if (isCompositeEditor || event.target !== event.currentTarget) return;
            const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
            if (!pointer) return;
            setSelectionBox(null);
            setQuickAdd({
              canvasX: pointer.x,
              canvasY: pointer.y,
              clientX: event.clientX,
              clientY: event.clientY,
              mode: 'plain',
            });
          }}
          onMouseUp={(event) => {
            if (
              !pendingConnection ||
              !pendingConnection.isDragging ||
              event.target !== event.currentTarget
            ) {
              return;
            }

            const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
            if (!pointer) {
              return;
            }

            const sourceInstance = activeProjectState.modules.find(
              (moduleInstance) => moduleInstance.id === pendingConnection.fromModuleId,
            );
            const sourceDef = sourceInstance ? registry[sourceInstance.defId] : null;
            const sourcePort = sourceDef?.outputs.find((port) => port.name === pendingConnection.fromPort);
            if (!sourcePort) {
              clearPendingConnectionUi();
              return;
            }

            event.stopPropagation();
            setQuickAdd({
              canvasX: pointer.x,
              canvasY: pointer.y,
              clientX: event.clientX,
              clientY: event.clientY,
              mode: 'connect',
                pendingConnection: {
                  fromModuleId: pendingConnection.fromModuleId,
                  fromPort: pendingConnection.fromPort,
                  sourceType: sourcePort.type,
                  sourceKind: getPortKindSignature(sourcePort.kind),
                },
              });
            clearPendingConnectionUi();
          }}
        >
          {showFurniture && guideRails.map((guideRail) => {
            const railPosition =
              guideRailDragState?.guideRailId === guideRail.id
                ? guideRailDragState.currentPosition
                : guideRail.position;
            const isSelected = effectiveSelectedGuideRailId === guideRail.id;

            return (
              <div
                key={guideRail.id}
                className={`canvas-guide-rail canvas-guide-rail-${guideRail.axis}${
                  isSelected ? ' selected' : ''
                }`}
                style={
                  guideRail.axis === 'vertical'
                    ? ({ left: `${railPosition}px`, top: '0', height: `${canvasHeight}px` } as CSSProperties)
                    : ({ top: `${railPosition}px`, left: '0', width: `${canvasWidth}px` } as CSSProperties)
                }
                onMouseDown={(event) => {
                  event.stopPropagation();
                  const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
                  if (!pointer) {
                    return;
                  }
                  setSelectedGuideRailId(guideRail.id);
                  setSelectedGroupBoxId(null);
                  setSelectedStageLabelId(null);
                  setSelectedConnectionIndex(null);
                  setGuideRailDragState({
                    guideRailId: guideRail.id,
                    axis: guideRail.axis,
                    pointerOffset:
                      (guideRail.axis === 'vertical' ? pointer.x : pointer.y) - railPosition,
                    initialPosition: railPosition,
                    currentPosition: railPosition,
                  });
                }}
              >
                <div
                  className={`canvas-guide-rail-hitbox canvas-guide-rail-hitbox-${guideRail.axis}`}
                />
                <div
                  className={`canvas-guide-rail-label canvas-guide-rail-label-${guideRail.axis}`}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    setSelectedGuideRailId(guideRail.id);
                    setSelectedGroupBoxId(null);
                    setSelectedStageLabelId(null);
                    setSelectedConnectionIndex(null);
                  }}
                >
                  {isSelected ? (
                    <>
                      <input
                        className="canvas-guide-rail-title-input"
                        value={guideRail.title}
                        onChange={(event) =>
                          onUpdateGuideRailTitle(guideRail.id, event.target.value)
                        }
                        onMouseDown={(event) => event.stopPropagation()}
                      />
                      <button
                        type="button"
                        className="annotation-delete-button"
                        aria-label={`Delete ${guideRail.title || 'guide rail'}`}
                        title="Delete guide rail"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveGuideRail(guideRail.id);
                          setSelectedGuideRailId((current) =>
                            current === guideRail.id ? null : current,
                          );
                        }}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span className="canvas-guide-rail-title">{guideRail.title}</span>
                  )}
                </div>
              </div>
            );
          })}
          {dragAlignmentGuides.map((guide, index) => (
            <div
              key={`drag-guide-${guide.axis}-${guide.position}-${index}`}
              className={`canvas-drag-alignment-guide canvas-drag-alignment-guide-${guide.axis} canvas-drag-alignment-guide-${guide.kind}`}
              style={
                guide.axis === 'x'
                  ? ({ left: `${guide.position}px`, top: '0', height: `${canvasHeight}px` } as CSSProperties)
                  : ({ top: `${guide.position}px`, left: '0', width: `${canvasWidth}px` } as CSSProperties)
              }
            />
          ))}
          {showFurniture && groupBoxes.map((groupBox) => {
            const groupBoxX =
              groupBoxDragState?.groupBoxId === groupBox.id
                ? groupBoxDragState.currentX
                : groupBox.x;
            const groupBoxY =
              groupBoxDragState?.groupBoxId === groupBox.id
                ? groupBoxDragState.currentY
                : groupBox.y;
            const groupBoxWidth =
              groupBoxResizeState?.groupBoxId === groupBox.id
                ? groupBoxResizeState.currentWidth
                : groupBox.width;
            const groupBoxHeight =
              groupBoxResizeState?.groupBoxId === groupBox.id
                ? groupBoxResizeState.currentHeight
                : groupBox.height;
            const isSelected = effectiveSelectedGroupBoxId === groupBox.id;

            return (
              <div
                key={groupBox.id}
                className={`canvas-group-box canvas-group-box-${groupBox.variant ?? 'stage'}${
                  isSelected ? ' selected' : ''
                }`}
                style={{
                  left: `${groupBoxX}px`,
                  top: `${groupBoxY}px`,
                  width: `${groupBoxWidth}px`,
                  height: `${groupBoxHeight}px`,
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  setSelectedGroupBoxId(groupBox.id);
                  setSelectedGuideRailId(null);
                  setSelectedStageLabelId(null);
                  setSelectedConnectionIndex(null);
                }}
              >
                <div
                  className="canvas-group-box-header"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
                    if (!pointer) {
                      return;
                    }
                    setSelectedGroupBoxId(groupBox.id);
                    setSelectedGuideRailId(null);
                    setSelectedStageLabelId(null);
                    setGroupBoxDragState({
                      groupBoxId: groupBox.id,
                      pointerOffsetX: pointer.x - groupBoxX,
                      pointerOffsetY: pointer.y - groupBoxY,
                      initialX: groupBoxX,
                      initialY: groupBoxY,
                      currentX: groupBoxX,
                      currentY: groupBoxY,
                    });
                  }}
                >
                  {isSelected ? (
                    <input
                      className="canvas-group-box-title-input"
                      value={
                        groupBoxTitleEdit?.groupBoxId === groupBox.id
                          ? groupBoxTitleEdit.value
                          : groupBox.title
                      }
                      autoFocus={groupBoxTitleEdit?.groupBoxId === groupBox.id}
                      onFocus={() => {
                        if (groupBoxTitleEdit?.groupBoxId === groupBox.id) {
                          return;
                        }
                        setGroupBoxTitleEdit({
                          groupBoxId: groupBox.id,
                          value: groupBox.title,
                          originalTitle: groupBox.title,
                          untouchedHint: false,
                          createdFromSelection: false,
                        });
                      }}
                      onChange={(event) =>
                        setGroupBoxTitleEdit((current) =>
                          current && current.groupBoxId === groupBox.id
                            ? {
                                ...current,
                                value: event.target.value,
                                untouchedHint: false,
                              }
                            : {
                                groupBoxId: groupBox.id,
                                value: event.target.value,
                                originalTitle: groupBox.title,
                                untouchedHint: false,
                                createdFromSelection: false,
                              },
                        )
                      }
                      onBlur={() => commitGroupBoxTitleEdit()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          commitGroupBoxTitleEdit();
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelGroupBoxTitleEdit();
                        }
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                    />
                  ) : (
                    <span className="canvas-group-box-title">{groupBox.title}</span>
                  )}
                  {isSelected ? (
                    <div className="canvas-group-box-controls" onMouseDown={(event) => event.stopPropagation()}>
                      <select
                        className="canvas-group-box-variant-select"
                        value={groupBox.variant ?? 'stage'}
                        onChange={(event) =>
                          onSetGroupBoxVariant(
                            groupBox.id,
                            event.target.value as WorkbenchGroupBoxVariant,
                          )
                        }
                      >
                        <option value="neutral">Neutral</option>
                        <option value="stage">Stage</option>
                        <option value="feedback">Feedback</option>
                        <option value="emphasis">Emphasis</option>
                      </select>
                      <button
                        type="button"
                        className="annotation-delete-button"
                        aria-label={`Delete ${groupBox.title || 'group box'}`}
                        title="Delete group box"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveGroupBox(groupBox.id);
                          setSelectedGroupBoxId((current) =>
                            current === groupBox.id ? null : current,
                          );
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>
                {isSelected ? (
                  <div
                    className="canvas-group-box-resize-handle"
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      const pointer = getCanvasPointerFromClient(event.clientX, event.clientY);
                      if (!pointer) {
                        return;
                      }
                      setSelectedGroupBoxId(groupBox.id);
                      setGroupBoxResizeState({
                        groupBoxId: groupBox.id,
                        originX: groupBoxX,
                        originY: groupBoxY,
                        initialWidth: groupBoxWidth,
                        initialHeight: groupBoxHeight,
                        currentWidth: groupBoxWidth,
                        currentHeight: groupBoxHeight,
                      });
                    }}
                  />
                ) : null}
              </div>
            );
          })}
          <svg
            className="graph-connections graph-connections-base"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="none"
          >
            {activeProjectState.connections.map((connection, connectionIndex) =>
              renderConnection(connection, connectionIndex, 'base'),
            )}

            {pendingConnection && pendingConnection.isDragging ? (() => {
              const { fromAnchor, fromSide, mouseX, mouseY } = pendingConnection;
              const snapTargetAnchor = snapPendingTargetKey
                ? pendingTargetAnchors.find((candidate) => candidate.key === snapPendingTargetKey)?.anchor ?? null
                : null;
              const targetPoint = snapTargetAnchor ?? { x: mouseX, y: mouseY };
              return (
                <path
                  className={snapTargetAnchor ? 'pending-connection pending-connection-snap' : 'pending-connection'}
                  d={
                    routingMode === 'orthogonal'
                      ? getOrthogonalPendingPath(fromAnchor, fromSide, targetPoint)
                      : getPendingConnectionPath(fromAnchor, fromSide, targetPoint)
                  }
                />
              );
            })() : null}
          </svg>

          <svg
            className="graph-connections graph-connections-labels"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="none"
          >
            {activeProjectState.connections.map((connection, connectionIndex) =>
              renderConnectionHoverLabel(connection, connectionIndex),
            )}
            {renderBridgeInsertionPopup()}
          </svg>

          {activePaletteModuleDrag?.isActive &&
          activePaletteModuleDrag.moduleDef &&
          paletteModuleGhost ? (() => {
            const moduleDef = activePaletteModuleDrag.moduleDef;
            const category = getModuleCategory(moduleDef);
            const sequentialRole = isTickedMode
              ? getSequentialRole(moduleDef.id, moduleDef)
              : null;

            return (
              <>
                {paletteModuleGhost.splicePreview ? (
                  <svg
                    className="graph-connections graph-connections-overlay graph-connections-splice-preview"
                    viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                    preserveAspectRatio="none"
                  >
                    <path
                      className="pending-connection pending-connection-snap"
                      d={
                        routingMode === 'orthogonal'
                          ? getOrthogonalPendingPath(
                              paletteModuleGhost.splicePreview.sourceAnchor,
                              paletteModuleGhost.splicePreview.sourceSide,
                              paletteModuleGhost.splicePreview.previewInputAnchor,
                            )
                          : getPendingConnectionPath(
                              paletteModuleGhost.splicePreview.sourceAnchor,
                              paletteModuleGhost.splicePreview.sourceSide,
                              paletteModuleGhost.splicePreview.previewInputAnchor,
                            )
                      }
                    />
                    <path
                      className="pending-connection pending-connection-snap"
                      d={
                        routingMode === 'orthogonal'
                          ? getOrthogonalPendingPath(
                              paletteModuleGhost.splicePreview.previewOutputAnchor,
                              paletteModuleGhost.splicePreview.previewOutputSide,
                              paletteModuleGhost.splicePreview.targetAnchor,
                            )
                          : getPendingConnectionPath(
                              paletteModuleGhost.splicePreview.previewOutputAnchor,
                              paletteModuleGhost.splicePreview.previewOutputSide,
                              paletteModuleGhost.splicePreview.targetAnchor,
                            )
                      }
                    />
                  </svg>
                ) : null}
                <div
                  className={
                    `graph-node graph-node-${category} graph-node-palette-ghost` +
                    (paletteModuleGhost.splicePreview ? ' graph-node-palette-splice-preview' : '') +
                    (paletteModuleGhost.nodeSizeClass !== 'standard'
                      ? ` graph-node--${paletteModuleGhost.nodeSizeClass}`
                      : '')
                  }
                  style={{
                    left: `${paletteModuleGhost.position.x}px`,
                    top: `${paletteModuleGhost.position.y}px`,
                  }}
                >
                  <div className="graph-node-body">
                    <div className="graph-node-meta-row">
                      <span className="graph-node-type">{moduleDef.id}</span>
                    </div>
                    {sequentialRole ? (
                      <div className="graph-node-role-row">
                        <span className={`graph-node-role-badge graph-node-role-badge-${sequentialRole}`}>
                          {getSequentialRoleLabel(sequentialRole)}
                        </span>
                      </div>
                    ) : null}
                    <strong className="graph-node-title">{moduleDef.name}</strong>
                    <div className="graph-node-ports">
                      <span>{moduleDef.inputs.length} in</span>
                      <span>{moduleDef.outputs.length} out</span>
                    </div>
                  </div>
                </div>
              </>
            );
          })() : null}

          {activeProjectState.modules.map((moduleInstance) => {
            const position = effectiveLayout[moduleInstance.id] ?? { x: 24, y: 24 };
            const def = registry[moduleInstance.defId];
            const canvasErrorState = canvasModuleErrorStateById[moduleInstance.id] ?? null;
            const category = def ? getModuleCategory(def) : getModuleCategory(moduleInstance.defId);
            const orientation = getNodeOrientation(position.orientation, layoutDirection);
            const sequentialRole = isTickedMode
              ? getSequentialRole(moduleInstance.defId, def)
              : null;
            const orderedInputPorts = def ? getOrderedModulePorts(def, position, 'input') : [];
            const orderedOutputPorts = def ? getOrderedModulePorts(def, position, 'output') : [];
            const sidePortGroups = buildSidePortGroups(
              orderedInputPorts,
              orderedOutputPorts,
              position,
              orientation,
            );
            const { sizeClass: nodeSizeClass, config: nodeSizeConfig } =
              nodeSizeByModuleId[moduleInstance.id] ?? { sizeClass: 'standard', config: NODE_SIZE_CONFIGS.standard };

            return (
            <div
              key={moduleInstance.id}
                className={
                  `graph-node graph-node-${category}` +
                  (nodeSizeClass !== 'standard' ? ` graph-node--${nodeSizeClass}` : '') +
                  (moduleInstance.bypass ? ' graph-node-bypassed' : '') +
                  (selectedModuleIds.includes(moduleInstance.id) ? ' graph-node-selected' : '') +
                  (moduleInstance.id === selectedModuleId ? ' graph-node-primary-selected' : '') +
                  (moduleInstance.id === hoveredTraceModuleId ? ' graph-node-trace-hovered' : '') +
                  (moduleInstance.id === steppedModuleId ||
                  moduleInstance.id === activeAnalysisOwnerModuleId
                    ? ' graph-node-stepped'
                    : '') +
                  (traceNeighborModuleIds.has(moduleInstance.id) ? ' graph-node-trace-neighbor' : '') +
                  (moduleInstance.id === divergenceModuleId ? ' graph-node-divergence' : '') +
                  (moduleInstance.id === tutorialStep?.focusModuleId ? ' graph-node-tutorial-focus' : '') +
                  (probedModuleIds.includes(moduleInstance.id) ? ' graph-node-probed' : '') +
                  (canvasErrorState ? ' graph-node-invalid' : '') +
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
                      setSelectedGuideRailId(null);
                      setSelectedStageLabelId(null);
                      setSelectedConnectionIndex(null);
                      onSelectModule(moduleInstance.id, true);
                      return;
                    }
                    if (isObservationMode) {
                      setSelectedGuideRailId(null);
                      setSelectedStageLabelId(null);
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
                      setSelectedGuideRailId(null);
                      setSelectedStageLabelId(null);
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
                    {onToggleProbe ? (
                      <span className="graph-node-card-actions">
                        <button
                          type="button"
                          className={
                            probedModuleIds.includes(moduleInstance.id)
                              ? 'graph-node-card-action graph-node-probe-button probed'
                              : 'graph-node-card-action graph-node-probe-button'
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
                            setSelectedStageLabelId(null);
                            onToggleProbe(moduleInstance.id);
                          }}
                        >
                          {probedModuleIds.includes(moduleInstance.id) ? '\u25C9' : '\u25CB'}
                        </button>
                      </span>
                    ) : null}
                  </div>
                  {sequentialRole ? (
                    <div className="graph-node-role-row">
                      <span className={`graph-node-role-badge graph-node-role-badge-${sequentialRole}`}>
                        {getSequentialRoleLabel(sequentialRole)}
                      </span>
                    </div>
                  ) : null}
                  {isTickedMode && def && isTickSliceable(def) ? (() => {
                    const len = def.tickLength(moduleInstance.params);
                    return (
                      <div className="graph-node-role-row">
                        <span className="graph-node-stream-badge">
                          {`Stream · ${len} tick${len === 1 ? '' : 's'}`}
                        </span>
                      </div>
                    );
                  })() : null}
                  {inlineRename?.moduleId === moduleInstance.id ? (
                    <input
                      className="graph-node-title-input"
                      autoFocus
                      value={inlineRename.value}
                      onChange={(e) => setInlineRename({ moduleId: moduleInstance.id, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { onRenameModuleInstance(moduleInstance.id, inlineRename.value); setInlineRename(null); }
                        else if (e.key === 'Escape') setInlineRename(null);
                      }}
                      onBlur={() => { onRenameModuleInstance(moduleInstance.id, inlineRename?.value ?? moduleInstance.id); setInlineRename(null); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <strong
                      className="graph-node-title"
                      onDoubleClick={isObservationMode ? undefined : (e) => { e.stopPropagation(); setInlineRename({ moduleId: moduleInstance.id, value: moduleInstance.id }); }}
                    >{moduleInstance.id}</strong>
                  )}
                  {onDuplicateModule ? (
                    <button
                      type="button"
                      className="graph-node-duplicate-inline"
                      aria-label={`Duplicate ${moduleInstance.id}`}
                      title="Duplicate module"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        if (isObservationMode) {
                          return;
                        }
                        event.stopPropagation();
                        setSelectedConnectionIndex(null);
                        setSelectedStageLabelId(null);
                        onDuplicateModule(moduleInstance.id);
                      }}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <rect
                          x="6.5"
                          y="4.5"
                          width="8"
                          height="8"
                          rx="1.6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <rect
                          x="3.5"
                          y="7.5"
                          width="8"
                          height="8"
                          rx="1.6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </button>
                  ) : null}
                  {(() => {
                    const inlineParamSpec = INLINE_EDITABLE_PARAM_SPECS[moduleInstance.defId];
                    const inlineParamField = inlineParamSpec
                      ? def?.paramSchema[inlineParamSpec.paramKey] ?? null
                      : null;
                    const inlineParamValue = inlineParamField
                      ? moduleInstance.params[inlineParamSpec!.paramKey] ?? inlineParamField.defaultValue
                      : null;
                    const isInlineEditingParam =
                      inlineParamEdit?.moduleId === moduleInstance.id &&
                      inlineParamEdit.paramKey === inlineParamSpec?.paramKey;

                    if (!inlineParamSpec || !inlineParamField || inlineParamValue === null) {
                      return null;
                    }

                    return isInlineEditingParam ? (
                      <div className="graph-node-inline-param-editor">
                        <input
                          className={`graph-node-inline-param-input${
                            inlineParamEdit?.error ? ' graph-node-inline-param-input-error' : ''
                          }`}
                          autoFocus
                          value={inlineParamEdit.value}
                          onChange={(event) =>
                            setInlineParamEdit({
                              moduleId: moduleInstance.id,
                              paramKey: inlineParamSpec.paramKey,
                              value: event.target.value,
                              error: null,
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === 'Tab') {
                              event.preventDefault();
                              commitInlineParamEdit(moduleInstance.id, def ?? null, moduleInstance.params);
                            } else if (event.key === 'Escape') {
                              event.preventDefault();
                              setInlineParamEdit(null);
                            }
                          }}
                          onBlur={() => {
                            commitInlineParamEdit(moduleInstance.id, def ?? null, moduleInstance.params);
                            setInlineParamEdit((current) =>
                              current?.moduleId === moduleInstance.id ? null : current,
                            );
                          }}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        />
                        {inlineParamEdit?.error ? (
                          <span className="graph-node-inline-param-error">{inlineParamEdit.error}</span>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="graph-node-inline-param-chip"
                        title={`Edit ${inlineParamField.label}`}
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          if (isObservationMode) {
                            return;
                          }
                          event.stopPropagation();
                          setInlineParamEdit({
                            moduleId: moduleInstance.id,
                            paramKey: inlineParamSpec.paramKey,
                            value: formatParamValue(inlineParamValue, inlineParamField),
                            error: null,
                          });
                        }}
                      >
                        <span className="graph-node-inline-param-label">{inlineParamSpec.label}</span>
                        <span className="graph-node-inline-param-value">
                          {formatInlineEditableValue(inlineParamValue, inlineParamField.kind)}
                        </span>
                      </button>
                    );
                  })()}
                  {moduleInstance.id === tutorialStep?.focusModuleId ? (
                    <span className="graph-node-tutorial-badge">Tutorial</span>
                  ) : null}
                  {moduleInstance.bypass ? (
                    <span className="graph-node-bypass-badge">Bypass</span>
                  ) : null}
                  {canvasErrorState ? (
                    <span
                      className={`graph-node-error-badge graph-node-error-badge-${canvasErrorState.kind}`}
                      aria-label={`${canvasErrorState.label}: ${canvasErrorState.detail}`}
                    >
                      !
                      <span className="graph-node-error-tooltip" role="tooltip">
                        <strong>{canvasErrorState.label}</strong>
                        <span>{canvasErrorState.detail}</span>
                      </span>
                    </span>
                  ) : null}
                  {isTickedMode && tickedParamsByModule?.[moduleInstance.id] && tickCount > 0 ? (() => {
                    const tickParams = tickedParamsByModule[moduleInstance.id]?.[currentTick];
                    if (!tickParams) return null;
                    const liveStateSummary = buildLiveStateSummary(
                      def,
                      moduleInstance,
                      tickParams,
                      currentTick > 0 ? tickedParamsByModule[moduleInstance.id]?.[currentTick - 1] : undefined,
                    );
                    if (liveStateSummary) {
                      return (
                        <span
                          className={`graph-node-tick-state${
                            liveStateSummary.advancedSinceLastTick ? ' graph-node-tick-state-advanced' : ''
                          }`}
                          title={liveStateSummary.title}
                        >
                          {liveStateSummary.label} {liveStateSummary.displayText}
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
                    const value =
                      signal.type === 'symbol'
                        ? signal.value
                        : signal.type === 'bits'
                          ? `[${signal.value.join(',')}]`
                          : signal.type === 'integer'
                            ? signal.value
                            : formatEcPointAsText(signal.value);
                    return (
                      <span className="graph-node-tick-state" title={`current value = ${value}`}>
                        {value}
                      </span>
                    );
                  })() : null}
                  {activeAnalysisTraceEntry && moduleInstance.id === activeAnalysisOwnerModuleId ? (() => {
                    const signal = activeAnalysisSignalByModuleId[moduleInstance.id];
                    if (!signal) return null;
                    const value =
                      signal.type === 'symbol'
                        ? signal.value
                        : signal.type === 'bits'
                          ? `[${signal.value.join(',')}]`
                          : signal.type === 'integer'
                            ? signal.value
                            : formatEcPointAsText(signal.value);
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

                {(['left', 'right', 'top', 'bottom'] as PortSide[]).map((side) => (
                  <div
                    key={`ports-${side}`}
                    className={`graph-node-anchor-group graph-node-anchor-group-${side}`}
                  >
                    {sidePortGroups[side].inputs.map((port) => {
                      const { sideIndex } = getPortPlacementForModulePort(
                        orderedInputPorts,
                        orderedOutputPorts,
                        position,
                        orientation,
                        'in',
                        port.name,
                      );
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
                          )} graph-port-anchor-${side} graph-port-domain-${port.type}${
                            emphasizedConnectionPortKeys.has(`in:${moduleInstance.id}:${port.name}`)
                              ? ' graph-port-anchor-emphasized'
                              : ''
                          }${
                            snapPendingTargetKey === inputKey ? ' graph-port-snap-preview' : ''
                          }${
                            rejectedPendingTargetKey === inputKey ? ' graph-port-rejecting' : ''
                          }`}
                          style={getPortAnchorStyle(side, sideIndex, nodeSizeConfig)}
                          title={title}
                          onMouseEnter={() => {
                            if (!pendingConnection) {
                              setHoveredPortHintKey(`${moduleInstance.id}:in:${port.name}`);
                              if (!hasIncomingConnection) {
                                onHoveredInputPortChange?.({
                                  moduleId: moduleInstance.id,
                                  defId: moduleInstance.defId,
                                  port: port.name,
                                  type: port.type as SignalType,
                                  kind: getPortKindSignature(
                                    (port as { kind?: PortKind }).kind,
                                  ),
                                });
                              }
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredPortHintKey((current) =>
                              current === `${moduleInstance.id}:in:${port.name}` ? null : current,
                            );
                            onHoveredInputPortChange?.(null);
                          }}
                          onMouseDown={(event) => {
                            if (isObservationMode) {
                              return;
                            }
                            if (pendingConnection) {
                              event.preventDefault();
                              event.stopPropagation();
                              completeConnectionOnInput(moduleInstance.id, port.name);
                              return;
                            }
                            if (!hasIncomingConnection) {
                              return;
                            }
                            event.preventDefault();
                            event.stopPropagation();
                            startConnectionRewireFromInput(moduleInstance.id, port.name);
                          }}
                          onClick={(event) => {
                            if (!pendingConnection) {
                              return;
                            }
                            event.preventDefault();
                            event.stopPropagation();
                            completeConnectionOnInput(moduleInstance.id, port.name);
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
                          <span className="graph-port-direction">IN</span>
                          <span className="graph-port-dot" />
                        </span>
                      );
                    })}
                    {sidePortGroups[side].outputs.map((port) => {
                      const { sideIndex } = getPortPlacementForModulePort(
                        orderedInputPorts,
                        orderedOutputPorts,
                        position,
                        orientation,
                        'out',
                        port.name,
                      );
                      const isReferenceCandidate = isCompatibleReferenceOutput({
                        type: port.type as SignalType,
                        kind: (port as { kind?: PortKind }).kind,
                      });
                      const isReferenceChooserActive = pendingReferenceChainSelection !== null;
                      return (
                      <span
                        key={port.name}
                        className={`${
                          pendingConnection?.fromModuleId === moduleInstance.id &&
                          pendingConnection.fromPort === port.name
                            ? 'graph-port-anchor graph-port-anchor-out graph-port-anchor-active'
                            : 'graph-port-anchor graph-port-anchor-out'
                        } graph-port-anchor-${side} graph-port-domain-${port.type}${
                          emphasizedConnectionPortKeys.has(`out:${moduleInstance.id}:${port.name}`)
                            ? ' graph-port-anchor-emphasized'
                            : ''
                        }${
                          isReferenceChooserActive && isReferenceCandidate
                            ? ' graph-port-reference-candidate'
                            : ''
                        }${
                          isReferenceChooserActive && !isReferenceCandidate
                            ? ' graph-port-reference-inactive'
                            : ''
                        }`}
                        style={getPortAnchorStyle(side, sideIndex, nodeSizeConfig)}
                        title={
                          isCompositePortHintEligible(def)
                            ? undefined
                            : pendingReferenceChainSelection
                              ? isReferenceCandidate
                                ? `Choose ${moduleInstance.id}.${port.name} as reference`
                                : `${port.name}: incompatible reference`
                              : `${port.name}: ${port.type}`
                        }
                        onMouseEnter={() => {
                          if (!pendingConnection) {
                            setHoveredPortHintKey(`${moduleInstance.id}:out:${port.name}`);
                          }
                        }}
                        onMouseLeave={() =>
                          setHoveredPortHintKey((current) =>
                            current === `${moduleInstance.id}:out:${port.name}` ? null : current,
                          )
                        }
                        onMouseDown={(event) => {
                          if (isObservationMode) {
                            return;
                          }
                          if (pendingReferenceChainSelection) {
                            event.preventDefault();
                            event.stopPropagation();
                            if (isReferenceCandidate) {
                              commitReferenceAwareChainSelection(moduleInstance.id, port.name);
                            }
                            return;
                          }
                          event.preventDefault();
                          event.stopPropagation();
                          startConnectionFromOutput(
                            moduleInstance.id,
                            port.name,
                            event.clientX,
                            event.clientY,
                          );
                        }}
                      >
                        {showSignalChips && execution ? (() => {
                          const sig = execution.outputsByModuleId[moduleInstance.id]?.[port.name];
                          if (!sig) return null;
                          const chipText = formatSignalChip(sig);
                          const chipDetail = buildSignalChipDetail(sig);
                          return (
                            <span
                              key={chipText}
                              className={`graph-port-signal-chip graph-port-signal-chip-${sig.type}`}
                              onMouseDown={(event) => {
                                if (isObservationMode || pendingReferenceChainSelection) {
                                  return;
                                }
                                handleSignalChipPointerDown(
                                  event,
                                  startConnectionFromOutput,
                                  moduleInstance.id,
                                  port.name,
                                );
                              }}
                            >
                              {chipText}
                              <span className="graph-port-signal-chip-detail" aria-hidden="true">
                                <span className="graph-port-signal-chip-detail-primary">{chipDetail.primary}</span>
                                {chipDetail.hex ? <span className="graph-port-signal-chip-detail-row">{chipDetail.hex}</span> : null}
                                {chipDetail.decimal ? <span className="graph-port-signal-chip-detail-row">{chipDetail.decimal}</span> : null}
                                <span className="graph-port-signal-chip-detail-meta">{chipDetail.meta}</span>
                              </span>
                            </span>
                          );
                        })() : null}
                        <span className="graph-port-direction">OUT</span>
                        <span className="graph-port-dot" />
                        {renderCompositePortHint({
                          definition: def,
                          moduleId: moduleInstance.id,
                          direction: 'out',
                          portName: port.name,
                          portType: port.type,
                        })}
                      </span>
                    );
                    })}
                  </div>
                ))}
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

          {!tutorialNotesVisible && tutorialStep?.focusModuleId && effectiveLayout[tutorialStep.focusModuleId] ? (() => {
            const focusPos = effectiveLayout[tutorialStep.focusModuleId];
            const CALLOUT_WIDTH = 240;
            const placeRight = focusPos.x + NODE_WIDTH + 18 + CALLOUT_WIDTH < authoredCanvasWidth;
            const placeBelow = focusPos.y < authoredCanvasHeight / 2;
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
                    : `${authoredCanvasHeight - focusPos.y - 6}px`,
                }}
              >
                <span className="meta-label">Focus</span>
                <strong>{tutorialStep.title}</strong>
                <p>{tutorialStep.body}</p>
              </div>
            );
          })() : null}

          {showFurniture && annotations.map((annotation) => (
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

                      setSelectedGuideRailId(null);
                      setSelectedGroupBoxId(null);
                      setSelectedStageLabelId(null);
                      setSelectedConnectionIndex(null);
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

          {showFurniture && stageLabels.map((stageLabel) => {
            const stageLabelX =
              stageLabelDragState?.stageLabelId === stageLabel.id
                ? stageLabelDragState.currentX
                : stageLabel.x;
            const stageLabelY =
              stageLabelDragState?.stageLabelId === stageLabel.id
                ? stageLabelDragState.currentY
                : stageLabel.y;
            const isSelected = effectiveSelectedStageLabelId === stageLabel.id;

            return (
              <div
                key={stageLabel.id}
                className={`canvas-stage-label${isSelected ? ' selected' : ''}`}
                style={{ left: `${stageLabelX}px`, top: `${stageLabelY}px` }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  setSelectedStageLabelId(stageLabel.id);
                  setSelectedGuideRailId(null);
                  setSelectedGroupBoxId(null);
                  setSelectedConnectionIndex(null);
                }}
              >
                <div
                  className="canvas-stage-label-handle"
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
                    setSelectedStageLabelId(stageLabel.id);
                    setSelectedGuideRailId(null);
                    setSelectedGroupBoxId(null);
                    setSelectedConnectionIndex(null);
                    setStageLabelDragState({
                      stageLabelId: stageLabel.id,
                      pointerOffsetX: pointer.x - stageLabel.x,
                      pointerOffsetY: pointer.y - stageLabel.y,
                      initialX: stageLabel.x,
                      initialY: stageLabel.y,
                      currentX: stageLabel.x,
                      currentY: stageLabel.y,
                    });
                  }}
                >
                  <span className="canvas-stage-label-chip">Stage</span>
                  {isSelected ? (
                    <button
                      type="button"
                      className="annotation-delete-button"
                      onClick={(event) => {
                        if (isObservationMode) {
                          return;
                        }
                        event.stopPropagation();
                        onRemoveStageLabel(stageLabel.id);
                        setSelectedStageLabelId((current) =>
                          current === stageLabel.id ? null : current,
                        );
                      }}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                {isSelected ? (
                  <input
                    type="text"
                    value={stageLabel.text}
                    readOnly={isObservationMode}
                    onChange={(event) => onUpdateStageLabelText(stageLabel.id, event.target.value)}
                    onMouseDown={(event) => event.stopPropagation()}
                  />
                ) : (
                  <span className="canvas-stage-label-title">{stageLabel.text}</span>
                )}
              </div>
            );
          })}

          {effectiveSelectedConnectionIndex !== null &&
          activeProjectState.connections[effectiveSelectedConnectionIndex] ? (
            <svg
              className="graph-connections graph-connections-overlay"
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              preserveAspectRatio="none"
            >
              {renderConnection(
                activeProjectState.connections[effectiveSelectedConnectionIndex],
                effectiveSelectedConnectionIndex,
                'overlay',
              )}
            </svg>
          ) : null}
        </div>
        </div>
      </div>
      {showOverviewNavigator ? (
        <div className="workbench-minimap-panel">
          <div className="workbench-minimap-head">
            <span className="meta-label">Overview</span>
            <button
              type="button"
              className="dock-collapse-button"
              onClick={() => onSetOverviewNavigatorVisible(false)}
              aria-label="Hide navigator"
            >
              −
            </button>
          </div>
          <div
            id={`workbench-minimap-${activeProject.id}`}
            className="workbench-minimap"
            onMouseDown={(event) => {
              event.preventDefault();
              panToMinimapPoint(event.clientX, event.clientY, true);
            }}
          >
            <div
              className="workbench-minimap-content"
              style={{
                width: `${minimapMetrics.contentWidth}px`,
                height: `${minimapMetrics.contentHeight}px`,
                left: `${minimapMetrics.offsetX}px`,
                top: `${minimapMetrics.offsetY}px`,
              }}
            >
              {showFurniture && groupBoxes.map((groupBox) => (
                <div
                  key={groupBox.id}
                  className={`workbench-minimap-group workbench-minimap-group-${groupBox.variant ?? 'stage'}`}
                  style={{
                    left: `${groupBox.x * minimapMetrics.scale}px`,
                    top: `${groupBox.y * minimapMetrics.scale}px`,
                    width: `${groupBox.width * minimapMetrics.scale}px`,
                    height: `${groupBox.height * minimapMetrics.scale}px`,
                  }}
                />
              ))}
              {Object.entries(effectiveLayout).map(([moduleId, position]) => (
                <div
                  key={moduleId}
                  className={`workbench-minimap-node${
                    selectedModuleIds.includes(moduleId) ? ' selected' : ''
                  }`}
                  style={{
                    left: `${position.x * minimapMetrics.scale}px`,
                    top: `${position.y * minimapMetrics.scale}px`,
                    width: `${NODE_WIDTH * minimapMetrics.scale}px`,
                    height: `${NODE_HEIGHT * minimapMetrics.scale}px`,
                  }}
                />
              ))}
              {showFurniture && annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="workbench-minimap-annotation"
                  style={{
                    left: `${annotation.x * minimapMetrics.scale}px`,
                    top: `${annotation.y * minimapMetrics.scale}px`,
                  }}
                />
              ))}
              {showFurniture && stageLabels.map((stageLabel) => (
                <div
                  key={stageLabel.id}
                  className="workbench-minimap-stage-label"
                  style={{
                    left: `${stageLabel.x * minimapMetrics.scale}px`,
                    top: `${stageLabel.y * minimapMetrics.scale}px`,
                  }}
                />
              ))}
              <div
                className="workbench-minimap-viewport"
                style={{
                  left: `${minimapViewportRect.left - minimapMetrics.offsetX}px`,
                  top: `${minimapViewportRect.top - minimapMetrics.offsetY}px`,
                  width: `${minimapViewportRect.width}px`,
                  height: `${minimapViewportRect.height}px`,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      </div>
      <button
        type="button"
        className="canvas-height-resize-handle"
        aria-label="Resize canvas"
        title="Drag to resize canvas"
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
              {validationIssues.length - 1} more issue{validationIssues.length === 2 ? '' : 's'} in the inspector.
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
        {execution && !isCompositeEditor ? (
          <button
            type="button"
            className={`graph-meta-chip-toggle${showSignalChips ? '' : ' graph-meta-chip-toggle-off'}`}
            title={showSignalChips ? 'Hide signal chips' : 'Show signal chips'}
            onClick={() => setShowSignalChips((v) => !v)}
          >
            {showSignalChips ? 'Chips \u25cf' : 'Chips \u25cb'}
          </button>
        ) : null}
      </div>
      <div className="graph-meta graph-meta-legend" aria-label="Wire domain legend">
        {DOMAIN_LEGEND_ITEMS.map((item) => (
          <span key={item.domain} className="workbench-domain-legend-item">
            <span
              className={`workbench-domain-legend-swatch workbench-domain-legend-swatch-${item.domain}`}
              aria-hidden="true"
            />
            <span className="workbench-domain-legend-label">{item.label}</span>
          </span>
        ))}
      </div>

      {quickAdd ? (
        <Suspense>
          <CanvasQuickAdd
            clientX={quickAdd.clientX}
            clientY={quickAdd.clientY}
            canvasX={quickAdd.canvasX}
            canvasY={quickAdd.canvasY}
            registry={registry}
            onAdd={quickAdd.mode === 'plain' ? onAddModule : undefined}
            options={quickAdd.mode === 'connect' ? compatibleQuickAddOptions : undefined}
            placeholder={
              quickAdd.mode === 'connect'
                ? 'Add compatible module…'
                : 'Add module…'
            }
            emptyMessage={
              quickAdd.mode === 'connect'
                ? 'No modules accept this signal type.'
                : 'No matching modules.'
            }
            onDismiss={() => setQuickAdd(null)}
          />
        </Suspense>
      ) : null}
      {pendingReferenceChainSelection ? (
        <div className="reference-chain-choice-banner">
          <strong>{pendingReferenceChainSelection.chain.label}</strong>
          <span>Choose visible reference sequence</span>
          <button
            type="button"
            className="secondary-dialog-button"
            onClick={clearReferenceChainSelection}
          >
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  );
}
