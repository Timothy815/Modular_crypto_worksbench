import type { ReactNode } from 'react';

import type { AutoWireMode } from '../autowire-selection';
import type {
  WorkbenchConnectionColorOverride,
  WorkbenchLayoutDirection,
  WorkbenchRoutingMode,
  WorkbenchWireColorMode,
} from '../workbench-document';

interface WorkbenchActionsProps {
  isCompositeEditor: boolean;
  isObservationMode?: boolean;
  theme: 'light' | 'dark';
  layoutDirection: WorkbenchLayoutDirection;
  routingMode: WorkbenchRoutingMode;
  wireColorMode: WorkbenchWireColorMode;
  showOverviewNavigator: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedModuleIds: string[];
  selectedFurnitureKind: 'stage-label' | 'group-box' | 'guide-rail' | null;
  selectedFurnitureTitle: string | null;
  selectedFurnitureDetailPrimary: string | null;
  selectedFurnitureDetailSecondary: string | null;
  effectiveSelectedConnectionIndex: number | null;
  selectedConnectionHasManualPath: boolean;
  selectedConnectionWaypointMode: boolean;
  selectedConnectionSourceLabel: string | null;
  selectedConnectionTargetLabel: string | null;
  selectedConnectionDomainTone: 'bits' | 'symbol' | null;
  selectedConnectionLaneAxis: 'x' | 'y' | null;
  selectedConnectionLanePreference: 'negative' | 'positive' | null;
  selectedConnectionColorOverride: WorkbenchConnectionColorOverride | null;
  furnitureVisible: boolean;
  tutorialNotesVisible: boolean;
  onAddAnnotation: () => void;
  onAddStageLabel: () => void;
  onExportDocument: () => void;
  onExportLabPack: () => void;
  onExportPython: () => void;
  onTidyLayout: () => void;
  onTidySelection: () => void;
  onSetLayoutDirection: (direction: WorkbenchLayoutDirection) => void;
  onSetRoutingMode: (mode: WorkbenchRoutingMode) => void;
  onSetWireColorMode: (mode: WorkbenchWireColorMode) => void;
  onToggleOverviewNavigator: (visible: boolean) => void;
  onToggleGrid: (visible: boolean) => void;
  onToggleSnapToGrid: (enabled: boolean) => void;
  onToggleSnapToGuides: (enabled: boolean) => void;
  onRequestUndo: () => void;
  onRequestRedo: () => void;
  onToggleTheme: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetView: () => void;
  onFitView: () => void;
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
  onRequestAddGroupBox: () => void;
  onRequestAddGroupBoxFromSelection: () => void;
  onRequestAddGuideRail: (axis: 'horizontal' | 'vertical') => void;
  onRequestAutoWire: (mode: AutoWireMode) => void;
  onRequestDuplicateSelection: () => void;
  onRequestRepeatSelectionRight: () => void;
  onRequestCopySelectionToWorkspace: () => void;
  onRequestDeleteSelection: () => void;
  onRequestDeleteWire: () => void;
  onRequestToggleWireWaypointMode: () => void;
  onRequestResetWirePath: () => void;
  onRequestSetWireLanePreference: (preference: 'negative' | 'positive') => void;
  onRequestClearWireLanePreference: () => void;
  onRequestSetWireColorOverride: (color: WorkbenchConnectionColorOverride) => void;
  onRequestClearWireColorOverride: () => void;
  onRequestImport: () => void;
  onRequestImportLabPack: () => void;
  onRequestCreateComposite: () => void;
  onRequestCreateIterator: () => void;
  onRequestCreateClockedIterator: () => void;
  onRequestCreateConditional: () => void;
  onRequestCreateMultiConditional: () => void;
  onToggleFurnitureVisible: (visible: boolean) => void;
  onToggleTutorialNotes?: (visible: boolean) => void;
}

interface WorkbenchMenuAction {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  title?: string;
}

const WIRE_COLOR_OVERRIDE_OPTIONS: Array<{
  color: WorkbenchConnectionColorOverride;
  label: string;
}> = [
  { color: 'red', label: 'Red Wire' },
  { color: 'orange', label: 'Orange Wire' },
  { color: 'gold', label: 'Gold Wire' },
  { color: 'green', label: 'Green Wire' },
  { color: 'teal', label: 'Teal Wire' },
  { color: 'blue', label: 'Blue Wire' },
  { color: 'violet', label: 'Violet Wire' },
  { color: 'rose', label: 'Rose Wire' },
];

function getLaneStateLabel(
  axis: 'x' | 'y' | null,
  preference: 'negative' | 'positive' | null,
): string {
  if (axis === null || preference === null) {
    return 'Lane Neutral';
  }

  if (axis === 'x') {
    return preference === 'negative' ? 'Lane Left' : 'Lane Right';
  }

  return preference === 'negative' ? 'Lane Upper' : 'Lane Lower';
}

function getWireColorStateLabel(color: WorkbenchConnectionColorOverride | null): string {
  if (color === null) {
    return 'Color Auto';
  }

  const option = WIRE_COLOR_OVERRIDE_OPTIONS.find((candidate) => candidate.color === color);
  return option ? `Color ${option.label.replace(' Wire', '')}` : 'Color Custom';
}

interface WorkbenchActionMenuProps {
  label: string;
  description?: string;
  children: ReactNode;
}

function WorkbenchActionMenu({ label, description, children }: WorkbenchActionMenuProps) {
  return (
    <details className="workbench-action-menu">
      <summary className="workbench-action-menu-trigger" title={description}>
        <span className="workbench-action-menu-label">{label}</span>
      </summary>
      <div className="workbench-action-menu-panel">{children}</div>
    </details>
  );
}

function WorkbenchMenuActionButton({
  label,
  onSelect,
  disabled = false,
  title,
}: WorkbenchMenuAction) {
  return (
    <button
      type="button"
      className="workbench-menu-action-button"
      disabled={disabled}
      title={title}
      onClick={(event) => {
        onSelect();
        event.currentTarget.closest('details')?.removeAttribute('open');
      }}
    >
      {label}
    </button>
  );
}

interface WorkbenchInlineActionButtonProps {
  content: ReactNode;
  title: string;
  onSelect: () => void;
  disabled?: boolean;
  active?: boolean;
}

function WorkbenchInlineActionButton({
  content,
  title,
  onSelect,
  disabled = false,
  active = false,
}: WorkbenchInlineActionButtonProps) {
  return (
    <button
      type="button"
      className={`workbench-inline-action-button${active ? ' active' : ''}`}
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      disabled={disabled}
      onClick={onSelect}
    >
      {content}
    </button>
  );
}

type WorkbenchInlineIconName =
  | 'zoom-out'
  | 'zoom-in'
  | 'theme-toggle'
  | 'fit-view'
  | 'reset-view'
  | 'undo'
  | 'redo'
  | 'layout-horizontal'
  | 'layout-vertical'
  | 'routing-curved'
  | 'routing-orthogonal'
  | 'wire-color-domain'
  | 'wire-color-neutral'
  | 'wire-color-high-contrast'
  | 'overview'
  | 'grid'
  | 'snap'
  | 'snap-guides'
  | 'hide-furniture'
  | 'autowire-match'
  | 'autowire-ltr'
  | 'autowire-ttb'
  | 'save-version'
  | 'delete-wire'
  | 'reset-wire'
  | 'stage-row'
  | 'stage-column'
  | 'align-left'
  | 'align-right'
  | 'align-top'
  | 'align-bottom'
  | 'align-horizontal-center'
  | 'align-vertical-center'
  | 'distribute-horizontal'
  | 'distribute-vertical';

function WorkbenchInlineIcon({ name }: { name: WorkbenchInlineIconName }) {
  switch (name) {
    case 'zoom-out':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="4.5" />
          <path d="M5.5 8.5h6M12 12l4 4" />
        </svg>
      );
    case 'zoom-in':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="4.5" />
          <path d="M5.5 8.5h6M8.5 5.5v6M12 12l4 4" />
        </svg>
      );
    case 'theme-toggle':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3.2a6.8 6.8 0 1 0 6.8 6.8A5.7 5.7 0 0 1 10 3.2Z" />
        </svg>
      );
    case 'fit-view':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7 4H4v3M13 4h3v3M4 13v3h3M16 13v3h-3" />
        </svg>
      );
    case 'reset-view':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 4a6 6 0 1 1-5.2 3M4.8 4.6v3.6h3.6" />
        </svg>
      );
    case 'undo':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7 6 4 9l3 3M4 9h7a4 4 0 0 1 4 4" />
        </svg>
      );
    case 'redo':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="m13 6 3 3-3 3M16 9H9a4 4 0 0 0-4 4" />
        </svg>
      );
    case 'layout-horizontal':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="2.5" y="6" width="4" height="8" rx="1.2" />
          <rect x="8" y="6" width="4" height="8" rx="1.2" />
          <rect x="13.5" y="6" width="4" height="8" rx="1.2" />
        </svg>
      );
    case 'layout-vertical':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="6" y="2.5" width="8" height="4" rx="1.2" />
          <rect x="6" y="8" width="8" height="4" rx="1.2" />
          <rect x="6" y="13.5" width="8" height="4" rx="1.2" />
        </svg>
      );
    case 'routing-curved':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 14C4 8 7 6 10 6s6 2 6 8" />
        </svg>
      );
    case 'routing-orthogonal':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 14V8h6V4h6" />
        </svg>
      );
    case 'wire-color-domain':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 6h14M3 14h14" />
          <circle cx="7" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="13" cy="14" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'wire-color-neutral':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 10h14" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'wire-color-high-contrast':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 6h14M3 14h14M10 4v12" />
        </svg>
      );
    case 'overview':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3" y="4" width="14" height="12" rx="1.5" />
          <rect x="6" y="7" width="5" height="4" rx="0.8" />
          <rect x="11.5" y="10" width="3" height="2.5" rx="0.6" />
        </svg>
      );
    case 'grid':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 4h12M4 8h12M4 12h12M4 16h12M4 4v12M8 4v12M12 4v12M16 4v12" />
        </svg>
      );
    case 'snap':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3v5M7.5 5.5h5M10 17v-4M14.5 10H17M3 10h4M5.3 5.3l2.8 2.8M11.9 11.9l2.8 2.8M14.7 5.3l-2.8 2.8M8.1 11.9l-2.8 2.8" />
          <rect x="8" y="8" width="4" height="4" rx="0.9" />
        </svg>
      );
    case 'snap-guides':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6 3v14M14 3v14M3 10h14" />
          <rect x="8" y="8" width="4" height="4" rx="0.9" />
        </svg>
      );
    case 'hide-furniture':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3" y="6" width="14" height="10" rx="1.5" strokeDasharray="3 1.5" />
          <rect x="3" y="4" width="5" height="3" rx="0.8" fill="currentColor" stroke="none" />
          <path d="M6 9h8M6 12h5" />
        </svg>
      );
    case 'autowire-match':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="2" y="5" width="5" height="10" rx="1.2" />
          <rect x="13" y="5" width="5" height="10" rx="1.2" />
          <path d="M7 8h2.5M7 12h2.5M10.5 8H13M10.5 12H13" />
          <path d="M9.5 8v4" strokeDasharray="2 1" />
        </svg>
      );
    case 'autowire-ltr':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="2" y="6" width="5" height="8" rx="1.2" />
          <rect x="13" y="6" width="5" height="8" rx="1.2" />
          <path d="M7 10h6M11 8l2 2-2 2" />
        </svg>
      );
    case 'autowire-ttb':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="6" y="2" width="8" height="5" rx="1.2" />
          <rect x="6" y="13" width="8" height="5" rx="1.2" />
          <path d="M10 7v6M8 11l2 2 2-2" />
        </svg>
      );
    case 'save-version':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 4h9l3 3v9H4z" />
          <rect x="6" y="4.5" width="6" height="4" rx="0.8" />
          <rect x="7" y="12" width="6" height="3.5" rx="0.8" />
        </svg>
      );
    case 'delete-wire':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 6c4 0 4 8 8 8M4 14c4 0 4-8 8-8M13 6l3 3-3 3M13 11l3 3" />
        </svg>
      );
    case 'reset-wire':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 14V9h5V5h5M10 14a5 5 0 0 0 5-5" />
        </svg>
      );
    case 'stage-row':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="2" y="6" width="4" height="8" rx="1.5" />
          <rect x="8" y="6" width="4" height="8" rx="1.5" />
          <rect x="14" y="6" width="4" height="8" rx="1.5" />
        </svg>
      );
    case 'stage-column':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="6" y="2" width="8" height="4" rx="1.5" />
          <rect x="6" y="8" width="8" height="4" rx="1.5" />
          <rect x="6" y="14" width="8" height="4" rx="1.5" />
        </svg>
      );
    case 'align-left':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 3v14" />
          <rect x="6" y="4" width="9" height="3" rx="1.2" />
          <rect x="6" y="9" width="6" height="3" rx="1.2" />
          <rect x="6" y="14" width="11" height="3" rx="1.2" />
        </svg>
      );
    case 'align-right':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M16 3v14" />
          <rect x="5" y="4" width="9" height="3" rx="1.2" />
          <rect x="8" y="9" width="6" height="3" rx="1.2" />
          <rect x="3" y="14" width="11" height="3" rx="1.2" />
        </svg>
      );
    case 'align-top':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 4h14" />
          <rect x="4" y="6" width="3" height="9" rx="1.2" />
          <rect x="9" y="6" width="3" height="6" rx="1.2" />
          <rect x="14" y="6" width="3" height="11" rx="1.2" />
        </svg>
      );
    case 'align-bottom':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 16h14" />
          <rect x="4" y="5" width="3" height="9" rx="1.2" />
          <rect x="9" y="8" width="3" height="6" rx="1.2" />
          <rect x="14" y="3" width="3" height="11" rx="1.2" />
        </svg>
      );
    case 'align-horizontal-center':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3v14" />
          <rect x="6" y="4" width="8" height="3" rx="1.2" />
          <rect x="7.5" y="9" width="5" height="3" rx="1.2" />
          <rect x="4.5" y="14" width="11" height="3" rx="1.2" />
        </svg>
      );
    case 'align-vertical-center':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 10h14" />
          <rect x="4" y="6" width="3" height="8" rx="1.2" />
          <rect x="9" y="7.5" width="3" height="5" rx="1.2" />
          <rect x="14" y="4.5" width="3" height="11" rx="1.2" />
        </svg>
      );
    case 'distribute-horizontal':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 4v12M16 4v12" />
          <rect x="6" y="7" width="2.5" height="6" rx="1.2" />
          <rect x="11.5" y="7" width="2.5" height="6" rx="1.2" />
        </svg>
      );
    case 'distribute-vertical':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 4h12M4 16h12" />
          <rect x="7" y="6" width="6" height="2.5" rx="1.2" />
          <rect x="7" y="11.5" width="6" height="2.5" rx="1.2" />
        </svg>
      );
  }
}

function WorkbenchWireColorSwatch({ color }: { color: WorkbenchConnectionColorOverride }) {
  return <span className={`workbench-wire-color-swatch workbench-wire-color-swatch-${color}`} />;
}

function WorkbenchInlineStateChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'active';
}) {
  return (
    <span className={`workbench-inline-state-chip${tone === 'active' ? ' active' : ''}`}>{label}</span>
  );
}

function WorkbenchWireDetailsRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="workbench-wire-details-row">
      <span className="workbench-wire-details-label">{label}</span>
      <code className="workbench-wire-details-value">{value}</code>
    </div>
  );
}

function WorkbenchFurnitureDetailsCard({
  kind,
  title,
  detailPrimary,
  detailSecondary,
}: {
  kind: 'stage-label' | 'group-box' | 'guide-rail';
  title: string;
  detailPrimary: string | null;
  detailSecondary: string | null;
}) {
  const kindLabel =
    kind === 'stage-label' ? 'Stage Label' : kind === 'group-box' ? 'Group Box' : 'Guide Rail';

  return (
    <div className="workbench-wire-details-card workbench-furniture-details-card" aria-label="Selected layout details">
      <div className="workbench-wire-details-head">
        <span className="meta-label">{kindLabel}</span>
      </div>
      <WorkbenchWireDetailsRow label="Title" value={title} />
      {detailPrimary ? <WorkbenchWireDetailsRow label="Info" value={detailPrimary} /> : null}
      {detailSecondary ? <WorkbenchWireDetailsRow label="Detail" value={detailSecondary} /> : null}
    </div>
  );
}

function WorkbenchSelectionDetailsSection({
  kindLabel,
  toneLabel,
  children,
}: {
  kindLabel: string;
  toneLabel?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="workbench-selection-details" aria-label="Selection details">
      <div className="workbench-selection-details-head">
        <span className="meta-label">Selection</span>
        <div className="workbench-selection-details-chips">
          <WorkbenchInlineStateChip label={kindLabel} tone="active" />
          {toneLabel ? <WorkbenchInlineStateChip label={toneLabel} tone="neutral" /> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function WorkbenchActions({
  isCompositeEditor,
  isObservationMode = false,
  theme,
  layoutDirection,
  routingMode,
  wireColorMode,
  showOverviewNavigator,
  showGrid,
  snapToGrid,
  snapToGuides,
  canUndo,
  canRedo,
  selectedModuleIds,
  selectedFurnitureKind,
  selectedFurnitureTitle,
  selectedFurnitureDetailPrimary,
  selectedFurnitureDetailSecondary,
  effectiveSelectedConnectionIndex,
  selectedConnectionHasManualPath,
  selectedConnectionWaypointMode,
  selectedConnectionSourceLabel,
  selectedConnectionTargetLabel,
  selectedConnectionDomainTone,
  selectedConnectionLaneAxis,
  selectedConnectionLanePreference,
  selectedConnectionColorOverride,
  furnitureVisible,
  tutorialNotesVisible,
  onAddAnnotation,
  onAddStageLabel,
  onExportDocument,
  onExportLabPack,
  onExportPython,
  onTidyLayout,
  onTidySelection,
  onSetLayoutDirection,
  onSetRoutingMode,
  onSetWireColorMode,
  onToggleOverviewNavigator,
  onToggleGrid,
  onToggleSnapToGrid,
  onToggleSnapToGuides,
  onRequestUndo,
  onRequestRedo,
  onToggleTheme,
  onZoomOut,
  onZoomIn,
  onResetView,
  onFitView,
  onRequestSaveVersion,
  onRequestArrangeSelection,
  onRequestAddGroupBox,
  onRequestAddGroupBoxFromSelection,
  onRequestAddGuideRail,
  onRequestAutoWire,
  onRequestDuplicateSelection,
  onRequestRepeatSelectionRight,
  onRequestCopySelectionToWorkspace,
  onRequestDeleteSelection,
  onRequestDeleteWire,
  onRequestToggleWireWaypointMode,
  onRequestResetWirePath,
  onRequestSetWireLanePreference,
  onRequestClearWireLanePreference,
  onRequestSetWireColorOverride,
  onRequestClearWireColorOverride,
  onRequestImport,
  onRequestImportLabPack,
  onRequestCreateComposite,
  onRequestCreateIterator,
  onRequestCreateClockedIterator,
  onRequestCreateConditional,
  onRequestCreateMultiConditional,
  onToggleFurnitureVisible,
  onToggleTutorialNotes,
}: WorkbenchActionsProps) {
  const hasSelection = selectedModuleIds.length > 0;
  const canDeleteWire = effectiveSelectedConnectionIndex !== null;
  const canAdjustWireLane = effectiveSelectedConnectionIndex !== null && selectedConnectionLaneAxis !== null;
  const negativeLaneLabel =
    selectedConnectionLaneAxis === 'x' ? 'Prefer Left Lane' : 'Prefer Upper Lane';
  const positiveLaneLabel =
    selectedConnectionLaneAxis === 'x' ? 'Prefer Right Lane' : 'Prefer Lower Lane';
  const currentPathLabel = selectedConnectionHasManualPath ? 'Path Manual' : 'Path Auto';
  const currentLaneLabel = getLaneStateLabel(
    selectedConnectionLaneAxis,
    selectedConnectionLanePreference,
  );
  const currentColorLabel = getWireColorStateLabel(selectedConnectionColorOverride);
  const canAlignSelection = selectedModuleIds.length >= 2;
  const canDistributeSelection = selectedModuleIds.length >= 3;
  const showSelectionToolbar = canAlignSelection;
  const showWireToolbar = canDeleteWire;
  const showViewMenu = Boolean(onToggleTutorialNotes);
  const currentDomainLabel =
    selectedConnectionDomainTone === 'bits'
      ? 'Domain Bits'
      : selectedConnectionDomainTone === 'symbol'
        ? 'Domain Symbol'
        : 'Domain Mixed';
  const hasSelectionDetails = Boolean(selectedFurnitureKind && selectedFurnitureTitle) || showWireToolbar;

  return (
    <div className="project-actions">
      {isObservationMode ? (
        <WorkbenchActionMenu label="View" description="Zoom and navigate">
          <WorkbenchMenuActionButton label="Zoom Out" onSelect={onZoomOut} />
          <WorkbenchMenuActionButton label="Zoom In" onSelect={onZoomIn} />
          <WorkbenchMenuActionButton label="Reset View" onSelect={onResetView} />
          <WorkbenchMenuActionButton label="Fit View" onSelect={onFitView} />
        </WorkbenchActionMenu>
      ) : !isCompositeEditor ? (
        <>
          <div className="workbench-inline-toolbar workbench-quick-actions" aria-label="Quick workbench actions">
            <div className="workbench-inline-toolbar-group" aria-label="Navigation tools">
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="theme-toggle" />}
                title={theme === 'dark' ? 'Switch To Light Mode' : 'Switch To Dark Mode'}
                onSelect={onToggleTheme}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="zoom-out" />}
                title="Zoom Out"
                onSelect={onZoomOut}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="zoom-in" />}
                title="Zoom In"
                onSelect={onZoomIn}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="fit-view" />}
                title="Fit View"
                onSelect={onFitView}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="reset-view" />}
                title="Reset View"
                onSelect={onResetView}
              />
            </div>
            <div className="workbench-inline-toolbar-group" aria-label="History tools">
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="undo" />}
                title="Undo (Cmd/Ctrl+Z)"
                onSelect={onRequestUndo}
                disabled={!canUndo}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="redo" />}
                title="Redo (Cmd/Ctrl+Shift+Z)"
                onSelect={onRequestRedo}
                disabled={!canRedo}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="save-version" />}
                title="Save Version"
                onSelect={onRequestSaveVersion}
              />
            </div>
            <div className="workbench-inline-toolbar-group" aria-label="Layout mode tools">
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="layout-horizontal" />}
                title="Horizontal Layout"
                onSelect={() => onSetLayoutDirection('horizontal')}
                active={layoutDirection === 'horizontal'}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="layout-vertical" />}
                title="Vertical Layout"
                onSelect={() => onSetLayoutDirection('vertical')}
                active={layoutDirection === 'vertical'}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="routing-curved" />}
                title="Curved Routing"
                onSelect={() => onSetRoutingMode('curved')}
                active={routingMode === 'curved'}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="routing-orthogonal" />}
                title="Orthogonal Routing"
                onSelect={() => onSetRoutingMode('orthogonal')}
                active={routingMode === 'orthogonal'}
              />
            </div>
            <div className="workbench-inline-toolbar-group" aria-label="View aid tools">
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="wire-color-domain" />}
                title="Domain Wire Colors"
                onSelect={() => onSetWireColorMode('domain')}
                active={wireColorMode === 'domain'}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="wire-color-neutral" />}
                title="Neutral Wire Colors"
                onSelect={() => onSetWireColorMode('neutral')}
                active={wireColorMode === 'neutral'}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="wire-color-high-contrast" />}
                title="High Contrast Wire Colors"
                onSelect={() => onSetWireColorMode('high-contrast')}
                active={wireColorMode === 'high-contrast'}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="overview" />}
                title={showOverviewNavigator ? 'Hide Overview Navigator' : 'Show Overview Navigator'}
                onSelect={() => onToggleOverviewNavigator(!showOverviewNavigator)}
                active={showOverviewNavigator}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="grid" />}
                title={showGrid ? 'Hide Grid' : 'Show Grid'}
                onSelect={() => onToggleGrid(!showGrid)}
                active={showGrid}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="snap" />}
                title={snapToGrid ? 'Disable Snap To Grid' : 'Enable Snap To Grid'}
                onSelect={() => onToggleSnapToGrid(!snapToGrid)}
                active={snapToGrid}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="snap-guides" />}
                title={snapToGuides ? 'Disable Snap To Guides' : 'Enable Snap To Guides'}
                onSelect={() => onToggleSnapToGuides(!snapToGuides)}
                active={snapToGuides}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="hide-furniture" />}
                title={furnitureVisible ? 'Hide Furniture' : 'Show Furniture'}
                onSelect={() => onToggleFurnitureVisible(!furnitureVisible)}
                active={!furnitureVisible}
              />
            </div>
          </div>

          <div className="workbench-inline-toolbar" aria-label="Layout tools">
            <span className="meta-label">Layout</span>
            <WorkbenchInlineActionButton
              content="Tidy"
              title="Tidy Layout"
              onSelect={onTidyLayout}
            />
          </div>

          {showSelectionToolbar ? (
            <div className="workbench-inline-toolbar" aria-label="Selection layout tools">
              <span className="meta-label">Selection</span>
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="stage-row" />}
                title="Arrange Selected Stage Row"
                onSelect={() => onRequestArrangeSelection('stage-row')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="stage-column" />}
                title="Stack Selected Stage Column"
                onSelect={() => onRequestArrangeSelection('stage-column')}
              />
              <WorkbenchInlineActionButton
                content="Tidy"
                title="Tidy Selection"
                onSelect={onTidySelection}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="align-left" />}
                title="Align Left"
                onSelect={() => onRequestArrangeSelection('align-left')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="align-right" />}
                title="Align Right"
                onSelect={() => onRequestArrangeSelection('align-right')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="align-top" />}
                title="Align Top"
                onSelect={() => onRequestArrangeSelection('align-top')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="align-bottom" />}
                title="Align Bottom"
                onSelect={() => onRequestArrangeSelection('align-bottom')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="align-horizontal-center" />}
                title="Align Horizontal Center"
                onSelect={() => onRequestArrangeSelection('align-horizontal-center')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="align-vertical-center" />}
                title="Align Vertical Center"
                onSelect={() => onRequestArrangeSelection('align-vertical-center')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="distribute-horizontal" />}
                title="Distribute Horizontally"
                onSelect={() => onRequestArrangeSelection('distribute-horizontal')}
                disabled={!canDistributeSelection}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="distribute-vertical" />}
                title="Distribute Vertically"
                onSelect={() => onRequestArrangeSelection('distribute-vertical')}
                disabled={!canDistributeSelection}
              />
            </div>
          ) : null}

          {canAlignSelection ? (
            <div className="workbench-inline-toolbar" aria-label="Auto-wire tools">
              <span className="meta-label">Wire</span>
              <WorkbenchInlineActionButton
                content="Repeat"
                title="Repeat Selection To The Right"
                onSelect={onRequestRepeatSelectionRight}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="autowire-match" />}
                title="Connect Matching Ports (fill missing connections by exact port-name match)"
                onSelect={() => onRequestAutoWire('matching-ports')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="autowire-ltr" />}
                title="Connect Left-to-Right (connect adjacent modules sorted by horizontal position)"
                onSelect={() => onRequestAutoWire('left-to-right')}
              />
              <WorkbenchInlineActionButton
                content={<WorkbenchInlineIcon name="autowire-ttb" />}
                title="Connect Top-to-Bottom (connect adjacent modules sorted by vertical position)"
                onSelect={() => onRequestAutoWire('top-to-bottom')}
              />
            </div>
          ) : null}

          {hasSelectionDetails ? (
            <WorkbenchSelectionDetailsSection
              kindLabel={
                showWireToolbar
                  ? 'Wire'
                  : selectedFurnitureKind === 'stage-label'
                    ? 'Stage Label'
                    : selectedFurnitureKind === 'group-box'
                      ? 'Group Box'
                      : 'Guide Rail'
              }
              toneLabel={showWireToolbar ? currentDomainLabel : null}
            >
              {selectedFurnitureKind && selectedFurnitureTitle ? (
                <WorkbenchFurnitureDetailsCard
                  kind={selectedFurnitureKind}
                  title={selectedFurnitureTitle}
                  detailPrimary={selectedFurnitureDetailPrimary}
                  detailSecondary={selectedFurnitureDetailSecondary}
                />
              ) : null}

              {showWireToolbar ? (
                <div className="workbench-wire-tools-group">
                  <div className="workbench-inline-toolbar" aria-label="Wire tools">
                    <span className="meta-label">Wire</span>
                    <WorkbenchInlineStateChip
                      label={currentPathLabel}
                      tone={selectedConnectionHasManualPath ? 'active' : 'neutral'}
                    />
                    <WorkbenchInlineStateChip
                      label={currentLaneLabel}
                      tone={selectedConnectionLanePreference ? 'active' : 'neutral'}
                    />
                    <WorkbenchInlineStateChip
                      label={currentColorLabel}
                      tone={selectedConnectionColorOverride ? 'active' : 'neutral'}
                    />
                    <span className="workbench-inline-toolbar-divider" aria-hidden="true" />
                    <WorkbenchInlineActionButton
                      content="Waypoints"
                      title={
                        selectedConnectionWaypointMode ? 'Exit Waypoint Mode' : 'Enter Waypoint Mode'
                      }
                      onSelect={onRequestToggleWireWaypointMode}
                      active={selectedConnectionWaypointMode}
                      disabled={!canAdjustWireLane}
                    />
                    <WorkbenchInlineActionButton
                      content={<WorkbenchInlineIcon name="delete-wire" />}
                      title="Delete Selected Wire"
                      onSelect={onRequestDeleteWire}
                    />
                    <WorkbenchInlineActionButton
                      content={<WorkbenchInlineIcon name="reset-wire" />}
                      title="Reset Selected Wire Path"
                      onSelect={onRequestResetWirePath}
                      disabled={!selectedConnectionHasManualPath}
                    />
                    <WorkbenchInlineActionButton
                      content={negativeLaneLabel}
                      title={negativeLaneLabel}
                      onSelect={() => onRequestSetWireLanePreference('negative')}
                      disabled={!canAdjustWireLane || selectedConnectionLanePreference === 'negative'}
                    />
                    <WorkbenchInlineActionButton
                      content="Neutral"
                      title="Neutral Lane"
                      onSelect={onRequestClearWireLanePreference}
                      disabled={!canAdjustWireLane || selectedConnectionLanePreference === null}
                    />
                    <WorkbenchInlineActionButton
                      content={positiveLaneLabel}
                      title={positiveLaneLabel}
                      onSelect={() => onRequestSetWireLanePreference('positive')}
                      disabled={!canAdjustWireLane || selectedConnectionLanePreference === 'positive'}
                    />
                    <span className="workbench-inline-toolbar-divider" aria-hidden="true" />
                    {WIRE_COLOR_OVERRIDE_OPTIONS.map(({ color, label }) => (
                      <WorkbenchInlineActionButton
                        key={color}
                        content={<WorkbenchWireColorSwatch color={color} />}
                        title={label}
                        onSelect={() => onRequestSetWireColorOverride(color)}
                        active={selectedConnectionColorOverride === color}
                      />
                    ))}
                    <WorkbenchInlineActionButton
                      content="Auto"
                      title="Reset To Workspace Wire Colors"
                      onSelect={onRequestClearWireColorOverride}
                      disabled={selectedConnectionColorOverride === null}
                    />
                  </div>
                  <div className="workbench-wire-details-card" aria-label="Selected wire details">
                    <WorkbenchWireDetailsRow
                      label="From"
                      value={selectedConnectionSourceLabel ?? 'n/a'}
                    />
                    <WorkbenchWireDetailsRow
                      label="To"
                      value={selectedConnectionTargetLabel ?? 'n/a'}
                    />
                  </div>
                </div>
              ) : null}
            </WorkbenchSelectionDetailsSection>
          ) : null}

          {showViewMenu ? (
            <WorkbenchActionMenu label="View" description="Optional overlays">
              <WorkbenchMenuActionButton
                label={tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
                onSelect={() => onToggleTutorialNotes?.(!tutorialNotesVisible)}
              />
            </WorkbenchActionMenu>
          ) : null}

          <WorkbenchActionMenu label="Structure" description="Author and group">
            <WorkbenchMenuActionButton label="Add Note" onSelect={onAddAnnotation} />
            <WorkbenchMenuActionButton label="Add Stage Label" onSelect={onAddStageLabel} />
            <WorkbenchMenuActionButton
              label="Create Composite"
              onSelect={onRequestCreateComposite}
              disabled={!hasSelection}
            />
            <WorkbenchMenuActionButton
              label="Create Iterator"
              onSelect={onRequestCreateIterator}
            />
            <WorkbenchMenuActionButton
              label="Create Clocked Iterator"
              onSelect={onRequestCreateClockedIterator}
            />
            <WorkbenchMenuActionButton
              label="New Conditional"
              onSelect={onRequestCreateConditional}
            />
            <WorkbenchMenuActionButton
              label="New Multi-Conditional"
              onSelect={onRequestCreateMultiConditional}
            />
            <WorkbenchMenuActionButton label="Add Group Box" onSelect={onRequestAddGroupBox} />
            <WorkbenchMenuActionButton
              label="Add Vertical Rail"
              onSelect={() => onRequestAddGuideRail('vertical')}
            />
            <WorkbenchMenuActionButton
              label="Add Horizontal Rail"
              onSelect={() => onRequestAddGuideRail('horizontal')}
            />
            <WorkbenchMenuActionButton
              label="Group Selection"
              onSelect={onRequestAddGroupBoxFromSelection}
              disabled={selectedModuleIds.length < 1}
            />
            <WorkbenchMenuActionButton
              label="Duplicate Cluster"
              onSelect={onRequestDuplicateSelection}
              disabled={!hasSelection}
              title="Duplicate selected modules (Cmd/Ctrl+D)"
            />
            <WorkbenchMenuActionButton
              label="Repeat Right"
              onSelect={onRequestRepeatSelectionRight}
              disabled={!hasSelection}
            />
            <WorkbenchMenuActionButton
              label="Copy Cluster To New Workspace"
              onSelect={onRequestCopySelectionToWorkspace}
              disabled={!hasSelection}
            />
            <WorkbenchMenuActionButton
              label="Delete Cluster"
              onSelect={onRequestDeleteSelection}
              disabled={!hasSelection}
              title="Delete selected modules (Delete)"
            />
          </WorkbenchActionMenu>

          <WorkbenchActionMenu label="Project" description="Save and recover">
            <WorkbenchMenuActionButton label="Save Version" onSelect={onRequestSaveVersion} />
          </WorkbenchActionMenu>

          <WorkbenchActionMenu label="Import/Export" description="Move artifacts">
            <WorkbenchMenuActionButton label="Import Workspace" onSelect={onRequestImport} />
            <WorkbenchMenuActionButton label="Import Lab Pack" onSelect={onRequestImportLabPack} />
            <WorkbenchMenuActionButton label="Export Workspace" onSelect={onExportDocument} />
            <WorkbenchMenuActionButton label="Export Lab Pack" onSelect={onExportLabPack} />
            <WorkbenchMenuActionButton label="Export Python" onSelect={onExportPython} />
          </WorkbenchActionMenu>
        </>
      ) : (
        <WorkbenchActionMenu label="Edit" description="Composite capture">
          <WorkbenchMenuActionButton
            label="Create Composite"
            onSelect={onRequestCreateComposite}
            disabled={!hasSelection}
          />
          <WorkbenchMenuActionButton
            label="Create Iterator"
            onSelect={onRequestCreateIterator}
          />
          <WorkbenchMenuActionButton
            label="Create Clocked Iterator"
            onSelect={onRequestCreateClockedIterator}
          />
          <WorkbenchMenuActionButton
            label="New Conditional"
            onSelect={onRequestCreateConditional}
          />
          <WorkbenchMenuActionButton
            label="New Multi-Conditional"
            onSelect={onRequestCreateMultiConditional}
          />
        </WorkbenchActionMenu>
      )}
    </div>
  );
}
