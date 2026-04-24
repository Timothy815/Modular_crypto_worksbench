import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { V1_REGISTRY } from '../../engine/modules';
import { PrimitivePalette } from './primitive-palette';
import { getEffectiveRegistry } from '../store';
import { createUserManualUrl } from '../manual-url';
import type { UiAction } from '../store';
import type {
  DetachedInspectorSnapshot,
  DetachedLearningSnapshot,
  DetachedPanelCommand,
  DetachedPanelKind,
  DetachedPanelMessage,
  DetachedPanelStateSnapshot,
  DetachedPaletteSnapshot,
  ThemeMode,
} from '../multi-window';
import { formatDetachedPanelKindLabel } from '../multi-window';
import { formatDetachedPanelDocumentTitle } from '../multi-window';
import { formatDetachedPanelGroupLabel } from '../multi-window';

const ParameterInspector = lazy(() =>
  import('./parameter-inspector').then((module) => ({
    default: module.ParameterInspector,
  })),
);
const TutorialPanel = lazy(() =>
  import('./tutorial-panel').then((module) => ({
    default: module.TutorialPanel,
  })),
);
const ChallengePanel = lazy(() =>
  import('./challenge-panel').then((module) => ({
    default: module.ChallengePanel,
  })),
);
const QuickStartPanel = lazy(() =>
  import('./quick-start-panel').then((module) => ({
    default: module.QuickStartPanel,
  })),
);
const CryptanalysisPanel = lazy(() =>
  import('./cryptanalysis-panel').then((module) => ({
    default: module.CryptanalysisPanel,
  })),
);

function LazyPanelFallback({
  label = 'Loading',
  title = 'Preparing panel…',
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

interface DetachedPanelWindowProps {
  channelName: string;
  hostId: string;
  panelWindowId: string;
  kind: DetachedPanelKind;
}

export function DetachedPanelWindow({
  channelName,
  hostId,
  panelWindowId,
  kind,
}: DetachedPanelWindowProps) {
  const [snapshot, setSnapshot] = useState<DetachedPanelStateSnapshot | null>(null);
  const [activePaletteCanvasDrag, setActivePaletteCanvasDrag] = useState<{
    defId: string;
  } | null>(null);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const splitRatioFrameRef = useRef<number | null>(null);
  const queuedSplitRatioRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    const requestMessage: DetachedPanelMessage = {
      type: 'requestSnapshot',
      hostId,
      panelWindowId,
    };

    const handleMessage = (event: MessageEvent<DetachedPanelMessage>) => {
      const message = event.data;
      if (message.type !== 'snapshot') {
        return;
      }

      if (
        message.snapshot.hostId !== hostId ||
        message.snapshot.panelWindowId !== panelWindowId
      ) {
        return;
      }

      setSnapshot(message.snapshot);
    };

    channel.addEventListener('message', handleMessage);
    channel.postMessage(requestMessage);

    const handleBeforeUnload = () => {
      const closedMessage: DetachedPanelMessage = {
        type: 'panelClosed',
        hostId,
        panelWindowId,
      };
      channel.postMessage(closedMessage);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [channelName, hostId, kind, panelWindowId]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const activeKind = snapshot?.activeKind ?? kind;
    const activePayload = getDetachedPayload(snapshot, activeKind);
    const theme: ThemeMode = activePayload?.theme ?? 'light';
    document.documentElement.dataset.theme = theme;
    document.title = formatDetachedPanelDocumentTitle(
      snapshot?.tabs ?? [activeKind],
      activeKind,
      snapshot?.presentationMode ?? 'tabs',
      snapshot?.splitLeftKind ?? null,
      snapshot?.splitRightKind ?? null,
    );
  }, [kind, snapshot]);

  const registry = useMemo(() => {
    const compositeLibrary =
      snapshot?.payloadByKind.palette?.compositeLibrary ??
      snapshot?.payloadByKind.inspector?.compositeLibrary ??
      [];
    return getEffectiveRegistry(V1_REGISTRY, compositeLibrary);
  }, [snapshot]);

  const activeKind = snapshot?.activeKind ?? kind;
  const activePayload = snapshot ? getDetachedPayload(snapshot, activeKind) : null;
  const splitLeftKind =
    snapshot?.tabs.find((tabKind) => tabKind === snapshot.splitLeftKind) ?? snapshot?.tabs[0] ?? activeKind;
  const splitRightKind =
    snapshot?.tabs.find((tabKind) => tabKind === snapshot.splitRightKind && tabKind !== splitLeftKind) ??
    snapshot?.tabs.find((tabKind) => tabKind !== splitLeftKind) ??
    splitLeftKind;
  const splitRatio = snapshot?.splitRatio ?? 0.5;
  const leftPaneStyle: CSSProperties = {
    flexBasis: `${splitRatio * 100}%`,
  };
  const rightPaneStyle: CSSProperties = {
    flexBasis: `${(1 - splitRatio) * 100}%`,
  };
  const splitHiddenKinds = snapshot?.tabs.filter(
    (tabKind) => tabKind !== splitLeftKind && tabKind !== splitRightKind,
  ) ?? [];

  const sendCommand = (targetKind: DetachedPanelKind, command: DetachedPanelCommand) => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    const message: DetachedPanelMessage = {
      type: 'command',
      hostId,
      panelWindowId,
      kind: targetKind,
      command,
    };
    channel.postMessage(message);
    channel.close();
  };

  const sendSplitRatio = (ratio: number) => {
    queuedSplitRatioRef.current = ratio;
    if (splitRatioFrameRef.current !== null) {
      return;
    }

    splitRatioFrameRef.current = window.requestAnimationFrame(() => {
      splitRatioFrameRef.current = null;
      const nextRatio = queuedSplitRatioRef.current;
      queuedSplitRatioRef.current = null;
      if (nextRatio === null) {
        return;
      }

      sendCommand(activeKind, { type: 'setDetachedSplitRatio', ratio: nextRatio });
    });
  };

  useEffect(() => {
    return () => {
      if (splitRatioFrameRef.current !== null) {
        window.cancelAnimationFrame(splitRatioFrameRef.current);
      }
    };
  }, []);

  const postAction = (action: UiAction) => {
    postDetachedAction(channelName, hostId, panelWindowId, action);
  };
  const startPaletteCanvasDrag = (defId: string, clientX: number, clientY: number) => {
    const horizontalChrome = Math.max(0, Math.round((window.outerWidth - window.innerWidth) / 2));
    const verticalChrome = Math.max(0, window.outerHeight - window.innerHeight);
    setActivePaletteCanvasDrag({ defId });
    sendCommand('palette', {
      type: 'startPaletteCanvasDrag',
      defId,
      screenX: window.screenX + horizontalChrome + clientX,
      screenY: window.screenY + verticalChrome + clientY,
    });
  };

  useEffect(() => {
    if (!activePaletteCanvasDrag) {
      return undefined;
    }

    const handlePointerMove = (event: MouseEvent) => {
      sendCommand('palette', {
        type: 'updatePaletteCanvasDrag',
        screenX: event.screenX,
        screenY: event.screenY,
      });
    };

    const finishDetachedPaletteDrag = (event: MouseEvent) => {
      setActivePaletteCanvasDrag(null);
      sendCommand('palette', {
        type: 'endPaletteCanvasDrag',
        screenX: event.screenX,
        screenY: event.screenY,
      });
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', finishDetachedPaletteDrag);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', finishDetachedPaletteDrag);
    };
  }, [activePaletteCanvasDrag]);

  const startSplitResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const container = splitContainerRef.current;
    if (!container) {
      return;
    }

    event.preventDefault();
    const pointerId = event.pointerId;
    const handle = event.currentTarget;
    handle.setPointerCapture(pointerId);

    const updateRatio = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const ratio = (clientX - rect.left) / rect.width;
      sendSplitRatio(ratio);
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateRatio(moveEvent.clientX);
    };

    const finishResize = () => {
      handle.removeEventListener('pointermove', handlePointerMove);
      handle.removeEventListener('pointerup', finishResize);
      handle.removeEventListener('pointercancel', finishResize);
      if (handle.hasPointerCapture(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
    };

    handle.addEventListener('pointermove', handlePointerMove);
    handle.addEventListener('pointerup', finishResize);
    handle.addEventListener('pointercancel', finishResize);
  };

  return (
    <main
      className={
        snapshot?.presentationMode === 'combined'
          ? 'app-shell detached-panel-shell detached-panel-shell-combined'
          : snapshot?.presentationMode === 'split'
            ? 'app-shell detached-panel-shell detached-panel-shell-split'
            : 'app-shell detached-panel-shell'
      }
    >
      {!snapshot ? (
        <LazyPanelFallback label="Window" title="Syncing detached panel…" />
      ) : (
        <>
          <section className="panel detached-window-tabs-panel">
            <div className="detached-window-tabs-copy">
              <p className="meta-label detached-window-meta">Detached Window</p>
              <p className="detached-window-group-label">
                {formatDetachedPanelGroupLabel({
                  panelWindowId,
                  tabs: snapshot.tabs,
                  activeKind: snapshot.activeKind,
                  presentationMode: snapshot.presentationMode,
                  splitLeftKind: snapshot.splitLeftKind,
                  splitRightKind: snapshot.splitRightKind,
                  splitRatio: snapshot.splitRatio,
                })}
              </p>
              <p className="detached-window-group-note">
                {snapshot.presentationMode === 'combined'
                  ? 'Host-synced combined view'
                  : snapshot.presentationMode === 'split'
                    ? 'Host-synced split view'
                    : 'Host-synced tab group'}
              </p>
              <div className="detached-window-mode-toggle" role="tablist" aria-label="Detached view mode">
                <button
                  type="button"
                  className={
                    snapshot.presentationMode === 'tabs'
                      ? 'detached-window-tab active'
                      : 'detached-window-tab'
                  }
                  onClick={() =>
                    sendCommand(activeKind, {
                      type: 'setDetachedPresentationMode',
                      presentationMode: 'tabs',
                    })
                  }
                >
                  Tabs
                </button>
                <button
                  type="button"
                  className={
                    snapshot.presentationMode === 'combined'
                      ? 'detached-window-tab active'
                      : 'detached-window-tab'
                  }
                  onClick={() =>
                    sendCommand(activeKind, {
                      type: 'setDetachedPresentationMode',
                      presentationMode: 'combined',
                    })
                  }
                >
                  Combined
                </button>
                <button
                  type="button"
                  className={
                    snapshot.presentationMode === 'split'
                      ? 'detached-window-tab active'
                      : 'detached-window-tab'
                  }
                  onClick={() =>
                    sendCommand(activeKind, {
                      type: 'setDetachedPresentationMode',
                      presentationMode: 'split',
                    })
                  }
                >
                  Split
                </button>
              </div>
              <div className="detached-window-tabs" role="tablist" aria-label="Detached window tabs">
                {snapshot.tabs.map((tabKind) => (
                  <button
                    key={tabKind}
                    type="button"
                    role="tab"
                    aria-selected={snapshot.activeKind === tabKind}
                    className={
                      snapshot.activeKind === tabKind
                        ? 'detached-window-tab active'
                        : 'detached-window-tab'
                    }
                    onClick={() => sendCommand(tabKind, { type: 'setActiveDetachedTab', kind: tabKind })}
                  >
                    {formatDetachedPanelKindLabel(tabKind)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="detached-window-action-button detached-window-return-button"
              onClick={() =>
                sendCommand(activeKind, { type: 'returnDetachedTabToMain', kind: activeKind })
              }
            >
              Return {formatDetachedPanelKindLabel(activeKind)} To Main
            </button>
          </section>
          {snapshot.presentationMode === 'combined' ? (
            <section className="detached-combined-stack">
              {snapshot.tabs.map((tabKind, index) => {
                const payload = getDetachedPayload(snapshot, tabKind);
                if (!payload) {
                  return null;
                }

                return (
                  <section key={tabKind} className="detached-combined-pane">
                    <div className="detached-combined-pane-header">
                      <div>
                        <p className="meta-label detached-window-meta">Visible Pane</p>
                        <h2 className="detached-combined-pane-title">
                          {formatDetachedPanelKindLabel(tabKind)}
                        </h2>
                      </div>
                      <div className="detached-combined-pane-actions">
                        <button
                          type="button"
                          className="detached-window-action-button"
                          disabled={index === 0}
                          onClick={() =>
                            sendCommand(tabKind, { type: 'moveDetachedPaneEarlier', kind: tabKind })
                          }
                        >
                          Move Up
                        </button>
                        <button
                          type="button"
                          className="detached-window-action-button"
                          disabled={index === snapshot.tabs.length - 1}
                          onClick={() =>
                            sendCommand(tabKind, { type: 'moveDetachedPaneLater', kind: tabKind })
                          }
                        >
                          Move Down
                        </button>
                        <button
                          type="button"
                          className="detached-window-action-button"
                          onClick={() =>
                            sendCommand(tabKind, { type: 'returnDetachedTabToMain', kind: tabKind })
                          }
                        >
                          Return To Main
                        </button>
                      </div>
                    </div>
                    {renderDetachedPane(
                      tabKind,
                      payload,
                      registry,
                      postAction,
                      sendCommand,
                      startPaletteCanvasDrag,
                    )}
                  </section>
                );
              })}
            </section>
          ) : snapshot.presentationMode === 'split' ? (
            <section className="detached-split-shell">
              <section className="detached-split-controls panel">
                <div className="detached-split-controls-row">
                  <div className="detached-split-copy">
                    <p className="meta-label detached-window-meta">Visible Pair</p>
                    <p className="detached-window-group-label">
                      {formatDetachedPanelKindLabel(splitLeftKind)} + {formatDetachedPanelKindLabel(splitRightKind)}
                    </p>
                    <p className="detached-window-group-note">
                      Exactly two panes are visible in split mode.
                    </p>
                  </div>
                  <div className="detached-split-actions">
                    <button
                      type="button"
                      className="detached-window-action-button"
                      onClick={() => sendCommand(activeKind, { type: 'swapDetachedSplitSides' })}
                    >
                      Swap Sides
                    </button>
                  </div>
                </div>
                <div className="detached-split-assignments">
                  <label className="inspector-section-select">
                    <span className="meta-label">Left Pane</span>
                    <select
                      value={splitLeftKind}
                      onChange={(event) =>
                        sendCommand(activeKind, {
                          type: 'setDetachedSplitSide',
                          side: 'left',
                          kind: event.target.value as DetachedPanelKind,
                        })
                      }
                    >
                      {snapshot.tabs.map((tabKind) => (
                        <option key={`left:${tabKind}`} value={tabKind}>
                          {formatDetachedPanelKindLabel(tabKind)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inspector-section-select">
                    <span className="meta-label">Right Pane</span>
                    <select
                      value={splitRightKind}
                      onChange={(event) =>
                        sendCommand(activeKind, {
                          type: 'setDetachedSplitSide',
                          side: 'right',
                          kind: event.target.value as DetachedPanelKind,
                        })
                      }
                    >
                      {snapshot.tabs.map((tabKind) => (
                        <option key={`right:${tabKind}`} value={tabKind}>
                          {formatDetachedPanelKindLabel(tabKind)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {splitHiddenKinds.length > 0 ? (
                  <div className="detached-split-hidden">
                    <p className="meta-label detached-window-meta">Hidden In This View</p>
                    <div className="detached-window-tabs">
                      {splitHiddenKinds.map((tabKind) => (
                        <button
                          key={`hidden:${tabKind}`}
                          type="button"
                          className="detached-window-action-button"
                          onClick={() =>
                            sendCommand(activeKind, {
                              type: 'setDetachedSplitSide',
                              side: 'right',
                              kind: tabKind,
                            })
                          }
                        >
                          Show {formatDetachedPanelKindLabel(tabKind)} On Right
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
              <div ref={splitContainerRef} className="detached-split-layout">
                <section className="detached-split-pane" style={leftPaneStyle}>
                  <div className="detached-split-pane-header">
                    <div>
                      <p className="meta-label detached-window-meta">Left</p>
                      <h2 className="detached-combined-pane-title">
                        {formatDetachedPanelKindLabel(splitLeftKind)}
                      </h2>
                    </div>
                    <div className="detached-combined-pane-actions">
                      <button
                        type="button"
                        className="detached-window-action-button"
                        onClick={() =>
                          sendCommand(splitLeftKind, {
                            type: 'returnDetachedTabToMain',
                            kind: splitLeftKind,
                          })
                        }
                      >
                        Return To Main
                      </button>
                    </div>
                  </div>
                  {renderDetachedPane(
                    splitLeftKind,
                    getDetachedPayload(snapshot, splitLeftKind),
                    registry,
                    postAction,
                    sendCommand,
                    startPaletteCanvasDrag,
                  )}
                </section>
                <button
                  type="button"
                  className="detached-split-divider"
                  aria-label="Resize split panes"
                  onPointerDown={startSplitResize}
                />
                <section className="detached-split-pane" style={rightPaneStyle}>
                  <div className="detached-split-pane-header">
                    <div>
                      <p className="meta-label detached-window-meta">Right</p>
                      <h2 className="detached-combined-pane-title">
                        {formatDetachedPanelKindLabel(splitRightKind)}
                      </h2>
                    </div>
                    <div className="detached-combined-pane-actions">
                      <button
                        type="button"
                        className="detached-window-action-button"
                        onClick={() =>
                          sendCommand(splitRightKind, {
                            type: 'returnDetachedTabToMain',
                            kind: splitRightKind,
                          })
                        }
                      >
                        Return To Main
                      </button>
                    </div>
                  </div>
                  {renderDetachedPane(
                    splitRightKind,
                    getDetachedPayload(snapshot, splitRightKind),
                    registry,
                    postAction,
                    sendCommand,
                    startPaletteCanvasDrag,
                  )}
                </section>
              </div>
            </section>
          ) : (
            renderDetachedPane(
              activeKind,
              activePayload,
              registry,
              postAction,
              sendCommand,
              startPaletteCanvasDrag,
            )
          )}
        </>
      )}
    </main>
  );
}

function getDetachedPayload(snapshot: DetachedPanelStateSnapshot | null, kind: DetachedPanelKind) {
  if (!snapshot) {
    return null;
  }

  return snapshot.payloadByKind[kind] ?? null;
}

function renderDetachedPane(
  kind: DetachedPanelKind,
  payload: DetachedPaletteSnapshot | DetachedInspectorSnapshot | DetachedLearningSnapshot | null,
  registry: ReturnType<typeof getEffectiveRegistry>,
  postAction: (action: UiAction) => void,
  sendCommand: (targetKind: DetachedPanelKind, command: DetachedPanelCommand) => void,
  onStartPaletteCanvasDrag: (defId: string, clientX: number, clientY: number) => void,
) {
  if (!payload) {
    return null;
  }

  if (kind === 'palette') {
    return (
      <PrimitivePalette
        registry={registry}
        viewMode={(payload as DetachedPaletteSnapshot).paletteViewMode}
        onToggleViewMode={() => sendCommand('palette', { type: 'togglePaletteViewMode' })}
        compositeUsageCountById={(payload as DetachedPaletteSnapshot).compositeUsageCountById}
        builtInReusableIds={(payload as DetachedPaletteSnapshot).builtInReusableIds}
        onAddModule={(defId) => sendCommand('palette', { type: 'addModule', defId })}
        onStartCanvasDrag={(defId, clientX, clientY) =>
          onStartPaletteCanvasDrag(defId, clientX, clientY)
        }
        onInsertStarterChain={(starterId) => sendCommand('palette', { type: 'insertStarterChain', starterId })}
        onExportCompositeLibrary={() => sendCommand('palette', { type: 'exportCompositeLibrary' })}
        onOpenComposite={(defId) =>
          postAction({
            type: 'openCompositeEditor',
            entryId: defId,
          })
        }
        onEditClockedIterator={(defId) => sendCommand('palette', { type: 'editClockedIterator', defId })}
        onDuplicateReusable={(defId) => sendCommand('palette', { type: 'duplicateReusable', defId })}
        onOpenPrimitiveMicroDemo={(defId) =>
          sendCommand('palette', { type: 'openPrimitiveMicroDemo', defId })
        }
        onRemoveComposite={(defId) =>
          postAction({
            type: 'removeCompositeFromLibrary',
            compositeId: defId,
          })
        }
      />
    );
  }

  if (kind === 'inspector') {
    return (
      <Suspense fallback={<LazyPanelFallback label="Analyze" title="Loading inspector…" />}>
        <DetachedInspectorView
          snapshot={payload as DetachedInspectorSnapshot}
          registry={registry}
          onDispatchAction={postAction}
          onSendCommand={(command) => sendCommand('inspector', command)}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LazyPanelFallback label="Learning" title="Loading learning surface…" />}>
      <DetachedLearningView
        snapshot={payload as DetachedLearningSnapshot}
        registry={registry}
        onSendCommand={(command) => sendCommand('learning', command)}
      />
    </Suspense>
  );
}

function DetachedInspectorView({
  snapshot,
  registry,
  onDispatchAction,
  onSendCommand,
}: {
  snapshot: DetachedInspectorSnapshot;
  registry: ReturnType<typeof getEffectiveRegistry>;
  onDispatchAction: (action: UiAction) => void;
  onSendCommand: (command: DetachedPanelCommand) => void;
}) {
  const moduleInstance =
    snapshot.selectedModuleId !== null
      ? snapshot.project.modules.find((candidate) => candidate.id === snapshot.selectedModuleId) ?? null
      : null;
  const moduleDef = moduleInstance ? registry[moduleInstance.defId] ?? null : null;
  const baselineModuleInstance =
    snapshot.baselineModuleId !== null && snapshot.comparisonBaseline
      ? snapshot.comparisonBaseline.project.modules.find(
          (candidate) => candidate.id === snapshot.baselineModuleId,
        ) ?? null
      : null;

  return (
    <ParameterInspector
      execution={snapshot.execution}
      registry={registry}
      executionError={snapshot.executionError}
      validationIssues={snapshot.validationIssues}
      stepIndex={snapshot.stepIndex}
      project={snapshot.project}
      tutorialStep={snapshot.tutorialStep}
      projectName={snapshot.projectName}
      comparisonBaseline={snapshot.comparisonBaseline}
      executionComparison={snapshot.executionComparison}
      baselineOutput={snapshot.baselineOutput}
      variantOutput={snapshot.variantOutput}
      verificationSourceOptions={snapshot.verificationSourceOptions}
      verificationCases={snapshot.verificationCases}
      verificationResults={snapshot.verificationResults}
      baselineExecutionError={snapshot.baselineExecutionError}
      baselineModuleInstance={baselineModuleInstance}
      moduleDef={moduleDef}
      moduleInstance={moduleInstance}
      selectedModuleIds={snapshot.selectedModuleIds}
      parameterClipboard={snapshot.parameterClipboard}
      getParamDraft={(moduleId, key) => snapshot.paramDrafts[`${moduleId}:${key}`]}
      onCopyParams={(moduleId) => onSendCommand({ type: 'copyParams', moduleId })}
      onApplyCopiedParams={(sourceModuleId, sourceDefId, targetModuleIds, params, paramKeys) =>
        onDispatchAction({
          type: 'applyCopiedParams',
          projectId: snapshot.projectId,
          sourceModuleId,
          sourceDefId,
          targetModuleIds,
          params,
          paramKeys,
        })
      }
      onParamDraftChange={(moduleId, key, rawValue) =>
        onDispatchAction({
          type: 'setParamDraft',
          projectId: snapshot.projectId,
          moduleId,
          key,
          rawValue,
        })
      }
      onParamChange={(moduleId, key, value) =>
        onDispatchAction({
          type: 'updateParam',
          projectId: snapshot.projectId,
          moduleId,
          key,
          value,
        })
      }
      onSetModuleBypass={(moduleId, bypass) =>
        onDispatchAction({
          type: 'setModuleBypass',
          projectId: snapshot.projectId,
          moduleId,
          bypass,
        })
      }
      onRenameModuleInstance={(moduleId, nextModuleId) =>
        onDispatchAction({
          type: 'renameModuleInstance',
          projectId: snapshot.projectId,
          moduleId,
          nextModuleId,
        })
      }
      onDeleteModule={(moduleId) => onSendCommand({ type: 'deleteModule', moduleId })}
      canRenameModuleIds={snapshot.canRenameModuleIds}
      onUnzipComposite={(moduleId) => onSendCommand({ type: 'unzipComposite', moduleId })}
      onSelectIssueTarget={(moduleId) =>
        onDispatchAction({
          type: 'selectModule',
          projectId: snapshot.projectId,
          moduleId,
        })
      }
      onTraceHover={(moduleId) => onSendCommand({ type: 'traceHover', moduleId })}
      onStepChange={(nextIndex) => onSendCommand({ type: 'stepChange', nextIndex })}
      onActiveAnalysisTraceChange={(entry) =>
        onSendCommand({ type: 'activeAnalysisTraceChange', entry })
      }
      onRequestFocusModule={(moduleId) => onSendCommand({ type: 'requestFocusModule', moduleId })}
      onCaptureBaseline={() => onSendCommand({ type: 'captureBaseline' })}
      onClearBaseline={() => onSendCommand({ type: 'clearBaseline' })}
      onAddVerificationCase={(sourceModuleId, inputValue, tickCount) => {
        onSendCommand({
          type: 'addVerificationCase',
          sourceModuleId,
          inputValue,
          tickCount: tickCount ?? null,
        });
        return null;
      }}
      onImportVerificationCases={(cases) =>
        onSendCommand({
          type: 'importVerificationCases',
          cases,
        })
      }
      onRemoveVerificationCase={(caseId) => onSendCommand({ type: 'removeVerificationCase', caseId })}
      onClearVerificationCases={() => onSendCommand({ type: 'clearVerificationCases' })}
      probedModuleIds={snapshot.probedModuleIds}
      isTickedMode={snapshot.isTickedMode}
      currentTick={snapshot.currentTick}
      tickCount={snapshot.tickCount}
      tickedParamsByModule={snapshot.tickedParamsByModule}
      tickHistoryByModule={snapshot.tickHistoryByModule}
      collectedOutput={snapshot.collectedOutput}
      onToggleProbe={(moduleId) =>
        onDispatchAction({
          type: 'toggleProbe',
          projectId: snapshot.projectId,
          moduleId,
        })
      }
      onClearProbes={() =>
        onDispatchAction({
          type: 'clearProbes',
          projectId: snapshot.projectId,
        })
      }
    />
  );
}

function postDetachedAction(
  channelName: string,
  hostId: string,
  panelWindowId: string,
  action: UiAction,
) {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }

  const channel = new BroadcastChannel(channelName);
  const message: DetachedPanelMessage = {
    type: 'dispatchAction',
    hostId,
    panelWindowId,
    action,
  };
  channel.postMessage(message);
  channel.close();
}

function DetachedLearningView({
  snapshot,
  registry,
  onSendCommand,
}: {
  snapshot: DetachedLearningSnapshot;
  registry: ReturnType<typeof getEffectiveRegistry>;
  onSendCommand: (command: DetachedPanelCommand) => void;
}) {
  return (
    <section className="learning-dock detached-learning-dock">
      <div className="learning-dock-tabs" role="tablist" aria-label="Learning panel">
        <button
          type="button"
          role="tab"
          aria-selected={snapshot.learningPanelTab === 'quickstart'}
          className={
            snapshot.learningPanelTab === 'quickstart'
              ? 'learning-dock-tab active'
              : 'learning-dock-tab'
          }
          onClick={() => onSendCommand({ type: 'setLearningTab', tab: 'quickstart' })}
        >
          Quick Start
        </button>
        {snapshot.hasTutorialPanel ? (
          <button
            type="button"
            role="tab"
            aria-selected={snapshot.learningPanelTab === 'tutorial'}
            className={
              snapshot.learningPanelTab === 'tutorial'
                ? 'learning-dock-tab active'
                : 'learning-dock-tab'
            }
            onClick={() => onSendCommand({ type: 'setLearningTab', tab: 'tutorial' })}
          >
            Tutorial
          </button>
        ) : null}
        {snapshot.hasChallengePanel ? (
          <button
            type="button"
            role="tab"
            aria-selected={snapshot.learningPanelTab === 'challenge'}
            className={
              snapshot.learningPanelTab === 'challenge'
                ? 'learning-dock-tab active'
                : 'learning-dock-tab'
            }
            onClick={() => onSendCommand({ type: 'setLearningTab', tab: 'challenge' })}
          >
            Challenge
          </button>
        ) : null}
        {snapshot.hasCryptanalysisPanel ? (
          <button
            type="button"
            role="tab"
            aria-selected={snapshot.learningPanelTab === 'cryptanalysis'}
            className={
              snapshot.learningPanelTab === 'cryptanalysis'
                ? 'learning-dock-tab active'
                : 'learning-dock-tab'
            }
            onClick={() => onSendCommand({ type: 'setLearningTab', tab: 'cryptanalysis' })}
          >
            Cryptanalysis
          </button>
        ) : null}
      </div>

      {snapshot.learningPanelTab === 'quickstart' ? (
        <QuickStartPanel
          currentProjectId={snapshot.currentProjectId}
          selectedTutorialId={snapshot.selectedTutorialId}
          selectedChallengeId={snapshot.selectedChallengeId}
          starterChallengeSolved={
            snapshot.selectedChallengeId === 'repair-bridge-key' &&
            snapshot.challengeEvaluation?.status === 'success'
          }
          onOpenProject={(projectId) => onSendCommand({ type: 'switchProject', projectId })}
          onOpenTutorialPath={(projectId, tutorialId) =>
            onSendCommand({ type: 'selectTutorial', tutorialId, projectId })
          }
          onOpenPipelineMicroDemo={(pipelineId) =>
            onSendCommand({ type: 'openPipelineMicroDemo', pipelineId })
          }
          onOpenChallenge={(challengeId) => onSendCommand({ type: 'selectChallenge', challengeId })}
          onOpenManual={() => {
            window.open(
              createUserManualUrl(snapshot.theme),
              'mcw-user-manual',
              'noopener,noreferrer,width=1320,height=900',
            );
          }}
          onOpenCryptanalysis={() => {
            onSendCommand({ type: 'setWorkspaceMode', mode: 'cryptanalysis' });
            onSendCommand({ type: 'setLearningTab', tab: 'cryptanalysis' });
          }}
        />
      ) : null}

      {snapshot.learningPanelTab === 'challenge' && snapshot.selectedChallengeId ? (
        <ChallengePanel
          challenges={snapshot.challenges}
          selectedChallengeId={snapshot.selectedChallengeId}
          evaluation={snapshot.challengeEvaluation}
          currentProject={snapshot.currentProject}
          canCaptureChallenge={snapshot.canCaptureChallenge}
          onSelectChallenge={(challengeId) => onSendCommand({ type: 'selectChallenge', challengeId })}
          onLoadChallengeStart={() => onSendCommand({ type: 'loadChallengeStart' })}
          onExportChallenge={() => onSendCommand({ type: 'exportChallenge' })}
          onImportChallenge={(file) => {
            void file.text().then((rawValue) => {
              onSendCommand({ type: 'importChallengeRaw', rawValue });
            });
          }}
          onCaptureChallenge={() => onSendCommand({ type: 'captureChallenge' })}
        />
      ) : null}

      {snapshot.learningPanelTab === 'tutorial' && snapshot.selectedTutorialId ? (
        <TutorialPanel
          tutorials={snapshot.tutorials}
          selectedTutorialId={snapshot.selectedTutorialId}
          currentProjectId={snapshot.currentProjectId}
          stepIndex={snapshot.tutorialStepIndex}
          activeStep={snapshot.selectedTutorialStep}
          completedTutorialIds={snapshot.completedTutorialIds}
          isCompleted={snapshot.isTutorialCompleted}
          workspaceMode={snapshot.workspaceMode}
          tutorialNotesVisible={snapshot.tutorialNotesVisible}
          onSetWorkspaceMode={(mode) => onSendCommand({ type: 'setWorkspaceMode', mode })}
          onSetTutorialNotesVisible={(visible) =>
            onSendCommand({ type: 'setTutorialNotesVisible', visible })
          }
          onSelectTutorial={(tutorialId) => onSendCommand({ type: 'selectTutorial', tutorialId })}
          onSetStep={(stepIndex) => onSendCommand({ type: 'setTutorialStep', stepIndex })}
          onSwitchProject={(projectId) => onSendCommand({ type: 'switchProject', projectId })}
          onFocusStepModule={(moduleId) => onSendCommand({ type: 'focusStepModule', moduleId })}
          onResetProgress={() => onSendCommand({ type: 'resetTutorialProgress' })}
        />
      ) : null}

      {snapshot.learningPanelTab === 'cryptanalysis' ? (
        <CryptanalysisPanel
          projectName={snapshot.projectName}
          project={snapshot.currentProject}
          registry={registry}
          execution={snapshot.execution}
          isTickedMode={snapshot.isTickedMode}
          tickedExecution={snapshot.tickedExecution}
          ciphertext={snapshot.ciphertext}
          cryptanalysisMode={snapshot.cryptanalysisMode}
          modernBaseline={snapshot.modernBaseline}
          modernFlipBit={snapshot.modernFlipBit}
          modernSourceId={snapshot.modernSourceId}
          modernSinkId={snapshot.modernSinkId}
          randomnessSinkId={snapshot.randomnessSinkId}
          classicalSelectedPeriod={snapshot.classicalSelectedPeriod}
          classicalSelectedColumnIndex={snapshot.classicalSelectedColumnIndex}
          classicalSelectedShiftsByColumnKey={snapshot.classicalSelectedShiftsByColumnKey}
          savedAnalysisCases={snapshot.savedAnalysisCases}
          workspaceMode={snapshot.workspaceMode}
          tutorial={
            snapshot.tutorials.find(
              (tutorial) =>
                tutorial.id === snapshot.selectedTutorialId &&
                tutorial.projectId === snapshot.currentProjectId,
            ) ?? null
          }
          tutorialStep={snapshot.tutorialNotesVisible ? snapshot.selectedTutorialStep : null}
          tutorialStepIndex={snapshot.tutorialStepIndex}
          tutorialNotesVisible={snapshot.tutorialNotesVisible}
          onSetWorkspaceMode={(mode) => onSendCommand({ type: 'setWorkspaceMode', mode })}
          onSetCryptanalysisMode={(mode) =>
            onSendCommand({ type: 'setCryptanalysisMode', mode })
          }
          onSetTutorialNotesVisible={(visible) =>
            onSendCommand({ type: 'setTutorialNotesVisible', visible })
          }
          onCiphertextChange={(value) => onSendCommand({ type: 'setCryptanalysisInput', value })}
          onModernBaselineChange={(value) =>
            onSendCommand({ type: 'setModernAnalysisBaseline', value })
          }
          onModernFlipBitChange={(value) =>
            onSendCommand({ type: 'setModernAnalysisFlipBit', value })
          }
          onModernSourceIdChange={(value) =>
            onSendCommand({ type: 'setModernAnalysisSourceId', value })
          }
          onModernSinkIdChange={(value) =>
            onSendCommand({ type: 'setModernAnalysisSinkId', value })
          }
          onRandomnessSinkIdChange={(value) =>
            onSendCommand({ type: 'setRandomnessAnalysisSinkId', value })
          }
          onClassicalSelectedPeriodChange={(value) =>
            onSendCommand({ type: 'setClassicalSelectedPeriod', value })
          }
          onClassicalSelectedColumnIndexChange={(value) =>
            onSendCommand({ type: 'setClassicalSelectedColumnIndex', value })
          }
          onClassicalSelectedShiftChange={(key, value) =>
            onSendCommand({ type: 'setClassicalSelectedShift', key, value })
          }
          onSaveAnalysisCase={(name) => onSendCommand({ type: 'saveAnalysisCase', name })}
          onUpdateAnalysisCase={(caseId) => onSendCommand({ type: 'updateAnalysisCase', caseId })}
          onRenameAnalysisCase={(caseId, name) =>
            onSendCommand({ type: 'renameAnalysisCase', caseId, name })
          }
          onDeleteAnalysisCase={(caseId) => onSendCommand({ type: 'deleteAnalysisCase', caseId })}
          onLoadAnalysisCase={(savedCase) => onSendCommand({ type: 'loadAnalysisCase', savedCase })}
          onSetTutorialStep={(stepIndex) => onSendCommand({ type: 'setTutorialStep', stepIndex })}
          onFocusTutorialModule={(moduleId) => onSendCommand({ type: 'focusStepModule', moduleId })}
        />
      ) : null}
    </section>
  );
}
