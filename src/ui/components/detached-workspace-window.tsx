import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { V1_REGISTRY } from '../../engine/modules';
import { getEffectiveRegistry } from '../store';
import type { DemoProject } from '../demo-projects';
import type { DetachedWorkspaceMessage, DetachedWorkspaceSnapshot } from '../detached-workspace';
import type { ThemeMode } from '../multi-window';

const WorkbenchPanel = lazy(() =>
  import('./workbench-panel').then((module) => ({
    default: module.WorkbenchPanel,
  })),
);

function LazyPanelFallback({
  label = 'Window',
  title = 'Syncing workspace…',
}: {
  label?: string;
  title?: string;
}) {
  return (
    <section className="panel comparison-panel">
      <div className="panel-head">
        <p className="panel-label">{label}</p>
        <h2>{title}</h2>
      </div>
    </section>
  );
}

interface DetachedWorkspaceWindowProps {
  channelName: string;
  hostId: string;
  workspaceWindowId: string;
  projectId: string;
}

export function DetachedWorkspaceWindow({
  channelName,
  hostId,
  workspaceWindowId,
  projectId,
}: DetachedWorkspaceWindowProps) {
  const [snapshot, setSnapshot] = useState<DetachedWorkspaceSnapshot | null>(null);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    const requestMessage: DetachedWorkspaceMessage = {
      type: 'requestSnapshot',
      hostId,
      workspaceWindowId,
      projectId,
    };

    const handleMessage = (event: MessageEvent<DetachedWorkspaceMessage>) => {
      const message = event.data;
      if ('hostId' in message && message.hostId !== hostId) {
        return;
      }

      if (
        message.type === 'snapshot' &&
        message.snapshot.workspaceWindowId === workspaceWindowId &&
        message.snapshot.projectId === projectId
      ) {
        setSnapshot(message.snapshot);
        setDisconnected(false);
        return;
      }

      if (
        message.type === 'hostClosed' &&
        message.workspaceWindowId === workspaceWindowId
      ) {
        setDisconnected(true);
      }
    };

    channel.addEventListener('message', handleMessage);
    channel.postMessage(requestMessage);

    const handleBeforeUnload = () => {
      const closedMessage: DetachedWorkspaceMessage = {
        type: 'workspaceWindowClosed',
        hostId,
        workspaceWindowId,
      };
      channel.postMessage(closedMessage);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [channelName, hostId, projectId, workspaceWindowId]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const theme: ThemeMode = snapshot?.theme ?? 'light';
    document.documentElement.dataset.theme = theme;
    document.title = snapshot
      ? `${snapshot.projectName} — Detached Workspace — MCW`
      : 'Detached Workspace — MCW';
  }, [snapshot]);

  const registry = useMemo(
    () => getEffectiveRegistry(V1_REGISTRY, snapshot?.compositeLibrary ?? []),
    [snapshot?.compositeLibrary],
  );

  const activeProject = useMemo<DemoProject | null>(() => {
    if (!snapshot) {
      return null;
    }

    return {
      id: snapshot.projectId,
      name: snapshot.projectName,
      group: snapshot.projectGroup ?? 'Workspace',
      summary: snapshot.summary,
      pipeline: snapshot.pipeline,
      project: snapshot.project,
      layout: snapshot.layout,
    };
  }, [snapshot]);

  if (!snapshot || !activeProject) {
    return (
      <div className="app-shell detached-workspace-shell">
        <LazyPanelFallback label="Workspace Window" title="Syncing workspace…" />
      </div>
    );
  }

  return (
    <div className="app-shell detached-workspace-shell">
      <header className="app-header detached-workspace-header">
        <div className="detached-workspace-copy">
          <p className="panel-label">Detached Workspace</p>
          <h1>{snapshot.projectName}</h1>
          <p className="detached-workspace-note">
            Live view of the same host session. Edit in the main window and watch updates here.
          </p>
        </div>
        <div className="detached-workspace-actions">
          <span
            className={`detached-workspace-status${disconnected ? ' disconnected' : ''}`}
          >
            {disconnected ? 'Host Disconnected' : 'Live Host Session'}
          </span>
          <button
            type="button"
            className="detached-window-action-button"
            onClick={() => window.focus()}
          >
            Focus Window
          </button>
          <button
            type="button"
            className="detached-window-action-button detached-window-return-button"
            onClick={() => window.close()}
          >
            Close
          </button>
        </div>
      </header>

      {disconnected ? (
        <section className="panel comparison-panel detached-workspace-disconnected">
          <div className="panel-head">
            <p className="panel-label">Disconnected</p>
            <h2>Host session is no longer available.</h2>
          </div>
          <p>
            This workspace window is a live bench view, not an independent session. Reopen it from
            the main MCW window when the host is available again.
          </p>
        </section>
      ) : (
        <Suspense fallback={<LazyPanelFallback label="Workspace Window" title="Workbench…" />}>
          <WorkbenchPanel
            activeProject={activeProject}
            title={snapshot.projectName}
            summary={snapshot.summary}
            pipelineLabel={snapshot.pipeline}
            activeProjectState={snapshot.project}
            theme={snapshot.theme}
            layout={snapshot.layout}
            layoutDirection={snapshot.layoutDirection}
            routingMode={snapshot.routingMode}
            wireColorMode={snapshot.wireColorMode}
            connectionLayout={{}}
            annotations={snapshot.annotations}
            stageLabels={snapshot.stageLabels}
            groupBoxes={snapshot.groupBoxes}
            guideRails={snapshot.guideRails}
            showFurniture={snapshot.showFurniture}
            showOverviewNavigator={snapshot.showOverviewNavigator}
            showGrid={snapshot.showGrid}
            snapToGrid={snapshot.snapToGrid}
            snapToGuides={snapshot.snapToGuides}
            execution={snapshot.execution}
            executionError={snapshot.executionError}
            validationIssues={snapshot.validationIssues}
            registry={registry}
            selectedModuleId={null}
            selectedModuleIds={[]}
            isObservationMode
            onMoveModule={() => undefined}
            onMoveModules={() => undefined}
            onAddAnnotation={() => undefined}
            onAddStageLabel={() => undefined}
            onAddGroupBox={() => undefined}
            onAddGroupBoxFromSelection={() => undefined}
            onAddGuideRail={() => undefined}
            onMoveGuideRail={() => undefined}
            onUpdateGuideRailTitle={() => undefined}
            onRemoveGuideRail={() => undefined}
            onMoveGroupBox={() => undefined}
            onResizeGroupBox={() => undefined}
            onUpdateGroupBoxTitle={() => undefined}
            onSetGroupBoxVariant={() => undefined}
            onRemoveGroupBox={() => undefined}
            onSetFurnitureVisible={() => undefined}
            onSetOverviewNavigatorVisible={() => undefined}
            onSetGridVisible={() => undefined}
            onSetSnapToGrid={() => undefined}
            onSetSnapToGuides={() => undefined}
            onMoveAnnotation={() => undefined}
            onUpdateAnnotationText={() => undefined}
            onRemoveAnnotation={() => undefined}
            onMoveStageLabel={() => undefined}
            onUpdateStageLabelText={() => undefined}
            onRemoveStageLabel={() => undefined}
            onSelectModule={() => undefined}
            onSelectModules={() => undefined}
            onRequestCreateComposite={() => undefined}
            onRequestCreateIterator={() => undefined}
            onRequestCreateClockedIterator={() => undefined}
            onRequestCreateConditional={() => undefined}
            onRequestCreateMultiConditional={() => undefined}
            onRequestAutoWire={() => undefined}
            onRequestCopySelection={() => undefined}
            onRequestPasteSelection={() => undefined}
            onRequestDuplicateSelection={() => undefined}
            onRequestRepeatSelectionRight={() => undefined}
            onRequestCopySelectionToWorkspace={() => undefined}
            onRequestDeleteSelection={() => undefined}
            onRequestUndo={() => undefined}
            onRequestRedo={() => undefined}
            onToggleTheme={() => undefined}
            canUndo={false}
            canRedo={false}
            canPasteSelection={false}
            workspaceVersions={[]}
            autosaveSnapshots={[]}
            persistenceWarning={null}
            lastDurableSaveAt={null}
            exportStatus={null}
            currentDocumentFingerprint={null}
            fileBinding={null}
            savedViewRegions={[]}
            onRequestOpenWorkspace={() => undefined}
            onRequestSaveDocument={() => undefined}
            onRequestSaveDocumentAs={() => undefined}
            onRequestSaveWorkspaceToLibrary={() => undefined}
            onRequestSaveVersion={() => undefined}
            onRequestArrangeSelection={() => undefined}
            onRequestRestoreVersion={() => undefined}
            onRequestRestoreAutosave={() => undefined}
            onSaveWorkspaceViewRegion={() => undefined}
            onRemoveWorkspaceViewRegion={() => undefined}
            onSwitchProject={() => undefined}
            onAddConnection={() => undefined}
            onReplaceConnection={() => undefined}
            onRemoveConnection={() => undefined}
            onInsertBridgeConnection={() => undefined}
            onSetConnectionOrthogonalBend={() => undefined}
            onSetConnectionOrthogonalAnchors={() => undefined}
            onRemoveConnectionOrthogonalAnchor={() => undefined}
            onClearConnectionOrthogonalBend={() => undefined}
            onClearConnectionOrthogonalPathEdits={() => undefined}
            onSetConnectionLanePreference={() => undefined}
            onClearConnectionLanePreference={() => undefined}
            onSetConnectionColorOverride={() => undefined}
            onClearConnectionColorOverride={() => undefined}
            onExportDocument={() => undefined}
            onExportLabPack={() => undefined}
            onExportPython={() => undefined}
            onImportDocument={() => undefined}
            onImportLabPack={() => undefined}
            onTidyLayout={() => undefined}
            onTidySelection={() => undefined}
            onSetLayoutDirection={() => undefined}
            onSetRoutingMode={() => undefined}
            onSetWireColorMode={() => undefined}
            onRenameModuleInstance={() => undefined}
            onUpdateModuleParam={() => undefined}
            onAddModule={() => undefined}
            onInsertModuleAndConnect={() => undefined}
            onInsertChain={() => undefined}
            onSpliceModuleOnConnection={() => undefined}
            projects={[activeProject]}
          />
        </Suspense>
      )}
    </div>
  );
}
