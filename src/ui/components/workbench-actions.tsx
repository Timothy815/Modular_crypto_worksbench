import type { ReactNode } from 'react';

import type { WorkbenchLayoutDirection, WorkbenchRoutingMode } from '../workbench-document';

interface WorkbenchActionsProps {
  isCompositeEditor: boolean;
  isObservationMode?: boolean;
  layoutDirection: WorkbenchLayoutDirection;
  routingMode: WorkbenchRoutingMode;
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

function WorkbenchMenuActionButton({ label, onSelect, disabled = false }: WorkbenchMenuAction) {
  return (
    <button
      type="button"
      className="workbench-menu-action-button"
      disabled={disabled}
      onClick={(event) => {
        onSelect();
        event.currentTarget.closest('details')?.removeAttribute('open');
      }}
    >
      {label}
    </button>
  );
}

export function WorkbenchActions({
  isCompositeEditor,
  isObservationMode = false,
  layoutDirection,
  routingMode,
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
          <WorkbenchActionMenu label="View" description="Zoom and navigate">
            <WorkbenchMenuActionButton label="Zoom Out" onSelect={onZoomOut} />
            <WorkbenchMenuActionButton label="Zoom In" onSelect={onZoomIn} />
            <WorkbenchMenuActionButton label="Reset View" onSelect={onResetView} />
            <WorkbenchMenuActionButton label="Fit View" onSelect={onFitView} />
          </WorkbenchActionMenu>

          <WorkbenchActionMenu label="Edit" description="Author and arrange">
            <WorkbenchMenuActionButton label="Add Note" onSelect={onAddAnnotation} />
            <WorkbenchMenuActionButton
              label="Create Composite"
              onSelect={onRequestCreateComposite}
              disabled={!hasSelection}
            />
            <WorkbenchMenuActionButton label="Tidy Layout" onSelect={onTidyLayout} />
            <WorkbenchMenuActionButton
              label="Arrange Selected Stage Row"
              onSelect={() => onRequestArrangeSelection('stage-row')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Stack Selected Stage Column"
              onSelect={() => onRequestArrangeSelection('stage-column')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Align Left"
              onSelect={() => onRequestArrangeSelection('align-left')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Align Right"
              onSelect={() => onRequestArrangeSelection('align-right')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Align Top"
              onSelect={() => onRequestArrangeSelection('align-top')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Align Bottom"
              onSelect={() => onRequestArrangeSelection('align-bottom')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Align Horizontal Center"
              onSelect={() => onRequestArrangeSelection('align-horizontal-center')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Align Vertical Center"
              onSelect={() => onRequestArrangeSelection('align-vertical-center')}
              disabled={selectedModuleIds.length < 2}
            />
            <WorkbenchMenuActionButton
              label="Distribute Horizontally"
              onSelect={() => onRequestArrangeSelection('distribute-horizontal')}
              disabled={selectedModuleIds.length < 3}
            />
            <WorkbenchMenuActionButton
              label="Distribute Vertically"
              onSelect={() => onRequestArrangeSelection('distribute-vertical')}
              disabled={selectedModuleIds.length < 3}
            />
            <WorkbenchMenuActionButton label="Add Group Box" onSelect={onRequestAddGroupBox} />
            <WorkbenchMenuActionButton
              label="Group Selection"
              onSelect={onRequestAddGroupBoxFromSelection}
              disabled={selectedModuleIds.length < 1}
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
              label="Duplicate Cluster"
              onSelect={onRequestDuplicateSelection}
              disabled={!hasSelection}
            />
            <WorkbenchMenuActionButton
              label="Delete Cluster"
              onSelect={onRequestDeleteSelection}
              disabled={!hasSelection}
            />
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
            {showTutorialToggle ? (
              <WorkbenchMenuActionButton
                label={tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
                onSelect={() => onToggleTutorialNotes?.(!tutorialNotesVisible)}
              />
            ) : null}
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
