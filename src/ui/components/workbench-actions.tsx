import type { ReactNode } from 'react';

import type { WorkbenchLayoutDirection, WorkbenchRoutingMode } from '../workbench-document';

interface WorkbenchActionsProps {
  isCompositeEditor: boolean;
  isObservationMode?: boolean;
  layoutDirection: WorkbenchLayoutDirection;
  routingMode: WorkbenchRoutingMode;
  showOverviewNavigator: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedModuleIds: string[];
  effectiveSelectedConnectionIndex: number | null;
  selectedConnectionHasManualPath: boolean;
  showTutorialToggle: boolean;
  tutorialNotesVisible: boolean;
  onAddAnnotation: () => void;
  onExportDocument: () => void;
  onExportLabPack: () => void;
  onExportPython: () => void;
  onTidyLayout: () => void;
  onSetLayoutDirection: (direction: WorkbenchLayoutDirection) => void;
  onSetRoutingMode: (mode: WorkbenchRoutingMode) => void;
  onToggleOverviewNavigator: (visible: boolean) => void;
  onRequestUndo: () => void;
  onRequestRedo: () => void;
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
  onRequestDuplicateSelection: () => void;
  onRequestDeleteSelection: () => void;
  onRequestDeleteWire: () => void;
  onRequestResetWirePath: () => void;
  onRequestImport: () => void;
  onRequestImportLabPack: () => void;
  onRequestCreateComposite: () => void;
  onToggleTutorialNotes?: (visible: boolean) => void;
}

interface WorkbenchMenuAction {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  title?: string;
}

interface WorkbenchActionMenuProps {
  label: string;
  description?: string;
  children: ReactNode;
}

function WorkbenchActionMenu({ label, description, children }: WorkbenchActionMenuProps) {
  return (
    <details className="workbench-action-menu">
      <summary className="workbench-action-menu-trigger">
        <span className="workbench-action-menu-label">{label}</span>
        {description ? <span className="workbench-action-menu-note">{description}</span> : null}
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
  | 'fit-view'
  | 'reset-view'
  | 'undo'
  | 'redo'
  | 'layout-horizontal'
  | 'layout-vertical'
  | 'routing-curved'
  | 'routing-orthogonal'
  | 'overview'
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
    case 'overview':
      return (
        <svg className="workbench-inline-action-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3" y="4" width="14" height="12" rx="1.5" />
          <rect x="6" y="7" width="5" height="4" rx="0.8" />
          <rect x="11.5" y="10" width="3" height="2.5" rx="0.6" />
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

export function WorkbenchActions({
  isCompositeEditor,
  isObservationMode = false,
  layoutDirection,
  routingMode,
  showOverviewNavigator,
  canUndo,
  canRedo,
  selectedModuleIds,
  effectiveSelectedConnectionIndex,
  selectedConnectionHasManualPath,
  showTutorialToggle,
  tutorialNotesVisible,
  onAddAnnotation,
  onExportDocument,
  onExportLabPack,
  onExportPython,
  onTidyLayout,
  onSetLayoutDirection,
  onSetRoutingMode,
  onToggleOverviewNavigator,
  onRequestUndo,
  onRequestRedo,
  onZoomOut,
  onZoomIn,
  onResetView,
  onFitView,
  onRequestSaveVersion,
  onRequestArrangeSelection,
  onRequestAddGroupBox,
  onRequestAddGroupBoxFromSelection,
  onRequestDuplicateSelection,
  onRequestDeleteSelection,
  onRequestDeleteWire,
  onRequestResetWirePath,
  onRequestImport,
  onRequestImportLabPack,
  onRequestCreateComposite,
  onToggleTutorialNotes,
}: WorkbenchActionsProps) {
  const hasSelection = selectedModuleIds.length > 0;
  const canDeleteWire = effectiveSelectedConnectionIndex !== null;
  const canAlignSelection = selectedModuleIds.length >= 2;
  const canDistributeSelection = selectedModuleIds.length >= 3;

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
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="undo" />}
              title="Undo"
              onSelect={onRequestUndo}
              disabled={!canUndo}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="redo" />}
              title="Redo"
              onSelect={onRequestRedo}
              disabled={!canRedo}
            />
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
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="overview" />}
              title={showOverviewNavigator ? 'Hide Overview Navigator' : 'Show Overview Navigator'}
              onSelect={() => onToggleOverviewNavigator(!showOverviewNavigator)}
              active={showOverviewNavigator}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="save-version" />}
              title="Save Version"
              onSelect={onRequestSaveVersion}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="delete-wire" />}
              title="Delete Selected Wire"
              onSelect={onRequestDeleteWire}
              disabled={!canDeleteWire}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="reset-wire" />}
              title="Reset Selected Wire Path"
              onSelect={onRequestResetWirePath}
              disabled={!selectedConnectionHasManualPath}
            />
          </div>

          <div className="workbench-inline-toolbar" aria-label="Selection layout tools">
            <WorkbenchInlineActionButton
              content="Tidy"
              title="Tidy Layout"
              onSelect={onTidyLayout}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="stage-row" />}
              title="Arrange Selected Stage Row"
              onSelect={() => onRequestArrangeSelection('stage-row')}
              disabled={!canAlignSelection}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="stage-column" />}
              title="Stack Selected Stage Column"
              onSelect={() => onRequestArrangeSelection('stage-column')}
              disabled={!canAlignSelection}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="align-left" />}
              title="Align Left"
              onSelect={() => onRequestArrangeSelection('align-left')}
              disabled={!canAlignSelection}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="align-right" />}
              title="Align Right"
              onSelect={() => onRequestArrangeSelection('align-right')}
              disabled={!canAlignSelection}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="align-top" />}
              title="Align Top"
              onSelect={() => onRequestArrangeSelection('align-top')}
              disabled={!canAlignSelection}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="align-bottom" />}
              title="Align Bottom"
              onSelect={() => onRequestArrangeSelection('align-bottom')}
              disabled={!canAlignSelection}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="align-horizontal-center" />}
              title="Align Horizontal Center"
              onSelect={() => onRequestArrangeSelection('align-horizontal-center')}
              disabled={!canAlignSelection}
            />
            <WorkbenchInlineActionButton
              content={<WorkbenchInlineIcon name="align-vertical-center" />}
              title="Align Vertical Center"
              onSelect={() => onRequestArrangeSelection('align-vertical-center')}
              disabled={!canAlignSelection}
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

          <WorkbenchActionMenu label="View" description="Zoom and navigate">
            <WorkbenchMenuActionButton label="Zoom Out" onSelect={onZoomOut} />
            <WorkbenchMenuActionButton label="Zoom In" onSelect={onZoomIn} />
            <WorkbenchMenuActionButton label="Reset View" onSelect={onResetView} />
            <WorkbenchMenuActionButton label="Fit View" onSelect={onFitView} />
            <WorkbenchMenuActionButton
              label="Horizontal Layout"
              onSelect={() => onSetLayoutDirection('horizontal')}
              disabled={layoutDirection === 'horizontal'}
            />
            <WorkbenchMenuActionButton
              label="Vertical Layout"
              onSelect={() => onSetLayoutDirection('vertical')}
              disabled={layoutDirection === 'vertical'}
            />
            <WorkbenchMenuActionButton
              label="Curve"
              onSelect={() => onSetRoutingMode('curved')}
              disabled={routingMode === 'curved'}
            />
            <WorkbenchMenuActionButton
              label="Ortho"
              onSelect={() => onSetRoutingMode('orthogonal')}
              disabled={routingMode === 'orthogonal'}
            />
            <WorkbenchMenuActionButton
              label={showOverviewNavigator ? 'Hide Overview' : 'Show Overview'}
              onSelect={() => onToggleOverviewNavigator(!showOverviewNavigator)}
            />
            {showTutorialToggle ? (
              <WorkbenchMenuActionButton
                label={tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
                onSelect={() => onToggleTutorialNotes?.(!tutorialNotesVisible)}
              />
            ) : null}
          </WorkbenchActionMenu>

          <WorkbenchActionMenu label="Structure" description="Author and group">
            <WorkbenchMenuActionButton label="Add Note" onSelect={onAddAnnotation} />
            <WorkbenchMenuActionButton
              label="Create Composite"
              onSelect={onRequestCreateComposite}
              disabled={!hasSelection}
            />
            <WorkbenchMenuActionButton label="Add Group Box" onSelect={onRequestAddGroupBox} />
            <WorkbenchMenuActionButton
              label="Group Selection"
              onSelect={onRequestAddGroupBoxFromSelection}
              disabled={selectedModuleIds.length < 1}
            />
            <WorkbenchMenuActionButton
              label="Duplicate Cluster"
              onSelect={onRequestDuplicateSelection}
              disabled={!hasSelection}
            />
            <WorkbenchMenuActionButton
              label="Delete Cluster"
              onSelect={onRequestDeleteSelection}
              disabled={!hasSelection}
            />
          </WorkbenchActionMenu>

          <WorkbenchActionMenu label="Wire" description="Connection cleanup">
            <WorkbenchMenuActionButton
              label="Delete Wire"
              onSelect={onRequestDeleteWire}
              disabled={!canDeleteWire}
            />
            <WorkbenchMenuActionButton
              label="Reset Wire Path"
              onSelect={onRequestResetWirePath}
              disabled={!selectedConnectionHasManualPath}
            />
          </WorkbenchActionMenu>

          <WorkbenchActionMenu label="Project" description="Save and recover">
            <WorkbenchMenuActionButton label="Undo" onSelect={onRequestUndo} disabled={!canUndo} />
            <WorkbenchMenuActionButton label="Redo" onSelect={onRequestRedo} disabled={!canRedo} />
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
        </WorkbenchActionMenu>
      )}
    </div>
  );
}
