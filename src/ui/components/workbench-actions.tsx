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
