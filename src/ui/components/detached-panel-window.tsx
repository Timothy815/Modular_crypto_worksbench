import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { V1_REGISTRY } from '../../engine/modules';
import { PrimitivePalette } from './primitive-palette';
import { getEffectiveRegistry } from '../store';
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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    const requestMessage: DetachedPanelMessage = {
      type: 'requestSnapshot',
      hostId,
      panelWindowId,
      kind,
    };

    const handleMessage = (event: MessageEvent<DetachedPanelMessage>) => {
      const message = event.data;
      if (message.type !== 'snapshot') {
        return;
      }

      if (
        message.snapshot.hostId !== hostId ||
        message.snapshot.panelWindowId !== panelWindowId ||
        message.snapshot.kind !== kind
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
        kind,
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

    const theme: ThemeMode = snapshot?.payload.theme ?? 'light';
    document.documentElement.dataset.theme = theme;
    document.title =
      kind === 'palette'
        ? 'MCW Tool Palette'
        : kind === 'inspector'
          ? 'MCW Inspector'
          : 'MCW Learning';
  }, [kind, snapshot]);

  const registry = useMemo(() => {
    const compositeLibrary =
      snapshot && 'compositeLibrary' in snapshot.payload ? snapshot.payload.compositeLibrary : [];
    return getEffectiveRegistry(V1_REGISTRY, compositeLibrary);
  }, [snapshot]);

  const sendCommand = (command: DetachedPanelCommand) => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    const message: DetachedPanelMessage = {
      type: 'command',
      hostId,
      panelWindowId,
      kind,
      command,
    };
    channel.postMessage(message);
    channel.close();
  };

  const postAction = (action: UiAction) => {
    postDetachedAction(channelName, hostId, panelWindowId, action);
  };

  return (
    <main className="app-shell detached-panel-shell">
      {!snapshot ? (
        <LazyPanelFallback label="Window" title="Syncing detached panel…" />
      ) : kind === 'palette' ? (
        <PrimitivePalette
          registry={registry}
          viewMode={(snapshot.payload as DetachedPaletteSnapshot).paletteViewMode}
          onToggleViewMode={() => sendCommand({ type: 'togglePaletteViewMode' })}
          compositeUsageCountById={(snapshot.payload as DetachedPaletteSnapshot).compositeUsageCountById}
          builtInReusableIds={(snapshot.payload as DetachedPaletteSnapshot).builtInReusableIds}
          onAddModule={(defId) => sendCommand({ type: 'addModule', defId })}
          onExportCompositeLibrary={() => sendCommand({ type: 'exportCompositeLibrary' })}
          onOpenComposite={(defId) =>
            postAction({
              type: 'openCompositeEditor',
              entryId: defId,
            })
          }
          onDuplicateReusable={(defId) => sendCommand({ type: 'duplicateReusable', defId })}
          onOpenPrimitiveMicroDemo={(defId) =>
            sendCommand({ type: 'openPrimitiveMicroDemo', defId })
          }
          onRemoveComposite={(defId) =>
            postAction({
              type: 'removeCompositeFromLibrary',
              compositeId: defId,
            })
          }
        />
      ) : kind === 'inspector' ? (
        <Suspense fallback={<LazyPanelFallback label="Analyze" title="Loading inspector…" />}>
          <DetachedInspectorView
            snapshot={snapshot.payload as DetachedInspectorSnapshot}
            registry={registry}
            onDispatchAction={postAction}
            onSendCommand={sendCommand}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<LazyPanelFallback label="Learning" title="Loading learning surface…" />}>
          <DetachedLearningView
            snapshot={snapshot.payload as DetachedLearningSnapshot}
            onSendCommand={sendCommand}
          />
        </Suspense>
      )}
    </main>
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
  onSendCommand,
}: {
  snapshot: DetachedLearningSnapshot;
  onSendCommand: (command: DetachedPanelCommand) => void;
}) {
  return (
    <section className="learning-dock detached-learning-dock">
      <div className="learning-dock-tabs" role="tablist" aria-label="Learning panel">
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
      </div>

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
    </section>
  );
}
