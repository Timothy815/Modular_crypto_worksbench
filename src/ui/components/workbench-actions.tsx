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
}

function WorkbenchInlineActionButton({
  content,
  title,
  onSelect,
  disabled = false,
}: WorkbenchInlineActionButtonProps) {
  return (
    <button
      type="button"
      className="workbench-inline-action-button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onSelect}
    >
      {content}
    </button>
  );
}

type WorkbenchInlineIconName =
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
