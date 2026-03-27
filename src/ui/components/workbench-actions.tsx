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
  onRequestCreateComposite: () => void;
  onToggleTutorialNotes?: (visible: boolean) => void;
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
  onRequestCreateComposite,
  onToggleTutorialNotes,
}: WorkbenchActionsProps) {
  return (
    <div className="project-actions">
      {!isCompositeEditor ? (
        <>
          <button type="button" className="mini-action-button" onClick={onAddAnnotation}>
            Add Note
          </button>
          <button type="button" className="mini-action-button" onClick={onExportDocument}>
            Export JSON
          </button>
          <button type="button" className="mini-action-button" onClick={onExportPython}>
            Export Python
          </button>
          <button type="button" className="mini-action-button" onClick={onTidyLayout}>
            Tidy Layout
          </button>
          <button type="button" className="mini-action-button" onClick={onRequestUndo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className="mini-action-button" onClick={onRequestRedo} disabled={!canRedo}>
            Redo
          </button>
          <button type="button" className="mini-action-button" onClick={onZoomOut}>
            Zoom Out
          </button>
          <button type="button" className="mini-action-button" onClick={onZoomIn}>
            Zoom In
          </button>
          <button type="button" className="mini-action-button" onClick={onResetView}>
            Reset View
          </button>
          <button type="button" className="mini-action-button" onClick={onFitView}>
            Fit View
          </button>
          <button type="button" className="mini-action-button" onClick={onRequestSaveVersion}>
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
            onClick={onRequestDeleteWire}
            disabled={effectiveSelectedConnectionIndex === null}
          >
            Delete Wire
          </button>
          <button type="button" className="mini-action-button" onClick={onRequestImport}>
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
          onClick={() => onToggleTutorialNotes?.(!tutorialNotesVisible)}
        >
          {tutorialNotesVisible ? 'Hide Step Notes' : 'Show Step Notes'}
        </button>
      ) : null}
    </div>
  );
}
