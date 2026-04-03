import type { ReactNode } from 'react';

interface WorkbenchActionsProps {
  isCompositeEditor: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedModuleIds: string[];
  effectiveSelectedConnectionIndex: number | null;
  showTutorialToggle: boolean;
  tutorialNotesVisible: boolean;
  onAddAnnotation: () => void;
  onExportDocument: () => void;
  onExportLabPack: () => void;
  onExportPython: () => void;
  onTidyLayout: () => void;
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
  canUndo,
  canRedo,
  selectedModuleIds,
  effectiveSelectedConnectionIndex,
  showTutorialToggle,
  tutorialNotesVisible,
  onAddAnnotation,
  onExportDocument,
  onExportLabPack,
  onExportPython,
  onTidyLayout,
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
  onRequestImport,
  onRequestImportLabPack,
  onRequestCreateComposite,
  onToggleTutorialNotes,
}: WorkbenchActionsProps) {
  const hasSelection = selectedModuleIds.length > 0;
  const canDeleteWire = effectiveSelectedConnectionIndex !== null;

  return (
    <div className="project-actions">
      {!isCompositeEditor ? (
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
            <WorkbenchMenuActionButton label="Import JSON" onSelect={onRequestImport} />
            <WorkbenchMenuActionButton label="Import Lab Pack" onSelect={onRequestImportLabPack} />
            <WorkbenchMenuActionButton label="Export JSON" onSelect={onExportDocument} />
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
